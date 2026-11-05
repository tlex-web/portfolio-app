---
phase: 10
review: 10-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "On the photo page, the viewer's document key handlers catch keys meant for the site nav; Escape to close the mobile menu also leaves the photo"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "A browser-Back close (the Android back gesture) uses a slug that may be lagging for focus return and the carousel's front photo"
  - id: IN-01
    severity: info
    disposition: open
    title: "A hidden callout silently takes the first Escape when labels are hidden on the gutter tier"
  - id: IN-02
    severity: info
    disposition: open
    title: "`collapseCallout` uses `CSS.escape` without the fallback LightboxDialog provides"
  - id: IN-03
    severity: info
    disposition: open
    title: "Duplicated photo-path parsing and `isEditable`, with different behaviour"
  - id: IN-04
    severity: info
    disposition: open
    title: "The neighbour preload asks for the AVIF set only"
  - id: IN-05
    severity: info
    disposition: open
    title: "`STAGE_SIZES` ignores the gutter tier's height condition and the key tier's height-limited box"
  - id: IN-06
    severity: info
    disposition: open
    title: "Unused parameters on component APIs"
  - id: IN-07
    severity: info
    disposition: open
    title: "Fact list items are keyed by their text"
  - id: IN-08
    severity: info
    disposition: open
    title: "The row-height drift guard does not tie each value to its breakpoint"
  - id: IN-09
    severity: info
    disposition: open
    title: "Absence-only assertions after fixed sleeps can pass falsely"
  - id: IN-10
    severity: info
    disposition: open
    title: "`closing` is never reset in LightboxDialog"
open: 10
total: 12
recorded: 2026-10-26T18:58:22.182Z
---

# Phase 10: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | 10-REVIEW-FIX.md |
| WR-01 | warning | fixed | 10-REVIEW-FIX.md |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |
| IN-08 | info | open | - |
| IN-09 | info | open | - |
| IN-10 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
