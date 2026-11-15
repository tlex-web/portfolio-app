---
phase: 15-region-plate-data-model
reviewed: 2026-11-15T00:13:01Z
depth: standard
files_reviewed: 107
files_reviewed_list:
  - .gitattributes
  - .gitignore
  - __tests__/jest-globals.d.ts
  - app/api/__tests__/feedback.test.ts
  - app/sitemap.ts
  - components/SafeCanvas.tsx
  - components/__tests__/SafeCanvas.test.tsx
  - components/contact/__tests__/CopyEmailButton.test.tsx
  - components/contact/__tests__/SummitRegister.test.tsx
  - components/home/PosterSheet.tsx
  - components/home/TrailSigns.tsx
  - components/home/WaypointCard.tsx
  - components/home/__tests__/hero.test.tsx
  - components/home/__tests__/pin-layer-3d.test.tsx
  - components/home/__tests__/rail.test.tsx
  - components/home/__tests__/terrain-stage.test.tsx
  - components/photos/CarouselControls.tsx
  - components/photos/CarouselStepper.tsx
  - components/photos/CarouselView.tsx
  - components/photos/JustifiedGrid.tsx
  - components/photos/LightboxDialog.tsx
  - components/photos/MapSheet.tsx
  - components/photos/PhotoViewer.tsx
  - components/photos/__tests__/lightbox-dialog.test.tsx
  - components/photos/__tests__/map.test.tsx
  - components/projects/__tests__/DemoTerminal.test.tsx
  - components/projects/__tests__/Metrics.test.tsx
  - components/projects/__tests__/sections.test.tsx
  - components/roadmap/__tests__/RouteLogFilters.test.tsx
  - components/site/EdgeArt.tsx
  - components/site/SiteFooter.tsx
  - components/site/SiteNav.tsx
  - components/site/__tests__/OfflineRetry.test.tsx
  - components/site/__tests__/SavedPages.test.tsx
  - components/site/__tests__/SiteFooter.test.tsx
  - components/site/__tests__/SiteNav.test.tsx
  - components/terrain/ContourField.tsx
  - components/terrain/SheetBand.tsx
  - components/terrain/SheetLegend.tsx
  - components/terrain/__tests__/ContourField.test.tsx
  - data/__tests__/editorial.test.ts
  - data/__tests__/exif-sidecar.test.ts
  - data/__tests__/home.test.ts
  - data/__tests__/photo-map.test.ts
  - data/__tests__/photos.test.ts
  - data/__tests__/plates.test.ts
  - data/__tests__/terrain.test.ts
  - data/generated/photos.ts
  - data/generated/plates.ts
  - data/home.ts
  - data/photos/photo-map.json
  - data/regions/regions.json
  - data/schemas/photo.ts
  - data/schemas/region.ts
  - data/schemas/terrain.ts
  - data/terrain/plates.json
  - e2e/case-study.spec.ts
  - e2e/helpers/photo-fixtures.ts
  - e2e/home-ascent.spec.ts
  - e2e/home-canvas.spec.ts
  - e2e/homepage.spec.ts
  - e2e/keyboard.spec.ts
  - e2e/offline.spec.ts
  - e2e/photos-carousel.spec.ts
  - e2e/photos-lightbox.spec.ts
  - e2e/photos-sweep.spec.ts
  - e2e/photos.spec.ts
  - e2e/shell.spec.ts
  - jest.config.js
  - lib/__tests__/ascent-summit.test.ts
  - lib/__tests__/ascent-waypoints.test.ts
  - lib/__tests__/home-waypoints.test.tsx
  - lib/__tests__/jest-globals-canary.test.ts
  - lib/__tests__/photo-routes.test.ts
  - lib/__tests__/photos-view-model.test.ts
  - lib/__tests__/poster-frame.test.ts
  - lib/__tests__/rate-limit.test.ts
  - lib/__tests__/region-series.test.ts
  - lib/__tests__/saved-pages.test.ts
  - lib/__tests__/service-worker-media.test.ts
  - lib/__tests__/service-worker-navigation.test.ts
  - lib/__tests__/sw-update.test.ts
  - lib/__tests__/useAscentMode.test.tsx
  - lib/__tests__/useReducedMotion.test.tsx
  - lib/ascent/home-photos.ts
  - lib/ascent/summit.ts
  - lib/ascent/waypoints.ts
  - lib/og/__tests__/routes.test.ts
  - lib/og/__tests__/template.test.tsx
  - lib/photos/routes.ts
  - lib/photos/view-model.ts
  - lib/saved-pages.ts
  - package-lock.json
  - package.json
  - proxy.ts
  - scripts/README.md
  - scripts/guards/__selftest__/test-count/fixme/e2e/y.ts
  - scripts/guards/check-ci-gate.mjs
  - scripts/guards/check-served-images.mjs
  - scripts/guards/lib/mp4-boxes.mjs
  - scripts/guards/selftest.mjs
  - scripts/guards/test-count.mjs
  - scripts/photos/build-photo-data.mjs
  - scripts/photos/extract-exif.mjs
  - scripts/terrain/build-terrain.mjs
  - tsconfig.e2e.json
  - tsconfig.jest.json
