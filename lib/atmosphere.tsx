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
 *   B2 halftone — dithered masses, drifting
 *   C guilloche — ONE <svg>, 0.15× parallax, continuous drift, pointer lerp
 *   C2 grid + topo — a 48px rule grid under drifting contour lines
 *   C3 flow    — long curves whose dash travels along them
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

/** Fixed placements for the halftone masses (§9.5 — arrangement, never random). */
const BLOBS = [
  { left: "-6vw",  top: "6vh",   size: "44vw", opacity: 0.03,  drift: "b", amp: 14, reverse: false },
  { left: "66vw",  top: "48vh",  size: "38vw", opacity: 0.024, drift: "c", amp: 18, reverse: true },
] as const;

/** Contour field, in its own user-unit box. Built once on the client (~8ms). */
const TOPO_BOX = { w: 2200, h: 1500 };

/**
 * The flowing curve family, from the reference's generator: 18 copies of one
 * cubic, each stepped by index. `pathLength` normalises every path so a single
 * dash tween drives all of them regardless of their real arc length.
 *
 * It is 1000 and not 1 because GSAP rounds stroke-dashoffset to whole numbers:
 * normalised to 1, the entire animation range was [0, -1] and quantised to two
 * states, so the tween ran (progress climbed) while the curves sat perfectly
 * still. At 1000 a whole unit is a thousandth of the cycle.
 */
