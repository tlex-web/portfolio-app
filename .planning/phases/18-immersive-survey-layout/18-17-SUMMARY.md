---
phase: 18-immersive-survey-layout
plan: 17
subsystem: photos
tags: [photo-page, back-link, breadcrumb, json-ld, breadcrumblist, d-09, d-10, region-02, lbox-09, photo-06, e2e, jest]
status: complete

requires:
  - phase: 18-06
    provides: "Breadcrumb component (props only), breadcrumbLd, regionBreadcrumb and the Crumb type"
  - phase: 18-16
    provides: "PhotoViewer's required endCard and its strip-less card step"
provides:
  - "photoBack(photoId) in lib/regions.ts: { href: regionHref(region), name: region.name } from the registry by photo id; RangeError for an unknown id"
  - "photoBreadcrumb(slug) in lib/regions.ts: Photographs /photos, region name regionHref, title photoHref; RangeError for an unpublished or wrong-case slug"
  - "PhotoViewer: back required on the page (RangeError otherwise), breadcrumb prop whose current crumb follows the shown photo"
  - "ExifStrip: backName (legend 'Esc back to {name}', required at level 1) and breadcrumb (rendered above the h1, level 1 only)"
  - "The photo page's second ld+json block: breadcrumbLd(photoBreadcrumb(view.slug))"
affects: [18-19, 18-20, 18-25, 18-29]

actuals:
  tokens: 18800    # chars/4 over git diff d5cb948..184ab9c (75,069 chars incl. context)
  tasks: 2
  commits: 3       # git rev-list --count d5cb948..184ab9c; the metadata commit follows
plan_head_before: d5cb948eae995e7b2fb961d77b98e115a7843114
plan_head_after: 184ab9c42f1f2dfc37a068be3691e5c63412fe63

tech-stack:
  added: []
  patterns:
    - "One server-built list feeds both the visible trail and the JSON-LD: photoBreadcrumb → breadcrumbLd for the block, and the same crumbs (last without href) as the viewer prop"
    - "A client prop that must exist on one surface is enforced with a RangeError at render (PhotoViewer back, ExifStrip backName), not a silent fallback"

key-files:
  created: []
  modified:
    - lib/regions.ts
    - "app/(site)/photos/[slug]/page.tsx"
    - components/photos/PhotoViewer.tsx
    - components/photos/ExifStrip.tsx
    - components/photos/__tests__/photo-viewer.test.tsx
    - components/photos/__tests__/strip.test.tsx
    - lib/__tests__/regions.test.ts
    - lib/__tests__/json-ld.test.ts
    - e2e/photos-lightbox.spec.ts
    - e2e/photos-region.spec.ts
    - e2e/seo.spec.ts
    - .planning/phases/18-immersive-survey-layout/deferred-items.md

key-decisions:
  - "18-17: photoBack and photoBreadcrumb live in lib/regions.ts and run on the server only; PhotoViewer and ExifStrip still import no region or generated module (grep 0), and the back target never comes from the URL (T-18-37)"
  - "18-17: PhotoViewer throws a RangeError for a page render without back, and ExifStrip for a level-1 strip without backName; no gallery-wide way back remains in the viewer"
  - "18-17: the current crumb follows the shown photo by swapping only the last crumb's name for current.title (a step stays inside the region); the BreadcrumbList is the load-time list"
  - "18-17: the photos-lightbox page-load identity loop now runs over all 11 published photos (was the v2.0 four), each with its own 'Back to {region}'"

requirements-completed: []  # LBOX-09 and REGION-02 are declared by later 18-xx plans still open (requirements.ready-ids: blocked); left for the phase verifier

