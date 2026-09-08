# PROGRESS

## Current
Post-L8 revision: smoothness, error sweep, and the /demo pitch instrument.
Blocked on: — (LCP still fails under simulated throttling; see the L8 record)

## Gates passed
- [x] L0 — plan approved 2026-08-25 ("continue"); three questions defaulted, see Assumptions
- [x] L1 — harness verified 2026-08-25. Evidence: `evidence/L1-1-harness-1440.png`,
      `evidence/L1-1-harness-390.png`; measurements in the L1 gate record below
- [x] L2 — shell verified 2026-08-25. Evidence: `evidence/L2-4-curtain-1440.png`,
      `evidence/L2-3-mobilenav-390.png`, `evidence/L2-2-home-1440.png`
- [x] L2b — atmosphere verified 2026-08-25. Evidence: `evidence/L2b-5-empty-1440.png`,
      `evidence/L2b-5-empty-390.png`, `evidence/L2b-4-home-1440.png`
- [x] L3 — preloader verified 2026-08-25. Evidence: `evidence/L3-1-preload-mid.png`,
      `evidence/L3-2-nav-1440.png`
- [x] L4 — home verified 2026-08-25. Evidence: `evidence/L4-1-hero-1440.png`,
      `evidence/L4-2-numbers.png`, `evidence/L4-3-keyboard-panel.png`, `evidence/L4-4-home-390.png`
- [x] L5a — mechanic verified 2026-08-25. Evidence: `evidence/L5a-1-gap-closed.png`
- [x] L5b — shader verified 2026-08-25. Evidence: `evidence/L5b-4-095.png`
- [x] L6 — all four routes verified 2026-08-25. Evidence: `evidence/L6-model-diagram.png`,
      `evidence/L6-why-table.png`, `evidence/L6-schemes-1440.png`, `evidence/L6-roadmap-1440.png`
- [x] L7 — join verified 2026-08-25. Evidence: `evidence/L7-5-form.png`, `evidence/L7-4-sent.png`
- [x] L8 — hardening complete 2026-08-26. **LCP fails under simulated throttling — reported, not hidden.**

## Assumptions (defaulted, not explicitly approved — reversible, flag if wrong)
- Layer C ships at **1.25px / opacity 0.5** on `--rule` (ladder row D), not §9.2's literal values
- L2b + L8 gates measured by **substitute** (rAF frame-time delta; `lighthouse` CLI).
  Both will be reported *as substitutes*, never as devtools-trace numbers
- `/join` posts to a Next route handler with server-side re-validation + JSONL append;
  a single documented seam is left for a real inbox provider

## L1 gate record
| Criterion | Result |
|---|---|
| Inertial scroll | ✓ one wheel tick → 12 decelerating frames (130, 92, 84, 91, 78, 67, 64, 57, 46, 51, 40, 39 px) |
| ScrollTrigger in sync at speed | ✓ 40 rapid wheel ticks; **max drift 0.0000** across all 10 in-range frames |
| Reduced-motion live toggle | ✓ 3 triggers → 1 (fade only), Lenis destroyed, scrub set to final state — **without reload** |
| Route churn ×5 (INV-1) | ✓ 3 → 0 → 3, stable. Drops to **0** when away, so revert genuinely kills |
| `next build` | ✓ compiled, zero type errors |

**INV-6 baseline: 186.6 KB gzipped first-load JS (budget 250 KB); fonts a further 184.8 KB.**
Measured via `PerformanceResourceTiming.encodedBodySize` against `next start` — Next 16
dropped First Load JS from the build table and Turbopack's manifest has no per-route
chunk list, so the browser's own number is the ground truth.
**Only ~63 KB of headroom remains** for atmosphere, preloader, SplitText/Flip/DrawSVG,
`motion`, and six routes. WebGL is dynamically imported so it stays out of first load.
Font payload will need subsetting before L8.

## L2 gate record
| Criterion | Result |
|---|---|
| Transition both directions, all six routes | ✓ 11 navigations, all landed, **612–658ms** (gate: <700ms) |
| No unstyled flash | ✓ body background stayed `--paper` through every transition |
| No double-scrolled content | ✓ scrolled to 172–362 via **real wheel input**, every arrival `scrollY === 0` |
| `ScrollTrigger.refresh()` after paint | ✓ **exactly 1** per nav, always after the destination `h1` is in the DOM, at ~320ms — i.e. while still covered, so the reflow is invisible |
| Cursor off on touch | ✓ real coarse-pointer context: `pointer:coarse` true, no `has-cursor`, native cursor restored |
| Cursor off under reduced motion | ✓ no `has-cursor`, opacity 0, Lenis also not running |
| Cursor grows on interactive | ✓ scale 1.00 at rest → 2.60 over a nav link |
| Focus ring (INV-5) | ✓ 14 focusables, all with 2px solid crimson, all on screen |
| INV-1 with full shell | ✓ 30 navigations (5 rounds × 6 routes): triggers 0, tweens 1, ticker listeners 3 — all flat |

