---
phase: 13-repo-safety-test-debt
plan: 22
subsystem: planning-records
status: complete
tags: [verify-07, d-17, d-19, ledger, key-decisions, guard-07, guard-08, guard-09]

requires:
  - phase: 13-repo-safety-test-debt
    provides: "13-06 approved ledger triage (Tim: \"approve — WR-07 fix, IN-08 GUARD-10, 12 IN-08 accept)\"); the row → commit tables of 13-08, 13-09, 13-11, 13-13 and 13-14; 13-02 (12 IN-11, GUARD-09); 13-18 and 13-20 (07 WR-05, DEPS-06); 13-16 ruleset and Deployment Checks reply; 13-17 keep-alive run; 13-19 relay decision a-confirmed; 13-21 not needed"
provides:
  - "13-LEDGER-TRIAGE.md Final (13-22) column for all 44 rows: fixed 32, deferred 9, skipped 3"
  - "The four archived v2.0 disposition files with no open row; each of the 44 former open rows points to 13-LEDGER-TRIAGE.md #n"
  - "ROADMAP.md scope notes under Phases 14, 15, 17 and 18 for every handed-over row and phase follow-up"
  - "deferred-items.md: every item names its home, owner or trigger; four new items"
  - "Five PROJECT.md Key Decisions rows: main ruleset, [ci skip] relay option A, keep-alive monitor, production gate (live proof pending), docs-only fast path"
affects: [phase 13 verification and close (Deployment Checks live proof on the phase-close merge), Phase 14 (07 WR-06/SHELL-07, 10 IN-01, Deployment Checks fallback), Phase 15 (GUARD-10, guard:tests suggestion, scripts/README 47 pairs), Phase 17 (10 IN-03, E2E duration), Phase 18 (10 IN-04, IN-05, IN-08, IN-09 switchTo wait)]

actuals:
  tokens: 19000    # chars/4 over the realized diff (git diff 521603e..06c9280 = 76,250 chars); this SUMMARY and the state commit are extra
  tasks: 3
  commits: 3       # MEASURED: git rev-list --count 521603e..HEAD at this SUMMARY write
plan_head_before: 521603e8e5b935ce803a6b066d96abe72a307e9a
plan_head_after: 06c9280

tech-stack:
  added: []
  patterns:
    - "Ledger write-back: the triage file is the record (D-19); each archive Source cell names the commits, the approved reason or the owner, then (13-LEDGER-TRIAGE.md #n)"

key-files:
  created:
    - .planning/phases/13-repo-safety-test-debt/13-22-SUMMARY.md
  modified:
    - .planning/ROADMAP.md
    - .planning/PROJECT.md
    - .planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md
    - .planning/phases/13-repo-safety-test-debt/deferred-items.md
    - .planning/milestones/v2.0-phases/07-foundation-guardrails/07-REVIEW-DISPOSITION.md
    - .planning/milestones/v2.0-phases/09-home-ascent/09-REVIEW-DISPOSITION.md
    - .planning/milestones/v2.0-phases/10-photography/10-REVIEW-DISPOSITION.md
    - .planning/milestones/v2.0-phases/12-contact-edge-pages-cleanup-verification/12-REVIEW-DISPOSITION.md

key-decisions:
  - "13-22: every final enum equals the approved Enum cell of 13-LEDGER-TRIAGE.md; no row changed disposition after Tim's 13-06 approval (fixed 32, deferred 9, skipped 3)"
  - "13-22: 07 WR-05 and 12 IN-11 stay deferred as approved (handed to DEPS-06 and GUARD-09); their Source cells add the Phase 13 commits that did that work (5ab6d15; 04d705f, 043dfcb)"
  - "13-22: no new requirement: none of the handed-over rows describes behaviour a rewrite must keep, so each became a ROADMAP scope note (D-17)"
  - "13-22: Deployment Checks recorded as on per Tim's 13-16 reply \"applied, deployment checks on\", live proof pending the phase-close merge; owner Phase 13 close, fallback the first Phase 14 merge"

