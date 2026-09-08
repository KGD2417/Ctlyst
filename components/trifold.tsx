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
 *  4. Hover was driven by per-card mouseenter and a grid mouseleave, and a
 *     layout animation generates both of those on its own: as the boxes resize,
 *     the browser recomputes what is under the pointer and fires enter/leave
 *     even though the pointer has not moved. Traced from the middle card back to
 *     the left one, the grid received mouseleave with the pointer at x=398,
 *     inside its own box, with relatedTarget an <h3> INSIDE the grid; and card 1
 *     received mouseenter while elementFromPoint said card 0. The state flipped
 *     1 -> 0 -> 1 in 15ms and stuck on the wrong card.
 *
 *     So the open column now follows real pointer MOVEMENT — one pointermove on
 *     the grid, reading its own target — and a leave whose relatedTarget is
 *     still inside the grid is ignored. Events the animation invents carry no
 *     movement, so they can no longer steer it.
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
  const queued = useRef<number | null | undefined>(undefined);
  const reduced = useRef(false);
  // Mirrors `open` for the callbacks that outlive a render — the Flip's
  // onComplete fires after the state it closed over may have moved on. Written
  // in the layout effect below, never during render.
  const openRef = useRef<number | null>(null);

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

  /**
   * The card under a real pointer move — read off the event's own target, so no
   * layout is measured and no synthetic enter/leave can reach this.
   *
   * A point in the grid GAP returns the current column rather than null: the
   * gaps belong to the grid, and treating them as "nothing" collapsed the row to
   * equal thirds every time the pointer crossed one, which moved the boxes,
   * which changed what was under the pointer.
   */
  const onPointerMove = (e: React.PointerEvent) => {
    const card = (e.target as Element).closest("[data-pillar]");
    if (!card) return;
    const cards = [...(grid.current?.querySelectorAll("[data-pillar]") ?? [])];
    focus(cards.indexOf(card));
  };

  /**
   * Only close when the pointer is genuinely outside the grid — checked by
   * COORDINATES, not by relatedTarget. Mid-Flip the browser emits leaves whose
   * relatedTarget is an element inside the grid, and others where it is null;
   * the first kind is easy to filter, the second is indistinguishable from
   * leaving the window. The pointer's own position is unambiguous either way,
   * and it is one rect read on an event that fires a handful of times.
   */
  const onPointerLeave = (e: React.PointerEvent) => {
    const r = grid.current?.getBoundingClientRect();
    if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return;
    focus(null);
  };

  /**
   * While a Flip is in flight the boxes are moving under the pointer, so every
   * pointermove lands on a different card and the state oscillates — measured at
   * eight reversals in one sweep. The animation owns the layout until it
   * settles; the pointer's latest intent is queued and applied once, on
   * completion. At most one transition is ever pending.
   */
  const focus = (i: number | null) => {
    // `undefined` clears the queue; `null` MEANS "close everything". Using null
    // for both made every pointer move over the already-open card queue a
    // collapse, which fired when the Flip finished — the row snapped back to
    // equal thirds half a second after each hover, which is most of what
    // "flickers and glitches out" was.
    if (i === openRef.current) { queued.current = undefined; return; }
    if (running.current) { queued.current = i; return; }
    if (reduced.current || !grid.current) { setOpen(i); return; }
    pending.current = Flip.getState(grid.current.querySelectorAll("[data-pillar]"));
    setOpen(i);
  };

  // Replay the captured layout AFTER React commits, before the browser paints.
  useLayoutEffect(() => {
    openRef.current = open;
    const state = pending.current;
    pending.current = null;
    if (!state) return;
    if (running.current) {
      // kill() stops the tween but leaves the width/transform it was mid-way
      // through writing, so the next Flip would measure a half-animated layout
      // as its destination. The captured state already holds where the boxes
      // visually ARE; the DOM has to hold where they are going.
      running.current.kill();
      gsap.set(grid.current?.querySelectorAll("[data-pillar]") ?? [], {
        clearProps: "width,height,transform,translate,rotate,scale",
      });
    }
    running.current = Flip.from(state, {
      duration: 0.5,
      ease: "power3.out",
      nested: true,
      onComplete: () => {
        running.current = null;
        // apply whatever the pointer asked for while the boxes were busy
        const next = queued.current;
        queued.current = undefined;
        if (next !== undefined && next !== openRef.current) focus(next);
      },
    });
  }, [open]);

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
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {PILLARS.map((p, i) => (
          <article
            key={p.n}
            data-pillar
            data-cursor
            tabIndex={0}
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
