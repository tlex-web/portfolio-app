---
status: diagnosed
phase: 09-home-ascent
source: [09-VERIFICATION.md]
started: 2026-10-25T15:05:00Z
updated: 2026-10-25T14:57:19Z
---

## Current Test

[testing complete]

## Tests

### 1. Real-device 3D quality and vestibular comfort (09-11 human-check; VALIDATION Manual-Only row, status OPEN)
expected: On an iPhone, a mid-range Android phone and a laptop: the canvas fades in without a jump, scrolling is smooth with no scroll hijack, the climb is comfortable (no dizzying turns), the summit view shows all four pins, and an old or slow phone ends on the poster. Record the devices and the result here.
result: pass

### 2. Summit plaque and pin overlaps (known, deferred-items.md; Tim: "Gap plan after 09-14")
expected: At 375x667, 768x1024, 820x1180 and 1024x768 the four 3D pins at #summit are not hidden behind the plaque, and below 1280 px the static poster pins are not under the plaque. Tim decides here whether to accept or to run /gsd-plan-phase 09 --gaps.
result: issue
reported: "gap plan — pins still hidden behind the plaque"
severity: major

### 3. 768 px waypoint-2 pin label hidden behind the card (static poster) and 375 px docked kicker orphaning the "4"
expected: The pin label is legible beside the card at 768, and the kicker wraps without a lone "4" at 375.
result: issue
reported: "gap plan — both still there"
severity: major

### 4. UI-REVIEW new findings: hero scrim over the altimeter rail at 768-1023 px, place line wrapping with a leading dot at 375, pin 3 under hero copy at p=0 at 375 and 768
expected: Tim accepts or routes each to the gap plan.
result: issue
reported: "N1 gap, N2 gap, N3 accept"
severity: major
note: N1 (scrim dims rail at 768-1023) and N2 (place line leading dot at 375) routed to the gap plan; N3 (pin 3 vs hero copy at p=0) accepted as decorative.

### 5. Hidden-tab reveal burst restarts (WR-01; VERIFICATION behavior_unverified item)
expected: On a capable device at pixel ratio 1, load Home and, within the first second after the canvas fades in, switch to another tab for 2 s, then return. A fresh burst starts on return, the 'ascent-frame-budget' performance mark's verdict is 'ok', and data-ascent-mode stays '3d' (no fall back to the poster).
result: issue
reported: "i dont see a fallback to the poster"
severity: major
note: The manual run did not show the fallback, but the trigger needs pixel ratio 1 and a tab switch inside the ~350 ms burst window (09-REVIEW WR-01), which is hard to hit by hand, so the code trace stands. Tim routed it to the gap plan (fix plus a deterministic CDP frozen-lifecycle e2e).

## Summary

total: 5
passed: 1
issues: 4
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-09-2
  truth: "At 375x667, 768x1024, 820x1180 and 1024x768 the four 3D pins at #summit are not hidden behind the plaque, and below 1280 px the static poster pins are not under the plaque (D-03)"
  status: failed
  reason: "User reported: gap plan — pins still hidden behind the plaque"
  severity: major
  test: 2
  root_cause: "Two layout rules never consult each other. The summit plaque is a fixed-pixel, content-sized box (518-538 px bottom dock below md; 448 x ~478 px left column, vertically centred from md), so it covers more of the stage as the stage shrinks (89% of stage height at 375x667). Pin placement never reads that box: 3D summit framing uses fixed stage-width/height shares with one narrow/wide switch on canvas width, tuned only at 412x839 and 1280/1440 (the narrow lift clears the dock only on stages >= ~745 px tall; wide has no vertical offset and fits beside the column only at >= ~1070 px); the static poster pins sit at fixed scroll-0 UVs (D-16 parity) with nothing summit-specific, so poster pin 3 lands under the column below ~1072 px and under every phone dock. No constant tuning clears every size. Test gap: the 'summit pins clear the plaque' intersection guard runs only at 1440x900, 1280x720 and 412x839, 3D only."
  artifacts:
    - path: "components/home/SummitPlaque.tsx:39-40"
      issue: "Plaque is the same fixed-pixel size at every stage size (bottom dock below md, centred left column from md)"
    - path: "lib/ascent/route.ts:63-88, 110, 302-336"
      issue: "Summit framing as fixed stage shares, two value sets, no vertical offset on wide stages"
    - path: "components/home/terrain/CameraRig.tsx:98, 315-320"
      issue: "Narrow/wide switch reads canvas width; vertical FOV derived from a fixed 75 deg HFOV; plaque box never read"
    - path: "components/home/PosterSheet.tsx:36, 80-90; lib/ascent/poster-frame.ts:139-155"
      issue: "Poster pins at fixed scroll-0 UVs, no summit-specific placement"
    - path: "app/globals.css:254"
      issue: "scrollbar-gutter: stable makes the canvas 10 px narrower, so at 768-777 px the JS narrow switch disagrees with the CSS md breakpoint (contributing)"
    - path: "e2e/home-canvas.spec.ts:609-648"
      issue: "Correct box-intersection assertion but at the wrong sizes and 3D only; no poster-at-summit test"
  missing:
    - "Make pin placement and plaque layout agree by construction: a compact or relocated plaque on short (< ~745 px), portrait-tablet and 768-1069 px stages (the only option that also fixes the poster), and/or measured 3D framing that reads the plaque rect, adds a vertical offset on wide portrait stages, and switches narrow/wide on the same width the CSS breakpoint uses"
    - "Test in 3D (budgetMeasureOnly) and static (disableWebGL): centre #summit, read settled pin boxes, assert each pin is visible, inside the clear stage (minus the rail scrim from md) and not intersecting the plaque (>= 8 px margin) at 360x640, 375x667, 375x553, 390x844, 412x839, 768x1024, 778x1024, 820x1180, 1024x768, 1280x720, 1440x900; do not use elementFromPoint (pins are pointer-events: none)"
    - "One Home re-baseline"
  debug_session: ".planning/debug/summit-pins-under-plaque.md"

