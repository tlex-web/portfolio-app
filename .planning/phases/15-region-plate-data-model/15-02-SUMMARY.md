---
phase: 15-region-plate-data-model
plan: 02
subsystem: testing
tags: [typescript, jest, "@jest/globals", jest-mock, it.each, matchMedia, type-check]
status: complete

requires:
  - phase: 15-01
    provides: "__tests__/jest-globals.d.ts with the types-only namespace jest (Spied, Mock, MockedFunction) and tsconfig.jest.json"
provides:
  - "Ten test files type-check under tsconfig.jest.json with no any, ignore directive or @ts-expect-error added"
  - "No jest.SpyInstance left in any .ts/.tsx file"
  - "Jest-scope errors down from 49 to 9, one in each of nine files (hand-over to 15-03)"
affects: [15-03]

actuals:
  tokens: 4100
  tasks: 2
  commits: 2
plan_head_before: 5fbde369248ac5b0b3b13c612e46808751174e84
plan_head_after: 78c15079e06b3cabaaacbc023dd50518ba18e167

tech-stack:
  added: []
  patterns:
    - "Spies: jest.Spied<typeof target> from the 15-01 globals namespace"
    - "matchMedia fakes: jest.fn((query: string): MediaQueryList => ...) with listener params typed EventListener and dispatchEvent as jest.fn<MediaQueryList['dispatchEvent']>()"
    - "it.each tables: explicit tuple generic it.each<[string, T]>(rows) or a labelled readonly tuple type"
    - "Overloaded DOM method spies: spy through a view typed with the one overload the code calls"

key-files:
  created: []
  modified:
    - components/__tests__/SafeCanvas.test.tsx
    - components/site/__tests__/OfflineRetry.test.tsx
    - lib/__tests__/useAscentMode.test.tsx
    - lib/__tests__/useReducedMotion.test.tsx
    - components/site/__tests__/SiteNav.test.tsx
    - lib/og/__tests__/routes.test.ts
    - lib/og/__tests__/template.test.tsx
    - lib/__tests__/service-worker-media.test.ts
    - components/roadmap/__tests__/RouteLogFilters.test.tsx
    - lib/__tests__/sw-update.test.ts

key-decisions:
  - "MediaQueryList fake listeners are typed EventListener: the DOM addEventListener overload set rejects any narrower listener type (proved in a scratch tsc probe), while the stores keep (event: MediaQueryListEvent) => void"
  - "The getContext spy is typed with the DOM lib's string-id overload (GetContext): @webgpu/types adds a 'webgpu'-only overload last, so Spied<HTMLCanvasElement['getContext']> rejects the ('webgl2', attributes) assertion"
  - "template.test.tsx no-profile case: route 'no-such-trail' became route undefined; the schema's TrailId enum admits only profiled trails, so a project with no route is the reachable no-profile state and hits the same find() miss (taken instead of a D-26 @ts-expect-error, which this plan forbids)"

patterns-established:
  - "Pattern: a matchMedia fake returns a full MediaQueryList (addListener/removeListener included) so it is assignable to window.matchMedia"

requirements-completed: [GUARD-10]

coverage:
  - id: D1
    description: "Spy and matchMedia family (causes D and F) fixed in five files; their 41 tests pass unchanged"
    requirement: GUARD-10
    verification:
      - kind: command
        ref: "npx tsc -p tsconfig.jest.json | grep -cE 'SafeCanvas.test|OfflineRetry.test|useAscentMode.test|useReducedMotion.test|SiteNav.test' -> 0"
        status: pass
      - kind: test
        ref: "npx jest SafeCanvas OfflineRetry useAscentMode useReducedMotion SiteNav -> 41 passed (41 before)"
        status: pass
    human_judgment: false
  - id: D2
    description: "it.each tuple and mock-arity family (causes E, C, G and the template narrowing) fixed in five files; their 107 tests pass unchanged"
    requirement: GUARD-10
    verification:
      - kind: command
        ref: "npx tsc -p tsconfig.jest.json | grep -cE 'og/__tests__/routes.test|og/__tests__/template.test|service-worker-media.test|RouteLogFilters.test|sw-update.test' -> 0"
        status: pass
      - kind: test
        ref: "npx jest routes template service-worker-media RouteLogFilters sw-update -> 107 passed (107 before)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Hand-over count: exactly 9 Jest-scope errors, one per file, and npm run type-check green"
    requirement: GUARD-10
    verification:
      - kind: command
        ref: "npx tsc -p tsconfig.jest.json | grep -c 'error TS' -> 9"
        status: pass
      - kind: command
        ref: "npm run type-check -> exit 0"
        status: pass
    human_judgment: false

