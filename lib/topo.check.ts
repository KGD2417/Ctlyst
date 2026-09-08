/**
 * Self-check for the contour field: `npx tsx lib/topo.check.ts`.
 *
 * Marching squares is the one piece of real logic in the ambient stack, and its
 * failures are quiet — a level with no crossings draws nothing, an unnormalised
 * field silently loses its outer bands, a sign error puts segments outside the
 * box. None of that throws; it just renders slightly emptier. Hence assertions.
 */
import { makeTopoPaths } from "./topo";

const W = 2200, H = 1500;
const t0 = performance.now();
const paths = makeTopoPaths({ width: W, height: H });
const ms = performance.now() - t0;

const fail: string[] = [];
const check = (ok: boolean, msg: string) => { if (!ok) fail.push(msg); };

const segments = paths.reduce((a, d) => a + (d.match(/M/g)?.length ?? 0), 0);
const nums = (paths.join("").match(/-?\d+\.\d+/g) ?? []).map(Number);
const xs = nums.filter((_, i) => i % 2 === 0);
const ys = nums.filter((_, i) => i % 2 === 1);

check(paths.length >= 8, `too few populated levels: ${paths.length} (the field is probably unnormalised)`);
check(paths.every((d) => d.length > 200), "a level came back nearly empty");
check(segments > 500 && segments < 20000, `segment count out of range: ${segments}`);
check(Math.min(...xs) >= 0 && Math.max(...xs) <= W, "a segment fell outside the box in x");
check(Math.min(...ys) >= 0 && Math.max(...ys) <= H, "a segment fell outside the box in y");
check(makeTopoPaths({ width: W, height: H })[0] === paths[0], "field is not deterministic between calls");
check(ms < 40, `field build too slow to hide in one idle callback: ${ms.toFixed(1)}ms`);

// The seam. The field is panned by exactly one width on repeat, so a contour
// arriving at the right edge must leave the left edge at the same height — this
// is the one property that turns into a visible vertical tear if it regresses.
const edgeYs = (d: string, edge: number) =>
  [...d.matchAll(/[ML](-?\d+\.\d+) (-?\d+\.\d+)/g)]
    .filter((m) => Math.abs(Number(m[1]) - edge) < 0.05)
    .map((m) => +Number(m[2]).toFixed(1))
    .sort((a, b) => a - b);

paths.forEach((d, i) => {
  const left = edgeYs(d, 0);
  const right = edgeYs(d, W);
  check(left.length === right.length, `level ${i}: ${left.length} contours enter the left edge but ${right.length} leave the right`);
  check(left.every((y, k) => Math.abs(y - right[k]) < 1), `level ${i}: seam heights differ — the field no longer tiles`);
});
check(paths.some((d) => edgeYs(d, 0).length > 0), "no contour touches the edges at all — the seam check is vacuous");

console.log({ levels: paths.length, segments, buildMs: +ms.toFixed(1), pathKB: +(paths.join("").length / 1024).toFixed(1) });
if (fail.length) { fail.forEach((f) => console.error("FAIL:", f)); process.exit(1); }
console.log("topo: ok");
