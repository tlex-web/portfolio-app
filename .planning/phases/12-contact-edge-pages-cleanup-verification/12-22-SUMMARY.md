---
phase: 12-contact-edge-pages-cleanup-verification
plan: 22
subsystem: verification
tags: [review-dispositions, e2e-flakes, playwright, zod, readme, docs]
status: complete

requires:
  - phase: 12-contact-edge-pages-cleanup-verification
    provides: "12-06 D-25 dispositions, 12-07 D-24 dispositions, 12-01 docs.stale-refs answer, 12-02 proxy 404 decision and D-17 CSP"
provides:
  - "Outcomes for every open 08 and 11 review info row (8 code fixes, 6 closed, 8 deferred with reason)"
  - "Dev-server flake rows in the 09, 10 and 11 deferred lists hardened, closed or handed to a follow-up with an exact fix"
  - "D-24 and D-25 dispositions copied into the Phase 9 deferred list row by row"
  - "README tree, features and content sections, and the Copilot notes, matching the current code"
affects: [12-23, milestone-audit]

actuals:
  tokens: 25200
  tasks: 3
  commits: 12
plan_head_before: 0e5a66d688006baac3c9db288bb2cbbc20aa40ec
plan_head_after: cf03b3c8a27db2be4e4f1ca491b281b2c25abd25

tech-stack:
  added: []
  patterns:
    - "zod uniqueness refines (unique / uniqueBy) for arrays whose entries become React keys or accessible names"
    - "test.describe.configure({ mode: 'default' }) for a spec file that overloads the dev server when fully parallel"

key-files:
  created: []
  modified:
    - data/schemas/project.ts
    - data/schemas/roadmap.ts
    - data/__tests__/projects.test.ts
    - data/__tests__/roadmap.test.ts
    - components/projects/RoutePanel.tsx
    - components/projects/DemoTerminal.tsx
    - components/projects/__tests__/DemoTerminal.test.tsx
    - lib/demo-terminal.ts
    - lib/__tests__/demo-terminal.test.ts
    - components/roadmap/RouteRow.tsx
    - scripts/terrain/fetch-trails.mjs
    - scripts/photos/extract-exif.mjs
    - scripts/photos/build-photo-data.mjs
    - e2e/photos-lightbox.spec.ts
    - e2e/case-study.spec.ts
    - README.md
    - .github/copilot-instructions.md
    - .planning/phases/11-engineering-roadmap/11-REVIEW-DISPOSITION.md
    - .planning/phases/08-data-terrain-pipeline/08-REVIEW-DISPOSITION.md
    - .planning/phases/09-home-ascent/deferred-items.md
    - .planning/phases/10-photography/deferred-items.md
    - .planning/phases/11-engineering-roadmap/deferred-items.md
    - .planning/phases/12-contact-edge-pages-cleanup-verification/deferred-items.md

key-decisions:
  - "Closed review rows use the ledger's `skipped` value with 'Closed, executor outcome' and the commit that removed the code in the Source cell; the disposition enum has no `closed`"
  - "photos-lightbox.spec.ts runs in order in one worker (mode 'default', not 'serial'), so a failure does not skip later tests and CI's single-worker retries stay per test"
  - "Flake rows whose fix is in a spec outside 12-22's list (shell.spec.ts, design-system.spec.ts) stay open with an exact proposed fix for a follow-up quick plan, per the orchestrator's instruction; they were reproduced, not changed"
  - "Rows whose fix needs new visible copy (11 IN-05 clip label, 11 IN-06 empty-state sentence) are deferred, because copy goes through Tim's content packet"

requirements-completed: [VERIFY-01]

