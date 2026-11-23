---
phase: 16-new-regions-alps-overview-data
plan: 18
subsystem: infra
tags: [ci, review-disposition, readme, gate, visual-regression, client-js-budget, privacy, phase-close]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-04 fix commits for 15 IN-03 (6874684), IN-04 (7d5acb8), IN-07 (1197c8d), IN-08 (0a4274c); 16-10 IN-01/IN-05/IN-06 (6ac809e); 16-01 phase-base client JS (1,851,572 B) and the D-25 scan procedure; 16-11/16-13/16-15/16-16/16-17 the fetcher flags, the overview build and the Ortler plate and photos the README now describes"
provides:
  - "scripts/README.md generator table after Phase 16 (15 IN-02): photos:exif, photos:build and terrain:build inputs and outputs, rows for terrain:fetch --plate, terrain:fetch:bev and terrain:fetch:overview, the two staleness rules"
  - "15-REVIEW-DISPOSITION IN-01..IN-08 each carry 'fixed in Phase 16: 16-NN <sha>' with a resolving SHA"
  - "PROJECT.md A-15-12 row reads accepted (Tim, 2026-11-15, Phase 16 D-05)"
  - "Full local gate green on the tip; no PNG and no Matterhorn byte changed in 72 phase commits; client JS +113 B against a 4,096 B budget; D-25 scan unchanged from 16-17"
  - "ci/16-18 CI run 45188005124 (see CI on ci/16-18)"
affects: [phase-16-verify, gsd-ship, 17-routes-seo]

actuals:
  tokens: 2976     # chars/4 over git diff 325ad8a e96f266
  tasks: 3
  commits: 2       # 1232553, e96f266 (plus the docs(16-18) metadata commit)
plan_head_before: 325ad8a945c85e160f1757c73470336975bb4ece
plan_head_after: e96f26675448e276e91ebbbbb643ba0121a5aea9

tech-stack:
  added: []
  patterns:
    - "Disposition write-back appends the outcome to the Source cell; enum, Tim's text and the frontmatter unchanged (14-07 / 15-16 precedent)"

key-files:
  created:
    - .planning/phases/16-new-regions-alps-overview-data/16-18-SUMMARY.md
  modified:
    - scripts/README.md
    - .planning/phases/15-region-plate-data-model/15-REVIEW-DISPOSITION.md
    - .planning/PROJECT.md

key-decisions:
  - "ci/16-18 holds the Task 1 tip e96f266; the SUMMARY/STATE/ROADMAP/REQUIREMENTS commits after it stay on the local phase branch, because D-24 covers a new ci/16-* branch and fast-forward fix pushes, not docs pushes"
  - "IN-02 cites the README commit 1232553 (16-18), committed alone so the write-back can name it"

patterns-established: []

requirements-completed: [DATA-12, DATA-13, DATA-14]

