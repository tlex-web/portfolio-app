# Phase 09 Deferred Items

## Deferred Items

- README project tree still describes `app/page.tsx` as "Homepage with 3D mountain hero"
  status: open
  **What:** 09-02 removed the three deleted-component lines from the README structure block, as planned. The `page.tsx` comment on the same tree, and the tree's v1 `app/` layout without the `(site)` group, are stale but name no deleted file.
  **Found by:** 09-02 Task 2.
  **Owner:** Phase 12 (documentation pass, together with `.github/copilot-instructions.md`). Out of scope for 09-02 (scope boundary).

- `e2e/photos.spec.ts` "should switch to 3D carousel view" flaked once under a 54-test parallel dev-server run
  status: open
  **What:** In a combined run of home-ascent, photos, homepage, shell and design-system on chromium, the 3D carousel canvas never attached within 15 s and the browser logged the known React `removeChild ... not a child` error from the /photos grid/3D toggle (STATE, Phase 10 item from 07-19). `e2e/photos.spec.ts` alone passed 18/18 with `--repeat-each=3`, and 7/7 in the 09-03 Task 1 run. 09-03 only adds `id={image.slug}` to the grid buttons, which cannot remove a DOM node.
  **Found by:** 09-03 plan verification.
  **Owner:** Phase 10 (photos/lightbox rework, with the existing removeChild item). Out of scope for 09-03.

- `e2e/no-webgl.spec.ts` "home keeps its content" times out waiting for "Error creating WebGL context"
  status: resolved
  **What:** Since 09-01 made Home a Server Component, `/` mounts no canvas, so the console error the test awaits never fires and it fails after 15 s (09-RESEARCH Pitfall 1). Reproduced in the 09-06 Task 3 run; the other three tests in the spec pass with the helpers moved to `e2e/helpers/webgl.ts`. 09-06 adds no canvas (its pre-plan commit `bd16add` has none either) and keeps the test unchanged, as the plan requires.
  **Found by:** 09-06 Task 3.
  **Owner:** 09-07, which rewrites this test to assert static mode (`data-ascent-mode`) instead of a WebGL failure.
  **Resolved by:** 09-07 Task 3 (`3264177`): the test asserts `data-ascent-mode="static"`, the poster, no canvas, four cards, `#summit` and About; it passes in Chromium and Firefox.

- Hero scrim switches to the horizontal gradient at `lg:` (1024 px), not at 768 px as 09-UI-SPEC "Hero" specifies
  status: open
  **What:** `HeroBlock`'s `SCRIM` uses the vertical phone gradient up to 1023 px. At 768 x 1024 the kicker sits at about 71% of the hero height from the bottom, where the scrim is about 0.68 `surface`: above the 0.5 floor, but below the UI-SPEC's "at least 0.7 everywhere text can fall". The composed-contrast backstop (09-07 B7) still measures every hero text line at 6.84:1 or better at 768 px. Inside the 576 px block box of the kicker, beside its text, a contour index line measures 3.62:1. No glyph sits there, but it is the closest pixel to the floor. The UI-SPEC's own `md:` gradient would not help that pixel either: it fades to transparent at 75% of the width.
  **Found by:** 09-07 Task 3 (B7 diagnosis).
  **Owner:** 09-14 visual review (decide whether to align the breakpoint or amend the UI-SPEC row). 09-07 does not modify HeroBlock (scope boundary).

- Rail tick label "2,760 m approx." measures 4.81:1 at 768 px with the summit centred
  status: open
  **What:** 09-07's B8 backstop passes every tick (4.5 floor), but the Riffelsee label at 768 px is the closest to the floor (5.42:1 at 1440 px; the other ticks are 6.8 or better). The rail scrim is narrower than the label run at that width.
  **Found by:** 09-07 Task 3.
  **Owner:** 09-14 visual review; recheck after 09-08 puts the live canvas behind the rail (B8 samples the poster today).

