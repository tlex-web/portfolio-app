---
phase: 10-photography
reviewed: 2026-10-26T18:22:16Z
depth: standard
files_reviewed: 84
files_reviewed_list:
  - .gitignore
  - app/(site)/photos/@modal/(.)[slug]/page.tsx
  - app/(site)/photos/@modal/default.tsx
  - app/(site)/photos/@modal/page.tsx
  - app/(site)/photos/[slug]/page.tsx
  - app/(site)/photos/layout.tsx
  - app/(site)/photos/page.tsx
  - app/globals.css
  - components/__tests__/GalleryGrid.test.tsx
  - components/home/WaypointCard.tsx
  - components/home/__tests__/waypoints.test.tsx
  - components/photos/CarouselControls.tsx
  - components/photos/CarouselStepper.tsx
  - components/photos/CarouselView.tsx
  - components/photos/ExifStrip.tsx
  - components/photos/Hotspots.tsx
  - components/photos/JustifiedGrid.tsx
  - components/photos/LightboxDialog.tsx
  - components/photos/MapSheet.tsx
  - components/photos/PhotoCarousel3D.tsx
  - components/photos/PhotoViewer.tsx
  - components/photos/PhotosHeader.tsx
  - components/photos/StagePhoto.tsx
  - components/photos/TileTransition.tsx
  - components/photos/ViewSwitcher.tsx
  - components/photos/ZoomStage.tsx
  - components/photos/__tests__/header.test.tsx
  - components/photos/__tests__/hotspots.test.tsx
  - components/photos/__tests__/lightbox-dialog.test.tsx
  - components/photos/__tests__/map.test.tsx
  - components/photos/__tests__/strip.test.tsx
  - components/photos/__tests__/view-switcher.test.tsx
  - components/site/SiteFooter.tsx
  - data/__tests__/editorial.test.ts
  - data/__tests__/photos.test.ts
  - data/schemas/editorial.ts
  - data/schemas/photo.ts
  - data/sheet.ts
  - data/types.ts
  - e2e/design-system.spec.ts
  - e2e/helpers/view-transitions.ts
  - e2e/home-ascent.spec.ts
  - e2e/no-webgl.spec.ts
  - e2e/photos-carousel.spec.ts
  - e2e/photos-lightbox.spec.ts
  - e2e/photos-sweep.spec.ts
  - e2e/photos.spec.ts
  - e2e/shell.spec.ts
  - e2e/visual/README.md
  - e2e/visual/routes.spec.ts
  - jest.setup.js
  - lib/__tests__/home-format.test.ts
  - lib/__tests__/lightbox-tiers.test.ts
  - lib/__tests__/photo-format.test.ts
  - lib/__tests__/photos-hotspot-pref.test.ts
  - lib/__tests__/photos-hotspots.test.ts
  - lib/__tests__/photos-justify.test.ts
  - lib/__tests__/photos-label-layout.test.ts
  - lib/__tests__/photos-stepping.test.ts
  - lib/__tests__/photos-view-model.test.ts
  - lib/__tests__/photos-view-param.test.ts
  - lib/__tests__/photos-zoom.test.ts
  - lib/home-format.ts
  - lib/photo-format.ts
  - lib/photos/hotspot-layout.ts
  - lib/photos/hotspot-pref.ts
  - lib/photos/justify.ts
  - lib/photos/label-layout.ts
  - lib/photos/lightbox-tiers.ts
  - lib/photos/stepping.ts
  - lib/photos/view-model.ts
  - lib/photos/view-param.ts
  - lib/photos/zoom.ts
  - lib/useProgressiveTextures.ts
  - scripts/README.md
  - scripts/guards/__selftest__/served-images/bad-raw/public/images/x.dng
  - scripts/guards/check-contrast.mjs
  - scripts/guards/check-served-images.mjs
  - scripts/guards/palette-ratchet.json
  - scripts/guards/selftest.mjs
  - scripts/guards/test-count.baseline.json
  - scripts/photos/build-derivatives.mjs
  - scripts/photos/build-photo-data.mjs
  - scripts/photos/extract-exif.mjs
