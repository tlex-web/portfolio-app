---
phase: 15-region-plate-data-model
plan: 03
subsystem: testing
tags: [typescript, jest, type-check, guards, test-count, lint]
status: complete

requires:
  - phase: 15-02
    provides: "Jest-scope errors down to 9, one per file, and the jest.Spied / MediaQueryList-fake / tuple it.each patterns"
provides:
  - "test-count.mjs --scan-only (guard:tests:scan), the last step of npm run lint: a .only( / .skip( / .fixme( under e2e/ or a unit-test folder now fails locally"
  - "npm run type-check covers the app, tsconfig.jest.json and tsconfig.e2e.json at zero errors (GUARD-10 / D-25)"
  - "The last 9 Jest-scope errors fixed at their cause, with no any, ignore directive or new @ts-expect-error"
affects: [15-04, 15-05, 15-06, 15-07, 15-08, 15-09, 15-10, 15-11, 15-12, 15-13, 15-14, 15-15, 15-16]

actuals:
  tokens: 3500
  tasks: 3
  commits: 3
plan_head_before: 1978006aa671a08fb5e5e8c0cf582cadd0669df8
plan_head_after: 68a183c56c6e9f03370701fd368f8a6e11e85872

tech-stack:
  added: []
  patterns:
    - "Mocks of browser APIs are typed from the real API: jest.fn<typeof window.requestIdleCallback>, jest.Mock<typeof window.matchMedia>"
    - "Expected values that need a type are typed constants (const expected: T[] = ...), not a type argument to toEqual (it takes none in Jest 30)"
    - "Record<PhotoId, ...> lookups take a key found among the typed photo ids, and fail loudly when the id is unknown"
    - "Union fields are read after narrowing on the discriminant (source === 'hand-placed'), with a throw on the unreachable branch"

key-files:
  created: []
  modified:
    - scripts/guards/test-count.mjs
    - scripts/guards/selftest.mjs
    - scripts/README.md
    - package.json
    - components/home/__tests__/terrain-stage.test.tsx
    - components/home/__tests__/pin-layer-3d.test.tsx
    - components/projects/__tests__/DemoTerminal.test.tsx
    - lib/__tests__/service-worker-navigation.test.ts
    - lib/__tests__/saved-pages.test.ts
    - components/projects/__tests__/Metrics.test.tsx
    - components/projects/__tests__/sections.test.tsx
    - data/__tests__/editorial.test.ts
    - data/__tests__/photos.test.ts

key-decisions:
  - "15-03: --scan-only also rejects an explicit --baseline, so its usage message '--scan-only takes only --root' is literally true (the plan named only --jest, --list and --update)"
  - "15-03: service-worker-navigation respondWith is typed (answer: Promise<unknown>) => void, the shape the worker calls with, not FetchEvent['respondWith'], because the test hands it fake responses"
  - "15-03: editorial.test keeps iterating views and looks each view id up among the PhotoId-typed photo ids, so iteration order and coverage are unchanged"

patterns-established:
  - "Pattern: a local guard that mirrors one CI check runs as a separate --scan-only branch that rejects the CI flags, so the CI ratchet path stays byte-for-byte the same"

requirements-completed: [GUARD-10]

coverage:
  - id: D1
    description: "test-count --scan-only runs as guard:tests:scan at the end of npm run lint; focused tree fails, clean tree passes, --jest is rejected; GUARD-03 path unchanged"
    requirement: GUARD-10
    verification:
      - kind: other
        ref: "npm run guard:selftest -> 219/219, 3 PASS rows 'test-count: --scan-only'"
        status: pass
      - kind: other
        ref: "npm run guard:tests:scan -> 'test-count: scan OK', exit 0"
        status: pass
      - kind: other
        ref: "node scripts/guards/test-count.mjs --scan-only --root <scratch tree with test.fixme( in e2e/> -> exit 1"
        status: pass
      - kind: other
        ref: "node scripts/guards/test-count.mjs --jest jest-missing.json -> exit 1 with the existing read error"
        status: pass
    human_judgment: false
  - id: D2
    description: "Five mock/hook/type-argument errors fixed (pin-layer-3d, terrain-stage, DemoTerminal, service-worker-navigation, saved-pages); 86 tests pass before and after"
    requirement: GUARD-10
    verification:
      - kind: other
        ref: "npx tsc -p tsconfig.jest.json | grep -cE 'terrain-stage.test|pin-layer-3d.test|DemoTerminal.test|service-worker-navigation.test|saved-pages.test' -> 0"
        status: pass
      - kind: unit
        ref: "npx jest <five files> -> 5 suites, 86 passed (86 before)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Four fixture/narrowing errors fixed (Metrics, sections, editorial, photos) and type-check runs all three configs at zero errors; full Jest suite green"
    requirement: GUARD-10
    verification:
      - kind: other
        ref: "npm run type-check -> exit 0, 0 'error TS' lines"
        status: pass
      - kind: other
        ref: "npx tsc -p tsconfig.jest.json | grep -c 'error TS' -> 0"
        status: pass
      - kind: unit
        ref: "npx jest -> 106 suites, 1798 passed, 0 skipped, 0 todo"
        status: pass
      - kind: other
        ref: "npm run lint -> exit 0 (ends with guard:tests:scan 'scan OK')"
        status: pass
    human_judgment: false
  - id: D4
    description: "No silencing across GUARD-10 (d29ea9a..HEAD): no @ts-ignore / as any / : any / <any> added, and the only @ts-expect-error added in the phase carries a reason"
    requirement: GUARD-10
    verification:
      - kind: other
        ref: "git diff d29ea9a..HEAD -- '*.ts' '*.tsx' added-line gates (both acceptance commands) -> exit 0"
        status: pass
    human_judgment: false

