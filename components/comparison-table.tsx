"use client";

import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsapContext } from "@/lib/use-gsap";

gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger);

/**
 * The most persuasive object on the site (§8).
 *
 * Rows reveal in sequence; the CTLYST row arrives LAST and DIFFERENTLY — a
 * crimson rule draws across it. Competitors' blank cells get a hairline dash
 * that draws in; CTLYST's get a check. The visual asymmetry makes the argument,
 * so the animation is doing real rhetorical work rather than decorating a table.
 *
 * It stays a real <table> — a screen reader gets a proper comparison grid.
 */

const COLS = ["Mentorship", "Hands-on execution", "Scheme navigation", "Student-first", "Local trust"];

type Cell = { kind: "yes" | "partial" | "none"; label?: string };
type Row = { player: string; cells: Cell[]; us?: boolean };

const ROWS: Row[] = [
  { player: "MAARG (Startup India)", cells: [
    { kind: "yes", label: "Yes — AI matching" }, { kind: "none" }, { kind: "partial", label: "Partial" }, { kind: "none" }, { kind: "none" } ] },
  { player: "Atal Innovation Mission", cells: [
    { kind: "yes", label: "Yes" }, { kind: "partial", label: "Partial — labs" }, { kind: "none" }, { kind: "yes", label: "Yes" }, { kind: "partial", label: "Institution-led" } ] },
  { player: "TiE", cells: [
    { kind: "yes", label: "Yes" }, { kind: "none" }, { kind: "none" }, { kind: "partial", label: "Metro-oriented" }, { kind: "partial", label: "Membership-gated" } ] },
  { player: "NASSCOM 10,000 Startups", cells: [
    { kind: "partial", label: "Partial" }, { kind: "yes", label: "Yes — tech skew" }, { kind: "none" }, { kind: "none" }, { kind: "none" } ] },
  { player: "CTLYST", us: true, cells: [
    { kind: "yes", label: "Yes — curated retirees" }, { kind: "yes", label: "Yes — done-with-you" },
    { kind: "yes", label: "Yes — end-to-end" }, { kind: "yes", label: "Yes — by design" }, { kind: "yes", label: "Yes — hyperlocal" } ] },
];

export function ComparisonTable() {
  const scope = useGsapContext<HTMLDivElement>((_ctx, ref) => {
    const root = ref.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(q("[data-trow]"), { opacity: 1 });
      gsap.set(q("[data-dash], [data-check], [data-usrule]"), { drawSVG: "100%" });
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const competitors = q<HTMLElement>("[data-trow]:not([data-us])");
      const us = q<HTMLElement>("[data-us]");

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 78%", once: true },
      });

      tl.from(competitors, { opacity: 0, y: 18, duration: 0.5, ease: "power3.out", stagger: 0.12 })
        .fromTo(q("[data-dash]"), { drawSVG: "0%" },
          { drawSVG: "100%", duration: 0.4, ease: "power3.out", stagger: 0.02 }, "-=0.5")
        // the CTLYST row arrives last, and differently
        .from(us, { opacity: 0, duration: 0.5, ease: "power3.out" }, "+=0.15")
        .fromTo(q("[data-usrule]"), { drawSVG: "0%" },
          { drawSVG: "100%", duration: 0.9, ease: "power4.out" }, "<")
        .fromTo(q("[data-check]"), { drawSVG: "0%" },
          { drawSVG: "100%", duration: 0.36, ease: "power3.out", stagger: 0.07 }, "<0.2");
    });
  }, []);

  return (
    <div ref={scope} className="mt-10 overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-[1.02rem]">
        <caption className="t-caption caption-bottom pt-4 text-left">
          No single player today combines all three pillars into one high-touch, hyperlocal
          journey — and none is built around a curated retiree mentor pool. That integration
          is the whitespace.
        </caption>
        <thead>
          <tr>
            <th className="border-b border-t-2 border-ink px-4 py-3 text-left" />
            {COLS.map((c) => (
              <th key={c} className="t-mono-label whitespace-nowrap border-b border-t-2 border-ink px-4 py-3 text-left text-ink">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.player} data-trow {...(r.us ? { "data-us": true } : {})}
                className={r.us ? "relative bg-paper-warm" : ""}>
              <th scope="row" className={`border-b border-rule px-4 py-4 text-left align-top font-semibold ${r.us ? "text-crimson" : "text-ink"}`}>
                {r.player}
                {r.us && (
                  <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full overflow-visible" aria-hidden="true">
                    <line data-usrule x1="0" y1="0" x2="100%" y2="0"
                          stroke="var(--color-crimson)" strokeWidth="2" />
                  </svg>
                )}
              </th>
              {r.cells.map((cell, i) => (
                <td key={i} className="border-b border-rule px-4 py-4 align-top text-ink-soft">
                  {cell.kind === "none" ? (
                    <svg width="26" height="10" aria-hidden="true" className="overflow-visible">
                      <line data-dash x1="0" y1="5" x2="26" y2="5" stroke="var(--color-rule)" strokeWidth="1.5" />
                      <title>Not offered</title>
                    </svg>
                  ) : (
                    <span className={`inline-flex items-start gap-2 ${cell.kind === "yes" && r.us ? "text-crimson" : ""}`}>
                      {r.us && (
                        <svg width="15" height="13" viewBox="0 0 15 13" fill="none" aria-hidden="true" className="mt-1 shrink-0">
                          <path data-check d="M1 6.5 L5.5 11 L14 1.5" stroke="var(--color-crimson)"
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      <span>{cell.label}</span>
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
