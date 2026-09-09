"use client";

import { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsapContext } from "@/lib/use-gsap";

gsap.registerPlugin(SplitText, ScrollTrigger);

/**
 * Per-line reveal: SplitText by line, each line masked by its own
 * overflow:hidden wrapper, translating up from 110%.
 *
 * `mask: "lines"` makes SplitText build the wrappers itself, which is the whole
 * reason not to hand-roll a splitter. Reverted on unmount so re-splitting after
 * a resize or a route change cannot leave orphaned <div>s behind (INV-1).
 */
export function SplitLines({
  children, className, delay = 0, trigger = true, misregister = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  trigger?: boolean;
  misregister?: boolean;
}) {
  const el = useRef<HTMLDivElement>(null);

  const scope = useGsapContext<HTMLDivElement>((_ctx, ref) => {
    const node = ref.current?.firstElementChild as HTMLElement | null;
    if (!node) return;

    const mm = gsap.matchMedia();

    // INV-2's own check is "content appears with opacity only" — so it appears,
    // rather than being there already. A snap to opacity 1 is what made Windows
    // read as a dead page: `reduce` is on by default on a lot of machines, and
    // every reveal on the site resolved before it could be seen. Opacity is not
    // motion; no transform, no stagger, no scrub.
    mm.add("(prefers-reduced-motion: reduce)", () => {
      const tween = gsap.fromTo(node, { opacity: 0 }, {
        opacity: 1,
        duration: 0.5,
        ease: "power1.out",
        delay,
        ...(trigger
          ? { scrollTrigger: { trigger: node, start: "top 85%", once: true } }
          : {}),
      });
      return () => { tween.kill(); };
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // aria:"none" — SplitText otherwise writes an aria-label onto the wrapper,
      // and aria-label is prohibited on a generic <div> with no role. We split by
      // LINE, not character, so the text still reads correctly without it.
      const split = new SplitText(node, {
        type: "lines", mask: "lines", linesClass: "sl-line", aria: "none",
      });
      gsap.set(node, { opacity: 1 });
      const tween = gsap.from(split.lines, {
        // 135, not 110: the mask now clips 0.3em outside its box so descenders
        // survive, and a line starting only 10% below would already be poking
        // into that margin at rest.
        yPercent: 135,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.06,
        delay,
        ...(trigger
          ? { scrollTrigger: { trigger: node, start: "top 85%", once: true } }
          : {}),
      });
      return () => {
        tween.kill();
        split.revert();
      };
    });
  }, []);

  return (
    <div ref={scope} className={misregister ? "misreg" : undefined}>
      {/* Rendered VISIBLE. Starting at opacity:0 and waiting for JS made the
          hero invisible to the Largest Contentful Paint until the reveal ran,
          so LCP was gated on our own animation — 2.72s, with the LCP element
          reported as the small gold eyebrow. The hidden start state is now set
          in a layout effect, which runs before paint, and the preloader covers
          hydration anyway. */}
      <div ref={el} className={className}>
        {children}
      </div>
    </div>
  );
}
