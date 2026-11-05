---
phase: 12-contact-edge-pages-cleanup-verification
plan: 33
subsystem: docs, testing
tags: [readme, resend, upstash, playwright, test-slow, prod-only]

requires:
  - phase: 12-contact-edge-pages-cleanup-verification
    provides: "12-32 tip; the 12-22 reproductions of C3 and C4 (Phase 10 and 11 deferred rows)"
provides:
  - "README setup step 4, Vercel step 3 and the self-hosted line name the variables lib/email.ts and lib/rate-limit.ts read, and Node.js 24 (WR-03)"
  - "test.slow() on the eight-route credit test (C3)"
  - "G3 'scroll lock keeps the header box' tagged @prod-only with its reason; stale glow wording gone from the bare-h1 comment (C4)"
  - "playwright.config.ts @prod-only note names the dev-compile reason (comment only)"
affects: [12-34]

actuals:
  tokens: 1306   # chars/4 over the realized diff (git diff 4722b9d..5027929, 5224 chars)
  tasks: 2
  commits: 2
plan_head_before: 4722b9d94df63a2549f7e10c94ef9b7828dbec0f
plan_head_after: 502792932edcf065ccefcad7ca5da389e88b32e0

tech-stack:
  added: []
  patterns:
    - "@prod-only carries two reasons: the service worker, and tests that break under dev-server on-demand compiles"

key-files:
  created: []
  modified:
    - README.md
    - e2e/shell.spec.ts
    - e2e/design-system.spec.ts
    - playwright.config.ts

key-decisions:
  - "README contact-form block lists all five names lib/email.ts and lib/rate-limit.ts read; the two analytics names in .env.example (no code reads them) stay untouched, outside WR-03's README scope"
  - "G3 moves to production-only runs (dev listing drops it, PW_PROD and CI keep it) instead of a retry or warm-up, per the 12-22 recorded fix"

patterns-established:
  - "A tag that removes a test from dev runs carries a reason comment above the test and in playwright.config.ts"

requirements-completed: [VERIFY-01, VERIFY-03]

coverage:
  - id: D1
    description: "README names the contact-form variables the code reads and Node.js 24 (WR-03)"
    requirement: VERIFY-01
    verification:
      - kind: other
        ref: "! git grep -nw -e FEEDBACK_EMAIL -e 'Node.js 20' -- README.md"
        status: pass
      - kind: other
        ref: "scratchpad check-12-33-readme.js (plan's node one-liner): README env OK RESEND_API_KEY,FEEDBACK_RECIPIENT_EMAIL,FEEDBACK_FROM_EMAIL,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN"
        status: pass
    human_judgment: false
  - id: D2
    description: "Credit test marked slow; passes a five-repeat run on a fresh dev server (C3)"
    requirement: VERIFY-03
    verification:
      - kind: e2e
        ref: "npx playwright test e2e/shell.spec.ts -g 'every route credits the source' --project=chromium --repeat-each=5"
        status: pass
    human_judgment: false
  - id: D3
    description: "G3 tagged @prod-only: absent from the dev listing, present and passing on a fresh production build (C4)"
    requirement: VERIFY-03
    verification:
      - kind: e2e
        ref: "npx playwright test e2e/design-system.spec.ts --list --project=chromium (G3 absent)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/design-system.spec.ts --project=chromium (7 passed, G3 included)"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-11-03
status: complete
---

# Phase 12 Plan 33: README env names, credit-test slow marker and G3 production-only Summary

**README setup and Vercel steps now name RESEND_API_KEY, FEEDBACK_RECIPIENT_EMAIL, optional FEEDBACK_FROM_EMAIL and the Upstash pair plus Node.js 24; the eight-route credit test carries test.slow(), and G3 runs only on production builds with its reason recorded.**

## Performance

