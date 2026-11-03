---
phase: 12-contact-edge-pages-cleanup-verification
plan: 20
subsystem: testing
tags: [playwright, axe-core, accessibility, cls, csp, broken-links, audit-gate, verify-02, verify-04]

requires:
  - phase: 12-02
    provides: "PW_REUSE switch, serviceWorkers 'block' on the functional projects, e2e/routes.ts ROUTES, the nonce CSP"
  - phase: 12-17
    provides: "@prod-only / @chromium-only config filters (unchanged here)"
  - phase: 12-19
    provides: "Round-2 baselines at b743ca0 (no pixel moved by this plan)"
provides:
  - "e2e/helpers/audit.ts: installAuditProbes, readProbes, collectFailures, clearFailures, settle, waitForAnimations, runAxe, checkLinks, ALLOWED_CONSOLE"
  - "e2e/audit.spec.ts: 9 route tests (8 ROUTES + the 404) at 375/768/1440 and 9 D-21 state tests, 18 per engine"
  - "Zero audit findings in the app: axe 0 violations, CLS <= 0.1 (max 0.019 on Home @375), no CSP, console, image or link failure on any route or state"
affects: [12-21, 12-23, 12-24, ci-e2e, test-count-ratchet]

actuals:
  tokens: 5850
  tasks: 3
  commits: 2
plan_head_before: d80e4aad0fc186b4cff71272d8751a0353670965
plan_head_after: a3cf20938812df56dd181468dd5e5ebc23e74dc4

tech-stack:
  added: []
  patterns:
    - "Audit probes: securitypolicyviolation DOM event (every engine) and a buffered layout-shift observer (Chromium) installed as one init script"
    - "Console allow-list as one anchored RegExp per engine, every alternative naming one Vercel loader URL on the test server"
    - "Per-width audit loads resize on about:blank, so the previous route never starts a viewport prefetch the next goto cancels"
    - "CLS per load recorded as a test annotation (type 'cls') for the margin to the budget"

key-files:
  created:
    - e2e/helpers/audit.ts
    - e2e/audit.spec.ts
  modified: []

key-decisions:
  - "No app fix was needed: every first-run finding was a harness defect in the new spec, fixed in the spec, never by relaxing a check"
  - "The 404 test removes only the line 'Failed to load resource: ... 404 (Not Found) @ <this document URL>' that Chromium and WebKit print for the document's own asserted 404 status; it is not an ALLOWED_CONSOLE entry and applies to no other test"
  - "checkLinks skips a link that resolves to the current document (the skip link #main-content); the document itself is loaded and its status asserted by the test"
  - "D-21 states run at 1440 (mobile menu at 375); the three /photos views loop all three widths"
  - "axe default run includes best-practice rules: the 'region' rule appears among passes or inapplicable on every audited page, so withTags is not pinned (RESEARCH A9 holds)"

patterns-established:
  - "Audit gate: one spec, every ROUTES entry plus the 404 at three widths, each interactive state its own test, each finding prefixed with route, width and state"

requirements-completed: [VERIFY-02, VERIFY-04]

coverage:
  - id: D1
    description: "Audit probes and the per-engine console allow-list: one route (/roadmap @1440) through every check in all three engines"
    requirement: VERIFY-04
    verification:
      - kind: e2e
        ref: "PW_PROD=1 PW_REUSE=1 npx playwright test e2e/audit.spec.ts --project=chromium --project=firefox --project=webkit (tracer, b0004d1): 3 passed (1 per engine)"
        status: pass
      - kind: other
        ref: "Negative controls (temporary spec, not committed): cross-origin img and fetch raise img-src and connect-src securitypolicyviolation events in chromium, firefox and webkit; an injected 300 px block gives CLS 0.192; an img without alt gives an image-alt violation; console.error and a 404 image are collected"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every route in e2e/routes.ts plus /__no-such-page__ at 375, 768 and 1440: axe 0 violations, CLS <= 0.1 (Chromium), no CSP violation, no console or page error outside ALLOWED_CONSOLE, no image >= 400, every same-origin link and image URL < 400; the offline page shows its empty saved list"
    requirement: VERIFY-02
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/audit.spec.ts --project=chromium --project=firefox --project=webkit (fresh build): 54 expected, 0 unexpected, 0 flaky"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-21 states, one test each: mobile menu open, lightbox hotspots on and off, /photos Map, Grid and Carousel, contact error summary, contact register signed (API mocked), reduced-motion Home"
    requirement: VERIFY-02
    verification:
      - kind: e2e
        ref: "e2e/audit.spec.ts#Audit: interactive states (D-21), same fresh-build run: 9 of 9 per engine"
        status: pass
    human_judgment: false
  - id: D4
    description: "Repo gates stay green and the new tests count toward the ratchet"
    requirement: VERIFY-04
    verification:
      - kind: other
        ref: "npm run lint (exit 0), npm run type-check (exit 0), npx jest --silent (102 suites, 1647 tests passed)"
        status: pass
      - kind: other
        ref: "node scripts/guards/test-count.mjs --jest jest-results.json: jest 1647 + e2e 536 = 2183 (baseline 1749), OK"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-11-03
