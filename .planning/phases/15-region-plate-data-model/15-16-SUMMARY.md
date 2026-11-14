---
phase: 15-region-plate-data-model
plan: 16
subsystem: infra
tags: [ci, review-disposition, gate, visual-regression, client-js-budget, phase-close]
status: complete

requires:
  - phase: 15-13
    provides: 13 IN-01..03 fix commits (61ea7ed, de025fa, 40a4e9e)
  - phase: 15-14
    provides: 14 IN-01/02 (66eb7f2), IN-03 (c24b622), IN-05/06 (065d628) fix commits
  - phase: 15-01
    provides: phase-base client JS total (1,850,382 B) and its byte-sum script
provides:
  - "13-REVIEW-DISPOSITION IN-01..03 and 14-REVIEW-DISPOSITION IN-01/02/03/05/06 written back as fixed in Phase 15 with resolving SHAs"
  - "14 IN-04 written back as deferred to Phase 18; ROADMAP Phase 18 scope note"
  - "Full local gate green on the tip (lint, three-config type-check, Jest 1912 + guard:tests, terrain --check, 657 e2e in Chromium and Firefox)"
  - "No PNG and no Matterhorn terrain byte changed since d29ea9a; check-snapshot-commit --none OK on all 78 commits"
  - "ci/15-16 CI run 43651737781: CI OK success, Visual Regression PASS with no baseline update"
affects: [phase-15-verify, phase-18, gsd-ship]

actuals:
  tokens: 1300
  tasks: 3
  commits: 1
plan_head_before: d664589e4941abeb19154d44c2c0c366a3f0f956
plan_head_after: 0b0660879ed760d14e40db9fde05a751b293f665

tech-stack:
  added: []
  patterns:
    - "Disposition write-back appends the outcome to the Source cell; enum and frontmatter disposition untouched (14-07 precedent)"

key-files:
  created:
    - .planning/phases/15-region-plate-data-model/15-16-SUMMARY.md
  modified:
    - .planning/phases/13-repo-safety-test-debt/13-REVIEW-DISPOSITION.md
    - .planning/phases/14-ui-fixes-terminal-controls/14-REVIEW-DISPOSITION.md
    - .planning/ROADMAP.md

key-decisions:
  - "ci/15-16 holds the Task 1 tip 0b06608; the later docs-only SUMMARY/STATE commits are not pushed, because D-31 covers new ci/15-* branches and fast-forward fix pushes, not docs pushes"

patterns-established: []

requirements-completed: [DATA-09, DATA-10, DATA-11, DATA-15, GUARD-10]

coverage:
  - id: D1
    description: "Carried review findings written back (D-29): 3 fixed rows in 13-REVIEW-DISPOSITION, 5 fixed rows and 1 deferred-to-Phase-18 row in 14-REVIEW-DISPOSITION, Phase 18 scope note for 14 IN-04"
    verification:
      - kind: other
        ref: "grep -c 'fixed in Phase 15' 13-REVIEW-DISPOSITION.md = 3; 14-REVIEW-DISPOSITION.md = 5; 'deferred to Phase 18' = 1; ROADMAP '14 IN-04' = 1; git cat-file -t on all 6 SHAs = commit"
        status: pass
    human_judgment: false
  - id: D2
    description: "Full local gate green on the tip (lint, type-check over three configs, Jest + guard:tests, terrain --check, touched e2e specs in Chromium and Firefox)"
    requirement: GUARD-10
    verification:
      - kind: other
        ref: "npm run lint && npm run type-check (exit 0, 0 'error TS')"
        status: pass
      - kind: unit
        ref: "npx jest --json --outputFile=jest-results.json && npm run guard:tests (113 suites, 1912 tests; jest 1912 + e2e 598 = 2510 >= baseline 2243)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test <13 touched specs> --project=chromium --project=firefox (657 passed: 365 chromium, 292 firefox)"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-15 / D-32: no PNG, no Matterhorn terrain byte, no terrain.ts or precache.json change since d29ea9a; snapshot check passes per commit"
    requirement: DATA-15
    verification:
      - kind: other
        ref: "git diff --exit-code --name-only d29ea9a..HEAD -- public/terrain data/generated/terrain.ts data/generated/precache.json '*.png' (exit 0); npm run terrain:build -- --check (terrain: OK)"
        status: pass
      - kind: other
        ref: "check-snapshot-commit --sha <sha> --none over git rev-list d29ea9a..HEAD (78 commits, all 'snapshot-commit: OK (0 changed)')"
        status: pass
    human_judgment: false
  - id: D4
    description: "Client JS at the tip within the phase budget (at most 4,096 B above the 15-01 phase base)"
    requirement: GUARD-10
    verification:
      - kind: other
        ref: "rm -rf .next/static && npm run build; 15-01 byte-sum script = 1,851,572 B in 24 files (base 1,850,382 B, +1,190 B; cap 1,854,478 B)"
        status: pass
    human_judgment: false
  - id: D5
    description: "ci/15-16 CI OK success and Visual Regression PASS with no baseline update"
    requirement: DATA-09
    verification:
      - kind: other
        ref: "gh run list --branch ci/15-16 --workflow CI --limit 1 = {conclusion: success, headSha: 0b06608...}"
        status: pass
      - kind: other
        ref: "node scripts/ci/check-visual-run.mjs --sha 0b06608 --wait 30 = PASS .../runs/43651737781/job/132621533688"
        status: pass
    human_judgment: false

