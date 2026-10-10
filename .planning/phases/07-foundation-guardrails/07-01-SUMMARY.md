---
phase: 07-foundation-guardrails
plan: 01
subsystem: infra
tags: [ci, node24, npm-ci, vercel, dependabot, jest, playwright, guards, ratchet]

requires: []
provides:
  - "Node 24 + npm ci in every install path (local .node-version, CI node-version-file, Vercel installCommand + engines.node)"
  - "scripts/guards/check-install-parity.mjs (GUARD-01), run by npm run lint"
  - "scripts/guards/test-count.mjs + test-count.baseline.json (GUARD-03, baseline 91), run in the CI unit job"
  - "scripts/guards/selftest.mjs case table + __selftest__ fixtures, run by npm run lint"
  - "scripts/guards/version-floors.json (floors + forbiddenDirect), for later upgrade plans to raise"
  - "Dependabot holds for the Phase 7 upgrade set"
affects: [07-02, 07-05, 07-06, 07-07, 07-08, 07-26, phase-close]

actuals:
  tokens: 16284
  tasks: 3
  commits: 5
plan_head_before: f3d4cd6f2ac74a64e414b7c187cdbe35c6a7e397
plan_head_after: 24cc8df971dcec8227207fe4634ad544813394cd

tech-stack:
  added: []
  patterns:
    - "Guard scripts: dependency-free ESM in scripts/guards/, docblock header, one 'FAIL' line per failure, exit 1"
    - "Every guard gets selftest cases ({ name, guard, args, expectExit, expectOutput?, setup?, check? }) against good/bad fixtures"
    - "Tests are counted with the runners' own listings (Jest numTotalTests, Playwright --list unique file+titlePath), never a regex"
    - "version-floors.json is the single place upgrade plans raise minimum lockfile versions and ban direct deps"

key-files:
  created:
    - scripts/guards/check-install-parity.mjs
    - scripts/guards/version-floors.json
    - scripts/guards/test-count.mjs
    - scripts/guards/test-count.baseline.json
    - scripts/guards/selftest.mjs
    - scripts/guards/__selftest__/parity/{good,bad}/
    - scripts/guards/__selftest__/test-count/
    - .planning/phases/07-foundation-guardrails/07-USER-SETUP.md
    - .planning/phases/07-foundation-guardrails/07-01-red-evidence.json
  modified:
    - .node-version
    - package.json
    - package-lock.json
    - vercel.json
    - tsconfig.json
    - .gitignore
    - .github/workflows/ci.yml
    - .github/dependabot.yml

key-decisions:
  - "Work moved to branch gsd/phase-07-foundation-guardrails before the first commit, because main is a protected/default branch for the executor and git.allow_default_branch_commits is unset. Tim merges it to main"
  - "Test-count baseline measured now: jest 66 + e2e 25 = 91 (matches RESEARCH)"
  - "The ratchet's focused/skip scan reads only source files (.js/.ts/.jsx/.tsx/.mjs/.cjs) under e2e/ and __tests__ dirs, so future PNG snapshots under e2e/ can never false-match"
  - "The ratchet also fails when Playwright reports spec load errors, and --update refuses to write when any check fails (not just a lower total)"
  - "The parity guard's npm install check reads only run: steps (block scalars included) and ignores YAML comments. npx playwright install stays allowed"

patterns-established:
  - "selftest.mjs --tap emits a TAP 13 report, so the RED evidence classifier can read guard self-tests"
  - "Fixture package.json files carry no name field, so Jest's haste map never sees duplicates"

requirements-completed: [GUARD-01, GUARD-03]

coverage:
  - id: D1
    description: "Node 24 + npm ci configured in every install path (.node-version 24, engines.node 24.x, vercel.json npm ci, 5 CI jobs on node-version-file, npm ls preflight in 4 jobs)"
    requirement: GUARD-01
    verification:
      - kind: other
        ref: "node scripts/guards/check-install-parity.mjs -> parity: OK"
        status: pass
      - kind: other
        ref: "npm ci && npm ls --depth=0 -> exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Parity guard fails on a bad fixture (npm install, node-version 20, container tag drift, floor breach, forbidden direct dep)"
    requirement: GUARD-01
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#parity: bad fixture fails (npm install, node-version 20, container tag drift)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Vercel production build actually runs Node 24.x with npm ci"
    requirement: GUARD-01
    verification: []
    human_judgment: true
    rationale: "Parity is checked statically against committed files. The live Vercel build log is only visible after a push (07-USER-SETUP.md)"
  - id: D4
    description: "Test-count ratchet: equal passes, one below fails, duplicate project entries count once, skipped Jest test fails, test.only fails, --update never lowers the baseline"
    requirement: GUARD-03
    verification:
      - kind: unit
        ref: "node scripts/guards/selftest.mjs -> 9/9 PASS (7 test-count cases)"
        status: pass
      - kind: other
        ref: "npx jest --json --outputFile=jest-results.json && npm run guard:tests -> jest 66 + e2e 25 = 91 (baseline 91)"
        status: pass
    human_judgment: false
  - id: D5
    description: "CI unit job runs jest --json without --passWithNoTests, then the Test-count ratchet step"
    requirement: GUARD-03
    verification:
      - kind: other
        ref: "grep -c passWithNoTests .github/workflows/ci.yml -> 0; grep 'npm run guard:tests' -> 1"
        status: pass
    human_judgment: false
  - id: D6
    description: "Dependabot ignores every Phase 7 upgrade package until plan 07-26, and other updates keep flowing"
    verification:
      - kind: other
        ref: "plan Task 3 node -e check -> dependabot holds OK; js-yaml parse shows 11 ignore entries, github-actions block unchanged"
        status: pass
    human_judgment: false

