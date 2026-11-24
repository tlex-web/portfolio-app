---
phase: 17-region-routes-seo-structured-data
plan: 15
subsystem: testing
tags: [phase-close, ci, playwright, jest, visual-regression, json-ld, review-disposition]

requires:
  - phase: 17-region-routes-seo-structured-data
    provides: 17-01..17-14 and 17-16 (region routes, published photo pages, OG cards, JSON-LD, saved pages, the 16 IN fixes); 17-05's v2.0 identity harness, base JSON and control record
provides:
  - The Phase 17 local gate record on the tip (lint, type-check, Jest + guard:tests, production Playwright in Chromium and Firefox, snapshot check over 90 commits, client JS)
  - The v2.0 identity at the tip (exit=0 differing=0 compared=36 removed=1,1,1,1) and the record audit over every earlier re-check
  - 16-REVIEW-DISPOSITION.md with IN-01..IN-09 fixed, each citing its Phase 17 plan and SHA (D-23)
  - ci/17-15 at 038a4cb with CI OK success, Visual Regression PASS and the three E2E leg durations (D-25, D-27)
affects: [17-verify-work, 18]

actuals:
  tokens: 270      # chars/4 over the added lines of d528dae..038a4cb (the write-back; this SUMMARY excluded)
  tasks: 3
  commits: 1       # MEASURED: git rev-list --count d528dae..HEAD at SUMMARY write
plan_head_before: d528dae8c38ea505c730efb20e58d65181b1953c
plan_head_after: 038a4cbe0de01f2a257f5cbfc4cb1eef2eb655d9

tech-stack:
  added: []
  patterns:
    - "Phase close: local gate, identity at the tip, record audit, write-back, then one plain push of a new ci/ branch and a read-back of every job"

key-files:
  created:
    - .planning/phases/17-region-routes-seo-structured-data/17-15-SUMMARY.md
  modified:
    - .planning/phases/16-new-regions-alps-overview-data/16-REVIEW-DISPOSITION.md

key-decisions:
  - "17-15 D-25: the E2E matrix legs ran 12.2 (firefox), 14.4 (webkit) and 15.4 (chromium) minutes on ci/17-15, against the 27-40 minute single job of Phases 13-16; the longest leg is far under the 45-minute line, so no further sharding is needed for Phase 18"
  - "17-15 Pitfall 6: the preview deployment for 038a4cb is behind Vercel Authentication (302 to vercel.com/sso-api), so the deployed region-card check passes to /gsd-verify-work's live-DOM step; the local production build serves all three region cards 200 image/png"

patterns-established: []

requirements-completed: [PHOTO-05, REGION-07, SEO-04, EDGE-03]

