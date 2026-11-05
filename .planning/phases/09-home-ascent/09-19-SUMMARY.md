---
phase: 09-home-ascent
plan: 19
subsystem: ui
tags: [home, ascent, pins, labels, layout, playwright, jest, tailwind]

requires:
  - phase: 09-home-ascent
    provides: "09-17 rail box in [data-ascent-rail-layer] with the rail scrim left in the stage; 09-18 compact summit layout and the posterFrame-based e2e clearance pattern"
provides:
  - "lib/ascent/framing.ts: Box, Size, RailGeometry, StageGeometry, pinBoxes, railObstaclesAt, placePinLabel (pure, import-free)"
  - "Card- and rail-aware poster pin labels: data-label right | left | above | below | none and --pin-label-dx on each poster pin"
  - "Stage geometry (card arrival boxes, label sizes, rail marks) shared through the ascent context as `geometry` for 09-20 and 09-21"
  - "Poster and 3D pin layers at z-10, above the rail scrim inside the stage"
  - "e2e sweep: every lit poster label at 11 sizes in Chromium and Firefox"
affects: [09-20, 09-21, 09-22, visual baselines]

actuals:
  tokens: 12000
  tasks: 3
  commits: 4
plan_head_before: ba533813638a083d9210d7a88f0683808bc9a03c
plan_head_after: 68fd6d5df93546fc3951f875f0164f53c1a196e8

tech-stack:
  added: []
  patterns:
    - "Pure placement function over measured boxes (framing.ts), written to the DOM as data attributes plus one CSS custom property; Tailwind group-data variants read them"
    - "Measure on layout only: batch the label display toggles, one read pass, restore; plus one re-measure on document.fonts.ready"

key-files:
  created:
    - lib/ascent/framing.ts
    - lib/__tests__/framing.test.ts
  modified:
    - components/home/AscentController.tsx
    - components/home/PinMark.tsx
    - components/home/PosterSheet.tsx
    - components/home/terrain/CameraRig.tsx
    - components/home/terrain/PinLayer3D.tsx
    - components/home/AscentHero.tsx
    - components/home/AltimeterRail.tsx
    - components/home/__tests__/rail.test.tsx
    - components/home/__tests__/pin-layer-3d.test.tsx
    - e2e/home-ascent.spec.ts
    - .planning/phases/09-home-ascent/09-UI-SPEC.md

key-decisions:
  - "placePinLabel also slides an above/below label along the head (dx from 24 - w to 0) to obstacle edges after the three fixed alignments: at 768-778 x 900 pin 4's head sits in the rail box column, and no fixed alignment was clear"
  - "A card's arrival box is the block centred on the stage ((stageH - blockH) / 2), so it is scroll-independent; a sticky docked card is bottom-aligned in its block and held inside the stage"
  - "The least-overlap fallback counts the label's area outside the inner bounds as overlap, so an off-stage candidate never wins with zero cost"

patterns-established:
  - "Label placement contract: data-label + --pin-label-dx on [data-pin]; 'none' uses invisible (never visible) so the 3D layer's inherited visibility still applies"

requirements-completed: [HOME-05]

coverage:
  - id: D1
    description: "Lit waypoint-2 poster label legible beside its card at 768 x 900 and 768 x 1024 (head centre outside the card, label clear of card and rail, inside the stage)"
    requirement: HOME-05
    verification:
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#Lit poster label clears its card and the rail (G-09-3 a) every lit label at 768 x 900 / 768 x 1024 (chromium, firefox)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every lit poster label at 11 sizes is clear of its card and the rail marks and inside the stage, or hidden when its head centre is under its card"
    requirement: HOME-05
    verification:
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#Lit poster label clears its card and the rail (G-09-3 a) (22 rows, chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D3
    description: "placePinLabel, railObstaclesAt and pinBoxes rules"
    verification:
      - kind: unit
        ref: "lib/__tests__/framing.test.ts (19 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "3D pins still light, hand over at the reveal and keep their left label placement through data-label"
    requirement: HOME-05
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#waypoint 2 lights its 3D pin; pins hand over at the reveal"
        status: pass
      - kind: unit
        ref: "components/home/__tests__/rail.test.tsx; components/home/__tests__/pin-layer-3d.test.tsx"
        status: pass
    human_judgment: false
  - id: D5
    description: "Below and above placements read well beside the card at md; labels over the (former) scrim zone are legible"
    verification: []
    human_judgment: true
    rationale: "The e2e rows prove geometry (no overlap, inside the stage); whether 'below' and slid labels look right next to the pin and the card is a visual judgment, and the Linux visual baselines are not re-captured in this plan"

