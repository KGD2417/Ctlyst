"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Ink dot that lerps behind the pointer. Grows over interactive elements,
 * inverts over crimson ground.
 *
 * Rides gsap.ticker rather than its own rAF, so it is torn down by the same
 * mechanism as everything else (INV-1). Fully absent on touch and under
 * reduced motion (INV-2) — not hidden, never created.
 */
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let tick: ((t: number) => void) | null = null;
    let onMove: ((e: PointerEvent) => void) | null = null;
    let onOver: ((e: PointerEvent) => void) | null = null;

    const teardown = () => {
      if (tick) gsap.ticker.remove(tick);
      if (onMove) window.removeEventListener("pointermove", onMove);
      if (onOver) window.removeEventListener("pointerover", onOver);
      tick = onMove = onOver = null;
      document.documentElement.classList.remove("has-cursor");
      if (dot.current) dot.current.style.opacity = "0";
    };

    const setup = () => {
      const el = dot.current;
      if (tick || !el || !fine.matches || reduced.matches) return;

      document.documentElement.classList.add("has-cursor");

      const pos = { x: innerWidth / 2, y: innerHeight / 2 };
      const target = { ...pos };
      let scale = 1;
      let targetScale = 1;
      let shown = false;

      onMove = (e) => {
        target.x = e.clientX;
        target.y = e.clientY;
        if (!shown) { shown = true; el.style.opacity = "1"; }
      };

      onOver = (e) => {
        const t = e.target as Element | null;
        if (!t || typeof t.closest !== "function") return;
        targetScale = t.closest("a,button,input,select,textarea,[data-cursor]") ? 2.6 : 1;
        el.dataset.invert = t.closest("[data-invert]") ? "true" : "false";
      };

      tick = () => {
        // lerp — the dot trails the pointer rather than tracking it
        pos.x += (target.x - pos.x) * 0.18;
        pos.y += (target.y - pos.y) * 0.18;
        scale += (targetScale - scale) * 0.18;
        el.style.transform =
          `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${scale})`;
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
      ref={dot}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[150] h-3 w-3 rounded-full opacity-0
                 bg-ink data-[invert=true]:bg-paper mix-blend-normal
                 transition-[background-color] duration-200"
      style={{ willChange: "transform" }}
    />
  );
}
