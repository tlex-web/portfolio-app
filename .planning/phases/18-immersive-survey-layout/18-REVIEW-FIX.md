---
phase: 18-immersive-survey-layout
fixed_at: 2026-11-26T21:40:00Z
review_path: .planning/phases/18-immersive-survey-layout/18-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 18: Code Review Fix Report

**Fixed at:** 2026-11-26T21:40:00Z
**Source review:** .planning/phases/18-immersive-survey-layout/18-REVIEW.md
**Iteration:** 1
**Scope:** all (Tim's answer, 2026-11-26: "Fix all 9 (Recommended)")

**Summary:**
- Findings in scope: 9 (3 warnings, 6 info; WR-03 and IN-05 are necessity findings)
- Fixed: 9
- Skipped: 0
- Commits: 11 on gsd/phase-18-immersive-survey-layout, 6b2975c..a7ddacc. All were made in the main checkout (project rule: no worktree, no branch). None was pushed. No attribution trailers. No PNG was staged, and `check-snapshot-commit --none` passed before every commit.

## Fixed Issues

### WR-01: ShareButton's url-change reset keeps the previous URL's timer and pending copy

**Status:** fixed: requires human verification (state/race logic)
**Files modified:** `components/photos/ShareButton.tsx`, `components/photos/__tests__/share-button.test.tsx`
**Commits:** 3f9973a (RED), 9dbc0b5 (fix), 364abd7 (type fix for the RED row)
**Applied fix:**
- RED first. Four new rows in the "across a url change" describe failed against the old component:
  - a deferred copy for URL A that settles after the prop changes to B must show no 'Link copied';
  - a share for A rejected after the change must copy nothing;
  - the copied-label timer is cleared when the url changes (`getTimerCount() === 0`);
  - A's timer cannot empty a failure announced for B.
- Fix: a `generation` ref. The cleanup of a `useLayoutEffect` keyed on `[url]` bumps it and clears `timer.current`. It is a layout effect so it commits together with the render-time reset, before a settling promise can run. `copy()` and the share-rejection handler both capture the generation and do nothing when it is stale.
- The copy-failure path now also clears a running copied window and sets `copied` false, so a timer cannot empty `FAILED_STATUS`. Without this, clearing the timer alone would have left 'Link copied' stuck.
- No class or markup change. 364abd7 types the deferred stub as `jest.fn<Clipboard['writeText']>`. That was needed for `tsconfig.jest.json` and was found after the RED commit.
- share-button: 29 rows pass. The strip, photo-viewer and inline-phosphor rows stay green.

### WR-03: Impossible-state guard, a null-uv pin skip in `platePins`

**Status:** fixed: requires human verification (necessity: code removed)
**Files modified:** `lib/photos/plate-layout.ts`, `lib/regions.ts`, `components/photos/region/PlateSheet.tsx`, `lib/__tests__/plate-layout.test.ts`
**Commit:** 7a0fd58
**Applied fix:**
- `PlatePinSource.uv` is now required (`{ u: number; v: number }`). `platePins` is a plain `views.map`, one pin per view, so pin k is always number k. PlateKey's `<ol>` position therefore always matches the badge numbers.
- No throwing guard was added. With the required type, a guard would be another impossible branch.
- The "no position, no pin" wording in PlateSheet and `RegionPlateSheet.pins` now says every photo has a pin, because buildWaypoints guarantees a uv.
- The skip's test row became a one-pin-per-view row. The row count is unchanged and plate-layout stays green.

### IN-01: `stepIndex` has no production caller, and a PhotoViewer comment still refers to it

**Files modified:** `lib/photos/stepping.ts`, `components/photos/PhotoViewer.tsx`, `lib/__tests__/photos-stepping.test.ts`
**Commit:** b68896e
**Applied fix:**
- Deleted `stepIndex` and its two test rows.
- The stepWithEnd row "moves one place among the photos" now asserts literal positions instead of comparing against `stepIndex`.
- The PhotoViewer doc now names `step`'s `n < 2` early return and stepWithEnd. The stepping.ts header's "Ends" bullet now names stepWithEnd.
- No production behaviour change.

### IN-02: A misplaced JSDoc in build-terrain: `overviewUv`'s doc now sits above `wgs84Corners`

**Files modified:** `scripts/terrain/build-terrain.mjs`
**Commit:** e4a0638
**Applied fix:** The "WGS84 -> overview UV" block moved from above `wgs84Corners` to just above `function overviewUv`. The change is comment-only: `node --check` and `terrain:build --check` both report OK.

### IN-03: `RegionSequence` exports a `countLabel` that shadows the shared helper with another signature

**Files modified:** `components/photos/region/RegionSequence.tsx`, `components/photos/region/__tests__/SequenceFigure.test.tsx`
**Commit:** ef8e5b2
**Applied fix:** Renamed it to `sequenceCountLabel` and built it on `lib/home-format`'s `countLabel(n, 'photograph', 'photographs')`, so it now inherits the shared validation. The text is unchanged for every reachable n ≥ 1, and the existing 1/2/7 rows pass.

### IN-04: The BEV edition date on /sources is hard-coded, not read from its source

**Files modified:** `data/sources.ts`, `data/__tests__/sources.test.ts`
**Commit:** 9408545
**Applied fix:**
- The sentence stays byte-identical, because it is approved D-20 copy.
- A new sources.test row reads `data/terrain/plates/saalfelden/source.json` from disk and checks two things:
  - the sentence's month and year equal `formatMonthYear(edition)` ('September 2025');
  - its day equals the `Stichtag 15.09.2025` in `editionSource`, and that Stichtag's year-month equals `edition`.
- A rebuilt edition now fails the test instead of drifting. A comment beside the sentence says so.

### IN-05: Phantom requirement, the `fflate@^0.6.0` override and its 0.6.11 floor

**Status:** fixed: requires human verification (necessity: config removed)
**Files modified:** `package.json`, `scripts/guards/version-floors.json`
**Commit:** 8432ef0
**Applied fix:**
- Removed the `"fflate@^0.6.0": "0.6.11"` override.
- The floor is now the string `"fflate": "0.8.3"`. The guard accepts a string or a list, and a string matches the other floors.
- Reinstalled with the bundled npm (`node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" install`, npm 11.20.0). `package-lock.json` came out byte-identical (`cmp` against a pre-install copy), so no version or integrity changed.
- `npm ls fflate` shows a single 0.8.3. `guard:parity` passes.
- The guard selftest fixtures and the README format example keep their own `["0.6.11", "0.8.3"]` lists on purpose: they test the list format, not this repo's floor.

### IN-06: Fixed waits before assertions in photos-stepping

**Files modified:** `e2e/photos-stepping.spec.ts`
**Commit:** 7850ac7
**Applied fix:**
- **:487 ('stepping requests only hashed manifest derivatives'):** the fixed 1000 ms wait is replaced by `expect.poll`. It waits until every Zermatt series photo has a requested derivative and no `/images/photos/` request is still in flight (tracked through `request`, `requestfinished` and `requestfailed`). The assertions after it are unchanged.
- **:470 ('a region page loads no three.js chunk'):** the 2000 ms wait is kept on purpose. It asserts that nothing happens over time (no three.js chunk loads later), and there is no event to wait for, like the six idle seconds at :385. A comment now says so.
- No assertion was weakened.

### WR-02: The test-count ratchet was not raised at phase close

**Files modified:** `scripts/guards/test-count.baseline.json` (only)
**Commit:** a7ddacc (last, after every other fix commit)
**Applied fix:**
- Used the guard's own update mode on the dev listing, as 18-01 Task 3 did: `npx jest --json --outputFile=jest-results.json; env -u PW_PROD -u CI node scripts/guards/test-count.mjs --jest jest-results.json --update`. Then deleted jest-results.json.
- New floor: jest 2805 + e2e 851 = 3656 (was 3024), commit 7850ac7.
- Jest 2805 is the review's 2802, plus 4 WR-01 rows, minus 2 IN-01 rows, plus 1 IN-04 row.

## Verification

All gates ran in the **main checkout** (`C:/Users/tim/MyDocuments/Programming/portfolio_app`), not a worktree, so the results reproduce from this tree.

| Gate | Result |
|------|--------|
| `npm run type-check` (app, jest, e2e configs) | pass |
| `npx jest` (full) | 129 suites, 2805 passed, 0 skipped |
| `npm run lint` (eslint plus every guard, `data:check`, `guard:tests:scan`) | exit 0; parity OK, selftest 299/299 |
| `npm run guard:tests` (against the new baseline) | `jest 2805 + e2e 851 = 3656 (baseline 3656)`, OK |
| Production build: `rm -rf .next/static && npm run build`, then `git restore public/service-worker.js` | pass |
| Prod e2e: `PW_PROD=1 npx playwright test e2e/photos-stepping.spec.ts e2e/photos-lightbox.spec.ts e2e/photos-region.spec.ts e2e/sources.spec.ts --project=chromium --project=firefox` | **502 passed** (2.1 min), 0 failed, 0 flaky; service worker restored |
| Port 3000 before and after | clear |
| Prettier on touched files (LF-normalised) | clean. The one existing long line in share-button.test.tsx (the chrome `for (const cls of [...])` row) was already there at 6b2975c and is not from this run |

Pixels: no class or markup change in any fix, and no visual run was needed or dispatched.

---

_Fixed: 2026-11-26T21:40:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
