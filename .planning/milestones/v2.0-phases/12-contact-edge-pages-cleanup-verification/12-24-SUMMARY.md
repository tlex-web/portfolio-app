---
phase: 12-contact-edge-pages-cleanup-verification
plan: 24
subsystem: testing
tags: [ci, test-count-ratchet, project-record, uat, safari, csp]
status: complete

requires:
  - phase: 12-contact-edge-pages-cleanup-verification
    provides: "12-23 three-engine CI green on 147bc82 (run 41571031827), no round 3 (Tim: \"No round 3\"); 12-01 Resolved values (vercel.plan Hobby, sw.reload-once yes)"
provides:
  - "Test-count ratchet raised to jest 1658 + e2e 547 = 2205 (was 1749)"
  - "PROJECT.md: the twelve Phase 12 requirements validated, eight Key Decisions rows, Phase 12 context lines"
  - "D-19 UAT checklist (a)-(h) plus orchestrator additions (i)-(l) for /gsd-verify-work"
affects: [gsd-verify-work, milestone-audit]

actuals:
  tokens: 3800
  tasks: 2
  commits: 2
plan_head_before: 77b37af5dc50328315441ef95b1f27b4138d772a
plan_head_after: 215d2315a0d9dafb0a54cc6bfe5d2f69bcc49306

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - scripts/guards/test-count.baseline.json
    - .planning/PROJECT.md

key-decisions:
  - "No round 3 on ci/12-23 (12-23 recorded Tim's reply \"No round 3\"), so check-snapshot-commit was not run; the CI head is 12-23's last push, 147bc82"
  - "UAT item (g) is none: the only \"pending Tim\" hit in the Phase 12 SUMMARYs (12-12-SUMMARY.md:154) is a negation, so PROJECT.md carries no pending-Tim notes"
  - "This plan's two commits stay local and unpushed; pushing them is Tim's call, and their CI run is UAT item (h)"

requirements-completed: [VERIFY-01, VERIFY-02, VERIFY-03, VERIFY-04]

coverage:
  - id: D1
    description: "CI head 147bc82 (tip of ci/12-23) green in Lint and Type Check, Unit Tests, E2E Tests and Visual Regression"
    requirement: VERIFY-03
    verification:
      - kind: other
        ref: "node scripts/ci/check-visual-run.mjs --sha 147bc82df5ad68488e74c57342a0572b217b634a --job <each of the four> --wait 60 -> PASS x4 (run 41571031827)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Test-count ratchet raised through test-count.mjs --update to 2205 (jest 1658, e2e 547)"
    verification:
      - kind: other
        ref: "npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests -> 'jest 1658 + e2e 547 = 2205 (baseline 2205)', OK"
        status: pass
    human_judgment: false
  - id: D3
    description: "PROJECT.md names all twelve Phase 12 requirement IDs in Validated lines marked Phase 12, plus the Phase 12 Key Decisions"
    verification:
      - kind: other
        ref: "grep -oE '(CONTACT-0[1-3]|EDGE-0[12]|SEO-0[1-3]|VERIFY-0[1-4])' .planning/PROJECT.md | sort -u | wc -l -> 12; grep -cE '^- ✓ .*Phase 12' -> 4"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-19 hand checks: real Safari, Firefox footer band, keyboard focus visibility, production CSP header, link previews, screen-reader listen, preview slug check"
    verification: []
    human_judgment: true
    rationale: "These are the UAT checklist below: real Safari, visual judgement, a deployed production or preview, and a screen reader are outside what CI can run"

duration: 4min
completed: 2026-11-03
---

# Phase 12 Plan 24: Phase Close, Ratchet and UAT Checklist Summary

**The CI head 147bc82 is green in all four jobs (run 41571031827), the test-count ratchet goes from 1,749 to 2,205 (jest 1,658 + e2e 547), PROJECT.md records the twelve Phase 12 requirements and eight decisions, and Tim gets a D-19 hand-check list (a)-(h) plus four additions.**

## Performance

