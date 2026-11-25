---
phase: 18-immersive-survey-layout
plan: 15
subsystem: photos
tags: [lightbox, photo-page, stepping, regions, lbox-09, photo-06, lbox-08, e2e, jest]
status: complete

requires:
  - phase: 18-14
    provides: "The lightbox shot opens from the Zermatt sequence; D-24 round 3 region baselines; the Windows WebKit Tab-row deferral this plan resolves"
  - phase: 18-08
    provides: "Region sequence figure links carrying data-photo-id, the LBOX-08 matrix's new triggers"
provides:
  - "regionViewerSet(photoId) in lib/regions.ts: the photo's region series in sequence order, built on the server; a RangeError naming the id for an unknown photo or a photo with no region"
  - "Both photo routes (page and intercepted lightbox) pass photos={regionViewerSet(view.id)}; viewerPhotos and lightTableSlugs are retired"
  - "Every test that assumed the old sets is rewritten with a mapped successor (PHOTO-06), including the 15-row LBOX-08 matrix, now on the region pages"
affects: [18-16, 18-17, 18-19, 18-20, 18-25, 18-26, 18-27, 18-29]

actuals:
  tokens: 19300    # chars/4 over the text diff e15a073..0412238 (77,213 chars)
  tasks: 2
  commits: 2       # git rev-list --count e15a073..0412238 = 2; the metadata commit follows
plan_head_before: e15a07311a0db81d7b8a58c1d6ddcb364df6946e
plan_head_after: 0412238abc757581b44c60af185cc7a1f528b824

tech-stack:
  added: []
  patterns:
    - "A client viewer's data set is built in the server route from the server-only module and crosses only as props (regionViewerSet → PhotoViewer)"
    - "A focus-return matrix keeps its assertion helpers and moves only its surface, opener and series when the triggering view retires"

key-files:
  created: []
  modified:
    - "lib/regions.ts (regionViewerSet)"
    - "lib/photos/view-model.ts (viewerPhotos and lightTableSlugs removed; photoViews and publishedViews docs point at regionViewerSet)"
    - "app/(site)/photos/[slug]/page.tsx (photos={regionViewerSet(view.id)}; doc block)"
    - "app/(site)/photos/@modal/(.)[slug]/page.tsx (photos={regionViewerSet(view.id)}; doc block)"
    - "components/photos/PhotoViewer.tsx (doc block only: the set is the region's series, counter 'n / N')"
    - "lib/__tests__/regions.test.ts (regionViewerSet rows)"
    - "lib/__tests__/photos-view-model.test.ts (viewerPhotos rows moved out; describe renamed)"
    - "components/photos/__tests__/photo-viewer.test.tsx (Zermatt's seven and an explicit one-photo set)"
    - "e2e/photos-region.spec.ts (new-photo-page rows step within the region; tracer row; swipe row; five @needs-tab-to-links tags)"
    - "e2e/photos-lightbox.spec.ts (series and V20; Next presses to the last photo; LBOX-08 matrix on the region pages)"
    - ".planning/phases/18-immersive-survey-layout/deferred-items.md (Tab rows resolved; two Windows WebKit items logged)"

key-decisions:
  - "18-15: Every viewer steps through its photo's region series (regionViewerSet, built in both server routes, props only); 17 D-08's per-photo set is retired with viewerPhotos and lightTableSlugs"
  - "18-15: The LBOX-08 matrix moved to the region pages (Map rows on Zermatt, Grid on Ortler, Carousel on Saalfelden). Every row kept its size, setup, close path and tags, and every off-screen precondition held, so no setup was swapped"
  - "18-15: The five 18-10 Tab rows now carry @needs-tab-to-links, because this plan is the next one to edit photos-region.spec (the 18-14 deferral)"

requirements-completed: []  # LBOX-09 and PHOTO-06 stay Pending: 18-16 adds the end card, and sibling plans through 18-29 carry PHOTO-06

