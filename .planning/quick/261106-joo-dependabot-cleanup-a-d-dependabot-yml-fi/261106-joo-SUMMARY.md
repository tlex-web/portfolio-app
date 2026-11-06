---
phase: quick-261106-joo
plan: 01
status: complete
subsystem: ci-and-planning
tags: [dependabot, guards, visual-regression, debug-sessions]
requires: []
provides:
  - "Dependabot rules for ESLint and TypeScript majors, the Tailwind pair and Playwright"
  - "Parity fixtures under names GitHub's dependency graph does not scan"
  - "A one-shot pixel tolerance for home/1440-ascent-waypoint-2"
  - "Seven closed debug sessions and a debug knowledge base"
affects: [.github/dependabot.yml, scripts/guards/selftest.mjs, e2e/visual/routes.spec.ts, .planning/STATE.md, .planning/debug]
tech-stack:
  added: []
  patterns: ["Fixture materialised in a temp dir under its real manifest names by the selftest harness"]
key-files:
  created:
    - .planning/debug/knowledge-base.md
    - .planning/debug/resolved/e2e-test-ci-failures.md
    - .planning/debug/resolved/eslint10-ci-failures.md
  modified:
    - .github/dependabot.yml
    - scripts/guards/selftest.mjs
    - e2e/visual/routes.spec.ts
    - playwright.config.ts
    - e2e/visual/README.md
    - .planning/STATE.md
decisions:
  - "The eslint10 record reports CI run 22981646334 instead of the plan's 'never on CI', which that run contradicts. Status stays superseded and the record still does not call the fix verified."
metrics:
  duration: 10 min
  completed: 2026-11-06
actuals:
  tokens: 16375
  tasks: 3
  commits: 4
plan_head_before: e002cbcb26d3b03dbb183ed90180a698ff5a0d11
plan_head_after: 85d7248456b1ba1ba64d20ffaffc6d72fb477f7c
---

# Quick Task 261106-joo Plan 01: Dependabot cleanup A and D Summary

Dependabot stops proposing ESLint and TypeScript majors and keeps the Tailwind pair in one PR; the parity fixtures carry no scannable manifest name; only `home/1440-ascent-waypoint-2` tolerates up to 3 differing pixels; and all seven debug sessions are closed on checked evidence.

Everything is on `chore/dependabot-config-fixtures`. Nothing was pushed, no PNG was committed, and no `.claude` settings file or production app code changed.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 1d5855c | test(guards): store parity fixture manifests under names GitHub does not scan |
| 1 | 6955255 | chore(deps): stop Dependabot proposing bumps known to fail |
| 2 | 93a7a9a | test(visual): allow 3 differing pixels on home/1440-ascent-waypoint-2 only |
| 3 | 85d7248 | docs(debug): close the seven finished debug sessions on their evidence |

## Session Closure

No session stayed open. All Task 3 evidence checks passed.

| Session | Status | Note on the record |
|---------|--------|--------------------|
| hidden-tab-burst-decline | resolved | Fixed by 09-15. The test is Chromium-only and uses a page-side rAF hold |
| hero-scrim-over-rail | resolved | Fixed by 09-17. 09-VERIFICATION notes it was not pixel-measured |
| summit-pins-under-plaque | resolved | Fixed by 09-18 and 09-20. The overlap is not gone at every size: three accepted items carry the result `pass` in 09-UAT round 2 |
| waypoint2-label-and-kicker | resolved | Fixed by 09-16, 09-19 and 09-21. Waypoint 3's hidden label is the D-09 amendment residue |
| 12-slug-script-data | resolved | The Vercel preview was not checked, and an agent ran the production probes, not Tim |
| e2e-test-ci-failures | resolved | 241cbbf's own CI run still failed; see deviation 2 |
| eslint10-ci-failures | superseded | See deviation 1 |

Live probe, 2026-11-06, with a fresh token: `/photos/<token>` and `/projects/<token>` on www.tlui.de each returned 404 with 0 token occurrences, and `"c"` read `["","photos","_"]` and `["","projects","_"]`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's eslint10 wording is contradicted by CI**
- **Found during:** Task 3, step 4
- **Issue:** The plan asks the record to say the b4e0cbb fix was verified locally "but never on CI". CI did run on that commit: run 22981646334, with a lockfile on ESLint 10.0.3, reads success for Lint and Type Check and for Unit Tests, and failure for E2E Tests. The session itself recorded no CI result.
- **Fix:** The Resolution opens with the superseded line and says the fix can no longer be checked on main and is not called verified. The run's job statuses are stated under `verification`, as job status only because the logs have expired (HTTP 410).
- **Files modified:** .planning/debug/resolved/eslint10-ci-failures.md
- **Commit:** 85d7248

