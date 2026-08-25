/**
 * CTL·Y·ST wordmark as strokeable SVG paths.
 *
 * Drawn as single-stroke letterforms (one continuous path per letter) rather
 * than outlined type: DrawSVG animates stroke-dashoffset, so a filled outline
 * would draw its *contour* and read as a wobbling edge, not as writing.
 *
 * Cap height 100, baseline at y=100, letters advance on a 78 unit pitch.
 */
export const MONOGRAM_VIEWBOX = "0 0 560 120";

export const MONOGRAM_STROKES: { d: string; letter: string }[] = [
  // C
  { letter: "C", d: "M 66 28 C 66 12 46 6 34 6 C 16 6 6 28 6 60 C 6 92 16 114 34 114 C 46 114 66 108 66 92" },
  // T
  { letter: "T", d: "M 84 8 L 152 8 M 118 8 L 118 114" },
  // L
  { letter: "L", d: "M 170 8 L 170 114 L 230 114" },
  // Y — the crimson one
  { letter: "Y", d: "M 248 8 L 286 62 L 324 8 M 286 62 L 286 114" },
  // S
  { letter: "S", d: "M 400 26 C 400 12 384 6 372 6 C 356 6 344 16 344 32 C 344 68 402 52 402 88 C 402 106 388 114 372 114 C 358 114 342 106 342 90" },
  // T
  { letter: "T", d: "M 420 8 L 488 8 M 454 8 L 454 114" },
];

/** The two interpuncts in CTL·Y·ST — drawn, not stroked. */
export const MONOGRAM_DOTS = [
  { cx: 239, cy: 62, r: 5 },
  { cx: 333, cy: 62, r: 5 },
];


/**
 * Shared mark. The preloader and the navbar render THIS, so the L3 Flip is a
 * continuous transform of one object rather than a swap between a stroked SVG
 * and a line of Cormorant that merely land in the same place.
 */
export function Monogram({
  className, strokeWidth = 6, drawable = false,
}: { className?: string; strokeWidth?: number; drawable?: boolean }) {
  return (
    <svg viewBox={MONOGRAM_VIEWBOX} className={className} fill="none" aria-hidden="true">
      {MONOGRAM_STROKES.map((s, i) => (
        <path
          key={i}
          {...(drawable ? { "data-stroke": true } : {})}
          d={s.d}
          stroke={s.letter === "Y" ? "var(--color-crimson)" : "currentColor"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {MONOGRAM_DOTS.map((d, i) => (
        <circle key={i} {...(drawable ? { "data-dot": true } : {})}
          cx={d.cx} cy={d.cy} r={d.r} fill="var(--color-gold)" />
      ))}
    </svg>
  );
}