duration: 17 min
completed: 2026-10-25
status: complete
---

# Phase 09 Plan 19: Card- and rail-aware poster pin labels Summary

**The lit poster label is now placed by one pure function, placePinLabel in lib/ascent/framing.ts. It tries right, left, above and below the head (above and below try three alignments, then slide along the head) and keeps 4 px from the stage edge, the active card and the rail marks. The pin layers now paint above the rail scrim, so waypoint 2 at 768 x 900 shows its label below the pin instead of 176 px under the card.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-10-25T17:02:18Z
- **Completed:** 2026-10-25T17:19:30Z
- **Tasks:** 3 of 3
- **Files modified:** 13 (2 created)

## Accomplishments

- `lib/ascent/framing.ts` (import-free): `Box`, `Size`, `RailGeometry`, `StageGeometry`, the pin constants, `pinBoxes`, `railObstaclesAt` and `placePinLabel` returning `{ side, dx, clear }`.
- AscentController measures the stage geometry on every layout measurement: each card's arrival box, every label size, and the rail's tick rows, line and readout. It places every poster label and shares the geometry through the context (`geometry`). `FLIP_PX`, `flipPinLabels` and `data-flip` are gone.
- PinMark has `data-label` variants for right (the default), left, above, below and none, plus `--pin-label-dx` and `data-v`. The poster and 3D pin layers are `z-10`, above the rail scrim and still under the rail box layer.
- CameraRig writes `data-label="left"` with its existing 240 px edge rule (until 09-21) and removes the attribute otherwise. The 3D pins kept their placement in every commit.
- e2e sweep across 11 sizes in Chromium and Firefox (22 rows), plus 19 unit tests for the rules.
- UI-SPEC: the layers row, the Pins "Label" row placement clause, and the E7 overflow and long-text rows now describe placePinLabel, each tagged "(G-09-3 a, 09-19)". The D-09 amendment sentence is unchanged, word for word.

## Tracer row: before and after

Before steps 2-5 (old flip rule, commit ba53381 code):

```
[chromium] › e2e\home-ascent.spec.ts:699:7 › Lit poster label clears its card and the rail (G-09-3 a) › waypoint 2 at 768 x 900 is legible beside its card
    Error: waypoint 2: label gap to the card
    Expected: >= 0
    Received:    -148.34375
  1 failed
```

After steps 2-5:

```
[1/2] [chromium] › e2e\home-ascent.spec.ts:792:7 › Ascent progress (HOME-03, HOME-04, HOME-05) › poster pins sit at their UV and light with the active stage
[2/2] [chromium] › e2e\home-ascent.spec.ts:699:7 › Lit poster label clears its card and the rail (G-09-3 a) › waypoint 2 at 768 x 900 is legible beside its card
  2 passed (5.2s)
```

The side chosen was `below` with dx 0, as the plan predicted. Tracer gate: interactive run, `end-of-phase`, automated-only verify. I re-ran the verify, it passed, and I continued to expansion.

## Chosen sides (static poster, every waypoint centred)

Identical in Chromium and Firefox.

| Size | Waypoint 1 | Waypoint 2 | Waypoint 3 | Waypoint 4 |
|------|------------|------------|------------|------------|
| 768 x 900 | right | below | head under its card | below |
| 778 x 900 | right | below | head under its card | below |
| 820 x 900 | right | below | head under its card | above |
| 900 x 900 | right | above | head under its card | left |
| 1023 x 900 | right | above | head under its card | left |
| 1024 x 900 | right | above | head under its card | left |
| 768 x 1024 | above | right | head under its card | below |
| 1280 x 900 | right | right | right | left |
| 1440 x 900 | right | right | right | left |
| 375 x 667 | left | left | above | left |
| 412 x 839 | left | left | right | left |

