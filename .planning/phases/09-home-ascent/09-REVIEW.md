---
phase: 09-home-ascent
reviewed: 2026-10-25T13:28:20Z
depth: standard
files_reviewed: 77
files_reviewed_list:
  - .gitattributes
  - AGENTS.md
  - README.md
  - app/(site)/page.tsx
  - app/globals.css
  - components/GalleryGrid.tsx
  - components/SafeCanvas.tsx
  - components/__tests__/GalleryGrid.test.tsx
  - components/__tests__/SafeCanvas.test.tsx
  - components/home/AboutSection.tsx
  - components/home/AltimeterRail.tsx
  - components/home/AscentController.tsx
  - components/home/AscentHero.tsx
  - components/home/HeroBlock.tsx
  - components/home/PinMark.tsx
  - components/home/PosterSheet.tsx
  - components/home/SummitPlaque.tsx
  - components/home/TerrainStage.tsx
  - components/home/TrailSigns.tsx
  - components/home/WaypointCard.tsx
  - components/home/__tests__/boundary.test.ts
  - components/home/__tests__/hero.test.tsx
  - components/home/__tests__/pin-layer-3d.test.tsx
  - components/home/__tests__/rail.test.tsx
  - components/home/__tests__/summit.test.tsx
  - components/home/__tests__/waypoints.test.tsx
  - components/home/terrain/CameraRig.tsx
  - components/home/terrain/ContextLossGuard.tsx
  - components/home/terrain/PinLayer3D.tsx
  - components/home/terrain/TerrainCanvas.tsx
  - components/home/terrain/TerrainMesh.tsx
  - components/home/terrain/route-curve.ts
  - components/home/terrain/terrain-shader.ts
  - data/__tests__/tokens.test.ts
  - data/generated/tokens.ts
  - data/home.ts
  - data/landscapes.ts
  - data/types.ts
  - e2e/helpers/ascent.ts
  - e2e/helpers/webgl.ts
  - e2e/home-ascent.spec.ts
  - e2e/home-canvas.spec.ts
  - e2e/home-modes.spec.ts
  - e2e/homepage.spec.ts
  - e2e/no-webgl.spec.ts
  - e2e/perf/home-baseline.spec.ts
  - e2e/shell.spec.ts
  - e2e/visual/README.md
  - e2e/visual/hide-canvas.css
  - e2e/visual/routes.spec.ts
  - eslint.config.mjs
  - lib/__tests__/ascent-capability.test.ts
  - lib/__tests__/ascent-progress.test.ts
  - lib/__tests__/ascent-route.test.ts
  - lib/__tests__/ascent-summit.test.ts
  - lib/__tests__/ascent-waypoints.test.ts
  - lib/__tests__/frame-budget-policy.test.ts
  - lib/__tests__/frame-budget.test.ts
  - lib/__tests__/heightmap.test.ts
  - lib/__tests__/home-format.test.ts
  - lib/__tests__/poster-frame.test.ts
  - lib/__tests__/useAscentMode.test.tsx
  - lib/ascent/capability.ts
  - lib/ascent/frame-budget.ts
  - lib/ascent/poster-frame.ts
  - lib/ascent/progress.ts
  - lib/ascent/route.ts
  - lib/ascent/summit.ts
  - lib/ascent/waypoints.ts
  - lib/home-format.ts
  - lib/terrain/heightmap.ts
  - lib/useAscentMode.ts
  - package-lock.json
  - package.json
  - scripts/guards/palette-ratchet.json
  - scripts/guards/test-count.baseline.json
  - scripts/tokens/build-tokens.mjs
findings:
  critical: 0
  warning: 2
  info: 7
  total: 9
status: issues_found
---

# Phase 09: Code Review Report

**Reviewed:** 2026-10-25T13:28:20Z
**Depth:** standard
**Files Reviewed:** 77
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

I reviewed the Home ascent at standard depth. That covers the server and client components, the lazy terrain chunk, the pure `lib/ascent` modules, the token generator and the new or changed specs. I checked the key code paths against the libraries they call: R3F 9's `invalidate` and its unmount and dispose order in `node_modules/@react-three/fiber`, and `sampleBilinear` in `lib/terrain/dem-sample.ts`.

The pure maths holds up when traced by hand. That covers the progress mapping, plateau location, curve parameter, poster frame, mesh registration (PlaneGeometry row order after `rotateX(-PI/2)`, pixel-centre UVs, `meshHeightAtUv` against `sampleBilinear`) and the arrival formula against the sticky geometry. The ContextLossGuard teardown claim also holds: R3F flushes effect cleanups before `disposeRenderer` and `forceContextLoss`. I found no security problems. All fetches are same-origin and content-hashed, the heightmap is checked before it becomes geometry, nothing is injected into HTML, and the `__ascentBudgetMeasureOnly` hook is the intentional, already-analysed test hook (T-09-16), so it is not filed.

