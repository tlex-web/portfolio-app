---
phase: 12-contact-edge-pages-cleanup-verification
plan: 11
subsystem: testing
tags: [visual-regression, playwright, baselines, ci, guard-02, zero-diff]

requires:
  - phase: 12-01
    provides: "ci.push supplied as yes (plain pushes of ci/12-NN, never force); log.phase11 surveyedAt 2026-11-02"
  - phase: 12-07
    provides: "Round-1 expected diffs (box, coin-flip, roadmap; Home unchanged) and the D-24 Phase 9 dispositions"
  - phase: 12-02
    provides: "404 copy split with the generic 404 unchanged (zero-diff claim)"
  - phase: 12-03
    provides: "API-only contact changes (zero-diff claim)"
  - phase: 12-04
    provides: "v1 alias and dead-CSS removal, --color-*: initial reset (zero-diff claim)"
  - phase: 12-05
    provides: "Legacy v1 image deletion (zero-diff claim)"
  - phase: 12-06
    provides: "D-25 hygiene, canvas-arm-only moves (zero-diff claim)"
  - phase: 12-08
    provides: "SW caching only (zero-diff claim)"
  - phase: 12-09
    provides: "Head-only metadata, sitemap, robots (zero-diff claim)"
  - phase: 12-10
    provides: "OG image routes, not rendered in any page (zero-diff claim)"
provides:
  - "Round-1 baselines: roadmap/{375,768,1440}-reduced-visual-dark-linux.png re-baselined by Tim in a046347 (kicker 1 Nov -> 2 Nov 2026)"
  - "CI proof that waves 1 and 2 (12-02..12-06, 12-08..12-10) are zero-diff: 45 of 48 shots byte-identical in the update_mode=changed artifact"
  - "CI run 41522964315 green on a046347 (Visual Regression, E2E Tests, Unit Tests, Lint and Type Check)"
affects: [12-12, 12-26, visual-baselines, round-2-rebaseline]

actuals:
  tokens: 4700
  tasks: 3
  commits: 2
plan_head_before: 53c2566b0c9bb03541edf3a19f5b780266c38985
plan_head_after: a04634719c6c1b597b444d8202405044477fdd4e

tech-stack:
  added: []
  patterns:
    - "Expected-diff list committed as its own file before the dispatch, so its commit time provably precedes the run id (D-27, T-12-23)"
    - "Post-commit byte compare of the downloaded artifact against the committed tree proves the baseline commit is the artifact, unedited"

key-files:
  created:
    - .planning/phases/12-contact-edge-pages-cleanup-verification/12-11-EXPECTED-DIFFS.md
  modified:
    - e2e/visual/routes.spec.ts-snapshots/roadmap/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/roadmap/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/roadmap/1440-reduced-visual-dark-linux.png

key-decisions:
  - "check-snapshot-commit ran with --allow roadmap only: box, coin-flip and home had zero diff, so allowing them would have widened the gate for no reason (never --allow-all)"
  - "box and coin-flip D-24 fixes (EndBlock py-3, DemoTerminal grid-area, Metrics aria-label) are zero-pixel in CI; they were listed as 'may change (zero allowed)' and produced no diff"

patterns-established:
  - "Round re-baseline: committed expected list -> push ci/12-NN -> CI shows only listed slugs failing -> update_mode=changed dispatch -> byte compare -> Tim commits -> check-snapshot-commit with only the changed slugs -> four jobs green"

requirements-completed: [VERIFY-01, VERIFY-03]

