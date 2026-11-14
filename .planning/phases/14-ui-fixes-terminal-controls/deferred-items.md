# Phase 14 Deferred Items

## Deferred Items

- Escape from the open mobile menu scrolls the page up when the page is scrolled down
  status: open
  **Found during:** 14-01 Task 1 (SHELL-07 browser row, 2026-11-14)
  **What:** the menu's Escape handler (`components/site/SiteNav.tsx`, `onKeyDown`) calls `buttonRef.current?.focus()` without `preventScroll`. The global `:where(*) { scroll-margin-top: calc(var(--nav-h) + 16px) }` rule in `app/globals.css` gives the sticky Menu button an 80 px scroll margin, so focusing it "reveals" it by scrolling: measured at 375 x 812 on `/roadmap` scrolled to 600, a plain `focus()` moves `scrollY` to 530 in Chromium and to 185.5 in Firefox. The SHELL-07 tap close uses `focus({ preventScroll: true })` for this reason (D-16 keeps the scroll). Escape predates Phase 14 and no requirement covers its scroll position, so it was left unchanged (scope boundary).
  **Fix when owned:** the same one-word change (`focus({ preventScroll: true })`) in the Escape handler, plus a scroll assertion on the existing "Escape closes to the button" e2e row. Owner: Tim to decide (a quick task, or fold into a Phase 14 plan that already touches SiteNav).

- Desktop Chromium at 375 px wraps the terminal's command bar to two rows
  status: open
  **Found during:** 14-05 Task 2 (the 375 px one-row e2e row, 2026-11-14)
  **What:** `html` has `scrollbar-gutter: stable` with `scrollbar-width: thin`, so desktop Chromium reserves a 10 px gutter at a 375 px window: the terminal frame is 333 px, not the 343 px 14-UI-SPEC "Width at 375 px" measured, and the bar has 299 px inside, not 311. Previous, four dots and Next need 304 px, so the dot row wraps 3 + 1 inside a 97 px bar (Previous and Next stay centred, nothing scrolls sideways; the spec's own wrap rule). Phones draw overlay scrollbars and get the one 48 px row; Firefox here draws no gutter. The e2e one-row check runs as a phone (`isMobile` in Chromium), and a desktop row asserts the wrap rule.
  **Why it matters:** the Chromium case-study 375 px visual baseline (14-08) will show the two-row bar.
  **Options (Tim to decide):** (a) keep the locked spec, accept the desktop-narrow wrap; (b) bar `gap-2` to `gap-1` (296 px, 3 px slack); (c) dot row `gap-2` to `gap-1` (292 px, 7 px slack); (d) both (284 px). Each is one class token in `components/projects/DemoTerminal.tsx`.
