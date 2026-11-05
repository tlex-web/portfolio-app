---
phase: 07-foundation-guardrails
plan: 17
subsystem: ui
tags: [tokens-v2, semantic-tokens, stock-palette, roadmap, visual-regression, re-baseline, dsgn-06, guard-04, build-step-8c]

requires:
  - phase: 07-16
    provides: "The 8c map pattern (one route group per commit, mapping and re-baseline in the same reviewed commit)"
  - phase: 07-15
    provides: "One colour value per property in every Roadmap class string (dark: pairs collapsed), so the mapping is one-to-one"
  - phase: 07-13
    provides: "Phosphor icons and visible labels on Roadmap status, priority and area, and tests that assert state rather than colour classes"
  - phase: 07-09
    provides: "The L2 semantic utilities (surface*, ink*, line*, accent*, success, caution, danger) via @theme inline --color-* tokens"
provides:
  - "Roadmap route group (app/roadmap/page.tsx, RoadmapTimeline, RoadmapProgress, RoadmapFilters) on L2 semantic utilities only: stock palette count 98 -> 0; no text-white/bg-white/black/rgba/hex/oklch/arbitrary colour left, so the 07-20 white/black ratchet starts at 0 for this group"
  - "roadmap/{375,768,1440}-reduced-visual-dark-linux.png re-baselined inside the mapping commit b7b56cf; no other snapshot changed"
affects: [07-18, 07-19, 07-20, 11]

actuals:
  tokens: 6270    # chars/4 over `git diff de54c1b..b7b56cf -- app components` (25080 chars, 4 files, 76+/89-); the 3 PNGs are binary and not counted
  tasks: 2
  commits: 1      # measured: git rev-list --count de54c1b..HEAD = 1 (b7b56cf), before the docs commits
plan_head_before: de54c1b33b80195d68ae8035c22328a79a000ccb
plan_head_after: b7b56cfd4d1c49330fb7de8bb459068a8e1ff26b

tech-stack:
  added: []
  patterns:
    - "Staged dark: removal, stage 3 (map): one route group per commit, the stock-to-semantic mapping and its re-baseline in the same reviewed commit"
    - "Status as outlined cards and badges on a neutral surface (border-success/accent/line, text-success/accent) instead of tinted fills"
    - "Bands and chips go neutral (bg-surface-raised / bg-surface-overlay with hairlines); the accent fill is kept for one primary CTA, the selected filter chip and data marks (timeline line, progress and breakdown bars)"

key-files:
  created: []
  modified:
    - app/roadmap/page.tsx
    - components/RoadmapTimeline.tsx
    - components/RoadmapProgress.tsx
    - components/RoadmapFilters.tsx
    - e2e/visual/routes.spec.ts-snapshots/roadmap/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/roadmap/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/roadmap/1440-reduced-visual-dark-linux.png

key-decisions:
  - "Roadmap mapped to semantic tokens in b7b56cf (stock count 98 -> 0); the 3 roadmap visual-dark PNGs re-baselined in the same commit; CI run 39995314853 green (Visual, Unit, E2E)"
  - "Tim's D1 = A outlined status on neutral, D2 = A neutral hero and CTA bands (Contact Me is the one accent-filled CTA), D3 = A neutral area chips with accent Breakdown bars, chip edge kept mechanical (unselected filter chips no border); recorded in the b7b56cf body"
  - "Page height grows (1440 +4px, 768 +4px, 375 +34px) from D2's border-y on two bands and D3's 1px chip border, not from a layout regression"
  - "DSGN-06 and GUARD-04 stay Pending: requirements.ready-ids reports both blocked, because 07-18, 07-19 and 07-20 also declare them and have no SUMMARY yet"

patterns-established:
  - "White text on accent or success fails contrast (1.69:1 and 1.77:1); icons and text on those fills use text-ink-inverse (10.8-11.6:1)"

