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
 * chunk of bookkeeping that renders identically for a solid stroke. Nothing
 * dashes these, so nothing needs the continuity.
 */

const SMOOTH = (t: number) => t * t * (3 - 2 * t);
const LERP = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic value hash — same field every reload, no seeded-RNG dependency. */
function hash(x: number, y: number, seed: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = SMOOTH(x - xi), v = SMOOTH(y - yi);
  return LERP(
    LERP(hash(xi, yi, seed), hash(xi + 1, yi, seed), u),
    LERP(hash(xi, yi + 1, seed), hash(xi + 1, yi + 1, seed), u),
    v,
  );
}

/** Three octaves — one is too smooth to read as terrain, four adds noise, not detail. */
function fbm(x: number, y: number, seed: number) {
  return (
    valueNoise(x, y, seed) * 0.6 +
    valueNoise(x * 2.03, y * 2.03, seed + 1) * 0.28 +
    valueNoise(x * 4.11, y * 4.11, seed + 2) * 0.12
  );
}

export type TopoOptions = {
  /** Field size in user units — the SVG viewBox this is drawn into. */
  width: number;
  height: number;
  /** Sampling grid. Finer means smoother contours and more segments. */
  cols?: number;
  rows?: number;
  /** Noise frequency: higher = more, tighter basins. */
  scale?: number;
  /** Number of contour bands. */
  levels?: number;
  seed?: number;
};

/** One path string per contour level, outermost first. */
export function makeTopoPaths({
  width, height, cols = 132, rows = 92, scale = 4.0, levels = 12, seed = 7,
}: TopoOptions): string[] {
  const cw = width / cols;
  const ch = height / rows;

  // Sample once; every level reads the same field.
  const f = new Float32Array((cols + 1) * (rows + 1));
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      f[j * (cols + 1) + i] = fbm((i / cols) * scale, (j / rows) * scale * (height / width), seed);
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
