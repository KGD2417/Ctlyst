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

## Client revision · 2026-09-08b — topographic atmosphere

Two components were supplied to integrate (a WebGL `TopoField` and an SVG
`FloatingPaths`). **Neither was installed as given**, for reasons stated to the
client: `TopoField` ships as a sandboxed iframe containing a whole landing page
that pulls Tailwind, GSAP and Iconify from three CDNs and then hides everything
but its canvas — external requests on every route, a second Tailwind, a duplicate
GSAP, against BRIEF §11 and INV-6 — and its "light mode" is a string-patch of a
shader authored for black. `FloatingPaths` drives `motion`, which CLAUDE.md
reserves for route transitions, and hardcodes `slate-950`.

Both looks were rebuilt natively inside `Atmosphere` instead, in paper/ink:

| Layer | What it is |
|---|---|
| C2a grid | 48px rule grid, two static CSS gradients, radial-masked. No element per line |
| C2b topo | 11 contour paths from marching squares over 3-octave value noise (`lib/topo.ts`), translated only |
| C3 flow | 18 curves from the reference's generator; the dash travels along each at its own rate |

**Why the contours are baked, not shaded:** the reference animates by
`noisePos = st * scale + t * vec2(...)` — the field never deforms, it *pans*. So
a static vector field that translates is the same picture without a fullscreen
fragment shader.

Evidence: `evidence/rev-12-topo-flow-1440.png`, `evidence/rev-13-topo-flow-390.png`.

| Measure | Baseline (pre-revision) | After |
|---|---|---|
| Frame time, scrolling, steady state | median 16.7 / p95 17.9 / **0 dropped, 0 long tasks** | median 16.6 / p95 18.3 / **0 dropped, 0 long tasks** |
| First-load JS | 222.5 KB | **223.5 KB** (budget 250) |
| Server HTML | — | 47.7 KB on the wire vs 233 KB DOM — the 86 KB contour field is client-only |

`lib/topo.check.ts` (`npx tsx lib/topo.check.ts`) asserts the field: populated
levels, in-box coordinates, determinism, and a build under 40ms.

Invariants: both new animations sit in the existing `gsap.context` (INV-1) behind
the existing `prefers-reduced-motion` guard (INV-2); the contour layer is
translate-only and the flow layer animates stroke-dash, the same mechanism
DrawSVG already uses here (INV-3). The halftone masses were dialled down from
0.05/0.042/0.035 to 0.03/0.024 and reduced from three to two — four ambient
systems at full strength was soup. That is a knob, not a decision.

## Client revision · 2026-09-08c — one background, always moving

"Too much — either topography or the other style, but I need it always animated."
Topography kept (it was the original reference); **the flow curves, the halftone
masses and the halftone generator are deleted**, and the guilloche is halved to
0.26 so two families of faint curves stop competing. What remains: paper, grain,
a 48px rule grid, the contour field, wash, vignette.

**Always animated, properly:** the field is now periodic in x — every octave
completes a whole number of periods across it — drawn once and `<use>`d one field
width along, then panned by exactly that width on `repeat: -1`. Copy B lands
where copy A began, so it is a continuous pan, not a drift that creeps out and
reverses. 2200 units / 110s ≈ 16px/s at 1440.

| Measure | Baseline (pre-revision) | Now |
|---|---|---|
| Frame time scrolling, from load | median 16.7 / p95 17.9 / 0 dropped / 0 long tasks | median 16.7 / p95 18.4 / **0 dropped / 0 long tasks** |
| First-load JS | 222.5 KB | **223.1 KB** (budget 250) |

Evidence: `evidence/rev-14-topo-only-1440.png`, `evidence/rev-15-topo-seam-1440.png`
(a different pan phase, no tear at the tile boundary), `evidence/rev-16-topo-390.png`.

`lib/topo.check.ts` now asserts the seam: for every contour level, the heights
entering the left edge must match those leaving the right. Verified to have teeth
— setting `scale` to a non-integer makes it fail with "2 contours enter the left
edge but 6 leave the right".

