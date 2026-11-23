---
schema_version: 1
phase: 16
outcome: could_not_look
reason: not_dispatched
checked: 0
passed: 0
failed: 0
needs_review: 0
---

# Phase 16 live-DOM verification (execute:wave:post, live-dom-uat)

The live-DOM step is advisory and never blocks a wave. The orchestrator wrote this file. `gsd-dom-verifier` was not dispatched for any wave, so no browser was opened and nothing below was observed in a live DOM:

- **Waves 1-11:** the orchestrator ran plans one after another across three sessions on 2026-11-23. It recorded the step for phase close rather than stopping a wave for it. This followed the Phase 15 record, where two connected Chrome browsers with none selected blocked the step.
- **Phase close:** the run resumed at the phase gates (`resume-at-gates`, #2868). That route skips `execute_waves`, and the wave:post hooks with it.
- **The Phase 15 blocker is gone:** at close, `list_connected_browsers` showed one browser, "Browser 1" (Windows, `isLocal: true`, `inUse: true`). A live-DOM pass is therefore possible now. It would need a production build served locally and one `gsd-dom-verifier` dispatch.
- **Phase scope:** Phase 16 is `**UI hint**: no` and pixel-neutral by D-15/D-25. New photos, plates and the overview are data only until Phase 18. Every browser-observable claim below is a "nothing visible changes" claim, and the strongest evidence for it is the Linux pixel gate: Visual Regression on `ci/16-18`.

## Per-wave record

| Wave | Plans | Browser-observable criteria | Result | Covering evidence |
|------|-------|-----------------------------|--------|-------------------|
| 1 | 16-01, 16-02 | none (extraction rules, selftest fixtures, overview spike) | n/a | `guard:selftest` 276/276 with the `privacy:` cases (16-01); spike measurements recorded in 16-OVERVIEW-SPIKE.md (16-02) |
| 2 | 16-03, 16-04, 16-05 | /photos, photo routes, sitemap and saved pages stay at the v2.0 four; footer unchanged | not dispatched | `region-series`, `photo-routes`, `photos-view-model`, `audit-routes` and `saved-pages` Jest suites; `client-graph.test.ts` (16-05); Playwright list check for the IN-03 row (16-04) |
| 3 | 16-06, 16-07, 16-08 | the four current photos print the same coordinate and height strings; sheets and legend unchanged | not dispatched | `home-format`, `strip`, `photos-view-model`, `map` and `ascent-waypoints` Jest suites (16-06); Jest 1,945/1,945 and `client-graph.test.ts` (16-07); 16-08 changed no code |
| 4-7 | 16-09 to 16-13 | none (proj4 in scripts, plate model, fetchers, Saalfelden plate, overview source) | n/a | selftest 278 → 286; `terrain:build -- --check` OK; `plates.test.ts`, `terrain.test.ts` and `overview.test.ts` |
| 8 | 16-14 | the five new photos stay off /photos and the light table | not dispatched | `region-series` and `photo-routes` suites pinned at the four ids; `photos:build -- --check` OK |
| 9 | 16-15 | none (server-only overview module, no route) | n/a | `overview.test.ts`; `client-graph.test.ts` keeps the overview off the client graph |
| 10-11 | 16-16, 16-17 | the Ortler photos stay off /photos | not dispatched | the same light-table suites; selftest 290/290 |
| 12 | 16-18 | no visual change across the phase | not dispatched | Playwright `PW_PROD=1` on one production build: 341 passed (Chromium 180, Firefox 161); `ci/16-18` run 45188005124: E2E success and Visual Regression PASS with no baseline update; `check-snapshot-commit --none` over 72 commits |
