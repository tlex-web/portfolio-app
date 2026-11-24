---
phase: 18-immersive-survey-layout
plan: 01
subsystem: testing
tags: [ci, og-image, turbopack, line-endings, playwright, webkit, guard-03]
status: complete

requires:
  - phase: 17-region-routes-seo-structured-data
    provides: the e2e/og.spec.ts v2.0 pin rows (added in d7ff1bc) and the red ci/17-review-fixes run 45445770986
provides:
  - "Task 1 evidence: why CI receives ?f8a1b67515ad261d while the old pin said the Windows CRLF hash"
  - "GUARD-03 phase floor: test-count baseline 3,024 (jest 2,385 + e2e 639) at a0f86f8"
  - "LF rule for app/**/opengraph-image.tsx, so Windows builds hash the card files like CI and production"
  - "v2.0 photo card pins at ?f8a1b67515ad261d"
  - "Wave 0 decisions: og option A + .gitattributes, UI-SPEC P1-P7 as drafted"
  - "green ci/18-01 run 45506802759 at f93a888; B8 classified as a flake"
affects: [18-06, 18-08, 18-10, 18-11, 18-12, 18-13, 18-16, 18-23, 18-29, e2e/og.spec.ts, every ci/18-* push]

actuals:
  tokens: 5400     # chars/4 over the realized diff (baseline, .gitattributes, og.spec.ts, this SUMMARY)
  tasks: 3
  commits: 4       # measured: git rev-list --count a0da7ca..f93a888 (the metadata commit adds one more)
plan_head_before: a0da7ca81b1f821dc22c21453a22db28bef7fcc1
plan_head_after: f93a8889e3a53f205c54ff73aa6b548cc0352ee9

tech-stack:
  added: []
  patterns:
    - "Turbopack metadata-image query = hash of the card file's bytes; card files are pinned LF in .gitattributes"

key-files:
  created: []
  modified:
    - scripts/guards/test-count.baseline.json
    - .gitattributes
    - e2e/og.spec.ts

key-decisions:
  - "og pin: option A + .gitattributes (Tim): pin ?f8a1b67515ad261d, keep card files LF; later re-pins get their own commit, 18-29 re-checks"
  - "UI-SPEC P1-P7 confirmed as drafted (Tim: Defaults (Recommended))"
  - "Research Assumption A1 refuted: the card hash follows the card file's bytes, not its imports; view-model edits will not move it"
  - "B8 WebKit timeout in run 45445770986 is a flake: it passed first time on run 45506802759 under --fail-on-flaky-tests; no fix"

patterns-established:
  - "GUARD-03 floor raised once per phase by the guard's own --update on the untouched phase-start tree, in a commit holding only the baseline"

requirements-completed: []  # Wave 0 groundwork; REGION-01, REGION-02, REGION-03, REGION-05, LBOX-09 stay Pending for the plans that build them

duration: 30min
completed: 2026-11-25
---

# Phase 18 Plan 01: Wave 0 CI trust and UI defaults Summary

**No commit moved the v2.0 card hash: Turbopack hashes the card file's own bytes, a Windows checkout had CRLF (core.autocrlf=true) and built ?1bf973d7cc2e42c4, while CI and production (LF) build ?f8a1b67515ad261d. The pins now hold the production value, `.gitattributes` keeps every card file LF, the GUARD-03 floor sits at the phase-start 3,024, and ci/18-01 is green on every job with B8 passing (a flake).**

## Performance

- Duration: about 30 min of execution after Tim's replies (Task 1 ran before the checkpoint); completed 2026-11-25 (CET)
- Tasks: 3 of 3
- Files modified: 3 tracked files plus this SUMMARY

## Task 1: Bisect, old-query check, B8 log (done, no tracked change)

### Bisect (scratchpad worktree, phase branch never switched)

