---
phase: 07
review: 07-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "Every route shares one document title, so client-side navigations (including the 404) are never announced"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "Contrast guard merges `:root` blocks nested in `@media`, so a media-scoped override can mask a failing base token"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Palette guard regex misses directional borders, ring offsets and the shadow-colour families"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "The `png` rule walks the disk, so `npm run lint` fails on Windows after any local visual run"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "`same-classnames` passes without comparing anything on moved files and empty diffs"
  - id: WR-05
    severity: warning
    disposition: deferred
    title: "Grouped Dependabot dev-dependency PRs will fail the new parity guard whenever `@playwright/test` moves"
  - id: WR-06
    severity: warning
    disposition: deferred
    title: "Choosing the current page in the mobile menu leaves the panel open"
  - id: WR-07
    severity: warning
    disposition: fixed
    title: "`SafeCanvas` swallows every error below it, with no logging"
  - id: WR-08
    severity: warning
    disposition: fixed
    title: "HologramTerminalDemo keeps typing and advancing after Pause (timers are not cleaned up)"
  - id: WR-09
    severity: warning
    disposition: fixed
    title: "The skip-link guard only catches links named \"Skip to ...\", but the comment says it catches any second skip link (and the 07-27 handoff advises naming around it)"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "scripts/README.md lint chain and emoji row are stale"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "Root layout comment names `middleware.ts`; this Next version uses `proxy.ts`"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "The G3 test comment describes the deleted v1 Header"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "Home renders a second \"Skip to content\" link after the shell's skip link"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "The Home stats show hard-coded, false figures"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "The contrast self-test pins exact production ratios, so any token tweak breaks `npm run lint`"
  - id: IN-07
    severity: info
    disposition: fixed
    title: "`check-snapshot-commit` passes a merge commit without checking it under `--none`"
  - id: IN-08
    severity: info
    disposition: deferred
    title: "Tests and e2e specs are excluded from `type-check`"
  - id: IN-09
    severity: info
    disposition: fixed
    title: "FeedbackForm parses JSON before checking the status, so a non-JSON error shows \"Network error\""
  - id: IN-10
    severity: info
    disposition: fixed
    title: "The `high` and `critical` risk levels now render identically"
  - id: IN-11
    severity: info
    disposition: fixed
    title: "The section error component is named `Error`, which shadows the global"
  - id: IN-12
    severity: info
    disposition: fixed
    title: "The roadmap timeline dot clips its 20 px icon"
  - id: IN-13
    severity: info
    disposition: fixed
    title: "Hero badge contrast is still failing (known, deferred to Phase 9 hero rework, STATE.md)"
  - id: IN-14
    severity: info
    disposition: fixed
    title: "Hover background lost on the white CTAs (known, deferred to Phase 9, STATE.md)"
  - id: IN-15
    severity: info
    disposition: fixed
    title: "Tailwind v3 `bg-opacity-*` classes in the image modal (known, deferred to Phase 10, STATE.md)"
  - id: IN-16
    severity: info
    disposition: fixed
    title: "`notFound()` under `/projects/[slug]` has no server-rendered 404 body (known, deferred to Phase 12 / EDGE-01, STATE.md)"
  - id: IN-17
    severity: info
    disposition: fixed
    title: "The skip-link count passes as soon as it first reads 1, so a link added after hydration is not counted"
open: 0
total: 27
recorded: 2026-10-24T11:04:00.678Z
---

# Phase 07: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | 12-09: per-route titles and the root title template (v2.0 audit) |
| WR-01 | warning | fixed | 13-13: 7fe1146 (RED), aa3d5eb (fix) (13-LEDGER-TRIAGE.md #1) |
| WR-02 | warning | fixed | 13-13: 93f85fa (RED), 8f6acf9 (fix) (13-LEDGER-TRIAGE.md #2) |
| WR-03 | warning | fixed | 13-13: e64abc2 (RED), 2feb04b (fix) (13-LEDGER-TRIAGE.md #3) |
| WR-04 | warning | fixed | 13-14: 4ca709b (RED), 18e75a4 (fix) (13-LEDGER-TRIAGE.md #4) |
| WR-05 | warning | deferred | handed to DEPS-06 (13-18); DEPS-06 complete: 13-18 5ab6d15 (Playwright 1.65.0 and its container tag in one commit), 13-20 three-engine run (13-LEDGER-TRIAGE.md #5) |
| WR-06 | warning | deferred | handed to SHELL-07 (Phase 14) (13-LEDGER-TRIAGE.md #6) |
| WR-07 | warning | fixed | 13-11: 18d444e (RED), ddd356c (fix), Tim's call "fix" (13-LEDGER-TRIAGE.md #7) |
| WR-08 | warning | fixed | cf369b5: component deleted (v2.0 audit) |
| WR-09 | warning | fixed | 76e7a10: exact-name count plus a /skip to/i helper (v2.0 audit) |
| IN-01 | info | fixed | 13-08: 89ea626 (13-LEDGER-TRIAGE.md #8) |
| IN-02 | info | fixed | already fixed: 123d67a (13-LEDGER-TRIAGE.md #9) |
| IN-03 | info | fixed | 13-08: b58d34f (13-LEDGER-TRIAGE.md #10) |
| IN-04 | info | fixed | 07-27 460b3a4 |
| IN-05 | info | fixed | already fixed: 98de4c5 (13-LEDGER-TRIAGE.md #11) |
| IN-06 | info | fixed | 13-13: b9e53d5 (13-LEDGER-TRIAGE.md #12) |
| IN-07 | info | fixed | 13-14: bcd38e0 (RED), 08f11e2 (fix), b7ab234 (refactor) (13-LEDGER-TRIAGE.md #13) |
| IN-08 | info | deferred | handed to GUARD-10 (Phase 15), Tim's call "GUARD-10" (13-LEDGER-TRIAGE.md #14) |
| IN-09 | info | fixed | already fixed (component retired): b48c4d9 (13-LEDGER-TRIAGE.md #15) |
| IN-10 | info | fixed | already fixed (component retired): cf369b5 (13-LEDGER-TRIAGE.md #16) |
| IN-11 | info | fixed | 13-08: 6c13de4 (13-LEDGER-TRIAGE.md #17) |
| IN-12 | info | fixed | already fixed (component retired): e37f2af (13-LEDGER-TRIAGE.md #18) |
| IN-13 | info | fixed | already fixed (component retired): efd11e7 (13-LEDGER-TRIAGE.md #19) |
| IN-14 | info | fixed | already fixed (both CTAs retired): efd11e7, 98de4c5 (13-LEDGER-TRIAGE.md #20) |
| IN-15 | info | fixed | already fixed (component retired): aa9dff6 (13-LEDGER-TRIAGE.md #21) |
| IN-16 | info | fixed | already fixed: 31daaf9, cf369b5 (13-LEDGER-TRIAGE.md #22) |
| IN-17 | info | fixed | 13-08: 4ec93d0 (13-LEDGER-TRIAGE.md #23) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