# Copied verbatim from the PLAN's `requirements`. DSGN-06 and GUARD-04 are NOT flipped in REQUIREMENTS.md:
# requirements.ready-ids reports both blocked (07-18, 07-19 and 07-20 also declare them and have no SUMMARY yet).
requirements-completed: [DSGN-06, GUARD-04]

coverage:
  - id: D1
    description: "Every stock Tailwind palette class in the Roadmap group is replaced by an L2 semantic utility (count 0)"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "Task 1 <verify> stock-palette grep over the 4 group files | wc -l = 0 (98 at de54c1b; close-out re-run)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No v1 alias, raw OKLCH, hex, rgba() or arbitrary colour value introduced by the mapping"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "git show b7b56cf -- app components: added lines matching (alpine|granite|snow|frost|ember|pine|rust)-[0-9] | #hex | oklch( | rgba?( | (bg|text|border)-[ = 0; the 4 files contain 0 text-white/bg-white/black/rgba/oklch/hex (close-out re-run); v1 alias one-liner 'v1 alias count not increased 0 -> 0' (Task 1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Status, priority and area stay distinguishable without colour (icon + visible label kept); RoadmapFilters.test and RoadmapTimeline.test pass unchanged"
    requirement: DSGN-06
    verification:
      - kind: unit
        ref: "npx jest RoadmapFilters.test RoadmapTimeline.test: 2/2 suites, 19/19 tests; npx jest --silent 9/9 suites, 82/82 (Task 1); git diff b7b56cf~1 b7b56cf -- components/__tests__ is empty"
        status: pass
      - kind: unit
        ref: "CI Unit Tests PASS https://github.com/tlex-web/portfolio-app/actions/runs/39995314853/job/120557204071"
        status: pass
    human_judgment: true   # orchestrator crop review at 375/768/1440: icons and labels kept on status, area and priority
  - id: D4
    description: "The mapping is its own commit, the roadmap/* snapshots are re-baselined in it with the reason stated, and no other snapshot changes"
    requirement: GUARD-04
    verification:
      - kind: other
        ref: "check-snapshot-commit.mjs --sha HEAD --allow roadmap --some -> 'snapshot-commit: OK (3 changed)', exit 0; git show --name-status b7b56cf: 4 source M + 3 roadmap PNG M, 0 A, 0 D (close-out re-run)"
        status: pass
      - kind: automated_ui
        ref: "check-visual-run.mjs --sha b7b56cfd4d1c49330fb7de8bb459068a8e1ff26b --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/39995314853/job/120557204219, exit 0 (close-out re-run)"
        status: pass
    human_judgment: true   # Tim reviewed the 3 roadmap PNGs and the height change before the amend (Task 2)

duration: about 19 min by commit timestamps (07-16 close-out de54c1b 17:08:46Z to the amended commit 17:28:08Z), plus 1 baseline run and 2 CI runs; push CI on b7b56cf finished 17:35:29Z
completed: 2026-10-23
status: complete
---

# Phase 7 Plan 17: Roadmap route group mapped from stock palette to semantic tokens (build step 8c)

**Commit `b7b56cf` replaces all 98 stock palette classes in the Roadmap group (`app/roadmap/page.tsx`, `RoadmapTimeline`, `RoadmapProgress`, `RoadmapFilters`) with L2 semantic utilities, using Tim's neutral-surface choices D1-D3. It also re-baselines the 3 `roadmap/*-reduced-visual-dark-linux.png` shots. CI run 39995314853 on `ci/07-17` passes Visual, Unit and E2E.**

## Performance

- **Duration:** about 19 min by commit timestamps (`de54c1b` 17:08:46Z, task commit `b51721b` authored 17:17:00Z, amend `b7b56cf` committed 17:28:08Z). The baseline run 39993896156 finished at 17:23:01Z and the push CI run 39995314853 at 17:35:29Z.
- **Tasks:** 2/2
- **Files modified:** 7 (4 source, 3 PNG)