**INV-6: 180.7 KB gzipped. Headroom 69.3 KB.**
`motion` was **removed on user instruction** and the curtain rewritten on GSAP
(`yPercent`, `power3.out`). Saved 20.5 KB — more than the 14.6 estimated, because
`motion` pulled React glue with it. L2 gate re-run after the swap and still passes:
8 navigations, 609–642 ms, all landed, all scroll-reset, no flash.
**Deviation from BRIEF §11**, which lists `motion` as a dependency. Its own rationale
("two libraries doing one job is how these builds bloat") supports the removal.

## L2b gate record
| Criterion | Result |
|---|---|
| Empty shell reads composed, 1440 + 390 | ✓ rosette bleeding left, **Y** cropped right, lathe band low, fibre throughout; nav still reads first |
| Ambient ≤1ms/frame | **Indistinguishable from zero.** First attempt was vsync-clamped (16.7ms both ways, delta 0 — meaningless). Re-measured CPU-bound under a 26ms/frame synthetic load: 32.0 vs 33.3ms, delta **−1.3ms**, i.e. below the method's own noise floor. *Substitute method, not a devtools trace* |
| Grain dynamically imported | ✓ separate chunk `lib_fibre_ts_*.js`; tile applied as a data URI; `hardwareConcurrency <= 4` / coarse-pointer path drops to a 64px, lower-density tile |
| Reduced motion | ✓ 3 shapes remain and stay visible; drift frozen, parallax frozen, no transform written |
| 60s without visible loop / re-sync | ✓ **64s observed**: no shape returned to its start, no two ever in lockstep. Durations 47/61/73s (prime), yoyo, so the true period is 2× and the set cannot realign |
| Mobile cap (§9.5) | ✓ exactly 2 shapes at 390px |
| INV-1 with atmosphere | ✓ 30 navigations: 3 tweens, 3 drift groups, 4 ticker listeners — all flat |

## L3 gate record
| Criterion | Result |
|---|---|
| Gated on `document.fonts.ready` | ✓ raced against an 800ms timeout so slow fonts cannot hold the page either |
| Hard cap 2.2s | ✓ completes at **1817ms**; timeline forced to `progress(1)` at 2200ms, absolute backstop at 3100ms |
| Flip lands pixel-accurate, both breakpoints | ✓ **1440: dx 0.0, dy 0.4, dw 0.3, dh 0.1 px · 390: dx 0.0, dy 0.5 px** |
| Skipped under reduced motion | ✓ preloader never mounts; page settled in 334ms |

**Design correction found by looking:** the preloader drew a stroked SVG monogram while
the navbar was Cormorant text, so the Flip was landing one artwork on top of a different
one — a swap disguised as a transform. Both now render the same `<Monogram/>`, so the
mark genuinely *becomes* the logo. Interpuncts also moved from the baseline to mid
cap-height, where an interpunct belongs.

## L4 gate record
| Criterion | Result |
|---|---|
| Screenshots reviewed, 1440 + 390 | ✓ hero, numbers, walls, band, tri-fold |
| Four-walls keyboard-navigable (INV-5) | ✓ all 4 panels reachable; **heading and body fully in viewport** for each; `scrollLeft` clamped to 0 |
| Four-walls stacks under 768px (INV-4) | ✓ separately-authored stack; no pin, no horizontal overflow |
| Counters scrub, not fire-once | ✓ 4 scrub triggers; under reduced motion they print the final value |
| Tri-fold uses Flip, not scale (INV-3) | ✓ grid-template-columns animated via Flip |
| No invariant regressed | ✓ churn flat over 5 rounds: 5 triggers, 12 tweens, 4 ticker listeners, 6 split lines |
| Reduced motion | ✓ 0 triggers, no pin, no scrub, hero visible, Lenis off |

### §4.2 critique
1. **Would I have produced this for any editorial brief?** The stat row would have been —
   four centred numbers is the default. Changed to left-aligned mono figure with the unit
   in Garamond italic beneath, which is the §7 serif/mono tension doing actual work.
2. **Does the motion serve the content?** The four-walls pin earns it: scrolling *past*
   the walls is hitting them. The counters earn scrub because the figure is the argument.
   The tri-fold Flip earns it because comparing pillars is the reader's actual task.
3. **Anything overlapping or clipping?** Yes, and it was shipped-then-caught: `34,000+`
   and `48%` collided at 1440 because the unit was set inline at display size. Fixed.
4. **Which invariant was most at risk?** INV-5 — and it genuinely failed three times
   before the real cause surfaced.
5. **The one accessory to remove?** The `data-cursor` disc on the tri-fold columns. The
   Flip already says "this column is active"; the cursor saying it too is redundant.
   *Kept for now only because §8 names it explicitly; first thing to cut at L8 if needed.*

## L5 gate record
**L5a — the mechanic**
| Criterion | Result |
|---|---|
| Closing feels weighted and inevitable at 3 scroll speeds | ✓ slow / medium / fast: gap **closes to 0 in all three**, zero widening events, zero overshoot frames |
| The gap actually closes | ✓ 638 → 433 → 229 → 65 → 0 px |

Travel is **measured**, not a guessed percentage: a fixed `xPercent` left a 322px gap
that never closed, which would have made the section meaningless. Measured in
`onRefreshInit`, which runs before ScrollTrigger applies pinning.