coverage:
  - id: D1
    description: "On both surfaces the viewer steps only within the current photo's region, for all 11 photos"
    requirement: "LBOX-09"
    verification:
      - kind: unit
        ref: "lib/__tests__/regions.test.ts the viewer set: one region's series (18-15; LBOX-09, D-12)"
        status: pass
      - kind: e2e
        ref: "e2e/photos-region.spec.ts New photo pages rows, the Ortler lightbox row, the swipe row and the tracer row (chromium, firefox, webkit)"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts Moving between photos (counters n / 7, Next presses to the last photo)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every test the switch invalidated is rewritten with a mapped successor, none deleted; the LBOX-08 matrix runs on the region pages"
    requirement: "PHOTO-06"
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts Focus on close stays in view (LBOX-08), 15 rows"
        status: pass
      - kind: other
        ref: "count gate: jest 2613 -> 2621, e2e 768 -> 769; npm run guard:tests OK (3390 >= 3024)"
        status: pass
    human_judgment: false

metrics:
  duration: "about 25 min"
  completed: 2026-11-25
---

# Phase 18 Plan 15: Region-scoped stepping (LBOX-09, first half) Summary

**The lightbox and the photo page now step through the current photo's region series. regionViewerSet builds that series on the server, and it reaches PhotoViewer only as props. The v2.0 four step within Zermatt's seven (counter `n / 7`), and the Ortler and Saalfelden photos each step within their own two-photo series. Every test that assumed the old light-table or one-photo sets has a mapped successor, and the LBOX-08 focus-return matrix now runs on the region pages.**

## Performance

- **Duration:** about 25 min (2026-11-25, roughly 18:28 to 18:55 UTC)
- **Tasks:** 2 (a tracer and an auto task)
- **Files modified:** 11

## Accomplishments

- `regionViewerSet(photoId)` is `regionPhotoViews(regionOfPhoto(photoId))`. It throws `RangeError('regionViewerSet: photo <id> has no registry region')` for an unknown id or a photo with no region. Both routes import it, and `PhotoViewer.tsx` still imports no region or generated data (the grep guard prints 0).
- `viewerPhotos` and `lightTableSlugs` are gone from `lib/photos/view-model.ts`. No code line in `app`, `components` or `lib` names `viewerPhotos`. `photoViews`, `photoSlugs` and `lightTableIds` stay until 18-27.
- Next on a region's last photo stays `aria-disabled`, as the plan requires until 18-16 adds the end card. Only the lightbox spec's 'Next presses to the last photo' row asserts that far end.
- The tracer gate passed: the Ortler tracer row was re-run end-to-end in Chromium and Firefox before Task 2.

## Task Commits

1. **Task 1 (tracer): region stepping end-to-end.** `0d90046` feat(18-15): region-scoped stepping on both photo surfaces (LBOX-09, D-12)
2. **Task 2: rewrite the invalidated e2e rows and move the LBOX-08 matrix.** `0412238` test(18-15): rewrite the stepping e2e rows for region series; LBOX-08 matrix on the region pages (PHOTO-06)

## Test mapping (PHOTO-06: rewritten, never deleted)

### Jest

| Old test | New test |
|---|---|
| photos-view-model.test › the published set and the viewer set (17 D-07, D-08, PHOTO-05) › gives a light-table photo the four light-table views to step through | regions.test › the viewer set: one region's series (18-15; LBOX-09, D-12) › %s (a v2.0 photo) steps within Zermatt's seven, in sequence order (×4, one per SLUGS photo) |
| photos-view-model.test › … › gives every other published photo a one-photo set with no neighbours | regions.test › … › %s steps within its own region's series (×4, the Ortler and Saalfelden photos) and › puts every published photo in its own set exactly once, and the sets cover them all |
| (new) | regions.test › … › throws a RangeError naming an unknown photo id |
| photos-view-model.test › describe 'the published set and the viewer set (17 D-07, D-08, PHOTO-05)' (its three other rows) | describe 'the published set (17 D-07, PHOTO-05)', with the row titles unchanged |
| photo-viewer.test › the fixtures › a one-photo set off the light table and the four on it | › the fixtures › an explicit one-photo set off the v2.0 four, and Zermatt's seven |
| photo-viewer.test › D-08 › the page variant with the four keeps both step buttons and the counter 1 / 4 | › D-08 › the page variant with Zermatt's seven keeps both step buttons and the counter 1 / 7 |
| photo-viewer.test › D-09 › the four: both back links read All photographs and lead to /photos | › D-09 › a v2.0 photo in Zermatt's series: both back links read All photographs and lead to /photos |
| photo-viewer.test › Edge PHOTO-05/empty › the control: the same presses on the four (second photo shown) step twice ('Photo 2 of 4') | › the control: the same presses on Zermatt's seven (second photo shown) step twice ('Photo 2 of 7') |
| photo-viewer.test: the one-photo rows (page and modal variants, the back links, both Escape rows, and the arrows it.each) | Titles unchanged. The fixture is now an explicit `[{ ...newPhoto, prevSlug: null, nextSlug: null }]`, with `newPhoto` chosen without photoSlugs. 'without back, Escape goes to /photos' renders Zermatt's seven |

