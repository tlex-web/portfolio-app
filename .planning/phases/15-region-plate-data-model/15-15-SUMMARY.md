---
phase: 15-region-plate-data-model
plan: 15
subsystem: testing
tags: [fixtures, jest, playwright, photos, guard-03, groundwork]
status: complete

requires:
  - phase: 15-14
    provides: the previous plan tip (f0c4dfe); the photos-lightbox spec edits (LBOX-08 Firefox Back row) left intact here
  - phase: 15-11
    provides: buildPhotoViews / photoViews default to the Zermatt series, so photoBySlug resolves the four current slugs
provides:
  - "e2e/helpers/photo-fixtures.ts: SLUGS (four camel-case names) and viewBySlug(slug), which wraps photoBySlug and throws 'unknown photo slug <slug>'"
  - "13 identity lookups across 8 test files now select their photo by slug"
  - "70 positional lookups kept; each of the 6 files that keeps one carries a 'positions in the series' comment"
affects: [phase-16-photo-additions, 15-16]

actuals:
  tokens: 5500
  tasks: 3
  commits: 3
plan_head_before: f0c4dfec940b2122d9480ea736fbe82e99352ef0
plan_head_after: b0e07942a66789caa038b7910351cefd1d7fb792

tech-stack:
  added: []
  patterns:
    - "Named photo fixture: a test that audits one photo's own facts reads viewBySlug(SLUGS.<name>); a test about a series position keeps its index and the file says so"
    - "Jest tests import e2e/helpers relatively (as audit-routes.test.ts imports e2e/routes)"

key-files:
  created:
    - e2e/helpers/photo-fixtures.ts
  modified:
    - lib/__tests__/photos-view-model.test.ts
    - lib/og/__tests__/template.test.tsx
    - lib/__tests__/saved-pages.test.ts
    - components/site/__tests__/SavedPages.test.tsx
    - components/photos/__tests__/map.test.tsx
    - e2e/photos.spec.ts
    - e2e/keyboard.spec.ts
    - e2e/offline.spec.ts
    - e2e/photos-sweep.spec.ts
    - e2e/photos-carousel.spec.ts
    - e2e/photos-lightbox.spec.ts

key-decisions:
  - "Every identity lookup pointed at matterhorn-from-zermatt or gornerschlucht-waterfall or riffelsee-reflection today, and each was converted to exactly that slug, so every converted test audits the same photo as before"
  - "photos-view-model's raw-record lookups (photos[0].exif, photos[3].position) read data/generated/photos, not views; a local photoOf(slug) resolves the record through viewBySlug(slug).id so they too are selected by slug"
  - "A lookup that follows a positional action (open the first tile, the first map target, Next once) stays positional even when it then reads the photo's title or slug: the position decides which photo is expected"
  - "keyboard.spec's PHOTO_PATH === /photos/${views[0].slug} precondition is positional: it ties the first map target the walk opens to the shared route list's photo page"
  - "One production build served both e2e runs (PW_PROD=1 PW_REUSE=1 against one next start), equivalent to the plan's self-building command"

patterns-established:
  - "Identity vs position: identity lookups use viewBySlug; positional lookups stay indexed under a one-line file comment"

requirements-completed: [DATA-10]

coverage:
  - id: D1
    description: "viewBySlug and SLUGS exist, resolve all four current slugs, and throw on an unknown slug"
    requirement: DATA-10
    verification:
      - kind: unit
        ref: "temporary Jest probe (lib/__tests__/tmp1515, removed): viewBySlug('no-such') throws 'unknown photo slug no-such'; Object.values(SLUGS) resolve to photoSlugs in order"
        status: pass
      - kind: command
        ref: "npm run type-check (app, Jest and e2e configs)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The five Jest files audit their specific photos by slug with unchanged test counts"
    requirement: DATA-10
    verification:
      - kind: unit
        ref: "npx jest lib/__tests__/photos-view-model.test.ts lib/og/__tests__/template.test.tsx lib/__tests__/saved-pages.test.ts components/site/__tests__/SavedPages.test.tsx components/photos/__tests__/map.test.tsx (72/72 before and after)"
        status: pass
      - kind: unit
        ref: "npx jest (113 suites, 1912 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "photos, keyboard, offline and sweep specs converted and passing in Chromium against a production build"
    requirement: DATA-10
    verification:
      - kind: e2e
        ref: "PW_PROD=1 PW_REUSE=1 npx playwright test e2e/photos.spec.ts e2e/keyboard.spec.ts e2e/offline.spec.ts e2e/photos-sweep.spec.ts --project=chromium (69 passed; --list total 69 before and after)"
        status: pass
    human_judgment: false
  - id: D4
    description: "carousel and lightbox specs converted and passing in Chromium and Firefox; LBOX-08 matrix untouched"
    requirement: DATA-10
    verification:
      - kind: e2e
        ref: "PW_PROD=1 PW_REUSE=1 npx playwright test e2e/photos-carousel.spec.ts e2e/photos-lightbox.spec.ts --project=chromium --project=firefox (140 passed; --list total 140 before and after)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Classification of all 83 lookups (identity vs position) is sound"
    requirement: DATA-10
    verification: []
    human_judgment: true
    rationale: "The identity/position call per lookup is a judgment; the table below records each one for review"

