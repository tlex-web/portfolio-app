---
phase: 09-home-ascent
reviewed: 2026-10-25T21:41:08Z
depth: standard
scope: incremental (gap closure 09-15 to 09-22, diff 4abf064..HEAD)
files_reviewed: 32
files_reviewed_list:
  - app/globals.css
  - components/home/AltimeterRail.tsx
  - components/home/AscentController.tsx
  - components/home/AscentHero.tsx
  - components/home/PinMark.tsx
  - components/home/PosterSheet.tsx
  - components/home/SummitDetails.tsx
  - components/home/SummitPlaque.tsx
  - components/home/WaypointCard.tsx
  - components/home/__tests__/pin-layer-3d.test.tsx
  - components/home/__tests__/rail.test.tsx
  - components/home/__tests__/summit.test.tsx
  - components/home/__tests__/waypoints.test.tsx
  - components/home/terrain/CameraRig.tsx
  - components/home/terrain/PinLayer3D.tsx
  - components/home/terrain/TerrainCanvas.tsx
  - components/home/terrain/route-curve.ts
  - e2e/helpers/webgl.ts
  - e2e/home-ascent.spec.ts
  - e2e/home-canvas.spec.ts
  - e2e/home-modes.spec.ts
  - lib/__tests__/ascent-route.test.ts
  - lib/__tests__/ascent-waypoints.test.ts
  - lib/__tests__/frame-budget-policy.test.ts
  - lib/__tests__/framing.test.ts
  - lib/__tests__/summit-layout.test.ts
  - lib/ascent/framing.ts
  - lib/ascent/route.ts
  - lib/ascent/summit-layout.ts
  - lib/ascent/waypoints.ts
  - lib/useAscentMode.ts
  - scripts/guards/test-count.baseline.json
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 09: Code Review Report

**Reviewed:** 2026-10-25T21:41:08Z
**Depth:** standard
**Files Reviewed:** 32
**Status:** issues_found

## Summary

This is an incremental review of the Phase 09 gap-closure work, plans 09-15 to 09-22 (`git diff 4abf064..HEAD`). It replaces the pre-gap review. The changes covered are:

- the WR-01 and WR-02 frame-budget fixes;
- the rail layer moved out of the stage;
- the compact and full summit layouts;
- `placePinLabel` and `waypointTarget`;
- the measured summit framing (`summitClearRects`, `fitCluster`, `stageViewKeys`, `viewTrackAt`);
- the kicker and place-line break points;
- the new e2e harnesses (`holdFramesWhileHidden`, `holdHeightmap`, `composedContrast`).

What was traced:

- **Pinhole and view-offset algebra.** `fitCluster` offsets against three's `setViewOffset` convention, and `natural - target` in `wideStageOffsets`.
- **Key track.** Key `i` sits at `t = i/(n+1)`, which agrees with `curveParamAt`.
- **Frame budget.** The pause and restart logic in CameraRig after the WR-01 fix, on every path: hidden at mount, off-screen at reveal, hidden during the second burst at pixel ratio 1.
- **Layering.** The poster pin layer and the 3D pin layer each sit, with z-10, in the stage's stacking context. The sheet box has no stacking context, and PinLayer3D is a sibling of the canvas, not inside its opacity layer.
- **PinMark placement classes.** Each one checked against the `placePinLabel` box model.
- **The `summit-compact` media query.** In MQ4, `not all and A and B` negates the whole query.
- **Unsupported browsers.** If the range syntax is unsupported, neither variant matches, and the default full plaque shows.
- **The hidden-tab test.** Its discriminator tells a stale budget (fewer than 20 samples, under 1 s after the show) from a fresh one.

No crash, security or data-loss defect was found. The one WARNING is a gap in the static summit contract (G-09-2): the 2000-size sweep drops every stage shorter than 480 px, so landscape phones were never checked. On those phones the compact plaque covers poster pin 3. I computed this with the repo's own `summitColumnBox`, `posterFrame` and the committed waypoint UVs.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: The compact summit plaque covers poster pin 3 on landscape phones; the sweep that should catch it filters those sizes out

