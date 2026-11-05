---
phase: 11-engineering-roadmap
plan: 08
subsystem: ui
tags: [roadmap, route-log, zod, server-components, next-link, playwright, jest]

requires:
  - phase: 11-02
    provides: "Tim's confirmed log.rows, log.descriptions, log.surveyedAt, copy.roadmap-intro and defaults"
  - phase: 11-05
    provides: "lib/route-log.ts whitelists and routeLogView, lib/log-date.ts formatLogDate, RouteLog/RouteRow"
provides:
  - "data/schemas/roadmap.ts: RoadmapPhaseSchema, RoadmapItemSchema (strict), RoadmapSchema, IsoDate, RoadmapStatus, types RoadmapItem, RoadmapPhase"
  - "data/roadmap.ts: Tim's seven confirmed rows (v2.0 phases 7-12) and surveyedAt = '2026-11-01'"
  - "app/(site)/roadmap/page.tsx: Server /roadmap with header band, status line, band jumps, RouteLog, URL-only empty plate, page end"
  - "Shareable URL contract live: /roadmap?project=portfolio|box|coin-flip&status=planned|in-progress|completed and #<row id>"
  - "RouteRow renders backticked description spans as unbroken <code>"
affects: [11-10, 11-13, 12]

actuals:
  tokens: 15100
  tasks: 2
  commits: 3
plan_head_before: ec25fadbfdea66db3e7eeacf9ee0d0b64268149f
plan_head_after: e37f2af888fbe425b471b914900ccb7d8f94ce3d

tech-stack:
  added: []
  patterns:
    - "Route-log data typed by a strict zod contract whose inferred type is assignable to RouteLogItem (type-level check in the data test)"
    - "D-20 guard as a test: surveyedAt <= today and >= newestCompletedAt (phases included), equality allowed"
    - "Description code spans: backticks in data mark a nowrap <code>, never rendered as characters"

key-files:
  created:
    - data/schemas/roadmap.ts
    - data/__tests__/roadmap.test.ts
    - e2e/roadmap.spec.ts
  modified:
    - data/roadmap.ts
    - app/(site)/roadmap/page.tsx
    - components/roadmap/RouteRow.tsx
    - components/roadmap/__tests__/RouteLog.test.tsx
  deleted:
    - components/RoadmapTimeline.tsx
    - components/RoadmapProgress.tsx
    - components/__tests__/RoadmapTimeline.test.tsx

key-decisions:
  - "box v2.0 description keeps Tim's quoted `--clip` code span; RouteRow renders backticked spans as a nowrap <code> so the flag never breaks between its hyphens at 375 px and the backticks never show"
  - "Phase 11 carries no completion date during Phase 11 (Q3 rule); Phase 12's first data edit records it and moves surveyedAt, with Tim's confirmation"
  - "Every 11-02 default applies: h1 'Roadmap', no priority, descriptions always visible, lowercase box and coin-flip labels; RouteRow and PROJECT_LABELS needed no §I change"
  - "data/types.ts RoadmapItem (v1, still referenced by nothing after this plan except its own file) was left for the 11-10/Phase 12 cleanup; RoadmapFilters stays for 11-10"

patterns-established:
  - "Route-log e2e derives every expectation (bands, counts, zero combination via countsFor, dates via formatLogDate) from the data, never literals"

requirements-completed: [ROUTE-01, ROUTE-02, ROUTE-03]

