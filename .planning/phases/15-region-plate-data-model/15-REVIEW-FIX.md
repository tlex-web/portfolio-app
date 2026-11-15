---
phase: 15-region-plate-data-model
fixed_at: 2026-11-15T00:31:54Z
review_path: .planning/phases/15-region-plate-data-model/15-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 15: Code Review Fix Report

**Fixed at:** 2026-11-15T00:31:54Z
**Source review:** .planning/phases/15-region-plate-data-model/15-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (WR-01, WR-02, WR-03; Tim chose "Fix all 3 warnings now")
- Fixed: 3
- Skipped: 0
- Out of scope, left open: 8 (IN-01 to IN-08)

Each fix has regression rows that fail without the fix. To prove this, I swapped the HEAD version of the fixed file back in, ran the selftest, and restored the fix.

## Fixed Issues

### WR-01: A hillshade size dropped from a plate's declared outputs is kept, and `--check` passes

**Files modified:** `scripts/terrain/build-terrain.mjs`, `scripts/guards/selftest.mjs`
**Commit:** 9d86b53
**Status:** fixed: requires human verification (logic fix; regression rows fail without it)
**Applied fix:**
- **Root cause:** `resolvePosters` copied the whole recorded poster set (`{ ...rec.avif }`, `{ ...rec.webp }`), including sizes the plate no longer declares.
- **Fix:** It now keeps only the declared sizes: `pick(o)` filters each format's record to `sizes`.
- **Effect:**
  - A dropped size leaves `plates.ts` stale.
  - Its files drop out of `namesOf`, so `--check` reports them as `extra` and write mode sweeps them.
  - `budgetProblems` falls back to `avif[640]`.
- **Matterhorn unchanged:** JSON orders integer keys ascending anyway, so the home plate's output is byte-identical. The real-repo `terrain:build -- --check` still reports `terrain: OK`.

**Regression rows (selftest, `tempTerrainRoot` fixture plate):**
- `terrain: --check names the files of a hillshade size dropped from a plate (15 WR-01)`: builds the fixture plate, sets its `outputs.hillshade` to `[640]`, then runs `--check`. It expects:
  - exit 1
  - `stale data/generated/plates.ts`
  - `terrain: 3 stale`
  - both `fixture-hillshade-1100.*` files named as `extra`

  Without the fix this exits 0.
- `terrain: a write sweeps a dropped hillshade size, plates.ts stops naming it, Matterhorn stays byte-equal (15 WR-01)`: same setup, then a write run. It expects:
  - both 1100 files removed
  - exactly 4 fixture files left
  - no `fixture-hillshade-1100` in `plates.ts`
  - the Matterhorn files and home modules byte-equal
  - a follow-up `--check` exiting 0

  Without the fix both 1100 files survive the sweep.

### WR-02: Rule 18 (and rule 5) miss an expression job name written as a block scalar

**Files modified:** `scripts/guards/check-ci-gate.mjs`, `scripts/guards/selftest.mjs`
**Commit:** 6b08cfb
**Status:** fixed: requires human verification (parser change; regression rows fail without it)
**Applied fix:**
- **Root cause:** `jobKey` returned only the text after `name:` on the key's own line, and its regex did not accept a quoted key. Rules 2, 5 and 18 all read the name through `jobName`, so all three had the gap.
- **`jobKey`:** now accepts an optionally quoted key (`"name":`, `'name':`). This applies to every job key it reads (`needs`, `if`, `permissions`, `timeout-minutes`), which only makes those reads stricter.
- **`jobName`:** reads the whole value:
  - A block scalar header (`|`, `>-`, `|2+`, optionally followed by a comment) is read from the raw lines indented deeper than the key. Comments are kept, because a `#` inside a block scalar is text. `>` joins the lines with spaces, `|` with newlines.
  - A plain or quoted scalar continued over deeper lines is joined with spaces.
- **Raw-line access:** `readJobs` now records each body line's file index (`at`) and the file's raw lines (`raw`).

**Regression rows (selftest):** seven failing rows, all of which pass without the fix:
- Rule 18:
  - `name: >-` with the expression on the next line
  - `name: |` with the expression on the next line
  - `name: |` with the expression after `#`
  - quoted `"name":` key
- Rule 5:
  - `name: >-` with `CI OK` on the next line
  - plain `CI` / `OK` continued over two lines
  - quoted `'name':` key

Two literal-name controls pass both with and without the fix: `name: >-` + `Format check`, and `"name": Format check`.

**Real workflows:** `npm run guard:ci` still reports `ci-gate: OK`. The relay's single-line needs-based name expression is unaffected.

### WR-03: `tsconfig.jest.json` covers fewer files than Jest runs, so a test outside `__tests__/` is never type-checked

**Files modified:** `tsconfig.jest.json`, `tsconfig.json`, `scripts/guards/selftest.mjs`
**Commit:** 27b8162
**Status:** fixed
**Applied fix:**
- **`tsconfig.jest.json`:** `include` now matches Jest's `testMatch`. It adds `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts` and `**/*.spec.tsx` next to the `__tests__` globs.
- **`tsconfig.json`:** the base config now also excludes `**/*.spec.tsx`. Before, it excluded `*.spec.ts` but not `*.spec.tsx`, so it would have checked a `.spec.tsx` without the Jest globals. Now the two configs stay disjoint.
- **Existing files:** no file in the repo matches the new globs outside `__tests__/` and `e2e/`, so neither config checks a different set of existing files.

