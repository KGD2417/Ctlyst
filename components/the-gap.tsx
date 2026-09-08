"use client";

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Wordmark, revealWordmark } from "@/lib/wordmark";
import { useGsapContext } from "@/lib/use-gsap";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * The Gap — the one memorable thing on the site (L5).
 *
 * "ideas" locked to the left edge, "execution" to the right, separated by an
 * actual void of empty paper. Scroll progress drives them together; as they
 * meet, the seam bleeds and they resolve into CTLYST in the crimson.
 *
 * The close runs FORWARD ONLY — see the drive at the foot of the timeline.
 *
 * This is the ONLY pinned section in the build (§5 restraint clause).
 *
 * L5a is the DOM mechanic with a CSS crossfade at the seam — the scroll feel has
 * to be right before any shader is considered. L5b swaps only the seam.
 */
/**
 * L5b loads only when the device can afford it. Everything below the guard is
 * the L5a DOM crossfade, which stays as the fallback (INV-6).
 */
const GapShader = lazy(() => import("@/components/gap-shader"));

export function TheGap() {
  const progress = useRef(0);
  const [shader, setShader] = useState(false);

  /**
   * §5 L5b gate: capable device AND The Gap actually approaching.
   *
   * Capability alone mounted the shader at hydration and pulled three.js's
   * 228 KB chunk into first load (INV-6 went 180.7 -> 430.9 KB). An
   * IntersectionObserver did not fix it either: it starts observing before
   * layout, when the section is still zero-height at y=0 and therefore
   * trivially "intersecting", so it fired immediately. ScrollTrigger refreshes
   * after layout, so its measurement is the real one.
   */
  const allowed = useRef(false);
  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 2;
    allowed.current =
      cores > 4 &&
      !window.matchMedia("(pointer: coarse)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !window.matchMedia("(max-width: 767px)").matches;
  }, []);

  const scope = useGsapContext<HTMLElement>((_ctx, ref) => {
    const root = ref.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    // ── desktop: pinned, scrubbed, the words close a real void ────────────
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const left = q<HTMLElement>("[data-word='ideas']")[0];
      const right = q<HTMLElement>("[data-word='execution']")[0];
      const resolve = q<HTMLElement>("[data-resolve]")[0];
      const seam = q<HTMLElement>("[data-seam]")[0];
      const wordmark = q<HTMLElement>("[data-resolve] [data-wordmark]")[0];

      // Characters, so the words can collapse INTO the seam rather than simply
      // fading out on top of each other. Split late — after the words have been
      // laid out — and reverted with the context.
      const splitL = new SplitText(left, { type: "chars", aria: "none" });
      const splitR = new SplitText(right, { type: "chars", aria: "none" });
      // outermost characters lead, so each word folds inward toward the join
      const collapseL = [...splitL.chars].reverse();
      const collapseR = [...splitR.chars];

      // Travel is MEASURED, not a guessed percentage: the void between the two
      // words depends on viewport width and on how wide each word renders, so a
      // fixed xPercent left a 322px gap that never closed — and the gap closing
      // is the entire idea. Measured in onRefreshInit, which runs before
      // ScrollTrigger applies pinning, so the rects are the true resting layout.
      let travelL = 0;
      let travelR = 0;
      const measure = () => {
        gsap.set([left, right], { x: 0 });
        const lr = left.getBoundingClientRect();
        const rr = right.getBoundingClientRect();
        const centre = (lr.left + rr.right) / 2;
        travelL = centre - lr.right;   // "ideas" right edge meets the centre
        travelR = centre - rr.left;    // "execution" left edge meets it
      };
      measure();

      const tl = gsap.timeline({ paused: true });

      // Load the shader chunk only when The Gap comes into view.
      ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        once: true,
        onEnter: () => { if (allowed.current) setShader(true); },
      });

      // Explicit durations: GSAP defaults to 0.5s, so the words were finishing
      // at the timeline's halfway point and the seam bled over a still-open gap.
      // Sequence matters: meet -> bleed -> dissolve -> resolve. Overlapping the
      // fade-out and fade-in left "ideasexecution" legible as one collided word
      // with CTLYST ghosting behind it. The words now clear the seam before the
      // wordmark arrives, so the bleed reads as ink soaking in, not a crossfade.
      // Sequence: meet → wet → fold away → the mark draws out of the ink.
      // The words must have CLEARED before the wordmark starts, or the two read
      // as overlapping rather than as one becoming the other.
      tl.fromTo(left,  { x: 0 }, { x: () => travelL, ease: "none", duration: 0.58 }, 0)
        .fromTo(right, { x: 0 }, { x: () => travelR, ease: "none", duration: 0.58 }, 0)
        // the seam wets as they arrive
        .fromTo(seam, { opacity: 0 }, { opacity: 1, ease: "none", duration: 0.26 }, 0.46)
        // ...then each word folds into the join, outermost letters leading
        .to(collapseL, {
          x: (i, t: Element) => -(t as HTMLElement).offsetLeft * 0.05 + 22,
          opacity: 0, ease: "power2.in", duration: 0.14, stagger: 0.012,
        }, 0.58)
        .to(collapseR, {
          x: (i, t: Element) => (t as HTMLElement).offsetLeft * 0.05 - 22,
          opacity: 0, ease: "power2.in", duration: 0.14, stagger: 0.012,
        }, 0.58)
        // ...and the wordmark sets itself out of the ink, letter by letter — the
        // same mark, and the same reveal, the preloader runs at load.
        // NOTE: timeline positions are seconds, not fractions of the scroll. The
        // timeline runs ~1.15s total, so these land at roughly 0.72–1.0 of the
        // travel. Nudged later than first written because a letter was appearing
        // while the last of "execution" was still on the paper.
        .set(resolve, { opacity: 1 }, 0.82);

      revealWordmark(tl, wordmark, { duration: 0.3, stagger: 0.05, position: 0.82 });

      // ── one-way ────────────────────────────────────────────────────────
      // The close is irreversible: two words become a mark. `scrub` is
      // bidirectional by definition, so scrolling back up pulled the mark apart
      // into "ideas"/"execution" again and the one memorable moment on the site
      // read as a slider. So: drive the timeline by hand off the high-water mark
      // of scroll progress. Downward scroll advances it; upward scroll leaves
      // the resolved mark standing until the pin releases.
      //
      // quickTo (not tl.progress directly) reproduces what scrub: 0.6 was doing
      // — the same 0.6s of lag behind the scroll position — with one reusable
      // tween instead of one per frame.
      const drive = { p: 0 };
      let peak = 0;
      const smooth = gsap.quickTo(drive, "p", {
        duration: 0.6,
        ease: "none",
        onUpdate: () => {
          tl.progress(drive.p);
          // the bleed only exists after the words meet, so remap 0.58..0.95 -> 0..1
          progress.current = gsap.utils.clamp(0, 1,
            gsap.utils.mapRange(0.58, 0.95, 0, 1, drive.p));
        },
      });

      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        // Longer travel so even a fast flick spends enough frames inside the
        // pin for the close to read as inevitable rather than skipped.
        end: "+=" + Math.round(window.innerHeight * 1.3),
        pin: true,
        anticipatePin: 1,
        // `animation` is here only so invalidateOnRefresh re-evaluates the
        // measured travel; toggleActions is muted so it never plays the
        // timeline itself — the drive above is the only thing that moves it.
        animation: tl,
        toggleActions: "none none none none",
        invalidateOnRefresh: true,
        onRefreshInit: measure,
        onRefresh: () => tl.progress(drive.p),
        onUpdate: (self) => {
          if (self.progress <= peak) return;
          peak = self.progress;
          smooth(peak);
        },
        id: "the-gap",
      });
    });

    // ── reduced motion / mobile handled in markup; nothing to animate ─────
    mm.add("(prefers-reduced-motion: reduce)", () => {
      // Nothing is split or masked under reduced motion, so the mark is simply
      // shown as it is set (INV-2).
      gsap.set(q("[data-resolve]"), { opacity: 1 });
      gsap.set(q("[data-word]"), { opacity: 0 });
    });
  }, []);

  return (
    <>
      {/* ── desktop: pinned + scrubbed ───────────────────────────────── */}
      <section
        ref={scope}
        aria-labelledby="gap-heading"
        className="relative hidden h-screen items-center overflow-hidden md:flex"
      >
        <h2 id="gap-heading" className="sr-only">
          Bridging the gap between ideas and execution
        </h2>

        <div className="relative flex w-full items-center justify-between px-[4vw]">
          <span data-word="ideas" className="t-display-xl block will-change-transform">
            ideas
          </span>
          <span data-word="execution" className="t-display-xl block will-change-transform">
            execution
          </span>

          {/* the seam — L5b replaces exactly this with the WebGL ink-bleed */}
          {/* L5a seam — always present; the shader layers over it when allowed */}
          <span
            data-seam
            aria-hidden="true"
            className="gap-seam pointer-events-none absolute left-1/2 top-1/2 h-[1.1em] w-[42vw] -translate-x-1/2 -translate-y-1/2 opacity-0"
          />

          {shader && (
            <span
              aria-hidden="true"
              data-gap-shader
              className="pointer-events-none absolute left-1/2 top-1/2 h-[2.2em] w-[54vw] -translate-x-1/2 -translate-y-1/2"
            >
              <Suspense fallback={null}>
                <GapShader progress={progress} />
              </Suspense>
            </span>
          )}

          <span
            data-resolve
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-[min(10.5vw,116px)] text-crimson opacity-0"
          >
            <Wordmark />
          </span>
        </div>
      </section>

      {/* ── mobile: separately authored. No pin, no scrub, no shader. ──── */}
      <section aria-labelledby="gap-heading-m" className="px-6 py-24 text-center md:hidden">
        <h2 id="gap-heading-m" className="sr-only">
          Bridging the gap between ideas and execution
        </h2>
        <p className="t-display-l">ideas</p>
        <p className="t-mono-label my-8 text-muted">· · ·</p>
        <p className="t-display-l">execution</p>
        <Wordmark className="mt-10 block text-[13vw] text-crimson" />
      </section>
    </>
  );
}
