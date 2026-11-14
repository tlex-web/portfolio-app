---
phase: 14
review: 14-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "`revealFocusedRow` also scrolls the panel on pointer focus, so a tap near a partly hidden row's edge can miss the link"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Already-defended-elsewhere: the Previous/Next end press is guarded three times"
  - id: WR-03
    severity: warning
    disposition: open
    title: "The new D-23 shell row clicks Menu without waiting for hydration, which its sibling row says is required"
  - id: IN-01
    severity: info
    disposition: open
    title: "`revealTrigger` parses `--nav-h` with `parseFloat`, which silently assumes px"
  - id: IN-02
    severity: info
    disposition: open
    title: "`revealTrigger` measures the viewport with `window.innerHeight`"
  - id: IN-03
    severity: info
    disposition: open
    title: "Orphaned \"Close trigger 7\" comment block duplicates the inline handler comment"
  - id: IN-04
    severity: info
    disposition: open
    title: "The `STEP` class string is a verbatim copy of `CarouselControls`' `STEP_BUTTON`"
  - id: IN-05
    severity: info
    disposition: open
    title: "Fixed 4 s sleeps prove \"nothing advanced\""
  - id: IN-06
    severity: info
    disposition: open
    title: "The next-frame re-reveal is a timing assumption with thin cross-engine coverage"
open: 9
total: 9
recorded: 2026-11-14T14:24:58.079Z
---

# Phase 14: Code Review Disposition

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
