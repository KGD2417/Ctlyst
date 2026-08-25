"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);

/**
 * Hovered column expands, the other two compress (§8).
 *
 * Three things made the first version stutter and cut off:
 *
 *  1. Every hover started a fresh Flip without killing the one still running, so
 *     sweeping across three cards left three overlapping tweens, each measuring
 *     a half-animated layout.
 *  2. `Flip.getState()` → `setState()` → `requestAnimationFrame()` was a guess:
 *     React had not necessarily committed by that frame, so Flip sometimes
 *     measured the OLD layout and jumped. The state is now captured in the event
 *     handler and replayed in `useLayoutEffect`, which runs after the commit and
 *     before paint — no guessing.
 *  3. The real visual problem was not the box at all: changing column widths
 *     re-wrapped the paragraph inside, and no layout animation can smooth text
 *     reflowing. The copy now sits at a fixed width — the compressed width — so
 *     it never re-wraps in any state, and the space the expansion frees is used
 *     to reveal a detail line instead.
 *
 * INV-3 holds: Flip animates the layout, it is not a scale transform.
 */

const PILLARS = [
  {
    n: "Pillar I",
    title: "Students & Aspiring Founders",
    body: "The demand side. Founders articulate what they are building and precisely where they are stuck — that clarity of need drives every match we make.",
    detail: "Technical expertise, prototype development, operations, or mentorship — the stated need is the input, not the answer.",
  },
  {
    n: "Pillar II",
    title: "Retired Experts & Veterans",
    body: "Our signature supply pool: retired engineers, professors, and industry veterans with decades of hard-won experience — motivated by purpose, untapped by every other platform.",
    detail: "They contribute in advisory or hands-on roles, filling technical and managerial gaps.",
  },
  {
    n: "Pillar III",
    title: "Funding, Schemes & Incubation",
    body: "₹10,000 crore in the Fund of Funds. ₹945 crore in seed funding. Grants up to ₹20 lakh for prototypes. We map you to what you qualify for — then help you win it.",
    detail: "Many remain under-leveraged purely through low awareness. We match founders to what they actually qualify for, then support the application and the follow-through.",
  },
];

const EXPANDED = 1.4;
const COMPRESSED = 0.8;
const TOTAL = EXPANDED + COMPRESSED * 2; // 3.0
const GAP = 24; // gap-6
const PAD = 64; // p-8, both sides

export function TriFold() {
  const grid = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const pending = useRef<Flip.FlipState | null>(null);
  const running = useRef<gsap.core.Timeline | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  /**
   * Pin the copy to the compressed column width so it never re-wraps. Written
   * straight to a custom property rather than through React state — this is a
   * measurement of the DOM, and round-tripping it through a render would both
   * trip the setState-in-effect rule and arrive a frame late.
   */
  useEffect(() => {
    const el = grid.current;
    if (!el) return;
    const sync = () => {
      const single = window.matchMedia("(max-width: 767px)").matches;
      if (single) {
        el.style.removeProperty("--pillar-copy-w");
        return;
      }
      const inner = el.clientWidth - GAP * 2;
      el.style.setProperty("--pillar-copy-w", `${Math.max(0, Math.round(inner * (COMPRESSED / TOTAL)) - PAD)}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  // Replay the captured layout AFTER React commits, before the browser paints.
  useLayoutEffect(() => {
    const state = pending.current;
    pending.current = null;
    if (!state) return;
    running.current?.kill(); // never let two Flips fight over the same boxes
    running.current = Flip.from(state, {
      duration: 0.5,
      ease: "power3.out",
      nested: true,
      // an in-flight Flip is interrupted cleanly rather than compounding
      onComplete: () => { running.current = null; },
    });
  }, [open]);

  const focus = (i: number | null) => {
    if (i === open) return;
    if (reduced.current || !grid.current) { setOpen(i); return; }
    pending.current = Flip.getState(grid.current.querySelectorAll("[data-pillar]"));
    setOpen(i);
  };

  const cols =
    open === null
      ? "1fr 1fr 1fr"
      : [0, 1, 2].map((i) => `${i === open ? EXPANDED : COMPRESSED}fr`).join(" ");

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
            className={`overflow-hidden border p-8 transition-colors duration-[280ms] ${
              open === i ? "border-crimson bg-paper-warm" : "border-rule bg-paper"
            }`}
          >
            {/* Fixed width: the copy is pinned to the compressed column so it
                never re-wraps while the box animates. */}
            <div className="md:w-[var(--pillar-copy-w)]">
              <span className="t-mono-label text-gold">{p.n}</span>
              <h3 className="t-subhead mt-4">{p.title}</h3>
              <p className="mt-3 text-ink-soft">{p.body}</p>
            </div>

            {/* The space the expansion frees is used, not left as dead air. */}
            <p
              aria-hidden={open !== i}
              className={`t-caption mt-5 border-t border-rule pt-4 transition-opacity duration-[420ms] md:w-[var(--pillar-copy-w)] ${
                open === i ? "opacity-100" : "opacity-0"
              }`}
            >
              {p.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
