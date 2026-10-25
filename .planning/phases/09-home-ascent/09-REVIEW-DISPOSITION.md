---
phase: 09
review: 09-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "A tab hidden during the reveal burst can decline a capable device (stale budget, no frame runs while hidden)"
  - id: WR-02
    severity: warning
    disposition: open
    title: "The context-loss e2e races the real frame budget at the size where CI's verdict is noise"
  - id: IN-01
    severity: info
    disposition: open
    title: "The same layout constants are repeated in modules that must agree"
  - id: IN-02
    severity: info
    disposition: open
    title: "`ascent-canvas-ready` mark is not guarded, unlike the other two marks"
  - id: IN-03
    severity: info
    disposition: open
    title: "`summitPlaque(waypoints)` ignores its input for \"Height gained\""
  - id: IN-04
    severity: info
    disposition: open
    title: "`fourDecimals` is not \"round half up\" for every input"
  - id: IN-05
    severity: info
    disposition: open
    title: "A downgrade lasts the whole client-side session, not only the page view"
  - id: IN-06
    severity: info
    disposition: open
    title: "The `/photos#slug` target only exists on the current gallery page"
  - id: IN-07
    severity: info
    disposition: open
    title: "The server-HTML assertion escapes only the first `&`"
open: 9
total: 9
recorded: 2026-10-25T13:29:40.715Z
---

# Phase 09: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
