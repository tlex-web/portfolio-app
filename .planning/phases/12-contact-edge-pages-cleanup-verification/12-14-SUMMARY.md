---
phase: 12-contact-edge-pages-cleanup-verification
plan: 14
subsystem: seo
tags: [next-og, opengraph-image, generateImageMetadata, satori, seo, jest, playwright]

requires:
  - phase: 12-10
    provides: "lib/og/template.tsx: OgFrame photo/project variants, ogPhotoImage, ogFonts, contourDataUrl, OG_SIZE"
  - phase: 12-01
    provides: "Resolved values og.alt-photo and og.alt-project (supplied)"
  - phase: 12-09
    provides: "metadataBase and root openGraph/twitter defaults; the per-route metadata the cards attach to"
provides:
  - "Per-photo OG card at /photos/{slug}/opengraph-image-{hash}/card (photo variant over the manifest's 1200 px JPEG derivative)"
  - "Per-project OG card at /projects/{slug}/opengraph-image-{hash}/card (project variant)"
  - "Per-slug og:image:alt from Tim's og.alt-photo / og.alt-project templates via generateImageMetadata"
  - "lib/og/__tests__/routes.test.ts and the per-slug block of e2e/og.spec.ts"
affects: [12-verification, seo, og-images]

actuals:
  tokens: 4793
  tasks: 2
  commits: 2
plan_head_before: efbac33dbec1382570802fa90bc1c56ea79553fc
plan_head_after: fee1ccb07b0b245f0ed7653caba99c5c29ccc094

tech-stack:
  added: []
  patterns:
    - "A generateImageMetadata OG route under a dynamic segment exports no generateStaticParams or dynamicParams (Next 16.4); it renders on the first request, is cached, and answers 404 for an unknown slug"
    - "Route tests replace next/og with a recorder and wrap node:fs/promises readFile, so they check the element and the files a route reads without rasterising"

key-files:
  created:
    - app/(site)/photos/[slug]/opengraph-image.tsx
    - app/(site)/projects/[slug]/opengraph-image.tsx
    - lib/og/__tests__/routes.test.ts
  modified:
    - e2e/og.spec.ts

key-decisions:
  - "Per-slug alt text kept (generateImageMetadata); generateStaticParams and dynamicParams = false dropped, because Next 16.4 cannot list the slug of a generateImageMetadata route under a dynamic segment: dynamicParams = false made every card 404 under Turbopack, and the second generateStaticParams export broke next dev (webpack)"
  - "Cards render on the first request from local files and are then served from the route cache (x-nextjs-cache MISS, then HIT); output file tracing already ships the fonts, contour SVG and JPEG derivatives with both routes, so this also works on Vercel"

patterns-established:
  - "OG route alt text comes from generateImageMetadata, filled from the view-model or data/projects.ts, never typed"

requirements-completed: [SEO-02]

coverage:
  - id: D1
    description: "Every photo and project page names its own OG card, which answers 200 image/png at 1200 x 630"
    requirement: SEO-02
    verification:
      - kind: e2e
        ref: "e2e/og.spec.ts#Per-slug Open Graph cards (SEO-02, D-14, D-15) (6 per-slug tests, PW_PROD=1, chromium)"
        status: pass
      - kind: unit
        ref: "lib/og/__tests__/routes.test.ts#generateImageMetadata"
        status: pass
    human_judgment: false
  - id: D2
    description: "Card URLs and alt texts are pairwise distinct and none is Home's (SEO-02 adjacency)"
    requirement: SEO-02
    verification:
      - kind: e2e
        ref: "e2e/og.spec.ts#no two pages share a card URL or alt, and none is Home's"
        status: pass
      - kind: unit
        ref: "lib/og/__tests__/routes.test.ts#no two slugs share an alt (SEO-02 adjacency)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The photo card reads only the manifest's 1200 px JPEG derivative (never an original); alt follows og.alt-photo with approx. for the hand-placed position"
    requirement: SEO-02
    verification:
      - kind: unit
        ref: "lib/og/__tests__/routes.test.ts#photo route: derivatives only (T-12-27)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Unknown or mis-cased slugs have no card (404)"
    requirement: SEO-02
    verification:
      - kind: unit
        ref: "lib/og/__tests__/routes.test.ts#an unknown or mis-cased slug has no card"
        status: pass
      - kind: other
        ref: "curl against next start: /photos/nope/…/card, /photos/<slug>/…/x and /projects/nope/…/card all 404"
        status: pass
    human_judgment: false
  - id: D5
    description: "The cards look right in a link preview (photo contain-fitted with the © line; project route, grade and pitch)"
    verification: []
    human_judgment: true
    rationale: "Visual quality of the rendered PNGs is a judgment call; the template layout was approved in 12-10 and the PNGs were only eyeballed here"