**Regression row (selftest):** `type-check: tsconfig.jest.json covers every file Jest's testMatch runs, outside __tests__/ too (15 WR-03)`.
- **Setup:** copies both configs into a temp root with probe files, then runs `tsc -p <config> --listFilesOnly` on each.
- **Assertions:**
  - Every testMatch shape is in the Jest config and not in the base config: `lib/__tests__/probe.ts`, `components/__tests__/probe.tsx`, `lib/probe.test.ts`, `components/probe.test.tsx`, `lib/probe.spec.ts`, `components/probe.spec.tsx`.
  - `e2e/probe.spec.ts` and `scripts/guards/__selftest__/probe.test.ts` stay out of the Jest config.
  - `lib/probe.ts` is checked by the base config only.
- **Drift check:** the row fails if `jest.config.js`'s `testMatch` line changes, so the two cannot drift apart silently.
- **Without the fix:** against the HEAD configs it fails on all four off-`__tests__` shapes, plus the base-config `.spec.tsx` overlap.

**One-off proof in the real tree:** I wrote a temporary `lib/wr03-probe.test.ts` containing `export const n: number = 'not a number';`.
- `tsc -p tsconfig.jest.json --listFilesOnly` listed it.
- `tsc -p tsconfig.jest.json` reported `lib/wr03-probe.test.ts(1,14): error TS2322`.

I deleted the probe afterwards.

## Out of Scope (left open)

These eight Info findings are outside this run's scope (Tim chose the three warnings only). No edit was made for any of them, and they stay open in 15-REVIEW.md.

### IN-01: The D-15 test pins the whole `public/terrain/` listing, so the first real second plate breaks it

**File:** `data/__tests__/terrain.test.ts:255`
**Reason:** out of scope (Info; this run fixes WR-01 to WR-03 only)

### IN-02: The scripts/README generator table still lists the pre-Phase-15 inputs

**File:** `scripts/README.md:16-18`
**Reason:** out of scope (Info; this run fixes WR-01 to WR-03 only)

### IN-03: The new cross-engine browser-Back row also runs in Chromium, duplicating the Chromium-only row

**File:** `e2e/photos-lightbox.spec.ts:829-830`
**Reason:** out of scope (Info; this run fixes WR-01 to WR-03 only)

### IN-04: The Jest globals declaration imports types from a package the project does not list

**File:** `__tests__/jest-globals.d.ts:13`
**Reason:** out of scope (Info; this run fixes WR-01 to WR-03 only)

### IN-05: A plate's `strip.centreN` outside its extent is silently clamped

**File:** `data/schemas/terrain.ts:251`, `scripts/terrain/build-terrain.mjs:547`
**Reason:** out of scope (Info; this run fixes WR-01 to WR-03 only)

### IN-06: Non-home poster parameters come from terrain.ts, so an unreadable terrain.ts re-encodes every plate's posters

**File:** `scripts/terrain/build-terrain.mjs:444-451`
**Reason:** out of scope (Info; this run fixes WR-01 to WR-03 only)

### IN-07: "Every photo is in exactly one known region" is nearly a tautology

**File:** `data/__tests__/photo-map.test.ts:74-79`
**Reason:** out of scope (Info; this run fixes WR-01 to WR-03 only)

### IN-08: Impossible-state guard: `height || 0` in navHeightPx

**File:** `components/photos/LightboxDialog.tsx:132`
**Reason:** out of scope (Info, necessity category; `critical_warning` scope excludes it)

## Verification

**Where it ran:** I made the per-fix edits and checks in an isolated worktree (`.claude/worktrees/rf-15-343-1794701767`, branch `gsd-reviewfix/15-343`). In that worktree, six eslint-based selftest cases fail because it has no `node_modules/eslint`. They were the same six before and after every fix, and all other cases passed.

After the cleanup tail, I ran all final gates below in the **main checkout** at 27b8162. The cleanup fast-forwarded `gsd/phase-15-region-plate-data-model`, removed the worktree, deleted the temp branch and removed the sentinel. The results are reproducible from the tree as it stands.

| Gate | Result |
|------|--------|
| `npm run lint` (eslint, parity, ci, palette, contrast, identity, selftest, data:check, guard:images, guard:tests:scan) | exit 0; `selftest: 269/269 cases passed` (was 257; +2 WR-01, +9 WR-02, +1 WR-03) |
| `npm run type-check` (tsc base, tsconfig.jest.json, tsconfig.e2e.json) | exit 0, 0 errors in all three |
| `npx jest` (full) | 113/113 suites, 1912/1912 tests passed (unchanged count) |
| `npm run guard:ci` | `ci-gate: OK` |
| `npm run terrain:build -- --check` | `terrain: OK` |

I did not run `npm run build`. `public/service-worker.js` is untouched.

---

_Fixed: 2026-11-15T00:31:54Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
