---
phase: 16-new-regions-alps-overview-data
plan: 04
subsystem: testing
tags: [jest, playwright, npm, lightbox, photos, regions, review-findings]

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-01 precision/kind photo-map tests (photo-map.test.ts as this plan found it)"
provides:
  - "jest-mock 30.5.2 as an exact devDependency (15 IN-04)"
  - "@not-chromium tag, inverted by the chromium project in dev and production mode (15 IN-03)"
  - "navHeightPx returns the probe's measured height with no fallback (15 IN-08)"
  - "photo-map.test.ts: 'every registry region holds at least one photo' and the EPSG:2056 uv recompute (15 IN-07)"
affects: [16-10, 16-18, 18-immersive-layout]

actuals:
  tokens: 1326
  tasks: 3
  commits: 4
plan_head_before: dd6a092b9e0ffe8d2771c39b5f812205d496fe58
plan_head_after: 1197c8d495017f01ed5c227305285a3861ba9e13

tech-stack:
  added: ["jest-mock 30.5.2 (devDependency, exact; already the transitive copy)"]
  patterns:
    - "@not-chromium: a cross-engine e2e row that a @chromium-only row already covers in Chromium is dropped from the chromium project in both modes"

key-files:
  created:
    - .planning/phases/16-new-regions-alps-overview-data/deferred-items.md
  modified:
    - package.json
    - package-lock.json
    - playwright.config.ts
    - e2e/photos-lightbox.spec.ts
    - components/photos/LightboxDialog.tsx
    - data/__tests__/photo-map.test.ts

key-decisions:
  - "Each of the four findings has its own commit (Task 2 split into an IN-03 and an IN-08 commit) so 16-18 can write one SHA per row back to 15-REVIEW-DISPOSITION.md"
  - "IN-07's uv recompute covers EPSG:2056 plates only (planner decision); EPSG:3035 photos stay with photos:build and the 16-10 selftest, because Jest cannot import proj4"

patterns-established:
  - "Region-completeness test: list the registry ids with no generated photo and expect the list to be empty, so the failure names the region"

requirements-completed: [DATA-13]

coverage:
  - id: D1
    description: "IN-04: jest-mock is an exact devDependency at 30.5.2; the lockfile changed by one line in the root devDependencies block"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "grep -cF '\"jest-mock\": \"30.5.2\"' package.json (1) + lockfile gate (0 unrelated lines) + npm ls jest-mock --depth=0 + npm run type-check"
        status: pass
    human_judgment: false
  - id: D2
    description: "IN-03: Chromium lists one 'step to the last photo, browser Back' row, Firefox one, in dev and PW_PROD mode"
    requirement: DATA-13
    verification:
      - kind: e2e
        ref: "npx playwright test e2e/photos-lightbox.spec.ts --project=chromium|firefox --list (n=1, f=1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "IN-08: navHeightPx returns the probe's measured height directly"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "components/photos/__tests__/lightbox-dialog.test.tsx (21 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "IN-07: two real region checks replace the tautology; an empty region fails and is named"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "data/__tests__/photo-map.test.ts (16 passed; mutation with an extra empty region fails naming it)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-11-23
status: complete
---

# Phase 16 Plan 04: Four carried Phase 15 info findings (IN-03, IN-04, IN-07, IN-08) Summary

**jest-mock pinned at 30.5.2 through the bundled npm, the browser-Back lightbox close run once per engine via a new @not-chromium tag, navHeightPx stripped of its impossible `|| 0`, and the region tautology replaced by an empty-region check and an EPSG:2056 uv recompute. Rendered output is unchanged.**

## Performance

- **Duration:** about 6 min
- **Started:** 2026-11-23T01:12:53Z
- **Completed:** 2026-11-23T01:19Z
- **Tasks:** 3 (4 commits)
- **Files modified:** 6 (plus this SUMMARY and deferred-items.md)

## Finding to commit map (for 16-18's write-back)

| Finding | Commit | Files |
|---------|--------|-------|
| 15 IN-04 | `7d5acb8` | package.json, package-lock.json |
| 15 IN-03 | `6874684` | playwright.config.ts, e2e/photos-lightbox.spec.ts |
| 15 IN-08 | `0a4274c` | components/photos/LightboxDialog.tsx |
| 15 IN-07 | `1197c8d` | data/__tests__/photo-map.test.ts |

## Accomplishments

- **IN-04:** `jest-mock` is now an exact devDependency at `30.5.2`. It was installed with `node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" install --save-dev --save-exact jest-mock@30.5.2`. `npm ls jest-mock` shows the direct copy, and every jest/@jest copy dedupes onto it. `npm run type-check`, which includes `tsconfig.jest.json`, passes.
- **IN-03:** The cross-engine browser-Back row's tags are now `@no-win-webkit @not-chromium`. `CHROMIUM_INVERT` is `/@not-chromium/` in production mode and `/@prod-only|@not-chromium/` in dev mode, and the comment above it names 15 IN-03. Chromium lists only the `@chromium-only` row. Firefox (and Linux WebKit in CI) keep the cross-engine row. Both rows still exist.
- **IN-08:** `navHeightPx` measures the probe, removes it and returns `height`. The JSDoc sentence about a missing `--nav-h` measuring 0 stays.
- **IN-07:** The tautology's slot now holds `every registry region holds at least one photo`. Next to it is `every photo on an EPSG:2056 plate has the uv of its position on that plate (EPSG:3035 plates are checked by photos:build and the guard selftest)`, which looks up each photo's region plate in `data/generated/plates.ts` and compares round4 of `lv95ToUv(wgs84ToLv95(position), sheet.extent.lv95)` with the generated uv. It also asserts that at least one photo was checked, so it cannot pass with zero checks.