duration: 7 min
completed: 2026-11-14
---

# Phase 15 Plan 03: Local focus/skip scan and three-config type-check Summary

**`npm run lint` now ends with `test-count.mjs --scan-only`, so a `.only(` / `.skip(` / `.fixme(` in `e2e/` fails locally instead of only in CI. The last nine Jest-scope type errors are fixed from real signatures, and `npm run type-check` runs the app, Jest and e2e configs with zero errors.**

## Performance

- **Duration:** about 7 min
- **Started:** 2026-11-14T20:24:52Z
- **Completed:** 2026-11-14T20:31:53Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- Task 1 (tracer): `--scan-only` is its own branch in `test-count.mjs`. It runs before any Jest read or `playwright test --list` spawn, prints `test-count: FAIL <hit>` per hit, and ends with `test-count: scan OK` (exit 0) or `test-count: <n> focused/skipped call(s)` (exit 1). With `--jest`, `--list`, `--update` or `--baseline` it stops with `--scan-only takes only --root`. `guard:tests:scan` is the last step of `lint`. Three selftest cases cover the focused fixture, the clean fixture and the `--jest` rejection, and `scripts/README.md` has the new bullet. The ratchet path, its messages and exit codes are unchanged. Tracer gate: verify re-run green (scan OK, 3 PASS rows, 219/219), then expansion.
- The 13-20 gap is closed. A scratch tree with `test.fixme(` in `e2e/a.spec.ts` fails `--scan-only` with `e2e/a.spec.ts:2: focused/skipped call ".fixme("`. The regex is the same one CI's `guard:tests` uses.
- Task 2: each of the five errors got one fix. `pin-layer-3d`: the `beforeEach` body is braced. `terrain-stage`: `requestIdle` is `jest.fn<typeof window.requestIdleCallback>`. `DemoTerminal`: the fake is `jest.Mock<typeof window.matchMedia>` returning `MediaQueryList`. `service-worker-navigation`: `respondWith` is `jest.Mock<RespondWith>`. `saved-pages`: the expected value is a typed `SavedPageRow[]` constant.
- Task 3: the `box` fixtures in `Metrics` and `sections` now carry `links: { github: 'https://github.com/tlex-web/box' }`, the real project's value. `editorial` indexes `editorial[...]` with a `PhotoId` it finds in the photo ids. `photos` narrows the position union on `source === 'hand-placed'` before it reads `reason`. `type-check` is `tsc --noEmit && tsc -p tsconfig.jest.json && tsc -p tsconfig.e2e.json`.

## Jest totals (GUARD-03)

| Files | Before | After |
|-------|--------|-------|
| Task 2 (5 files) | 5 suites, 86 passed | 5 suites, 86 passed |
| Task 3 (4 files) | no `it`/`test`/`describe` line changed (diff check) | 4 suites, 118 passed |
| Full suite | - | 106 suites, 1798 passed, 0 skipped, 0 todo |

## Task Commits

1. **Task 1: focus/skip scan in npm run lint (`--scan-only`)**: `7c07140` (feat)
2. **Task 2: five mock, hook and type-argument errors**: `99fc3f7` (fix)
3. **Task 3: four fixture and narrowing errors, three-config type-check**: `68a183c` (fix)

## Files Created/Modified

