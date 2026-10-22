---
phase: 07-foundation-guardrails
plan: 08
subsystem: testing
tags: [playwright, chromium-156, visual-regression, container-parity, version-floors, deps-05, guard-01]

requires:
  - phase: 07-01
    provides: "check-install-parity.mjs (container tag == lockfile @playwright/test), version-floors.json, test-count ratchet"
  - phase: 07-03
    provides: "check-visual-run.mjs, check-snapshot-commit.mjs, visual-baselines.yml, 72 Linux baselines"
  - phase: 07-04
    provides: "CI Visual Regression job on ci/** pushes"
  - phase: 07-07
    provides: "next 16.4.2 / react 19.3.1 platform the upgrade was baselined on"
provides:
  - "@playwright/test, playwright and playwright-core 1.64.0 (Chromium 156) in one commit with both workflow container tags on mcr.microsoft.com/playwright:v1.64.0-noble (fdd2652)"
  - "version-floors.json floor @playwright/test 1.64.0; the parity guard fails on any tag/lockfile mismatch"
  - "6 contact/*-reduced baselines re-baselined for the Chromium 156 textarea resize-grabber glyph, with the reason in the same commit"
  - "DEPS-05 complete: the build-order upgrade sequence (motion 14.1 -> Next 16.4 / React 19.3 -> Playwright 1.64) is finished"
affects: [07-09, 07-26, phase-08, phase-12]

actuals:
  tokens: 1431    # chars/4 over the text diff a00a772..fdd2652 (PNGs excluded); 466 without package-lock.json
  tasks: 3
  commits: 1
plan_head_before: a00a772913f7be1a7f4bbf0cc7a4172f75b0e3a0
plan_head_after: fdd26522312c032b085090524cb550a8acf87f9e

tech-stack:
  added:
    - "@playwright/test 1.64.0 (from 1.60.0); playwright / playwright-core 1.64.0; bundled Chromium 156"
    - "CI container mcr.microsoft.com/playwright:v1.64.0-noble (from v1.60.0-noble)"
  patterns:
    - "Re-baseline evidence chain: CI diff -> pixel-box analysis -> 'Update visual baselines' (update_mode=changed) -> blob-compare artifact vs HEAD -> copy only the changed PNGs -> new baseline pixel-identical to the failing run's actual"

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - scripts/guards/version-floors.json
    - .github/workflows/ci.yml
    - .github/workflows/visual-baselines.yml
    - e2e/visual/routes.spec.ts-snapshots/contact/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/contact/375-reduced-visual-light-linux.png
    - e2e/visual/routes.spec.ts-snapshots/contact/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/contact/768-reduced-visual-light-linux.png
    - e2e/visual/routes.spec.ts-snapshots/contact/1440-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/contact/1440-reduced-visual-light-linux.png

key-decisions:
  - "Pinned @playwright/test 1.64.0 as planned, even though 1.64.1 exists; Tim approved 1.64.0 at the blocking-human legitimacy checkpoint"
  - "Re-baselined 6 contact/*-reduced PNGs (Tim's option A): the only diff is Chromium 156 drawing the native textarea resize-grabber about 1px further up and right (36 px in one 8x8 box per shot); no layout or content change"
  - "Snapshot-commit acceptance uses per-slug --some --allow contact, never --allow-all (standing rule from 07-03 / 07-05)"
  - "DEPS-05 complete; GUARD-01 stays Pending in REQUIREMENTS.md until Tim confirms the Vercel build log shows Node 24.x + npm ci (07-USER-SETUP.md item from 07-01)"

patterns-established:
  - "Playwright upgrade = lockfile + every mcr.microsoft.com/playwright tag + version floor in one commit; check-install-parity.mjs is the enforcement"

# Copied verbatim from the PLAN's `requirements`. GUARD-01 is NOT flipped to Complete in
# REQUIREMENTS.md: 07-01's Vercel build-log confirmation (07-USER-SETUP.md) is still open.
requirements-completed: [DEPS-05, GUARD-01]

