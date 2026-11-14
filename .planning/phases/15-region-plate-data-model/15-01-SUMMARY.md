---
phase: 15-region-plate-data-model
plan: 01
subsystem: testing
tags: [typescript, jest, "@jest/globals", jest-dom, playwright, tsconfig, type-check]

requires:
  - phase: 14
    provides: the test suites and e2e specs this plan puts under a type-check
provides:
  - "Phase-base client JS total (1,850,382 bytes, 24 files at 05d736a) for the 15-11 / 15-16 client-chunk budget"
  - "@jest/globals ^30.5.2 as a direct devDependency"
  - "__tests__/jest-globals.d.ts: Jest globals typed from @jest/globals plus jest-dom matchers"
  - "tsconfig.jest.json and tsconfig.e2e.json child configs (both override exclude)"
  - "GUARD-10 canary test (TS2578 if the globals degrade to any)"
  - "npm run type-check covers the e2e specs and both Playwright configs with zero errors"
  - "Jest-scope errors down from 99 to 49 in 19 files (hand-over to 15-02)"
affects: [15-02, 15-03, 15-11, 15-16]

actuals:
  tokens: 5900
  tasks: 2
  commits: 2
plan_head_before: 05d736ac0e47b94d6435ce27c555a90f79906dd5
plan_head_after: b8aa04589f250d0a23dcbf93a4fa601786f3d023

tech-stack:
  added: ["@jest/globals 30.5.2 (direct devDependency; already installed transitively)"]
  patterns:
    - "Typed mocks: jest.mocked(import) for jest.mock'ed modules, jest.fn<RealSignature>() otherwise"
    - "Child tsconfigs extend tsconfig.json and always override exclude"
    - "Globals d.ts lives in a root __tests__/ folder; jest.config.js ignores .d.ts files"

key-files:
  created:
    - __tests__/jest-globals.d.ts
    - tsconfig.e2e.json
    - tsconfig.jest.json
    - lib/__tests__/jest-globals-canary.test.ts
  modified:
    - package.json
    - package-lock.json
    - jest.config.js
    - e2e/home-canvas.spec.ts
    - app/api/__tests__/feedback.test.ts
    - components/contact/__tests__/SummitRegister.test.tsx
    - components/contact/__tests__/CopyEmailButton.test.tsx
    - lib/__tests__/rate-limit.test.ts

key-decisions:
  - "@jest/globals uses the same range as jest (^30.5.2), not an exact pin (planner decision, carried out as written)"
  - "The Upstash limit mock is typed as Ratelimit['limit'] (what it stands in for), not as the app's RateLimitResult"
  - "The Redis constructor mock is typed from RedisConfigNodejs: ConstructorParameters<typeof Redis> picks the last overload (Requester), which is not the call lib/rate-limit.ts makes"
  - "SummitRegister's fetch mock is typed to the Response subset the register reads (FetchAnswer), keeping the existing typeof fetch assignment"

patterns-established:
  - "Pattern: a spy with no implementation passes an explicit no-op: mockImplementation(() => {})"
  - "Pattern: the @ts-expect-error canary is the one allowed deliberate-wrong-input directive for GUARD-10"

requirements-completed: [GUARD-10]

coverage:
  - id: D1
    description: "Phase-base client JS total recorded before any Phase 15 edit"
    requirement: GUARD-10
    verification:
      - kind: other
        ref: "node one-liner over .next/static/chunks after rm -rf .next/static && npm run build (see Phase-base client JS)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Jest globals typed from @jest/globals and proven typed by the canary"
    requirement: GUARD-10
    verification:
      - kind: unit
        ref: "lib/__tests__/jest-globals-canary.test.ts#the Jest globals are typed, not any (GUARD-10 canary)"
        status: pass
      - kind: other
        ref: "npx tsc -p tsconfig.jest.json (no TS2578; 49 errors)"
        status: pass
    human_judgment: false
  - id: D3
    description: "npm run type-check runs the app and e2e configs with zero errors; the e2e config lists 36 e2e files"
    requirement: GUARD-10
    verification:
      - kind: other
        ref: "npm run type-check"
        status: pass
      - kind: other
        ref: "npx tsc -p tsconfig.e2e.json --listFilesOnly | grep -c /e2e/ (36)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Four mock-heavy test files type-check with mocks typed from real signatures; their 155 tests pass unchanged"
    requirement: GUARD-10
    verification:
      - kind: unit
        ref: "npx jest app/api/__tests__/feedback.test.ts components/contact/__tests__/SummitRegister.test.tsx components/contact/__tests__/CopyEmailButton.test.tsx lib/__tests__/rate-limit.test.ts (155 passed)"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-11-14
