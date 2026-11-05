---
phase: 12-contact-edge-pages-cleanup-verification
plan: 09
subsystem: seo
tags: [nextjs, metadata, metadataBase, canonical, sitemap, robots, playwright, jest]

requires:
  - phase: 12-01
    provides: "Resolved values: meta.photos, meta.photo-slug, meta.projects, meta.roadmap descriptions"
  - phase: 12-02
    provides: "e2e/routes.ts ROUTES list and the PW_PROD/PW_REUSE per-task server reuse"
  - phase: 12-04
    provides: "v1 colour aliases removed (wave-1 baseline this plan builds on)"
provides:
  - "site.url (required Site field) = 'https://portfolio-app-mocha-three.vercel.app' (D-13)"
  - "Root metadataBase, openGraph { type website, siteName, locale en_GB }, twitter { card summary_large_image }"
  - "lib/metadata.ts pageMetadata helper and SITE_DESCRIPTION constant"
  - "Own title, description and absolute canonical on /, /photos, /photos/<slug>, /projects, /projects/<slug>, /roadmap"
  - "Generated /sitemap.xml and /robots.txt"
  - "e2e/seo.spec.ts head, sitemap and robots contract"
affects: [12-13, 12-15, 12-17, 12-25, SEO-02 OG images]

actuals:
  tokens: 5335
  tasks: 2
  commits: 3
plan_head_before: dfc3846b091e7b6c3780b7a30131f52b159f2207
plan_head_after: 23dc92f7c4ae8f7def09ca0c99148cb13be86845

tech-stack:
  added: []
  patterns:
    - "Per-route metadata goes through pageMetadata (title?, description, relative canonical) and never sets openGraph or twitter, so root social fields and file-based OG images survive Next's shallow merge"
    - "Relative canonicals resolve against the root metadataBase built from site.url"

key-files:
  created:
    - lib/metadata.ts
    - lib/__tests__/metadata.test.ts
    - app/sitemap.ts
    - app/robots.ts
    - e2e/seo.spec.ts
  modified:
    - data/site.ts
    - data/types.ts
    - app/layout.tsx
    - app/(site)/page.tsx
    - app/(site)/roadmap/page.tsx
    - app/(site)/photos/page.tsx
    - app/(site)/projects/page.tsx
    - app/(site)/projects/[slug]/page.tsx
    - lib/photos/view-model.ts
    - lib/__tests__/photos-view-model.test.ts

key-decisions:
  - "Root description moved to SITE_DESCRIPTION in lib/metadata.ts, shared by app/layout.tsx and Home, so Home's own description cannot drift from the inherited default"
  - "photoMetadata builds the meta.photo-slug description from existing view fields (title, shortPlace, altitudeLabel, captureMonth) and site.name; altitudeLabel keeps its U+00A0 before 'm'"

patterns-established:
  - "pageMetadata: one helper for SEO-01 head fields; Jest pins its exact key set"
  - "sitemap.ts: nav hrefs, then photoSlugs, then projects, no lastModified (deterministic)"

requirements-completed: [SEO-01, SEO-03]

coverage:
  - id: D1
    description: "site.url canonical base flows into metadataBase; inherited og:type website and twitter:card summary_large_image"
    requirement: SEO-01
    verification:
      - kind: e2e
        ref: "e2e/seo.spec.ts#Roadmap head (SEO-01, D-13) one absolute canonical, the approved description and the inherited social cards"
        status: pass
    human_judgment: false
  - id: D2
    description: "pageMetadata returns exactly title (optional), description and alternates.canonical, never openGraph or twitter"
    requirement: SEO-01
    verification:
      - kind: unit
        ref: "lib/__tests__/metadata.test.ts#pageMetadata (SEO-01)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Own title, description and absolute canonical on /, /photos, /photos/<slug>, /projects, /projects/box and /roadmap, unique across routes; /photos?view=grid canonicalises to /photos"
    requirement: SEO-01
    verification:
      - kind: e2e
        ref: "e2e/seo.spec.ts#Own head per content route (SEO-01)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Photo page descriptions follow meta.photo-slug (EXIF month and year; film scan 'approx.' and year alone); canonical unchanged"
    requirement: SEO-01
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-view-model.test.ts#lookup and metadata (LBOX-01)"
        status: pass
    human_judgment: false
  - id: D5
    description: "/sitemap.xml lists exactly the nav, photo and project URLs on site.url, each once, no /offline, no lastmod; /robots.txt allows /, disallows /api/ and /offline, names the sitemap"
    requirement: SEO-03
    verification:
      - kind: e2e
        ref: "e2e/seo.spec.ts#sitemap.xml and robots.txt (SEO-03)"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 09: Per-route SEO metadata, sitemap and robots Summary