coverage:
  - id: D1
    description: "The local gate is green on the tip: lint (all guards, selftest 299/299, data:check), type-check over three configs, Jest 2365/2365 in 119 suites with guard:tests OK, production Playwright 487 passed in Chromium and Firefox"
    verification:
      - kind: other
        ref: "npm run lint && npm run type-check (exit 0)"
        status: pass
      - kind: unit
        ref: "npx jest --json --outputFile=jest-results.json && npm run guard:tests (2365 passed; test-count OK)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test (photos-region, photos-lightbox, photos, not-found, seo, og, offline, shell, keyboard, audit) --project=chromium --project=firefox: 487 passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-10: check-snapshot-commit --none passes on all 90 commits in 285b6d5..HEAD; the per-photo card file is byte-identical to 285b6d5"
    verification:
      - kind: other
        ref: "for sha in $(git rev-list 285b6d5..HEAD); do node scripts/ci/check-snapshot-commit.mjs --sha $sha --none; done (90 x OK)"
        status: pass
      - kind: other
        ref: "git diff --quiet 285b6d5 -- app/(site)/photos/[slug]/opengraph-image.tsx (exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-07 amendment: the v2.0 four at the tip equal 17-05's phase-base capture on all 36 compared fields, with the ImageObject block stripped; the record audit confirms the five earlier re-checks"
    requirement: PHOTO-05
    verification:
      - kind: other
        ref: "node v20-identity.mjs http://localhost:3017 v20-base.json -> exit=0 differing=0 compared=36 removed=1,1,1,1"
        status: pass
      - kind: other
        ref: "record audit one-liner (17-15-PLAN Task 1 verify) -> v2.0 identity records: 5/5 against base 51b7f4d9b291"
        status: pass
    human_judgment: false
  - id: D4
    description: "Client JS at the tip is 1,851,755 B (cap 1,855,781 B) and no chunk holds registry facts or a new photo's slug"
    verification:
      - kind: other
        ref: "rm -rf .next/static && npm run build; byte-sum of .next/static/chunks; grep for Steinernen|castle-below-limestone-peaks"
        status: pass
    human_judgment: false
  - id: D5
    description: "D-23: IN-01..IN-09 read fixed in the YAML and table of 16-REVIEW-DISPOSITION.md, each Source cell citing a resolving Phase 17 SHA; WR rows unchanged"
    verification:
      - kind: other
        ref: "grep -c 'disposition: skipped' = 0; nine IN SHAs pass git cat-file -e; '| info | fixed |' = 9; '| warning | fixed | 16-REVIEW-FIX.md |' = 6"
        status: pass
    human_judgment: false
  - id: D6
    description: "D-27/D-25: ci/17-15 (plain push, new branch) is green: CI OK success, Visual Regression PASS with no baseline update, longest E2E leg 15.4 min"
    requirement: REGION-07
    verification:
      - kind: other
        ref: "gh run list --branch ci/17-15 --workflow CI -> success 038a4cb (run 45306356650)"
        status: pass
      - kind: automated_ui
        ref: "node scripts/ci/check-visual-run.mjs --sha 038a4cb --wait 30 -> PASS"
        status: pass
    human_judgment: false
  - id: D7
    description: "Pitfall 6: a region OG card answers 200 image/png on a deployed build of the tip"
    requirement: SEO-04
    human_judgment: true
    rationale: "The Vercel preview for 038a4cb is protected (302 to vercel.com/sso-api), so the deployed check could not run; the local production build answered 200 image/png for all three region cards. /gsd-verify-work's live-DOM step owns the deployed check."

duration: 25min
completed: 2026-11-24
status: complete
---

# Phase 17 Plan 15: Phase Close Summary

**Phase 17's tip passes every local gate and CI: 2365 Jest tests, 487 production Playwright tests in Chromium and Firefox, 90 of 90 commits snapshot-clean, the v2.0 four identical to the phase base on 36 of 36 fields apart from JSON-LD, client JS at 1,851,755 B, and `ci/17-15` green with Visual Regression PASS and a longest E2E leg of 15.4 minutes. The nine deferred Phase 16 info findings are written back as fixed with their SHAs.**

## Performance

- **Duration:** about 25 min
- **Started:** 2026-11-24T01:30:00Z
- **Completed:** 2026-11-24T01:55Z
- **Tasks:** 3
- **Files modified:** 1 (plus this SUMMARY)

## Accomplishments

- The whole local gate ran green on the tip. No source change was needed.
- `16-REVIEW-DISPOSITION.md` records IN-01..IN-09 as fixed. Each Source cell names the Phase 17 plan and the fix SHA.
- `ci/17-15` was pushed as a new branch. Every CI job passed, Visual Regression passed with no baseline update, and the three E2E legs were recorded.

## Local gate (tip d528dae; the write-back commit 038a4cb changed only a planning file)

| Gate | Result |
|---|---|
| `npm run lint` | exit 0. eslint; parity OK; ci-gate OK; palette OK; contrast all PASS; identity OK; selftest 299/299 cases passed; data:check (terrain, photos:exif, photos:derive, photos:build, tokens, trails, clips) all OK; served-images OK; test-count scan OK |
| `npm run type-check` | exit 0 (tsc root, tsconfig.jest.json, tsconfig.e2e.json) |
| `npx jest --json --outputFile=jest-results.json` | 119/119 suites, **2365/2365 tests** passed, 0 skipped |
| `npm run guard:tests` | `test-count: jest 2365 + e2e 635 = 3000 (baseline 2243)`, `test-count: OK` |
| `jest-results.json` | git-ignored (`git check-ignore -q` exit 0); not committed |
| Card file | `git diff --quiet 285b6d5 -- "app/(site)/photos/[slug]/opengraph-image.tsx"` exit 0 |
| Production Playwright | `PW_PROD=1 npx playwright test e2e/photos-region.spec.ts e2e/photos-lightbox.spec.ts e2e/photos.spec.ts e2e/not-found.spec.ts e2e/seo.spec.ts e2e/og.spec.ts e2e/offline.spec.ts e2e/shell.spec.ts e2e/keyboard.spec.ts e2e/audit.spec.ts --project=chromium --project=firefox`: **487 passed** (chromium 258, firefox 229), 0 failed, 0 flaky, 2.4 min. `public/service-worker.js` was restored afterwards |

