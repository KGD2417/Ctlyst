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
    // Transparent tile carrying only speckle. An opaque tile — even at 2.8% —
    // averages to a visible veil over the ground and kills it. Alpha-only noise
    // tints nothing; it just breaks up the flatness, which is the whole job of
    // layer B, and on a dark ground it is also what keeps the large gradient
    // fills from banding.
    d[i] = d[i + 1] = d[i + 2] = 244;                      // --ink (light)
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