**L5b — the shader**
| Criterion | Result |
|---|---|
| Skipped on `hardwareConcurrency <= 4` / `(pointer: coarse)` | ✓ coarse-pointer context: shader absent, DOM seam still present |
| Skipped under reduced motion | ✓ |
| L5a DOM crossfade remains the fallback | ✓ the seam element is always rendered; the shader only layers over it |
| **INV-6: three.js out of first load** | ✓ **202.3 KB at top of page**; the 228.7 KB three chunk arrives only on reaching The Gap |

## L6 gate record
Gated per route, not as a batch.

| Route | Mechanic | Result |
|---|---|---|
| `/model` | **§10 corrected operating model** — hand-authored SVG, DrawSVG stroke-in | ✓ 21 nodes, 23 drawn edges. Three intake pipelines, sign-up after intake, diagnosis replacing self-selection, mentor and capital tracks on separate clocks, four drawn failure states, loops returning to diagnosis, terminal outcome ledger, every node tagged Manual/Assisted/Automated. **The client's single-funnel flowchart does not appear** |
| `/why` | Comparison table — the highest-value target | ✓ competitor rows reveal in sequence with hairline dashes drawing into blank cells; **the CTLYST row arrives last and differently**, a crimson rule drawing across it and checks drawing into each cell. Stays a real `<table>` |
| `/schemes` | Six cards, scrubbed rupee figures, gold perimeter on hover | ✓ |
| `/roadmap` | Vertical rule drawing down, dots filling crimson as it passes | ✓ numbered markers earned here and only here |

| Invariant | All four routes |
|---|---|
| Reduced motion | ✓ 0 triggers, no pin, no scrub, **0 elements left invisible** |
| Mobile 390 | ✓ no pin, no horizontal overflow |
| INV-1 churn | ✓ 3 rounds × 6 routes: 7 triggers, 17 tweens, 4 ticker listeners — flat |
| Page errors | ✓ none |

The `/why` candour section is deliberately held plain — no motion beyond a fade. It is the
most persuasive passage on the site precisely because nobody else writes it, and dressing
it up would undercut that.

## L7 gate record
| Criterion | Result |
|---|---|
| Every field reachable and submittable by keyboard alone (INV-5) | ✓ full run: type → Tab → **Space to pick a role, ArrowDown to change it** → Tab → type → Tab → **Enter sends**. POST 200 |
| Validation announced, not just coloured | ✓ each error carries `aria-describedby` to a real element, fields carry `aria-invalid`, status region is `aria-live`. Focus jumps to the first problem |
| Messages explain and do not apologise | ✓ e.g. *"That address is missing an @ or a domain. Check it and try again."*, *"A little more detail helps — 5 more characters at least."* |
| Reduced motion replaces the seal with a static confirmation | ✓ seal renders at opacity 1 without animating |
| The form actually posts, both states | ✓ **200 + persisted to JSONL**; forced 500 keeps the form mounted and announces the failure |
| Server re-validates (never trusts the client) | ✓ a bypassed client posting `{"name":"x","email":"nope","role":"hacker"}` gets **422** with per-field errors |
| Honeypot | ✓ returns a success shape so a bot learns nothing, and stores nothing |

**Changed the role control from `<select>` to a radio group.** Not cosmetic: no keyboard
gesture commits a native select value in headless Chromium, so that path was
*unverifiable* in this harness. Four mutually exclusive options is what radios are for —
each is individually labelled and announced, arrow keys move natively, and the gate
became testable instead of assumed.

## L8 gate record

### Lighthouse — all six routes, mobile emulation
Default (**simulated / Lantern**) throttling, which is what "simulated Moto G4 / Fast 3G"
in the gate names:

| Route | Performance | Accessibility | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|
| `/` | 96 | **100** | 100 | 2.72s ✗ | 0.002 | 10ms |
| `/model` | 97 | **100** | 100 | 2.56s ✗ | 0.002 | 10ms |
| `/why` | 92 | **100** | 100 | 3.22s ✗ | 0.002 | 10ms |
| `/schemes` | 96 | **100** | 100 | 2.71s ✗ | 0.002 | 10ms |
| `/roadmap` | 97 | **100** | 100 | 2.56s ✗ | 0.002 | 10ms |
| `/join` | 97 | **100** | 100 | 2.56s ✗ | 0.002 | 10ms |

With **applied** throttling (`--throttling-method=devtools`, real 4× CPU + Fast-3G network):

| Route | Performance | FCP | LCP |
|---|---|---|---|
| `/` | 96 | 1.6s | **1.56s ✓** |
| `/why` | 95 | 1.5s | **1.55s ✓** |

### ✗ LCP FAILS THE GATE
The gate is **LCP ≤ 2.5s on simulated Moto G4 / Fast 3G**. Under simulated throttling
every route is between **2.56s and 3.22s**, so *the gate does not pass*. Under applied
throttling the same pages measure 1.55–1.56s. Both are genuine Lighthouse runs; the gate
names the simulated method, so the honest verdict is **fail**, and the passing number is
context rather than a substitute.

What was fixed while chasing it (LCP went 3.76 → 2.72s simulated):
- Font payload 297 KB / 14 files → **161 KB / 6 files** by shipping only the weights used
- The hero rendered at `opacity: 0` awaiting JS, so it was invisible to LCP until the
  reveal ran — the LCP element was measured as the *small gold eyebrow*. Now server-rendered
  visible, with the hidden start state set in a layout effect
