"use client";

import { Reveal } from "@/lib/draw-in";

/**
 * The corrected operating model (BRIEF §10).
 *
 * The client's own flowchart models CTLYST as a single founder-side funnel,
 * which contradicts the plan's description of a three-sided market. That
 * flowchart does not appear anywhere on this site. This diagram instead shows:
 * three intake pipelines, sign-up AFTER intake, a human diagnosis step that
 * replaces founder self-selection, two tracks on different clocks, drawn
 * failure states, a loop that returns to diagnosis rather than intake, and a
 * terminal outcome ledger.
 *
 * Every node is tagged Manual / Assisted / Automated, so the diagram doubles as
 * the build backlog: everything starts Manual and graduates as volume justifies
 * it (plan §11.1 — "automating only the steps proven necessary by hand").
 *
 * Labels trace to CTLYSTProjectPlanWEB.html §3.3 (the six steps), §11.1, and
 * §16 Risks (which supplies the failure states). Hand-authored SVG, no
 * diagramming library.
 */

type Tag = "Manual" | "Assisted" | "Automated";
type Node = { id: string; x: number; y: number; w: number; h: number; title: string; sub?: string; tag: Tag; kind?: "fail" | "terminal" };

const W = 1120;
const H = 1580;

const NODES: Node[] = [
  // ── three intake pipelines ──────────────────────────────────────────────
  { id: "in-f", x: 40,  y: 92,  w: 300, h: 92, title: "Founder intake", sub: "Idea and the specific unmet need", tag: "Manual" },
  { id: "in-m", x: 400, y: 92,  w: 300, h: 92, title: "Mentor intake", sub: "Application → credential check", tag: "Manual" },
  { id: "in-s", x: 760, y: 92,  w: 320, h: 92, title: "Scheme registry", sub: "Eligibility, freshness date, source", tag: "Assisted" },

  { id: "onb",  x: 400, y: 232, w: 300, h: 96, title: "Mentor onboarding", sub: "Capacity tracked per mentor", tag: "Manual" },
  { id: "vfy",  x: 760, y: 232, w: 320, h: 96, title: "Verify on the portal", sub: "Terms confirmed before advising", tag: "Assisted" },

  // ── sign-up sits AFTER intake, never before the first useful moment ─────
  { id: "sign", x: 40,  y: 232, w: 300, h: 96, title: "Sign-up", sub: "After intake, never before", tag: "Automated" },

  // ── diagnosis replaces self-selection ──────────────────────────────────
  { id: "diag", x: 340, y: 366, w: 440, h: 104, title: "Diagnosis", sub: "The real bottleneck, not the stated need", tag: "Manual" },

  // ── two parallel tracks on different clocks ────────────────────────────
  { id: "m1", x: 40,  y: 560, w: 300, h: 74, title: "Mentor match", tag: "Manual" },
  { id: "m2", x: 40,  y: 664, w: 300, h: 74, title: "Mentor accepts", tag: "Manual" },
  { id: "m3", x: 40,  y: 768, w: 300, h: 74, title: "Engagement", tag: "Manual" },
  { id: "m4", x: 40,  y: 872, w: 300, h: 74, title: "Milestone review", tag: "Assisted" },

  { id: "c1", x: 780, y: 560, w: 300, h: 74, title: "Eligibility screen", tag: "Assisted" },
  { id: "c2", x: 780, y: 664, w: 300, h: 74, title: "Scheme shortlist", tag: "Assisted" },
  { id: "c3", x: 780, y: 768, w: 300, h: 74, title: "Application support", tag: "Manual" },
  { id: "c4", x: 780, y: 872, w: 300, h: 74, title: "Submission", tag: "Manual" },
  { id: "c5", x: 780, y: 976, w: 300, h: 96, title: "Outcome — disbursal", sub: "Success fee triggers here", tag: "Manual" },

  // ── failure states, drawn rather than assumed ──────────────────────────
  { id: "f1", x: 372, y: 560, w: 250, h: 62, title: "No mentor available", tag: "Manual", kind: "fail" },
  { id: "f2", x: 372, y: 664, w: 250, h: 62, title: "Founder silent 21 days", tag: "Automated", kind: "fail" },
  { id: "f3", x: 372, y: 768, w: 250, h: 62, title: "Stalled at a milestone", tag: "Manual", kind: "fail" },
  { id: "f4", x: 372, y: 872, w: 250, h: 62, title: "Application rejected", tag: "Manual", kind: "fail" },

  // ── terminal ledger ────────────────────────────────────────────────────
  { id: "led", x: 340, y: 1160, w: 440, h: 110, title: "Outcome ledger", sub: "A prototype built · a grant secured — never “a connection made”", tag: "Assisted", kind: "terminal" },
];

const byId = (id: string) => NODES.find((n) => n.id === id)!;
const bottom = (id: string) => { const n = byId(id); return { x: n.x + n.w / 2, y: n.y + n.h }; };
const top = (id: string) => { const n = byId(id); return { x: n.x + n.w / 2, y: n.y }; };

/** Orthogonal connector: down, across, down. */
function elbow(a: { x: number; y: number }, b: { x: number; y: number }) {
  const midY = (a.y + b.y) / 2;
  return `M ${a.x} ${a.y} L ${a.x} ${midY} L ${b.x} ${midY} L ${b.x} ${b.y}`;
}

