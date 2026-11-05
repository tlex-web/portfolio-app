---
status: diagnosed
trigger: "UAT G-09-2: At 375x667, 768x1024, 820x1180 and 1024x768 the four 3D pins at #summit are hidden behind the summit plaque, and below 1280 px the static poster pins are under the plaque (D-03)."
created: 2026-10-25T13:59:55Z
updated: 2026-10-25T14:45:00Z
goal: find_root_cause_only
---

## Current Focus

bug_class: Bohrbug (deterministic geometry; the same overlap on every render at a given stage size)
hypothesis: CONFIRMED (see Resolution). The pins are placed by stage-relative framing (3D) or a fixed p=0 crop (poster); the plaque is a fixed-pixel, content-sized box. Nothing ties one to the other, so whenever the plaque's share of the stage grows past what the framing was tuned for, they overlap.
test: done. Scratch Playwright measurements on the dev server at 11 sizes, 3D and poster.
expecting: n/a
next_action: return ROOT CAUSE FOUND to the orchestrator (diagnose-only mode)

reasoning_checkpoint:
  hypothesis: "Summit pins sit under the plaque because (a) the plaque is content-sized (478-538 px tall, 448 px wide from md), so its share of the stage grows as the stage shrinks (89% of the height at 375x667, 62% of the width at 768); (b) the 3D summit framing is open-loop: fixed shares of the stage size (narrow lift 0.28h; wide shift 0.095w at 75 deg hfov) tuned at 412x839 and 1280/1440, with a cluster whose px size scales with stage width; (c) the poster pins are fixed UVs of the p=0 crop with no summit placement at all. (d) At 758-767 px canvas widths the rig's narrow switch disagrees with the CSS md breakpoint (scrollbar gutter)."
  confirming_evidence:
    - "Measured: 3D all 4 under the card at 375x667, 360x640, 375x553; pin 3 at 768x1024 (canvas 758, narrow framing); pins 1-3 at 778x1024 (canvas 768, wide framing) and 820x1180; pin 1 (+2 px) at 1024x768 with pin 4 under the scrim. Clear at 390x844, 412x839, 1280x720, 1440x900."
    - "Measured: poster pins under the plaque: 4 at 375x667, 2 (k2, k3) at 412x839, k3 at 768x1024, 820x1180 and 1024x768; clear at 1280 and 1440. Positions match posterFrame math exactly."
    - "Cluster size scales with stage width: 3D anchor spread 144 px at 365 wide vs 158 px at 402 (ratio 1.10 = width ratio); wide 0.297w at both 768 and 1270."
    - "Docked waypoint card at 375x667 is 253 px (42% of the stage, the D-20 '~lower 40%' the 0.2 lift was built for); the summit plaque is 538 px (89%)."
  falsification_test: "If the overlap were a settling/timing artefact, a size inside the failing range would come out clear on a re-run, or the cluster's px size would not track width. Neither happened: results are identical to the 09-12 sweep and the scaling ratios match width ratios."
  fix_rationale: "n/a (diagnose only). Any fix must make pin placement and plaque placement agree by construction: either shrink/move the plaque on short/portrait/mid-width stages, or derive the summit framing from the measured plaque box, and test intersection at the failing sizes."
  blind_spots: "Real mobile browsers size 100svh below the CSS device height (toolbars), so real phones sit further into the failing range than the Playwright sizes suggest; UAT test 1 passed on Tim's phone, model and svh unknown. Measured under SwiftShader on the dev server only; projection is GPU-independent but not re-checked on a production build."
  candidate_causes:
    - "code/layout: SummitPlaque content-sized column (bottom dock below md, centred 448 px left column from md)"
    - "code/framing: share-based summit framing constants and the binary narrow switch in route.ts / CameraRig.tsx"
    - "config/CSS: html scrollbar-gutter: stable makes canvas width (758) disagree with the md media query (768)"
    - "environment: real mobile svh smaller than device CSS height"
    - "data: waypoint UVs (k3 at u 0.459 v 0.52 near the stage centre; k4 at u 0.83 under the rail scrim)"
  and_gate: "yes. An overlap needs BOTH a plaque large relative to the stage AND a pin placement rule that lands in the plaque's region. The same framing is clear at 1280 because the plaque share is small; the same plaque is clear at 412x839 because the free band is large enough."