- **Duration:** about 5 min (wall clock as reported by `date`)
- **Started:** 2026-11-03T13:36:56Z
- **Completed:** 2026-11-03T13:42:06Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- WR-03: setup step 4 replaces `FEEDBACK_EMAIL` with the five-variable contact-form block and one line saying the form answers "Couldn't send." until `RESEND_API_KEY` and `FEEDBACK_RECIPIENT_EMAIL` are set, and rate limiting is off without the Upstash pair. Vercel step 3 names the same variables and Vercel's Upstash integration. The self-hosted line says Node.js 24 (`engines.node` 24.x, `.node-version`).
- C3: `test.slow();` is the first line of "every route credits the source with site.attribution.terrain", with a comment naming the eight page loads and the cold dev compile. No assertion change.
- C4: G3 title is now `scroll lock keeps the header box @chromium-only @prod-only`, with a reason comment above it (on-demand compile of the intercepted `@modal/(.)[slug]` route on `next dev`). The bare-h1 comment reads "(font-bold, colour classes) keep their own weight and colour".
- playwright.config.ts: the @prod-only note gained one sentence naming the second reason (G3, dev-server on-demand compiles). Comment only; `git show 5027929 -- playwright.config.ts` exited 0 and the non-comment filter printed nothing.

## Commit per item (for 12-34's ledgers)

| Item | Commit |
|------|--------|
| WR-03 (README env names, Node 24) | `d847f8c` |
| C3 (credit test slow marker) | `5027929` |
| C4 (G3 @prod-only, bare-h1 comment, config note) | `5027929` |

## Task Commits

1. **Task 1 (tracer): README contact-form setup checked against the code (WR-03)** - `d847f8c` (docs)
2. **Task 2: Credit test slow (C3); G3 production-only and stale comment fixed (C4)** - `5027929` (test)

## Variable cross-check (README.md vs code vs .env.example)

| Name in README.md | Read at | In .env.example |
|-------------------|---------|-----------------|
| `RESEND_API_KEY` | `lib/email.ts:8` | yes (commented example) |
| `FEEDBACK_RECIPIENT_EMAIL` | `lib/email.ts:33` (throws when unset, `:36-38`) | yes |
| `FEEDBACK_FROM_EMAIL` | `lib/email.ts:34` (defaults to `onboarding@resend.dev`) | yes |
| `UPSTASH_REDIS_REST_URL` | `lib/rate-limit.ts:24` (and `Redis.fromEnv()`, `:29`) | yes |
| `UPSTASH_REDIS_REST_TOKEN` | `lib/rate-limit.ts:25` (and `Redis.fromEnv()`, `:29`) | yes |

The only other all-caps underscore token in README.md is the `YOUR_USERNAME` clone-URL placeholder, which is not an environment variable. `git grep -c "FEEDBACK_RECIPIENT_EMAIL" -- README.md` prints 4 (baseline 1).

**Analytics note (recorded, not changed):** `.env.example` also names `NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`. No tracked code reads either (`git grep` finds them only in `.planning/codebase/INTEGRATIONS.md` and `STACK.md`). That lies outside WR-03's README scope.

## Test runs

- Five-repeat dev run (fresh `next dev`, port 3000 free): `npx playwright test e2e/shell.spec.ts -g "every route credits the source" --project=chromium --repeat-each=5` gave **"5 passed (35.7s)"**. The plan-level re-run after the final comment wording gave "5 passed (35.8s)".
- Dev listing: `npx playwright test e2e/design-system.spec.ts --list --project=chromium` gave "Total: 6 tests in 1 file", with no G3.
- Production (fresh build): `PW_PROD=1 npx playwright test e2e/design-system.spec.ts --project=chromium` gave "7 passed (10.7s)". G3 ran: gutter 10px, header box `{"x":0,"y":0,"width":1430,"height":64}` both before and after the dialog opened.
- Plan-level: `npm run lint` and `npm run type-check` passed. `PW_PROD=1 npx playwright test e2e/design-system.spec.ts e2e/shell.spec.ts --project=chromium --project=firefox --project=webkit` on a fresh build gave "116 passed (31.7s)", with 0 failed and 0 flaky. Afterwards `git checkout -- public/service-worker.js` ran and nothing was left listening on port 3000.