duration: 9 min
completed: 2026-11-14
---

# Phase 15 Plan 15: Named photo fixtures instead of index lookups Summary

**`viewBySlug(SLUGS.<name>)` in `e2e/helpers/photo-fixtures.ts` now selects every photo a test audits by identity (13 lookups in 8 files). The 70 lookups that mean a position in the series keep their index, and each of the 6 files that keeps one says so in a one-line comment.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-11-14T22:48:10Z
- **Completed:** 2026-11-14T22:57:21Z
- **Tasks:** 3 (1 tracer, 2 auto)
- **Files modified:** 12 (1 created, 11 modified)

## Accomplishments

- `e2e/helpers/photo-fixtures.ts`: `SLUGS` (`matterhornFromZermatt`, `gornerschluchtWaterfall`, `matterhornGlacierTrail`, `riffelseeReflection`) and `viewBySlug(slug)`, which wraps `photoBySlug` and throws `unknown photo slug <slug>`. Both the Jest and the e2e tsconfig type-check it.
- Jest: the metadata, EXIF-omission, approximate-position, OG place-omission, saved-pages (mapper and island) and map-style tests audit their photo by slug.
- e2e: the offline seed, the sweep's direct-load step, and the lightbox's viewer-tier and stage-state blocks audit their photo by slug.
- Each of the 6 files that keeps positional lookups (`photos-view-model.test.ts`, `photos.spec`, `keyboard.spec`, `photos-sweep.spec`, `photos-carousel.spec`, `photos-lightbox.spec`) has one comment: index lookups are positions in the series order (DEM ascending, ties by id), not photo identities.

## Task Commits

1. **Task 1 (tracer): viewBySlug end to end through the five Jest files** - `445d187` (test)
2. **Task 2: photos, keyboard, offline and sweep specs** - `4280888` (test)
3. **Task 3: carousel and lightbox specs, two engines** - `b0e0794` (test)

## Test totals (GUARD-03: none deleted, merged or skipped)

| Scope | Before | After |
|-------|--------|-------|
| photos-view-model.test.ts | 22 | 22 |
| template.test.tsx | 24 | 24 |
| saved-pages.test.ts | 10 | 10 |
| SavedPages.test.tsx | 6 | 6 |
| map.test.tsx | 10 | 10 |
| photos + keyboard + offline + sweep (chromium `--list`) | 69 | 69 |
| carousel + lightbox (chromium + firefox `--list`) | 140 | 140 |
| Full Jest | 113 suites / 1912 | 113 suites / 1912 |

## Lookup classification (83)

The plan took its count at 6d13db4. I re-counted at HEAD f0c4dfe and got the same 83 lookups with the same per-file distribution. Line numbers are at f0c4dfe, before this plan.

