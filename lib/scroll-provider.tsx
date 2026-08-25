"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Module-level handle so the curtain can reset scroll *while it is covered*.
 * Without this the incoming route paints at the outgoing route's scroll offset,
 * which is exactly the "double-scrolled content" the L2 gate forbids.
 */
let active: Lenis | null = null;

export function scrollToTop() {
  if (active) active.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0); // reduced motion: Lenis is never started
}

// INV-1 is re-checked at every one of the nine gates, so it needs to stay
// measurable from outside the bundle. Dev only — never ships to production.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__ST = ScrollTrigger;
  (window as unknown as Record<string, unknown>).__gsap = gsap;
}

/**
 * The single scroll authority (CLAUDE.md hard rule). Lenis drives the scroll,
 * gsap.ticker drives Lenis, ScrollTrigger listens to Lenis. Never ScrollSmoother.
 *
 * `autoRaf: false` matters: left on, Lenis runs its own rAF *as well as* the
 * gsap.ticker one, and the two fight at speed.
 */
export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // INV-2: under reduced motion there is no smooth scroll at all — the browser's
    // native scrolling is the accessible behaviour, so we simply never start Lenis.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let lenis: Lenis | null = null;
    const update = (time: number) => lenis?.raf(time * 1000);

    const start = () => {
      if (lenis || reduced.matches) return;
      lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
      active = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as Record<string, unknown>).__lenis = lenis;
      }
      gsap.ticker.add(update);
      gsap.ticker.lagSmoothing(0);
    };

    const stop = () => {
      if (!lenis) return;
      gsap.ticker.remove(update);
      lenis.destroy();
      lenis = null;
      active = null;
    };

    const sync = () => (reduced.matches ? stop() : start());
    sync();
    reduced.addEventListener("change", sync);

    return () => {
      reduced.removeEventListener("change", sync);
      stop();
      gsap.ticker.lagSmoothing(500, 33); // restore GSAP's default
    };
  }, []);

  // ScrollTrigger measures the old page unless it re-measures after the new one
  // paints. Two rAFs: one to get past React's commit, one past the paint.
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => ScrollTrigger.refresh()),
    );
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return <>{children}</>;
}
