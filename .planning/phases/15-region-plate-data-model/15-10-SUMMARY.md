---
phase: 15-region-plate-data-model
plan: 10
subsystem: routing
tags: [photos, urls, proxy, sitemap, jest, playwright, data-10, bundle]

requires:
  - phase: 15-09
    provides: the Home-list readers; the tree this plan's call sites sit in
provides:
  - lib/photos/routes.ts with photoHref(slug) (the one photo URL builder, D-16) and photoRouteSlugs (the slim editorial slug list, F5)
  - proxy.ts admits photo slugs from photoRouteSlugs and no longer imports the view-model
  - all 11 hand-built photo URL sites in 10 files go through photoHref; URL strings unchanged
  - lib/__tests__/photo-routes.test.ts - D-17 pin, proxy/static-params set equality, sitemap check, pure-annotation pin and the D-18 source scan with HAND_BUILT self-tests
affects: [15-11, 15-16, phase-16-new-content, phase-17-region-pages]

actuals:
  tokens: 5000
  tasks: 3
  commits: 3
plan_head_before: d8a73d0d22aa3d1eff8897b75e666e83ebf5a86f
plan_head_after: cb035a095de010ed61f59859c9ae68b05bce06af

tech-stack:
  added: []
  patterns:
    - "A shared module that client code imports and that also holds a data-derived top-level constant marks that constant /* @__PURE__ */, so the bundler drops the data from client chunks; a test pins the annotation"
    - "Photo URLs are built only by photoHref; the D-18 source scan walks app/, components/, lib/ and proxy.ts itself, so new files are covered without editing the test"

key-files:
  created:
    - lib/photos/routes.ts
    - lib/__tests__/photo-routes.test.ts
  modified:
    - proxy.ts
    - app/sitemap.ts
    - components/home/WaypointCard.tsx
    - components/photos/CarouselControls.tsx
    - components/photos/CarouselStepper.tsx
    - components/photos/JustifiedGrid.tsx
    - components/photos/MapSheet.tsx
    - components/photos/CarouselView.tsx
    - components/photos/PhotoViewer.tsx
    - lib/photos/view-model.ts
    - lib/saved-pages.ts

key-decisions:
  - "15-10: photoRouteSlugs carries a /* @__PURE__ */ annotation. Without it, client components importing photoHref pulled the editorial copy into a client chunk (measured: client JS 1,855,546 B, over the 1,854,478 B phase cap). With it the copy is gone and the total is 1,851,610 B. A photo-routes test fails if the annotation is removed"
  - "15-10: the proxy admits photoRouteSlugs (editorial) while generateStaticParams and the sitemap stay on the view-model's ordered photoSlugs; the set-equality test is the tripwire for a slug without a page (planner decision F5, kept as written)"

patterns-established:
  - "No file in app/, components/, lib/ or proxy.ts builds /photos/<slug> by hand; the photo-routes scan enforces it in npm test"

requirements-completed: [DATA-10]

coverage:
  - id: D1
    description: "photoHref(slug) returns /photos/<slug> for every photo slug (D-16, D-17)"
    requirement: DATA-10
    verification:
      - kind: unit
        ref: "lib/__tests__/photo-routes.test.ts#photoHref (D-17)"
        status: pass
    human_judgment: false
  - id: D2
    description: "proxy.ts reads photoRouteSlugs from lib/photos/routes.ts, and that set equals generateStaticParams' slugs (F5, T-15-13, T-15-14)"
    requirement: DATA-10
    verification:
      - kind: unit
        ref: "lib/__tests__/photo-routes.test.ts#admits exactly the slugs generateStaticParams renders"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/not-found.spec.ts --project=chromium"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every photo URL site (sitemap, five Link hrefs, router.push, both PhotoViewer paths, canonical, saved-pages catalog) uses photoHref, with unchanged URL strings"
    requirement: DATA-10
    verification:
      - kind: unit
        ref: "lib/__tests__/photo-routes.test.ts#no hand-built photo path outside lib/photos/routes.ts (D-18)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/seo.spec.ts e2e/not-found.spec.ts e2e/photos.spec.ts e2e/photos-carousel.spec.ts e2e/photos-lightbox.spec.ts e2e/offline.spec.ts --project=chromium (152 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-18 source scan with self-testing HAND_BUILT patterns (12 bad snippets caught, 11 good snippets allowed); a temporary hand-built template in MapSheet.tsx fails it naming the file"
    requirement: DATA-10
    verification:
      - kind: unit
        ref: "lib/__tests__/photo-routes.test.ts#the hand-built photo path patterns (D-18 self-test)"
        status: pass
    human_judgment: false
  - id: D5
    description: "No editorial copy in client chunks after client components import photoHref (pure annotation pinned by test)"
    verification:
      - kind: unit
        ref: "lib/__tests__/photo-routes.test.ts#marks the slug list pure, so client chunks that import photoHref carry no editorial copy"
        status: pass
      - kind: other
        ref: "npm run build; grep -rl 'riffelsee-reflection' .next/static/chunks (no match); client JS 1,851,610 B"
        status: pass
    human_judgment: false