- `scripts/guards/test-count.mjs`: `--scan-only` flag (`scanOnly`), its own usage line and header docs, and the early scan-only branch
- `scripts/guards/selftest.mjs`: three `test-count: --scan-only` cases
- `scripts/README.md`: `guard:tests:scan` bullet under "Other guards"
- `package.json`: `guard:tests:scan` script, appended to `lint`; `type-check` runs all three configs
- `components/home/__tests__/pin-layer-3d.test.tsx`: braced `beforeEach`
- `components/home/__tests__/terrain-stage.test.tsx`: `requestIdle` typed from `requestIdleCallback`
- `components/projects/__tests__/DemoTerminal.test.tsx`: matchMedia fake typed and returning `MediaQueryList`
- `lib/__tests__/service-worker-navigation.test.ts`: `RespondWith` type for the `respondWith` mock
- `lib/__tests__/saved-pages.test.ts`: typed expected-rows constant
- `components/projects/__tests__/Metrics.test.tsx`, `components/projects/__tests__/sections.test.tsx`: `links` on the box fixture
- `data/__tests__/editorial.test.ts`: `PhotoId`-typed key for `editorial`
- `data/__tests__/photos.test.ts`: narrowing on `source` before reading `reason`

## Decisions Made

The frontmatter key-decisions list them. In short:
- `--scan-only` also rejects `--baseline`, so the error message is true.
- `respondWith` is typed from the call the worker actually makes, not from `FetchEvent`, because the test passes fake responses.
- The editorial loop still iterates the views, so its coverage is unchanged.

## Deviations from Plan

**1. [Rule 2 - Correctness] `--scan-only` also rejects an explicit `--baseline`**
- **Found during:** Task 1
- **Issue:** The plan rejects `--jest`, `--list` and `--update`, and the message says "takes only --root". Without a check, `--scan-only --baseline x` would be accepted and the value silently ignored.
- **Fix:** `parseArgs` records whether `--baseline` was given and rejects it with the same message. The default baseline path is still set, so the ratchet path behaves as before.
- **Files modified:** scripts/guards/test-count.mjs
- **Verification:** `--scan-only --list x`, `--update` and `--baseline x` each print `test-count: --scan-only takes only --root`. Selftest 219/219.
- **Committed in:** 7c07140

---

**Total deviations:** 1 auto-fixed (Rule 2). **Impact:** it makes the new mode stricter and does not touch GUARD-03.

## Issues Encountered

- The must-have truth says a `.fixme(` call "is proven by a selftest case on the focused fixture". The existing `focused` fixture uses `test.only(`, not `.fixme(`, and the plan's case points at it. `.fixme(` is matched by the same `FOCUS_OR_SKIP` regex, and a scratch-tree run proved it (above). No `.fixme(` fixture was added, because the plan did not list one.
- Before totals for the four Task 3 files were not measured on their own. No `it`, `test` or `describe` line changed in the diff, and the full suite passes with 0 skipped and 0 todo.

## Verification

- `npm run guard:tests:scan`: `test-count: scan OK`, exit 0
- `npm run guard:selftest`: `selftest: 219/219 cases passed`, 3 `PASS test-count: --scan-only` rows
- `grep -c "guard:tests:scan" package.json`: 2. `grep -c "'--scan-only'" scripts/guards/test-count.mjs`: 1. `grep -c "guard:tests:scan" scripts/README.md`: 1.
- `node scripts/guards/test-count.mjs --jest jest-missing.json`: exit 1 with the existing `cannot read Jest results` error
- Task 2 no-silencing gate on 99fc3f7: exit 0. Jest-scope count after Task 2: 4.
- `npm run type-check`: exit 0, 0 `error TS`. `npx tsc -p tsconfig.jest.json | grep -c "error TS"`: 0. `grep -c "tsc -p tsconfig.jest.json" package.json`: 1.
- Diff-wide gates over `d29ea9a..HEAD`: no-silencing exit 0, reason-on-every-`@ts-expect-error` exit 0. The only added directive is 15-01's canary in `lib/__tests__/jest-globals-canary.test.ts`, which has a `-- canary: ...` reason.
- `npx jest`: 106 suites, 1798 passed. `npm run lint`: exit 0, ending with `test-count: scan OK`.
- ESLint on the changed guard scripts and the five Task 2 files: exit 0.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

Ready for 15-04. From now on every test and spec edit is type-checked by `npm run type-check`, the same command CI's Lint and Type Check job runs, and a stray focus or skip call fails `npm run lint` locally. Nothing was pushed.

## Self-Check: PASSED

- All 13 modified files exist. Commits 7c07140, 99fc3f7 and 68a183c are ancestors of HEAD (3 commits since 1978006).
- Every task's acceptance criteria and the plan-level verification were re-run and passed, as listed above.
