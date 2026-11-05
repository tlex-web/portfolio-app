---
phase: 12-contact-edge-pages-cleanup-verification
plan: 34
subsystem: testing
tags: [playwright, jest, ci, test-count-ratchet, ledgers, security-register]

requires:
  - phase: 12-contact-edge-pages-cleanup-verification
    provides: "12-27..12-33 follow-up fixes (commits listed per finding in their SUMMARYs)"
provides:
  - "Test-count ratchet raised to 2243 (jest 1694 + e2e 549)"
  - "Green ci/12-34 run 41648599366 on 53171db: Lint and Type Check, Unit Tests, E2E Tests (three engines, --fail-on-flaky-tests), Visual Regression"
  - "12-REVIEW-DISPOSITION open 0; 12-SECURITY 97 entries, threats_open 0; deferred rows closed with evidence; 12-VALIDATION rows for 12-27..12-34"
  - "Edge coverage ledger for all 26 probe rows"
affects: [12-VERIFICATION re-run, milestone audit]

actuals:
  tokens: 14000
  tasks: 3
  commits: 2
plan_head_before: 2ff20cc660f3318977b35307b033a281807d86d7
plan_head_after: c06a84754075ec158e99bea9ef9e07c19f9f754e

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/12-contact-edge-pages-cleanup-verification/12-34-SUMMARY.md
  modified:
    - scripts/guards/test-count.baseline.json
    - .planning/phases/12-contact-edge-pages-cleanup-verification/12-REVIEW-DISPOSITION.md
    - .planning/phases/12-contact-edge-pages-cleanup-verification/12-SECURITY.md
    - .planning/phases/12-contact-edge-pages-cleanup-verification/deferred-items.md
    - .planning/phases/12-contact-edge-pages-cleanup-verification/12-VALIDATION.md
    - .planning/phases/10-photography/deferred-items.md
    - .planning/phases/11-engineering-roadmap/deferred-items.md

key-decisions:
  - "IN-02 recorded deferred, not fixed: 12-27 edge.header-guard reads option A (Tim: \"A (Recommended)\"); 12-29's C1 commits close the document-prefetch path and the matcher-skipped paths are the accepted residual AR-12-02"
  - "The A5 offline-control deferred row closed as not reproduced: passed in the local 16-worker fresh three-engine run and in CI 41648599366 under --fail-on-flaky-tests; no retry, wait or tag added"
  - "The caniuse-lite Browserslist row stays open (not approved), so Phase 12 deferred-items has 2 open rows (canonical host, caniuse-lite), not the 1 the plan's acceptance count assumed"
  - "T-12-52 recorded closed, not applicable: it exists only for option C"

patterns-established: []

requirements-completed: [CONTACT-01, CONTACT-02, CONTACT-03, EDGE-01, EDGE-02, SEO-01, SEO-02, SEO-03, VERIFY-01, VERIFY-02, VERIFY-03, VERIFY-04]

coverage:
  - id: D1
    description: "Whole tree green locally on one fresh three-engine build; ratchet raised above 2205"
    requirement: VERIFY-03
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test --project=chromium --project=firefox --project=webkit (1360 passed, 0 failed, 0 flaky)"
        status: pass
      - kind: unit
        ref: "npx jest --silent (102 suites, 1694 passed)"
        status: pass
      - kind: other
        ref: "npm run guard:tests (jest 1694 + e2e 549 = 2243, baseline 2243)"
        status: pass
    human_judgment: false
  - id: D2
    description: "CI green on ci/12-34 in all four jobs, no visual diff"
    requirement: VERIFY-03
    verification:
      - kind: other
        ref: "node scripts/ci/check-visual-run.mjs --sha 53171db637e7f8608a97c7107ec530cc6ba4e416 --job <job> --wait 60 (four PASS, run 41648599366)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Review, security, deferred and validation ledgers carry an outcome for every follow-up item"
    requirement: VERIFY-01
    verification:
      - kind: other
        ref: "scratchpad verify-12-34-ledgers.js (the plan's Task 3 check): ledgers OK 19"
        status: pass
    human_judgment: false

duration: 71min
completed: 2026-11-03
status: complete
---

# Phase 12 Plan 34: Follow-up close-out, fresh three-engine gate, CI on ci/12-34 and the ledgers Summary

