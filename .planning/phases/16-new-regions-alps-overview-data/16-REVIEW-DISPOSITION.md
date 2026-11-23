---
phase: 16
review: 16-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "D-03/D-04 sidecar rules are not checked anywhere CI runs"
  - id: WR-02
    severity: warning
    disposition: open
    title: "A coarse photo's `groundM` goes stale silently when its plate changes"
  - id: WR-03
    severity: warning
    disposition: open
    title: "`Position` documents coarse invariants it does not enforce"
  - id: WR-04
    severity: warning
    disposition: open
    title: "The client-graph guard covers only `global-error`, but `overview.ts` claims it covers the whole client graph"
  - id: WR-05
    severity: warning
    disposition: open
    title: "The BEV fetcher records \"about 8 m\" provenance without checking the overview scale"
  - id: WR-06
    severity: warning
    disposition: open
    title: "Impossible-state guard — the product check after `TerrainSource.parse` in fetch-bev"
  - id: IN-01
    severity: info
    disposition: open
    title: "Coarse coordinates can still be padded through `formatCoordinates`' default"
  - id: IN-02
    severity: info
    disposition: open
    title: "Impossible-state guard — the redundant nodata comparisons in the BEV value check"
  - id: IN-03
    severity: info
    disposition: open
    title: "`homePhotos` names the wrong generated file in its error"
  - id: IN-04
    severity: info
    disposition: open
    title: "`loadHomeWaypointIds` hides the real import error"
  - id: IN-05
    severity: info
    disposition: open
    title: "Overview summits drop the height source D-18 asks each record to carry"
  - id: IN-06
    severity: info
    disposition: open
    title: "IN-05's strip fix still clamps a centre near the edge"
  - id: IN-07
    severity: info
    disposition: open
    title: "The new 16-bit sources rely on git's binary autodetection"
  - id: IN-08
    severity: info
    disposition: open
    title: "The two plate fetchers duplicate their argument and extent code"
  - id: IN-09
    severity: info
    disposition: open
    title: "The GLO-90 mosaic clamps every negative value to 0 m with no lower sanity bound"
open: 15
total: 15
recorded: 2026-11-23T18:23:36.103Z
---

# Phase 16: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| WR-06 | warning | open | - |
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
