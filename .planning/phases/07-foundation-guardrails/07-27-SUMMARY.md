---
phase: 07-foundation-guardrails
plan: 27
subsystem: ui
tags: [a11y, skip-link, playwright, e2e, shell, gap-closure]

# Dependency graph
requires:
  - phase: 07-foundation-guardrails
    provides: "07-22/07-23 shell (SiteChrome + SkipLink) and e2e/shell.spec.ts landmarks and 404 tests; 07-26 test-count ratchet 206"
provides:
  - "skipLinks(page) locator helper and an exactly-one skip link assertion on all 7 shell routes and 5 404 paths (chromium + firefox)"
  - "Home hero without its own duplicate skip anchor; the shell SkipLink is the only skip link on every page"
  - "07-REVIEW-DISPOSITION.md IN-04 = fixed"
affects: [phase-09-home-rebuild, SHELL-01, ROADMAP-SC4]

# Actuals (#2632)
actuals:
  tokens: 900
  tasks: 2
  commits: 2
plan_head_before: e32e4ee8621d5aee3a730fa183b179c68c75feb5
plan_head_after: 460b3a401e2364d16243e4284e7a3a5ae24e0483

tech-stack:
  added: []
  patterns:
    - "Single-skip-link invariant: getByRole('link', { name: /skip to/i }) toHaveCount(1), never narrowed with .first()/:visible/includeHidden"

key-files:
  created: []
  modified:
    - e2e/shell.spec.ts
    - components/Hero3DMountain.tsx
    - .planning/phases/07-foundation-guardrails/07-REVIEW-DISPOSITION.md

key-decisions:
  - "The hero's own skip anchor is deleted, not folded into the shell link: the shell SkipLink already reaches main#main-content and the Explore My Work CTA already reaches #home-content (assumption-delta decision: promote the single shell SkipLink)"
  - "Red-first proof in CI: RED 5f403af failed E2E only on / (chromium + firefox, Expected 1 Received 2); GREEN 460b3a4 passed all five jobs with zero visual diff"

patterns-established:
  - "Skip-link count guard: any later page-level skip link (e.g. a Phase 9 hero rebuild) fails e2e/shell.spec.ts"

requirements-completed: [SHELL-01]

coverage:
  - id: D1
    description: "Exactly one skip link on every shell route and 404 path, enforced by e2e/shell.spec.ts"
    requirement: "SHELL-01"
    verification:
      - kind: e2e
        ref: "e2e/shell.spec.ts#Shell landmarks (7 routes) + Shell 404 (5 paths), CI run 40086883766 E2E 122 passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "Red-first proof: the new assertion fails on the pre-fix Home and passes after the fix"
    requirement: "SHELL-01"
    verification:
      - kind: e2e
        ref: "CI run 40086334529 on 5f403af: E2E FAIL, 2 failed (/ chromium + firefox, shell.spec.ts:69 Expected 1 Received 2), 120 passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "Hero duplicate skip anchor removed with zero visual diff; CTA #home-content and page id intact"
    requirement: "SHELL-01"
    verification:
      - kind: automated_ui
        ref: "CI run 40086883766 Visual Regression 72 passed; check-snapshot-commit --none OK (0 changed) on 5f403af and 460b3a4"
        status: pass
      - kind: other
        ref: "grep gate: sr-only 0, focus:bg-frost-600 0, href=\"#home-content\" 1, app/(site)/page.tsx id=\"home-content\" 1"
        status: pass
    human_judgment: false

duration: 17min
completed: 2026-10-24
status: complete
---

# Phase 7 Plan 27: Single Skip Link (SHELL-01 gap closure) Summary

**The shell SkipLink is now the only skip link on every page. e2e/shell.spec.ts counts `getByRole('link', { name: /skip to/i })` on 7 routes and 5 404 paths. CI showed the count fail on the old Home (2 links), then pass with zero visual diff once the v1 hero's own `#home-content` anchor was deleted.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-10-24T10:31:30Z
- **Completed:** 2026-10-24T10:48:46Z
- **Tasks:** 2
- **Files modified:** 3 (2 code, 1 planning)

## Accomplishments
- Closed 07-VERIFICATION.md gaps[0] (ROADMAP SC4 / SHELL-01 partial; code review IN-04): Home rendered the shell "Skip to main content" link and the hero's own "Skip to content" anchor.
- Added a `skipLinks(page)` helper and `await expect(skipLinks(page)).toHaveCount(1);` inside the existing Shell landmarks and Shell 404 tests. No test was added, renamed or removed, so the count stays at 23 shell tests and the ratchet at 206.
- Deleted the hero anchor (8 lines). The "Explore My Work" CTA keeps `href="#home-content"`, and `app/(site)/page.tsx` keeps `id="home-content"`.

## CI Evidence