**2. [Rule 1 - Bug] 241cbbf alone did not turn the E2E job green**
- **Found during:** Task 3, step 4
- **Issue:** The plan's table names 241cbbf as the fix. `E2E Tests` still reads failure in its run 22982267365 and in 6470b58's run 22982624933, and first reads success at 369130e ("fix: skip webkit E2E tests in CI", run 22983589824). The causes of those two failures are unknown, because the logs have expired.
- **Fix:** The session record and its knowledge-base entry state this. The closure stands, because the dev-server root cause is gone and the plan's checks pass. The STATE.md sentence keeps the plan's exact wording ("`e2e-test-ci-failures` by 241cbbf").
- **Files modified:** .planning/debug/resolved/e2e-test-ci-failures.md, .planning/debug/knowledge-base.md
- **Commit:** 85d7248

### Small corrections to the plan's references

- **"All photographs":** a literal `/photos/` answers 308, and `/photos` itself has 0 hits. The string is in the miss body at `/photos/<token>` (count 1), which is what the session's own check and `e2e/not-found.spec.ts` describe. I checked the miss body. The check was not weakened.
- **`jest.setup.js` count of 8:** reproduced with `grep -cE "matchMedia|IntersectionObserver"`, and the record names that command.
- **`playwright.config.ts` lines:** `prod` and the webServer command are now at :41 and :164, moved 2 lines by Task 2's comment.
- **"Accept, amend D-09":** the literal text is at `09-UAT-round1.md:183`, because `09-UAT.md` now holds round 2.
- **`files_changed` lists:** taken from `git show --name-only`, leaving out `.planning/` paths such as the UI-SPEC edits.

## Not Changed (outside the approval)

- `.planning/PROJECT.md:15` still lists the real send as unconfirmed.
- The STATE.md blocker about run 42105427622 looks stale, because that run now reads `success`.
- The E2E job on main hit its 60-minute timeout on 8270572 (run 42149842086). The "Install Playwright browsers" step took 42 minutes, from 02:23:05 to 03:05:35 UTC, and ended `success`.
- A TypeScript 6.1 minor would pass the major ignore and break typescript-eslint's peer range.
- `@eslint/js` is not a direct dependency at HEAD, so its ignore rule is precautionary.
- `12-slug-script-data.md` keeps its `status_note` line in Current Focus, which still says "awaiting a human check". The plan changes only `next_action` there, and the Resolution's `closure_check` explains the outcome.

## Also Reported

- **Identity fixtures:** `scripts/guards/__selftest__/identity/*/package.json` declare only `private`, `description` and `author`, with no dependencies, so they are out of scope.
- **Blocker step:** a no-op. STATE.md line 53 was already corrected at HEAD by 9d87fe8, and keeps the Upstash concern.
- **Takes effect after merge:** the alert drop and the Dependabot config apply only once merged to main. The orchestrator needs a post-merge check of `gh api repos/tlex-web/portfolio-app/dependabot/alerts` by manifest path.
- **Not proven locally:** the tolerance's real proof is CI's Visual Regression job. As the plan says, the E2E and visual suites were not run locally. `playwright test --list` and ESLint are the local load checks.

## Verification

| Check | Result |
|-------|--------|
| `npm run lint` (ESLint and `guard:selftest`) | exit 0 |
| `npm run -s guard:selftest` | `selftest: 87/87 cases passed` |
| `npm run type-check` | exit 0 |
| `npm test -- --json --outputFile=jest-results.json` | exit 0, 102/102 suites, 1702/1702 tests |
| `npm run guard:tests` | exit 0, `test-count: jest 1702 + e2e 554 = 2256 (baseline 2243)` |
| `git ls-files scripts/guards/__selftest__/parity \| grep -E 'package(-lock)?\.json$'` | prints nothing |
| `git status --short` | only `.claude/`, `.planning/state.json`, `.planning/ui-reviews/`, `graphify-out/` before this SUMMARY |
| `git log origin/main..HEAD --grep='Co-Authored-By: Claude Opus 5.5' --invert-grep --format=%h` | prints nothing |
| Task 1, 2 and 3 `<automated>` blocks | all pass; `Total: 48 tests in 1 file` for the visual list |
| `check-install-parity.mjs` against origin/main | unchanged |
| `guard-selftest-*` directories left in the temp dir | 0 before, 0 after |

## Known Stubs

None.

## Self-Check: PASSED

- Files: `.github/dependabot.yml`, `scripts/guards/selftest.mjs`, the four `*.fixture.json` files, `e2e/visual/routes.spec.ts`, `.planning/debug/knowledge-base.md` and the seven resolved sessions exist.
- Commits: 1d5855c, 6955255, 93a7a9a and 85d7248 are ancestors of HEAD.
