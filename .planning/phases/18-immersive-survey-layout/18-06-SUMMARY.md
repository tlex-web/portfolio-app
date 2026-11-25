---
phase: 18-immersive-survey-layout
plan: 06
subsystem: ui
tags: [region-page, breadcrumb, json-ld, breadcrumblist, trail-sign, next-region, server-components]
status: complete

requires:
  - phase: 18-01
    provides: "Wave 0 decisions: P5 = the next-region sign keeps the yellow tip (Tim: Defaults (Recommended))"
  - phase: 18-02
    provides: regionsWestToEast() (D-01 order), regionCardFacts, /sources
provides:
  - "regionBreadcrumb(id): ['Photographs' /photos, bare region name at regionHref(id)]. One list feeds both the visible nav and the JSON-LD (D-10)"
  - "breadcrumbLd(items): the only BreadcrumbList builder (schema-dts typed, absolute item URLs, serialized through jsonLdHtml)"
  - "components/photos/Breadcrumb.tsx: props-only breadcrumb nav (server and client trees; 18-16 and 18-17 reuse it)"
  - "components/photos/region/RegionHeader.tsx: the header band (breadcrumb, h1, data line) with an `end` slot for 18-07's Share region"
  - "components/photos/region/FactsLine.tsx: the mono '{count} · {range} · {years}' line with nowrap parts (data-facts-line)"
  - "components/site/TrailSign.tsx: shared trail sign (exports PLATE, TIP_CLIP). EndBlock, NextRegion and the 18-17 end card render it"
  - "nextRegion(id), nextRegionIn(list, id), regionNumber(id) in lib/regions.ts"
  - "components/photos/region/NextRegion.tsx (+ NextRegionView for the empty case): section#next-region closing every region page"
affects: [18-07, 18-08, 18-09, 18-10, 18-14, 18-16, 18-17, seo.spec, case-study EndBlock]

actuals:
  tokens: 12500    # chars/4 over the plan's code diff (git diff 0c1f444..b28da09 = 50,129 chars incl. context)
  tasks: 2
  commits: 3       # git rev-list --count 0c1f444..b28da09; the metadata commit follows
plan_head_before: 0c1f444c93d114c2055935c293096139d0adf566
plan_head_after: b28da0978573d33b9864705d8c9e45618ab854c3

tech-stack:
  added: []
  patterns:
    - "One crumb list (regionBreadcrumb) feeds the nav and the BreadcrumbList, so the structured data cannot drift from the visible trail"
    - "Server component split into a data wrapper (NextRegion) and a strings-only view (NextRegionView), so the one-region empty case is testable without a fixture registry"
    - "A refactor of baselined markup is proven by renderToStaticMarkup before/after byte comparison"

key-files:
  created:
    - components/photos/Breadcrumb.tsx
    - components/photos/region/RegionHeader.tsx
    - components/photos/region/FactsLine.tsx
    - components/photos/region/NextRegion.tsx
    - components/photos/region/__tests__/NextRegion.test.tsx
    - components/site/TrailSign.tsx
    - components/site/__tests__/TrailSign.test.tsx
    - .planning/phases/18-immersive-survey-layout/deferred-items.md
  modified:
    - lib/regions.ts
    - lib/json-ld/content.ts
    - lib/__tests__/json-ld.test.ts
    - lib/__tests__/regions.test.ts
    - components/projects/EndBlock.tsx
    - "app/(site)/photos/regions/[region]/page.tsx"
    - e2e/photos-region.spec.ts
    - e2e/seo.spec.ts

key-decisions:
  - "BreadcrumbList is exempt from the D-16 per-node rights rule, like Person: it is an ItemList (Intangible), not a CreativeWork, and schema-dts rejects creator/copyrightNotice/creditText on it. Both seo.spec and json-ld.test assert it carries none of the three"
  - "ListItem.item is the absolute URL string (schema-dts accepts it; the Google form). The current crumb's item equals the page canonical (the gallery @id)"
  - "NextRegion sits outside the content container as a full-width bg-surface section. Its inner container carries a border-t hairline that mirrors the header band's border-b, and its py-12 md:py-16 replaces the container's old bottom padding"
  - "P5 applied as Tim's default: the next-region sign keeps the trail-yellow tip (TIP = true in NextRegion.tsx)"

