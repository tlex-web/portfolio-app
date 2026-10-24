# Phase 08 Deferred Items

## Deferred Items

- Home overflows horizontally at 375 px (pre-existing, not caused by the footer)
  status: open
  **What:** On `/` at 375 x 812 the legacy v1 project card (`a.group block relative overflow-hidden rounded-2xl ...` with a `bg-gradient-to-br` child) ends at x = 399, so `document.documentElement.scrollWidth` is 399 against a `clientWidth` of 375. `/roadmap` and `/contact` measure 365 <= 375. Nothing inside the footer passes the viewport.
  **Found by:** 08-12 Task 3, while adding the SHELL-04 375 px no-horizontal-scroll check. That check is scoped to the footer on `/` and runs page-wide on `/roadmap`.
  **Owner:** Phase 9 (Home rebuild, which replaces these cards). Not fixed in 08-12: out of scope (scope boundary).