coverage:
  - id: D1
    description: "Strict route-log contract and Tim's confirmed rows: unique ids and order, three areas, retired ids gone, v2.0 the only in-progress row with phases 7-12, completedAt only on completed work (ROUTE-01, ROUTE-03, D-17, D-18)"
    requirement: ROUTE-03
    verification:
      - kind: unit
        ref: "data/__tests__/roadmap.test.ts#RoadmapSchema / roadmapItems / portfolio v2.0 in progress / completion dates"
        status: pass
    human_judgment: false
  - id: D2
    description: "surveyedAt bounds (D-20): not in the future, not before the newest completedAt including phases, equality accepted"
    requirement: ROUTE-03
    verification:
      - kind: unit
        ref: "data/__tests__/roadmap.test.ts#surveyedAt (ROUTE-03 adjacency, D-20)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Server /roadmap: title, kicker, h1, bands in computed order, jump links with counts, row anchors as :target, v2.0 disclosure, status line, 375 px no horizontal scroll (ROUTE-01, ROUTE-03)"
    requirement: ROUTE-01
    verification:
      - kind: e2e
        ref: "e2e/roadmap.spec.ts#/roadmap route log (ROUTE-01, ROUTE-03)"
        status: pass
      - kind: e2e
        ref: "e2e/shell.spec.ts#@375: no horizontal scroll on a route with the full footer"
        status: pass
    human_judgment: false
  - id: D4
    description: "URL filters on the server (ROUTE-02 server half): filtered status line, zero-combination empty plate built from enum labels with a replace/scroll-false way back, unknown values mean All and are not echoed (T-11-17)"
    requirement: ROUTE-02
    verification:
      - kind: e2e
        ref: "e2e/roadmap.spec.ts#/roadmap filters from the URL (ROUTE-02 server half)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Visual quality of the route log (axis ticks and nodes on the axis inside and outside the camp plate, camp marker, empty plate) at 375 px and 1280 px"
    verification: []
    human_judgment: true
    rationale: "Checked by the executor in dev-server screenshots (ticks and nodes sit on the axis in all bands, camp marker crosses the axis at the heading); final sign-off belongs to Tim and to the roadmap visual baselines, which are not re-captured in this plan"

duration: 11min
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 08: /roadmap route log on Tim's confirmed rows Summary

**/roadmap is now a Server Component. It renders Tim's seven confirmed route-log rows, typed by a strict zod contract, under a "Route log surveyed 1 Nov 2026" kicker. The page has a status line, band jump links, the Summit / Current camp / Base axis with the v2.0 phases 7-12 disclosure, and an empty plate for URL-only zero combinations. The v1 timeline and progress components are deleted.**

## Performance

- **Duration:** about 11 min
- **Started:** 2026-11-01T20:33:51Z
- **Completed:** 2026-11-01T20:45:06Z
- **Tasks:** 2
- **Files:** 10 (3 created, 4 modified, 3 deleted)

## Accomplishments

- `data/schemas/roadmap.ts` is a strict contract.
  - `area` accepts only `portfolio | box | coin-flip`.
  - Dates must be ISO `YYYY-MM-DD`.
  - Optional `phases` holds `{ n, name, status, completedAt? }`.
  - Its inferred type is assignable to `readonly RouteLogItem[]`.
- `data/roadmap.ts` holds only the rows Tim confirmed (table below) and `surveyedAt = '2026-11-01'`.
- `/roadmap` page:
  - Parses the awaited `searchParams` with `parseProject`/`parseStatus` and renders `routeLogView(...)`.
  - Shows `Showing 7 entries` unfiltered and `Showing n of 7 entries` filtered.
  - A band with no entries gets no jump link.
  - A zero combination (for example `?project=box&status=planned`) shows the dashed plate: "Nothing matches box and Planned. Show every entry, or pick another filter." and a primary `Show all entries` `<Link replace scroll={false}>` to `/roadmap`.
- `e2e/roadmap.spec.ts` has 14 tests. Every expectation is derived from the data.

## Rows shipped and their source (11-02-SUMMARY "Resolved values", Reply 5 E1/E2, 2026-11-01)