duration: 39min
completed: 2026-11-14
---

# Phase 15 Plan 16: Phase close - review write-back, full gate and ci/15-16 Summary

**Carried review findings written back with resolving SHAs (14 IN-04 handed to Phase 18), the full local gate green in Chromium and Firefox, no PNG or Matterhorn terrain byte changed in 78 phase commits, client JS +1,190 B against a 4,096 B budget, and ci/15-16 green with Visual Regression passing on unchanged baselines.**

## Performance

- **Duration:** 39 min
- **Started:** 2026-11-14T23:01:05Z
- **Completed:** 2026-11-14T23:40:31Z
- **Tasks:** 3
- **Files modified:** 3 (plus this SUMMARY)

## Accomplishments

- D-29 write-back, 14-07 precedent: the outcome is appended to each row's Source cell. Enums, Tim's reasons and the frontmatter `disposition:` values are unchanged, and no other row was touched.
  - 13 IN-01 `61ea7ed`, IN-02 `de025fa`, IN-03 `40a4e9e` (15-13)
  - 14 IN-01 and IN-02 `66eb7f2`, IN-03 `c24b622`, IN-05 and IN-06 `065d628` (15-14)
  - 14 IN-04: deferred to Phase 18 (D-29). It also has a new bullet in ROADMAP Phase 18's scope notes.
- The local gate is green on the tip (D-32). The phase changed no PNG and no terrain byte (D-15).
- CI on `ci/15-16` is green across every job, and Visual Regression passed without a baseline update.

## Local gate (tip `0b06608`)

| Check | Result |
|-------|--------|
| `npm run lint` | exit 0: eslint, parity, ci-gate, palette, contrast (47 pairs), identity, `guard:selftest` 256/256, `data:check` (terrain, photos:exif, photos:derive, photos:build, tokens, trails, clips all OK), `guard:images` OK, `guard:tests:scan` OK |
| `npm run type-check` | exit 0 on all three configs (app, `tsconfig.jest.json`, `tsconfig.e2e.json`), 0 `error TS` |
| `npx jest --json --outputFile=jest-results.json` | 113/113 suites, 1912/1912 tests, 0 failed, 0 pending, 0 todo |
| `npm run guard:tests` | `test-count: jest 1912 + e2e 598 = 2510 (baseline 2243)`, `test-count: OK` |
| `npm run terrain:build -- --check` | `terrain: OK` |
| `git diff --exit-code --name-only d29ea9a..HEAD -- public/terrain data/generated/terrain.ts data/generated/precache.json '*.png'` | exit 0, nothing listed |
| `check-snapshot-commit --sha <sha> --none` for every commit in `d29ea9a..HEAD` | 78 commits (a non-empty list), each `snapshot-commit: OK (0 changed)` |
| e2e: 13 touched specs (`home-ascent`, `homepage`, `shell`, `home-canvas`, `photos`, `photos-sweep`, `photos-carousel`, `photos-lightbox`, `keyboard`, `seo`, `not-found`, `offline`, `case-study`), one production build, `next start` on :3000 | 657 passed (2.8 min): **chromium 365, firefox 292**. 0 failed, 0 flaky. The Firefox count is lower because of the Chromium-only rows and the `@firefox-43967` grepInvert, which is expected. |
| `jest-results.json` staged? | No (it is gitignored at `.gitignore:15`, and `git diff --cached` is empty) |
| `public/service-worker.js` | Restored after the build. `git diff --quiet HEAD` exits 0. |

Phase 15 declares no PNG set (D-32). No PNG was changed, staged or committed: `git log --oneline d29ea9a..HEAD -- '*.png'` is empty.

## Client JS budget (`.next/static/chunks`, uncompressed, 15-01 script)

| Point | Total | vs base | Files |
|-------|-------|---------|-------|
| Phase base (15-01, `05d736a`) | 1,850,382 B | 0 | 24 |
| 15-11 end (`d3b5765`) | 1,851,125 B | +743 B | 24 |
| 15-14 | 1,851,572 B | +1,190 B | 24 |
| **Tip (15-16, `0b06608`)** | **1,851,572 B** | **+1,190 B** | 24 |
| Phase cap | 1,854,478 B | +4,096 B | |