findings:
  critical: 1
  warning: 1
  info: 10
  total: 12
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-10-26T18:22:16Z
**Depth:** standard
**Files Reviewed:** 84
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

I reviewed the Phase 10 photography surface at standard depth. That covers the `/photos` routes with the `@modal` intercept, the viewer stack (PhotoViewer, LightboxDialog, ZoomStage, StagePhoto, Hotspots, ExifStrip), the three gallery views, the pure layout and view-model modules, the build scripts and guards, and the Jest and Playwright suites. I checked several things against the installed Next 16.4 sources. Next's app router patches `history.replaceState` to carry its tree state (`copyNextJsInternalHistoryState` in `next/dist/client/components/app-router.js`). Activity-based route preservation needs `cacheComponents`, which this project does not enable. A relative `alternates.canonical` with no `metadataBase` is emitted as a relative URL, not rewritten to localhost. The approved deviations listed in the brief are treated as intended behaviour.

Most of the code holds up. The Escape layers are in the right order in both surfaces, the step ref avoids replaying a step during the open morph, slug handling is whitelisted and escaped, and the derivative-writing order in `build-derivatives.mjs` is now safe. Two real problems remain:

- **The blocker:** the page surface listens for keys on the whole `document`, so it reacts to keys meant for the site nav. Pressing Escape to close the mobile nav menu on a photo page also takes you to `/photos`.
- **The warning:** when the lightbox is closed with browser Back (on phones that is the Android back gesture), the slug used to return focus comes only from `usePathname`, which the code's own comments say can lag behind a `replaceState` step.

The rest is Info: duplication, unused parameters, weak test guards and absence-only assertions after fixed sleeps.

## Critical Issues

### CR-01: On the photo page, the viewer's document key handlers catch keys meant for the site nav; Escape to close the mobile menu also leaves the photo

**File:** `components/photos/PhotoViewer.tsx:252-261` (and `269-308`, `components/photos/ZoomStage.tsx:156-184`); interacts with `components/site/SiteNav.tsx:71-75, 88`

**Issue:** On the page surface (`/photos/{slug}`, inside SiteChrome), PhotoViewer adds a `keydown` listener on `document` that runs `router.push('/photos')` on any Escape that is not prevented. SiteNav's open mobile menu (shown below 768 px, the same width range as `lb-scroll`) closes on Escape with its own bubble-phase `document` listener. That listener does not call `preventDefault`, and it is added later, when the menu opens, so the viewer's listener runs first. A keyboard user who opens the menu on a photo page and presses Escape to close it is taken off the photo to the map. If they had stepped, their place is lost: the step used `replaceState`, so Back returns to the stepped URL, not to the menu. The same global listeners also act while focus is inside the open menu: ← and → step the photo behind the menu, Z zooms it and H hides its labels. ZoomStage's capture listener pans on the arrows while zoomed. This affects keyboard users on narrow windows, which includes desktop browsers zoomed to 200-400 % (WCAG reflow), and tablets with keyboards. No e2e test covers the nav menu on a photo page.

**Fix:** Let the nav consume Escape before the viewer sees it, and keep the viewer's shortcuts out of the nav and footer. For example, in SiteNav:
```tsx
const onKeyDown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return;
  event.preventDefault();          // the viewer's page handler skips prevented presses
  buttonRef.current?.focus();
  setOpen(false);
};
document.addEventListener('keydown', onKeyDown, true); // capture: ahead of the viewer's bubble listener
```
and in PhotoViewer's page-surface handlers (Escape, arrows, Z, H), ignore presses that come from the site chrome:
```tsx
const fromChrome = (t: EventTarget | null) =>
  t instanceof Element && t.closest('header, footer') !== null;
// ...
if (event.defaultPrevented || fromChrome(event.target)) return;
```
Add an e2e case: open the nav menu on `/photos/{slug}` at 375 px, press Escape, and assert the URL is unchanged and the menu is closed.

## Warnings