## Symptoms

expected: All four pins visible beside or above the plaque at the summit, in both the live 3D view and the static poster.
actual: User reported at UAT: "gap plan — pins still hidden behind the plaque"
errors: None reported
reproduction: Test 2 in .planning/phases/09-home-ascent/09-UAT.md
started: Known since 09-12; logged in deferred-items.md; routed to a gap plan after 09-14

## Eliminated

- hypothesis: The 768x1024 overlap is caused only by the scrollbar making the rig choose the narrow framing (H3 as the whole cause).
  evidence: At 778x1024 (canvas exactly 768, so the wide framing, as on an iPad with overlay scrollbars) pins 1-3 sit under the plaque and pin 4 under the scrim, which is worse than the narrow framing's single pin 3. The mismatch is real but only changes which pins overlap; both framings fail at this width.
  timestamp: 2026-10-25T14:35:00Z

- hypothesis: The pins are read before the damped camera settles (a timing artefact).
  evidence: The measure script re-reads pin boxes every 10 frames until two reads are identical; results match the 09-12 sweep exactly (e.g. 1024x768 pin 1 overlaps by 2 px both times; 820x1180 pins 1-3).
  timestamp: 2026-10-25T14:35:00Z

## Evidence

- timestamp: 2026-10-25T13:59:55Z
  checked: .planning/debug/knowledge-base.md
  found: No knowledge base exists; no prior pattern match.
  implication: Proceed with open investigation.

- timestamp: 2026-10-25T14:10:00Z
  checked: components/home/SummitPlaque.tsx:36-41
  found: Plaque column `data-summit-plaque` is `w-full max-w-md` (448 px) inside `max-w-6xl px-4 sm:px-6 lg:px-8`; `justify-end pb-4` below md (bottom-docked, full width), `md:justify-center` from 768 (vertically centred, left). Card + mt-6 + two 56 px signs; height is content-driven, not stage-driven.
  implication: Plaque right edge at md = margin + 24|32 + 448 px: 472 at 768/820 (61%/58% of width), 480 at 1024 (47%), 539 at 1280 (42%), 619 at 1440 (43%). Its share of the stage grows as the stage shrinks.

- timestamp: 2026-10-25T14:10:00Z
  checked: lib/ascent/route.ts:53-88, 275-336; components/home/terrain/CameraRig.tsx:315-321
  found: Summit pose is fixed (450 m SW, 350 m up, looking at the waypoint centroid). Only projection knobs adapt: narrow = `w < 768` (canvas width); hfov 60 (narrow) / 75 (wide); vfov = summitVerticalFov(w/h, hfov); x offset -0.095w on wide only; y offset 0.2h + 0.08h on narrow only (+0.2w x on narrow). No input reads the plaque box. With vfov derived from a fixed hfov the focal length in px is w / (2 tan(hfov/2)), so the cluster's px size and its px offsets from the optical centre scale with stage WIDTH, while the narrow lift scales with HEIGHT.
  implication: Framing is open-loop; tuned at 1280x720/1440x900 (wide) and 412x839 (narrow) only.

- timestamp: 2026-10-25T14:10:00Z
  checked: components/home/PosterSheet.tsx:36-90; lib/ascent/poster-frame.ts:139-155; data/generated/photos.ts uv
  found: Poster pins sit at left u*100%, top v*100% of a square sheet (side max(W,H), left (W-side)*0.64, top centred). UVs: k1 (0.6772,0.2742), k2 (0.657,0.344), k3 (0.459,0.5195), k4 (0.8256,0.5899). Nothing changes them at the summit block.
  implication: Poster pin positions are a pure function of stage size (the p=0 parity crop, D-16); the plaque does not avoid them.