## Client revision · 2026-09-08d — clipped descenders, and the tri-fold flicker

**Descenders.** SplitText's `mask: "lines"` wrapper is exactly one line box tall
and clips; the display ramp runs `line-height: 0.92`, tighter than the font's own
ascent + descent. Every descender was sliced at the baseline — worst on the
italic *g* of "guidance". Fixed with `overflow-clip-margin: 0.3em` on
`.sl-line-mask`, which widens the clip region without touching the box, plus the
reveal's start offset raised 110% → 135% so a line still begins fully hidden
inside the wider region.

Measured, settled lines on the home hero: **20.6px of room below the ink**
(previously clipped). Unrevealed lines still sit **8.1px below the clip edge**, so
nothing peeks before its reveal. A sweep of all seven routes for text ink cut by
any clipping ancestor returns **zero**. Evidence: `evidence/rev-18-hero-1440.png`.

**Tri-fold flicker.** Reported as: left→right is fine, but middle→back-to-left
flickers. Traced with a real pointer path and a per-frame recorder. Three
distinct causes, in the order they were found:

1. A layout animation *generates its own* enter/leave events — as the boxes
   resize, the browser re-decides what is under the pointer. Captured: the grid
   received `mouseleave` with the pointer at x=398 **inside its own box**, with
   `relatedTarget` an `<h3>` inside the grid; and card 1 received `mouseenter`
   while `elementFromPoint` said card 0. Hover now follows real pointer
   *movement* (one `pointermove` on the grid, reading its own target).
2. Pointer moves *during* a Flip land on different cards as the boxes slide, so
   the state oscillated — eight reversals in one sweep. The running Flip now owns
   the layout; the pointer's latest intent is queued and applied once, on
   completion.
3. **The last one was mine.** `queued.current = null` was written to mean "clear
   the queue", but `null` is also the meaningful value "close everything". So
   every pointer move over the already-open card queued a collapse that fired
   when the Flip finished. `undefined` clears; `null` closes.

| | Before | After |
|---|---|---|
| `open` through middle→left | 1 → 0 → 1 **in 15ms**, settling on the wrong card | 1 → 0, settles on the card under the pointer |
| Quick reversals, full sweep | 8 | 0 |
| Unrequested collapses to "none" | 3 | 0 |
| Leaving the grid still closes | — | yes |

Evidence: `evidence/rev-19-trifold-1440.png`.

## Client revision · 2026-09-08e — dark gradient re-skin

The light paper/ink identity is retired for a dark ground with gradients, plus a
cool counterpoint the palette did not have.

**Palette, chosen by measurement rather than by eye.** Ratios are against
`--paper` / `--paper-warm`:

| Token | Value | On ground / raised |
|---|---|---|
| paper (ground) | `#0B0A0E` | — |
| paper-warm (raised) | `#16141C` | — |
| ink (body) | `#F4F1EA` | 17.50 / 16.18 |
| ink-soft | `#C7C0B4` | 10.93 / 10.10 |
| muted | `#9B9488` | 6.57 / 6.07 |
| crimson | `#D9614F` | 5.43 / 5.02 |
| crimson-deep (fill) | `#A03A31` | ink on it: 5.92 |
| gold | `#D9B26A` | 9.89 / 9.15 |
| **indigo** (new) | `#7C86E8` | 6.05 / 5.59 |
| indigo-deep (fill) | `#3F47A8` | fill only |

The token NAMES are unchanged — "paper" is now near-black and "ink" is off-white
— because colour was fully tokenised (~415 utility usages across 9 tokens), so
inverting the values re-skinned the site without touching the components. The
darkened `gold-ink`/`muted-ink` small-text variants and the `[data-invert]`
override that undid them are deleted: on a dark ground the full-strength hues are
the legible ones.

