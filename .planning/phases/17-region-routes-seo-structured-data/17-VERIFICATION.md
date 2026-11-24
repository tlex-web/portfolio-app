---
phase: 17-region-routes-seo-structured-data
verified: 2026-11-24T18:00:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - .planning/phases/17-region-routes-seo-structured-data/17-01-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-01-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-02-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-02-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-03-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-03-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-04-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-04-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-05-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-05-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-06-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-06-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-07-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-07-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-08-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-08-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-09-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-09-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-10-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-10-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-11-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-11-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-12-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-12-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-13-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-13-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-14-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-14-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-15-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-15-SUMMARY.md
  - .planning/phases/17-region-routes-seo-structured-data/17-16-PLAN.md
  - .planning/phases/17-region-routes-seo-structured-data/17-16-SUMMARY.md
  - app/(site)/offline/page.tsx
  - app/(site)/photos/[slug]/page.tsx
  - app/(site)/photos/regions/[region]/opengraph-image.tsx
  - app/(site)/photos/regions/[region]/page.tsx
  - app/sitemap.ts
  - lib/json-ld/content.ts
  - lib/json-ld/site.ts
  - lib/photos/region-ids.ts
  - lib/photos/routes.ts
  - lib/regions.ts
  - lib/saved-pages.ts
  - proxy.ts
covered_digest: "v4:sha256:8416bf7fe98c8b434275fba969ccaef557f0aa875a07fcbe19d247e8548b5efe"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Fetch a region Open Graph card on the deployed build: GET /photos/regions/zermatt/opengraph-image-<hash>/card (take the exact URL from the og:image meta tag of /photos/regions/zermatt on a Vercel deployment, preview or production), for at least one region, and view it."
    expected: "HTTP 200, content-type image/png, 1200 x 630, showing the region's cover photo over its plate contour with name, country, photo count, height range and the copyright line."
    why_human: "17-RESEARCH Pitfall 6 / review IN-03: the card reads the plate contour SVG through a computed path, which Vercel's output file tracing may not include. A local next start reads public/ directly, so the local e2e cannot see this failure. The Vercel preview is behind Vercel Authentication and was not fetched; the owner routed it to /gsd-verify-work 17."
---

# Phase 17: Region Routes, SEO & Structured Data Verification Report

**Phase Goal:** Every region and every photo has its final, crawlable URL before the layout is designed: region pages live on their own path, old photo links and cards keep working, and search engines and the offline page know the new pages.
**Verified:** 2026-11-24
**Status:** human_needed (all 5 roadmap success criteria verified in the code; one deployed-only check is left to a human)
**Re-verification:** No, initial verification