## Accomplishments
- **Mapping (DSGN-06, 8c Roadmap):** stock count went from 98 to 0 across the 4 files. The files now have no `text-white`, `bg-white`, `black`, rgba, hex, oklch or arbitrary colour, so the 07-20 white/black ratchet starts at 0 for this group.
- **Status (D1 = A, outlined on neutral):** cards are `bg-surface-raised border-2` with `border-success` / `border-accent` / `border-line`. Badges are `bg-surface-overlay border` with `text-success` / `text-accent`, and the planned badge is `text-ink-muted border-line-strong`.
- **Bands (D2 = A, both neutral):** the hero and CTA bands are `bg-surface-raised border-y border-line` with `text-ink` / `text-ink-muted`. Contact Me is the only `bg-accent text-ink-inverse` CTA.
- **Area (D3 = A):** area chips are `bg-surface-overlay text-ink border border-line-strong` and keep their icon and label. The Breakdown bars are `bg-accent`. For the optional chip edge Tim chose "No, keep mechanical", so unselected filter chips have no border.
- **Other:** selected filter chips are accent with dark text. The timeline line and the progress fills are solid accent. The timeline dot icon changed from `text-white` to `text-ink-inverse`, a contrast fix (white on success is 1.77:1).
- **Re-baseline:** Tim amended `roadmap/375`, `768` and `1440-reduced-visual-dark-linux.png` into `b7b56cf`. The commit body states the reason and Tim's choices.

## Task Commits

1. **Task 1 (tracer): Map the Roadmap group from stock palette to semantic tokens** - `b7b56cf` (refactor). The pre-amend commit `b51721b` had the same source change without PNGs.
2. **Task 2: Re-baseline the Roadmap snapshots and confirm CI green** (checkpoint:human-action, blocking-human). `ci/07-17` was first pushed at `b51721b` (plain push, new branch). The "Update visual baselines" run 39993896156 (update_mode changed) succeeded, and against HEAD only roadmap/{375,768,1440} differed. The push CI run 39993896951 on `b51721b` failed only Visual Regression, on roadmap in the dark and light projects, as expected before the re-baseline. Tim amended the 3 PNGs (`b7b56cf`), pushed and replied "pushed". Push CI run 39995314853 was green. No separate commit.

`git rev-list --count de54c1b..HEAD` = 1, measured from the plan ledger.

**Plan metadata:** the docs commit that follows this SUMMARY.

## Files Created/Modified
- `app/roadmap/page.tsx` - hero and CTA bands, headings and CTA buttons on semantic utilities.
- `components/RoadmapTimeline.tsx` - status cards, status/area/priority badges, timeline line and dots.
- `components/RoadmapProgress.tsx` - stat tiles, progress fills and area Breakdown bars.
- `components/RoadmapFilters.tsx` - filter chips (selected accent, unselected neutral without a border).
- `e2e/visual/routes.spec.ts-snapshots/roadmap/{375,768,1440}-reduced-visual-dark-linux.png` - re-baselined.

## Decisions Made
- **D1-D3 are Tim's choices.** He answered the Task 1 decision checkpoint in this session with D1 = A, D2 = A, D3 = A and chip edge "No, keep mechanical". The `b7b56cf` body records them.
- **Contrast basis** (computed from the globals.css OKLCH values): white on accent is 1.69:1 and white on success 1.77:1, which fail; that is why D2 and D3 had options. `text-ink-inverse` on accent, success and caution is 11.3, 10.8 and 11.6:1. Success, accent, caution and danger text on `surface-overlay` is 9.3, 9.7, 10.0 and 6.2:1. `border-line` on `surface-raised` is 1.52:1, so it is used only as a soft divider.
- **DSGN-06 and GUARD-04 stay Pending.** `requirements.ready-ids` returns `ready: [], blocked: [DSGN-06, GUARD-04]`: 07-18, 07-19 and 07-20 also declare both and have no SUMMARY. `requirements-completed` copies the plan's `requirements` verbatim; REQUIREMENTS.md is unchanged.