### WR-01: A browser-Back close (the Android back gesture) uses a slug that may be lagging for focus return and the carousel's front photo

**File:** `components/photos/LightboxDialog.tsx:137-144, 148-159, 209-216`; `components/photos/CarouselView.tsx:76-90`

**Issue:** `close()` reads `window.location.pathname`, which is always current, and dispatches `LIGHTBOX_CLOSE_EVENT`. It does this because, in the code's own words, "usePathname can lag a replaceState step" (LightboxDialog) and "can trail a replaceState step by a few hundred ms (Chromium)" (CarouselView). That path only runs for the Close button, Escape and the dialog `close` event. When the lightbox closes through browser Back (the toolbar button, Alt+←, a mouse back button, or the Android back gesture, which is the usual way to close on a phone), `close()` never runs:
- `shownSlug.current` holds only what `usePathname` last reported;
- the carousel gets no close event and keeps the last `pathSlug` it followed;
- by cleanup time `window.location` already names `/photos`, so the slug cannot be recovered.

If Back comes right after a step, focus goes back to the previous photo's tile or "Open photo", and the carousel shows the previous photo, not the one on screen at close. The e2e "Return on close" tests only close with the button or Escape.

**Fix:** Have the viewer push its shown slug into the dialog as soon as it steps, so nothing depends on `usePathname`:
```tsx
// LightboxApi
setShown(slug: string): void;          // stores into shownSlug.current
// PhotoViewer.step(), after replaceState
lightbox?.setShown(slug);
```
In the layout-effect cleanup, before the focus microtask, dispatch `LIGHTBOX_CLOSE_EVENT` with `shownSlug.current` whenever `close()` was not the trigger (`!closing.current`). The carousel then follows a Back close as well. Add an e2e case: step, then `page.goBack()` at once, and assert focus and `data-active-slug`.

## Info

### IN-01: A hidden callout silently takes the first Escape when labels are hidden on the gutter tier

**File:** `components/photos/PhotoViewer.tsx:313-322, 504-514`
**Issue:** Hide labels does not clear `expandedId`. On the gutter tier with labels hidden, the open callout is not drawn: HotspotOverlay returns null and HotspotKey is `lb-gutter:hidden`. Yet `collapseCallout` still returns true, so in the lightbox the first Escape has no visible effect, and the callout reopens when labels come back. The zoomed case works the same way and is pinned by `e2e/photos-sweep.spec.ts:350-357` as the specified callout → zoom → close order, so this is only worth a decision for the hidden-labels case.
**Fix:** Either collapse when hiding (`onClick={() => { if (labelsOn) setExpandedId(null); setLabelsOn(!labelsOn); }}`, and the same in the H handler), or record the hidden-labels case in the UI-SPEC as intended.

### IN-02: `collapseCallout` uses `CSS.escape` without the fallback LightboxDialog provides

