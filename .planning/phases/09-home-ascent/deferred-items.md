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
