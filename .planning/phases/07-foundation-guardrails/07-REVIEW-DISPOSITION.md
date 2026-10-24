---
phase: 07
review: 07-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "Every route shares one document title, so client-side navigations (including the 404) are never announced"
  - id: WR-01
    severity: warning
    disposition: open
    title: "Contrast guard merges `:root` blocks nested in `@media`, so a media-scoped override can mask a failing base token"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Palette guard regex misses directional borders, ring offsets and the shadow-colour families"
  - id: WR-03
    severity: warning
    disposition: open
    title: "The `png` rule walks the disk, so `npm run lint` fails on Windows after any local visual run"
  - id: WR-04
    severity: warning
    disposition: open
    title: "`same-classnames` passes without comparing anything on moved files and empty diffs"
  - id: WR-05
    severity: warning
    disposition: open
    title: "Grouped Dependabot dev-dependency PRs will fail the new parity guard whenever `@playwright/test` moves"
  - id: WR-06
    severity: warning
    disposition: open
    title: "Choosing the current page in the mobile menu leaves the panel open"
  - id: WR-07
    severity: warning
    disposition: open
    title: "`SafeCanvas` swallows every error below it, with no logging"
  - id: WR-08
    severity: warning
    disposition: open
    title: "HologramTerminalDemo keeps typing and advancing after Pause (timers are not cleaned up)"
  - id: IN-01
    severity: info
    disposition: open
    title: "scripts/README.md lint chain and emoji row are stale"
  - id: IN-02
    severity: info
    disposition: open
    title: "Root layout comment names `middleware.ts`; this Next version uses `proxy.ts`"
  - id: IN-03
    severity: info
    disposition: open
    title: "The G3 test comment describes the deleted v1 Header"
  - id: IN-04
    severity: info
    disposition: open
    title: "Home renders a second \"Skip to content\" link after the shell's skip link"
  - id: IN-05
    severity: info
    disposition: open
    title: "The Home stats show hard-coded, false figures"
  - id: IN-06
    severity: info
    disposition: open
    title: "The contrast self-test pins exact production ratios, so any token tweak breaks `npm run lint`"
  - id: IN-07
    severity: info
    disposition: open
    title: "`check-snapshot-commit` passes a merge commit without checking it under `--none`"
  - id: IN-08
    severity: info
    disposition: open
    title: "Tests and e2e specs are excluded from `type-check`"
  - id: IN-09
    severity: info
    disposition: open
    title: "FeedbackForm parses JSON before checking the status, so a non-JSON error shows \"Network error\""
  - id: IN-10
    severity: info
    disposition: open
    title: "The `high` and `critical` risk levels now render identically"
  - id: IN-11
    severity: info
    disposition: open
    title: "The section error component is named `Error`, which shadows the global"
  - id: IN-12
    severity: info
    disposition: open
    title: "The roadmap timeline dot clips its 20 px icon"
  - id: IN-13
    severity: info
    disposition: open
    title: "Hero badge contrast is still failing (known, deferred to Phase 9 hero rework, STATE.md)"
  - id: IN-14
    severity: info
    disposition: open
    title: "Hover background lost on the white CTAs (known, deferred to Phase 9, STATE.md)"
  - id: IN-15
    severity: info
    disposition: open
    title: "Tailwind v3 `bg-opacity-*` classes in the image modal (known, deferred to Phase 10, STATE.md)"
  - id: IN-16
    severity: info
    disposition: open
    title: "`notFound()` under `/projects/[slug]` has no server-rendered 404 body (known, deferred to Phase 12 / EDGE-01, STATE.md)"
open: 25
total: 25
recorded: 2026-10-24T09:59:51.803Z
---

# Phase 07: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| WR-06 | warning | open | - |
| WR-07 | warning | open | - |
| WR-08 | warning | open | - |
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
| IN-13 | info | open | - |
| IN-14 | info | open | - |
| IN-15 | info | open | - |
| IN-16 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