duration: 11min
completed: 2026-10-10
status: complete
---

# Phase 7 Plan 01: Install parity + test-count ratchet Summary

**Node 24 + `npm ci` across local, CI and Vercel, enforced by a static parity guard in `npm run lint`. A test-count ratchet (Jest `numTotalTests` + unique Playwright `--list` tests, baseline 91) runs in the CI unit job. Every guard is proven able to fail by a 9-case self-test.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-10-10T19:56:57Z
- **Completed:** 2026-10-10T20:07:30Z
- **Tasks:** 3/3
- **Files modified:** 35 (13 of them fixture files)

## Accomplishments
- GUARD-01: `.node-version` is `24`, `engines.node` is `24.x` (mirrored in the lockfile root), `vercel.json` uses `npm ci`, all 5 CI jobs read `node-version-file: .node-version`, and the 4 installing jobs run a `Verify lockfile install` (`npm ls --depth=0`) step. `check-install-parity.mjs` enforces all of it, plus Playwright container tag vs lockfile, version floors and forbidden direct deps.
- GUARD-03: `test-count.mjs` ratchets Jest + unique Playwright tests against `test-count.baseline.json` (66 + 25 = 91, measured). It fails on a drop, a skipped/todo Jest test, or any `.only(`/`.skip(`/`.fixme(` in e2e or `__tests__`. `--update` cannot lower the number.
- CI unit job: `npm test -- --coverage --json --outputFile=jest-results.json` (no more `--passWithNoTests`), then a `Test-count ratchet` step.
- `npm run lint` now chains `eslint .`, `guard:parity` and `guard:selftest`.
- Dependabot ignores motion, framer-motion, @types/react(-dom), R3F, drei, @playwright/test and eslint-config-next for the phase. next/react/react-dom lose their `update-types` until phase close, with restore markers.

## Task Commits

1. **Task 1 (tracer): Node 24 + npm ci everywhere, parity guard** - `c2b928b` (feat)
2. **Task 2: Test-count ratchet** - `c3de44d` (test, RED) then `e8dea29` (feat, GREEN)
3. **Task 3: Dependabot holds** - `ebb8c74` (chore)
4. **Refactor: explicit Playwright lockfile key in the parity guard** - `24cc8df` (refactor)

**Plan metadata:** see the final docs commit

## TDD (Task 2)

- **RED** (`c3de44d`): 7 test-count selftest cases plus fixtures, against an inert stub `test-count.mjs` (exit 0, no output). `node scripts/guards/selftest.mjs --tap` gave 2 pass and 7 fail, exit 1. Classifier: `RED_EVIDENCE_OK` (`target_test_failed`, format `tap`, target "test-count: total one below the baseline fails"). Semantic assessment: valid. Every new case executed and failed on its planned assertion (exit code, required ratchet output), not on load or fixture faults. The first attempt without a stub failed with `MODULE_NOT_FOUND`. That is a load failure, so the stub was added to make RED assertion-based. The evidence is in `07-01-red-evidence.json`.
- **GREEN** (`e8dea29`): full implementation; selftest 9/9.
- **REFACTOR**: none for the ratchet. The separate `24cc8df` refactor touches only the parity guard.

## Files Created/Modified
- `scripts/guards/check-install-parity.mjs` - GUARD-01 static parity guard (`--root`)
- `scripts/guards/version-floors.json` - floors = current lockfile versions: next 16.2.6, react/react-dom 19.2.6, R3F 9.6.1, drei 10.7.7, @playwright/test 1.60.0, eslint-config-next 16.2.6; `forbiddenDirect: []`
- `scripts/guards/test-count.mjs` - GUARD-03 ratchet (`--jest`, `--list`, `--baseline`, `--root`, `--update`)
- `scripts/guards/test-count.baseline.json` - `{ jest: 66, e2e: 25, total: 91, recordedAt: 2026-10-10, commit: c3de44d }`
- `scripts/guards/selftest.mjs` - 9-case table (2 parity, 7 test-count), optional `--tap`, cleans up its temp files
- `scripts/guards/__selftest__/parity/{good,bad}/` - minimal repos (no `name` in package.json)
- `scripts/guards/__selftest__/test-count/` - Jest JSON (66/65/pending), list JSON (flat 25, 25 with one duplicate project entry), baselines 91/90, `clean/` and `focused/` e2e trees
- `.node-version`, `package.json`, `package-lock.json`, `vercel.json`, `tsconfig.json`, `.gitignore`, `.github/workflows/ci.yml`, `.github/dependabot.yml` - config as above