status: complete
---

# Phase 15 Plan 01: Jest globals typed, e2e type-checked, first 50 test errors fixed Summary

**`@jest/globals`-typed Jest globals with a TS2578 canary, `tsconfig.jest.json` / `tsconfig.e2e.json` children, e2e specs inside `npm run type-check` at zero errors, and the untyped-mock family fixed in four test files (Jest-scope errors 99 to 49)**

## Performance

- **Duration:** 9 min
- **Started:** 2026-11-14T20:01:03Z
- **Completed:** 2026-11-14T20:10:30Z
- **Tasks:** 2
- **Files modified:** 12

## Phase-base client JS

Measured before any Phase 15 edit and before the install, at HEAD `05d736ac0e47b94d6435ce27c555a90f79906dd5`:

- **Total: 1,850,382 bytes in 24 `.js` files under `.next/static/chunks/`**
- Procedure: `rm -rf .next/static && npm run build`, then the script below from the repo root, then `git restore public/service-worker.js`.

```bash
node -e "const fs=require('fs'),p=require('path');let t=0,n=0;(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=p.join(d,e.name);if(e.isDirectory())w(f);else if(f.endsWith('.js')){t+=fs.statSync(f).size;n++}}})('.next/static/chunks');console.log(t+' bytes in '+n+' files')"
```

15-11 and 15-16 rerun the same procedure; the phase budget is at most 1,854,478 bytes (base + 4,096).

## Accomplishments

- `@jest/globals ^30.5.2` is a direct devDependency, installed with the bundled npm 11.20.0. The lockfile diff is a single line in the root package's devDependencies block (the `node_modules/@jest/globals` entry already existed at 30.5.2 with `dev: true`).
- `__tests__/jest-globals.d.ts` types the nine globals and a types-only `jest` namespace (Mock, Mocked, MockedFunction, Spied, SpiedFunction). `SpyInstance` is not aliased. `@types/jest` is not installed.
- The canary (`lib/__tests__/jest-globals-canary.test.ts`) passes at runtime, and its `@ts-expect-error` is used: `tsc -p tsconfig.jest.json` prints no TS2578.
- `tsconfig.e2e.json` checks 36 e2e files and both Playwright configs. `tsconfig.jest.json` covers every `__tests__` file plus the globals d.ts. `tsconfig.json` is byte-unchanged.
- `npm run type-check` is `tsc --noEmit && tsc -p tsconfig.e2e.json` and exits 0. The one e2e error (`home-canvas.spec.ts:1004`) is fixed with `querySelector<HTMLCanvasElement>`, not a cast.
- `jest.config.js` ignores `\\.d\\.ts$`, and `npx jest --listTests` does not list the d.ts (106 suites).
- The 50 errors in feedback (18), SummitRegister (15), CopyEmailButton (4) and rate-limit (13) are fixed. `tsc -p tsconfig.jest.json` now reports exactly 49 errors in 19 files, none in these four files or the canary.

## Task Commits

1. **Task 1: Jest globals typed and the e2e config type-checked** - `5ad2239` (feat)
2. **Task 2: Fix the untyped-mock errors in the four mock-heavy test files** - `b8aa045` (fix)

**Plan metadata:** see the docs(15-01) commit that adds this file

## Files Created/Modified

- `__tests__/jest-globals.d.ts` - the Jest globals from `@jest/globals`, plus the jest-dom `jest-globals` matcher augmentation
- `tsconfig.jest.json` - Jest tests plus the globals file; overrides `exclude`
- `tsconfig.e2e.json` - e2e specs and both Playwright configs, no Jest globals; overrides `exclude`
- `lib/__tests__/jest-globals-canary.test.ts` - the GUARD-10 canary
- `package.json` / `package-lock.json` - the `@jest/globals` devDependency; `type-check` adds the e2e config
- `jest.config.js` - `.d.ts` added to `testPathIgnorePatterns`
- `e2e/home-canvas.spec.ts` - the canvas query is typed as `HTMLCanvasElement`
- `app/api/__tests__/feedback.test.ts` - `jest.mocked()` on the three mocked imports; console spies get explicit no-ops
- `components/contact/__tests__/CopyEmailButton.test.tsx` - `writeText` mocks typed `Clipboard['writeText']`
- `components/contact/__tests__/SummitRegister.test.tsx` - `FetchAnswer` interface; fetch mock and captured resolvers typed from it
- `lib/__tests__/rate-limit.test.ts` - `Ratelimit['limit']` limit mock, `RedisConfigNodejs` constructor type, `jest.Spied<typeof console.error>`, explicit `slidingWindow` type, explicit no-ops

