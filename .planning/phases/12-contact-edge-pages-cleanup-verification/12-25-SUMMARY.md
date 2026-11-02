---
phase: 12-contact-edge-pages-cleanup-verification
plan: 25
subsystem: data
tags: [identity, guard, seo, contact, privacy, jest]

requires:
  - phase: 12-01
    provides: "Resolved values: geo.location supplied (47.37 N · 8.54 E · Zürich)"
  - phase: 12-09
    provides: "site.url (D-13) and the required Site.url type"
  - phase: 12-11
    provides: "Ordering only: the ci/12-11 baseline round is closed before this plan moves HEAD"
provides:
  - "guard:identity url rule: https origin, no trailing slash/path/port, never localhost or example.com"
  - "bad-url identity selftest fixture and case"
  - "data/__tests__/site.test.ts: site.url shape and the 2-decimal location rule"
  - "Optional Site.location type and site.location (Zürich, 47.37, 8.54, cited source)"
affects: [12-16 Contact panel Location row, 12-19 round 2, tlui.de canonical switch]

actuals:
  tokens: 4300
  tasks: 2
  commits: 4
plan_head_before: d5c7e71b4f9593cbda0af57712d26a94b1ed4230
plan_head_after: 11cf575466b18280cb3744b671037881bc3ed5bd

tech-stack:
  added: []
  patterns:
    - "Identity fields guarded by literal(source, key) in check-identity.mjs plus a bad-* fixture each"
    - "Single-reason identity selftest cases pin their violation count"

key-files:
  created:
    - data/__tests__/site.test.ts
    - scripts/guards/__selftest__/identity/bad-url/ (tree copied from good/)
  modified:
    - scripts/guards/check-identity.mjs
    - scripts/guards/selftest.mjs
    - scripts/guards/__selftest__/identity/{good,bad-author,bad-email,bad-former-dead-files,bad-linkedin,bad-placeholder,bad-wordmark}/data/site.ts
    - data/types.ts
    - data/site.ts

key-decisions:
  - "The url rule is host-agnostic (^https://[a-z0-9.-]+[a-z0-9]$, no localhost, no example.com), so the deferred www.tlui.de switch passes without a guard change; site.url stays on the vercel.app host"
  - "site.location stores Zürich at lat 47.37, lon 8.54 from the 12-01 geo.location row; nothing more precise is stored (D-01)"
  - "Single-reason identity selftest cases now pin 'identity: 1 violations' (bad-linkedin: 2), so a fixture missing a field cannot pass by failing for an extra reason"

patterns-established:
  - "A new identity field gets a literal() read, a header-comment line, a bad-<field> fixture, and the field on every existing fixture"

requirements-completed: [CONTACT-01, SEO-01]

coverage:
  - id: D1
    description: "guard:identity fails a non-https, trailing-slash, localhost or example.com base url, with a bad-url selftest case; older bad-* cases still fail only for their own reason"
    requirement: SEO-01
    verification:
      - kind: unit
        ref: "npm run guard:selftest (87/87, incl. 'identity: an http, trailing-slash example.com base url in data/site.ts fails the url rule (D-13)')"
        status: pass
      - kind: other
        ref: "npm run lint (exit 0, identity: OK)"
        status: pass
    human_judgment: false
  - id: D2
    description: "site.url pinned to an https origin without a trailing slash, naming neither localhost nor example.com"
    requirement: SEO-01
    verification:
      - kind: unit
        ref: "data/__tests__/site.test.ts#site.url (D-13)"
        status: pass
    human_judgment: false
  - id: D3
    description: "site.location is { name 'Zürich', lat 47.37, lon 8.54, source } stored at 2 decimals at most, from Tim's confirmed 12-01 row"
    requirement: CONTACT-01
    verification:
      - kind: unit
        ref: "data/__tests__/site.test.ts#site.location (D-01, CONTACT-01)"
        status: pass
      - kind: other
        ref: "npm run type-check (exit 0)"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 25: Identity URL Guard and Zürich Location Summary

