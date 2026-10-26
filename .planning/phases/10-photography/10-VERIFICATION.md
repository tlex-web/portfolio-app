---
phase: 10-photography
verified: 2026-10-26T20:00:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - .planning/phases/10-photography/10-01-PLAN.md
  - .planning/phases/10-photography/10-01-SUMMARY.md
  - .planning/phases/10-photography/10-02-PLAN.md
  - .planning/phases/10-photography/10-02-SUMMARY.md
  - .planning/phases/10-photography/10-03-PLAN.md
  - .planning/phases/10-photography/10-03-SUMMARY.md
  - .planning/phases/10-photography/10-04-PLAN.md
  - .planning/phases/10-photography/10-04-SUMMARY.md
  - .planning/phases/10-photography/10-05-PLAN.md
  - .planning/phases/10-photography/10-05-SUMMARY.md
  - .planning/phases/10-photography/10-06-PLAN.md
  - .planning/phases/10-photography/10-06-SUMMARY.md
  - .planning/phases/10-photography/10-07-PLAN.md
  - .planning/phases/10-photography/10-07-SUMMARY.md
  - .planning/phases/10-photography/10-08-PLAN.md
  - .planning/phases/10-photography/10-08-SUMMARY.md
  - .planning/phases/10-photography/10-09-PLAN.md
  - .planning/phases/10-photography/10-09-SUMMARY.md
  - .planning/phases/10-photography/10-10-PLAN.md
  - .planning/phases/10-photography/10-10-SUMMARY.md
  - .planning/phases/10-photography/10-11-PLAN.md
  - .planning/phases/10-photography/10-11-SUMMARY.md
  - .planning/phases/10-photography/10-12-PLAN.md
  - .planning/phases/10-photography/10-12-SUMMARY.md
  - .planning/phases/10-photography/10-13-PLAN.md
  - .planning/phases/10-photography/10-13-SUMMARY.md
  - app/(site)/photos/@modal/(.)[slug]/page.tsx
  - app/(site)/photos/[slug]/page.tsx
  - app/(site)/photos/layout.tsx
  - app/(site)/photos/page.tsx
  - components/photos/CarouselView.tsx
  - components/photos/ExifStrip.tsx
  - components/photos/Hotspots.tsx
  - components/photos/JustifiedGrid.tsx
  - components/photos/LightboxDialog.tsx
  - components/photos/MapSheet.tsx
  - components/photos/PhotoViewer.tsx
  - components/photos/ViewSwitcher.tsx
  - components/photos/ZoomStage.tsx
  - components/site/SiteNav.tsx
  - lib/photos/view-model.ts
  - lib/photos/view-param.ts
