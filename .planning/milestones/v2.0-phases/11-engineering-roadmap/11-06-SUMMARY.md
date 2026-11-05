---
phase: 11-engineering-roadmap
plan: 06
subsystem: ui
tags: [nextjs, server-components, tailwind, phosphor, playwright, jest]

requires:
  - phase: 09-home
    provides: countLabel (lib/home-format.ts), prose-link and text-link styling, the trail-sign route count
provides:
  - "RoutePanel (components/projects/RoutePanel.tsx): Server route panel with kicker units, h2 block link (data-route-link), pitch and links row"
  - "Server-rendered /projects titled Engineering with the route count kicker, the Routes list and the empty state"
  - "toPanelProps(project) mapper in app/(site)/projects/page.tsx: the only reader of project fields on /projects"
  - "Hex code removed: ProjectCard, its test, useHexGrid and the .hex-clip / .hex-grid CSS"
affects: [11-07, 11-12, ENG-01]

actuals:
  tokens: 10059
  tasks: 2
  commits: 3
plan_head_before: 2a04356190376c312043cf160440aaa684597c43
plan_head_after: baaba233e31ddd4017adf6d1cf5e3630f206a9e2

tech-stack:
  added: []
  patterns:
    - "Stretched block link: title Link with after:absolute after:inset-0 inside a relative article; the links row sits above it with relative z-10"
    - "Panel focus ring via has-[a[data-route-link]:focus-visible] on the article, with the link's own outline suppressed"
    - "Page-local props mapper (toPanelProps) so a data swap rewrites one function"

key-files:
  created:
    - components/projects/RoutePanel.tsx
    - components/projects/__tests__/RoutePanel.test.tsx
    - components/projects/__tests__/projects-page.test.tsx
  modified:
    - app/(site)/projects/page.tsx
    - app/globals.css
    - e2e/projects.spec.ts
  deleted:
    - components/ProjectCard.tsx
    - components/__tests__/ProjectCard.test.tsx
    - lib/useHexGrid.ts

key-decisions:
  - "RoutePanel wraps its content in one min-w-0 column div, so the lg 3fr/2fr grid keeps the kicker, title, pitch and links stacked in the left column; 11-12 adds the profile figure as the second grid child"
  - "The kicker paragraph is not rendered when countLabel returns '' (zero projects) or when both kicker units are missing: no empty element, no placeholder"
  - "GitHub wins when links carries both github and privateRepo; the private note shows only without a link"
  - "e2e (d) asserts the hit target (elementFromPoint at the pitch centre is the title link) and retries click-and-navigate with toPass, because dev-server Fast Refresh reloads from parallel workers can send the page back to /projects"

patterns-established:
  - "RoutePanel props: { slug; name; kicker: { version?; status? }; pitch?; links?: { github?; privateRepo? } }"

requirements-completed: [ENG-01]

coverage:
  - id: D1
    description: "RoutePanel renders kicker units with a hidden separator, a single h2 block link to /projects/{slug}, the pitch, and a links row with a same-tab GitHub link or the private-repository note"
    requirement: ENG-01
    verification:
      - kind: unit
        ref: "components/projects/__tests__/RoutePanel.test.tsx (10 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "/projects is a Server Component titled Engineering with the route count kicker, the Routes list in data order and the empty state linking to /roadmap"
    requirement: ENG-01
    verification:
      - kind: unit
        ref: "components/projects/__tests__/projects-page.test.tsx (4 tests)"
        status: pass
      - kind: e2e
        ref: "e2e/projects.spec.ts#Engineering route panels (ENG-01) (8 tests, chromium)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No hexagon card, hook or CSS remains, and no element on /, /photos, /projects, /roadmap or the first case study has a hex- class"
    requirement: ENG-01
    verification:
      - kind: e2e
        ref: "e2e/projects.spec.ts#no element on any route carries a hex class"
        status: pass
      - kind: other
        ref: "git grep -n -E 'useHexGrid|hex-grid|hex-clip' -- app components lib (exit 1); grep -c hex- app/globals.css (0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Route panel visual quality (spacing, hover and focus ring, the empty right column at 1024 px until 11-12)"
    verification: []
    human_judgment: true
    rationale: "Visual polish and the interim layout are a design judgment no test asserts"