The main defect is in the frame-budget burst. A tab hidden during the first frames of the burst is not treated as a pause, because hidden tabs run no animation frames. The stale budget then declines a capable device when the tab returns. The existing "pauses while the tab is hidden" e2e cannot catch this, because it fakes `visibilityState` and animation frames keep running. The second warning is a race in the context-loss e2e against the real frame budget.

The known gap-plan items (summit plaque and pin overlaps at 375x667, 768x1024, 820x1180 and 1024x768, the hidden 768 waypoint-2 label, the 375 kicker orphan) and the open deferred items (fflate advisory, arm-before-load, hero scrim breakpoint, rail tick contrast) are not filed again.

## Warnings

### WR-01: A tab hidden during the reveal burst can decline a capable device (stale budget, no frame runs while hidden)

**File:** `components/home/terrain/CameraRig.tsx:259-293` and `:337-362`; `lib/ascent/frame-budget.ts:54`
**Issue:** The pause logic only throws away the running burst when a frame runs while `!shown`, in the `running && !shown` branch at line 338. That works for off-screen, because animation frames keep firing while the stage is off-screen. It does not work for a hidden tab: browsers suspend `requestAnimationFrame` in hidden tabs, so R3F's demand loop runs no frame while the tab is hidden. `burstPaused` stays `false`, and `update()` (lines 263-273) keeps the old `budget.current` when the tab comes back. The pending frame then runs with `shown === true`, and `running.sample(now, continuous)` reaches `now - start >= burstWindowMs && frames < minSamples` (frame-budget.ts:54), so the verdict is `'decline'`.

The window is the time the burst needs to collect 20 frames: about 350 ms after the reveal at 60 Hz, and about 0.8 s on a device running at around 25 fps, which still passes the budget. If the visitor switches tabs in that window:
- at pixel ratio above 1, the canvas drops to 1 for the rest of the page view (`dprSteppedDown` is module-level), and the fresh burst usually passes;
- at pixel ratio 1 (most desktop monitors), `downgradeAscent('frame-budget')` turns Home static for the rest of the page view on a device that can run the 3D view.

The comment at lines 91-93 says a burst cut short by a pause starts over, but that only happens when a frame is drawn during the pause. The e2e `pauses while the tab is hidden` (e2e/home-canvas.spec.ts:862-884) cannot catch this. Its `setVisibility` helper (line 749) overrides `document.visibilityState` but leaves animation frames running, so the test always takes the `running && !shown` path. It also runs only after `expect3dAfterVerdict`, when the burst is already over.

**Fix:** Drop the burst when the stage stops being shown, in the flag handler, so that no frame is needed:
```tsx
const update = (change: () => void) => {
  const was = shown();
  change();
  if (was && !shown()) {
    if (budget.current) {
      // No frame may run while hidden (rAF is suspended): drop the burst here, not in useFrame.
      budget.current = null;
      burstStart.current = -1;
      burstPaused.current = true;
    }
    return;
  }
  if (was || !shown()) return;
  if (burstPaused.current) { /* ...unchanged restart... */ }
  invalidate();
};
```
Option, as a second guard: in `createFrameBudget().sample`, treat a gap far above `maxMedianMs` (for example over `burstWindowMs`) as a restart instead of a slow frame. For a regression test, run a real burst and hide the page with CDP `Page.setWebLifecycleState({ state: 'frozen' })` or a second tab via `context.newPage()` + `bringToFront()`, so animation frames actually stop.

### WR-02: The context-loss e2e races the real frame budget at the size where CI's verdict is noise

**File:** `e2e/home-canvas.spec.ts:761-810` (and `lib/__tests__/frame-budget-policy.test.ts:98`, which pins it as `measureOnly: false`)
**Issue:** `context loss falls back to the poster` runs at 412 x 839 with the real budget. The policy test's own header says that at this size "CI's SwiftShader measures the 50 ms budget as noise", with 'decline' at 80.7 ms in run 40190531971. The test calls `loseContext()` right after `waitForRevealed`, which is the 500 ms `--duration-settle` fade plus polling. At that point the burst is still running: 20 intervals at 50 ms or more take at least 1 s. If CI is slow enough that the poll returns after a decline, `downgradeAscent('frame-budget')` has already unmounted the canvas at pixel ratio 1. Then `lost` is `false` (no canvas) and the test fails, or the downgrade reasons read `['frame-budget']` and the `toEqual(['context-lost'])` assertion fails. The test does not budget-gate its context loss, so its result depends on runner speed.
**Fix:** Either call `await budgetMeasureOnly(page)` before `goto`, because a decline is not what this test is about (update `frame-budget-policy.test.ts` line 98 to `measureOnly: true`), or wait for the verdict first with `await expect3dAfterVerdict(page)` before `loseContext()`. If the verdict can decline here, the first option is the deterministic one.