- gap_id: G-09-3
  truth: "At 768 px the waypoint-2 pin label on the static poster is legible beside its card, and at 375 px the docked kicker wraps without a lone \"4\""
  status: failed
  reason: "User reported: gap plan — both still there"
  severity: major
  test: 3
  root_cause: "(a) 768 label: at md the waypoint card is a fixed 448 px column at x 24-472 (59% of a 758 px stage); the poster pin label can only sit left or right of its head, and the flip rule (flipPinLabels, FLIP_PX 240) considers only the right-hand obstacle (the rail scrim), so pin 2 flips left and 176 of its 184 px land under the card. The clear band between card and scrim is only 62 px at 768, so no flip tweak fixes it. Wider than sampled: every lit poster label overlaps its card at 768-1023, and in live 3D the lit pin lands on the view axis (0.3w narrow / 0.5w wide, no horizontal offset on wide stages), so it and its label are fully hidden at 768-~980. (b) 375 kicker: the kicker and place line are plain-space strings with no nowrap or text-wrap rule in a docked text column (stage width - 176 px: 189 px with the gutter, 199 px on phones) that fits 23 but not 25 characters, so the browser breaks before a lone '4'; the same condition breaks the place line before '· Sep 2021' (covers G-09-4 N2). The break point is platform-dependent (8.0 px glyph advance on CI Linux vs 8.4 px elsewhere). Test gap: the poster label is only checked with toBeVisible(), the 3D label only for being inside the stage, and nothing checks line breaks."
  artifacts:
    - path: "components/home/AscentController.tsx:108-109, 139-154"
      issue: "Label flip considers only the right-hand rail scrim, not the card"
    - path: "components/home/PinMark.tsx:58-63"
      issue: "Label can only be placed beside the head (left-full / right-full)"
    - path: "components/home/PosterSheet.tsx:36, 80-89; lib/ascent/poster-frame.ts:40-56"
      issue: "Fixed poster pin positions put pin 2 (and pin 3's head) in the card column at md"
    - path: "components/home/WaypointCard.tsx:21, 53-56, 78"
      issue: "md card box (md:max-w-md); docked 128px_1fr grid column; plain-text kicker and place line"
    - path: "components/home/AscentHero.tsx:72, 84"
      issue: "Track paints over the stage; card placed in the max-w-6xl container"
    - path: "lib/ascent/waypoints.ts:130, 143-145; lib/home-format.ts:60"
      issue: "Kicker and place strings joined with plain spaces"
    - path: "lib/ascent/route.ts:112-119, 338-367; components/home/terrain/CameraRig.tsx:98-99, 315-319"
      issue: "3D: no horizontal offset away from the left card on wide stages (related)"
    - path: "e2e/home-ascent.spec.ts:403-410; e2e/home-canvas.spec.ts:441-453"
      issue: "Visibility / inside-stage checks only; they pass while the label is covered"
  missing:
    - "Card-aware label placement: above or below the head when neither side clears the card and the rail zone, or keep md pins in the free band (shift the poster sheet / 3D view offset right while a card is active, or narrow the card at 768-1023); give the 3D wide framing a horizontal offset away from the card and use the CSS width source for the narrow/md switch"
    - "Explicit break points: kicker as two whitespace-nowrap segments ('1,668 m ·' / 'Waypoint 2 of 4'); the docked place line puts the date on its own line and drops ' · ' below md while still allowing a wrap at the comma"
    - "Tests: static and 3D, each waypoint centred at 768x900, 778x900, 820x900, 900x900, 1023x900, 1024x900 and 768x1024 - the active pin head and [data-pin-label] do not intersect the card, the rail scrim or the tick labels and stay inside the stage; structural line-break assertions at 375x667 isMobile, 375x900 desktop, 360 and 412 for all four waypoints ('Waypoint k of n' has one client rect, the last kicker line is not a single token, no line starts with '·', the date is not split)"
  debug_session: ".planning/debug/waypoint2-label-and-kicker.md"

