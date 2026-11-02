---
phase: 12-contact-edge-pages-cleanup-verification
plan: 12
subsystem: ui
tags: [nextjs, not-found, svg, tailwind, edge-pages, jest, playwright]

requires:
  - phase: 12-01
    provides: "Resolved values: copy.404-body, copy.404-photo, copy.404-project (supplied); default.7 square sheet (supplied, default kept)"
  - phase: 12-02
    provides: "Server-rendered section misses via proxy.ts, the `context` prop and the neutral-slug 404 (T-12-03)"
  - phase: 12-11
    provides: "Round 1 baselines (not-found is round 2)"
provides:
  - "lib/edge-art.ts: EDGE_SAFE_BOX, EDGE_TRAIL, EDGE_DOT, distanceToSegment, trailPath"
  - "components/site/EdgeArt.tsx: zero-JS aria-hidden contour sheet with the dashed trail and the you-are-here dot"
  - "components/site/EdgeLayout.tsx: shared edge grid (text, art, extra) for the 404 now and error/global-error/offline in 12-15"
  - "The marked-trail 404 on every variant with Tim's sentences and the context link first"
  - "Root not-found title 'Page not found · Tim Lui'"
affects: [12-15, 12-19, 12-21, 12-23]

actuals:
  tokens: 8100
  tasks: 2
  commits: 3
plan_head_before: 13cb24f65a0a4dc87c69a1228b291667381559a9
plan_head_after: 467229111f79126f045b32bc82ee2aad43c2f5ae

tech-stack:
  added: []
  patterns:
    - "Edge art geometry is a committed import-free constant with a Jest safety check (safe box, dot distance), never derived from the request"
    - "Edge pages pass a `text` node (and optional `extra`) to EdgeLayout; the art slot is fixed"

key-files:
  created:
    - lib/edge-art.ts
    - lib/__tests__/edge-art.test.ts
    - components/site/EdgeArt.tsx
    - components/site/EdgeLayout.tsx
    - components/site/__tests__/EdgeLayout.test.tsx
    - components/site/__tests__/NotFoundBody.test.tsx
  modified:
    - components/site/NotFoundBody.tsx
    - app/not-found.tsx
    - e2e/shell.spec.ts
    - e2e/not-found.spec.ts
    - e2e/case-study.spec.ts

key-decisions:
  - "Edge art (default #7): Tim's reply kept the DEFAULT, so the square sheet (max 448 px) ships; no checkpoint needed"
  - "Trail is a 7-point switchback (64,432 -> 128,112) and the dot sits at (400,256), 72.4 viewBox units from the nearest segment (test floor 56)"
  - "The art slot wrapper carries w-full in addition to the UI-SPEC classes: under lg:justify-self-end a fit-content grid item whose only child is an aspect-square w-full box collapses to 0 px"
  - "app/(site)/not-found.tsx is unchanged: it already renders the generic NotFoundBody, which now has the new layout"

patterns-established:
  - "Edge page text block: mono kicker, h1 text-balance, one ink-muted sentence, action row flex-wrap items-center gap-4"

requirements-completed: [EDGE-01]

coverage:
  - id: D1
    description: "Edge art geometry: 5-8 trail points and the dot inside [48, 464], dot >= 56 units from every segment, distanceToSegment and trailPath behaviour"
    requirement: EDGE-01
    verification:
      - kind: unit
        ref: "lib/__tests__/edge-art.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "EdgeArt and EdgeLayout: zero-JS server components; DOM order text, art, extra; aria-hidden art with one dashed (8 6) path and one r 8 dot; lg 28rem right column with items-start"
    requirement: EDGE-01
    verification:
      - kind: unit
        ref: "components/site/__tests__/EdgeLayout.test.tsx"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every 404 variant shows 'Error 404 · Page not found', 'You've left the marked trail', Tim's sentence and the right links, HTTP 404, no redirect, no focus move, title 'Page not found · Tim Lui', slug never echoed"
    requirement: EDGE-01
    verification:
      - kind: unit
        ref: "components/site/__tests__/NotFoundBody.test.tsx"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/not-found.spec.ts --project=chromium --project=firefox --project=webkit"
        status: pass
      - kind: e2e
        ref: "e2e/shell.spec.ts 'Shell 404' (chromium, firefox, webkit)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Visual quality of the marked-trail picture and layout at 375, 768 and 1440 (round 2 pixels)"
    requirement: EDGE-01
    verification: []
    human_judgment: true
    rationale: "Pixel change is intentional and Tim-gated: round 2 re-baseline (12-19) is where the new not-found shots are reviewed"

duration: 10min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 12: Marked-Trail 404 Summary

**Every 404 now renders "You've left the marked trail" in a shared edge grid beside a zero-JS contour sheet. The sheet has a dashed ink-muted switchback and an accent "you are here" dot 72 units off the trail. Each variant shows Tim's sentence and puts the missed section's link first, and the title is "Page not found · Tim Lui".**

## Performance

