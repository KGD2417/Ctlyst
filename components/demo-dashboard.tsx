"use client";

import { useState } from "react";
import { FOUNDERS, LEDGER, MENTOR_BENCH, REGISTRY, type Founder, type Step } from "@/lib/demo-data";
import { riseIn } from "@/lib/ui-motion";
import { useReducedMotion } from "@/lib/use-gsap";

/**
 * The pitch instrument (/demo).
 *
 * Deliberately NOT a product: no auth, no persistence, no writes. It exists so
 * the founder can stand in front of a college, an incubator or a CSR officer and
 * show the operating model running, instead of describing it.
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
          <h3 className="t-display-m">{f.name}</h3>
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

export function DemoDashboard() {
  const [selected, setSelected] = useState(FOUNDERS[0].id);
  const reduced = useReducedMotion();
  const founder = FOUNDERS.find((f) => f.id === selected)!;

  const pick = (id: string) => {
    setSelected(id);
    if (reduced) return;
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>("[data-detail]");
      if (el) riseIn(el, { duration: 0.4 });
    });
  };

  return (
    <div className="mx-auto max-w-[1180px] px-6 md:px-8">
      {/* the caseload */}
      <h3 className="t-mono-label text-gold">Founders in the loop</h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FOUNDERS.map((f) => {
          const on = f.id === selected;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => pick(f.id)}
              aria-pressed={on}
              className={`border p-5 text-left transition-colors duration-[280ms] ${
                on ? "border-crimson bg-paper-warm" : "border-rule bg-paper hover:border-ink-soft"
              }`}
            >
              <span className="t-mono-label block text-muted">{f.city}</span>
              <span className={`t-subhead mt-2 block ${on ? "text-crimson" : ""}`}>{f.name}</span>
              <span className="t-caption mt-1 block">{f.venture}</span>
              {f.alert && <span className="t-mono-label mt-3 block text-crimson">needs attention</span>}
            </button>
          );
        })}
      </div>

      <div data-detail className="mt-8">
        <Detail f={founder} />
      </div>

      {/* supply side + registry, the two pipelines a founder never sees */}
      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <section>
          <h3 className="t-mono-label text-gold">Mentor bench · capacity</h3>
          <ul className="mt-5 border-t border-ink">
            {MENTOR_BENCH.map((m) => (
              <li key={m.name + m.field} className="flex items-center justify-between gap-4 border-b border-rule py-4">
                <div>
                  <p className={m.name === "—" ? "text-muted" : "text-ink"}>
                    {m.name === "—" ? "no mentor on bench" : m.name}
                  </p>
                  <p className="t-caption">{m.field}</p>
                </div>
                <div className="flex items-center gap-2" aria-label={`${m.load} of ${m.cap} slots used`}>
                  {Array.from({ length: Math.max(m.cap, 1) }).map((_, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className={`h-2 w-6 border ${
                        m.cap === 0 ? "border-dashed border-muted" : i < m.load ? "border-crimson bg-crimson" : "border-rule"
                      }`}
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="t-mono-label text-gold">Scheme registry · freshness</h3>
          <ul className="mt-5 border-t border-ink">
            {REGISTRY.map((r) => (
              <li key={r.scheme} className="flex items-center justify-between gap-4 border-b border-rule py-4">
                <p className="text-ink">{r.scheme}</p>
                <p className={`t-mono-label shrink-0 ${r.state === "stale" ? "text-crimson" : "text-muted"}`}>
                  {r.checked}
                  {r.state === "stale" && " · re-verify"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* the terminal ledger */}
      <section className="mt-16">
        <h3 className="t-mono-label text-gold">Outcome ledger · closed loops</h3>
        <p className="t-lede mt-3 max-w-[62ch]">
          Success is a prototype built or a grant secured — never a connection made.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                {["Founder", "Outcome", "Award", "Our fee", "When"].map((h) => (
                  <th key={h} className="t-mono-label border-b border-t-2 border-ink px-4 py-3 text-left text-ink">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LEDGER.map((l) => (
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
      </section>
    </div>
  );
}