- Worktree: `git worktree add --detach <scratchpad>/og-bisect 038a4cb`, own install with the bundled `npm-cli.js ci` (881 packages, lockfile unchanged, no link to the main node_modules). Next.js 16.4.5 (Turbopack); each `npx next build` took about 10 s.
- The card query lives in `.next/server/chunks/ssr/app_(site)_photos_[slug]_opengraph-image--metadata_1_ifp1tha9lri.js` as `url:d+(b?"/"+b:"")+"?<hash>"`. The bisect script grepped that chunk: old hash = good (exit 0), new hash = bad (exit 1), neither or a failed build = skip (125).
- `git bisect start 4d79f22 038a4cb` + `git bisect run` tested b995bf0, bfb98db, ce46b88, 596c9d6: all **good** (old hash). Bisect then printed "4d79f22 is the first 'bad' commit", but only because 4d79f22 was the assumed bad endpoint it never builds.
- Direct build of 4d79f22 in the same worktree: **good** too. Build output line:
  `.next/server/chunks/ssr/app_(site)_photos_[slug]_opengraph-image--metadata_1_ifp1tha9lri.js:url:d+(b?"/"+b:"")+"?1bf973d7cc2e42c4"`
- Same commit, with only `app/(site)/photos/[slug]/opengraph-image.tsx` rewritten from `git show HEAD:<file>` (LF, as committed; the checkout had CRLF, `git ls-files --eol` = `i/lf w/crlf`): **bad**. Build output line:
  `.next/server/chunks/ssr/app_(site)_photos_[slug]_opengraph-image--metadata_1_ifp1tha9lri.js:url:d+(b?"/"+b:"")+"?f8a1b67515ad261d"`
- Main checkout tip a0da7ca (`npm run build`, then `git restore public/service-worker.js`): `?1bf973d7cc2e42c4`.
- Cleanup: `git bisect reset`, `git worktree remove --force` (the directory delete hit "Filename too long" after unregistering; the leftover folder was removed with `rm -rf`), `git worktree prune`; `git worktree list --porcelain | grep -c og-bisect` = 0.

First bad commit: d7ff1bc test(phase-17): add Nyquist validation tests

That is the first commit at which CI's og pin fails, not a commit that moved the hash. `git show --stat d7ff1bc` adds the four `v20PinnedCards` rows (e2e/og.spec.ts, +28 lines) with the value a Windows CRLF build produces. It changes no file the card route imports; `app/(site)/photos/[slug]/opengraph-image.tsx` is unchanged since 90d8dad (12-14, 2026-11-02). The earlier ci/17-15 run 45306356650 at 038a4cb was green only because the pin rows did not exist yet (`git show 038a4cb:e2e/og.spec.ts | grep -c 1bf973d7cc2e42c4` = 0).

Why the hash follows line endings: Turbopack computes the metadata `?<hash>` over the card file's content (the webpack loader does the same, `[contenthash]` at next-metadata-image-loader.js:60). The region card's hash moved between commits (c23b908019179154, a4a0333b9dd0eeae, e6e7d050967dcafa) because its own file changed; the photo card's never did. Research Assumption A1 (the hash follows transitive imports) is **refuted**: Phase 18 edits to `lib/photos/view-model.ts` will not move it; only an edit to the card file itself, or a different line ending, will.

### Old query vs new query

