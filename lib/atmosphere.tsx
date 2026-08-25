"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { SHAPES, NATURAL, arrangementFor, type Placement } from "@/lib/guilloche-paths";

/**
 * Ambient background (§9). Five layers:
 *   A base    — --paper, painted on <body>
 *   B fibre   — grain, dynamically imported (see FibreLayer), 0.05× parallax
 *   C guilloche — ONE <svg>, 0.15× parallax, continuous drift, pointer lerp
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
      // low-end still gets fibre, just a cheaper tile — never a flat white page
      const tile = makeFibreTile(isLowEnd() ? 64 : 128, isLowEnd() ? 0.4 : 0.55);
      if (cancelled || !layerB.current) return;
      layerB.current.style.backgroundImage = `url(${tile})`;
      layerB.current.style.backgroundRepeat = "repeat";
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
          gsap.to(g, {
            xPercent: rev ? -6 : 6,
            yPercent: rev ? 4 : -4,
            rotation: rev ? -8 : 8,
            duration: secs,
            ease: "none",
            repeat: -1,
            yoyo: true,
            transformOrigin: "50% 50%",
          });
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

      const tick = () => {
        const y = window.scrollY;
        if (pointerOn) {
          state.px += (state.tx - state.px) * 0.02;
          state.py += (state.ty - state.py) * 0.02;
        }
        if (layerC.current) {
          layerC.current.style.transform =
            `translate3d(${state.px}px, ${-y * 0.15 + state.py}px, 0)`;
        }
        if (layerB.current) {
          layerB.current.style.transform = `translate3d(0, ${-y * 0.05}px, 0)`;
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
      <div ref={layerB} className="absolute inset-[-10%] opacity-[0.07]" data-fibre />

      {/* D · wash — per-route tint, 2% */}
      {WASH[pathname] && (
        <div
          className="absolute inset-0 opacity-[0.02] transition-opacity duration-700"
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