covered_digest: "v3:sha256:54f81ce30cd90017fa61a115477633992580253f29846b49e4ca0b2b58114ee8"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Open /photos/[slug] and the lightbox in real Safari (macOS and iOS), including Tab / Shift+Tab around the dialog and the open morph (or instant open)"
    expected: "Focus stays inside the dialog (assumption A1, the manual Tab wrap), Escape and Back close it, focus returns to the opener, the page hydrates normally"
    why_human: "Local Playwright WebKit cannot hydrate localhost (CSP upgrade-insecure-requests upgrades /_next/static to https); CI has no WebKit project. Safari is covered by no automated run."
  - test: "On a real touch device: swipe the lightbox photo left/right, pinch-zoom the fitted photo, drag-pan the 1:1 zoomed photo"
    expected: "Swipe steps with no history entry; the browser's pinch-zoom is not blocked; zoomed drag pans the stage"
    why_human: "The e2e swipe test dispatches synthetic pointer events (@chromium-only); real touch input and the touch-action interplay cannot be exercised in CI. Tim's zoomed-photo drag block exception was kept by decision."
  - test: "Judge motion feel: grid-to-lightbox morph, view crossfade, swipe follow and spring-back, 3D carousel step easing and idle float"
    expected: "Smooth, no flash, no empty box during the morph; instant under reduced motion"
    why_human: "Tests assert pseudo-elements and timing contracts, not perceived quality"
  - test: "Visual quality review of the 15 committed baselines (map, grid, carousel, photo page, lightbox at 375/768/1440)"
    expected: "Each baseline looks as designed; Tim committed the PNGs with the reply 'pushed' and no per-shot notes, so no one has recorded a per-image look"
    why_human: "Visual regression proves stability against the baseline, not that the baseline is right"
  - test: "Look at the 3D carousel and the flat stepper at 1280 and 375 wide"
    expected: "Restyled frames, caption, controls and 'Open photo' read cleanly with no overlap or clipping"
    why_human: "Aesthetic and layout judgement; the WebGL canvas is not in the visual baselines"
  - test: "At 1024 x 768 (key tier) open a photo and judge the photo size"
    expected: "The contain-fit photo is large enough to read after the 56 px chrome and the two-column strip take their share (UI review flagged this tier as shrinking the photo)"
    why_human: "Acceptability of the trade-off is a design call, not a pass/fail assertion"
  - test: "Scroll the 3D carousel offscreen and switch tabs, with DevTools frame monitoring"
    expected: "The idle float and frame loop stop offscreen (IntersectionObserver); only the hidden-tab case has an automated test"
    why_human: "Offscreen pause has no automated assertion"
---

# Phase 10: Photography Verification Report

**Phase Goal:** Visitors explore Tim's photographs as a map, a grid or a carousel, and open any photo in a shareable, keyboard-friendly lightbox that shows its real EXIF, story and rights.
**Verified:** 2026-10-26
**Status:** human_needed
**Re-verification:** No, initial verification

## Goal Achievement