requirements-completed: []  # REGION-02 stays Pending: this plan builds the header band and the next-region block; the plate with pins, the sequence and the baselines (18-08, 18-09, 18-10, 18-14, 18-17, 18-29) complete it

metrics:
  duration: "about 15 min (00:20Z to 00:36Z 2026-11-25)"
  completed: 2026-11-25
---

# Phase 18 Plan 06: Region header band, breadcrumb and next-region chain Summary

Every region page now opens with a breadcrumb ('Photographs / Zermatt'), the h1 and a regionCardFacts data line. A BreadcrumbList that lists exactly the visible crumbs comes with it. The page ends with a next-region trail sign that runs west to east and wraps from Saalfelden back to Zermatt. The sign is now one shared props-only TrailSign, and the case-study end block's markup stays byte-identical.

## What was built

- **Task 1 (tracer), 4f7025e.** `regionBreadcrumb` and `breadcrumbLd`. Also the props-only `Breadcrumb` nav (an `ol` with `flex-wrap`; links are `inline-flex min-h-11`, a `/` separator is `aria-hidden` inside the preceding `li`, and the current crumb is a `span aria-current="page"`). Then `RegionHeader` (the 10 band shape, with an empty `end` slot for 18-07) and `FactsLine`. The region page renders RegionHeader and a second `ld+json` block, `jsonLdHtml(breadcrumbLd(regionBreadcrumb(region.id)))`. The facts list and the text photo list stay below.
- **Task 2 (tdd), RED d5bfb12, GREEN b28da09.** `nextRegionIn`, `nextRegion` and `regionNumber`. `TrailSign` takes PLATE and TIP_CLIP moved from EndBlock unchanged. EndBlock now renders TrailSign. `NextRegion` is mounted after the rights line: h2 'Next region', the sign named '{heading}, next region' with the yellow tip, the next region's facts line, then 'All regions' (MapTrifoldIcon 20) to /photos.

## EndBlock markup comparison (prohibition: no case-study pixel change)

`renderToStaticMarkup(<EndBlock current={p} />)` was captured for every project before EndBlock was touched (scratchpad `endblock-before.json`). It was captured again after the refactor (`endblock-after.json`):

| Project | Before (chars, sha256/16) | After (chars, sha256/16) | Result |
|---------|---------------------------|--------------------------|--------|
| box | 1272, b369d92e61b06b42 | 1272, b369d92e61b06b42 | IDENTICAL |
| coin-flip | 1254, e7491b350ad399d8 | 1254, e7491b350ad399d8 | IDENTICAL |

The capture test was a temporary untracked file, deleted after use. `e2e/case-study-page.spec.ts` passed on Chromium and Firefox.

## Verification

- Jest: full suite 123/123 suites, 2,466 tests passed. The plan's suites (json-ld, regions, TrailSign, NextRegion, EndBlock) all pass.
- GUARD-03: `test-count: jest 2466 + e2e 657 = 3123 (baseline 3024)` OK. No test deleted; no `.only`, `.skip` or `fixme`.
- Task 1 verify (tracer gate): photos-region.spec on Chromium and Firefox gave 41 passed. seo.spec on Chromium gave 20 passed. The audit and keyboard region rows gave 14 passed. Tracer verified end to end, then expanded.
- Task 2 verify: `PW_PROD=1` photos-region and case-study-page on Chromium and Firefox (fresh webServer build) gave 85 passed, 0 flaky.
- Extra: audit, keyboard, seo and offline on Chromium and Firefox gave 106 passed and 1 failed (Firefox /offline audit, see Deferred). Two Firefox audit reruns gave 16/16 and 16/16.
- `npm run type-check` and `npm run lint` exit 0. `check-snapshot-commit --none` OK (0 changed) on all three commits.
- Client JS after a clean build (`rm -rf .next/static`): **1,850,219 B in 24 files**, the same as 18-03, under the 1,855,841 B cap. Every new component is a server component or props-only.
- `public/service-worker.js` was restored after every build. No `next start` is left on :3000 or :3017.
- Acceptance greps: `BreadcrumbList` in content.ts = 5 (≥1). The old "never builds a BreadcrumbList (it waits for Phase 18)" row = 0. Data imports in Breadcrumb.tsx and TrailSign.tsx = 0. `TIP_CLIP` in EndBlock code lines = 0. `export function nextRegion` = 2 (nextRegion, nextRegionIn).
- Visual spot check: production screenshots of /photos/regions/saalfelden at 375 and 1440 px (scratchpad only, never staged). The breadcrumb, data line ('ground 820–880 m') and the next-region sign to 'Zermatt, Switzerland' with its tip and facts line render as the contract describes.