duration: 11 min
completed: 2026-11-14
---

# Phase 15 Plan 02: Spy, matchMedia, it.each and mock-arity type errors Summary

**Ten Jest test files now type-check from real signatures (jest.Spied spies, MediaQueryList-typed matchMedia fakes, tuple-typed it.each tables, router/register mocks typed from the app's calls), taking the Jest-scope error count from 49 to 9 with no any, ignore directive or @ts-expect-error.**

## Performance

- **Duration:** about 11 min
- **Started:** 2026-11-14T20:11Z
- **Completed:** 2026-11-14T20:22Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Task 1 (tracer): `jest.SpyInstance` is gone from the repo (git grep exit 1). The console.error spies in SafeCanvas and OfflineRetry are `jest.Spied<typeof console.error>`, which also clears the cascading TS7006 parameters. The three matchMedia factories return `MediaQueryList`. This shows the 15-01 types-only `namespace jest` carries the spy types end to end through tsc and Jest.
- Task 2: the og routes test tables are typed `[string, OgCard]`, `[string, PhotoView]` and `[string, Project]`. `requireActual` is typed from `node:fs/promises`, and the `beforeEach` body is braced. The service-worker-media WR-04 rows use a labelled `CacheWrite` tuple. RouteLogFilters' `replace` is `jest.fn<(href: string, options?: { scroll?: boolean }) => void>`. sw-update's `register` is typed from `ServiceWorkerContainer.register`'s params. template.test's pitch wrap case guards an undefined pitch with a thrown error, not a non-null assertion.
- Error count: 49 before, 38 after Task 1, 9 after Task 2. The nine left are one each in pin-layer-3d, terrain-stage, DemoTerminal, Metrics, sections, editorial, photos, saved-pages and service-worker-navigation, which is exactly 15-03's list.

## Jest totals (GUARD-03)

| Files | Before | After |
|-------|--------|-------|
| Task 1 (5 files) | 5 suites, 41 tests passed | 5 suites, 41 tests passed |
| Task 2 (5 files) | 5 suites, 107 tests passed | 5 suites, 107 tests passed |

## Task Commits

1. **Task 1: typed spy and matchMedia pattern (causes D, F)**: `5949638` (fix)
2. **Task 2: it.each tuples and typed mock arity (causes E, C, G)**: `78c1507` (fix)

## Files Created/Modified

- `components/__tests__/SafeCanvas.test.tsx`: console.error spy typed `jest.Spied<typeof console.error>`
- `components/site/__tests__/OfflineRetry.test.tsx`: same, in the helper parameter and the describe-level spy
- `lib/__tests__/useAscentMode.test.tsx`: getContext spy through a `GetContext` overload view; matchMedia fake returns `MediaQueryList`
- `lib/__tests__/useReducedMotion.test.tsx`: `jest.Mock<typeof window.matchMedia>`; both factories return `MediaQueryList`
- `components/site/__tests__/SiteNav.test.tsx`: matchMedia fake returns `MediaQueryList`; ChangeListener takes `MediaQueryListEvent`
- `lib/og/__tests__/routes.test.ts`: tuple-typed tables, typed requireActual, braced hook
- `lib/og/__tests__/template.test.tsx`: no-profile fixture uses `route: undefined`; explicit pitch guard
- `lib/__tests__/service-worker-media.test.ts`: `CacheWrite` tuple type for the WR-04 rows
- `components/roadmap/__tests__/RouteLogFilters.test.tsx`: `replace` mock typed from the real call
- `lib/__tests__/sw-update.test.ts`: `register` mock typed from the real parameters

## Decisions Made

See key-decisions in the frontmatter. In short: listener params are typed `EventListener` because the DOM overload set rejects anything narrower. The getContext spy uses the string-id overload because `@webgpu/types` puts a 'webgpu'-only overload last. The template no-profile case uses a project with no route.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] getContext spy needed a narrower overload type than `jest.Spied<HTMLCanvasElement['getContext']>`**
- **Found during:** Task 1
- **Issue:** Swapping `jest.SpyInstance` for `jest.Spied<HTMLCanvasElement['getContext']>` surfaced a new TS2554 at `useAscentMode.test.tsx` `toHaveBeenCalledWith('webgl2', {...})`. `@webgpu/types` (pulled in through the three.js types) appends `getContext(contextId: 'webgpu')` as the last overload, and `Parameters<>` picks the last one.
- **Fix:** Added `type GetContext = (contextId: string, options?: WebGLContextAttributes) => RenderingContext | null`, the DOM lib's own string-id overload. The test spies through `const canvasPrototype: { getContext: GetContext } = HTMLCanvasElement.prototype`, which is the same object, so runtime behaviour is identical. This is an upcast with no assertion.
- **Files modified:** lib/__tests__/useAscentMode.test.tsx
- **Commit:** 5949638

