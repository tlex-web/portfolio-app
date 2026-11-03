---
phase: 08
review: 08-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: deferred
    title: "The full-resolution originals with complete GPS EXIF are in the public repository's git history"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "A photo outside the DEM extent gets a clamped edge height and an out-of-band UV, with no error"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "`gpsOf` drops a valid latitude and longitude when `GPSAltitude` is missing"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "`offsetTimeOriginal` is extracted but ignored, so every capture is assumed to be in Europe/Zurich"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "`formatExposureTime` prints wrong shutter speeds between 0.25 s and 1 s, and for 0"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "The `photos:derive` write mode is not atomic, although its header says it is"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "Privacy guard coverage gaps: raw and HEIF formats, post-push only, narrowed ignore"
  - id: WR-07
    severity: warning
    disposition: fixed
    title: "`scripts/README.md` misses the `photos:build` stage, so the documented photo workflow fails CI"
  - id: WR-08
    severity: warning
    disposition: fixed
    title: "Corrections can label a hand-typed position as an exact EXIF position"
  - id: IN-01
    severity: info
    disposition: deferred
    title: "Hashed static assets are now served with no CSP at all"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "The legacy bridge drops `position.approximate`"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "An ambiguous fall-back hour fails even when GPS UTC could resolve it"
  - id: IN-04
    severity: info
    disposition: deferred
    title: "`openRuns` does not join the first and last runs across the ring seam"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "Originals named `.jpeg` are skipped without a message"
  - id: IN-06
    severity: info
    disposition: skipped
    title: "`Object.keys(project.highlights)` on a tuple array"
  - id: IN-07
    severity: info
    disposition: skipped
    title: "Demo command 4 says \"High-risk operation\" but its level is `critical`"
  - id: IN-08
    severity: info
    disposition: skipped
    title: "Unreferenced legacy variants are still served"
  - id: IN-09
    severity: info
    disposition: skipped
    title: "`LegacyUrl` accepts `..`"
open: 0
total: 18
recorded: 2026-10-24T20:22:34.612Z
---

# Phase 08: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | deferred | Accepted risk D-12 (Tim, 08-CONTEXT): history exposure at 287c2e9/347d8e1/8fa0991 accepted, no rewrite or force-push; filter-repo purge remains a separate step Tim may run. Follow-up: "never committed" wording in code/tests overstates D-09 — reword when touched. |
| WR-01 | warning | fixed | 10-02 (Phase 10) |
| WR-02 | warning | fixed | 10-02 (Phase 10) |
| WR-03 | warning | fixed | 10-02 (Phase 10) |
| WR-04 | warning | fixed | 10-01 (formatExposureTime rule and tests): `6bb5fb6` |
| WR-05 | warning | fixed | 10-02 (Phase 10) |
| WR-06 | warning | fixed | 10-02: extensions and ignore line fixed; pre-commit hook not added (no hook tooling; CI lint is the gate) |
| WR-07 | warning | fixed | 10-02 (Phase 10) |
| WR-08 | warning | fixed | 10-02 (Phase 10) |
| IN-01 | info | deferred | Executor outcome, 12-22: still applies (the proxy.ts matcher skips images/, terrain/ and media/; they get no static CSP). Deferred: the fix reverses a recorded 08-06 decision that e2e/data-privacy.spec.ts asserts by name ("served without CSP"), touches next.config.ts and that spec, and needs a three-engine visual check that a CSP header on the contour SVGs (drawn as CSS masks; Firefox applies CSP inside SVG image documents) leaves every contour unchanged. That check is outside 12-22. No script can run in today's files (contourSvg grammar and the svg-content guard). Picked up by the next milestone's security hardening. |
| IN-02 | info | fixed | 10-09 bridge removed (`aa9dff6`); 10-11 hotspot height shows approx. (`d5b10f2`) |
| IN-03 | info | fixed | 12-22 `d5dde96`: zurichOffset keeps the fall-back candidate within MAX_GPS_DRIFT_S of local minus GPS UTC; photos:build --check output unchanged (executor outcome) |
| IN-04 | info | deferred | Executor outcome, 12-22: still applies (`openRuns` in lib/terrain/contour-paths.ts emits the seam as two runs). Deferred: joining the runs changes every generated contour SVG, so it needs `npm run terrain:build` (new hashed assets and data/generated files outside 12-22's fix scope) and a visual re-baseline of every slug that draws contours. A cosmetic join kink, not a defect. Picked up by the next terrain-pipeline change. |
| IN-05 | info | fixed | 12-22 `9a30297`: the originals filter is `/\.jpe?g$/i`; photos:exif --check passes on the local originals (executor outcome) |
| IN-06 | info | skipped | Closed, executor outcome 12-22: no longer applies. 11-07 (`d526b7e`) rewrote app/(site)/projects/[slug]/page.tsx for box and coin-flip and removed the `Object.keys(project.highlights)` block and the v1 highlights field. |
| IN-07 | info | skipped | Closed, executor outcome 12-22: no longer applies. The CLI_X demo data left the site in 11-07 (`d526b7e`); `git grep "High-risk"` finds no code or data hit, and box's demo schema has no risk field (11 D-24). |
| IN-08 | info | skipped | Closed, executor outcome 12-22: no longer applies. 12-05 (`e78a010`) deleted the 60 legacy variants under public/images/optimized/ (VERIFY-01). |
| IN-09 | info | skipped | Closed, executor outcome 12-22: no longer applies. 12-05 (`e78a010`) dropped `LegacyUrl` and the legacy block from data/schemas/image-manifest.ts and scripts/photos/build-derivatives.mjs. |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