requirements-completed: [VERIFY-07, GUARD-07, GUARD-08, GUARD-09]  # requirements.ready-ids on 13-22-PLAN.md returned ready [VERIFY-07, GUARD-07, GUARD-08, GUARD-09], blocked [] (13-22 is the last plan declaring them)

coverage:
  - id: D1
    description: "No open row in the four archived disposition files (frontmatter and table)"
    requirement: VERIFY-07
    verification:
      - kind: other
        ref: "! git grep -n -E \"disposition: open|\\| open \\|\" -- <the four *-REVIEW-DISPOSITION.md files> (no output, exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every changed archive row points to 13-LEDGER-TRIAGE.md, and every fixed row's SHA resolves"
    requirement: VERIFY-07
    verification:
      - kind: other
        ref: "git grep -c 13-LEDGER-TRIAGE -- .planning/milestones/v2.0-phases/ (07:23, 09:6, 10:10, 12:5); git cat-file -e on every SHA in the fixed rows (no BAD line)"
        status: pass
    human_judgment: false
  - id: D3
    description: "13-LEDGER-TRIAGE.md has a Final value in all 44 rows"
    requirement: VERIFY-07
    verification:
      - kind: other
        ref: "node count of table rows whose last cell starts with fixed:/deferred:/skipped: → rows 44 with Final 44"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every deferred ledger row (other than DEPS-06 and GUARD-09) is named in ROADMAP.md or REQUIREMENTS.md"
    requirement: VERIFY-07
    verification:
      - kind: other
        ref: "Task 1 check scoped to the Enum column → handed over: 7 (the plan's own /hand/i filter gives two false positives, see Issues Encountered)"
        status: pass
    human_judgment: false
  - id: D5
    description: "PROJECT.md Key Decisions carries the ruleset, relay, keep-alive, production-gate and docs-only rows, and only table rows were added"
    verification:
      - kind: other
        ref: "Task 3 node check → key decisions recorded; git show 06c9280 --numstat → 5 0 .planning/PROJECT.md"
        status: pass
    human_judgment: false
  - id: D6
    description: "The production gate actually holds a production deployment until CI OK"
    requirement: GUARD-08
    verification: []
    human_judgment: true
    rationale: "Not provable by an agent: the setting rests on Tim's 13-16 reply, and the first production deployment after the next merge to main (the phase-close PR) is the live proof"

duration: 10min
completed: 2026-11-13
---

# Phase 13 Plan 22: Ledger Write-back, Hand-overs and Key Decisions Summary

**All 44 v2.0 review-ledger rows now carry an evidenced final status in both the triage file and the four archived disposition files (fixed 32 with resolvable SHAs, deferred 9 with owners, skipped 3 with Tim-approved reasons). Every hand-over has a home in ROADMAP scope notes or deferred-items.md, and PROJECT.md records the five repo-safety decisions, with the Deployment Checks live proof still pending.**

## Performance

- **Duration:** about 10 min
- **Started:** 2026-11-13T20:35:04Z
- **Completed:** 2026-11-13T20:45Z
- **Tasks:** 3/3
- **Files modified:** 8, plus this SUMMARY

## Accomplishments

- **VERIFY-07 closed (D-19).** In `07-`, `09-`, `10-` and `12-REVIEW-DISPOSITION.md`, the 44 rows that read `open` (88 lines: frontmatter and table) now read `fixed`, `skipped` or `deferred`. Each Source cell ends `(13-LEDGER-TRIAGE.md #n)`, and each frontmatter `open:` count is 0. Rows that were already decided are untouched, and the three formerly open Phase 9 rows that carried the "(not in the current review)" flag (IN-04, IN-06, IN-07) keep it. `13-LEDGER-TRIAGE.md` gains a `Final (13-22)` column and a `## Final (13-22)` section.
- **Hand-overs (D-17).** Every deferred row and every follow-up from the phase SUMMARYs has a home with an owner (table below). No new requirement was needed.
- **Key Decisions.** Five rows were added to PROJECT.md: the `main` ruleset, the `[ci skip]` relay (option A), the Upstash keep-alive monitor, the production gate (pending live proof) and the docs-only fast path.

