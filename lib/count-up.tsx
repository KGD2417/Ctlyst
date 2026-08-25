"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsapContext } from "@/lib/use-gsap";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-SCRUBBED counter (§8): the figure tracks scroll position rather than
 * firing once on enter. Under reduced motion it simply prints the final value.
 */
export function CountUp({
  to, decimals = 0, className, prefix = "", suffix = "",
}: { to: number; decimals?: number; className?: string; prefix?: string; suffix?: string }) {
  const scope = useGsapContext<HTMLSpanElement>((_ctx, ref) => {
    const node = ref.current;
    if (!node) return;
    const fmt = (n: number) =>
      prefix + n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: reduce)", () => { node.textContent = fmt(to); });
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const o = { n: 0 };
      node.textContent = fmt(0);
      gsap.to(o, {
        n: to,
        ease: "none",
        onUpdate: () => { node.textContent = fmt(o.n); },
        scrollTrigger: { trigger: node, start: "top 92%", end: "top 45%", scrub: true },
      });
    });
  }, [to]);

  return <span ref={scope} className={className} />;
}
