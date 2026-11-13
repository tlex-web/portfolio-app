---
phase: 13-repo-safety-test-debt
plan: 14
subsystem: testing
tags: [guards, selftest, install-parity, version-floors, same-classnames, snapshot-commit, git]

requires:
  - phase: 13-repo-safety-test-debt
    provides: "13-06 approved ledger triage (07 WR-04, 07 IN-07, 12 IN-12 fix-now, owner 13-14; Unowned fix rows: none); 13-13 temp-git-repo selftest pattern"
  - phase: 12-contact-edge-pages-cleanup-verification
    provides: "12-06 scoped fflate overrides (fflate@^0.6.0 -> 0.6.11 for three-stdlib, fflate@^0.8.0 -> 0.8.3), D-25"
provides:
  - "Version floors checked on every lockfile copy of a floored package, nested node_modules copies included (12 IN-12)"
  - "Per-version-line floors: a floor may be a list, each copy is checked against its own line's floor, a copy on a line with no floor fails (Tim's option A)"
  - "same-classnames pairs renamed files and fails a ref run that compared zero files (07 WR-04)"
  - "check-snapshot-commit checks a merge commit against its first parent; new pure export snapshotDiffArgs(sha, parents) (07 IN-07)"
affects: [13-15, 13-20, 13-22, every later plan that runs npm run lint or the zero-diff gate]

actuals:
  tokens: 8300
  tasks: 3
  commits: 8
plan_head_before: 1bc8b7931d261d4f5dccddacfecc6d9a70a3efb8
plan_head_after: 4f2ef8d74b156e482276c4d59531e0889bf2c80a

tech-stack:
  added: []
  patterns:
    - "Floors per version line: major, or major.minor for 0.x; a list floor names each patched line explicitly, so an unlisted line fails instead of passing silently"
    - "Guards that read git history are tested on temp git repos built at selftest load with a fixed identity (gitIn helper: user.name, user.email, commit.gpgsign=false, core.autocrlf=false)"
    - "A guard's git-reading choice lives in a small pure export (snapshotDiffArgs) so a pure case and a temp-repo case cover it"

key-files:
  created:
    - scripts/guards/__selftest__/parity/nested-floor/package.fixture.json
    - scripts/guards/__selftest__/parity/nested-floor/package-lock.fixture.json
    - scripts/guards/__selftest__/parity/nested-floor/scripts/guards/version-floors.json
    - scripts/guards/__selftest__/parity/nested-floor/.github/workflows/ci.yml
    - scripts/guards/__selftest__/parity/unfloored-line/package.fixture.json
    - scripts/guards/__selftest__/parity/unfloored-line/package-lock.fixture.json
    - scripts/guards/__selftest__/parity/unfloored-line/scripts/guards/version-floors.json
    - scripts/guards/__selftest__/parity/unfloored-line/.github/workflows/ci.yml
  modified:
    - scripts/guards/check-install-parity.mjs
    - scripts/guards/version-floors.json
    - scripts/guards/same-classnames.mjs
    - scripts/ci/check-snapshot-commit.mjs
    - scripts/guards/selftest.mjs
    - scripts/README.md
    - e2e/visual/README.md

key-decisions:
  - "12 IN-12, Tim's option A: version floors are checked per version line; fflate's floor is [\"0.6.11\", \"0.8.3\"], so the 12-06 pinned three-stdlib copy (0.6.11) passes while 0.6.10 or any copy on an unfloored line fails. No dependency, lockfile, override or app-code change"
  - "A string floor keeps its meaning (one minimum for every copy) and now also covers nested copies; the hoisted-copy messages are byte-identical, so the existing parity cases keep their expectations"
  - "07 WR-04: same-classnames diffs with -M; a rename compares the old path at the ref with the new path on disk; copies are skipped like additions; a ref run with zero compared files exits 1"
  - "07 IN-07: check-snapshot-commit runs git show first (a bad --sha still fails with 'git show <rev> failed', exit 2), then git rev-list --parents; a merge is re-read with git diff <first parent> <sha>. The CLI flags and evaluateSnapshotChanges are unchanged"