## Task Commits

1. **Task 1: Hand-overs into later phases (D-17)**: `99e8602` (docs). ROADMAP.md scope notes and deferred-items.md homes.
2. **Task 2: Final status in the triage file and the four archived ledgers (D-19)**: `65c32c6` (docs)
3. **Task 3: PROJECT.md Key Decisions**: `06c9280` (docs)

**Plan metadata:** a docs commit with this SUMMARY, STATE.md, ROADMAP.md and REQUIREMENTS.md follows.

## Final ledger status (44 rows)

| Enum | Rows | Evidence |
|---|---|---|
| `fixed` | 32 | 10 already fixed (historical commits, e.g. 07 IN-02 `123d67a`, 07 IN-16 `31daaf9` + `cf369b5`); 22 fixed in Phase 13 by 13-08 (7), 13-09 (5), 13-11 (3), 13-13 (4), 13-14 (3). Every SHA passes `git cat-file -e` |
| `deferred` | 9 | 07 WR-05 → DEPS-06 (complete: 13-18 `5ab6d15`, 13-20); 12 IN-11 → GUARD-09 (13-02 `04d705f`, `043dfcb`); 07 WR-06 → SHELL-07 (Phase 14); 07 IN-08 → GUARD-10 (Phase 15); 10 IN-01 → Phase 14; 10 IN-03 → Phase 17; 10 IN-04, IN-05, IN-08 → Phase 18 |
| `skipped` | 3 | 09 IN-01, 09 IN-02 (approved reasons: Home pixels, baselines); 12 IN-08 (Tim's call "accept": a real visitor cannot produce the fieldless answer) |

10 IN-09 is `fixed` (`86b34dc`) for the three lightbox tests that survive Phase 18. The photos-sweep `switchTo` 600 ms wait goes with the view switch and is a Phase 18 scope note.

## Where every hand-over went

| # | Item | Source | Home | Owner / trigger |
|---|---|---|---|---|
| L1 | 07 WR-06 (mobile menu stays open on the current page) | triage #6 | SHELL-07 in REQUIREMENTS.md, plus a Phase 14 scope note | Phase 14 |
| L2 | 07 IN-08 (tests excluded from type-check) | triage #14 | GUARD-10 (REQUIREMENTS.md, Phase 15 SC6), plus a Phase 15 scope note | Phase 15 |
| L3 | 10 IN-01 (hidden callout takes the first Escape) | triage #30 | Phase 14 scope note | Phase 14, with the LBOX-08 Escape work |
| L4 | 10 IN-03 (duplicated photo-path parsing, `isEditable`) | triage #32 | Phase 17 scope note | Phase 17 |
| L5 | 10 IN-04 (AVIF-only neighbour preload) | triage #33 | Phase 18 scope note | Phase 18, LBOX-09 |
| L6 | 10 IN-05 (`STAGE_SIZES`) | triage #34 | Phase 18 scope note | Phase 18 |
| L7 | 10 IN-08 (row-height drift guard) | triage #37 | Phase 18 scope note | Phase 18, PHOTO-06 |
| L8 | 07 WR-05 → DEPS-06, 12 IN-11 → GUARD-09 | triage #5, #43 | Phase 13 requirements (no note needed) | done in 13-18/13-20 and 13-02 |
| 1 | Remove the `@firefox-43967` tags and `FIREFOX_INVERT`/`FIREFOX_ONLY_TAGS`; Firefox `--list` back from 434 to 441 | 13-20 | deferred-items.md | the plan that takes the next Playwright bump (Tim checks the package); trigger: the release whose Firefox roll fixes microsoft/playwright#43967 |
| 2 | Have `npm run lint` (or a pre-push step) also run `guard:tests` (suggestion) | 13-20 | Phase 15 scope note (deferred-items status points there) | Phase 15, Tim's call, while GUARD-10 reworks `type-check` |
| 3 | Limit probe should print the probe index and Retry-After | 13-17 | deferred-items.md | the next plan that runs or edits the limit probe |
| 4 | Relay long-mirror wait (~40 min; mirror timeout 100 min) untested live | 13-19 | deferred-items.md, and the relay row in PROJECT.md | whoever watches the first code-changing `[ci skip]` PR |
| 5 | Deployment Checks live proof | 13-16 | deferred-items.md, PROJECT.md production-gate row, Phase 14 scope note (fallback) | Phase 13 close (phase-close PR merge); fallback the first Phase 14 merge |
| 6a | 25 dev-only npm audit advisories; should audit fail `CI OK`? | 13-15 | deferred-items.md | Tim; trigger: the next dependency review or a Dependabot security PR for these packages |
| 6b | `@types/jest` vetting | 13-06 | Phase 15 SC6 (already there) plus the Phase 15 scope note | Tim vets it, or Phase 15 uses `@jest/globals` |
| 7 | `scripts/README.md:78` says 36 contrast pairs; there are 47 | 13-13 | Phase 15 scope note (deferred-items status points there) | Phase 15, when the served-asset guard rules are documented in that README |
| 8 | 10 IN-09's 600 ms `switchTo` wait | 13-09 | Phase 18 scope note | Phase 18, PHOTO-06 rewrite |
| 9 | E2E duration trend 28m31s → 37m40s → 38m43s → 37m24s vs the ~45-minute line | 13-15, 13-20 | Phase 17 scope note (deferred-items entry points there) | Phase 17 (region pages join the audit gate); Phase 18 adds more |
| 10 | `ci/13-pw165` still on origin (at cffcf99) | 13-20 | deferred-items.md | Tim, after the phase PR merges |

## Key Decisions rows added (PROJECT.md)

1. **`main` ruleset:** id 27216079, no bypass actors, PR required (0 approvals), merge commits only, `CI OK` pinned to integration 15368, strict off, 10401314 deleted. Emergency path: Tim disables it in Settings → Rules. The GitHub-added `require_extra_approval_for_unattributed_changes: true` is noted (not in our JSON; no proof was blocked by it). Outcome ✓ Good.
2. **`[ci skip]` relay, option A:** Tim's 13-19 selection "a-confirmed (Recommended)". The relay's `CI OK` on marked PR heads is the accepted exception to unique check names. The long-mirror path is untested. Outcome ✓ Good.
3. **Keep-alive as limiter monitor:** `23 5 * * *` plus dispatch; first manual run 43466849915 succeeded. Residual risks: the 60-day schedule pause and Hobby's roughly one-hour log retention. Outcome ✓ Good.
4. **Production gate:** "Deployment Checks on `CI OK` (Tim, 2026-11-13); live proof pending the phase-close merge", with the D-07 residual described if the gate does not hold. Outcome — Pending. It is not claimed as proven.
5. **Docs-only fast path (D-08, D-09):** includes the 13-15 note that on `pull_request` events the classifier compares the PR base with the head, so a docs-only push to an open code PR still runs the full CI, by design. Outcome ✓ Good.

## Verification

| Check | Result |
|---|---|
| Task 1 hand-over check (plan command) | exit 1, `not handed over: 09 IN-03, 09 IN-04`: a false positive (see Issues Encountered) |
| Task 1 check, scoped to the Enum column | `handed over: 7` (07 WR-06, 07 IN-08, 10 IN-01, IN-03, IN-04, IN-05, IN-08) |
| Task 2 negative grep over the four files | no output (baseline at HEAD 521603e: 88 lines) |
| Task 2 `git grep -c "13-LEDGER-TRIAGE" -- .planning/milestones/v2.0-phases/` | 07: 23, 09: 6, 10: 10, 12: 5 (exit 0) |
| `git cat-file -e` on every SHA in the `fixed` rows | all resolve (49 SHAs checked before writing, every archive SHA re-checked after) |
| Final column count | 44 of 44 rows |
| Task 3 PROJECT.md check | `key decisions recorded` (baseline: 0 matches) |
| `git show 06c9280 --numstat` | `5 0 .planning/PROJECT.md` (only added table rows) |
| `npm run lint` | exit 0 (last line `served-images: OK`) |
| `requirements.ready-ids` (VERIFY-07, GUARD-07, GUARD-08, GUARD-09) | ready all four, blocked none |

## Decisions Made

- Final enums follow the approved `Enum` cells exactly. 07 WR-05 and 12 IN-11 stay `deferred` (as approved) even though their owning requirements finished in this phase. Their Source cells name the commits that did the work rather than relabelling them `fixed`.
- The `open:` count in each disposition file's frontmatter is set to 0, so it matches the rows.
- Hand-over homes: an item goes to a ROADMAP scope note when a later phase naturally does the work (Phases 14, 15, 17, 18). It goes to deferred-items.md with a named owner and trigger when no phase owns it (upstream Playwright release, the limit probe, the relay's long-mirror path, the audit decision, branch cleanup) or when it belongs to the phase close (the Deployment Checks proof).

## Deviations from Plan

**1. [Rule 2 - Missing critical] deferred-items.md updated beyond the plan's `files_modified`**
- **Found during:** Task 1
- **Issue:** Five open deferred items and five new follow-ups needed an owner or a home. The plan lists only ROADMAP.md and REQUIREMENTS.md for Task 1.
- **Fix:** Each existing item's `status:` now names its home or owner and trigger, and four new items were added (Deployment Checks live proof, relay long-mirror path, E2E duration trend, `ci/13-pw165`). The orchestrator's brief asked for this.
- **Committed in:** `99e8602`

**2. [Rule 2 - Missing critical] Three ROADMAP phases had no `**Scope notes**` list**
- **Found during:** Task 1
- **Issue:** The plan's action adds bullets "under that phase's `**Scope notes**`", but Phases 14, 17 and 18 had no such list.
- **Fix:** Each got a `**Scope notes**` block after its `**Inputs from Tim**` line, added with scoped Edits. Phase 15's existing list was extended.
- **Committed in:** `99e8602`

---

**Total deviations:** 2, both Rule 2. **Impact:** records only; no code changed.

## Issues Encountered

- **The plan's Task 1 check gives a false positive.** It selects rows matching `/hand/i` anywhere in the line. Row 26 (09 IN-03) matches through its title "hand-measured", and row 27 (09 IN-04) through its unchosen alternative "hand to Phase 18". Both are `fixed` rows (13-08: `86763c5`; `cf70c6d`, `58523e1`), so they have nothing to hand over. The same check scoped to the `Enum` column (`deferred`, minus DEPS-06/GUARD-09) passes with 7 rows. No content was added to ROADMAP.md to satisfy the heuristic.
- **GUARD-08 marked by the gate, with one caveat.** `requirements.ready-ids` reported GUARD-08 ready, so it is marked Complete as the orchestrator asked. Its clause "nor reaches production unchecked" rests on Deployment Checks, whose live proof is still pending the phase-close merge (coverage D6, `human_judgment: true`). Phase verification should weigh this.

## Known Stubs

None. This plan changed only planning records.

## User Setup Required

None. For the phase close: when the phase-close PR merges to `main`, check that its production deployment waited for `CI OK`. After the merge, Tim may delete `ci/13-pw165`.

## Next Phase Readiness

- Phase 13 has 22/22 plans with SUMMARYs. Phase verification and `phase.complete` are the orchestrator's next steps.
- Open at close: the Deployment Checks live proof (phase-close merge), the relay's long-mirror path (first code-changing `[ci skip]` PR), and the deferred-items owners listed above.

## Self-Check: PASSED

- FOUND: `.planning/phases/13-repo-safety-test-debt/13-22-SUMMARY.md`, `13-LEDGER-TRIAGE.md`, `.planning/PROJECT.md`, `.planning/ROADMAP.md`, the four disposition files.
- FOUND: commits `99e8602`, `65c32c6`, `06c9280` (each `git merge-base --is-ancestor <hash> HEAD`).
- `verify-summary` false positive: it reports `self_check: failed` because its pattern takes everything from the first `## Verification` heading to the end of the file, and any "fail" or "blocked" there trips it (for example "blocked none" in the ready-ids row and the plan check's own exit result). The checks themselves passed, as the Verification table shows. No heading was renamed to avoid it.

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