- timestamp: 2026-10-25T14:10:00Z
  checked: e2e/home-canvas.spec.ts:579-648
  found: 'summit frame shows every waypoint' asserts only visible + inside the stage. 'summit pins clear the plaque' does assert box intersection against [data-summit-plaque], but only at 1440x900, 1280x720, 412x839, all clear sizes. No poster (static) summit occlusion test exists.
  implication: The failing sizes were never in any assertion; the guard is real but under-sampled.

- timestamp: 2026-10-25T14:25:00Z
  checked: Scratch Playwright sweep on `next dev` (scratchpad/measure.cjs), #summit centred, pins read until two reads 10 frames apart agree; 3D with __ascentBudgetMeasureOnly, poster with WebGL disabled
  found: |
    Stage is 10 px narrower than the viewport everywhere (html `scrollbar-gutter: stable; scrollbar-width: thin`, app/globals.css:254-255).
    3D (pin boxes vs plaque box):
      375x667  stage 365x603, plaque y121-659: pins y122-223 -> all 4 under the card (free band above plaque 57 px)
      412x839  stage 402x775, plaque y313-831: pins y156-264 -> clear
      768x1024 canvas 758 (narrow framing), plaque x24-472 y305-783: pins x102-426 y163-330 -> pin 3 under (y290-330)
      820x1180 canvas 810 (wide), plaque x24-472 y383-861, scrim x586+: pins x379-644 y524-666 -> 1,2,3 under plaque, 4 under scrim
      1024x768 canvas 1014 (wide), plaque x32-480, scrim x790+: pins x478-803 -> pin 1 under by 2 px, pin 4 under scrim
      1280x720 plaque r539, scrim 1046: pins x602-1002 -> clear
      1440x900 plaque r619, scrim 1206: pins x679-1127 -> clear
    Poster:
      375x667 all 4 under the card; 412x839 k2 and k3 under (k4 half off the right edge); 768x1024 k3 under, k4 under scrim;
      820x1180 k3 under, k4 under scrim; 1024x768 k3 under, k4 under scrim; 1280x720 clear of plaque (k4 at scrim left edge); 1440x900 clear.
  implication: Reproduces every overlap in the UAT gap exactly; the 3D and poster failures have different mechanisms.

- timestamp: 2026-10-25T14:35:00Z
  checked: Extra 3D sizes (scratchpad/measure-extra.txt)
  found: |
    778x1024 (canvas 768 -> wide framing, as an iPad portrait with overlay scrollbars gets): pins 1-3 under plaque, 4 under scrim.
    375x553 (iPhone SE CSS width with a Safari-like svh): plaque 538 px is taller than the 489 px stage, its top is at y39 under the nav; all 4 pins under.
    360x640: all 4 under. 390x844: clear.
  implication: The 768 Playwright result understates the iPad case; short phones fail worse than 375x667; the narrow failure is a height threshold, not one device.

- timestamp: 2026-10-25T14:40:00Z
  checked: scratchpad/card.cjs: docked waypoint-2 card vs summit plaque share of the stage
  found: 375x667 card 253 px (42% of stage) vs plaque 538 px (89%); 412x839 card 233 (30%) vs plaque 518 (67%); from md the plaque is 448 px wide = 62% of a 768 stage, 47% at 1024.
  implication: VIEW_OFFSET_SHARE 0.2 was sized for the D-20 dock (~lower 40%); the summit plaque docks over roughly twice that, and SUMMIT_VIEW_OFFSET_Y_SHARE 0.08 only buys 0.08h (48 px at 375x667).

