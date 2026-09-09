"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { SHAPES, NATURAL, arrangementFor, type Placement } from "@/lib/guilloche-paths";
import { dampFactor, changed } from "@/lib/damp";

/**
 * Ambient background (§9). Five layers:
 *   A base    — --paper, painted on <body>
 *   B fibre   — grain, dynamically imported (see FibreLayer), 0.05× parallax
 *   C guilloche — ONE <svg>, 0.15× parallax, continuous drift, pointer lerp
 *   C2 grid + topo — a 48px rule grid under a contour field panning forever
 *   D wash    — per-route tint
 *   F vignette — radial edge hold
 *
 * Layer C is a single promoted <svg>, not five elements, so the whole ambient
 * stack is one composited layer (§9.5).
 *
 * Weight is 1.25px / opacity 0.5 rather than §9.2's 0.5px / 0.04–0.07, which
 * renders as literally nothing against --rule. See PLAN §4.1 and
 * evidence/L0-3-calibrate-1440.png.
 */

const DRIFT = { a: 47, b: 61, c: 73, d: 89 } as const; // seconds — all prime

/** The pointer bloom's window, and the static mask that shapes it. */
const BLOOM = 520;
const BLOOM_DISC =
  "radial-gradient(circle at 50% 50%, #000 0%, rgb(0 0 0 / 0.5) 42%, transparent 70%)";

/** Keeps the middle of the frame quiet so the headline has somewhere to sit. */
const CALM_CENTRE =
  "radial-gradient(ellipse 58% 54% at 50% 46%, rgb(0 0 0 / 0.16) 0%, rgb(0 0 0 / 0.55) 52%, #000 100%)";

/** Halo, mid, core — the strokes that make a contour glow without a filter. The
 *  dashed core breaks the line into points, so a lit contour reads as a filament
 *  of particles rather than as a drawn line.
 *
 *  There was a fourth pass, a sparse round-cap dash for dust. It cost a whole
 *  extra copy of the field on every frame of the pan for a sparkle you had to
 *  look for, so the beading is carried by the core alone and the gap is opened
 *  up to compensate. */
const GLOW = [
  { w: 8, o: 0.15 },
  { w: 3, o: 0.26 },
  { w: 1.6, o: 0.95, dash: "2 9" },
] as const;

/**
 * The falloff every bloom on this page shares.
 *
 * `colour, transparent 70%` — two stops — spends its entire alpha over one
 * short ramp, and the result is a pasted-on oval with a rim you can trace with
 * a finger. Atmosphere wants the opposite distribution: most of the intensity
 * inside the first fifth of the radius, then the last few percent given up
 * slowly across the outer half, where there is no gradient step large enough
 * for the eye to catch. Seven stops is what it takes; five still shows a rim
 * on an 8-bit display.
 */
const TAPER = [
  [0, 1], [0.18, 0.74], [0.36, 0.46], [0.55, 0.24], [0.74, 0.09], [0.88, 0.03], [1, 0],
] as const;

/**
 * A colour pole. `extent` is the ellipse's own `<size> at <position>`.
 *
 * Anchor poles PAST the viewport edge. A pole centred on screen shows its far
 * arc, and a visible arc is what makes a wash read as a spot no matter how
 * soft the falloff is — the eye finds the curve before it finds the edge.
 */
const pole = (extent: string, colour: string, peak: number) =>
  `radial-gradient(ellipse ${extent}, ` +
  TAPER.map(([at, a]) =>
    `color-mix(in oklch, ${colour} ${(peak * a).toFixed(2)}%, transparent) ${(at * 100).toFixed(0)}%`,
  ).join(", ") + ")";

/** The same falloff as a mask: where the contour field is allowed to light up. */
const zone = (extent: string, peak: number) =>
  `radial-gradient(ellipse ${extent}, ` +
  TAPER.map(([at, a]) => `rgb(0 0 0 / ${(peak * a).toFixed(3)}) ${(at * 100).toFixed(0)}%`).join(", ") + ")";

const EMBER = "color-mix(in oklch, var(--color-crimson), var(--color-gold) 34%)";

/**
 * Where the field lights up. Everywhere else it stays dark — the page is
 * near-black and the colour is three localised blooms, not a wash.
 *
 * Split warm from cool because the lit colour is now flat per layer. It used to
 * be one gradient across the field, which could not survive the pan: an SVG
 * gradient resolves in the user space of the element it paints, that space is
 * inside the panning group, so the ramp TRAVELLED WITH THE CONTOURS. The right
 * edge was rendering ember filaments under a violet glow. Two masked layers pin
 * the colour to the screen, where the design puts it.
 */
