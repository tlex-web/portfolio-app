---
status: superseded
trigger: "CI/CD pipeline failing after ESLint 9->10 upgrade. All 3 jobs fail."
created: 2026-03-12T00:00:00Z
updated: 2026-11-06T13:40:06Z
---

## Current Focus

hypothesis: CONFIRMED and FIXED -- all 3 root causes addressed
test: Local verification complete -- lint, type-check, and unit tests all pass
expecting: CI pipeline should now pass for lint, type-check, and unit test jobs
next_action: none, closed 2026-11-06, see Resolution

## Symptoms

expected: CI pipeline passes -- lint, type check, unit tests, and E2E tests all green
actual: All 3 CI jobs fail. Lint and Type Check exits with code 2, Unit Tests exit code 1, E2E Tests exit code 1.
errors:
  - "Cannot find module '@upstash/redis' or its corresponding type declarations" in lib/rate-limit.ts (lines 9-10)
  - "Cannot find module '@upstash/ratelimit' or its corresponding type declarations" in lib/rate-limit.ts
  - 11+ ESLint warnings: unused imports, missing deps, unused vars
reproduction: Push to GitHub, CI fails. Locally ESLint 9 is stale in node_modules (9.39.2) while lockfile has 10.0.3
timeline: Started after upgrading ESLint from v9 to v10

## Eliminated

- hypothesis: --ext flag was removed in ESLint 10 causing exit code 2
  evidence: ESLint 10.0.3 still accepts --ext flag locally (exit code 0). The actual crash is from missing @eslint/js package.
  timestamp: 2026-03-12T00:06:00Z

- hypothesis: @upstash type errors are environment-specific
  evidence: @upstash packages are installed in node_modules. Type-check passes locally. The @upstash error in CI symptoms is likely from a prior run or secondary to the main failure.
  timestamp: 2026-03-12T00:07:00Z

## Evidence

- timestamp: 2026-03-12T00:01:00Z
  checked: Local ESLint version vs lockfile
  found: Local node_modules has ESLint 9.39.2, lockfile has 10.0.3. CI uses npm ci so gets 10.0.3.
  implication: CI and local are running different ESLint versions

- timestamp: 2026-03-12T00:05:00Z
  checked: Ran npm ci then npm run lint with ESLint 10.0.3
  found: "Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@eslint/js' imported from eslint.config.mjs" -- exit code 2
  implication: ROOT CAUSE for lint job. ESLint 10 no longer bundles @eslint/js. Config imports it but it is not a direct dependency.

- timestamp: 2026-03-12T00:06:00Z
  checked: ESLint 10 without --ext flag
  found: 0 output, 0 warnings. ESLint only processes .js/.mjs/.cjs by default with flat config.
  implication: Config needs explicit files patterns for .ts/.tsx. --ext should be removed from lint script.

- timestamp: 2026-03-12T00:07:00Z
  checked: Plugin peer dependency compatibility
  found: eslint-plugin-react (peer: ^3-^9.7) and eslint-plugin-react-hooks (peer: ^3-^9) don't support ESLint 10
  implication: These plugins are transitive deps of eslint-config-next and not in package.json. Need updating or config restructuring.

- timestamp: 2026-03-12T00:08:00Z
  checked: Unit tests on pre-ESLint-10 code (git checkout 1cb6e91)
  found: Same 3 suites fail, same 27 tests fail with "window.matchMedia is not a function"
  implication: Unit test failures are PRE-EXISTING, not caused by ESLint upgrade. Missing matchMedia mock in jest.setup.js.

- timestamp: 2026-03-12T00:09:00Z
  checked: Dependabot PR diff (1cb6e91..873010c)
  found: Only changed eslint version in package-lock.json from ^9.39.2 to ^10.0.3. No config or dependency updates.
  implication: Dependabot did a bare version bump without migration. Needs manual follow-up.

- timestamp: 2026-03-12T00:15:00Z
  checked: ProjectCard tests after matchMedia mock
  found: Still failing with "IntersectionObserver is not defined"
  implication: Additional missing jsdom API mock needed

- timestamp: 2026-03-12T00:18:00Z
  checked: feedback.test.ts with matchMedia mock
  found: Failing because jest.setup.js references window unconditionally, but feedback test uses @jest-environment node
  implication: jest.setup.js mocks need typeof window guard

- timestamp: 2026-03-12T00:20:00Z
  checked: All local CI checks after all fixes applied
  found: Lint exit 0 (39 warnings, 0 errors), type-check exit 0, unit tests 7/7 suites pass (66/66 tests)
  implication: All locally verifiable CI jobs should now pass

## Resolution

superseded: 5deb55c (2026-04-02, "downgrade ESLint to 9.x for TS6 compat") took main back to ESLint 9.x and e649f92 (07-02) removed the `@eslint/js` devDependency, so the ESLint 10 fix can no longer be checked on main and this record does not call it verified. The session recorded verification only locally, under ESLint 10.0.3; see the note under verification for what CI showed.

root_cause: |
  Three compound issues cause all CI jobs to fail:
  1. LINT (exit 2): @eslint/js is not a direct dependency. ESLint 10 no longer bundles it, but eslint.config.mjs imports it. Crash on config load.
  2. LINT (config): lint script uses --ext flag. Config lacks files patterns for .ts/.tsx. Without --ext in ESLint 10, TS files get skipped entirely.
  3. UNIT TESTS (exit 1): Multiple missing jsdom API mocks in jest.setup.js -- window.matchMedia and IntersectionObserver. Pre-existing (before ESLint upgrade). Also, mocks referenced window unconditionally, breaking @jest-environment node tests.
fix: |
  1. Added @eslint/js as explicit devDependency (npm install --save-dev @eslint/js)
  2. Removed --ext flag from lint script, added files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"] to eslint.config.mjs
  3. Added window.matchMedia and IntersectionObserver mocks to jest.setup.js with typeof window guard
commits: [b4e0cbb]
verification: |
  - npm run lint: exit 0 (39 warnings, 0 errors) with ESLint 10.0.3
  - npm run type-check: exit 0
  - npm test: 7/7 suites pass, 66/66 tests pass
  Closure, 2026-11-06 (read-only checks by an agent):
  - package.json at HEAD declares `eslint` `^9.28.0` and no `@eslint/js`. The lint part of the fix no longer applies.
  - The `jest.setup.js` mocks from b4e0cbb are still present (`grep -cE "matchMedia|IntersectionObserver"` gives 8).
  - CI status on b4e0cbb itself, whose lockfile held ESLint 10.0.3: run 22981646334 reads success for Lint and Type Check and for Unit Tests, and failure for E2E Tests (the e2e-test-ci-failures cause). The logs have expired, so this is job status only, and the session never recorded it.
files_changed:
  - package.json (added @eslint/js devDep, removed --ext from lint script)
  - package-lock.json (updated by npm install)
  - eslint.config.mjs (added files pattern)
  - jest.setup.js (added matchMedia + IntersectionObserver mocks with window guard)

## Prevention

blameless_5_whys: not produced (retroactive closure)
why_not_caught: |
  Dependabot did a bare version bump without migration (Evidence 00:09), and local node_modules held ESLint 9.39.2 while the lockfile had 10.0.3, so local runs did not see what CI saw (Evidence 00:01). The jsdom mock failures were pre-existing (Evidence 00:08).
recurrence_guard: |
  The ESLint major ignore in .github/dependabot.yml (`eslint` and `@eslint/js`, version-update:semver-major): Dependabot no longer proposes the bump that started this.
