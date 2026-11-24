---
phase: 18-immersive-survey-layout
plan: 02
subsystem: ui
tags: [sources-page, licences, attribution, sitemap, offline-catalog, client-graph, regions]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: GLO90_NOTICE / GLO90_LIABILITY, the BEV credit in the Saalfelden source.json, overview outlines
  - phase: 17-region-routes-seo-structured-data
    provides: lib/regions.ts registry model, regionHref, sitemap D-11 order, audit ROUTES / AUDIT_SWEEP
provides:
  - "/sources page (h1 Data sources, draft intro, three anchored sections: swissaltiregio, bev-als-dtm, copernicus-glo-90)"
  - "data/source-credits.ts (client-safe): SOURCE_IDS, SourceId, sourceHref, draft SHORT_CREDIT, SOURCES_PAGE"
  - "data/sources.ts (server-only): SourceEntry, SOURCES, SOURCES_INTRO; credits read from their data sources"
  - "lib/regions.ts: regionsWestToEastIn (pure) and regionsWestToEast (D-01)"
  - "/sources in the sitemap after the projects, in the offline saved-pages catalog (SavedPageSource.pages) and in e2e ROUTES"
  - "data/sources.ts in SERVER_ONLY_MODULES (T-18-04)"
affects: [18-03, 18-05, 18-11, 18-13, 18-22, 18-23, 18-29, SiteFooter, SheetMargin]

actuals:
  tokens: 10800    # chars/4 over the realized code diff (git diff 1458653..64eb724 = 43,288 chars); this SUMMARY adds about 3,500
  tasks: 2
  commits: 3       # measured: git rev-list --count 1458653..64eb724 (the metadata commit adds one more)
plan_head_before: 1458653c389909728b5a162106814d8d2929094e
plan_head_after: 64eb72471e4abeb2e5b04f552b17a6c865755442

tech-stack:
  added: []
  patterns:
    - "Client-safe / server-only split for one dataset: ids and short credits in data/source-credits.ts, verbatim credits in data/sources.ts"
    - "Pure ...In(list) variant beside a registry function, so edge rows test fixtures and never mutate the registry"
    - "Credits compared by strict equality against the data files read from disk (Jest) and by exact textContent (e2e)"

key-files:
  created:
    - data/source-credits.ts
    - data/sources.ts
    - app/(site)/sources/page.tsx
    - data/__tests__/sources.test.ts
    - e2e/sources.spec.ts
  modified:
    - lib/regions.ts
    - app/sitemap.ts
    - e2e/seo.spec.ts
    - e2e/routes.ts
    - lib/saved-pages.ts
    - app/(site)/offline/page.tsx
    - lib/__tests__/regions.test.ts
    - lib/__tests__/saved-pages.test.ts
    - lib/__tests__/client-graph.test.ts
    - components/site/__tests__/SavedPages.test.tsx

key-decisions:
  - "18-02: /sources usedOn region lists come from each plate's dem.product (data/generated/plates.ts), west to east, so a new region on a product joins its entry with no edit"
  - "18-02: SavedPageSource.pages is required; /sources rows carry no label and sit after the projects (catalog mirrors the sitemap)"
  - "18-02: REGION-01 and REGION-06 stay Pending: this plan builds only the /sources target and the D-01 order; margins, footer link and overview come in later plans"

patterns-established:
  - "Site pages outside the nav join the sitemap, the offline catalog and ROUTES after the projects, via SOURCES_PAGE"

requirements-completed: []  # REGION-06 (/sources half) and REGION-01 (D-01 order only) are partial; later plans (18-03, 18-11, 18-13, 18-23, 18-29) complete them

duration: 11min
completed: 2026-11-25
---

# Phase 18 Plan 02: The /sources page and its data Summary

**`/sources` now renders the three elevation models (swissALTIRegio, BEV ALS DTM, Copernicus DEM GLO-90) with credits read straight from their data sources, licence links that open in a new tab, the changes made, and the region pages each source draws, west to east. The page is in the sitemap, the offline catalog and the audit ROUTES, and a server-only guard keeps the verbatim credits out of client chunks.**

## Performance

- Duration: about 11 min from the recorded start (2026-11-24T23:27Z to 23:38Z UTC), after the context reads
- Tasks: 2 of 2 (Task 1 tracer, Task 2 TDD)
- Files: 5 created, 10 modified

## Accomplishments