- timestamp: 2026-10-25T14:40:00Z
  checked: Derived clear conditions from the measurements
  found: |
    Narrow 3D: optical centre at 0.22 H (0.2 + 0.08 lift); cluster bottom ~ centre + 27 px; plaque top = H - plaque_h - 16.
      Clear iff 0.78 H >= plaque_h + 43, i.e. stage H >= ~745 px at 375 wide (plaque 538), >= ~720 at 412 (plaque 518).
    Wide 3D: cluster occupies x ~0.47w .. 0.79w of the stage (75 deg hfov, -0.095w shift); same vertical centre as the md:justify-center plaque, so only x can separate them.
      Clear iff 0.47w > plaque right (pad + 448 + max(0,(w-1152)/2)) and 0.79w < w - 224 (scrim), i.e. stage w >= ~1070 px.
    Poster, phones (sheet side = H): pin k anchor y = v_k H; clear iff v_k H <= H - plaque_h - 16, i.e. H >= ~(534..554)/(1 - v_k):
      k1 >= ~735-763, k2 >= ~814-845, k3 >= ~1110-1154, k4 >= ~1300-1350 -> k3/k4 can never clear on a phone.
    Poster, md+ landscape: k3 box left = 0.459 W - 12 must exceed plaque right -> W >= ~1072; portrait x = 0.64W - 0.181H - 12 is far left of 472.
  implication: Each failing size follows from these inequalities; no tuning of the existing constants clears all sizes, because the two sides scale differently (shares vs fixed px).

## Resolution

root_cause: |
  Two coupled layout rules that never consult each other (AND-gate: both are needed for an overlap):
  1. The summit plaque is a fixed-pixel, content-sized box. components/home/SummitPlaque.tsx:39-40 docks a ~518-538 px column at the bottom below md (`justify-end pb-4`) and centres a 448 px x ~478 px column on the left from md (`md:justify-center`, `max-w-md`). Its share of the stage grows as the stage shrinks: 89% of the height at 375x667 (the D-20 waypoint card it mimics is 42%), 62% of the width at 768.
  2. The pins are placed by rules that know nothing about that box:
     - 3D: lib/ascent/route.ts:63-88 + 302-336 and components/home/terrain/CameraRig.tsx:315-320 frame the summit with fixed shares of the stage size, chosen by one `w < 768` switch on the canvas width and tuned only at 412x839 and 1280/1440. Narrow stages lift the optical centre to 0.22 H (VIEW_OFFSET_SHARE 0.2 + SUMMIT_VIEW_OFFSET_Y_SHARE 0.08), which clears a 538 px dock only when the stage is >= ~745 px tall. Wide stages get no vertical offset (summitViewOffsetYAt returns 0), so the cluster shares the centred plaque's vertical centre and must fit horizontally in the band between the 448 px column and the 224 px rail scrim; because vfov is derived from a fixed 75 deg hfov (CameraRig.tsx:317), the cluster spans ~0.47w..0.79w and only fits when the stage is >= ~1070 px wide.
     - Poster: components/home/PosterSheet.tsx:36,80-90 pins each waypoint at its fixed UV on the p=0 crop from lib/ascent/poster-frame.ts:139-155 (the D-16 parity rule). There is no summit placement at all, so pin 3 (u 0.459, v 0.52) lands near the stage centre on every aspect, under the left column below ~1072 px and under the bottom dock on every phone; pin 4 (v 0.59) can never clear a phone dock.
  Contributing (not causal): app/globals.css:254 `scrollbar-gutter: stable` makes the canvas 10 px narrower than the viewport, so at 768-777 px the rig's narrow switch (CameraRig.tsx:98,315) disagrees with the CSS md breakpoint and frames for a bottom dock under a centred plaque. It changes which pins overlap at 768 (pin 3 vs pins 1-3 with the wide framing), not whether they do.
  Test gap: e2e/home-canvas.spec.ts:609-648 asserts plaque intersection only at 1440x900, 1280x720 and 412x839 (all clear), and no test checks the static poster at the summit.
fix:
verification:
files_changed: []
