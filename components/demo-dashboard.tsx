"use client";

import { useMemo, useState } from "react";
import { FOUNDERS, LEDGER, MENTOR_BENCH, REGISTRY, type Founder, type Step } from "@/lib/demo-data";
import { riseIn } from "@/lib/ui-motion";
import { useReducedMotion } from "@/lib/use-gsap";

/**
 * The pitch instrument (/demo) — an operations console.
 *
 * Deliberately NOT a product: no auth, no persistence, no writes. It exists so
 * the founder can stand in front of a college, an incubator or a CSR officer and
 * show the operating model running, instead of describing it. It is shaped like
 * the internal tool it would become — a filterable caseload, the two supply
 * pipelines, and the ledger — because that is what an institution recognises.
 *
 * All filtering is derived state computed during render (useMemo). No effects,
 * no stored copies of the list to fall out of sync with the query.
 *
 * Enter/exit uses motion (WAAPI, compositor-driven) rather than the GSAP ticker
 * — this view swaps panels on click, and a click response must never wait behind
 * main-thread work.
 */

const STATE_STYLE: Record<Step["state"], string> = {
  done:    "border-crimson bg-crimson",
  active:  "border-crimson bg-paper",
  blocked: "border-muted bg-paper",
  waiting: "border-rule bg-paper",
};

const TAG_STYLE: Record<Step["tag"], string> = {
  Manual: "text-crimson",
  Assisted: "text-gold",
  Automated: "text-muted",
};

/* ── derived record state ────────────────────────────────────────────────── */

type Status = "Needs attention" | "Held" | "Active";

/** One rule, read off the tracks — never a status field someone forgot to update. */
function statusOf(f: Founder): Status {
  if (f.alert) return "Needs attention";
  if ([...f.mentorTrack, ...f.capitalTrack].some((s) => s.state === "blocked")) return "Held";
  return "Active";
}

const STATUS_STYLE: Record<Status, string> = {
  "Needs attention": "text-crimson",
  Held: "text-gold",
  Active: "text-muted",
};

/** The furthest step actually in play, which is what an operator scans for. */
function stageOf(f: Founder): string {
  const all = [...f.mentorTrack, ...f.capitalTrack];
  return (all.find((s) => s.state === "active") ?? all.findLast((s) => s.state === "done") ?? all[0]).label;
}

const hay = (f: Founder) =>
  `${f.name} ${f.venture} ${f.city} ${f.statedNeed} ${f.diagnosis} ${f.mentor?.name ?? ""} ${f.scheme?.name ?? ""}`.toLowerCase();

/* ── shared chrome ───────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="t-mono-label text-muted">{label}</span>
      {children}
    </label>
  );
}

const CONTROL =
  "border border-rule bg-paper px-3 py-2.5 font-mono text-[0.82rem] text-ink outline-none " +
  "focus:border-crimson";

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={`t-mono-label border-b border-t-2 border-ink px-4 py-3 text-left text-ink ${className}`}>
      {children}
    </th>
  );
}

function Empty({ what }: { what: string }) {
  return (
    <p className="t-caption border border-dashed border-rule px-6 py-10 text-center">
      No {what} match this filter.
    </p>
  );
}

/* ── the case detail ─────────────────────────────────────────────────────── */

