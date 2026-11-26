---
phase: 18
review: 18-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "ShareButton's url-change reset keeps the previous URL's timer and pending copy"
  - id: WR-02
    severity: warning
    disposition: open
    title: "The test-count ratchet was not raised at phase close"
  - id: WR-03
    severity: warning
    disposition: open
    title: "Impossible-state guard, a null-uv pin skip in `platePins`"
  - id: IN-01
    severity: info
    disposition: open
    title: "`stepIndex` has no production caller, and a PhotoViewer comment still refers to it"
  - id: IN-02
    severity: info
    disposition: open
    title: "A misplaced JSDoc in build-terrain: `overviewUv`'s doc now sits above `wgs84Corners`"
  - id: IN-03
    severity: info
    disposition: open
    title: "`RegionSequence` exports a `countLabel` that shadows the shared helper with another signature"
  - id: IN-04
    severity: info
    disposition: open
    title: "The BEV edition date on /sources is hard-coded, not read from its source"
  - id: IN-05
    severity: info
    disposition: open
    title: "Phantom requirement, the `fflate@^0.6.0` override and its 0.6.11 floor"
  - id: IN-06
    severity: info
    disposition: open
    title: "Fixed waits before assertions in photos-stepping"
open: 9
total: 9
recorded: 2026-11-26T20:01:43.879Z
---

# Phase 18: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
