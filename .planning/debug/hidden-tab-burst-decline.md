---
status: diagnosed
trigger: "G-09-5 / WR-01: a reveal burst interrupted by a hidden tab (rAF suspended) restarts on return instead of declining: at pixel ratio 1 the 'ascent-frame-budget' verdict is 'ok' and data-ascent-mode stays '3d' (HOME-07 pause contract)"
created: 2026-10-25T16:00:00Z
updated: 2026-10-25T17:05:00Z
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED. CameraRig drops a running reveal burst only inside useFrame (the `running && !shown` branch). A hidden tab runs no frame, so the burst is never dropped and burstPaused stays false. On return, visibilitychange fires before the held frame, update() sees shown() true with burstPaused false and keeps the stale budget. The first frame after return samples it: now - start >= burstWindowMs with frames < minSamples, so frame-budget.ts:54 returns 'decline'. At pixel ratio 1 that calls downgradeAscent('frame-budget') (Home static); above 1 it steps the canvas down to 1 and re-measures.
test: done. Real hidden tab (Chromium 156, connectOverCDP noDefaults, second tab to front) plus page-side rAF hold under the normal Playwright launch, with no-hide, after-verdict and fake-visibility controls.
expecting: n/a
next_action: none. Diagnose-only. Hand back to the orchestrator for the gap plan.

reasoning_checkpoint:
  hypothesis: "The stale burst survives a hidden tab because the only drop is in useFrame (CameraRig.tsx:338-342), which needs a frame to run while hidden, and update() (263-273) only restarts a burst that useFrame already marked as paused. On return the first frame feeds the stale budget, and frame-budget.ts:54 declines because the hidden time counts as burst time with fewer than 20 frames."
  confirming_evidence:
    - "Real hidden tab at dpr 1 (6/6 runs, hidden after 1, 3, 10 or 17 burst draws, 600 ms or 2000 ms): 'decline' with samples 1/3/10/17/3/5, marked 1-4 ms after visibilitychange visible, then downgrade 'frame-budget' and mode 'static'. The no-hide controls and the hide-after-verdict control all stay 'ok' and '3d'."
    - "The frame trace shows no draw while hidden (draws +4, +105, +191 ms after '3d', then +2285 ms), and visibilitychange visible always comes before the first frame after return."
    - "Fake visibility with frames still running (the existing e2e helper), hidden during the burst: one frame runs while 'hidden', takes the useFrame drop path, the burst restarts on show and ends 'ok' with 20 samples in '3d'. So the drop works only when a frame runs during the pause."
  falsification_test: "If the stale-budget path were wrong, a real hidden tab during the burst would give a verdict computed after the show from 20 or more fresh samples ('ok' in the controls' configuration), not a decline 1-4 ms after the show with samples equal to the number of frames drawn before the hide. It did not."
  fix_rationale: "Dropping the burst in update() when the stage stops being shown removes the dependency on a frame running while hidden. The existing restart branch then gives a fresh budget on return, which is exactly what the fake-visibility run ended up doing (and it passed)."
  blind_spots: "The proposed fix was not applied or run (diagnose-only). Firefox and WebKit order on show (visibilitychange vs. first rAF) not checked: if the frame ran first there, useFrame would drop the burst itself. Real-GPU 60/120 Hz timing comes from the code (21 frames), not from a measurement. The 600 ms hide declined under SwiftShader; on a fast device a short hide may pass."
  candidate_causes:
    - "code: CameraRig update() does nothing on the shown -> hidden transition (primary)"
    - "code: frame-budget burstWindowMs rule counts wall-clock time since the first burst frame, including the hidden time (contributing)"
    - "environment: Chromium suspends rAF in hidden tabs and fires visibilitychange before the held frame (precondition; makes the useFrame drop unreachable)"
    - "test: e2e setVisibility fakes visibility while frames keep running and runs after the verdict (why it was not caught)"
  and_gate: "yes. The static fallback needs (1) the stale budget kept across the hide AND (2) the window rule counting the hidden time AND (3) dpr === 1. At dpr > 1 the same decline steps the canvas down to dpr 1 for the page view instead. Hiding after frame 20 does not decline: the gap is one outlier in a 20-sample median."

## Symptoms

expected: On a capable device at pixel ratio 1, load Home and, within the first second after the canvas fades in, switch to another tab for 2 s, then return. A fresh burst starts on return, the verdict is 'ok', and data-ascent-mode stays '3d'.
actual: UAT: "i dont see a fallback to the poster". The manual run likely missed the trigger window (pixel ratio exactly 1, tab switch inside the ~350 ms burst at 60 Hz). Routed to the gap plan on the code trace (09-REVIEW WR-01).
errors: none reported
reproduction: Test 5 in .planning/phases/09-home-ascent/09-UAT.md
started: discovered in code review (09-REVIEW.md WR-01); manual UAT could not reliably trigger it

