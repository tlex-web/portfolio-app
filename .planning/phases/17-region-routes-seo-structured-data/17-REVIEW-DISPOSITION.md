---
phase: 17
review: 17-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "The site-wide layout now loads the region and photo model on every content page"
  - id: WR-02
    severity: warning
    disposition: open
    title: "The swipe-and-arrows negative e2e test can pass without testing anything"
  - id: IN-01
    severity: info
    disposition: open
    title: "The region card's plate lookup bypasses type checking with a cast"
  - id: IN-02
    severity: info
    disposition: open
    title: "Approximate positions are emitted as plain GeoCoordinates"
  - id: IN-03
    severity: info
    disposition: open
    title: "File tracing for the deployed region OG card is still unverified"
  - id: IN-04
    severity: info
    disposition: open
    title: "The site rights line is defined twice"
  - id: IN-05
    severity: info
    disposition: open
    title: "Generality without instantiation: `caseStudyRights` ignores its slug"
  - id: IN-06
    severity: info
    disposition: open
    title: "Impossible-state guard: `withRetry`'s argument validation"
  - id: IN-07
    severity: info
    disposition: open
    title: "The `TimeZone` enum repeats the `ZONE_BY_COUNTRY` values by hand"
  - id: IN-08
    severity: info
    disposition: open
    title: "The `stepping.ts` doc describes a region index that does not exist"
  - id: IN-09
    severity: info
    disposition: open
    title: "Fact texts are React keys but the schema does not keep them unique"
open: 11
total: 11
recorded: 2026-11-24T02:29:00.062Z
---

# Phase 17: Code Review Disposition

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
| IN-08 | info | open | - |
| IN-09 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
