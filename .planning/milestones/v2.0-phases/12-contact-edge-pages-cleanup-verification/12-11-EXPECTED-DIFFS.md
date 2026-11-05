# Phase 12 Plan 11: Round 1 expected diffs

Written and committed before the round-1 `visual-baselines` dispatch on `ci/12-11` (D-27, threat T-12-23). The commit that adds this file comes before the run id recorded in 12-11-SUMMARY.md. The SUMMARY copies this list verbatim under `## Round 1 expected diffs`. (The orchestrator holds SUMMARY.md until the plan completes, so the list is committed here first.)

Source: 12-07-SUMMARY.md `## Round 1 expected diffs (for 12-11)` and `## D-24 Phase 9 dispositions`, plus the wave 1 and 2 summaries' zero-pixel claims.

Snapshots: `e2e/visual/routes.spec.ts-snapshots/<slug>/<width>-<mode>-visual-dark-linux.png`, 48 files. Comparator threshold 0.01, so `update_mode=changed` captures every real change.

## Expected to change (or allowed to change)

| Slug | Width | File | Reason | Expectation |
|------|-------|------|--------|-------------|
| roadmap | 375 | `375-reduced` | Route-log kicker date `1 Nov 2026` -> `2 Nov 2026` (`surveyedAt` 2026-11-01 -> 2026-11-02, 12-07 / 12-01 log.phase11). The closed `Phases 7–12` disclosure label does not change, and the camp marker moved 0 px (12-07 measurement) | change expected |
| roadmap | 768 | `768-reduced` | same | change expected |
| roadmap | 1440 | `1440-reduced` | same | change expected |
| box | 375 | `375-reduced` | EndBlock plate loses `py-3` (12-07, D-24). The sign is already 56 px from `min-h-14`, so likely zero or a few pixels. DemoTerminal `[grid-area:1/1]` (same as `col-start-1 row-start-1`) and the Metrics aria-label (replaces a 1 x 1 sr-only span) should give zero | may change (zero allowed) |
| box | 768 | `768-reduced` | same | may change (zero allowed) |
| box | 1440 | `1440-reduced` | same | may change (zero allowed) |
| coin-flip | 375 | `375-reduced` | EndBlock plate loses `py-3` only (no HEADS sentence: copy.heads-sentence not supplied, "heads skip") | may change (zero allowed) |
| coin-flip | 768 | `768-reduced` | same | may change (zero allowed) |
| coin-flip | 1440 | `1440-reduced` | same | may change (zero allowed) |

## Expected unchanged (any diff here is a regression: stop, report, copy nothing)

| Slug | Files | Why no change is expected |
|------|-------|---------------------------|
| home | `{375,768,1440}-reduced`, `{375,768,1440}-ascent-{start,waypoint-2,summit}` (12) | Tim kept defaults #10 to #12 (12-07 dispositions: scrim spec amended, wedge closed as terrain, rail tick accepted; no code change). 12-06 moved only when the canvas arms, and canvases are hidden in baselines. If Home differs, it is reported as unexpected, not explained away |
| photos | `{375,768,1440}-reduced` | 12-05 removed legacy v1 images only; the hashed derivatives are byte-identical |
| photos-grid | `{375,768,1440}-reduced` | same |
| photos-carousel | `{375,768,1440}-reduced` | same |
| photo | `{375,768,1440}-reduced` | same |
| lightbox | `{375,768,1440}` | same |
| projects | `{375,768,1440}-reduced` | 12-04 alias and dead-CSS removal plus the `--color-*: initial` reset: the compiled-selector diff shows only deleted CSS |
| contact | `{375,768,1440}-reduced` | 12-03 is API-only; 12-04 as above |
| offline | `{375,768,1440}-reduced` | 12-08 changed SW caching only |
| not-found | `{375,768,1440}-reduced` | 12-02 left the generic 404 classes and copy unchanged; the baseline URL `/__no-such-page__` keeps the generic links |

Also zero-pixel by their own summaries: 12-09 (head-only metadata, sitemap, robots), 12-10 (OG image routes, not rendered in any page). No PNG may be added or deleted.