- `font-display: optional` was tried and **reverted**: it changed LCP by 0.00s, which is
  what proved the delay was never font-blocked

Remaining headroom is the preloader: it holds an opaque `--paper` overlay for ~1.95s
before the Flip handoff. The L3 gate (preloader capped at 2.2s) and the L8 gate
(LCP ≤ 2.5s simulated) are close to mutually exclusive on a throttled mobile connection.
Resolving it means shortening or conditionally skipping the preloader — a design decision,
not a bug fix, so it is flagged rather than taken unilaterally.

### All eight invariants, verified with evidence
| | Invariant | Verification |
|---|---|---|
| INV-1 | No timeline/ScrollTrigger/raf survives unmount | ✓ **30 navigations** (5 rounds × 6 routes): triggers 7, tweens 17, ticker listeners 4, split lines 6 — every count flat |
| INV-2 | Reduced motion kills pin, scrub, hijack, cursor, WebGL | ✓ all six routes: Lenis off, cursor off, WebGL absent, **0 elements left invisible** |
| INV-3 | Only transform and opacity animate | ✓ greps clean. The L3 Flip was tweening `width`/`height` to reconcile 520px → 131px; `scale: true` pins it to transforms, and the landing is still sub-pixel (dy 0.4px) |
| INV-4 | Every pinned section has a stacked mobile variant | ✓ all six routes at 390px: no pin, no horizontal overflow, 2 ambient shapes |
| INV-5 | Keyboard focus visible and functional everywhere | ✓ all six routes: 34 focusables each, **0 unringed, 0 off-screen**; the horizontal gallery scrolls focused panels fully into view; the form submits by keyboard alone |
| INV-6 | ≤250KB gz first load; WebGL dynamic and skipped on low-end | ✓ worst route **202.4 KB**. three.js (228.7 KB) loads only on approaching The Gap, and not at all on coarse pointer / ≤4 cores |
| INV-7 | No overshooting easings | ✓ grep clean across `app/`, `lib/`, `components/` |
| INV-8 | All copy traces to a source document | ✓ 12/12 spot-checked phrases found in `reference/` |

### Accessibility fixes made at L8
- `aria-prohibited-attr`: SplitText was writing `aria-label` onto bare `<div>`s. Set `aria: "none"` — we split by line, not character, so the text still reads correctly
- `color-contrast`: `--gold` at 3.27:1 and `--muted` at 3.97:1 failed at small sizes.
  Added `--color-gold-ink` / `--color-muted-ink`, darkened until both clear AA on
  `--paper` **and** `--paper-warm`. The inherited palette (§7) is untouched for ornament
  and large type. A first attempt passed only on `--paper` and still failed inside tinted
  cards; a second broke gold on the dark inverted bands until the variant was scoped to
  light ground
- `heading-order`: section eyebrows were `<p>`, so `h1 → h3` skipped a level. They are the
  section heading, so they became `<h2>` with identical styling

## Post-L8 revision (user request)

### 1 · Smoothness — the actual causes
Synthetic scrolling measured a clean 60fps on every route, so the jank was never
reproducible in headless. Three real frame-rate bugs were found by reading the per-frame
code rather than by measuring:

- **Frame-rate-dependent lerps.** Both the cursor (`* 0.18`) and the ambient pointer
  response (`* 0.02`) applied a fixed factor *per frame*. On a 120Hz display they settle
  twice as fast as on 60Hz, and whenever the frame rate fluctuates the motion speed
  fluctuates with it — which is exactly what reads as "glitchy" even with zero dropped
  frames. Both now convert the per-frame factor to a per-second one (`lib/damp.ts`)
- **Unconditional style writes.** The ambient stack rewrote `transform` on two full-screen
  layers every single tick, forever, including on a completely idle page. Now written only
  when a value actually moved
- **Lenis `lerp: 0.1`** trailed the input far enough to read as lag rather than weight →
  `0.14`
- Four full-screen ambient layers were being promoted when only two move; the static wash
  and vignette no longer claim compositor layers

### 2 · `motion` reinstated, with a real division of labour
Re-added on request, and it earns its place rather than duplicating GSAP:

| | Drives | Why |
|---|---|---|
| **motion** (`lib/ui-motion.ts`) | route curtain, hover lifts, one-shot reveals | Web Animations API, so the browser can run transform/opacity on the **compositor**. A JS ticker cannot — every frame must land in main-thread time, so one long task is a visible hitch |
| **GSAP** | scroll-scrubbed timelines, SplitText, DrawSVG, Flip | No WAAPI equivalent: driven by scroll position or needs layout measurement |

Cost: first-load JS 202.4 → **224.1 KB** (budget 250). INV-6 still passes.

### 3 · Error sweep
- **ESLint: 3 errors → 0.** Two were synchronous `setState` inside an effect (React 19
  cascading renders); `useReducedMotion` now uses `useSyncExternalStore`, which is the
  right primitive for a `matchMedia` subscription. One was a use-before-declaration
- **Runtime: 0 page errors, 0 console errors, 0 failed requests** across 24 loads
  (6 routes × 2 breakpoints × 2 motion modes), and 0 across all 7 routes after the demo

