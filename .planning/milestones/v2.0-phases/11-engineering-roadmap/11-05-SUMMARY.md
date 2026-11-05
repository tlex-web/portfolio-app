---
phase: 11-engineering-roadmap
plan: 05
subsystem: ui
tags: [roadmap, route-log, next-link, server-components, tailwind, jest, url-whitelist]

requires: []
provides:
  - "lib/route-log.ts: PROJECTS, STATUSES, PROJECT_LABELS, STATUS_LABELS, BAND_LABELS, parseProject, parseStatus, filterItems, countsFor, bands, routeLogHref, newestCompletedAt, routeLogView (+ types LogProject, LogStatus, BandId, LogPhase, RouteLogItem, LogFilter, LogBand, LogCounts)"
  - "lib/log-date.ts: formatLogDate ('2026-10-24' -> '24 Oct 2026', RangeError on impossible dates)"
  - "components/roadmap/RouteLog.tsx: Server elevation axis with Summit / Current camp / Base sections (#summit, #current-camp, #base)"
  - "components/roadmap/RouteRow.tsx: Server row, log variant (li id = item id, native details phase disclosure) and compact variant (one link to /roadmap?project={area}#{id})"
affects: [11-08, 11-10, 11-13]

actuals:
  tokens: 9600
  tasks: 2
  commits: 4
plan_head_before: 0a29ec2e35f551226d25db387a0ed48951c235b8
plan_head_after: 42c36d97e2bcc543edeaac8f7722711004d79416

tech-stack:
  added: []
  patterns:
    - "Route-log URL whitelist: exact-match parsers fall back to 'all'; hrefs re-check the whitelist and drop a forged value"
    - "Axis geometry through a CSS variable: each band sets --axis-x (row edge to axis) so row ticks reach the axis inside and outside the raised camp plate"
    - "Meta lines as whitespace-nowrap units joined by an aria-hidden ' · ' (data-route-meta hook for tests)"

key-files:
  created:
    - lib/route-log.ts
    - lib/log-date.ts
    - lib/__tests__/route-log.test.ts
    - lib/__tests__/log-date.test.ts
    - components/roadmap/RouteLog.tsx
    - components/roadmap/RouteRow.tsx
    - components/roadmap/__tests__/RouteLog.test.tsx
  modified: []

key-decisions:
  - "Compact RouteRow meta follows 11-UI-SPEC Next steps: '{Status}' plus ' · {target}' only if present (e.g. 'Planned · v1.1'); the log variant keeps '{Project} · …'"
  - "Only the log-variant li carries id = item id; the compact li has no id so a case-study page never holds a duplicate #id anchor target"
  - "RouteLog prop is typed readonly LogBand[] (the exact return type of bands()) instead of ReturnType<typeof bands>, which would self-reference the destructured 'bands' parameter"
  - "routeLogHref re-validates both values against the whitelists, so a value that bypassed the types is dropped instead of echoed (T-11-10 defence in depth)"
  - "A one-phase disclosure would read 'Phase {n}'; the v2.0 row reads 'Phases 7–12'"

patterns-established:
  - "Pure lib + Server component pair: data decisions (band order, row order, counts, dates) live in import-free lib functions; the components only render"

requirements-completed: [ROUTE-01, ROUTE-02, ROUTE-03]