### E2E: photos-region.spec

| Old test | New test |
|---|---|
| New photo pages (D-08, D-09, PHOTO-05) › there are seven photos off the light table | New photo pages (D-09, PHOTO-05; LBOX-09) › every published photo is in exactly one region series and the series cover them all |
| › /photos/saalfelden-valley-from-the-air: no stepping, one back link to Saalfelden | › /photos/saalfelden-valley-from-the-air: steps within Saalfelden as photo 1 of 2, one back link to Saalfelden |
| › /photos/castle-below-limestone-peaks: no stepping, one back link to Saalfelden | › …: steps within Saalfelden as photo 2 of 2, one back link to Saalfelden |
| › /photos/meadow-stream-below-the-peaks: no stepping, one back link to Ortler | › …: steps within Ortler as photo 1 of 2, one back link to Ortler |
| › /photos/forested-valley-below-the-peaks: no stepping, one back link to Ortler | › …: steps within Ortler as photo 2 of 2, one back link to Ortler |
| › /photos/butterfly-on-a-thistle: no stepping, one back link to Zermatt | › …: steps within Zermatt as photo 5 of 7, one back link to Zermatt |
| › /photos/mirrored-snow-peaks: no stepping, one back link to Zermatt | › …: steps within Zermatt as photo 6 of 7, one back link to Zermatt |
| › /photos/matterhorn-wrapped-in-cloud: no stepping, one back link to Zermatt | › …: steps within Zermatt as photo 7 of 7, one back link to Zermatt |
| › Escape on /photos/meadow-stream-below-the-peaks lands on the Ortler region page | Title unchanged; only the describe was renamed |
| › the lightbox from the Ortler region page has no stepping and no back link; Back closes it @prod-only @no-win-webkit | › the lightbox from the Ortler region page steps within Ortler (1 / 2, then 2 / 2) and has no back link; Back closes it @prod-only @no-win-webkit |
| › Edge PHOTO-05/empty: a touch swipe and the arrows do nothing on a new photo page @chromium-only (light-table positive control) | › LBOX-09: a touch swipe and the arrows step within the region on a photo page @chromium-only (Ortler: swipe to 'Photo 2 of 2', ← back, no history entry; the control runs on regionPhotoViews('zermatt'): 'Photo 2 of 7') |
| (new, tracer) | Region stepping on the photo page (18-15; LBOX-09, D-12) › LBOX-09: the first Ortler photo page steps to its second photo |
| Region plate key and jumps › at 1440 clicking key row 3 … Tab reaches its photo; › at 1440 a badge click lands like a key row …; › a focus-visible key row marks its plate badge accent; › under reduced motion a key-row jump is instant …; Region plate jumps without JavaScript › a key row jump works with JavaScript off | The same titles with ' @needs-tab-to-links' appended, each with its comment (the 18-14 deferral). Assertions unchanged |

### E2E: photos-lightbox.spec

