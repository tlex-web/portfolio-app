---
phase: 13-repo-safety-test-debt
plan: 13
subsystem: testing
tags: [guards, contrast, palette, selftest, tailwind, git-ls-files]

requires:
  - phase: 13-repo-safety-test-debt
    provides: "13-06 approved ledger triage (07 WR-01, WR-02, WR-03, IN-06 fix-now, owner 13-13); 13-08 README edits; 13-12 selftest runner (nodeArgs field)"
provides:
  - "Contrast guard reads only top-level :root/@theme blocks and fails on a token block nested in an at-rule (07 WR-01)"
  - "Contrast selftest checks the real table order and each pair against its threshold, not pinned ratios (07 IN-06)"
  - "Palette guard prefix covers directional borders, ring offsets and the shadow-colour families (07 WR-02)"
  - "Palette png rule lists files with git ls-files -co --exclude-standard, so ignored local PNGs pass (07 WR-03)"
affects: [13-22, every v2.1 UI phase that runs npm run lint]

actuals:
  tokens: 6700
  tasks: 2
  commits: 8
plan_head_before: 0275ef378fdf334680897e35d1794fc513c65328
plan_head_after: 69d352057dc9ff997d21b827e48bd458957aa8b4

tech-stack:
  added: []
  patterns:
    - "Guard rules that inspect repo files list them with git (tracked plus untracked, ignored skipped) and fall back to a disk walk outside a work tree"
    - "Selftest cases that need git semantics build a temp git work tree from a .gitkeep-only fixture at run time"
    - "Real-file guard cases assert structure and thresholds; exact values stay in fixture cases"

key-files:
  created:
    - scripts/guards/__selftest__/contrast/media-override.css
    - scripts/guards/__selftest__/palette/bad-directional/app/page.tsx
    - scripts/guards/__selftest__/palette/bad-png-untracked/e2e/.gitkeep
  modified:
    - scripts/guards/check-contrast.mjs
    - scripts/guards/check-palette.mjs
    - scripts/guards/selftest.mjs
    - scripts/README.md

key-decisions:
  - "07 WR-01: a :root or @theme nested in any at-rule (@media, @supports, @container, @layer) is never merged; if it declares a custom property the guard fails, as the review's fix proposes (a nested block that only references var() is ignored, so the real @supports scrollbar block still passes)"
  - "07 IN-06: the real-file case asserts the OK line, the 47 labels in table order and each ratio at or above its own threshold (0.005 tolerance for the 2 dp display), with no recorded-value tolerance, following the approved triage proposal"
  - "07 WR-02: the widened PRE found no new hit and no wb count change on the real tree, so no checkpoint was needed and the ratchet did not move"

patterns-established:
  - "png rule: git ls-files -z -co --exclude-standard -- e2e under --root; deleted tracked files dropped"

requirements-completed: [VERIFY-07]

coverage:
  - id: D1
    description: "07 WR-01: contrast guard keeps media-scoped :root overrides out of the base palette and reports them"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#contrast: a :root nested in @media cannot mask a failing base token, and is reported (07 WR-01)"
        status: pass
      - kind: other
        ref: "npm run guard:contrast (real app/globals.css, output byte-identical to the previous guard)"
        status: pass
    human_judgment: false
  - id: D2
    description: "07 IN-06: contrast selftest no longer pins 12 exact production ratios"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#contrast: the real app/globals.css passes all 47 pairs ... (07 IN-06), plus the at-threshold and low-ink proof cases"
        status: pass
    human_judgment: false
  - id: D3
    description: "07 WR-02: palette guard catches directional border, ring-offset and shadow colour utilities"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#palette: directional borders, ring offsets and shadow-colour classes fail the stock and wb rules (07 WR-02)"
        status: pass
      - kind: other
        ref: "npm run guard:palette (real tree OK; --update probe into a temp ratchet wrote counts identical to palette-ratchet.json)"
        status: pass
    human_judgment: false
  - id: D4
    description: "07 WR-03: png rule skips git-ignored PNGs and still fails on untracked non-ignored or tracked non-linux PNGs"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#palette: a git-ignored local -win32.png under e2e/ passes ... (07 WR-03), the stray-PNG case and the bad-png case"
        status: pass
      - kind: other
        ref: "npm run lint (full chain, exit 0)"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 13: Contrast and Palette Guard Rows (07 WR-01, WR-02, WR-03, IN-06) Summary

