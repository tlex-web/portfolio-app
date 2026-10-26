---
phase: 10-photography
plan: 07
subsystem: ui
tags: [nextjs-16, react-19, react-three-fiber, three, next-dynamic, carousel, capability-gate, a11y, playwright]

requires:
  - phase: 10-photography
    provides: "10-01 photoViews (tile 640/1024/1600, openerSrc 1024 WebP, aspect, caption parts); 10-04 the ?view= branch pattern and grid caption markup; 10-05 the intercepted lightbox with focus return to [data-photo-id]; 10-06 slugFromPath, stepIndex (no wrap) and replaceState steps in the lightbox"
  - phase: 09-home-ascent
    provides: "useAscentMode / downgradeAscent capability gate, ContextLossGuard, the TerrainStage next/dynamic pattern"
provides:
  - "/photos?view=carousel: CarouselView (named region, aria-roledescription carousel, data-active-slug, data-carousel-mode 'stepper' | '3d')"
  - "components/photos/CarouselStepper.tsx: one photo at its true ratio in the frame box; exports CAROUSEL_FRAME"
  - "components/photos/CarouselControls.tsx: Previous/Next (aria-disabled ends), [data-carousel-counter] 'n / 4', caption, primary Open photo with data-photo-id, polite status line"
  - "components/photos/PhotoCarousel3D.tsx: token-coloured R3F carousel through SafeCanvas, no drei Html, no key listener, frames face the camera, CameraFit, paused frame loop"
  - "LightboxDialog exports LIGHTBOX_CLOSE_EVENT ('photos:lightbox-close', detail = slug shown at close), dispatched on document by close()"
  - "lib/useProgressiveTextures.ts: useProgressiveTextures(sources: readonly { thumbSrc; fullSrc }[], activeIndex); swaps release the GPU copy first"
  - "e2e/photos-carousel.spec.ts (8 cases, 3 @chromium-only); e2e/no-webgl.spec.ts 'photos carousel falls back to the stepper'"
affects: [10-08, 10-09, 10-12, 10-13, visual baselines]

actuals:
  tokens: 13559
  tasks: 2
  commits: 4
plan_head_before: d3b89d97142084363105ec30950ffd2da32f4257
plan_head_after: ee46a5344bb9049d4327f780935ba5bbe6c0478e

tech-stack:
  added: []
  patterns:
    - "A view whose front item follows the lightbox: adjust state during render from slugFromPath(usePathname()), plus a document listener for LIGHTBOX_CLOSE_EVENT, because usePathname trails a replaceState step by up to ~300 ms in Chromium"
    - "Region-scoped keyboard shortcuts: onKeyDown on the named section (no window listener), ignored while dialog[open] exists or with a modifier"
    - "R3F pause: frameloop 'demand' while an IntersectionObserver reports the region offscreen or the tab is hidden; motion is time-based damping in useFrame (no react-spring), so nothing animates without frames"
    - "Three.js texture hot-swap to a larger image: dispose() the Texture first so WebGL2 immutable storage is reallocated"

key-files:
  created:
    - components/photos/CarouselView.tsx
    - components/photos/CarouselStepper.tsx
    - components/photos/CarouselControls.tsx
    - components/photos/PhotoCarousel3D.tsx
    - e2e/photos-carousel.spec.ts
  modified:
    - app/(site)/photos/page.tsx
    - components/photos/LightboxDialog.tsx
    - components/PhotoCarousel3D.tsx
    - lib/useProgressiveTextures.ts
    - e2e/no-webgl.spec.ts
    - .planning/phases/10-photography/deferred-items.md

key-decisions:
  - "10-07: the carousel region is a <section> with aria-label (implicit role region), not role=\"region\": jsx-a11y/no-redundant-roles rejects the explicit role; the computed role and name are the same"
  - "10-07: LightboxDialog.close() dispatches LIGHTBOX_CLOSE_EVENT with the slug shown, and CarouselView sets its front photo from it; usePathname alone missed a lightbox step followed by a quick Escape in Chromium, so focus fell back to the opener"
  - "10-07: 3D frames face the camera every frame (Object3D.lookAt); the legacy ring faced inwards, so the front photo was its mirrored back"
  - "10-07: the 3D camera distance is fitted to the stage so the front frame fills at most 72 % of its height and 84 % of its width (phones keep the whole photo in view)"
  - "10-07: 3D restyle colours: clear colour and fog night-900 (= bg-surface-raised, the frame box), mounts and ground night-950, one mist-300 directional light plus ambient; the reflection planes and shadows of the legacy scene are dropped; photos use an unlit material with toneMapped off"

