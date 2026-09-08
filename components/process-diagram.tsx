"use client";

import { Reveal } from "@/lib/draw-in";

/**
 * The corrected operating model (BRIEF §10).
 *
 * The client's own flowchart models CTLYST as a single founder-side funnel,
 * which contradicts the plan's description of a three-sided market. That
 * flowchart does not appear anywhere on this site. This diagram instead shows:
 * two intake pipelines, sign-up AFTER intake, a human diagnosis step that
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
type Node = { id: string; x: number; y: number; w: number; h: number; title: string; sub?: string; tag: Tag; kind?: "fail" | "terminal" | "focus" };

const W = 1120;
const H = 1420;

// Column geometry, declared once — every node and every elbow is derived from
// these, so a column can move without hand-editing twenty coordinates.
const MENTOR = { x: 40, w: 300 };
const FAIL   = { x: 380, w: 260 };
const CAPITAL= { x: 760, w: 320 };
const ROW    = (i: number) => 545 + i * 104;

const NODES: Node[] = [
  // ── two intake pipelines, founder-side and mentor-side ──────────────────
  { id: "in-f", x: 60,  y: 80,  w: 420, h: 96, title: "Founder intake", sub: "Idea and the specific unmet need", tag: "Manual" },
  { id: "in-m", x: 640, y: 80,  w: 420, h: 96, title: "Mentor intake", sub: "Application → credential check", tag: "Manual" },

  // sign-up sits AFTER intake, never before the first useful moment
  { id: "sign", x: 60,  y: 224, w: 420, h: 100, title: "Sign-up", sub: "After intake, never before", tag: "Automated" },
  { id: "onb",  x: 640, y: 224, w: 420, h: 100, title: "Mentor onboarding", sub: "Capacity tracked per mentor", tag: "Manual" },

  // ── diagnosis replaces self-selection ──────────────────────────────────
  { id: "diag", x: 340, y: 368, w: 440, h: 104, title: "Diagnosis", sub: "The real bottleneck, not the stated need", tag: "Manual" },

  // ── mentor track ───────────────────────────────────────────────────────
  { id: "m1", ...MENTOR, y: ROW(0), h: 74, title: "Mentor match", tag: "Manual" },
  { id: "m2", ...MENTOR, y: ROW(1), h: 74, title: "Mentor accepts", tag: "Manual" },
  { id: "m3", ...MENTOR, y: ROW(2), h: 74, title: "Engagement", tag: "Manual" },
  { id: "m4", ...MENTOR, y: ROW(3), h: 74, title: "Milestone review", tag: "Assisted" },

  // ── capital track · the scheme registry lives HERE, not at intake: it is
  //    a standing asset the capital track reads, not a queue a person enters ─
  { id: "c1", ...CAPITAL, y: ROW(0), h: 74, title: "Eligibility screen", tag: "Assisted", kind: "focus" },
  { id: "c2", ...CAPITAL, y: ROW(1), h: 74, title: "Scheme registry", tag: "Assisted" },
  { id: "c3", ...CAPITAL, y: ROW(2), h: 74, title: "Scheme shortlist", tag: "Assisted" },
  { id: "c4", ...CAPITAL, y: ROW(3), h: 74, title: "Application support", tag: "Manual" },
  { id: "c5", ...CAPITAL, y: ROW(4), h: 74, title: "Submission", tag: "Manual" },
  { id: "c6", ...CAPITAL, y: ROW(5), h: 96, title: "Outcome — disbursal", sub: "Success fee triggers here", tag: "Manual" },

  // ── failure states, drawn rather than assumed ──────────────────────────
  { id: "f1", ...FAIL, y: ROW(0) + 6, h: 62, title: "No mentor available", tag: "Manual", kind: "fail" },
  { id: "f2", ...FAIL, y: ROW(1) + 6, h: 62, title: "Founder silent 21 days", tag: "Automated", kind: "fail" },
  { id: "f3", ...FAIL, y: ROW(2) + 6, h: 62, title: "Stalled at a milestone", tag: "Manual", kind: "fail" },
  { id: "f4", ...FAIL, y: ROW(4) + 6, h: 62, title: "Application rejected", tag: "Manual", kind: "fail" },

  // ── terminal ledger ────────────────────────────────────────────────────
  { id: "led", x: 340, y: 1240, w: 440, h: 110, title: "Outcome ledger", sub: "A prototype built · a grant secured — never “a connection made”", tag: "Assisted", kind: "terminal" },
];

const byId = (id: string) => NODES.find((n) => n.id === id)!;
const bottom = (id: string) => { const n = byId(id); return { x: n.x + n.w / 2, y: n.y + n.h }; };
const top = (id: string) => { const n = byId(id); return { x: n.x + n.w / 2, y: n.y }; };
const midY = (id: string) => { const n = byId(id); return n.y + n.h / 2; };

/** Orthogonal connector: down, across, down. */
function elbow(a: { x: number; y: number }, b: { x: number; y: number }) {
  const my = (a.y + b.y) / 2;
  return `M ${a.x} ${a.y} L ${a.x} ${my} L ${b.x} ${my} L ${b.x} ${b.y}`;
}

