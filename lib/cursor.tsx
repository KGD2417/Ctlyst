"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { dampFactor, changed } from "@/lib/damp";

/**
 * Pointer mark: a small ink dot that trails the hand, with a hairline ring that
 * opens around it over anything interactive.
 *
 * Why two elements rather than one dot that scales up:
 * a promoted layer is rasterised once at its LAYOUT size, and the GPU then
 * stretches that bitmap. The old cursor was a 12px dot scaled to 2.6×, i.e. a
 * 12px bitmap blown up 2.6× — which is exactly the soft, pixel-crawling edge
 * that showed up on some machines (worst on fractional-DPR displays, where the
 * raster is already resampled once). Here the ring is laid out at its largest
 * size and only ever scaled DOWN, and the dot is never scaled at all, so
 * nothing is ever enlarged past its raster.
 *
 * Rides gsap.ticker rather than its own rAF, so it is torn down by the same
 * mechanism as everything else (INV-1). Fully absent on touch and under
 * reduced motion (INV-2) — not hidden, never created.
 */

const RING = 44; // px — the ring's layout size, and its maximum on screen

export function CustomCursor() {
  const wrap = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let tick: gsap.TickerCallback | null = null;
    let onMove: ((e: PointerEvent) => void) | null = null;
    let onOver: ((e: PointerEvent) => void) | null = null;

    const teardown = () => {
      if (tick) gsap.ticker.remove(tick);
      if (onMove) window.removeEventListener("pointermove", onMove);
      if (onOver) window.removeEventListener("pointerover", onOver);
      tick = onMove = onOver = null;
      document.documentElement.classList.remove("has-cursor");
      if (wrap.current) wrap.current.style.opacity = "0";
    };

    const setup = () => {
      const el = wrap.current;
      const rg = ring.current;
      if (tick || !el || !rg || !fine.matches || reduced.matches) return;

      document.documentElement.classList.add("has-cursor");

      const pos = { x: innerWidth / 2, y: innerHeight / 2 };
      const target = { ...pos };
      let open = 0;        // 0 = closed on the dot, 1 = ring fully open
      let targetOpen = 0;
      let shown = false;

      onMove = (e) => {
        target.x = e.clientX;
        target.y = e.clientY;
        if (!shown) { shown = true; el.style.opacity = "1"; }
      };

      onOver = (e) => {
        const t = e.target as Element | null;
        if (!t || typeof t.closest !== "function") return;
        targetOpen = t.closest("a,button,input,select,textarea,[data-cursor]") ? 1 : 0;
        el.dataset.invert = t.closest("[data-invert]") ? "true" : "false";
      };

      let lastX = NaN, lastY = NaN, lastO = NaN;

      tick = (_t: number, dt: number) => {
        // Frame-rate independent: a fixed per-frame factor made the dot settle
        // at twice the speed on a 120Hz display, and wobble whenever the frame
        // rate moved. 0.28 ≈ 75ms to settle — enough inertia to read as ink
        // trailing the hand, not enough to feel like the dot is behind you.
        const a = dampFactor(0.28, dt);
        pos.x += (target.x - pos.x) * a;
        pos.y += (target.y - pos.y) * a;
        open += (targetOpen - open) * a;

        // Skip the write when nothing moved — otherwise this invalidates style
        // and recomposites every single frame for the life of the page.
        // `changed` treats a non-finite previous value as different, so the very
        // first frame always writes.
        const moved = changed(pos.x, lastX) || changed(pos.y, lastY);
        const opened = changed(open, lastO, 0.001);
        if (!moved && !opened) return;

        if (moved) {
          lastX = pos.x; lastY = pos.y;
          el.style.transform =
            `translate3d(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
        }
        if (opened) {
          lastO = open;
          // 0.34 → 1.0: never above 1, so the ring is only ever downscaled.
          rg.style.transform = `scale(${(0.34 + open * 0.66).toFixed(3)})`;
          rg.style.opacity = open.toFixed(3);
        }
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerover", onOver, { passive: true });
      gsap.ticker.add(tick);
    };

    const sync = () => (fine.matches && !reduced.matches ? setup() : teardown());
    sync();
    fine.addEventListener("change", sync);
    reduced.addEventListener("change", sync);

    return () => {
      fine.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
      teardown();
    };
  }, []);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[150] grid place-items-center opacity-0
                 data-[invert=true]:text-paper text-ink"
      style={{ width: RING, height: RING, willChange: "transform" }}
    >
      <div
        ref={ring}
        className="col-start-1 row-start-1 rounded-full border border-current opacity-0"
        style={{ width: RING, height: RING, transform: "scale(0.34)", willChange: "transform, opacity" }}
      />
      <div
        className="col-start-1 row-start-1 rounded-full bg-current"
        style={{ width: 7, height: 7 }}
      />
    </div>
  );
}