coverage:
  - id: D1
    description: "Round-1 expected-diff list written and committed before the CI dispatch"
    requirement: VERIFY-03
    verification:
      - kind: other
        ref: "git log: 9d2a86f committed 2026-11-02T20:31:22Z; visual-baselines run 41520182839 created 2026-11-02T20:32:49Z"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every changed PNG in the round-1 artifact is on the expected list (3 roadmap shots); 45 others byte-identical"
    requirement: VERIFY-01
    verification:
      - kind: other
        ref: "byte compare of scratchpad/r1 (run 41520182839 artifact) against e2e/visual/routes.spec.ts-snapshots at 9d2a86f: 3 differ, 45 identical"
        status: pass
      - kind: other
        ref: "byte compare of the same artifact against the tree at a046347: 48 identical, 0 differ"
        status: pass
    human_judgment: false
  - id: D3
    description: "Tim reviewed and committed the round-1 baselines himself; the commit touches only the 3 roadmap PNGs"
    requirement: VERIFY-03
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha a04634719c6c1b597b444d8202405044477fdd4e --some --allow roadmap -> snapshot-commit: OK (3 changed), exit 0"
        status: pass
    human_judgment: true
    rationale: "That the roadmap shots look right (only the kicker date changed) is Tim's visual review; his reply was \"pushed\" and named no wrong shot"
  - id: D4
    description: "CI green on Tim's baseline commit: Visual Regression, E2E Tests, Unit Tests, Lint and Type Check"
    requirement: VERIFY-03
    verification:
      - kind: automated_ui
        ref: "check-visual-run.mjs --sha a046347 --job \"Visual Regression\" -> PASS run 41522964315 job 125543365050"
        status: pass
      - kind: e2e
        ref: "check-visual-run.mjs --sha a046347 --job \"E2E Tests\" -> PASS run 41522964315 job 125543365144"
        status: pass
      - kind: unit
        ref: "check-visual-run.mjs --sha a046347 --job \"Unit Tests\" -> PASS run 41522964315 job 125543365321"
        status: pass
      - kind: other
        ref: "check-visual-run.mjs --sha a046347 --job \"Lint and Type Check\" -> PASS run 41522964315 job 125543365437"
        status: pass
    human_judgment: false

duration: 41min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 11: Round 1 Re-baseline Summary

**Round-1 visual re-baseline in CI: only the three roadmap shots changed (route-log kicker 1 Nov -> 2 Nov 2026), Tim committed them in a046347, and 45 byte-identical shots prove the deletions and fixes of waves 1 and 2 zero-diff; CI run 41522964315 is green on all four jobs.**

## Performance