coverage:
  - id: D1
    description: "Playwright 1.64.0 in its own commit, with both workflow container tags on v1.64.0-noble and the @playwright/test floor raised to 1.64.0"
    requirement: DEPS-05
    verification:
      - kind: other
        ref: "node -p lockfile packages['node_modules/@playwright/test'].version -> 1.64.0; grep -c v1.64.0-noble ci.yml -> 1, visual-baselines.yml -> 1; grep -rc v1.60.0-noble .github/workflows -> 0/0; version-floors.json '\"@playwright/test\": \"1.64.0\"'"
        status: pass
      - kind: other
        ref: "git show --stat fdd2652 -> package.json, package-lock.json, version-floors.json, ci.yml, visual-baselines.yml + 6 contact PNGs (11 files)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The parity guard passes on the matching tag and fails when a container tag and the lockfile @playwright/test differ"
    requirement: GUARD-01
    verification:
      - kind: other
        ref: "node scripts/guards/check-install-parity.mjs -> 'parity: OK', exit 0 (close-out re-run)"
        status: pass
      - kind: other
        ref: "Task 2 negative control: one container tag set back to v1.60.0-noble -> check-install-parity.mjs exit 1, then restored before commit"
        status: pass
    human_judgment: false
  - id: D3
    description: "The upgrade leaves the test count unchanged"
    requirement: DEPS-05
    verification:
      - kind: other
        ref: "npx playwright test --list -> 159 tests in 6 files before and after the upgrade (Task 2)"
        status: pass
      - kind: other
        ref: "npx jest --json && npm run guard:tests -> jest 69 + e2e 65 = 134 (baseline 91) (Task 2)"
        status: pass
    human_judgment: false
  - id: D4
    description: "CI Visual Regression green on the final commit, and the commit changes only the 6 contact/*-reduced baselines, with the Chromium 156 reason in its message"
    requirement: DEPS-05
    verification:
      - kind: automated_ui
        ref: "node scripts/ci/check-visual-run.mjs --sha fdd26522312c032b085090524cb550a8acf87f9e --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/39809853089/job/119932848634, exit 0"
        status: pass
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some --allow contact -> 'snapshot-commit: OK (6 changed)', exit 0; git log -1 --format=%B contains 'Re-baseline: Chromium 156'"
        status: pass
      - kind: e2e
        ref: "gh run view 39809853089 -> success on fdd2652 / ci/07-08; Lint and Type Check, Visual Regression, Unit Tests, Security Audit, E2E Tests, Build Application all success; Dependency Review skipped (push run)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The re-baselined diff is explained by Chromium 156 rasterisation alone (no layout or content change), so the plan's prohibition holds"
    requirement: DEPS-05
    verification: []
    human_judgment: true
    rationale: "The prohibition's verification is 'judgment' by design. The orchestrator's pixel analysis located every diff in one 8x8 box (the native textarea resize-grabber) and showed the new baselines are pixel-identical to the failing run's actuals; Tim reviewed the 6 PNGs and chose to re-baseline (option A)"
  - id: D6
    description: "@playwright/test@1.64.0 is a legitimate release (recency-flagged [SUS: too-new])"
    requirement: DEPS-05
    verification: []
    human_judgment: true
    rationale: "Package legitimacy is a blocking-human checkpoint by design (Task 1). The orchestrator checked lockfile integrity, no install scripts, Microsoft maintainers and the MCR v1.64.0-noble tag; Tim replied \"approved\""

duration: 3h 42m wall clock (2026-10-22T12:27Z to 16:09Z), mostly CI runs, the baseline workflow and Tim's PNG review
completed: 2026-10-22
status: complete
---

# Phase 7 Plan 08: Playwright 1.64.0 (Chromium 156) with v1.64.0-noble containers, DEPS-05 complete

