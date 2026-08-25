import type { ReactNode } from "react";
import { Reveal } from "@/lib/draw-in";

export type Row = { n: string; title: string; body: ReactNode };

/** The editorial ledger row used across /model, /why and /join. */
export function Ledger({ rows }: { rows: Row[] }) {
  return (
    <Reveal className="mt-10 border-t border-ink">
      {rows.map((r) => (
        <div
          key={r.n + r.title}
          data-row
          className="grid gap-x-8 border-b border-rule py-7 transition-[background-color,padding-left] duration-[350ms] hover:bg-paper-warm hover:pl-5 md:grid-cols-[70px_300px_1fr]"
        >
          <span className="font-display text-xl text-gold">{r.n}</span>
          <h3 className="t-subhead">{r.title}</h3>
          <p className="text-ink-soft md:col-auto">{r.body}</p>
        </div>
      ))}
    </Reveal>
  );
}
