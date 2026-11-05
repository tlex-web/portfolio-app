---
phase: 12-contact-edge-pages-cleanup-verification
plan: 19
subsystem: testing
tags: [visual-regression, playwright, baselines, ci, guard-02, zero-diff, round-2]

requires:
  - phase: 12-01
    provides: "ci.push supplied as yes (plain pushes of ci/12-NN, never force)"
  - phase: 12-11
    provides: "Round-1 baselines at a046347 (roadmap re-baselined), the tree round 2 compares against"
  - phase: 12-12
    provides: "Marked-trail 404 in the edge layout (not-found shots expected to change)"
  - phase: 12-13
    provides: "Summit register replaces the v1 form (contact shots expected to change)"
  - phase: 12-15
    provides: "Offline page in the edge layout (offline shots expected to change)"
  - phase: 12-16
    provides: "Direct contact panel, gradient mesh deleted (contact)"
  - phase: 12-26
    provides: "Helper-row counter on the untouched form (contact)"
  - phase: 12-14
    provides: "Per-slug OG routes and head tags (zero-diff claim)"
  - phase: 12-17
    provides: "e2e specs and @prod-only tag only (zero-diff claim)"
  - phase: 12-18
    provides: "useProgressiveTextures rewrite on the 3D path only (photos-carousel zero-diff claim)"
  - phase: 12-25
    provides: "Identity URL guard and Site.location (zero-diff claim outside Contact)"
provides:
  - "Round-2 baselines: contact, not-found and offline at 375, 768 and 1440 (9 PNGs) re-baselined by Tim in b743ca0"
  - "CI proof that 12-14, 12-17, 12-18 and 12-25 move no pixels: 39 of 48 shots byte-identical in the update_mode=changed artifact"
  - "CI run 41551561921 green on b743ca0 (Visual Regression, E2E Tests, Unit Tests, Lint and Type Check)"
  - "Tim's OG decision: keep runtime render of per-slug cards with per-slug alt"
affects: [12-20, 12-23, 12-24, visual-baselines, round-3-rebaseline]

actuals:
  tokens: 6400
  tasks: 3
  commits: 2
plan_head_before: 50be5e4e66d6eaac3a25d48e699e8c4cad361945
plan_head_after: b743ca061dc63ff609c17b14befabf9d6a294e4f

tech-stack:
  added: []
  patterns:
    - "Expected-diff list committed as its own file before the dispatch, so its commit time provably precedes the run id (D-27, T-12-35)"
    - "Post-commit byte compare of the downloaded artifact against the committed tree proves the baseline commit is the artifact, unedited"

key-files:
  created:
    - .planning/phases/12-contact-edge-pages-cleanup-verification/12-19-EXPECTED-DIFFS.md
  modified:
    - e2e/visual/routes.spec.ts-snapshots/contact/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/contact/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/contact/1440-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/not-found/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/not-found/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/not-found/1440-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/offline/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/offline/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/offline/1440-reduced-visual-dark-linux.png

key-decisions:
  - "check-snapshot-commit ran with exactly --allow contact --allow not-found --allow offline (the three slugs that changed); never --allow-all"
  - "Per-slug OG cards keep rendering on first request with per-slug alt; Tim chose \"Keep runtime render (Recommended)\" on 2026-11-03 over prerendering with a generic alt"
  - "The 28 WebKit-only local Playwright failures are not Phase 12 code; they are handed to 12-23 rather than stopping round 2"

patterns-established:
  - "Round re-baseline (second use): committed expected list -> push ci/12-NN -> CI fails only on listed slugs -> update_mode=changed dispatch -> byte compare -> Tim commits -> check-snapshot-commit with only the changed slugs -> four jobs green"

requirements-completed: [CONTACT-01, EDGE-01, EDGE-02]