patterns-established:
  - "Carousel e2e: wait for [data-carousel-skeleton] to disappear before 3D assertions; force clicks on aria-disabled ends (Playwright treats them as disabled)"
  - "RED evidence for Playwright: --reporter=line,junit with PLAYWRIGHT_JUNIT_OUTPUT_NAME, classified by gsd check tdd-red-evidence with the spec file (JUnit classname) or file#title as target"

requirements-completed: [PHOTO-02, PHOTO-03, PHOTO-04]

coverage:
  - id: D1
    description: "Reduced motion (and every static gate result) renders the flat stepper at /photos?view=carousel: one photo, counter, aria-disabled ends, status line, Open photo, no auto-advance after 6 s"
    requirement: PHOTO-04
    verification:
      - kind: e2e
        ref: "e2e/photos-carousel.spec.ts#the stepper shows one photo with the controls and never advances by itself"
        status: pass
    human_judgment: false
  - id: D2
    description: "Arrow keys step only with focus inside the region, never from outside it (Pitfall 7)"
    requirement: PHOTO-02
    verification:
      - kind: e2e
        ref: "e2e/photos-carousel.spec.ts#the stepper keys act only with focus inside the region (Pitfall 7)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Open photo opens the lightbox; Escape returns focus to Open photo for the photo shown at close, including after a step inside the lightbox"
    requirement: PHOTO-02
    verification:
      - kind: e2e
        ref: "e2e/photos-carousel.spec.ts#the stepper opens the lightbox and Escape returns focus to Open photo"
        status: pass
      - kind: e2e
        ref: "e2e/photos-carousel.spec.ts#the stepper front photo follows a step inside the lightbox"
        status: pass
    human_judgment: false
  - id: D4
    description: "Three.js never loads under the static gate; without WebGL the carousel is the stepper with no canvas and no error page (D-13)"
    requirement: PHOTO-02
    verification:
      - kind: e2e
        ref: "e2e/photos-carousel.spec.ts#the stepper page loads no three.js (D-13)"
        status: pass
      - kind: e2e
        ref: "e2e/no-webgl.spec.ts#photos carousel falls back to the stepper"
        status: pass
    human_judgment: false
  - id: D5
    description: "Capable devices get the 3D carousel in one canvas; front frame and counter unchanged after 6 s idle; keys, Open photo, no history entry for a lightbox step, front photo equals the URL slug at close; float stops in a hidden tab"
    requirement: PHOTO-04
    verification:
      - kind: e2e
        ref: "e2e/photos-carousel.spec.ts#the 3D carousel renders one canvas and never advances by itself @chromium-only"
        status: pass
      - kind: e2e
        ref: "e2e/photos-carousel.spec.ts#3D keys step inside the region and the front photo follows the lightbox @chromium-only"
        status: pass
      - kind: e2e
        ref: "e2e/photos-carousel.spec.ts#3D idle float stops in a hidden tab @chromium-only"
        status: pass
    human_judgment: false
  - id: D6
    description: "The carousel reads the one canonical order (buildPhotoViews), and its textures come from the manifest 640 and 1024 WebP derivatives"
    requirement: PHOTO-03
    verification:
      - kind: e2e
        ref: "e2e/photos-carousel.spec.ts#the stepper shows one photo with the controls and never advances by itself"
        status: pass
      - kind: other
        ref: "grep -c LandscapeImage lib/useProgressiveTextures.ts -> 0"
        status: pass
    human_judgment: false
  - id: D7
    description: "Visual quality of the restyled 3D scene and the stepper (framing, mount, ground, skeleton, controls bar wrap at 375 px), and the float offscreen pause by IntersectionObserver"
    verification: []
    human_judgment: true
    rationale: "Look and feel is a design judgment, and the offscreen pause has no e2e (the 1280 x 720 page cannot scroll the region fully out of view); local renders at 1280 and 375 px were reviewed by the executor only"

duration: 29min
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 07: Carousel View Summary

**/photos?view=carousel: a token-coloured R3F carousel behind the Home capability gate, a flat stepper for every static device, shared DOM controls with "Open photo", region-scoped keys and no auto-advance**

## Performance

- **Duration:** 29 min
- **Started:** 2026-10-26T12:52:41Z
- **Completed:** 2026-10-26T13:21:34Z
- **Tasks:** 2 (each RED then GREEN)
- **Files modified:** 10 code and test files, plus deferred-items.md

## Accomplishments