findings:
  critical: 0
  warning: 3
  info: 8
  total: 11
  necessity: 1
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-11-15T00:13:01Z
**Depth:** standard
**Files Reviewed:** 107
**Status:** issues_found

## Summary

I reviewed all 107 files at standard depth. I read the runtime and tooling source in full: the terrain build, both photo scripts, the guards and their selftest, the schemas, `lib/`, the changed components, `proxy.ts`, the sitemap and the configs. Then I read the tests, looking for assertions that cannot fail and for index lookups that depend on data order. I checked the generated data and the lockfile through `git diff d29ea9a..HEAD`. I read the necessity rubric (`necessity-review.md`) before classifying findings.

The phase is in good shape overall:
- The photo map works in both directions. `extract-exif` takes ids from the map, and `build-photo-data` checks that the map and the sidecar match one to one, that each file name agrees and that every region and plate exists.
- The plate registry schema blocks unsafe source paths, non-home plates with the wrong prefix, and 2D plates with heightmaps or a `map` contour set.
- Every hand-built photo path is now a `photoHref` call, and the source scan backs this up.
- The Home list is checked by tests that can actually fail: a mocked fifth photo would add a footer tick or change the sign count.
- The intentional choices recorded in the SUMMARYs were not re-flagged: the `@__PURE__` slug list, the mapped-type view in ContourField, the nav-height probe, the fail-closed telemetry rule and the positional Home lookups.

No blockers. There are three warnings:
1. **WR-01:** The terrain build quietly keeps a hillshade size that a non-home plate no longer declares. `--check` still passes, so the D-12 promise that the registry declares each plate's outputs does not hold when a size is removed.
2. **WR-02:** The new rule 18 in `check-ci-gate`, which stops job names built from expressions, can be bypassed with a YAML block scalar. Rule 5 has the same gap.
3. **WR-03:** `tsconfig.jest.json` covers fewer files than Jest runs. A test placed outside a `__tests__` directory would run but never be type-checked, which leaves a hole in GUARD-10.

The info items cover a stale README, a test that pins the whole directory listing, a duplicated e2e row, a type import from a package the project does not list, and smaller robustness points.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: A hillshade size dropped from a plate's declared outputs is kept, and `--check` passes

**File:** `scripts/terrain/build-terrain.mjs:463`, `scripts/terrain/build-terrain.mjs:495-497`
**Issue:** `resolvePosters` checks only the sizes the registry declares (`sizes = POSTER_SIZES.filter(s => plate.outputs.hillshade.includes(s))`). It then returns the recorded set unchanged (`recorded = { avif: { ...rec.avif }, webp: { ...rec.webp } }`), including any size the plate no longer declares. Example: a non-home plate goes from `hillshade: [1100, 640]` to `[640]`.
- **Write mode:** the 640 files pass, so `problems` is empty and `committed: true`. `urls` still holds the 1100 files, so they stay in `namesOf` and the stale sweep never deletes them. `plates.ts` is rewritten with the 1100 URL, and `budgetProblems` keeps sizing the visit's fetch from `avif[1100]`.
- **`--check`:** the 1100 names are "expected", so there is no `extra` line. `platesText` is rebuilt from the same recorded URLs and matches byte for byte, so the result is `terrain: OK`.