coverage:
  - id: D1
    description: "Round-2 expected-diff list written and committed before the CI dispatch"
    requirement: CONTACT-01
    verification:
      - kind: other
        ref: "git log: 30fabaf committed 2026-11-02T23:53:02Z; visual-baselines run 41548830261 created 2026-11-02T23:53:34Z"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every changed PNG in the round-2 artifact is on the expected list (9: contact, not-found, offline x 375/768/1440); the other 39 byte-identical"
    requirement: EDGE-01
    verification:
      - kind: other
        ref: "byte compare of scratchpad/r2 (run 41548830261 artifact) against the tree at 30fabaf: 9 differ, 39 identical"
        status: pass
      - kind: other
        ref: "byte compare of the same artifact against the tree at b743ca0 (git hash-object vs HEAD blobs): 48 identical, 0 differ, no file added or missing"
        status: pass
    human_judgment: false
  - id: D3
    description: "Tim reviewed and committed the round-2 baselines himself; the commit touches only the 9 listed PNGs"
    requirement: CONTACT-01
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha b743ca061dc63ff609c17b14befabf9d6a294e4f --some --allow contact --allow not-found --allow offline -> snapshot-commit: OK (9 changed), exit 0"
        status: pass
    human_judgment: true
    rationale: "That the summit register, the 404 and the offline page look right against the UI-SPEC is Tim's visual review; his reply was \"pushed\" and named no wrong shot"
  - id: D4
    description: "CI green on Tim's baseline commit: Visual Regression, E2E Tests, Unit Tests, Lint and Type Check"
    requirement: EDGE-02
    verification:
      - kind: automated_ui
        ref: "check-visual-run.mjs --sha b743ca0 --job \"Visual Regression\" -> PASS run 41551561921 job 125640147111"
        status: pass
      - kind: e2e
        ref: "check-visual-run.mjs --sha b743ca0 --job \"E2E Tests\" -> PASS run 41551561921 job 125640147157"
        status: pass
      - kind: unit
        ref: "check-visual-run.mjs --sha b743ca0 --job \"Unit Tests\" -> PASS run 41551561921 job 125640147320"
        status: pass
      - kind: other
        ref: "check-visual-run.mjs --sha b743ca0 --job \"Lint and Type Check\" -> PASS run 41551561921 job 125640147242"
        status: pass
    human_judgment: false

duration: 47min
completed: 2026-11-03
status: complete
---

# Phase 12 Plan 19: Round 2 Re-baseline Summary

**Round-2 visual re-baseline in CI: exactly the nine listed shots changed (summit register on Contact, the marked-trail 404, the edge-layout offline page), Tim committed them in b743ca0, and 39 byte-identical shots prove 12-14, 12-17, 12-18 and 12-25 zero-pixel; CI run 41551561921 is green on all four jobs.**

## Performance