coverage:
  - id: D1
    description: "IN-02: the scripts/README generator table lists the post-Phase-16 inputs and the three fetchers"
    verification:
      - kind: other
        ref: "grep -c terrain:fetch:bev scripts/README.md = 1; grep -c terrain:fetch:overview scripts/README.md = 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-22 write-back: all eight 15 IN rows carry 'fixed in Phase 16: 16-NN <sha>'; every SHA resolves; no other row or frontmatter changed"
    verification:
      - kind: other
        ref: "grep -cE '^\\| IN-0[1-8] .*fixed in Phase 16: 16-[0-9]{2} `[0-9a-f]{7,}`' = 8; git cat-file -e <sha>^{commit} for all 8 = 0; git diff 56d62af removed-line check = 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-05: the PROJECT.md A-15-12 row reads accepted; D-26: ROADMAP Phase 16 keeps **UI hint**: no"
    verification:
      - kind: other
        ref: "grep A-15-12 .planning/PROJECT.md | grep -c accepted = 1; sed Phase 16 section | grep -cF '**UI hint**: no' = 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-25 local gate green on the tip: lint, three-config type-check, Jest + guard:tests, terrain --check, six e2e specs in Chromium and Firefox"
    requirement: DATA-12
    verification:
      - kind: other
        ref: "npm run lint (exit 0, selftest 290/290, data:check all OK, served-images OK, scan OK); npm run type-check (exit 0)"
        status: pass
      - kind: unit
        ref: "npx jest --json --outputFile=jest-results.json (115/115 suites, 1998/1998 tests) && npm run guard:tests (jest 1998 + e2e 598 = 2596, baseline 2243, OK)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 PW_REUSE=1 npx playwright test photos-lightbox photos shell homepage seo not-found --project=chromium --project=firefox (341 passed: chromium 180, firefox 161)"
        status: pass
    human_judgment: false
  - id: D5
    description: "D-25 / Phase 15 D-15: the nine Matterhorn files, terrain.ts, precache.json and the home source byte-identical to f258fbe; D-15 literal test passes; no PNG in 72 commits"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "git diff --quiet f258fbe -- data/generated/terrain.ts data/generated/precache.json data/terrain/source (exit 0); no unprefixed public/terrain change since f258fbe"
        status: pass
      - kind: unit
        ref: "npx jest data/__tests__/terrain.test.ts (40/40)"
        status: pass
      - kind: other
        ref: "check-snapshot-commit --sha <sha> --none over git rev-list f258fbe..HEAD (72 commits, all 'snapshot-commit: OK (0 changed)')"
        status: pass
    human_judgment: false
  - id: D6
    description: "Client JS at the tip within the 16-01 base + 4,096 B"
    verification:
      - kind: other
        ref: "rm -rf .next/static && npm run build; 15-01 byte-sum script = 1,851,685 B in 24 files (base 1,851,572 B, +113 B; cap 1,855,668 B)"
        status: pass
    human_judgment: false
  - id: D7
    description: "D-25 / D-12: booleans-only coordinate scan over .planning/ (committed and working tree, this SUMMARY included) finds nothing new"
    requirement: DATA-14
    verification:
      - kind: other
        ref: "d25-scan-1609.mjs (scratchpad, 13 originals): output byte-identical to 16-17's final run; every 'yes' pre-existing and reviewed"
        status: pass
    human_judgment: false
  - id: D8
    description: "ci/16-18 is green on the pushed tip with Visual Regression PASS, under D-24 and nothing beyond it"
    verification:
      - kind: other
        ref: "gh run list --branch ci/16-18 --workflow CI --limit 1 = 'success e96f26675448e276e91ebbbbb643ba0121a5aea9' = git rev-parse HEAD at Task 3"
        status: pass
      - kind: other
        ref: "node scripts/ci/check-visual-run.mjs --sha e96f266… --wait 30 = PASS (exit 0)"
        status: pass
    human_judgment: false

duration: 47min
completed: 2026-11-23
---

# Phase 16 Plan 18: Phase close - IN-02 README, carried findings written back, full gate and ci/16-18 Summary

**The scripts README now documents the post-Phase-16 generators and the three fetchers (15 IN-02, `1232553`). All eight carried Phase 15 info findings cite their fix commits, and A-15-12 reads accepted. The local gate is green on the tip: no PNG and no Matterhorn byte changed in 72 phase commits, client JS is +113 B against a 4,096 B budget, and the coordinate scan matches 16-17's.**

## Performance

- **Duration:** see frontmatter
- **Started:** 2026-11-23T13:44:31Z
- **Tasks:** 3
- **Files modified:** 3 (plus this SUMMARY)

## Accomplishments

