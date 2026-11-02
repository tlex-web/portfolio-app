# Phase 11 Deferred Items

## Deferred Items

- README.md project tree still lists `components/HologramTerminal.tsx` and `components/HologramTerminalDemo.tsx` (lines 194-195), deleted in 11-01 (cf369b5)
  status: open
  **What:** Documentation only; no Phase 11 plan owns the README tree. Fold into the Phase 12 dead-code and README pass (same class as the Phase 9 README tree item in `.planning/phases/09-home-ascent/deferred-items.md`).
- Dev server returns HTTP 500 instead of 404 for `/projects/no-such-slug` under parallel Playwright load (found in 11-01)
  status: open
  **What:** Seen once in a `--repeat-each=4` dev run of `e2e/case-study.spec.ts`; never on the production build (55/55 chromium, 15/15 firefox, 22/22 with 16 workers). Same class as the Phase 10 dev-server flakes in `.planning/phases/10-photography/deferred-items.md`. A cold-compile remount on a fresh dev server also reset the terminal once mid-test. CI runs a production build, so this does not affect CI.
- README.md still names `components/RoadmapFilters.tsx` in its project tree (line 201) and describes v1 `RoadmapItem` entries (line 333); the file was deleted in 11-10 and `data/types.ts` `RoadmapItem` is unused (found in 11-10)
  status: open
  **What:** Documentation and dead type only, no importer. Fold into the 11-18 / Phase 12 cleanup with the other README tree items. 11-18 (dd0c55d) deleted the `data/types.ts` `RoadmapItem`; only the README half stays open.
- Dev server: `e2e/shell.spec.ts` "every route credits the source with site.attribution.terrain" times out (30 s) at `page.goto('/projects/box')` on chromium when run together with `e2e/roadmap.spec.ts` under default workers (found in 11-10)
  status: open
  **What:** Cold dev compiles of every route inside one 30 s test under parallel load; passes alone on dev (20.7 s) and 118/118 on the production build (`PW_PROD=1`, both browsers). The route is before /roadmap in the list and untouched by 11-10. CI runs a production build with one worker, so CI is unaffected; a `test.slow()` or per-route timeout would harden local dev runs.
- README.md still lists `README_CLIX.md` and `README_CLIX_WEBSITE.md` as CLI_X project docs (lines 222-223), and the unimported legacy `components/Footer.tsx` still links 'CLI_X Tool' and 'CLI_X Website' to the removed `/projects/clix-cli` and `/projects/clix-website` routes (lines 65-66) (found in 11-18)
  status: open
  **What:** Outside 11-18's files and its acceptance greps (README.md and components/Footer.tsx are neither project-side paths nor in the plan); nothing imports Footer.tsx, so no rendered page links to the 404s. 11-17 already lists both for Phase 12; fold into the Phase 12 dead-code and README pass (delete Footer.tsx, drop the two README rows).
- Dev server: `e2e/case-study.spec.ts` "Demo (ENG-05) › Pause is sticky: nothing advances until it is pressed again (D-02)" failed once on chromium (after resume, `data-command` still "1" at the 8 s timeout) in a 110-test chromium + firefox dev run (found in 11-19)
  status: open
  **What:** Timing under parallel dev load in the box Demo terminal, which 11-19 does not touch (11-19 changes only the Metrics source links). Passed 4/4 alone with `--repeat-each=4` and 110/110 on the immediate full re-run. Same class as the other dev-server flakes above; CI runs a production build with one worker. A longer resume timeout or a `test.slow()` would harden local dev runs.