coverage:
  - id: D1
    description: "URL filter whitelist, canonical hrefs and zero-visible counts (ROUTE-02 logic half, T-11-10)"
    requirement: ROUTE-02
    verification:
      - kind: unit
        ref: "lib/__tests__/route-log.test.ts#parseProject / parseStatus / routeLogHref / countsFor"
        status: pass
    human_judgment: false
  - id: D2
    description: "Band order Summit, Current camp, Base with rows by order descending; empty bands omitted (ROUTE-01, D-19)"
    requirement: ROUTE-01
    verification:
      - kind: unit
        ref: "lib/__tests__/route-log.test.ts#bands (D-19)"
        status: pass
      - kind: unit
        ref: "components/roadmap/__tests__/RouteLog.test.tsx#RouteLog"
        status: pass
    human_judgment: false
  - id: D3
    description: "Deterministic log dates and newest date including phases (ROUTE-03 date half, D-20)"
    requirement: ROUTE-03
    verification:
      - kind: unit
        ref: "lib/__tests__/log-date.test.ts#formatLogDate"
        status: pass
      - kind: unit
        ref: "lib/__tests__/route-log.test.ts#newestCompletedAt (D-20: includes phase dates)"
        status: pass
    human_judgment: false
  - id: D4
    description: "v2.0 phase disclosure (native details, rising phase lines) and compact Next-steps link (D-18)"
    requirement: ROUTE-03
    verification:
      - kind: unit
        ref: "components/roadmap/__tests__/RouteLog.test.tsx#gives the v2.0 row a native disclosure of its phases in rising order"
        status: pass
      - kind: unit
        ref: "components/roadmap/__tests__/RouteLog.test.tsx#RouteRow compact variant"
        status: pass
    human_judgment: false
  - id: D5
    description: "Visual geometry of the axis (summit triangle, row ticks reaching the axis inside the camp plate, camp marker at the heading) at 375 px and desktop"
    verification: []
    human_judgment: true
    rationale: "No page renders the route log until 11-08; tick and marker pixel offsets are only checkable in a browser (and by the 11-08 visual baselines)"

duration: 9min
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 05: Route-log logic and elevation-axis markup Summary

**Import-free route-log library (whitelisted `?project`/`?status` parsing, canonical hrefs, counts, Summit/Current camp/Base bands, D-20 newest date) plus a locale-free `formatLogDate`, and Server `RouteLog`/`RouteRow` components that draw the climb with a native `<details>` v2.0 phase disclosure: 84 tests green.**

## Performance

- **Duration:** about 9 min
- **Started:** 2026-11-01T18:41Z
- **Completed:** 2026-11-01T18:50:10Z
- **Tasks:** 2
- **Files created:** 7

## Accomplishments

- `lib/route-log.ts` exports everything in the plan's interfaces block, with the same names. `parseProject` and `parseStatus` accept only the exact values. Anything else from the bad-input table (`undefined`, `''`, `'BOX'`, `['box']`, `1`, `null`, `'other'`, `'cli'`, `'webshop'`, `'box '`) becomes `'all'`. `routeLogHref` emits `/roadmap`, `?project=…`, `?status=…` or `?project=…&status=…` only.
- `countsFor` counts each Project segment within the current Status and each Status segment within the current Project, so a combination with no entries shows 0. `routeLogView` returns `{ bands, counts, shown, total }`.
- `formatLogDate` formats `D Mon YYYY` with its own month table. It checks the day against the Gregorian month length and throws RangeError for `2026-02-29`, `1900-02-29`, `2026-13-01`, `2026-04-31`, `2026-1-1`, `''` and timestamps.
- `RouteLog` is a Server Component with no motion:
  - an aria-hidden axis (12 px summit triangle, 1 px line, 16 px base tick)
  - one `<section id aria-labelledby>` per rendered band, with h2 `Summit`, `Current camp` or `Base` and `{Status} · {n} entries`
  - the raised Current camp plate with the 24 x 2 px accent marker
  - an empty band list renders nothing
- `RouteRow` log variant:
  - an `li` whose id is the item id, with `target:` highlight
  - an h3 title, a nowrap meta line and an always-visible description
  - an aria-hidden status node tick
  - a closed-by-default `<details>` that reads `Phases 7–12` and lists `Phase {n} · {name} · {24 Oct 2026 | Completed | In progress | Planned}` in rising order
- The compact variant is one `next/link` to `/roadmap?project={area}#{id}`.

## Task Commits

1. **Task 1 RED:** `4192e94` test(11-05): failing tests for route-log functions and log dates
2. **Task 1 GREEN:** `c031692` feat(11-05): route-log functions and deterministic log dates (ROUTE-01, ROUTE-03)
3. **Task 2 RED:** `3e009e9` test(11-05): RouteLog tests (rewrite of the v1 timeline tests)
4. **Task 2 GREEN:** `42c36d9` feat(11-05): route log axis with bands and the v2.0 phase disclosure (D-18, D-19)

No REFACTOR commits were needed.

## Test counts