Note on file names: plans and summaries that name `lib/json-ld.ts` refer to code now in `lib/json-ld/site.ts` and `lib/json-ld/content.ts` (review fix WR-01). The old path does not exist, and I verified the two new modules.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every existing `/photos/<slug>` URL and its OG card answer as before, no redirects; every new photo gets the same deep-linkable page | VERIFIED | `app/(site)/photos/[slug]/page.tsx` `generateStaticParams` returns `publishedSlugs` (every generated photo); `proxy.ts` `KNOWN.photos = new Set(photoRouteSlugs)` over every editorial slug; `lib/__tests__/photo-routes.test.ts` pins `photoRouteSlugs` == `publishedSlugs` and that the four v2.0 slugs stay admitted. No redirects: `grep redirect` in `next.config.*`, `vercel.json` and `app/` finds none. The per-photo `opengraph-image.tsx` is unchanged since the phase base; only `lib/og/template.tsx` gained the `region` variant. The v2.0 four's `og:image` URL with `?hash` is pinned by `e2e/og.spec.ts` ("v2.0 photo cards keep their base og:image URL"). 17-05 recorded a 36-mutant identity capture of the four against the phase base (recorded evidence; I did not re-run it). |
| 2 | Each region has a page on its own path, never colliding with a photo slug; unknown region gets the designed 404; every region page passes the audit gate | VERIFIED | Path is `/photos/regions/<id>` (`lib/photos/routes.ts` `regionHref`). `app/(site)/photos/regions/[region]/page.tsx` has `dynamicParams = false` and `generateStaticParams` over `regionIds`. `proxy.ts` `REGION_PATH` branch: an id outside `KNOWN_REGIONS` (exact, case-sensitive) takes the neutral photos 404; bare `/photos/regions` is a `DETAIL_PATH` miss on the slug `regions`. The null `@modal/regions/[region]/page.tsx` closes a lightbox on a soft navigation. `lib/__tests__/regions.test.ts` holds the D-03 collision rows (ids, photo slugs and reserved words disjoint); `lib/__tests__/proxy.test.ts` covers the branch. `e2e/not-found.spec.ts` has region misses; `e2e/routes.ts` derives the audit sweep from `sitemap()`, so every region page is in the production audit gate. The 17-16 client-graph guard (`lib/__tests__/client-graph.test.ts`) passes. |
| 3 | Each region page has its own title, description, canonical, OG card and sitemap entry; the sitemap lists exactly the canonical URLs | VERIFIED (deployed OG card: see human item) | `regionMetadata(id)` in `lib/regions.ts` builds title (`regionTitle`), approved description (`regionDescription`) and path (`regionHref`) through `pageMetadata`. `opengraph-image.tsx` in the region folder serves the card with `generateImageMetadata` (alt from `regionOgAlt`, id `card`) and 404s an unknown id. `app/sitemap.ts` lists nav, then every region page, then every published photo page, then projects, each once and absolute, with no `lastModified`. `e2e/seo.spec.ts` "every sitemap URL is its page's canonical" and the per-page canonical rows cover regions and new photos. |
| 4 | JSON-LD parses: Person and WebSite site-wide, ImageObject on photo pages, ImageGallery on region pages, projects on case studies; creator, copyright notice, credit text; no `license`; no coordinates finer than the page shows | VERIFIED | `app/(site)/layout.tsx` renders `siteGraph()` (one Person, one WebSite). `[slug]/page.tsx` renders `photoImageLd(view)`; the region page renders `regionGalleryLd`; `projects/[slug]/page.tsx` renders `projectLd`. Serializer `jsonLdHtml` escapes every `<`. WebSite, ImageObject, ImageGallery and project nodes carry `creator`, `creditText`, `copyrightNotice`; the Person node is exempt (schema.org defines the three on CreativeWork only), a documented D-16 reading. `grep` finds no `license` or `acquireLicensePage` in `lib/json-ld` or `app` outside comments. Coordinates go through `roundedCoordinate` at the position's own precision, as strings; an approximate position with a radius is a `GeoCircle`; no elevation. `lib/__tests__/json-ld.test.ts` (key walk at every depth, per-photo "never finer than its precision", per-region, per-project, modal pages carry none) passes in my run. `e2e/seo.spec.ts` parses every sitemap page's blocks in a browser. |
| 5 | The offline page's saved-pages list includes region pages and new photo pages a visitor has opened | VERIFIED | `app/(site)/offline/page.tsx` builds `savedPageCatalog` from nav, `regions` (id, name only), `regionPhotoViews` of every region (all published photos) and projects. `lib/saved-pages.ts` maps regions through `regionHref` with label `Region` and photos through `photoHref`; `savedPageRows` matches cached request URLs by exact path against the catalog. The island imports only `lib/saved-pages.ts` and `lib/photos/routes.ts`, so no registry reaches the client (`client-graph.test.ts` passes). `lib/__tests__/saved-pages.test.ts` and `e2e/offline.spec.ts` (seeded region path, "Region" label) cover it. |

