---
phase: 13
review: 13-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "Push-event docs-only classification compares only the latest push, so CI OK can go green on a SHA whose branch carries untested code"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Four of the D-09 \"docs-only\" files are Tailwind source inputs, so a docs-only change can alter the production stylesheet with build and visual regression skipped"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "The fail-closed limiter still throws at module scope on a malformed credential, bypassing the 503 contract"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "The relay finds its dispatched run by comparing second-truncated runner time with GitHub's `created_at`, so a small clock offset turns a good run into a red CI OK"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "Most CI jobs that the relay and CI OK wait on have no `timeout-minutes`"
  - id: IN-01
    severity: info
    disposition: deferred
    title: "SafeCanvas's new log duplicates Next's own caught-error log, and the WebGL failure is not actually silent"
  - id: IN-02
    severity: info
    disposition: deferred
    title: "ci-gate rules 11 and 12 only inspect `run:` blocks, so a `with:` input to an action (for example `actions/github-script` `script:`) can interpolate untrusted event fields unflagged"
  - id: IN-03
    severity: info
    disposition: deferred
    title: "Rule 5 detects a second CI OK only by literal substring, so a computed name evades it"
open: 0
total: 8
recorded: 2026-11-13T22:27:57.705Z
---

# Phase 13: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 13-REVIEW-FIX.md, commit 1f8a5bc |
| WR-02 | warning | fixed | 13-REVIEW-FIX.md, commit aee0ad3 |
| WR-03 | warning | fixed | 13-REVIEW-FIX.md, commit bc76d03 |
| WR-04 | warning | fixed | 13-REVIEW-FIX.md, commit 4dfeee9 |
| WR-05 | warning | fixed | 13-REVIEW-FIX.md, commit cb5983f |
| IN-01 | info | deferred | Phase 15 (guards): Tim, 2026-11-13; ROADMAP Phase 15 scope note |
| IN-02 | info | deferred | Phase 15 (guards): Tim, 2026-11-13; ROADMAP Phase 15 scope note |
| IN-03 | info | deferred | Phase 15 (guards): Tim, 2026-11-13; ROADMAP Phase 15 scope note |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