- **Duration:** about 4 min
- **Started:** 2026-11-03T09:54:47Z
- **Completed:** 2026-11-03T09:58Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- The final pushed commit is green everywhere. No round 3, so there was no snapshot commit to check.
- The ratchet holds the Phase 12 test total. It was raised with `--update`, never edited by hand.
- PROJECT.md shows Phase 12: Validated lines, the Active list ticked, the Key Decisions rows and the changed Context lines.
- The UAT checklist below is ready for `/gsd-verify-work`.

## CI head (Task 1)

- `git ls-remote origin refs/heads/ci/12-23` = `147bc82df5ad68488e74c57342a0572b217b634a`, checked at 2026-11-03T09:55Z. This is 12-23's last push.
- **No round 3.** 12-23 recorded Tim's literal reply "No round 3", so there is no round-3 commit. `check-snapshot-commit.mjs` was **not** run, because there is no baseline commit to check.
- `node scripts/ci/check-visual-run.mjs --sha 147bc82df5ad68488e74c57342a0572b217b634a --job "<job>" --wait 60`:

| Job | Result | Run / job id |
|-----|--------|--------------|
| Lint and Type Check | PASS | run 41571031827, job 125703706788 |
| Unit Tests | PASS | run 41571031827, job 125703706758 |
| E2E Tests (chromium, firefox, webkit) | PASS | run 41571031827, job 125703706742 |
| Visual Regression | PASS | run 41571031827, job 125703706337 |

- Ratchet: `npx jest --json --outputFile=jest-results.json --silent` gave 102 suites and 1,658 tests, all passing, with 0 pending and 0 todo. Then `node scripts/guards/test-count.mjs --jest jest-results.json --update` printed `jest 1658 + e2e 547 = 2205 (baseline 1749)` and wrote the baseline (`recordedAt` 2026-11-03, `commit` 77b37af). `npm run guard:tests` then printed `jest 1658 + e2e 547 = 2205 (baseline 2205)`, OK. `jest-results.json` is gitignored and was removed afterwards.

## Task Commits

1. **Task 1: Final CI verification and the raised ratchet**: `5d2aaf2` (chore)
2. **Task 2: PROJECT.md and the D-19 UAT checklist**: `215d231` (docs)

**Plan metadata:** the `docs(12-24)` commit that holds this SUMMARY

Both commits are **local and unpushed** (see UAT item (h)).

## Files Created/Modified

- `scripts/guards/test-count.baseline.json`: jest 1658, e2e 547, total 2205
- `.planning/PROJECT.md`:
  - four Validated lines marked "Phase 12, 2026-11-03" that cover all twelve IDs;
  - Active items ticked;
  - eight Key Decisions rows;
  - the SEO scope row's outcome updated;
  - Context lines for the Phase 12 ratchet, the deleted legacy variants and network-first navigations

## PROJECT.md checks

- `grep -oE "(CONTACT-0[1-3]|EDGE-0[12]|SEO-0[1-3]|VERIFY-0[1-4])" .planning/PROJECT.md | sort -u | wc -l` printed **12**. The planning baseline was 3.
- `grep -cE "^- ✓ .*Phase 12" .planning/PROJECT.md` printed **4**. The baseline was 0.
- `grep -c "pending Tim" .planning/PROJECT.md` printed **0**. There are 0 ID-and-item pairs, because (g) is "none".
- Every "Tim chose / Tim:" line in the new Key Decisions rows quotes a literal reply recorded in a SUMMARY, the debug file or the deferred rows: "cover script data too", "A" and "Leave as is (Recommended)" (12-02 follow-up and `.planning/debug/12-slug-script-data.md`); "Keep runtime render (Recommended)" (12-14, 12-19); "When it's live (Recommended)" and "www.tlui.de" (deferred-items); "No round 3" (12-23); the 12-06 answers "Approve (Recommended)", "Approve scoped (Recommended)", "Defer (Recommended)" and "Canvas fix". No other row is attributed to Tim. For the D-17 CSP row, the source is Tim's acknowledgement of info.csp in 12-01 ("acknowledged, no veto").
- The neutral-404 row describes what shipped:
  - the proxy rewrite;
  - the proxy self-fetch of `/<section>/_`, pinned to loopback and Vercel hosts (`b32eb35`, `67970b3`, `d9df0bf`);
  - the fallback to the plain rewrite.

  It does not say a plain rewrite does the job.

