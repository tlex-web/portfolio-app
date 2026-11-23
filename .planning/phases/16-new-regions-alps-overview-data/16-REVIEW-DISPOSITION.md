---
phase: 16
review: 16-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "D-03/D-04 sidecar rules are not checked anywhere CI runs"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "A coarse photo's `groundM` goes stale silently when its plate changes"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "`Position` documents coarse invariants it does not enforce"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "The client-graph guard covers only `global-error`, but `overview.ts` claims it covers the whole client graph"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "The BEV fetcher records \"about 8 m\" provenance without checking the overview scale"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "Impossible-state guard — the product check after `TerrainSource.parse` in fetch-bev"
  - id: IN-01
    severity: info
    disposition: skipped
    title: "Coarse coordinates can still be padded through `formatCoordinates`' default"
  - id: IN-02
    severity: info
    disposition: skipped
    title: "Impossible-state guard — the redundant nodata comparisons in the BEV value check"
  - id: IN-03
    severity: info
    disposition: skipped
    title: "`homePhotos` names the wrong generated file in its error"
  - id: IN-04
    severity: info
    disposition: skipped
    title: "`loadHomeWaypointIds` hides the real import error"
  - id: IN-05
    severity: info
    disposition: skipped
    title: "Overview summits drop the height source D-18 asks each record to carry"
  - id: IN-06
    severity: info
    disposition: skipped
    title: "IN-05's strip fix still clamps a centre near the edge"
  - id: IN-07
    severity: info
    disposition: skipped
    title: "The new 16-bit sources rely on git's binary autodetection"
  - id: IN-08
    severity: info
    disposition: skipped
    title: "The two plate fetchers duplicate their argument and extent code"
  - id: IN-09
    severity: info
    disposition: skipped
    title: "The GLO-90 mosaic clamps every negative value to 0 m with no lower sanity bound"
open: 0
total: 15
recorded: 2026-11-23T18:43:35.303Z
---

# Phase 16: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 16-REVIEW-FIX.md |
| WR-02 | warning | fixed | 16-REVIEW-FIX.md |
| WR-03 | warning | fixed | 16-REVIEW-FIX.md |
| WR-04 | warning | fixed | 16-REVIEW-FIX.md |
| WR-05 | warning | fixed | 16-REVIEW-FIX.md |
| WR-06 | warning | fixed | 16-REVIEW-FIX.md |
| IN-01 | info | skipped | 16-REVIEW-FIX.md |
| IN-02 | info | skipped | 16-REVIEW-FIX.md |
| IN-03 | info | skipped | 16-REVIEW-FIX.md |
| IN-04 | info | skipped | 16-REVIEW-FIX.md |
| IN-05 | info | skipped | 16-REVIEW-FIX.md |
| IN-06 | info | skipped | 16-REVIEW-FIX.md |
| IN-07 | info | skipped | 16-REVIEW-FIX.md |
| IN-08 | info | skipped | 16-REVIEW-FIX.md |
| IN-09 | info | skipped | 16-REVIEW-FIX.md |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
