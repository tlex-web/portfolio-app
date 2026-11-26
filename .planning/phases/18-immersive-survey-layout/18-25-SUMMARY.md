---
phase: 18-immersive-survey-layout
plan: 25
subsystem: photos-retirement
tags: [photo-06, retirement, carousel, three-js, guard-03, client-js-budget, 14-in-04]
status: complete

requires:
  - phase: 18-16
    provides: "e2e/photos-stepping.spec.ts 'stepping requests only hashed manifest derivatives' (the successor of all 11 useProgressiveTextures tests)"
  - phase: 18-22
    provides: "/photos with no importer of the carousel family"
  - phase: 18-24
    provides: "switcher, header, grid and justify retired; client JS 1,827,784 B"
provides:
  - "CarouselView, CarouselControls, CarouselStepper, PhotoCarousel3D and lib/useProgressiveTextures.ts deleted with no remaining importer"
  - "14 IN-04 resolved: DemoTerminal's STEP is the only copy of the step-button string"
  - "Phase 18 client-JS cap enforced: 1,827,784 B against 1,855,841 B"
affects: [18-26, 18-27, 18-28, 18-29]

actuals:
  tokens: 12274    # chars/4 over git diff 415dfd5..d4a0837 (49,096 chars incl. context; mostly deleted lines)
  tasks: 2
  commits: 2       # measured: git rev-list --count 415dfd5..HEAD; the metadata commit follows
plan_head_before: 415dfd5127dffd0bc318a17a3000c88e218c7e63
plan_head_after: d4a0837cf8c6652d5140c2c0dd8683aca010c7dc

tech-stack:
  added: []
  patterns:
    - "A retirement whose modules no live route reaches changes no client byte: the build already tree-shook them, so the gate is the git grep and the chunk scan, not the size"

key-files:
  created: []
  modified:
    - components/projects/DemoTerminal.tsx
    - .github/copilot-instructions.md
  deleted:
    - components/photos/CarouselView.tsx
    - components/photos/CarouselControls.tsx
    - components/photos/CarouselStepper.tsx
    - components/photos/PhotoCarousel3D.tsx
    - lib/useProgressiveTextures.ts
    - lib/__tests__/useProgressiveTextures.test.ts

key-decisions:
  - "18-25: the 11 useProgressiveTextures tests retire with their only consumer, all mapped to photos-stepping.spec 'stepping requests only hashed manifest derivatives' (18-16); R_jest 11 re-measured at plan start"
  - "18-25: 14 IN-04 resolved with no shared module: DemoTerminal's STEP comment records the carousel's retirement; PhotoViewer's STEP_BUTTON is a different string and stays separate"
  - "18-25: Phase 18 client-JS cap holds at plan end: 1,827,784 B, 28,057 B under 1,855,841 B; no question for Tim"
  - "18-25: no dependency removed; three and @react-three/fiber keep Home importers"

requirements-completed: []  # PHOTO-06 is also claimed by 18-26..18-29; REQUIREMENTS.md keeps it Pending (18-22 convention)

duration: 5min
completed: 2026-11-26
---

# Phase 18 Plan 25: Carousel Retirement and Client-JS Gate Summary

**The 3D carousel family (four components and its three.js texture hook) is deleted with its 11-test hook file mapped to 18-16's e2e row. DemoTerminal's STEP comment closes 14 IN-04, and client JS ends at 1,827,784 B, 28,057 B under the phase cap.**

## Performance

- **Duration:** about 5 min (wall clock, 15:46:43Z to 15:51:37Z)
- **Started:** 2026-11-26T15:46:43Z
- **Completed:** 2026-11-26T15:51:37Z
- **Tasks:** 2
- **Files:** 6 deleted, 2 modified

## Accomplishments

