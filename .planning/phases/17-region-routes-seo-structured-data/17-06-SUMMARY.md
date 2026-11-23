---
phase: 17-region-routes-seo-structured-data
plan: 06
subsystem: ui
tags: [nextjs, react, photo-viewer, navigation, jest, rtl, playwright]

requires:
  - phase: 17-region-routes-seo-structured-data
    provides: 17-05 publishedViews/viewerPhotos (one-photo set for a photo off the light table) and the v2.0 identity harness; 17-01 region pages and regionHref; 17-16 the server-only registry guard
provides:
  - PhotoViewer optional serialisable prop back?: { href, label }, used by both page back links and the page Escape
  - the Previous / counter / Next group rendered only when photos.length > 1
  - the photo page's server-built back (regionOfPhoto + regionById + regionHref) for photos off the light table
  - components/photos/__tests__/photo-viewer.test.tsx (D-08, D-09, Escape, Edge PHOTO-05/empty)
  - ten e2e rows in e2e/photos-region.spec.ts for the seven new photo pages, Escape, the lightbox and the swipe
affects: [17-07, 17-12, 17-13, 17-15, 18]

actuals:
  tokens: 4404     # chars/4 over the added lines of be200a6..8440ba5
  tasks: 2
  commits: 4       # MEASURED: git rev-list --count be200a6..HEAD at SUMMARY write
plan_head_before: be200a63adba5a46dccdac382d73e147978039e1
plan_head_after: 8440ba53ca603ac39be482a8ce598eb08ece0c61

tech-stack:
  added: []
  patterns:
    - "Region data reaches a client component only as a serialisable prop built in the server page; the client file imports no registry module"
    - "A page passes an optional prop only when it has a value (two JSX branches, never prop={undefined}), so the v2.0 four's RSC props stay unchanged"

key-files:
  created:
    - components/photos/__tests__/photo-viewer.test.tsx
  modified:
    - components/photos/PhotoViewer.tsx
    - app/(site)/photos/[slug]/page.tsx
    - e2e/photos-region.spec.ts

key-decisions:
  - "17-06 D-08: the stepping group (Previous, counter, Next) renders only for photos.length > 1; the empty chrome-left container keeps its classes, so the right group stays right"
  - "17-06 D-09: a photo off the light table gets back = { href: regionHref(region.id), label: region.name } from the server page; the page Escape pushes back?.href ?? '/photos' (RESEARCH Open Question 5 adopted); the lightbox shows no back link"
  - "17-06: the page passes back only when defined (no back={undefined}) and throws at build time if a published photo has no registry region"

patterns-established:
  - "Server-built serialisable navigation props for client components (T-17-14): the href comes from the registry via regionHref, never from the URL"

requirements-completed: [PHOTO-05]