status: complete
---

# Phase 12 Plan 20: Audit Gate Summary

**A production-build audit spec now walks all 8 routes plus the 404 at 375, 768 and 1440 px, and 9 interactive states. It fails on any axe violation, CLS above 0.1 (Chromium), CSP violation event, console or page error outside a three-entry per-engine Vercel-loader allow-list, failed image, or broken same-origin link. The site passed with zero findings in all three engines (54/54), so no app code changed.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-11-03T00:34:50Z
- **Completed:** 2026-11-03T00:47:56Z
- **Tasks:** 3 of 3
- **Files modified:** 2 (both new, under e2e/)

## Accomplishments

- `e2e/helpers/audit.ts` holds the probes. The CSP check uses the `securitypolicyviolation` event in every engine, never console text. CLS comes from a buffered `layout-shift` observer and is `null` outside Chromium. Console errors only (no warnings), page errors, image responses >= 400. axe runs its default rule set and the helper reports whether the `region` rule ran. `checkLinks` fetches each same-origin `a[href]` and `img`/`source` src/srcset URL once per worker.
- `ALLOWED_CONSOLE` has three entries, one anchored pattern per engine, each commented with engine and source. Every alternative names `/_vercel/insights/script.js` or `/_vercel/speed-insights/script.js` on `http://localhost:3000`:
  - Chromium: the network 404, plus the strict-MIME refusal it prints in the CI container (wording from `e2e/home-canvas.spec.ts`).
  - Firefox: the nosniff MIME block.
  - WebKit: the network 404 and the nosniff refusal.
- `e2e/audit.spec.ts` has 18 tests per engine:
  - 9 route tests: the 8 ROUTES entries and `/__no-such-page__`, each looping 375, 768 and 1440 x 900. The 404 asserts HTTP 404 and an h1. The offline page asserts "No pages are saved on this device yet.".
  - 9 state tests: mobile menu open at 375; the Glacier Trail lightbox with hotspots on, and off (`aria-pressed="true"`, 0 labels); the /photos Map, Grid and Carousel views at three widths each; the contact error summary (focused alert); the contact register signed (route mocked 200, no real send); reduced-motion Home.
- CI picks the spec up automatically: `.github/workflows/ci.yml:104` runs `--project=chromium --project=firefox` on a production build. WebKit joins in 12-23.

## Tracer (Task 1) run: one route, three engines

`PW_PROD=1 PW_REUSE=1 npx playwright test e2e/audit.spec.ts --project=chromium --project=firefox --project=webkit` with `/roadmap @1440`:

| Engine | First run | After the allow-list |
|--------|-----------|----------------------|
| chromium | 0 passed, 1 failed: `Failed to load resource: ... 404 (Not Found) @ http://localhost:3000/_vercel/{speed-insights,insights}/script.js` | 1 passed |
| firefox | 0 passed, 1 failed: `[JavaScript Error: "The resource from “http://localhost:3000/_vercel/{speed-insights,insights}/script.js” was blocked due to MIME type (“text/plain”) mismatch (X-Content-Type-Options: nosniff)." ...]` | 1 passed |
| webkit | 0 passed, 1 failed: the two loader 404s plus `Refused to execute http://localhost:3000/_vercel/.../script.js as script because "X-Content-Type-Options: nosniff" was given ...` | 1 passed |

No axe, CSP, CLS, image or link finding on /roadmap in any engine. These first-run wordings are the source of the three `ALLOWED_CONSOLE` entries.

## First full run (Task 2): failures per route, width and state

The first run used the reused build. Every failure was in the new spec's harness, not in the app:

| Run | Engine | Result | Failures (route / width / state) | Cause | Fix (spec only) |
|-----|--------|--------|----------------------------------|-------|-----------------|
| 1 | chromium | 16 passed, 2 failed | `/__no-such-page__` @375, @768, @1440 console: `Failed to load resource: ... 404 (Not Found) @ http://localhost:3000/__no-such-page__` | Chromium reports the document's own 404, which the test itself asserts | The 404 test removes exactly that one line for this document URL |
| 1 | chromium | (same test) | `/__no-such-page__` @375 link: `404 http://localhost:3000/__no-such-page__` | The skip link `#main-content` resolved to the page itself | `checkLinks` skips URLs equal to the current document |
| 1 | chromium | (state) | `lightbox, hotspots off`: no "Show labels" button | Wrong assumption in the spec: the button keeps the name "Hide labels" and toggles `aria-pressed` | Assert `aria-pressed="true"` and 0 `[data-hotspot-label]` |
| 2 | chromium | 18 passed | none | | |
| 2 | firefox | 18 passed | none | | |
| 2 | webkit | 14 passed, 4 failed | `/contact @768`, `/offline @768`, `/projects @768`, `/roadmap @768` pageerror: `Fetch API cannot load http://localhost:3000/<nav route>?_rsc=... due to access control checks.` | The spec resized the 375 page to 768 before the next `goto`. That showed the desktop nav, and Next started viewport prefetches that the `goto` cancelled at once. WebKit reports the cancelled fetches as page errors. A standalone 768 load, waited out and then navigated, had none (scratch check) | Each width now resizes on `about:blank` before loading the route |
| 3 | webkit | 18 passed | none | | |

