---
phase: 14
review: 14-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "`revealFocusedRow` also scrolls the panel on pointer focus, so a tap near a partly hidden row's edge can miss the link"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Already-defended-elsewhere: the Previous/Next end press is guarded three times"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "The new D-23 shell row clicks Menu without waiting for hydration, which its sibling row says is required"
  - id: IN-01
    severity: info
    disposition: deferred
    title: "`revealTrigger` parses `--nav-h` with `parseFloat`, which silently assumes px"
  - id: IN-02
    severity: info
    disposition: deferred
    title: "`revealTrigger` measures the viewport with `window.innerHeight`"
  - id: IN-03
    severity: info
    disposition: deferred
    title: "Orphaned \"Close trigger 7\" comment block duplicates the inline handler comment"
  - id: IN-04
    severity: info
    disposition: deferred
    title: "The `STEP` class string is a verbatim copy of `CarouselControls`' `STEP_BUTTON`"
  - id: IN-05
    severity: info
    disposition: deferred
    title: "Fixed 4 s sleeps prove \"nothing advanced\""
  - id: IN-06
    severity: info
    disposition: deferred
    title: "The next-frame re-reveal is a timing assumption with thin cross-engine coverage"
open: 0
total: 9
recorded: 2026-11-14T14:36:28.002Z
---

# Phase 14: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 14-REVIEW-FIX.md |
| WR-02 | warning | fixed | 14-REVIEW-FIX.md |
| WR-03 | warning | fixed | 14-REVIEW-FIX.md |
| IN-01 | info | deferred | Phase 15: Tim chose "Fix all 3 now (Recommended)" on 2026-11-14 (warnings only); fixed in Phase 15: 15-14 `66eb7f2` |
| IN-02 | info | deferred | Phase 15: Tim chose "Fix all 3 now (Recommended)" on 2026-11-14 (warnings only); fixed in Phase 15: 15-14 `66eb7f2` |
| IN-03 | info | deferred | Phase 15: Tim chose "Fix all 3 now (Recommended)" on 2026-11-14 (warnings only); fixed in Phase 15: 15-14 `c24b622` |
| IN-04 | info | deferred | Phase 15: Tim chose "Fix all 3 now (Recommended)" on 2026-11-14 (warnings only); deferred to Phase 18 (D-29): CarouselControls.tsx retires with the Carousel there, leaving DemoTerminal's STEP string the only copy |
| IN-05 | info | deferred | Phase 15: Tim chose "Fix all 3 now (Recommended)" on 2026-11-14 (warnings only); fixed in Phase 15: 15-14 `065d628` |
| IN-06 | info | deferred | Phase 15: Tim chose "Fix all 3 now (Recommended)" on 2026-11-14 (warnings only); fixed in Phase 15: 15-14 `065d628` |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