**Gradients.** Three utilities, all interpolated `in oklch` — crimson → indigo
through sRGB passes a dead grey-brown at the midpoint. `.grad-text` for the hero
emphasis (with a `forced-colors` fallback), `.band` for the six sections that used
to be dark slabs on a light page, `.grad-fill` for primary CTAs. Plus a three-pole
mesh in the atmosphere riding the existing drift loop. Nothing tweens a gradient
stop: INV-3 still holds, and the existing fibre grain is what stops the large
fills banding.

**What the light theme was hiding** — found by sweeping computed contrast on
every text node across all seven routes:

| Fault | Was | Now |
|---|---|---|
| Band CTA ("Why We Are That Place") — paper-on-paper | 1.08 | 5.02+ |
| Join form fields: `--rule` underline as the only affordance | 1.35 | 6.57 |
| Process-diagram edges in `--rule` — the flow was unreadable | 1.35 | ~4.9 |
| Timeline `/` separators in `--rule` (**pre-existing**, failed on light too) | 1.35 | 6.57 |

Final sweep: **zero contrast failures** on rendered text across `/`, `/model`,
`/why`, `/schemes`, `/roadmap`, `/demo`, `/join`. Frame time under scroll
unchanged: median 16.6, p95 18.1, 0 long tasks. `next build` and `eslint` clean.

Evidence: `evidence/rev-21-dark-home-1440.png`, `rev-22-dark-schemes-1440.png`,
`rev-23-dark-demo-1440.png`, `rev-25-dark-join-1440.png`,
`rev-26-dark-model-1440.png`, `rev-27-dark-home-390.png`,
`rev-28-dark-preloader.png`.

Not yet revisited under the dark theme: the Gap's WebGL pass got new uniform
colours but its shader was tuned for ink-on-paper, and the four-walls panels have
not been reviewed for the new ground.

## Client revision · 2026-09-09 — the gradient word was clipping its own descender

Reported as the same symptom as the earlier line-mask bug, but a different
cause: `background-clip: text` paints the gradient into the element's PADDING
box and then clips it to the glyph shapes, so any part of a glyph hanging
outside that box is never painted at all. The italic *g* of "guidance" hangs
below it, so its tail vanished.

Isolated rather than guessed: the same 120px crop shot three times — as shipped,
with the gradient technique disabled (tail intact → background-clip is the
cause), and with the line mask's clipping removed (tail still gone → the mask
was innocent). `evidence/rev-30-g-gradient.png`, `rev-31-g-plaincolour.png`,
`rev-33-g-after.png`, `rev-36-word-final.png`.

Fix: `padding-block: 0.3em` on the inline element — and then `padding-inline:
0.22em` with a cancelling `margin-inline: -0.22em`, because the italic g's tail
also sweeps LEFT of the element's inline start and that side was clipped too.
Inline padding does affect layout, so the negative margin is what keeps it
honest: glyph positions measure 712.16px with and without the fix, identical.

Original fix: Vertical padding on an inline
box extends the paint area without touching the line box — measured identical
afterwards (line height 119.2, top 479.3), so nothing reflowed.

The padding then changed the gradient itself, because a 100deg ramp maps across
the box's diagonal and the box had just grown taller. The ramp is now 90deg, so
it is independent of the paint box's height.

## Client revision · 2026-09-09b — frosted surfaces

The navbar, both nav panels, the scheme cards, the tri-fold pillars, the demo
console and its open case, and the join form's choice boxes are now frosted
panes over the gradient: one `.glass` utility (20% tint, `blur(7px)
saturate(1.5)`, a 26% ink hairline, and a drop shadow) plus `.glass-lit` for the lit top edge that
makes a pane read as glass rather than as a grey box.

Tuned in three passes, each judged from a screenshot. 72% tint / 16px blur: flat
dark rectangles. 58% / 20px: the mesh's colour came through but the pattern did
not — **the blur mattered as much as the tint**, because at 20px a 1px contour
hairline is smeared into nothing, so there was no pattern left to see through at
any opacity. 20% / 7px: the contour field and the 48px grid now run visibly
*through* the panes, continuous with the ground around them.