**One canonical host (`site.url`, D-13) feeds the root `metadataBase`. Six content routes now carry their own title, approved description and absolute canonical through the `pageMetadata` helper. `app/sitemap.ts` and `app/robots.ts` generate `/sitemap.xml` and `/robots.txt` from `site.nav`, `photoSlugs` and `projects`.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-11-02T19:04:19Z
- **Completed:** 2026-11-02T19:11:00Z
- **Tasks:** 2 (1 tracer, 1 TDD)
- **Files modified:** 15

## Accomplishments

- `data/types.ts` makes `Site.url` a required field and `data/site.ts` sets it to `'https://portfolio-app-mocha-three.vercel.app'`. The comment there cites D-13 and its costly reversibility rating.
- `app/layout.tsx` sets `metadataBase: new URL(site.url)`, `openGraph: { type: 'website', siteName: site.name, locale: 'en_GB' }` and `twitter: { card: 'summary_large_image' }`. It sets no root canonical. `<SpeedInsightsRoute />` (b32eb35) is unchanged. The stale nonce comment now names proxy.ts.
- `lib/metadata.ts` adds `pageMetadata({ title?, description, path })`, which returns only `title`, `description` and `alternates.canonical`. It also exports `SITE_DESCRIPTION`.
- Routes and their approved descriptions (quoted from the 12-01 `## Resolved values` table):
  - `/` (no title, the root default applies): root description unchanged: "Tim Lui is a developer and photographer. Landscape photographs from the Matterhorn region and software projects."
  - `/photos`, title `Photographs` (meta.photos): "Landscape photographs from around Zermatt, each placed on the terrain where Tim took it."
  - `/projects`, title `Engineering` (meta.projects): "What Tim builds: box, a command-line toolkit for PowerShell, and coin-flip, a fair 3D coin toss for Android."
  - `/roadmap`, title `Roadmap` (meta.roadmap): "What Tim has finished, is working on and plans next for this site, box and coin-flip."
  - `/photos/<slug>`, title `{title}` (meta.photo-slug): "{title}: a photograph by Tim Lui from {short place} at {altitude}[ approx.], {Mon YYYY | YYYY}." For example: "Matterhorn in the Riffelsee: a photograph by Tim Lui from Riffelsee at 2,760 m approx., 2019."
  - `/projects/<slug>`: the existing title and pitch, plus `alternates.canonical`.
- `/sitemap.xml` lists 11 URLs: 5 nav destinations, 4 photo pages and 2 project pages. It has no `/offline` and no `lastmod`. `/robots.txt` reads `Allow: /`, `Disallow: /api/`, `Disallow: /offline`, `Sitemap: https://portfolio-app-mocha-three.vercel.app/sitemap.xml`.

## Task Commits

1. **Task 1 (tracer): site.url, metadataBase, Roadmap canonical, sitemap and robots:** `123d67a` (feat)
2. **Task 2 RED: failing photo description tests and the pageMetadata key test:** `1b33003` (test)
3. **Task 2 GREEN: own title, description and canonical per route:** `23dc92f` (feat)

No REFACTOR commit was needed.

## TDD Gate (Task 2)

- **RED (`1b33003`):** `npx jest lib/__tests__/metadata.test.ts lib/__tests__/photos-view-model.test.ts` exited 1 with 2 failed and 23 passed. Both target tests failed on the planned assertion: the `description` received `view.story` where the meta.photo-slug string was expected. The tests were "describes an EXIF photo with its place, height, and capture month and year; the canonical is unchanged" and "describes the film scan with 'approx.' and the year alone; the canonical is unchanged". There were no load, syntax or fixture faults. Semantic assessment: a valid RED for the intended reason. The three `metadata.test.ts` cases passed at RED because the plan's Task 1 tracer already shipped `pageMetadata`. They pin the helper's key set as a regression guard and were not RED targets. Jest output is not one of the RED-evidence classifier's supported formats (TAP, JUnit and the others), and `workflow.tdd_mode` is off, so no classifier record was produced.
- **GREEN (`23dc92f`):** the same command passed 25 of 25.

## Files Created/Modified