## Full package-lock.json diff (IN-04 acceptance)

```diff
@@ -54,6 +54,7 @@
         "geotiff": "3.0.5",
         "jest": "^30.5.2",
         "jest-environment-jsdom": "^30.5.2",
+        "jest-mock": "30.5.2",
         "postcss": "^8.5.32",
         "prettier": "^3.9.10",
         "sharp": "^0.35.5",
```

The `node_modules/jest-mock` entry already carried `"dev": true` and is unchanged.

## Verification results

| Check | Result |
|-------|--------|
| `grep -cF '"jest-mock": "30.5.2"' package.json` | 1 (PASS) |
| Lockfile gate (changed lines unrelated to jest-mock) | 0, exit 0 (PASS) |
| `npm ls jest-mock --depth=0` | `jest-mock@30.5.2`, exit 0 (PASS) |
| Playwright list, "step to the last photo, browser Back" | HEAD: chromium 2, firefox 1. After: chromium 1, firefox 1 (dev). PW_PROD: chromium shows only the `@chromium-only` row, firefox only the `@not-chromium` row (PASS) |
| `grep -c "not-chromium" playwright.config.ts` | 2 (PASS, >=1) |
| `grep -cF "height \|\| 0" components/photos/LightboxDialog.tsx` | 0 (PASS) |
| `npx jest components/photos/__tests__/lightbox-dialog.test.tsx` | 21 passed (PASS) |
| `npx jest data/__tests__/photo-map.test.ts` | before 15 passed, after 16 passed (PASS, count did not drop) |
| `grep -c "at least one photo"` / `grep -c "every photo is in exactly one known region"` | 1 / 0 (PASS) |
| Mutation: add an empty region `zz-empty` to regions.json | the new test fails and lists `zz-empty`; file restored with `git checkout -- data/regions/regions.json` (PASS) |
| `npm run guard:tests:scan` | scan OK (PASS) |
| `npm run type-check` | 0 errors (PASS) |
| `npm run lint` (full chain incl. data:check, guard:selftest) | exit 0 (PASS) |

## Decisions Made

- I committed one finding per commit. The plan's Task 2 covers IN-03 and IN-08, and its success criteria ask for "each in its own commit with a SHA ready for the disposition write-back", so Task 2 went in as two commits.
- `@not-chromium` sits after `@no-win-webkit` in the row's tag string, so the row keeps its existing tag first.

## Deviations from Plan

### Notes (no rule-based auto-fixes)

**1. The IN-03 row's title text gains ` @not-chromium`.** The row tags are part of the test title (`... the trigger is fully in view ${tags}`, spec line ~947), so tagging the row changes its title suffix. The plan says "titles stay unchanged", and the descriptive part does stay unchanged. The unique `file + title` key count is also unchanged: the two browser-Back rows were already distinct keys and still are. The total listed across all projects goes from 163 to 162 because Chromium no longer runs the duplicate, which is the point of the fix. GUARD-03 counts unique keys, so it is unaffected.

**2. Task 3 type fix.** `new Set(photos.map((p) => p.region))` inferred `Set<"zermatt">` from the `as const` data, so `.has(id: string)` failed `tsc -p tsconfig.jest.json`. I fixed it with `new Set<string>(...)` before the commit. This is not a plan deviation, just part of writing the test.

**Total deviations:** 0 auto-fixed. **Impact:** none. All four fixes are pixel-neutral, and no visual baseline or rendered output changed.

## Issues Encountered

- `e2e/photos-lightbox.spec.ts` already had 7 Prettier formatting spots at dd6a092 (lint does not run Prettier). They are out of scope and logged in `deferred-items.md`. The lines this plan edited are Prettier-clean.
- The working copies of `playwright.config.ts` and `e2e/photos-lightbox.spec.ts` are CRLF (autocrlf checkout). The committed blobs are LF, as before.
- The bundled npm warned about `@parcel/watcher` install scripts and 24 moderate audit findings. Both were already there and are unrelated to jest-mock, which has no install script.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- 16-18 can write IN-03, IN-04, IN-07 and IN-08 back to `15-REVIEW-DISPOSITION.md` using the SHAs in the map above. IN-01, IN-05 and IN-06 land in 16-10 and IN-02 in 16-18.
- Once 16-05 or a later plan adds the new regions, the IN-07 empty-region test fails until each new region has at least one generated photo (DATA-13 edge).

## Self-Check: PASSED

- FOUND: package.json, package-lock.json, playwright.config.ts, e2e/photos-lightbox.spec.ts, components/photos/LightboxDialog.tsx, data/__tests__/photo-map.test.ts
- FOUND commits: 7d5acb8, 6874684, 0a4274c, 1197c8d (all ancestors of HEAD)