| Old test | New test |
|---|---|
| Moving between photos (LBOX-02) › three Next presses in the lightbox: URL, title, counter, focus and no history entry | › Next presses to the last photo: URL, title, counter, focus and no history entry (6 presses, each counter checked, '7 / 7', Next aria-disabled until 18-16, 'Photo 7 of 7: …') |
| › the arrow keys step, and nothing moves past either end | Title unchanged; counters are now `n / 7` |
| › a touch swipe on the photo steps to the next photo @chromium-only | Title unchanged; counter '2 / 7' |
| Photo page (LBOX-01 direct load): the four `/photos/<slug>` rows and 'the strip shows every field without filler' | Titles unchanged; they iterate `V20` (`Object.values(SLUGS).map(viewBySlug)`), and the film scan is looked up in V20 |
| Focus on close stays in view (LBOX-08) › Map at 720x450: step to the last photo, Escape, the trigger is fully in view @no-win-webkit | › Zermatt at 720x450: … Escape … @no-win-webkit (the cross-engine row) |
| › Map at 1366x650 … Escape … @chromium-only @no-win-webkit | › Zermatt at 1366x650 … (setup a) |
| › Map at 1280x560 … Escape … | › Zermatt at 1280x560 … (setup a) |
| › Map at 375x667 … Escape … | › Zermatt at 375x667 … (setup b) |
| › Grid at 1366x650 … Escape … | › Ortler at 1366x650 … (setup a) |
| › Grid at 1280x560 … Escape … | › Ortler at 1280x560 … (setup a) |
| › Grid at 720x450 … Escape … | › Ortler at 720x450 … (setup a) |
| › Grid at 375x667 … Escape … | › Ortler at 375x667 … (setup a) |
| › Carousel at 1366x650 … Escape … | › Saalfelden at 1366x650 … (setup b) |
| › Carousel at 1280x560 … Escape … | › Saalfelden at 1280x560 … (setup b) |
| › Carousel at 720x450 … Escape … | › Saalfelden at 720x450 … (setup b) |
| › Carousel at 375x667 … Escape … | › Saalfelden at 375x667 … (setup b) |
| › Map at 720x450 … Close photo … @chromium-only @no-win-webkit | › Zermatt at 720x450 … Close photo … |
| › Map at 720x450 … browser Back … @chromium-only @no-win-webkit | › Zermatt at 720x450 … browser Back … |
| › Map at 720x450 … browser Back … @no-win-webkit @not-chromium (14 IN-06) | › Zermatt at 720x450 … browser Back … @no-win-webkit @not-chromium (kept) |

`triggerState`, `expectTriggerFullyInView` and `expectTriggerOffscreen` are unchanged. `openFirst` and `stepToLast` take the surface's series, and after the close the URL is the region page. The grid openers in the other lightbox rows stay until 18-19, and the v2.0 four are `series[0..3]`, so their slugs did not change.

## Count gate (GUARD-03)

```
jest 2613 -> 2621, e2e 768 -> 769
test-count: jest 2621 + e2e 769 = 3390 (baseline 3024) OK
```

The `.test-count-18-15-*.tmp` files were deleted after the gate passed.

## Verification

- Jest: the three suites passed (106). The full suite passed (129 suites, 2621 tests). `npm run type-check`, `npm run lint` and `node scripts/ci/check-snapshot-commit.mjs --none` passed (0 changed, after both commits).
- Production e2e, Chromium and Firefox: photos-region, photos-lightbox, photos-carousel, photos-sweep, keyboard and photos: **479 passed**, 0 failed, 0 flaky. After the tag edit, photos-region was re-run alone in both engines: 217 passed.
- Production e2e, local Windows WebKit (webkit-2388), photos-region and photos-lightbox: 133 passed and 2 failed, both outside this plan (see Deferred Issues). Before the tags, the five Tab rows failed as 18-14 recorded. They are now tagged and skipped there.
- Every LBOX-08 row's off-screen precondition held on its region page at its size and setup. No setup was swapped.

## Client JS (tracked per plan, decided at 18-25)

`rm -rf .next/static && npm run build` followed by the byte sum of `.next/static/chunks/**/*.js` gives **1,864,179 B in 25 files**. The delta against the running total (1,864,179 B) is **0 B**. The total is still 8,338 B over the 1,855,841 B cap, all of it from earlier plans. The region set is built in the server routes, and no region or registry module reached a client chunk. `public/service-worker.js` was restored.

## Visual baselines this plan changes (for 18-20's attribution)

No PNG was staged or committed, and `--update-snapshots` was never run.