Nothing else catches this. `PlateSheet` allows any subset of `{1100, 640}`, and `Plates` pins the size count only for the home plate. The home plate is safe, because `Plates` requires both of its sizes. Every Phase 16 plate is exposed.
**Fix:** Keep only the declared sizes in the recorded set. Then a dropped size makes `plates.ts` stale and its files show up as `extra` in `--check`, and write mode sweeps them:
```js
const pick = (o) =>
  Object.fromEntries(sizes.filter((s) => typeof o?.[s] === 'string').map((s) => [s, o[s]]));
const recorded = rec ? { avif: pick(rec.avif), webp: pick(rec.webp) } : null;
```
Also add a selftest row: build the fixture plate, drop 1100 from its registry entry, and expect `--check` to exit 1 naming the two 1100 files.

### WR-02: Rule 18 (and rule 5) miss an expression job name written as a block scalar

**File:** `scripts/guards/check-ci-gate.mjs:276-279`, `scripts/guards/check-ci-gate.mjs:533`
**Issue:** Rule 18 was added (13 IN-03) to stop a `CI OK` name built from parts. It reads the name through `jobName(job)`, and `jobKey` returns only the text after `name:` on the key's own line. A folded or literal block scalar puts the expression on the next line:
```yaml
jobs:
  shadow:
    name: >-
      ${{ format('CI {0}', 'OK') }}
```
Here `jobName` returns `>-`, so rule 18 does not fire (line 533) and neither does rule 5 (line 513). GitHub still evaluates the folded string and posts a `CI OK` check run. Rule 17 reads raw continuation lines for exactly this reason, but rule 18 does not. A quoted key (`"name":`) also gets past `jobKey`'s `^\s*name\s*:` regex.
**Fix:** In `jobName`, when the value is a block indicator (`/^[|>][+-]?\d*$/`), join the following raw lines indented deeper than the key and return that text. Also accept an optionally quoted key. Add selftest rows: `name: >-` plus an expression line should fail rule 18, and a literal `name: >-` value should pass.

### WR-03: `tsconfig.jest.json` covers fewer files than Jest runs, so a test outside `__tests__/` is never type-checked

**File:** `tsconfig.jest.json:6`
**Issue:** Jest runs `**/__tests__/**/*.[jt]s?(x)` and also `**/?(*.)+(spec|test).[jt]s?(x)` (`jest.config.js:16`). The base `tsconfig.json` excludes `**/*.test.ts`, `**/*.test.tsx` and `**/*.spec.ts`, but `tsconfig.jest.json` includes only `**/__tests__/**/*.ts(x)`. So a test such as `lib/foo.test.ts` would run in Jest and be skipped by all three `tsc` runs. `npm run type-check` would stay green, which is the gap GUARD-10 / D-25 set out to close. No such file exists today, so the hole is latent, but nothing would warn about it.
**Fix:** Make the Jest config's include match Jest's `testMatch`:
```json
"include": ["next-env.d.ts", "__tests__/jest-globals.d.ts", "**/__tests__/**/*.ts", "**/__tests__/**/*.tsx", "**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
"exclude": ["node_modules", "e2e/**", "scripts/guards/__selftest__/**"]
```
Alternatively, narrow `testMatch` to `__tests__` only, so the two cannot drift apart.

## Info

### IN-01: The D-15 test pins the whole `public/terrain/` listing, so the first real second plate breaks it

**File:** `data/__tests__/terrain.test.ts:255`
**Issue:** D-15 requires the nine Matterhorn names and hashes to stay the same. The test instead requires the directory to hold exactly those nine files, and it disagrees with `plates.test.ts:194` ("at least the nine"). Any Phase 16 plate files, or a stray local file, will fail it even though the Matterhorn files are unchanged.
**Fix:** Assert that the nine names are a subset of the listing, and keep the exact `terrain.assets` basename check: `expect(listing).toEqual(expect.arrayContaining(D15))`.

