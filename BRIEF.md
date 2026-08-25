# CTLYST — agentic build spec

Loop-engineered build spec for Claude Code. Lives at the project root as `BRIEF.md`, alongside `CLAUDE.md`. Not pasted into chat — the agent is told to read it. Source documents are in `reference/`.

---

## §0 — How to run this file

This is not a task list. It is a **control loop specification**. You will execute nine outer loops, L0 through L8, in order. Each outer loop runs an inner loop until its exit gate passes.

Rules that govern execution itself:

1. **Never skip a gate.** A loop is complete when its exit gate passes with evidence, not when the code looks finished.
2. **Never run two outer loops at once.** Finish and gate L*n* before reading L*n+1*.
3. **Cap the inner loop at 3 iterations.** On the third failure, stop and escalate per §6. Do not attempt a fourth. Do not silently reduce scope to make a gate pass.
4. **Write state after every loop.** `PROGRESS.md` is your memory across compactions. See §3.
5. **Evidence beats assertion.** "The animation is smooth" is not evidence. A screenshot, a Lighthouse number, a passing assertion, or a console log is.

State your current loop number at the top of every response. Format: `[L3 · iteration 2/3]`.

---

## §1 — North star

CTLYST is a pre-launch startup-support venture in Mumbai. It connects student and first-time founders to three things at once: retired engineers and professors as mentors, hands-on technical help, and India's under-used government funding schemes. It is at concept stage.

**The site's single job:** make three very different readers — a 20-year-old founder, a retired professor, and a corporate CSR officer — each believe this is credible enough to write to.

This is a trust artifact, not a product page. Every decision resolves against that sentence.

### Definition of done

The build is complete when all nine gates have passed and all §2 invariants hold simultaneously. Not when the last loop's code compiles.

---

## §2 — Invariants

These hold at every gate, in every loop, permanently. Re-check them at each gate — a later loop breaking an earlier invariant is the most common failure in this kind of build.

| ID | Invariant | How it is checked |
|---|---|---|
| **INV-1** | No timeline, ScrollTrigger, or raf loop survives unmount | Navigate away and back 5×; `ScrollTrigger.getAll().length` must not grow |
| **INV-2** | `prefers-reduced-motion: reduce` disables all pinning, scrubbing, scroll hijack, cursor, and WebGL | Toggle the OS setting and reload; site is fully usable, content appears with opacity only |
| **INV-3** | Only `transform` and `opacity` are animated | Grep the diff for animated `width`, `height`, `top`, `left`, `filter`. Use Flip instead |
| **INV-4** | Every pinned or horizontal section has a separately-authored stacked mobile variant | Resize to 390px; nothing is pinned, nothing scrolls sideways |
| **INV-5** | Keyboard focus is visible and functional everywhere, including inside horizontal galleries | Unplug the mouse, traverse the whole site with Tab |
| **INV-6** | First-load JS ≤ 250KB gzipped; WebGL is dynamically imported and skipped on low-end devices | `next build` output + a `hardwareConcurrency <= 4` guard |
| **INV-7** | No easing overshoots | Grep for `elastic`, `back`, `bounce`, `spring`. Zero results. See §4.3 |
| **INV-8** | All copy traces to a source document | Any line you cannot point to in `reference/CTLYST.html` or `reference/CTLYSTProjectPlanWEB.html` is deleted |

Violating an invariant fails the gate even if the loop's own goal was met.

---

## §3 — State file

Create `PROGRESS.md` in L0 and update it at the close of every loop. This survives context compaction; your memory does not.

```md
# PROGRESS

## Current
Loop: L4 · iteration 1/3
Blocked on: —

## Gates passed
- [x] L0 — plan approved 2026-08-25
- [x] L1 — harness verified, evidence: /evidence/L1-harness.png
- [ ] L2 …

## Invariant status
INV-1 ok · INV-2 ok · INV-3 ok · INV-4 n/a · INV-5 ok · INV-6 untested · INV-7 ok · INV-8 ok

## Decisions
- Mono face: <chosen> because <reason>
- Rejected ScrollSmoother in favour of Lenis (single scroll authority)

## Scars
Things that broke and how they were fixed. Do not repeat these.
- ScrollTrigger stale after route change → refresh() in a layout effect after paint
```

