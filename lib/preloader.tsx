"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/use-gsap";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { Wordmark, revealWordmark } from "@/lib/wordmark";

gsap.registerPlugin(SplitText, Flip);

/**
 * The entrance (L3). The wordmark sets itself letter by letter while a mono
 * counter runs 000 → 100, then the mark *becomes* the navbar logo via Flip
 * rather than fading out.
 *
 * Gated on document.fonts.ready so no FOUT lands mid-animation, and hard-capped
 * at --preload-cap (2.2s) so slow assets never hold the page hostage.
 */

const CAP_MS = 2200;

export function Preloader() {
  // Read the media query as an external store rather than setting state inside
  // an effect. Under reduced motion the preloader must never mount at all
  // (INV-2), and this decides that during render instead of after it.
  const reducedMotion = useReducedMotion();
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // INV-2 — skipped entirely under reduced motion. No setState here: `done`
    // is derived below, and this only records the flag other code waits on.
    if (reducedMotion) {
      document.documentElement.dataset.preloaded = "true";
      return;
    }

    let killed = false;
    let ctx: gsap.Context | null = null;
    let tl: gsap.core.Timeline | null = null;

    // Hard cap: whatever the timeline is doing, we are leaving at 2.2s from
    // mount — including the time spent waiting on fonts below.
    const capId = window.setTimeout(() => {
      if (!killed) tl?.progress(1);
    }, CAP_MS);

    /**
     * Everything is built AFTER the fonts land, not merely revealed then.
     *
     * SplitText measures the glyphs it is splitting, so splitting against the
     * fallback face and then having Cormorant swap in underneath leaves every
     * character mask sized for the wrong font. The old DrawSVG mark was
     * immune to this — it was an SVG, it had no metrics to get wrong.
     */
    const start = Promise.race([
      document.fonts.ready,
      new Promise((r) => setTimeout(r, 800)), // fonts must not hold us either
    ]);
    start.then(() => {
      if (killed || !root.current) return;
      root.current.dataset.ready = "true";

      ctx = gsap.context(() => {
        tl = gsap.timeline({
          onComplete: () => {
            if (!killed) handoff();
          },
        });

        const wordmark = root.current?.querySelector("[data-wordmark]");
        if (wordmark) revealWordmark(tl, wordmark, { duration: 0.62, stagger: 0.075 });

        tl.to(
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
      }, root);
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
        // Now that the mark is real type rather than a scalable SVG, the handoff
        // has to adopt the navbar's font-size too — otherwise Flip scales a
        // 90px wordmark down to fit a 131px box and then snaps to 24px when it
        // hands over. Setting it here means Flip's *end* state already matches
        // the navbar exactly, and scale:true walks the size change in between.
        fontSize: getComputedStyle(target).fontSize,
      });
      Flip.from(state, {
        duration: 0.72,
        ease: "power3.inOut",
        absolute: true,
        // INV-3: without this Flip tweens width/height to reconcile the size
        // change (the 90px mark -> the 24px navbar mark). scale:true makes it use
        // scaleX/scaleY instead, so the handoff stays transform-only.
        scale: true,
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
      window.clearTimeout(capId);
      window.clearTimeout(backstop);
      ctx?.revert();
    };
  }, [reducedMotion]);

  if (done || reducedMotion) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <div data-preload-ground className="absolute inset-0 bg-paper" />

      <div ref={mark} className="relative text-[min(9.3vw,90px)] text-ink">
        <Wordmark />
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
