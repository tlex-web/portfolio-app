---
phase: 17-region-routes-seo-structured-data
plan: 10
subsystem: seo
tags: [nextjs, sitemap, playwright, jest, audit, canonical]

requires:
  - phase: 17-region-routes-seo-structured-data
    provides: 17-02 sweep timeout scaled by AUDIT_SWEEP.length; 17-05 the published photo set; 17-07 region canonical metadata and OG cards
provides:
  - /sitemap.xml lists nav, every region page, every published photo page (by region, altitude ascending), then projects
  - e2e test "every sitemap URL is its page's canonical @chromium-only"
  - data-derived audit coverage pins (every region and published photo page audited)
affects: [17-15, 18]

actuals:
  tokens: 2198     # chars/4 over the added lines of 3ed68cc..d2b5f2d
  tasks: 2
  commits: 3       # MEASURED: git rev-list --count 3ed68cc..HEAD at SUMMARY write
plan_head_before: 3ed68ccd03143999414d7d77ddfeddb3304ee07d
plan_head_after: d2b5f2d4f816d0c304cfefa13f2ab13a4af22465

tech-stack:
  added: []
  patterns:
    - "Sitemap order comes only from committed data: regions in registry order (schema-sorted ids), photos via regionPhotoViews (buildWaypoints' altitude-then-id order)"
    - "Ordering pins recompute the order from data/generated/photos, independently of the module the sitemap reads"

key-files:
  created: []
  modified:
    - app/sitemap.ts
    - e2e/seo.spec.ts
    - lib/__tests__/audit-routes.test.ts
    - lib/__tests__/photo-routes.test.ts

key-decisions:
  - "17-10: the canonical-equals-sitemap test budget is 60 s + 10 s per SITEMAP_PATHS entry (SITEMAP_CANONICAL_PAGE_MS), scaled like 17-02's sweep; a page there is one load and one head read"
  - "17-10: the sitemap page count is pinned as a floor from the data (nav + regions + published photos + projects); the exact list stays pinned by e2e expectedSitemap"

patterns-established:
  - "Data checks over every sitemap URL run once, in Chromium (@chromium-only), and collect mismatches so a failure names every path"

requirements-completed: [REGION-07, PHOTO-05]

coverage:
  - id: D1
    description: "The sitemap lists every region page and every published photo page once, absolute on site.url, after the nav and before the projects, with no lastModified and no /offline"
    requirement: REGION-07
    verification:
      - kind: unit
        ref: "lib/__tests__/photo-routes.test.ts#sitemap photo and region URLs (D-15, REGION-07, PHOTO-05)"
        status: pass
      - kind: e2e
        ref: "e2e/seo.spec.ts#the sitemap lists exactly the nav, region, photo and project URLs, each once, /contact included and no /offline (PW_PROD=1, chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The sitemap order is deterministic: regions in registry order, photos by region then altitude ascending, ties by id"
    requirement: REGION-07
    verification:
      - kind: unit
        ref: "lib/__tests__/photo-routes.test.ts#orders the photo pages by region (registry order), then altitude ascending, ties by id"
        status: pass
      - kind: unit
        ref: "lib/__tests__/photo-routes.test.ts#is deterministic: two calls give the same list, with no lastModified on any entry"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every sitemap URL equals its page's single canonical link"
    requirement: REGION-07
    verification:
      - kind: e2e
        ref: "e2e/seo.spec.ts#every sitemap URL is its page's canonical @chromium-only (PW_PROD=1, 21 paths, 9.7 s)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every region page and every published photo page is audited: /photos/regions/zermatt in ROUTES, the other 13 sitemap pages in AUDIT_SWEEP, and the sweep passes inside its scaled timeout"
    requirement: PHOTO-05
    verification:
      - kind: unit
        ref: "lib/__tests__/audit-routes.test.ts#every sitemap page is audited (VERIFY-05)"
        status: pass
      - kind: e2e
        ref: "e2e/audit.spec.ts#every sitemap page once in Chromium @chromium-only (PW_PROD=1, 13 pages, 12.9 s of a 450 s budget)"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-11-24
status: complete
---

# Phase 17 Plan 10: Regions and Published Photos in the Sitemap Summary

**/sitemap.xml now lists 21 URLs in a fixed order: 5 nav pages, 3 region pages in registry order, 11 published photo pages grouped by region with altitude ascending, then 2 project pages. Each URL equals its page's canonical, and the audit sweep grew from 4 to 13 pages without any edit to e2e/routes.ts.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-11-24T00:50:23Z
- **Completed:** 2026-11-24T00:57:31Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `app/sitemap.ts` lists nav, then `regions.map(r => site.url + regionHref(r.id))`, then `regions.flatMap(r => regionPhotoViews(r.id))` through `photoHref`, then the projects. It still sets no `lastModified`. The doc block now states D-15 (exactly the canonical URLs), the D-11 page order, why the output is deterministic, and that SITEMAP_PATHS and AUDIT_SWEEP derive from this list.
- photo-routes.test checks that the sitemap lists every published slug at `site.url + '/photos/' + slug` (11) and every region at `site.url + '/photos/regions/' + id`, in registry order. It also checks the section order (nav, regions, photos, projects) and that two calls give the same list with no `lastModified`. The photo order (region rank, then altitude, then id) is recomputed from `data/generated/photos`.
- audit-routes.test computes the page floor from the data: nav + regions + published photos + projects = 21. Every region and published photo path must be in ROUTES or AUDIT_SWEEP. `/photos/regions/zermatt` is in ROUTES and the other regions are in the sweep (SC2).
- In seo.spec, `expectedSitemap` builds region URLs with the literal `/photos/regions/` path and lists photos grouped by region. A new test, `every sitemap URL is its page's canonical @chromium-only`, loads every SITEMAP_PATHS entry and collects any mismatch in status, canonical count or href. Its timeout is `60_000 + SITEMAP_PATHS.length * 10_000`.