coverage:
  - id: D1
    description: "Every open info row IN-01..IN-14 in 11-REVIEW-DISPOSITION.md and IN-01, IN-03..IN-09 in 08-REVIEW-DISPOSITION.md has an outcome with evidence; 08 CR-01 stays deferred under D-12"
    requirement: VERIFY-01
    verification:
      - kind: other
        ref: "grep -cE '^\\| IN-[0-9]+ \\| info \\| open \\|' 11-REVIEW-DISPOSITION.md -> 0; grep -cE '^\\| IN-0[13-9] \\| info \\| open \\|' 08-REVIEW-DISPOSITION.md -> 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Code fixes for 11 IN-01, IN-03, IN-04, IN-08, IN-10, IN-11, IN-13 and 08 IN-03, IN-05, with tests where the row is about a guard or contract"
    requirement: VERIFY-01
    verification:
      - kind: unit
        ref: "npx jest --silent (102 suites, 1658 tests passed)"
        status: pass
      - kind: other
        ref: "npm run lint (eslint, guards, data:check) exit 0; npm run type-check exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Dev-server flakes hardened in photos-lightbox.spec.ts and case-study.spec.ts; the four touched spec files pass a three-repeat whole-file dev-server run"
    requirement: VERIFY-01
    verification:
      - kind: e2e
        ref: "npx playwright test e2e/case-study.spec.ts e2e/photos-lightbox.spec.ts e2e/photos.spec.ts e2e/no-webgl.spec.ts --project=chromium --repeat-each=3 (dev server): 375 passed (4.4m)"
        status: pass
      - kind: e2e
        ref: "five-repeat -g runs listed in the 'Flake proofs' table (all 5 of 5 per test)"
        status: pass
    human_judgment: false
  - id: D4
    description: "README tree and Copilot notes match the code; no stale v1 names"
    requirement: VERIFY-01
    verification:
      - kind: other
        ref: "git grep -n -e HologramTerminal -e RoadmapFilters -e README_CLIX -e GlassmorphismNav -e '3D mountain hero' -- README.md .github/copilot-instructions.md -> no output; git ls-files --error-unmatch on all 89 README tree paths succeeds"
        status: pass
    human_judgment: true
    rationale: "Whether the rewritten README features and content sections read well, and describe the site as Tim wants it described, is a judgment the greps cannot make"

duration: 58min
completed: 2026-11-03
---

# Phase 12 Plan 22: Review rows, dev-server flakes and the README pass Summary

**Every open 08 and 11 review row has an outcome (9 fixed in 8 commits, 6 closed, 8 deferred with a reason). Photos-lightbox now runs in order on the dev server, which took the four-spec dev run from 83 failures to 375 of 375 passing. The README tree and the Copilot notes now name only code that exists.**

## Performance

- **Duration:** 58 min
- **Started:** 2026-11-03T01:11:01Z
- **Completed:** 2026-11-03T02:09:14Z
- **Tasks:** 3
- **Files modified:** 23 (17 code, test or doc files plus 6 planning records)

## Accomplishments

