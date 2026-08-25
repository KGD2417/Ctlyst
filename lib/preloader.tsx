"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { Monogram } from "@/lib/monogram";

gsap.registerPlugin(DrawSVGPlugin, Flip);

/**
 * The entrance (L3). The monogram draws stroke by stroke while a mono counter
 * runs 000 → 100, then the mark *becomes* the navbar logo via Flip rather than
 * fading out.
 *
 * Gated on document.fonts.ready so no FOUT lands mid-animation, and hard-capped
 * at --preload-cap (2.2s) so slow assets never hold the page hostage.
 */

const CAP_MS = 2200;

export function Preloader() {
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // INV-2 — skipped entirely under reduced motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(true);
      document.documentElement.dataset.preloaded = "true";
      return;
    }

    let killed = false;
    const ctx = gsap.context(() => {
      const strokes = gsap.utils.toArray<SVGPathElement>("[data-stroke]");
      const dots = gsap.utils.toArray<SVGCircleElement>("[data-dot]");

      const tl = gsap.timeline({
        onComplete: () => {
          if (!killed) handoff();
        },
      });

      tl.set(strokes, { drawSVG: "0%" })
        .set(dots, { scale: 0, transformOrigin: "50% 50%" })
        .to(strokes, {
          drawSVG: "100%",
          duration: 0.62,
          ease: "power3.out",
          stagger: 0.075,
        })
        .to(dots, { scale: 1, duration: 0.22, ease: "power3.out", stagger: 0.06 }, "-=0.3")
        .to(
          { n: 0 },
          {
            n: 100,
            duration: 0.9,
            ease: "power3.out",
            onUpdate() {
              const v = Math.round(this.targets()[0].n);
              if (count.current) count.current.textContent = String(v).padStart(3, "0");
            },
          },
          0,
        );

      // Hard cap: whatever the timeline is doing, we are leaving at 2.2s.
      const capId = window.setTimeout(() => {
        if (!killed && tl.isActive()) {
          tl.progress(1);
        }
      }, CAP_MS);

      return () => window.clearTimeout(capId);
    }, root);

    // Gate the *start* on fonts so the counter and the mark never reflow mid-run.
    const start = Promise.race([
      document.fonts.ready,
      new Promise((r) => setTimeout(r, 800)), // fonts must not hold us either
    ]);
    start.then(() => {
      if (!killed && root.current) root.current.dataset.ready = "true";
    });

    function handoff() {
      const src = mark.current;
      const target = document.querySelector<HTMLElement>("[data-navmark]");
      if (!src || !target) {
        finish();
        return;
      }
      // Flip: the preloader mark *becomes* the navbar mark. Measure the target,
      // move our node into its slot, and let Flip tween the difference.
      const state = Flip.getState(src);
      target.style.visibility = "hidden";
      const rect = target.getBoundingClientRect();
      gsap.set(src, {
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        margin: 0,
      });
      Flip.from(state, {
        duration: 0.72,
        ease: "power3.inOut",
        absolute: true,
        onComplete: () => {
          target.style.visibility = "";
          finish();
        },
      });
      // fade the crimson ground and the counter out under the moving mark
      gsap.to("[data-preload-ground]", { opacity: 0, duration: 0.5, ease: "power2.out" });
      gsap.to("[data-preload-meta]", { opacity: 0, duration: 0.3, ease: "power2.out" });
    }

    function finish() {
      if (killed) return;
      setDone(true);
      document.documentElement.dataset.preloaded = "true";
      window.dispatchEvent(new CustomEvent("ctlyst:preloaded"));
    }

    // Absolute backstop — nothing keeps the page covered past the cap + handoff.
    const backstop = window.setTimeout(finish, CAP_MS + 900);

    return () => {
      killed = true;
      window.clearTimeout(backstop);
      ctx.revert();
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <div data-preload-ground className="absolute inset-0 bg-paper" />

      <div ref={mark} className="relative w-[min(52vw,520px)] text-ink">
        <Monogram className="w-full overflow-visible" strokeWidth={6} drawable />
      </div>

      <div data-preload-meta className="relative mt-10 flex flex-col items-center gap-3">
        <span ref={count} className="t-mono-label text-crimson">
          000
        </span>
        <span className="t-mono-label text-muted">Mumbai · Maharashtra · Est. MMXXVI</span>
      </div>
    </div>
  );
}