| id | title | area | status | order | completedAt | description (quoted from log.descriptions) |
|----|-------|------|--------|-------|-------------|--------------------------------------------|
| coin-flip-play-store | Play Store release | coin-flip | planned | 7 | none | "Releasing the app through the Play Store." |
| coin-flip-v1-1 | v1.1 Smoother toss | coin-flip | planned | 6 | none | "Smoothing the toss and the camera follow." |
| portfolio-v2 | v2.0 Topographic Identity | portfolio | in-progress | 5 | none | "This redesign: the whole site rebuilt around the real Matterhorn terrain." |
| coin-flip-v1 | v1.0 First release on device | coin-flip | completed | 4 | 2026-08-09 | "The first release, running on my own device: a fair draw, a 3D toss, no permissions and no network." |
| box-v2 | v2.0 Toolbox → toolkit | box | completed | 3 | 2026-07-14 | "The tools became scriptable: JSON output, `--clip`, config-file defaults, BLAKE3 hashing and previews before destructive changes." |
| box-v1 | v1.0 Full toolbox | box | completed | 2 | 2026-06-24 | "All 23 tools in one Rust binary, installed from PowerShell 7." |
| portfolio-v1 | v1.0 Stabilization & Visual Identity | portfolio | completed | 1 | 2026-03-12 | "The first version of this site, stabilized and given its own visual identity." |

The v2.0 phase lines come from log.rows: 7 Foundation & guardrails, completed 2026-10-24; 8 Data & terrain pipeline, completed 2026-10-24; 9 Home ascent, completed 2026-10-25; 10 Photography, completed 2026-10-26; 11 Engineering & roadmap, in progress; 12 Contact, edge pages & cleanup, planned. The intro is copy.roadmap-intro: "What I've finished, what I'm working on and what comes next, for this site, box and coin-flip." The kicker date is log.surveyedAt, 2026-11-01. No `targetRelease` was supplied, so none ships.

## Task Commits

1. **Task 1 RED:** `5358dc4` test(11-08): failing tests for the route-log data contract
2. **Task 1 GREEN:** `107e866` feat(11-08): route-log data from Tim's confirmed rows (ROUTE-03, D-17, D-20)
3. **Task 2:** `e37f2af` feat(11-08): /roadmap as a Server Component on the route log (ROUTE-01, ROUTE-03)

## Files Created/Modified

- `data/schemas/roadmap.ts`: the strict zod route-log contract (new)
- `data/roadmap.ts`: Tim's confirmed rows and `surveyedAt` (rewritten; every v1 row removed)
- `data/__tests__/roadmap.test.ts`: 20 tests for the contract, the data and D-20 (new)
- `app/(site)/roadmap/page.tsx`: the Server Component page (rewritten; no client directive, no motion)
- `e2e/roadmap.spec.ts`: 14 route-log e2e tests (new)
- `components/roadmap/RouteRow.tsx`: description code spans render as a nowrap `<code>`
- `components/roadmap/__tests__/RouteLog.test.tsx`: +1 test for the code span
- Deleted: `components/RoadmapTimeline.tsx`, `components/RoadmapProgress.tsx`, `components/__tests__/RoadmapTimeline.test.tsx`. 11-05's `RouteLog.test.tsx` is their rewrite. `RoadmapFilters` and its test stay for 11-10.

## Decisions Made

- **§I alternatives:** none. Every default in 11-02 is "default", so `RouteRow` meta and `PROJECT_LABELS` are unchanged and the h1 is `Roadmap`.
- **`--clip` code span:** Tim approved the box v2.0 description with `--clip` as a code span, in a markdown table. Shipping it as plain text let the browser break the line between the two hyphens at 375 px ("-" / "-clip"), which I saw in a screenshot. The data keeps the exact quote with its backticks. RouteRow renders each backticked span as `<code class="font-mono whitespace-nowrap">` and never renders the backticks themselves.
- **Q3 carry-over for Phase 12:** Phase 11 has no completion date. When Phase 11 is verified, Phase 12's first data edit (or the v2.0 close) sets phase 11 to `completed` with Tim's confirmed date and moves `surveyedAt` to that date or later. The D-20 test guards both.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A CLI flag in a description broke between its hyphens**
- **Found during:** Task 2, during the visual check at 375 px
- **Issue:** As plain text, `--clip` wrapped as "-" / "-clip".
- **Fix:** Kept the quoted backticks in the data. RouteRow's `Description` renders those spans as a nowrap `<code>`, and RouteLog.test gained a test for it.
- **Files modified:** components/roadmap/RouteRow.tsx, components/roadmap/__tests__/RouteLog.test.tsx, data/roadmap.ts
- **Verification:** jest components/roadmap passes. The 375 px screenshot shows `--clip` on one line.
- **Committed in:** e37f2af

