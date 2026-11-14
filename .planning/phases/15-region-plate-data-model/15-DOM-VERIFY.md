---
schema_version: 1
phase: 15
outcome: could_not_look
reason: browser_not_selected
checked: 0
passed: 0
failed: 0
needs_review: 0
---

# Phase 15 live-DOM verification (execute:wave:post, live-dom-uat)

The live-DOM step is advisory: it never blocks a wave. The orchestrator wrote this file, and
`gsd-dom-verifier` was not dispatched for any wave. Reasons:

- **Waves 1-7 (15-01 to 15-07)** have no criteria a browser can observe. They cover the type-check, the
  lint scan, the terrain builder, the plate registry, the photo map and `photos:exif`, and every
  acceptance check is a CLI, Jest or selftest row.
- **Waves 8 and later** claim "nothing visible changes", which a browser could check. A reachability
  probe on 2026-11-14, with a bare Node server on `localhost:3999` that curl reached, stopped before
  any navigation. Two Chrome browsers are connected to the claude-in-chrome extension ("Browser 1"
  and "Browser 2", both Windows), and none was selected for this session. Picking one needs Tim's
  answer, and this advisory step shouldn't stop the serial run to ask for it.
- **Lead for the Phase 14 `target_unreachable` result:** with two connected browsers, the Phase 14
  verifier may have driven a Chrome on a different machine, where `localhost` is not this one. That
  would explain why every loopback address failed while curl got 200. To check it, choose the
  browser on this PC with `select_browser`, then re-run a loopback probe.

## Per-wave record

| Wave | Plan | Browser-observable criteria | Result | Covering evidence |
|------|------|-----------------------------|--------|-------------------|
| 1 | 15-01 | none (type-check, Jest typing) | n/a | `npm run type-check` exit 0; Jest canary |
| 2 | 15-02 | none (test typing) | n/a | type-check; per-file Jest counts unchanged |
| 3 | 15-03 | none (lint scan, type-check) | n/a | `npm run lint` ends `test-count: scan OK`; Jest 1798/1798 |
| 4 | 15-04 | none (plate registry, `plates.ts`) | n/a | `terrain:build -- --check` OK; `plates.test.ts` 42 rows |
| 5 | 15-05 | none (N-plate builder) | n/a | `guard:selftest` 222/222 (3 terrain cases) |
| 6 | 15-06 | none (photo map, region registry) | n/a | `photos:build -- --check` OK; selftest 229/229 |
| 7 | 15-07 | none (`photos:exif` ids) | n/a | `photos:exif -- --check` OK; selftest 232/232 |
| 8 | 15-08 | Home footer ticks, trail sign and rail start are pixel-neutral | could_not_look / browser_not_selected | `home-waypoints.test.tsx` (4 ticks, "4 waypoints", 1,617 m first rail label); 15-09's two-engine e2e run |
| 9 | 15-09 | Home pixel-neutral after the rail-start removal | could_not_look / browser_not_selected | Playwright `PW_PROD=1` Chromium + Firefox, 230 passed, 0 flaky (15-09 SUMMARY) |
| 10 | 15-10 | photo links keep the same href (no URL string changes) | could_not_look / browser_not_selected | `photo-routes.test.ts` 34 rows; six photo-route specs `PW_PROD=1` Chromium, 152 passed |
| 11 | 15-11 | footer, poster, map sheet and light table zero visual diff | could_not_look / browser_not_selected | `renderToStaticMarkup(<SiteFooter />)` byte-identical (7,433 B, same sha256); ContourField mask-URL test; light-table specs Chromium 62 passed; Linux pixel gate is the CI visual job at 15-16 |
| 12 | 15-12 | none (telemetry guard, `.gitignore`, MP4 walker fixtures) | n/a | `guard:selftest` 250/250; `guard:images` OK |
| 13 | 15-13 | none (ci-gate rules 17-18, SafeCanvas comment) | n/a | `guard:ci` on real workflows; selftest 256/256; SafeCanvas Jest 10/10 |
| 14 | 15-14 | lightbox reveal (LBOX-08) correct for any `--nav-h` unit; SiteNav current-link close unchanged; no visual change | could_not_look / browser_not_selected | lightbox spec Chromium + Firefox 122 passed (incl. new browser-Back row in Firefox 8/8); shell spec 74; ENG-06 20; LBOX-08 17; Jest rem + clientHeight rows |
