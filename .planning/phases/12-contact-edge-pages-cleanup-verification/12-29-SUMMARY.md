---
phase: 12-contact-edge-pages-cleanup-verification
plan: 29
subsystem: edge
tags: [nextjs-proxy, csp, matcher, not-found, security-register]

requires:
  - phase: 12-27
    provides: "Tim's 404 header guard choice (edge.header-guard = option A)"
  - phase: 12-02
    provides: "proxy.ts section rewrite, x-edge-section delete, neutral 404, CSP builder"
provides:
  - "Document prefetches (purpose: prefetch) pass the proxy: CSP header, section-header delete, miss handling"
  - "Proxy-only section rule scoped in comments to requests the proxy handles (option A)"
  - "T-12-02 closed; residual accepted as AR-12-02"
affects: [12-34]

actuals:
  tokens: 4426
  tasks: 3
  commits: 4
plan_head_before: de1a01bc9aaddf6311de0f6508054c1b19011602
plan_head_after: 9abf40ad82cf5f8c06e45aeab3d2a9b96054971e

tech-stack:
  added: []
  patterns:
    - "proxy matcher skips only next-router-prefetch (RSC flight prefetches); every document request gets the proxy"

key-files:
  created: []
  modified:
    - proxy.ts
    - lib/__tests__/proxy.test.ts
    - e2e/not-found.spec.ts
    - lib/edge-section.ts
    - app/not-found.tsx
    - .planning/phases/12-contact-edge-pages-cleanup-verification/12-SECURITY.md

key-decisions:
  - "12-29: option A applied (Tim, 12-27: \"A (Recommended)\"): purpose: prefetch left proxy config.matcher[0].missing; next-router-prefetch stays (RSC prefetches are not documents)"
  - "12-29: IN-02 is narrowed, not fixed as written: matcher-skipped paths (RSC prefetches, api..., missing images/, terrain/, media/ files) are accepted residual AR-12-02; 12-34 records IN-02 deferred"
  - "12-29: T-12-02 closed in 12-SECURITY.md with file:line and test-name evidence; threats_open stays 0"

patterns-established:
  - "Proxy guarantees are stated as 'on requests the proxy handles' and name the matcher-skipped paths"

requirements-completed: [EDGE-01, VERIFY-04]

coverage:
  - id: D1
    description: "A purpose: prefetch 404 carries the CSP header and ignores a visitor-sent x-edge-section (generic links)"
    requirement: EDGE-01
    verification:
      - kind: e2e
        ref: "e2e/not-found.spec.ts#a document prefetch with a client-sent x-edge-section gets the CSP header and the generic links"
        status: pass
    human_judgment: false
  - id: D2
    description: "A purpose: prefetch request for an unknown /photos/<slug> gets the proxy's miss handling (404, CSP, All photographs)"
    requirement: VERIFY-04
    verification:
      - kind: e2e
        ref: "e2e/not-found.spec.ts#a document prefetch of an unknown photo slug gets the proxy miss handling"
        status: pass
    human_judgment: false
  - id: D3
    description: "config.matcher[0].missing holds only the next-router-prefetch entry"
    requirement: VERIFY-04
    verification:
      - kind: unit
        ref: "lib/__tests__/proxy.test.ts#config.matcher skips only RSC prefetches: missing holds the next-router-prefetch entry alone"
        status: pass
    human_judgment: false
  - id: D4
    description: "Option A comments in proxy.ts, lib/edge-section.ts, app/not-found.tsx scope the proxy-only rule and cite AR-12-02; 12-SECURITY.md T-12-02 closed, AR-12-02 recorded with Tim's words"
    requirement: EDGE-01
    verification:
      - kind: other
        ref: "grep -c AR-12-02 proxy.ts lib/edge-section.ts app/not-found.tsx (1/1/1); scratchpad verify-t1202.js prints 'T-12-02 closed'"
        status: pass
    human_judgment: true
    rationale: "The accepted residual's wording and scope are a judgment call for Tim; no test asserts the residual by design"

duration: 9min
completed: 2026-11-03
status: complete
---

# Phase 12 Plan 29: Document prefetch through the proxy, and closing T-12-02 Summary