At 20% the pane barely tints anything, so the EDGE carries the surface: the ink
hairline goes to 26% and a `0 10px 40px -12px` shadow lifts the pane off the
ground. Without that the cards stop reading as cards.

| Check | Result |
|---|---|
| Contrast, all 7 routes, panel tints composited over the ground before judging | **0 failures** |
| Frame time scrolling over the frosted surfaces | median 16.7 / p95 17.7 / **0 dropped, 0 long tasks** (re-measured at the final values) |

`backdrop-filter` is dropped entirely under `prefers-reduced-motion` in favour of
a 94% flat tint — the effect is decorative and it is the one property here that
makes the compositor re-sample the whole area behind each pane.

**Cascade trap:** `.glass` is declared after Tailwind's utilities, so its
`border` shorthand beat `border-crimson` at equal specificity and the open
pillar lost its crimson edge. The state colours now carry Tailwind's `!`
modifier. Verified: open pillar `rgb(217, 97, 79)`, closed ones the glass
hairline.

Evidence: `evidence/rev-42-glass-schemes-1440.png`,
`rev-43-glass-demo-1440.png`, `rev-48-glass-trifold-open-1440.png`,
`rev-45-glass-join-1440.png`, `rev-47-glass-mobilenav-390.png`,
`rev-53-glass-transparent.png` (the final, see-through pass).

## Client revision · 2026-09-09c — the premium pass

Reference image supplied: glowing, colour-graded contours that react to the
pointer, marginal annotations, a blooming CTA, and cards you can see through.

**Atmosphere.** Each contour is now three strokes — a wide faint halo, a mid,
and a hairline core — which is a bloom without a filter (`filter: blur()` over a
full-screen layer re-rasterises on every pan; three strokes are just more
geometry in one raster). Colour comes from a single gradient in the field's user
space, so a contour runs ember at one end of the map and indigo at the other. A
screen-space mask keeps the middle of the frame quiet, so the headline has a
pocket to sit in and the energy stays at the margins.

**The pointer bloom** is a second copy of the field, brighter, seen through a
disc that follows the cursor. See the scar below for what the obvious build cost.

**Hero chrome.** Marginal annotations (left: the hero lede's three offers; right:
three steps the model diagram names — both traceable, INV-8), arrows on both
CTAs, a "scroll to explore" hairline, and a CTA that emits light onto the page.

**Cards.** Liquid-glass treatment: a lit inner top rim and shaded inner bottom so
the pane reads as a slab with an edge, plus a specular sweep that brightens on
hover — `opacity` only, so it runs on the compositor.

| Check | Result |
|---|---|
| Contrast, 7 routes, tints composited over the ground | **0 real failures** |
| Frame time, scrolling *and* pointer moving | median 16.6 / p95 18.0 / **0 dropped, 0 long tasks** |

Evidence: `evidence/rev-57-hero-premium.png`, `rev-58-liquid-cards.png`,
`rev-56-bloom-transform.png`.

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
- **GSAP rounds `stroke-dashoffset` to whole numbers.** With `pathLength={1}`,
  the entire dash cycle is one unit, so every interpolated value quantised to 0
  or -1 and the curves sat perfectly still — while `tween.progress()` climbed and
  `isActive()` was true, which is what made it look like a live animation with a
  rendering fault. Normalise to 1000, not 1. Diagnosed only by logging the tween's
  progress *and* the element's written style in the same tick
- **A one-off build during mount is a dropped frame, not a free lunch.** The
  contour field measured 9ms in isolation and landed as a **56ms long task** in
  the browser once React reconciliation and first rasterisation joined it. Moved
  behind `requestIdleCallback`: 0 long tasks, same picture