## Decisions Made
- **Branch:** HEAD was on `main`. The executor's pre-commit assertion treats it as protected (`git.base-branch --is-protected main` returned true, and `git.allow_default_branch_commits` is unset). Before the first commit I created `gsd/phase-07-foundation-guardrails` from `main` (the project's `phase_branch_template`), rather than editing config to bypass the gate. Nothing was pushed. Tim merges the branch to `main` (a fast-forward is possible).
- **Baseline 91** was measured with `npx jest --json` + `--update`, not typed in. It equals the RESEARCH figure. Under `CI=1` (2 projects instead of 3) the count is still 25 e2e, so the dedupe works.
- **Hardening beyond the plan text (Rule 2):** the ratchet fails on Playwright `errors[]` (a spec that fails to load would otherwise just shrink the count). `--update` refuses to write when *any* check fails. The focused/skip scan is limited to source extensions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created a phase branch before committing**
- **Found during:** Start of execution
- **Issue:** The executor's HEAD safety assertion refuses commits on `main` (protected/default branch)
- **Fix:** `git switch -c gsd/phase-07-foundation-guardrails` before any change. Config was not touched
- **Verification:** `git.base-branch --is-protected gsd/phase-07-foundation-guardrails` returned false. The pin guard passed before every commit
- **Committed in:** n/a (branch only)

**2. [Rule 2 - Missing critical] Lockfile root `engines` kept in sync with package.json**
- **Found during:** Task 1
- **Issue:** Adding `engines` to package.json leaves `package-lock.json` `packages[""]` stale (npm writes engines there)
- **Fix:** Added `"engines": { "node": "24.x" }` to the lockfile root entry. No dependency version changed. `npm ci --dry-run` and `npm ls` exit 0
- **Committed in:** `c2b928b`

**3. [Rule 1 - Bug] Inert stub for a valid RED**
- **Found during:** Task 2 RED
- **Issue:** Without `test-count.mjs`, the RED failed on `MODULE_NOT_FOUND`, which is invalid RED
- **Fix:** A stub that exits 0 with no output. RED then failed on assertions (`RED_EVIDENCE_OK`)
- **Committed in:** `c3de44d`

**4. [Rule 2 - Missing critical] Parity guard key_link made explicit**
- **Found during:** Self-check
- **Issue:** The plan's key_link pattern `node_modules/@playwright/test` was built dynamically, so a grep could not see it
- **Fix:** Read the lockfile key literally. No behavior change
- **Committed in:** `24cc8df`

**Additions (not deviations from intent):** selftest asserts the specific failure messages of the bad fixture (not just exit 1). It also has a 7th test-count case (`--update` raises a lower baseline) and a `--tap` reporter.

---

**Total deviations:** 4 auto-fixed (1 blocking, 2 missing-critical, 1 bug)
**Impact on plan:** No scope creep. Every must_have truth and artifact holds. The branch change is the one item Tim needs to act on (merge).

## Issues Encountered
- `npm run type-check` fails locally only inside the gitignored `.next/dev/types/**` (5x TS2305 `PrefetchForTypeCheckInternal`). Those files were generated by the earlier next 16.1.6 dev server, before `npm ci` resynced to 16.2.6. There are 0 errors outside `.next/`, and CI checks out clean, so this is out of scope. Deleting `.next/` (or one `next dev`/`next build`) regenerates them.
- `npm ci` reports 20 audit vulnerabilities (1 critical) in the existing lockfile. This plan changed no versions; DEPS-04 (plan 07-06, Next security release due 2026-10-14) owns this.
- Git converts LF to CRLF on checkout (autocrlf). Both guards split on `\r?\n` and trim, so they work with either line ending.

## User Setup Required

**Vercel needs a one-time check.** See [07-USER-SETUP.md](./07-USER-SETUP.md): confirm that the first build log after pushing this branch shows Node 24.x and `npm ci`.

## Next Phase Readiness
- Plan 07-02 can rely on `npm run lint` = `eslint . && guard:parity && guard:selftest`. When it rewrites `eslint.config.mjs`, the `scripts/guards/__selftest__/**` fixtures (one contains `test.only(`) should be added to its ignores if any rule ever flags them. Today they produce 0 errors.
- Upgrade plans (07-05 to 07-08) raise `version-floors.json` and, for motion, add `framer-motion` to `forbiddenDirect`. Plan 07-06 (Playwright 1.64) must bump any `mcr.microsoft.com/playwright:vX-noble` tag together with the lockfile.
- Plan 07-26 removes the Dependabot holds and restores `update-types` on next/react/react-dom.
- New tests must raise `test-count.baseline.json` via `--update` at phase close.

## Self-Check: PASSED
- All 10 created artifacts found on disk
- Commits c2b928b, c3de44d, e8dea29, ebb8c74, 24cc8df are ancestors of HEAD. `check evaluation-scope --plan 07-01` resolved them
- All acceptance criteria from Tasks 1-3 were re-run and pass. Plan-level verification: `npm ls` 0, `guard:parity` OK, `guard:selftest` 9/9, `jest --json && guard:tests` = 91/91

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-10*
