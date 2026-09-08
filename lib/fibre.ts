/**
 * Layer B — paper grain.
 *
 * Dynamically imported and skipped entirely on low-end devices (§9.5, INV-6).
 * Generates one 128px noise tile on a canvas and hands back a data URI, which
 * the caller sets as a repeating background. That is cheaper than a WebGL pass
 * for a layer that only ever drifts, and it needs no three.js on first load.
 *
 * The static fallback is the same tile at lower resolution, so a weak device
 * still gets fibre rather than flat white.
 */
export function makeFibreTile(size = 128, density = 0.55): string {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return "";

  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    // Transparent tile carrying only dark speckle. An opaque mid-grey tile —
    // even at 2.8% — averages to a visible grey veil over --paper and kills the
    // warm white entirely. Alpha-only noise tints nothing; it just breaks up the
    // flatness, which is the whole job of layer B.
    d[i] = d[i + 1] = d[i + 2] = 26;                       // --ink
    d[i + 3] = Math.random() < 0.5 ? 0 : Math.random() * 255 * density;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

/** hardwareConcurrency <= 4 or a coarse pointer means: don't bother. */
export function isLowEnd(): boolean {
  const cores = navigator.hardwareConcurrency ?? 2;
  return cores <= 4 || window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Layer B2 — dithered blob.
 *
 * A soft radial field quantised through an 8×8 ordered (Bayer) matrix, so the
 * falloff breaks into scattered square pixels at the edge instead of fading
 * smoothly. That pixel-scatter edge is the whole look; a plain gradient with
 * `filter: blur()` would be cheaper but reads as fog, not as a halftone.
 *
 * Rendered once to a data URI at mount and then only ever translated, so it
 * costs one canvas pass and nothing per frame (INV-3).
 */
const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

export function makeDitherBlob(size = 512, cell = 6, seed = 0): string {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#1A1712"; // --ink; the layer's own opacity does the rest
  const cells = Math.floor(size / cell);
  for (let gy = 0; gy < cells; gy++) {
    for (let gx = 0; gx < cells; gx++) {
      const nx = gx / cells - 0.5;
      const ny = gy / cells - 0.5;
      const r = Math.hypot(nx, ny) * 2;
      // Wobble the silhouette off a perfect circle — three harmonics is enough
      // to read as an organic mass and cheap enough to run per cell.
      const a = Math.atan2(ny, nx);
      const wob = 1 + 0.2 * Math.sin(a * 3 + seed) + 0.12 * Math.sin(a * 5 - seed * 2);
      const density = 1 - r / wob;
      if (density > BAYER8[gy % 8][gx % 8] / 64) ctx.fillRect(gx * cell, gy * cell, cell, cell);
    }
  }
  return c.toDataURL("image/png");
}