| Commit | Role | CI run | Lint and Type Check | Unit Tests | E2E Tests | Visual Regression | Build Application |
|--------|------|--------|---------------------|------------|-----------|-------------------|-------------------|
| RED_SHA `5f403afc2725c5daf90d84975c8fc73386a4f5df` | assertion only | [40086334529](https://github.com/tlex-web/portfolio-app/actions/runs/40086334529) | success | success | **FAIL** ([job](https://github.com/tlex-web/portfolio-app/actions/runs/40086334529/job/120849928300)): 2 failed, 120 passed | success | success |
| GREEN_SHA `460b3a401e2364d16243e4284e7a3a5ae24e0483` | + anchor removal | [40086883766](https://github.com/tlex-web/portfolio-app/actions/runs/40086883766) | PASS | PASS | **PASS** ([job](https://github.com/tlex-web/portfolio-app/actions/runs/40086883766/job/120851533907)): 122 passed, 0 failed, 0 flaky | **PASS** ([job](https://github.com/tlex-web/portfolio-app/actions/runs/40086883766/job/120851533942)): 72 passed | PASS |

- Both pushes were plain pushes to the new branch `ci/07-27` (new branch, then fast-forward 5f403af..460b3a4). No force-push. The phase branch and main were not pushed.
- On the RED run, E2E Tests was the only failed job (`gh run view ... select(.conclusion=="failure")` printed exactly `E2E Tests`). Security Audit succeeded and Dependency Review was skipped on both runs.
- Test-count line (local, GREEN): `test-count: jest 107 + e2e 99 = 206 (baseline 206)` / `test-count: OK`. Jest: 13 suites, 107 tests passed.
- check-snapshot-commit: `snapshot-commit: OK (0 changed)` on RED_SHA and on GREEN_SHA. `git diff --name-only 4969072 HEAD -- '*.png'` is empty, and the code diff since 4969072 is exactly `components/Hero3DMountain.tsx` and `e2e/shell.spec.ts`.

## TDD Cycle

- **RED (5f403af, `test(07-27)`):** The failing tests were `[chromium] › e2e/shell.spec.ts:59:9 › Shell landmarks › /: one shell, skip link first, current page Home` and the same test in `[firefox]`. Both failed at `shell.spec.ts:69 await expect(skipLinks(page)).toHaveCount(1);` with `Expected: 1, Received: 2 - unexpected value "2"`, and all three retries failed. The other 6 routes and all 5 404 paths passed in both browsers. **Semantic assessment:** the target assertion ran and failed for the intended reason, because the hero anchor is the second accessible "Skip to ..." link on `/`. Every other test passed, and there was no setup, load or fixture fault. The planned behaviour matches exactly: 2 on `/`, 1 everywhere else. The `tdd-red-evidence` classifier was not run. Playwright's CI reporter output is not one of its supported formats (TAP, JUnit, go test, swift-testing, unittest), and `workflow.tdd_mode` is off for this dispatch. The evidence is the CI job log quoted above.
- **GREEN (460b3a4, `fix(07-27)`):** deleted the anchor. The same suite then passed: 122 passed, 0 flaky. That is 120 + the 2 previously failing tests.
- **REFACTOR:** none needed.

## Task Commits

1. **Task 1 (tracer, RED): exactly-one skip link assertion** - `5f403af` (test)
2. **Task 2 (GREEN): remove the hero's duplicate skip link** - `460b3a4` (fix)

**Plan metadata:** docs commit with this SUMMARY and 07-REVIEW-DISPOSITION.md (IN-04 fixed)

## Files Created/Modified
- `e2e/shell.spec.ts` - `skipLinks` helper, two `toHaveCount(1)` assertions, and a header comment that now names one skip link
- `components/Hero3DMountain.tsx` - removed the v1 `sr-only` "Skip to content" anchor (`#home-content`, `focus:bg-frost-600 focus:text-snow-50`) and its JSX comment
- `.planning/phases/07-foundation-guardrails/07-REVIEW-DISPOSITION.md` - IN-04 `disposition: fixed`, table row `| IN-04 | info | fixed | 07-27 460b3a4 |` (24 open entries remain)

## Decisions Made
- The duplicate was deleted, not merged, as the plan specified. It came third in Tab order, after both hero CTAs, so it skipped nothing. The ui-ux-pro-max accessibility guidance ("Skip Links: provide skip to main content link") is met by the shell SkipLink, which is the first focusable element.
- REQUIREMENTS.md is untouched. `requirements-completed` repeats the plan's `[SHELL-01]` per the SUMMARY contract, but SHELL-01's status is left to the re-verifier (commit e69616a reverted the phase requirements to Pending). `requirements.mark-complete` was not run.

## Deviations from Plan

None - plan executed exactly as written.

## TDD Gate Compliance

The RED gate commit is `test(07-27)` 5f403af. The GREEN commit uses `fix(07-27)` (460b3a4), not `feat(07-27)`, because the plan's Task 2 action prescribes that exact message. A `feat(` grep for this plan therefore finds nothing, but the GREEN gate is satisfied in substance: the RED commit came first, and the same CI suite went from fail to pass. `workflow.tdd_mode` is off, so this note is advisory.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 07-VERIFICATION.md gaps[0] is ready for re-verification. The SC4 "one skip link" condition is now enforced in CI on every shell route and 404 path, in chromium and firefox.
- The phase still has human items outside this plan: the GUARD-01 Vercel Node 24 / npm ci confirmation, ratification of the SC2 re-baseline exceptions, required status checks on main, the WebKit keyboard pass and the device visual sign-off.
- Phase 9 Home rebuild: if the new hero brings its own "jump past the ascent" skip link, it must not be named "Skip to ..." alongside the shell link, or this guard goes red. Name or fold it on purpose.

## Self-Check: PASSED
- FOUND: e2e/shell.spec.ts, components/Hero3DMountain.tsx, .planning/phases/07-foundation-guardrails/07-REVIEW-DISPOSITION.md
- FOUND commits on HEAD: 5f403af, 460b3a4 (ledger e32e4ee..HEAD = 2)
- Acceptance re-run: helper 1, assertion 2, `Total: 23 tests in 1 file`, lint 0, type-check 0, hero grep gate OK, disposition gate "IN-04 fixed, 24 open", GREEN all five PASS

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-24*
