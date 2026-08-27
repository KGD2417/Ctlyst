import { SplitText } from "gsap/SplitText";

/**
 * The wordmark — set in the actual display face, not drawn.
 *
 * It used to be six hand-authored single-stroke SVG paths, so that DrawSVG
 * could write it on. That is exactly why it never matched the footer: a
 * monoline stroke has no thick/thin modulation, no bracketed serifs and none of
 * Cormorant's proportions. It was a *drawing of* the type, not the type.
 *
 * Every place the mark appears now renders this one span, so the navbar, the
 * preloader, The Gap's resolution and the footer are the same object at
 * different sizes. Size and colour come from the caller (font-size is inherited
 * on purpose — the preloader's Flip hands off by matching the navbar's).
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      data-wordmark
      className={`font-display uppercase leading-none whitespace-nowrap tracking-[0.3em] pl-[0.3em] ${className}`}
    >
      CTLYST
    </span>
  );
}

/**
 * The mark setting itself: each glyph rises out of its own mask.
 *
 * The replacement for the old DrawSVG write-on. Real glyphs cannot be stroked
 * on — outlining them and drawing the contour reads as a wobbling edge, not as
 * writing — so they arrive instead, letter by letter, from behind a mask.
 * `mask: "chars"` makes SplitText build the overflow-hidden wrappers, so this
 * stays transform-only (INV-3).
 *
 * Adds its tween to `tl` and returns the split so the caller can revert it —
 * though a gsap.context reverts SplitText instances created inside it anyway.
 */
export function revealWordmark(
  tl: gsap.core.Timeline,
  el: Element,
  { duration = 0.62, stagger = 0.075, position = 0 }: {
    duration?: number; stagger?: number; position?: gsap.Position;
  } = {},
) {
  const split = new SplitText(el, { type: "chars", mask: "chars", aria: "none" });
  tl.from(split.chars, { yPercent: 110, duration, stagger, ease: "power3.out" }, position);
  return split;
}
