---
phase: 12-contact-edge-pages-cleanup-verification
plan: 05
subsystem: data
tags: [jest, image-manifest, photos-derive, cleanup, verify-01]

requires:
  - phase: 10-photos
    provides: "10-09 moved every image consumer to the hashed manifest derivatives and added the .legacy read guard"
  - phase: 12-contact-edge-pages-cleanup-verification
    provides: "12-02 PW_REUSE Playwright switch (confirmed: grep count 1)"
provides:
  - "data/__tests__/asset-exists.test.ts: every quoted /images/, /terrain/, /media/ literal in data/**/*.{ts,json} exists under public/"
  - "Generator, schema and manifest with no legacy field (legacyOf, LegacyUrl, the legacy key and the legacy-file check removed)"
  - "public/images/optimized/ deleted (60 tracked files)"
affects: [12-11 visual re-baseline, 12-14 OG images, verify-work VERIFY-01]

actuals:
  tokens: 4300
  tasks: 2
  commits: 2
plan_head_before: 67970b3def8c6e735cab43e6557936d740f3f1e3
plan_head_after: e78a01002eddd71866395f08c5fc274b344f0fd5

tech-stack:
  added: []
  patterns:
    - "Asset-exists guard: string literals only (comments stripped, ${} templates skipped), query/fragment removed, plus a made-up-path test so the walk cannot pass vacuously"

key-files:
  created:
    - data/__tests__/asset-exists.test.ts
  modified:
    - scripts/photos/build-derivatives.mjs
    - data/schemas/image-manifest.ts
    - data/generated/image-manifest.ts
    - data/__tests__/editorial.test.ts
    - data/__tests__/image-manifest.test.ts
    - scripts/README.md

key-decisions:
  - "Asset-exists matcher reads whole quoted literals instead of the plan's bare regex: the bare regex stops at spaces and ')' (the v1 file names contain both) and matches script paths in comments, so it would have failed at HEAD"
  - "The walk covers data/**/*.json as well as .ts, so data/generated/precache.json is guarded too"
  - "photos:derive write mode re-encoded all 36 derivatives byte-identically; only the manifest changed (20 legacy lines removed)"

patterns-established:
  - "Delete public assets only behind a passing asset-exists test committed first"

requirements-completed: [VERIFY-01]

coverage:
  - id: D1
    description: "Asset-exists Jest guard over every same-origin path in data/, committed before the deletion"
    requirement: VERIFY-01
    verification:
      - kind: unit
        ref: "data/__tests__/asset-exists.test.ts (4 tests)"
        status: pass
      - kind: other
        ref: "git log: b26ea6f (test) precedes e78a010 (deletion)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Legacy field removed from generator, schema and manifest; data:check passes"
    requirement: VERIFY-01
    verification:
      - kind: other
        ref: "npm run lint (data:check -> photos:derive --check: OK)"
        status: pass
      - kind: other
        ref: "npm run type-check"
        status: pass
      - kind: unit
        ref: "data/__tests__/image-manifest.test.ts#no entry has a legacy field and public/images/optimized/ does not exist (VERIFY-01)"
        status: pass
    human_judgment: false
  - id: D3
    description: "public/images/optimized/ (60 files) deleted; photos still load from hashed derivatives and the full-res v1 URLs still 404"
    requirement: VERIFY-01
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/data-privacy.spec.ts e2e/photos.spec.ts --project=chromium (45 passed, fresh build)"
        status: pass
      - kind: unit
        ref: "npx jest --silent (86 suites, 1403 tests)"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 05: Legacy Image Variant Deletion Summary

**An asset-exists Jest guard over data/ went in first; then `legacyOf`, `LegacyUrl` and the manifest `legacy` blocks were removed and the 60 v1 files in public/images/optimized/ were deleted. All 36 hashed derivatives stayed byte-identical.**

## Performance

- **Duration:** about 7 min
- **Started:** 2026-11-02T17:48:57Z
- **Completed:** 2026-11-02T17:55:28Z
- **Tasks:** 2
- **Files modified:** 7 source files plus 60 deletions

## Accomplishments

- `data/__tests__/asset-exists.test.ts` walks every .ts and .json file under data/ and asserts each quoted `/images/`, `/terrain/` and `/media/` literal exists under public/. It also checks that each family has at least one hit, that a made-up `/images/does-not-exist.webp` is reported missing, and that the helper handles comments, placeholders, queries and spaces correctly. I proved it bites by moving one legacy thumb aside at HEAD: 1 failed, naming that path. I restored the file before committing.
- Generator (`scripts/photos/build-derivatives.mjs`): removed `legacyOf`, the `legacy` manifest property, the legacy-file existence check and the now-unused `PUBLIC_DIR`. Header comments updated.
- Schema (`data/schemas/image-manifest.ts`): removed `LegacyUrl` and the `legacy` key. The header no longer promises files kept "until Phase 12".
- `npm run photos:derive` (write mode, originals present) rewrote only `data/generated/image-manifest.ts` (20 deletions). `git status --porcelain public/images/photos` is empty.
- Tests rewritten (none deleted). The editorial view-model test now asserts every stage, tile and opener URL starts with `/images/photos/` and no manifest entry has a `legacy` key. The image-manifest legacy test became "no entry has a legacy field and public/images/optimized/ does not exist".
- `git rm -r public/images/optimized`: exactly 60 files, matching the plan baseline. `scripts/README.md` now names the manifest as the only image source.