- **IN-02 (`1232553`):** the `scripts/README.md` generator table now matches the scripts.
  - `photos:exif` reads the top-level originals and `photo-map.json` (precision and kind). For a coarse record it also reads `regions.json`, `plates.json` and the region's plate source.
  - `photos:build` reads the sidecar, corrections, photo map, regions, plates, each plate source and `data/home-waypoints.ts`. It writes `photos.ts` and `home-photos.ts`.
  - `terrain:build` reads `plates.json`, every plate source, `regions.json` and the overview source and parameters. It writes `plates.ts`, `home-plate.ts` and `overview.ts` beside `terrain.ts` and `precache.json`.
  - New rows: `terrain:fetch -- --plate <id>` (swissALTIRegio, manual), `terrain:fetch:bev` (BEV ALS DTM, manual, bounded retry) and `terrain:fetch:overview` (GLO-90, manual).
  - Two new sentences cover staleness. A coarse photo's `photos:exif --check` goes stale when its plate source changes. Editing `regions.json` leaves `terrain:build --check` stale until `terrain:build` runs.
- **D-22 write-back (`e96f266`):** each 15 IN row's Source cell gains `; fixed in Phase 16: 16-NN <sha>`. Enums, Tim's text and the frontmatter are unchanged.

| Finding | Plan | SHA | `git cat-file -e` |
|---------|------|-----|-------------------|
| IN-01 | 16-10 | `6ac809e` | commit |
| IN-02 | 16-18 | `1232553` | commit |
| IN-03 | 16-04 | `6874684` | commit |
| IN-04 | 16-04 | `7d5acb8` | commit |
| IN-05 | 16-10 | `6ac809e` | commit |
| IN-06 | 16-10 | `6ac809e` | commit |
| IN-07 | 16-04 | `1197c8d` | commit |
| IN-08 | 16-04 | `0a4274c` | commit |

- **D-05 (`e96f266`):** the PROJECT.md A-15-12 row's status reads `✓ Good — accepted (Tim, 2026-11-15, Phase 16 D-05: "Keep it (Recommended)")`. The rest of the row is unchanged.
- **D-26:** the ROADMAP Phase 16 section still has `**UI hint**: no`, so the count is 1.

## Local gate (tip `e96f266`)

| Check | Result |
|-------|--------|
| `npm run lint` | exit 0. It ran eslint, parity, ci-gate, palette, contrast (47 pairs) and identity, then `guard:selftest` (290/290, 0 FAIL). `data:check` passed: terrain, photos:exif (originals present, so hashes were re-checked), photos:derive, photos:build, tokens, trails and clips all OK. `guard:images` and `guard:tests:scan` were OK. |
| `npm run type-check` | exit 0 on all three configs (app, `tsconfig.jest.json`, `tsconfig.e2e.json`) |
| `npx jest --json --outputFile=jest-results.json` | 115/115 suites, 1998/1998 tests, 0 failed, 0 pending, 0 todo |
| `npm run guard:tests` | `test-count: jest 1998 + e2e 598 = 2596 (baseline 2243)`, `test-count: OK` |
| `npm run terrain:build -- --check` | `terrain: OK` |
| Matterhorn identity vs `f258fbe` | `git diff --quiet f258fbe -- data/generated/terrain.ts data/generated/precache.json data/terrain/source` exits 0. `public/terrain/` held 9 files at `f258fbe`, and no unprefixed file changed since (only `ortler-`, `saalfelden-` and `overview-` files were added). |
| D-15 literal test | `npx jest data/__tests__/terrain.test.ts`: 40/40 |
| `check-snapshot-commit --sha <sha> --none` for every commit in `f258fbe..HEAD` | 72 commits (a non-empty list), each `snapshot-commit: OK (0 changed)`; `git diff --name-only f258fbe -- 'e2e/**/*.png'` is empty |
| e2e: `photos-lightbox`, `photos`, `shell`, `homepage`, `seo`, `not-found` against one production build (`next start` on :3000, `PW_PROD=1 PW_REUSE=1`) | 341 passed (1.2 min): **chromium 180, firefox 161**. 0 failed, 0 flaky, 0 skipped. The two "failed" hits in the log are a test title ("a failed photo shows the error and Retry"). |
| `jest-results.json` | gitignored (`.gitignore:15`), not staged |
| `public/service-worker.js` | Restored after the build. The server was stopped, and port 3000 is free. |

