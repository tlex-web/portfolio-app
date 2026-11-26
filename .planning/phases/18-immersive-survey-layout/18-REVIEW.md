---
phase: 18-immersive-survey-layout
reviewed: 2026-11-26T19:59:43Z
depth: standard
files_reviewed: 123
files_reviewed_list:
  - ".gitattributes"
  - ".github/copilot-instructions.md"
  - "app/(site)/offline/page.tsx"
  - "app/(site)/photos/@modal/(.)[slug]/page.tsx"
  - "app/(site)/photos/[slug]/page.tsx"
  - "app/(site)/photos/page.tsx"
  - "app/(site)/photos/regions/[region]/page.tsx"
  - "app/(site)/sources/page.tsx"
  - "app/globals.css"
  - "app/sitemap.ts"
  - "components/contact/CopyEmailButton.tsx"
  - "components/icons/__tests__/inline-phosphor.test.tsx"
  - "components/icons/inline-phosphor.tsx"
  - "components/photos/Breadcrumb.tsx"
  - "components/photos/EndCard.tsx"
  - "components/photos/ExifStrip.tsx"
  - "components/photos/LightboxDialog.tsx"
  - "components/photos/PhotoViewer.tsx"
  - "components/photos/ShareButton.tsx"
  - "components/photos/StagePhoto.tsx"
  - "components/photos/__tests__/hotspots.test.tsx"
  - "components/photos/__tests__/lightbox-dialog.test.tsx"
  - "components/photos/__tests__/overview.test.tsx"
  - "components/photos/__tests__/photo-viewer.test.tsx"
  - "components/photos/__tests__/plate-sheet.test.tsx"
  - "components/photos/__tests__/sequence-figure.test.tsx"
  - "components/photos/__tests__/share-button.test.tsx"
  - "components/photos/__tests__/strip.test.tsx"
  - "components/photos/overview/OverviewHeader.tsx"
  - "components/photos/overview/OverviewSheet.tsx"
  - "components/photos/overview/RegionList.tsx"
  - "components/photos/overview/__tests__/overview-sheet.test.tsx"
  - "components/photos/overview/__tests__/overview.test.tsx"
  - "components/photos/region/FactsLine.tsx"
  - "components/photos/region/FigureTransition.tsx"
  - "components/photos/region/HeaderSlot.tsx"
  - "components/photos/region/NextRegion.tsx"
  - "components/photos/region/PlateKey.tsx"
  - "components/photos/region/PlateSheet.tsx"
  - "components/photos/region/RegionHeader.tsx"
  - "components/photos/region/RegionRail.tsx"
  - "components/photos/region/RegionSequence.tsx"
  - "components/photos/region/SequenceFigure.tsx"
  - "components/photos/region/__tests__/NextRegion.test.tsx"
  - "components/photos/region/__tests__/SequenceFigure.test.tsx"
  - "components/projects/DemoTerminal.tsx"
  - "components/projects/EndBlock.tsx"
  - "components/site/SiteNav.tsx"
  - "components/site/TrailSign.tsx"
  - "components/site/__tests__/SavedPages.test.tsx"
  - "components/site/__tests__/SiteFooter.test.tsx"
  - "components/site/__tests__/TrailSign.test.tsx"
  - "components/terrain/SheetLegend.tsx"
  - "components/terrain/SheetMargin.tsx"
  - "data/__tests__/editorial.test.ts"
  - "data/__tests__/plates.test.ts"
  - "data/__tests__/sources.test.ts"
  - "data/generated/plates.ts"
  - "data/schemas/terrain.ts"
  - "data/sheet.ts"
  - "data/site.ts"
  - "data/source-credits.ts"
  - "data/sources.ts"
  - "data/types.ts"
  - "e2e/audit.spec.ts"
  - "e2e/design-system.spec.ts"
  - "e2e/home-modes.spec.ts"
  - "e2e/keyboard.spec.ts"
  - "e2e/no-webgl.spec.ts"
  - "e2e/not-found.spec.ts"
  - "e2e/og.spec.ts"
  - "e2e/perf/photo-baseline.spec.ts"
  - "e2e/photos-lightbox.spec.ts"
  - "e2e/photos-region.spec.ts"
  - "e2e/photos-stepping.spec.ts"
  - "e2e/photos-sweep.spec.ts"
  - "e2e/photos.spec.ts"
  - "e2e/routes.ts"
  - "e2e/seo.spec.ts"
  - "e2e/service-worker.spec.ts"
  - "e2e/shell.spec.ts"
  - "e2e/sources.spec.ts"
  - "e2e/visual/README.md"
  - "e2e/visual/routes.spec.ts"
  - "lib/__tests__/client-graph.test.ts"
  - "lib/__tests__/image-sizes.test.ts"
  - "lib/__tests__/json-ld.test.ts"
  - "lib/__tests__/lv95-line.test.ts"
  - "lib/__tests__/overview-layout.test.ts"
  - "lib/__tests__/photo-routes.test.ts"
  - "lib/__tests__/photos-hotspots.test.ts"
  - "lib/__tests__/photos-label-layout.test.ts"
  - "lib/__tests__/photos-stepping.test.ts"
  - "lib/__tests__/photos-view-model.test.ts"
  - "lib/__tests__/plate-layout.test.ts"
  - "lib/__tests__/proxy.test.ts"
  - "lib/__tests__/region-rail.test.ts"
  - "lib/__tests__/region-series.test.ts"
  - "lib/__tests__/regions.test.ts"
  - "lib/__tests__/saved-pages.test.ts"
  - "lib/__tests__/sheet-margin.test.ts"
  - "lib/copy-feedback.ts"
  - "lib/json-ld/content.ts"
  - "lib/og/__tests__/template.test.tsx"
  - "lib/photos/image-sizes.ts"
  - "lib/photos/label-layout.ts"
  - "lib/photos/lv95-line.ts"
  - "lib/photos/overview-layout.ts"
  - "lib/photos/plate-layout.ts"
  - "lib/photos/region-ids.ts"
  - "lib/photos/region-rail.ts"
  - "lib/photos/routes.ts"
  - "lib/photos/share-mode.ts"
  - "lib/photos/stepping.ts"
  - "lib/photos/view-model.ts"
  - "lib/regions.ts"
  - "lib/saved-pages.ts"
  - "lib/sheet-margin.ts"
  - "package.json"
  - "proxy.ts"
  - "scripts/guards/test-count.baseline.json"
  - "scripts/guards/version-floors.json"
  - "scripts/terrain/build-terrain.mjs"