### check-snapshot-commit --none over 285b6d5..HEAD

`git rev-list 285b6d5..HEAD` lists 90 commits (89 at d528dae, plus the write-back 038a4cb). Every one printed `snapshot-commit: OK (0 changed)` (`sort | uniq -c` gives `90 snapshot-commit: OK (0 changed)`). In order:

```text
25a1192 · e58a84e · 57d87a5 · 240b2cd · 3af091e · ea30f5e
b6dee39 · 0769c9f · 3024ec5 · 13ff26a · f0aeb69 · dafe5ea
b83347e · 08f7cfa · b5f7f09 · 79aec33 · 98815cc · e0c4cc7
44f63c4 · 0cf5abd · 667a83c · c25a35f · df68202 · 5b67aca
0ac8575 · ad5d514 · fed9a67 · 972b1ec · 2ba1389 · f370570
0a640da · 274b8e9 · 1930b9d · 940c245 · 34d5d09 · 69fd3f4
6b5dae4 · 51f2c99 · fd85f97 · 5ff62dc · 93c5588 · a050c7e
1d15fd8 · 0ef5d8c · be200a6 · 99318eb · fcc0085 · e359db4
8440ba5 · 817c1fc · ec07b6e · 79634e2 · 6e0920e · 3785828
95c8df8 · 5dcd2ae · 7b037f1 · 0744dfe · 909677f · 14dd850
72e38e6 · 7acc356 · aaa0c98 · 5b68e70 · 47ad58f · 41f2691
fca4819 · d3abc54 · cb01fc6 · affc985 · 2762130 · 339c8f6
3ed68cc · 931aefb · 19d15f3 · d2b5f2d · e8b9c27 · 5caff47
228ccb0 · a56529c · c29c78d · a3bea04 · 9c7fbaf · 2cbb60c
e538bb3 · da24425 · b28f12e · aefb306 · d528dae · 038a4cb
```

## Client JS

`rm -rf .next/static && npm run build` on d528dae, then the byte-sum of `.next/static/chunks/**/*.js`: **1,851,755 B in 24 files**. The phase base is 1,851,685 B, so the tip is +70 B. The cap is 1,855,781 B. `grep -rlE 'Steinernen|castle-below-limestone-peaks' .next/static/chunks` found no file. `public/service-worker.js` was restored after the build.

## v2.0 identity (at the tip)

The build was the client-JS build above (d528dae; 038a4cb adds only a planning file). Server: `node node_modules/next/dist/bin/next start -p 3017`. Command: `node <scratchpad>/v20-identity.mjs http://localhost:3017 <scratchpad>/v20-base.json`. The harness and base files still matched 17-05's recorded SHA-256 (`b722b5655939…` and `be3ad3b82fd3…`), so they were used as they were. Complete stdout, verbatim:

```text
v20-identity: exit=0 differing=0 compared=36 removed=1,1,1,1 base=51b7f4d9b291 head=d528dae8c38e
```

Exit code: 0. Stderr was empty.

| Field | matterhorn-from-zermatt | gornerschlucht-waterfall | matterhorn-glacier-trail | riffelsee-reflection |
|---|---|---|---|---|
| status | identical | identical | identical | identical |
| title | identical | identical | identical | identical |
| headSha256 | identical | identical | identical | identical |
| ogImage | identical | identical | identical | identical |
| ogStatus | identical | identical | identical | identical |
| ogContentType | identical | identical | identical | identical |
| ogSha256 | identical | identical | identical | identical |
| mainSha256 | identical | identical | identical | identical |
| htmlSha256 | identical | identical | identical | identical |
| ldJsonRemoved (recorded, not compared) | 1 | 1 | 1 | 1 |