- gap_id: G-09-4
  truth: "At 768-1023 px the hero scrim does not dim the altimeter rail labels and readout (UI-REVIEW N1), and at 375 px the docked card's place line never starts a line with the \"·\" separator (UI-REVIEW N2). N3 (pin 3 vs hero copy at p=0) accepted, out of scope."
  status: failed
  reason: "User reported: N1 gap, N2 gap, N3 accept"
  severity: major
  test: 4
  root_cause: "N1: the hero scrim is absolute inset-0 on the full-width hero block, so its box spans the whole stage including the rail; the track (which holds the hero) comes after the sticky stage in DOM order, and the sticky stage is its own stacking context, so the scrim paints above the rail and no z-index on the rail can escape it. Below lg: SCRIM is a full-width vertical gradient (surface 0.50 -> 0.75 -> 0.90, correction C6) with no horizontal falloff, putting 0.54-0.89 of surface over the rail labels and readout: composed contrast 1.3-2.5:1 at 768-1023 vs ~6.4-7.3:1 at 1024+, for nearly the whole tilt-in (p 0-0.18), static and 3D alike. This is separate from the deferred lg:-vs-768 breakpoint item (amending the spec leaves N1 in place). Secondary: above lg: the horizontal gradient's tail drops '2,760 m approx.' to 4.2-4.6:1 at 1024-1280. Test gap: B8 runs only at #summit and its helper compares the raw text colour, which is blind to an overlay painted above the text (it reads 7.6-8.6 on today's broken build). N2: same root cause as G-09-3 (b), see .planning/debug/waypoint2-label-and-kicker.md."
  artifacts:
    - path: "components/home/HeroBlock.tsx:17-18, 50-51"
      issue: "Full-bleed scrim box with a full-width vertical gradient below lg: that reaches the rail"
    - path: "components/home/AscentHero.tsx:66-72"
      issue: "Track follows the stage in the same grid cell and paints above it"
    - path: "components/home/AscentController.tsx (AscentStageFrame)"
      issue: "Sticky stage is a stacking context that confines the rail"
    - path: "components/home/AltimeterRail.tsx:64-115"
      issue: "Rail and its scrim live inside the stage"
    - path: "e2e/home-modes.spec.ts:122-183, 389-414"
      issue: "Contrast helper is blind to overlays above text; B8 is summit-only"
    - path: "e2e/home-ascent.spec.ts:336"
      issue: "Rail-inside-stage containment assertion (affected if the rail moves layers)"
    - path: "components/home/WaypointCard.tsx:78; lib/ascent/waypoints.ts:130; lib/home-format.ts:60"
      issue: "N2: plain-space place line wraps with a leading '·' (shared with G-09-3 b)"
  missing:
    - "N1 option A: limit the hero scrim box below lg: so it stops short of the rail (prototype right: 12rem at 48-64rem restores 4.7-7.2:1 at 768) - local to HeroBlock, but leaves a hard seam and the lg: tail. Option B: move the rail box (not its scrim) into its own sticky aria-hidden layer after the track (7.6-8.6:1 at 768-1023, also fixes 1024-1280) - needs a UI-SPEC z-order/tree amendment and a rewritten containment assertion"
    - "A composed-contrast test that composes the text colour through the overlays (fill the label box with its computed colour vs a transparent-text shot) for every visible tick label and the readout at p=0 and p~0.05, at 768, 1023 and 1280, >= 4.5:1, hiding the readout while sampling labels; optional structural guard (no hero aria-hidden box intersects tick labels at 768-1023, or the rail paints after the track)"
    - "N2: fixed together with the G-09-3 (b) place-line break points"
    - "Re-baseline home/768-ascent-start"
  debug_session: ".planning/debug/hero-scrim-over-rail.md"