const EMBER_ZONES = [
  zone("32% 56% at -5% 8%", 0.95),
  zone("21% 30% at -3% 86%", 0.7),
].join(",");
const VIOLET_ZONE = zone("23% 64% at 104% 55%", 0.92);

/** B3 · the mesh. Same three places as the hot zones, so the glow and the lit
 *  contours are one event rather than two things that happen to overlap. */
const MESH = [
  pole("40% 52% at -6% -10%", EMBER, 95),
  pole("24% 28% at -4% 88%", "var(--color-crimson)", 55),
  pole("25% 72% at 105% 54%", "var(--color-indigo)", 92),
].join(",");

/** Contour field, in its own user-unit box. Built once on the client (~8ms). */
const TOPO_BOX = { w: 2200, h: 1500 };

const WASH: Record<string, string> = {
  "/why": "var(--color-crimson)",
  "/schemes": "var(--color-gold)",
};

/**
 * One masked, panning copy of the contour field.
 *
 * The pan is a CSS transform on a promoted HTML div — NOT a transform on an SVG
 * <g>. That distinction is the whole point of this shape. A transform on an SVG
 * group is a paint-time transform: Chromium re-rasterises every stroke segment
 * under it on every frame, which at 60Hz was tens of thousands of dashed
 * segments a second and is what made the page feel heavy. A transform on a div
 * with `will-change: transform` is a compositor move: the field is rasterised
 * once and thereafter the GPU slides the texture, for zero per-frame paint.
 *
 * The panning box is two field widths wide and the viewBox is doubled to match,
 * so both copies live inside the svg and nothing has to overflow it. The slice
 * scale is unchanged by that doubling — 2× the box into 2× the viewBox is the
 * same ratio — so the contours are exactly the size they were.
 *
 * The mask stays on the OUTER, viewport-sized div. Masking the panning box
 * instead would drag the hot zones along with the contours.
 */