At 768 x 900 and 768 x 1024, waypoint 2's head centre is outside its card, which the explicit assertion checks (the UAT truth).

## Head-under-card cases

| Case | Status |
|------|--------|
| Waypoint 3 at 768 x 900 | accepted (D-09 amendment) |
| Waypoint 3 at 778 x 900 | accepted (D-09 amendment) |
| Waypoint 3 at 820 x 900 | accepted (D-09 amendment) |
| Waypoint 3 at 900 x 900 | accepted (D-09 amendment) |
| Waypoint 3 at 1023 x 900 | accepted (D-09 amendment) |
| Waypoint 3 at 1024 x 900 | accepted (D-09 amendment) |
| Waypoint 3 at 768 x 1024 | accepted (D-09 amendment) |

**Outside the D-09 amendment:** none. Every head-under-card case is waypoint 3 at a width from 768 to 1024 px, inside the amendment's "about 768-1090 px". In each one the pin carries `data-label="none"` and its label has computed visibility `hidden`.

## Task Commits

1. **Task 1: Card-aware poster label end-to-end for waypoint 2 at 768 x 900** - `7ef7ea2` (fix)
2. **Task 2: Unit tests for the placement rules; 3D layer above the scrim** - `e84ed56` (test)
3. **Deviation fix found in Task 3: slide along the head; exact label widths** - `ce1b985` (fix)
4. **Task 3: Poster label sweep; UI-SPEC pins rows** - `68fd6d5` (test)

## Files Created/Modified

- `lib/ascent/framing.ts`: the placement types, constants and functions.
- `lib/__tests__/framing.test.ts`: 19 tests (sides, the three alignments, slides, clamping, the 4 px margin, none vs edge overlap, the least-overlap fallback, the 768 x 900 geometry, railObstaclesAt, pinBoxes).
- `components/home/AscentController.tsx`: measureCards, measureLabels, measureRail, measureGeometry, placePosterLabels; `geometry` in the context; a re-measure on `document.fonts.ready`.
- `components/home/PinMark.tsx`: the `data-label` variants, `--pin-label-dx` and `data-v`.
- `components/home/PosterSheet.tsx`: `v` prop; pin layer `z-10`.
- `components/home/terrain/CameraRig.tsx`: `data-label` in placePins; comments reworded.
- `components/home/terrain/PinLayer3D.tsx`: `z-10`; doc names `data-label`.
- `components/home/AscentHero.tsx`, `components/home/AltimeterRail.tsx`: doc comments (the scrim is read by the camera only; the pin layers paint above it).
- `components/home/__tests__/rail.test.tsx`, `components/home/__tests__/pin-layer-3d.test.tsx`: the label variant classes, data-u/data-v, the poster layer's z-10, no data-v on 3D marks.
- `e2e/home-ascent.spec.ts`: the `Lit poster label clears its card and the rail (G-09-3 a)` sweep (litBoxes, expectLabelClear).
- `.planning/phases/09-home-ascent/09-UI-SPEC.md`: four tagged amendments and two stale flip mentions reworded.

## Decisions Made

- **Card arrival box:** a block centred on the stage, `(stageH - blockH) / 2`. This matches arrivalsFromBlocks (block centre meets stage centre), and for blocks at least one stage tall it is the plan's "top aligned, minus half the excess". A sticky docked card's bottom is `min(block bottom, stage bottom)`.
- **Fallback cost:** intersection with the inflated obstacles plus the label's area outside the inner bounds.
- **Label widths:** read with `getBoundingClientRect` (fractional), not `offsetWidth`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The fixed alignments could not clear pin 4 at 768-778 x 900**
- **Found during:** Task 3 (sweep)
- **Issue:** Pin 4's head (x 628-652 at 768) sits in the rail box column. With a 194 px label, centred below crosses the rail line, head-left leaves the stage and head-right runs into the card by about 1 px. So placePinLabel fell back to least overlap (`clear: false`). The e2e failed on "label gap to the rail line" (Chromium 768, 778) and "label gap to the card" (Firefox 778). Free space did exist between the card (476) and the line (721).
- **Fix:** After the centred, head-left and head-right alignments, above and below also try slides. A slid label still spans the head (dx from 24 - w to 0) and stops with an edge on an inflated obstacle's edge or on the inner bounds, nearest to centred first. Candidates the plan lists keep their order and results, and a slide is only reached when they all fail. Labels are also measured exactly now (`getBoundingClientRect`, since `offsetWidth` was 0.5 px off), plus one re-measure on `document.fonts.ready` (Rule 2: a late web font changes label widths without resizing the track).
- **Files modified:** lib/ascent/framing.ts, lib/__tests__/framing.test.ts, components/home/AscentController.tsx
- **Verification:** new unit test from the measured geometry; the sweep passes in both browsers (22/22)
- **Committed in:** ce1b985

