---
status: resolved
trigger: "E2E tests fail in CI (GitHub Actions) with exit code 1 after ESLint 9->10 upgrade"
created: 2026-03-12T00:00:00Z
updated: 2026-11-06T13:40:06Z
---

## Current Focus

hypothesis: CONFIRMED - dev server HMR + on-demand compilation incompatible with E2E testing
test: Ran all 25 chromium tests against production build -- 25/25 pass in 22.6s
expecting: CI should pass now with production build config
next_action: none, closed 2026-11-06, see Resolution

## Symptoms

expected: E2E tests pass in CI
actual: E2E Tests job fails with exit code 1 after running for 8m55s
errors: "Process completed with exit code 1"
reproduction: CI failure on push to main. Reproduces locally with dev server.
started: Pre-existing issue -- tests never worked reliably against dev server

## Eliminated

- hypothesis: Missing environment variables in CI
  evidence: CI workflow sets RESEND_API_KEY, FEEDBACK_RECIPIENT_EMAIL, FEEDBACK_FROM_EMAIL. Rate limiter has dev fallback. Form submission works in production mode.
  timestamp: 2026-03-12T00:00:30Z

- hypothesis: Browser installation issues in CI
  evidence: CI uses "npx playwright install --with-deps" and tests run for 8m55s (not instant failure)
  timestamp: 2026-03-12T00:00:30Z

- hypothesis: Selector/element issues in tests
  evidence: Screenshots show pages fully rendered with correct content visible. All 25 tests pass against production server.
  timestamp: 2026-03-12T00:01:00Z

- hypothesis: ESLint upgrade caused test failures
  evidence: E2E tests don't depend on ESLint. Tests fail purely due to dev server issues (HMR, compilation).
  timestamp: 2026-03-12T00:03:00Z

## Evidence

- timestamp: 2026-03-12T00:00:30Z
  checked: CI workflow file, playwright config, E2E test files, package.json
  found: Tests use waitForLoadState('networkidle') extensively, webServer uses "npm run dev" (Next.js dev server with HMR), 3 browser projects with retries=2 and workers=1 in CI
  implication: HMR WebSocket prevents networkidle from ever resolving

- timestamp: 2026-03-12T00:01:00Z
  checked: Ran chromium tests locally against dev server
  found: ALL 25 tests fail with timeout errors on waitForLoadState('networkidle') and waitForURL. Screenshots show pages fully loaded with correct content.
  implication: Content loads fine; wait strategies incompatible with dev server

- timestamp: 2026-03-12T00:02:00Z
  checked: Removed networkidle waits, re-ran against dev server with 16 workers
  found: 15/25 pass on first run, 10/25 fail on second run. Failures caused by dev server compilation delays and race conditions with parallel workers.
  implication: Dev server fundamentally unreliable for E2E testing

- timestamp: 2026-03-12T00:03:00Z
  checked: Built production app and ran tests against "next start" server
  found: ALL 25 chromium tests pass in 22.6 seconds. No timeouts, no navigation failures, no form submission errors.
  implication: Production server is stable and reliable for E2E testing

- timestamp: 2026-03-12T00:04:00Z
  checked: Page snapshots from failures
  found: Next.js Dev Tools button shows "Compiling..." / "Rendering..." during test failures. Dev server actively compiling pages mid-test.
  implication: On-demand compilation during test execution causes cascading timeouts

## Resolution

root_cause: The Playwright webServer config uses "npm run dev" (Next.js dev server) which is fundamentally incompatible with reliable E2E testing for two reasons: (1) The HMR WebSocket connection prevents waitForLoadState('networkidle') from ever resolving, causing all tests with that wait to time out. (2) On-demand page compilation during test execution causes unpredictable delays that exceed test timeouts, especially with parallel workers.
fix: (1) Changed playwright.config.ts webServer command to use "npm run build && npm run start" in CI, keeping "npm run dev" for local development. Increased CI webServer timeout to 180s to accommodate build step. (2) Removed all waitForLoadState('networkidle') calls from E2E tests, relying on Playwright's built-in auto-waiting for element visibility. (3) Removed fragile Promise.all navigation patterns, using simpler click-then-assert-URL approach. (4) Added longer timeouts for navigation assertions (15s) to handle slow first-load compilation. (5) Cleaned up waitForSelector calls, using Playwright's getByRole auto-waiting instead.
commits: [241cbbf]
verification: |
  Session: All 25 chromium tests pass against production server (22.6s). Zero failures.
  Closure, 2026-11-06 (read-only checks by an agent):
  - playwright.config.ts:41 sets `prod` from `CI`, and :164 runs `npm run build && npm run start`. `git grep networkidle -- e2e` finds nothing.
  - `E2E Tests` reads success on main in runs 42142874586 (98d7b6c), 42131108792 (8cc1df4) and 42127714611 (a50956e).
  - Not counted as a pass: run 42149842086 (8270572) shows the job `cancelled` at its 60-minute timeout, after 42 minutes in "Install Playwright browsers". No test failed there; it is a separate infrastructure symptom.
  241cbbf did not turn the job green by itself: `E2E Tests` still reads failure in its run 22982267365 and in 6470b58's run 22982624933, and first reads success at 369130e ("fix: skip webkit E2E tests in CI", run 22983589824). Those logs have expired, so the causes of the two later failures are unknown here.
files_changed:
  - playwright.config.ts
  - e2e/homepage.spec.ts
  - e2e/contact-form.spec.ts
  - e2e/photos.spec.ts
  - e2e/projects.spec.ts

## Prevention

blameless_5_whys: not produced (retroactive closure)
why_not_caught: |
  No gate named in this session could catch it: the tests "never worked reliably against dev server" (Symptoms), so the failure was the standing state of the E2E job.
recurrence_guard: |
  playwright.config.ts `prod` and the webServer command `npm run build && npm run start`, exercised by the `E2E Tests` job on every CI run.
  No test or guard forbids `networkidle`; its absence from e2e/ is a grep result at HEAD, not an enforced rule.
