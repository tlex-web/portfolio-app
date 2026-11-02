---
phase: 11
review: 11-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "A malformed URL hash makes RouteIndex throw `URIError` on every observer callback"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "RouteLogFilters judges disabled segments with stale counts while a press is pending, so a fast second press can reach an empty combination"
  - id: IN-01
    severity: info
    disposition: open
    title: "DemoTerminal and `tick` crash on an empty or shrunken command list"
  - id: IN-02
    severity: info
    disposition: open
    title: "The MP4 walker can throw `RangeError` on truncated box payloads, and the guard does not catch it"
  - id: IN-03
    severity: info
    disposition: open
    title: "The metric `sourceUrl` accepts any URL scheme"
  - id: IN-04
    severity: info
    disposition: open
    title: "Route-log row ids are unconstrained, yet they become DOM ids and URL fragments next to fixed band ids"
  - id: IN-05
    severity: info
    disposition: open
    title: "DemoClip hard-codes coin-flip copy and a fixed DOM id, and Demo hard-codes the clip id"
  - id: IN-06
    severity: info
    disposition: open
    title: "The roadmap empty-state sentence breaks when no filter is set"
  - id: IN-07
    severity: info
    disposition: open
    title: "RouteIndex hard-codes the band top that CSS derives from `--nav-h`"
  - id: IN-08
    severity: info
    disposition: open
    title: "React keys come from content whose uniqueness the schema does not enforce"
  - id: IN-09
    severity: info
    disposition: open
    title: "Section emptiness rules are written twice, so the index can list a section that renders nothing"
  - id: IN-10
    severity: info
    disposition: open
    title: "fetch-trails reads source.json without the schema"
  - id: IN-11
    severity: info
    disposition: open
    title: "A RouteRow comment calls /roadmap static, but the page is rendered per request"
  - id: IN-12
    severity: info
    disposition: open
    title: "In write mode, build-clip is not atomic and deletes any file in public/media/ it did not produce"
open: 12
total: 14
recorded: 2026-11-02T02:09:00.813Z
---

# Phase 11: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 11-REVIEW-FIX.md |
| WR-02 | warning | fixed | 11-REVIEW-FIX.md |
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
| IN-11 | info | open | - |
| IN-12 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