- `fflate` 0.8.2 carries a moderate advisory (unzipSync infinite loop on malformed ZIP64), and fast-png now ships it in the canvas chunk
  status: open
  **What:** `npm audit` lists fflate 0.6.0-0.6.10 and 0.8.0-0.8.2 ("unzipSync can enter an infinite loop when parsing malformed ZIP64 archives", fixed in 0.8.3). 0.8.2 was already in the tree through `@types/three` (deduped); fast-png 8.0.0 (`"fflate": "^0.8.2"`) reuses it and imports only `Unzlib`, `unzlibSync` and `zlibSync`, never `unzipSync`, so the vulnerable path is unreachable from the heightmap decode. `three-stdlib` (drei) pins its own 0.6.10. A lockfile bump to fflate 0.8.3 needs `npm audit fix` or an override, which is a dependency decision outside 09-08's scope (07-07 rule: a version floor only when an advisory requires one).
  **Found by:** 09-08 Task 1 (`npm install fast-png@8.0.0 --save-exact`).
  **Owner:** Tim / the next dependency pass (Phase 12), or 09-13 if the bundle audit wants it.

- `e2e/no-webgl.spec.ts` "contact keeps the form" and "project detail keeps its content" timed out once under a 74-test parallel dev-server run
  status: open
  **What:** In a combined Chromium + Firefox run of home-ascent, no-webgl, homepage and design-system, both tests waited the full 15 s for three's "Error creating WebGL context" console message while `/contact` and `/projects/clix-cli` compiled for the first time. `e2e/no-webgl.spec.ts` alone passed 8/8 right after. 09-08 touches neither route (its code loads only in Home's lazy canvas chunk).
  **Found by:** 09-08 plan verification.
  **Owner:** CI runs on a production build, where there is no first-compile delay; revisit only if it reproduces there.

- R3F 9 logs "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead." on every canvas mount
  status: open
  **What:** `@react-three/fiber` creates `new THREE.Clock()` in its store (events-9ce18a08.esm.js:1054), and three 0.184 deprecates Clock. The warning appears in the dev-server browser log for every canvas, including the Home terrain canvas since 09-08. It is a library warning, not an error, and comes from no project file.
  **Found by:** 09-08 Task 3 run.
  **Owner:** the next R3F upgrade (watch for a release that switches to THREE.Timer).

- The canvas chunk arms before the load event on the HOME-08 profile and holds that event back by about 1.5 s
  status: open
  **What:** In the 09-09 local production probe (Pixel 7, 4x CPU, 150 ms, 200000 B/s), `requestIdleCallback` arms the stage at about 3.1 s, while the hillshade AVIF is still downloading. The dynamically inserted chunk scripts (`three`/R3F 241,953 B, mesh/shader/fast-png 17,583 B, a 474 B stub) then hold the `load` event until they finish: loadEventStart was 4856 ms, and the three/R3F chunk's responseEnd was 4684 ms. LCP is unaffected (3084 ms locally, because canvases are never LCP candidates), and HOME-08 judges LCP and script bytes, not the load event. One consequence: by the plan's boundary (startTime before loadEventStart) the lazy chunk counts as "initial", so `initialJsTransferBytes` equals `totalJsTransferBytes` and `lateScripts` is empty. The perf JSON's `scriptTimeline` and per-sample `loadEventStartMs` still show the chunk.
  **Found by:** 09-09 Task 2 early HOME-08 signal.
  **Owner:** Tim at the 09-13 Task 3 gate choice: "gate on initial bytes" measures the same as total under this boundary. Moving the arm after `load` (TerrainStage) or adding an arm mark would make the split meaningful; either is a behaviour or product-code change outside 09-09.

