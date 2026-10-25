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