**One commit (`fdd2652`) moves @playwright/test, playwright and playwright-core 1.60.0 -> 1.64.0. The same commit puts both workflow containers on `mcr.microsoft.com/playwright:v1.64.0-noble`, raises the @playwright/test floor to 1.64.0, and re-baselines 6 contact/*-reduced PNGs. Those PNGs changed only because Chromium 156 draws the native textarea resize-grabber about 1px further up and right. CI run 39809853089 on the commit is green on every job. DEPS-05 is complete.**

## Performance

- **Duration:** 3h 42m wall clock. Most of it was CI (the first ci/07-08 run, the "Update visual baselines" run, and the final run) plus Tim's PNG review and amend.
- **Started:** 2026-10-22T12:27Z (after the 07-07 close-out; Task 2 commit authored 12:32:59Z)
- **Completed:** 2026-10-22T16:09Z (close-out verification)
- **Tasks:** 3/3
- **Files modified:** 11 (5 config/lockfile files and 6 baseline PNGs)

## Accomplishments
- **Playwright 1.64.0 (DEPS-05).** `@playwright/test`, `playwright` and `playwright-core` are now 1.64.0, which bundles Chromium 156. The version is pinned exactly as the plan says. 1.64.1 exists but was deliberately not used.
- **Container parity.** `.github/workflows/ci.yml` (Visual Regression job) and `.github/workflows/visual-baselines.yml` both use `mcr.microsoft.com/playwright:v1.64.0-noble`, and no `v1.60.0-noble` tag is left. The floor `"@playwright/test": "1.64.0"` is in `scripts/guards/version-floors.json`. `check-install-parity.mjs` passes, and the Task 2 negative control showed it fails when a tag and the lockfile disagree.
- **Test count unchanged.** `npx playwright test --list` showed 159 tests in 6 files before and after. The ratchet reads jest 69 + e2e 65 = 134 against a baseline of 91.
- **Re-baseline, forced by Chromium 156 and limited to the cause.**
  - The first CI run on ci/07-08 (39781750747) failed in Visual Regression only: 6 failed, 66 passed. The failures were `contact/{375,768,1440}-reduced` in both visual-dark and visual-light.
  - Every diff was exactly 36 px inside one 8x8 box at the bottom-right corner of the Contact form textarea: the native resize-grabber glyph. The textarea's border, radius and fill, and every other pixel, were identical.
  - The "Update visual baselines" run (39802360608, update_mode=changed) returned exactly those 6 PNGs changed out of 72, with nothing added or removed. Each new baseline is pixel-identical to the failing run's actual screenshot, so the new render is deterministic.
  - Only those 6 PNGs went into the commit, and its message states the reason.

## Task Commits

1. **Task 1: Package legitimacy check for @playwright/test@1.64.0** (checkpoint, blocking-human). No commit. Tim replied "approved".
2. **Task 2 (tracer): Playwright 1.64.0 + container tags in one commit, parity guard green.** First committed as `01640c5`, then amended by Tim into `fdd2652` (chore). The tracer gate re-ran `<verify>` and it passed.
3. **Task 3: Zero-diff gate, or a Chromium-forced re-baseline with the reason stated** (checkpoint). Resolved as "re-baselined (Chromium 156)". The 6 PNGs are in the same commit, `fdd2652`.

**Plan metadata:** the docs commit that follows this SUMMARY.

## Files Created/Modified
- `package.json`: @playwright/test 1.64.0
- `package-lock.json`: @playwright/test, playwright and playwright-core resolved to 1.64.0
- `scripts/guards/version-floors.json`: floor `@playwright/test` 1.60.0 -> 1.64.0
- `.github/workflows/ci.yml`: Visual Regression container `v1.64.0-noble`
- `.github/workflows/visual-baselines.yml`: baseline generator container `v1.64.0-noble`
- `e2e/visual/routes.spec.ts-snapshots/contact/{375,768,1440}-reduced-visual-{dark,light}-linux.png`: re-baselined (6 files)

## Decisions Made
- **1.64.0, not 1.64.1.** The plan pins 1.64.0, and the legitimacy checkpoint approved exactly that version.
- **Re-baseline under the plan's own Task 3 path, with Tim's explicit approval (option A).** The diff is a native form-control glyph drawn by the new Chromium. It is not a layout, content or app change.
- **GUARD-01 stays Pending.** 07-08 is the last plan that lists it, and its Playwright-container half is now enforced and green. But 07-01 left one item open: Tim has not yet confirmed that the Vercel build log shows Node 24.x and `npm ci` (07-USER-SETUP.md, D3 in 07-01-SUMMARY, `human_judgment: true`). GUARD-01's text names Vercel explicitly, so it should flip to Complete only after that confirmation.

## Deviations from Plan

None of these is an auto-fix. Each one is documented, and Tim approved or carried out the ones that needed a decision.

**1. [Plan text - wording] Re-baseline reason names the textarea resize-grabber, not "font rasterisation"**
- **Found during:** Task 3
- **Issue:** The plan expected Chromium 156 font rasterisation (RESEARCH A4) and suggested that wording for the commit message. The actual diff is the native textarea resize-grabber glyph.
- **Resolution:** The message says what actually changed: "Re-baseline: Chromium 156 (Playwright 1.64) textarea resize-grabber rasterisation on contact/*-reduced (36 px in an 8x8 box per shot); no layout or content change." It still contains the plan-required string `Re-baseline: Chromium 156`. The re-baseline path is the one Task 3 step 3 sanctions, and Tim approved it.
- **Committed in:** `fdd2652`

**2. [Acceptance - tighter check] `check-snapshot-commit --some --allow contact` instead of `--allow-all`**
- **Found during:** Task 3 acceptance
- **Issue:** The plan's criterion uses `--allow-all`, which turns off the per-slug folder check.
- **Resolution:** Tim's standing rule (07-03, 07-05) is per-slug `--allow`, never `--allow-all`. `--some --allow contact` is strictly tighter, and it passes with `OK (6 changed)`.

**3. [Procedure] Push forms on ci/07-08**
- **Found during:** Task 3
- **Issue:** The plan says `git push --force`, and the auto-mode classifier blocks force-pushes.
- **Resolution:** The first push was a plain `git push origin 01640c5:refs/heads/ci/07-08`. The branch was new, so the result is identical. The post-amend re-push was Tim's own `--force-with-lease`, because only Tim commits and pushes baselines. The orchestrator dispatched the baseline workflow and downloaded its artifact with gh.
- **Verification:** `git ls-remote origin refs/heads/ci/07-08` -> `fdd26522312c032b085090524cb550a8acf87f9e`

---

**Total deviations:** 0 auto-fixed. 1 wording (the reason states the real cause), 1 tighter acceptance check, 1 procedural (equivalent push forms).
**Impact on plan:** None on scope. Every must_have truth holds. The prohibition ("re-baseline only if the diff is Chromium 156 rasterisation alone") is met: the only changed pixels are the grabber glyph.

## Issues Encountered
- The first CI run on ci/07-08 (39781750747) failed Visual Regression with 6 contact diffs. This is the Task 3 contingency the plan planned for, and it was resolved through the plan's re-baseline path (see Accomplishments).

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-14 (Playwright container image):** mitigated. Only the official MCR image is used, the tag is pinned to the lockfile version, and `check-install-parity.mjs` enforces it.
- **T-07-SC (npm install tampering):** mitigated. Task 1 was a blocking-human legitimacy check before the install, the version is exact, and installs use `npm ci`.

## User Setup Required
None new from this plan. The two 07-USER-SETUP.md items are still open with Tim:
- confirm the Vercel build log shows Node 24.x and `npm ci` (this is what keeps GUARD-01 Pending);
- make Visual Regression, Lint and Type Check, and Unit Tests required status checks on `main`.

## Next Phase Readiness
- **Ready for 07-09.** The isolated-upgrade sequence (motion 14.1 -> Next 16.4 / React 19.3 -> Playwright 1.64) is finished, and later plans run on Playwright 1.64 / Chromium 156.
- **Follow-up idea (Tim to decide, not done, not in scope):** native form-control glyphs such as the textarea grabber may shift again on future Chromium bumps. The visual suite could neutralise them, for example with `resize: none` on textareas in `e2e/visual/hide-canvas.css`. That would change the contact baselines once, so it needs its own approved re-baseline.
- **Still open from 07-07:** `main` (Vercel production) lacks the Next 16.4.2 / sharp 0.35.5 security patch until Tim merges the phase branch. Merge recommended soon.
- **Pushing:** `fdd2652` is on `origin/ci/07-08`. The docs commits stay local, and pushing them is Tim's job.

## Verification (close-out, 2026-10-22T16:08Z)

| Check | Result |
|-------|--------|
| Lockfile `@playwright/test` | 1.64.0 |
| `grep -c v1.64.0-noble` ci.yml / visual-baselines.yml | 1 / 1 |
| `grep -rc v1.60.0-noble .github/workflows` | 0 / 0 |
| version-floors.json | `"@playwright/test": "1.64.0"` |
| `node scripts/guards/check-install-parity.mjs` | `parity: OK`, exit 0 |
| `check-visual-run.mjs --sha fdd26522312c... --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39809853089/job/119932848634`, exit 0 |
| `check-snapshot-commit.mjs --sha HEAD --some --allow contact` | `snapshot-commit: OK (6 changed)`, exit 0 |
| `git log -1 --format=%B` contains `Re-baseline: Chromium 156` | yes (1 match) |
| `git diff 01640c5 fdd2652` outside the snapshot dir | empty; only the 6 contact PNGs differ |
| `gh run view 39809853089` | success. Lint and Type Check, Visual Regression, Unit Tests, Security Audit, E2E Tests, Build Application all success; Dependency Review skipped |
| `git ls-remote origin refs/heads/ci/07-08` | fdd26522312c032b085090524cb550a8acf87f9e |

## Self-Check: PASSED
- `fdd2652` is an ancestor of HEAD. `git rev-list --count a00a772..HEAD` = 1, measured from the plan ledger.
- All 11 modified files exist on disk with the stated content (versions, tags, floor, 6 PNGs).
- Every Task 2 and Task 3 acceptance criterion was re-run at close-out and passes. Task 3 used `--some --allow contact` (deviation 2).
- Plan-level verification: parity is green with v1.64.0-noble, the `--list` totals are unchanged (Task 2), and CI Visual Regression is green with the re-baseline reason stated.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-22*
