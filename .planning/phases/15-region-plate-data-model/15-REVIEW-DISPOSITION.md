---
phase: 15
review: 15-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "A hillshade size dropped from a plate's declared outputs is kept, and `--check` passes"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Rule 18 (and rule 5) miss an expression job name written as a block scalar"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "`tsconfig.jest.json` covers fewer files than Jest runs, so a test outside `__tests__/` is never type-checked"
  - id: IN-01
    severity: info
    disposition: deferred
    title: "The D-15 test pins the whole `public/terrain/` listing, so the first real second plate breaks it"
  - id: IN-02
    severity: info
    disposition: deferred
    title: "The scripts/README generator table still lists the pre-Phase-15 inputs"
  - id: IN-03
    severity: info
    disposition: deferred
    title: "The new cross-engine browser-Back row also runs in Chromium, duplicating the Chromium-only row"
  - id: IN-04
    severity: info
    disposition: deferred
    title: "The Jest globals declaration imports types from a package the project does not list"
  - id: IN-05
    severity: info
    disposition: deferred
    title: "A plate's `strip.centreN` outside its extent is silently clamped"
  - id: IN-06
    severity: info
    disposition: deferred
    title: "Non-home poster parameters come from terrain.ts, so an unreadable terrain.ts re-encodes every plate's posters"
  - id: IN-07
    severity: info
    disposition: deferred
    title: "\"Every photo is in exactly one known region\" is nearly a tautology"
  - id: IN-08
    severity: info
    disposition: deferred
    title: "Impossible-state guard: `height || 0` in navHeightPx"
open: 0
total: 11
recorded: 2026-11-15T00:33:13.527Z
---

# Phase 15: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 15-REVIEW-FIX.md |
| WR-02 | warning | fixed | 15-REVIEW-FIX.md |
| WR-03 | warning | fixed | 15-REVIEW-FIX.md |
| IN-01 | info | deferred | Phase 16: Tim chose "Fix all 3 warnings now (Recommended)" on 2026-11-15 (warnings only; info deferred) |
| IN-02 | info | deferred | Phase 16: Tim chose "Fix all 3 warnings now (Recommended)" on 2026-11-15 (warnings only; info deferred) |
| IN-03 | info | deferred | Phase 16: Tim chose "Fix all 3 warnings now (Recommended)" on 2026-11-15 (warnings only; info deferred) |
| IN-04 | info | deferred | Phase 16: Tim chose "Fix all 3 warnings now (Recommended)" on 2026-11-15 (warnings only; info deferred) |
| IN-05 | info | deferred | Phase 16: Tim chose "Fix all 3 warnings now (Recommended)" on 2026-11-15 (warnings only; info deferred) |
| IN-06 | info | deferred | Phase 16: Tim chose "Fix all 3 warnings now (Recommended)" on 2026-11-15 (warnings only; info deferred) |
| IN-07 | info | deferred | Phase 16: Tim chose "Fix all 3 warnings now (Recommended)" on 2026-11-15 (warnings only; info deferred) |
| IN-08 | info | deferred | Phase 16: Tim chose "Fix all 3 warnings now (Recommended)" on 2026-11-15 (warnings only; info deferred) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
