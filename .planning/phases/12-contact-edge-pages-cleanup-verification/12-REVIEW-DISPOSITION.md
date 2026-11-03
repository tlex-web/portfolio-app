---
phase: 12
review: 12-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "A `validation` answer with no visible-field issue leaves the form silent: no error, no confirmation"
  - id: WR-02
    severity: warning
    disposition: open
    title: "DemoTerminal's IN-01 \"restart on shrink\" unmounts the observed region; the IntersectionObserver then watches a removed element"
  - id: WR-03
    severity: warning
    disposition: open
    title: "README still documents `FEEDBACK_EMAIL`; the code requires `FEEDBACK_RECIPIENT_EMAIL`, so following the README makes every contact send return 502"
  - id: WR-04
    severity: warning
    disposition: open
    title: "Service-worker cache writes are fire-and-forget, so a navigation copy can be lost and a quota error is an unhandled rejection"
  - id: IN-01
    severity: info
    disposition: open
    title: "The name field's \"too long\" error reads \"Enter your name.\""
  - id: IN-02
    severity: info
    disposition: open
    title: "The T-12-02 \"only the proxy may name the section\" guarantee does not hold where the proxy does not run"
  - id: IN-03
    severity: info
    disposition: open
    title: "`useProgressiveTextures` never reloads when the sources change but their count does not"
  - id: IN-04
    severity: info
    disposition: open
    title: "The service-worker update interval is never cleared, and its rejection is unhandled"
  - id: IN-05
    severity: info
    disposition: open
    title: "`global-error` renders no `<title>`"
  - id: IN-06
    severity: info
    disposition: open
    title: "Retry re-sends the current values without client-side validation"
  - id: IN-07
    severity: info
    disposition: open
    title: "`z.string().email()` is the deprecated Zod 4 form"
open: 11
total: 11
recorded: 2026-11-03T10:39:05.082Z
---

# Phase 12: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
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