There were no axe violations, CSP violations, failed images, broken links or CLS overruns in any engine on any route or state.

## CLS (Chromium, fresh load plus full scroll)

The highest value was 0.0190, at `/` @375. `/` @768 was 0.0046. Every other route, width and state measured 0. The budget is 0.1 and was not touched.

## Fixes (Task 3)

None needed. The audit found no defect in app/, components/, lib/, data/, public/ or next.config.ts. No file outside `e2e/` changed.

| File | Check | Change |
|------|-------|--------|
| (none) | | |

## Round 3 expected diffs

none (no file that renders pixels changed; no visual slug or width is affected)

## Full audit run (plan-level verification, fresh build)

`PW_PROD=1 npx playwright test e2e/audit.spec.ts --project=chromium --project=firefox --project=webkit` (exit 0; built fresh with no reuse):

| Engine | Passed | Failed | Flaky |
|--------|--------|--------|-------|
| chromium | 18 | 0 | 0 |
| firefox | 18 | 0 | 0 |
| webkit | 18 | 0 | 0 |

`npm run lint` exit 0 (all guards OK). `npm run type-check` exit 0. `npx jest --silent`: 102 suites, 1647 tests passed. `test-count.mjs`: jest 1647 + e2e 536 = 2183 against a baseline of 1749, OK. `git status --porcelain public/service-worker.js`: empty (restored after each server stopped). Port 3000 was free at the end.

## Task Commits

1. **Task 1 (tracer): one route through every audit check** - `b0004d1` (test)
2. **Task 2: every route at three widths and the D-21 states** - `a3cf209` (test)
3. **Task 3: fix every audit finding** - no commit (zero app findings; the three-engine run is recorded above)

**Plan metadata:** the docs(12-20) commit that adds this SUMMARY.

## Files Created/Modified

- `e2e/helpers/audit.ts` - probes, failure collectors, settle, axe runner, link checker and the per-engine `ALLOWED_CONSOLE`
- `e2e/audit.spec.ts` - the route loop (9 tests) and the D-21 states (9 tests)

## Decisions Made

- **404 own-status line.** Chromium and WebKit print `Failed to load resource: ... 404` for the 404 document itself. That status is the expected outcome, and the test asserts it. So only that test, and only that exact line for its own URL, is filtered. ALLOWED_CONSOLE still holds only the Vercel loader patterns.
- **Self-links are not fetched.** A link that resolves to the current document, like the skip link, starts no request. The test already loaded that document and asserted its status.
- **Resize on about:blank.** Without this, the harness causes the WebKit page errors itself, by cancelling prefetches that its own resize started. No check was relaxed: the pageerror listener stays on for the whole test.
- **Widths for the states.** The plan names no widths for the states. The /photos views loop all three widths, the mobile menu uses 375 and the other states use 1440.
- **axe tags.** RESEARCH A9 holds: the `region` rule appears among passes or inapplicable, so the default run includes best-practice rules and no `withTags` pin was added.

## Deviations from Plan

None in scope. The plan expected Task 3 to change app code. Every finding was a harness defect in the new spec, and those were fixed in `e2e/audit.spec.ts` and `e2e/helpers/audit.ts` (the files Tasks 1 and 2 own). Task 3 therefore has no fix commits, and its three-engine run is recorded above.

**Total deviations:** 0. **Impact:** none.

## Issues Encountered

- The first WebKit run had page errors from cancelled prefetches. A scratch check traced them to the resize-then-goto order (details in the run table), and the harness now resizes on about:blank. Temporary probe specs used for negative controls were deleted and never staged.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The audit is live in CI (chromium, firefox) from the next push. 12-23 adds `--project=webkit` to CI, and the audit already passes in WebKit locally.
- 12-21 (keyboard order) can reuse `settle`, `waitForAnimations` and `collectFailures` from `e2e/helpers/audit.ts`.
- 12-23's round 3 gets nothing from this plan (the Round 3 list is empty).

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-03*

## Self-Check: PASSED

- FOUND: e2e/helpers/audit.ts, e2e/audit.spec.ts, 12-20-SUMMARY.md
- FOUND: b0004d1 and a3cf209 are ancestors of HEAD; `commits: 2` measured with `git rev-list --count d80e4aa..HEAD` before the metadata commit
- `grep -c securitypolicyviolation e2e/helpers/audit.ts` = 2; `--list` = 18 tests (chromium); no `.only(`, `.skip(` or `.fixme(`
- Fresh-build three-engine run 54/54; lint, type-check, Jest green; service worker clean