- gap_id: G-09-5
  truth: "A reveal burst interrupted by a hidden tab (rAF suspended) restarts on return instead of declining: at pixel ratio 1 the 'ascent-frame-budget' verdict is 'ok' and data-ascent-mode stays '3d' (09-REVIEW WR-01, HOME-07 pause contract)"
  status: failed
  reason: "User reported: i dont see a fallback to the poster (manual run could not reliably hit the ~350 ms trigger window; code trace in 09-REVIEW WR-01 says the burst is not dropped while hidden; Tim routed to the gap plan)"
  severity: major
  test: 5
  root_cause: "Confirmed with a real hidden tab (connectOverCDP noDefaults, SwiftShader, dpr 1): hiding after 1/3/10/17 burst draws gives 'decline' 1-4 ms after the tab shows again, downgrade ['frame-budget'], mode static. The running budget is dropped in only one place, useFrame's 'running && !shown' branch, which needs a frame to run while hidden; a hidden tab runs none. The flag handler update() returns without touching the burst on shown -> hidden, and on return restarts only if burstPaused is already true, so the stale budget survives. Chromium fires visibilitychange (visible) before the held frame, which then samples the old budget, whose 1000 ms wall-clock window now includes the hidden time with < 20 frames -> decline. At dpr 1 that calls downgradeAscent, and because `downgraded` is module-level (IN-05) Home stays static until a full reload; above dpr 1 the canvas silently and permanently steps down to dpr 1. Manual UAT could not hit it: the burst starts at the 500 ms fade start and the verdict lands ~350 ms in at 60 Hz, before the fade ends. Test gap: setVisibility fakes visibilityState while frames keep running and the test acts after the verdict; Playwright's Emulation.setFocusEmulationEnabled makes a CDP freeze or bringToFront a no-op under a normal launch."
  artifacts:
    - path: "components/home/terrain/CameraRig.tsx:263-273"
      issue: "update() ignores the shown -> hidden transition, so a running burst is never dropped while hidden"
    - path: "components/home/terrain/CameraRig.tsx:338-342"
      issue: "The only budget drop, reachable only if a frame runs while hidden"
    - path: "components/home/terrain/CameraRig.tsx:91-93"
      issue: "Comment claims an interrupted burst starts over; inaccurate"
    - path: "lib/ascent/frame-budget.ts:50-54"
      issue: "1000 ms wall-clock window counts hidden time"
    - path: "lib/useAscentMode.ts:43; components/home/terrain/TerrainCanvas.tsx:64"
      issue: "Module-level downgraded / dprSteppedDown make one stale decline last the whole session (IN-05)"
    - path: "e2e/home-canvas.spec.ts:749-758, 861-884"
      issue: "setVisibility keeps frames running; 'pauses while the tab is hidden' runs only after the verdict"
  missing:
    - "In update(), when was && !shown(): drop a running burst (budget.current = null, burstStart.current = -1, burstPaused.current = true) and return, so the existing restart branch gives a fresh budget on return; keep the useFrame drop as a fallback; correct the 91-93 comment. Do not add an unbounded 'gap > burstWindowMs restarts' guard (a device with > 1 s frames would restart forever); if added, bound it to one restart or tie it to the pause/visibility flag"
    - "Decide IN-05: reset `downgraded` per Home mount, or document the session-wide stickiness"
    - "Regression test with a helper that truly holds rAF while hidden (wrap requestAnimationFrame to hold all callbacks, including already-requested ones; fake visibilityState/hidden and dispatch visibilitychange; on show dispatch visibilitychange first, then run the held callbacks in one real rAF). Hide after >= 1 burst draw (assert zero ascent-frame-budget marks at hide time), stay hidden 2 s; with budgetMeasureOnly assert no verdict while hidden, that the first verdict after show comes from a fresh burst (>= minSamples draws or >= burstWindowMs after show), and that data-ascent-mode is '3d'. Tag @chromium-only, never test.skip; classify it in lib/__tests__/frame-budget-policy.test.ts; optional dsf 2 run; optionally move 'pauses while the tab is hidden' onto the new helper"
  debug_session: ".planning/debug/hidden-tab-burst-decline.md"

## Gap Plan Decisions

Tim's answers on 2026-10-25, after diagnosis and before gap planning:

- G-09-2 approach: "Compact plaque + measured 3D". Collapse or relocate the plaque on short (< ~745 px), portrait-tablet and 768-1069 px stages, keeping the trail signs, so the static poster is fixed too. Also make the 3D summit framing read the plaque's measured box, add a vertical offset on wide portrait stages, and switch narrow/wide on the same width source as the CSS breakpoint.
- G-09-4 N1 fix: "B: rail in own layer". Move the rail box (not its scrim) into its own sticky aria-hidden layer after the track. Amend the UI-SPEC z-order row and tree, and rewrite the rail containment assertion.
- IN-05: "Keep sticky, document". No behaviour change to the module-level `downgraded` / `dprSteppedDown`; correct the JSDoc to say the downgrade lasts the session (until a full reload).
- WR-02: "Include". Add `budgetMeasureOnly` to the context-loss test in the same gap plan.
- Pin 3 static-poster label (raised by the plan checker on 09-19): "Accept, amend D-09". In the static poster at about 768-1090 px, when waypoint 3 is active its pin head sits under its own card (D-16 fixed poster positions plus the D-07 left card), and its label is hidden. Record this exception in CONTEXT D-09 and the UI-SPEC during planning, not at 09-22.