**Three-engine fresh build 1360/1360 and CI run 41648599366 green on 53171db (E2E 1373 passed under --fail-on-flaky-tests, Visual Regression with no diff), ratchet raised to 2243, and every follow-up finding, threat and deferred row recorded with its commit or reason.**

## Performance

- **Duration:** 71 min (most of it waiting on the CI E2E job)
- **Started:** 2026-11-03T13:45:45Z
- **Completed:** 2026-11-03T14:56:59Z
- **Tasks:** 3
- **Files modified:** 7 (plus this SUMMARY)

## Accomplishments

- Local gate green on the follow-up's final code, on a fresh build in all three engines.
- Test-count ratchet raised from 2205 to 2243 with `npm run guard:tests -- --update`.
- `ci/12-34` (new branch, plain push) is green in all four jobs on the pushed sha.
- 12-REVIEW-DISPOSITION has `open: 0`. 12-SECURITY has T-12-45..T-12-63 and the eight follow-up T-12-SC rows, 97 entries and `threats_open: 0`. The deferred rows the follow-up fixed are closed with their commits, and 12-VALIDATION has a row for each follow-up task.

## Local gate

Start sha: `2ff20cc660f3318977b35307b033a281807d86d7`. Port 3000 was free and `PW_REUSE` was not set.

| Command | Summary line |
|---------|--------------|
| `npm run lint` | exit 0 (eslint clean; every guard printed OK, e.g. `served-images: OK`, `trails: OK`, `clips: OK`) |
| `npm run type-check` | `tsc --noEmit` exit 0, no `error TS` line |
| `npx jest --silent` | `Test Suites: 102 passed, 102 total` / `Tests: 1694 passed, 1694 total` |
| `PW_PROD=1 npx playwright test --project=chromium --project=firefox --project=webkit` (fresh build, 16 workers) | `Running 1360 tests using 16 workers` ... `1360 passed (5.0m)`; 0 failed, 0 flaky, exit 0 |

- Per engine: chromium 509, firefox 435, webkit 420. On Windows, WebKit leaves out the 15 tests tagged `@no-win-webkit` (13) and `@needs-tab-to-links` (2) (playwright.config.ts platform invert, `win32`). That is why webkit is 420 and firefox 435.
- The A5 offline control (`e2e/service-worker.spec.ts:114`) ran in this run (`[428/1360] [chromium]`) and passed.
- Afterwards I ran `git checkout -- public/service-worker.js`. Port 3000 is free and no `next start` is running.

**Ratchet (Task 1 step 2):**
- `npx jest --json --outputFile=jest-results.json --silent`: 102 suites, 1694 tests, 1694 passed, 0 failed, 0 pending, 0 todo.
- `npm run guard:tests -- --update`: `test-count: jest 1694 + e2e 549 = 2243 (baseline 2205)`, then `baseline written`, `test-count: OK`. The baseline JSON is `{ jest 1694, e2e 549, total 2243, recordedAt 2026-11-03, commit 2ff20cc }`.
- `npm run guard:tests` after the update: `jest 1694 + e2e 549 = 2243 (baseline 2243)`, OK.
- e2e listing counts (unique file + title keys): the plain (dev) listing has **549**. `PW_PROD=1` has **554** (`PW_PROD=1 node scripts/guards/test-count.mjs --jest jest-results.json` printed `e2e 554 = 2248`). Raw `--list` totals: 1452 tests in 27 files (dev) and 1457 in 28 files (`PW_PROD=1`).
- G3 note: 12-33 tagged G3 `@prod-only`, so by design the local dev listing has one test fewer than before (550 to 549). The `PW_PROD` and CI listings keep it. CI's ratchet step printed `jest 1694 + e2e 554 = 2248 (baseline 2243)`.
- `jest-results.json` was removed. `git status --porcelain public/service-worker.js jest-results.json` prints nothing.

## CI head

