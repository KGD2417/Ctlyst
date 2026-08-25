# CTLYST — L0 design plan

Status: awaiting human approval (the only gate a human closes).
Evidence for every claim below is in `evidence/`.

---

## 0 · Tooling check (§4.1) — one gap, needs a decision

| Tool | Status | Used for |
|---|---|---|
| playwright MCP | **working** — `evidence/L0-0-reference-1440.png` | OBSERVE step of every visual loop |
| chrome-devtools MCP | **NOT CONNECTED** | was to be L2b's 1ms/frame budget + all of L8 |

`CLAUDE.md` says both are connected. Only playwright is. `file://` is blocked in the
playwright profile, so observation runs against `python3 -m http.server` on :4599.

This does not block L0–L7. It blocks two specific gates, and I will not report them as
passing on a substitute measurement without you agreeing to the substitute first:

- **L2b ≤1ms/frame** → substitute: `browser_evaluate` running a rAF frame-time sampler
  during a scripted scroll, measured twice — ambient layers mounted vs. removed. The
  delta is the ambient cost. Honest, but it is a frame-time delta, not a devtools trace.
- **L8 LCP on throttled Moto G4 / Fast 3G** → substitute: `npx lighthouse` CLI against
  the production build with `--preset=mobile`. Real Lighthouse numbers, real throttling,
  just not driven through the MCP. Requires letting me run the lighthouse CLI.

Alternative: you install chrome-devtools MCP and I use it as `CLAUDE.md` intends.

---

## 1 · Type scale

Display = Cormorant Garamond 500. Body = EB Garamond. Labels/data = IBM Plex Mono 400.
The negative tracking on display sizes is what makes a headline a compositional element
rather than a big heading (§7).

| Token | Family | Size | Line-height | Tracking | Used on |
|---|---|---|---|---|---|
| `display-xl` | Cormorant 500 | `clamp(3.25rem, 9vw, 9rem)` | 0.92 | −0.03em | Hero h1; the two Gap words |
| `display-l` | Cormorant 500 | `clamp(2.75rem, 7vw, 6rem)` | 0.96 | −0.025em | Route h1 |
| `display-m` | Cormorant 500 | `clamp(2rem, 4.4vw, 3.6rem)` | 1.06 | −0.015em | Section h2 |
| `subhead` | Cormorant 600 | `clamp(1.35rem, 1.9vw, 1.75rem)` | 1.2 | −0.01em | Card / row h3 |
| `lede` | EB Garamond 400 italic | `clamp(1.2rem, 1.6vw, 1.45rem)` | 1.55 | 0 | Section ledes, page-sub |
| `body` | EB Garamond 400 | `1.15rem` | 1.7 | 0 | Prose (inherited, unchanged) |
| `caption` | EB Garamond 400 italic | `0.95rem` | 1.6 | 0 | Sources, table captions, `--muted` |
| `mono-label` | IBM Plex Mono 400 | `0.6875rem` (11px) | 1 | **0.28em**, uppercase | Eyebrows, section numerals, data labels |
| `mono-data` | IBM Plex Mono 400 | `clamp(2.5rem, 6vw, 5rem)` | 1 | −0.02em, `tabular-nums` | Rupee figures, scrubbed counters |

`mono-data` must set `font-variant-numeric: tabular-nums` or scrub-driven counters will
jitter horizontally as digits change width.

## 2 · The mono face — IBM Plex Mono

**Picked on evidence, not taste.** `evidence/L0-0-monotest.png` measures the rupee glyph
against the digit width in all four candidates:

| Face | `0` width | `₹` width | Verdict |
|---|---|---|---|
| JetBrains Mono | 24.00 | 20.78 | **₹ missing** — falls back mid-figure |
| Roboto Mono | 24.00 | 20.78 | **₹ missing** |
| Space Mono | 24.48 | 24.48 | present, but the face is retro-quirky and fights Cormorant |
| **IBM Plex Mono** | **24.00** | **24.00** | present, correct, monospaced |

JetBrains Mono was my first instinct and it is disqualified: this brand sets ₹945 Cr and
₹10,000 Cr at `mono-data` size as its most persuasive objects, and the glyph would have
dropped to a fallback serif inside the figure. Plex Mono is the only candidate that is
both hard-edged enough to fight a 400-year-old serif and complete enough to set the money.

Set small, uppercase, tracked 0.28em, its rectangular terminals read as engraved data
labels rather than as code.

