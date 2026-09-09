"use client";

import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsapContext } from "@/lib/use-gsap";

gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger);

/**
 * Reveals a block of content: rows stagger in, and any [data-draw] SVG stroke
 * draws itself. Under reduced motion everything is simply present.
 */
export function Reveal({
  children, className, stagger = 0.07, selector = "[data-row]",
}: { children: React.ReactNode; className?: string; stagger?: number; selector?: string }) {
  const scope = useGsapContext<HTMLDivElement>((_ctx, ref) => {
    const root = ref.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      // Opacity only — no y, no stagger. The stroke draw stays instant: a line
      // drawing itself is motion, where a fade is not.
      gsap.set(q("[data-draw]"), { drawSVG: "100%" });
      const rows = q(selector);
      if (!rows.length) return;
      gsap.set(rows, { y: 0 });
      const tween = gsap.fromTo(rows, { opacity: 0 }, {
        opacity: 1, duration: 0.5, ease: "power1.out",
        scrollTrigger: { trigger: root, start: "top 82%", once: true },
      });
      return () => { tween.kill(); };
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const rows = q(selector);
      if (rows.length) {
        gsap.from(rows, {
          opacity: 0, y: 24, duration: 0.56, ease: "power3.out", stagger,
          scrollTrigger: { trigger: root, start: "top 82%", once: true },
        });
      }
      const draws = q("[data-draw]");
      if (draws.length) {
        gsap.fromTo(draws, { drawSVG: "0%" }, {
          drawSVG: "100%", duration: 0.9, ease: "power3.out", stagger: stagger * 1.4,
          scrollTrigger: { trigger: root, start: "top 80%", once: true },
        });
      }
    });
  }, []);

  return <div ref={scope} className={className}>{children}</div>;
}