patterns-established:
  - "version-floors.json: \"<pkg>\": \"x.y.z\" | [\"x.y.z\", ...], at most one floor per version line"

requirements-completed: [VERIFY-07]

coverage:
  - id: D1
    description: "12 IN-12: a nested lockfile copy of a floored package below its floor fails, naming its lockfile key"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#parity: nested-floor fixture fails on nested lockfile copies below their floor (12 IN-12)"
        status: pass
    human_judgment: false
  - id: D2
    description: "12 IN-12 (option A): a copy on a version line with no floor fails, lower or higher; copies on floored lines pass"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#parity: unfloored-line fixture fails on lockfile copies whose version line has no floor (12 IN-12)"
        status: pass
      - kind: other
        ref: "npm run guard:parity (real tree: parity: OK)"
        status: pass
    human_judgment: false
  - id: D3
    description: "07 WR-04: same-classnames pairs moved files and fails on zero compared"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#same-classnames: a moved file with identical classNames is compared and passes (07 WR-04)"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#same-classnames: a moved file whose classNames changed fails (07 WR-04)"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#same-classnames: a run that compared zero files fails (07 WR-04)"
        status: pass
    human_judgment: false
  - id: D4
    description: "07 IN-07: check-snapshot-commit evaluates a merge commit against its first parent"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#snapshot-commit: a merge commit is diffed against its first parent (07 IN-07)"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#snapshot-commit: a merge commit that brings in a PNG outside the allow-list fails (07 IN-07)"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#snapshot-commit: a merge commit with no PNG change against its first parent passes --none (07 IN-07)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Catch-all: no unowned fix-now rows (catch-all: none)"
    requirement: VERIFY-07
    verification:
      - kind: other
        ref: "Task 3 <automated> node check over 13-LEDGER-TRIAGE.md ## Unowned fix rows"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 14: Remaining guard rows (07 WR-04, 07 IN-07, 12 IN-12) and catch-all Summary

**The parity guard now checks version floors on every lockfile copy, with per-version-line list floors (fflate `["0.6.11", "0.8.3"]`). `same-classnames` pairs renamed files and fails when it compared nothing. `check-snapshot-commit` checks a merge commit against its first parent. The catch-all had no unowned rows.**

## Performance

- **Duration:** about 14 min of execution in this continuation (the previous executor stopped at the Task 1 decision before writing anything)
- **Started:** 2026-11-13T12:25:37Z
- **Completed:** 2026-11-13T12:40Z
- **Tasks:** 3 (Task 3 changed no code)
- **Files modified:** 19 (12 fixture files created, 7 modified)

## Accomplishments