- **`M-${a - b}` emits `M--10` the moment the term goes negative.** Path templates
  that splice a minus sign in front of an expression are a latent crash — they
  work only for the parameter range the author happened to try. Compute the
  number, let the sign fall out
- **GSAP writes SVG transforms to the `transform` ATTRIBUTE, not to `style`.**
  Reading `el.style.transform` to check whether a pan was running reported an
  empty string on a tween that was demonstrably active — the second time in this
  session that "the animation is dead" turned out to be a bad observation rather
  than a bad animation. Read `getAttribute("transform")` or `getCTM()`
- **Two real copies of a big generated SVG is twice the DOM, and it shows.** The
  duplicate contour field (3.5k segments) put a 50ms long task back on the load
  path; `<use href="#id">` renders the same picture with one copy of the geometry
- **A tileable noise field needs integer octave frequencies.** The usual
  2.03/4.11 multipliers exist to stop octaves aligning, but they also guarantee
  no octave completes a whole period across the field, so the seam never matches.
  Use 1/2/4 with different seeds per octave instead
- **A line-height below 1 plus an overflow-hidden line mask eats every
  descender.** SplitText's mask wrapper is exactly one line box tall, and the
  display ramp is 0.92 — so g, y and p were cut at the baseline everywhere the
  masked reveal was used. `overflow-clip-margin` fixes it without touching
  layout, but the reveal's start offset must grow to match, or the line pokes
  into the widened region at rest
- **Never use `null` as both a sentinel and a value.** "Nothing queued" and
  "close everything" were both `null` in the tri-fold's queue, so an ordinary
  hover over the open card scheduled a collapse. It looked exactly like a browser
  bug, and it cost most of the debugging session. `undefined` clears, `null` acts
- **A hover-driven layout animation is a feedback loop.** Resizing boxes make the
  browser re-run hit testing and emit enter/leave the user never caused; feeding
  those back into the state that drives the resize oscillates. Drive such state
  from pointer MOVEMENT, and let a running animation own the layout until it
  settles
- **`getBoundingClientRect` and `relatedTarget` both lie during a layout
  animation, in different directions.** Coordinates said the pointer was inside;
  relatedTarget pointed at a child; neither matched intent. `elementFromPoint`
  against the *settled* layout is the only reading that answers the question
  actually being asked
- **A hairline token is not a text colour, and a light theme hides that.**
  `--rule` was 1.3:1 against paper too — as separators, input underlines and
  diagram edges it was always failing, but on a light ground it still read as a
  faint grey line. Inverting the palette turned the same ratio into invisible.
  Contrast-test decorative tokens wherever they carry meaning, not just body text
- **Re-skinning is cheap only if colour is fully tokenised.** Nine tokens and
  ~415 usages meant the entire dark theme was a value swap plus four genuine
  fixes. The same change against hard-coded hexes would have been a week
- **sRGB interpolation kills a two-hue gradient.** crimson → indigo through sRGB
  passes a dead grey-brown; `in oklch` keeps the chroma up across the middle.
  Also mind the mix ratio: indigo at 45% read as magenta, not as an ember cooling
- **`background-clip: text` clips to the glyphs but paints only within the
  padding box.** Any descender, swash or accent that overhangs the box is simply
  not painted, and it looks exactly like a clipping bug in an ancestor. Vertical
  padding on an inline element fixes it for free — inline padding does not affect
  the line box
- **An angled gradient depends on the box's height.** Adding padding to fix the
  descender silently re-mapped which part of the ramp each glyph received. If a
  ramp should read consistently across a line, keep it at 90deg
- **A utility declared after the framework wins at equal specificity.** `.glass`
  set the `border` shorthand and silently beat every `border-<colour>` utility on
  the same element, so selected states lost their accent edge. Component state
  colours layered over a custom utility need `!` — or the utility should set only
  the properties no state will ever want back
- **Frosted glass needs something behind it to frost.** On a dark ground a
  blurred panel at a high tint is indistinguishable from a flat panel; the effect
  only appears once the tint is open enough to show the layers underneath