The **Scars** section is the point. Append to it every time the inner loop iterates. It is what stops you re-making the same mistake in L6 that you already fixed in L2.

---

## §4 — The inner loop

Every outer loop runs this until its gate passes or the cap is hit.

```
  ┌─────────────────────────────────────────┐
  │  1. BUILD    smallest change that       │
  │              could pass the gate        │
  │  2. OBSERVE  screenshot / measure /      │
  │              assert — never assume      │
  │  3. CRITIQUE against §4.1 and §4.2      │
  │  4. REPAIR   or → §6 escalate at 3/3    │
  └──────────────┬──────────────────────────┘
                 └── gate passes? → write state, next loop
```

### §4.1 — Observation is mandatory

You cannot see animation by reading code. At every OBSERVE step of a visual loop, load the page in the browser via the Chrome DevTools MCP, capture at **1440px and 390px**, and actually look at the images. Save them to `/evidence/L<n>-<iteration>.png`.

If the browser tool is unavailable, say so at L0 and stop — the human needs to install it before this spec can run. Do not proceed blind.

### §4.2 — The critique questions

At every CRITIQUE step, answer all five in writing. Answering them in your head does not count.

1. Would I have produced this exact thing for any editorial site brief? If yes, it is a default, not a choice — revise it.
2. Does the motion here serve the content, or is it motion for its own sake? Cut the second kind.
3. Is anything overlapping, clipping, or mistimed at either breakpoint?
4. Which invariant is this most likely to have broken?
5. What is the one accessory to remove? (Chanel's rule: take one thing off before leaving the house.)

### §4.3 — Motion tokens

Define these once in L0 and reference them by name forever. No ad-hoc durations anywhere in the codebase.

Every ease is `power3.out`, `power4.out`, or the inherited brand curve `cubic-bezier(0.22, 1, 0.36, 1)`. The target adjective is **grave**, not energetic — heavy paper turning, ink settling into fibre. Springs, overshoots, and elastic easing are banned project-wide (INV-7).

---

## §5 — The loops

### L0 · Recon and design plan

**Goal.** Understand the material and commit to a design system before writing code.

**Actions.**
1. Read `reference/CTLYST.html` and `reference/CTLYSTProjectPlanWEB.html` in full.
2. Confirm the browser MCP is available (§4.1). If not, stop here.
3. Absorb §7 (brand), §8 (section mechanics), §9 (ambient background), §10 (workflow correction).
4. Produce the five plan artifacts below.
5. Run §4.2 question 1 against each artifact, revise, and state what changed.

**Deliverables.**
- Type scale — full ramp with actual clamp values, tracking, line-heights for display / subhead / body / caption / mono-label
- Motion token table — named durations, eases, stagger values
- Section-by-section motion spec — one line per section naming the mechanic, plus the per-route guilloche arrangements (§9.4)
- ASCII wireframes of the hero and of The Gap, both showing where the ambient layers sit
- The mono face pick, with justification
- The guilloche shape set — 3–5 shapes drawn as SVG, shown against `--paper` at working opacity

**Exit gate.** The human has explicitly approved the plan. This is the only gate a human closes. Everything after is self-verified.

**Cap.** 3 revision rounds, then escalate.

---

### L1 · Plumbing harness

**Goal.** Prove the animation infrastructure works before any visual depends on it.

**Build.** Next.js 15 App Router, TypeScript, Tailwind v4 with brand tokens in `@theme`. A single client provider registering Lenis, GSAP, and ScrollTrigger, with `lenis.on('scroll', ScrollTrigger.update)` and a `gsap.ticker` raf loop. A `gsap.matchMedia()` harness with desktop / mobile / reduced-motion branches.

**No visuals yet.** Build a throwaway `/harness` route with three coloured blocks: one that pins, one that scrubs, one that only fades.

**Exit gate — all four:**
- Scroll is inertial and ScrollTrigger stays in sync at speed
- Toggling reduced-motion live drops the page to the fade-only branch
- Navigating away and back 5× does not grow `ScrollTrigger.getAll().length` (INV-1)
- `next build` succeeds with zero type errors

**Escalate if** Lenis and ScrollTrigger fight each other after two repair attempts. Do not add ScrollSmoother as a workaround — there is exactly one scroll authority in this project.

---

### L2 · Shell

**Goal.** The persistent frame: nav, footer, route transitions, custom cursor.

**Build.** Six routes stubbed (`/`, `/model`, `/why`, `/schemes`, `/roadmap`, `/join`). Crimson curtain wipe on navigation with the destination's roman numeral held in the centre, under 700ms total. Custom cursor: an ink dot lerping behind the pointer, growing over interactive elements, inverting over crimson sections.

**Exit gate:**
- Transition runs both directions on all six routes without a flash of unstyled or double-scrolled content
- `ScrollTrigger.refresh()` fires after the incoming page paints
- Cursor is fully disabled on touch and under reduced motion (INV-2)
- Focus ring survives the cursor work and is visible on every nav item (INV-5)

---

### L2b · Atmosphere

**Goal.** Build the ambient background system in §9. This is the layer that stops a near-white page reading as a blank document, and it has to exist before any content section is judged — you cannot evaluate the hero against an empty white void.

**Build.** The full five-layer stack from §9, with per-route arrangements.

**Exit gate:**
- Screenshot the empty shell at 1440px and 390px. The page must read as *composed* with zero content on it. If it reads as blank, the layer is too faint; if you notice it before you notice the nav, it is too strong
- Chrome DevTools performance panel: the ambient layers cost ≤ 1ms/frame during a scroll (§9.5)
- Grain layer is dynamically imported and falls back to the static tile on a throttled CPU (INV-6)
- Under reduced motion the shapes remain and all drift, parallax, and pointer response stop (INV-2)
- Left alone for 60 seconds the drift never visibly loops or re-syncs

---

### L3 · Preloader

**Goal.** The entrance. Not a spinner.

**Build.** The CTL·Y·ST monogram draws stroke by stroke with DrawSVG while a mono counter runs 000 → 100. One line beneath: `Mumbai · Maharashtra · Est. MMXXVI`. On complete, the monogram translates and scales into its final navbar position via Flip — the preloader *becomes* the logo rather than fading out.

**Exit gate:**
- Gated on `document.fonts.ready`, so no FOUT lands mid-animation
- Hard-capped at 2.2s; proceeds anyway if assets are slow
- The Flip handoff lands pixel-accurate on the navbar mark at both breakpoints
- Skipped entirely under reduced motion (INV-2)

---

### L4 · Home

**Goal.** Hero, ecosystem numbers, the four walls, the tri-fold ecosystem. Real copy only (INV-8).

**Build.** See §8 for the per-section mechanics.

**Exit gate:**
- Screenshots captured and reviewed at 1440px and 390px (§4.1)
- The four-walls horizontal gallery is keyboard-navigable (INV-5) and becomes a vertical stack under 768px (INV-4)
- All five critique questions answered in writing (§4.2)
- No invariant regressed since L3

---

### L5 · The Gap — the signature

**Goal.** The one memorable thing on the site. Two nested sub-loops.

The brand line is *bridging the gap between ideas and execution*. One full-viewport pinned section renders that as two halves of type: `ideas` locked to the left edge, `execution` to the right, separated by an actual void of empty paper. Scroll progress drives them together. As they meet, an ink-bleed runs on the seam — the two words soak into the paper and resolve into `CTLYST` in the crimson. The gap literally closes.

**L5a — mechanic.** Build it in the DOM with a plain CSS crossfade at the seam. Prove the scroll feel first.
> Gate: the closing motion feels weighted and inevitable at three different scroll speeds. If it does not, the shader will not save it — iterate here, not in L5b.

**L5b — shader.** Only after L5a gates, replace the seam with the WebGL ink-bleed via `@react-three/fiber`, dynamically imported.
> Gate: the shader is skipped on `hardwareConcurrency <= 4` and on `(pointer: coarse)`, and the L5a DOM crossfade remains the fallback (INV-6).

**Escalate if** L5a fails three iterations. That means the concept does not work, not that the code is wrong — say so plainly rather than shipping a weak version of the site's only signature.

**Restraint clause.** This is the only pin-and-scrub section in the build. If you find yourself wanting a second one, that is the instinct to cut, not to indulge.

---

### L6 · Remaining routes

**Goal.** `/model`, `/why`, `/schemes`, `/roadmap`.

Run the inner loop **once per route**, gating each separately. Four routes built and then reviewed together is four times the debugging.

**Exit gate per route:**
- Both breakpoints screenshotted and reviewed
- Critique questions answered
- The route's specific mechanic (§8) is present and matches the L0 motion spec
- Zero invariant regressions

**Highest-value target:** the comparison table on `/why`. It is the most persuasive object on the site and is currently a plain HTML table. See §8.

---

### L7 · Join

**Goal.** The form. The conversion point for all three audiences.

**Build.** Underline-only inputs, underline drawing in crimson on focus. Inline validation with real messages — errors explain what happened and how to fix it, and never apologise. On submit, the fields collapse to a single line and a crimson wax-seal mark stamps down, under 800ms.

**Exit gate:**
- Every field reachable and submittable by keyboard alone (INV-5)
- Validation messages are announced to screen readers, not just coloured
- Under reduced motion the seal is replaced by a static confirmation
- The form actually posts and handles both success and failure states

---

### L8 · Hardening

**Goal.** Meet the budget, or report honestly that you did not.

**Actions.** Lighthouse on mobile emulation. Full keyboard traversal with the mouse unplugged. Reduced-motion pass. Route-churn test for leaks.

**Exit gate:**
- LCP ≤ 2.5s on simulated Moto G4 / Fast 3G
- First-load JS ≤ 250KB gzipped (INV-6)
- All eight invariants verified with evidence, logged in `PROGRESS.md`
- Lighthouse numbers reported **including the failures**. A gate reported as passing when it did not is the single worst outcome of this build — worse than a slow site.

---

## §6 — Escalation

When the inner loop hits 3/3 without passing a gate, stop and report in exactly this shape:

```
ESCALATION · L<n>
Goal:        <the loop's goal>
Gate:        <which criterion failed>
Attempts:    1. <what you tried> → <what happened>
             2. …
             3. …
Diagnosis:   <your best theory, stated as a theory>
Options:     A. <path> — costs <x>, risks <y>
             B. <path> — costs <x>, risks <y>
Recommend:   <A or B, and why>
```

Then wait. Do not pick for the human, do not proceed on the assumption they will agree, and do not quietly redefine the gate so it passes.

---

## §7 — Brand (inherited — do not redesign)

The client already chose this and it is correct for the audience. Keep it.

```
--paper        #FDFCF9   page
--paper-warm   #F7F4EC   alternating sections
--ink          #1A1712   primary type
--ink-soft     #4A443A   secondary type
--muted        #857D6E   captions, meta
--rule         #DCD6C8   hairlines
--crimson      #7B2D26   primary accent
--crimson-deep #5E211B   accent hover
--gold         #A8874E   ornament, numerals
```

Also inherited: EB Garamond body, Cormorant Garamond display, roman numeral section markers, the `❦` fleuron, `MMXXVI`, the em-dash-heavy editorial voice. It reads like a printed prospectus, which is exactly right for a service asking retirees to lend their credibility.

**Be aware:** warm cream + high-contrast serif + warm accent is the current default look for AI-generated design. Here it is not a default — it is the client's existing brand and it stays. Which means the site **cannot differentiate on palette**. All differentiation comes from motion, typographic scale, and The Gap. Hold yourself to that.

**One addition.** Push the display scale far past the current site — headlines at `clamp(3rem, 9vw, 9rem)` with tight negative tracking, so a single line of type is a compositional element rather than a heading. And add one utility mono the current site lacks, for eyebrows, section numerals, data labels, and the rupee figures. The tension between a 400-year-old serif and a hard mono is what makes this read as designed in 2026 rather than as a pastiche of a 1930s annual report. Set it small, uppercase, wide-tracked.

**Reference.** The client wants the feel of `landonorris.com` — Webflow, GSAP, WebGL, Rive, Awwwards Site of the Year. Take the motion *vocabulary*: real preload sequence, inertial scroll, scroll-scrubbed timelines, horizontal galleries inside a vertical page, WebGL as atmosphere, magnetic cursor, per-line text reveals. Take **none** of its visual language — lime green and F1 kinetics would destroy this brand.

---

## §8 — Section mechanics

| Section | Mechanic |
|---|---|
| Hero | SplitText by line, each masked by an `overflow:hidden` wrapper, translating up from 110% at 0.06s stagger. Faint letterpress texture on very slow parallax behind |
| Ecosystem numbers | Counters driven by ScrollTrigger **scrub**, so the figure tracks scroll position rather than firing once. Figures in mono at large size, units in Garamond italic beneath |
| The four walls | Pinned horizontal gallery, four full-height panels translating on x. The Lando mechanic applied to content that earns it — scrolling past them *is* hitting them |
| The Gap | §5. The signature |
| Tri-fold ecosystem | Hovered column expands, other two compress — a **Flip layout animation**, not a scale transform (INV-3). Cursor becomes a crimson disc holding the pillar numeral |
| Comparison table (`/why`) | Rows reveal in sequence; the CTLYST row arrives last and differently — a crimson rule draws across it with DrawSVG. Competitors' blank cells get a hairline dash that draws in, CTLYST's get a check. The visual asymmetry makes the argument |
| Schemes | Six cards. Rupee figures enormous in mono, counting on scrub. Hover lifts the card and traces a gold hairline around its perimeter |
| Roadmap | Vertical rule drawing down the page with DrawSVG; each stage's dot fills crimson as the rule passes. Genuinely a timeline, so numbered markers are earned **here and only here** |
| Join | §7 loop L7 |

**Keep the candour section on `/why`** — the passage where the client admits the concept is not unique. It is the most persuasive thing on the site precisely because no one else writes it.

---

## §9 — Ambient background system

The reference site's off-white page is not empty. It carries enormous hairline outline shapes at roughly 3% opacity, drifting continuously, over a faint grain. That layer is doing most of the work — remove it and the same page reads as an untouched document. Build the equivalent here.

**Do not reuse the reference site's shapes.** Those forms are that driver's own helmet-design signature and his intellectual property. Take the technique; draw your own artwork.

### §9.1 — The motif

**Guilloche.** The interlaced hairline engraving found on banknotes, share certificates, bond paper, and government instruments.

The justification, because it needs one: CTLYST's entire argument is that ₹10,000 crore in the Fund of Funds and ₹945 crore in the Seed Fund Scheme already exist and almost nobody claims them. The visual language of certified financial paper is drawn from the subject's own world, it reinforces the printed-prospectus identity the client already chose, and essentially no startup site uses it. It is the atmosphere layer that could only belong to this brief.

Author the curves yourself as SVG paths, 4–8 bezier segments each. **Do not install a blob-generator library** — those produce a recognisably generic organic shape that will read as templated. Derive the forms two ways and mix them: interlaced guilloche rosettes, and enormously scaled fragments of the brand's own letterforms, the `❦` fleuron and the CTL·Y·ST monogram blown up until the viewport crops them into abstraction.

### §9.2 — Layer stack

| Layer | Content | Opacity | Motion |
|---|---|---|---|
| **A · base** | Flat `--paper`, or `--paper-warm` on alternating sections | 1 | none |
| **B · fibre** | Paper grain. WebGL simplex noise, or a static tiled PNG fallback | 0.02–0.03 | drifts ~0.02 units/s |
| **C · guilloche** | 3–5 giant hairline curves, `stroke: --rule`, 0.5px, `fill: none`, scaled 60–140vw | 0.04–0.07 | §9.3 |
| **D · wash** | Section-scoped tint — crimson at 2% behind `/why`, gold at 2% behind `/schemes` | 0.02 | fades on section enter |
| **E · content** | Everything the reader came for | 1 | §8 |
| **F · vignette** | Radial edge darkening, holds the composition in from the browser chrome | 0.03 | none |

Layer C is the one in the screenshot. Layer B is why the white doesn't look like a `#FFFFFF` fill. Neither is optional.

### §9.3 — Motion rules for layer C

- **Continuous drift.** Each shape gets its own duration between 40s and 90s, `linear`, looping. Translate and rotate only — never scale (INV-3). Choose durations that share no common factor (e.g. 47s, 61s, 73s) so the arrangement never re-syncs into a visible loop.
- **Scroll parallax.** Layer B moves at 0.05× scroll, layer C at 0.15×, content at 1×. Depth comes from that differential alone. No blur, no scale, no z-translation.
- **Pointer response.** Layer C lerps toward the pointer at a factor of 0.02, capped at 24px of total displacement. The feeling to hit is that the page *noticed* the cursor, not that it is following it. If a reviewer can describe what the background did, it moved too far.
- Every value above is a named token in the §4.3 table, not a magic number in a component.

### §9.4 — Per-route arrangement

Each of the six routes gets its own arrangement of the same shape set — different positions, scales, and rotations, same vocabulary. Crossfade between arrangements during the L2 curtain transition. The reader should feel they are moving through a bound document rather than reskinning one page.

### §9.5 — Degradation and gates

- Layer B is dynamically imported and skipped entirely on `hardwareConcurrency <= 4` or `(pointer: coarse)`, falling back to the static tile (INV-6)
- Layer C is a single `<svg>` promoted with `will-change: transform` — one composited layer, not five
- Mobile: 2 shapes maximum, drift only, no pointer response (INV-4)
- Reduced motion: shapes remain, all drift, parallax, and pointer response stop. The shapes are composition, not decoration — they stay (INV-2)
- **Budget:** the ambient layers together cost ≤ 1ms/frame during scroll, measured in the performance panel. Over budget, drop a shape rather than lowering the frame rate

### §9.6 — One related technique

The screenshot also caught the reference site's hero mid-transition: the portrait sliced into horizontal bands shearing apart from each other. That is a state-driven slice-and-shear, not a filter.

The CTLYST translation is **misregistration**. During any hero or route transition, offset the crimson channel of the type by 2–4px on one axis for the duration of the transition only, so the page momentarily looks like a print plate slightly out of register, then snaps true. It costs one extra transform, it belongs entirely to the letterpress identity, and it does the same job as the slice — signalling that the page is a made object rather than a rendered document.

Use it in two places at most across the whole site. It stops being a signature the third time.

---

## §10 — Workflow correction

The client's flowchart models CTLYST as a single founder-side funnel, which contradicts the plan document's own description of a three-sided market. **Do not put the old flowchart on the site.** If a process diagram appears anywhere — likely `/model` — build it from this corrected model:

- **Three intake pipelines, not one.** Founders; mentors (application → credential verification → onboarding → capacity tracking); and the scheme registry (eligibility rules, freshness date, source link).
- **Sign-up moves after intake.** Never gate the first useful moment behind an account.
- **Diagnosis replaces self-selection.** The old flow lets founders pick their own support need from a menu. The plan explicitly says CTLYST clarifies the real bottleneck rather than taking the stated need at face value — so the menu is wrong. Intake captures the stated need; a human diagnosis step reframes it.
- **Two parallel tracks, not one match.** Mentor track (match → accept → engage → milestone reviews) and capital track (eligibility screen → shortlist → application support → submission → outcome) run on different clocks. The old diagram collapses them into one box, which hides the entire revenue mechanism — the success fee triggers on the capital track, at disbursal.
- **Failure states are drawn, not assumed.** No mentor available. Founder silent 21 days. Engagement stalled at a milestone. Application rejected. Each gets an explicit path.
- **The loop returns to diagnosis, never to intake.** A founder who shipped a prototype and now needs capital is a different person from the one who walked in.
- **The outcome ledger is terminal.** Success is a specific outcome — prototype built, grant secured — never a connection made. That record feeds back as signal for future matches.
- **Tag every node Manual / Assisted / Automated.** The roadmap says the platform is earned by evidence, automating only what is proven necessary by hand. Tagging makes the diagram double as the build backlog: everything starts Manual and graduates as volume justifies it.

Render as SVG in the brand palette with the same DrawSVG treatment as the roadmap. No diagramming library.

---

## §11 — Stack

```bash
npx create-next-app@latest ctlyst --typescript --tailwind --app --eslint
npm i gsap lenis motion
npm i three @react-three/fiber @react-three/drei @react-three/postprocessing
npm i -D @types/three
npm i @rive-app/react-canvas   # only if a .riv monogram is supplied
```

**GSAP 3.13 plugins are all free** — SplitText, ScrollTrigger, Flip, DrawSVG, MorphSVG included in the standard npm package since April 2025 under Webflow's ownership. No Club licence. Do not hand-roll a character splitter on the assumption SplitText is paid; that assumption is out of date and produces worse output.

`motion` is for route transitions only. Scroll work is GSAP's job. Two libraries doing one job is how these builds bloat.

**Do not add** a component library, a CMS, an animation preset pack, or anything shipping its own design system. §7 is the design system.