duration: 15min
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 06: Route panels on /projects Summary

**/projects is now a server-rendered Engineering page of full-width route panels (kicker, stretched h2 block link, pitch, links row), and every piece of hexagon card code is gone.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-11-01T18:52:31Z
- **Completed:** 2026-11-01T19:08:02Z
- **Tasks:** 2
- **Files modified:** 9 (3 created, 3 modified, 3 deleted)

## Accomplishments
- `RoutePanel` Server Component: the `{version} · {status}` kicker as nowrap units with an aria-hidden separator, an h2 block link carrying `data-route-link` whose `::after` covers the panel, the pitch in `max-w-prose`, and a links row with either a same-tab GitHub link or `LockKeyIcon` plus "Source: private repository" (D-12, §I #5 and #7 defaults).
- `/projects` is a Server Component: `metadata = { title: 'Engineering' }` (document title "Engineering · Tim Lui"), header band with the `countLabel` kicker and h1, `<ol aria-label="Routes">`, and the empty state linking to /roadmap.
- Hex code removed: `ProjectCard.tsx`, its test, `lib/useHexGrid.ts`, and the `.hex-clip` / `.hex-grid` rules with their comments.
- `e2e/projects.spec.ts` rewritten from 7 v1 tests to 8 route-panel tests.

## For 11-07 and 11-12

- **RoutePanel props:** `{ slug: string; name: string; kicker: { version?: string; status?: string }; pitch?: string; links?: { github?: string; privateRepo?: boolean } }` (exported as `RoutePanelProps`). Default export `RoutePanel`; DOM hook `data-route-link` on the title link.
- **Mapper:** `toPanelProps(project: Project): RoutePanelProps` in `app/(site)/projects/page.tsx`. It passes slug, name, `kicker: { version }` and `pitch: tagline`, and no links. 11-07 rewrites this function for the new schema (box `links.github`, coin-flip `links.privateRepo`, status words) and adds the D-16 intro paragraph to the header band.
- **Layout:** the article is a `lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]` grid with one `min-w-0` content column. 11-12 inserts the metric strip and release line between the pitch and the links row and adds the profile figure as the article's second child.

## Test counts

- ProjectCard.test (8 tests) became RoutePanel.test (10) plus projects-page.test (4).
- projects.spec (7 tests) became 8 tests.
- Full Jest: 71 suites, 1095 tests passed. guard:tests: jest 1095 + e2e 377 = 1472 (baseline 1300), OK.

## Task Commits

1. **Task 1 RED: RoutePanel and /projects page tests**: `bf55f61` (test)
2. **Task 1 GREEN: route panels on a server-rendered /projects; hex cards removed**: `1522218` (feat)
3. **Task 2: projects e2e for route panels; hex CSS removed**: `baaba23` (test)

## TDD Gate Compliance

- RED `bf55f61` precedes GREEN `1522218`. `workflow.tdd_mode` is not enabled, so the classifier gate was not run.
- RED semantic assessment: `projects-page.test.tsx` ran all 4 tests against the old client page, and all 4 failed. `metadata` was undefined (TypeError on `.title`). The empty-state copy was absent (an assertion failure). The v1 `ProjectCard` threw on the minimal fixtures, which have no `status`. `RoutePanel.test.tsx` failed at module resolution because `../RoutePanel` did not exist yet. That is a load failure rather than an assertion failure, but it is the expected RED for a new component. Every target behaviour was absent before GREEN.
- GREEN: 14/14 pass; lint and type-check exit 0.

## Files Created/Modified
- `components/projects/RoutePanel.tsx`: the Server route panel
- `components/projects/__tests__/RoutePanel.test.tsx`: 10 unit tests (successor of ProjectCard.test)
- `components/projects/__tests__/projects-page.test.tsx`: 4 page tests with `@/data/projects` mocked
- `app/(site)/projects/page.tsx`: the Server Component page with the `toPanelProps` mapper
- `app/globals.css`: hex rules deleted; trail-yellow comment reads "Phase 11's T1 trail badge (coin-flip's Zmutt path) reads the same primitive"
- `e2e/projects.spec.ts`: 8 browser tests for ENG-01
- Deleted: `components/ProjectCard.tsx`, `components/__tests__/ProjectCard.test.tsx`, `lib/useHexGrid.ts`

## Decisions Made
See key-decisions in the frontmatter. In short: one content column inside the grid, no empty kicker element, GitHub wins over the private note, and the e2e stretched-link check asserts the hit target directly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Content column wrapper inside the panel grid**
- **Found during:** Task 1
- **Issue:** As written, the kicker, h2, pitch and links row are direct children of the `lg:grid` article. At 1024 px and above they would flow across both columns (kicker left, title right).
- **Fix:** Wrapped them in one `<div className="min-w-0">`, so they stack in the 3fr column and the 2fr column waits for the 11-12 figure. DOM order is unchanged.
- **Files modified:** components/projects/RoutePanel.tsx
- **Committed in:** 1522218

**2. [Rule 1 - Bug] Leftover comment naming the hex grid**
- **Found during:** Task 2
- **Issue:** The Phase 4 section header in `app/globals.css` (line 457) still read "Glow utilities, hex grid, stratified depth, contour animation", which goes against the rule that no comment may name the removed code.
- **Fix:** Reworded it to "Glow utilities, stratified depth, contour animation". `grep -ci hex app/globals.css` now prints 0.
- **Files modified:** app/globals.css
- **Committed in:** baaba23

**3. [Rule 3 - Blocking] e2e robustness against dev-server reloads**
- **Found during:** Task 2
- **Issue:** In parallel `next dev` runs, the pitch-click test failed 2 of 3 times (URL stayed /projects), and the hex test once hit `net::ERR_ABORTED` on /roadmap. Diagnosis with a temporary spec, since deleted: `elementFromPoint` at the pitch centre is the title link (`A /projects/clix-cli`), and the page does navigate to `/projects/clix-cli`. A Fast Refresh rebuild, set off by another worker's first compile, then reloads it back to `/projects`. This is dev-only; CI uses the production build with one worker.
- **Fix:** Test (d) asserts the hit target and retries goto, click and URL with `expect(...).toPass`. The hex loop retries each page load the same way. Both use `test.slow()`.
- **Files modified:** e2e/projects.spec.ts
- **Verification:** 3 of 3 parallel runs green for projects.spec; the plan-level set (projects, homepage, home-ascent, design-system) passed 71/71.
- **Committed in:** baaba23

---

**Total deviations:** 3 auto-fixed (2 bug, 1 blocking)
**Impact on plan:** All three are needed for correct layout or reliable tests. No scope creep.

## Issues Encountered
- `design-system.spec.ts` "scroll lock keeps the header box" failed in some parallel dev runs alongside projects.spec, but passed alone (7/7), serially (15/15) and in the final plan-level run (71/71). This is the open, pre-existing item in `.planning/phases/10-photography/deferred-items.md` ("Dev-server cross-talk breaks the G3 scroll-lock case in a multi-spec run", found in 10-06). This plan did not cause it and did not change it.

## Known Stubs
- None that block the goal. Until 11-07 the panels show today's CLI_X name, version and tagline with no repository link, as the plan flags. From 1024 px the right grid column is empty until 11-12 adds the profile figure.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 11-07 can swap the project data by rewriting `toPanelProps` and adding the intro paragraph.
- 11-12 adds the metric strip, the release line and the profile figure to RoutePanel, and applies any §I #5 or #7 alternative Tim picks.
- ENG-01 goes in requirements-completed; the orchestrator marks REQUIREMENTS.md once 11-02 closes.

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-01*

## Self-Check: PASSED