Each `<main>` still holds exactly the one ImageObject block 17-13 added. With it stripped, every field equals the phase base 285b6d5. 17-14's case-study and region changes did not touch the v2.0 photo pages.

### Record audit

The node one-liner from the plan's Task 1 verify block exited 0:

```text
v2.0 identity records: 5/5 against base 51b7f4d9b291, control 36/36, heads 940c24590747 e359db43ef2b 95c8df872e6b 2762130e8773 a3bea047e975
```

### Local region cards (same server)

| Region | og:image path | Status / type |
|---|---|---|
| zermatt | /photos/regions/zermatt/opengraph-image-1cmaag/card?d447e566894b1199 | 200 image/png |
| ortler | /photos/regions/ortler/opengraph-image-1cmaag/card?d447e566894b1199 | 200 image/png |
| saalfelden | /photos/regions/saalfelden/opengraph-image-1cmaag/card?d447e566894b1199 | 200 image/png |

## D-23 write-back

Each SHA was checked before writing: `git cat-file -e` resolves it, it is an ancestor of HEAD, its SUMMARY names it, and `git show --stat` touches the file the 16-REVIEW finding names.

| Finding | Plan | SHA | Touches |
|---|---|---|---|
| IN-01 | 17-13 | a56529c | lib/home-format.ts, lib/photos/view-model.ts |
| IN-02 | 17-08 | 93c5588 | scripts/terrain/fetch-bev.mjs |
| IN-03 | 17-09 | 72e38e6 | lib/ascent/home-photos.ts |
| IN-04 | 17-04 | fed9a67 | scripts/photos/build-photo-data.mjs |
| IN-05 | 17-09 | 0744dfe | scripts/terrain/build-terrain.mjs, data/generated/overview.ts |
| IN-06 | 17-09 | 909677f | scripts/terrain/build-terrain.mjs |
| IN-07 | 17-09 | 14dd850 | .gitattributes |
| IN-08 | 17-08 | 1d15fd8 | scripts/terrain/fetch-bev.mjs, fetch-dem.mjs, fetch-overview.mjs (+ plate-args.mjs, fetch-retry.mjs) |
| IN-09 | 17-08 | a050c7e | scripts/terrain/fetch-overview.mjs |

Each Source cell reads `fixed in Phase 17: 17-NN <sha> (D-23; deferred by Tim 2026-11-23)`. `open: 0`, `total: 15`, every title and all six WR rows are unchanged.

## CI record (ci/17-15)

- **Push:** `git push origin HEAD:refs/heads/ci/17-15` (plain push, new branch; `git ls-remote` printed nothing before it). `git ls-remote origin refs/heads/ci/17-15` now prints `038a4cbe0de01f2a257f5cbfc4cb1eef2eb655d9`, which equals the local tip at push time.
- **Run:** https://github.com/tlex-web/portfolio-app/actions/runs/45306356650 (headSha 038a4cb, conclusion success). The new branch had no compare base, so the full CI ran.

| Job | Conclusion | Duration |
|---|---|---|
| Classify changes | success | 0.1 min |
| Lint and Type Check | success | 3.2 min |
| Unit Tests | success | 1.4 min |
| E2E Tests (chromium) | success | 15.4 min |
| E2E Tests (firefox) | success | 12.2 min |
| E2E Tests (webkit) | success | 14.4 min |
| Visual Regression | success | 4.0 min |
| Build Application | success | 0.7 min |
| Security Audit | success | 1.0 min |
| Dependency Review | skipped (push event; it runs on pull requests only) | - |
| CI OK | success | 0.1 min |

**E2E legs (D-25):** chromium 15.4 min (01:37:15Z to 01:52:39Z), webkit 14.4 min (01:37:15Z to 01:51:39Z), firefox 12.2 min (01:37:15Z to 01:49:26Z). The single E2E Tests job took 27-40 minutes in Phases 13-16 (16-18: 40m15s). The longest leg is 15.4 min, far under the 45-minute line.

