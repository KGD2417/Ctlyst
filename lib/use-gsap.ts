"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import gsap from "gsap";

/**
 * Scoped GSAP context that reverts on unmount — the whole of INV-1 in one hook.
 * Everything created inside `setup` (tweens, timelines, ScrollTriggers, matchMedia
 * branches) is owned by the context and torn down with it.
 *
 * Hand-rolled rather than @gsap/react's useGSAP: that is a separate package and
 * BRIEF §11 does not list it. This is the part of it we actually use.
 */
export function useGsapContext<T extends HTMLElement>(
  setup: (ctx: gsap.Context, scope: RefObject<T | null>) => void,
  deps: unknown[] = [],
) {
  const scope = useRef<T>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context((self) => setup(self, scope), scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
}

/** Live `prefers-reduced-motion` (INV-2) — re-renders when the OS setting flips. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}