- **12 IN-12:** the floor check reads every `packages` key that is `node_modules/<name>` or ends in `/node_modules/<name>`. A nested failure names its key, for example `fflate 0.6.10 at node_modules/three-stdlib/node_modules/fflate is below the floor 0.6.11`. A floor is either a string or a list with one floor per version line. A version line is the major, or major.minor for 0.x. With a list, each copy is checked against its own line's floor, and a copy on a line with no floor fails (`fflate 0.7.4 at ... has no floor for version line 0.7 (floors 0.6.11, 0.8.3)`). The list is validated: it must hold at least one floor, every entry must be `x.y.z`, and no version line may appear twice. A string floor still means one minimum for every copy, and the hoisted-copy messages have not changed.
- **fflate:** the floor is now `["0.6.11", "0.8.3"]`. On the real tree, `node_modules/fflate` 0.8.3 and `node_modules/three-stdlib/node_modules/fflate` 0.6.11 both pass. `npm run guard:parity` prints `parity: OK`. With the old string floor `"0.8.3"` the widened check failed on the three-stdlib copy, as the previous executor had reported. No other floored package has a nested copy in the lockfile.
- **07 WR-04:** `same-classnames` diffs with `-M`. A rename (`R<score>`) compares `git show <ref>:<old>` with `<new>` on disk, labelled `old -> new`. A copy is skipped like an addition. A ref run that compared zero files exits 1 with `same-classnames: compared 0 files under app/ and components/ against <ref> ...`. The `--files` mode is unchanged.
- **07 IN-07:** the new pure export `snapshotDiffArgs(sha, parents)` returns `git diff --no-renames --name-status <first parent> <sha> -- e2e` for a merge, and the old `git show` arguments for a single-parent or root commit. `main()` runs `git show` first, so a bad `--sha` still exits 2 with `git show <rev> failed`. It then resolves the parents with `git rev-list --parents -n 1` and, for a merge, re-reads the merge against its first parent and prints which parent it used. The `--sha`, `--allow`, `--none`, `--allow-all`, `--allow-deletions` and `--some` flags and `evaluateSnapshotChanges` are unchanged. The newest merge in this repo's history (`b81d6f2`) passes `--none` against its first parent.
- `npm run lint` passes (selftest 157/157), and `npm test` passes (105 suites, 1757 tests).

## RED evidence (each seen failing before its fix)

| Row | Case | RED observed | Classifier |
|---|---|---|---|
| 12 IN-12 | `parity: nested-floor fixture fails on nested lockfile copies below their floor (12 IN-12)` | old guard: exit 0, `parity: OK`. It read only `node_modules/<name>`, and `String(["0.6.11","0.8.3"])` parsed as 0.6.11. 149/151 | `RED_EVIDENCE_OK` (tap) |
| 12 IN-12 | `parity: unfloored-line fixture fails on lockfile copies whose version line has no floor (12 IN-12)` | old guard: exit 0, `parity: OK`. 149/151 | `RED_EVIDENCE_OK` (tap) |
| 07 WR-04 | `same-classnames: a moved file with identical classNames is compared and passes (07 WR-04)` | old guard: `skip (added)`, `skip (deleted)`, `OK (0 file(s) compared)`. 151/154 | `RED_EVIDENCE_OK` (tap) |
| 07 WR-04 | `same-classnames: a moved file whose classNames changed fails (07 WR-04)` | old guard: exit 0, the same skip lines. 151/154 | `RED_EVIDENCE_OK` (tap) |
| 07 WR-04 | `same-classnames: a run that compared zero files fails (07 WR-04)` | old guard: exit 0, `OK (0 file(s) compared ...)`. 151/154 | `RED_EVIDENCE_OK` (tap) |
| 07 IN-07 | `snapshot-commit: a merge commit is diffed against its first parent (07 IN-07)` | `check-snapshot-commit exports no snapshotDiffArgs(sha, parents)`. 155/157 | `RED_EVIDENCE_OK` (tap) |
| 07 IN-07 | `snapshot-commit: a merge commit that brings in a PNG outside the allow-list fails (07 IN-07)` | old script: exit 0, `snapshot-commit: OK (0 changed)` (empty combined diff). 155/157 | `RED_EVIDENCE_OK` (tap) |
| 07 IN-07 | `snapshot-commit: a merge commit with no PNG change against its first parent passes --none (07 IN-07)` | passed before the fix, because the old script passed every clean merge. Proved by a seeded fault instead: `snapshotDiffArgs` diffing against `parents[1]` turned this case red (154/157). The file was restored and checked with `cmp` | n/a (seeded) |

Semantic assessment: in each RED run, the named target case ran and failed on its planned assertion. No load, syntax or fixture error occurred, and every other case passed. In the 07 IN-07 pure case, the missing export was read through a dynamic module namespace, so the case failed on its own and the selftest still loaded. The refactor commit `b7ab234` replaced that with a named import.

## Task Commits