- **Duration:** about 41 min (Task 1 from the ledger base at 20:26Z; continuation 20:52Z to 21:07Z)
- **Started:** 2026-11-02T20:26:21Z
- **Completed:** 2026-11-02T21:07:00Z
- **Tasks:** 3 of 3 (Task 2 was Tim's)
- **Files modified:** 4 (1 planning doc by the executor; 3 PNGs by Tim)

## Round 1 expected diffs

Copied verbatim from 12-11-EXPECTED-DIFFS.md (committed in 9d2a86f at 2026-11-02T20:31:22Z, before the dispatch run 41520182839 was created at 20:32:49Z).

Snapshots: `e2e/visual/routes.spec.ts-snapshots/<slug>/<width>-<mode>-visual-dark-linux.png`, 48 files. Comparator threshold 0.01, so `update_mode=changed` captures every real change.

### Expected to change (or allowed to change)

| Slug | Width | File | Reason | Expectation |
|------|-------|------|--------|-------------|
| roadmap | 375 | `375-reduced` | Route-log kicker date `1 Nov 2026` -> `2 Nov 2026` (`surveyedAt` 2026-11-01 -> 2026-11-02, 12-07 / 12-01 log.phase11). The closed `Phases 7–12` disclosure label does not change, and the camp marker moved 0 px (12-07 measurement) | change expected |
| roadmap | 768 | `768-reduced` | same | change expected |
| roadmap | 1440 | `1440-reduced` | same | change expected |
| box | 375 | `375-reduced` | EndBlock plate loses `py-3` (12-07, D-24). The sign is already 56 px from `min-h-14`, so likely zero or a few pixels. DemoTerminal `[grid-area:1/1]` (same as `col-start-1 row-start-1`) and the Metrics aria-label (replaces a 1 x 1 sr-only span) should give zero | may change (zero allowed) |
| box | 768 | `768-reduced` | same | may change (zero allowed) |
| box | 1440 | `1440-reduced` | same | may change (zero allowed) |
| coin-flip | 375 | `375-reduced` | EndBlock plate loses `py-3` only (no HEADS sentence: copy.heads-sentence not supplied, "heads skip") | may change (zero allowed) |
| coin-flip | 768 | `768-reduced` | same | may change (zero allowed) |
| coin-flip | 1440 | `1440-reduced` | same | may change (zero allowed) |

### Expected unchanged (any diff here is a regression: stop, report, copy nothing)

| Slug | Files | Why no change is expected |
|------|-------|---------------------------|
| home | `{375,768,1440}-reduced`, `{375,768,1440}-ascent-{start,waypoint-2,summit}` (12) | Tim kept defaults #10 to #12 (12-07 dispositions: scrim spec amended, wedge closed as terrain, rail tick accepted; no code change). 12-06 moved only when the canvas arms, and canvases are hidden in baselines. If Home differs, it is reported as unexpected, not explained away |
| photos | `{375,768,1440}-reduced` | 12-05 removed legacy v1 images only; the hashed derivatives are byte-identical |
| photos-grid | `{375,768,1440}-reduced` | same |
| photos-carousel | `{375,768,1440}-reduced` | same |
| photo | `{375,768,1440}-reduced` | same |
| lightbox | `{375,768,1440}` | same |
| projects | `{375,768,1440}-reduced` | 12-04 alias and dead-CSS removal plus the `--color-*: initial` reset: the compiled-selector diff shows only deleted CSS |
| contact | `{375,768,1440}-reduced` | 12-03 is API-only; 12-04 as above |
| offline | `{375,768,1440}-reduced` | 12-08 changed SW caching only |
| not-found | `{375,768,1440}-reduced` | 12-02 left the generic 404 classes and copy unchanged; the baseline URL `/__no-such-page__` keeps the generic links |

Also zero-pixel by their own summaries: 12-09 (head-only metadata, sitemap, robots), 12-10 (OG image routes, not rendered in any page). No PNG may be added or deleted.

## CI runs

| Run | What | Commit | Result |
|-----|------|--------|--------|
| 41520173414 | CI on push of ci/12-11 | 9d2a86f | Lint, Unit, E2E passed; Visual Regression failed on exactly the 6 roadmap shots, as expected |
| 41520182839 | `visual-baselines.yml` dispatch (`suite=visual`, `update_mode=changed`), headBranch ci/12-11, headSha 9d2a86f | 9d2a86f | success; artifact `visual-baselines` downloaded to the scratchpad (`r1`) |
| 41522964315 | CI on Tim's push of ci/12-11 | a046347 | all green (table below) |

## Changed PNGs (round-1 artifact vs the committed tree at 9d2a86f)

Exactly 3, all on the expected list:

- `e2e/visual/routes.spec.ts-snapshots/roadmap/375-reduced-visual-dark-linux.png` (190656 -> 190575 bytes)
- `e2e/visual/routes.spec.ts-snapshots/roadmap/768-reduced-visual-dark-linux.png` (219831 -> 219762 bytes)
- `e2e/visual/routes.spec.ts-snapshots/roadmap/1440-reduced-visual-dark-linux.png` (235587 -> 235498 bytes)

Cause: the route-log kicker reads "2 Nov 2026" instead of "1 Nov 2026". No PNG was added or deleted.

## Zero-diff proof

The other 45 of the 48 shots in the artifact were byte-identical to the committed baselines. At threshold 0.01 with `update_mode=changed`, an identical file means the CI render matched the old baseline. This proves:

| Shots (byte-identical) | Count | Proves zero-diff for |
|------------------------|-------|----------------------|
| box `{375,768,1440}-reduced` | 3 | 12-07 D-24 fixes on box (EndBlock `py-3`, DemoTerminal `[grid-area:1/1]`, Metrics aria-label): listed "may change", changed 0 px |
| coin-flip `{375,768,1440}-reduced` | 3 | 12-07 EndBlock `py-3` on coin-flip: changed 0 px |
| home (12: reduced plus ascent start, waypoint-2, summit) | 12 | 12-06 (D-25 hygiene) and 12-07 (defaults #10 to #12 kept, no code change) |
| photos, photos-grid, photos-carousel, photo, lightbox | 15 | 12-05 (legacy v1 image deletion) |
| projects | 3 | 12-04 (v1 alias and dead-CSS removal, `--color-*: initial` reset) |
| contact | 3 | 12-03 (API-only) and 12-04 |
| offline | 3 | 12-08 (SW caching) |
| not-found | 3 | 12-02 (generic 404 unchanged) |

12-09 and 12-10 render nothing in the page body; every route's shot being unchanged covers them as well. Together that is every zero-diff plan of waves 1 and 2: 12-02, 12-03, 12-04, 12-05, 12-06, 12-08, 12-09, 12-10.

After Tim's commit, the same artifact was compared again against the tree at a046347: 48 identical, 0 differ. His commit is the artifact, unedited.

## Tim's reply (Task 2)

Tim's literal reply, 2026-11-02: "pushed"

He was asked to reply "re-baselined" or name a wrong shot. He replied "pushed" and named no wrong shot. Orchestrator check after his reply: HEAD = `a04634719c6c1b597b444d8202405044477fdd4e` = `git ls-remote origin refs/heads/ci/12-11`. Re-confirmed at the start of Task 3: both still `a04634719c6c1b597b444d8202405044477fdd4e`.

## Authorship of the baseline commit

- Commit `a046347` "test(12-11): round 1 baselines (route-log date 2 Nov 2026; D-24 fixes zero-diff)" touches only the 3 roadmap PNGs.
- In this repo every commit, executor ones included, carries the same git author (tlex-web <old2shatterhand@gmail.com>), so the author field alone does not prove who made it.
- Tim's commit is distinguishable because it has no Co-Authored-By or Claude-Session trailer (checked with `git log --format='%(trailers:key=Co-Authored-By)'`: empty for a046347, present for the executor's 9d2a86f), and he ran it himself via `!` after the checkpoint.
- The executor never ran `git add` on a PNG, never amended and never force-pushed.

## check-snapshot-commit

```
$ node scripts/ci/check-snapshot-commit.mjs --sha a04634719c6c1b597b444d8202405044477fdd4e --some --allow roadmap
snapshot-commit: OK (3 changed)
exit=0
```

Only `--allow roadmap`: box, coin-flip and home had zero diff. Never `--allow-all`.

## CI on Tim's commit (run 41522964315)

| Job | Result | Job id |
|-----|--------|--------|
| Visual Regression | PASS | 125543365050 |
| E2E Tests | PASS | 125543365144 |
| Unit Tests | PASS | 125543365321 |
| Lint and Type Check | PASS | 125543365437 |

Also green in the same run: Security Audit, Build Application (Dependency Review skipped, as on every push). No re-run was needed.

## Task Commits

1. **Task 1: Local gates, the expected-diff list, the CI run and the comparison** - `9d2a86f` (docs)
2. **Task 2: Tim reviews, commits and pushes the round-1 baselines** - `a046347` (test, Tim's commit)
3. **Task 3: Verify Tim's baseline commit and CI green** - no file changes (verification only; recorded here)

**Plan metadata:** the docs(12-11) commit that adds this SUMMARY.

## Files Created/Modified

- `.planning/phases/12-contact-edge-pages-cleanup-verification/12-11-EXPECTED-DIFFS.md` - the round-1 expected list, committed before the dispatch
- `e2e/visual/routes.spec.ts-snapshots/roadmap/{375,768,1440}-reduced-visual-dark-linux.png` - re-baselined by Tim (kicker date)

## Decisions Made

- `--allow roadmap` only in check-snapshot-commit, because box, coin-flip and home produced zero diff.
- The D-24 fixes on box and coin-flip are recorded as zero-pixel; they need no baseline change.

## Deviations from Plan

None - plan executed as written. The plan text named `--allow box --allow coin-flip --allow roadmap`; with box and coin-flip at zero diff the narrower `--allow roadmap` is the plan's own rule ("only the expected --allow slugs" that actually changed) and was the orchestrator's instruction. Tim's reply was "pushed", not the suggested "re-baselined"; it is quoted as given.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Round 1 of D-27 is closed: baselines on ci/12-11 match the reviewed list, CI green.
- The phase branch is not pushed; ci/12-11 holds 9d2a86f and a046347.
- Later plans that change pixels run round 2 against these baselines.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*

## Self-Check: PASSED

- FOUND: 12-11-EXPECTED-DIFFS.md, 12-11-SUMMARY.md, roadmap/{375,768,1440}-reduced-visual-dark-linux.png
- FOUND: 9d2a86f and a046347 are ancestors of HEAD; HEAD = ls-remote ci/12-11 = a04634719c6c1b597b444d8202405044477fdd4e
- check-snapshot-commit --some --allow roadmap: OK (3 changed), exit 0
- Plan verify `check-visual-run.mjs --sha $(git rev-parse HEAD) --job "Visual Regression"`: PASS
- Four CI jobs PASS in run 41522964315
- `git diff --cached --name-only`: empty (no PNG staged by the executor)
- `commits: 2` measured with `git rev-list --count 53c2566..HEAD` before the metadata commit