- **Animating `mask-image` re-rasterises everything the mask covers.** A pointer
  bloom built as one layer whose radial mask followed the cursor measured a
  **median frame of 63.7ms with 260 dropped frames and 17 long tasks** — because
  the mask covered 10k stroke segments and every pointer move invalidated them.
  Rebuilt so the mask is STATIC and a window translates instead, with the content
  counter-translating to stay world-fixed: **16.7ms median, 1 dropped frame, 0
  long tasks** on the identical test. Two transforms beat one mask
- **`color/70` in Tailwind v4 compiles to `color-mix()` and serialises as
  `oklab()`.** Any contrast check parsing `rgb()` silently mis-reads it — mine
  reported 1.06:1 for text that was fine. Either convert properly or use solid
  tokens where the value has to be provable
- **`color: transparent` + `background-clip: text` reads as a contrast failure
  to any automated check.** The colour genuinely is transparent; the paint comes
  from the background. Exclude those elements explicitly rather than "fixing" them
- **A 150%-sized, `will-change: transform` gradient box gets tile-clipped by Chromium.**
  The B3 mesh was `inset-[-25%] h-[150%] w-[150%]` riding the drift loop; its indigo
  pole rendered with a hard horizontal cut at y≈535 and a second one at y≈690 on the
  left — a raster-tile boundary, not a gradient stop. Two false leads first: the box's
  own rotated edges (computed, all off-screen) and the contour geometry. Isolated by
  `display:none` on the layer, which made the seam vanish. Fix: the mesh is a static
  `absolute inset-0` div — viewport-sized, no transform, no `will-change`. Also removes
  the coordinate trap where a pole "at 4% 6%" landed at viewport −19% because the box
  started at −25% and was 1.5× scale.
- **The contour pan is a repaint, not a composite — so segment count is a frame budget.**
  Panning `<g data-topo-pan>` transforms an SVG group, which Chromium repaints rather
  than compositing, so every stroke segment is re-rasterised every frame. The glow pass
  structure quietly made that 57,216 segments/frame, 28,608 of them dashed — and dashing
  is the most expensive thing Skia can be asked to stroke. rAF frame-time is BLIND to
  this: it read a clean 16.7ms median in every configuration, including with layers
  hidden, because the cost is on the raster thread. Count the geometry instead.
  Fix: coarser field (132×92×12 → 100×70×9) and one fewer glow pass → 24,240/frame,
  8,080 dashed. Below the 42,912 the page did before the glow work.
- **A blank page after editing `atmosphere.tsx` is Fast Refresh, not your change.**
  Editing the file re-runs the gsap context; the split-reveal entrance timeline reverts
  to its initial state — text translated out of its `.sl-line-mask` — and does not
  replay, so the page renders as background only with every section still `opacity: 1`
  and in layout and zero console errors. `browser_navigate` to the same URL is not
  enough; it needs `location.reload()`.
  This cost two wrong diagnoses in one session: two attempts to move the contour pan
  onto the compositor were reverted as "they composite the ambient stack above main",
  which they never did. **Before blaming a layer, `document.elementsFromPoint` at the
  headline.** If the top hit is `sl-line-mask`, the entrance never ran and the render
  is fine. If it is an ambient layer, then it is a compositing problem.
- **An SVG gradient cannot colour a field that pans.** The lit contours were stroked
  with `url(#topo-ink)`, `gradientUnits="userSpaceOnUse"`. That user space is inside
  the panning `<g>`, so the ramp travelled with the contours: the right edge rendered
  ember filaments under a violet glow, and the second copy — the one the wrap brings
  in — fell past the last stop and arrived uniformly indigo. No fix inside the gradient
  works; `spreadMethod` repeats or reflects along the gradient vector, which a
  horizontal pan does not align to. Fix: one masked layer per colour, flat stroke,
  colour pinned to the screen by the mask.