duration: 11min
completed: 2026-11-14
status: complete
---

# Phase 15 Plan 10: Photo URL Helper Summary

**Every photo URL now comes from `photoHref(slug)` in `lib/photos/routes.ts`. The proxy reads a slim editorial slug list from there instead of the whole view-model. A self-testing Jest source scan fails on any hand-built `/photos/<slug>` outside that module, and a pure annotation keeps the editorial copy out of the client chunks that import the helper.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-11-14T21:43:44Z
- **Completed:** 2026-11-14T21:55:07Z
- **Tasks:** 3
- **Files modified:** 13 (2 created, 11 modified)

## Accomplishments

- `lib/photos/routes.ts`: `photoHref(slug): \`/photos/${string}\`` and `photoRouteSlugs` (from `Object.values(editorial)`), importing only `@/data/photos/editorial`. The module JSDoc names it the one photo URL builder (D-16) and says Phase 17 adds `regionHref` there (D-19).
- `proxy.ts`: `KNOWN.photos = new Set(photoRouteSlugs)`; the view-model import is gone (F5, T-15-13). `DETAIL_PATH` is unchanged.
- `app/sitemap.ts`: photo URLs are `${site.url}${photoHref(slug)}`, still in the view-model's `photoSlugs` order.
- Five Link hrefs (WaypointCard, CarouselControls, CarouselStepper, JustifiedGrid, MapSheet), the CarouselView `router.push` (keeps `{ scroll: false }`), the PhotoViewer `replaceState` and title-keeper path, `photoMetadata`'s canonical and the saved-pages catalog all call `photoHref`. The `/photos` index links and the path parsers are untouched.
- `lib/__tests__/photo-routes.test.ts` (34 tests): the D-17 pin (`'/photos/' + slug`), the proxy/page set equality with a message naming the missing side, the sitemap check, the pure-annotation pin, the `HAND_BUILT` self-tests and the recursive scan.

## Task Commits

1. **Task 1: photoHref through the proxy slug set and the sitemap** - `603f083` (feat)
2. **Task 2: five photo Link hrefs to photoHref** (plus the pure-annotation fix) - `09766ac` (feat)
3. **Task 3: navigation, canonical and catalog sites; D-18 scan; production e2e** - `cb035a0` (feat)

## Files Created/Modified

- `lib/photos/routes.ts` - photoHref and photoRouteSlugs (created)
- `lib/__tests__/photo-routes.test.ts` - pin, set equality, sitemap, pure pin, D-18 scan (created)
- `proxy.ts`, `app/sitemap.ts` - read the routes module
- `components/home/WaypointCard.tsx`, `components/photos/{CarouselControls,CarouselStepper,JustifiedGrid,MapSheet}.tsx` - Link hrefs
- `components/photos/CarouselView.tsx`, `components/photos/PhotoViewer.tsx` - router.push, replaceState, title path
- `lib/photos/view-model.ts` - canonical
- `lib/saved-pages.ts` - catalog href; the module doc names its one import

## D-18 negative check (acceptance criterion)

A temporary `export const probe = (slug: string) => \`/photos/${slug}\`;` appended to `components/photos/MapSheet.tsx` made `npx jest lib/__tests__/photo-routes.test.ts` exit 1:

```
    - Expected  - 1
    + Received  + 3
    +   "components/photos/MapSheet.tsx:200: export const probe = (slug: string) => `/photos/${slug}`;",
Tests:       1 failed, 33 passed, 34 total
```