- 11-REVIEW-DISPOSITION: 7 rows fixed (IN-01, IN-03, IN-04, IN-08, IN-10, IN-11, IN-13), IN-14 closed, 6 deferred (IN-02, IN-05, IN-06, IN-07, IN-09, IN-12). Open count 14 -> 0.
- 08-REVIEW-DISPOSITION: IN-03 and IN-05 fixed, IN-06..IN-09 closed, IN-01 and IN-04 deferred. CR-01 stays deferred under D-12. Open count 8 -> 0.
- Dev-server flakes: the 10-07 interception and timeout failures are hardened in `e2e/photos-lightbox.spec.ts`. Three multi-page-load tests get `test.slow()`. Five rows are closed with five-repeat evidence. Two reproduced flakes whose fix sits in specs outside this plan are handed over with exact fixes.
- The 09 deferred list carries the D-24 (#10, #11, #12) and D-25 (five rows) dispositions, with Tim's answers quoted.
- README: the project tree is rebuilt from `git ls-files`, and the features, versions, environment variables and content sections now describe the current code. `.github/copilot-instructions.md` is updated on Tim's docs.stale-refs answer "fix".

## Task Commits

1. **Task 1: Dispositions for the open 08 and 11 review rows**
   - `fc8da17` fix: 11 IN-03 metric sourceUrl accepts https only
   - `37a3d8f` fix: 11 IN-08, IN-13 schema enforces unique React keys and Source names
   - `f6424d4` fix: 11 IN-04 route-log row ids are lowercase slugs clear of the page's own ids
   - `ba3dc6b` fix: 11 IN-11 RouteRow comment
   - `716fff7` fix: 11 IN-01 DemoTerminal and tick survive an empty or shrunken list
   - `7330a1b` fix: 11 IN-10 fetch-trails parses source.json with TerrainSource
   - `9a30297` fix: 08 IN-05 photos:exif lists .jpeg originals
   - `d5dde96` fix: 08 IN-03 GPS UTC resolves an ambiguous fall-back hour
   - `d3025e2` docs: dispositions for the 08 and 11 review rows (D-26)
2. **Task 2: Harden or close the dev-server flakes and record the carried dispositions**
   - `c048fda` test: harden the dev-server flakes (D-26)
   - `cf03b3c` docs: carried dispositions
3. **Task 3: README tree and Copilot notes**: `dcfcd71` docs (committed before Task 2's records, while Task 2's Playwright runs were in progress; the files do not overlap)

## Code-fix line counts (fix cap)

Changed lines are additions plus deletions from `git show --numstat`, counted as code + colocated test.

| Row | Commit | Files | Code | Test | Row total | Running total |
|-----|--------|-------|------|------|-----------|---------------|
| 11 IN-03 | fc8da17 | data/schemas/project.ts | 5 | 11 | 16 | 16 |
| 11 IN-08 + IN-13 | 37a3d8f | data/schemas/project.ts (36), data/schemas/roadmap.ts (6), components/projects/RoutePanel.tsx (3) | 45 | 29 | 74 | 90 |
| 11 IN-04 | f6424d4 | data/schemas/roadmap.ts | 3 | 12 | 15 | 105 |
| 11 IN-11 | ba3dc6b | components/roadmap/RouteRow.tsx | 2 | 0 | 2 | 107 |
| 11 IN-01 | 716fff7 | components/projects/DemoTerminal.tsx (6), lib/demo-terminal.ts (2) | 8 | 21 | 29 | 136 |
| 11 IN-10 | 7330a1b | scripts/terrain/fetch-trails.mjs | 6 | 0 | 6 | 142 |
| 08 IN-05 | 9a30297 | scripts/photos/extract-exif.mjs | 7 | 0 | 7 | 149 |
| 08 IN-03 | d5dde96 | scripts/photos/build-photo-data.mjs | 16 | 0 | 16 | 165 |

Totals: 92 code + 73 test = 165 changed lines. Two rows went over the cap. See Deviations 1 and 2. Every row after 08 IN-03 is deferred with "over the 12-22 fix cap": 11 IN-02, IN-07, IN-09 and IN-12. 11 IN-05 and IN-06 are deferred because their fixes need copy nobody has approved yet. 08 IN-01 and IN-04 are deferred for the reasons in their rows.

## Code-fix file list

| File | Row | Can it move pixels on a visual slug? |
|------|-----|--------------------------------------|
| data/schemas/project.ts | 11 IN-03, IN-08, IN-13 | No. A schema only; the committed data still parses unchanged |
| data/schemas/roadmap.ts | 11 IN-04, IN-08 | No. A schema only; all seven row ids already match |
| components/projects/RoutePanel.tsx | 11 IN-08 | No. Changes the React key only; the markup is identical |
| components/roadmap/RouteRow.tsx | 11 IN-11 | No. A comment |
| components/projects/DemoTerminal.tsx | 11 IN-01 | No. Changes only the empty and shrunken list states, which no slug renders |
| lib/demo-terminal.ts | 11 IN-01 | No. Same reason |
| scripts/terrain/fetch-trails.mjs | 11 IN-10 | No. A network script, not run in this plan; no generated file changed |
| scripts/photos/extract-exif.mjs | 08 IN-05 | No. `photos:exif --check` OK, sidecar unchanged |
| scripts/photos/build-photo-data.mjs | 08 IN-03 | No. `photos:build --check` OK, generated photos unchanged |

Flake hardening stays in spec files: `e2e/photos-lightbox.spec.ts` and `e2e/case-study.spec.ts`, both in the plan's list.

## Round 3 expected diffs

none. No 12-22 fix changes rendered markup, CSS, data values or generated assets on any visual slug (see the file list above).

## Flake proofs (dev server, chromium, fresh `next dev` per run)

| Row | Outcome | Command | Summary line |
|-----|---------|---------|--------------|
| 10-07 interception under load | hardened `c048fda` | `npx playwright test e2e/photos-lightbox.spec.ts -g "a tile click opens the photo in a dialog over the grid\|Escape closes through the router" --project=chromium --repeat-each=5` | 10 passed (22.5s), 5 per test, 0 flaky |
| multi-load hardening (`test.slow()`) | hardened `c048fda` | `npx playwright test e2e/case-study.spec.ts -g "box Metrics source links\|neither case study scrolls sideways" --project=chromium --repeat-each=5` | 10 passed (27.2s), 0 flaky |
| 10-01 cold /photos/[slug] (and the strip test's `test.slow()`) | closed / hardened | `npx playwright test e2e/photos-lightbox.spec.ts -g "Photo page \(LBOX-01 direct load\)" --project=chromium --repeat-each=5` | 25 passed (31.0s), 0 flaky |
| 11 no-such-slug 500 | closed (12-02 proxy) | `npx playwright test e2e/case-study.spec.ts -g "/projects/no-such-slug: HTTP 404" --project=chromium --repeat-each=5` | 5 passed (15.2s) |
| 11 Pause is sticky | closed, not reproduced | `npx playwright test e2e/case-study.spec.ts -g "Pause is sticky" --project=chromium --repeat-each=5` | 5 passed (25.7s) |
| 09 no-webgl timeouts | closed, obsolete | `npx playwright test e2e/no-webgl.spec.ts -g "contact keeps the form\|project detail keeps its content" --project=chromium --repeat-each=5` | 10 passed (18.1s) |
| 10-09 carousel stepper reset | closed, not reproduced | `npx playwright test e2e/photos-carousel.spec.ts -g "the stepper shows one photo" --project=chromium --repeat-each=5` | 5 passed (17.1s) |
| 11 shell attribution timeout | reproduced; follow-up | `npx playwright test e2e/shell.spec.ts -g "every route credits the source" --project=chromium --repeat-each=5` | 5 failed (timeout at `/offline`); shell + roadmap together: 59 passed (50.3s) |
| 10-06 G3 scroll-lock cross-talk | reproduced; follow-up | `npx playwright test e2e/photos-lightbox.spec.ts e2e/photos.spec.ts e2e/design-system.spec.ts --project=chromium --project=firefox --workers=2` | 1 failed, 174 passed (2.9m); alone `-g "scroll lock keeps the header box" --repeat-each=5`: 5 passed (16.7s) |

Before and after on the whole files:
- Before any hardening: `e2e/photos-lightbox.spec.ts e2e/photos.spec.ts e2e/no-webgl.spec.ts --repeat-each=5` (16 workers) passed 344 of 445 in one run. In a second run, 83 failed and 362 passed, every failure in photos-lightbox.
- `e2e/photos-lightbox.spec.ts` on its own: 16 failed and 36 passed with 16 workers, against 52 passed with `--workers=2`.
- With `mode: 'default'` only, the four-spec run with `--repeat-each=3` had 4 failures and 371 passes. All 4 were multi-page-load tests at the 30 s timeout.
- With `test.slow()` added, the verify command passed: 375 passed (4.4m), exit 0.
- `e2e/case-study.spec.ts` with `--repeat-each=5` (before hardening): 180 passed (2.2m).

Flake rows with an outcome:
- 09: 1 of 1 dev-server flake row (no-webgl)
- 10: 6 of 6 rows
- 11: 3 of 3 flake rows
- Rows left without an outcome: 0

## Docs (Task 3)

- `git grep -n -e HologramTerminal -e RoadmapFilters -e README_CLIX -e GlassmorphismNav -e "3D mountain hero" -- README.md .github/copilot-instructions.md` prints nothing; the planning baseline was 7 lines in README.md and 1 in the Copilot notes.
- All 89 paths the README tree names pass `git ls-files --error-unmatch`, including `app/(site)/photos/@modal/(.)[slug]` under `GIT_LITERAL_PATHSPECS=1`.
- docs.stale-refs: Tim's 12-01 answer, supplied: "fix: update `.github/copilot-instructions.md` in the README pass (12-22); `project_concept/` is gitignored (`.gitignore:90`) and stays unchanged". The Copilot notes are updated. Every file path they name is tracked, except the `ComponentName.test.tsx` and `feature-name.spec.ts` placeholders. `project_concept/` is gitignored local material and is left unchanged.
- Also out of date and left for later: Copilot's test counts, the WebKit-in-CI line (12-23 adds WebKit) and the "39 warnings" deployment line. The same goes for the README's duplicated Deployment section and its generic Getting Started text. None of these names a deleted file.

## Decisions Made

- The review ledger's disposition enum is `open|fixed|skipped|deferred`. A closed row is written as `skipped` with "Closed, executor outcome 12-22" and the commit that removed the code, so a later gate run keeps the row.
- `mode: 'default'` instead of `'serial'`: the file still runs in one worker in order, but a failure does not skip the tests after it, and retries stay per test.
- The orchestrator's rule beats the plan's broader spec scope. `e2e/shell.spec.ts` and `e2e/design-system.spec.ts` are not in 12-22's list, so both reproduced flakes are recorded with exact fixes (`test.slow()` at shell.spec.ts:402; `@prod-only` on the G3 test) and left open for a follow-up.

## Deviations from Plan

### Fix-cap overruns (recorded, not reverted)

**1. [Fix cap] 11 IN-08 + IN-13 exceeded "about 20 changed lines" per row**
- **Found during:** Task 1
- **Issue:** The shared fix totals 45 code lines. data/schemas/project.ts takes 36 of them for the two rows: a shared `unique`/`uniqueBy` helper, and Prettier wrapping each array refine onto several lines. data/schemas/roadmap.ts takes 6 and RoutePanel.tsx 3. Split between the two rows that is about 23 code lines each, plus 29 test lines. No new file and no dependency.
- **Why kept:** both rows close the same contract gap in one schema, and a partial revert would leave G-11-4's distinct Source names unenforced.
- **Committed in:** 37a3d8f

**2. [Fix cap] The running total reached 165, not about 150**
- **Found during:** Task 1
- **Issue:** 08 IN-03, the last fix (16 lines), took the total from 149 to 165 changed lines, counting tests (92 without them). No code fix came after it, and the rows still open were deferred with "over the 12-22 fix cap".
- **Committed in:** d5dde96

### Auto-fixed Issues

**3. [Rule 3 - Blocking] photos-lightbox failed on the dev server at HEAD, before any 12-22 change**
- **Found during:** Task 2 (reproduction)
- **Issue:** The verify command could not pass: photos-lightbox failed 16 of its 52 tests in one dev-server run with the default 16 workers. This is broader than the logged 10-07 row.
- **Fix:** `test.describe.configure({ mode: 'default' })` at file level, plus `test.slow()` on three multi-page-load tests. No assertion or timeout argument changed, and no test was removed, skipped or retried.
- **Verification:** the verify command passed (375 passed), and the five-repeat runs are in the table above.
- **Committed in:** c048fda

---

**Total deviations:** 2 fix-cap overruns recorded, 1 blocking issue auto-fixed. **Impact:** no scope creep beyond the plan's file list. The overrun is in line counts only.

## Issues Encountered

- In the first reproduction run, I lost the failure summary: the exit status was masked by `| tail`, and the summary header fell outside the tail. The pass count of 344 of 445 is all that remains from that run. Every later run wrote its full log to the scratchpad.
- Prettier `--write` on `lib/__tests__/demo-terminal.test.ts` reformatted lines that were already unformatted at HEAD. I reverted that and re-applied only the new test, so the commit carries no unrelated formatting.

## Open items handed on (not changed by 12-22)

- Follow-up quick plan (the orchestrator offers it to Tim). Exact fixes are in the rows:
  - `e2e/shell.spec.ts:402` gets `test.slow()`.
  - The G3 test in `e2e/design-system.spec.ts` gets `@prod-only`.
  - The `e2e/design-system.spec.ts:20` comment.
  - The prefetch / `x-edge-section` / CSP gap in proxy.ts and the 404 render (Tim, 2026-11-02: "Log it for 12-22 (Recommended)").
  - The hero-contour precache in build-terrain.mjs.
- 12-23 owns the two Firefox one-off failures, the 28 WebKit failures and the WebKit rerun of photos-lightbox (10-05 row; its CSP cause is fixed by `f111d49`).
- The tlui.de switch waits on DNS.

## User Setup Required

None.

## Next Phase Readiness

12-23 can union the Round 3 lists: this plan adds none. The review ledgers and deferred lists have no unexplained open row. The rows still open name an owner: 12-23, the follow-up quick plan, or DNS.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-03*

## Self-Check: PASSED

- All 12 task commits are ancestors of HEAD (fc8da17, 37a3d8f, f6424d4, ba3dc6b, 716fff7, 7330a1b, 9a30297, d5dde96, d3025e2, dcfcd71, c048fda, cf03b3c); evaluation-scope resolves the plan commits.
- Acceptance greps: 11 open info rows 0, 08 IN-01/03-09 open rows 0, one "## Round 3 expected diffs" heading, every code-fix file listed.
- Plan verification re-run at the end: npm run lint exit 0, npm run type-check exit 0, npx jest 102 suites / 1658 tests passed; dev-server four-spec --repeat-each=3: 375 passed.
- No server left on :3000; public/service-worker.js untouched (no build ran).