**File:** `lib/ascent/summit-layout.ts:50-88`, `lib/__tests__/summit-layout.test.ts:32,57`, `e2e/home-ascent.spec.ts` (`Summit plaque clears the poster pins` SIZES)
**Issue:** `summitLayoutAt` picks `compact` for every viewport narrower than 1100 px, landscape phones included. On a landscape stage the poster sheet is cropped vertically (`side = W`), so pin 3 (u 0.459, v 0.5195) lands inside the 320 px column docked at the bottom.

The modelled column is `summitColumnBox(w, h, 0)`, since phones have overlay scrollbars. The table gives its gap to each poster pin box (24 x 40 px above the anchor):

| Viewport | Column (stage px) | Pin 1 | Pin 2 | Pin 3 | Pin 4 |
|---|---|---|---|---|---|
| 667 x 375 | x 24-344, y 125-295 | 120 | 82 | **-44** | 195 |
| 740 x 360 | x 24-344, y 110-280 | 145 | 130 | **-16** | 255 |
| 844 x 390 | x 24-344, y 140-310 | 216 | 199 | 31 | 341 |

At 667 x 375, pin 3's box (x 294-318, y 128-168) lies under the one-line plate (y 125-167). Real phones show it worse: `100svh` makes the stage shorter than these emulated sizes.

Neither guard sees this:
- The unit sweep keeps only sizes with `h - NAV_H >= MIN_STAGE_H` (480), so every viewport under 544 px tall is dropped. Its header still claims coverage of "portrait phones, tablets and desktops".
- The e2e SIZES list has no landscape phone.

The same filter hides a second edge in the full layout. On a landscape window 1100-1943 px wide and under about 542 px tall, the 478 px full column plus `pb-4` is taller than the stage, so it cannot fit the summit frame. The plaque runs under the nav at p = 1 (see IN-01).

**Fix:** First add the missing domain to the sweep, so the gap is visible. For example:
```ts
{ name: 'landscape phones', widths: range(568, 932, 8), heights: range(320, 430, 10) },
```
Then scope the stage-height filter per domain, or drop it. Add `[667, 375]` and `[740, 360]` to the e2e SIZES.

Then choose a layout rule for short landscape stages. Options:
- add `(min-height: …)` to the compact condition;
- move the compact column right of pin 3 when `orientation: landscape` and the width is below 1100 px;
- record it as accepted, as was done for the D-09 head-under-card case.

This is a layout decision for Tim. It is not covered by the S3 entry in deferred-items.md (pin 4 cut off on portrait phones).

## Info

### IN-01: `measurePlaque` assumes the summit block is centred at its arrival, which fails when the block is taller than the stage

**File:** `components/home/AscentController.tsx:264-280`
**Issue:** The plaque box is modelled as `r.top - summitRect.top - (summitRect.height - stageRect.height) / 2`, which puts the block's centre at the stage centre. But the summit is the last track child. When the block is taller than the stage, `arrivalsFromBlocks` clamps its arrival to 1, and at p = 1 the block's bottom sits on the stage bottom, not centred. The modelled `y0` is then too low by `(blockH - stageH) / 2`, and the 3D summit fit (`summitClearRects` over `geometry.plaque`) frames against the wrong box.

Today the compact block is always one stage tall. Only the full layout on a short landscape window (viewport height under about 542 px, 1100-1943 px wide) reaches this case, the same domain WR-01 notes is untested.
**Fix:** Derive the offset from the clamped arrival instead of assuming centring. The top of the summit block at the summit arrival, in stage px, is `offset - arrival * distance`, using the same `offset`/`distance` `measureLayout` already computes. Or clamp:
```ts
const centred = (stageRect.height - summitRect.height) / 2;
const top = Math.max(centred, stageRect.height - summitRect.height); // last block: bottom-aligned at p = 1
const y0 = top + (r.top - summitRect.top);
```

### IN-02: Narrow-versus-wide is now decided by two different width sources in the same canvas