duration: 12min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 14: Per-slug Open Graph Images Summary

**Each photo and project page now has its own Open Graph card, rendered by the shared 12-10 template from the manifest's 1200 px JPEG derivative or the project data, with alt text built per slug from Tim's og.alt-photo and og.alt-project templates.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-11-02T21:48:32Z
- **Completed:** 2026-11-02T22:00:35Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `/photos/{slug}` and `/projects/{slug}` each emit their own `og:image` (and `twitter:image`) at `/{section}/{slug}/opengraph-image-{hash}/card`, a 1200 x 630 PNG. Six cards, all distinct, none the default card.
- Photo cards draw only the hashed, EXIF-free 1200 px JPEG derivative. The film scan reads "© 2019 Tim Lui" and "2,760 m approx.".
- Alt text per slug: "{title}, a photograph by Tim Lui. {short place}, {altitude}[ approx.]" for photos, "{name}: {pitch}" for projects. coin-flip uses only its approved Phase 11 name and pitch.
- Unknown slugs, unknown card ids and mis-cased slugs get a 404. proxy.ts is unchanged; the OG paths have more than two segments, so they pass through it.

## Build output (route lines)

Final build (`next build`, Turbopack, Next 16.4.2):

```
├ ○ /opengraph-image
├ ● /photos/[slug]/opengraph-image-126xvw/[__metadata_id__]
├ ● /projects/[slug]/opengraph-image-umay0l/[__metadata_id__]
```

Both routes are listed as ●, but **no concrete path is prerendered**. In `.next/prerender-manifest.json` both are dynamic routes with `fallback: null` and no entries in `routes`. A card renders on its first request and then comes from the route cache: `x-nextjs-cache: MISS`, then `HIT`, under `next start`. This is the RESEARCH A3 case (see Deviations). In the first build, which still had `dynamicParams = false`, the same ● lines appeared with `fallback: false` and zero paths, so every card returned 404.

## Task Commits

1. **Task 1: Per-slug photo and project OG routes** - `90d8dad` (feat)
2. **Task 2: Tests: alt texts, derivative paths and live PNGs per slug** - `fee1ccb` (test)

## Files Created/Modified

- `app/(site)/photos/[slug]/opengraph-image.tsx`: photo card. Exports `size`, `contentType`, `generateImageMetadata` (og.alt-photo) and the default `Image` (OgFrame photo variant, ogPhotoImage).
- `app/(site)/projects/[slug]/opengraph-image.tsx`: project card. Exports `size`, `contentType`, `generateImageMetadata` (og.alt-project) and the default `Image` (OgFrame project variant).
- `lib/og/__tests__/routes.test.ts`: 29 Jest cases, all driven from the data. They cover card metadata and the alt templates, unknown and mis-cased slugs, alt adjacency, the derivative path, file existence and the 2560 px cap, the files the photo route reads (only its JPEG), rendering for the right slug, rejection of unknown slugs, and the guard against generateStaticParams/dynamicParams exports.
- `e2e/og.spec.ts`: one test per data slug (og:image path, twitter:image equal to it, non-empty alt, 200 image/png with IHDR 1200 x 630) and one test that URLs and alts are pairwise distinct and none is Home's. Prettier also re-wrapped two existing `toHaveAttribute` calls; no behaviour changed.

## Decisions Made

- Kept per-slug alt text (generateImageMetadata) and gave up build-time prerendering, which Next 16.4 cannot provide for these routes. Alt text per slug is a must-have, and the plan's A3 fallback already allows request-time rendering from local files.
- Used `ogPhotoImage(view.id)` from 12-10 rather than a second `readFile` in the route, so the template's single derivative reader is the only way photo bytes get in.
- Did not run ui-ux-pro-max: this plan wires the 12-10 template (already designed and approved) into routes and adds no new visual design.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `dynamicParams = false` plus `generateStaticParams` made every per-slug card a 404 (prod) and a 500 (dev)**
- **Found during:** Task 1 (first build and `next start`)
- **Issue:** With `generateImageMetadata`, Next's metadata-route loader generates the route's own `generateStaticParams` over `__metadata_id__` only (`next-metadata-route-loader.js` getDynamicImageRouteCode). For an app route, `collectAppRouteSegments` attaches `generateStaticParams` only to the last segment (`[__metadata_id__]`), so the `[slug]` param is never listed. Under Turbopack the generated function replaced the file's own, so no path was prerendered. `dynamicParams = false` then turned every card into a 404, while the pages still pointed their `og:image` at those URLs. Under webpack (`next dev --webpack`) the two `generateStaticParams` exports collided ("Module parse failed: Duplicate export 'generateStaticParams'"), so the card returned 500 and the photo page could not build its metadata.
- **Fix:** Removed `generateStaticParams` and `dynamicParams` from both routes and kept `generateImageMetadata`. The generated GET answers 404 when `generateImageMetadata` returns no entry, so unknown slugs still get a 404. Both files' JSDoc records why. A Jest case fails if either export comes back.
- **Files modified:** both `opengraph-image.tsx` routes
- **Verification:** `next start`: all six cards 200 image/png 1200 x 630, MISS then HIT; unknown slug, unknown id and unknown project all 404. `next dev --webpack`: cards 200, unknown 404, no errors in the log. Output file tracing (`route.js.nft.json`) for both routes includes `lib/og/fonts/*.ttf` and the `public/images/photos/*-1200.*.jpg` derivatives.
- **Committed in:** `90d8dad`