- **photo/\*** (`/photos/riffelsee-reflection`, all widths and both schemes): before this plan, the film scan was photo 4 of 4, with Next aria-disabled. It is now photo 4 of 7 in Zermatt's series, so the counter reads `4 / 7` and Next is enabled (the butterfly photo follows). Every width that shows the chrome's left group changes.
- **lightbox/\*** (Matterhorn from Zermatt, opened from the Zermatt sequence): the counter reads `1 / 7` where it read `1 / 4`. Previous is still disabled, and nothing else in the frame changes.
- **Expected unchanged:** home, photos, photos-grid, photos-carousel (the light-table views and their own carousel counter don't use the viewer set), every region shot (no viewer), and every other route. The v2.0 home and light-table shots don't depend on any file this plan touched.

## Decisions Made

- `regionViewerSet` checks the region against the built series (`VIEWS.has`) as well as `regionOfPhoto`, so its RangeError names the photo id rather than surfacing regionPhotoViews' region error.
- The photo-viewer Jest suite imports `regionPhotoViews` from `lib/regions` directly. A jsdom test is not a `'use client'` module, so the client-graph guard doesn't apply, and the component still gets the set only as a prop.
- The v2.0 identity rows in the lightbox spec iterate `V20`, in SLUGS order. That is the order they had in the light table, so their test titles did not change.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking, local engine] The five 18-10 Tab rows are tagged `@needs-tab-to-links`.**
- **Found during:** Task 2, local WebKit run.
- **Issue:** On Windows WebKit, five photos-region rows fail at `toBeFocused()` after a Tab onto a link. deferred-items.md (18-14) gave the fix to "the next plan that edits the spec", which is this plan.
- **Fix:** Each row now has the tag and the standard comment. Assertions are unchanged, Chromium, Firefox and CI's Linux WebKit still run all five, and the test count is unchanged. The deferred item is marked resolved.
- **Files modified:** e2e/photos-region.spec.ts, deferred-items.md
- **Commit:** 0412238

**2. [Scope hygiene] Formatter-only hunks were reverted.**
- `prettier --write` reflowed pre-existing code: the `HotspotKey` prop in PhotoViewer.tsx and six one-line `@no-win-webkit` test headers in the lightbox spec. Those hunks were put back so that the diff carries only this plan's changes. Prettier isn't part of `npm run lint`.

Otherwise the plan was executed as written.

## Deferred Issues

Both are logged in deferred-items.md under "From 18-15". Both are local Windows WebKit failures and neither involves region stepping.

- **The lightbox Hotspots D-22 row** ('from zoomed with a callout open, one Escape leaves zoom …') fails on every try on Windows WebKit. The page closes on the second Escape (history traversal), which is the WinCairo crash the `@no-win-webkit` rows document. **It is pre-existing:** with the pre-18-15 routes and view-model restored temporarily, it failed 2 of 2 tries. It needs an `@no-win-webkit` tag, and that is Tim's call.
- **The region soft-navigation row** ('a soft navigation from /photos renders the region page, never the lightbox') failed `toHaveURL` in 1 of 5 local WebKit runs. It is a router push from /photos with no lightbox, so it is a local flake to watch in CI.
- The known Firefox `/offline` audit-spec flake was not hit: the audit spec isn't in this plan's verify set.

## Known Stubs

None.

## Threat Flags

None. T-18-34 holds because the stepping targets are indices into the server-built series. T-18-62 holds because PhotoViewer imports no data module (grep guard 0) and the client JS delta is 0 B.

## Next Phase Readiness

- 18-16 adds the end-of-series card. It needs to rewrite exactly one assertion, the far end of the lightbox spec's 'Next presses to the last photo' row (`Next aria-disabled`), and possibly the k = N branch of the photos-region per-photo rows, which asserts Next aria-disabled on photo N.
- 18-17 rewrites the back-link assertions in the photos-region per-photo rows, which this plan left unchanged.
- 18-19 moves the remaining grid openers in the lightbox spec.
- 18-20 re-baselines photo/\* and lightbox/\* (see above).

## Self-Check: PASSED

- FOUND: lib/regions.ts (export function regionViewerSet)
- FOUND: e2e/photos-lightbox.spec.ts (contains 'regions/')
- FOUND: 0d90046 (ancestor of HEAD)
- FOUND: 0412238 (ancestor of HEAD)
