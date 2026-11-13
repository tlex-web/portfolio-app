---
phase: 13-repo-safety-test-debt
plan: 08
subsystem: testing
tags: [ledger, e2e, playwright, jest, rounding, VERIFY-07]
status: complete

requires:
  - phase: 13-repo-safety-test-debt
    provides: "13-06 approved ledger triage (13-LEDGER-TRIAGE.md ## Approval, 2026-11-13): seven fix-now rows owned by 13-08"
provides:
  - "07 IN-01, IN-03, IN-11, IN-17 and 09 IN-03, IN-04, IN-07 fixed, one commit per row naming the row id"
  - "fixedDecimals (fourDecimals, formatLatLon) rounds a written half away from zero"
  - "Skip links re-counted after hydration in both shell tests; summit plaque height asserted against the layout model"
affects: [13-22, 13-15, phase-18-photo-08]

actuals:
  tokens: 2524
  tasks: 3
  commits: 8
plan_head_before: 248761e218cc419e31f4586a563cf13bf5c6e257
plan_head_after: 58523e19caefb61b219e62a505d35318f0c29836

tech-stack:
  added: []
  patterns:
    - "Hydration wait in e2e: poll a host node for React's __reactProps key before a post-hydration count"
    - "Decimal rounding via exponent shift of toExponential(), never multiply-then-round"

key-files:
  created: []
  modified:
    - scripts/README.md
    - e2e/design-system.spec.ts
    - app/(site)/error.tsx
    - e2e/shell.spec.ts
    - e2e/home-ascent.spec.ts
    - e2e/homepage.spec.ts
    - lib/home-format.ts
    - lib/__tests__/home-format.test.ts

key-decisions:
  - "09 IN-03 asserts against summitColumnBox(w, h, 0).height, which already returns COMPACT_H or FULL_H, so lib/ascent/summit-layout.ts stays unchanged (no export added)"
  - "09 IN-04 fixes fixedDecimals, the shared helper behind fourDecimals and formatLatLon, so the 2-dp Contact location gets the same half-away-from-zero rule; the four waypoint strings are pinned as literal input/output pairs copied from data/generated/photos.ts, not read from the data, so later content additions cannot break them"
  - "07 IN-17 re-counts the skip links in both the landmarks test (after Tab/Enter) and the 404 test (ledger correction: shell.spec.ts:175 has the same single count), each after an explicit hydration wait"

patterns-established:
  - "Seeded-fault proof per e2e row: break the code or DOM, see the new assertion fail, restore, see it pass"

requirements-completed: [VERIFY-07]

coverage:
  - id: D1
    description: "07 IN-01: scripts/README emoji row states the rule runs in lint"
    requirement: VERIFY-07
    verification:
      - kind: other
        ref: "npm run lint (guard:palette OK, emoji rule active) + git show --stat 89ea626"
        status: pass
    human_judgment: false
  - id: D2
    description: "07 IN-03: G3 comment describes the settle loop, no v1 Header mention"
    requirement: VERIFY-07
    verification:
      - kind: other
        ref: "npx eslint e2e/design-system.spec.ts; e2e/design-system.spec.ts G3 comment"
        status: pass
    human_judgment: false
  - id: D3
    description: "07 IN-11: section error component renamed SectionError, props and markup unchanged"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "components/site/__tests__/ErrorBody.test.tsx#app/(site)/error"
        status: pass
      - kind: other
        ref: "npm run type-check"
        status: pass
    human_judgment: false
  - id: D4
    description: "07 IN-17: skip links re-counted after hydration in the landmarks and 404 shell tests"
    requirement: VERIFY-07
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/shell.spec.ts --project=chromium"
        status: pass
    human_judgment: false
  - id: D5
    description: "09 IN-03: summit plaque height matches COMPACT_H/FULL_H within 2 px at all 11 static sizes"
    requirement: VERIFY-07
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/home-ascent.spec.ts --project=chromium#Summit plaque clears the poster pins (G-09-2, static)"
        status: pass
    human_judgment: false
  - id: D6
    description: "09 IN-04: fourDecimals rounds half away from zero; four waypoint strings unchanged"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "lib/__tests__/home-format.test.ts#rounds a half at the fifth decimal away from zero for positive and negative values (09 IN-04)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/home-format.test.ts#prints the waypoint position %o unchanged"
        status: pass
    human_judgment: false
  - id: D7
    description: "09 IN-07: server-HTML role check escapes every ampersand"
    requirement: VERIFY-07
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/homepage.spec.ts --project=chromium#server HTML shows the name, role and relief poster (HOME-01)"
        status: pass
    human_judgment: false
  - id: D8
    description: "Pixel neutrality of all seven rows"
    requirement: VERIFY-07
    verification: []
    human_judgment: true
    rationale: "No row changes markup, copy or a formatter output (the waypoint and kicker strings are asserted unchanged), but the plan defers the pixel proof to Visual Regression on the mid-phase PR (13-15)"

duration: 11min
completed: 2026-11-13
---