## Eliminated

- hypothesis: SwiftShader's own frame time causes the decline, not the hidden tab
  evidence: The no-hide controls in the same harnesses and sizes pass. Playwright 412x839 dpr 1: ok, 24.3 ms, 20 samples. Self-launched 500x685 dpr 1: ok, 34.3 ms. 500x166 dpr 1: ok, 29.0 ms. 500x166 dsf 2: ok at 1.5, 41.7 ms. Hiding after the verdict: ok, '3d'. Only 489x685 at dsf 2 declines natively (67.5 ms / 13 at 1.5, then 64 ms / 17 at 1), so that size is not used as a dpr-2 control.
  timestamp: 2026-10-25T16:35:00Z

- hypothesis: CDP Page.setWebLifecycleState frozen or newPage()+bringToFront() inside the normal Playwright suite stops rAF (09-REVIEW / 09-VERIFICATION suggestion)
  evidence: Under chromium.launch() (headless shell, new headless, headed, with or without the backgrounding flags) neither changes visibilityState nor stops rAF. Playwright sends Emulation.setFocusEmulationEnabled { enabled: true } for every main frame (node_modules/playwright-core/lib/coreBundle.js:39021), which keeps the page visible. Only connectOverCDP(url, { noDefaults: true }) (the default context skips focus emulation) or raw CDP really hide the tab.
  timestamp: 2026-10-25T16:20:00Z

## Evidence

- timestamp: 2026-10-25T16:00:00Z
  checked: components/home/terrain/CameraRig.tsx (full), lib/ascent/frame-budget.ts (full)
  found: The burst state is the refs budget, burstStart, burstPaused and requested (CameraRig.tsx:219-227). The only code that drops a running budget on a pause is in useFrame, lines 338-342 (`running && !shown`). The visibility/IO handler update() (263-273) restarts a burst only when burstPaused is already true. On the way to hidden it returns at line 266 without touching the budget. frame-budget.ts:54 declines when now - start >= 1000 ms and frames < 20.
  implication: the drop needs a frame to run while !shown; a hidden tab gives none.

- timestamp: 2026-10-25T16:20:00Z
  checked: scratch probes wr01-lifecycle-probe*.cjs, wr01-rawcdp-probe.cjs, wr01-connect-probe*.cjs (plain rAF loop page)
  found: Under a normal Playwright launch (headless shell, new headless and headed, with or without the backgrounding flags) NEITHER CDP Page.setWebLifecycleState frozen, NOR newPage()+bringToFront(), NOR minimising the window stops rAF or changes visibilityState: Playwright enables Emulation.setFocusEmulationEnabled on every page (coreBundle.js:39021), which keeps the page visible. Raw CDP on Chromium 156 (chromium-1248, --headless=new) and Playwright connectOverCDP(..., { noDefaults: true }) (skips focus emulation) DO hide the tab: visibilitychange hidden, rAF stops, visibilitychange visible on return, then frames resume. setWebLifecycleState frozen forces hidden+freeze, but 'active' leaves the page hidden (needs another tab switch to show).
  implication: the e2e mechanisms the review suggests (CDP freeze, second tab + bringToFront) do nothing inside the normal Playwright suite. A real hidden tab needs connectOverCDP noDefaults to a self-launched Chromium. Inside the suite, a page-side rAF hold plus a visibility fake is the practical model.

- timestamp: 2026-10-25T16:35:00Z
  checked: wr01-repro.cjs on next dev, SwiftShader, real hidden tab (MODE=tab) and no-hide control (MODE=none-tab / none)
  found: |
    Controls, no hide: Playwright launch 412x839 dpr 1 -> ok (median 24.3 ms, 20 samples), stays 3d. Self-launched 500x685 dpr 1 -> ok (34.3 ms, 20). 500x166 dpr 1 -> ok (29.0 ms, 20). 500x166 dsf 2 (R3F dpr 1.5) -> ok at 1.5 (41.7 ms, 20). 489x685 dsf 2 -> declines natively (decline 1.5: 67.5/13, decline 1: 64/17 -> static): SwiftShader too slow at that size/dpr, not usable as a dpr-2 control.
    Real hidden tab, dpr 1, 2000 ms hidden: hide after 1/3/10/17 burst draws -> verdict 'decline' at the first frame after return (mark t within 1-4 ms of visibilitychange visible), samples 1/3/10/17 (= frames before the hide), median 2107.8/101.3/36.1/35.1 ms, downgrade 'frame-budget', final mode 'static', canvas gone. Frame trace (3-draw run): draws at +4, +105, +191 ms after '3d', then nothing until +2285 ms.
    Hidden 600 ms (dpr 1, after 3 draws): also 'decline' (5 samples) at burst start + ~1.1 s (window rule), static.
    Real hidden tab, dsf 2, 500x166: stale 'decline' at dpr 1.5 (121 ms, 3 samples) at the first frame after return -> setDpr(1) -> fresh burst 'ok' at dpr 1 (41.6 ms, 20) -> stays 3d at dpr 1 for the page view.
  implication: WR-01 reproduced deterministically with a real hidden tab. On return, visibilitychange fires first and the held frame runs after it, so update() sees shown() === true with burstPaused === false and keeps the stale budget. frame-budget.ts:54 then declines (now - start >= 1000 ms, frames < 20).

