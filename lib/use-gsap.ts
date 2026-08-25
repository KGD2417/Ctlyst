"use client";

import { useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from "react";
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

/**
 * Live `prefers-reduced-motion` (INV-2).
 *
 * useSyncExternalStore rather than useState + useEffect: matchMedia *is* an
 * external store, and subscribing to it this way avoids a synchronous setState
 * inside an effect (which React 19 flags as a cascading render) while still
 * giving the server a defined value to hydrate against.
 */
const motionQuery = () =>
  typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

function subscribeMotion(onChange: () => void) {
  const mq = motionQuery();
  if (!mq) return () => {};
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => motionQuery()?.matches ?? false,
    () => false, // server: assume motion is allowed, then correct on hydration
  );
}