### 4 · `/demo` — the pitch instrument
A **demonstration**, labelled as such on the page: illustrative data, no auth, no
persistence, no writes. It exists so the founder can show the operating model running
instead of describing it. Four founders mid-journey, the mentor bench and scheme registry
behind them, and a terminal outcome ledger.

Built to expose the four things a static page can only assert:
1. **Diagnosis overrides the stated need** — "We need funding." struck through, beside what
   diagnosis actually found
2. **The two tracks run on different clocks** — mentor and capital shown in parallel, with
   the capital track deliberately *held* for a founder who has no demand evidence yet
3. **Failure states are handled** — "silent 21 days", "no mentor on bench"
4. **Success is a specific outcome** — the ledger records a founder who shipped with no
   capital raised, and a rejection that re-enters at diagnosis

The lead scenario is the plan's own worked example (agri-tech prototype, ₹20 lakh SISFS
grant, retired production engineer, ₹5 lakh award, illustrative 5% fee = ₹25,000). Names
are invented; the mechanics are not.

Nav is now seven routes with Demo before Join, so the CTA stays last in both the nav and
the tab order. Verified unclipped at 1440, 1280 and 1024.

### Post-revision verification
| Check | Result |
|---|---|
| INV-6 first-load JS | ✓ worst **224.1 KB** of 250 (7 routes) |
| Curtain on motion | ✓ 8 navigations, **628–649ms**, all landed, all covered, no flash, scroll reset every time |
| INV-2 reduced motion | ✓ all 7 routes: Lenis off, cursor off, **0 elements invisible** |
| Errors | ✓ 0 page, 0 console, 0 failed requests |
| ESLint | ✓ clean |
| Cursor + parallax | ✓ cursor scales 1.00 → 2.60; parallax −13.5 → −575px |

## Revision 2 — tri-fold stutter, and The Gap's resolution

### Tri-fold: three compounding bugs
Reported as "lags like crazy, animation gets cut off". All three were real:

1. **Every hover started a new Flip without killing the previous one.** Sweeping across
   three cards left three overlapping tweens, each measuring a half-animated layout —
   that is the "cut off" look.
2. **`Flip.getState()` → `setState()` → `requestAnimationFrame()` was a guess.** React had
   not necessarily committed by that frame, so Flip sometimes measured the *old* layout and
   jumped. State is now captured in the handler and replayed in `useLayoutEffect`, which
   runs after commit and before paint.
3. **The real visual problem was the text, not the box.** Changing column widths re-wrapped
   the paragraph inside, and no layout animation can smooth reflowing text. The copy is now
   pinned to the compressed column width so it never re-wraps in any state, and the space
   the expansion frees reveals a detail line instead of sitting as dead air.

Verified with a **real pointer** sweep at 4× CPU throttle, moving faster (150ms) than the
tween (500ms): widths **285 / 498 / 285**, **0 dropped frames, 0 stutters**, and the
paragraph holds **6 lines in both states** — no reflow.

*A dispatched `mouseenter` does not fire React's `onMouseEnter`* (React synthesises it from
`mouseover` delegation), so the first version of this test reported a flat 60fps while
never actually triggering the animation. Real pointer movement is the only valid test.

### The Gap now resolves into the drawn monogram
Was a plain crossfade. Now: the words meet, the seam wets, each word **folds into the join
from the inside out** — the letters nearest the ink dissolve first — and the CTL·Y·ST
monogram **draws itself out of the bleed**, stroke by stroke, each opening from its own
centre. It is the same mark the preloader draws at load, so the entrance and the signature
close a loop.

Timeline positions here are **seconds, not fractions of the scrub** (~1.15s total), which
is why the first tuning had a stroke appearing while letters were still on the paper.
Verified: at 0.62 two letters remain and the mark has not started; by 0.70 the paper is
clear and it is drawing.

### Verification after both changes
| Check | Result |
|---|---|
| Tri-fold under real pointer, 4× CPU | ✓ 0 dropped, 0 stutters, no text reflow |
| The Gap scroll-through, 4× CPU | ✓ 0 dropped frames |
| INV-6 | ✓ worst **225.1 KB** of 250 |
| INV-1 churn | ✓ 4 rounds × 6 routes: split chars 14, pillars 3 — flat |
| INV-2 reduced motion | ✓ 7 routes, 0 hidden; the Gap shows the **finished** mark, words hidden |
| INV-4 mobile | ✓ no horizontal overflow on any route |
| Errors / ESLint | ✓ zero |

## Revision 3 — the mark goes roman, and the irreversible bits stop reversing

Client feedback on the deployed preview, four items.

**1. The wordmark is roman now.** The navbar mark was mono-line geometric while the footer
wordmark was Cormorant — the same name in two unrelated voices on one screen. Redrew
`MONOGRAM_STROKES` as roman capitals: bracketed serifs on T and the second T, a top serif
and an upturned arm terminal on L, serifed arms and a footed stem on Y, cut vertical
terminals on the C bowl, beaks on the S. Serifs are extra subpaths inside each letter's
own `d`, so DrawSVG still draws one letter at a time and the preloader draw, the L3 Flip
to the navbar, and The Gap's resolve all keep working untouched. Same viewBox, same
advance widths, so nothing reflowed. Evidence: `evidence/roman-mono-large.png`.