**The contrast guard now reads only top-level `:root`/`@theme` blocks and fails on a token block nested in an at-rule. Its real-file selftest checks table order and thresholds instead of 12 pinned ratios. The palette guard sees `border-t-*`, `ring-offset-*`, `inset-ring-*` and the `inset-shadow`/`drop-shadow`/`text-shadow` colours, and its png rule lists files with `git ls-files -co --exclude-standard`, so ignored local `-win32.png` output no longer fails lint. Each fix has a fixture or case that was seen red first.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-11-13T12:05:43Z
- **Completed:** 2026-11-13T12:14:59Z
- **Tasks:** 2
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- **07 WR-01:** `readTokens` scans by brace depth and merges only top-level token blocks. A nested `:root`/`@theme` that declares a custom property fails with `nested token block: :root inside @media (...) declares --x; ...`. On the real `app/globals.css` and on all 8 existing contrast fixtures, the output is byte-identical to the previous guard.
- **07 IN-06:** the new `contrastTableCheck(css)` checks four things: exit 0, `contrast: OK (47 pairs)`, the 47 labels in table order, and each ratio at or above its threshold. The real-file case now uses it. Two proof cases show it accepts other passing ratios (`at-threshold.css`) and rejects a pair below threshold (`low-ink.css`).
- **07 WR-02:** `PRE` now also covers `border(?:-[xytblrse])?`, `ring(?:-offset)?`, `inset-ring`, `inset-shadow`, `drop-shadow` and `text-shadow`. Before the commit I ran it on the real tree. The result was still `palette: OK`, and a `--update` probe into a temp ratchet copy wrote counts identical to `palette-ratchet.json`. No new hits and no `wb` count change, so no checkpoint was needed.
- **07 WR-03:** the png rule reads `git ls-files -z -co --exclude-standard -- e2e` under `--root`. It drops deleted tracked files and falls back to the disk walk outside a work tree or without git. A real-tree probe used an ignored `e2e/visual/zz-selftest-probe-visual-dark-win32.png`, created and removed during the run. The new guard gave `palette: OK`; the previous guard reported it.
- `npm run lint` passes (selftest 149/149).

## RED evidence (each seen failing before its fix)

| Row | Case | RED observed | Classifier |
|---|---|---|---|
| 07 WR-01 | `contrast: a :root nested in @media cannot mask a failing base token, and is reported` | old guard: exit 0, `contrast: OK (47 pairs)` (the @media override lifted `--dim` to white); 143/144 | `RED_EVIDENCE_OK` (tap) |
| 07 WR-02 | `palette: directional borders, ring offsets and shadow-colour classes fail the stock and wb rules` | old guard: exit 0, `palette: OK` on all 10 classes; 146/147 | `RED_EVIDENCE_OK` (tap) |
| 07 WR-03 | `palette: a git-ignored local -win32.png under e2e/ passes ...` (plus the stray-PNG case) | old guard: exit 1 on the ignored PNG; the stray case showed 2 violations instead of 1; 147/149 | `RED_EVIDENCE_OK` (tap) |
| 07 IN-06 | the three `contrastTableCheck` cases (test-only change, no product code) | seeded faults, each reverted and checked with `cmp`: threshold comparison removed → the low-ink proof case went red (145/146); two labels swapped in `CONTRAST_ORDER` → the real-file and at-threshold cases went red (144/146) | n/a (seeded) |

Semantic assessment: in each RED run the named target case executed and failed on its planned assertion. No load, syntax or fixture error occurred, and every other case passed.

## Task Commits

| Row | Commit | Type |
|---|---|---|
| 07 WR-01 | `7fe1146` RED fixture and case, `aa3d5eb` GREEN fix | test, fix |
| 07 IN-06 | `b9e53d5` | test |
| 07 WR-02 | `93f85fa` RED fixture and case, `8f6acf9` GREEN fix | test, fix |
| 07 WR-03 | `e64abc2` RED cases, `2feb04b` GREEN fix | test, fix |
| WR-01/02/03 docs | `69d3520` scripts/README.md rule table and contrast paragraph | docs |

Row → commit table for 13-22: 07 WR-01 → `aa3d5eb` (case `7fe1146`); 07 WR-02 → `8f6acf9` (case `93f85fa`); 07 WR-03 → `2feb04b` (cases `e64abc2`); 07 IN-06 → `b9e53d5`.

## Files Created/Modified

