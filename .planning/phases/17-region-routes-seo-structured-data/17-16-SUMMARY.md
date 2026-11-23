---
phase: 17-region-routes-seo-structured-data
plan: 16
subsystem: testing
tags: [jest, client-graph, routing, seo, bundle-budget]

requires:
  - phase: 17-region-routes-seo-structured-data
    provides: "17-01 tracer: lib/regions.ts (regionIds), lib/photos/region-ids.ts, proxy.ts NEUTRAL_SLUG, app/(site)/photos/regions/"
provides:
  - "D-03 collision test in lib/__tests__/regions.test.ts: region ids, every editorial photo slug and a file-system-derived reserved set are pairwise disjoint, with self-tests proving the check can fail"
  - "data/regions/regions.json in SERVER_ONLY_MODULES (lib/__tests__/client-graph.test.ts): no 'use client' file may reach the region registry"
  - "Client JS record after the tracer: 1,851,685 B in 24 files (= phase base), no 'Steinernen' in any client chunk"
affects: [17-06, 17-11, 17-07, 18]

actuals:
  tokens: 1227    # chars/4 over the added lines of the two task commits (4,909 chars)
  tasks: 2
  commits: 2      # MEASURED: git rev-list --count 69fd3f4..HEAD before the docs commit
plan_head_before: 69fd3f47d3a27cfc47d52f211b0a42de1bed44e5
plan_head_after: 51f2c9982ac11d208bb796a59da6cf42c32f2886

tech-stack:
  added: []
  patterns:
    - "A reserved URL-segment set is read from the app directory with fs at test time (skip '[', '@', '(' names), so a new static segment is guarded with no test edit"
    - "Collision checks return { value, in: listNames[] } so a failure names both lists"

key-files:
  created: []
  modified:
    - lib/__tests__/regions.test.ts
    - lib/__tests__/client-graph.test.ts

key-decisions:
  - "17-16 D-03: the reserved set is 'regions', NEUTRAL_SLUG, 'opengraph-image' plus every static directory under app/(site)/photos, read with fs at test time; photo slugs come from every editorial entry (the published set)"
  - "17-16 D-06: data/regions/regions.json is in SERVER_ONLY_MODULES; only lib/regions.ts, lib/photos/region-ids.ts (for proxy.ts), server pages and routes may import it. Client JS after the tracer is 1,851,685 B in 24 files, equal to the phase base (cap 1,855,781 B)"

patterns-established:
  - "Region facts stay server-only: a client import of the registry fails the client-graph walk, naming the chain"

requirements-completed: [REGION-07, PHOTO-05]

coverage:
  - id: D1
    description: "Region ids never collide with a photo slug or a reserved segment under /photos (D-03); a new static directory joins the reserved set with no edit"
    requirement: PHOTO-05
    verification:
      - kind: unit
        ref: "lib/__tests__/regions.test.ts#D-03: region ids never collide with a photo slug or a reserved segment"
        status: pass
      - kind: other
        ref: "mutation: mkdir app/(site)/photos/zermatt -> 'keeps ... pairwise disjoint' fails with { value: 'zermatt', in: ['region ids', 'reserved'] }; directory removed"
        status: pass
    human_judgment: false
  - id: D2
    description: "No 'use client' file can reach data/regions/regions.json without a failing test (D-06, T-17-34)"
    requirement: REGION-07
    verification:
      - kind: unit
        ref: "lib/__tests__/client-graph.test.ts#no client entry reaches a server-only module"
        status: pass
      - kind: other
        ref: "mutation: re-export region-ids from lib/photos/routes.ts -> fails with CarouselControls.tsx -> lib/photos/routes.ts -> lib/photos/region-ids.ts -> data/regions/regions.json; reverted"
        status: pass
    human_judgment: false
  - id: D3
    description: "Client JS after the tracer within 1,855,781 B, no registry text in any client chunk"
    requirement: REGION-07
    verification:
      - kind: other
        ref: "rm -rf .next/static && npm run build; byte-sum .next/static/chunks/**/*.js = 1,851,685 B in 24 files; grep -rl Steinernen .next/static/chunks empty"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-11-23
status: complete
---

# Phase 17 Plan 16: Region Guards Summary

**D-03 collision test over region ids, editorial photo slugs and a file-system-derived reserved set; the region registry in SERVER_ONLY_MODULES; client JS measured at the phase base, 1,851,685 B in 24 files, with no registry text in any chunk**

## Performance

- **Duration:** about 5 min (one production build included)
- **Started:** 2026-11-23T23:21:18Z
- **Completed:** 2026-11-23T23:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `lib/__tests__/regions.test.ts` gains `describe('D-03: region ids never collide with a photo slug or a reserved segment')`: the reserved set is `'regions'`, `NEUTRAL_SLUG` (imported from `../../proxy`), `'opengraph-image'` and every directory under `app/(site)/photos` whose name starts with none of `[`, `@`, `(` (read with `fs.readdirSync` at test time). A row proves the walk sees `regions`; another asserts no duplicate region id or photo slug; the main row asserts the three lists are pairwise disjoint; two self-test rows show the `collisions` helper reports a region id equal to a photo slug and a photo slug equal to a reserved segment.
- `lib/__tests__/client-graph.test.ts`: `SERVER_ONLY_MODULES` is now `['data/generated/overview.ts', 'data/regions/regions.json']`, with a doc block citing the spike's +2,200 B measurement and naming the modules allowed to import the registry. The every-client-entry walk passes after 17-01 (no client file reaches the registry).
- Client JS measured with the 16-01 byte-sum procedure (T-17-34 build half).

