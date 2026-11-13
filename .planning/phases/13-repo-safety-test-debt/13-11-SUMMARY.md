---
phase: 13-repo-safety-test-debt
plan: 11
subsystem: testing
tags: [service-worker, contact, react-three-fiber, jest, playwright, ledger]

requires:
  - phase: 13-repo-safety-test-debt
    provides: "13-06 ledger triage, approved 2026-11-13 (12 IN-09, 12 IN-10 fix-now, owner 13-11; owner calls 07 WR-07 fix, 07 IN-08 GUARD-10)"
  - phase: 13-repo-safety-test-debt
    provides: "13-04 CLEAN-01 change to public/service-worker.js (the /_next/image condition removed)"
provides:
  - "storeCopy in public/service-worker.js catches synchronous throws (clone, waitUntil) as well as rejected puts (12 IN-09)"
  - "The name-too-long copy reads FEEDBACK_LIMITS.nameMax, with byte-identical output today (12 IN-10)"
  - "SafeCanvas logs non-WebGL errors as console.error('[SafeCanvas]', error) and stays silent for the no-WebGL fallback (07 WR-07)"
affects: [13-15, 13-22, phase-15]

actuals:
  tokens: 2259
  tasks: 2
  commits: 6
plan_head_before: f2cfd9ab24b503177cb3b4f82886325cb1ac1565
plan_head_after: ddd356c0aef86f8e3ca49cfea129664bcadda570

tech-stack:
  added: []
  patterns:
    - "Service-worker cache writes are best-effort end to end: sync throws and rejections are both caught inside storeCopy"
    - "A constant-driven copy is proven by mocking the constant in jest.isolateModules, while the existing rows pin today's exact string"

key-files:
  created: []
  modified:
    - public/service-worker.js
    - lib/__tests__/service-worker-media.test.ts
    - components/contact/SummitRegister.tsx
    - components/contact/__tests__/SummitRegister.test.tsx
    - components/SafeCanvas.tsx
    - components/__tests__/SafeCanvas.test.tsx

key-decisions:
  - "07 WR-07: the WebGL-unavailable case is detected by the text 'Error creating WebGL context', which both three.js WebGLRenderer messages contain and e2e/helpers/webgl.ts webglFailure already waits for; SafeCanvas had no prior detection to reuse"
  - "07 IN-08: not changed in 13-11, deferred to GUARD-10 (Phase 15) per Tim's call recorded in 13-LEDGER-TRIAGE.md ## Approval; no tsconfig.test.json, package.json type-check unchanged"

patterns-established:
  - "SafeCanvas console.error calls carry the '[SafeCanvas]' prefix, so tests can tell them from React's own caught-error logging"

requirements-completed: [VERIFY-07]

coverage:
  - id: D1
    description: "12 IN-09: a synchronous throw in storeCopy never replaces a good network answer (cache-first, network-first and navigation paths)"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "lib/__tests__/service-worker-media.test.ts#service worker cache writes: a synchronous throw in storeCopy (12 IN-09)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/service-worker-navigation.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "12 IN-10: the name-too-long copy reads FEEDBACK_LIMITS.nameMax and renders the same string today"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#builds the name-too-long copy from FEEDBACK_LIMITS.nameMax"
        status: pass
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#validateField rows pinning 'Shorten your name to 100 characters (now 101).' and '(now 1,234).'"
        status: pass
    human_judgment: false
  - id: D3
    description: "07 WR-07: SafeCanvas logs non-WebGL errors once, still forwards them to onCanvasError, and stays silent for the no-WebGL fallback; Home audit console check still clean"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "components/__tests__/SafeCanvas.test.tsx#logging (07 WR-07)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/audit.spec.ts --project=chromium -g \" /: axe\" (1 passed, no ALLOWED_CONSOLE change)"
        status: pass
    human_judgment: false
  - id: D4
    description: "No rendered pixel and no visible string changes"
    requirement: VERIFY-07
    verification: []
    human_judgment: true
    rationale: "Pixel neutrality is proven by Visual Regression on the mid-phase PR (13-15). The diff changes no className, JSX or text node; the one copy change produces the identical string (pinned by the existing validateField rows)"

duration: 13min
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 11: Contact, Service-Worker and Owner-Call Ledger Rows Summary

**`storeCopy` now catches synchronous `clone()`/`waitUntil` throws so a cache-side failure can never cost the visitor the network answer, the name-too-long copy follows `FEEDBACK_LIMITS.nameMax` with identical output, and `SafeCanvas` logs scene errors while staying silent for the expected no-WebGL fallback. 07 IN-08 is left for GUARD-10 (Phase 15).**

## Performance

- **Duration:** about 13 min
- **Started:** 2026-11-13, after f2cfd9a (12:42 +0100)
- **Completed:** 2026-11-13
- **Tasks:** 2
- **Files modified:** 6

## Row → commit table (for 13-22)

| Row | Tim's call / triage | Outcome | RED commit | GREEN commit |
|-----|---------------------|---------|------------|--------------|
| 12 IN-09 | approved (fix now, owner 13-11) | fixed | a3ae326 | b0844b9 |
| 12 IN-10 | approved (fix now, owner 13-11) | fixed | 9df5eb6 | 30a837d |
| 07 WR-07 | "approved: fix" (13-LEDGER-TRIAGE.md `## Approval`) | fixed | 18d444e | ddd356c |
| 07 IN-08 | "approved: GUARD-10 (new requirement, Phase 15)" (13-LEDGER-TRIAGE.md `## Approval`) | not changed: deferred to GUARD-10 (Phase 15) per Tim's call | none | none |
| 12 IN-08 | "approved: accept" | not this plan's row; left alone | none | none |