**Document prefetches (`purpose: prefetch`) now go through proxy.ts, so they get the CSP header, the delete of a visitor-sent `x-edge-section`, and the unknown-slug miss handling. The "only the proxy names the section" rule is now scoped to requests the proxy handles (Tim's option A), and T-12-02 is closed with residual AR-12-02.**

## Option applied

Option A. The 12-27 row, as read by the Task 2 precondition (`status=option A value=\`drop purpose: prefetch from the proxy matcher; residual AR-12-02\``, exit 0):

`| edge.header-guard | option A | \`drop purpose: prefetch from the proxy matcher; residual AR-12-02\` | "A (Recommended)" |`

IN-02 is narrowed, not fixed as written. The paths the matcher skips (RSC prefetches with `next-router-prefetch`, paths starting with `api`, missing files under `images/`, `terrain/` and `media/`) are the accepted residual AR-12-02, so 12-34 records IN-02 as deferred.

## Performance

- **Duration:** 9 min
- **Started:** 2026-11-03T12:41:23Z
- **Completed:** 2026-11-03T12:50:29Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- C1: `config.matcher[0].missing` is now only `[{ type: 'header', key: 'next-router-prefetch' }]` (proxy.ts:229). Document prefetches get the CSP header and the section-header delete.
- Two e2e cases and one matcher unit case pin the behaviour. The photo-miss case is the positive control: it proves the proxy really runs on a document prefetch.
- Option A comments in all three files name the skipped paths and AR-12-02. app/not-found.tsx states once that Next 16.4 hides `next-router-prefetch` from `headers()` (request-store.js HIDDEN_REQUEST_HEADERS).
- 12-SECURITY.md: T-12-02 is `closed` with evidence, AR-12-02 is in the Accepted Risks Log with Tim's words, "Open below threshold" says no threat is open, the prefetch CSP flag is marked closed by C1, and `threats_open: 0` is unchanged.

## RED evidence

- **Unit (Jest, lib/__tests__/proxy.test.ts):** `config.matcher › skips only RSC prefetches: missing holds the next-router-prefetch entry alone` failed on `toEqual`. The received array still had `+ Object { "key": "purpose", "type": "header", "value": "prefetch" }`. 1 failed, 51 passed. Semantic assessment: the target test ran and failed on the planned assertion (the extra matcher entry). Valid RED.
- **e2e (chromium, on a HEAD build):** 2 failed, 17 passed.
  - `a document prefetch with a client-sent x-edge-section gets the CSP header and the generic links` failed with `Expected substring: "default-src 'self'"` / `Received string:    ""`. This is the missing CSP header.
  - `a document prefetch of an unknown photo slug gets the proxy miss handling` failed with `Expected substring: "<h1"` / `Received string: "<!DOCTYPE html><html id=\"__next_error__\">…"`. The proxy never ran, so the photo miss fell to the empty `__next_error__` shell instead of the 404 with "All photographs". The plan predicted "the generic links" here. The real failure is a stronger form of the same cause, "the proxy never ran": without the proxy, `/photos/<unknown>` reaches the `[slug]` page's notFound(), and that page renders the empty error shell (12-RESEARCH Pitfall 1).
  - Semantic assessment: both target tests ran and failed on planned assertions, for the reason the plan named (the proxy is skipped). Valid RED.
- **GREEN:** Jest 52/52. not-found spec on chromium 19/19, both prefetch cases in the run.

## Task Commits

1. **Task 1 (tracer) RED: document prefetches must pass the proxy (C1)** - `16deede` (test)
2. **Task 1 (tracer) GREEN: document prefetches pass the proxy (C1)** - `099fab7` (fix)
3. **Task 2: scope the proxy-only section rule to proxied requests (IN-02)** - `0b3b5c4` (docs). `git show --stat`: `app/not-found.tsx | 9 +++++++++`, `lib/edge-section.ts | 7 +++++++`, `proxy.ts | 6 +++++-`, 3 files changed, 21 insertions(+), 1 deletion(-)
4. **Task 3: close T-12-02 (C1, IN-02)** - `9abf40a` (docs)

For 12-34's ledgers: C1 is `16deede` and `099fab7`. IN-02 (narrowed, residual AR-12-02) is `0b3b5c4` and `9abf40a`.

Tracer gate: the run is interactive (`_auto_chain_active: false`), the mode is end-of-phase and the verify is automated only. I re-ran the verify (Jest 52/52, e2e 19/19), it passed, and I went on to expansion.

## Files Created/Modified
- `proxy.ts` - the matcher drops the `purpose` entry (with a one-sentence comment); the header-delete comment is scoped to proxied requests and cites AR-12-02
- `lib/__tests__/proxy.test.ts` - imports `config`; new `config.matcher` describe
- `e2e/not-found.spec.ts` - two document-prefetch cases beside the spoofed-header case
- `lib/edge-section.ts` - the module JSDoc scopes the proxy-only rule and names the skipped paths and AR-12-02
- `app/not-found.tsx` - the JSDoc scopes the rule and names the Next 16.4 `headers()` fact and AR-12-02
- `.planning/phases/12-contact-edge-pages-cleanup-verification/12-SECURITY.md` - T-12-02 closed, AR-12-02 added, Open below threshold rewritten, first Unregistered flag closed by C1, audit-trail row, sign-off note

## Verification

- Task 1: `npx jest lib/__tests__/proxy.test.ts --silent`: 52 passed. `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/not-found.spec.ts --project=chromium`: 19 passed.
- Task 1 acceptance: `grep -c "value: 'prefetch'" proxy.ts` = 0. `grep -c "next-router-prefetch" proxy.ts` = 2. `grep -c "purpose" e2e/not-found.spec.ts` = 3.
- Task 2: Jest 52 passed (no edge-section test exists under option A). `npm run type-check` exit 0. `grep -c AR-12-02` gives proxy.ts 1, lib/edge-section.ts 1, app/not-found.tsx 1.
- Task 3: the verify prints `T-12-02 closed`. `grep -c "^| AR-12-02 |"` = 1. The Accepted By cell quotes "A (Recommended)". `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/not-found.spec.ts e2e/shell.spec.ts --project=chromium`: 52 passed. `git status --porcelain public/service-worker.js` prints nothing.
- Plan level: `npm run lint` exit 0. `npm run type-check` exit 0. `npx jest --silent`: 102 suites, 1672 tests passed. `PW_PROD=1 npx playwright test e2e/not-found.spec.ts e2e/shell.spec.ts e2e/audit.spec.ts --project=chromium --project=firefox --project=webkit` on a fresh build: 210 passed, 0 failed, 0 flaky. Afterwards I ran `git checkout -- public/service-worker.js`, and port 3000 is free.

## Expected visual diffs

none

## Decisions Made
- I kept the Plan column of the T-12-02 row as `12-02` (the plan that authored it) and named the 12-29 commits in the Evidence cell.
- I added a 12-29 row to the Security Audit Trail (70 total / 70 closed / 0 open) and a closing note to the Sign-Off approval line. The plan did not list these, but both would otherwise still say T-12-02 is open.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Ran the precondition and verify `node -e` one-liners from scratchpad .js files**
- **Found during:** Task 2 (precondition) and Task 3 (verify)
- **Issue:** On this Windows host the command-line round-trip halves the doubled backslashes inside the inline regexes (`replace(/\r/g,'')`). Run inline, the one-liners would not behave as written.
- **Fix:** I ran the same logic unchanged from `precond-12-29.js` and `verify-t1202.js` in the session scratchpad, with the same arguments. Output: `status=option A …`, exit 0, and `T-12-02 closed`.
- **Files modified:** none in the repo
- **Committed in:** n/a

**2. [Rule 1 - Bug] Refreshed 12-SECURITY.md evidence line numbers that 12-29's edits moved**
- **Found during:** Task 3
- **Issue:** The new import lines and the new describe in proxy.test.ts, plus the new comments in proxy.ts, lib/edge-section.ts and app/not-found.tsx, shifted lines that other register rows cite. Left alone, T-12-03 (`app/not-found.tsx:27`), T-12-04, T-12-05, T-12-40 and the self-fetch flag would point at the wrong lines.
- **Fix:** T-12-03 now cites `app/not-found.tsx:36`. T-12-04 cites `proxy.test.ts:163-168`, T-12-05 `:114-116,175-180`, T-12-40 `:84-107,163-180`, and the self-fetch flag `:394-445`. I checked each one against its old anchor with `git show de1a01b:`.
- **Files modified:** .planning/phases/12-contact-edge-pages-cleanup-verification/12-SECURITY.md
- **Committed in:** 9abf40a

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Neither changes behaviour. Both keep the plan's checks and the register accurate.

## Issues Encountered
- The plan predicted that the RED photo-miss case would fail on "the generic links". It actually failed on the empty `__next_error__` shell. The cause is the same (the proxy never ran), and the details are in RED evidence above.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness
- C1 is closed and T-12-02 is closed. 12-34 should record IN-02 as deferred (narrowed by option A, residual AR-12-02) and use the commit ledger above.
- No committed PNG changes: the not-found shots render the same body and links.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-03*

## Self-Check: PASSED

- Commits 16deede, 099fab7, 0b3b5c4, 9abf40a are ancestors of HEAD
- All six modified files exist; acceptance criteria and plan-level verification re-run green (see Verification)