**Acceptance criteria knowingly left unmet as a result:**
- `grep -c "export const dynamicParams = false"` prints 0 for both routes, not 1.
- Must-have truths "export dynamicParams = false and a generateStaticParams", "prerendered, not dynamic" and "ordering: generateStaticParams returns slugs in data order" do not hold as written. Instead, the build lists both routes as ● with no prerendered paths, cards are rendered once at request time and cached, and slug enumeration follows data order in the tests and the e2e. Tim should hear about this at the round-2 summary, as the plan's A3 note asks.
- The plan named Task 2's commit `test(12-14): per-slug OG routes are static, private and distinct`. The commit says "private, distinct and correctly sized", because the routes are not static.

---

**Total deviations:** 1 auto-fixed (Rule 1). **Impact on plan:** required for the cards to load at all. Per-slug alt text and the derivative-only rule hold; build-time prerendering does not, and Next 16.4 cannot provide it together with per-slug alt.

## TDD Gate Compliance

Task 2 (`tdd="true"`) tests routes that Task 1 had already built and committed. That is the plan's order (Task 1 feat, then Task 2 test), so there is no RED-before-GREEN commit pair: the `test(12-14)` commit `fee1ccb` comes after the `feat(12-14)` commit `90d8dad`. On its first run the new suite passed (29/29). This is the expected "feature already exists" case, not a broken test. To show the tests can fail, a temporary mutation of the photo route (adding `dynamicParams = false` and changing one character of the alt template) failed 5 cases: 4 photo-alt cases and the exports guard. The route was then restored with `git checkout`.

## Issues Encountered

- **Windows-only local cache artefact (not a product bug):** `next start` keeps route-cache entries as files under `.next/server/route-cache`. On case-insensitive NTFS, `/projects/BOX/…/card` therefore hit box's cached PNG, and a cached 404 for `BOX` also shadowed `box`. On a cold cache, `BOX` gets a 404, as `generateImageMetadata` intends (Jest covers this). On Linux or Vercel the paths are case-sensitive. The e2e never requests a mis-cased slug, so the local cache cannot be polluted.

## Verification

- `npm run lint`: green. `npm run type-check`: green. `npx jest lib/og --silent`: 53/53. Full `npx jest`: 95 suites, 1571 tests, green.
- `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/og.spec.ts --project=chromium`: 9/9. Plan-level fresh build with `PW_PROD=1`: 9/9.
- Neighbouring specs, fresh build: `e2e/seo.spec.ts` and `e2e/photos-carousel.spec.ts` 15/15; `e2e/not-found.spec.ts` 17/17.
- Visual routes: no page markup changed except the `og:image*` and `twitter:image*` head tags, so no pixel should move. Visual specs were not run locally (the baselines are Linux CI PNGs). No PNGs were touched.
- `public/service-worker.js` restored after every build; `git status --porcelain public/service-worker.js` is empty. Port 3000 is free.

## User Setup Required

None.

## Next Phase Readiness

- SEO-02 per-slug cards are live. Round-2 summary for Tim: the cards render at request time and are then cached, not prerendered at build (Next 16.4 limitation with per-slug alt; see Deviations).
- The rendered PNGs (photo contain-fit with the © line, project profile, caption, grade and pitch) still need a visual look at UAT (coverage D5).

## Self-Check: PASSED

- FOUND: app/(site)/photos/[slug]/opengraph-image.tsx
- FOUND: app/(site)/projects/[slug]/opengraph-image.tsx
- FOUND: lib/og/__tests__/routes.test.ts
- FOUND: 90d8dad (ancestor of HEAD)
- FOUND: fee1ccb (ancestor of HEAD)

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*
