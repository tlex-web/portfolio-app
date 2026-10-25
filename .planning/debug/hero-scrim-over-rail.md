---
status: diagnosed
trigger: "G-09-4 (part N1): at 768-1023 px the hero scrim dims the altimeter rail labels and readout (UI-REVIEW N1); N2 covered by waypoint2-label-and-kicker.md (b); N3 accepted"
created: 2026-10-25T16:00:00Z
updated: 2026-10-25T17:30:00Z
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED (see Resolution). The full-bleed hero scrim paints above the sticky stage and, below lg:, is a full-width vertical gradient, so it covers the rail at 0.54-0.90
test: done (static + 3D sweeps, scrim-hidden counterfactual, z-index/clip/lift prototypes)
expecting: n/a
next_action: none (diagnose only); hand off to /gsd-plan-phase 09 --gaps
bug_class: Bohrbug (deterministic CSS layering)
n2_note: G-09-4 N2 (375 place line leading "·") is diagnosed in .planning/debug/waypoint2-label-and-kicker.md part (b); not re-investigated here
relation_to_deferred_item: Separate defect with a shared trigger. The deferred "hero scrim switches at lg: not 768" item is about the hero text alpha (copy side); N1 is the rail side. Amending the spec to lg: leaves N1 fully in place; reverting to the spec's 768 to-r stops clears the rail but brings back the C6 copy-edge problem (copy glyphs end at 552, long label starts at 576 at 768). N1 needs its own fix and test

## Symptoms

expected: The rail's tick labels (4,478 / 2,760 approx. / 2,585 / 1,668 m) and the bottom readout (1,617 m) are as readable at 768-1023 as at 1280+, at the start position (p=0) and as the visitor scrolls.
actual: User reported at UAT: "N1 gap, N2 gap, N3 accept"
errors: None reported
reproduction: Test 4 in .planning/phases/09-home-ascent/09-UAT.md
started: Discovered during UAT, from 09-UI-REVIEW findings

## Eliminated

## Evidence

- timestamp: 2026-10-25T16:00:00Z
  checked: Knowledge base (.planning/debug/knowledge-base.md)
  found: No knowledge base file exists; no MemPalace match attempted (no prior resolved scrim/rail session)
  implication: No known-pattern candidate

- timestamp: 2026-10-25T16:02:00Z
  checked: components/home/HeroBlock.tsx:17-18, 50-51; AscentHero.tsx:66-72; AscentController.tsx AscentStageFrame; AltimeterRail.tsx:64-115
  found: SCRIM = absolute inset-0 -z-10, vertical bg-linear-to-t surface/90 -> /75 at 60% -> /50 below lg:, horizontal to-r 0.85 -> 0.70 at 60% -> transparent at 90% from lg:. Hero block is `relative isolate` and full track width; the track is `relative`, later in DOM than the sticky stage (no z-index on either). The rail (labels text-ink-muted, readout bg-surface-raised text-ink) lives inside the stage.
  implication: The hero block's stacking context paints after the stage's (both z-index auto/0, DOM order), so the scrim covers the whole stage width including the rail; -z-10 only orders it inside the hero's own isolate context

- timestamp: 2026-10-25T16:03:00Z
  checked: 09-UI-SPEC.md:77 (z-order row), :275 (hero scrim row), :364 (rail scrim); 09-01-PLAN.md:159 (C6)
  found: Spec z-order puts the whole stage (rail included) under the track by design. The spec's >=768 scrim was to-r, transparent at 75%, which leaves the rail clear at 768. C6 (Tim, 2026-10-25) moved the to-r switch to 1024 to fix the hero column-edge alpha, and its arbiter was B7 (hero text only); the rail was not considered.
  implication: N1 is the rail-side consequence of the C6 breakpoint shift over a full-bleed scrim box that the spec layers above the rail

- timestamp: 2026-10-25T16:20:00Z
  checked: Static-mode composed-contrast sweep (scratchpad n1-rail-contrast.cjs, output n1-static.txt; dev server, WebGL off, motion on). Composed = per-pixel ratio of a solid text-colour box vs the transparent-text box, both under every overlay
  found: p=0 at 768x900 / 900x900 / 1023x900 / 768x1024 — 1,668 m 1.31/1.31/1.31/1.30; 2,585 m 1.45/1.46/1.46/1.46; 2,760 m approx. 1.68/1.72/1.74/1.67; 4,478 m 2.46/2.45/2.47/2.49; readout 1,617 m 1.29/1.29/1.29/1.27. 1024x900 p=0 — 6.88/6.68/4.57/6.42, readout 13.13. 1280x900 p=0 — 7.30/7.02/4.45/7.02, readout 14.71. Waypoint 2 centred (hero gone) at 768 — 6.75/6.75/4.71/6.58, readout 14.99 (same as 1280: 7.02/7.02/4.98/7.02). At 25% of the first leg the labels get worse (1.16-1.73) because the denser bottom of the gradient moves up over them; the readout clears once the scrim's bottom edge passes it (about 70 px of scroll). The B8-style number (raw computed text colour vs composed background) reads 7.58-8.63 for the same labels under the scrim
  implication: Confirmed and exactly breakpoint-bounded: 768-1023 is 3-5x below 1280 only while the hero block overlaps the stage (p=0 through most of the first leg); 1024 jumps back to the 1280 level. B8's method cannot see an overlay that paints above the text. Secondary: the lg: tail (to-transparent at 90%) still puts 0.09-0.18 over the left of "2,760 m approx." at 1024-1280, 4.45-4.57 at p=0