**2. Forward-only transitions.** `scrub` is bidirectional by definition, so scrolling back
up unbuilt whatever had just been built. Two places were doing something that shouldn't
un-happen:

- **The Gap.** Replaced `scrub: 0.6` with a hand-driven timeline: a `quickTo` on a plain
  `{ p }` object reproduces the same 0.6s of lag, fed from the *high-water mark* of
  `self.progress`. Downward scroll advances it, upward scroll leaves the resolved mark
  standing until the pin releases. `animation: tl` is still passed to the ScrollTrigger so
  `invalidateOnRefresh` re-measures the travel, with `toggleActions: "none none none none"`
  so it never plays the timeline itself. Evidence: at the pin end `[data-resolve]` is
  opacity 1 and `ideas` sits at x=428.98; after scrolling back to 40% of the pin, both are
  unchanged. `evidence/gap-oneway-scrollup.png`.
- **CountUp.** Held the displayed figure at its own peak. Running a stated figure back
  down to zero reads as the site retracting a fact.

The reversible ones were left alone on purpose: the four walls are spatial navigation and
the timeline rule is a progress indicator — both *should* track the scrollbar both ways.

**3. Cursor damping 0.18 → 0.34.** Settle time roughly halves (~250ms → ~120ms). Still
frame-rate independent through `dampFactor`, so the 120Hz correctness holds.

**4. The curtain no longer prints "VII" over Join.** A roman numeral on the last route read
as a seventh step — as though you had arrived having skipped six things you were meant to
do first. It now prints **The Front Door**, which is the join page's own lede ("this is the
front door", INV-8 satisfied). `numeral`/`numeralFor` renamed to `mark`/`markFor`, and
`markType()` sets words smaller and italic — "The Front Door" at numeral size runs off both
edges of a phone. Evidence: `evidence/curtain-join-frozen.png`.

## Revision 4 — the mark is the type now, not a drawing of it

Revision 3 was the wrong fix. Adding serifs to the stroked SVG made it *roman*,
but it still did not match the footer, and the client named the cause exactly:
"it is probably happening coz ur painting the logo in animation instead of
actually using that font." Correct. A monoline stroke has no thick/thin
modulation and none of Cormorant's proportions — it was a drawing *of* the type.

`lib/monogram.tsx` → `lib/wordmark.tsx`. One `<Wordmark>` span of real Cormorant,
rendered by the navbar, the preloader, The Gap's resolution and the footer, so
they are the same object at four sizes. The crimson Y and the two gold
interpuncts are gone with the SVG — the footer never had them, and matching the
footer was the ask.

**The write-on had to be replaced, not ported.** DrawSVG animates
`stroke-dashoffset`; real glyphs have no stroke to offset, and outlining them so
they could be stroked draws their *contour* — a wobbling edge, not writing. So
`revealWordmark()` splits the mark and rises each glyph out of its own mask
(`SplitText { type: "chars", mask: "chars" }`, `yPercent: 110 → 0`,
`power3.out`). Transform-only, so INV-3 holds. Used by both the preloader
entrance and The Gap's resolution, which keeps them the same gesture.

Two things this broke that the SVG had been hiding:

- **SplitText measures glyphs, so it cannot run before the webfont lands.** The
  preloader built its timeline immediately and only *revealed* it on
  `document.fonts.ready`; against an SVG that was harmless. The whole context is
  now built inside the fonts callback, with the 2.2s hard cap moved out to the
  effect body so it still counts from mount.
- **Flip had to adopt the navbar's font-size.** Handing off a scalable SVG only
  needed the target's rect. Type at 90px scaled into a 136px box snaps to 24px
  the moment it hands over, so `handoff()` now also sets
  `fontSize: getComputedStyle(target).fontSize` before `Flip.from` — the end
  state matches the navbar exactly and `scale: true` walks the difference.

Evidence: `evidence/wordmark-same.png` (navbar and footer, one face),
`evidence/preloader-mask-midreveal.png` (C in, T nearly, L half, Y cresting —
each behind its own `overflow: clip` wrapper),
`evidence/gap-resolve-type.png`. INV-6 re-measured on the production build:
**223.1 KB gz** first load, three.js absent. No horizontal overflow at 390.

## Invariant status
**All eight verified at L8** — see the table above.
INV-1 ok · INV-2 ok · INV-3 ok · INV-4 ok · INV-5 ok · INV-6 ok (202.4/250 KB) ·
INV-7 ok · INV-8 ok

## Decisions
- **Mono face: IBM Plex Mono** — the only candidate of four with a ₹ glyph at correct
  monospaced width. JetBrains Mono and Roboto Mono both fall back (24.00 vs 20.78).
  Evidence: `evidence/L0-0-monotest.png`
- **Layer C weight: 1.25px / opacity 0.5 on `--rule`**, not §9.2's 0.5px / 0.04–0.07,
  which renders as nothing. Evidence: `evidence/L0-3-calibrate-1440.png`. Needs approval
- **Hero left-aligned**, not centred as on the current site — opens the right side for layer C
- **One pin-and-scrub section only** (the Gap). The four walls pin and translate on x, no scrub
- Observation runs against `python3 -m http.server 4599`; playwright's profile blocks `file://`
- chrome-devtools MCP is **not connected** despite `CLAUDE.md`; L2b and L8 gates need a
  substitute measurement or an install. Not yet resolved