- **A two-stop radial reads as a pasted-on spot, however soft the second stop is.**
  `colour, transparent 70%` spends its whole alpha on one ramp and leaves a rim you
  can trace. What removes the edge is the distribution: peak inside the first fifth of
  the radius, then the last few percent given up across the outer half — see `TAPER`,
  seven stops. Five still banded. Anchor poles past the viewport edge as well; a
  visible far arc reads as a spot no matter how good the falloff is.
- **The compositor pan costs 119 MB of GPU texture — measured, and the reason it is not on main.**
  Moving the pan off the SVG group onto a promoted HTML div works and is mechanically
  verified (the pan target is a DIV writing a CSS `translate3d`, no SVG transform
  attribute, slice scale unchanged). But each panning box is two field widths, 2880x900
  CSS, and at `devicePixelRatio: 2` that is 41.5 MB of texture each — three of them,
  118.7 MB. main's only promoted layer is the 520px bloom window at 4.1 MB. The trade is
  32,320 stroke segments repainted per frame against ~119 MB of VRAM, and paint wins.
  It is kept on branch `compositor-pan-attempt`. To make it viable, clip each layer to
  its zone (ember ~45% of the viewport, violet ~35%) so the texture is small, which means
  positioning each pan box against the viewport rather than its clip box.
- **Two harness traps that cost most of a session between them.** A tab that has been
  through many HMR cycles, `location.reload()`s, or a `browser_resize` reaches a state
  where it screenshots as a blank page with correct DOM and zero console errors. Only a
  brand-new tab is trustworthy. And `document.elementsFromPoint` skips `pointer-events:
  none`, so it can NEVER see the ambient root — it is useless for deciding whether an
  ambient layer is painting over the page. Use `display: none` on the suspect layer and
  screenshot in a fresh tab instead. Three separate wrong diagnoses came out of trusting
  those two signals.
- **Windows reports `prefers-reduced-motion: reduce` far more often than you would guess,
  and the site was treating that as "strip the design".** Settings > Accessibility >
  Visual effects > Animation effects is off on a lot of machines and is forced off by
  battery saver. One media query then explained every symptom in a bug report that read
  like three unrelated ones: no animation anywhere, a navbar that "looks plain, not
  frosted", and background effects behaving differently per machine.
  Two things were wrong. `.glass` dropped `backdrop-filter` under reduce — a blur is not
  motion, and INV-2 only ever asked for pinning, scrubbing, hijack, cursor and WebGL.
  And every reveal resolved with `gsap.set(opacity: 1)`, so content was simply already
  there; INV-2's own check says "content appears with opacity only", which means it
  appears. Both fixed. Reduce now means: no transforms, no scrub, no pin, no cursor, no
  ambient pan — but the material and the fades stay.
  Test it with `page.emulateMedia({ reducedMotion: 'reduce' })`, not by reasoning about it.
- **`mix-blend-mode` silently degenerates when its stacking context has a transparent
  backdrop.** §9.6's headline misregistration painted a crimson rectangle over the whole
  headline block on every home load — most visible arriving from another route, where
  the curtain lifts to reveal it. `.misreg::after` is `background: crimson;
  mix-blend-mode: multiply; opacity: .55 -> 0`, which on paper sinks into the page. But
  an element blends with the backdrop *inside its own stacking context*, and after the
  dark re-skin the nearest one is `<main>` (z-index 1) — whose group is transparent,
  because the ambient background is a sibling BEHIND main, not inside it. Multiply
  against a transparent backdrop returns the source unchanged, so it painted flat
  crimson. Removed rather than patched: on a near-black ground the effect has nothing to
  sink into, and as a full-block rectangle it never described a misregistered glyph
  anyway. The curtain's use (an offset copy of the mark, transform only) is untouched
  and still correct — keep `--misreg`, it feeds that one.
  General lesson: a blend mode that "does nothing" is usually a stacking-context bug,
  not a browser bug. Check what is actually inside the group before trusting it.
