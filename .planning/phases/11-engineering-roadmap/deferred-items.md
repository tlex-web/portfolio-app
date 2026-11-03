# Phase 11 Deferred Items

## Deferred Items

- README.md project tree still lists `components/HologramTerminal.tsx` and `components/HologramTerminalDemo.tsx` (lines 194-195), deleted in 11-01 (cf369b5)
  status: resolved
  **What:** Documentation only; no Phase 11 plan owns the README tree. Fold into the Phase 12 dead-code and README pass (same class as the Phase 9 README tree item in `.planning/phases/09-home-ascent/deferred-items.md`).
  **12-22 (executor outcome):** fixed in `dcfcd71`. The README tree is rewritten from `git ls-files`; no HologramTerminal file is named.

- Dev server returns HTTP 500 instead of 404 for `/projects/no-such-slug` under parallel Playwright load (found in 11-01)
  status: resolved
  **What:** Seen once in a `--repeat-each=4` dev run of `e2e/case-study.spec.ts`; never on the production build (55/55 chromium, 15/15 firefox, 22/22 with 16 workers). Same class as the Phase 10 dev-server flakes in `.planning/phases/10-photography/deferred-items.md`. A cold-compile remount on a fresh dev server also reset the terminal once mid-test. CI runs a production build, so this does not affect CI.
  **12-22 (executor outcome): closed.** Since 12-02 the proxy decides an unknown `/projects/<slug>` before the `[slug]` route renders (rewrite to `/__missing`, then the neutral loopback self-fetch; `.planning/debug/12-slug-script-data.md`), so the cold `[slug]` compile that answered 500 is no longer on this path. Not reproduced on a fresh dev server: `npx playwright test e2e/case-study.spec.ts -g "/projects/no-such-slug: HTTP 404" --project=chromium --repeat-each=5` gave "5 passed (15.2s)"; the whole file with `--repeat-each=5` gave "180 passed (2.2m)"; and the four-spec dev-server run `npx playwright test e2e/case-study.spec.ts e2e/photos-lightbox.spec.ts e2e/photos.spec.ts e2e/no-webgl.spec.ts --project=chromium --repeat-each=3` (16 workers): "375 passed (4.4m)".

- README.md still names `components/RoadmapFilters.tsx` in its project tree (line 201) and describes v1 `RoadmapItem` entries (line 333); the file was deleted in 11-10 and `data/types.ts` `RoadmapItem` is unused (found in 11-10)
  status: resolved
  **What:** Documentation and dead type only, no importer. Fold into the 11-18 / Phase 12 cleanup with the other README tree items. 11-18 (dd0c55d) deleted the `data/types.ts` `RoadmapItem`; only the README half stays open.
  **12-22 (executor outcome):** fixed in `dcfcd71`. The tree names `components/roadmap/` (route log, filters, rows), and "Updating the Roadmap" shows the committed `box-v2` row against `data/schemas/roadmap.ts` instead of the v1 `RoadmapItem` (no `priority`, no `cli`/`frontend` areas).

- Dev server: `e2e/shell.spec.ts` "every route credits the source with site.attribution.terrain" times out (30 s) at `page.goto('/projects/box')` on chromium when run together with `e2e/roadmap.spec.ts` under default workers (found in 11-10)
  status: open, owner follow-up after Phase 12 (orchestrator will offer Tim a quick plan)
  **What:** Cold dev compiles of every route inside one 30 s test under parallel load; passes alone on dev (20.7 s) and 118/118 on the production build (`PW_PROD=1`, both browsers). The route is before /roadmap in the list and untouched by 11-10. CI runs a production build with one worker, so CI is unaffected; a `test.slow()` or per-route timeout would harden local dev runs.
  **12-22 (executor outcome):** reproduced, not fixed here: `e2e/shell.spec.ts` is outside 12-22's file list. On a fresh dev server `npx playwright test e2e/shell.spec.ts -g "every route credits the source" --project=chromium --repeat-each=5` gave "5 failed": each copy cold-compiles all eight ROUTES inside one 30 s test and times out at `page.goto('/offline')`. The same test passed in `npx playwright test e2e/shell.spec.ts e2e/roadmap.spec.ts --project=chromium` ("59 passed (50.3s)"), and CI runs a production build with one worker. Exact fix: add `test.slow();` as the first line of that test (`e2e/shell.spec.ts:402`), with a comment that it makes eight full page loads; no assertion changes. Proof after the fix: the same `-g` run, 5 passed.

- README.md still lists `README_CLIX.md` and `README_CLIX_WEBSITE.md` as CLI_X project docs (lines 222-223), and the unimported legacy `components/Footer.tsx` still links 'CLI_X Tool' and 'CLI_X Website' to the removed `/projects/clix-cli` and `/projects/clix-website` routes (lines 65-66) (found in 11-18)
  status: resolved
  **What:** Outside 11-18's files and its acceptance greps (README.md and components/Footer.tsx are neither project-side paths nor in the plan); nothing imports Footer.tsx, so no rendered page links to the 404s. 11-17 already lists both for Phase 12; fold into the Phase 12 dead-code and README pass (delete Footer.tsx, drop the two README rows).
  **12-22 (executor outcome):** both halves are done. `components/Footer.tsx` was deleted in 12-04 (`6d725dc`, VERIFY-01). The README rows went in `dcfcd71`: the tree no longer lists `project_concept/` (gitignored, `.gitignore:90`, left unchanged) or the CLI_X docs.

- Dev server: `e2e/case-study.spec.ts` "Demo (ENG-05) › Pause is sticky: nothing advances until it is pressed again (D-02)" failed once on chromium (after resume, `data-command` still "1" at the 8 s timeout) in a 110-test chromium + firefox dev run (found in 11-19)
  status: resolved
  **What:** Timing under parallel dev load in the box Demo terminal, which 11-19 does not touch (11-19 changes only the Metrics source links). Passed 4/4 alone with `--repeat-each=4` and 110/110 on the immediate full re-run. Same class as the other dev-server flakes above; CI runs a production build with one worker. A longer resume timeout or a `test.slow()` would harden local dev runs.
  **12-22 (executor outcome): closed, not reproduced.** `npx playwright test e2e/case-study.spec.ts -g "Pause is sticky" --project=chromium --repeat-each=5` on a fresh dev server gave "5 passed (25.7s)"; the whole file with `--repeat-each=5` gave "180 passed (2.2m)"; and the four-spec dev-server run `npx playwright test e2e/case-study.spec.ts e2e/photos-lightbox.spec.ts e2e/photos.spec.ts e2e/no-webgl.spec.ts --project=chromium --repeat-each=3` (16 workers): "375 passed (4.4m)". The one failure (no advance within 8 s after the resume) came from dev-server load, which CI's production single-worker run does not have. No timeout was raised: a longer resume window would also hide a real resume regression, and the failure could not be reproduced to show that it would help.