## Info

### IN-01: The same layout constants are repeated in modules that must agree

**File:** `components/home/AscentController.tsx:109`, `components/home/terrain/CameraRig.tsx:99-101`, `components/home/TerrainStage.tsx:34`, `components/home/terrain/TerrainCanvas.tsx:90`
**Issue:** `FLIP_PX = 240` is declared twice (poster and 3D label flip). `768` is declared twice (`NARROW_STAGE_PX` and `MOBILE_STAGE_PX`), next to Tailwind's `md` used by the rail scrim and the docked card. `camera={{ fov: 40 }}` repeats `CAMERA_FOV_DEG`. The poster and 3D pins are meant to flip at the same edge, and the camera rig is meant to match the CSS layout, so a change to one copy silently splits them. The 768 stage-width vs viewport-width difference is already behind the known 768 x 1024 overlap.
**Fix:** Export the constants once (for example `FLIP_PX` and `NARROW_STAGE_PX` from `lib/ascent/route.ts`, which is import-free), import them in all four places, and pass `fov: CAMERA_FOV_DEG`.

### IN-02: `ascent-canvas-ready` mark is not guarded, unlike the other two marks

**File:** `components/home/terrain/TerrainMesh.tsx:231`
**Issue:** `performance.mark(name, { detail })` is wrapped in try/catch in `useAscentMode.ts:104-108` and `CameraRig.tsx:127-133`, because "performance.mark with options is unavailable". The same call in the reveal frame callback is not wrapped. It runs after `markRevealed()`, so a throw would only log an uncaught error, but the handling is inconsistent.
**Fix:** Wrap it the same way, or drop the try/catch in all three places if the supported browsers make it unnecessary.

### IN-03: `summitPlaque(waypoints)` ignores its input for "Height gained"

**File:** `lib/ascent/summit.ts:52`
**Issue:** The function takes `waypoints` "for unit tests", but "Height gained" always reads the global `lowestDemM`. With injected waypoints, that stat disagrees with the other three stats and with `waypoints[0].altitudeM`, the rail start that the doc comment says it equals.
**Fix:** `value: formatMetres(summit.officialM - start.altitudeM)`. `start` is the lowest waypoint, so in production this equals `lowestDemM` (build-photo-data.mjs:227), and the parameter becomes honest.

### IN-04: `fourDecimals` is not "round half up" for every input

**File:** `lib/home-format.ts:36-39`
**Issue:** `Math.round(Math.abs(v) * 1e4)` works on the binary value. `45.97635 * 1e4` is `459763.49999999994`, so `45.97635` prints `45.9763`, not the documented half-up `45.9764`. The committed summit coordinate is not affected today, but the contract in the doc comment (and the "rounds half up" test name) promises more than the code delivers.
**Fix:** Either soften the doc to "rounded to four decimals (binary value)", or round from the decimal string, for example `Number(Math.abs(v).toFixed(10))` before scaling, with a test for `45.97635`.

### IN-05: A downgrade lasts the whole client-side session, not only the page view

**File:** `lib/useAscentMode.ts:43`, `:101-110`; `components/home/terrain/TerrainCanvas.tsx:64`
**Issue:** `downgraded` and `dprSteppedDown` are module-level, so they survive App Router navigation. One context loss (a GPU reset) or one bad burst (see WR-01) keeps Home static, or at pixel ratio 1, for every later visit to Home until a full reload. The JSDoc says "for the rest of the page view". If "page view" means one document, the behaviour matches. If it means one visit to Home, it does not.
**Fix:** Decide which is intended and document it. If a later visit to Home should get the 3D view again, reset `downgraded` when AscentController mounts (or key the state by a mount id). Leave `dprSteppedDown` sticky if that is preferred.

### IN-06: The `/photos#slug` target only exists on the current gallery page

**File:** `components/GalleryGrid.tsx:36` (`id={image.slug}`), `components/home/WaypointCard.tsx:81`
**Issue:** GalleryGrid renders only the `itemsPerPage = 12` images of the current page, and only in the default grid view. A waypoint photo past position 12 would have no element with its id, so "View photo" would land at the top of /photos. Today there are 4 photos, and Phase 10 replaces the target with `/photos/{slug}`.
**Fix:** None needed before Phase 10. If the photo set grows first, open the page that holds the hashed slug on mount.

### IN-07: The server-HTML assertion escapes only the first `&`

**File:** `e2e/homepage.spec.ts` (the `server HTML shows the name, role and relief poster` test)
**Issue:** `site.role.replace('&', '&amp;')` replaces only the first ampersand. A role string with two `&`, or with `<` or `"`, would fail the test even though the page is correct.
**Fix:** `site.role.replaceAll('&', '&amp;')`, or assert on the hydrated DOM text, which the same test already reaches through `page.goto('/')`.

---

_Reviewed: 2026-10-25T13:28:20Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
