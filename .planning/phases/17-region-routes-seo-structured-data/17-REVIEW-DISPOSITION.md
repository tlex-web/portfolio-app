---
phase: 17
review: 17-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "The site-wide layout now loads the region and photo model on every content page"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "The swipe-and-arrows negative e2e test can pass without testing anything"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "The region card's plate lookup bypasses type checking with a cast"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "Approximate positions are emitted as plain GeoCoordinates"
  - id: IN-03
    severity: info
    disposition: skipped
    title: "File tracing for the deployed region OG card is still unverified"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "The site rights line is defined twice"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "Generality without instantiation: `caseStudyRights` ignores its slug"
  - id: IN-06
    severity: info
    disposition: skipped
    title: "Impossible-state guard: `withRetry`'s argument validation"
  - id: IN-07
    severity: info
    disposition: fixed
    title: "The `TimeZone` enum repeats the `ZONE_BY_COUNTRY` values by hand"
  - id: IN-08
    severity: info
    disposition: fixed
    title: "The `stepping.ts` doc describes a region index that does not exist"
  - id: IN-09
    severity: info
    disposition: fixed
    title: "Fact texts are React keys but the schema does not keep them unique"
open: 0
total: 11
recorded: 2026-11-24T17:06:46.934Z
---

# Phase 17: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 17-REVIEW-FIX.md |
| WR-02 | warning | fixed | 17-REVIEW-FIX.md |
| IN-01 | info | fixed | 17-REVIEW-FIX.md |
| IN-02 | info | fixed | 17-REVIEW-FIX.md |
| IN-03 | info | skipped | 17-REVIEW-FIX.md |
| IN-04 | info | fixed | 17-REVIEW-FIX.md |
| IN-05 | info | fixed | 17-REVIEW-FIX.md |
| IN-06 | info | skipped | 17-REVIEW-FIX.md |
| IN-07 | info | fixed | 17-REVIEW-FIX.md |
| IN-08 | info | fixed | 17-REVIEW-FIX.md |
| IN-09 | info | fixed | 17-REVIEW-FIX.md |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
