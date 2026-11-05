---
phase: 10-photography
fixed_at: 2026-10-26T18:57:00Z
review_path: .planning/phases/10-photography/10-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 10: Code Review Fix Report

**Fixed at:** 2026-10-26T18:57:00Z
**Source review:** .planning/phases/10-photography/10-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (CR-01, WR-01; Tim chose "Fix CR-01 + WR-01 now", IN-01..IN-10 stay open)
- Fixed: 2
- Skipped: 0

## Fixed Issues

### CR-01: On the photo page, the viewer's document key handlers catch keys meant for the site nav; Escape to close the mobile menu also leaves the photo

**Files modified:** `components/site/SiteNav.tsx`, `components/photos/PhotoViewer.tsx`, `components/photos/ZoomStage.tsx`, `e2e/photos-lightbox.spec.ts`
**Commit:** 0419e95
**Status:** fixed: requires human verification (key-handling logic)
**Applied fix:**
- SiteNav: the open menu's Escape listener now runs in the document capture phase and calls `preventDefault`. A new export, `keyBelongsToChrome(event)`, returns true while the mobile menu is open (`#site-menu` not hidden) or when the press comes from outside `<main>` (skip link, nav, footer). A press with nothing focused (the body) still counts as the page's.
- PhotoViewer (page surface): the Escape-to-/photos handler, the callout Escape layer, ← →, Z and H all skip presses where `keyBelongsToChrome` is true. ZoomStage skips them too on the page (the zoomed pan and Escape). The modal surface is unchanged, because the dialog makes the chrome inert.
- Regression e2e (`Focus and Escape` › "on the photo page at 375, the open nav menu keeps its keys…"): first checks that the viewer keys work, then opens the menu with the keyboard and tabs into it. With focus in the menu, ←, →, Z and H do not step the photo or write the label preference. Escape closes only the menu, puts focus on its button and starts no navigation. To check that, the test records the client-side navigation request (an RSC fetch that is not a prefetch), which `router.push` starts inside the key handler, so the read is exact and needs no sleep. Afterwards a step from the content still works, no history entry was added, and Escape from the content still goes to /photos (the recorder sees it, which shows the recorder works).
- Red before the fix, on chromium and firefox: the arrow presses in the menu stepped the photo, and with the key loop disabled, Escape in the menu started a navigation to `/photos` (3 of 3 runs on each engine).

### WR-01: A browser-Back close (the Android back gesture) uses a slug that may be lagging for focus return and the carousel's front photo

**Files modified:** `components/photos/LightboxDialog.tsx`, `components/photos/PhotoViewer.tsx`, `components/photos/CarouselView.tsx` (doc comment only), `components/photos/__tests__/lightbox-dialog.test.tsx`, `e2e/photos-lightbox.spec.ts`, `e2e/photos-carousel.spec.ts`
**Commit:** 685e3d4
**Status:** fixed: requires human verification (focus/state logic)
**Applied fix:**
- `LightboxApi.setShown(slug)` stores the shown slug. `PhotoViewer.step()` calls `lightbox?.setShown(slug)` right after `history.replaceState` (still replaceState, as Tim answered in OQ1). The dialog no longer has its `usePathname` effect: it reads the pathname only on mount.
- After a real unmount (the existing `dialog.isConnected` check in the focus microtask) that did not go through `close()`, the dialog dispatches `LIGHTBOX_CLOSE_EVENT` with the shown slug inside `flushSync`. The carousel therefore renders the shown photo before `restoreFocus` looks for its `[data-photo-id]`. StrictMode's simulated unmount still does nothing.
- Regression tests: a jsdom case where `usePathname` is mocked to stay on the opened photo, a step is made, then the dialog unmounts without `close()`. The test checks the close event carries the stepped slug and focus lands on that tile. There are also two e2e cases that step and call `history.back()` in the same task: the grid case checks focus on the stepped tile, and the carousel stepper case checks `data-active-slug`, the counter and focus on Open photo.
- Red before the fix: all three e2e instances failed on chromium and firefox (focus and the front photo stayed on the first photo), and the jsdom case failed.

## Verification

- All gates ran **in the isolated worktree** (`.claude/worktrees/rf-10-54985-1793039670`, its own `npm ci`, a real `node_modules` directory and not a junction). They cannot be reproduced from that tree after teardown. Re-run them in the main checkout after the fast-forward if needed.
- `npm run type-check`: clean. `npm run lint` (eslint plus every guard and data check): exit 0. `npx jest --silent`: 63 suites, 943 tests passed (942 before, plus 1 new).
- Playwright ran against a local production build (`npm run build` then `npm run start`; Playwright reused that server; `public/service-worker.js` restored with `git checkout` after each build and never committed):
  - The new CR-01 and WR-01 cases passed 5 times in a row on chromium and firefox (30/30).
  - photos-lightbox, photos-carousel, shell, design-system, photos-sweep and photos specs: 294/294 on chromium and firefox.
  - The full functional suite (all non-visual projects except webkit): 567/567 on chromium and firefox.
- WebKit was not run (local WebKit cannot hydrate localhost). Visual baselines were not run, regenerated or touched, and no PNGs were staged.
- New tests were added; none were skipped (`scripts/guards/test-count.mjs` does not allow skips). The test-count baseline is a floor, so it was not changed.

---

_Fixed: 2026-10-26T18:57:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