## 3 · Motion tokens (§4.3)

Named once, referenced forever. No ad-hoc durations anywhere in the codebase.

```
/* durations */                    /* eases — INV-7: no elastic/back/bounce/spring */
--dur-instant   120ms              --ease-out    power3.out
--dur-quick     280ms              --ease-deep   power4.out
--dur-base      560ms              --ease-brand  cubic-bezier(0.22, 1, 0.36, 1)
--dur-slow      900ms
--dur-grave    1400ms              /* staggers */
                                   --stagger-line  0.06s
/* fixed sequences */              --stagger-card  0.09s
--curtain-total 680ms              --stagger-row   0.07s
--preload-cap  2200ms
--seal          780ms              /* misregistration (§9.6), 2 uses max */
                                   --misreg  3px
/* ambient drift — all prime, never re-syncs */
--drift-a 47s   --drift-b 61s   --drift-c 73s   --drift-d 89s

/* parallax + pointer (§9.3) */
--par-fibre 0.05   --par-guilloche 0.15   --par-content 1
--pointer-lerp 0.02   --pointer-cap 24px
```

Target adjective is **grave**. `--dur-grave` is for exactly two things: the Gap seam and
the preloader mark. Everything else lives at `base` or below.

## 4 · The guilloche shape set

Four authored curves plus two brand letterforms. Rendered at inspection weight and at
shipping weight in `evidence/L0-2-guilloche-1440.png`; source in `design/guilloche.svg`,
generator in the scratchpad (own math — no blob library, per §9.1).

| | Shape | Construction | Segments |
|---|---|---|---|
| G1 | Rosette | 4 petals × 2 cubics, mirrored at 45° to interlace | 8 + 8 |
| G2 | Trefoil | 3-petal outer + 6-petal counter-ring | 6 + 12 |
| G3 | Seal | 3 concentric off-centre ovals, 4 cubics each | 12 |
| G4 | Lathe band | two counter-phase waves, 6 cycles — banknote border | 12 |
| G5 | The **Y** | CTL·**Y**·ST monogram, Cormorant italic, outlined, viewport-cropped | text |
| G6 | Fleuron ❦ | brand fleuron, outlined, blown to 1150px | text |

Each petal is built by rotating one hand-authored petal, so symmetry is guaranteed by
construction rather than by a spline fit. My first attempt used a Catmull-Rom fit through
alternating radii; it produced asymmetric scribbles (`evidence/L0-1-guilloche-1440.png`)
and was thrown away.

G5/G6 are `<text>` with `fill:none`, not traced outlines — they inherit the real brand
letterforms for free and cost one extra font-dependent paint into a layer that is
composited once. If `document.fonts.ready` has not resolved they simply do not paint,
which at 0.5 opacity nobody can see.

**G2-trefoil is the accessory to remove** (§4.2 q5) if the L2b frame budget is tight. It
is the weakest form of the set and the closest to a generic organic blob.

### 4.1 · Amendment to §9.2 — its stated values render as nothing

§9.2 specifies layer C at `stroke: --rule`, 0.5px, opacity 0.04–0.07. **That combination
is invisible.** `--rule` `#DCD6C8` on `--paper` `#FDFCF9` is only ~33 levels apart before
opacity; at 6% on a sub-pixel line the result is ~2 levels — below anything a display
resolves. Panel II of `evidence/L0-2-guilloche-1440.png` is the failure; the ladder in
`evidence/L0-3-calibrate-1440.png` is the fix:

| | stroke | opacity | Reading |
|---|---|---|---|
| A | 0.5px | .06 | **invisible** — the brief's literal values |
| B | 1px | .18 | still too faint to compose the page |
| C | 1px | .35 | visible, slightly thin |
| **D** | **1.25px** | **.50** | **composed, clearly recessive — the pick** |
| E | 1.5px | .65 | too strong; shapes read before the copy |
| F | 1px | .07 on `--ink` | ≈ C's weight, but cooler — loses the warm-paper cast |

Proposed tokens: `--guilloche-stroke: 1.25px` (with `vector-effect: non-scaling-stroke`,
so it stays 1.25 CSS px at any shape scale) and `--guilloche-opacity: 0.5` on `--rule`.

The brief's *intent* — "you should not notice it before you notice the nav" — is preserved
exactly; only the numbers change, because §9.2's numbers assume a stroke darker than
`--rule`. Row F is what the brief's numbers would have meant with an ink stroke. **This is
the one substantive deviation in this plan and I want it approved explicitly.**

