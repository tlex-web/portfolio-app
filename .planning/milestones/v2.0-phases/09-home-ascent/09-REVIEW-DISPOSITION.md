---
phase: 09
review: 09-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: deferred
    title: "The compact summit plaque covers poster pin 3 on landscape phones; the sweep that should catch it filters those sizes out"
  - id: IN-01
    severity: info
    disposition: skipped
    title: "`measurePlaque` assumes the summit block is centred at its arrival, which fails when the block is taller than the stage"
  - id: IN-02
    severity: info
    disposition: skipped
    title: "Narrow-versus-wide is now decided by two different width sources in the same canvas"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "The three summit-layout magic numbers are a hand-measured model of rendered content"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "The context-loss e2e races the real frame budget at the size where CI's verdict is noise"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "`fourDecimals` is not \"round half up\" for every input"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "A downgrade lasts the whole client-side session, not only the page view"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "The `/photos#slug` target only exists on the current gallery page"
  - id: IN-07
    severity: info
    disposition: fixed
    title: "The server-HTML assertion escapes only the first `&`"
open: 0
total: 9
recorded: 2026-10-25T21:42:43.118Z
---

# Phase 09: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | deferred | Accepted by Tim at 09-UAT round 2, test 3: reply "pass" |
| IN-01 | info | skipped | accepted: only matters on the short-landscape full layout, the domain of 09 WR-01 that Tim accepted at 09-UAT, and a fix moves Home pixels (13-LEDGER-TRIAGE.md #24) |
| IN-02 | info | skipped | accepted: nothing breaks, and aligning the two width sources changes the 768 px Home render (visual baselines) (13-LEDGER-TRIAGE.md #25) |
| IN-03 | info | fixed | 13-08: 86763c5 (13-LEDGER-TRIAGE.md #26) |
| WR-02 | warning | fixed | 09-15 49a3dac (not in the current review) |
| IN-04 | info | fixed | 13-08: cf70c6d (RED), 58523e1 (fix) (13-LEDGER-TRIAGE.md #27) (not in the current review) |
| IN-05 | info | fixed | 09-15 49a3dac (not in the current review) |
| IN-06 | info | fixed | already fixed: b38b6c4 (13-LEDGER-TRIAGE.md #28) (not in the current review) |
| IN-07 | info | fixed | 13-08: 719e0c4 (13-LEDGER-TRIAGE.md #29) (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