## Listing counts

| Listing | Raw `--list` total | Unique file + title keys (test-count.mjs method) |
|---------|--------------------|-----------------------------------------------|
| Dev (no `PW_PROD`, the local `guard:tests` listing) | 1452 tests in 27 files | 549 (550 before this plan; G3 dropped) |
| `PW_PROD=1` (matches CI) | 1457 tests in 28 files | 554 (unchanged; G3 kept) |

The baseline in `scripts/guards/test-count.baseline.json` is e2e 547, total 2205, so the dev drop of one stays above it. 12-34 raises the ratchet.

## Expected visual diffs

none. No rendered file changed: README, spec files and a config comment only.

## Files Created/Modified

- `README.md` - setup step 4 contact-form block, Vercel step 3 variables, Node.js 24 self-hosted line
- `e2e/shell.spec.ts` - `test.slow()` and its reason comment in the credit test
- `e2e/design-system.spec.ts` - G3 `@prod-only` tag and reason comment; bare-h1 comment without the glow utility
- `playwright.config.ts` - @prod-only note names the second reason (comment only)

## Decisions Made

- The README block lists the five names the code reads. The unread analytics names in `.env.example` are recorded here and left as they are (outside WR-03).
- G3 gets `@prod-only`, the fix 12-22 recorded, rather than a retry or a warm-up step. CI and `PW_PROD` runs still run it and count it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's node verify one-liner ran from a scratchpad file**
- **Found during:** Task 1
- **Issue:** the `node -e` one-liner has `\b` and `\.` regex escapes, and the shell round-trip on this Windows host halves them (project note).
- **Fix:** ran the same logic from `C:/Users/tim/AppData/Local/Temp/claude/C--Users-tim-MyDocuments-Programming-portfolio-app/35d5c653-a7f4-4d78-851d-919d01dec08f/scratchpad/check-12-33-readme.js`, with the same names, the same check and the same output.
- **Files modified:** none in the repo
- **Committed in:** n/a

**2. [Rule 1 - Bug] The C3 comment named `test.slow()` and broke the "prints 1" grep**
- **Found during:** Task 2 acceptance criteria
- **Issue:** the first comment wording ("test.slow() triples it") made `grep -c "test.slow()" e2e/shell.spec.ts` print 2.
- **Fix:** the comment now says "the slow marker triples it". The grep prints 1, and the five-repeat dev run passed again after the change.
- **Files modified:** e2e/shell.spec.ts
- **Committed in:** 5027929

**3. [Format] Comment line breaks chosen so the plan's phrase greps on one line**
- The bare-h1 comment keeps "(font-bold, colour classes) keep their own weight and colour" on one line. The config note's added sentence comes after "today's filters." so the original wording stays intact.

---

**Total deviations:** 2 auto-fixed (1 Rule 3, 1 Rule 1) plus one formatting note.
**Impact on plan:** none on behaviour. No assertion changes, no skips, no retries.

## Issues Encountered

None.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- Ready for 12-34 (three-engine verification, ratchet raise). Its ledgers can use the commit per item above: WR-03 `d847f8c`, C3 and C4 `5027929`.
- The Phase 10 G3 deferred row and the Phase 11 credit-test deferred row are now fixed by `5027929`. Updating their status in those deferred-items files is left to 12-34 and the orchestrator, because those files are outside this plan's list.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-03*

## Self-Check: PASSED

- Commits d847f8c and 5027929 are on HEAD; all four modified files exist; acceptance greps re-run (test.slow() 1, @prod-only 2, text-shadow-glow 0, FEEDBACK_RECIPIENT_EMAIL 4).