findings:
  critical: 0
  warning: 3
  info: 6
  total: 9
  necessity: 2
status: issues_found
---

# Phase 18: Code Review Report

**Reviewed:** 2026-11-26T19:59:43Z
**Depth:** standard
**Files Reviewed:** 123 (66 source, 57 test/spec)
**Status:** issues_found

## Summary

I read all 66 source files in full or through their `git diff a0da7ca..HEAD`. That covers the overview and region pages, the photo viewer with its end card, Share, the LV95 line, the `/sources` page and sheet margins, the overview and plate layout solvers with their CSS emitters, the `?view=` 308 in `proxy.ts`, and the region model in `lib/regions.ts`. For the 57 test and spec files I checked for `.only`, `.skip` and `.fixme`, for tests that cannot fail, for assertions weakened against earlier versions, and for fixed `waitForTimeout` waits.

I traced these areas and found them sound:

- **Stepping:** `stepWithEnd`, and in PhotoViewer the `onCard` state, `onCardRef` and the focus move after a swap.
- **Lightbox navigation:** leaving the lightbox through the end card ("next region" and "All regions"). The `@modal/page.tsx` and `@modal/regions/[region]` null slots leave no dialog behind, and `restoreFocus` falls back to the main `h1`.
- **Retired viewer set:** `photoBySlug` now returns the published view, and no consumer reads its cross-region `k`, `n`, `prevSlug` or `nextSlug`.
- **CSS emitters:** escaping, the `num()` trailing-zero strip, and the de-duplication of cumulative `min-width` container rules.
- **Proxy redirect:** the 308 target is built only from the constant region.
- **Sheet margins:** the extent branches per CRS.
- **Client-graph boundaries:** the server-only data stays out of client chunks.
- **Removed code:** nothing still references drei, `sheetPlace`, `site.attribution`, `LIGHTBOX_CLOSE_EVENT` or `photos-view`.

I found no critical issues. There are three warnings:

- **WR-01:** a state race in ShareButton when its `url` changes, which happens on every viewer step.
- **WR-02:** the test-count ratchet was not raised at phase close, so the guard would not catch about 600 deleted tests.
- **WR-03:** a necessity finding. A null-uv branch in `platePins` that the types rule out, and that would break the key list's numbering if it ever ran.

The six Info items are stale comments and docs, a misplaced JSDoc, a helper name that shadows a shared one, one hard-coded date, the leftover `fflate@^0.6.0` override, and two fixed waits in an e2e spec.

## Warnings

### WR-01: ShareButton's url-change reset keeps the previous URL's timer and pending copy