- `CarouselView` reads `useAscentMode()`: 'pending' and every static result render `CarouselStepper`; 'eligible' renders `PhotoCarousel3D` through `dynamic(..., { ssr: false })`, so three.js is never requested under the static gate (D-13).
- Controls bar (`CarouselControls`): 44 px ‹ ›, aria-disabled at the ends (no wrap), the aria-hidden mono counter, the caption (title and the grid's three nowrap parts), the primary "Open photo" link with `data-photo-id`, and a polite status line set on steps only.
- No timer anywhere; ← → are handled by the region's `onKeyDown` and ignored while a dialog is open (Pitfall 7). The front photo follows the lightbox, so on close focus lands on "Open photo" for the photo shown.
- The 3D carousel: SafeCanvas, colours only from `data/generated/tokens.ts`, no drei Html (Pitfall 8's likely source), a 3:2 outline skeleton as a DOM sibling until the thumbnails load, a float and 'always' frame loop only while visible, and `downgradeAscent` on a failed canvas or lost context, which swaps in the stepper.
- `useProgressiveTextures` now takes `{ thumbSrc, fullSrc }` sources; the carousel passes the manifest 640 and 1024 WebP derivatives, and the legacy carousel maps its images to the same shape.

## Task Commits

1. **Task 1: Carousel view with the gate, the flat stepper and the shared controls** - `11598f7` (test, RED), `69e5e34` (feat, GREEN)
2. **Task 2: Restyled 3D carousel: tokens, no Html, paused float, manifest textures** - `138cf7b` (test, RED), `ee46a53` (feat, GREEN)

## TDD Gate Compliance

- **RED, Task 1 (`11598f7`):** 12 new cases (6 per browser) failed on the first assertion that the region exists, because `/photos?view=carousel` still rendered the legacy gallery. JUnit report classified by `gsd check tdd-red-evidence`: `RED_EVIDENCE_OK` (target `photos-carousel.spec.ts`, the JUnit classname; a bare test title is ambiguous across the two browsers). Semantic assessment: valid; every target ran and failed on the planned behaviour, with no load, syntax or fixture fault. Record: `.planning/phases/10-photography/.red/10-07-t1.json`.
- **RED, Task 2 (`138cf7b`):** the 3 @chromium-only cases failed on `data-carousel-mode` "3d" (received "stepper"). `RED_EVIDENCE_OK` for "the 3D carousel renders one canvas and never advances by itself @chromium-only". Semantic assessment: valid. Record: `.red/10-07-t2.json`.
- **GREEN:** `69e5e34` and `ee46a53`. No REFACTOR commit.

## Files Created/Modified

- `components/photos/CarouselView.tsx` - gate, region, keys, URL follow, close event, pause signals, dynamic 3D branch, skeleton
- `components/photos/CarouselStepper.tsx` - flat stepper; `CAROUSEL_FRAME` box classes
- `components/photos/CarouselControls.tsx` - ‹ counter › caption, Open photo, status line
- `components/photos/PhotoCarousel3D.tsx` - restyled R3F carousel
- `components/photos/LightboxDialog.tsx` - `LIGHTBOX_CLOSE_EVENT` dispatched by close()
- `lib/useProgressiveTextures.ts` - sources shape; GPU copy released before a swap
- `components/PhotoCarousel3D.tsx` - legacy call site only
- `app/(site)/photos/page.tsx` - the `?view=carousel` branch (sr-only h2 "Carousel")
- `e2e/photos-carousel.spec.ts` - new spec (5 stepper cases, 3 @chromium-only 3D cases)
- `e2e/no-webgl.spec.ts` - photos test rewritten for the stepper

## Decisions Made

See `key-decisions` above. ui-ux-pro-max was loaded; two focused searches (`carousel auto rotation controls`, `live region status announcement`, ux domain) returned `auto-rotation-controls` and `contextual-live-badge-updates`, which the locked UI-SPEC already applies (no auto-advance at all, one atomic polite status line). Local renders at 1280 and 375 px were checked by the executor (see D7).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Implicit region role and a scoped lint exception**
- **Found during:** Task 1
- **Issue:** `role="region"` on the section fails `jsx-a11y/no-redundant-roles`, and `onKeyDown` on it fails `jsx-a11y/no-noninteractive-element-interactions`.
- **Fix:** the named `<section>` keeps its implicit region role; the keydown handler has an `eslint-disable-next-line` with its reason (the project's existing pattern in ImageDetailModal). `getByRole('region', { name: 'Photographs' })` finds it.
- **Files modified:** components/photos/CarouselView.tsx
- **Committed in:** 69e5e34

**2. [Rule 1 - Bug] The front photo missed a lightbox step closed quickly (Chromium)**
- **Found during:** Task 1 (e2e "front photo follows a step inside the lightbox")
- **Issue:** usePathname reached the carousel up to ~300 ms after the lightbox's replaceState step; an Escape inside that window closed the lightbox while the carousel still showed the earlier photo, so focus returned to the opener.
- **Fix:** `LightboxDialog.close()` dispatches `LIGHTBOX_CLOSE_EVENT` on document with the slug it already reads from `window.location`; CarouselView listens on document and sets its index. The pathname follow stays for steps seen while open.
- **Files modified:** components/photos/LightboxDialog.tsx, components/photos/CarouselView.tsx
- **Verification:** carousel spec 20/20 with `--repeat-each=2`; photos-lightbox + no-webgl 65/65; photos + photos-lightbox 81/81
- **Committed in:** 69e5e34

**3. [Rule 1 - Test bug] Forced clicks on aria-disabled ends**
- **Found during:** Task 1 GREEN run
- **Issue:** Playwright treats an `aria-disabled="true"` button as not enabled and waits for it.
- **Fix:** the two end presses use `click({ force: true })`; the assertion that nothing changes is unchanged.
- **Committed in:** 69e5e34

**4. [Rule 1 - Bug] Full-size textures never replaced the thumbnails**
- **Found during:** Task 2 (local render console)
- **Issue:** `glTexSubImage2D: Offset overflows texture dimensions`: under WebGL2 three.js allocates immutable storage at the first upload, so the hook's in-place swap from the 640 to the 1024 image failed and the thumbnail stayed. The legacy carousel had the same latent bug.
- **Fix:** `swapImage()` calls `texture.dispose()` before setting the new image; the same Texture object uploads afresh. The warning is gone from the console.
- **Files modified:** lib/useProgressiveTextures.ts
- **Committed in:** ee46a53

**5. [Rule 1 - Bug] Mirrored front photo and an over-scaled front frame (inherited geometry)**
- **Found during:** Task 2 (local renders)
- **Issue:** the legacy ring turned each frame by angle + π, so the camera saw the front photo from behind (mirrored), and the front frame filled the box; at 375 px it overflowed the stage.
- **Fix:** frames `lookAt` the camera every frame, the mount sits behind the photo, the front lift moves towards the camera, and `CameraFit` sets the camera distance from the stage aspect.
- **Files modified:** components/photos/PhotoCarousel3D.tsx
- **Committed in:** ee46a53

---

**Total deviations:** 5 auto-fixed (1 blocking, 4 bugs). **Impact on plan:** LightboxDialog was outside the plan's file list (one exported constant and one dispatch); everything else stays in the plan's files. No scope creep.

## Issues Encountered

- **Dev-server lost interception (logged in deferred-items.md).** After the first parallel run on a freshly started `next dev`, every in-site photo click became a document navigation, including the existing grid lightbox cases 10-07 does not touch. A dev-server restart fixed it; CI uses the production build.
- **Known 09 first-compile timeouts** in `no-webgl.spec.ts` ("contact keeps the form", "project detail keeps its content") recurred once on a cold run and passed warm (09 deferred item).
- `PHOTO-02` and `PHOTO-03` are also declared by later Phase 10 plans; `requirements.ready-ids` reports them blocked, so only `PHOTO-04` is marked complete in REQUIREMENTS.md by this plan.
- The plan's A2 assumption (drei Html as the "removeChild" source) is not settled here: there is no view switcher until 10-08, and 10-12 adds the console assertion across view switches.

## Verification

- `npx playwright test e2e/photos-carousel.spec.ts e2e/no-webgl.spec.ts --project=chromium --project=firefox`: 21 passed (dev server, 2 workers); the titles include "stepper" and "@chromium-only".
- `npm run lint` (eslint and guards) exit 0; `npm run type-check` exit 0; `npx jest --silent` 56 suites, 838 tests passed.
- Regression: `e2e/photos.spec.ts` + `e2e/photos-lightbox.spec.ts` (chromium, firefox): 81 passed.
- Acceptance greps: no `addEventListener('keydown'` in any carousel file; no `setInterval`/`setTimeout` in CarouselView, CarouselControls or PhotoCarousel3D; "View details for" 0 in no-webgl.spec.ts; 0 hex literals and 0 `@react-three/drei` in components/photos/PhotoCarousel3D.tsx; `LandscapeImage` 0 in the texture hook; `dynamic(` 1 and `ssr: false` 1 in CarouselView.
- No local build was run, so `public/service-worker.js` is untouched.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 10-08 (the Map view and the view switcher). The carousel is mounted only for `?view=carousel`; the legacy default view still uses `components/PhotoCarousel3D.tsx` until 10-08/10-09.
- Visual baselines do not cover `?view=carousel` yet; a later baseline plan should add it (3D frames are SwiftShader renders in CI).
- For Tim at UAT (D7): the 3D framing and scene colours, and the stepper and controls at 375 px.

---
*Phase: 10-photography*
*Completed: 2026-10-26*

## Self-Check: PASSED

All five created files exist; commits 11598f7, 69e5e34, 138cf7b and ee46a53 are on gsd/phase-10-photography.