- timestamp: 2026-10-25T16:30:00Z
  checked: Counterfactual, the same sweep with only the hero scrim display:none (n1-static-noscrim.txt), plus a 1440 reference (n1-static-1440.txt)
  found: 768 p=0 with no hero scrim: 7.19/6.75/4.71/6.58, readout 14.99 (from 1.31/1.45/1.68/2.46, 1.29). 1023: 7.21/6.84/5.85/6.67, 14.99. 1280: 7.30/7.02/4.98/7.02. 1440 as is p=0: 7.30/6.93/5.22/6.74, 14.99
  implication: The hero scrim is the only cause; nothing else in the stack (rail scrim, poster, track) dims the rail

- timestamp: 2026-10-25T16:45:00Z
  checked: 3D-mode sweep (n1-3d.txt; SwiftShader, __ascentBudgetMeasureOnly, data-ascent-mode reached "3d" at all four sizes)
  found: p=0 at 768/900/1023 — 1.30-1.31 / 1.45-1.46 / 1.66-1.74 / 2.45-2.46, readout 1.29: the same as static to 0.02, because at alpha 0.54-0.89 the scrim dominates whatever the stage shows. wp2 centred: 768 7.12/7.64/5.11/6.74, 14.99 (1280: 7.21/6.83/5.28/8.56). 1280 3D p=0: 7.30/6.87/4.31/7.02, readout 14.71; leg1-25% "2,760 m approx." 4.23
  implication: Static and 3D do not differ meaningfully for N1. The lg: tail case (secondary) fails 4.5 in 3D at 1280 (4.23-4.31) for the long label only

- timestamp: 2026-10-25T17:00:00Z
  checked: Baselines e2e/visual/routes.spec.ts-snapshots/home/768-ascent-start-visual-dark-linux.png vs 1440-ascent-start (no 1280 start baseline exists)
  found: At 768 the tick labels, rail line, tick marks, readout plate and accent marker are barely visible; at 1440 all read clearly (the readout plate and cyan marker stand out)
  implication: The baseline encodes the defect; it was committed as-is at 09-14

- timestamp: 2026-10-25T17:05:00Z
  checked: Computed styles and geometry (n1-geometry.cjs, n1-geometry.txt) at 768x900, 768x1024, 900, 1023, 1024x768, 1280
  found: stage position sticky z auto container-type size; track relative z auto (no stacking context); hero relative z auto isolation isolate; scrim absolute z -10. Hero scrim box = the full stage width at every size (0-758 at 768). Copy glyph right edge 552 at 768 (thesis), column box 24-600; rail box 566-726, long label 576-702, rail scrim 534-758. Cards and summit plaque end at x 472 (480 at 1024), 94 px or more left of the rail box at every md+ size
  implication: Sticky makes the stage a stacking context painted first (tree order); the hero's isolate context paints after it, and its -z-10 scrim sits at the bottom of that context, which is still above the whole stage. At 768 the copy glyphs and the long label are 24 px apart, so any fix by scrim geometry alone is tight at 768 and gets easier as the viewport widens (the copy is fixed at max-w-xl, the rail tracks the right edge)

- timestamp: 2026-10-25T17:15:00Z
  checked: Prototype variants via injected CSS/DOM (n1-proto.txt), static, 768 and 1023, p=0 and p=0.05
  found: (zrail) z-index:50 on [data-ascent-rail]: unchanged 1.31/1.45/1.68/2.46, readout 1.29. (clip) hero scrim right:12rem only between 48rem and 64rem: 768 7.19/6.75/4.71/6.58, readout 14.99; 1023 7.21/6.84/5.85/6.67, readout 14.99. (lift) rail box moved to a sticky aria-hidden layer after the track (rail scrim left in the stage): 768 8.63/8.42/7.58/7.85, readout 14.99; 1023 8.63/8.48/8.00/7.92, readout 14.99
  implication: The rail cannot be lifted with z-index inside the stage (stacking context). Both a scrim-box limit and a separate rail layer fix it. The lift reads better than 1280 today because the labels then sit on the hero scrim