**2. [Rule 1 - Bug] The MediaQueryList fakes needed more than a return annotation**
- **Found during:** Task 1
- **Issue:** Annotating the factory as `MediaQueryList` exposed that a listener typed `(e: MediaQueryListEvent) => void` cannot satisfy the DOM `addEventListener` overload set. `dispatchEvent: jest.fn()` (an UnknownFunction) does not return boolean either, and two fakes lacked `addListener`/`removeListener`.
- **Fix:** Listener params are typed `EventListener` (a scratch tsc probe confirmed this is the accepted shape), and `dispatchEvent` is `jest.fn<MediaQueryList['dispatchEvent']>()`. `addListener: jest.fn(), removeListener: jest.fn()` were added to the useAscentMode and useReducedMotion fakes, matching SiteNav's existing fake. SiteNav's fake change event is passed `as MediaQueryListEvent`, the same pattern useAscentMode already used.
- **Files modified:** lib/__tests__/useAscentMode.test.tsx, lib/__tests__/useReducedMotion.test.tsx, components/site/__tests__/SiteNav.test.tsx
- **Commit:** 5949638

**3. [Rule 1 - Bug] template.test.tsx:248 was deliberately out-of-schema input, not an it.each tuple error**
- **Found during:** Task 2
- **Issue:** The plan grouped `template.test.tsx:248` with cause E. The real error is that `{ ...projects[0], route: 'no-such-trail' }` is not a `Project`, because `route` is `TrailId` (`z.enum(['hoernliweg-27', 'zmutt-2'])`). D-26 would allow a reasoned `@ts-expect-error` for deliberate wrong input, but this plan's prohibition and must-haves forbid adding any.
- **Fix:** `route: undefined`, with a two-line comment. The schema allows `route` to be optional, so this is the no-profile state the schema can actually produce. It takes the same `trailProfiles.find(...)` miss in `lib/og/template.tsx`. The test name and all assertions are unchanged.
- **Files modified:** lib/og/__tests__/template.test.tsx
- **Commit:** 78c1507
- **Note for review:** if Tim prefers to keep the literal unknown-id input, the alternative is D-26's `// @ts-expect-error -- deliberate unknown trail id` on that line. That would need this plan's no-@ts-expect-error must-have relaxed.

**4. [Plan reference] `lib/og/routes.ts` does not exist**
- **Found during:** Task 2
- **Issue:** The plan names `lib/og/routes.ts` as the source of the route/card types.
- **Fix:** The real types are `PhotoView` (`lib/photos/view-model.ts`), `Project` (`data/types.ts`) and the two route modules. A local `OgCard = { route: typeof photoRoute | typeof projectRoute; slug: string }` types the shared table.

---

**Total deviations:** 4 (3 Rule 1 auto-fixes plus 1 plan-reference correction). **Impact:** test-type-only changes. Runtime test behaviour is unchanged except the template no-profile fixture, which now reaches the same branch with schema-valid input. Test counts are identical.

## Issues Encountered

- Prettier reports formatting differences in 9 of the 10 files, but they were already present at HEAD in lines this plan did not touch, and Prettier is not a CI gate. The changed hunks follow the 100-column config, except the sw-update `register` line, which matches the file's existing long-line style. Out of scope, not reformatted.

## Verification

- `npx tsc -p tsconfig.jest.json 2>&1 | grep -c "error TS"`: 9 (one per file in 15-03's list)
- Per-family greps: 0 and 0
- `git grep -n "jest.SpyInstance" -- '*.ts' '*.tsx'`: exit 1 (no match)
- No-silencing gate (`@ts-ignore|as any|: any\b|<any>` on added lines) for 5949638 and 78c1507: both pass. No `@ts-expect-error` or `@ts-nocheck` was added in either commit.
- `npm run type-check` (app and e2e): exit 0
- `npx eslint` on all ten files: exit 0

## Next Phase Readiness

Ready for 15-03. It inherits exactly nine single-error files and adds tsconfig.jest.json to `npm run type-check`.

## Self-Check: PASSED

- All 10 modified files exist; commits 5949638 and 78c1507 are ancestors of HEAD.
- Acceptance criteria re-run after each task: all PASS (listed under Verification).