**File:** `components/photos/ShareButton.tsx:120-126` (reset), `148-168` (`copy`), `185-194` (share settle)
**Issue:** In the viewer, `url` changes on every step (`PhotoViewer.tsx:597`). The component deliberately stays mounted so focus survives. The reset during render clears `copied`, `failure` and `announcement`, but it leaves two things bound to the old URL:
1. **The timer.** `timer.current` keeps running. Say the visitor copies photo A, steps to B within 2 s and presses Copy on B, and that write fails. The failure path (`catch`, lines 152-157) does not clear the timer, so A's timer fires and empties the `FAILED_STATUS` announcement before or while assistive technology reads it.
2. **The pending write.** A `navigator.clipboard.writeText(url)` started for A that settles after the step still runs `setCopied(true)` and announces 'Link copied' next to photo B. That claims B's link was copied when A's was. The same applies to a share rejection that falls through to `copy()`, which writes whatever `url` the closure captured.

**Fix:** Tie each operation to a generation and clear the timer on reset:
```tsx
const generation = useRef(0);
if (shownUrl !== url) {
  setShownUrl(url);
  setCopied(false);
  setFailure(0);
  setAnnouncement('');
}
useEffect(() => {
  // a new url: drop the old window and invalidate in-flight work
  generation.current += 1;
  if (timer.current !== null) clearTimeout(timer.current);
  timer.current = null;
}, [url]);

async function copy() {
  const gen = generation.current;
  try { /* … writeText(url) … */ } catch {
    if (!mounted.current || gen !== generation.current) return;
    if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; }
    /* failure state */
    return;
  }
  if (!mounted.current || gen !== generation.current) return;
  /* copied state */
}
```
Apply the same `gen` check in the share rejection handler before it calls `copy()`. Add a Jest row: a deferred `writeText`, then a rerender with a new `url`, then resolve, and assert that no 'Link copied' appears.

### WR-02: The test-count ratchet was not raised at phase close

**File:** `scripts/guards/test-count.baseline.json:2-6`
**Issue:** The baseline still holds the Phase 18 start counts (jest 2385, e2e 639, total 3024, commit a0f86f8, from 18-01). The phase closes at jest 2802 and e2e 851, total 3653: the 18-29 summary records `test-count: … = 3653 (baseline 3024), OK`. `scripts/guards/test-count.mjs` fails only when the total drops below the baseline. So roughly 629 tests written in this phase can be deleted, or lost in a bad merge, without GUARD-03 noticing. Phases 12 and 12-follow-up raised the ratchet at close (5d2aaf2, 53171db), and Phase 18 did not. Its large test rewrites (photos.spec, photos-lightbox.spec, photos-region.spec, label-layout) are exactly where a silent loss could happen.
**Fix:** From a green CI artifact of the phase tip, run `node scripts/guards/test-count.mjs --jest jest-results.json --list playwright-list.json --update` and commit the new baseline (about 2802/851/3653 and the tip commit), for example as `chore(18): raise the test-count ratchet after Phase 18 (GUARD-03)`.

### WR-03: Impossible-state guard, a null-uv pin skip in `platePins`

**File:** `lib/photos/plate-layout.ts:119-123, 140-153`; consumers `components/photos/region/PlateKey.tsx:251-262`, `lib/regions.ts:316,336`
**Category:** necessity
**Issue:**
- **The state cannot occur.** `PlatePinSource.uv` is typed `{ u, v } | null | undefined`, and `platePins` skips any view without a uv: "a photo without a position gets no pin". Its only production input is `regionPhotoViews(id)`, which is `PhotoView = Waypoint & …`, and `Waypoint.uv` is non-nullable (`lib/ascent/waypoints.ts:39`). `buildWaypoints` throws `has no uv` for a null uv (`waypoints.ts:125`), so no region photo reaches `platePins` without one.
- **The branch documents behaviour that would be wrong.** `PlateSheet`'s and `regionPlateSheet`'s docs repeat the "no position, no pin" behaviour as if it could happen. `PlateKey` renders the pins in an `<ol>` and hides the visible number badge (`aria-hidden`) on the grounds that "the list position gives the number". If a pin were ever skipped, `p.n` would keep the sequence numbers while the `<ol>` renumbers 1..k. Screen readers would then hear a different number than the badge shows, and the plate badges would no longer match the sequence figures.

**Fix:** Make `PlatePinSource.uv` required (`uv: { u: number; v: number }`), drop the skip, and replace the "no position, no pin" wording in `PlateSheet.tsx:43-44` and `lib/regions.ts:316` with a note that `buildWaypoints` guarantees a uv. If the skip is kept on purpose, give each row its number explicitly, `<li key={p.slug} value={p.n}>`, so the list and the badges agree either way.

## Info