- Before deleting anything I ran `git grep` over app, components, lib, e2e, scripts, proxy.ts, CSS and dynamic imports. Only the family's own files (and the hook's test) imported CarouselView, CarouselControls, CarouselStepper, PhotoCarousel3D and useProgressiveTextures. `CAROUSEL_FRAME` was used only by CarouselStepper and CarouselView.
- Deleted the five modules and `lib/__tests__/useProgressiveTextures.test.ts`. The reference gate exits 1 (no match), and no client chunk contains `CarouselStepper` or `photos-view`.
- Rewrote the comment above DemoTerminal's `STEP` (no class change) and narrowed the copilot-instructions 3D-isolation rule to the Home terrain canvas.
- Measured client JS after a clean build: 1,827,784 B, at or under the cap. Nothing changed from 18-24 because no live route reached the carousel after 18-22, so its chunks had already left the build.
- Home is unchanged: `git diff --stat 769e1b8 -- lib/ascent components/home` prints nothing (DATA-09).

## Client JS (production build, `.next/static/chunks/**/*.js`)

| Point | Bytes | vs cap 1,855,841 |
|---|---|---|
| Phase base | 1,851,745 | -4,096 |
| 18-07 (record only) | 1,861,272 | +5,431 |
| 18-12 (record only) | 1,864,179 | +8,338 |
| 18-18 (record only) | 1,882,651 | +26,810 |
| 18-22 (record only) | 1,827,848 | -27,993 |
| **18-25 (gate)** | **1,827,784** (21 files) | **-28,057, PASS** |
| Cap (base + 4,096) | 1,855,841 | 0 |

The cap was not raised or relaxed. Between 18-18 and 18-22 the icon-inlining fix (Tim, "Inline icons now (Recommended)") brought the total to 1,866,470 B. The view retirements (18-22, 18-24) then took it below the base.

## Retired tests (GUARD-03 allowance, R_jest 11, R_e2e 0)

At plan start the allowance file held exactly 11 tests (`allowance file at start: 11 tests (pinned R_jest 11)`).

| # | Retired test (lib/__tests__/useProgressiveTextures.test.ts) | Successor | Plan |
|---|---|---|---|
| 1 | loads every thumbnail first and then reports one texture per source | e2e/photos-stepping.spec.ts 'stepping requests only hashed manifest derivatives' | 18-16 |
| 2 | counts a failed thumbnail as done so the carousel is never blocked | same row | 18-16 |
| 3 | loads full-size images one at a time, nearest the active index first | same row | 18-16 |
| 4 | re-orders the pending full-size loads when the active index changes | same row | 18-16 |
| 5 | swaps each image into the same texture object, so the scene keeps its materials | same row | 18-16 |
| 6 | ignores and disposes a thumbnail that arrives after the source list changed | same row | 18-16 |
| 7 | starts over when the source list changes: the old textures are disposed and never returned | same row | 18-16 |
| 8 | reloads when the sources change at the same count: new thumbnails, old textures disposed and never returned (IN-03) | same row | 18-16 |
| 9 | starts no new load for a new array holding the same URLs (IN-03) | same row | 18-16 |
| 10 | disposes every texture on unmount and ignores loads that settle afterwards | same row | 18-16 |
| 11 | survives the Strict Mode effect double run with live textures | same row | 18-16 |

The hook's only consumer was the three.js carousel, and it retires in this plan. The one behaviour a visitor can still see is that stepping requests only hashed manifest derivatives, and 18-16's row asserts it.

End gate (copied from its output):

```
jest 2804 -> 2793 (allowance 11, floor 2793)
e2e 855 -> 855 (allowance 0, floor 855)
```

`npm run guard:tests`: jest 2793 + e2e 855 = 3648 against the committed phase floor 3024, OK. `guard:tests:scan` found no focus, skip or fixme marker. Full Jest passed with 0 failures. Lint and type-check passed. `check-snapshot-commit --none` passed after both commits (0 PNGs).

## Task Commits

1. **Task 1: retire the carousel family and its texture hook**: `05e5f3b` (refactor)
2. **Task 2: close 14 IN-04, copilot 3D rule, client-JS gate**: `d4a0837` (docs)

## Files Created/Modified