- **`motion` dropped (user instruction).** Curtain now runs on GSAP `yPercent` with
  `power3.out`. CustomEase would reproduce the exact brand cubic-bezier but costs ~3 KB,
  a fifth of the saving; PLAN §3 already sanctions `power3.out` as a brand ease

## Client revision · 2026-09-08 (post-L8)

Nine changes requested from screenshots. All verified at 1440 and 390 against
`next dev`, plus a clean `next build` and `eslint`.

| Change | Evidence |
|---|---|
| Nav wordmark centred, six links split 3/3 either side | `evidence/rev-2-home-1440.png`, `rev-7-home-390.png` |
| Hero centred; the lede moved out of the hero to below the fleuron | same |
| Cursor restyled: 7px dot + 44px hairline ring, ring scales 0.34→1.0 only | measured: ring layout 44px, `scale(0.34)`→`scale(1)`, dot never scaled |
| Home scroll cut | 14,298px → 10,676px at 900px tall — **15.9 → 11.9 screens (−25%)** |
| Scrollbar themed (thin, `--rule` thumb, gold on hover) | computed `scrollbar-width: thin`, `scrollbar-color: rgb(220,214,200) transparent` |
| Model diagram rebuilt to the supplied layout | `evidence/rev-3-model-diagram.png` |
| Schemes cards: figure fits its card, titles share a baseline | title tops per row `354/354/354` and `838/838/838`; ₹10,000 box 290px inside a 292px column |
| /demo rebuilt as an operations console — tabs, search, status + city filters, status bar | `evidence/rev-6-demo-1440.png`, `rev-8-demo-390.png`; filter run: 7 all → 3 "needs attention" → 1 for "nashik" → empty state |
| Animated dithered halftone field site-wide (Bayer 8×8, three drifting masses) | `evidence/rev-2-home-1440.png` |

**INV-6 re-measured, not assumed:** first-load JS **222.5 KB before → 222.9 KB after**
(same method, same viewport, previous commit built from a stash). The whole revision
costs 0.4 KB; the halftone tiles are generated on a canvas at runtime inside the
already-dynamic `lib/fibre` import, so they never enter the bundle.

Invariants: the blobs ride the *existing* guilloche drift loop inside the same
`gsap.context` (INV-1) behind the same `prefers-reduced-motion` guard (INV-2), and only
`transform`/`opacity` are written (INV-3). The cursor's reduced-motion and coarse-pointer
teardown is unchanged. **The L2 cursor evidence is superseded** — "scale 1.00 → 2.60" no
longer describes the cursor; that 2.6× upscale of a 12px raster *was* the reported
pixelation.

## Scars
Things that broke and how they were fixed. Do not repeat these.
- **Catmull-Rom through alternating radii ≠ a rosette.** Fitting a spline through
  max/min radius points with tension 1/3 overshoots wildly and yields asymmetric
  scribbles. Fix: build one petal from explicit arc geometry
  (`arm = 4/3·tan(Δ/4)·r`) and rotate it n times — symmetry by construction.
  Evidence of the failure: `evidence/L0-1-guilloche-1440.png`
- **`<symbol>`+`<use>` with a nested viewBox silently mis-scales** and fought
  `vector-effect`. Inline `<path>` inside a plain `<svg viewBox>` instead
- **A hairline's visibility is stroke × opacity × colour-delta, not opacity alone.**
  0.5px at 6% of a colour that is already a pale tint is nothing. Always calibrate a
  ladder and look at it before committing an ambient value
- **playwright MCP blocks `file://`** and its first launch times out at 180s if the
  chrome profile is stale. Fix: `rm -rf ~/Library/Caches/ms-playwright-mcp/mcp-chrome-*`,
  and serve over localhost
- **Next 16 dev blocks `127.0.0.1` as cross-origin** and 403s every `_next` chunk with a
  near-useless client-side error. Use `http://localhost:<port>`, not the IP. No config change needed
- **`window.scrollTo` is inert while Lenis owns the scroll**, so a sync test built on it
  reads 0 for both measured and expected and reports a meaningless drift of 0. Drive
  scroll with real wheel events or `lenis.scrollTo`, and always assert the trigger
  actually entered its range before trusting a drift number
- **Next 16 + Turbopack has no per-route chunk list** in `build-manifest.json` and no
  longer prints First Load JS. Measure INV-6 from the browser's
  `PerformanceResourceTiming.encodedBodySize` instead of parsing manifests
- **An INV-7 grep hits its own explanatory comment.** Never write the banned words in a
  comment or every future gate reports a false positive
- Playwright MCP's `run_code_unsafe` sandbox has **no `require`, `import`, or `URL`** —
  do byte accounting inside `page.evaluate` with the Performance API instead
- **`backdrop-filter` makes an element a containing block for `position: fixed`
  descendants.** The mobile menu panel was `fixed inset-0` inside the blurred header and
  positioned against the header instead of the viewport. Move such panels out to be a
  sibling of the header
- **A child's `z-index` cannot escape its parent's stacking context.** Raising the burger
  to `z-130` inside a `z-120` header still left it under a `z-110` sibling panel. Fix the
  stacking at the ancestor, not the child