### IN-01: `stepIndex` has no production caller, and a PhotoViewer comment still refers to it

**File:** `lib/photos/stepping.ts:60-63`, `components/photos/PhotoViewer.tsx:136-137`
**Issue:** PhotoViewer now steps with `stepWithEnd`, and `git grep stepIndex` outside the tests finds only the definition and a doc comment. The comment "the arrows and the swipe already do nothing there (stepIndex returns null)" describes the old function. In a one-photo set the arrows do nothing because `step` returns early when `n < 2` (line 333), not because of `stepIndex`.
**Fix:** Change the comment to name `step`'s `n < 2` early return and `stepWithEnd`. Then either delete `stepIndex` together with its test rows, or note that it is kept only for its tests.

### IN-02: A misplaced JSDoc in build-terrain: `overviewUv`'s doc now sits above `wgs84Corners`

**File:** `scripts/terrain/build-terrain.mjs:486-497`
**Issue:** The new `wgs84Corners` and its JSDoc were inserted between `overviewUv`'s existing JSDoc ("WGS84 -> overview UV … u = (lon − west) …") and `overviewUv` itself. Two doc blocks are now stacked above `wgs84Corners`, and `overviewUv` (line 506) has none.
**Fix:** Move the "WGS84 -> overview UV" block down to just above `function overviewUv`.

### IN-03: `RegionSequence` exports a `countLabel` that shadows the shared helper with another signature

**File:** `components/photos/region/RegionSequence.tsx:30-32`
**Issue:** `lib/home-format.ts:166` exports `countLabel(n, one, many)`, which `OverviewHeader`, `lib/regions.ts` and three other modules use, and which validates `n`. This module exports a different `countLabel(n)` with a fixed noun and a ', lowest first' suffix, and no validation. The two names collide on import and make the code harder to search.
**Fix:** Rename it, for example `sequenceCountLabel`, and build it on the shared helper: `` `${countLabel(n, 'photograph', 'photographs')}, lowest first` ``.

### IN-04: The BEV edition date on /sources is hard-coded, not read from its source

**File:** `data/sources.ts:146-149`
**Issue:** The module says credits are never retyped and BEV's facts come from `data/terrain/plates/saalfelden/source.json`. The change line still hard-codes 'Edition 15 September 2025'. `source.json` holds `edition: "2025-09"`, with no day, and the sheet margin prints that as 'Sep 2025'. If the plate's edition is ever rebuilt, `/sources` keeps the old date, and `data/__tests__/sources.test.ts:126,172` pins the literal, so nothing catches the drift.
**Fix:** Add a test row that checks the month and year in this sentence against `formatMonthYear(bev.edition)`, or keep the day in `source.json` (for example `editionDay`) and build the sentence from it.

### IN-05: Phantom requirement, the `fflate@^0.6.0` override and its 0.6.11 floor

**File:** `package.json:124`, `scripts/guards/version-floors.json:14`
**Category:** necessity
**Issue:** With `@react-three/drei` removed, nothing in the tree asks for `fflate@^0.6`. `package-lock.json` holds a single `node_modules/fflate` at 0.8.3 and no `"fflate": "^0.6…"` dependency, so the override pins nothing and the 0.6.11 floor guards a version that is not installed. The orchestrator flagged this as a known leftover.
**Fix:** Remove `"fflate@^0.6.0": "0.6.11"` from `overrides`, reduce the floor to `"fflate": ["0.8.3"]` (or a single string, whichever the guard accepts), then reinstall with the bundled npm and confirm that the lockfile diff shows only the override's metadata.

### IN-06: Fixed waits before assertions in photos-stepping

**File:** `e2e/photos-stepping.spec.ts:470`, `e2e/photos-stepping.spec.ts:487`
**Issue:** 'a region page loads no three.js chunk' waits a fixed 2000 ms before reading the resource entries. A three.js chunk that loads later than that would pass unnoticed, so the negative check is only as good as the wait. 'stepping requests only hashed manifest derivatives' waits a fixed 1000 ms and then asserts that every series photo's derivative was requested. That is a positive assertion on a timer, which can flake on a slow runner. The 6000 ms idle wait at line 385 is a legitimate "nothing happens by itself" check and is not part of this finding.
**Fix:** For line 487, poll instead: `await expect.poll(() => ZERMATT_SERIES.every((v) => [...requested].some((p) => p.startsWith(`/images/photos/${v.id}-`)))).toBe(true)`. For line 470, wait for a concrete settle signal (for example the card's links hydrated, then `page.waitForLoadState('networkidle')`) before scanning the scripts.

---

_Reviewed: 2026-11-26T19:59:43Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