## Audit sweep (RESEARCH Assumption A3)

On a local production build (`PW_PROD=1`, Chromium, 1440):

- **Pages:** 13 (`/photos/regions/ortler`, `/photos/regions/saalfelden`, 10 photo pages, `/projects/coin-flip`). SITEMAP_PATHS has 21 entries; the other 8 are ROUTES template entries.
- **Duration:** 12.9 s for the sweep test (1 passed, 19.7 s wall time once the server was up). The scaled budget is 60 s + 13 x 30 s = 450 s, so local Chromium takes about 1 s per page. CI timing is still 17-15's to record (D-27).
- **Canonical check:** 21 paths in 9.7 s; its budget is 270 s.

## Task Commits

1. **Task 1: Regions and every published photo in the sitemap** (TDD)
   - `931aefb` (test, RED): photo-routes, audit-routes and seo.spec contract rows
   - `19d15f3` (feat, GREEN): the region and published-photo sections in app/sitemap.ts
2. **Task 2: Every sitemap URL equals its page's canonical** - `d2b5f2d` (test)

## TDD Gate Compliance

- **RED (`931aefb`):** `npx jest lib/__tests__/audit-routes.test.ts lib/__tests__/photo-routes.test.ts lib/__tests__/regions.test.ts` exited 1, with 7 failed and 105 passed. Every failure is an assertion on the planned behaviour:
  - the floor (`Expected: >= 21, Received: 11`);
  - the region and published-photo coverage rows (region and photo paths missing from ROUTES/AUDIT_SWEEP);
  - the region URL row (no `/photos/regions/` entry);
  - the photo set and order rows (7 published photos missing);
  - the section-order row (no region found, index -1).

  None was a syntax, import or collection fault, and type-check passed with the RED tests in place. The output is in `.gsd/tdd-evidence/17-10/red-t1.txt` (git-ignored).
- **GREEN (`19d15f3`):** the same three suites passed 112/112. The full Jest suite passed: 119 suites, 2,211 tests.
- The `tdd-red-evidence` classifier was not run, because Jest's reporters are not among its formats. As in 17-01, 17-05 and 17-07, the verdict above is a semantic assessment of the saved output.
- No REFACTOR commit.

## Files Created/Modified

- `app/sitemap.ts`: the region and published-photo sections and the D-15 doc block
- `e2e/seo.spec.ts`: region-aware `expectedSitemap`, a renamed sitemap test, the canonical-equals-sitemap test and `SITEMAP_CANONICAL_PAGE_MS`
- `lib/__tests__/audit-routes.test.ts`: the data-derived floor, region and published-photo coverage, the region template/sweep split
- `lib/__tests__/photo-routes.test.ts`: the `sitemap photo and region URLs` describe (set, region order, photo order, section order, determinism)

## Decisions Made

- The canonical test's per-page budget is 10 s rather than the sweep's 30 s, because it does one load and one head read. It measured about 0.5 s per page.
- The page count is a floor (`>=`), as the plan's behaviour says. The exact list is pinned by e2e `expectedSitemap`.

## Deviations from Plan

None. The plan ran as written.

The existing sitemap test in seo.spec was renamed from "…the nav, photo and project URLs…" to "…the nav, region, photo and project URLs…". No guard or file pins that name, and the test count is unchanged.

## Issues Encountered

None.

## Verification

- Jest: audit-routes, photo-routes and regions 112/112; full suite 119 suites, 2,211 tests.
- `npm run type-check` (three configs) exit 0. `npm run lint` exit 0 (eslint, guards, selftest, images, test-count scan). The D-18/D-06 hand-built-path scan passes on the new sitemap.
- `PW_PROD=1 npx playwright test e2e/seo.spec.ts e2e/shell.spec.ts --project=chromium --project=firefox`: **109 passed**, 0 failed, 0 flaky.
- `PW_PROD=1 npx playwright test e2e/audit.spec.ts -g "every sitemap page once in Chromium" --project=chromium`: **1 passed** (12.9 s).
- `public/service-worker.js` was restored after each production run. Nothing was left listening on :3000 or :3017.
- Acceptance checks:
  - `regionHref` in app/sitemap.ts: 3 (expected at least 1);
  - `/photos/regions/` in e2e/seo.spec.ts: 1 (expected at least 1);
  - `lastModified:` in app/sitemap.ts: 0 (expected 0);
  - the canonical test is listed once in Chromium and is excluded from Firefox;
  - `node scripts/ci/check-snapshot-commit.mjs --none`: OK (0 changed) after each of the three commits. No PNG was staged.

## Known Stubs

None.

## Threat Flags

None. T-17-21 is mitigated: every sitemap URL comes from regionHref or photoHref over the registry and the published set, the e2e contract pins the exact list, the canonical test runs over all 21 entries, and `/offline` stays out.

## User Setup Required

None.

## Next Phase Readiness

- 17-15 can record CI per-leg durations with the grown sweep (13 pages; the WebKit leg runs no `@chromium-only` row).
- Phase 18: a new region or photo joins the sitemap, the canonical check and the audit sweep through the data alone.

## Self-Check: PASSED

- FOUND: app/sitemap.ts, e2e/seo.spec.ts, lib/__tests__/audit-routes.test.ts, lib/__tests__/photo-routes.test.ts
- FOUND: 931aefb, 19d15f3, d2b5f2d are ancestors of HEAD; test(17-10) 931aefb precedes feat(17-10) 19d15f3

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-24*
