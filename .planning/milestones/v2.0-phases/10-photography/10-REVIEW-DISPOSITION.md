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
    disposition: deferred
    title: "A hidden callout silently takes the first Escape when labels are hidden on the gutter tier"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "`collapseCallout` uses `CSS.escape` without the fallback LightboxDialog provides"
  - id: IN-03
    severity: info
    disposition: deferred
    title: "Duplicated photo-path parsing and `isEditable`, with different behaviour"
  - id: IN-04
    severity: info
    disposition: deferred
    title: "The neighbour preload asks for the AVIF set only"
  - id: IN-05
    severity: info
    disposition: deferred
    title: "`STAGE_SIZES` ignores the gutter tier's height condition and the key tier's height-limited box"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "Unused parameters on component APIs"
  - id: IN-07
    severity: info
    disposition: fixed
    title: "Fact list items are keyed by their text"
  - id: IN-08
    severity: info
    disposition: deferred
    title: "The row-height drift guard does not tie each value to its breakpoint"
  - id: IN-09
    severity: info
    disposition: fixed
    title: "Absence-only assertions after fixed sleeps can pass falsely"
  - id: IN-10
    severity: info
    disposition: fixed
    title: "`closing` is never reset in LightboxDialog"
open: 0
total: 12
recorded: 2026-10-26T18:58:22.182Z
---

# Phase 10: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | 10-REVIEW-FIX.md |
| WR-01 | warning | fixed | 10-REVIEW-FIX.md |
| IN-01 | info | deferred | handed to Phase 14 (ROADMAP.md scope note) (13-LEDGER-TRIAGE.md #30) |
| IN-02 | info | fixed | 13-09: f03c424 (RED), 0aac3d3 (fix) (13-LEDGER-TRIAGE.md #31) |
| IN-03 | info | deferred | handed to Phase 17 (ROADMAP.md scope note) (13-LEDGER-TRIAGE.md #32) |
| IN-04 | info | deferred | handed to Phase 18, LBOX-09 stepping rework (ROADMAP.md scope note) (13-LEDGER-TRIAGE.md #33) |
| IN-05 | info | deferred | handed to Phase 18, immersive layout (ROADMAP.md scope note) (13-LEDGER-TRIAGE.md #34) |
| IN-06 | info | fixed | 13-09: 69160aa (refactor; type-check is the proof) (13-LEDGER-TRIAGE.md #35) |
| IN-07 | info | fixed | 13-09: 7670c17 (RED), ecd59d2 (fix) (13-LEDGER-TRIAGE.md #36) |
| IN-08 | info | deferred | handed to Phase 18, PHOTO-06 view-test rewrite (ROADMAP.md scope note) (13-LEDGER-TRIAGE.md #37) |
| IN-09 | info | fixed | 13-09: 86b34dc (the three surviving lightbox tests); the photos-sweep switchTo 600 ms wait goes with the view switch, Phase 18 scope note (13-LEDGER-TRIAGE.md #38) |
| IN-10 | info | fixed | 13-09: 86b2456 (RED), 722517b (fix) (13-LEDGER-TRIAGE.md #39) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