Phase 16 declares no PNG set (D-25). No PNG was changed, staged or committed in `f258fbe..HEAD`.

## Client JS budget (`.next/static/chunks`, uncompressed, 15-01 script)

| Point | Total | vs base | Files |
|-------|-------|---------|-------|
| Phase base (16-01, `7a12661`) | 1,851,572 B | 0 | 24 |
| **Tip (16-18, `e96f266`)** | **1,851,685 B** | **+113 B** | 24 |
| Phase cap | 1,855,668 B | +4,096 B | |

The tip is 3,983 B under the cap. Procedure: `rm -rf .next/static && npm run build`, then the byte-sum script, then `git restore public/service-worker.js`.

## CI on `ci/16-18` (D-24)

- **Push:** `git push origin HEAD:refs/heads/ci/16-18`, a plain push to a new branch (absent from `git ls-remote` beforehand).
- **Run:** https://github.com/tlex-web/portfolio-app/actions/runs/45188005124 (event `push`). Its headSha is `e96f26675448e276e91ebbbbb643ba0121a5aea9`, the pushed tip. Conclusion: **success** (13:51:01Z to 14:31:34Z).

| Job | Conclusion |
|-----|------------|
| Classify changes | success |
| Dependency Review | skipped (pull-request only) |
| Security Audit | success |
| Unit Tests | success |
| Lint and Type Check | success |
| Build Application | success |
| Visual Regression | success |
| E2E Tests | success (40m15s) |
| CI OK | success |

- **Visual check:** `node scripts/ci/check-visual-run.mjs --sha e96f266… --wait 30` returned `PASS https://github.com/tlex-web/portfolio-app/actions/runs/45188005124/job/137738656575`.
- **Remote tip:** `git ls-remote origin refs/heads/ci/16-18` prints `e96f26675448e276e91ebbbbb643ba0121a5aea9`, which equals `git rev-parse HEAD` at Task 3.
- **Annotations:** the run has three, and none failed a job.
  - The Security Audit job left two: a warning, "Security vulnerabilities found. Please review npm audit output.", and "Process completed with exit code 1". Every step in that job still concluded `success`, and the same job was also `success` on `ci/15-16`.
  - Build Application warned "No files were found with the provided path: .next/".
- **Nothing else happened on the remote:**
  - no `visual-baselines.yml` dispatch and no other workflow dispatch
  - no force push
  - no push of the phase branch or `main`
  - no PR
- **Branch state:** no job needed a re-run. `ci/16-18` stays on origin.
- **Session break:** the executor's session ended while it waited on this run. Its last scratchpad write was 13:58Z, during E2E. The orchestrator re-read the finished run in a new session and filled this section. Then it ran the final scan and made the metadata commit. Every value above comes from `gh` output read at close-out.

## D-25 scan

- **Script:** `d25-scan-1609.mjs` in the scratchpad, never committed. It covers 13 originals: 11 at the top level, plus 2 in `not-in-series/`. `incoming/` is empty since 16-17 moved the Ortler files up. It checks lat and lon at 2, 3 and 4dp, LV95 E/N at 1 m and 10 m, EPSG:3035 E/N at 1 m and 10 m (through `toGrid`), and the GPS altitude. Each check is `git grep --untracked -F` over `.planning/`. It prints file names and booleans only.
- **Run 1:** made after Task 1's commits, before this SUMMARY existed. Its output is byte-identical to 16-17's final run.
- **Final run (Task 3 last step):** run after this SUMMARY was complete (CI section included) and before it was committed. It printed 177 lines, byte-identical to run 1, with no line naming a 16-18 file.
- **Results:**
  - The EPSG:3035 strings show no match for any original.
  - Every "match: yes" is pre-existing and already reviewed. The hits sit in the v2.0 milestone files and the Phase 13-15 files, as in 16-08 to 16-17. They also include the known D-01 example in 16-CONTEXT.md and 16-RESEARCH.md, which equals a current photo's public 4dp latitude.
  - No line names a 16-18 file, and nothing new needs review.