| # | File:line | Lookup | Class | Slug chosen / reason |
|---|-----------|--------|-------|----------------------|
| 1 | lib/__tests__/photos-view-model.test.ts:70 | `photoViews[0].prevSlug` null | position | first of the series has no prev |
| 2 | lib/__tests__/photos-view-model.test.ts:131 | `photoViews[1]` metadata | identity | gornerschluchtWaterfall |
| 3 | lib/__tests__/photos-view-model.test.ts:219 | `photos[0].exif` (raw record) | identity | matterhornFromZermatt (via photoOf) |
| 4 | lib/__tests__/photos-view-model.test.ts:237 | `photos[3].position` (raw record) | identity | riffelseeReflection (via photoOf) |
| 5 | lib/og/__tests__/template.test.tsx:218 | `photoViews[0]` place-omission card | identity | matterhornFromZermatt |
| 6 | lib/og/__tests__/template.test.tsx:222 | `photoViews[0]` card length | identity | matterhornFromZermatt |
| 7 | lib/__tests__/saved-pages.test.ts:14 | `firstPhoto` seeded page | identity | matterhornFromZermatt (renamed seededPhoto) |
| 8 | components/site/__tests__/SavedPages.test.tsx:15 | `firstPhoto` seeded page | identity | matterhornFromZermatt (renamed seededPhoto) |
| 9 | components/photos/__tests__/map.test.tsx:99 | mark rule in the style element | identity | matterhornFromZermatt |
| 10 | e2e/photos.spec.ts:83 | after `openFromMap(page, 1)` URL | position | the plate at index 1 |
| 11 | e2e/photos.spec.ts:84 | same, dialog title | position | the plate at index 1 |
| 12 | e2e/photos.spec.ts:395 | `first` of the first-tile click | position | first tile |
| 13 | e2e/photos.spec.ts:528 | first tile, URL | position | first tile |
| 14 | e2e/keyboard.spec.ts:246 | PHOTO_PATH is the first photo | position | the first map target the walk opens |
| 15 | e2e/keyboard.spec.ts:270 | dialog name after opening the first target | position | first target |
| 16 | e2e/keyboard.spec.ts:295 | ArrowRight URL | position | one step |
| 17 | e2e/keyboard.spec.ts:296 | ArrowRight title | position | one step |
| 18 | e2e/keyboard.spec.ts:298 | ArrowLeft URL | position | back to first |
| 19 | e2e/keyboard.spec.ts:299 | ArrowLeft title | position | back to first |
| 20 | e2e/offline.spec.ts:17 | `firstPhoto` seeded cache key | identity | matterhornFromZermatt (renamed seededPhoto) |
| 21 | e2e/photos-sweep.spec.ts:237 | `openTile(page, 0)` URL | position | first tile |
| 22 | e2e/photos-sweep.spec.ts:258 | carousel open, dialog name | position | first slide |
| 23 | e2e/photos-sweep.spec.ts:262 | Next, URL | position | one step |
| 24 | e2e/photos-sweep.spec.ts:264 | Next, URL | position | two steps |
| 25 | e2e/photos-sweep.spec.ts:270 | focus returns to the photo shown | position | two steps |
| 26 | e2e/photos-sweep.spec.ts:300 | direct load `/photos/<slug>` | identity | matterhornFromZermatt (`direct`) |
| 27 | e2e/photos-sweep.spec.ts:305 | its h1 | identity | matterhornFromZermatt (`direct`) |
| 28 | e2e/photos-sweep.spec.ts:312 | `openTile(page, 0)` URL | position | first tile |
| 29 | e2e/photos-sweep.spec.ts:313 | same, dialog name | position | first tile |
| 30-59 | e2e/photos-carousel.spec.ts:90, 97, 98, 99, 102, 112, 114, 116, 117, 120, 126, 159, 176, 177, 182, 193, 197, 201, 203, 216, 229, 231, 275, 278, 280, 283, 328, 335, 340, 367 (30) | first slide on load; the slide after one or two steps; front photo after a lightbox step or Back | position | the subject is the carousel sequence |
| 60 | e2e/photos-lightbox.spec.ts:99 | `first` for the viewer layout tiers (direct load, aspect) | identity | matterhornFromZermatt (`subject`) |
| 61 | e2e/photos-lightbox.spec.ts:213 | `first` for the stage states (direct load, aspect, rights) | identity | matterhornFromZermatt (`subject`) |
| 62 | e2e/photos-lightbox.spec.ts:355 | `first` opened by openFirstTile | position | first tile |
| 63 | e2e/photos-lightbox.spec.ts:400 | `first` in Focus and Escape (first tile; the page steps to views[1] and back) | position | the first in the series |
| 64 | e2e/photos-lightbox.spec.ts:489 | the third tile's id | position | tile 2 |
| 65 | e2e/photos-lightbox.spec.ts:528 | ArrowRight URL | position | one step |
| 66 | e2e/photos-lightbox.spec.ts:572 | Next URL | position | one step |
| 67 | e2e/photos-lightbox.spec.ts:573 | Next h1 | position | one step |
| 68 | e2e/photos-lightbox.spec.ts:589 | `first` for Moving between photos | position | series start |
| 69 | e2e/photos-lightbox.spec.ts:630 | arrow step URL | position | one step |
| 70 | e2e/photos-lightbox.spec.ts:651 | `nextView` preload | position | the photo after the first |
| 71 | e2e/photos-lightbox.spec.ts:672 | still on the first photo | position | first |
| 72 | e2e/photos-lightbox.spec.ts:691 | swipe URL | position | one step |
| 73 | e2e/photos-lightbox.spec.ts:703 | two steps URL | position | two steps |
| 74 | e2e/photos-lightbox.spec.ts:710 | focus on the shown tile | position | two steps |
| 75 | e2e/photos-lightbox.spec.ts:732 | Back after a step, focus | position | one step |
| 76 | e2e/photos-lightbox.spec.ts:746 | page Next URL | position | one step |
| 77 | e2e/photos-lightbox.spec.ts:747 | page Next h1 | position | one step |
| 78 | e2e/photos-lightbox.spec.ts:750 | page Next title | position | one step |
| 79 | e2e/photos-lightbox.spec.ts:755 | after reload | position | one step |
| 80 | e2e/photos-lightbox.spec.ts:777 | `first` in LBOX-08 (matrix, untouched) | position | first trigger; the rows step to the last photo |
| 81 | e2e/photos-lightbox.spec.ts:962 | `first` in Morph and motion | position | first tile |
| 82 | e2e/photos-lightbox.spec.ts:1010 | step URL | position | one step |
| 83 | e2e/photos-lightbox.spec.ts:1013 | step title | position | one step |