## UAT checklist (D-19)

Tim runs these by hand for `/gsd-verify-work`. Production URL: https://portfolio-app-mocha-three.vercel.app

**(a) Real Safari (iOS and/or macOS).** Check each of these:
- nav and the mobile menu;
- the Home ascent (scroll from the base to the summit plaque);
- the lightbox: open a photo from the Grid, step with the arrow keys, press Escape;
- the View Transitions morph between Photographs and a photo;
- signing the contact register (send a message, see "register signed").

Expected: no broken layout, no stuck overlay, and focus returns to the tile after the lightbox closes.

**(b) Firefox: the footer contour band.** Look at it on any route. It should read as 1 px strokes, not blurred or doubled. This has been open since 08-13.

**(c) Tim's keyboard-only run (D-22).** Use only the keyboard across nav, the `/photos` map, the lightbox and the contact form, and judge whether focus is clearly visible at every stop. The e2e suite proves the stops are reachable. Only a person can judge whether the focus ring is visible enough.

**(d) Production CSP header (D-17).** After the deploy, run:

```
curl -sI https://portfolio-app-mocha-three.vercel.app/ | grep -i content-security-policy
```

Expected: the header contains `upgrade-insecure-requests` and contains no GitHub raw-content origin (`raw.githubusercontent.com`). `'unsafe-eval'` should be absent too, since it is dev-only.

**(e) Link previews.** Paste a photo URL (e.g. `/photos/<slug>`), a project URL (`/projects/box`) and Home into a link-preview tool (opengraph.xyz or a chat app). Expected:
- the photo card is contain-fitted with the © line;
- the project card shows the route, grade and pitch;
- Home shows the default contour card with Tim's og.alt-default.

**(f) Vercel plan note (vercel.plan).** 12-01 records **Hobby**. Skew Protection is Pro/Enterprise only, so it is not available. The service worker's reload-once guard (sw.reload-once = yes) works either way. Nothing to do unless the plan changes.

**(g) "Pending Tim" rows: none.** `grep -l "pending Tim" .planning/phases/12-contact-edge-pages-cleanup-verification/12-*-SUMMARY.md` finds only `12-12-SUMMARY.md`. Its one hit (line 154) says Default #7 "is not 'pending Tim'": Tim kept the 12-01 default. No open Tim decision is recorded as pending in any Phase 12 SUMMARY.

**(h) CI on this plan's two local commits.** Once Tim pushes `5d2aaf2` (ratchet) and `215d231` (PROJECT.md), together with the 12-23 and 12-24 metadata commits, read the jobs on the pushed sha:

```
node scripts/ci/check-visual-run.mjs --sha <pushed sha> --job "Lint and Type Check"
node scripts/ci/check-visual-run.mjs --sha <pushed sha> --job "Unit Tests"
node scripts/ci/check-visual-run.mjs --sha <pushed sha> --job "E2E Tests"
```

Expected: PASS on all three. The "Test-count ratchet" step in Unit Tests runs the raised guard (2,205).

### Orchestrator additions

**(i) Safari items from 12-23.** Playwright's WebKit is not Safari (A8).
1. On `/photos` Grid, open a photo, then press browser Back straight away. Repeat with Escape, then with Close, each pressed straight after opening. Expected: the lightbox closes, the URL returns to the grid, the page stays alive and focus returns to the tile. This is the WinCairo crash path, which is excluded on Windows WebKit only.
2. Load a photo page directly and press Next straight away. Expected: the tab title names the photo now shown. Leaving the photo by a nav link, Escape or close shows the next page's title. This checks the 12-23 title fix.
3. On a project page with the demo clip, open Web Inspector, Network tab. Expected: no MP4 request before you press play. Linux WebKit ignores `preload="none"`, so this is tagged `@no-linux-webkit` in CI.