# Phase 13 Plan 08: Ledger test, comment and code rows Summary

**Seven approved Phase 7 and Phase 9 ledger rows fixed, one commit each. The skip links are counted again after hydration, the summit plaque height is checked against the layout model, the server-HTML check escapes every `&`, and `fourDecimals` now rounds a written half away from zero. The waypoint coordinate strings it prints are unchanged.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-11-13T11:02:51Z
- **Completed:** 2026-11-13T11:13:13Z
- **Tasks:** 3 of 3
- **Files modified:** 8

## Row → commit (for 13-22)

All seven rows were approved fix-now with owner 13-08 in `13-LEDGER-TRIAGE.md` (rows 8, 10, 17, 23, 26, 27, 29; `## Approval`, 2026-11-13). None was skipped.

| Ledger row | Title (short) | Commit(s) | File |
|---|---|---|---|
| 07 IN-01 | scripts/README emoji row stale | `89ea626` | scripts/README.md |
| 07 IN-03 | G3 comment describes the deleted v1 Header | `b58d34f` | e2e/design-system.spec.ts |
| 07 IN-11 | Section error component named `Error` | `6c13de4` | app/(site)/error.tsx |
| 07 IN-17 | Skip-link count checked once | `4ec93d0` | e2e/shell.spec.ts |
| 09 IN-03 | Summit-layout magic numbers unguarded | `86763c5` | e2e/home-ascent.spec.ts |
| 09 IN-04 | `fourDecimals` not round-half-up for every input | `cf70c6d` (RED), `58523e1` (GREEN) | lib/__tests__/home-format.test.ts, lib/home-format.ts |
| 09 IN-07 | Server-HTML assertion escapes only the first `&` | `719e0c4` | e2e/homepage.spec.ts |

Six of the commits use the plan's `fix(13): <row id> …` subject. The TDD pair uses `test(13-08)`/`feat(13-08)` for the gate, and both name the row. A plan-subject scope (`check evaluation-scope --plan 13-08`) therefore finds only the TDD pair. The full set is the measured range `248761e..58523e1` (8 commits).

## Accomplishments

- **07 IN-01:** the emoji row no longer says "skipped in lint until plan 07-25". `guard:palette` passes no `--skip`, so the rule runs in `npm run lint`. The guard itself is unchanged.
- **07 IN-03:** the G3 comment now explains why the banner box is read at rest (both boxes taken after two equal reads). It no longer cites the deleted v1 Header entrance.
- **07 IN-11:** `export default function SectionError(`. Props, markup, `'use client'` and the `ErrorBody` call are unchanged. The only importer (`ErrorBody.test.tsx`) already used a default import named `SectionError`.
- **07 IN-17:** a `hydrated(page)` helper polls `#main-content` for React's `__reactProps` key. Both the landmarks test (after Tab/Enter) and the 404 test then count `Skip to main content` again (exactly 1) and every `/skip to/i` link again (2 on `/`, 1 elsewhere).
- **09 IN-03:** each of the 11 static G-09-2 rows asserts `|rendered [data-summit-plaque] height − summitColumnBox(w, h, 0).height| ≤ 2`. Measured: compact 171.0 px against 170, and full 478.0 px against 478.
- **09 IN-04:** `fixedDecimals` rounds on the value's shortest decimal string by shifting the exponent of `toExponential()`. For example, `'1.00185e+4'` parses to exactly 10018.5. It stays import-free, with no `Intl` or `toLocale`, and the signatures are unchanged.
- **09 IN-07:** `site.role.replaceAll('&', '&amp;')`.

## Seeded faults (Task 2 acceptance: each new assertion seen failing, then passing)

Run on a local production build (`PW_PROD=1 PW_REUSE=1`, Chromium), every seed restored afterwards and never staged:

| Row | Seed | Result with seed | Result restored |
|---|---|---|---|
| 07 IN-17 | `page.evaluate` appends a second `<a href="#main-content">Skip to main content</a>` after the first count, before the re-count (`/roadmap` landmarks test, `/__no-such-page__` 404 test) | 2 failed at the re-count: Expected 1, Received 2 (the first count had passed) | passed |
| 09 IN-03 | `COMPACT_H = 200`, `FULL_H = 520` in `lib/ascent/summit-layout.ts` | 2 failed: compact 171.0 vs 200 at 375 x 667 (diff 29), full 478.0 vs 520 at 1440 x 900 (diff 42) | passed |
| 09 IN-07 | Production build with `site.role = 'Developer & photographer & seed'` | old `.replace` failed (expected `…photographer & seed`), `replaceAll` passed. With the test-side role drifted to `…& other`, `replaceAll` failed. | passed |

Final run of the plan's verify command on a fresh clean build: `PW_PROD=1 npx playwright test e2e/shell.spec.ts e2e/home-ascent.spec.ts e2e/homepage.spec.ts --project=chromium` gave **89 passed**, with no flaky and no failed tests. Test counts are unchanged (shell 10, home-ascent 25, homepage 6 `test(` declarations, before and after), and no new `test(` lines were added.