**2. [Rule 3 - Blocking] Interim type error between the two task commits**
- **Found during:** Task 1 GREEN
- **Issue:** At `107e866`, the old client page still passed the new `roadmapItems` to the v1 components, which are typed against `data/types.ts`. As a result `tsc` failed in that page only.
- **Fix:** None was possible inside Task 1: the page cannot move before `surveyedAt` exists. Task 2's commit `e37f2af` replaces the page, and `tsc` is clean from there. The repo has no pre-commit hook, so nothing blocked the commit. Bisecting across `107e866` will show this one known type error.
- **Committed in:** 107e866 (interim), resolved in e37f2af

**3. [Rule 1 - Test robustness] Empty-state click waits for hydration**
- **Found during:** Task 2 verification. One run of 96 tests on the dev server had the empty-plate test fail, then two clean runs followed.
- **Fix:** Before the click, the test now polls for React props on the link, the same pattern photos.spec uses.
- **Committed in:** e37f2af

---

**Total deviations:** 3 auto-fixed (2 bug, 1 blocking)
**Impact on plan:** Fixes 1 and 3 do not change the plan's contract. The `RouteRow` change only adds rendering for backticked spans.

## TDD Gate Compliance

- RED `5358dc4` comes before GREEN `107e866`.
- **RED evidence:** a throwaway, uncommitted stub `data/schemas/roadmap.ts` (permissive `z.object({}).passthrough()`) let the suite load against the v1 data.
  - 13 of 20 tests failed on their assertions: retired areas accepted, unknown key accepted, non-ISO date accepted, duplicate order, retired areas and ids present, no in-progress v2.0 row, no phases, `surveyedAt` undefined.
  - The 7 that passed are properties the v1 data already met or that hold vacuously (unique ids, an undated completed row parses, the D-20 helper's own case).
- **Semantic assessment:** each failure was the planned assertion, not a load error.
- Jest has no reporter the `tdd-red-evidence` classifier accepts, so it gave no machine `RED_EVIDENCE_OK`. `workflow.tdd_mode` is off, so this is advisory.
- Task 2 is `type="auto"` without `tdd`.

## Verification

- `npm run lint` passes: eslint and every guard, data:check included.
- `npm run type-check` reports no errors.
- `npx jest --silent`: 71 suites, 1118 tests, all passing.
- `guard:tests`: jest 1118 + e2e 394 = 1512 (baseline 1300), OK. The JSON file was written to the scratchpad, not the repo.
- `npx playwright test e2e/roadmap.spec.ts e2e/shell.spec.ts e2e/home-ascent.spec.ts --project=chromium`: 96 passed. `--list` shows 14 tests for roadmap.spec.
- Acceptance greps pass:
  - no `use client`
  - the v1 files are gone
  - no motion import
  - no retired area literals
  - one `surveyedAt` export
  - 18 `test(` lines in the data test
- **Visual check (11-05's open item D5):** I took dev-server screenshots at 375 and 1280 px.
  - Row ticks and status nodes sit on the axis in Summit, Current camp (inside the raised plate) and Base.
  - The camp marker crosses the axis at the Current camp heading.
  - The empty plate and the page end render as specified.
  - There is no horizontal scroll at 375 px.

## Issues Encountered

None beyond the deviations.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 11-10 can mount `RouteLogFilters` between the intro and the `role="status"` line. That line stays mounted, so 11-10 must not key it. 11-10 also owns retiring `components/RoadmapFilters.tsx` and its test, and probably `RoadmapItem` in `data/types.ts`, which nothing imports any more.
- The `roadmap` visual baselines change with this plan. They need the gh re-baseline flow.
- ROUTE-01..03 stay unmarked: `requirements.ready-ids` reports them blocked by sibling plans (11-10, 11-13).
- **Phase 12 carry-over (Q3):** record Phase 11's completion date in `data/roadmap.ts` (phase 11 becomes `completed`, phase 12 possibly `in-progress`) and move `surveyedAt`, both with Tim's confirmation.

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-01*

## Self-Check: PASSED
