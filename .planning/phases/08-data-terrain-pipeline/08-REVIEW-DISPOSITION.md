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
    disposition: open
    title: "A photo outside the DEM extent gets a clamped edge height and an out-of-band UV, with no error"
  - id: WR-02
    severity: warning
    disposition: open
    title: "`gpsOf` drops a valid latitude and longitude when `GPSAltitude` is missing"
  - id: WR-03
    severity: warning
    disposition: open
    title: "`offsetTimeOriginal` is extracted but ignored, so every capture is assumed to be in Europe/Zurich"
  - id: WR-04
    severity: warning
    disposition: open
    title: "`formatExposureTime` prints wrong shutter speeds between 0.25 s and 1 s, and for 0"
  - id: WR-05
    severity: warning
    disposition: open
    title: "The `photos:derive` write mode is not atomic, although its header says it is"
  - id: WR-06
    severity: warning
    disposition: open
    title: "Privacy guard coverage gaps: raw and HEIF formats, post-push only, narrowed ignore"
  - id: WR-07
    severity: warning
    disposition: open
    title: "`scripts/README.md` misses the `photos:build` stage, so the documented photo workflow fails CI"
  - id: WR-08
    severity: warning
    disposition: open
    title: "Corrections can label a hand-typed position as an exact EXIF position"
  - id: IN-01
    severity: info
    disposition: open
    title: "Hashed static assets are now served with no CSP at all"
  - id: IN-02
    severity: info
    disposition: open
    title: "The legacy bridge drops `position.approximate`"
  - id: IN-03
    severity: info
    disposition: open
    title: "An ambiguous fall-back hour fails even when GPS UTC could resolve it"
  - id: IN-04
    severity: info
    disposition: open
    title: "`openRuns` does not join the first and last runs across the ring seam"
  - id: IN-05
    severity: info
    disposition: open
    title: "Originals named `.jpeg` are skipped without a message"
  - id: IN-06
    severity: info
    disposition: open
    title: "`Object.keys(project.highlights)` on a tuple array"
  - id: IN-07
    severity: info
    disposition: open
    title: "Demo command 4 says \"High-risk operation\" but its level is `critical`"
  - id: IN-08
    severity: info
    disposition: open
    title: "Unreferenced legacy variants are still served"
  - id: IN-09
    severity: info
    disposition: open
    title: "`LegacyUrl` accepts `..`"
open: 18
total: 18
recorded: 2026-10-24T20:22:34.612Z
---

# Phase 08: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | deferred | Accepted risk D-12 (Tim, 08-CONTEXT): history exposure at 287c2e9/347d8e1/8fa0991 accepted, no rewrite or force-push; filter-repo purge remains a separate step Tim may run. Follow-up: "never committed" wording in code/tests overstates D-09 — reword when touched. |
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| WR-06 | warning | open | - |
| WR-07 | warning | open | - |
| WR-08 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |
| IN-08 | info | open | - |
| IN-09 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