**Visual Regression:** `node scripts/ci/check-visual-run.mjs --sha 038a4cbe0de01f2a257f5cbfc4cb1eef2eb655d9 --wait 30` printed:

```text
PASS https://github.com/tlex-web/portfolio-app/actions/runs/45306356650/job/138151100676
```

There was no baseline dispatch and no PNG commit.

**Pitfall 6 backstop:** GitHub lists deployment 8016046189 (Preview, state success) for 038a4cb at `portfolio-2h8d9v6sv-old-shatterhands-projects.vercel.app`. Both the region page and `/photos/regions/ortler/opengraph-image-1cmaag/card?d447e566894b1199` answer `302 Found` with `Location: https://vercel.com/sso-api?...`. The preview is protected, so this check passes to /gsd-verify-work's live-DOM step. The local production build of the same code answered 200 image/png for all three region cards (table above).

## Task Commits

1. **Task 1: The whole local gate, the snapshot check, the v2.0 identity at the tip and the client JS total.** Record only, no commit (no source change was needed).
2. **Task 2: Write the nine Phase 16 info findings back (D-23).** `038a4cb` (docs).
3. **Task 3: Push ci/17-15 and read back CI.** No commit. The push of 038a4cb is recorded above.

## Files Created/Modified

- `.planning/phases/16-new-regions-alps-overview-data/16-REVIEW-DISPOSITION.md`: IN-01..IN-09 changed from skipped to fixed in the YAML and the table, with Phase 17 SHAs.
- `.planning/phases/17-region-routes-seo-structured-data/17-15-SUMMARY.md`: this record.

## Decisions Made

- D-25 is settled for now. The matrix legs run 12-15 minutes, so Phase 18's added routes have about 30 minutes of headroom per leg before the 45-minute line.
- The Pitfall 6 deployed check is handed to /gsd-verify-work, because the preview is behind Vercel Authentication. Getting past it would need a bypass token or `vercel curl`, which this plan does not cover.

## Deviations from Plan

None. The plan was executed as written.

The order of operations differed slightly: the D-23 commit (038a4cb, planning file only) landed before the push, so the CI tip is 038a4cb. The identity, client-JS and Playwright runs used d528dae, which has the same application code. This SUMMARY and the STATE/ROADMAP commits that follow are `.planning/`-only and were not pushed to `ci/17-15`. D-27 covers fast-forward *fix* pushes only.

## Issues Encountered

None.

## Verification

- Task 1: snapshot loop exit 0 (90 OK); card diff exit 0; record audit exit 0; `npm run lint && npm run type-check` exit 0; the build + budget + grep one-liner exit 0 (1,851,755 B); identity exit 0.
- Task 2: `grep -c "disposition: skipped"` = 0; the nine-SHA loop exit 0 (n=9); `grep -c "| info | fixed |"` = 9; `grep -c "| warning | fixed | 16-REVIEW-FIX.md |"` = 6.
- Task 3: `gh run list ... | test "$r" = "success $(git rev-parse HEAD)"` passed (checked before this SUMMARY's commit, when HEAD was 038a4cb); `check-visual-run` PASS, exit 0; `git ls-remote origin refs/heads/ci/17-15` equals 038a4cb.
- Threat model: T-17-30 (one plain push of a new ci/ branch, no force, no phase-branch or main push, no dispatch); T-17-31 (no PNG staged, 90/90 snapshot OK); T-17-32 (no coordinate is written here; only hashes, statuses, counts and durations).

## Known Stubs

None.

## Threat Flags

None. This plan adds no new surface.

## User Setup Required

None.

## Next Phase Readiness

- All 16 Phase 17 plans have SUMMARYs. The phase is ready for /gsd-verify-work 17.
- For verify-work: fetch one region OG card from a deployed build (the preview is protected; production or a bypass), and the phase branch still needs its PR to main.

## Self-Check: PASSED

- FOUND: .planning/phases/16-new-regions-alps-overview-data/16-REVIEW-DISPOSITION.md
- FOUND: .planning/phases/17-region-routes-seo-structured-data/17-15-SUMMARY.md
- FOUND commit: 038a4cb (ancestor of HEAD)
- FOUND remote: ci/17-15 = 038a4cb
