# CTLYST

Marketing site for a pre-launch startup-support venture in Mumbai. Trust artifact, not a product page. Full spec in `BRIEF.md` — read it before any work.

## Canonical sources

- `reference/CTLYST.html` — the current site. Source of all brand tokens and all copy.
- `reference/CTLYSTProjectPlanWEB.html` — the business plan. Source for anything the site doesn't already say.

`reference/archive/` holds duplicate exports of the same two documents in other formats. Do not read it. If you think you need something from there, it is in one of the two files above.

## Operating protocol

This build runs as nine gated loops, L0 → L8, defined in `BRIEF.md` §5. Execution rules:

1. State your loop and iteration at the top of every response: `[L3 · iteration 2/3]`
2. One loop at a time. Do not read L*n+1* until L*n*'s gate has passed with evidence.
3. Inner loop caps at 3 iterations. On the third failure, stop and escalate using the `BRIEF.md` §6 template. Do not attempt a fourth, do not reduce scope to force a pass, do not redefine the gate.
4. Evidence, not assertion. A screenshot, a measured number, or a passing assertion — never "this looks good now".
5. Update `PROGRESS.md` at the close of every loop. It is your memory across compaction. Append to its **Scars** section every time the inner loop iterates.
6. L0's gate is closed by the human. Every other gate you verify yourself.

## Invariants

Re-check all eight at every gate. A later loop breaking an earlier invariant fails the gate even if the loop's own goal was met. Full definitions in `BRIEF.md` §2.

| | |
|---|---|
| INV-1 | No timeline, ScrollTrigger, or raf loop survives unmount |
| INV-2 | `prefers-reduced-motion` kills all pin, scrub, hijack, cursor, WebGL |
| INV-3 | Only `transform` and `opacity` animate — use Flip, never width/top/filter |
| INV-4 | Every pinned section has a separately-authored stacked mobile variant |
| INV-5 | Keyboard focus visible and functional everywhere |
| INV-6 | ≤250KB gz first load; WebGL dynamically imported and skipped on low-end |
| INV-7 | Zero `elastic`, `back`, `bounce`, `spring` easing anywhere |
| INV-8 | Every line of copy traces to a canonical source |

## Browser tooling

Both MCP servers are connected. Use them for different jobs:

- **playwright** — navigation, clicking, screenshots. This is the default for the OBSERVE step of every visual loop.
- **chrome-devtools** — performance traces, network, CPU throttling. Required for the L2b 1ms/frame budget and all of L8.

Capture every observation to `evidence/L<n>-<iteration>-<width>.png` at 1440px and 390px.

## Commit discipline

Commit after every passed gate, message `L<n>: <gate>`. This is the undo mechanism — when L6 breaks INV-2, the bisect target has to exist. Never commit mid-loop with a failing gate.

## Hard rules

- No new dependencies beyond `BRIEF.md` §11 without asking first
- No component library, no CMS, no animation preset pack
- GSAP 3.13 plugins are all free — do not hand-roll SplitText or DrawSVG on the assumption they are paid
- Lenis is the only scroll authority. Never add ScrollSmoother alongside it
- `motion` is for route transitions only. Scroll work is GSAP's
- Do not invent copy (INV-8)