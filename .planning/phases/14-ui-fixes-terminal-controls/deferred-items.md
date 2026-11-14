# Phase 14 Deferred Items

## Deferred Items

- Escape from the open mobile menu scrolls the page up when the page is scrolled down
  status: open
  **Found during:** 14-01 Task 1 (SHELL-07 browser row, 2026-11-14)
  **What:** the menu's Escape handler (`components/site/SiteNav.tsx`, `onKeyDown`) calls `buttonRef.current?.focus()` without `preventScroll`. The global `:where(*) { scroll-margin-top: calc(var(--nav-h) + 16px) }` rule in `app/globals.css` gives the sticky Menu button an 80 px scroll margin, so focusing it "reveals" it by scrolling: measured at 375 x 812 on `/roadmap` scrolled to 600, a plain `focus()` moves `scrollY` to 530 in Chromium and to 185.5 in Firefox. The SHELL-07 tap close uses `focus({ preventScroll: true })` for this reason (D-16 keeps the scroll). Escape predates Phase 14 and no requirement covers its scroll position, so it was left unchanged (scope boundary).
  **Fix when owned:** the same one-word change (`focus({ preventScroll: true })`) in the Escape handler, plus a scroll assertion on the existing "Escape closes to the button" e2e row. Owner: Tim to decide (a quick task, or fold into a Phase 14 plan that already touches SiteNav).