## Task Commits

1. **Task 1: An asset-exists test for every same-origin path in data/**: `b26ea6f` (test)
2. **Task 2: Remove the legacy field from the generator, schema and manifest, then delete the 60 files**: `e78a010` (refactor)

## Files Created/Modified

- `data/__tests__/asset-exists.test.ts`: new guard (4 tests)
- `scripts/photos/build-derivatives.mjs`: no legacy variants, no legacy check
- `data/schemas/image-manifest.ts`: no `LegacyUrl`, no `legacy` key
- `data/generated/image-manifest.ts`: regenerated; 12 legacy paths gone
- `data/__tests__/editorial.test.ts`: view-model test asserts derivative-only URLs and no legacy key
- `data/__tests__/image-manifest.test.ts`: legacy-existence test replaced by legacy-absence test
- `scripts/README.md`: `--check` description and manifest paragraph updated
- `public/images/optimized/`: 60 files deleted

## Decisions Made

- **Matcher reads quoted literals, not the plan's bare regex.** The plan's `/\/(?:images|terrain|media)\/[^'"`\s)]+/g` stops at spaces and `)`. The v1 names (`IMG_0605-Enhanced (2022_02_01 09_47_03 UTC)-large.webp`) contain both, so at HEAD it would have reported 4 truncated "missing" paths. It also matches `scripts/media/...` and `/media/<id>.<hash>.mp4` inside JSDoc comments and generated-file headers (25 false hits in all). The test strips comments, captures whole quoted literals, and skips `${`-templates. The plan's three behaviours are kept unchanged.
- **.json included in the walk** (`data/generated/precache.json` lists a `/terrain/` URL). The plan named .ts files, but the truth says "data/**".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Asset-path regex in the plan would fail at HEAD**
- **Found during:** Task 1
- **Issue:** The planned regex truncates paths at spaces and `)` and matches comment text, so it would have produced 25 false "missing" paths at HEAD.
- **Fix:** Match whole quoted literals after stripping block and whole-line comments, and skip template literals that contain `${`. A fourth test pins this behaviour.
- **Files modified:** data/__tests__/asset-exists.test.ts
- **Verification:** 4/4 pass at HEAD. Moving one referenced legacy file aside makes test 1 fail with that exact path.
- **Committed in:** b26ea6f

**2. [Rule 1 - Bug] Unused `PUBLIC_DIR` after removing the legacy check**
- **Found during:** Task 2
- **Issue:** Only the legacy-file check used `PUBLIC_DIR`, so removing the check left a dead constant.
- **Fix:** Removed the constant.
- **Files modified:** scripts/photos/build-derivatives.mjs
- **Verification:** `npm run lint` passes (0 errors) and `photos:derive --check` prints OK.
- **Committed in:** e78a010

---

**Total deviations:** 2 auto-fixed (2 Rule 1)
**Impact on plan:** Both were needed for the guard to work and for clean code. No scope creep.

## TDD Gate Compliance

Task 1 is a guard (characterization) test. The plan specifies that it passes at HEAD and is committed as `test(12-05)`, so there is no failing-first RED and no `feat(12-05)` GREEN commit. To show the test is not vacuous, I deleted one referenced asset locally at HEAD and ran it: 1 failed, 3 passed, and the diff named `/images/optimized/IMG_0605-Enhanced (2022_02_01 09_47_03 UTC)-thumb.webp`. I restored the file before committing. Task 2 is `type="auto"` (refactor).

## Issues Encountered

- `npm run lint` prints 9 react-hooks warnings (0 errors) in files outside this plan. They were already there and are out of scope.
- E2E: I ran the plan-level fresh `PW_PROD=1` build instead of a separate per-task build-once/`PW_REUSE` server, which is the stricter of the two. 45 passed with no failures or flakes. Port 3000 was free afterwards, and `public/service-worker.js` was restored and never staged.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- VERIFY-01's legacy-variant deletion is done. Any future deletion or rename of a referenced asset under public/ now fails Jest.
- No visual spec was run, and this plan should not change any pixels (the derivatives are byte-identical).

## Self-Check: PASSED

- FOUND data/__tests__/asset-exists.test.ts, scripts/photos/build-derivatives.mjs, data/schemas/image-manifest.ts, data/generated/image-manifest.ts
- public/images/optimized ABSENT (git ls-files: 0)
- FOUND b26ea6f, e78a010 (ancestors of HEAD)
- Acceptance: legacyOf count 0, `"legacy"` count 0, public/images/photos clean, the asset-exists test committed before the deletion commit
- Plan verification: lint exit 0, type-check exit 0, Jest 86/86 suites (1403 tests), Playwright chromium 45 passed, service-worker.js clean

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*