- **Duration:** about 47 min (from the ledger base commit at 2026-11-02T23:43:41Z; Task 1 to 23:53Z, Tim's commit 00:15Z, Task 3 to 00:31Z)
- **Started:** 2026-11-02T23:43:41Z
- **Completed:** 2026-11-03T00:31:00Z
- **Tasks:** 3 of 3 (Task 2 was Tim's)
- **Files modified:** 10 (1 planning doc by the executor; 9 PNGs by Tim)

## Round 2 expected diffs

Copied verbatim from 12-19-EXPECTED-DIFFS.md (committed in 30fabaf at 2026-11-02T23:53:02Z, before the dispatch run 41548830261 was created at 23:53:34Z).

Baseline under comparison: the tree after round 1 (`a046347`, roadmap re-baselined), unchanged since. 53 commits from `a046347` to `50be5e4`; none touches a PNG.

Sources: the round-2 sections of 12-12, 12-13, 12-15, 12-16 and 12-26 SUMMARYs; 12-18-SUMMARY for the carousel; the zero-pixel claims of 12-14, 12-17 and 12-25.

Snapshots: `e2e/visual/routes.spec.ts-snapshots/<slug>/<width>-<mode>-visual-dark-linux.png`, 48 files. Comparator threshold 0.01, so `update_mode=changed` captures every real change. visual-light compares against the same dark PNGs.

### Expected to change

| Slug | Width | File | Reason | Source plan |
|------|-------|------|--------|-------------|
| contact | 375 | `375-reduced` | Summit register replaces the v1 feedback form: new header band, form card, no gradient mesh (12-13); Direct contact panel above the form (12-16); helper-row counter `0 / 2,000` visible on the untouched form (12-26). Page height changes | 12-13, 12-16, 12-26 |
| contact | 768 | `768-reduced` | same | 12-13, 12-16, 12-26 |
| contact | 1440 | `1440-reduced` | same, with the Direct contact panel filling the right column | 12-13, 12-16, 12-26 |
| not-found | 375 | `375-reduced` | Marked-trail 404 in the edge layout: new kicker, h1, sentence and the edge art sheet; the page gets taller | 12-12 |
| not-found | 768 | `768-reduced` | same, taller | 12-12 |
| not-found | 1440 | `1440-reduced` | same | 12-12 |
| offline | 375 | `375-reduced` | Offline page in the edge layout: kicker, Tim's h1 and body, Try again, the contour sheet and "Saved on this device" (the empty sentence in a fresh context once Cache Storage is read); taller | 12-15 |
| offline | 768 | `768-reduced` | same, taller | 12-15 |
| offline | 1440 | `1440-reduced` | same | 12-15 |

Each of these nine is expected to differ. If one of them comes back byte-identical, that is reported as unexpected (the redesign did not render in CI), not passed.

### Expected unchanged (any diff here is a regression: stop, report, copy nothing)

| Slug | Files | Why no change is expected |
|------|-------|---------------------------|
| home | `{375,768,1440}-reduced`, `{375,768,1440}-ascent-{start,waypoint-2,summit}` (12) | No Home component changed since round 1. `lib/home-format.ts` was refactored (12-13 adds `formatEntryTime`/`formatCount`, 12-25 adds an optional `decimals` to `formatLatLon` defaulting to 4); the Home strings are pinned by `lib/__tests__/home-format.test.ts` and are unchanged |
| photos | `{375,768,1440}-reduced` | 12-14 adds per-slug OG image routes and head tags only, not rendered in the page body |
| photos-grid | `{375,768,1440}-reduced` | same |
| photos-carousel | `{375,768,1440}-reduced` | 12-18 rewrote `useProgressiveTextures` (3D path only); the shot is the reduced-motion stepper, which does not use the hook |
| photo | `{375,768,1440}-reduced` | 12-14 (OG route and head tags only) |
| lightbox | `{375,768,1440}` | no lightbox change |
| projects | `{375,768,1440}-reduced` | 12-14 (project OG route and head tags only) |
| box | `{375,768,1440}-reduced` | 12-14 (head tags only) |
| coin-flip | `{375,768,1440}-reduced` | same |
| roadmap | `{375,768,1440}-reduced` | re-baselined in round 1 at `a046347`; nothing since touches the route log (its `formatLatLon`/date helpers keep their default output) |

Also zero-pixel by their own summaries: 12-14 (OG head tags), 12-17 (e2e specs and a `@prod-only` Playwright tag only), 12-25 (identity URL guard and `Site.location`, rendered only on Contact). 12-16's `e2e/visual/hide-canvas.css` edit is comment-only. No PNG may be added or deleted.

Expected changed set: 9 PNGs (contact ×3, not-found ×3, offline ×3). Expected byte-identical: 39 PNGs.

## CI runs

| Run | What | Commit | Result |
|-----|------|--------|--------|
| 41548792712 | CI on push of ci/12-19 | 30fabaf | Lint, Unit, E2E passed; Visual Regression failed on exactly the 18 expected comparisons (9 shots x visual-dark and visual-light) |
| 41548830261 | `visual-baselines.yml` dispatch (`suite=visual`, `update_mode=changed`), headBranch ci/12-19, headSha 30fabaf | 30fabaf | success; artifact downloaded to the scratchpad (`r2`, 48 files) |
| 41551561921 | CI on Tim's push of ci/12-19 | b743ca0 | all green (table below) |

## Changed PNGs (round-2 artifact vs the committed tree at 30fabaf)

Exactly 9, all on the expected list. Dimensions read from the PNG header (width x height), bytes from git:

| File | Before | After |
|------|--------|-------|
| `contact/375-reduced-visual-dark-linux.png` | 375x3126, 136753 B | 375x2653, 133235 B |
| `contact/768-reduced-visual-dark-linux.png` | 768x2408, 159210 B | 768x2407, 162133 B |
| `contact/1440-reduced-visual-dark-linux.png` | 1440x2240, 173022 B | 1440x1829, 175296 B |
| `not-found/375-reduced-visual-dark-linux.png` | 375x1584, 97144 B | 375x1985, 194149 B |
| `not-found/768-reduced-visual-dark-linux.png` | 768x1286, 122482 B | 768x1758, 260523 B |
| `not-found/1440-reduced-visual-dark-linux.png` | 1440x1162, 137609 B | 1440x1390, 285045 B |
| `offline/375-reduced-visual-dark-linux.png` | 375x2052, 133253 B | 375x2001, 192788 B |
| `offline/768-reduced-visual-dark-linux.png` | 768x1838, 163994 B | 768x1878, 261975 B |
| `offline/1440-reduced-visual-dark-linux.png` | 1440x1714, 188612 B | 1440x1390, 285525 B |

All paths are under `e2e/visual/routes.spec.ts-snapshots/`. No PNG was added or deleted.

Height notes, against the list's predictions: contact changes height at every width, as listed (shorter at 375 and 1440, 1 px shorter at 768). not-found is taller at all three widths, 1440 included. offline is taller only at 768; at 375 it is 51 px shorter and at 1440 324 px shorter. The list predicted "taller" for offline 375; the page in the edge layout is shorter than the v1 offline page there. A height difference is not a regression: every one of the nine was expected to differ and did, and Tim reviewed the shots.

## Zero-diff proof

The other 39 of the 48 shots in the artifact were byte-identical to the committed baselines. At threshold 0.01 with `update_mode=changed`, an identical file means the CI render matched the old baseline. This proves:

| Shots (byte-identical) | Count | Proves zero-diff for |
|------------------------|-------|----------------------|
| home (12: reduced plus ascent start, waypoint-2, summit) | 12 | the `lib/home-format.ts` refactor of 12-13 and 12-25 (`formatLatLon` default output unchanged) |
| photos, photos-grid, photo | 9 | 12-14 (per-slug photo OG route and head tags, not in the page body) |
| photos-carousel | 3 | 12-18 (`useProgressiveTextures` rewrite on the 3D path; the reduced-motion stepper is untouched) |
| lightbox | 3 | no lightbox change in round 2 |
| projects | 3 | 12-14 (project OG route and head tags) |
| box, coin-flip | 6 | 12-14 and 12-17 (head tags only) |
| roadmap | 3 | unchanged since round 1 (`a046347`); the route log's helpers keep their default output |

12-17 changed e2e specs and a Playwright tag only, and 12-25's `Site.location` renders only on Contact (which was re-baselined); every non-Contact shot being unchanged covers both. Together with the nine expected changes, every plan of waves 3 to 6 is accounted for: 12-12, 12-13, 12-15, 12-16, 12-26 change pixels as listed; 12-14, 12-17, 12-18, 12-25 move none.

After Tim's commit, the same artifact was compared again against the tree at b743ca0 (`git hash-object` of each artifact file vs the HEAD blob): 48 identical, 0 differ, no file only in the artifact or only in the tree. His commit is the artifact, unedited.

## Tim's reply (Task 2)

Tim's literal reply, 2026-11-03: "pushed"

He was asked to reply "re-baselined" or name the shots to fix. He replied "pushed" and named no wrong shot. Orchestrator check after his reply: HEAD = `b743ca061dc63ff609c17b14befabf9d6a294e4f` = `git ls-remote origin refs/heads/ci/12-19`. Re-confirmed at the start of Task 3: both still `b743ca061dc63ff609c17b14befabf9d6a294e4f`.

## Authorship of the baseline commit

- Commit `b743ca0` "test(12-19): round 2 baselines (summit register, edge pages)" touches only the 9 listed PNGs.
- In this repo every commit, executor ones included, carries the same git author (tlex-web <old2shatterhand@gmail.com>), so the author field alone does not prove who made it.
- Tim's commit is distinguishable because it has no Co-Authored-By or Claude-Session trailer (checked with `git show --format='%(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)'`: empty for b743ca0, present for the executor's 30fabaf), and he ran it himself via `!` after the checkpoint.
- The executor never ran `git add` on a PNG, never amended and never force-pushed.

## Decisions at this checkpoint

12-14's A3 note asked for this to be raised at the round-2 summary. Tim was asked whether the per-slug OG cards should keep rendering on first request (with per-slug alt) or be prerendered with a generic alt. His choice, 2026-11-03: "Keep runtime render (Recommended)". The cards stay request-time rendered and route-cached, with per-slug alt text. The matching note in 12-14-SUMMARY is added by the orchestrator.

## check-snapshot-commit

```
$ node scripts/ci/check-snapshot-commit.mjs --sha b743ca061dc63ff609c17b14befabf9d6a294e4f --some --allow contact --allow not-found --allow offline
snapshot-commit: OK (9 changed)
exit=0
```

Exactly the three changed slugs. Never `--allow-all`.

## CI on Tim's commit (run 41551561921)

| Job | Result | Job id |
|-----|--------|--------|
| Visual Regression | PASS | 125640147111 |
| E2E Tests | PASS | 125640147157 |
| Unit Tests | PASS | 125640147320 |
| Lint and Type Check | PASS | 125640147242 |

Also green in the same run: Security Audit, Build Application (Dependency Review skipped, as on every push). No re-run was needed.

## WebKit failures for 12-23

The local round-level gate (`PW_PROD=1`, three engines, Windows, at 50be5e4) had 28 failures, all WebKit; Chromium and Firefox passed in full. None is in Phase 12 code, so they did not stop round 2. The full list, grouped by cause (Tab focus 19, `page.goBack` crash 3, lightbox close via router 4, zoom centring 1, demo-clip `error` event 1), is in `12-19-EXPECTED-DIFFS.md` under "Local round-level gate" and is the input for 12-23 (WebKit in CI).

## Task Commits

1. **Task 1: Local gates, the round-2 list, the CI run and the comparison** - `30fabaf` (docs)
2. **Task 2: Tim reviews, commits and pushes the round-2 baselines** - `b743ca0` (test, Tim's commit)
3. **Task 3: Verify Tim's baseline commit and CI green** - no file changes (verification only; recorded here)

**Plan metadata:** the docs(12-19) commit that adds this SUMMARY.

## Files Created/Modified

- `.planning/phases/12-contact-edge-pages-cleanup-verification/12-19-EXPECTED-DIFFS.md` - the round-2 expected list and the local gate record, committed before the dispatch
- `e2e/visual/routes.spec.ts-snapshots/{contact,not-found,offline}/{375,768,1440}-reduced-visual-dark-linux.png` - re-baselined by Tim

## Decisions Made

- `--allow contact --allow not-found --allow offline` only in check-snapshot-commit: those are the slugs that changed.
- OG cards keep runtime render with per-slug alt (Tim, above).
- WebKit-only local failures go to 12-23, per the plan's own rule.

## Deviations from Plan

None - plan executed as written. Tim's reply was "pushed", not the suggested "re-baselined"; it is quoted as given. The offline 375 height went down, not up as the list's "taller" note predicted; the list's binding claim (each of the nine differs, nothing else does) held.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Round 2 of D-27 is closed: baselines on ci/12-19 match the reviewed list, CI green.
- The phase branch is not pushed; ci/12-19 holds 30fabaf and b743ca0.
- 12-20 to 12-22 run against these baselines; 12-23 takes the WebKit list and runs round 3 if needed.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-03*

## Self-Check: PASSED

- FOUND: 12-19-EXPECTED-DIFFS.md, 12-19-SUMMARY.md, the 9 PNGs under contact/, not-found/, offline/
- FOUND: 30fabaf and b743ca0 are ancestors of HEAD; HEAD = ls-remote ci/12-19 = b743ca061dc63ff609c17b14befabf9d6a294e4f
- check-snapshot-commit --some --allow contact --allow not-found --allow offline: OK (9 changed), exit 0
- Plan verify `check-visual-run.mjs --sha $(git rev-parse HEAD) --job "Visual Regression"`: PASS
- Four CI jobs PASS in run 41551561921
- Artifact r2 vs HEAD: 48 identical, 0 differ
- `git diff --cached --name-only`: empty (no PNG staged by the executor)
- `commits: 2` measured with `git rev-list --count 50be5e4..HEAD` before the metadata commit
