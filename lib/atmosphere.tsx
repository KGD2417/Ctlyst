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

/** Halo, mid, core — the three strokes that make a contour glow without a filter. */
const GLOW = [
  { w: 6, o: 0.05 },
  { w: 2.5, o: 0.09 },
  { w: 1, o: 0.30 },
] as const;

/** Contour field, in its own user-unit box. Built once on the client (~8ms). */
const TOPO_BOX = { w: 2200, h: 1500 };

const WASH: Record<string, string> = {
  "/why": "var(--color-crimson)",
  "/schemes": "var(--color-gold)",
};

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
        gsap.to("[data-topo-pan]", { x: -TOPO_BOX.w, duration: 110, ease: "none", repeat: -1 });
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

      {/* B3 · the mesh. Three soft poles — crimson ember, indigo counterpoint,
          a small gold hot spot — over the ground. It rides the same drift loop
          as everything else, so the glow moves without a second ticker, and the
          fibre layer above grains it, which is what keeps a fill this large from
          banding on an 8-bit display. */}
      <div
        data-drift
        data-drift-secs={DRIFT.c}
        data-drift-amp={9}
        data-reverse="true"
        className="absolute inset-[-25%] h-[150%] w-[150%]"
        style={{
          willChange: "transform",
          background:
            "radial-gradient(ellipse 55% 45% at 18% 22%, color-mix(in oklch, var(--color-crimson) 42%, transparent), transparent 68%)," +
            "radial-gradient(ellipse 50% 50% at 82% 68%, color-mix(in oklch, var(--color-indigo) 38%, transparent), transparent 66%)," +
            "radial-gradient(ellipse 34% 30% at 62% 12%, color-mix(in oklch, var(--color-gold) 22%, transparent), transparent 70%)",
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

          Three strokes per contour instead of one: a wide faint halo, a mid, and
          a hairline core. That is a bloom without a filter — `filter: blur()` or
          an SVG feGaussianBlur over a full-screen layer re-rasterises on every
          pan, where three strokes are just more geometry in the same raster.

          Colour comes from one gradient in the field's own user space, so a
          contour runs ember on one side of the map and indigo on the other
          rather than being uniformly grey. */}
      <svg
        viewBox={`0 0 ${TOPO_BOX.w} ${TOPO_BOX.h}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        style={{
          // The field is loudest at the edges and quietest where the type sits.
          // Without this the contours run straight through the headline and the
          // page has no centre — the reference keeps a calm pocket for the words
          // and pushes the energy to the margins.
          WebkitMaskImage: CALM_CENTRE,
          maskImage: CALM_CENTRE,
        }}
      >
        <defs>
          <linearGradient id="topo-ink" gradientUnits="userSpaceOnUse"
                          x1="0" y1="0" x2={TOPO_BOX.w} y2={TOPO_BOX.h * 0.55}>
            <stop offset="0" stopColor="var(--color-crimson)" />
            <stop offset="0.45" stopColor="var(--color-gold)" />
            <stop offset="1" stopColor="var(--color-indigo)" />
          </linearGradient>
        </defs>
        <g data-topo-pan style={{ willChange: "transform" }}>
          {/* The field is drawn once and <use>d for the second copy, one field
              width along. Rendering both copies as real paths doubled 3.5k
              segments of DOM and put a 50ms task back on the load path. */}
          <g id="topo-field" fill="none" stroke="url(#topo-ink)" vectorEffect="non-scaling-stroke">
            {GLOW.map((pass) => (
              <g key={pass.w} strokeWidth={pass.w} opacity={pass.o}>
                {topo.map((d, i) => (
                  // Bands nearer the middle of the field carry more weight, so
                  // the set reads as terrain with a ridge rather than a hatch.
                  <path key={i} d={d} opacity={(1 - Math.abs(topo.length / 2 - i) * 0.08).toFixed(3)}
                        vectorEffect="non-scaling-stroke" />
                ))}
              </g>
            ))}
          </g>
          {/* Off the viewBox, and clipped by the SVG, until the pan brings it in. */}
          <use href="#topo-field" x={TOPO_BOX.w} />
        </g>
      </svg>

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
          <svg
            viewBox={`0 0 ${TOPO_BOX.w} ${TOPO_BOX.h}`}
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full"
          >
            <g data-topo-pan style={{ willChange: "transform" }}>
              <use href="#topo-field" />
              <use href="#topo-field" x={TOPO_BOX.w} />
            </g>
          </svg>
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
            "radial-gradient(ellipse at center, transparent 45%, #000 130%)",
          opacity: 0.55,
        }}
      />
    </div>
  );
}