**2. [Rule 1 - Bug] e2e helper did not wait for waypoint 1 to light (Firefox)**
- **Found during:** Task 3
- **Issue:** The readout already shows waypoint 1's height at p = 0, so in Firefox `litBoxes` read pin 1 before `data-active` landed (label display none).
- **Fix:** litBoxes also waits for `data-active` on the pin.
- **Files modified:** e2e/home-ascent.spec.ts
- **Committed in:** 68fd6d5

**3. [Rule 1 - Docs] Stale flip mentions outside the plan's file list**
- **Found during:** Tasks 1-3
- **Issue:** AscentHero, AltimeterRail, an e2e comment, pin-layer-3d.test.tsx and two other UI-SPEC lines (the layer tree, the Rail scrim row) said the pin label flip reads the scrim's width.
- **Fix:** Reworded: only the camera reads it, and the pin layers paint above it. The doc comments landed with the change they describe (7ef7ea2, e84ed56, 68fd6d5).

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 doc accuracy). **Impact:** The slide candidates were needed to meet the plan's own clearance truth at 768-778 px. They extend the rule without changing any case the listed candidates already cleared. No scope creep.

## Issues Encountered

- A Node edit mixed LF lines into the CRLF working copy of PinLayer3D.tsx, and Prettier flagged it. I normalised the file to LF before the commit, so the diff is clean.

## Known Stubs

None.

## Visual baselines (for 09-22)

The Linux visual baselines were not re-captured (no push in this plan). These will change: `home/768-ascent-waypoint-2` (the label now sits below pin 2; it used to be under the card) and probably `home/768-ascent-start` and `home/768-ascent-summit` (pin 4 sits in the scrim zone and is no longer dimmed). The 375 and 1440 frames should not move: their waypoint-2 sides match the old flip, and no pin sits under the scrim there. That is not verified.

## User Setup Required

None.

## Verification

- `npx playwright test e2e/home-ascent.spec.ts e2e/home-canvas.spec.ts --project=chromium`: 77 passed
- `npx playwright test e2e/home-ascent.spec.ts --project=firefox`: 48 passed (the "Lit poster label" sweep: 11 per project)
- `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests`: 695 passed; test-count OK (919, baseline 832)
- `npm run lint` exit 0 (no warnings in touched files); `npm run type-check`: no errors; Prettier clean on every changed file
- Acceptance greps: framing.ts imports 0; FLIP_PX in AscentController 0; data-flip in PinMark, CameraRig and PinLayer3D 0; `data-[flip]` in PinMark 0; data-label in CameraRig 4; `placePinLabel(` in AscentController 1; z-10 in PinLayer3D 2; "G-09-3 a, 09-19" in UI-SPEC 4; "D-09 amendment 2026-10-25" in UI-SPEC 2

## Next Phase Readiness

- 09-20 and 09-21 can read `useAscent().geometry` (StageGeometry) and call `placePinLabel` for the 3D pins. CameraRig still has its own FLIP_PX and edge rule, and 09-21 replaces both.
- 09-22: re-baseline the 768 Home frames listed above. Nothing goes to Tim's decision from this plan, because no head-under-card case falls outside the D-09 amendment.

## Self-Check: PASSED

- FOUND: lib/ascent/framing.ts, lib/__tests__/framing.test.ts
- FOUND: 7ef7ea2, e84ed56, ce1b985, 68fd6d5 (ancestors of HEAD)
- Plan artifacts: `export function placePinLabel` in framing.ts; `pin-label-dx` in PinMark.tsx; `placePinLabel(` and `geometry` in AscentController.tsx

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*