## Task Commits

1. **Task 1: docs and write-backs (tracer)**
   - `1232553` (docs): the README (IN-02)
   - `e96f266` (docs): the disposition write-back and A-15-12
   - Tracer gate: auto mode is off and `human_verify_mode` is end-of-phase with an automated-only verify. The verify was re-run on the committed tip and passed (8 rows, 8 resolving SHAs, README count 1).
2. **Task 2: full local gate.** No commit. Every check passed on the first run.
3. **Task 3: push ci/16-18 and read CI back.** No commit. It was a push and a read-back only.

**Plan metadata:** the `docs(16-18)` SUMMARY/STATE/ROADMAP/REQUIREMENTS commit, which stays on the local phase branch.

## Files Created/Modified

- `scripts/README.md`: generator table rows for `photos:exif`, `photos:build` and `terrain:build`; three fetcher rows; two staleness sentences; the `data:check` line; one photo-map hint in the "After adding or editing a photo" block
- `.planning/phases/15-region-plate-data-model/15-REVIEW-DISPOSITION.md`: IN-01..IN-08 gain `; fixed in Phase 16: 16-NN <sha>`
- `.planning/PROJECT.md`: the A-15-12 status cell reads accepted

## Decisions Made

- `ci/16-18` stays at the Task 1 tip `e96f266`. Only docs commits follow it. D-24 covers a new `ci/16-*` branch and fast-forward fix pushes, so they were not pushed. CI verified the last commit that changes anything outside `.planning/`, which is `scripts/README.md`.

## Deviations from Plan

**1. [Rule 1 - Doc accuracy] The README's `data:check` line was out of date**
- **Found during:** Task 1
- **Issue:** the code block above the table listed five `--check` steps. `package.json` runs seven, adding `trails:build` and `clip:derive`.
- **Fix:** the line now matches `package.json`. No table rows were added for those two scripts, because they are outside IN-02's scope.
- **Files modified:** `scripts/README.md`
- **Commit:** `1232553`

**2. [Note] The A-15-12 row had already recorded Tim's decision**
- **Found during:** Task 1
- **Issue:** the plan expected "pending Tim's review". The discussion commit `49a3562` had already changed it to "✓ Good — Tim kept it on 2026-11-15 (…D-05)", but without the word "accepted" that the acceptance check looks for.
- **Fix:** only the status words changed, to `accepted (Tim, 2026-11-15, Phase 16 D-05: "Keep it (Recommended)")`. The reversibility note and the other cells are unchanged.
- **Commit:** `e96f266`

**3. [Note] The `photos:derive` row is unchanged**
- `photos:derive`'s Reads and Writes are unchanged in Phase 16 (`git log f258fbe..HEAD -- scripts/photos/build-derivatives.mjs` is empty), so its row was left as it was. The "After adding or editing a photo" block now says to add a photo-map record, with region, country, precision and kind, before `photos:exif`.

**Total deviations:** 1 auto-fixed doc line and 2 notes. **Impact:** docs only, with no behaviour change.

## Issues Encountered

None. The first lint run wrote its log one directory above the repo. It was moved into the scratchpad straight away, and nothing in the repo was affected.

## User Setup Required

None.

## Next Phase Readiness

- Every Phase 16 plan has a SUMMARY. DATA-12, DATA-13 and DATA-14 are marked complete in this close-out. 16-18 is the last plan that declares them.
- Next: `/gsd-verify-work 16`, then `/gsd-ship`. The phase branch is not pushed.
- The time-zone label item stays deferred to Phase 17/18 (`deferred-items.md`).

---
*Phase: 16-new-regions-alps-overview-data*
*Completed: 2026-11-23*
