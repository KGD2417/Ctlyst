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

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(node, { opacity: 1 });
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const split = new SplitText(node, { type: "lines", mask: "lines", linesClass: "sl-line" });
      gsap.set(node, { opacity: 1 });
      const tween = gsap.from(split.lines, {
        yPercent: 110,
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
      <div ref={el} className={className} style={{ opacity: 0 }}>
        {children}
      </div>
    </div>
  );
}
