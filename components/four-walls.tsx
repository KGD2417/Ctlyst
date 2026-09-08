"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsapContext } from "@/lib/use-gsap";
import { scrollToY } from "@/lib/scroll-provider";

gsap.registerPlugin(ScrollTrigger);

const WALLS = [
  { n: "i.",   title: "The Guidance Gap",   body: "Little or no access to people who have actually built and operated ventures — especially outside the major metros, where networks are thin." },
  { n: "ii.",  title: "The Capability Gap", body: "Missing technical, product, or operational skills to move from a promising idea to a working prototype." },
  { n: "iii.", title: "The Awareness Gap",  body: "Limited knowledge of the incubators, grants, subsidies, and government schemes that already exist — funded, waiting, and under-used." },
  { n: "iv.",  title: "The Trust Gap",      body: "Even where resources exist, founders cannot easily tell which are credible or how to navigate the process alone." },
];

/**
 * Pinned horizontal gallery — scrolling past the walls *is* hitting them.
 *
 * INV-4: the mobile variant below is separately authored, not the same DOM
 * re-flowed. Nothing pins, nothing moves sideways.
 * INV-5: each panel is focusable and the pinned track scrolls itself to the
 * focused panel, so Tab traversal works inside a horizontal gallery.
 */
export function FourWalls() {
  const scope = useGsapContext<HTMLElement>((_ctx, ref) => {
    const root = ref.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const track = q<HTMLElement>("[data-track]")[0];
      const panels = q<HTMLElement>("[data-panel]");
      if (!track) return;

      // Pure geometry, deliberately not measured. `track.scrollWidth -
      // innerWidth` inside a GSAP function-value was being evaluated before
      // layout settled and returned 7200 instead of 5760, which drove the track
      // one full panel too far — every keyboard-focused panel landed off-screen.
      // Each child is exactly one viewport wide, so the travel is (n-1) screens
      // and, as a share of the track's own width, -100*(n-1)/n percent.
      const slides = track.children.length;
      const travelPct = -100 * ((slides - 1) / slides);

      // fromTo, not to: with invalidateOnRefresh GSAP re-captures the start
      // value from the element's *current* transform, so after one refresh the
      // origin had drifted to -1440 and the whole track sat one panel too far
      // left. Pinning both endpoints makes refreshes idempotent.
      const tween = gsap.fromTo(track,
        { xPercent: 0 },
        {
        xPercent: travelPct,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          // 0.55 of a viewport width per panel rather than a full one. The tween
          // is mapped to the trigger's whole range either way, so the four
          // panels still read at the same pace — the page is just less tall.
          end: () => "+=" + (slides - 1) * window.innerWidth * 0.55,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          id: "four-walls",
        },
      },
      );

      // INV-5 — keyboard focus must be able to reach panels that are off-screen.
      //
      // Deferred by a frame on purpose: the browser runs its own "scroll the
      // focused element into view" *after* the focusin handler, and inside a
      // pinned (position:fixed) track that lands nowhere useful. Scrolling on
      // the next frame means ours is the one that sticks.
      let raf = 0;
      const onFocus = (e: FocusEvent) => {
        const panel = (e.target as HTMLElement).closest<HTMLElement>("[data-panel]");
        if (!panel) return;
        const idx = panels.indexOf(panel);
        const st = tween.scrollTrigger;
        if (!st || idx < 0) return;
        // panel i sits at track offset (i+1)*vw, so it reaches the left edge at
        // progress (i+1)/panels.length.
        const progress = Math.min(1, (idx + 1) / panels.length);
        const y = st.start + (st.end - st.start) * progress;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          root.scrollLeft = 0;      // undo the browser's reveal-scroll
          scrollToY(y, true);
          st.update();
        });
      };
      /**
       * `overflow: hidden` still scrolls PROGRAMMATICALLY. When Tab moved focus
       * into an off-screen panel the browser set root.scrollLeft to reveal it,
       * shifting the track a full viewport without touching its transform — the
       * element's transform and tween progress were provably identical in both
       * cases, only getBoundingClientRect differed. Clamp it back to 0 and let
       * the ScrollTrigger own horizontal position exclusively.
       */
      const clamp = () => { if (root.scrollLeft !== 0) root.scrollLeft = 0; };
      root.addEventListener("scroll", clamp, { passive: true });

      root.addEventListener("focusin", onFocus);
      return () => {
        cancelAnimationFrame(raf);
        root.removeEventListener("scroll", clamp);
        root.removeEventListener("focusin", onFocus);
      };
    });
  }, []);

  return (
    <>
      {/* ── desktop: pinned horizontal ─────────────────────────────────── */}
      <section
        ref={scope}
        aria-labelledby="walls-heading"
        className="relative hidden h-screen overflow-hidden md:block"
      >
        <div data-track className="flex h-full w-max">
          <div className="flex h-full w-screen shrink-0 flex-col justify-center px-[8vw]">
            <h2 className="t-mono-label text-gold">II. The Four Walls</h2>
            <h2 id="walls-heading" className="t-display-m mt-6 max-w-[16ch]">
              Talented founders stall — not for lack of merit, but at four{" "}
              <em className="italic text-crimson">practical walls.</em>
            </h2>
          </div>
          {WALLS.map((w) => (
            <article
              key={w.n}
              data-panel
              tabIndex={0}
              className="flex h-full w-screen shrink-0 flex-col justify-center border-l border-rule px-[8vw]"
            >
              <span className="t-mono-label text-gold">{w.n}</span>
              <h3 className="t-display-m mt-5 max-w-[14ch]">{w.title}</h3>
              <p className="t-lede mt-6 max-w-[46ch]">{w.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── mobile: separately authored stack. No pin, no x. (INV-4) ────── */}
      <section aria-labelledby="walls-heading-m" className="px-6 py-20 md:hidden">
        <h2 className="t-mono-label text-gold">II. The Four Walls</h2>
        <h2 id="walls-heading-m" className="t-display-m mt-5">
          Talented founders stall — not for lack of merit, but at four{" "}
          <em className="italic text-crimson">practical walls.</em>
        </h2>
        <div className="mt-10 border-t border-ink">
          {WALLS.map((w) => (
            <article key={w.n} className="border-b border-rule py-7">
              <span className="t-mono-label text-gold">{w.n}</span>
              <h3 className="t-subhead mt-3">{w.title}</h3>
              <p className="mt-2 text-ink-soft">{w.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