The tip is 2,906 B under the cap. Procedure: `rm -rf .next/static && npm run build`, then the byte-sum script, then `git restore public/service-worker.js`.

## CI on `ci/15-16` (D-31)

- Push: `git push origin HEAD:refs/heads/ci/15-16`. It was a plain push to a new branch, confirmed absent by `git ls-remote` beforehand. `* [new branch] HEAD -> ci/15-16`.
- Run: https://github.com/tlex-web/portfolio-app/actions/runs/43651737781 (event `push`, headSha `0b0660879ed760d14e40db9fde05a751b293f665`, which is the pushed tip). Conclusion **success**.

| Job | Conclusion |
|-----|------------|
| Classify changes | success |
| Dependency Review | skipped (pull-request only) |
| Security Audit | success |
| Unit Tests | success |
| Lint and Type Check | success |
| Build Application | success |
| Visual Regression | success |
| E2E Tests | success (30m39s) |
| CI OK | success |

- `node scripts/ci/check-visual-run.mjs --sha 0b06608… --wait 30` returned `PASS https://github.com/tlex-web/portfolio-app/actions/runs/43651737781/job/132621533688`.
- `git ls-remote origin refs/heads/ci/15-16` = `0b0660879ed760d14e40db9fde05a751b293f665` = `git rev-parse HEAD`, checked at Task 3.
- Nothing else happened on the remote:
  - no `visual-baselines.yml` dispatch and no other workflow dispatch;
  - no force push;
  - no push of the phase branch or `main`;
  - no PR.
- No job needed a re-run. `ci/15-16` stays on origin.

## Task Commits

1. **Task 1: write the carried findings back (D-29)** - `0b06608` (docs)
2. **Task 2: full local gate**: no commit. Every check passed on the first run, so no fix was needed.
3. **Task 3: push ci/15-16 and read CI back**: no commit. Push and read-back only.

**Plan metadata:** the docs(15-16) SUMMARY commit and the STATE/ROADMAP commit that follow `0b06608`.

## Files Created/Modified

- `.planning/phases/13-repo-safety-test-debt/13-REVIEW-DISPOSITION.md`: IN-01..03 rows gain `; fixed in Phase 15: 15-13 <sha>`
- `.planning/phases/14-ui-fixes-terminal-controls/14-REVIEW-DISPOSITION.md`: IN-01/02/03/05/06 gain `; fixed in Phase 15: 15-14 <sha>`. IN-04 gains `; deferred to Phase 18 (D-29): …`
- `.planning/ROADMAP.md`: a Phase 18 scope-note bullet for 14 IN-04

## Decisions Made

- `ci/15-16` stays at the Task 1 tip `0b06608`. Only docs commits come after it (this SUMMARY and STATE/ROADMAP). D-31 covers a new `ci/15-*` branch and fast-forward *fix* pushes, so these docs commits were not pushed. CI therefore verified the last commit that changes anything outside `.planning/`.

## Deviations from Plan

None. The plan was executed as written. One small note: the plan's read_first put the ROADMAP Phase 18 section at lines 240-262, but it is at lines 289-311. The bullet went into that section's "Scope notes" list.

## Issues Encountered

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Every Phase 15 plan has a SUMMARY. All the ROADMAP acceptance gates hold on the tip:
  - visual baselines are unchanged (CI Visual Regression PASS, `--none` on all 78 commits);
  - `data:check` is green;
  - the Matterhorn terrain is byte-identical (D-15);
  - type-check has zero errors across three configs;
  - no PNG set is declared.
- Next: `/gsd-verify-work 15`, then `/gsd-ship`. The phase branch is not pushed, and PR #148 (Phase 14) is still open underneath it (D-30).
- 14 IN-04 is carried in ROADMAP Phase 18's scope notes.

---
*Phase: 15-region-plate-data-model*
*Completed: 2026-11-14*

## Self-Check: PASSED

- FOUND: .planning/phases/15-region-plate-data-model/15-16-SUMMARY.md
- FOUND: commit `0b06608` (ancestor of HEAD; `git rev-list --count d664589..0b06608` = 1)
- FOUND: SHAs `61ea7ed`, `de025fa`, `40a4e9e`, `66eb7f2`, `c24b622`, `065d628` all resolve to `commit`
- Acceptance re-run: grep counts 3 / 5 / 1 / 1; `git diff --stat 0b06608^..0b06608` lists only the three files (10 insertions, 9 deletions: the eight IN rows plus one ROADMAP bullet); remote `ci/15-16` = HEAD at Task 3; no PNG commit since `d29ea9a`; `public/service-worker.js` clean; `jest-results.json` not staged
