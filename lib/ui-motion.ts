"use client";

import { animate, type DOMKeyframesDefinition } from "motion";

/**
 * Discrete UI motion — hover lifts, one-shot reveals, the route curtain.
 *
 * Division of labour with GSAP:
 *   motion (here)  — one-shot transform/opacity transitions, driven through the
 *                    Web Animations API so the browser can run them on the
 *                    compositor rather than the main thread. A JS ticker cannot:
 *                    every frame must land in main-thread time, so one long task
 *                    shows up as a visible hitch.
 *   GSAP           — anything scroll-scrubbed, plus SplitText, DrawSVG and Flip,
 *                    which have no WAAPI equivalent because they are driven by
 *                    scroll position or need layout measurement.
 *
 * INV-7: every call passes `type: "tween"`. Motion defaults to a spring, and
 * springs overshoot, which is banned project-wide.
 */

type DomTarget = Element | Element[] | NodeListOf<Element> | string;

/**
 * `animate` carries both a DOM overload and an object-tweening overload, and
 * TypeScript keeps resolving our calls to the object one and then rejecting
 * `transform` as an unknown property. One cast here beats a cast at every call.
 */
const dom = animate as unknown as (
  target: DomTarget,
  keyframes: DOMKeyframesDefinition,
  options?: Record<string, unknown>,
) => ReturnType<typeof animate>;

export const BRAND_EASE = [0.22, 1, 0.36, 1] as const;

type Opts = { duration?: number; delay?: number; ease?: readonly number[] };

const base = (o: Opts = {}) => ({
  type: "tween",
  duration: o.duration ?? 0.32,
  delay: o.delay ?? 0,
  ease: (o.ease ?? BRAND_EASE) as number[],
});

/** Lift on hover/focus. Transform only, so it stays on the compositor. */
export const lift = (el: DomTarget, up: boolean, o?: Opts) =>
  dom(el, { transform: up ? "translateY(-6px)" : "translateY(0px)" }, base(o));

/** Fade + rise, for reveals that are not tied to scroll position. */
export const riseIn = (el: DomTarget, o?: Opts) =>
  dom(
    el,
    { opacity: [0, 1], transform: ["translateY(18px)", "translateY(0px)"] },
    base({ duration: 0.5, ...o }),
  );

/** Straight opacity fade. */
export const fade = (el: DomTarget, to: number, o?: Opts) =>
  dom(el, { opacity: to }, base(o));

/** The route curtain: one continuous upward wipe. */
export const wipe = (el: DomTarget, phase: "cover" | "reveal", duration: number) =>
  dom(
    el,
    phase === "cover"
      ? { transform: ["translateY(100%)", "translateY(0%)"] }
      : { transform: ["translateY(0%)", "translateY(-100%)"] },
    base({ duration }),
  );