**(j) Screen-reader listen.** Use NVDA, JAWS or VoiceOver on `/contact`:
- submit an invalid form and listen to the focused error summary ("Check {n} fields" and the field links);
- type into Message past 1,800 characters and listen to the counter's threshold announcements (1,800, 1,900, 1,950, 2,000, over the limit).

12-26 notes the tests check markup only.

**(k) Preview slug check.** On a deployed preview, logged in, open view-source of `/photos/nf-check`. Expected: 0 hits for `nf-check`, and the page contains the neutral `"photos","_"` segment. If the self-fetch is blocked on Vercel by deployment protection, the firewall or a bot challenge, the proxy falls back silently and the slug reappears (12-02 "Open").

**(l) After DNS for www.tlui.de is live** (deferred row, Tim chose "When it's live (Recommended)" and "www.tlui.de"):
1. Set `site.url` to `https://www.tlui.de`.
2. Make sure `canFetchNeutral` allows www.tlui.de.
3. Redirect tlui.de and the vercel.app host to www.
4. Re-run the seo, og and not-found specs.

## Open follow-ups

These are not fixed here, as the plan's scope says. The owner is listed for each.

| Item | Source | Owner |
|------|--------|-------|
| Hero contour (`ContourField lod="hero"`) not in the service worker install precache; a first offline `/offline` can show the sheet without contours | Phase 12 deferred-items (12-15; exact fix in the 12-17 note) | follow-up after Phase 12; orchestrator offers Tim a quick plan |
| Prefetch requests skip the proxy, so a forged `x-edge-section` reaches the 404 render with no CSP header | Phase 12 deferred-items (12-02 debug; Tim: "Log it for 12-22 (Recommended)") | follow-up after Phase 12; orchestrator offers Tim a quick plan |
| `e2e/shell.spec.ts` "every route credits the source" cold-compiles eight routes in one 30 s test on dev (a `test.slow()` or per-route split) | Phase 11 deferred-items (12-22 reproduced it) | follow-up after Phase 12; dev-only, CI unaffected |
| Design-system G3 scroll-lock case breaks under dev-server cross-talk (move it to the production project); and the `e2e/design-system.spec.ts:20` comment still lists `text-shadow-glow*` | Phase 10 deferred-items (12-22 reproduced it); Phase 12 deferred-items (12-04) | follow-up after Phase 12; orchestrator offers Tim a quick plan |
| Switch the canonical host to www.tlui.de | Phase 12 deferred-items | waits on DNS; UAT item (l) |

## Decisions Made

See `key-decisions` in the frontmatter. In short:
- no round 3, so there was no snapshot-commit check;
- (g) is none, so PROJECT.md has no pending-Tim notes;
- the commits stay local.

## Deviations from Plan

None. The plan was executed as written. Two notes:
- The round-3 snapshot check was skipped as the plan allows, because there was no round-3 commit.
- The PROJECT.md Key Decisions add one row beyond the plan's list, for the 12-06 package and D-25 answers. The orchestrator asked for it, and every quote in it comes from 12-06-SUMMARY.

## Issues Encountered

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- All 24 Phase 12 plans now have a SUMMARY. The phase is ready for `/gsd-verify-work 12` with the checklist above.
- Local HEAD is ahead of origin with the 12-23 metadata commits and this plan's commits, all unpushed.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-03*

## Self-Check: PASSED

- Files: FOUND `scripts/guards/test-count.baseline.json` (total 2205), `.planning/PROJECT.md`, this SUMMARY
- Commits on this branch: FOUND 5d2aaf2, 215d231 (`git rev-list --count 77b37af..215d231` = 2)
- Task 1: baseline total 2205 > 1749; CI head sha and the four PASS job ids recorded above
- Task 2: verify prints 12; `^- ✓ .*Phase 12` count 4; `## UAT checklist (D-19)` with (a)-(h) plus (i)-(l); pending-Tim count 0 = 0 pairs
