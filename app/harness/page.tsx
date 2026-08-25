"use client";

/**
 * L1 throwaway. Proves the plumbing before any visual depends on it.
 * Deleted at L2 — nothing in the real site should ever import from here.
 */

import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsapContext } from "@/lib/use-gsap";

export default function Harness() {
  const scope = useGsapContext<HTMLDivElement>((_ctx, ref) => {
    const root = ref.current;
    if (!root) return;

    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    // ── desktop: pin + scrub ────────────────────────────────────────────
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      ScrollTrigger.create({
        trigger: q("[data-block='pin']")[0],
        start: "top top",
        end: "+=600",
        pin: true,
        id: "harness-pin",
      });

      gsap.to(q("[data-block='scrub'] .bar"), {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: q("[data-block='scrub']")[0],
          start: "top 80%",
          end: "bottom 40%",
          scrub: true,
          id: "harness-scrub",
        },
      });
    });

    // ── mobile: no pin, no scrub — the fade branch does the work ────────
    mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.from(q("[data-block='scrub'] .bar"), {
        opacity: 0,
        duration: 0.56,
        scrollTrigger: { trigger: q("[data-block='scrub']")[0], start: "top 80%" },
      });
    });

    // ── reduced motion: opacity only, no pin, no scrub, no scroll hijack ─
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(q("[data-block='scrub'] .bar"), { scaleX: 1 });
      gsap.from(q("[data-block]"), { opacity: 0, duration: 0.2, stagger: 0.05 });
    });

    // fade block behaves identically in every branch
    gsap.from(q("[data-block='fade'] .card"), {
      opacity: 0,
      duration: 0.56,
      ease: "power3.out",
      scrollTrigger: { trigger: q("[data-block='fade']")[0], start: "top 75%" },
    });
  });

  return (
    <div ref={scope} className="min-h-screen">
      <nav className="t-mono-label sticky top-0 z-50 flex gap-6 border-b border-rule bg-paper/90 px-8 py-4 backdrop-blur">
        <Link href="/">home</Link>
        <Link href="/harness">harness</Link>
        <span className="text-muted">L1 · plumbing only</span>
      </nav>

      <section className="px-8 py-24">
        <p className="t-mono-label text-gold">Scroll — inertia should feel weighted</p>
        <h1 className="t-display-l mt-6">Harness</h1>
      </section>

      <section
        data-block="pin"
        className="flex h-screen items-center justify-center bg-crimson text-paper"
      >
        <p className="t-mono-label">Block I — pinned 600px</p>
      </section>

      <section data-block="scrub" className="px-8 py-40">
        <p className="t-mono-label text-muted">Block II — scrubbed</p>
        <div className="mt-6 h-24 w-full bg-rule/40">
          <div className="bar h-full origin-left scale-x-0 bg-ink" />
        </div>
      </section>

      <section data-block="fade" className="px-8 py-40">
        <p className="t-mono-label text-muted">Block III — fade only</p>
        <div className="card mt-6 h-48 w-full bg-paper-warm ring-1 ring-rule" />
      </section>

      <section className="px-8 py-40">
        <p className="t-caption">End of harness.</p>
      </section>
    </div>
  );
}