**Totals:** 13 identity + 70 position = 83.

| File | Identity | Position |
|------|----------|----------|
| photos-view-model.test.ts | 3 | 1 |
| template.test.tsx | 2 | 0 |
| saved-pages.test.ts | 1 | 0 |
| SavedPages.test.tsx | 1 | 0 |
| map.test.tsx | 1 | 0 |
| photos.spec.ts | 0 | 4 |
| keyboard.spec.ts | 0 | 6 |
| offline.spec.ts | 1 | 0 |
| photos-sweep.spec.ts | 2 | 7 |
| photos-carousel.spec.ts | 0 | 30 |
| photos-lightbox.spec.ts | 2 | 22 |
| **Total** | **13** | **70** |

After the plan, the plan's grep finds 70 lookups (the positional ones), and `viewBySlug(` appears 11 times across tests and specs.

## Decisions Made

See `key-decisions` in the frontmatter. In short:
- Each converted lookup kept the photo it pointed at.
- Raw-record lookups resolve through `viewBySlug(slug).id`.
- When a positional action decides which photo is expected, the lookup stays positional.
- One production build served both e2e runs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Raw photo-record lookups have no view field to read**
- **Found during:** Task 1
- **Issue:** `photos[0].exif` and `photos[3].position` in `photos-view-model.test.ts` index `data/generated/photos`, not the views. `PhotoView` carries neither `exif` nor the raw `position` with `radiusM`, so `viewBySlug(...)` alone could not stand in for them.
- **Fix:** I added a local `photoOf(slug)` that finds the record by `viewBySlug(slug).id` and throws if it is missing. The lookups are still selected by slug and still read the same records (img-0605, r004-011).
- **Files modified:** lib/__tests__/photos-view-model.test.ts
- **Commit:** 445d187

**2. [Process] One production build for both e2e runs**
- **Found during:** Task 2
- **Issue:** The plan's verify commands (`PW_PROD=1 npx playwright test ...`) each run `npm run build && npm run start`.
- **Fix:** I ran one `npm run build`, restored `public/service-worker.js`, started `next start` once, and ran both verify commands with `PW_PROD=1 PW_REUSE=1`. Both runs used the same production build, and the build does not depend on the test sources. I stopped the server afterwards and port 3000 is free.
- **Commit:** n/a

The doc comments in `saved-pages.test.ts` and `offline.spec.ts` said "never a literal slug". I rewrote them to say the seeded photo is named through viewBySlug, so they match the code.

**Total deviations:** 1 auto-fixed (Rule 3) and 1 process note. **Impact:** none on assertions. Every converted test audits the same photo and the same facts.

## Issues Encountered

- `npx prettier --check` flags some touched files, but only for lines that were already like that at HEAD (long `test(...)` titles, and CRLF in the working copy against Prettier's LF). No line this plan added breaks the style. I did not run a whole-file format, to avoid churn (as in 15-14).
- The background `next start` task reported exit 1. That was the expected result of killing it by port after the runs.

## Known Stubs

None.

## Next Phase Readiness

The groundwork is in place: when Phase 16 adds photos, the tests that audit a specific photo will still audit it. Positional tests will follow the new series order, which is what they mean. Ready for 15-16.

## Self-Check: PASSED

- FOUND: e2e/helpers/photo-fixtures.ts (1 `export function viewBySlug`)
- FOUND: 445d187, 4280888, b0e0794 (ancestors of HEAD)
- `git grep -l "positions in the series"` finds both photos-carousel.spec.ts and photos-lightbox.spec.ts
- `npm run type-check` 0, `npm run lint` 0 (test-count scan OK), `git diff --quiet HEAD -- public/service-worker.js` 0
