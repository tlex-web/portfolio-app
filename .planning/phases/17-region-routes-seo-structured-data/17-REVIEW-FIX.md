---
phase: 17-region-routes-seo-structured-data
fixed_at: 2026-11-24T17:05:21Z
review_path: .planning/phases/17-region-routes-seo-structured-data/17-REVIEW.md
iteration: 1
findings_in_scope: 11
fixed: 9
skipped: 2
status: partial
---

# Phase 17: Code Review Fix Report

**Fixed at:** 2026-11-24T17:05:21Z
**Source review:** .planning/phases/17-region-routes-seo-structured-data/17-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 11 (fix_scope `all`, narrowed per finding by Tim's answers of 2026-11-24)
- Fixed: 9
- Skipped: 2 (both on Tim's instruction)

Work ran in the main checkout on `gsd/phase-17-region-routes-seo-structured-data`, with no worktree. The orchestrator's root pin requires the pinned toplevel, and a worktree has no `node_modules` for the gates. The root pin passed before the first edit and before every commit.

## Fixed Issues

### WR-01: The site-wide layout now loads the region and photo model on every content page

**Files modified:** `lib/json-ld/site.ts` (new), `lib/json-ld/content.ts` (renamed from `lib/json-ld.ts`), `app/(site)/layout.tsx`, `app/(site)/photos/[slug]/page.tsx`, `app/(site)/photos/regions/[region]/page.tsx`, `app/(site)/projects/[slug]/page.tsx`, `lib/__tests__/json-ld.test.ts`
**Commit:** fde2c80
**Applied fix:** `lib/json-ld.ts` is split in two:
- `lib/json-ld/site.ts` holds PERSON_ID, WEBSITE_ID, personRef, jsonLdHtml, siteRights and siteGraph. It imports only `data/site` plus schema-dts types.
- `lib/json-ld/content.ts` holds the photo, region and project builders, moved unchanged.

The layout imports only the site module. The three page routes import both. The schema-dts `import type` rule and the BreadcrumbList rule now cover both files. A new test walks the value imports and re-exports reachable from the site module. It asserts that the walk reaches no `lib/regions`, `lib/json-ld/content`, `lib/photos/*`, `data/generated/*` or `data/regions/*` file, and that it does reach `data/site.ts`, so it cannot pass vacuously. A second test runs the same walk on the content module and confirms it reaches the region and photo model. A temporary mutation that re-exported from `lib/regions` made the decoupling test fail. No other file in the repo, including e2e and scripts/guards, named the old path. The prod e2e JSON-LD rows pass on every sitemap page.

### WR-02: The swipe-and-arrows negative e2e test can pass without testing anything

**Files modified:** `e2e/photos-region.spec.ts`
**Commit:** b995bf0
**Applied fix:** The row now works in four steps:
1. It records history.length, the URL, the title and the viewer's status line.
2. It runs the swipe and the arrows, then waits two animation frames as a settle point.
3. It asserts that all four values are unchanged, plus the original assertions.
4. As a positive control, it runs the same gestures on the first light-table photo page and asserts that they step: the URL moves to the second photo and the status reads `Photo 2 of N:`.

### IN-01: The region card's plate lookup bypasses type checking with a cast

**Files modified:** `lib/regions.ts`, `app/(site)/photos/regions/[region]/opengraph-image.tsx`, `lib/__tests__/regions.test.ts`
**Commit:** 5ac9333
**Applied fix:** `lib/regions.ts` now resolves each region's hero contour SVG at module load, the same way as COVERS. A missing plate throws an error naming the region, the plate, `data/regions/regions.json` and `data/generated/plates.ts`. The new export `regionContourSrc(id)` throws RangeError for an id that is not in the registry. The OG route no longer imports `plates` and drops the `as keyof typeof plates` cast. New tests cover:
- the value for each region;
- the RangeError;
- the load-time throw, with a mocked registry whose plate does not exist.

### IN-02: Approximate positions are emitted as plain GeoCoordinates

**Files modified:** `lib/json-ld/content.ts`, `lib/__tests__/json-ld.test.ts`
**Commit:** 74d1624
**Applied fix:** This is Tim's "GeoCircle with radius" choice:
- **Approximate position with a positive radius:** `contentLocation.geo` is a `GeoCircle`. Its `geoMidpoint` holds the same rounded GeoCoordinates strings as before, and its `geoRadius` is the radius in whole metres, rounded the same way as the strip's `±… m (approx.)` note.
- **Exact position:** plain GeoCoordinates.
- **Approximate position with no usable radius:** plain GeoCoordinates too. No such record exists today.

schema-dts stays `import type` only (GeoCircle, GeoCoordinates).

Tests:
- Every located photo's geo is checked against the strip: the coordinates, and for a GeoCircle the radius parsed from the approx note.
- The published set must contain both shapes.
- Synthetic fixtures pin the exact, radius, rounding and no-radius (undefined, 0 and NaN) branches.

No e2e spec reads ImageObject coordinates (`e2e/seo.spec.ts` checks only top-level types and the rights keys), so no e2e contract changed. The 17-13 contract lives in `lib/__tests__/json-ld.test.ts`.

### IN-04: The site rights line is defined twice

**Files modified:** `lib/site-rights.ts` (new), `lib/json-ld/site.ts`, `components/site/SiteFooter.tsx`, `components/site/__tests__/SiteChrome.test.tsx`, `lib/__tests__/json-ld.test.ts`
**Commit:** 4ccc576
**Applied fix:** SiteFooter is a server component, but it also renders inside the client-rendered `app/global-error.tsx`. So the one definition lives in a tiny pure module, `lib/site-rights.ts`, which imports only `data/site`. `lib/json-ld/site.ts` re-exports `siteRights` from it.

SiteFooter renders `siteRightsParts()`, the same five children as the old inline JSX, rather than the joined string. React writes `<!-- -->` between adjacent text children in server HTML, so a single string would have changed the footer HTML on every page and broken the 17 D-07 whole-HTML identity. A renderToString comparison showed that the parts array produces byte-identical HTML and the joined string does not. On the prod build, the footer of a v2.0 photo page still renders with its separators. The printed text is unchanged.

### IN-05: Generality without instantiation: `caseStudyRights` ignores its slug

**Files modified:** `lib/json-ld/content.ts`, `lib/__tests__/json-ld.test.ts`
**Commit:** 998f55c
**Status:** fixed: requires human verification (necessity finding: removes code)
**Applied fix:** Removed `caseStudyRights(_slug)`. `projectLd` now sets `copyrightNotice: siteRights()`, and the 17-01 option (a) rationale moved to its doc. The tests assert `siteRights()` and the literal footer line on each project block. The test count is unchanged, and so is the output.

### IN-07: The `TimeZone` enum repeats the `ZONE_BY_COUNTRY` values by hand

**Files modified:** `data/schemas/photo.ts`, `data/__tests__/photos.test.ts`
**Commit:** 2537efa
**Applied fix:** `TimeZone = z.enum(Object.values(ZONE_BY_COUNTRY) as [CountryZone, ...CountryZone[]])`. It has the same eight options in the same order. The code stays erasable TypeScript, and `photos:build --check` passes through Node's type stripping. A test pins that the options equal the map values.

### IN-08: The `stepping.ts` doc describes a region index that does not exist

**Files modified:** `lib/photos/stepping.ts`
**Commit:** bfb98db
**Applied fix:** Comment only. The comment now says that region pages live at `/photos/regions/<id>` and that the bare `/photos/regions` is a photos 404 (`proxy.ts`, `e2e/not-found.spec.ts`).

### IN-09: Fact texts are React keys but the schema does not keep them unique

**Files modified:** `data/schemas/region.ts`, `data/__tests__/photo-map.test.ts`
**Commit:** 8dfe4af
**Applied fix:** `Region.facts` gains a refine that requires unique texts, with the message "a region's fact texts must be unique". The committed registry passes it, and so does `photos:build --check`. A test accepts a distinct pair and rejects a repeat.

## Skipped Issues

### IN-03: File tracing for the deployed region OG card is still unverified

**File:** `app/(site)/photos/regions/[region]/opengraph-image.tsx:50-53`
**Reason:** Routed to /gsd-verify-work 17: deployed region OG-card fetch (Pitfall 6), per Tim 2026-11-24
**Original issue:** The plate SVG is read through a variable path. No config pins the plate SVGs into the function bundle, and the deployed card has not been fetched.

### IN-06: Impossible-state guard: `withRetry`'s argument validation

**File:** `scripts/terrain/fetch-retry.mjs:33-38`
**Reason:** Kept as a library-boundary guard, per Tim 2026-11-24
**Original issue:** Every production caller passes constants, so the TypeError branches cannot fire today.

## Verification

All gates ran in the main checkout. Nothing ran in a worktree.

| Gate | Result |
|------|--------|
| `npm run type-check` (tsconfig.json, tsconfig.jest.json, tsconfig.e2e.json) | pass |
| `npm run lint` (eslint, every guard, data:check, guard:tests:scan) | pass, exit 0 |
| `npx jest --json --outputFile=jest-results.json` | 119 suites, 2385 tests passed (was 2365) |
| `npm run guard:tests` | OK: jest 2385 + e2e 639 = 3024, baseline 2243 |
| `npm run build` | pass. Client chunks hold no GeoCircle, ImageGallery, `#website`, geoMidpoint or regionContourSrc text. `.next/static` JS totals 1,853,097 B, within the 1,855,781 B budget |
| `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/photos-region.spec.ts e2e/seo.spec.ts e2e/og.spec.ts --project=chromium` | 60 passed |

After the build and the e2e run, `public/service-worker.js` was restored and the `next start` process was stopped. Port 3000 is free.

**Not verified:**
- The 17-05 `v20-identity.mjs` whole-HTML comparison against the 285b6d5 base was not rerun, because no base capture exists in this session. Two narrower checks cover it instead: the footer HTML on the prod build (and the renderToString comparison), and the photo-page changes, which are limited to the ld+json block.
- e2e ran in Chromium only. Firefox and WebKit did not run.
- The deployed OG card was not fetched (IN-03).

---

_Fixed: 2026-11-24T17:05:21Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