| Suite | Tests |
|-------|-------|
| lib/__tests__/route-log.test.ts | 51 |
| lib/__tests__/log-date.test.ts | 15 |
| components/roadmap/__tests__/RouteLog.test.tsx | 18 (18 `it(` lines; v1 RoadmapTimeline.test had 11) |
| **Total** | **84** |

## Files Created/Modified

- `lib/route-log.ts`: pure route-log functions, types and labels (whitelist, filter, counts, bands, hrefs, newest date, view)
- `lib/log-date.ts`: deterministic `formatLogDate`
- `lib/__tests__/route-log.test.ts`, `lib/__tests__/log-date.test.ts`: unit tables
- `components/roadmap/RouteLog.tsx`: Server elevation axis and bands
- `components/roadmap/RouteRow.tsx`: Server row (log and compact) with the phase disclosure
- `components/roadmap/__tests__/RouteLog.test.tsx`: rewrite of the v1 timeline tests for the new contract

## Decisions Made

- **Compact meta** follows 11-UI-SPEC "Next steps": `{Status}` (plus ` · {target}` only if present, G7), for example `Planned · v1.1`. The project name would repeat the case study it sits on. The log variant keeps `{Project} · …`.
- **Ids:** only log rows carry `id = item.id`. The compact `li` has no id, so a case-study page never holds a second `#id` target for the same item.
- **Prop typing:** `RouteLog` takes `readonly LogBand[]`, which is identical to `ReturnType<typeof bands>`. The interface's `ReturnType<typeof bands>` would refer to the destructured `bands` parameter itself.
- **Defence in depth:** `routeLogHref` re-validates both values against the whitelists, so a forged value is dropped, not echoed.

## For 11-08

- Its zod type in `data/schemas/roadmap.ts` must stay assignable to `RouteLogItem`: `area` must be one of `portfolio | box | coin-flip`, and `phases` must be `{ n, name, status, completedAt? }[]`. Feed `routeLogView(items, { project: parseProject(sp.project), status: parseStatus(sp.status) }).bands` to `<RouteLog bands={…} />`.
- If Tim picks title case for N1, change `PROJECT_LABELS` there. §I defaults #2 (no priority) and #3 (descriptions always visible) are built in here.
- 11-08 removes `components/RoadmapTimeline.tsx` and its test. `RouteLog.test.tsx` is the rewrite that covers the same ground.

## Deviations from Plan

None. The plan was executed as written. The decisions above settle details the plan left open; none changes a contract.

## TDD Gate Compliance

- Each RED commit (`4192e94`, `3e009e9`) comes before its GREEN commit (`c031692`, `42c36d9`).
- **RED evidence and semantic assessment:** before each RED run I wrote throwaway, uncommitted stub modules that exported the planned names with wrong behaviour, so the suites loaded and failed on assertions rather than on "Cannot find module".
  - Task 1: 59 of 66 assertions failed.
  - Task 2: 17 of 18 failed.
  - The tests that passed against the stubs were the vacuous ones, for example "shows no priority".
- Jest has no reporter that the `tdd-red-evidence` classifier accepts (TAP, JUnit, swift, unittest, go), so no machine `RED_EVIDENCE_OK` was produced. `workflow.tdd_mode` is not enabled in `.planning/config.json`, so the gate is advisory.

## Issues Encountered

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 11-08 can render the route log from Tim's confirmed rows. 11-10 can build the filter island on `routeLogHref`, `countsFor` and `routeLogView`. 11-13 can use `RouteRow variant="compact"` for Next steps.
- 11-02 is still paused at its Task 3 checkpoint (Tim's content packet); this plan did not touch its files.

## Self-Check: PASSED

- All 7 created files exist on disk.
- Commits 4192e94, c031692, 3e009e9 and 42c36d9 are ancestors of HEAD.
- Every acceptance criterion passes:
  - both libs are import-free
  - `interface RouteLogItem` appears once
  - there are no `Intl.` or `toLocale` calls
  - RouteLog.test has 18 test lines
  - `<details` appears once
  - there is no motion or `'use client'`
  - no CLI_X slug appears in the new files
- Plan verification: the three suites pass 84/84, and `npm run lint` and `npm run type-check` exit 0.

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-01*