- timestamp: 2026-10-25T17:20:00Z
  checked: Ascent progress mapping (n1-progress.cjs) at 768/1023/1280 x 900
  found: S 836, distance 4180, start 0, arrivals [0.2, 0.4, 0.6, 0.8, 1]. leg1-25% is p 0.05, leg1-50% p 0.10. The scrim leaves the 4,478 label only at about scrollY 768 (p 0.18)
  implication: The rail is dimmed through nearly the whole tilt-in (p 0 to 0.2), not just at p=0; the readout clears at about p 0.017

- timestamp: 2026-10-25T17:25:00Z
  checked: e2e/home-modes.spec.ts:113-183 (worstContrastBehind / worstContrastIn) and B8 (389-414); grep of tests that tie the rail to the stage
  found: The helper reads getComputedStyle(el).color (the raw token) and compares it with composed background pixels. That is right for text ABOVE a scrim (B7, hero) but wrong for text UNDER one: the glyph is tinted too. Replicated as "b8style" in the sweep: 7.58-8.63 at 768 p=0 where composed is 1.31-2.46. B8 runs only at #summit (768x1024, 1440x900). e2e/home-ascent.spec.ts:336 asserts stage().locator('[data-ascent-rail]') count 1 (rail inside the aria-hidden stage); CameraRig.tsx:234 and AscentController.tsx:148 read [data-ascent-rail-scrim] from inside the stage
  implication: Adding "B8 at p=0 at 768" with the existing helper would PASS on today's broken build. The new test must compose the text colour through the overlays. A lift fix must keep the rail scrim in the stage and rewrite the home-ascent:336 containment assertion

reasoning_summary:
  hypothesis: "The rail is dimmed at 768-1023 because the hero scrim box (HeroBlock.tsx:51, absolute inset-0 on the full-width hero block) paints above the sticky stage (AscentHero.tsx:72 track after the stage; HeroBlock.tsx:50 isolate keeps the -z-10 inside the hero's own context, which still paints after the stage) and, below lg:, is a full-width vertical gradient (HeroBlock.tsx:18, 0.50 at the top to 0.90 at the bottom) with no horizontal falloff, so it lies at 0.54-0.89 over the rail"
  confirming_evidence:
    - "Composed contrast 1.29-2.47 at 768/900/1023 p=0 vs 4.45-7.30 at 1280, in static and 3D"
    - "Counterfactual: hiding only the scrim restores 4.71-7.21 / 14.99 at 768 and 1023"
    - "Breakpoint step: 1023 gives 1.31-2.47, 1024 gives 4.57-6.88 (the lg: switch)"
    - "z-index on the rail changes nothing (stacking-context confinement)"
  falsification_test: "If the hero scrim were not the cause, hiding it would leave the rail dim; it did not"
  candidate_causes:
    - "code/CSS layering: the full-bleed scrim box over the stage (CONFIRMED, necessary)"
    - "config/design decision: C6 moved the to-r switch to lg: and judged it on B7 (hero text) only (CONFIRMED, necessary trigger)"
    - "test gap: B8 is summit-only and its helper is blind to overlays above the text (CONFIRMED, why it shipped)"
    - "data/environment: poster or canvas brightness, scrollbar gutter (ELIMINATED: 3D = static to 0.02; no-scrim values match 1280)"
  and_gate: "yes: dimming needs BOTH a scrim box that spans the rail (full-bleed inset-0 above the stage, by spec z-order) AND a gradient that is non-zero at the rail's x (vertical below lg: per C6). Above lg: the to-r tail is 0.02-0.18 at the rail, so only the long label is touched (4.31-4.57 at 1024-1280 p=0)"

## Resolution

root_cause: "AND-gate of two conditions; ships because of a third. (1) Layering/geometry: HeroBlock's scrim (components/home/HeroBlock.tsx:51, SCRIM at :17-18) is absolute inset-0 on a full-width hero block, so its box spans the whole stage, and the track (AscentHero.tsx:72) paints after the sticky stage, which is its own stacking context, so the scrim lies above the rail (AltimeterRail.tsx:64-115). (2) Gradient below lg: C6 kept the full-width vertical gradient (surface/50 at the top to /90 at the bottom) up to 1023 px, so the alpha over the rail is 0.54-0.89 at p=0 and up to 0.90 during the tilt-in (p 0 to about 0.18). Composed contrast falls to 1.29-2.47:1 against 4.45-7.30:1 at 1280. (3) Test gap: B8 is summit-only, and its helper (home-modes.spec.ts:122-183) compares the raw text colour, so it is blind to an overlay painted above the text."
fix: "not applied (diagnose only)"
verification: "n/a"
files_changed: []