- `data/source-credits.ts` holds the client-safe half: `SOURCE_IDS` (`swissaltiregio`, `bev-als-dtm`, `copernicus-glo-90`), `sourceHref(id)` = `/sources#<id>`, draft `SHORT_CREDIT`, `SOURCES_PAGE = { href: '/sources', title: 'Data sources' }`. It imports no data.
- `data/sources.ts` (server-only) builds `SOURCES` in SOURCE_IDS order. swissALTIRegio's credit is `site.attribution.terrain` itself. BEV's credit, licence name and licence URL come from `data/terrain/plates/saalfelden/source.json`. GLO-90's credit is `[GLO90_NOTICE, GLO90_LIABILITY]`. "Used on" lists the region pages whose plate product matches, in `regionsWestToEast()` order: swissALTIRegio → Zermatt, Ortler, then "The footer of every page"; BEV → Saalfelden; GLO-90 → Alps overview (`/photos`).
- `lib/regions.ts`: `regionsWestToEastIn(list)` sorts by the mean u of the overview outline corners, breaks ties by id ascending, and throws `RangeError('regionsWestToEast: <id> has no overview outline')` when an outline is missing or empty. `regionsWestToEast()` runs the registry through it and returns `zermatt, ortler, saalfelden`. The `regions` export keeps registry order.
- `app/(site)/sources/page.tsx` is a Server Component following UI-SPEC Contract 7. It uses the container and band, h1, `max-w-prose` intro, and one `<section id aria-labelledby>` per entry, each with a `dl` of Credit, Licence, Changes and Used on. Credits use `wrap-anywhere`. The licence link is a `prose-link` with `ArrowSquareOutIcon` 16, `target="_blank"`, `rel="noopener noreferrer"` and the sr-only " (opens in a new tab)". Links meet the 44 px minimum. There is no breadcrumb and no nav item is current.
- Sitemap entry 5: `/sources` after the project pages. `e2e/seo.spec.ts` `expectedSitemap` matches. `e2e/routes.ts` ROUTES has `[SOURCES_PAGE.href, null]`, and AUDIT_SWEEP filters it out on its own.
- `SavedPageSource.pages` adds `/sources` after the projects with no label. `/offline` passes `[SOURCES_PAGE]`.
- `'data/sources.ts'` joins `SERVER_ONLY_MODULES`, with a doc bullet citing T-18-04.

## Task Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 (tracer) | 988f7c2 | feat(18-02): serve /sources with the swissALTIRegio entry end to end |
| 2 RED | 784992e | test(18-02): add failing tests for all three /sources entries and the catalog row |
| 2 GREEN | 64eb724 | feat(18-02): list all three data sources on /sources and guard their credits |

## Verification

- Task 1 verify: Jest regions and audit-routes (plus client-graph and photo-routes) passed, 133 tests. Type-check (3 configs) clean. Production Playwright `sources` + `seo` (Chromium, Firefox): **42 passed**. Then `git restore public/service-worker.js`.
- Tracer gate: interactive mode, `end-of-phase`, automated-only `<verify>`. Verify was green end to end on the committed tree, so the plan went on to Task 2 with no checkpoint.
- Extra check, because `/sources` joined ROUTES: the shell landmarks, @768 no-scroll and audit (axe, CLS, links, images, CSP, console at 375/768/1440) rows for `/sources` passed in Chromium and Firefox, after Task 1 and again after Task 2 (6 passed).
- Task 2 RED: 10 failures, all assertions about missing behaviour (`SOURCES` held only swissaltiregio; no `/sources` catalog row), none a syntax or import error. The regions rows passed already because Task 1 had shipped `regionsWestToEast`, so they pin that code rather than drive it.
- Task 2 GREEN: Jest sources, regions, saved-pages, client-graph, audit-routes and SavedPages: **113 passed**. `npm run lint` exit 0 (eslint plus every guard). Type-check clean. Production Playwright `sources` + `seo` + `offline` (Chromium, Firefox): **62 passed**.
- Full Jest: 120 suites, **2,403 passed**. `guard:tests`: `jest 2403 + e2e 650 = 3053 (baseline 3024)`, OK. Baseline file untouched.
- `node scripts/ci/check-snapshot-commit.mjs --none` passed for every commit, and no PNG was staged. Ports 3000 and 3017 were clear before each build and afterwards. `public/service-worker.js` was restored after every production run.
- Acceptance greps: `export function regionsWestToEast` = 1, `SOURCES_PAGE` in e2e/routes.ts = 2, `data/sources.ts` in client-graph.test.ts = 2, `GLO90_LIABILITY` in data/sources.ts = 2, page file present.

