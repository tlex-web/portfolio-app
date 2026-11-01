# Phase 11 Deferred Items

## Deferred Items

- README.md project tree still lists `components/HologramTerminal.tsx` and `components/HologramTerminalDemo.tsx` (lines 194-195), deleted in 11-01 (cf369b5)
  status: open
  **What:** Documentation only; no Phase 11 plan owns the README tree. Fold into the Phase 12 dead-code and README pass (same class as the Phase 9 README tree item in `.planning/phases/09-home-ascent/deferred-items.md`).
- Dev server returns HTTP 500 instead of 404 for `/projects/no-such-slug` under parallel Playwright load (found in 11-01)
  status: open
  **What:** Seen once in a `--repeat-each=4` dev run of `e2e/case-study.spec.ts`; never on the production build (55/55 chromium, 15/15 firefox, 22/22 with 16 workers). Same class as the Phase 10 dev-server flakes in `.planning/phases/10-photography/deferred-items.md`. A cold-compile remount on a fresh dev server also reset the terminal once mid-test. CI runs a production build, so this does not affect CI.