function Field({ mask, stroke, passes = GLOW, promote = true }: {
  mask: string;
  stroke: string;
  passes?: readonly { w: number; o: number; dash?: string }[];
  /** Give this copy its own compositor layer. Worth it for the full-screen
   *  copies, where the pan would otherwise repaint the whole field every frame.
   *  Not worth it under the pointer bloom: only a 520px disc of that copy is
   *  ever visible, so repainting it is cheap, where promoting it would cost a
   *  full 2880x900 texture for a disc a fifth that size. */
  promote?: boolean;
}) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ WebkitMaskImage: mask, maskImage: mask }}
    >
      <div data-topo-pan className="absolute inset-y-0 left-0 w-[200%]"
           style={promote ? { willChange: "transform" } : undefined}>
        <svg
          viewBox={`0 0 ${TOPO_BOX.w * 2} ${TOPO_BOX.h}`}
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          {passes.map((pass) => (
            <g key={pass.w} fill="none" stroke={stroke} strokeWidth={pass.w} opacity={pass.o}
               strokeDasharray={pass.dash} strokeLinecap={pass.dash ? "round" : undefined}>
              <use href="#topo-lines" />
              <use href="#topo-lines" x={TOPO_BOX.w} />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function ShapeArt({ p }: { p: Placement }) {
  if (p.shape === "mark" || p.shape === "fleuron") {
    return (
      <text
        x="0"
        y={p.shape === "mark" ? 400 : 380}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={p.shape === "mark" ? 1200 : 1150}
        fontWeight="500"
        fontStyle={p.shape === "mark" ? "italic" : "normal"}
        vectorEffect="non-scaling-stroke"
      >
        {p.shape === "mark" ? "Y" : "❮"}
      </text>
    );
  }
  return (
    <>
      {SHAPES[p.shape].paths.map((d, i) => (
        <path key={i} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </>
  );
}

export function Atmosphere() {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const layerC = useRef<SVGSVGElement>(null);
  const layerB = useRef<HTMLDivElement>(null);
  const bloomWin = useRef<HTMLDivElement>(null);
  const bloomInner = useRef<HTMLDivElement>(null);

  const [topo, setTopo] = useState<string[]>([]);

  const all = arrangementFor(pathname);
  const [placements, setPlacements] = useState(all);
  const [vp, setVp] = useState({ w: 1440, h: 900 });

  useEffect(() => {
    const sync = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  // §9.5 — mobile carries 2 shapes maximum, drift only
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setPlacements(mq.matches ? all.slice(0, 2) : all);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ── layer B · dynamically imported, skipped on low-end (§9.5, INV-6) ──────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const el = layerB.current;
      if (!el) return;
      const { makeFibreTile, isLowEnd } = await import("@/lib/fibre");
      if (cancelled || !layerB.current) return;
      const low = isLowEnd();
      // low-end still gets fibre, just a cheaper tile — never a flat white page
      const tile = makeFibreTile(low ? 64 : 128, low ? 0.4 : 0.55);
      if (cancelled || !layerB.current) return;
      layerB.current.style.backgroundImage = `url(${tile})`;
      layerB.current.style.backgroundRepeat = "repeat";

      // Contour field. Marching squares over ~12k samples costs one frame, and
      // measured as a 56ms long task when it ran during mount — so it waits for
      // idle, and a weak device gets a coarser field rather than a slower one.
      // Client-only besides: 86KB of path data has no business in the HTML, and
      // the field is deterministic, so every load would emit the same bytes.
      const { makeTopoPaths } = await import("@/lib/topo");
      if (cancelled) return;
      const build = () => {
        if (cancelled) return;
        setTopo(makeTopoPaths({
          width: TOPO_BOX.w, height: TOPO_BOX.h,
          ...(low ? { cols: 84, rows: 58, levels: 9 } : null),
        }));
      };
      if ("requestIdleCallback" in window) requestIdleCallback(build, { timeout: 2000 });
      else setTimeout(build, 400);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const small = window.matchMedia("(max-width: 767px)");

    const ctx = gsap.context(() => {
      const shapes = gsap.utils.toArray<SVGGElement>("[data-drift]");

      // ── continuous drift (§9.3) — translate + rotate only, never scale ────
      if (!reduced.matches) {
        shapes.forEach((g) => {
          const secs = Number(g.dataset.driftSecs);
          const rev = g.dataset.reverse === "true";
          // The guilloche wants a whisper (6%); the dither blobs are the moving
          // element you are meant to notice, so they opt into a longer travel.
          const amp = Number(g.dataset.driftAmp) || 6;
          gsap.to(g, {
            xPercent: rev ? -amp : amp,
            yPercent: rev ? amp * 0.66 : -amp * 0.66,
            rotation: rev ? -8 : 8,
            duration: secs,
            ease: "none",
            repeat: -1,
            yoyo: true,
            transformOrigin: "50% 50%",
          });
        });
      }

      // ── C2 · the contour field, panning forever ──────────────────────────
      // The field is periodic in x and drawn twice side by side, so translating
      // it by exactly one field width and repeating lands copy B where copy A
      // began. That is a genuinely continuous pan rather than a drift that
      // creeps out and reverses — which is what "always animated" has to mean
      // for a background you sit in front of.
      if (!reduced.matches) {
        // 2200 user units over 110s ≈ 16px/s on a 1440 viewport: slow enough to
        // stay background, fast enough that the page is visibly alive if you
        // look at it for a moment.
        // The box is two field widths wide, so -50% of it is exactly one field
        // width on screen: copy B lands where copy A began. xPercent resolves to
        // a CSS translate on a div, which is the composited path — `x` in user
        // units on an SVG group was the paint-time one.
        gsap.to("[data-topo-pan]", { xPercent: -50, duration: 110, ease: "none", repeat: -1 });
      }

      // ── scroll parallax + pointer lerp, both on the ticker ───────────────
      if (reduced.matches) return;

      // px/py: the damped parallax offset. rx/ry: the raw pointer, published to
      // the root as custom properties so the bloom mask can follow it in CSS.
      const state = { px: 0, py: 0, tx: 0, ty: 0, rx: -300, ry: -300, gx: -300, gy: -300 };
      const pointerOn = !coarse.matches && !small.matches;

      const onMove = (e: PointerEvent) => {
        // capped at 24px total — the page noticed the cursor, it is not following it
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        state.tx = nx * 24;
        state.ty = ny * 24;
        state.rx = e.clientX;
        state.ry = e.clientY;
      };
      if (pointerOn) window.addEventListener("pointermove", onMove, { passive: true });

      let lastC = NaN, lastCx = NaN, lastB = NaN, lastGx = NaN, lastGy = NaN;

      const tick = (_t: number, dt: number) => {
        const y = window.scrollY;
        if (pointerOn) {
          // frame-rate independent, so the pointer response settles in the same
          // wall-clock time at 60Hz and at 120Hz
          const a = dampFactor(0.02, dt);
          state.px += (state.tx - state.px) * a;
          state.py += (state.ty - state.py) * a;
        }

        const cy = -y * 0.15 + state.py;
        const by = -y * 0.05;

        // Only touch the DOM when a value actually moved. Previously both layers
        // were rewritten every frame forever, even on a completely idle page.
        if (layerC.current && (changed(cy, lastC) || changed(state.px, lastCx))) {
          lastC = cy; lastCx = state.px;
          layerC.current.style.transform =
            `translate3d(${state.px.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
        }
        if (layerB.current && changed(by, lastB)) {
          lastB = by;
          layerB.current.style.transform = `translate3d(0, ${by.toFixed(2)}px, 0)`;
        }

        if (pointerOn) {
          // The bloom trails the cursor rather than pinning to it — a light that
          // has weight. Same damping treatment as everything else, and the same
          // write-only-when-changed guard.
          const g = dampFactor(0.12, dt);
          state.gx += (state.rx - state.gx) * g;
          state.gy += (state.ry - state.gy) * g;
          if (changed(state.gx, lastGx) || changed(state.gy, lastGy)) {
            lastGx = state.gx; lastGy = state.gy;
            const x = state.gx.toFixed(1), y = state.gy.toFixed(1);
            if (bloomWin.current) bloomWin.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            // counter-translate so the field inside the window stays world-fixed
            if (bloomInner.current)
              bloomInner.current.style.transform =
                `translate3d(${(BLOOM / 2 - state.gx).toFixed(1)}px, ${(BLOOM / 2 - state.gy).toFixed(1)}px, 0)`;
          }
        }
      };
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        if (pointerOn) window.removeEventListener("pointermove", onMove);
      };
    }, root);

    return () => ctx.revert();
  }, [pathname]);

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* B · fibre */}
      <div
        ref={layerB}
        className="absolute inset-[-10%] opacity-[0.07]"
        style={{ willChange: "transform" }}
        data-fibre
      />

      {/* B3 · the mesh. Three localised poles — an ember in the top-left
          corner, a small one low-left, an indigo counterpoint on the right edge
          — over an otherwise black ground. The fibre layer above grains it,
          which is what keeps a fill this large from banding on an 8-bit display.

          Deliberately STATIC and viewport-sized. It used to be a 150% box with
          `will-change: transform` riding the drift loop, and Chromium
          tile-clipped that layer: the indigo pole ended in a hard horizontal
          edge at y≈535. The motion in this frame comes from the panning
          contours and the pointer bloom; the glow itself does not need to move,
          and not moving costs one fewer composited layer. */}
      <div
        className="absolute inset-0"
        style={{
          background: MESH,
        }}
      />

      {/* C2a · the 48px rule grid. Static CSS gradients — no element per line,
          nothing to animate, and it is what reads as "instrument" under the
          contours rather than as decoration. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--color-ink) 5%, transparent) 1px, transparent 1px)," +
            "linear-gradient(to bottom, color-mix(in srgb, var(--color-ink) 5%, transparent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, #000 30%, transparent 100%)",
        }}
      />

      {/* C2b · contour lines. Baked once, then only translated — the reference
          shader animates by panning its noise field, which is the same thing.

          Geometry only, with no stroke, so every layer below colours it itself.
          Rendering it per layer put 2k segments of DOM and a 50ms task back on
          the load path each time, so it is defined once and <use>d.

          The holder is zero-sized rather than `display: none`: a `<defs>` inside
          a hidden subtree has no render object, and `<use>` cannot reference
          what was never laid out. */}
      <svg aria-hidden="true" className="absolute" style={{ width: 0, height: 0, overflow: "hidden" }}>
        <defs>
          <g id="topo-lines" fill="none" vectorEffect="non-scaling-stroke">
            {topo.map((d, i) => (
              // Bands nearer the middle of the field carry more weight, so
              // the set reads as terrain with a ridge rather than a hatch.
              <path key={i} d={d} opacity={(1 - Math.abs(topo.length / 2 - i) * 0.08).toFixed(3)}
                    vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        </defs>
      </svg>

      {/* The dark copy: one flat hairline, present everywhere, which is the
          terrain. The layers below are the same geometry lit inside three small
          zones, which is the energy. A field uniformly bright everywhere has no
          focus — the reference keeps the map dark and puts the light in corners.

          CALM_CENTRE keeps it out of the headline: the field is loudest at the
          edges and quietest where the type sits, so the page has a centre. Flat
          rather than a ramp, because at this darkness a gradient is invisible
          and would only travel with the pan for nothing. */}
      <Field mask={CALM_CENTRE} stroke="var(--color-rule)" passes={[{ w: 1.1, o: 0.6 }]} />

      {/* C2b-hot · the same contours, lit. Masked in CSS rather than with an SVG
          mask so the mask is a compositor input, not something the field has to
          be re-rasterised through on every pan.

          Three strokes per contour: a wide faint halo, a mid, and a dashed
          hairline core. That is a bloom without a filter — `filter: blur()`
          over a fullscreen layer re-rasterises on every pan, where more strokes
          are just more geometry in the same raster.

          One layer per colour, because the colour has to stay where the design
          put it while the geometry underneath it keeps moving. */}
      <Field mask={EMBER_ZONES} stroke={EMBER} />
      {/* Indigo is a darker hue than the ember mix, so at a shared opacity it
          reads as the weaker of the two. Lifted toward white to match it. */}
      <Field mask={VIOLET_ZONE} stroke="color-mix(in oklch, var(--color-indigo), white 26%)" />

      {/* C2c · the same field again, brighter, seen through a disc that follows
          the pointer: the contours near the cursor light up as if the map were
          lit from where you are looking.

          The obvious build — one masked layer whose `mask-image` radial moves
          with the pointer — measured a median frame of 63.7ms with 260 dropped
          frames, because moving a mask re-rasterises everything it masks, and
          this masks 10k stroke segments. So the mask is STATIC and the disc
          moves instead: an outer window translates to the pointer, and the
          field inside counter-translates by the same amount so it stays put in
          the world. Two transforms, no re-raster. */}
      <div
        ref={bloomWin}
        aria-hidden="true"
        className="absolute left-0 top-0"
        style={{
          width: BLOOM, height: BLOOM, marginLeft: -BLOOM / 2, marginTop: -BLOOM / 2,
          opacity: 0.85, willChange: "transform",
          transform: "translate3d(-9999px,0,0)",   // parked until the pointer arrives
          WebkitMaskImage: BLOOM_DISC, maskImage: BLOOM_DISC,
        }}
      >
        <div ref={bloomInner} className="absolute left-0 top-0 h-screen w-screen" style={{ willChange: "transform" }}>
          {/* The core pass only. Splitting the hot layer by colour doubled its
              geometry, and this is where it is paid back: under a 520px disc a
              halo is not what you notice, the beading is. */}
          <Field mask="linear-gradient(#000, #000)" stroke={EMBER} passes={GLOW.slice(2)} promote={false} />
        </div>
      </div>

      {/* D · wash — per-route tint, 2% */}
      {WASH[pathname] && (
        <div
          className="absolute inset-0 opacity-[0.02] transition-opacity duration-700"
          // static: no will-change, so it does not claim its own layer
          style={{ background: WASH[pathname] }}
        />
      )}

      {/* C · guilloche — ONE svg, one composited layer.
          No viewBox, so user units are CSS pixels and every shape is placed by an
          explicit translate/rotate/scale. Nested percentage <svg> sizing put shapes
          off-screen entirely — see PROGRESS Scars. */}
      <svg
        ref={layerC}
        className="absolute inset-0 h-full w-full"
        style={{
          willChange: "transform",
          fill: "none",
          stroke: "var(--color-rule)",
          strokeWidth: "var(--guilloche-stroke)",
          opacity: "var(--guilloche-opacity)",
        }}
      >
        {placements.map((p, i) => {
          const scale = (p.span * vp.w) / NATURAL[p.shape];
          return (
            <g
              key={`${pathname}-${i}`}
              data-drift
              data-drift-secs={DRIFT[p.drift]}
              data-reverse={p.reverse ? "true" : "false"}
            >
              <g
                transform={`translate(${(p.cx * vp.w).toFixed(1)} ${(p.cy * vp.h).toFixed(1)}) rotate(${p.rotate}) scale(${scale.toFixed(4)})`}
                style={{ vectorEffect: "non-scaling-stroke" }}
              >
                <ShapeArt p={p} />
              </g>
            </g>
          );
        })}
      </svg>

      {/* F · vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 62%, #000 128%)",
          opacity: 0.42,
        }}
      />
    </div>
  );
}
