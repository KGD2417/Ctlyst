# PROGRESS

## Current
Loop: L2 · iteration 1/3 — shell
Blocked on: —

## Gates passed
- [x] L0 — plan approved 2026-08-25 ("continue"); three questions defaulted, see Assumptions
- [x] L1 — harness verified 2026-08-25. Evidence: `evidence/L1-1-harness-1440.png`,
      `evidence/L1-1-harness-390.png`; measurements in the L1 gate record below
- [ ] L2 — shell
- [ ] L2b — atmosphere
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

## Invariant status
INV-1 **ok** (measured) · INV-2 **ok** (measured, live) · INV-3 ok (grep clean) ·
INV-4 ok (no pin, no h-overflow at 390) · INV-5 ok (focus ring set; real audit at L8) ·
INV-6 **at risk — 186.6/250 KB used at L1** · INV-7 ok (grep clean) · INV-8 n/a (no brand copy yet)

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