## UI-SPEC coverage (E7, E10)

- E10: two crumbs on region pages. The e2e row also asserts none on /photos and /sources. The row wraps (`flex-wrap`) and nothing truncates. Crumb links are `inline-flex min-h-11`. The BreadcrumbList equals the visible crumbs (e2e, per region).
- E7: the sign is `w-full max-w-md` and the destination wraps with `text-balance`. 'Next region' is `whitespace-nowrap`. The facts come from regionCardFacts (Saalfelden prints its ground range). With one region only 'All regions' renders (NextRegionView test). The block is plain server-rendered links with no data fetch.
- ui-ux-pro-max: searches "breadcrumbs" and "touch target spacing links" (ux domain) agree with the UI-SPEC's evidence: a location trail, 44 px targets and ≥8 px spacing (`gap-x-2`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] seo.spec's JSON-LD contract would have failed on region pages**
- **Found during:** Task 1
- **Issue:** `e2e/seo.spec.ts` "every page carries exactly its JSON-LD types" expected only Person, WebSite and ImageGallery on region pages, and applied the CreativeWork rights rule to every non-Person node. A BreadcrumbList would have failed both checks. The file was not in the plan's list.
- **Fix:** expectedTypes adds 'BreadcrumbList' for /photos/regions/*. A `RIGHTS_EXEMPT` list (Person, BreadcrumbList) requires those nodes to carry none of the three rights keys. The comment explains the Intangible exemption.
- **Files modified:** e2e/seo.spec.ts
- **Commit:** 4f7025e

**2. [Rule 2 - Missing critical] Test for the props-only prohibition (T-18-17)**
- **Found during:** Task 2
- **Issue:** The plan's prohibitions say "verification: test", but no listed test file scanned Breadcrumb.tsx and TrailSign.tsx.
- **Fix:** Added `components/site/__tests__/TrailSign.test.tsx`. It scans both files' imports for the registry, generated data and the view model. It also pins EndBlock's use of the shared sign and TrailSign's tip and className behaviour. Added `components/photos/region/__tests__/NextRegion.test.tsx` for the populated, wrap and empty cases.
- **Commit:** d5bfb12

**3. [Design detail] FactsLine extracted, and NextRegion split into a wrapper and a view**
- RegionHeader and NextRegion print the same regionCardFacts line, so it lives once in `components/photos/region/FactsLine.tsx`. NextRegion is a data wrapper over `NextRegionView`, so the one-region case is tested without a fixture registry. Neither change is in the plan's file list. Both stay inside its scope.

Other than these, the plan ran as written.

## Deferred Issues

- A Firefox audit flake on /offline (a `toBeVisible` failure once and a page crash once, in one local run). It passed on two reruns, and the code is untouched by this plan. Logged in `deferred-items.md`.

## Known Stubs

- `RegionHeader`'s `end` slot is empty on purpose. 18-07 puts Share region there. No region page renders an empty wrapper, because the slot is omitted when `end` is undefined.

## Threat Flags

None. No new endpoint or trust boundary. T-18-16 is mitigated: every '<' is escaped by jsonLdHtml, asserted with a breakout fixture. T-18-17 is mitigated: there is an import scan, and client JS is unchanged.

## Self-Check: PASSED

- Files: Breadcrumb.tsx, RegionHeader.tsx, FactsLine.tsx, NextRegion.tsx, TrailSign.tsx, and both new test files exist.
- Commits 4f7025e, d5bfb12 and b28da09 are ancestors of HEAD.