const EDGES: { d: string; dashed?: boolean }[] = [
  { d: elbow(bottom("in-f"), top("sign")) },
  { d: elbow(bottom("in-m"), top("onb")) },
  { d: elbow(bottom("in-s"), top("vfy")) },
  { d: elbow(bottom("sign"), top("diag")) },
  { d: elbow(bottom("onb"), top("diag")) },
  { d: elbow(bottom("vfy"), top("diag")) },
  // diagnosis splits into two tracks
  { d: elbow(bottom("diag"), top("m1")) },
  { d: elbow(bottom("diag"), top("c1")) },
  // mentor track
  { d: elbow(bottom("m1"), top("m2")) },
  { d: elbow(bottom("m2"), top("m3")) },
  { d: elbow(bottom("m3"), top("m4")) },
  // capital track
  { d: elbow(bottom("c1"), top("c2")) },
  { d: elbow(bottom("c2"), top("c3")) },
  { d: elbow(bottom("c3"), top("c4")) },
  { d: elbow(bottom("c4"), top("c5")) },
  // into the ledger
  { d: elbow(bottom("m4"), top("led")) },
  { d: elbow(bottom("c5"), top("led")) },
  // failure branches
  { d: `M 340 597 L 372 597`, dashed: true },
  { d: `M 340 701 L 372 701`, dashed: true },
  { d: `M 340 805 L 372 805`, dashed: true },
  { d: `M 780 909 L 622 909`, dashed: true },
];

/** Every loop returns to diagnosis — never to intake. */
const LOOPS: string[] = [
  // ledger back up to diagnosis, around the left
  `M 340 1215 L 16 1215 L 16 418 L 340 418`,
  // the failure column also returns to diagnosis
  `M 497 934 L 497 1010 L 300 1010 L 300 470`,
];

const TAG_COLOUR: Record<Tag, string> = {
  Manual: "var(--color-crimson)",
  Assisted: "var(--color-gold)",
  Automated: "var(--color-muted)",
};

export function ProcessDiagram() {
  return (
    <Reveal className="mt-12" selector="[data-node]" stagger={0.035}>
      <figure>
        <figcaption className="t-caption mb-6 max-w-[70ch]">
          Three intake pipelines, not one. Sign-up follows intake. Diagnosis reframes the
          stated need. The mentor and capital tracks run on different clocks, and the
          success fee triggers on the capital track at disbursal. Failure states are drawn,
          not assumed — and every loop returns to diagnosis, never to intake.
        </figcaption>

        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[900px]" role="img"
               aria-label="The CTLYST operating model: three intake pipelines feeding a human diagnosis step, then parallel mentor and capital tracks with explicit failure states, terminating in an outcome ledger.">
            {/* edges */}
            <g fill="none" stroke="var(--color-rule)" strokeWidth="1.5">
              {EDGES.map((e, i) => (
                <path key={i} data-draw d={e.d} strokeDasharray={e.dashed ? "5 5" : undefined} />
              ))}
            </g>
            {/* loops back to diagnosis */}
            <g fill="none" stroke="var(--color-crimson)" strokeWidth="1.5" opacity="0.55">
              {LOOPS.map((d, i) => <path key={i} data-draw d={d} strokeDasharray="2 6" />)}
            </g>

            {/* nodes */}
            {NODES.map((n) => (
              <g key={n.id} data-node>
                <rect
                  x={n.x} y={n.y} width={n.w} height={n.h}
                  fill={n.kind === "terminal" ? "var(--color-paper-warm)" : "var(--color-paper)"}
                  stroke={n.kind === "fail" ? "var(--color-muted)" : "var(--color-ink)"}
                  strokeWidth={n.kind === "terminal" ? 2 : 1}
                  strokeDasharray={n.kind === "fail" ? "4 4" : undefined}
                />
                <text x={n.x + 18} y={n.y + 32} fontFamily="var(--font-display)" fontSize="21"
                      fontWeight="500" fill="var(--color-ink)">
                  {n.title}
                </text>
                {n.sub && (
                  <text x={n.x + 18} y={n.y + 56} fontFamily="var(--font-body)" fontSize="15"
                        fontStyle="italic" fill="var(--color-ink-soft)">
                    {n.sub}
                  </text>
                )}
                <text x={n.x + 18} y={n.y + n.h - 12} fontFamily="var(--font-mono)" fontSize="10"
                      letterSpacing="2.4" fill={TAG_COLOUR[n.tag]}>
                  {n.tag.toUpperCase()}
                </text>
              </g>
            ))}

            {/* track labels */}
            <text x="40" y="530" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="3"
                  fill="var(--color-muted)">MENTOR TRACK</text>
            <text x="780" y="530" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="3"
                  fill="var(--color-muted)">CAPITAL TRACK</text>
            <text x="372" y="530" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="3"
                  fill="var(--color-muted)">FAILURE STATES</text>
          </svg>
        </div>

        <div className="t-mono-label mt-6 flex flex-wrap gap-6 text-muted">
          <span><span className="text-crimson">■</span> Manual</span>
          <span><span className="text-gold">■</span> Assisted</span>
          <span><span className="text-muted">■</span> Automated</span>
        </div>
      </figure>
    </Reveal>
  );
}