## TDD Gate Compliance (Task 3, 09 IN-04)

- **RED** `cf70c6d`: `npx jest lib/__tests__/home-format.test.ts` with the scratchpad TAP 13 reporter gave exit 1, 37 tests, 35 passed and 2 failed. Both targets were classified `RED_EVIDENCE_OK` (`target_test_failed`, format tap). The records are `.git/gsd-red-13-08-t3-0.json` and `-1.json` (untracked by design).
  - `formatLatLon … rounds half away from zero at two decimals as well (09 IN-04)`: expected `0.15 N · 1.01 W`, received `0.14 N · 1.00 W`.
  - `formatCoordinates … rounds a half at the fifth decimal away from zero for positive and negative values (09 IN-04)`: expected `1.0019 N 1.0100 W`, received `1.0018 N 1.0099 W`.
  - **Semantic assessment:** both targets ran and failed on their `toBe` assertion for the planned reason (each double sits just below its written half, so multiply-then-round printed the lower value). There was no load, syntax or fixture fault. The four waypoint rows and the sub-1e-6 row passed in RED, as designed, because they pin today's output.
- **GREEN** `58523e1`: 37/37 pass. The full jest suite passes (1737 tests in 104 suites), and type-check, eslint and the full `npm run lint` chain are green.
  - Extra sweep (not committed): 450,000 written 4-dp values (signed, at the half, just under it and just over it) and 100,000 2-dp values gave 0 mismatches against exact decimal rounding.
  - One million random computed doubles print the same string under the old and new code, so the computed summit kicker cannot move.
- **REFACTOR:** none needed.

## Files Created/Modified

- `scripts/README.md`: the emoji row matches today's lint.
- `e2e/design-system.spec.ts`: G3 settle-loop comment.
- `app/(site)/error.tsx`: default export renamed `SectionError`.
- `e2e/shell.spec.ts`: `hydrated()` helper and post-hydration skip-link re-counts in two tests.
- `e2e/home-ascent.spec.ts`: plaque height against `summitColumnBox().height`, and the `summitColumnBox` import.
- `e2e/homepage.spec.ts`: `replaceAll`.
- `lib/home-format.ts`: exponent-shift rounding in `fixedDecimals`, and doc comments.
- `lib/__tests__/home-format.test.ts`: half-way cases (4 dp and 2 dp, both signs), sub-1e-6 values, and the four waypoint strings.

## Decisions Made

See `key-decisions` above: the summit-layout constants are read through `summitColumnBox`, so that file is not touched. The rounding fix sits in the shared `fixedDecimals`. Waypoint inputs are pinned literally. The re-count covers both shell tests.

## Deviations from Plan

### Auto-fixed Issues

None.

### Scope notes (not deviations from the approved rows)

- **09 IN-03, `lib/ascent/summit-layout.ts` not modified:** the plan allowed exporting the constants. `summitColumnBox(w, h, 0).height` already returns `COMPACT_H` or `FULL_H` per layout, so no export was needed and the file is unchanged (`git diff 248761e HEAD -- lib/ascent/summit-layout.ts` is empty).
- **07 IN-17, 404 test included:** the plan names "that shell test". The approved row's evidence (with the 13-06 correction) cites both `shell.spec.ts:67` and `:175`, so both got the re-count.
- **07 IN-01:** only the emoji row was stale. The lint-chain half of the original finding was already fixed (the triage evidence agrees).
- **ui-ux-pro-max:** not invoked. No row changes UI. The only app/ change is a function name, with markup and copy identical.

**Total deviations:** 0 auto-fixed. **Impact:** none beyond the approved rows.

## Issues Encountered

- The first 07 IN-17 seed run matched no tests ("No tests found"), because a `-g` pattern anchored with `^` cannot match: Playwright's full title starts with the file path. Re-run without the anchor; both seeded tests then failed as intended.
- A Python patch of `e2e/home-ascent.spec.ts` failed its own guard on CRLF line endings and wrote nothing. The Edit tool applied the same change.
- Local production builds rewrote `public/service-worker.js` (postbuild hash). It was restored each time and never committed. The seeded `next start` and Playwright's own server were both stopped, and port 3000 is free.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- 13-22 can write these seven rows back as `fixed`, citing the commits in the row → commit table.
- Pixel neutrality is to be confirmed by Visual Regression on the mid-phase PR (13-15). Nothing here changes markup or copy.

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*

## Self-Check: PASSED

- All 8 modified files exist. All 8 commits (`89ea626`, `b58d34f`, `6c13de4`, `4ec93d0`, `86763c5`, `719e0c4`, `cf70c6d`, `58523e1`) are ancestors of HEAD.
- `grep -c "function SectionError" "app/(site)/error.tsx"` = 1; `grep -c "replaceAll" e2e/homepage.spec.ts` = 1.
- Each Task 1 commit's `git show --stat` lists only its row's file.
- type-check, eslint, full `npm run lint`, jest (1737/1737) and the three Chromium specs on a production build (89 passed) are green.