| URL `/photos/matterhorn-from-zermatt/opengraph-image-126xvw/card…` | Local `next start -p 3017` at a0da7ca | Production www.tlui.de |
|---|---|---|
| og:image meta on the page | `?1bf973d7cc2e42c4` (CRLF build) | `?f8a1b67515ad261d` |
| `?1bf973d7cc2e42c4` (old, the pin) | 200 image/png, 633,880 B | 200 image/png, 633,880 B |
| `?f8a1b67515ad261d` (new, CI's) | 200 image/png, 633,880 B | 200 image/png, 633,880 B |
| no query | 200 image/png | not probed |

The query is a cache key only; the route path decides the card. Production has served `?f8a1b67515ad261d` (the LF hash), so links shared from the live site carry that value, not the pinned one. Server stopped by port afterwards (PID tree killed; :3000 and :3017 clear).

### B8 (run 45445770986, WebKit leg, read from `gh run view --log-failed`)

- Row: `[webkit] › e2e/home-modes.spec.ts:610:7 › Home modes (HOME-02, HOME-07, HOME-08) › B8: rail tick labels keep 4.5:1 at every stop › B8: poster at 1440 x 900, every waypoint stop and the summit`
- Attempt 1: `Test timeout of 30000ms exceeded.` `Error: page.evaluate: Test timeout of 30000ms exceeded.` at `nextFrames` (e2e/helpers/webgl.ts:75) ← `worstContrastBehind` (home-modes.spec.ts:133) ← `sampleTicks` (:563) ← :622.
- Retry #1: `Error: locator.scrollIntoViewIfNeeded: Test timeout of 30000ms exceeded.` (`waiting for element to be stable`) at home-modes.spec.ts:124.
- Retry #2: same as attempt 1 (`page.evaluate` in `nextFrames`, webgl.ts:75).
- 3 attempts, all 30 s timeouts. The WebKit leg reported `5 failed, 497 passed (19.0m)`: the four og pin rows plus this B8 row.
- Context: `git diff --stat 038a4cb 4d79f22 -- e2e/ components/home lib/ascent playwright.config.ts` touches only e2e/og.spec.ts and e2e/photos-region.spec.ts; B8 and Home code are unchanged, and B8 passed on WebKit in run 45306356650 (038a4cb). Classified in Task 3 from the ci/18-01 run; no local WebKit run attempted.

## Wave 0 decisions (Tim's reply, verbatim)

Tim answered through two AskUserQuestion prompts in the orchestrator session (literal record: the session scratchpad's `tim-answers-18.md`). Questions and selected labels, quoted exactly:

**UI-SPEC P1-P7** (asked 2026-11-24, while Task 1 ran)
- Question: "18-01 asks you to confirm the seven UI-SPEC defaults (P1–P7) that later layout plans build on. ... Keep all seven as drafted?"
- Selected label: **"Defaults (Recommended)"**
- Option description shown: "All seven as the approved spec drafted them: P1 rail shows metres only (dashed tick = approx, head label = aerial); P2 instant anchor jumps; P3 cover pillarboxed in a 16:9 slot; P4 grid morph kept for opening photos; P5 trail sign with the yellow tip; P6 Triglav's stored height printed plainly; P7 overview list to the right of the map from 1024 px."

**og pin** (asked 2026-11-25, after the Task 1 evidence)
- Question: "18-01 og pin: the v2.0 card hash didn’t move in Phase 17. Windows checkouts turn the card file into CRLF, Turbopack hashes the file’s bytes, so local builds give ?1bf973d7… while CI and production give ?f8a1b67515ad261d. Old and new query URLs both return 200 image/png. How should e2e/og.spec.ts pin the four v2.0 cards?"
- Selected label: **"A + .gitattributes (Recommended)"**
- Option description shown: "Re-pin all four to ?f8a1b67515ad261d (what production serves) and add an `app/**/opengraph-image.tsx text eol=lf` rule so Windows builds hash the same as CI. That rule is a scope addition beyond the plan’s files. Later re-pins get their own commit; 18-29 checks the tip."
- Not chosen: "A only" (no attributes rule) and "C: path-only pin". The plan's option B was not offered: no commit moved the hash, so there is nothing to revert.

### Resolved, one line per item (later plans read these)

| Item | Resolution |
|------|------------|
| og | **A + .gitattributes**: the four `v20PinnedCards` rows pin `?f8a1b67515ad261d` (production's LF hash); `.gitattributes` keeps `app/**/opengraph-image.tsx` LF on every checkout; a later move gets its own re-pin commit naming the plan that moved it; 18-29 re-checks the tip |
| P1 | Default: rail labels show `formatMetres` only; approximation is the dashed tick, aerial is the rail head `Ground altitude` |
| P2 | Default: anchor jumps are instant in every mode |
| P3 | Default: the region header slot shows the cover pillarboxed in 16:9 |
| P4 | Default: photos open the lightbox with the morph carried over from the grid |
| P5 | Default: the next-region block and the end card reuse the trail sign with its yellow tip (a new `bg-trail` use) |
| P6 | Default: Triglav (`status: secondary`) prints its stored height like the others |
| P7 | Default: the overview list sits right of the map from 1024 px (320 px column) |

## Task 3: GUARD-03 floor, og decision, ci/18-01

### Commits

| Commit | Message | Files |
|--------|---------|-------|
| 98ec000 | chore(18-01): raise the test-count ratchet to the Phase 18 start (GUARD-03) | scripts/guards/test-count.baseline.json |
| 5334ef4 | chore(18-01): keep Open Graph card files LF on every checkout | .gitattributes |
| f93a888 | test(18-01): re-pin the v2.0 photo cards to the LF hash production serves | e2e/og.spec.ts |

### GUARD-03 phase floor (first, alone, on the untouched tree)

- Command: `npx jest --json --outputFile=jest-results.json > /dev/null 2>&1; env -u PW_PROD -u CI npm run guard:tests -- --update`, run at a0f86f8 before any edit.
- Guard line: `test-count: jest 2385 + e2e 639 = 3024 (baseline 2243)`, then `baseline written`, `test-count: OK`.
- The baseline's `commit` field is a0f86f8, the parent of 98ec000 (the plan's verify passes: `2385 + 639 = 3024 at a0f86f8…`). Re-run without `--update` after all edits: `test-count: jest 2385 + e2e 639 = 3024 (baseline 3024)`, OK.

### Approved scope addition: `.gitattributes` (Tim's "A + .gitattributes (Recommended)")

- Rule `app/**/opengraph-image.tsx text eol=lf`, with a comment in the file's style (Turbopack hashes the card bytes into the og:image query; cites 18-01).
- Before: `git ls-files --eol` showed the photos `[slug]` and projects `[slug]` card files as `i/lf w/crlf` (the regions card was already `w/lf`). Each was deleted and restored with `git checkout -- <path>`; after: all three `i/lf w/lf attr/text eol=lf`, and `git status` showed only `.gitattributes`.

### Re-pin (option A)

- The four `v20PinnedCards` rows now read `…/opengraph-image-126xvw/card?f8a1b67515ad261d`; `grep -c "1bf973d7cc2e42c4" e2e/og.spec.ts` = 0. The doc block now says the query is the hash of the card file's bytes, that line endings moved it (d7ff1bc pinned the Windows value), names the LF rule, and says "Re-pinned in 18-01 … re-checked in 18-29". It no longer claims the hash is machine-independent.
- Local production build (`PW_PROD=1 npx playwright test e2e/og.spec.ts -g "v2.0 photo cards" --project=chromium --project=firefox`): **8 passed**. The Windows build now gives the LF hash too, which confirms the rule works. Then `git restore public/service-worker.js`, and :3000/:3017 were clear.
- No other test pins a card query (`git grep` over e2e, lib, app, components, scripts).

### ci/18-01 (D-23: plain push of a new branch)

- `git ls-remote origin refs/heads/ci/18-01` printed nothing beforehand; `git push origin HEAD:refs/heads/ci/18-01` created the branch at f93a888. No fix push was needed.
- Run: https://github.com/tlex-web/portfolio-app/actions/runs/45506802759 (headSha f93a8889e3a53f205c54ff73aa6b548cc0352ee9 = the tip). **CI OK: success.**

| Job | Conclusion | Minutes |
|-----|------------|---------|
| Classify changes | success | 0.1 |
| Dependency Review | skipped (push event) | - |
| Lint and Type Check | success | 3.2 |
| Security Audit | success | 1.0 |
| Unit Tests | success | 1.5 |
| Build Application | success | 0.8 |
| Visual Regression | success | 4.2 |
| E2E Tests (chromium) | success, 596 passed (13.9m) | **15.6** |
| E2E Tests (firefox) | success, 497 passed (8.0m) | **9.7** |
| E2E Tests (webkit) | success, 502 passed (14.4m) | **16.1** |
| CI OK | success | 0.1 |

- Unit Tests "Test-count ratchet" line: `test-count: jest 2385 + e2e 647 = 3032 (baseline 3024)`, `test-count: OK`. CI's production listing adds the 8 @prod-only rows, as expected.
- E2E leg minutes are completedAt minus startedAt: the longest is WebKit at 16.1 min, far below the D-26 trip-wire of 35 min. No shard proposal is needed.
- `node scripts/ci/check-visual-run.mjs --sha f93a888… --wait 30`: `PASS https://github.com/tlex-web/portfolio-app/actions/runs/45506802759/job/138844073841`, with no baseline change.
- The WebKit leg runs `npx playwright test --project="$PW_PROJECT" --fail-on-flaky-tests`, and its log has no flaky or retry entries. 502 = the 497 that passed in 45445770986 plus that run's 5 failures (4 og pins and B8).

### B8 classification: **flake**

- Failed in run 45445770986 (3 attempts, 30 s timeouts in `nextFrames` and `scrollIntoViewIfNeeded`). Passed on the first attempt in run 45506802759 at f93a888, with Home code and the B8 rows unchanged. CI fails on flaky tests, so a pass after a retry would have turned the leg red.
- No test or Home change. `git diff --stat 769e1b8 -- components/home lib/ascent` is empty (DATA-09).

## Deviations from Plan

**1. [Rule 1 - Evidence] The plan's premise (a commit in 038a4cb..4d79f22 moved the hash) is refuted**
- Found during: Task 1
- Issue: every build in the range, including both endpoints, gives the old hash on a Windows checkout; git bisect's "first bad 4d79f22" is an artefact of the untested bad endpoint.
- Fix: added the LF control build at 4d79f22, the production probe and the `git ls-files --eol` check; recorded d7ff1bc as the first commit where CI fails (the pin's introduction). The Task 2 options need restating for Tim (option B has no commit to revert; option A's pin must be the LF value, which local Windows builds only produce if the card file is checked out LF).
- Files modified: none (scratchpad only)

**2. [Approved scope addition] `.gitattributes` LF rule for card files**
- Found during: Task 2 (Tim's option "A + .gitattributes (Recommended)")
- Issue: without it, every Windows build disagrees with the new pin, so local og rows would fail.
- Fix: added `app/**/opengraph-image.tsx text eol=lf` and re-checked-out the two CRLF card files as LF.
- Files modified: .gitattributes
- Commit: 5334ef4

**3. [Rule 1 - Bug] The og.spec.ts doc block said the hash does not depend on the build machine**
- Found during: Task 3
- Fix: rewrote the block with the real cause. An early draft wrote the glob `app/**/…` inside the `/** */` comment, where `**/` would close it; reworded as "the `text eol=lf` rule for opengraph-image.tsx files under app/". The block also cites the old hash only as `?1bf9...`, so the plan's `grep -c` acceptance stays 0.
- Files modified: e2e/og.spec.ts
- Commit: f93a888

**4. [Ordering] The Task 2 record is committed with the metadata, after the push**
- The decision record and Task 3 results go into this SUMMARY in the final docs commit, so the CI-verified tip f93a888 is not the local HEAD after that commit. The docs commit is not pushed to ci/18-01 (planning files only, so CI would not change).

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: scripts/guards/test-count.baseline.json (total 3024, commit a0f86f8), .gitattributes rule, e2e/og.spec.ts (0 old-hash matches)
- FOUND commits on HEAD: a0f86f8, 98ec000, 5334ef4, f93a888
- ci/18-01 remote = f93a888 = the CI run's headSha; CI OK success; Visual PASS