- `components/projects/DemoTerminal.tsx`: the STEP comment says the photo carousel's step controls retired in Phase 18 and this is the only copy (14 IN-04 resolved, no shared module needed). It no longer names the deleted module, and no class string changed.
- `.github/copilot-instructions.md`: the component-isolation rule names only the Home terrain canvas.
- Deleted: the four carousel components, `lib/useProgressiveTextures.ts` and its test.

## Decisions Made

- I took the plan's mapping as written: all 11 tests map to one e2e row and none is rewritten as Jest, because the hook they tested is gone.
- I checked PhotoViewer's `STEP_BUTTON` before writing the comment. It uses `min-h-11 min-w-11` and `hover:border-ink-muted`, so it is a different string, which makes DemoTerminal's `STEP` the only copy of the old carousel string. I dropped the "one look for every ‹ › on the site" phrase from the comment because it was no longer true.

## Deviations from Plan

None in the code: the plan ran exactly as written. One note: `.github/copilot-instructions.md` was already prettier-dirty at HEAD (blank lines after headings). My one-line edit adds no new prettier issue, and I did not reformat the rest of the file (out of scope).

## Dependencies and dead code left for later plans

- No dependency removed. `three` and `@react-three/fiber` still have importers: components/home/terrain, components/SafeCanvas.tsx, e2e/home-canvas.spec.ts and lib/__tests__/ascent-route.test.ts.
- `@react-three/drei` has no code importer. Only package.json, version-floors.json, copilot prose and boundary.test's ban mention it. This was already true before 18-25 because the carousel never imported drei. Left for 18-29 and Tim.
- `LIGHTBOX_CLOSE_EVENT` (components/photos/LightboxDialog.tsx) is still dispatched but has no listener now, since CarouselView was the only one. LightboxDialog's doc comment still describes the carousel following the close, and lightbox-dialog.test.tsx asserts the dispatch. LightboxDialog is not in this plan's files, so it is left as a forward note.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Forward notes for 18-26..18-29 (the 14 IN-04 write-back to 14-REVIEW-DISPOSITION.md, LIGHTBOX_CLOSE_EVENT, drei, the copilot prettier state) are in the phase forward-notes file.
- No pixels changed. 18-28's re-baseline list is unchanged by this plan.

## Self-Check: PASSED

- components/photos/{CarouselView,CarouselControls,CarouselStepper,PhotoCarousel3D}.tsx, lib/useProgressiveTextures.ts and lib/__tests__/useProgressiveTextures.test.ts: ABSENT (as intended)
- components/projects/DemoTerminal.tsx contains STEP and IN-04, and 0 CarouselControls; .github/copilot-instructions.md has 0 "carousel"
- Commits 05e5f3b and d4a0837: FOUND in HEAD's history

## Post-plan cleanup (Tim-approved, 2026-11-26)

Scope added after 18-28 and before 18-29, so that 18-29's closing gate covers it. It is not a plan of its own. Tim's answers (AskUserQuestion, 2026-11-26): "Remove in 18-29 (Recommended)" for both `@react-three/drei` and `LIGHTBOX_CLOSE_EVENT`. Base: 7478ac7.

### B. LIGHTBOX_CLOSE_EVENT: done (`5356f9c`)