**File:** `components/home/terrain/CameraRig.tsx:136,519`, `components/home/TerrainStage.tsx:34,56`
**Issue:** 09-20 moved the rig's narrow/wide switch to `matchMedia('(min-width: 48rem)')`, so it agrees with the CSS md breakpoint. That fixed the 768-777 px mismatch. TerrainStage still picks the mesh grid from the stage width (`width < MOBILE_STAGE_PX`), and the rig's pre-read fallback is the canvas width (`w >= 768`). At a 768-777 px viewport the stage is 758-767 px wide, so the rig frames as wide (75° summit cap, measured md offsets) over the 256² mobile mesh. Nothing breaks, but it is the same two-source split that caused the 768 x 1024 bug, and it extends the earlier IN-01 (repeated layout constants).
**Fix:** Export one `WIDE_MEDIA` (or `MD_MIN_PX`) from an import-free module. Use `matchMedia` in TerrainStage too, or document that the mesh choice deliberately follows the stage width.

### IN-03: The three summit-layout magic numbers are a hand-measured model of rendered content

**File:** `lib/ascent/summit-layout.ts:40-43`
**Issue:** `COMPACT_H = 170` (plate 42 + gap 8 + signs 120) and `FULL_H = 478` ("measured at 1440 x 900") are rendered heights that depend on font metrics, the copy and TrailSigns' layout. The 2000-size unit sweep's "clears every pin" guarantee holds only while they are true. A copy edit that wraps a sign label, or a font swap, silently invalidates the sweep. The e2e rows check 11 real sizes, which is the only browser-truth link.
**Fix:** Have one e2e row assert that the measured `[data-summit-plaque]` height at 375 x 667 and at 1440 x 900 matches `COMPACT_H` and `FULL_H` within a few px. Then a drift fails next to the constant it invalidates.

## Earlier findings

Status of the six findings left open in `09-REVIEW-DISPOSITION.md`, plus the three marked fixed:

| ID | Status after 09-15..09-22 | Note |
|----|---------------------------|------|
| WR-01 | Fixed (confirmed) | `update()` in CameraRig drops a running burst on the shown-to-hidden flag change and restarts it with a fresh budget on the way back. The `useFrame` fallback covers a frame that runs off-screen. The new e2e (`holdFramesWhileHidden`) can tell a stale budget from a fresh one. |
| WR-02 | Fixed (confirmed) | The context-loss test opts into `budgetMeasureOnly`. The B1 policy test lists it. |
| IN-01 | Still open, partly addressed | `FLIP_PX` is gone (replaced by `placePinLabel`). New copies were added (`STAGE_FOV_DEG`, `NARROW_VIEW_OFFSET_X/Y_SHARE`), but `ascent-route.test` asserts they match `route.ts`. Still unguarded: `camera={{ fov: 40 }}` in `TerrainCanvas.tsx:93`, `MOBILE_STAGE_PX = 768` in TerrainStage, and the `w >= 768` fallback in CameraRig (see IN-02 above). |
| IN-02 | Still open | `performance.mark('ascent-canvas-ready', …)` in `TerrainMesh.tsx:231` is still unwrapped. Gap work did not touch it. |
| IN-03 | Still open | `lib/ascent/summit.ts:52` still reads the global `lowestDemM`. `SummitDetails` and `SummitStats` now render it twice, so it shows in two places. |
| IN-04 | Still open | `lib/home-format.ts:38` is unchanged. |
| IN-05 | Fixed (confirmed, docs) | `useAscentMode.ts` and `TerrainCanvas.tsx` now say the downgrade and the pixel-ratio step-down last the session, until a full reload. |
| IN-06 | Still open | GalleryGrid still pages at 12. Not in this diff. |
| IN-07 | Still open | `e2e/homepage.spec.ts:56` still has `site.role.replace('&', '&amp;')`. Not in this diff. |

Already known and not re-reported:
- the `delayHeightmap` service-worker bypass in four home-canvas tests;
- S3, the portrait-phone summit pin 4 cut-off;
- the reduced-motion full plaque over the pins at 375 x 667;
- the `useAscentMode.ts` Prettier drift.

WR-01 above is a separate case: landscape stages and pin 3.

---

_Reviewed: 2026-10-25T21:41:08Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