coverage:
  - id: D1
    description: "A one-photo viewer set renders no Previous, no Next and no counter on the page and in the lightbox; the four keep both buttons and '1 / 4'"
    requirement: PHOTO-05
    verification:
      - kind: unit
        ref: "components/photos/__tests__/photo-viewer.test.tsx#D-08: no stepping controls for a one-photo set"
        status: pass
      - kind: e2e
        ref: "e2e/photos-region.spec.ts#New photo pages (D-08, D-09, PHOTO-05) (PW_PROD=1, chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A new photo's page has one visible back link named after its region with href /photos/regions/<id>; the four keep 'All photographs' to /photos; the lightbox has no back link"
    requirement: PHOTO-05
    verification:
      - kind: unit
        ref: "components/photos/__tests__/photo-viewer.test.tsx#D-09: the page back link"
        status: pass
      - kind: e2e
        ref: "e2e/photos-region.spec.ts#/photos/<slug>: no stepping, one back link to <region> (7 photos x 2 engines)"
        status: pass
      - kind: e2e
        ref: "e2e/photos-region.spec.ts#the lightbox from the Ortler region page has no stepping and no back link; Back closes it @prod-only"
        status: pass
    human_judgment: false
  - id: D3
    description: "Escape on a new photo's page goes to its region page; on a v2.0 page it still goes to /photos"
    requirement: PHOTO-05
    verification:
      - kind: unit
        ref: "components/photos/__tests__/photo-viewer.test.tsx#Escape on the page (RESEARCH Open Question 5)"
        status: pass
      - kind: e2e
        ref: "e2e/photos-region.spec.ts#Escape on /photos/meadow-stream-below-the-peaks lands on the Ortler region page"
        status: pass
    human_judgment: false
  - id: D4
    description: "Edge PHOTO-05/empty: arrows and a touch swipe on a one-photo set write no URL, keep the title and announce nothing"
    requirement: PHOTO-05
    verification:
      - kind: unit
        ref: "components/photos/__tests__/photo-viewer.test.tsx#Edge PHOTO-05/empty: the arrows do nothing on a one-photo set"
        status: pass
      - kind: e2e
        ref: "e2e/photos-region.spec.ts#Edge PHOTO-05/empty: a touch swipe and the arrows do nothing on a new photo page @chromium-only"
        status: pass
    human_judgment: false
  - id: D5
    description: "The v2.0 four are identical to the phase base on all 36 compared fields after this plan, and the lightbox suite's 'n / 4' and 'All photographs' rows still pass"
    requirement: PHOTO-05
    verification:
      - kind: other
        ref: "node v20-identity.mjs http://localhost:3017 v20-base.json -> exit=0 differing=0 compared=36"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts and e2e/photos.spec.ts (PW_PROD=1, chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Client JS 1,851,749 B in 24 files, within the 1,855,781 B cap; PhotoViewer imports no region data"
    verification:
      - kind: other
        ref: "rm -rf .next/static && npm run build; byte-sum one-liner (exit 0)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/client-graph.test.ts"
        status: pass
    human_judgment: false

duration: 11min
completed: 2026-11-23
status: complete
---

# Phase 17 Plan 06: PhotoViewer D-08 / D-09 Summary

**A one-photo viewer set now shows no Previous, Next or counter. Each new photo page gets one back link, named after its region and pointing to `/photos/regions/<id>`; the server page builds it with `regionOfPhoto` and `regionHref`, and the page's Escape goes there too. The v2.0 four get no `back` prop and are identical to the phase base on 36 of 36 compared fields. Client JS is 1,851,749 B.**

## Performance

- **Duration:** about 11 min (by `date`)
- **Started:** 2026-11-23T23:44:08Z
- **Completed:** 2026-11-23T23:55:28Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- `PhotoViewer` takes an optional `back?: { href: string; label: string }`. Both page back links (the scroll-tier row and the chrome link) render `back?.href ?? '/photos'` and `back?.label ?? 'All photographs'`, with the same classes and icon as before. The page Escape pushes the same href.
- The Previous button, the `data-photo-counter` span and the Next button render only when `photos.length > 1`. The `data-chrome-left` container and its classes are unchanged.
- `app/(site)/photos/[slug]/page.tsx` computes `back` on the server, only for a slug outside `photoSlugs`. It passes the prop only when it exists. A published photo with no registry region fails the build.
- The intercepted lightbox route is unchanged (`grep -c "back="` prints 0). `PhotoViewer` imports no region module.
- I took the 10 e2e rows from the data (publishedViews minus photoSlugs, which gives the seven new photos), so they need no edit when photos are added.

## v2.0 identity (after 17-06)

Build: `rm -rf .next/static && npm run build` on HEAD e359db4, then `git restore public/service-worker.js`. The Task 2 commit 8440ba5 changes only `e2e/photos-region.spec.ts`, which is not part of the app build. Server: `node node_modules/next/dist/bin/next start -p 3017`. Harness: `<scratchpad>/v20-identity.mjs` (SHA-256 `b722b565…2dd6`) and `<scratchpad>/v20-base.json` (SHA-256 `be3ad3b8…200a`). Both match the 17-05 SUMMARY's hashes, so I did not recreate them. Command: `node <scratchpad>/v20-identity.mjs http://localhost:3017 <scratchpad>/v20-base.json`, run from the repo root. Complete stdout:

```text
v20-identity: exit=0 differing=0 compared=36 removed=0,0,0,0 base=51b7f4d9b291 head=e359db43ef2b
```

Exit code: 0. Stderr was empty.

| Field | matterhorn-from-zermatt | gornerschlucht-waterfall | matterhorn-glacier-trail | riffelsee-reflection |
|---|---|---|---|---|
| status | identical | identical | identical | identical |
| title | identical | identical | identical | identical |
| headSha256 | identical | identical | identical | identical |
| ogImage | identical | identical | identical | identical |
| ogStatus | identical | identical | identical | identical |
| ogContentType | identical | identical | identical | identical |
| ogSha256 | identical | identical | identical | identical |
| mainSha256 | identical | identical | identical | identical |
| htmlSha256 | identical | identical | identical | identical |
| ldJsonRemoved (recorded, not compared) | 0 | 0 | 0 | 0 |

On the same server, `curl` of `/photos/meadow-stream-below-the-peaks` and `/photos/castle-below-limestone-peaks` showed two `href="/photos/regions/ortler"` and two `href="/photos/regions/saalfelden"` back links. The server was stopped by killing the process tree on its port; nothing listens on :3000 or :3017.

## Client JS

`rm -rf .next/static && npm run build` on e359db4 gives **1,851,749 B in 24 files**. The phase base and 17-05's total were both 1,851,685 B, so this plan adds 64 B (RESEARCH A1 estimated 100 to 250 B). The cap is 1,855,781 B. A grep of `.next/static/chunks` for `Steinernen` found no file.

## Task Commits

1. **Task 1: PhotoViewer hides stepping for a one-photo set and takes a server-built back link**
   - `99318eb` (test, RED): photo-viewer.test.tsx with the D-08, D-09, Escape and Edge PHOTO-05/empty rows
   - `fcc0085` (test): typed the replaceState spy as `jest.Spied` (type-check) and formatted the test file
   - `e359db4` (feat, GREEN): PhotoViewer `back` prop and the `photos.length > 1` group; the photo page's server-built back
2. **Task 2: D-08 and D-09 in the browser, the client JS budget and the v2.0 identity rerun**
   - `8440ba5` (test): ten e2e rows in photos-region.spec.ts

## TDD Gate Compliance

- **RED (`99318eb`):** `npx jest components/photos/__tests__/photo-viewer.test.tsx` exited 1 with 4 failed and 8 passed. All four failures were assertions on the planned behaviour:
  - the page variant with one photo still rendered `Previous photo` (aria-disabled);
  - the modal variant with one photo still rendered `Previous photo`;
  - `getAllByRole('link', { name: 'Ortler' })` found no link;
  - Escape with `back` pushed `"/photos"` where `"/photos/regions/ortler"` was expected.

  There were no load, import or syntax errors. The 8 rows that passed are guards that already held: the fixtures, the four's controls and links, the lightbox's missing back link, Escape without `back`, the one-photo arrow rows (`stepIndex` already returns null) and the four-photo arrow control. The Jest default reporter is not a `tdd-red-evidence` classifier format, so I did not run the classifier. The RED verdict rests on reading the output, saved to the git-ignored `.gsd/tdd-evidence/17-06/red-t1.txt`.
- **GREEN (`e359db4`):** the Task 1 verify suites (components/photos, photo-routes, client-graph) passed 165/165, and `npm run type-check` exited 0.
- `fcc0085` is a test-only repair between RED and GREEN. It uses the `test(...)` scope, so it is not counted as GREEN.

## Files Created/Modified

- `components/photos/PhotoViewer.tsx`: the `back` prop, `backHref`/`backLabel` for the two page links and the page Escape, the `photos.length > 1` stepping group, and a doc paragraph on one-photo sets and the way back (D-08, D-09)
- `app/(site)/photos/[slug]/page.tsx`: `backFor(view)` (light-table check, `regionOfPhoto`, `regionById`, `regionHref`), with the prop passed only when defined; the doc block names D-09 and T-17-14
- `components/photos/__tests__/photo-viewer.test.tsx` (new): 12 RTL rows
- `e2e/photos-region.spec.ts`: `NEW_PHOTOS`, `ORTLER_PHOTO`, `expectNoStepping` and ten rows

## Decisions Made

- The page sends no `back` key at all for the four (two JSX branches), so their flight props are byte-for-byte what they were. `back={undefined}` would have serialised as `$undefined` in the RSC payload.
- `backFor` throws when a published photo has no registry region, instead of quietly falling back to /photos. A data fault then fails `next build`.
- Each per-photo e2e row checks two links in the markup (`includeHidden`) and exactly one visible. That matches the plan's "one visible back link" and catches a tier that shows both or neither.
- "Ortler's first, by data" is the first Ortler photo in `publishedViews` order: `meadow-stream-below-the-peaks`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The RED test used a Jest type this repo does not have**
- **Found during:** Task 1 GREEN verify (`npm run type-check`)
- **Issue:** `jest.SpyInstance` is not in the Jest 30 types that `tsconfig.jest.json` checks (TS2694).
- **Fix:** `jest.Spied<typeof window.history.replaceState>`, as SafeCanvas.test.tsx and OfflineRetry.test.tsx use. Prettier formatted the file in the same commit.
- **Files modified:** `components/photos/__tests__/photo-viewer.test.tsx`
- **Verification:** type-check exit 0; 12/12 rows pass
- **Committed in:** `fcc0085`

**2. [Rule 1 - Bug] The first e2e draft counted the hidden back link through getByRole**
- **Found during:** Task 2, the first `PW_PROD=1` run (14 failed, 206 passed)
- **Issue:** `getByRole` leaves out the `display:none` tier copy, so the "two links in the markup" assertion saw 1 in both engines. The app was correct.
- **Fix:** count both links with `includeHidden: true`, then assert exactly one link without it, and that link visible. The second run passed 220, with 0 failed and 0 flaky.
- **Files modified:** `e2e/photos-region.spec.ts`
- **Committed in:** `8440ba5` (the only Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs in this plan's own new tests). **Impact on plan:** none on scope or app behaviour.

## Issues Encountered

- `PhotoViewer.tsx` was not Prettier-clean at HEAD: the `hotspotKey={<HotspotKey … />}` prop is wrapped differently. That predates this plan and is out of scope, so I did not reformat the file. Only my new lines follow the house style, and ESLint passes.

## Verification

- Jest: the Task 1 verify suites passed 165/165, and the full suite passed 118 suites and 2,160 tests.
- `npm run type-check` (three configs) and `npm run lint` (with the test-count scan) exited 0.
- `PW_PROD=1 npx playwright test e2e/photos-region.spec.ts e2e/photos-lightbox.spec.ts e2e/photos.spec.ts --project=chromium --project=firefox`: **220 passed**, 0 failed, 0 flaky. This includes the lightbox suite's 'n / 4' and 'All photographs' rows for the four. `public/service-worker.js` was restored afterwards.
- `npx playwright test e2e/photos-region.spec.ts --project=chromium --list` listed **4 tests before and 14 after**. That is 10 more: the seven per-photo rows, the fixture-count row, the Escape row and the swipe row. The `@prod-only` lightbox row runs only under PW_PROD=1.
- Acceptance greps:
  - `photos.length > 1` in PhotoViewer.tsx: 1
  - `^import .*(/lib/regions|regions\.json)` in PhotoViewer.tsx: 0
  - `regionOfPhoto` in `[slug]/page.tsx`: 3
  - `back=` in `@modal/(.)[slug]/page.tsx`: 0
- `node scripts/ci/check-snapshot-commit.mjs --none` passed after every commit (0 changed), and no PNG was staged.
- Nothing listens on :3000 or :3017.

## Known Stubs

None.

## Threat Flags

None. T-17-14 is mitigated: the href is built on the server from the registry with `regionHref` and never read from the URL. PhotoViewer imports no region data, which the grep gate and client-graph.test.ts check. No package was installed (T-17-SC).

## User Setup Required

None.

## Next Phase Readiness

- 17-07, 17-12, 17-13 and 17-15 rerun the identity compare. The harness and base in the scratchpad still match 17-05's hashes.
- Phase 18 replaces the one-photo sets with per-region stepping. The `photos.length > 1` gate and the `back` prop are the two places that change.

## Self-Check: PASSED

All four key files exist. Commits 99318eb, fcc0085, e359db4 and 8440ba5 are ancestors of HEAD. The TDD gate commits are present: test(17-06) 99318eb, followed by feat(17-06) e359db4.

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-23*