**guard:identity now rejects any base URL that is not a bare https origin (or names localhost or example.com), with a bad-url selftest; the identity record gains the optional `Site.location`, set to Zürich at 47.37 N / 8.54 E and pinned to 2 decimals by a data test.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-11-02T22:03:48Z
- **Completed:** 2026-11-02T22:11:13Z
- **Tasks:** 2
- **Files modified:** 18 (6 of them the new bad-url fixture tree)

## geo.location row used

Quoted from `12-01-SUMMARY.md` `## Resolved values`:

```
| geo.location | supplied | `47.37 N · 8.54 E · Zürich` (source: Wikipedia "Zurich" infobox, 47.37444 N 8.54111 E, rounded to 2 decimals) |
```

Tim's packet answer was "B: confirm". The row is supplied, so `site.location` is present and 12-16 renders the Location row.

## Accomplishments

- `check-identity.mjs` reads `literal(source, 'url')` beside name, email, github and linkedin. A url that is not an https origin without a trailing slash, path or port, or that names localhost or example.com, fails with `data/site.ts: url "<value>" is not an https origin without a trailing slash, or names localhost or example.com`. The header comment's `site:` line documents the rule.
- The rule doesn't hard-code a host. Spot-checked against a temp copy of the good fixture: `https://www.tlui.de` passes, while `https://localhost`, `https://www.tlui.de/`, `https://x.example.com` and `https://a.b:3000` all fail.
- The new `bad-url/` fixture (copied from `good/`, url `'http://example.com/'`) fails with exactly that one violation. The good fixture and all six older bad-* fixtures now carry `url: 'https://portfolio-app-mocha-three.vercel.app'`.
- `data/__tests__/site.test.ts` (6 cases) checks the url shape and the location. The location must exist, be named 'Zürich', sit at 47.37 / 8.54, pass `Math.round(x * 100) / 100 === x` for lat and lon, and have a non-empty name and source.
- `Site.location?: { name; lat; lon; source }` has JSDoc stating D-01's 2-decimal rule. `site.location` holds the cited Wikipedia source string.

## Task Commits

1. **Task 1: The identity guard covers site.url**
   - RED `06898aa` (test): bad-url selftest case and fixture, site.url shape test
   - GREEN `c3960a4` (feat): url rule, url on all fixtures, pinned violation counts
2. **Task 2: The Zürich location record, stored at 2 decimals at most**
   - RED `e48204b` (test): location cases
   - GREEN `11cf575` (feat): `Site.location` type and `site.location`

No REFACTOR commits were needed.

## TDD Gate Compliance

- **Task 1 RED:** `npm run guard:selftest` gave `86/87`. The one FAIL was the target case: `identity: an http, trailing-slash example.com base url ... fails the url rule (D-13)`, which reported `expected exit 1, got 0` and that the output lacked the url line. The fixture loaded, and the guard ran and printed `identity: OK`, so the planned assertion failed for the intended reason. The url data test passed at RED because 12-09 had already added `site.url`. The missing behaviour was the guard rule, not the value.
- **Task 2 RED:** Jest gave `2 failed, 4 passed`. Both failures are the planned assertions: presence/name (`Received: undefined`) and coordinates (`Expected: 47.37, Received: undefined`). The two conditional cases passed vacuously while the key was absent, by design. tsc also failed at RED (`location` was not yet on `Site`), which was expected.
- **Machine classifier:** not run. The selftest output is a custom PASS/FAIL format and Jest's default reporter is not TAP or JUnit, so neither has a `tdd-red-evidence` adapter. `workflow.tdd_mode` is not enabled in config, so the strict gate does not apply. The evidence above is semantic, taken from the real runs.
- **Gate order:** each task has its `test(12-25)` commit before its `feat(12-25)` commit, and each feat descends from its test commit.

## Files Created/Modified

- `scripts/guards/check-identity.mjs`: `URL_SHAPE`, the url read and violation, and the header line
- `scripts/guards/selftest.mjs`: the bad-url case. bad-linkedin's line expectation moves from 8 to 9, and violation counts are pinned on the single-reason cases.
- `scripts/guards/__selftest__/identity/bad-url/`: new fixture tree
- `scripts/guards/__selftest__/identity/*/data/site.ts` (7 files): a valid url line
- `data/__tests__/site.test.ts`: new data test
- `data/types.ts`: optional `location` on `Site`
- `data/site.ts`: the `location` record