### IN-02: The scripts/README generator table still lists the pre-Phase-15 inputs

**File:** `scripts/README.md:16-18`
**Issue:** The `photos:build` row lists only "the sidecar, corrections.json and the committed DEM source". It now also reads `photo-map.json`, `regions.json`, `plates.json` and each plate's source. The `photos:exif` row does not mention that ids now come from `data/photos/photo-map.json` (D-01).
**Fix:** Update both "Reads" cells.

### IN-03: The new cross-engine browser-Back row also runs in Chromium, duplicating the Chromium-only row

**File:** `e2e/photos-lightbox.spec.ts:829-830`
**Issue:** The 14 IN-06 row is tagged only `@no-win-webkit`, so the Chromium project runs it too. It has the same view, size, setup and close as the `@chromium-only` row just above it, so Chromium runs the same scenario twice.
**Fix:** Retag the existing line-829 row as the cross-engine row (drop `@chromium-only`) instead of adding a second one, or exclude the new row from Chromium.

### IN-04: The Jest globals declaration imports types from a package the project does not list

**File:** `__tests__/jest-globals.d.ts:13`
**Issue:** `jest-mock` is reached only through npm hoisting (it is a dependency of `@jest/globals`). It is not in `package.json`. A non-hoisting install, or a change in the dependency tree, would make `tsc -p tsconfig.jest.json` fail to resolve it.
**Fix:** Add `jest-mock` as a devDependency at the jest version, or derive the types from `@jest/globals` (for example `Parameters<typeof j.fn>`) so the only import is the direct dependency.

### IN-05: A plate's `strip.centreN` outside its extent is silently clamped

**File:** `data/schemas/terrain.ts:251`, `scripts/terrain/build-terrain.mjs:547`
**Issue:** `stripBbox` clamps the band to the extent edge, and neither `PlateEntry` nor the build checks that `centreN` lies inside the plate's `source.extent`. A typo in a Phase 16 registry entry would therefore produce a band at the sheet edge with no error. The Matterhorn value is pinned by `plates.test.ts:179`; new plates are not.
**Fix:** In `buildPlate`, throw when `plate.strip.centreN` is not strictly between `extent.south` and `extent.north`, naming the plate and the registry file.

### IN-06: Non-home poster parameters come from terrain.ts, so an unreadable terrain.ts re-encodes every plate's posters

**File:** `scripts/terrain/build-terrain.mjs:444-451`
**Issue:** `recordedPosters` takes `params` for every plate from `committedMeta()`. When terrain.ts fails the anchored regex or JSON parse, `params` is `undefined`, so `sameParams` is false for every plate. Write mode then re-encodes every lossy poster. On another platform the bytes and hashes differ, which churns URLs for returning visitors.
**Fix:** Record the HILLSHADE parameters in each plate's sheet in plates.ts, or fail loudly when terrain.ts cannot be read in write mode instead of treating it as "parameters changed".

### IN-07: "Every photo is in exactly one known region" is nearly a tautology

**File:** `data/__tests__/photo-map.test.ts:74-79`
**Issue:** `Regions` already forces region ids to be unique and sorted, so filtering by id can only return 0 or 1 results. Every photo has exactly one map record by construction. The test can only fail when a region is unknown, which the previous test (line 68) already checks.
**Fix:** Drop the test, or make it check something the schema does not, for example that `photos.ts`'s `region` matches the record's region for every photo (already partly covered at line 89).

### IN-08: Impossible-state guard: `height || 0` in navHeightPx

**File:** `components/photos/LightboxDialog.tsx:132`
**Category:** necessity
**Issue:** `getBoundingClientRect().height` is always a finite number in every engine, never `NaN` or `undefined`. A missing `--nav-h` leaves the probe at `height: auto`, which measures 0, as the doc comment at line 121 itself says. The `|| 0` fallback therefore guards against a state that cannot occur.
**Fix:** `return probe.getBoundingClientRect().height;` and drop the fallback, keeping the comment about the 0 px case.

---

_Reviewed: 2026-11-15T00:13:01Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