- `lib/metadata.ts`: `pageMetadata` helper and `SITE_DESCRIPTION`
- `lib/__tests__/metadata.test.ts`: exact key set, no title key without a title, no openGraph or twitter
- `app/sitemap.ts`, `app/robots.ts`: generated metadata routes, both static (○) in the build
- `e2e/seo.spec.ts` (119 lines): Roadmap head, the `ROUTES` loop without /contact and /offline, `?view=grid` canonical, sitemap and robots
- `data/site.ts`, `data/types.ts`: `url`
- `app/layout.tsx`: `metadataBase`, openGraph, twitter, the description through `SITE_DESCRIPTION`, the comment fix
- `app/(site)/page.tsx`, `photos/page.tsx`, `projects/page.tsx`, `roadmap/page.tsx`: `pageMetadata(...)`
- `app/(site)/projects/[slug]/page.tsx`: `alternates.canonical`
- `lib/photos/view-model.ts`: the meta.photo-slug description in `photoMetadata`, canonical unchanged
- `lib/__tests__/photos-view-model.test.ts`: the old title, story and canonical case is rewritten into the EXIF, film-scan and unknown-slug cases (rewritten, not deleted)

## Decisions Made

- **One root description constant.** Home needs the root description as its own (the plan says "root description, unchanged"). Copying the string into `app/(site)/page.tsx` would let the two drift, so it now lives in `SITE_DESCRIPTION` and the layout imports it. The rendered output is identical.
- **The photo description reuses existing view fields.** It is built from `altitudeLabel` (which already ends in ' approx.' for the hand-placed scan) and `captureMonth` (which is already the year alone for the year-precision scan), so neither is re-derived. The name comes from `site.name`, which is 'Tim Lui', as in the template.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] Root description shared through one constant**
- **Found during:** Task 2 (Home metadata)
- **Issue:** Home's own description has to equal the root default. A second literal copy could drift without anything failing.
- **Fix:** Added `SITE_DESCRIPTION` to `lib/metadata.ts`. `app/layout.tsx` and `app/(site)/page.tsx` both import it.
- **Files modified:** lib/metadata.ts, app/layout.tsx, app/(site)/page.tsx
- **Verification:** the `/` head renders the unchanged description; the seo.spec uniqueness loop passes; full Jest passes 1446 of 1446.
- **Committed in:** 23dc92f

---

**Total deviations:** 1 auto-fixed (Rule 2)
**Impact on plan:** No scope change; the rendered HTML is the same as the plan intended.

## Verification

- `npm run lint` (eslint and every guard): exit 0. `npm run type-check`: exit 0. `npx jest --silent`: 89 suites, 1446 tests passed.
- Per task: `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/seo.spec.ts --project=chromium` passed 3 of 3 after Task 1 and 5 of 5 after Task 2.
- Plan level: `PW_PROD=1 npx playwright test e2e/seo.spec.ts e2e/shell.spec.ts --project=chromium` built fresh and passed 38 of 38.
- `git status --porcelain public/service-worker.js` was empty after each server stopped. Port 3000 is free.
- Acceptance greps: `metadataBase: new URL(site.url)` appears once in the layout. `pageMetadata(` appears once in each of the four pages. `canonical` appears 3 times in projects/[slug]. `metadata.test.ts` has 3 `it(` cases.
- No visual specs were run, re-baselined or touched. The changes are `<head>`-only and move no pixels.

## Issues Encountered

None.

## Known Stubs

None. `/contact` and `/offline` still inherit the root description and have no canonical. That is by design: 12-13 and 12-15 rewrite those pages, and 12-17 checks every route.

## User Setup Required

None.

## Next Phase Readiness

- 12-13 (/contact) and 12-15 (/offline) can call `pageMetadata`; /offline also needs `robots: { index: false }`. meta.contact is supplied in 12-01.
- 12-25 adds the guard:identity rule for `site.url` (https, no localhost or example.com).
- SEO-02 OG images can attach to the root or to `photoMetadata` and project `generateMetadata`. Page-level `pageMetadata` calls must keep setting no openGraph.
- Flagged for Tim (from the plan): robots disallows `/offline`, which is also noindex. If he wants it crawlable but noindex, remove that disallow line.

## Self-Check: PASSED

- Created files present: lib/metadata.ts, lib/__tests__/metadata.test.ts, app/sitemap.ts, app/robots.ts, e2e/seo.spec.ts
- Commits on this branch: 123d67a, 1b33003, 23dc92f

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*
