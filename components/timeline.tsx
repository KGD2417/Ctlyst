"use client";

import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsapContext } from "@/lib/use-gsap";

gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger);

/**
 * A vertical rule draws down the page and each stage's dot fills crimson as the
 * rule passes it (§8). This is genuinely a timeline, which is why numbered
 * markers are earned here and only here.
 */

const STAGES = [
  { when: "Weeks 1–3 · Discovery", title: "Fifteen to twenty honest conversations",
    body: "Direct discovery talks with student and early founders. We listen for the single most common, most painful bottleneck — the one that recurs across many voices, not one-off complaints." },
  { when: "Weeks 3–6 · Micro-pilot", title: "Two to three founders, helped end-to-end",
    body: "Manual matches: a committed mentor plus three to five mapped schemes for each founder, with personal support on the next step. Success signal: at least one founder visibly moves forward." },
  { when: "Months 2–4 · First cohort", title: "A small cohort and a first partner",
    body: "A structured founder cohort, and one institutional or CSR partnership signed. Success signal: repeat demand, and the first paying relationship." },
  { when: "Months 4–12 · Platform", title: "A lightweight platform, earned by evidence",
    body: "An intake form, a mentor database, a searchable scheme library — automating only the steps proven necessary by hand. Success signal: a repeatable model that holds quality at lower effort." },
  { when: "Years 2–3 · Scale test", title: "A second city, then a third",
    body: "Replication of the city playbook, sustainable unit economics — or a clear-eyed pivot. We measure ourselves against outcomes, not optimism." },
];

export function Timeline() {
  const scope = useGsapContext<HTMLDivElement>((_ctx, ref) => {
    const root = ref.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(q("[data-rule]"), { drawSVG: "100%" });
      gsap.set(q("[data-dot]"), { fill: "var(--color-crimson)" });
      gsap.set(q("[data-stage]"), { opacity: 1 });
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // the rule draws as you scroll the section
      gsap.fromTo(q("[data-rule]"), { drawSVG: "0%" }, {
        drawSVG: "100%", ease: "none",
        scrollTrigger: { trigger: root, start: "top 72%", end: "bottom 82%", scrub: 0.6 },
      });

      q<HTMLElement>("[data-stage]").forEach((stage) => {
        const dot = stage.querySelector("[data-dot]");
        gsap.from(stage, {
          opacity: 0, y: 22, duration: 0.56, ease: "power3.out",
          scrollTrigger: { trigger: stage, start: "top 82%", once: true },
        });
        if (dot) {
          gsap.to(dot, {
            fill: "var(--color-crimson)", duration: 0.34, ease: "power3.out",
            scrollTrigger: { trigger: stage, start: "top 74%", once: true },
          });
        }
      });
    });
  }, []);

  return (
    <div ref={scope} className="relative mt-12 pl-12">
      {/* the drawn rule */}
      <svg className="pointer-events-none absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px overflow-visible" aria-hidden="true" preserveAspectRatio="none">
        <line data-rule x1="0.5" y1="0" x2="0.5" y2="100%" stroke="var(--color-crimson)" strokeWidth="1.5" />
      </svg>

      <ol className="list-none">
        {STAGES.map((s, i) => (
          <li key={s.title} data-stage className="relative pb-14 last:pb-0">
            <svg className="absolute -left-12 top-1 h-4 w-4 overflow-visible" aria-hidden="true">
              <circle data-dot cx="8" cy="8" r="7" fill="var(--color-paper)"
                      stroke="var(--color-crimson)" strokeWidth="1" />
            </svg>
            <p className="t-mono-label text-gold">
              <span className="text-crimson">{String(i + 1).padStart(2, "0")}</span>
              <span className="px-3 text-rule">/</span>
              {s.when}
            </p>
            <h3 className="t-subhead mt-3">{s.title}</h3>
            <p className="mt-2 max-w-[64ch] text-ink-soft">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