- The summit frame at 1440 px puts 3D pins 1 and 2 behind the summit plaque
  status: resolved
  **What:** With `#summit` centred at 1440 x 900, the look-back camera (450 m SW of and 350 m above the summit, aimed at the waypoint centroid) projects Zermatt and Gornerschlucht at NDC x -0.30 and -0.19, about x 504 and 583 px. The summit plaque card spans about x 172-618 px there, so both pins are covered (still inside the stage, so the 'summit frame shows every waypoint' e2e passes). Pins 3 and 4 show to the right of the plaque. Levers (constants only): aim the summit target a little west of the centroid, or add a wide-stage horizontal view offset at the summit like the narrow one (`VIEW_OFFSET_X_SHARE`), so the waypoints sit right of the plaque.
  **Found by:** 09-10 visual check after Task 3.
  **Owner:** Tim at the 09-12 render review (tuning constants).
  **Resolution:** 09-12 `fc24d57` (Tim: "Fix in 09-12 (Recommended)"). Wide stages widen the summit FOV to 75° and shift the summit framing right (`SUMMIT_VIEW_OFFSET_X_SHARE` 0.095), and narrow stages lift it (`SUMMIT_VIEW_OFFSET_Y_SHARE` 0.08). All four pins now clear the plaque at 1280 x 720, 1440 x 900, 1920 x 1080, 375 x 812 and 412 x 839, guarded by the e2e 'summit pins clear the plaque'.

- A small dark wedge at the bottom edge of the 1440 px summit frame
  status: open
  **What:** About 70 x 40 px near x 400-460 px, y 860 px at 1440 x 900 with `#summit` centred, darker than the surrounding relief. The summit peak sits about 38° below the camera, right at the frame's bottom edge (half vertical FOV 18.5° plus about 20° of pitch), so this is most likely the peak's steep faces seen from just above, or the contour merge fade on them. It is not seen at 412 px (wider FOV).
  **Found by:** 09-10 visual check after Task 3.
  **Owner:** Tim at the 09-12 render review (`SUMMIT_LIFT_M`, `SUMMIT_PULLBACK_M`), then 09-14.
  **09-12 note:** Tim kept the defaults (pull-back 450 m). The wider desktop summit FOV from the plaque fix (75° horizontal, about 51° vertical at 1440 x 900) brings the summit marker and the peak's dark faces further into the bottom of the frame: a dark mass of about 200 x 135 px near x 560-760, y 765-900 at 1440 x 900. See the scratchpad render summit-fixed-1440.png. This is for the 09-14 visual review.

- After the 09-12 plaque fix, summit pins still sit behind the plaque at some sizes where the plaque fills most of the stage
  status: open
  **What:** The summit pins are measured on the dev server with SwiftShader and `#summit` centred.
  - 375 x 667: all four pins overlap. The docked plaque column spans y 121-659 of the stage, which leaves no clear area above it.
  - 820 x 1180 (portrait tablet, wide rig): pins 1-3 overlap. The centred plaque spans y 383-861, and the clear band to its right (x 472-586) is narrower than a pin cluster.
  - 768 x 1024: pin 3 overlaps. In Playwright the stage is narrower than 768 px (the scrollbar), so the rig uses the narrow offsets while the CSS uses the centred `md` plaque.
  - 1024 x 768: pin 1 touches the plaque's right edge by 2 px, and pin 4's right edge is 13 px under the rail scrim. The band there is about 0.6 NDC wide.

  The first two match the pre-fix measurement with the 09-12 constants set to neutral, so they are not regressions. The static poster at the summit is clear at 1280 px and up. Below that, its fixed plan-view pins sit under the docked or centred plaque: 3 pins at 375, 2 at 412, and 1 at 768 and 1024. That is the D-20 docked layout, not camera framing.
  **Found by:** 09-12 plaque fix, size sweep.
  **Owner:** Tim. Fixing these needs a plaque layout decision, for example a compact summit plaque on short or portrait stages, or a framing that fits the pins above a centred plaque. It is outside the 09-12 camera-only scope.
  **Decision (2026-10-25, after 09-12):** Tim answered "Gap plan after 09-14". Close Phase 9 as planned, then fix this through `/gsd-plan-phase 09 --gaps` if UAT flags it. The Home baselines may need one more re-baseline afterwards.