- timestamp: 2026-10-25T16:50:00Z
  checked: wr01-repro.cjs MODE=tab HIDE_ON=verdict; MODE=holdraf (Playwright launch, page-side rAF hold + visibility fake) with and without measure-only; MODE=fakevis (visibility fake only, frames running, during the burst)
  found: |
    Hide after the verdict (real tab, dpr 1): 'ok' (36.0 ms, 20) before the hide, no further mark, stays 3d.
    holdraf 412x839 dpr 1, real budget, hidden after 5 / 11 draws: 'decline' marked at the show instant (3886.4 vs visible@3886; 4201.4 vs visible@4201), samples 5 / 11, downgrade 'frame-budget', 'static'. Same signature as the real tab.
    holdraf + __ascentBudgetMeasureOnly: 'decline' (samples 5) still marked at the show instant (3840.5 vs visible@3840); the mode stays '3d' because measure-only does not act on it.
    fakevis (the e2e setVisibility model) during the burst: one draw runs right after the fake hide (the already-requested frame), the useFrame drop path fires, the fresh burst after the show gives 'ok' (23.2 / 22.8 ms, 20 samples), '3d'.
  implication: The page-side rAF hold reproduces the real hidden-tab failure exactly inside the normal Playwright suite, so a CI regression test can use it. Even under measure-only the bug shows in the marks (decline, samples < 20, marked within one frame of the show). The existing fake-visibility helper cannot catch WR-01 even during the burst, because a frame still runs while 'hidden'.

- timestamp: 2026-10-25T16:55:00Z
  checked: lib/useAscentMode.ts:43,101-110; components/home/terrain/TerrainCanvas.tsx:64,79-83; AscentController.tsx:168-171,278; CameraRig.tsx:246-254
  found: `downgraded` and `dprSteppedDown` are module-level (IN-05), so a WR-01 decline lasts past App Router navigation until a full reload. The canvas dpr prop is [1, 1.5], so any device pixel ratio >= 1.5 runs at 1.5, and the step-down path applies above 1. The burst starts when `revealed && curves`, which is the moment the stage reads '3d' and the 500 ms fade begins. At 60 Hz the 21-frame verdict lands at ~350 ms, before the fade completes.
  implication: The UAT instruction "within the first second after the canvas fades in" switches tabs after the verdict on a 60 Hz device, so the manual run could not hit the window. It must land during the fade. Tim's machine is also likely above pixel ratio 1, where the outcome is a silent step-down to dpr 1, not the poster.

## Resolution

root_cause: "CameraRig drops an interrupted reveal burst only in useFrame (components/home/terrain/CameraRig.tsx:338-342, `running && !shown`), which requires a frame to run while the stage is not shown. A hidden tab suspends rAF, so no such frame runs. burstPaused stays false, and the flag handler update() (CameraRig.tsx:263-273) returns early on the way to hidden (line 266) and, on the way back, restarts only when burstPaused is true (267-271), so it keeps the stale budget. Chromium fires visibilitychange before the held frame, so that frame runs with shown === true and samples the stale budget (CameraRig.tsx:343-346). AND lib/ascent/frame-budget.ts:50-54 measures the burst window in wall-clock time from the first burst frame, so the hidden time counts against it: now - start >= 1000 ms with frames < 20 -> 'decline'. At dpr 1 CameraRig.tsx:359-360 calls downgradeAscent('frame-budget'): Home goes static for the session (module-level `downgraded`, lib/useAscentMode.ts:43). Above 1, 353-358 steps the canvas down to dpr 1 for the session (module-level dprSteppedDown, TerrainCanvas.tsx:64). The comment at CameraRig.tsx:91-93 promises a restart that only happens when a frame is drawn during the pause."
fix: ""
verification: "Diagnose-only. Reproduced 6/6 with a real hidden tab and 2/2 with a page-side rAF hold. All controls pass."
files_changed: []