**Score:** 5/5 truths verified, 0 present-but-behavior-unverified.

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `lib/photos/routes.ts` (`photoHref`, `regionHref`, `photoRouteSlugs`) | VERIFIED | Substantive and wired into proxy, sitemap, saved pages, JSON-LD. Imports no region registry. |
| `lib/photos/region-ids.ts` | VERIFIED | Imported by `proxy.ts` only. |
| `proxy.ts` region branch | VERIFIED | `REGION_PATH` and `KNOWN_REGIONS` read by `missedSection`. |
| Region page, region OG card, `@modal` null page | VERIFIED | Exist, substantive, wired (see truths 2 and 3). The page is deliberately a stand-in (heading, facts, photo links, rights line); the immersive layout is Phase 18's scope. |
| `lib/regions.ts` (metadata, copy, rights) | VERIFIED | Used by page, OG card, sitemap, offline page, JSON-LD. |
| `lib/json-ld/site.ts`, `lib/json-ld/content.ts`, `lib/site-rights.ts` | VERIFIED | The layout imports `site.ts` alone (`json-ld.test.ts` walks the imports and pins it). |
| `app/sitemap.ts` | VERIFIED | Renders from the same data as the pages. |
| `lib/saved-pages.ts` + `app/(site)/offline/page.tsx` | VERIFIED | Catalog includes regions and all published photos. |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| `proxy.ts` | `lib/photos/region-ids.ts` and `routes.ts` | WIRED | `KNOWN_REGIONS`, `KNOWN.photos` |
| Region page | `regionGalleryLd`, `regionMetadata`, `regionHref` | WIRED | Imported and used |
| Photo page | `photoImageLd`, back link to `regionHref` | WIRED | `backFor` builds it on the server from the registry |
| Sitemap | `regionHref`, `photoHref`, `regionPhotoViews` | WIRED | Same data as the pages and the saved-pages catalog |
| Offline page | `savedPageCatalog` | WIRED | Regions plus every published photo |
| Gallery `hasPart` | each photo's `#image` @id | WIRED | `photoImageId` shared by both builders |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| Region page | regions, facts, views | `data/regions/regions.json` (zod-validated) and `data/generated/photos.ts` | Yes | FLOWING |
| Photo ImageObject | capture, position, 2560 px variant | generated photo facts and image manifest | Yes | FLOWING |
| Sitemap, saved-pages catalog | regions and photos | same registry and generated data | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Route, JSON-LD, proxy, saved-pages and region tests | `npx jest lib/__tests__/json-ld.test.ts saved-pages photo-routes proxy regions` | 5 suites, 377 tests passed | PASS |
| Client-graph guard, OG routes, site and photo components, audit routes, region series | `npx jest client-graph lib/og components/site components/photos audit-routes region-series` | 20 suites, 286 tests passed | PASS |
| Type check | `npx tsc --noEmit` | exit 0 | PASS |
| Full Jest suite | not re-run by me | the orchestrator reports 119 suites, 2385/2385 | recorded, not independent |
| Browser behavior (hard load, soft navigation, lightbox, offline, JSON-LD in DOM) | Playwright e2e | not re-run (needs a production build); recorded in 17-15-SUMMARY and 17-DOM-VERIFY.md as 487 passed locally and CI run 45306356650 green on ci/17-15 | recorded, not independent |

### Probe Execution

Step 7c: SKIPPED. The plans declare no probe scripts, and no `scripts/*/tests/probe-*.sh` is in scope.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| REGION-07 | 17-01, 02, 07, 08, 09, 10, 12, 15, 16 | Each region page has its own title, description, canonical, OG card and sitemap entry | SATISFIED (deployed card: human item) | Truths 2 and 3 |
| PHOTO-05 | 17-01, 04, 05, 06, 07, 10, 13, 15, 16 | Existing `/photos/<slug>` URLs and OG cards unchanged; every new photo gets the same page | SATISFIED | Truth 1 |
| SEO-04 | 17-03, 13, 14, 15 | JSON-LD on pages; creator, notice, credit; no `license`; no finer coordinates | SATISFIED | Truth 4 |
| EDGE-03 | 17-11, 15 | Offline saved-pages list includes region and new photo pages | SATISFIED | Truth 5 |

All four phase IDs appear in plan frontmatter and are marked `[x]` and "Complete" in REQUIREMENTS.md. No orphaned requirement: REQUIREMENTS.md maps exactly these four to Phase 17.

### Anti-Patterns Found

None. A scan for `TODO`, `FIXME`, `TBD` and `XXX` over every non-planning source file changed since the phase base found no matches. The region page is an intentional stand-in, not a stub: it prints real data and Phase 18 owns its layout.

### Human Verification Required

1. **Deployed region OG card (17-RESEARCH Pitfall 6, review IN-03)**
   - **Test:** On a Vercel deployment, open `/photos/regions/<id>`, take the `og:image` URL from its head, and fetch it for at least one region.
   - **Expected:** HTTP 200, `image/png`, 1200 x 630, cover photo over the plate contour with name, country, count, height range and the copyright line.
   - **Why human:** The card reads a plate SVG through a computed path that output file tracing may miss on Vercel. A local `next start` cannot show this. The preview is behind Vercel Authentication, and the owner chose to route the check to `/gsd-verify-work 17`.

The live-DOM probe (17-DOM-VERIFY.md) recorded `could_not_look`; the Playwright suites are the browser evidence, and I did not re-run them.

### Gaps Summary

No gaps. All five roadmap success criteria are met in the code, tests and type check I ran, and all four requirement IDs are accounted for. The status is `human_needed` only because the deployed region OG card (success criterion 3) has not been fetched on Vercel, which a local run cannot prove.

---

_Verified: 2026-11-24_
_Verifier: Claude (gsd-verifier)_
