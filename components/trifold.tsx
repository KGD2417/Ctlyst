"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);

const PILLARS = [
  { n: "Pillar I",   title: "Students & Aspiring Founders", body: "The demand side. Founders articulate what they are building and precisely where they are stuck — that clarity of need drives every match we make." },
  { n: "Pillar II",  title: "Retired Experts & Veterans",   body: "Our signature supply pool: retired engineers, professors, and industry veterans with decades of hard-won experience — motivated by purpose, untapped by every other platform." },
  { n: "Pillar III", title: "Funding, Schemes & Incubation", body: "₹10,000 crore in the Fund of Funds. ₹945 crore in seed funding. Grants up to ₹20 lakh for prototypes. We map you to what you qualify for — then help you win it." },
];

/**
 * Hovered column expands, the other two compress.
 *
 * INV-3: this is a Flip *layout* animation — the grid template changes and Flip
 * tweens the resulting geometry. It is not a scale transform, which would
 * distort the type inside the column.
 */
export function TriFold() {
  const grid = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  const focus = (i: number | null) => {
    const el = grid.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setOpen(i); return; }
    const state = Flip.getState(el.querySelectorAll("[data-pillar]"));
    setOpen(i);
    requestAnimationFrame(() => {
      Flip.from(state, { duration: 0.56, ease: "power3.out", absolute: false, nested: true });
    });
  };

  const cols = open === null
    ? "1fr 1fr 1fr"
    : [0, 1, 2].map((i) => (i === open ? "1.9fr" : "0.8fr")).join(" ");

  return (
    <section className="mx-auto max-w-[1180px] px-8 py-24" aria-labelledby="trifold-heading">
      <h2 className="t-mono-label text-gold">III. The Tri-Fold Ecosystem</h2>
      <h2 id="trifold-heading" className="t-display-m mt-6">
        Three pillars. One <em className="italic text-crimson">hand-held</em> journey.
      </h2>

      <div
        ref={grid}
        className="mt-12 grid gap-6 md:[grid-template-columns:var(--cols)]"
        style={{ ["--cols" as string]: cols }}
        onMouseLeave={() => focus(null)}
      >
        {PILLARS.map((p, i) => (
          <article
            key={p.n}
            data-pillar
            data-cursor
            tabIndex={0}
            onMouseEnter={() => focus(i)}
            onFocus={() => focus(i)}
            className={`border p-8 transition-colors duration-[280ms] ${
              open === i ? "border-crimson bg-paper-warm" : "border-rule bg-paper"
            }`}
          >
            <span className="t-mono-label text-gold">{p.n}</span>
            <h3 className="t-subhead mt-4">{p.title}</h3>
            <p className="mt-3 text-ink-soft">{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