The probe was reverted with `git checkout -- components/photos/MapSheet.tsx`, and `git diff --quiet HEAD` on the file confirmed it.

## Verification

- `git grep -n 'photos/\${' -- app components lib proxy.ts ':!**/__tests__/**' ':!lib/photos/routes.ts'` exits 1 (no match); it counted 10 after Task 1 and 5 after Task 2, as planned.
- `npx jest lib/__tests__/photo-routes.test.ts lib/__tests__/saved-pages.test.ts lib/__tests__/photos-view-model.test.ts`: 66 passed.
- Full Jest: 111 suites, 1901 tests passed (110 / 1867 before; +1 suite, +34 tests).
- `npm run type-check` and `npm run lint` (including `guard:tests:scan`) exit 0; `guard:selftest` 232/232.
- `PW_PROD=1 npx playwright test e2e/seo.spec.ts e2e/not-found.spec.ts e2e/photos.spec.ts e2e/photos-carousel.spec.ts e2e/photos-lightbox.spec.ts e2e/offline.spec.ts --project=chromium`: 152 passed, 0 failed, 0 flaky (one production build). Port 3000 was free before the run and after it.
- `git restore public/service-worker.js` after every build; `git diff --quiet HEAD -- public/service-worker.js` exits 0.
- Client JS (15-01 method): 1,851,610 B in 24 files, under the 1,854,478 B phase cap. No editorial string (`riffelsee-reflection`, story text) in `.next/static/chunks`.

## Decisions Made

- The pure annotation on `photoRouteSlugs` (see Deviations). The alternative, putting `photoHref` in an import-free module and re-exporting it, would have broken the plan's `export const photoHref` artifact in `routes.ts` and split the helper across two files. The annotation keeps one module and is pinned by a test.
- The proxy/page split stays exactly as the planner decided (F5).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Editorial copy leaked into a client chunk once client components imported photoHref**
- **Found during:** Task 2 (production build after the Link edits)
- **Issue:** `photoRouteSlugs = Object.values(editorial).map(...)` is a top-level call, so the bundler kept it, and the whole editorial record, in every client chunk that imported `photoHref` (CarouselControls is a client component). Measured: `.next/static/chunks/088tbw2lkljn7.js` contained the editorial copy, and client JS rose to 1,855,546 B, over the 1,854,478 B phase cap. 15-08 had kept editorial copy out of client chunks on purpose.
- **Fix:** `/* @__PURE__ */` on the `photoRouteSlugs` initializer, a JSDoc saying why it is load-bearing, and a photo-routes test that fails if the annotation is removed. After the fix, a rebuild showed no editorial copy in any client chunk: 1,851,478 B after Task 2 and 1,851,610 B after Task 3. The proxy and server code still get the full list.
- **Files modified:** lib/photos/routes.ts, lib/__tests__/photo-routes.test.ts
- **Commit:** 09766ac

**2. [Rule 2 - Doc accuracy] saved-pages module doc**
- **Found during:** Task 3
- **Issue:** The `lib/saved-pages.ts` JSDoc says "no data imports", but the module now imports `photoHref`.
- **Fix:** One added paragraph says the one import is photoHref and that the editorial copy it touches is dropped from the client island.
- **Files modified:** lib/saved-pages.ts
- **Commit:** cb035a0

**Total deviations:** 2 auto-fixed (1 bug, 1 doc). **Impact:** No URL string changed. The fix kept the plan from adding about 4 KB of editorial copy to client JS, which would have broken the phase budget.

## Issues Encountered

- Script-based edits inserted bare LF lines into CRLF working-copy files (autocrlf=true). I normalized the touched files back to CRLF before committing. The stored content is unaffected, since git normalizes on commit.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Phase 17 adds `regionHref` to `lib/photos/routes.ts` (D-19). Any data-derived top-level constant added there needs the same pure annotation if client code imports the module.
- When Phase 16 adds a photo, the set-equality test fails until that photo has a static page.
- Ready for 15-11.

## Self-Check: PASSED

- FOUND: lib/photos/routes.ts
- FOUND: lib/__tests__/photo-routes.test.ts
- FOUND: 603f083, 09766ac, cb035a0 (ancestors of HEAD)
