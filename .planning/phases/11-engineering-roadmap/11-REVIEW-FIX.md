---
phase: 11-engineering-roadmap
fixed_at: 2026-11-02T02:07:39Z
review_path: .planning/phases/11-engineering-roadmap/11-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 11: Code Review Fix Report

**Fixed at:** 2026-11-02T02:07:39Z
**Source review:** .planning/phases/11-engineering-roadmap/11-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (WR-01 and WR-02. Tim chose "Fix 2 warnings now")
- Fixed: 2
- Skipped: 0 in scope. The 12 Info findings (IN-01 to IN-12) are out of scope by Tim's choice; see the list below.

## Fixed Issues

### WR-01: A malformed URL hash makes RouteIndex throw `URIError` on every observer callback

**Files modified:** `components/projects/RouteIndex.tsx`, `components/projects/__tests__/RouteIndex.test.tsx`
**Commit:** 541042b
**Status:** fixed
**Applied fix:** `hashSection` now wraps `decodeURIComponent` in try/catch and returns `null` when the hash can't be decoded. Both callers, the first observer callback and `onHashChange`, already treat `null` as "no section". The first callback now always reaches `first = false` and `spy()`. Two tests were written first and failed before the fix:
- With `#%` on load, `report()` doesn't throw. Pipeline becomes current, and a later report moves the spy on to Safety.
- A `#%E0` hashchange raises no `error` event on `window` and marks nothing current. A later `#safety` hashchange is still followed.

The 11-14 rules and the 11-17 sweep-to-top test are unchanged, and all 12 earlier RouteIndex tests still pass. The rendered markup is unchanged.

### WR-02: RouteLogFilters judges disabled segments with stale counts while a press is pending

**Files modified:** `components/roadmap/RouteLogFilters.tsx`, `components/roadmap/__tests__/RouteLogFilters.test.tsx`
**Commit:** 5aef73d
**Status:** fixed: requires human verification (a state-handling fix. The behaviour while a press is pending is a UX call for Tim; see the note below)
**Applied fix:** Each group's counts come from the server under the other group's value in `filter`. If the other group's optimistic value differs from `filter`, a press is pending and the counts are stale:
- `projectCountsStale = optimistic.status !== filter.status`
- `statusCountsStale = optimistic.project !== filter.project`

A segment is now disabled when `!pressed && (count === 0 || stale)`. While stale, the other group's unpressed segments behave like zero-count ones: `aria-disabled="true"`, the DISABLED dim, ignored presses, and they stay in the tab order (11-10 semantics). The pressed group stays live because its counts still hold. Once the server render lands, optimistic equals filter and everything is judged by the fresh counts.

This is the "inert while pending" option. I didn't use the client-side recount because it needs a new tally prop on the island, which changes the T-11-24 contract ("receives only filter and counts props"). It would also mean rewriting every existing fixture in the 11-10 test file. With this fix the props, the imports (T-11-24) and `router.replace(routeLogHref(next), { scroll: false })` as the only navigation (T-11-23) are all unchanged.

Tests:
- **Written first, failed before the fix:** from All/All, press box, then press Planned while the render is pending. Expected: `replace` is called once, only with `/roadmap?project=box`. Planned is `aria-disabled` but not `disabled`, and it stays unpressed.
- **Guard: same-group press:** a second press in the same group while pending still navigates.
- **Guard: after the render:** once the render lands with `{box, all}` counts, Completed is live again and Planned is disabled by its zero count.

All 10 earlier tests still pass.

**Note for human verification:** at rest, optimistic equals filter, so the markup is byte-identical and the visual baselines stay valid. During a pending press, the other group's three unpressed segments now dim (opacity-50) until the server render lands. On a fast connection this shows as a brief dim on each press. Also, while stale, those segments still show the previous filter's numbers. They're inert, so no press can act on them. If you'd rather keep the counts correct and avoid the dim, the alternative is the reviewer's client-side recount: pass a 3x3 area × status tally (9 integers, no data import) and run a `countsFor`-style recount on `optimistic`. That would supersede this fix.

## Out of scope (Tim's choice)

These 12 Info findings were not attempted. Reason: out of scope by user choice (fix scope was WR-01 and WR-02 only).

- IN-01: DemoTerminal and `tick` crash on an empty or shrunken command list (`components/projects/DemoTerminal.tsx:201,262`; `lib/demo-terminal.ts:74-85`)
- IN-02: The MP4 walker can throw `RangeError` on truncated box payloads, and the guard does not catch it (`scripts/guards/lib/mp4-boxes.mjs`; `scripts/guards/check-served-images.mjs:306`)
- IN-03: The metric `sourceUrl` accepts any URL scheme (`data/schemas/project.ts:39`)
- IN-04: Route-log row ids are unconstrained, yet they become DOM ids and URL fragments (`data/schemas/roadmap.ts:37`)
- IN-05: DemoClip hard-codes coin-flip copy and a fixed DOM id, and Demo hard-codes the clip id (`components/projects/DemoClip.tsx`, `components/projects/sections/Demo.tsx`)
- IN-06: The roadmap empty-state sentence breaks when no filter is set (`app/(site)/roadmap/page.tsx:99`)
- IN-07: RouteIndex hard-codes the band top that CSS derives from `--nav-h` (`components/projects/RouteIndex.tsx:9-11`)
- IN-08: React keys come from content whose uniqueness the schema does not enforce (several section components)
- IN-09: Section emptiness rules are written twice (`components/projects/CaseStudy.tsx` vs the sections)
- IN-10: fetch-trails reads source.json without the schema (`scripts/terrain/fetch-trails.mjs:379`)
- IN-11: A RouteRow comment calls /roadmap static (`components/roadmap/RouteRow.tsx:103-106`)
- IN-12: In write mode, build-clip is not atomic and deletes unknown files in public/media/ (`scripts/media/build-clip.mjs:314-330`)

## Verification

**Where it ran:**
- **Per-fix checks, in the isolated worktree** (`.claude/worktrees/rf-11-197671-*` on temp branch `gsd-reviewfix/11-197671`, resolving the main checkout's `node_modules` through parent directories): the two Jest files (RED, then GREEN), eslint on the touched files, a prettier diff of the new code, and `tsc --noEmit` (0 errors). Prettier also flags existing lines in the RouteIndex files that predate this change: `scrolledToEnd` and a test `expect`. I left them alone.
- **Full gates, in the main checkout:** run after the fast-forward to 5aef73d and after the worktree was removed. They can be reproduced from the current tree.

| Gate | Result |
|------|--------|
| `npx jest --silent` | 82 suites, 1306 tests passed |
| `npm run lint` (eslint plus all guards) | exit 0 |
| `npm run type-check` | exit 0 |
| `PW_PROD=1 npx playwright test e2e/case-study-page.spec.ts e2e/roadmap.spec.ts --project=chromium` (production build) | 46 passed |

After the production build I ran `git restore public/service-worker.js`, so the postbuild-injected form was not committed. The cleanup tail finished: fast-forward, worktree removed, temp branch deleted, recovery sentinel removed.

---

_Fixed: 2026-11-02T02:07:39Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