### 4.2 · Per-route arrangements (§9.4)

Same vocabulary, six compositions. Crossfaded during the L2 curtain.

| Route | Shapes | Placement | Wash (layer D) |
|---|---|---|---|
| `/` | G1, G4, G5 | rosette bleeding off top-left; lathe low-centre; **Y** cropped at right | — |
| `/model` | G4, G3 | lathe rotated 90° as a right-hand spine; seal centre-left | — |
| `/why` | G3, G1 | seal centred — the certificate of authority, behind the comparison argument | crimson 2% |
| `/schemes` | G1, G3 | rosette top-right; seal bottom-left | gold 2% |
| `/roadmap` | G4, G5 | lathe vertical, echoing the drawn timeline rule; **Y** cropped at bottom | — |
| `/join` | G3 | seal alone, centred behind the form — prefigures the L7 wax stamp | — |

Mobile: first two shapes of each route only, drift only, no pointer response (§9.5).

## 5 · Section motion spec

One line per section. Every duration/ease/stagger is a §3 token.

**`/` home**
| Section | Mechanic |
|---|---|
| Hero | SplitText by line, each line in an `overflow:hidden` mask, `y:110%→0`, `--stagger-line`, `--ease-deep`. Misregistration (§9.6) fires **here — use 1 of 2** |
| Ecosystem numbers | Counters on ScrollTrigger **scrub** — figure tracks scroll position, not a one-shot. `mono-data` figures, unit in Garamond italic beneath |
| The four walls | Pinned horizontal gallery, 4 full-height panels on `x`. **Mobile: separately-authored vertical stack** (INV-4) |
| The Gap | §6 below — the signature. The only pin-and-scrub section in the build |
| Tri-fold ecosystem | Hovered column expands, other two compress — **Flip layout animation**, not scale (INV-3). Cursor becomes a crimson disc holding the pillar numeral |
| First step | Fade + rise, `--dur-base` |

**Other routes**
| Route · section | Mechanic |
|---|---|
| `/model` · six steps | Ledger rows reveal on `--stagger-row` |
| `/model` · process diagram | **§10 corrected model**, hand-authored SVG, DrawSVG stroke-in. Three intake pipelines, diagnosis after intake, two parallel tracks, drawn failure states, loop returns to diagnosis, terminal outcome ledger, every node tagged Manual/Assisted/Automated. The old single-funnel flowchart does not appear |
| `/why` · comparison table | **Highest-value target.** Rows reveal in sequence; the CTLYST row arrives last and differently — a crimson rule draws across it with DrawSVG. Competitor blanks get a hairline dash that draws in; CTLYST cells get a check. The asymmetry makes the argument |
| `/why` · candour | Held plain. No motion beyond a fade. It persuades by being unadorned |
| `/schemes` · six cards | Rupee figures in `mono-data`, counting on scrub. Hover lifts the card and traces a gold hairline around its perimeter with DrawSVG |
| `/roadmap` · timeline | Vertical rule draws down with DrawSVG; each stage dot fills crimson as the rule passes. Numbered markers are earned **here and only here** |
| `/join` · form | §L7 — underline-only inputs drawing crimson on focus; on submit fields collapse to one line and a crimson wax seal stamps, `--seal` |

## 6 · The Gap — wireframe

`display-xl`, both words locked to opposite edges, a real void of paper between them.
Scroll progress drives them together; the seam ink-bleeds and resolves to CTLYST.

```
┌─ 1440 ─────────────────────────────────────────────────────────────────┐
│ B fibre 0.05× ·  C guilloche 0.15× ·  content 1×      ← parallax rates │
│                                                                        │
│  ╭ G1 rosette, cropped                          G5 "Y", cropped ╮      │
│                                                                        │
│                                                                        │
│  ideas                    ·  void  ·                    execution      │
│  └ pinned left edge          the gap                 pinned right ┘    │
│                              ↓ scrub                                   │
│  progress 0.0 ─────────────────────────────────────────────── 1.0      │
│                                                                        │
│              ideas ····· CTLYST ····· execution                        │
│                     ↑ seam: L5a CSS crossfade                          │
│                       L5b WebGL ink-bleed, dynamically imported        │
│                                                                        │
│  F vignette 0.03 holds the composition off the browser chrome          │
└────────────────────────────────────────────────────────────────────────┘

390 (INV-4 — separately authored, nothing pinned, nothing sideways)
┌──────────────┐
│   ideas      │  stacked. The gap becomes vertical whitespace,
│              │  closed by an opacity-only crossfade on enter.
│   ·  ·  ·    │  No pin. No scrub. No shader.
│              │
│  execution   │
│              │
│   CTLYST     │
└──────────────┘
```

