# PROGRESS

## Current
Loop: L3 · iteration 1/3 — preloader
Blocked on: —

## Gates passed
- [x] L0 — plan approved 2026-08-25 ("continue"); three questions defaulted, see Assumptions
- [x] L1 — harness verified 2026-08-25. Evidence: `evidence/L1-1-harness-1440.png`,
      `evidence/L1-1-harness-390.png`; measurements in the L1 gate record below
- [x] L2 — shell verified 2026-08-25. Evidence: `evidence/L2-4-curtain-1440.png`,
      `evidence/L2-3-mobilenav-390.png`, `evidence/L2-2-home-1440.png`
- [x] L2b — atmosphere verified 2026-08-25. Evidence: `evidence/L2b-5-empty-1440.png`,
      `evidence/L2b-5-empty-390.png`, `evidence/L2b-4-home-1440.png`
- [ ] L3 — preloader
- [ ] L4 — home
- [ ] L5 — the Gap
- [ ] L6 — remaining routes
- [ ] L7 — join
- [ ] L8 — hardening

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

## Invariant status
INV-1 **ok** (30-nav churn, flat) · INV-2 **ok** (cursor + Lenis both off) · INV-3 ok (grep clean) ·
INV-4 ok (mobile nav works, no h-overflow at 390) · INV-5 **ok** (14 focusables, all ringed) ·
INV-6 **at risk — 201.2/250 KB, 48.8 KB headroom** · INV-7 ok (grep clean; both `animate()`
calls pin `type:"tween"`) · INV-8 ok (all route copy traces to `reference/CTLYST.html`)

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
