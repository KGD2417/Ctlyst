/**
 * Layer C2 — topographic contour lines.
 *
 * The look is lifted from a WebGL reference that thresholds a triangle wave over
 * 2D noise; its animation is `noisePos = st * scale + t * vec2(...)`, i.e. the
 * field never deforms — it is a slow diagonal PAN of a static field. So the
 * contours are computed once here as vector paths and then only translated,
 * which is both cheaper than a fullscreen shader and INV-3-clean.
 *
 * Marching squares, segments left unjoined: joining them into polylines is a
 * chunk of bookkeeping that renders identically for a solid stroke.
 *
 * The lit passes DO dash these, and a dash pattern restarts at every subpath,
 * so the beading is per-segment rather than continuous along a contour. At this
 * segment length that reads as evenly spaced dust, which is the intent — but it
 * is the reason the dash period is tuned against the cell size and not against
 * the contour. Joining into polylines is the fix if the beading ever has to
 * flow along a contour instead of sitting on it.
 *
 * The grid is deliberately coarse. Every segment here is re-rasterised on every
 * frame of the pan, once per stroke pass per copy, so the sampling density is a
 * frame-budget decision as much as a visual one — see PROGRESS Scars.
 */

const SMOOTH = (t: number) => t * t * (3 - 2 * t);
const LERP = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic value hash — same field every reload, no seeded-RNG dependency. */
function hash(x: number, y: number, seed: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/**
 * `wrap` makes the lattice periodic in x, so the field tiles seamlessly and can
 * be panned forever instead of yoyo-ing. Without it the only honest options are
 * a reversing drift or a visible seam.
 */
function valueNoise(x: number, y: number, seed: number, wrap: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const wx = (i: number) => ((i % wrap) + wrap) % wrap;
  const u = SMOOTH(x - xi), v = SMOOTH(y - yi);
  return LERP(
    LERP(hash(wx(xi), yi, seed), hash(wx(xi + 1), yi, seed), u),
    LERP(hash(wx(xi), yi + 1, seed), hash(wx(xi + 1), yi + 1, seed), u),
    v,
  );
}

/**
 * Three octaves — one is too smooth to read as terrain, four adds noise, not
 * detail. Frequencies are exactly 1/2/4 rather than the usual irrational-ish
 * 2.03/4.11: each octave has to complete a whole number of periods across the
 * field or the seam stops matching. Separate seeds keep the octaves from
 * stacking their extremes the way aligned frequencies otherwise would.
 */
function fbm(x: number, y: number, seed: number, wrap: number) {
  return (
    valueNoise(x, y, seed, wrap) * 0.6 +
    valueNoise(x * 2, y * 2, seed + 1, wrap * 2) * 0.28 +
    valueNoise(x * 4, y * 4, seed + 2, wrap * 4) * 0.12
  );
}

export type TopoOptions = {
  /** Field size in user units — the SVG viewBox this is drawn into. */
  width: number;
  height: number;
  /** Sampling grid. Finer means smoother contours and more segments. */
  cols?: number;
  rows?: number;
  /** Noise frequency: higher = more, tighter basins. Must be a whole number —
   *  it is also the wrap period that makes the field tile in x. */
  scale?: number;
  /** Number of contour bands. */
  levels?: number;
  seed?: number;
};

/** One path string per contour level, outermost first. */
export function makeTopoPaths({
  width, height, cols = 100, rows = 70, scale = 4.0, levels = 9, seed = 7,
}: TopoOptions): string[] {
  const cw = width / cols;
  const ch = height / rows;

  // Sample once; every level reads the same field.
  const f = new Float32Array((cols + 1) * (rows + 1));
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      // x spans exactly one wrap period, so the column at i = cols is the column
      // at i = 0 and the field's right edge meets its own left edge.
      f[j * (cols + 1) + i] = fbm((i / cols) * scale, (j / rows) * scale * (height / width), seed, scale);
    }
  }
  // Normalise to the field's own range. Summed value noise clusters hard around
  // 0.5, so evenly-spaced levels over a nominal 0..1 left the outer two or three
  // bands with no crossings at all — bands that silently drew nothing.
  let lo = Infinity, hi = -Infinity;
  for (let k = 0; k < f.length; k++) { if (f[k] < lo) lo = f[k]; if (f[k] > hi) hi = f[k]; }
  const span = hi - lo || 1;
  for (let k = 0; k < f.length; k++) f[k] = (f[k] - lo) / span;

  const at = (i: number, j: number) => f[j * (cols + 1) + i];

  const paths: string[] = [];
  for (let l = 1; l < levels; l++) {
    const level = l / levels;
    let d = "";
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const tl = at(i, j), tr = at(i + 1, j), br = at(i + 1, j + 1), bl = at(i, j + 1);
        const x = i * cw, y = j * ch;

        // Crossing point on each edge, in fixed order: top, right, bottom, left.
        const pts: [number, number][] = [];
        if ((tl < level) !== (tr < level)) pts.push([x + cw * ((level - tl) / (tr - tl)), y]);
        if ((tr < level) !== (br < level)) pts.push([x + cw, y + ch * ((level - tr) / (br - tr))]);
        if ((bl < level) !== (br < level)) pts.push([x + cw * ((level - bl) / (br - bl)), y + ch]);
        if ((tl < level) !== (bl < level)) pts.push([x, y + ch * ((level - tl) / (bl - tl))]);

        // 2 crossings is one segment; 4 is a saddle, where either pairing is a
        // defensible reading of the same data — take the cheap one.
        for (let k = 0; k + 1 < pts.length; k += 2) {
          d += `M${pts[k][0].toFixed(1)} ${pts[k][1].toFixed(1)}L${pts[k + 1][0].toFixed(1)} ${pts[k + 1][1].toFixed(1)}`;
        }
      }
    }
    if (d) paths.push(d);
  }
  return paths;
}