- Before the push, `git ls-remote origin refs/heads/ci/12-34` printed nothing (2026-11-03T13:54Z).
- `git push origin HEAD:refs/heads/ci/12-34` was a plain push and created the branch (`* [new branch] HEAD -> ci/12-34`). Afterwards, ls-remote prints `53171db637e7f8608a97c7107ec530cc6ba4e416 refs/heads/ci/12-34`.
- Pushed sha: `53171db637e7f8608a97c7107ec530cc6ba4e416` (the Task 1 ratchet commit, the follow-up's final code).
- `node scripts/ci/check-visual-run.mjs --sha 53171db637e7f8608a97c7107ec530cc6ba4e416 --job "<job>" --wait 60`:

| Job | Result | Run id | Job id |
|-----|--------|--------|--------|
| Lint and Type Check | PASS | 41648599366 | 125960443588 |
| Unit Tests | PASS | 41648599366 | 125960443781 |
| E2E Tests (chromium, firefox, webkit, `--fail-on-flaky-tests`) | PASS (`Running 1373 tests using 1 worker` / `1373 passed (27.2m)`) | 41648599366 | 125960443687 |
| Visual Regression | PASS | 41648599366 | 125960443711 |

- The Unit Tests job's `Test-count ratchet` step: success (`test-count: jest 1694 + e2e 554 = 2248 (baseline 2243)`, `test-count: OK`), so the raised baseline ran in CI.
- Visual Regression found no diff, which matches the expected diffs of none in 12-28..12-33. There was no re-baseline dispatch and no PNG commit.

## Ledger changes

**12-REVIEW-DISPOSITION.md** (both the frontmatter and the table; `open: 11` became `open: 0`):
- WR-01 fixed: 12-28, e22a714 / e9a3fa1
- WR-02 fixed: 12-31, dafcb6e / 4312701
- WR-03 fixed: 12-33, d847f8c
- WR-04 fixed: 12-30, 11ef205 / 29c321a
- IN-01 fixed: 12-28, f180a4c / 44f764f (12-27 copy.field-error-name-long reads `supplied`)
- IN-02 deferred: 12-27 edge.header-guard reads `option A`, Tim: "A (Recommended)". 12-29 C1 16deede / 099fab7 closes the document-prefetch path, and 0b3b5c4 and 9abf40a scope the comments and close T-12-02. The residual is AR-12-02.
- IN-03 fixed: 12-31, d1c7946 / de25be0
- IN-04 fixed: 12-31, a5ff20f / b2fb90e
- IN-05 fixed: 12-32, d252a64 / 0eff11c (12-27 meta.global-error-title reads `supplied`)
- IN-06 fixed: 12-28, f180a4c / 44f764f
- IN-07 fixed: 12-28, 5abc9b6 / b81d5bd

**12-SECURITY.md:**
- New Threat Register rows: T-12-SC (12-27) (high, mitigate, closed, 1ae8378); T-12-45, T-12-46 (12-27); T-12-47..49 and T-12-SC (12-28); T-12-50, T-12-51 (accept, option A), T-12-52 (closed, not applicable, option A) and T-12-SC (12-29); T-12-53..55 and T-12-SC (12-30); T-12-56, T-12-57 and T-12-SC (12-31); T-12-58, T-12-59 and T-12-SC (12-32); T-12-60, T-12-61 and T-12-SC (12-33); T-12-62, T-12-63 and T-12-SC (12-34). Every row is closed and gives file:line or test-name evidence.
- T-12-02 already read `closed` (12-29). I confirmed it and did not change it.
- The intro line now reads 34 plans and 97 entries.
- AR-12-01 now covers 12-01..12-05, 12-07..12-26 and 12-28..12-34 (32 plans). `git log 8363f1f..HEAD -- package.json package-lock.json` returns only 646f3ac and 1ae8378.
- New audit-trail row: 97 / 97 / 0, 12-34 executor. `threats_open: 0` is unchanged. No new threat at or above high is open.

**Phase 12 deferred-items.md:**
- design-system comment row: `status: resolved` (12-33, 5027929)
- prefetch row: `status: resolved` (12-29, 16deede / 099fab7, with the proxy unit test and two not-found e2e cases; step (2) not built under option A, AR-12-02)
- hero contour precache row: `status: resolved` (12-30, 4190a8d / 1ef0d46, precache.test and the service-worker e2e; live check in 12-DOM-VERIFY wave 16, 9eb415b)
- A5 offline-control row: `status: resolved`, closed as not reproduced (local 1360/1360 at 16 workers; CI 41648599366, 1373 passed under `--fail-on-flaky-tests`)
- Left open: the canonical-host row (waits on DNS) and the caniuse-lite row (not approved)

**Phase 10 deferred-items.md:** the G3 dev cross-talk row reads `status: resolved` and has a 12-33 outcome line (5027929; dev listing without G3, `PW_PROD` 7 passed with G3; 12-34 run).

**Phase 11 deferred-items.md:** the credit-test row reads `status: resolved` and has a 12-33 outcome line (5027929; five-repeat dev run 5 passed, 35.7s).

**12-VALIDATION.md:** new Per-Task Verification Map rows 12-27-T1..T3, 12-28-T1..T3, 12-29-T1..T3, 12-30-T1..T2, 12-31-T1..T3, 12-32-T1..T2, 12-33-T1..T2 and 12-34-T1..T3 (21 rows), all green. The file status stays `validated`.

## Edge coverage ledger

Before writing each line, I grepped the named plans' SUMMARYs (coverage refs and test names) for a matching test.

1. CONTACT-01 empty: 12-16 (DirectContactPanel.test.tsx, contact-form e2e "should list email, location, replies and profiles"), 12-25 (data/__tests__/site.test.ts#site.location)
2. CONTACT-01 encoding: 12-16 (DirectContactPanel "shows the address as one selectable string with a break chance after @"), 12-25 (site.location at 2 decimals)
3. CONTACT-01 idempotency: 12-16 (CopyEmailButton.test.tsx: empty the status, then Copied on each press)
4. CONTACT-01 concurrency: 12-16 (CopyEmailButton.test.tsx, COPIED_MS timer; e2e "should copy exactly the address and announce Copied"), 12-25 (site.test)
5. CONTACT-02 adjacency: lifted in 12-28 (name 100 vs 101 characters, validateField cases with Tim's string); also 12-26
6. CONTACT-02 empty: lifted in 12-28 (WR-01: a validation answer with no or empty fields shows the send failure)
7. CONTACT-02 ordering: 12-26 (SummitRegister error summary, 6 cases; e2e "should focus the error summary")
8. CONTACT-02 idempotency: lifted in 12-28 (IN-06: Retry after an invalid edit sends no request); also 12-13 (one request per double click)
9. CONTACT-02 concurrency: 12-13 (SummitRegister "times out a never-settling send after 15 s ... and ignores a late answer")
10. CONTACT-03 boundary: lifted in 12-28 (IN-07 z.email() contract cases in feedback.test.ts); also 12-03 (Honeypot, 7 tests)
11. CONTACT-03 precision: 12-03 (api-contract.test.ts, retryAfterSeconds), 12-13 (rate-limit minutes from Retry-After)
12. EDGE-01 (unclassified): lifted in 12-29 as a backstop truth, flagged assumption scoped to option A (not-found e2e document-prefetch cases, proxy matcher unit case)
13. EDGE-02 concurrency: lifted in 12-30 (WR-04 waitUntil and caught put, Jest) and 12-31 (IN-04 startUpdateChecks stop on unmount); also 12-08
14. SEO-01 adjacency: 12-09 (e2e/seo.spec.ts "Own head per content route"), 12-17 ("no two routes share a title or a description")
15. SEO-01 empty: lifted in 12-32 (global-error title, components/__tests__/global-error.test.tsx)
16. SEO-01 ordering: 12-09 (lib/__tests__/metadata.test.ts#pageMetadata), 12-17 (seo.spec route loop)
17. SEO-02 adjacency: 12-14 (routes.test.ts "no two slugs share an alt"; og e2e "no two pages share a card URL or alt"), 12-10
18. SEO-02 empty: 12-10 (lib/og template.test.tsx, all fields derived), 12-14 ("an unknown or mis-cased slug has no card")
19. SEO-02 ordering: 12-14 (generateImageMetadata, per-slug cards), 12-10
20. SEO-03: 12-09 and 12-17 (e2e/seo.spec.ts "sitemap.xml and robots.txt (SEO-03)", "Kept out of the index")
21. VERIFY-01 (unclassified): flagged assumption ("removed" = deleted from the tree and unreachable), covered by 12-04 (git ls-files / git grep, guard:selftest), 12-05 (asset-exists.test.ts), 12-22 (README git grep) and 12-33 (README env check)
22. VERIFY-02 adjacency: lifted in 12-32 (Report link keeps min-h-11 and its Tab stop: keyboard e2e "error page")
23. VERIFY-02 empty: 12-20 (e2e/audit.spec.ts, three engines)
24. VERIFY-02 ordering: 12-21 (e2e/keyboard.spec.ts, nav, map and lightbox, contact, edge pages)
25. VERIFY-03 (unclassified): flagged assumption, covered by 12-23 (CI `--fail-on-flaky-tests`, webkit project) and this plan (local 1360/1360 three engines; CI 1373 passed)
26. VERIFY-04 (unclassified): flagged assumption, covered by 12-20 (audit spec, CSP violation and CLS checks) and 12-29 (document-prefetch CSP header e2e)

Both prohibitions (no fixed row without a commit, no closing without evidence, no re-baseline; no phase completion or VERIFICATION/UAT edit) have no descriptor and are recorded as flagged-unverified. In practice both were kept: every fixed row names a commit, and `git log 2ff20cc..HEAD` touches neither 12-VERIFICATION.md nor 12-UAT.md.

## Task Commits

1. **Task 1 (tracer): fresh three-engine gate, then the raised ratchet**: `53171db` (chore)
2. **Task 2: one green three-engine CI run on ci/12-34**: no code commit. The record is `## CI head` in this SUMMARY, and `53171db` was pushed to `ci/12-34`.
3. **Task 3: ledgers**: `c06a847` (docs)

Tracer gate: the session is interactive (`_auto_chain_active: false`), the verify mode is end-of-phase and the verify is automated only. After the commit I re-ran lint, type-check and Jest (1694 passed). Playwright had already passed on this same tree (only the baseline JSON changed after it), so I went on to Task 2.

## Files Created/Modified

- `scripts/guards/test-count.baseline.json`: jest 1694, e2e 549, total 2243
- `12-REVIEW-DISPOSITION.md`: 10 fixed, 1 deferred, open 0
- `12-SECURITY.md`: 27 follow-up rows, intro counts, AR-12-01, audit-trail row
- `deferred-items.md` (Phase 12): four rows resolved with outcome lines
- `12-VALIDATION.md`: 21 map rows
- `.planning/phases/10-photography/deferred-items.md`, `.planning/phases/11-engineering-roadmap/deferred-items.md`: one row each resolved

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The Task 3 node check ran from a scratchpad file**
- **Found during:** Task 3
- **Issue:** On this host, the plan's `node -e` one-liner halves the backslashes inside its regexes.
- **Fix:** I copied it verbatim into `verify-12-34-ledgers.js` in the session scratchpad and ran it with `node`. It printed `ledgers OK 19`.
- **Files modified:** none in the repo
- **Commit:** n/a

**2. [Acceptance count] Phase 12 deferred-items has 2 `status: open` rows, not 1**
- **Found during:** Task 3
- **Issue:** The plan's count of 1 predates the caniuse-lite row that 12-27 added. That row is still unapproved (no registry facts, no approval from Tim), so it stays open. The plan also did not foresee the A5 row from 12-31, which this plan closed as not reproduced, with evidence.
- **Fix:** None needed. The two open rows are the canonical host (waits on DNS) and caniuse-lite (waits on Tim).

**Total deviations:** 2 (1 Rule 3 tooling, 1 acceptance count explained). **Impact:** none on scope or evidence.

## Issues Encountered

None. No test failed or flaked locally or in CI, and Visual Regression found no diff.

## User Setup Required

None.

## Next Phase Readiness

All 34 plans have SUMMARYs. The orchestrator re-runs the verifier. This plan did not change the phase status, 12-VERIFICATION.md, 12-UAT.md or the ROADMAP phase checkbox. Still open beyond the phase: the canonical host switch (DNS), caniuse-lite (Tim's approval), and the live-header UAT item (d).

## Self-Check: PASSED

- FOUND: scripts/guards/test-count.baseline.json (total 2243), 12-REVIEW-DISPOSITION.md (open: 0), 12-SECURITY.md (threats_open: 0, 97 rows)
- FOUND commits on HEAD: 53171db, c06a847
- `git ls-remote origin refs/heads/ci/12-34` = 53171db637e7f8608a97c7107ec530cc6ba4e416
- Task 3 check: `ledgers OK 19`
- 12-VERIFICATION.md and 12-UAT.md: no commits since 2ff20cc, no working-tree change