## Lockfile diff (acceptance record)

```diff
@@ -30,6 +30,7 @@
       },
       "devDependencies": {
         "@axe-core/playwright": "4.14.0",
+        "@jest/globals": "^30.5.2",
         "@playwright/test": "^1.65.0",
         "@testing-library/dom": "^10.4.2",
         "@testing-library/jest-dom": "^7.0.1",
```

## Verification results

| Check | Expected | Result |
|-------|----------|--------|
| `npm run type-check` | exit 0, no `error TS` | exit 0, 0 |
| `tsc -p tsconfig.e2e.json --listFilesOnly \| grep -c /e2e/` | >= 36 | 36 |
| `tsc -p tsconfig.jest.json` after Task 1 | 99, no TS2578 | 99, 0 |
| `tsc -p tsconfig.jest.json` after Task 2 | 49, none in the four files | 49 in 19 files, 0 in the four |
| canary Jest run | 1 passed | 1 passed |
| `jest --listTests` lists the d.ts | 0 | 0 |
| four files' "Tests:" total, before / after | equal | 155 / 155 |
| `grep -c '"@jest/globals": "\^30.5.2"' package.json` | 1 | 1 |
| lockfile bound check | exit 0 | exit 0 |
| `grep -cF 'd\\.ts$' jest.config.js` | 1 | 1 (see Issues) |
| `git diff --quiet HEAD -- tsconfig.json` | exit 0 | exit 0 |
| `grep -c "tsc -p tsconfig.e2e.json" package.json` | 1 | 1 |
| Task 2 commit adds no `@ts-ignore` / `as any` / `: any` / `<any>` | none | none |
| Task 2 commit adds no `@ts-expect-error` | none | none |
| eslint on every touched test file | exit 0 | exit 0 |

## Decisions Made

- The Upstash `limit` mock in `rate-limit.test.ts` is typed `Ratelimit['limit']`, the method it replaces, rather than the plan's example `() => Promise<RateLimitResult>`. The test's resolved values carry `pending` and `reason`, which belong to Upstash's response, not to the app's result type.
- The Redis constructor type is `(config: RedisConfigNodejs) => Redis`. The old annotation `ConstructorParameters<typeof RealRedis>[0]` resolved to the `Requester` overload, so it was replaced at the one site that used it (line 366).
- In SummitRegister, the fetch mock is typed to a `FetchAnswer` interface (ok, status, `headers.get` returning `string | null` like the real `Headers.get`, `json`). The existing `global.fetch = fetchMock as unknown as typeof fetch` line stays as it was. jsdom has no `Response`, so a `typeof fetch` mock would have needed a cast at every `answer()`.

## Deviations from Plan

None. The plan was executed as written; the type choices above are what its "type the mock from the real signature" instruction calls for.

**Total deviations:** 0
**Impact on plan:** none.

## Issues Encountered

- **Bash tool backslash halving:** run inline, the acceptance command `grep -cF 'd\\.ts$' jest.config.js` printed 0. The Bash tool halves a doubled backslash on its way into bash, so grep received `d\.ts$`. The file bytes are `'\\.d\\.ts$'` (checked with `od -c`). The same command written verbatim into a script file and run with bash prints 1. The worktree-path-safety reference documents the same Windows round-trip. Nothing is wrong in the repo; anyone rerunning this check from the tool should use a script file.
- **Prettier drift:** the touched test files, `e2e/home-canvas.spec.ts` and `jest.config.js` were already not Prettier-clean at HEAD, and Prettier is not part of `npm run lint`. Only the lines this plan added were formatted to Prettier's output; pre-existing drift was left alone (out of scope).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 15-02 inherits exactly 49 Jest-scope errors in 19 files (causes D, F, E and C remain, plus G and H).
- 15-03 adds `tsc -p tsconfig.jest.json` to `type-check` once the count is 0.
- 15-11 and 15-16 measure client-chunk growth against 1,850,382 bytes.

---
*Phase: 15-region-plate-data-model*
*Completed: 2026-11-14*

## Self-Check: PASSED

- FOUND: `__tests__/jest-globals.d.ts`, `tsconfig.e2e.json`, `tsconfig.jest.json`, `lib/__tests__/jest-globals-canary.test.ts`
- FOUND: commits `5ad2239`, `b8aa045` (ancestors of HEAD)
- Acceptance criteria for both tasks re-run: all PASS
