---
phase: 18-immersive-survey-layout
plan: 01
subsystem: testing
tags: [ci, og-image, turbopack, line-endings, playwright, webkit, guard-03]
status: in-progress
# DRAFT at the Task 2 checkpoint (blocking-human). Tasks 2-3 are not done; a
# continuation agent finishes this file after Tim's literal reply.

requires:
  - phase: 17-region-routes-seo-structured-data
    provides: the e2e/og.spec.ts v2.0 pin rows (added in d7ff1bc) and the red ci/17-review-fixes run 45445770986
provides:
  - "Task 1 evidence: why CI receives ?f8a1b67515ad261d while the pin says ?1bf973d7cc2e42c4"
affects: [18-29, e2e/og.spec.ts, every ci/18-* push]

key-files:
  created: []
  modified: []

requirements-completed: []  # filled at plan completion (plan requirements: REGION-01, REGION-02, REGION-03, REGION-05, LBOX-09)
---

# Phase 18 Plan 01: Wave 0 CI trust and UI defaults Summary (DRAFT, Task 2 checkpoint)

**No commit moved the v2.0 card hash: Turbopack hashes the card file's own bytes, a Windows checkout has CRLF (core.autocrlf=true) and hashes to ?1bf973d7cc2e42c4, while CI and production (Linux, LF) hash to ?f8a1b67515ad261d; the pin added in d7ff1bc carries the Windows value.**

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

Pending: awaiting Tim's reply at the Task 2 checkpoint. Nothing is recorded as approved.

## Task 3

Not started (awaits Task 2).

## Deviations from Plan

**1. [Rule 1 - Evidence] The plan's premise (a commit in 038a4cb..4d79f22 moved the hash) is refuted**
- Found during: Task 1
- Issue: every build in the range, including both endpoints, gives the old hash on a Windows checkout; git bisect's "first bad 4d79f22" is an artefact of the untested bad endpoint.
- Fix: added the LF control build at 4d79f22, the production probe and the `git ls-files --eol` check; recorded d7ff1bc as the first commit where CI fails (the pin's introduction). The Task 2 options need restating for Tim (option B has no commit to revert; option A's pin must be the LF value, which local Windows builds only produce if the card file is checked out LF).
- Files modified: none (scratchpad only)
