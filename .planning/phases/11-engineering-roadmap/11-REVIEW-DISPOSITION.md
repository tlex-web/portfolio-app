---
phase: 11
review: 11-REVIEW.md
titles: json
findings:
  - id: IN-08
    severity: info
    disposition: fixed
    title: "React keys come from content whose uniqueness the schema does not enforce"
  - id: IN-13
    severity: info
    disposition: fixed
    title: "The G-11-4 link names are only distinct if tile labels are non-empty and unique, and nothing enforces either"
  - id: IN-14
    severity: info
    disposition: skipped
    title: "A unit assertion that the suffix \"has class sr-only\" can never fail"
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
    disposition: fixed
    title: "DemoTerminal and `tick` crash on an empty or shrunken command list"
  - id: IN-02
    severity: info
    disposition: deferred
    title: "The MP4 walker can throw `RangeError` on truncated box payloads, and the guard does not catch it"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "The metric `sourceUrl` accepts any URL scheme"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "Route-log row ids are unconstrained, yet they become DOM ids and URL fragments next to fixed band ids"
  - id: IN-05
    severity: info
    disposition: deferred
    title: "DemoClip hard-codes coin-flip copy and a fixed DOM id, and Demo hard-codes the clip id"
  - id: IN-06
    severity: info
    disposition: deferred
    title: "The roadmap empty-state sentence breaks when no filter is set"
  - id: IN-07
    severity: info
    disposition: deferred
    title: "RouteIndex hard-codes the band top that CSS derives from `--nav-h`"
  - id: IN-09
    severity: info
    disposition: deferred
    title: "Section emptiness rules are written twice, so the index can list a section that renders nothing"
  - id: IN-10
    severity: info
    disposition: fixed
    title: "fetch-trails reads source.json without the schema"
  - id: IN-11
    severity: info
    disposition: fixed
    title: "A RouteRow comment calls /roadmap static, but the page is rendered per request"
  - id: IN-12
    severity: info
    disposition: deferred
    title: "In write mode, build-clip is not atomic and deletes any file in public/media/ it did not produce"
open: 0
total: 16
recorded: 2026-11-02T11:34:09.155Z
---

# Phase 11: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| IN-08 | info | fixed | 12-22 `37a3d8f`: data/schemas/project.ts rejects duplicate tile keys, stack group labels, stack items and privacy facts; data/schemas/roadmap.ts rejects duplicate phase numbers; RoutePanel keys its fixed two-slot kicker by index; data tests for each (executor outcome) |
| IN-13 | info | fixed | 12-22 `37a3d8f`: `MetricTile.key` and `.label` are `.min(1)` and `tiles` rejects duplicate keys and labels, so each "Source for {label}" name stays distinct; data test covers duplicates and the empty label (executor outcome) |
| IN-14 | info | skipped | Closed, executor outcome 12-22: no longer applies. 12-07 (`52319a7` test, `e76308e` fix, 12 D-24) replaced the sr-only suffix with `aria-label="Source for {label}"`; the always-true `toHaveClass('sr-only')` is gone and Metrics.test.tsx:103 asserts `link.querySelector('.sr-only')` is null. |
| WR-01 | warning | fixed | 11-REVIEW-FIX.md (not in the current review) |
| WR-02 | warning | fixed | 11-REVIEW-FIX.md (not in the current review) |
| IN-01 | info | fixed | 12-22 `716fff7`: DemoTerminal renders nothing with no commands and restarts on command 1 when the list shrinks; `tick` resets when `state.index >= count`; unit tests in lib/__tests__/demo-terminal.test.ts and DemoTerminal.test.tsx (executor outcome) |
| IN-02 | info | deferred | Executor outcome, 12-22: still applies at HEAD (`times()` and `mp4Info()` read fixed offsets unchecked; `main()` has no `.catch`). Deferred, over the 12-22 fix cap (12-22's code fixes already total 92 code plus 73 test changed lines, past the ~150-line budget); estimated ~25 lines in scripts/guards/lib/mp4-boxes.mjs and check-served-images.mjs plus a truncated-box fixture test. The guard already fails closed (non-zero exit). Picked up by the next milestone's guard hardening, or when a new clip is added. |
| IN-03 | info | fixed | 12-22 `fc8da17`: `sourceUrl: z.url({ protocol: /^https$/ })` in data/schemas/project.ts; data test rejects http:, javascript: and data: (executor outcome) |
| IN-04 | info | fixed | 12-22 `f6424d4`: row id must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`; data test rejects spaces, `#`, uppercase and a leading hyphen, and checks no row id equals main-content, a band id or a band heading id (executor outcome) |
| IN-05 | info | deferred | Executor outcome, 12-22: still applies (DemoClip.tsx:40-41,48; Demo.tsx). Deferred: the fix needs a new data field (`clip.label`) whose copy has not been approved (copy goes through Tim's content packet, D-21) and changes in data/schemas/project.ts, data/projects.ts, DemoClip.tsx and Demo.tsx, which is more than the one named file and over the 12-22 fix cap. No live defect: one clip on one page. Picked up when a second clip or a clip-copy change is planned. |
| IN-06 | info | deferred | Executor outcome, 12-22: still applies (the empty plate in `app/(site)/roadmap/page.tsx` joins `filterLabels(filter)` with no no-filter branch). Deferred: the fix adds a visible sentence ("No entries yet.") with no approved copy (copy goes through Tim's content packet), and the branch is unreachable with today's seven rows. Picked up by the next content packet that touches /roadmap, or if the route log can ever be empty. |
| IN-07 | info | deferred | Executor outcome, 12-22: still applies (`BAND_TOP = 80` and `ROOT_MARGIN` restate `--nav-h` + 16 px). Deferred, over the 12-22 fix cap (12-22's code fixes already total 92 code plus 73 test changed lines, past the ~150-line budget); estimated ~10 lines in components/projects/RouteIndex.tsx plus a test, and the scroll-spy contract needs the cross-engine case-study run. No live defect: `--nav-h` has been 64 px since Phase 7. Picked up whenever `--nav-h` changes. |
| IN-09 | info | deferred | Executor outcome, 12-22: still applies (CaseStudy.tsx `renderSlot` and the Pipeline, Privacy and Stack components each guard emptiness). Deferred, over the 12-22 fix cap (12-22's code fixes already total 92 code plus 73 test changed lines, past the ~150-line budget); a refactor across CaseStudy.tsx and three section components (estimated ~30 lines). The schema's `.min(1)` on stages, facts and groups keeps parsed data from reaching it. Picked up by the next case-study change. |
| IN-10 | info | fixed | 12-22 `7330a1b`: fetch-trails parses source.json with `TerrainSource`, like build-trails; the committed source.json parses (executor outcome) |
| IN-11 | info | fixed | 12-22 `ba3dc6b`: the RouteRow comment reads "a document navigation to /roadmap" (executor outcome) |
| IN-12 | info | deferred | Executor outcome, 12-22: still applies (scripts/media/build-clip.mjs write mode writes clips, then the manifest, then unlinks every other file in public/media/). Deferred, over the 12-22 fix cap (12-22's code fixes already total 92 code plus 73 test changed lines, past the ~150-line budget); estimated ~20 lines plus a write-mode run with ffmpeg and the source recording, which 12-22 cannot verify. Check mode already reports orphans. Picked up the next time a clip is rebuilt. |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