- **Duration:** about 10 min of execution (measured from the start stamp)
- **Started:** 2026-11-02T21:11:16Z
- **Completed:** 2026-11-02T21:21:33Z
- **Tasks:** 2
- **Files modified:** 11 (6 created, 5 modified)

## Accomplishments

- `lib/edge-art.ts` is an import-free constant with tested geometry. It holds the safe box [48, 464], a 7-point switchback, and the dot at (400, 256). The nearest segment is (320,304)-(336,192), at 72.4 units.
- `EdgeArt` is the UI-SPEC sheet: aria-hidden, aspect-square, surface-raised ground, hero `ContourField`, and an inline SVG overlay. The overlay has the trail (`stroke-ink-muted`, width 2, dasharray `8 6`, round caps, non-scaling stroke) and the dot (`r 8`, `fill-accent stroke-surface-raised`, width 3). It has no hooks, no client JS and no motion.
- `EdgeLayout` is the shared edge grid. It has `text`, a fixed art slot and an optional `extra`. Below lg they stack in that DOM order. From lg the art sits in the 28rem right column across both rows, with `items-start`.
- `NotFoundBody` now renders inside `EdgeLayout` with the locked kicker and h1. The body sentence comes from 12-01 `copy.404-body`, `copy.404-photo` or `copy.404-project`. The links per context are: generic, Photographs and Engineering; photos, All photographs and Engineering; projects, All routes and Photographs. It still has no focus code and no slug input.
- `app/not-found.tsx` exports `metadata = { title: 'Page not found' }`. Through the root template, the title is "Page not found · Tim Lui".
- Measured live on the production build at 1440: text in column 1, sheet 448 x 448 at x 811. At 768 the sheet is 448 x 448, left-aligned under the text. At 375 the sheet is 333 x 333: the column is 365 - 32, because the test browser reserves a 10 px stable scrollbar gutter (STATE 07-12). The h1 takes 88 px (2 lines) at 375.

## Task Commits

1. **Task 1 RED: failing tests for the edge art geometry and edge layout** - `c391d16` (test)
2. **Task 1 GREEN: edge art and the shared edge layout (D-09)** - `398423c` (feat)
3. **Task 2: the marked-trail 404 with context links (EDGE-01, D-10, D-11)** - `4672291` (feat)

No REFACTOR commit: there was nothing to clean up.

## TDD (Task 1)

- **RED:** `npx jest lib/__tests__/edge-art.test.ts components/site/__tests__/EdgeLayout.test.tsx` exited 1 with 14 of 14 failed. Each target failed on its planned assertion: safe box `{0,0}` against `{48,464}`; trail length 0 against >= 5; dot outside the box; `distanceToSegment` NaN against 5; `trailPath` not starting with `M`; no `.grid`, `svg` or `aria-hidden` sheet. The suites loaded and compiled because the RED commit carries export-only skeletons of the three modules. Without them the suites would fail at load time, which counts as INVALID_RED. **Semantic assessment:** valid RED. Every target ran and failed for the missing behaviour, with no load, syntax or fixture faults. The `gsd tdd-red-evidence` classifier has no Jest adapter (it reads TAP, JUnit, go, swift and unittest), and the project has no TAP or JUnit Jest reporter installed. No package was installed for this. `workflow.tdd_mode` is not enabled, so the gate is advisory.
- **GREEN:** after the implementation the same suites pass (50/50 in `lib/__tests__/edge-art.test.ts` plus `components/site`).

## Files Created/Modified

- `lib/edge-art.ts`: trail and dot constants, safe box, `distanceToSegment`, `trailPath`
- `lib/__tests__/edge-art.test.ts`: 8 geometry tests
- `components/site/EdgeArt.tsx`: the contour sheet with the trail and dot
- `components/site/EdgeLayout.tsx`: the shared edge grid
- `components/site/__tests__/EdgeLayout.test.tsx`: DOM order, lg placement, aria-hidden, path and circle
- `components/site/NotFoundBody.tsx`: the 404 text block in `EdgeLayout`, with content per context
- `components/site/__tests__/NotFoundBody.test.tsx`: per-context sentences and links, kicker and h1, `@ts-expect-error` slug, no focus
- `app/not-found.tsx`: title metadata
- `e2e/shell.spec.ts`: "Shell 404" uses the new h1 and kicker (same paths, same counts)
- `e2e/not-found.spec.ts`: covers the h1 in server HTML (escaped or literal), the kicker, the title, a generic server-HTML case, an aria-hidden square sheet with nothing focusable, no focus move, and no horizontal scroll at 375 x 800 with the sheet filling the column
- `e2e/case-study.spec.ts`: its 404 kicker check moved to the new string (deviation 1)

## Decisions Made