**File:** `components/photos/PhotoViewer.tsx:315` (compare `components/photos/LightboxDialog.tsx:92-96`)
**Issue:** jsdom has no `CSS.escape` (as LightboxDialog's own comment notes), so any future Jest test that presses Escape with a callout open throws a TypeError. In production the hotspot ids are schema-validated and every target browser has `CSS.escape`.
**Fix:** Export `cssEscape` from LightboxDialog (or a small shared util) and use it here.

### IN-03: Duplicated photo-path parsing and `isEditable`, with different behaviour

**File:** `components/photos/LightboxDialog.tsx:69, 80-83`; `lib/photos/stepping.ts:22, 31-40`; `components/photos/PhotoViewer.tsx:164-169`; `components/photos/ZoomStage.tsx:95-100`
**Issue:** LightboxDialog has its own `PHOTO_PATH` (`[^/]+`, where stepping uses `[^/?#]+`) and its own `slugOf`, whose `decodeURIComponent` has no try/catch, while `slugFromPath` returns null on malformed input. Today it is only reached with known slugs, but the two can drift apart. `isEditable` is copied in two files.
**Fix:** Use `slugFromPath` and `PHOTO_PATH` from `lib/photos/stepping.ts` in LightboxDialog, and move `isEditable` into a shared module.

### IN-04: The neighbour preload asks for the AVIF set only

**File:** `components/photos/PhotoViewer.tsx:172-179`
**Issue:** `preloadStage` sets `img.srcset = view.stage.srcSetAvif`. A browser without AVIF fetches a file it cannot decode and the `<picture>` later picks the WebP, so the preload is wasted and the step misses the cache.
**Fix:** Preload through a detached `<picture>`, or use `<link rel="preload" as="image" imagesrcset=… type="image/avif">` plus a WebP fallback, or feature-detect AVIF once.

### IN-05: `STAGE_SIZES` ignores the gutter tier's height condition and the key tier's height-limited box

**File:** `components/photos/PhotoViewer.tsx:144`
**Issue:** `(min-width: 1280px) calc(100vw - 432px), 100vw` is applied below 640 px tall too, where the tier is `lb-scroll` and has no gutters, and on the key tier, where the box is often limited by height. The result is an under- or over-sized candidate, not a layout fault.
**Fix:** Mirror `LB_GUTTER_MEDIA` in the media condition: `(min-width: 1280px) and (min-height: 640px) calc(100vw - 432px), 100vw`.

### IN-06: Unused parameters on component APIs

**File:** `components/photos/ZoomStage.tsx:123, 220`; `components/photos/PhotoViewer.tsx:223`; `components/photos/Hotspots.tsx:322-328`; `components/photos/PhotoViewer.tsx:559`
**Issue:** `onZoomChange(z, at?)` is called with `at`, but PhotoViewer ignores it (the anchor travels through ZoomStage's own ref). `HotspotKey` accepts `labelsOn` and ignores it, and PhotoViewer still passes it in.
**Fix:** Drop `at` from the signature and drop the `labelsOn` prop and its argument.

### IN-07: Fact list items are keyed by their text

**File:** `components/photos/Hotspots.tsx:89`
**Issue:** `<li key={fact.text}>` collides if one hotspot ever has two facts with the same text, because the editorial schema does not enforce unique fact text.
**Fix:** `key={`${i}-${fact.text}`}` or an index key (the list is static).

### IN-08: The row-height drift guard does not tie each value to its breakpoint

**File:** `components/__tests__/GalleryGrid.test.tsx:165-166`
**Issue:** `toContain('--row-h:224px')` and `toContain('--row-h:280px')` still pass if the `sm:` and `lg:` values are swapped in `JustifiedGrid.tsx:17`, which is exactly the drift `lib/photos/justify.ts` says the test guards against.
**Fix:** Assert `` `sm:[--row-h:${ROW_H_MD_PX}px]` `` and `` `lg:[--row-h:${ROW_H_PX}px]` ``.

### IN-09: Absence-only assertions after fixed sleeps can pass falsely

**File:** `e2e/photos-lightbox.spec.ts:601-612, 614-625, 645-660`; `e2e/photos-sweep.spec.ts:214`
**Issue:** "Back closes with no view transition", "a step morphs nothing" and "reduced motion runs no animation" sample the view-transition record after a fixed 500-800 ms wait and assert that nothing appeared. A transition that starts later on a loaded CI runner is missed, so these tests pass rather than fail. The 600 ms `switchTo` wait is a flake risk of the same kind.
**Fix:** First wait for a positive settle signal, for example `document.getAnimations().length === 0`, or a `transition.finished` promise recorded by the helper. Then take the absence sample.

### IN-10: `closing` is never reset in LightboxDialog

**File:** `components/photos/LightboxDialog.tsx:135, 148-150`
**Issue:** After the first `close()`, every later Close, Escape or `close` event does nothing for the life of that dialog instance. That is correct while `router.back()` unmounts the dialog, which is the case today. If a future change ever keeps the instance mounted (Activity with `cacheComponents`, or a failed back), the lightbox can no longer be closed.
**Fix:** Reset `closing.current = false` in the layout effect's setup, which runs again whenever the dialog is shown again.

---

_Reviewed: 2026-10-26T18:22:16Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
