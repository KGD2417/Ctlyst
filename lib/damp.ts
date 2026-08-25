/**
 * Frame-rate independent damping.
 *
 * `value += (target - value) * factor` is the usual one-liner, and it is wrong:
 * the amount of easing per second depends on how often the frame runs. On a
 * 60Hz display it settles at one speed, on a 120Hz ProMotion Mac at twice that,
 * and whenever the frame rate *fluctuates* the motion speed fluctuates with it —
 * which is exactly what reads as "glitchy" even though no frame was dropped.
 *
 * This converts a per-frame factor into a per-second one, so the motion takes
 * the same wall-clock time to settle at any refresh rate.
 *
 * @param factor  the old per-frame lerp factor, calibrated at 60fps
 * @param dtMs    milliseconds since the previous frame
 */
export function dampFactor(factor: number, dtMs: number): number {
  // clamp dt so a background tab or a long task cannot produce a huge jump
  const dt = Math.min(dtMs, 50) / 1000;
  return 1 - Math.pow(1 - factor, dt * 60);
}

/**
 * True when the two values differ enough to be worth a style write.
 *
 * Treats a non-finite previous value as "always different". Seeding the previous
 * value with NaN and relying on `Math.abs(a - NaN) > epsilon` silently evaluates
 * to false forever, which disabled the cursor and the parallax entirely — they
 * never wrote a single transform.
 */
export const changed = (a: number, b: number, epsilon = 0.01) =>
  !Number.isFinite(b) || Math.abs(a - b) > epsilon;