## Deviations from Plan

None in the delivered result: stock count 0, only roadmap/* re-baselined, tests unmodified, CI green. Code-structure changes made while mapping, with no behaviour change:
- **`statusConfig` fields in RoadmapTimeline** were renamed to `dotColor` / `cardBorder` / `badgeColor`, so cards and badges carry the separate D1 classes.
- **Unused `color` / `textColor` dropped** from the Timeline and Progress area configs and the Progress stats. D3 makes them uniform.
- **The area badge className** became a plain string.
- **The Progress stat-tile icon** is now explicitly `text-ink-muted`; before, it inherited its colour.

## Issues Encountered
- **Page height changed, not only colour:** 1440 4831 -> 4835 px, 768 6255 -> 6259 px, 375 10411 -> 10445 px. Row-profile alignment and the diff trace this to the chosen treatments. D2's `border-y` on the hero and CTA bands adds 2px each (+4px at every width). D3 gives the area chip a 1px `border border-line-strong` (it was a borderless filled pill), adding 2px per card. That only shows at 375, where each card stacks the status, area and priority badges on separate rows (15 cards = +30px). At 768 and 1440 the area chip shares a row with the already-bordered status and priority badges, so row height does not change. Tim reviewed this before the amend; it is not a regression.
- **Determinism:** the CI actual images (dark and light) are pixel-identical (0 px) to the baseline-run PNGs at all 3 widths.
- **Pre-existing, unchanged:** at 375 the Target Release pill still touches the card edge (Phase 11 card-header fix, STATE blocker from 07-13).
- **Lint:** `npm run lint` exit 0 with 54 pre-existing warnings, none in the 4 files.

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-23 (Roadmap information encoding):** accepted as planned. Icons and visible labels stay on status, area and priority; reviewed in the re-baseline.
- **T-07-SC (npm installs):** no packages were installed.

## User Setup Required
None new from this plan. The two 07-USER-SETUP.md items are still open with Tim (Vercel build log Node 24.x / `npm ci`; required status checks on `main`).

## Next Phase Readiness
- **Ready for 07-18** (8c map, group Projects), with the same pattern: one mapping commit, re-baseline of that group's slugs only.
- **Pushing:** `b7b56cf` is on `origin/ci/07-17`. The docs commits stay local.

## Verification (close-out, 2026-10-23)

| Check | Result |
|-------|--------|
| `check-visual-run.mjs --sha b7b56cfd4d1c49330fb7de8bb459068a8e1ff26b --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39995314853/job/120557204219`, exit 0 |
| `check-visual-run.mjs --sha b7b56cf… --job "Unit Tests" --wait 1` | `PASS …/runs/39995314853/job/120557204071`, exit 0 |
| `check-visual-run.mjs --sha b7b56cf… --job "E2E Tests" --wait 1` | `PASS …/runs/39995314853/job/120557203989`, exit 0 |
| `check-snapshot-commit.mjs --sha HEAD --allow roadmap --some` | `snapshot-commit: OK (3 changed)`, exit 0 |
| `git show --name-status b7b56cf` | 7 M (4 source, 3 roadmap PNG), 0 A, 0 D |
| Task 1 stock-palette grep | 0 (98 at `de54c1b`) |
| v1 alias / hex / oklch / rgba / arbitrary colour in added lines | 0 |
| `requirements.ready-ids 07-17-PLAN.md DSGN-06 GUARD-04` | ready [], blocked [DSGN-06, GUARD-04] |

## Self-Check: PASSED
- `b7b56cf` is an ancestor of HEAD; `git rev-list --count de54c1b..HEAD` = 1 from the plan ledger.
- All 7 modified files exist and are exactly the plan's `files_modified` (4 source files + `roadmap/**`).
- Task 1 automated stock grep and Task 2 acceptance commands re-run at close-out and pass.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-23*