Verdict: the goal is achieved in the codebase. Every roadmap success criterion and every requirement is implemented, wired to real committed data, and covered by a passing automated test. Nothing is FAILED. The remaining items are inherently human (real Safari, real touch, motion feel, visual judgement) and route to human verification.

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `/photos` opens on the Map; each photo is a keyboard-operable waypoint; the film scan is marked approximate; ascending-altitude order in every view | VERIFIED | `lib/photos/view-param.ts` `parseView` returns `'map'` for absent/unknown values. `components/photos/MapSheet.tsx` renders an `<ol>` of `<Link href=/photos/{slug}>` plates (real links, so Tab/Enter work), with `aria-label` "{title}, {altitudeLabel}". `p.approximate` gives a hollow dashed dot, and `altitudeLabel` carries "approx.". Order comes only from `buildPhotoViews`, which delegates to `buildWaypoints` (`lib/ascent/waypoints.ts:113`, sort by DEM altitude then id). Map, grid and carousel all receive the same `photoViews` and none re-sorts. e2e `photos.spec.ts` "opens on the map with four waypoint links in altitude order", "Tab reaches the four waypoint links in altitude order" and "the Riffelsee dot is dashed and the summit is not a link". |
| 2 | Grid (justified rows, true ratios) and Carousel (restyled 3D, flat stepper under reduced motion); carousel never auto-advances; view survives reload via URL; switching adds no history | VERIFIED | `app/(site)/photos/page.tsx` mounts exactly one view keyed by `?view=`. `JustifiedGrid` uses `justifyTile(aspect.w, aspect.h)` per tile (rows 224/280 per Tim's decision). `CarouselView` reads `useAscentMode()` and renders the stepper unless 'eligible'. It has no timer and `index` changes only in `show()`, the lightbox follow-along, or the close event. `ViewSwitcher` uses `router.replace(viewHref(v), {scroll:false})`. e2e: "the stepper ... never advances by itself", "the 3D carousel renders one canvas and never advances by itself", "at 375 x 600 switching replaces the URL with no history entry", "a reload keeps Grid". |
| 3 | `/photos/[slug]` direct load is a full page; in-site open shows a lightbox over the gallery with morph where View Transitions are supported and an instant open elsewhere; Back closes | VERIFIED | `[slug]/page.tsx` (static params for the 4 slugs, `dynamicParams=false`, `notFound()`) renders `PhotoViewer variant="page"`. `@modal/(.)[slug]/page.tsx` renders `LightboxDialog` + `PhotoViewer variant="modal"`, with `@modal/default.tsx` and `@modal/page.tsx` returning null. `LightboxDialog` calls `showModal()` and closes via `router.back()`. `PhotoViewer` names the photo box `photo-{slug}` and `TileTransition` names the grid half only while no photo is open. e2e "Back closes it, Forward reopens it, reload lands on the full page", "opening from the grid morphs the tile ... @chromium-only", "without the View Transitions API the tile still opens with focus on Close". |
| 4 | Lightbox moves with arrows, buttons and swipe; counter; no history entries; focus trapped; Escape closes; focus returns to the opener | VERIFIED | `PhotoViewer.step()` uses `window.history.replaceState` (Tim's "A: replaceState both"), no wrap, an `aria-disabled` button at each end, and the counter `n / 4`. Swipe is pointer-event based (touch/pen only). `LightboxDialog` has a Tab-wrap handler, Escape layers, `cancel` prevented, and `restoreFocus` to `[data-photo-id]` of the photo shown. The CR-01 and WR-01 fixes are present in code and tests. e2e "three Next presses ... no history entry", "Tab and Shift+Tab, 12 presses each, keep focus inside", "Escape closes through the router and focus returns", "closing after two steps returns focus to the tile of the photo shown", "browser Back right after a step returns focus ... (WR-01)". |
| 5 | Neutral gallery-black surface; EXIF strip (date, camera, lens, focal length, aperture, shutter, ISO, altitude, coordinates); hotspot callouts with leader lines (tap + keyboard), mobile legend, hide toggle; "(c) {year} Tim Lui, all rights reserved"; no download | VERIFIED | `--gallery-black: oklch(0.13 0 0)` / `bg-gallery` on the dialog and viewer. `ExifStrip` renders place/date, story, EXIF rows, Altitude and Position, approximate note and the rights line. Data is real: `data/generated/photos.ts` holds Canon EOS 6D Mark II / EF24-105mm f/4L IS II USM with real focal length, aperture, shutter and ISO for the three digital photos, and the 2019 film scan as 'Film scan'. `rights` = `© ${w.years} ${site.name}, all rights reserved`. `Hotspots.tsx` plus `hotspot-pref.ts` give gutter labels with leader lines, a numbered key on narrower tiers, and a 'Hide labels' toggle (H, localStorage). No `download` attribute anywhere in `components/photos` or `app/(site)/photos`; `strip.test.tsx` asserts zero `[download]`. e2e: "leader lines: one per gutter label", "key tier: numbered dots and the Labels key", "H hides every label ... survives a reload", "every image is a hashed derivative and nothing offers a download". |

**Score:** 5/5 truths verified (0 present-but-behavior-unverified).

Behavior-dependent truths (transitions, focus and cleanup invariants: steps without history entries, focus return, Escape layering, close-event follow-along) are not accepted on presence. Each is backed by a named Playwright test. I ran six of them locally (chromium, dev server, 6 passed in 18.5 s): the WR-01 stepper close, Escape focus return, arrow keys with end stops, the CR-01 nav-menu keys, the WR-01 Back focus return, and three Next presses with no history entry.

### Requirements Coverage

All 11 phase requirement IDs appear in plan frontmatter and in REQUIREMENTS.md. None is orphaned: REQUIREMENTS.md maps exactly these 11 IDs to Phase 10, and all are claimed.

| Requirement | Source Plans | Status | Evidence |
|-------------|--------------|--------|----------|
| PHOTO-01 | 10-02, 10-08, 10-13 | SATISFIED | `MapSheet`, `parseView` default, e2e map suite |
| PHOTO-02 | 10-04, 10-07, 10-09, 10-12, 10-13 | SATISFIED | `JustifiedGrid`, `CarouselView`/`CarouselStepper`, `ViewSwitcher`, URL-replace tests |
| PHOTO-03 | 10-01, 10-04, 10-07, 10-08 | SATISFIED | single `buildPhotoViews` order; `photos-view-model.test.ts`; e2e order tests |
| PHOTO-04 | 10-07 | SATISFIED | no timer or auto-advance code; "never advances by itself" tests (stepper and 3D) |
| LBOX-01 | 10-01, 10-05, 10-12 | SATISFIED | `[slug]` page, `@modal/(.)[slug]`, `LightboxDialog`, Back/Forward/reload e2e |
| LBOX-02 | 10-06, 10-10, 10-12 | SATISFIED | `step()` with `replaceState`, counter, swipe, no-history e2e |
| LBOX-03 | 10-05, 10-10, 10-12 | SATISFIED | Tab wrap, Escape layers, `restoreFocus`, e2e focus suite |
| LBOX-04 | 10-01, 10-02, 10-03, 10-09, 10-11, 10-13 | SATISFIED | `bg-gallery`, `ExifStrip`, `stripFields`, real EXIF data |
| LBOX-05 | 10-11 | SATISFIED | `Hotspots.tsx`, leader-line, key-tier, scroll-tier and H-toggle e2e |
| LBOX-06 | 10-06, 10-13 | SATISFIED (see adjudication) | grid tile morph `photo-{slug}` pair, no-API fallback e2e |
| LBOX-07 | 10-01, 10-03, 10-12 | SATISFIED | `rights` string, `strip.test.tsx` no-download, served-images e2e |

**LBOX-06 wording adjudication.** REQUIREMENTS.md says the morph happens from the "grid or map". Decision D-03 (10-CONTEXT.md line 34) fixes that a map plate opens with a plain enter, because map pins carry no image to morph from. ROADMAP success criterion 3 says "morphs from the thumbnail", which only the grid has. The code and the e2e test "opening from the map is a plain enter: no photo-* pseudo-element" agree with D-03 and the roadmap criterion. I treat this as a stale requirement sentence, not a gap. Recommended follow-up (not a blocker): edit LBOX-06 in REQUIREMENTS.md to "from the grid" and state that the map opens instantly.

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| `photos/page.tsx` | `MapSheet` / `JustifiedGrid` / `CarouselView` / `ViewSwitcher` | WIRED | imported and rendered, keyed by parsed view |
| `photos/layout.tsx` | `@modal` slot | WIRED | `{children}{modal}`; `default.tsx` and `page.tsx` return null |
| `@modal/(.)[slug]/page.tsx` | `LightboxDialog` + `PhotoViewer` | WIRED | same `photoViews` and `photoMetadata` as the full page |
| `PhotoViewer` | `ExifStrip`, `Hotspots*`, `ZoomStage`, `StagePhoto`, `useLightbox` | WIRED | all rendered and passed live state |
| `MapSheet` / `JustifiedGrid` / `CarouselControls` links | lightbox focus return | WIRED | each link carries `data-photo-id`, which `restoreFocus` queries |
| `CarouselView` | `LIGHTBOX_CLOSE_EVENT` | WIRED | the document listener sets the front photo, which fixes WR-01 for browser Back |
| `PhotoViewer` Escape / keys | `keyBelongsToChrome` (`SiteNav`) | WIRED | the CR-01 fix; the page-surface keys skip presses that belong to the open nav menu |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| `ExifStrip` | camera, lens, focal length, aperture, shutter, ISO | `data/generated/photos.ts` (built from `exif-sidecar.json`) through `stripFields` | Yes (Canon EOS 6D Mark II and so on; the film scan shows 'Film scan') | FLOWING |
| `ExifStrip` / viewer | altitude | DEM height via `buildWaypoints` | Yes | FLOWING |
| `ExifStrip` rights | capture year | `captureYear(photo.capture)` | Yes | FLOWING |
| `MapSheet` / `JustifiedGrid` | tiles, uv, aspect | image manifest and terrain data | Yes (`buildPhotoViews` throws on a missing variant) | FLOWING |
| `Hotspots` | callouts | `data/photos/editorial.ts` annotations through `hotspotViews` | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full unit suite | `npx jest --silent` | 63 suites, 943/943 pass | PASS |
| Types | `npx tsc --noEmit` | exit 0 | PASS |
| Post-CI fixes (CR-01, WR-01) plus 4 core lightbox behaviors | `npx playwright test e2e/photos-lightbox.spec.ts e2e/photos-carousel.spec.ts -g "<6 names>" --project=chromium` | 6 passed | PASS |
| CI on 483895b (run 40367226761) | `gh run view` | Visual, E2E, Unit, Lint and Type, Build, Security all green | PASS (read-only) |

### Probe Execution

No `probe-*.sh` is declared by the phase plans. SKIPPED.

### Anti-Patterns Found

None blocking. The grep for TBD, FIXME, XXX, TODO, HACK, PLACEHOLDER, "coming soon" and "not yet implemented" over the phase's non-generated source returned no hits. The empty-array and null patterns that remain are legitimate (`hotspots: []`, `prevSlug: null` at the ends, and `ModalDefault` returning null as Next requires). Code review: CR-01 and WR-01 are fixed (`10-REVIEW-FIX.md`). IN-01..IN-10 are open, info only (`10-REVIEW-DISPOSITION.md`). UI review is 20/24 with warnings only. Security is verified with `threats_open: 0`.

### Evidence Caveats (read before shipping)

1. **Post-CI commits were not pushed.** CI run 40367226761 covers 483895b only. Since then, dabafb4 (Nyquist e2e tests), 0419e95 (CR-01), 685e3d4 (WR-01) and the review and doc commits exist on `gsd/phase-10-photography` with no CI run. My local evidence for them is Jest 943/943, `tsc` clean, and the six Playwright cases above in chromium on the dev server. The Firefox runs and the production-build runs for those commits rest on the fixer's report (567/567), which I did not re-run. Push and CI on the final HEAD is still needed.
2. **Nyquist is partial.** `10-VALIDATION.md` has `nyquist_compliant: false`. Tests G5 (the WR-03 offset guard / WR-01 build-time throw) and G6 (the WR-05 validate-write-unlink order) are deferred to Phase 12 by Tim ("Fill G1-G4, defer G5/G6"). These are build-script data-correctness checks, outside the user-facing goal. This is an accepted deferral, not a gap.
3. **Dev-server flakiness items** in `deferred-items.md` are open and dev-only. CI and the production build are unaffected. Local WebKit cannot hydrate, so there is no WebKit coverage of any kind.
4. Several e2e cases are `@chromium-only` (morph pseudo-elements, synthetic swipe, 3D carousel). Firefox and Safari behavior for those rests on the instant-open fallback test and on human verification.

### Human Verification Required

See the `human_verification` list in the frontmatter: real Safari, real touch, motion feel, visual review of the 15 baselines, the 3D carousel and stepper look at 1280/375, the 1024x768 key tier, and the offscreen 3D float pause. These are not code failures. The code and tests for each exist, but a person has to judge them.

### Gaps Summary

No gaps. All five roadmap truths and all 11 requirements are implemented, wired to real data and covered by passing tests. The status is `human_needed` solely because of the inherently human items above. One housekeeping suggestion: amend the stale "grid or map" wording of LBOX-06 in REQUIREMENTS.md to match D-03.

---

_Verified: 2026-10-26_
_Verifier: Claude (gsd-verifier)_