const FLOW_CYCLE = 1000;
// A wider step and a wider box than the reference's: its 696×316 crop puts most
// of the fan off-canvas, which on a full page reads as a smudge in one corner
// rather than as curves crossing the field.
const FLOW_BOX = { x: -430, y: -260, w: 1180, h: 820 };
const FLOW = Array.from({ length: 18 }, (_, i) => {
  // Signs are computed, not spliced into the template. The reference writes
  // `M-${380 - k}`, which emits "M--10" the moment that term goes negative —
  // and widening the step is exactly what pushes it negative.
  const k = i * 26;
  const v = i * 12;
  const x0 = -(380 - k), y0 = -(189 + v);
  const x1 = -(312 - k), y1 = 216 - v;
  const x2 = 152 - k,    y2 = 343 - v;
  const x3 = 616 - k,    y3 = 470 - v;
  const x4 = 684 - k,    y4 = 875 - v;
  return {
    d: `M${x0} ${y0}C${x0} ${y0} ${x1} ${y1} ${x2} ${y2}C${x3} ${y3} ${x4} ${y4} ${x4} ${y4}`,
    width: 0.5 + i * 0.06,
    dur: 26 + (i % 7) * 3.5, // co-prime-ish spread, so the family never pulses in unison
  };
});

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
  const blobs = useRef<(HTMLDivElement | null)[]>([]);

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
      const { makeFibreTile, makeDitherBlob, isLowEnd } = await import("@/lib/fibre");
      if (cancelled || !layerB.current) return;
      const low = isLowEnd();
      // low-end still gets fibre, just a cheaper tile — never a flat white page
      const tile = makeFibreTile(low ? 64 : 128, low ? 0.4 : 0.55);
      if (cancelled || !layerB.current) return;
      layerB.current.style.backgroundImage = `url(${tile})`;
      layerB.current.style.backgroundRepeat = "repeat";

      // Halftone blobs. Coarser cells and a smaller canvas on low-end hardware:
      // the dither is a look, not a resolution, so it survives being cheap.
      blobs.current.forEach((el, i) => {
        if (!el) return;
        el.style.backgroundImage = `url(${makeDitherBlob(low ? 256 : 512, low ? 8 : 6, i * 1.7)})`;
      });

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

      // ── C3 · the dash travelling along each curve ────────────────────────
      // Every path carries pathLength="1", so one normalised tween drives the
      // whole family. stroke-dashoffset is the same mechanism DrawSVG already
      // uses on this site; INV-3's ban is on layout properties, not on dash.
      if (!reduced.matches) {
        gsap.utils.toArray<SVGPathElement>("[data-flow]").forEach((path) => {
          gsap.fromTo(path,
            { strokeDashoffset: 0 },
            { strokeDashoffset: -FLOW_CYCLE, duration: Number(path.dataset.dur), ease: "none", repeat: -1 },
          );
        });
      }

      // ── scroll parallax + pointer lerp, both on the ticker ───────────────
      if (reduced.matches) return;

      const state = { px: 0, py: 0, tx: 0, ty: 0 };
      const pointerOn = !coarse.matches && !small.matches;

      const onMove = (e: PointerEvent) => {
        // capped at 24px total — the page noticed the cursor, it is not following it
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        state.tx = nx * 24;
        state.ty = ny * 24;
      };
      if (pointerOn) window.addEventListener("pointermove", onMove, { passive: true });

      let lastC = NaN, lastCx = NaN, lastB = NaN;

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

      {/* B2 · dithered halftone blobs. Three fixed placements, drifting on the
          same ticker-free GSAP loop as the guilloche. The third is desktop-only:
          on a phone two masses already fill the frame. */}
      {BLOBS.map((b, i) => (
        <div
          key={i}
          data-drift
          data-drift-secs={DRIFT[b.drift]}
          data-drift-amp={b.amp}
          data-reverse={b.reverse ? "true" : "false"}
          className="absolute"
          style={{
            left: b.left, top: b.top, width: b.size, height: b.size,
            backgroundSize: "contain", backgroundRepeat: "no-repeat",
            // The tile is upscaled to blob size; without this the browser
            // smooths it and the halftone squares turn to grey mush.
            imageRendering: "pixelated",
            opacity: b.opacity, willChange: "transform",
          }}
          ref={(el) => { blobs.current[i] = el; }}
        />
      ))}

      {/* C2a · the 48px rule grid. Static CSS gradients — no element per line,
          nothing to animate, and it is what reads as "instrument" under the
          contours rather than as decoration. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--color-ink) 7%, transparent) 1px, transparent 1px)," +
            "linear-gradient(to bottom, color-mix(in srgb, var(--color-ink) 7%, transparent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, #000 30%, transparent 100%)",
        }}
      />

      {/* C2b · contour lines. Baked once, then only translated — the reference
          shader animates by panning its noise field, which is the same thing. */}
      <svg
        data-drift
        data-drift-secs={DRIFT.a}
        data-drift-amp={4}
        data-reverse="false"
        viewBox={`0 0 ${TOPO_BOX.w} ${TOPO_BOX.h}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-[-14%] h-[128%] w-[128%]"
        style={{ willChange: "transform" }}
      >
        <g fill="none" stroke="var(--color-ink)" strokeWidth="1" vectorEffect="non-scaling-stroke">
          {topo.map((d, i) => (
            // Bands nearer the middle of the field carry more weight, so the set
            // reads as terrain with a ridge line rather than as one flat hatch.
            <path key={i} d={d} opacity={(0.14 - Math.abs(topo.length / 2 - i) * 0.012).toFixed(3)} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </svg>

      {/* C3 · flowing curves */}
      <svg
        viewBox={`${FLOW_BOX.x} ${FLOW_BOX.y} ${FLOW_BOX.w} ${FLOW_BOX.h}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        style={{ willChange: "opacity" }}
      >
        <g fill="none" stroke="var(--color-ink)">
          {FLOW.map((p, i) => (
            <path
              key={i}
              data-flow
              data-dur={p.dur}
              d={p.d}
              pathLength={FLOW_CYCLE}
              strokeDasharray={`${FLOW_CYCLE * 0.22} ${FLOW_CYCLE * 0.78}`}
              strokeWidth={p.width}
              strokeOpacity={0.05 + i * 0.004}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>

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
            "radial-gradient(ellipse at center, transparent 55%, var(--color-ink) 140%)",
          opacity: 0.03,
        }}
      />
    </div>
  );
}