- `components/photos/LightboxDialog.tsx`: removed the `LIGHTBOX_CLOSE_EVENT` export and both dispatches. These were the one in `close()` before `router.back()`, and the one after a browser-Back unmount. The second one sat inside a `flushSync` that wrapped only the dispatch. 10-REVIEW-FIX WR-01 added that `flushSync` so the carousel could render the photo shown before `restoreFocus`, and 14-RESEARCH's close-path diagram shows the same thing ("Back only: flushSync LIGHTBOX_CLOSE_EVENT"). So the `flushSync` and its `react-dom` import went with it. Focus return is unchanged: `close()` still records the URL's slug as the one shown, and `restoreFocus(shownSlug ?? '', opener)` still runs in the same post-unmount microtask, after the same `isConnected` check. The `closing` ref stays, because it guards the double close and is reset on show (IN-10).
- Doc comment: the two carousel passages now describe the current behaviour. `close()` records the URL's slug, and a browser-Back close returns focus to that slug's mark (WR-01).
- Retired test assertion, mapped to its successor: in `components/photos/__tests__/lightbox-dialog.test.tsx`, the dispatch listener and `expect(closed).toEqual(['second'])` are retired. The row itself stays, renamed from "a close by browser Back right after a step tells the view and returns focus to the photo shown (10-REVIEW WR-01)" to **"a close by browser Back right after a step returns focus to the photo shown (10-REVIEW WR-01)"**. Its focus assertion (Second tile focused) is unchanged. No row was deleted, so Jest stays at 2802. The e2e successors that already cover the browser-Back focus path are unchanged: photos-lightbox "browser Back right after a step returns focus to the figure link of the photo shown (10-REVIEW WR-01) @no-win-webkit" and photos-stepping "after a step closed by browser Back at once, focus returns to the shown photo's figure (10-REVIEW WR-01, LBOX-08) @no-win-webkit".
- `git grep -n "photos:lightbox-close\|LIGHTBOX_CLOSE_EVENT"` over app, components, lib and e2e (and the whole tree outside .planning) is empty. `flushSync` has no remaining use in app, components, lib or e2e.

### A. @react-three/drei: done (`ff477ab`), with @types/three 0.183.1 pinned directly