## Decisions Made

- I didn't touch `site.url`. It stays `https://portfolio-app-mocha-three.vercel.app` (D-13; the tlui.de switch is deferred).
- The location sits after `nav` in `data/site.ts`. The guard's `literal(source, 'name')` takes the first `name:` it finds, and that is still `'Tim Lui'`, not the location's `'Zürich'` (guard prints `identity: OK`).
- I didn't change `lib/home-format.ts`. 12-16 reads the location through `formatLatLon(pos, { decimals: 2 })`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] bad-linkedin's expected line number moved**
- **Found during:** Task 1 GREEN
- **Issue:** Adding the url line to every fixture moved the bare LinkedIn href in `bad-linkedin/data/site.ts` from line 8 to line 9. Its selftest expectation `data/site.ts:8 forbidden ...` then failed.
- **Fix:** Changed the expectation to `:9`, with a comment explaining why, and added `identity: 2 violations` (its two real reasons). The test was rewritten, not deleted.
- **Files modified:** `scripts/guards/selftest.mjs`
- **Verification:** selftest 87/87
- **Committed in:** `c3960a4`

**2. [Rule 2 - Missing critical] Violation counts pinned on the single-reason identity cases**
- **Found during:** Task 1 GREEN
- **Issue:** A must-have says each existing bad-* case still fails *only* for its own reason. The old expectations checked only that their own line appeared, so a fixture that lacked the url would still have passed while failing for a second reason.
- **Fix:** Added `'identity: 1 violations'` to bad-placeholder, bad-wordmark, bad-author and bad-email, and to the new bad-url case. bad-former-dead-files already pinned `2 violations`.
- **Files modified:** `scripts/guards/selftest.mjs`
- **Verification:** each fixture run by hand reports exactly one violation, its own. selftest 87/87.
- **Committed in:** `c3960a4`

**3. [Ordering] bad-url fixture committed in RED rather than GREEN**
- **Found during:** Task 1 RED
- **Issue:** Without the fixture, the RED case would have failed on a missing root (package.json and site.ts not found). That is a fixture fault, not the planned assertion.
- **Fix:** Created `bad-url/` (test data) in the RED commit, so RED failed only because the guard lacked the rule.
- **Committed in:** `06898aa`

---

**Total deviations:** 3 (1 blocking, 1 missing-critical test strengthening, 1 commit-ordering)
**Impact on plan:** All three stay inside the plan's files and goal. None changes production behaviour beyond the plan.

## Issues Encountered

- My first attempt at the guard edit was a Node string-replace script. Shell escaping mangled the regex literal, so the script found no match and aborted before writing anything. I redid it with the Edit tool. No file was left partly changed.

## Verification

- `npx jest data/__tests__/site.test.ts --silent`: 6/6 pass
- `npm run guard:selftest`: 87/87 (86/86 at the plan's base HEAD, so one more passing case)
- `npm run lint`: exit 0, `identity: OK`. The 9 warnings are pre-existing, in `components/AnimatedGradientMesh.tsx` and `lib/useProgressiveTextures.ts`.
- `npm run type-check`: exit 0
- `npx jest --silent`: 96 suites, 1577 tests, all pass
- Acceptance checks:
  - `grep -c "literal(source, 'url')" scripts/guards/check-identity.mjs` gives 1
  - `ls scripts/guards/__selftest__/identity` lists bad-url (8 folders)
  - `grep -c "location?:" data/types.ts` gives 1
  - `grep -c "location: {" data/site.ts` gives 1
- No server was started, and port 3000 is free.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 12-16 can read `site.location` through `formatLatLon(..., { decimals: 2 })` and render the Location row.
- When www.tlui.de goes live, changing `site.url` needs no guard or test change (see deferred-items.md).
- This plan moves no pixels. Round 2 in 12-19 confirms that.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*

## Self-Check: PASSED

- Files: data/__tests__/site.test.ts, scripts/guards/__selftest__/identity/bad-url/data/site.ts, 12-25-SUMMARY.md all present
- Commits: 06898aa, c3960a4, e48204b, 11cf575 all ancestors of HEAD; no file deletions in any task commit