- **Default #7 (edge art):** 12-01 records `default.7 | supplied | Default: Edge art: square sheet, max 448 px`. Tim kept the default, so the square sheet ships. It is not "pending Tim", and no checkpoint was needed.
- **Copy:** the three 404 sentences are supplied in 12-01 and ship verbatim, so no Content Gates fallback is used.
- `app/(site)/not-found.tsx` has no code change. It renders `<NotFoundBody />` (generic) and picks up the new layout through the component.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] case-study.spec 404 kicker assertion**
- **Found during:** Task 2
- **Issue:** `e2e/case-study.spec.ts:102` matched the old kicker `'Error 404'` exactly, so it would break with the locked `'Error 404 · Page not found'`. The file is not in the plan's `files_modified`.
- **Fix:** the assertion was rewritten to the new kicker string, with the same paths and counts, and nothing deleted.
- **Files modified:** e2e/case-study.spec.ts
- **Verification:** chromium run of not-found, shell and case-study specs: 86/86 passed
- **Committed in:** 4672291

**2. [Rule 1 - Bug] Art slot collapse under lg:justify-self-end**
- **Found during:** Task 1
- **Issue:** with only the UI-SPEC classes, the art slot is a fit-content grid item at lg. Its sole child is `aspect-square w-full`, whose content is absolutely positioned, so the slot has no intrinsic width and would render 0 px wide.
- **Fix:** added `w-full` to the art slot wrapper. At lg it equals the 28rem column, so the placement is unchanged.
- **Files modified:** components/site/EdgeLayout.tsx
- **Verification:** live measurement: sheet 448 x 448 at 768 and 1440, filling the column at 375
- **Committed in:** 398423c

**3. [Rule 1 - Test] 375 px sheet-width assertion uses the column, not 343 px**
- **Found during:** Task 2 verification
- **Issue:** the first version of the new 375 x 800 test expected `clientWidth - 32` (343). In the test browser, `main` is 365 px wide because of the stable 10 px scrollbar gutter (STATE 07-12), so the sheet is 333 px.
- **Fix:** the test now asserts that the sheet equals the main content column (main width - 2 x 16) within 1 px, is at most 448 px, and is square.
- **Files modified:** e2e/not-found.spec.ts
- **Committed in:** 4672291

**4. [Process] RED commit includes export-only skeletons**
- **Issue:** Jest fails a suite at load time when the imported module is missing, which is INVALID_RED.
- **Fix:** the RED commit carries skeletons that export the planned symbols with wrong values, so the tests fail on their assertions. GREEN replaced them.
- **Committed in:** c391d16

**Total deviations:** 4 (3 Rule 1 auto-fixes, 1 process note)
**Impact on plan:** none on scope. The fixes are needed for correctness and to keep the existing specs in step with the locked copy.

## Verification

- `npm run lint`: exit 0. `npm run type-check`: exit 0.
- `npx jest --silent`: 94 suites, 1,500 tests, all passed.
- Fresh build, `PW_PROD=1 npx playwright test e2e/not-found.spec.ts e2e/shell.spec.ts --project=chromium --project=firefox --project=webkit`: 141 passed, 9 failed.
  - not-found.spec passed in full on all three engines, including the `serviceWorkers: 'allow'` block and the router.push case.
  - shell.spec passed in full on chromium and firefox.
  - The 9 failures are all webkit `shell.spec` "Shell landmarks" (8) and "Shell mobile menu" (1). Each is the `toBeFocused()` timeout after a Tab press on a link. These are the same 9 pre-existing failures that 12-02 recorded: WebKit on Windows does not Tab-focus links by default. They never visit a 404 page, and 12-23 owns their triage.
  - On webkit, "Shell 404" passed in full for all 7 paths, as did the 375 px h1, wrap and target test.
- Per task (reused server): chromium run of not-found, shell and case-study specs, 86/86 passed.
- No-echo (T-12-03, T-12-24): `curl -s /photos/nf-check1 | grep -c nf-check1` printed 0. The token checks on full HTML, outerHTML and title stay green on all engines. The component has no slug input (`@ts-expect-error` test), and the art is a committed constant.
- `git status --porcelain public/service-worker.js` printed nothing. It was restored after each server stopped, and port 3000 is free.

## Round 2 expected diffs (for 12-19)

Snapshots that change on purpose: `e2e/visual/routes.spec.ts-snapshots/not-found/375-reduced-visual-dark-linux.png`, `768-reduced-visual-dark-linux.png` and `1440-reduced-visual-dark-linux.png` (new kicker, h1, sentence and the edge art sheet; at 375 and 768 the page gets taller). No other route renders `NotFoundBody` in the visual suite. No PNG was touched.

## Issues Encountered

None beyond the deviations above.

## Flagged (carried from the plan, not resolved here)

- Edge EDGE-01 (unclassified): three-segment paths under /photos and /projects (generic 404, covered by e2e), percent-encoded slugs (never decoded into the page), and the intercepted lightbox route `/photos/(.)[slug]` for an unknown slug reached by soft navigation. Surfaced only.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- `EdgeLayout` and `EdgeArt` are ready for 12-15 (error, global-error, offline). `extra` takes the offline saved-pages list.
- 12-19 must re-baseline the three not-found shots listed above (Tim-gated).
- 12-21 keyboard spec: on the 404, Go to the homepage comes first, then the two text links in the context order above.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*