The 12 IN-09 fix (b0844b9) is its own commit, separate from 13-04's CLEAN-01 change to the same file.

## Accomplishments

- **12 IN-09:** `storeCopy` wraps `response.clone()` and `event.waitUntil(...)` in `try/catch`. Before, a sync throw inside `cacheFirst`/`networkFirst` was taken for a network failure (the answer became `undefined` or a cache match), and in `networkFirstNavigation` it rejected `respondWith`. Eight new harness cases (4 paths x 2 throw kinds) prove the network response comes back unchanged.
- **12 IN-10:** `` `Shorten your name to ${formatCount(FEEDBACK_LIMITS.nameMax)} characters (now ...)` ``. `formatCount(100)` is `"100"`, so the string is byte-identical today; the existing rows still pin it, and a new case mocks `nameMax` to 1500 to show the copy follows it.
- **07 WR-07:** `componentDidCatch` calls `console.error('[SafeCanvas]', error)` unless the message contains `Error creating WebGL context`, then forwards to `onError` as before. The fallback markup is unchanged.

## TDD Gate Compliance

| Row | RED evidence (TAP via scratchpad jest-tap-reporter, `--silent`) | Verdict | Semantic assessment |
|-----|------------------------------------------------------------------|---------|---------------------|
| 12 IN-09 | `.git/gsd-red-13-11-t1-in09.json`: exit 1, 21 tests, 8 failed | `RED_EVIDENCE_OK` (target_test_failed) | The target ran and failed on `toBe(response)` with `undefined`: `cacheFirst`'s catch took the `clone()` TypeError for a network error. The 7 sibling cases fail on the same missing guard (the navigation cases reject with the thrown error itself). The 13 existing tests pass. |
| 12 IN-10 | `.git/gsd-red-13-11-t1-in10.json`: exit 1, 66 tests, 1 failed | `RED_EVIDENCE_OK` (target_test_failed) | With `nameMax` mocked to 1500, the null case at 1500 passed (the check already reads the constant), and the copy assertion failed: expected `1,500`, received the literal `100`. |
| 07 WR-07 | `.git/gsd-red-13-11-t2-wr07.json`: exit 1, 10 tests, 1 failed | `RED_EVIDENCE_OK` (target_test_failed) | The boundary caught the TypeError and rendered the inert canvas, then the planned `ownLogs()` assertion failed with an empty list. The two no-WebGL silence cases pass at HEAD (nothing logs yet), as do the 7 existing tests. |

No REFACTOR commits were needed.

## Verification

- `npx jest lib/__tests__/service-worker-media.test.ts lib/__tests__/service-worker-navigation.test.ts components/contact/__tests__/SummitRegister.test.tsx`: 3 suites, 107 tests passed.
- The plan's node check prints `name copy reads nameMax`.
- `grep -c "Shorten your name to 100" components/contact/SummitRegister.tsx` = 0 (baseline 1); `grep -c "nameMax"` = 3 (baseline 2).
- `npm run type-check`: exit 0, no `error TS` line. `npm test`: 105 suites, 1757 tests passed.
- `PW_PROD=1 npx playwright test e2e/audit.spec.ts --project=chromium -g " /: axe"`: 1 passed (Home at 375, 768 and 1440 with its console check), no ALLOWED_CONSOLE entry added.
- ESLint is clean on the touched source and test files.

## Decisions Made

- WebGL-unavailable detection uses the message text `Error creating WebGL context`. The plan said to reuse "the same detection the fallback already uses", but SafeCanvas had none (the boundary fell back on any error). This text is in both three.js `WebGLRenderer` throws (`node_modules/three/src/renderers/WebGLRenderer.js:419,423`) and is what `e2e/helpers/webgl.ts` `webglFailure` already matches.
- 07 IN-08: not changed: deferred to GUARD-10 (Phase 15) per Tim's call. No `tsconfig.test.json` was created and `package.json` `type-check` is still `tsc --noEmit`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong assertion in the 12 IN-09 RED case**
- **Found during:** Task 1 GREEN
- **Issue:** The RED cases also asserted `cache.put` was never called. In the `waitUntil`-throws case the `caches.open().then(put)` chain is built as `waitUntil`'s argument before `waitUntil` throws, so the put still runs (and is caught). That is harmless; the row's behaviour is the network answer.
- **Fix:** Dropped the `cache.put` assertion; the cases assert that `respondWith` resolves to the same response with `ok: true, status: 200`.
- **Files modified:** lib/__tests__/service-worker-media.test.ts
- **Commit:** b0844b9

**2. [Plan note] SafeCanvas.test.tsx already existed**
- The plan listed `components/__tests__/SafeCanvas.test.tsx` as new. It already held 7 tests, so the WR-07 cases were added to it as a `logging (07 WR-07)` block.

## Issues Encountered

- The production build for the audit run rewrote `public/service-worker.js` (postbuild hash and PRECACHE list only). It was restored with `git checkout -- public/service-worker.js` and not committed. Playwright stopped its own `next start`, and port 3000 is free.
- `npx prettier --check` reports style issues on the four touched files; all four already failed it at f2cfd9a, and lint does not run Prettier. Out of scope.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- 13-22 can record 12 IN-09, 12 IN-10 and 07 WR-07 as `fixed` with the commits above, and 07 IN-08 as `deferred` to GUARD-10.
- Pixel neutrality is still to be proven by Visual Regression on the mid-phase PR (13-15).

## Self-Check: PASSED

- Commits a3ae326, b0844b9, 9df5eb6, 30a837d, 18d444e, ddd356c are ancestors of HEAD.
- All six modified files exist; `tsconfig.test.json` is absent and `package.json` is unchanged, as intended.
