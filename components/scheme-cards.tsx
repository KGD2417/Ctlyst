"use client";

import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsapContext } from "@/lib/use-gsap";
import { CountUp } from "@/lib/count-up";
import { lift } from "@/lib/ui-motion";

gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger);

/**
 * Six scheme cards. The rupee figure is the argument, so it is set in mono at
 * display size and counts on scrub. Hover lifts the card and traces a gold
 * hairline around its perimeter with DrawSVG (§8).
 */

type Scheme = {
  n: string; title: string; figure?: { to: number; prefix?: string; unit: string };
  body: React.ReactNode; tinted?: boolean;
};

const SCHEMES: Scheme[] = [
  { n: "Scheme I", title: "Startup India Seed Fund Scheme",
    figure: { to: 20, prefix: "₹", unit: "lakh — prototype grant" },
    body: <>Grants up to <strong>₹20 lakh</strong> for prototyping and up to <strong>₹50 lakh</strong> as seed funding, via approved incubators, from a <strong>₹945 crore</strong> corpus. The prime early-stage resource.</> },
  { n: "Scheme II", title: "Fund of Funds for Startups", tinted: true,
    figure: { to: 10000, prefix: "₹", unit: "crore corpus" },
    body: <>A <strong>₹10,000 crore</strong> corpus managed via SIDBI, funding SEBI-registered AIFs that invest in startups — indirect equity funding at the growth stage.</> },
  { n: "Scheme III", title: "Credit Guarantee Scheme",
    body: <><strong>Collateral-free</strong> loan guarantees for eligible startups, operational since April 2023 — debt without pledging your family&rsquo;s assets.</> },
  { n: "Scheme IV", title: "Section 80-IAC Tax Benefit",
    figure: { to: 3, unit: "years of deduction" },
    body: <>A <strong>three-year income-tax deduction</strong> for eligible DPIIT-recognised startups — dramatically reducing the early tax burden after incorporation.</> },
  { n: "Scheme V", title: "Atal Innovation Mission", tinted: true,
    body: <>Incubation centres, tinkering labs, and the <strong>&ldquo;Mentors of Change&rdquo;</strong> network under NITI Aayog — strong for hardware and social ventures at the grassroots.</> },
  { n: "Scheme VI", title: "State Startup Policies",
    body: <>State-level grants, incubation, and dedicated funds — including <strong>Maharashtra&rsquo;s</strong>, directly relevant to our Mumbai launch city and beyond.</> },
];

/** Glyph count of the rendered figure — CountUp prints en-IN grouped digits. */
const figureChars = (f: NonNullable<Scheme["figure"]>) =>
  (f.prefix?.length ?? 0) + f.to.toLocaleString("en-IN").length;

export function SchemeCards() {
  const scope = useGsapContext<HTMLDivElement>((_ctx, ref) => {
    const root = ref.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(q("[data-card]"), { opacity: 1, y: 0 });
      gsap.set(q("[data-perimeter]"), { drawSVG: "0%" });
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const cards = q<HTMLElement>("[data-card]");
      // Without an explicit initial state the <rect> renders complete, so every
      // card wore its gold hairline at rest instead of only on hover.
      gsap.set(q("[data-perimeter]"), { drawSVG: "0%" });
      gsap.from(cards, {
        opacity: 0, y: 26, duration: 0.56, ease: "power3.out", stagger: 0.09,
        scrollTrigger: { trigger: root, start: "top 80%", once: true },
      });

      // hover: lift + trace a gold hairline around the perimeter
      const cleanups: (() => void)[] = [];
      cards.forEach((card) => {
        const rule = card.querySelector<SVGPathElement>("[data-perimeter]");
        // The lift goes through motion/WAAPI so it runs on the compositor; the
        // perimeter stays on GSAP because DrawSVG has no WAAPI equivalent.
        const enter = () => {
          lift(card, true);
          if (rule) gsap.fromTo(rule, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.62, ease: "power3.out" });
        };
        const leave = () => {
          lift(card, false);
          if (rule) gsap.to(rule, { drawSVG: "100% 100%", duration: 0.32, ease: "power3.out" });
        };
        card.addEventListener("mouseenter", enter);
        card.addEventListener("mouseleave", leave);
        card.addEventListener("focus", enter);
        card.addEventListener("blur", leave);
        cleanups.push(() => {
          card.removeEventListener("mouseenter", enter);
          card.removeEventListener("mouseleave", leave);
          card.removeEventListener("focus", enter);
          card.removeEventListener("blur", leave);
        });
      });
      return () => cleanups.forEach((c) => c());
    });
  }, []);

  return (
    <div ref={scope} className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {SCHEMES.map((s) => (
        <article
          key={s.n}
          data-card
          tabIndex={0}
          className={`@container relative border border-rule p-8 ${s.tinted ? "bg-paper-warm" : "bg-paper"}`}
        >
          {/* perimeter hairline, drawn on hover */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="none">
            <rect data-perimeter x="0.5" y="0.5" width="99.5%" height="99.5%"
                  fill="none" stroke="var(--color-gold)" strokeWidth="1" pathLength="100" />
          </svg>

          <span className="t-mono-label text-gold">{s.n}</span>
          {/* Fixed-height figure well, bottom-aligned. Three of the six schemes
              have no rupee figure, so without a reserved well their titles sat a
              hundred pixels above their neighbours' and the row read as broken
              rather than as a grid. */}
          <div className="mt-5 flex h-[7.5rem] flex-col justify-end">
          {s.figure && (
            <p>
              {/* The figure is sized off the CARD, not the viewport. At the
                  shared display size "₹10,000" is seven monospaced glyphs — wider
                  than the column — and it printed straight out through the card's
                  right edge. 0.62em is one IBM Plex Mono advance plus slack. */}
              <span
                className="t-mono-data block leading-none"
                style={{ fontSize: `min(5rem, ${(100 / (figureChars(s.figure) * 0.62)).toFixed(1)}cqi)` }}
              >
                <CountUp to={s.figure.to} prefix={s.figure.prefix ?? ""} />
              </span>
              <span className="t-lede mt-1 block">{s.figure.unit}</span>
            </p>
          )}
          </div>
          <h3 className="t-subhead mt-5">{s.title}</h3>
          <p className="mt-3 text-ink-soft">{s.body}</p>
        </article>
      ))}
    </div>
  );
}