## Draft copy for Tim's D-20 checkpoint (18-03), not approved

- Intro: "The maps on this site are drawn from three elevation models. Each entry gives the credit exactly as its licence asks, the licence itself, what was done to the data and the maps that use it." (the UI-SPEC draft)
- Meta description: "The elevation models behind the maps on this site, with the credit each licence asks for, the licence and the changes made."
- Licence names and targets: "swisstopo terms of use for free geodata" → `https://www.swisstopo.admin.ch/en/conditions-geodata`; "CC BY 4.0" → the source.json licenceUrl; "Licence for COP-DEM-GLO-90-F Global 90m Full, Free & Open" → the dataspace.copernicus.eu licence PDF cited in 16-RESEARCH.
- Changes: swissALTIRegio and BEV use "Resampled to a 10 m grid; contours every 100 m and a hillshade derived; modified." BEV adds "Edition 15 September 2025, the date BEV created the dataset, not a survey date." GLO-90: "Resampled to a coarser grid covering the Alps; contours every 1,000 m derived; modified."
- Used on labels: region headings (approved 17 D-14 copy), plus the drafts "The footer of every page" and "Alps overview".
- Short credits: the drafts `swissALTIRegio, swisstopo`, `ALS DTM, BEV, CC BY 4.0`, `Copernicus DEM GLO-90`.
- No sentence implies endorsement by swisstopo, BEV, the Copernicus programme, ESA or the EU. Each credit is the licensor's own wording.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SavedPages island test built the catalog without `pages`**
- Found during: Task 2 (making `SavedPageSource.pages` required)
- Issue: `components/site/__tests__/SavedPages.test.tsx` calls `savedPageCatalog` too and is not in the plan's file list. Without `pages` it fails type-check.
- Fix: it passes `pages: [SOURCES_PAGE]`, the same way the offline page builds the catalog. Its comment says so.
- Files modified: components/site/__tests__/SavedPages.test.tsx
- Commit: 784992e

**2. [Rule 1 - Acceptance] `grep -c "export function regionsWestToEast"` counted two lines**
- Found during: Task 1 acceptance check
- Issue: both `regionsWestToEastIn` and `regionsWestToEast` were `export function` declarations, so the criterion's `== 1` failed.
- Fix: `regionsWestToEastIn` is now an exported arrow `const`. The behaviour is unchanged and the count is now 1.
- Files modified: lib/regions.ts
- Commit: 64eb724

**3. [Test strength] Extra assertions beyond the behaviour list**
- `data/__tests__/sources.test.ts` also checks the GLO-90 credit against `data/terrain/overview/source.json` (`notice`, `liability`), BEV's licence name against `source.json` `licence`, and that a one-code-point change (™ → TM) breaks equality. `e2e/sources.spec.ts` also checks that each section's `dt` labels are Credit, Licence, Changes, Used on.

### Observed, not fixed

- One `/offline` Firefox audit row failed once ("No pages are saved on this device yet." not visible within 5 s) during a parallel run of 29 rows after Task 1. Run alone with `--repeat-each=3` it passed 3/3, and it passed again in the Task 2 `offline.spec` run. The empty-list text does not depend on the catalog contents (a fresh context has no cache). This was a load flake, no change made.

## Notes for later plans

- 18-03: the footer imports only `data/source-credits.ts` (`sourceHref`, `SHORT_CREDIT`, `SOURCES_PAGE`). `site.attribution.terrain` stays the swissALTIRegio credit source until 18-03 moves it. `data/sources.ts` then reads it from the new home, and the strict-equality test follows.
- 18-05: `/sources` is not in the visual suite yet (D-24).
- Client-JS: `/sources` is a Server Component with no new client island. The only client-graph change is a type-free constant module, and this plan's text names no budget measurement.

## Known Stubs

None. The draft copy is intentional and waits on Tim's D-20 reply in 18-03, as the plan states.

## Threat Flags

None beyond the plan's register. T-18-04 (SERVER_ONLY_MODULES), T-18-05 (target/rel asserted in e2e) and T-18-06 (credits imported from their data sources, strict equality) are all mitigated as planned.

## Self-Check: PASSED

- FOUND: data/source-credits.ts, data/sources.ts, app/(site)/sources/page.tsx, data/__tests__/sources.test.ts, e2e/sources.spec.ts
- FOUND commits on HEAD: 988f7c2, 784992e, 64eb724