const chain = (ids: string[]) => ids.slice(1).map((id, i) => ({ d: elbow(bottom(ids[i]), top(id)) }));

const EDGES: { d: string; dashed?: boolean }[] = [
  { d: elbow(bottom("in-f"), top("sign")) },
  { d: elbow(bottom("in-m"), top("onb")) },
  { d: elbow(bottom("sign"), top("diag")) },
  { d: elbow(bottom("onb"), top("diag")) },
  // diagnosis splits into two tracks
  { d: elbow(bottom("diag"), top("m1")) },
  { d: elbow(bottom("diag"), top("c1")) },
  ...chain(["m1", "m2", "m3", "m4"]),
  ...chain(["c1", "c2", "c3", "c4", "c5", "c6"]),
  // into the ledger
  { d: elbow(bottom("m4"), top("led")) },
  { d: elbow(bottom("c6"), top("led")) },
  // failure branches: sideways out of the step that can fail
  { d: `M ${MENTOR.x + MENTOR.w} ${midY("f1")} L ${FAIL.x} ${midY("f1")}`, dashed: true },
  { d: `M ${MENTOR.x + MENTOR.w} ${midY("f2")} L ${FAIL.x} ${midY("f2")}`, dashed: true },
  { d: `M ${MENTOR.x + MENTOR.w} ${midY("f3")} L ${FAIL.x} ${midY("f3")}`, dashed: true },
  { d: `M ${CAPITAL.x} ${midY("f4")} L ${FAIL.x + FAIL.w} ${midY("f4")}`, dashed: true },
];

/** Every loop returns to diagnosis — never to intake. */
const LOOPS: string[] = [
  // the ledger back up to diagnosis, around the outside
  `M 340 1295 L 16 1295 L 16 420 L 340 420`,
  // the failure column also returns to diagnosis, in the gutter between tracks
  `M 510 ${ROW(4) + 68} L 510 1150 L 360 1150 L 360 420 L 340 420`,
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
          Two intake pipelines — founder-side and mentor-side — and sign-up follows
          intake rather than gating it. Diagnosis reframes the stated need. The mentor and capital tracks run on different clocks, and the
          success fee triggers on the capital track at disbursal. Failure states are drawn,
          not assumed — and every loop returns to diagnosis, never to intake.
        </figcaption>

        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[900px]" role="img"
               aria-label="The CTLYST operating model: founder and mentor intake pipelines feeding a human diagnosis step, then parallel mentor and capital tracks with explicit failure states, terminating in an outcome ledger.">
            {/* edges */}
            <g fill="none" stroke="color-mix(in srgb, var(--color-ink) 26%, transparent)" strokeWidth="1.5">
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
                  fill={n.kind === "terminal" || n.kind === "focus" ? "var(--color-paper-warm)" : "var(--color-paper)"}
                  stroke={n.kind === "fail" ? "var(--color-muted)" : n.kind === "focus" ? "var(--color-gold)" : "var(--color-ink)"}
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
            <text x={MENTOR.x} y="512" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="3"
                  fill="var(--color-muted)">MENTOR TRACK</text>
            <text x={FAIL.x} y="512" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="3"
                  fill="var(--color-muted)">FAILURE STATES</text>
            <text x={CAPITAL.x} y="512" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="3"
                  fill="var(--color-muted)">CAPITAL TRACK</text>
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