## 7 · Hero — wireframe

```
┌─ 1440 ─────────────────────────────────────────────────────────────────┐
│ ░ A base --paper                                                       │
│ ░ B fibre — WebGL simplex, 0.02–0.03, drifts 0.02u/s, static PNG fallback
│ ░ C guilloche — G1 top-left bleed · G4 lathe low · G5 "Y" right crop    │
│                  drift 47s / 61s / 73s, linear, translate+rotate only   │
├────────────────────────────────────────────────────────────────────────┤
│  MUMBAI · MAHARASHTRA · EST. MMXXVI                    ← mono-label     │
│  CTL·Y·ST      home  model  why  schemes  roadmap   [JOIN]              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  BRIDGING THE GAP BETWEEN IDEAS AND EXECUTION      ← mono-label, gold   │
│                                                                        │
│  No good idea                          ← display-xl, lh .92, −0.03em    │
│  should fail for                         SplitText per line,            │
│  want of guidance.                       masked, y:110%→0, 0.06s stagger│
│                                                                        │
│  CTLYST unites experienced mentors…    ← lede, EB Garamond italic       │
│                                                                        │
│  [ BEGIN YOUR JOURNEY ]  [ READ THE MODEL ]                            │
│                                                                        │
│ ░ F vignette 0.03                                                      │
└────────────────────────────────────────────────────────────────────────┘
```

Note the hero is now **left-aligned**, where the current site centres it. Centred display
type at `9vw` with negative tracking reads as a wedding invitation; left-aligned it reads
as a masthead, and it gives layer C somewhere to live on the right without colliding.

## 8 · Copy provenance (INV-8)

All home/route copy comes verbatim from `reference/CTLYST.html`. Two places need a source
ruling before I build them:

1. **The Gap section** — the words are `ideas`, `execution`, `CTLYST`, from the brand line
   "Bridging the gap between ideas and execution" (site topline + footer motto). Clean.
2. **The §10 corrected process diagram** — node labels will be drawn from
   `CTLYSTProjectPlanWEB.html` §3.3 (the six steps), §11.1 (manual-first, which grounds
   the Manual/Assisted/Automated tags) and §16 Risks (which supplies the failure states:
   mentor retention → "no mentor available"; weak demand → "founder silent"). Nothing
   invented. Flagging because §10's *structure* comes from `BRIEF.md`, which is not a
   canonical source — only its labels will trace.

## 9 · Open decision — the form endpoint (L7)

The current site has no backend; it validates client-side and writes to `localStorage`.
L7's gate says "the form actually posts and handles both success and failure states."

Proposed: a Next.js route handler at `/api/join` that re-validates server-side (never
trust the client), appends to a JSONL file, and returns real 200/4xx/5xx so both states
are genuinely exercised. Wiring it to an actual inbox needs a provider and credentials
you supply — say the word and I will leave a single documented seam for it.

## 10 · Critique pass (§4.2 q1) — what changed after asking

> *Would I have produced this exact thing for any editorial site brief?*

Three things failed that test and were revised:

- **Centred hero.** Every editorial template centres the hero. Moved to left-aligned
  masthead — and it earns its keep by opening the right side for layer C.
- **JetBrains Mono.** The reflex mono pick for "hard mono in 2026". Testing it killed it
  on the rupee glyph. The right answer came from measuring, not from taste.
- **A second pinned section.** I had wanted the four walls *and* the Gap both pinned and
  scrubbed. §5's restraint clause is correct: the four walls pin and translate on `x`
  only, the Gap is the sole pin-and-scrub. Cut before it was built.

Still true to defaults and accepted deliberately: warm cream + high-contrast serif is
the client's inherited brand (§7) and cannot change. All differentiation is carried by
motion, the display scale, and the Gap.

---

## Approve, and I start L1

Three things I need from you:

1. **The §9.2 amendment** (1.25px / 0.5 opacity instead of 0.5px / 0.04–0.07) — §4.1
2. **The tooling substitute** for L2b and L8, or install chrome-devtools MCP — §0
3. **The form endpoint** ruling — §9