- `scripts/guards/check-contrast.mjs`: `TOKEN_BLOCK` prelude regex replaces `BLOCK`; `declarations()`; brace-depth `readTokens` returns `nested`; nested blocks become failures; header doc
- `scripts/guards/check-palette.mjs`: widened `PRE`; `e2eFiles(root)` with the git listing and walk fallback; `spawnSync` import; header doc for stock and png
- `scripts/guards/selftest.mjs`: `CONTRAST_ORDER`, `contrastTableCheck`, three IN-06 cases; WR-01 case; WR-02 case; `tempPngRoot` and two WR-03 cases; two temp roots added to the cleanup list
- `scripts/guards/__selftest__/contrast/media-override.css`: WR-01 fixture
- `scripts/guards/__selftest__/palette/bad-directional/app/page.tsx`: WR-02 fixture (7 stock, 3 wb at ratchet 0)
- `scripts/guards/__selftest__/palette/bad-png-untracked/e2e/.gitkeep`: WR-03 fixture root (the only tracked file there)
- `scripts/README.md`: stock and png rule rows, contrast paragraph

## Decisions Made

- **Nested token blocks fail rather than being measured on their own.** This follows the review's suggested fix, and the plan allows either approach. Only a nested block that declares a custom property fails. A nested rule that merely references `var(--mist-300)` is ignored, which is why the real `@supports not (scrollbar-color: auto)` block still passes. (The review's sample `stripConditionalBlocks` would have thrown on that block, because it greps for token names in the at-rule's body.)
- **`@layer` counts as nesting.** A `:root` inside `@layer` sits in another cascade layer, so merging it by source order would also be wrong.
- **IN-06 has no tolerance against recorded values.** The approved triage row (`13-LEDGER-TRIAGE.md` row 12, approved under `## Approval`) says: "assert only the OK line and the table order for the real file; keep exact ratios for fixtures". The plan text suggests an extra ±0.05 band around the recorded ratios. That band would still break lint on a larger retune that passes every threshold, which is the IN-06 failure mode. So the check uses table order plus each pair against its own threshold. The only tolerance is 0.005, for the 2 dp display rounding. See Deviations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] IN-06 tolerance applied to the threshold, not to recorded ratios**
- **Found during:** Task 1 (IN-06)
- **Issue:** The plan's action asks that each ratio sit "within a small tolerance (e.g. ±0.05) of the recorded value". The approved triage proposal for this row asks for the OK line and table order only. A recorded-value band keeps the original defect: retuning a token by more than 0.05 while still passing would fail lint.
- **Fix:** For the real file, the case asserts exit 0, the OK line, the 47 labels in table order, and each ratio ≥ its threshold − 0.005, where the 0.005 absorbs the 2 dp display rounding. Exact ratios stay in the fixture cases. Two proof cases cover the plan's `<behavior>`: other passing ratios pass, and a pair below threshold fails.
- **Files modified:** scripts/guards/selftest.mjs
- **Verification:** selftest green; seeded faults turned the cases red
- **Committed in:** b9e53d5

**2. [Rule 3 - Blocking] The WR-03 fixture needs a temp git work tree, not the walk fallback**
- **Found during:** Task 2 (WR-03)
- **Issue:** The plan expects the fixtures to use the disk-walk fallback. But fixture roots sit inside the repo work tree, so the git listing applies to them too. And a fallback walk cannot show that ignored files are skipped.
- **Fix:** `tempPngRoot` copies the `.gitkeep`-only fixture to a temp dir, runs `git init`, writes the repo's `e2e/**/*-win32.png` ignore rule, and creates the ignored PNG (plus `stray.png` for the second case). The fallback was checked separately, with a non-git temp dir that still reported its `-win32.png`. The existing `bad-png` fixture (a tracked PNG) still fails, which covers the "tracked" half.
- **Files modified:** scripts/guards/selftest.mjs
- **Verification:** both WR-03 cases pass; temp roots removed (no `guard-selftest-*` dirs left)
- **Committed in:** e64abc2

**Note on RED → GREEN for IN-06:** this row changes only the selftest (no product code), so it is one `test(13-13)` commit with seeded-fault evidence in place of a `fix` commit.

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both follow the approved row text or are needed for a fixture that can actually fail. No scope creep, no app code or style change (pixel-neutral).

## Issues Encountered

- Out-of-scope doc drift: `scripts/README.md:78` says 36 contrast pairs; the guard measures 47. Logged in `deferred-items.md` and not changed.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- All four 07 guard rows owned by 13-13 are fixed, with fixtures; 13-22 can take the row → commit table above.
- WR-02 changed no real-tree count, so there is no ratchet or app-code decision for Tim.

## Self-Check: PASSED

- Files: all 7 created/modified files FOUND.
- Commits: 7fe1146, aa3d5eb, b9e53d5, 93f85fa, 8f6acf9, e64abc2, 2feb04b, 69d3520 all FOUND on HEAD.
- `git ls-files scripts/guards/__selftest__/palette/bad-png-untracked` → only `e2e/.gitkeep`.
- `npm run guard:selftest && npm run guard:contrast && npm run guard:palette` exit 0; `npm run lint` exit 0.

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