| Row | Commit | Type |
|---|---|---|
| 12 IN-12 | `ee637fe` RED fixtures and cases, `10a8151` GREEN fix with the fflate floor | test, fix |
| 07 WR-04 | `4ca709b` RED cases, `18e75a4` GREEN fix | test, fix |
| 07 IN-07 | `bcd38e0` RED cases, `08f11e2` GREEN fix, `b7ab234` refactor (named import) | test, fix, refactor |
| docs | `4f2ef8d` scripts/README.md and e2e/visual/README.md | docs |

Row → commit for 13-22: 12 IN-12 → `10a8151`; 07 WR-04 → `18e75a4`; 07 IN-07 → `08f11e2`. No commit touches a PNG (`git show --stat` on each: 0 `.png` paths).

## Files Created/Modified

- `scripts/guards/check-install-parity.mjs`: floors on every lockfile copy; string or per-line list floors; `versionLine` and `lockCopies` helpers.
- `scripts/guards/version-floors.json`: fflate `["0.6.11", "0.8.3"]`.
- `scripts/guards/__selftest__/parity/nested-floor/`: a hoisted next and fflate that meet their floors, plus nested `eslint-config-next/node_modules/next` 16.1.4 and `three-stdlib/node_modules/fflate` 0.6.10.
- `scripts/guards/__selftest__/parity/unfloored-line/`: fflate copies at 0.8.3 and 0.6.11 (both pass) and at 0.7.4 and 1.0.0 (lines with no floor).
- `scripts/guards/same-classnames.mjs`: rename pairing and the zero-compared failure.
- `scripts/ci/check-snapshot-commit.mjs`: `snapshotDiffArgs` and first-parent evaluation of merges.
- `scripts/guards/selftest.mjs`: 8 new cases, the `gitIn`/`putFiles` helpers, and the temp repos for same-classnames and merges. Existing cases are unchanged; the diff removes only the import line and the cleanup-list line, each re-added with new names.
- `scripts/README.md`, `e2e/visual/README.md`: describe the new behaviour.

## Decisions Made

- **12 IN-12, Tim's option A.** Tim's literal reply, given in the conversation on 2026-11-13: "A". This selected "Floors per version line": a floor may be a string (unchanged behaviour) or a list, and each lockfile copy is checked against the floor for its own version line. A copy on a line with no floor fails, and the nested copy stays checked, so 0.6.10 fails. fflate's floor is `["0.6.11", "0.8.3"]`, with no dependency, lockfile, override or app-code change. GHSA-px8p-9vwx-vf98 covers `>=0.6.0 <0.6.11` and `>=0.8.0 <0.8.3`, so 0.6.11 is the patched 0.6 release. three-stdlib 2.36.1 requires `fflate ^0.6.9`, and the 12-06 scoped override `"fflate@^0.6.0": "0.6.11"` pins it there.
- **How "a plain string floor keeps its behaviour" is read here:** a string is still a single minimum, and the hoisted messages are byte-identical. Following the plan's must-have ("the version-floor check covers every lockfile copy"), a string floor now also applies to nested copies. On the real tree only fflate has a nested copy, and its floor is now a list.
- **07 IN-07:** the parent choice lives in the git-reading layer (`snapshotDiffArgs` plus `main()`), and the pure `evaluateSnapshotChanges` signature is unchanged, as the plan asks.

## Deviations from Plan

### Auto-fixed Issues

None.

### Plan deviations