coverage:
  - id: D1
    description: "Every photo page (all 11, the v2.0 four included) links back to its region as 'Back to {region}' with ArrowLeftIcon; Escape on the page goes there; the page legend reads 'Esc back to {region}'"
    requirement: "REGION-02"
    verification:
      - kind: unit
        ref: "components/photos/__tests__/photo-viewer.test.tsx 'D-09: the page back link (18-17…)' and 'Escape on the page'; strip.test row 8; regions.test \"a photo page's way back (18-17…)\""
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts Photo page (LBOX-01 direct load) x11 and the Escape rows; e2e/photos-region.spec.ts New photo pages x7 + Escape row (chromium, firefox, local webkit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The photo page shows 'Photographs / {region} / {title}' above the h1 with aria-hidden separators and 44 px crumb links; the current crumb follows a step; none on the end card or in the lightbox"
    requirement: "REGION-02"
    verification:
      - kind: unit
        ref: "strip.test 'the page breadcrumb sits above the h1…' and 'the lightbox strip renders no breadcrumb…'; photo-viewer.test 'D-10: the page breadcrumb follows the shown photo (18-17)'"
        status: pass
      - kind: e2e
        ref: "e2e/photos-region.spec.ts 'Photo page trail and one way back (18-17…)' x11 trail rows, step row, lightbox row"
        status: pass
    human_judgment: false
  - id: D3
    description: "The photo page holds one BreadcrumbList whose names and order equal the visible crumbs, items absolute, the last the page canonical; titles escaped (T-18-36)"
    requirement: "REGION-02"
    verification:
      - kind: unit
        ref: "lib/__tests__/json-ld.test.ts 'photoBreadcrumb: the BreadcrumbList on every photo page (18-17…)' and the photo page source rule"
        status: pass
      - kind: e2e
        ref: "e2e/photos-region.spec.ts trail rows (ldBlocks); e2e/seo.spec.ts 'every page carries exactly its JSON-LD types'"
        status: pass
    human_judgment: false
  - id: D4
    description: "17-UI-REVIEW hand-over: at 375, 768 and 1440 exactly one 'Back to …' link is visible; at 768 x 900 the key-tier chrome bar does not overflow"
    requirement: "LBOX-09"
    verification:
      - kind: e2e
        ref: "e2e/photos-region.spec.ts '/photos/saalfelden-valley-from-the-air at {375,768,1440}: exactly one visible Back to … link'"
        status: pass
    human_judgment: false

metrics:
  duration: "17 min (19:19Z to 19:36Z 2026-11-25)"
  completed: 2026-11-25
---

# Phase 18 Plan 17: Photo page way back and trail (D-09, D-10) Summary

**Every photo page, the v2.0 four included, now leads back to its region by name: 'Back to Zermatt' with the arrow (its own row on the scroll tier, chrome-left on the key and gutter tiers), and Escape and the legend ('Esc back to Zermatt') go the same way. Above the h1 in the strip's identity column sits a breadcrumb, 'Photographs / Zermatt / {title}'. Its current crumb follows the shown photo after a step, and a second ld+json block declares the same list as a BreadcrumbList. Both come from the registry on the server (photoBack, photoBreadcrumb). The lightbox shows neither.**

## Performance

- **Duration:** 17 min (2026-11-25, 19:19 to 19:36 UTC)
- **Tasks:** 2 (a tracer and a tdd task)
- **Files:** 11 modified, plus deferred-items.md

## Accomplishments

- **`photoBack(photoId)`** reads the region by photo id and returns `{ href: regionHref(id), name }`, so the URL never builds the target (T-18-37). The page's `backFor` and its v2.0-four branch are gone; all 11 pages pass `back={photoBack(view.id)}`.
- **PhotoViewer:**
  - A page render without `back` throws a RangeError.
  - Both links read `Back to {name}` (ArrowLeftIcon 20, aria-hidden, BACK_LINK).
  - Escape calls `router.push(back.href)`.
  - It passes `backName` and the breadcrumb to ExifStrip on the page only.
  - The doc blocks no longer describe any gallery-wide way back.
- **ExifStrip:**
  - The level-1 legend reads `Esc back to {name}`; a level-1 render without `backName` throws.
  - `Breadcrumb` (the 18-06 component, unchanged) renders with `mb-2` as the identity column's first child, at level 1 only.
- **`photoBreadcrumb(slug)`** returns `[...regionBreadcrumb(region), { title, photoHref(slug) }]`. The page renders `jsonLdHtml(breadcrumbLd(photoBreadcrumb(view.slug)))` beside the ImageObject block and passes the same crumbs (the last without href) to the viewer.
- **The crumb follows the shown photo:** PhotoViewer swaps only the last crumb's name for `current.title`. The end card replaces the strip, so it shows no trail.
- **Tracer gate:** Task 1's verify passed end to end (Jest 140; Chromium and Firefox production e2e 354 passed) before Task 2 started.

## Task Commits

1. **Task 1 (tracer): the way back for every photo page.** `5e8067f` feat(18-17): every photo page leads back to its region by name (D-09)
2. **Task 2 RED:** `651d8a5` test(18-17): photo page breadcrumb and its BreadcrumbList (RED, D-10)
3. **Task 2 GREEN:** `184ab9c` feat(18-17): photo page breadcrumb with matching BreadcrumbList; one way back per tier (D-10, REGION-02)

## Test mapping (PHOTO-06: rewritten, never deleted)

### Jest

| Suite › old test | New test |
|---|---|
| photo-viewer › D-09: the page back link › a new photo page: every back link is named after its region and leads to the region page | › a new photo page: both back links read 'Back to {region}' and lead to the region page (adds the legend) |
| › a v2.0 photo in Zermatt's series: both back links read All photographs and lead to /photos | › a v2.0 photo in Zermatt's series: both back links read 'Back to Zermatt' and lead to its region page, not /photos (adds the legend and the aria-hidden icon) |
| › the lightbox shows no back link | same title; it now looks for `/^Back to /` and checks the legend 'Esc close' |
| photo-viewer › Escape on the page › with back set, Escape goes to the region page | › on a new photo page, Escape goes to its region page |
| › without back, Escape goes to /photos | › on a v2.0 photo page, Escape goes to Zermatt's region page, not /photos (18 D-09) |
| strip › row 8: the shortcut legend …, Esc closing or going to all photographs | › row 8: …, Esc closing or going back to the region (18 D-09) |
| strip › holds no link and no download control (LBOX-07) | › holds no link and no download control without a breadcrumb (LBOX-07) |
| (new) photo-viewer | the page variant without back throws a RangeError; D-10 describe (4 rows: trail at load, after a step, none on the card, none in the lightbox) |
| (new) strip | the page strip needs its back name; the page breadcrumb sits above the h1; the lightbox strip renders no breadcrumb |
| (new) regions | a photo page's way back: 11 photo rows, the v2.0 four to Zermatt, the unknown id |
| (new) json-ld | the photo page source rule (second block from photoBreadcrumb); photoBreadcrumb describe (11 + 11 rows, T-18-36 escaping, unknown slug); the @modal rule also forbids photoBreadcrumb |

`renderPage` in photo-viewer.test now always passes `photoBack(shown id)` and the trail, as the page does. Its hand-typed `BACK` fixture (`{ href, label }`) is gone.

### E2E

| Spec › old test | New test |
|---|---|
| photos-lightbox › Photo page › `/photos/<slug>`: the viewer inside the shell, no dialog (D-08) ×4 (the v2.0 four) | › `/photos/<slug>`: the viewer inside the shell, no dialog, 'Back to {region}' (D-08, 18 D-09) ×11 (every published photo): one visible back link with its href, no 'All photographs' |
| › Viewer layout tiers › 1440 x 900 gutter tier … | same title; the chrome-left link is 'Back to Zermatt' |
| › 375 x 800 scroll tier … | same title; the back row's link is 'Back to Zermatt' |
| › Stage states › a failed photo shows the error and Retry … | same title; the visible link is 'Back to Zermatt' |
| › Focus and Escape › on the photo page, Escape goes to /photos (D-08) | › on the photo page, Escape goes to the photo's region page (D-08, 18 D-09) |
| › … at 375, the open nav menu keeps its keys … (10-REVIEW CR-01) | same title; the final Escape navigation is `/photos/regions/zermatt` |
| › Zoom › on the photo page, Escape leaves zoom first, then goes to /photos | › …, then goes to the photo's region page |
| › Hotspots › the strip legend shows its keys … | same title; the page legend reads 'Esc back to Zermatt' |
| photos-region › New photo pages › `/photos/<slug>`: … one back link to {r} ×7 | › … one back link 'Back to {r}' ×7 (the link name is now 'Back to {r}'; the bare name is the breadcrumb's crumb) |
| › Escape on /photos/<ortler 1> lands on the Ortler region page | same title; it finds the link by 'Back to Ortler' |
| › the lightbox from the Ortler region page … has no back link … | same title; it asserts no `/^Back to /` link in the dialog |
| seo › every page carries exactly its JSON-LD types | same title; photo pages expect ImageObject and BreadcrumbList |
| (new) photos-region › Photo page trail and one way back (18-17) | 11 trail-equals-BreadcrumbList rows; the crumb after a step; no trail or back link in the lightbox (@prod-only); one visible 'Back to …' at 375, 768 and 1440, and no chrome overflow at 768 x 900 |

**The v2.0 byte-identity guarantee (17 D-10) is retired on purpose by 18 D-09.** No HTML-identity harness remained in the tree (`git grep` over e2e/, scripts/guards/ and the Jest suites found none). The guarantee lived in three places, now rewritten: the page's "the four get no back prop" branch and its comment, photo-viewer.test's "v2.0 … All photographs … /photos" rows, and photos-lightbox's four-photo `All photographs` identity loop.

## Count gate (GUARD-03)

```
before (18-16): jest 2640 + e2e 773 = 3413
after  (18-17): jest 2687 + e2e 795 = 3482 (baseline 3024) OK
```

## TDD Gate Compliance (Task 2)

- **RED** `651d8a5`: 43 Jest failures across json-ld, strip and photo-viewer. photoBreadcrumb did not exist, the strip rendered no trail, and the source rule had no second block. The page-variant rows failed with them because `renderPage` now calls `photoBreadcrumb`. The "lightbox strip renders no breadcrumb" row passed in RED, since an unknown prop is ignored. It is a guard row, not new behaviour.
- **GREEN** `184ab9c`: all 363 tests in the five suites pass.
- **REFACTOR:** none needed.

## Verification

- **Jest:** the full suite passed (129 suites, 2687 tests). `npm run type-check` passed on all three configs, and `npm run lint` passed (exit 0; eslint plus every guard, including identity and test-count scan).
- **check-snapshot-commit --none** was OK (0 changed) on all three commits.
- **Production e2e, Chromium and Firefox:**
  - Task 1 set (photos-region, photos-lightbox): **354 passed**.
  - Task 2 set (plus seo): **422 passed**. 0 failed, 0 flaky.
- **Production e2e, local Windows WebKit (webkit-2388):** photos-region, photos-lightbox, photos-stepping and seo: **179 passed, 1 failed**. The failure is the pre-existing Hotspots D-22 row (deferred since 18-15, unchanged). Every new row passed in WebKit.
- **Acceptance greps:**
  - `grep -c "All photographs" components/photos/PhotoViewer.tsx` prints 0.
  - `grep -c backFor "app/(site)/photos/[slug]/page.tsx"` prints 0.
  - `grep -c "export function photoBreadcrumb" lib/regions.ts` prints 1.
  - `grep -cE "^import .*(regions|generated)"` prints 0 for both PhotoViewer.tsx and ExifStrip.tsx.

## UI (ui-ux-pro-max)

The skill was invoked before any markup, and two focused searches were run:
- **`breadcrumb navigation hierarchy --domain ux`** returned Breadcrumbs (Web: "use for sites with 3+ levels of depth"). The photo page is the third level (Photographs, region, photo), so the trail fits. The same search returned Heading Hierarchy: the nav sits before the h1 and adds no heading, so the order stays h1 first.
- **`back button predictable --domain ux`** returned Back Button (High: "preserve navigation history"). Escape uses `router.push` (a history entry), so browser Back after Escape returns to the photo. Steps keep their `replaceState`.
- **From the Quick Reference:**
  - **icon-context:** the ArrowLeftIcon beside the visible text is aria-hidden.
  - **touch-target-size:** the crumb links are min-h-11 (e2e asserts 44 px or more), as are the back links.
  - **truncation-strategy:** the trail is flex-wrap and nothing truncates, so a long title wraps (UI E10/long-text).
  - **horizontal-scroll:** asserted at 768 on the key-tier chrome with 'Back to Saalfelden', the longest label.

## Client JS (tracked per plan, decided at 18-25)

`rm -rf .next/static && npm run build` gives **1,871,174 B in 25 files**. That is **+1,081 B** against the running total of 1,870,093 B, and 15,333 B over the 1,855,841 B cap. A second build with the pre-plan PhotoViewer, ExifStrip and page measured exactly 1,870,093 B, so the delta is this plan's alone:

| Chunk | Before | After | Delta | What |
|---|---:|---:|---:|---|
| viewer (`25r66i_jrg76a.js` → `2l-o8qogglptz.js`) | 42,424 | 43,505 | +1,081 | Breadcrumb in the strip, the crumb swap, the RangeErrors, 'Back to' |

No other chunk changed. No new icon was imported (ArrowLeftIcon was already in the viewer). The strings are built on the server, and no region or generated-data module reached a client chunk. `public/service-worker.js` was restored after every build, and the three temporarily reverted files were restored with `git checkout --`.

## Visual baselines this plan changes (for 18-20's attribution)

No PNG was staged or committed, and `--update-snapshots` was never run.

- **photo/375, photo/768, photo/1440** (the film-scan photo page, one of the v2.0 four) change on purpose. The back link reads 'Back to Zermatt' (was 'All photographs'): in its own row at 375, in the chrome bar at 768 and 1440. The strip's identity column gains the 'Photographs / Zermatt / {title}' trail above the h1 (`mb-2`). At 768 and 1440 the hover-only legend may show 'Esc back to Zermatt' in place of 'Esc all photographs'. 18-15's counter change is also in these shots.
- **lightbox/\*** does not change: the dialog's strip renders no trail (level 2), its legend still reads 'Esc close', and the viewer shows no back link there.
- **Unchanged:** home, the light-table views (photos, grid, carousel), the 24 region shots, sources, the case studies, and the rest. Breadcrumb.tsx, RegionHeader and the region page were not touched.

## Decisions Made

See key-decisions. Two more:
- **The current crumb's text** is `current.title`, the same string as the h1. On the card the trail goes with the strip.
- **The trail items** are mapped in the page (`breadcrumbItems`), not in lib/regions.ts. The region header maps its own crumbs the same way.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] seo.spec's expected JSON-LD types were rewritten.**
- **Found during:** Task 2. The plan's verify runs seo.spec, but the file is not in files_modified.
- **Issue:** `expectedTypes` allowed only ImageObject on a photo page, so the new BreadcrumbList would fail "every page carries exactly its JSON-LD types".
- **Fix:** Photo pages now expect ImageObject and BreadcrumbList, and the doc line is updated.
- **Files modified:** e2e/seo.spec.ts
- **Commit:** 184ab9c

**2. [Rule 2 - Correctness] ExifStrip requires backName at level 1.**
- **Found during:** Task 1.
- **Issue:** Without the name, the page legend would have printed 'Esc back to undefined'.
- **Fix:** A RangeError, like PhotoViewer's rule for `back`. A strip.test row covers it.
- **Commit:** 5e8067f

**3. [Rule 3 - Tooling] Line endings.**
- **Found during:** Task 1.
- **Issue:** The first scripted edits wrote CRLF.
- **Fix:** They were normalised to LF before the commit, and prettier ran on each edited file. Later scripts preserved the file's newlines. Committed content is unaffected.

**4. [Scope] e2e/photos-lightbox.spec.ts and e2e/photos-region.spec.ts** were edited in both tasks, as the plan lists. regions.test.ts (Task 1) and seo.spec.ts (Task 2) are the only files outside the per-task lists.

**Total deviations:** 3 auto-fixed (1 blocking, 1 correctness, 1 tooling) and 1 scope note. **Impact:** none on the plan's intent.

## Deferred Issues

- None new. The Windows WebKit Hotspots D-22 row is unchanged (deferred-items.md, "From 18-17" note).

## Known Stubs

None.

## Threat Flags

None. **T-18-36** is mitigated: titles reach the BreadcrumbList through `jsonLdHtml`, and json-ld.test shows a `</script>` title staying inside one block. **T-18-37** is mitigated: photoBack reads the registry by photo id on the server, and an unknown id throws.

## Next Phase Readiness

- **18-19** sizes the stage. The strip's identity column is now taller on the page by the trail row (min-h-11 links plus mb-2).
- **18-20** re-baselines photo/\*: 18-15's counter and this plan's back link and trail. lightbox/\* changes only for 18-15.
- **18-25** decides the client JS (+1,081 B here).

## Self-Check: PASSED

- FOUND: lib/regions.ts (export function photoBack, export function photoBreadcrumb)
- FOUND: app/(site)/photos/[slug]/page.tsx (photoBreadcrumb, no backFor)
- FOUND: 5e8067f (ancestor of HEAD)
- FOUND: 651d8a5 (ancestor of HEAD)
- FOUND: 184ab9c (ancestor of HEAD)