- `git grep` confirmed there is no code importer. The only hits are package.json, the lockfile, version-floors.json, the copilot prose, boundary.test's ban, and .planning prose. boundary.test's drei ban stays.
- First attempt (no commit): the bundled-npm uninstall removed 42 lockfile entries, including **`@types/three` 0.183.1**. It was never a direct dependency and arrived only through drei's stats-gl, but the Home terrain's TypeScript depends on it, so `tsc --noEmit` failed with TS7016 ("Could not find a declaration file for module 'three'") in CameraRig.tsx, route-curve.ts, terrain-shader.ts, TerrainCanvas.tsx and TerrainMesh.tsx. The attempt was reverted (package.json and package-lock.json back to HEAD, bundled `npm ci`) and returned to Tim as a checkpoint.
- Tim's answer (AskUserQuestion, 2026-11-26 ~20:45Z): **"Pin @types/three 0.183.1 (Recommended)"**. The option shown: "Add @types/three@0.183.1 as a direct devDependency, then remove drei, both with the bundled npm. These are the exact types the build uses today, so no new type errors are possible. Drops about 42 unused packages and the drei version floor, and updates the 3 docs. The types stay 4 minors behind three, as they already are."
- Done with the bundled npm 11.20.0: `install -D --save-exact @types/three@0.183.1`, then `uninstall @react-three/drei`. package.json: `"@react-three/drei": "^10.7.9"` leaves dependencies, `"@types/three": "0.183.1"` joins devDependencies. A bundled `npm ci` from the new lockfile reproduces the tree (@types/three 0.183.1, three 0.187.0, no node_modules/@react-three/drei).
- Lockfile, 36 entries removed (drei plus 35 packages that existed only for it): @react-three/drei 10.7.9, @react-three/drei/node_modules/cross-env 7.0.3, @mediapipe/tasks-vision, @monogrid/gainmap-js, @types/draco3d, @types/offscreencanvas, @use-gesture/core, @use-gesture/react, bidi-js, camera-controls, detect-gpu, draco3d, glsl-noise, hls.js, immediate, is-promise, lie, maath, meshline, potpack, promise-worker-transferable, require-from-string, stats-gl, stats-gl/node_modules/three 0.170.0, stats.js, three-mesh-bvh, three-stdlib, three-stdlib/node_modules/fflate 0.6.11, troika-three-text, troika-three-utils, troika-worker-utils, tunnel-rat, tunnel-rat/node_modules/zustand 4.5.7, utility-types, webgl-constants, webgl-sdf-generator. None added.
- Lockfile, 13 entries changed, all metadata: the root entry (drei out of dependencies, @types/three in devDependencies), and `"dev": true` added to 12 entries. Six are @types/three and its own dependencies (@types/three, @types/stats.js, @tweenjs/tween.js, @webgpu/types, meshoptimizer, @dimforge/rapier3d-compat), which were prod only through drei. The other six are cross-spawn, isexe, path-key, shebang-command, shebang-regex and which, which drei's nested cross-env 7 kept in prod. `npm explain` now shows them reached only through the dev cross-env 10.1.0 and eslint. fflate 0.8.3 and @types/webxr stay prod (fast-png and @react-three/fiber still need them). No other entry changed.
- `scripts/guards/version-floors.json`: the `@react-three/drei` floor is dropped (guard:parity fails a floored package that is missing from the lockfile). No floor was added for @types/three. The guard checks only the packages listed in the file, so it does not require one.
- Docs: `.github/copilot-instructions.md` loses the drei bullet (the only drei mention), `.planning/PROJECT.md`'s tech stack now reads "Three.js with R3F 9.8", and `.planning/codebase/STACK.md` loses its drei line (that file lists no `@types/*` packages, so no @types/three line was added). Prettier's deviation count on the three already-dirty files is the same before and after (35, 193, 26 lines). Historical records are untouched (PROJECT.md's "THREE.TextureLoader over drei useTexture" decision row, milestones, debug/resolved, older SUMMARYs).
- Left for Tim: the `"fflate@^0.6.0": "0.6.11"` override in package.json and the `0.6.11` entry in the fflate floor list (`["0.6.11", "0.8.3"]`) now have nothing to match, because three-stdlib was the only 0.6 consumer. Both are harmless (a list floor fails only on a copy on an unfloored line, and the parity selftest fixtures carry their own floors file). They stay because removing them was not in scope.

### Gates (after `5356f9c`)

- Jest 2802/2802 (0 skipped or todo; 2802 to 2802). GUARD-03: jest 2802 + e2e 851 = 3653 against the 3024 baseline, OK. `npm run type-check`, `npm run lint` (all guards) and `check-snapshot-commit --none` (0 changed) are green. Prettier `--check --end-of-line auto` is clean on both touched files.
- Prod e2e (PW_PROD + PW_REUSE on a fresh `npm run build`), Chromium + Firefox: photos-lightbox, photos-stepping, photos-region, keyboard, home-canvas, home-modes, og, seo: **706/706 passed** (3.3 min). Local WebKit, the lightbox and stepping focus rows (`--grep focus`): 8/8 passed (the WR-01 Back rows are @no-win-webkit, so the local run drops them; CI Linux WebKit runs them).
- Client JS: **1,827,405 B** (21 files, `.next/static/chunks/**/*.js`), 202 B less than 1,827,607 and 28,436 B under the 1,855,841 B cap. `public/service-worker.js` was restored after the build, and port 3000 is free.
- No pixels changed. No PNG was staged, nothing was pushed, nothing was dispatched.

### Gates (after `ff477ab`)

- `npm run type-check` is clean, with no TS7016. Jest 2802/2802 (2802 to 2802). GUARD-03: jest 2802 + e2e 851 = 3653 against the 3024 baseline, OK. `npm run lint` (all guards, guard:parity included: "parity: OK") and `check-snapshot-commit --none` (0 changed) are green. Prettier `--check --end-of-line auto` is clean on package.json, package-lock.json and version-floors.json, with no new deviation in the three dirty docs.
- Client JS: **1,827,405 B** (21 files), unchanged, because drei was never bundled. `public/service-worker.js` was restored after the build and after the e2e run, and port 3000 is free.
- Prod e2e (PW_PROD on the fresh build), Chromium + Firefox: home-canvas, home-modes, og: **162/162 passed** (1.2 min).
- Home source untouched: `git diff --stat 769e1b8 -- lib/ascent components/home data/home-waypoints.ts` is empty.