**1. [Decision, Tim's option A] Per-version-line floors instead of the plan's single-floor design (12 IN-12)**
- **Found during:** Task 1. The previous executor stopped at a decision checkpoint: once the check was widened, the real tree failed on `node_modules/three-stdlib/node_modules/fflate` 0.6.11 against the string floor 0.8.3.
- **Tim's reply:** "A"
- **Change:** list floors per version line, with a copy on an unfloored line failing. fflate's floor is `["0.6.11", "0.8.3"]`.
- **Files beyond the plan's `files_modified`:** `scripts/guards/version-floors.json` and the second fixture folder `scripts/guards/__selftest__/parity/unfloored-line/`.
- **Commits:** `ee637fe`, `10a8151`.

**2. [Convention] Fixture lockfiles are named `package-lock.fixture.json`, not `package-lock.json`**
- The plan lists `nested-floor/package-lock.json`. The existing parity fixtures store the manifest and lockfile under `.fixture.json` names, because GitHub's dependency graph scans every manifest in the repo. `tempParityRoot` renames them in a temp copy. The new fixtures follow that convention.

**3. [Acceptance note] The 07 IN-07 "merge with no PNG change passes --none" case could not fail before the fix**
- The old script passed every clean merge (an empty combined diff), so no fixture can make this case red against it. The case guards against a wrong-parent diff. A seeded fault (`parents[1]`) turned it red, and the file was then restored and checked with `cmp`. The other seven new cases were seen failing before their fixes, and the classifier verified each one.

**4. [Docs] README updates outside `files_modified`**
- `scripts/README.md` and `e2e/visual/README.md` describe the widened behaviour. This follows 13-13, which documented its guard changes the same way (`4f2ef8d`).

**5. [Verify note] The Task 3 check reads row ids from the prose of `## Unowned fix rows`**
- The section reads `none`, but the sentence after it names "07 WR-07" (owned by 13-11). The check's regex collects that id and expects a line that names it next to a commit hash. The `## Catch-all` section therefore keeps `catch-all: none` and adds a cross-reference line pointing to 13-11's fix commit `ddd356c`. The approved triage file was not edited.

---

**Total deviations:** 5 (1 Tim decision, 1 naming convention, 1 acceptance note, 1 docs addition, 1 verify note). No auto-fixes.
**Impact on plan:** all three rows are fixed with fixtures that prove each guard can now fail. No existing guard rule was loosened, and the existing selftest cases keep their expectations.

## Catch-all

catch-all: none

`13-LEDGER-TRIAGE.md` `## Unowned fix rows` reads `none`: Tim approved the triage with no overrides, so no row moved into fix-now without an owner task. Task 3 changed no code and made no commit.

Cross-reference, not a catch-all row: 07 WR-07 | ddd356c | owned by 13-11 (owner-call fix). The section's prose names it only to say that 13-11 owns it. The Task 3 check collects every row id in the section text, so this line records the owner commit from 13-11-SUMMARY.md and lets the check resolve the id.

## TDD Gate Compliance

Each row has a `test(13-14)` RED commit followed by its GREEN commit. The GREEN commits are typed `fix(13-14)` rather than `feat(13-14)`, because they fix guard defects named in the review ledger, the same convention 13-13 used. RED → GREEN order holds by ancestry: `ee637fe` → `10a8151`, `4ca709b` → `18e75a4`, `bcd38e0` → `08f11e2`.

## Issues Encountered

None. A first scripted edit of `selftest.mjs` wrote a literal newline into a `join('\n')`, which caused a load error. It was fixed before any run counted as RED, and the RED runs above come from the corrected file.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Every approved guard row owned by 13-14 is fixed, and the catch-all is `none`, so 13-15 (the mid-phase PR) has no fix-now row left without a task.
- `check-snapshot-commit` CLI flags are unchanged for 13-15 and 13-20. Merges are now checked against their first parent.
- Changing a floored package to a new version line now needs a matching floor in `version-floors.json`. Example: a fflate 0.9 copy fails until 0.9 has its own floor. Tim chose this behaviour.

## Self-Check: PASSED

- Created and modified files exist (`[ -f ]`): all 8 checked, FOUND.
- Commits are ancestors of HEAD: `ee637fe`, `10a8151`, `4ca709b`, `18e75a4`, `bcd38e0`, `08f11e2`, `b7ab234`, `4f2ef8d`, all FOUND.
- `npm run guard:selftest` 157/157; `npm run guard:parity` `parity: OK`; `npm run lint` exit 0; `npm test` 1757 passed.

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