- **`motion`'s default animation type is a physics curve, not a tween** — every
  `animate()` call must pass `type: "tween"` explicitly or it silently breaks INV-7
- **Dev-only seams (`__ST`, `__lenis`) do not exist in a production build.** A production
  test written against them silently measures nothing and reports a passing zero. Drive
  production tests with real input (`page.mouse.wheel`) and assert the precondition
  actually happened before trusting the result
- **Repeated the INV-7 comment scar from L1** — wrote a banned word in a new comment in
  `lib/curtain.tsx` and tripped the grep again. Reworded. Reading the Scars section is
  only useful if it happens *before* writing the comment, not after the grep fails
- Deleting a route leaves stale generated types in `.next/dev/types`; `rm -rf .next/dev
  .next/types` before rebuilding or the build fails on a module that no longer exists
- **Gating a lazy chunk on device capability alone still loads it eagerly.** The shader
  mounted at hydration and pulled three.js's 228 KB chunk into first load — INV-6 went
  180.7 → 430.9 KB. Capability answers *may we*, not *should we yet*; proximity is the
  second half
- **An IntersectionObserver created on mount fires immediately.** It starts observing
  before layout, when the target is still zero-height at y=0 and therefore trivially
  intersecting. ScrollTrigger refreshes after layout, so its measurement is the real one
- **`gsap.to` + `invalidateOnRefresh` re-captures the start value from the element's
  current transform**, so each refresh compounds the offset. The horizontal track drifted
  one panel per refresh. Always `fromTo` with both endpoints explicit for scrubbed layout
- **`overflow: hidden` still scrolls programmatically.** Focus landing inside a
  horizontally-overflowing pinned track made the browser set `scrollLeft` to reveal it,
  moving content a full viewport with no change to any transform. The tell was that
  transform and tween progress were byte-identical between working and broken cases and
  only `getBoundingClientRect` differed
- **An orthographic r3f camera measures its frustum in pixels**, so `planeGeometry(2,2)`
  renders as a literal 2px quad. Scale the mesh by `useThree().viewport`
- **`window.scrollTo` is inert under Lenis — hit for the third time**, once in a test and
  once in real component code (the gallery focus handler). Any scroll that must actually
  happen goes through `scrollToY`
- **Calling an animation immediately after `setState` finds a null ref** — the element
  does not exist until React renders that branch. The wax seal stayed invisible at
  opacity 0. Animate from an effect keyed on the state, not inline after the setter
- **Collapsing a form invalidates every ScrollTrigger below it.** The page shortened by
  several hundred pixels and the six-questions ledger stayed permanently invisible,
  because `once: true` triggers held stale start/end values. Refresh after any large
  layout change, not only on route change
- **Headless Chromium does not commit `<select>` values from synthetic key events** —
  neither type-ahead, arrows, nor Enter. A keyboard gate on a native select cannot be
  verified in this harness; radios can
- **Lighthouse's default throttling is SIMULATED (Lantern), not applied.** The same build
  measures LCP 2.72s simulated and 1.56s applied. Neither is wrong; they answer different
  questions. Always state which method a reported number came from
- **An element starting at `opacity: 0` awaiting JS is invisible to LCP.** The hero was
  excluded from LCP entirely until its reveal ran, and Lighthouse reported a small eyebrow
  as the LCP element. Render content visible and set the animation's start state in a
  layout effect
- **A contrast fix computed against one background can break another.** Darkened gold
  cleared `--paper` but still failed on `--paper-warm`, and a blanket override made it the
  *low*-contrast colour on the dark inverted bands. Check every ground the token lands on
- **GSAP Flip tweens `width`/`height` by default** when the two states differ in size,
  which silently breaks INV-3. Pass `scale: true`
- **`Math.abs(a - NaN) > epsilon` is always false**, so seeding a "last written value"
  with NaN as a sentinel silently disables the guard forever. My own write-skipping
  optimisation killed the custom cursor and the ambient parallax outright — they never
  wrote a single transform. Caught only by testing the *behaviour*, not the code. `changed()`
  now treats any non-finite previous value as different
- **Frame-rate-dependent lerp is invisible on the machine you build on.** A fixed
  per-frame factor is correct at exactly one refresh rate. Convert to per-second damping
- **React 19's lint rejects synchronous `setState` inside an effect.** For anything that is
  really an external store (`matchMedia`, a media query, a subscription),
  `useSyncExternalStore` is the primitive that both satisfies the rule and hydrates cleanly
- **A promoted layer is rasterised once at its layout size.** Scaling a 12px dot to 2.6×
  hands the GPU a 12px bitmap to stretch, which is the soft, crawling edge users report as
  "pixels get weird when enlarged" — and it only shows on some machines because
  fractional-DPR displays resample it a second time. Lay the element out at its LARGEST
  size and scale down; never up
- **A card whose content is optional needs a reserved well.** Three of six scheme cards
  have no rupee figure, so their titles sat ~100px above their neighbours' and the grid
  read as "not centred". A fixed-height, bottom-aligned figure well fixes the row
- **Viewport-sized display type overflows a grid column.** `clamp(…, 6vw, 5rem)` is sized
  for the page, not the card: "₹10,000" is seven monospaced glyphs and printed straight
  out through the card's right edge. Size figures in `cqi` against the card instead