## Client JS record

| Measure | Value |
|---|---|
| Phase base (16-07, `57d87a5`) | 1,851,685 B, 24 files |
| After 17-01..17-05 and this plan (`51f2c99`) | **1,851,685 B, 24 files** (+0 B) |
| Phase 17 cap | 1,855,781 B (base + 4,096) |
| `grep -rl Steinernen .next/static/chunks` | empty (0 files) |
| Positive control | `Steinernen` is in `data/regions/regions.json` and in server chunks (`.next/server/chunks/ssr/...`), so the string survives the build and the empty client check is not vacuous |

`public/service-worker.js` was restored after the build.

## Task Commits

1. **Task 1: The D-03 collision test** - `6b5dae4` (test)
2. **Task 2: The region registry in SERVER_ONLY_MODULES, client JS measured** - `51f2c99` (test)

**Plan metadata:** the docs commit that adds this SUMMARY.

## TDD Gate Compliance (Task 1, tdd="true")

Task 1's deliverable is a guard test with no production code to implement, so there is no `feat`/`fix` GREEN commit; the plan is `type: execute`, not `type: tdd`, so the plan-level gate does not apply. The RED evidence is a mutation run instead of a pre-implementation failure:

- **RED (mutation):** with a temporary empty directory `app/(site)/photos/zermatt`, `npx jest lib/__tests__/regions.test.ts -t "D-03"` exited 1 with 1 failed / 4 passed. The failing test was the target `keeps region ids, photo slugs and reserved segments pairwise disjoint`, on its `toEqual([])` assertion, receiving `[{ value: 'zermatt', in: ['region ids', 'reserved'] }]`. Semantic assessment: the target ran and failed on the planned assertion for the intended reason (a static segment equal to a region id, picked up from the file system with no test edit); no load, syntax or fixture fault. The directory was removed.
- **GREEN:** the real tree, 98/98 across `regions` and `proxy`.
- The first draft fed the reserved set to the self-test rows too, so the mutation also failed them; they now pass only the two lists each row is about, and the mutation fails exactly the target row.

Task 2 (not TDD) was mutation-checked the same way: a temporary `export { regionRouteIds as __probe } from './region-ids'` in `lib/photos/routes.ts` failed `no client entry reaches a server-only module` with the chain `components/photos/CarouselControls.tsx -> lib/photos/routes.ts -> lib/photos/region-ids.ts -> data/regions/regions.json`; reverted with `git checkout -- lib/photos/routes.ts`.

## Files Created/Modified

- `lib/__tests__/regions.test.ts` - D-03 describe (`fs`, `path`, `NEUTRAL_SLUG`, `editorial` imports; header bullet updated)
- `lib/__tests__/client-graph.test.ts` - `data/regions/regions.json` in `SERVER_ONLY_MODULES` with its doc block

## Decisions Made

See `key-decisions`. One detail: the duplicate check uses `new Set(list).size === list.length` for region ids and photo slugs; the reserved set is built as a `Set` because `'regions'` appears both as a literal and as a file-system directory, by design.

## Deviations from Plan

None - plan executed exactly as written. (The vacuous assertion `photoSlugs.length === Object.keys(editorial).length`, true by construction of a `map`, was dropped before the Task 1 commit.)

## Threat Mitigations

- **T-17-33** (a region id equal to a photo slug or a static segment): mitigated by the D-03 disjointness test with a file-system-derived reserved set and self-tests proving it can fail.
- **T-17-34** (regions.json in client chunks, the guard half, paired with 17-01's T-17-02): mitigated by the `SERVER_ONLY_MODULES` entry and the empty `Steinernen` build check.
- **T-17-SC:** no package installed.

## Verification

- `npx jest lib/__tests__/regions.test.ts lib/__tests__/proxy.test.ts lib/__tests__/client-graph.test.ts`: 3 suites, 114/114.
- `npm run lint` (includes the test-count scan) exit 0; `npm run type-check` exit 0.
- Build verify: build exit 0, 1,851,685 bytes in 24 files (<= 1,855,781), no `Steinernen` in `.next/static/chunks`.
- `node scripts/ci/check-snapshot-commit.mjs --none`: OK (0 changed) after each commit; no PNG staged.
- Acceptance greps: `opengraph-image` in regions.test.ts 3; `NEUTRAL_SLUG` in regions.test.ts 6; `data/regions/regions.json` in client-graph.test.ts 2.
- No server left running; ports 3000 and 3017 were free before the build.

## Known Stubs

None.

## Issues Encountered

`lib/__tests__/client-graph.test.ts` was not Prettier-clean before this plan (long single-line regexes); the file's existing style was kept and only the `SERVER_ONLY_MODULES` block changed. Not reformatted (out of scope).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 17-06 and 17-11 (wave 3) can put region data near client components with the registry guard in place: a client import of `regions.json` now fails Jest naming the chain.
- Any later static directory under `app/(site)/photos` is checked against region ids and photo slugs automatically.

## Self-Check: PASSED

Commits `6b5dae4` and `51f2c99` are ancestors of HEAD; both modified files exist.

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-23*