function Track({ title, steps }: { title: string; steps: Step[] }) {
  return (
    <div>
      <h4 className="t-mono-label text-muted">{title}</h4>
      <ol className="mt-5 space-y-0">
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span aria-hidden="true" className="absolute left-[7px] top-4 h-full w-px bg-rule" />
            )}
            <span
              aria-hidden="true"
              className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border ${STATE_STYLE[s.state]} ${
                s.state === "blocked" ? "border-dashed" : ""
              }`}
            />
            <div className="min-w-0">
              <p className={`text-[1.02rem] ${s.state === "waiting" ? "text-muted" : "text-ink"}`}>
                {s.label}
                {s.state === "blocked" && <span className="t-mono-label ml-3 text-muted">held</span>}
                {s.state === "active" && <span className="t-mono-label ml-3 text-crimson">now</span>}
              </p>
              {s.note && <p className="t-caption mt-1">{s.note}</p>}
              <p className={`t-mono-label mt-2 ${TAG_STYLE[s.tag]}`}>{s.tag}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Detail({ f }: { f: Founder }) {
  return (
    <article className="border border-rule bg-paper p-8 md:p-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="t-mono-label text-muted">Case {f.id.toUpperCase()}</p>
          <h3 className="t-display-m mt-2">{f.name}</h3>
          <p className="t-lede mt-2">{f.venture}</p>
        </div>
        <p className="t-mono-label text-muted">{f.city} · in since {f.since}</p>
      </div>

      {f.alert && (
        <p className="t-mono-label mt-7 border-l-2 border-crimson bg-paper-warm px-5 py-4 text-crimson">
          {f.alert}
        </p>
      )}

      {/* the pitch moment: stated need vs what diagnosis actually found */}
      <div className="mt-9 grid gap-6 border-y border-rule py-8 md:grid-cols-2">
        <div>
          <h4 className="t-mono-label text-muted">They asked for</h4>
          <p className="mt-3 text-[1.15rem] text-muted line-through decoration-crimson/60">
            {f.statedNeed}
          </p>
        </div>
        <div>
          <h4 className="t-mono-label text-crimson">Diagnosis found</h4>
          <p className="mt-3 text-[1.15rem] text-ink">{f.diagnosis}</p>
        </div>
      </div>
      <p className="t-caption mt-4">{f.reframe}</p>

      <div className="mt-10 grid gap-12 md:grid-cols-2">
        <Track title="Mentor track" steps={f.mentorTrack} />
        <Track title="Capital track" steps={f.capitalTrack} />
      </div>

      {(f.mentor || f.scheme) && (
        <div className="mt-10 grid gap-6 border-t border-rule pt-8 md:grid-cols-2">
          {f.mentor && (
            <div>
              <h4 className="t-mono-label text-muted">Mentor</h4>
              <p className="t-subhead mt-3">{f.mentor.name}</p>
              <p className="mt-1 text-ink-soft">{f.mentor.background}</p>
              <p className="t-caption mt-2">Committed {f.mentor.committed}</p>
            </div>
          )}
          {f.scheme && (
            <div>
              <h4 className="t-mono-label text-muted">Scheme</h4>
              <p className="t-subhead mt-3">{f.scheme.name}</p>
              <p className="mt-1 text-ink-soft">{f.scheme.ask}</p>
              <p className="t-caption mt-2">{f.scheme.status}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ── tabs ────────────────────────────────────────────────────────────────── */

const TABS = [
  { id: "caseload", label: "Caseload" },
  { id: "mentors", label: "Mentor bench" },
  { id: "registry", label: "Scheme registry" },
  { id: "ledger", label: "Outcome ledger" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const CITIES = [...new Set(FOUNDERS.map((f) => f.city))].sort();

export function DemoDashboard() {
  const [tab, setTab] = useState<TabId>("caseload");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [city, setCity] = useState("all");
  const [selected, setSelected] = useState(FOUNDERS[0].id);
  const reduced = useReducedMotion();

  const query = q.trim().toLowerCase();

  const cases = useMemo(
    () =>
      FOUNDERS.filter(
        (f) =>
          (status === "all" || statusOf(f) === status) &&
          (city === "all" || f.city === city) &&
          (!query || hay(f).includes(query)),
      ),
    [query, status, city],
  );

  const mentors = useMemo(
    () => MENTOR_BENCH.filter((m) => !query || `${m.name} ${m.field}`.toLowerCase().includes(query)),
    [query],
  );
  const registry = useMemo(
    () => REGISTRY.filter((r) => !query || r.scheme.toLowerCase().includes(query)),
    [query],
  );
  const ledger = useMemo(
    () =>
      LEDGER.filter(
        (l) => !query || `${l.founder} ${l.venture} ${l.outcome}`.toLowerCase().includes(query),
      ),
    [query],
  );

  // The selection survives filtering; if the filter hides it, the detail panel
  // shows the first row still on screen rather than emptying out.
  const founder = cases.find((f) => f.id === selected) ?? cases[0];
  const attention = FOUNDERS.filter((f) => statusOf(f) === "Needs attention").length;

  const pick = (id: string) => {
    setSelected(id);
    if (reduced) return;
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>("[data-detail]");
      if (el) riseIn(el, { duration: 0.4 });
    });
  };

  const filtersOn = query !== "" || status !== "all" || city !== "all";
  const shown = { caseload: cases.length, mentors: mentors.length, registry: registry.length, ledger: ledger.length }[tab];
  const total = { caseload: FOUNDERS.length, mentors: MENTOR_BENCH.length, registry: REGISTRY.length, ledger: LEDGER.length }[tab];

  return (
    <div className="mx-auto max-w-[1180px] px-6 md:px-8">
      <div className="border border-ink bg-paper">
        {/* ── window chrome ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-paper-warm px-5 py-3">
          <p className="t-mono-label text-ink">CTLYST · Operations Console</p>
          <p className="t-mono-label text-muted">Read-only · illustrative records</p>
        </div>

        {/* ── tabs ─────────────────────────────────────────────────────── */}
        <div role="tablist" aria-label="Console sections" className="flex flex-wrap border-b border-rule">
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => setTab(t.id)}
                className={`t-mono-label border-r border-rule px-5 py-4 transition-colors duration-[280ms] ${
                  on ? "border-b-2 border-b-crimson bg-paper text-crimson" : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── toolbar · search + filters ───────────────────────────────── */}
        <div className="grid gap-4 border-b border-rule px-5 py-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
          <Field label="Search">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="name, venture, city, scheme…"
              className={CONTROL}
            />
          </Field>

          {/* The two record filters only mean anything against the caseload, so
              they are disabled rather than hidden — a control that vanishes
              makes the toolbar jump on every tab change. */}
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "all" | Status)}
              disabled={tab !== "caseload"}
              className={`${CONTROL} disabled:text-muted`}
            >
              <option value="all">All statuses</option>
              <option value="Needs attention">Needs attention</option>
              <option value="Held">Held</option>
              <option value="Active">Active</option>
            </select>
          </Field>

          <Field label="City">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={tab !== "caseload"}
              className={`${CONTROL} disabled:text-muted`}
            >
              <option value="all">All cities</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => { setQ(""); setStatus("all"); setCity("all"); }}
              disabled={!filtersOn}
              className="t-mono-label border border-rule px-4 py-3 text-muted transition-colors duration-[280ms] hover:text-ink disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>

        {/* ── the active table ─────────────────────────────────────────── */}
        <div className="px-5 py-6">
          {tab === "caseload" && (
            cases.length === 0 ? <Empty what="cases" /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse">
                  <caption className="sr-only">Founder caseload</caption>
                  <thead>
                    <tr>
                      <Th className="whitespace-nowrap">Ref</Th><Th className="whitespace-nowrap">Founder</Th><Th>Venture</Th>
                      <Th className="whitespace-nowrap">City</Th><Th className="whitespace-nowrap">Week</Th>
                      <Th className="whitespace-nowrap">Current step</Th><Th className="whitespace-nowrap">Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((f) => {
                      const st = statusOf(f);
                      const on = founder?.id === f.id;
                      return (
                        <tr
                          key={f.id}
                          onClick={() => pick(f.id)}
                          aria-selected={on}
                          className={`cursor-pointer transition-colors duration-[280ms] ${
                            on ? "bg-paper-warm" : "hover:bg-paper-warm/60"
                          }`}
                        >
                          <td className="whitespace-nowrap border-b border-rule px-4 py-3 font-mono text-[0.8rem] text-muted">
                            {f.id.toUpperCase()}
                          </td>
                          <th scope="row" className="whitespace-nowrap border-b border-rule px-4 py-3 text-left font-normal">
                            {/* the focusable handle — the row itself is a mouse affordance only */}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); pick(f.id); }}
                              className={`text-left ${on ? "text-crimson" : "text-ink"}`}
                            >
                              {f.name}
                            </button>
                          </th>
                          <td className="border-b border-rule px-4 py-3 text-ink-soft">{f.venture}</td>
                          <td className="whitespace-nowrap border-b border-rule px-4 py-3 text-ink-soft">{f.city}</td>
                          <td className="whitespace-nowrap border-b border-rule px-4 py-3 font-mono text-[0.82rem] text-muted">{f.since}</td>
                          <td className="whitespace-nowrap border-b border-rule px-4 py-3 text-ink-soft">{stageOf(f)}</td>
                          <td className={`t-mono-label whitespace-nowrap border-b border-rule px-4 py-3 ${STATUS_STYLE[st]}`}>{st}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === "mentors" && (
            mentors.length === 0 ? <Empty what="mentors" /> : (
              <ul className="border-t-2 border-ink">
                {mentors.map((m) => (
                  <li key={m.name + m.field} className="flex items-center justify-between gap-4 border-b border-rule py-4">
                    <div>
                      <p className={m.name === "—" ? "text-muted" : "text-ink"}>
                        {m.name === "—" ? "no mentor on bench" : m.name}
                      </p>
                      <p className="t-caption">{m.field}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`t-mono-label ${m.cap === 0 ? "text-crimson" : m.load >= m.cap ? "text-gold" : "text-muted"}`}>
                        {m.cap === 0 ? "Gap" : m.load >= m.cap ? "Full" : `${m.cap - m.load} free`}
                      </span>
                      <span className="flex items-center gap-2" aria-label={`${m.load} of ${m.cap} slots used`}>
                        {Array.from({ length: Math.max(m.cap, 1) }).map((_, i) => (
                          <span
                            key={i}
                            aria-hidden="true"
                            className={`h-2 w-6 border ${
                              m.cap === 0 ? "border-dashed border-muted" : i < m.load ? "border-crimson bg-crimson" : "border-rule"
                            }`}
                          />
                        ))}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === "registry" && (
            registry.length === 0 ? <Empty what="schemes" /> : (
              <ul className="border-t-2 border-ink">
                {registry.map((r) => (
                  <li key={r.scheme} className="flex items-center justify-between gap-4 border-b border-rule py-4">
                    <p className="text-ink">{r.scheme}</p>
                    <p className={`t-mono-label shrink-0 ${r.state === "stale" ? "text-crimson" : "text-muted"}`}>
                      {r.checked}
                      {r.state === "stale" && " · re-verify"}
                    </p>
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === "ledger" && (
            <>
              <p className="t-lede mb-6 max-w-[62ch]">
                Success is a prototype built or a grant secured — never a connection made.
              </p>
              {ledger.length === 0 ? <Empty what="outcomes" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse">
                    <caption className="sr-only">Closed loops</caption>
                    <thead>
                      <tr>
                        {["Founder", "Outcome", "Award", "Our fee", "When"].map((h) => <Th key={h}>{h}</Th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((l) => (
                        <tr key={l.founder}>
                          <th scope="row" className="border-b border-rule px-4 py-4 text-left align-top font-semibold">
                            {l.founder}
                            <span className="t-caption mt-1 block font-normal">{l.venture}</span>
                          </th>
                          <td className="border-b border-rule px-4 py-4 align-top text-ink-soft">
                            {l.outcome}
                            <span className="t-caption mt-1 block">{l.note}</span>
                          </td>
                          <td className="border-b border-rule px-4 py-4 align-top font-mono text-[0.98rem]">{l.award}</td>
                          <td className="border-b border-rule px-4 py-4 align-top font-mono text-[0.98rem] text-crimson">{l.fee}</td>
                          <td className="border-b border-rule px-4 py-4 align-top text-muted">{l.at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── status bar ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule bg-paper-warm px-5 py-3">
          <p className="t-mono-label text-muted">
            {shown} of {total} shown{filtersOn ? " · filtered" : ""}
          </p>
          <p className="t-mono-label text-muted">
            <span className="text-crimson">{attention}</span> need attention · {MENTOR_BENCH.filter((m) => m.cap > m.load).length} mentor slots free
          </p>
        </div>
      </div>

      {/* the open case sits below the console, at full reading width */}
      {tab === "caseload" && founder && (
        <div data-detail className="mt-8">
          <Detail f={founder} />
        </div>
      )}
    </div>
  );
}
