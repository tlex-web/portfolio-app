---
phase: 07-foundation-guardrails
plan: 06
subsystem: dependencies
tags: [next, react, react-three-fiber, drei, eslint-config-next, version-floors, visual-regression, safecanvas, webgl, swc, deps-04]

requires:
  - phase: 07-01
    provides: "scripts/guards/version-floors.json (floors + forbiddenDirect), check-install-parity"
  - phase: 07-02
    provides: "eslint flat config with LEGACY_COMPILER_FILES; same-classnames.mjs parity guard"
  - phase: 07-03
    provides: "72 Linux baselines; check-visual-run.mjs, check-snapshot-commit.mjs"
  - phase: 07-04
    provides: "CI Visual Regression job on ci/** pushes"
  - phase: 07-05
    provides: "motion 14.1.0; the zero-diff exception policy (Tim-approved, per-slug --some --allow)"
provides:
  - "next 16.4.0, eslint-config-next 16.4.0, react / react-dom 19.3.0, @types/react / @types/react-dom 19.3.0, @react-three/fiber 9.8.1, @react-three/drei 10.7.9 in one atomic commit (a3c2b81)"
  - "version-floors.json floors raised to those versions (new floors for @types/react and @types/react-dom)"
  - "components/SafeCanvas.tsx: every R3F <Canvas> sits inside an error boundary with an inert-canvas fallback, so routes survive browsers without WebGL under R3F >= 9.8"
  - "ESLint ban on importing Canvas from @react-three/fiber (+ guard selftest probe), jest SafeCanvas test, e2e/no-webgl.spec.ts"
  - "app/offline/page.tsx separator after </strong> is an explicit {' '} (compiler-independent)"
  - "Six offline reduced-motion baselines re-baselined under a documented, Tim-approved exception (Next 16.2.6 SWC whitespace bug fixed in 16.4.0)"
affects: [07-07, 07-13, 07-26, phase-09, phase-10, phase-11]

actuals:
  tokens: 16064   # chars/4 over the text diff ad6df3d..e72c661 (PNGs excluded); 5256 without package-lock.json
  tasks: 3
  commits: 3
plan_head_before: ad6df3d63cc387e372826c64a30711bebe8a51fb
plan_head_after: e72c661befccb339a85fdae3144e192089d6fff6

tech-stack:
  added:
    - "next 16.4.0 (from 16.2.6), eslint-config-next 16.4.0 (pulls eslint-plugin-react-hooks 7.1.1)"
    - "react / react-dom 19.3.0 (from 19.2.6), @types/react 19.3.0, @types/react-dom 19.3.0"
    - "@react-three/fiber 9.8.1 (from 9.6.1), @react-three/drei 10.7.9 (from 10.7.7)"
  patterns:
    - "R3F canvases are rendered through components/SafeCanvas.tsx only; ESLint no-restricted-imports enforces it"
    - "JSX text separators next to inline elements are explicit {' '} where the line wraps, so compiler JSX-whitespace handling cannot move text"

key-files:
  created:
    - components/SafeCanvas.tsx
    - components/__tests__/SafeCanvas.test.tsx
    - e2e/no-webgl.spec.ts
  modified:
    - package.json
    - package-lock.json
    - scripts/guards/version-floors.json
    - eslint.config.mjs
    - scripts/guards/selftest.mjs
    - components/HologramTerminal.tsx
    - components/{AnimatedGradientMesh,DualParticleSystem,MountainTerrain3D,PhotoCarousel3D}.tsx
    - app/offline/page.tsx
    - e2e/visual/routes.spec.ts-snapshots/offline/{375,768,1440}-reduced-visual-{dark,light}-linux.png (6)

key-decisions:
  - "Task 1 resolved 'approved 16.4.0': no patched 16.4.x is published yet (npm latest = 16.4.0, 2026-10-06), so step 5b does NOT fold; 07-07 bumps to the 2026-10-14 security release and completes DEPS-04"
  - "SafeCanvas (error boundary + inert canvas fallback) instead of pinning R3F < 9.8: R3F 9.8 intentionally rethrows WebGLRenderer-creation errors through React; Tim accepted the trade-off that scene errors now leave a blank canvas instead of the full-page error"
  - "Offline re-baseline (Option C, Tim 2026-10-11) under the 07-05 zero-diff exception policy: the old baselines encoded a Next 16.2.6 SWC bug; verified with check-snapshot-commit --some --allow offline, never --allow-all"

patterns-established:
  - "Dependency-bump diff triage: bisect individual packages in a scratch worktree based on the last green commit, and compare SWC output per file across Next versions before deciding a visual diff is a regression"

requirements-completed: []  # Plan declares [DEPS-04]; DEPS-04 is NOT complete here - 07-07 completes it with the 2026-10-14 Next security patch

coverage:
  - id: D1
    description: "Platform set installed in one atomic commit: next 16.4.0, eslint-config-next 16.4.0, react/react-dom 19.3.0, @types/react* 19.3.0, R3F 9.8.1, drei 10.7.9"
    requirement: DEPS-04
    verification:
      - kind: other
        ref: "node -p require('./package-lock.json').packages['node_modules/<pkg>'].version -> next 16.4.0, react 19.3.0, react-dom 19.3.0, @types/react 19.3.0, @types/react-dom 19.3.0, @react-three/fiber 9.8.1, @react-three/drei 10.7.9, eslint-config-next 16.4.0"
        status: pass
      - kind: other
        ref: "git show --stat a3c2b81 -> package.json, package-lock.json, scripts/guards/version-floors.json (+ components/HologramTerminal.tsx) in one commit"
        status: pass
      - kind: other
        ref: "npm ls --depth=0 -> exit 0, all eight packages at the new versions"
        status: pass
    human_judgment: false
  - id: D2
    description: "version-floors.json floors equal the new versions; the parity guard passes"
    requirement: DEPS-04
    verification:
      - kind: other
        ref: "scripts/guards/version-floors.json floors next/eslint-config-next 16.4.0, react/react-dom/@types/react/@types/react-dom 19.3.0, @react-three/fiber 9.8.1, @react-three/drei 10.7.9; npm run guard:parity -> 'parity: OK', exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Routes with an R3F canvas stay intact in browsers without WebGL (SafeCanvas at all 5 call sites, lint ban, unit + e2e regression tests)"
    requirement: DEPS-04
    verification:
      - kind: e2e
        ref: "e2e/no-webgl.spec.ts (4 canvas routes x chromium + firefox) - CI run 38134022192 E2E Tests success, 58 passed"
        status: pass
      - kind: unit
        ref: "components/__tests__/SafeCanvas.test.tsx - CI run 38134022192 Unit Tests success (69/69)"
        status: pass
    human_judgment: false
  - id: D4
    description: "CI is green on the final plan commit e72c661 (Lint/Type, Unit, Build, Security, E2E 58/58, Visual Regression 72/72)"
    requirement: DEPS-04
    verification:
      - kind: automated_ui
        ref: "node scripts/ci/check-visual-run.mjs --sha e72c661befccb339a85fdae3144e192089d6fff6 --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/38134022192/job/114454066197, exit 0"
        status: pass
      - kind: other
        ref: "gh run view 38134022192 -> conclusion success, headSha e72c661, headBranch ci/07-06; all jobs success, Dependency Review skipped (push run)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Only the six offline reduced-motion PNGs changed, and only in e72c661; a3c2b81 and 8d37032 change no PNG"
    requirement: DEPS-04
    verification:
      - kind: other
        ref: "check-snapshot-commit.mjs --sha a3c2b81 --none -> OK (0 changed); --sha 8d37032 --none -> OK (0 changed); --sha e72c661 --some --allow offline -> OK (6 changed); negative control --allow home -> 6 FAIL, exit 1"
        status: pass
    human_judgment: false
  - id: D6
    description: "The six re-baselined offline shots differ only by the spec-correct space in 'Good news! This site' (Next 16.2.6 SWC bug fixed in 16.4.0)"
    requirement: DEPS-04
    verification: []
    human_judgment: true
    rationale: "No automated check judges what changed inside a PNG or whether it matches intent. The debug session measured the diff region from the visual-diff artifact (one line, 1380-3713 px), proved the compiler cause with per-file SWC compiles, and Tim approved the exception (Option C) before commit"

duration: 10h 24m wall-clock (incl. debug session)
completed: 2026-10-11
status: complete
---

# Phase 7 Plan 06: Next 16.4.0 + React 19.3 + R3F 9.8.1 + drei 10.7.9 (DEPS-04, part 1) Summary

**The platform set landed in one commit (`a3c2b81`): next and eslint-config-next 16.4.0, react, react-dom and @types/react* 19.3.0, R3F 9.8.1 and drei 10.7.9, with raised version floors. Two follow-up commits fixed what the bump exposed. `8d37032` adds SafeCanvas, because R3F 9.8 now rethrows WebGL-creation errors and broke routes in browsers without WebGL. `e72c661` makes the /offline separator explicit and re-baselines six offline shots; Tim approved this as an exception, because the old baselines had captured a Next 16.2.6 SWC whitespace bug. CI is fully green on `e72c661`. DEPS-04 stays open: 07-07 bumps to the 2026-10-14 security patch.**

## Performance

- **Duration:** about 10h 24m wall-clock. That covers the platform commit, the two-cause CI debug session (`.planning/debug/resolved/offline-visual-diff-firefox.md`), and three CI runs of about 18 min each. Close-out was done manually after a safe-resume.
- **Started:** 2026-10-11T00:37:04Z (after the 07-05 close-out commit `ad6df3d`)
- **Completed:** 2026-10-11T11:00:50Z (`e72c661`); close-out verification 2026-10-11T11:19Z
- **Tasks:** 3/3
- **Files modified:** 20 (14 text files, 6 PNGs)

## Accomplishments
- **DEPS-04 (16.4.0 part).** One atomic commit moved:
  - next 16.2.6 -> 16.4.0 and eslint-config-next 16.2.6 -> 16.4.0. They stay together; eslint-plugin-react-hooks moved 7.0.1 -> 7.1.1.
  - react and react-dom 19.2.6 -> 19.3.0; @types/react 19.2.14 -> 19.3.0; @types/react-dom 19.2.3 -> 19.3.0.
  - @react-three/fiber 9.6.1 -> 9.8.1 and @react-three/drei 10.7.7 -> 10.7.9.
- **Version floors.** `version-floors.json` floors now equal the installed versions, with new floors for `@types/react` and `@types/react-dom`. `guard:parity` passes.
- **No-WebGL resilience.** `components/SafeCanvas.tsx` wraps all 5 `<Canvas>` call sites. Without WebGL the routes keep their content instead of falling through to `app/error.tsx`. This affects real users with hardware acceleration disabled, not only CI's headless Firefox. The fix is locked in by:
  - an ESLint ban on importing the bare `Canvas` (with a selftest probe)
  - a jest unit test
  - `e2e/no-webgl.spec.ts`
- **/offline text.** The space after `</strong>` is now compiler-independent.
- **Legacy compiler list.** react-hooks 7.1.1 added 7 compiler-rule findings. All of them are in files already on `LEGACY_COMPILER_FILES`, so the list did not grow and lint stays at 0 errors.

## Task Commits

1. **Task 1: Package legitimacy check (blocking-human).** No commit. Tim answered "approved 16.4.0".
   - Lockfile integrities equal the approved hashes (a3c2b81 commit body).
   - Re-checked at close-out: `npm view next dist-tags` shows `latest` = 16.4.0, published 2026-10-06T18:35:31Z. No 16.4.x newer than 16.4.0 exists, so 5b does not fold.
2. **Task 2 (tracer): Atomic platform bump.** `a3c2b81` (chore). It also carries the HologramTerminal portal fix (see Deviations).
3. **Task 3: Zero-diff CI gate.** Passed on `e72c661` after two fix commits:
   - `8d37032` (fix): SafeCanvas
   - `e72c661` (fix): offline `{' '}` plus the six-PNG re-baseline exception

   `origin/ci/07-06` = `e72c661`, and CI run 38134022192 concluded success.

**Debug record:** `57d2649` (docs) resolved and archived the offline-visual-diff-firefox debug session.
**Plan metadata:** see the docs commits that follow.

## Files Created/Modified
- `package.json`, `package-lock.json`: platform versions (caret style kept)
- `scripts/guards/version-floors.json`: floors raised to the new versions
- `components/HologramTerminal.tsx`: drei `<Html>` portal target pinned to `gl.domElement.parentElement` (a3c2b81); uses SafeCanvas (8d37032)
- `components/SafeCanvas.tsx` (new): R3F Canvas inside `CanvasErrorBoundary`. Its fallback is the inert wrapper div with an empty `<canvas>`, the same DOM R3F < 9.8 left behind without WebGL.
- `components/{AnimatedGradientMesh,DualParticleSystem,MountainTerrain3D,PhotoCarousel3D}.tsx`: use SafeCanvas
- `components/__tests__/SafeCanvas.test.tsx` (new), `e2e/no-webgl.spec.ts` (new): regression tests
- `eslint.config.mjs`: `no-restricted-imports` bans `Canvas` from `@react-three/fiber`. `LEGACY_COMPILER_FILES` is unchanged.
- `scripts/guards/selftest.mjs`: probe "bare R3F Canvas import probe"
- `app/offline/page.tsx`: line 39 ends with `<strong>Good news!</strong>{' '}`
- `e2e/visual/routes.spec.ts-snapshots/offline/{375,768,1440}-reduced-visual-{dark,light}-linux.png`: re-baselined (see Deviations)

## Decisions Made
- **16.4.0, no fold.** The security patch is not published yet, so 07-07 performs the bump. The 16.4.0 floor blocks downgrades in the meantime.
- **SafeCanvas over pinning R3F < 9.8.**
  - Upstream deliberately changed R3F to report renderer errors through React, so the app has to contain them at the canvas.
  - The fix is not version-pinned, so 07-07's Next bump is unaffected.
  - Accepted trade-off (Tim): errors thrown by scene children (for example a texture load) now leave a blank canvas instead of showing the full-page error.
- **Option C for the offline diff.** This applies the 07-05 exception policy: an explicit `{' '}` hardening plus re-baselining the six shots that encode the compiler bug.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] HologramTerminal disappeared under R3F 9.8 (drei Html portal remount)**
- **Found during:** Task 2 (platform bump; local visual check)
- **Issue:** R3F 9.8 mounts and renders roots synchronously inside React DOM's commit (pmndrs/react-three-fiber PR #3925). That changes drei Html's default portal target mid-commit, and Html then remounts its private root on the same element. The stale root's deferred `clearContainer` wipes the live DOM, so the clix-cli "Experience CLI_X in 3D" panel vanished at every width.
  - Bisect: R3F 9.7.0 is fine, 9.8.0 and 9.8.1 are broken.
  - drei `Html.js` is unchanged between 10.7.7 and 10.7.9.
- **Fix:** A memoized portal ref to `gl.domElement.parentElement` keeps the target stable, so only one root exists.
- **Files modified:** `components/HologramTerminal.tsx`. This file is outside the plan's `files_modified`; it was committed inside the atomic platform commit to keep that commit zero-diff.
- **Verification:** The local visual spec was 6/6 at zero tolerance against the pre-bump baselines. The CI clix-cli shots pass in run 38134022192 (Visual 72/72).
- **Committed in:** `a3c2b81`

**2. [Rule 1 - Bug] R3F 9.8 rethrows WebGL-creation errors, replacing routes with app/error.tsx (SafeCanvas)**
- **Found during:** Task 3 (CI runs 38100593022 and 38103119437 on a3c2b81)
- **Issue:** 12 firefox E2E tests failed on `/` and `/contact`; `/photos` (3D view) and `/projects/[slug]` crashed too, but no test asserted their content.
  - Cause: R3F 9.8.0 changed Canvas to `configure().catch(setError)` with a throw during render. CI's headless Firefox has no WebGL, and no `<Canvas>` had an error boundary.
  - Up to 9.7 the same failure was an unhandled promise rejection, and the page stayed intact.
  - Bisect: R3F 9.8.1 alone reproduces it.
- **Fix:** `components/SafeCanvas.tsx` with an inert-canvas fallback, used at the 5 call sites, plus the ESLint ban, a selftest probe, a jest test and `e2e/no-webgl.spec.ts`. The first version rendered `null` as its fallback; it was replaced by the inert canvas so that `photos.spec.ts:54` (which expects an attached `<canvas>`) still holds.
- **Files modified:** `components/SafeCanvas.tsx`, `components/__tests__/SafeCanvas.test.tsx`, `e2e/no-webgl.spec.ts`, `components/{AnimatedGradientMesh,DualParticleSystem,HologramTerminal,MountainTerrain3D,PhotoCarousel3D}.tsx`, `eslint.config.mjs`, `scripts/guards/selftest.mjs`
- **Verification:**
  - Locally: 87/87 non-visual e2e on chromium, firefox and firefox-nowebgl; 330/330 with 5x repeat.
  - With the fix reverted, the no-webgl spec fails 24/24, and the jest mutant is killed.
  - CI run 38132996185 on 8d37032: E2E 58/58. Visual was 66/72, failing only on the offline cause below.
  - Tim accepted the fix, including the blank-canvas trade-off.
- **Committed in:** `8d37032`

### Human-approved exception (not an auto-fix)

**3. [Exception - Tim approved 2026-10-11, Option C] Six offline reduced-motion baselines re-baselined in the zero-diff plan**
- **Found during:** Task 3 (zero-diff gate)
- **Issue:** Visual Regression failed 6/72, exactly the shots `offline/{375,768,1440}-reduced-visual-{dark,light}`. The diff covers 1380-3713 px (ratio 0.01) and sits on one line: "Good news! This site uses service workers ...", which now has a space after `</strong>` and shifts about 3 px. The other 66 shots were byte-identical.
- **Root cause:** Next 16.2.6's bundled SWC dropped the leading space of multi-line JSX text that contains an HTML entity (`app/offline/page.tsx:39`, `you&apos;ve`). The old baselines therefore encode "Good news!This site". Next 16.4.0 fixed that SWC bug and emits the spec-correct text.
  - An SWC compile of all 41 `app/` + `components/` `.tsx` files with each version's bindings differs in exactly that one line.
- **Decision:** This deviates from the plan prohibition "MUST NOT re-baseline any PNG in this zero-diff platform commit". Tim approved it as a documented exception under the 07-05 zero-diff exception policy:
  - The new pixels are the correct rendering.
  - The code was hardened with an explicit `{' '}`, so both the 16.2.6 and the 16.4.0 SWC emit `[strong, " ", "This site ..."]`.
- **Fix:** One commit with `app/offline/page.tsx` and the 6 PNGs. The PNGs are sha1-identical to the CI actuals of runs 38103119437 and 38132996185. The commit body records the cause, the evidence and the approval.
- **Superseded criteria:**
  - The plan truth "zero re-baselined PNGs" and Task 3's literal `check-snapshot-commit --sha HEAD --none` are waived for e72c661 only. The strict replacement `--sha e72c661 --some --allow offline` passes.
  - `--none` still holds for both other plan commits (a3c2b81 and 8d37032).
  - The platform commit a3c2b81 itself changes no PNG, so the "MUST NOT split eslint-config-next from next" half of the prohibition is fully met.
- **Files modified:** `app/offline/page.tsx`, the 6 offline PNGs
- **Verification:** CI run 38134022192 on e72c661 is green on every job: Visual 72/72, E2E 58/58, Unit 69/69.
- **Committed in:** `e72c661`

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs: R3F 9.8 behaviour changes) and 1 human-approved exception (6 offline PNGs)
**Impact on plan:**
- Two R3F 9.8 behaviour changes needed app-side fixes. Without them the bump would have regressed production: the HologramTerminal panel would have vanished, and routes without WebGL would have shown the error page.
- The zero-PNG truth is knowingly waived for 6 shots, whose new pixels are the spec-correct rendering of unchanged text.
- There is no other scope creep.

## Issues Encountered
- **CI runs on the way to green:**
  - 38100593022 and 38103119437 on a3c2b81 failed on Visual (offline 6/72) and E2E (12 firefox).
  - 38132996185 on 8d37032 failed only on Visual (offline 6/72).
  - Both causes are diagnosed in `.planning/debug/resolved/offline-visual-diff-firefox.md`.
- **The plan's Task 2 acceptance says "`git show --stat HEAD`".** In practice the platform commit is `a3c2b81`, not HEAD, because two fix commits follow it. It was verified against `a3c2b81`.
- **Close-out runs on a safe-resume ("close out manually").** No task was re-run here. All acceptance criteria were re-verified read-only against the existing commits (see the verification table below).

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-12 / T-07-SC:** mitigated. Tim passed the blocking-human legitimacy check, and the lockfile integrities equal the approved hashes.
- **T-07-11 (upstream Next CVEs):** still open, by design. 16.4.0 is not the security release; 07-07 bumps it, and the 16.4.0 floor blocks downgrades meanwhile.
- **SafeCanvas:** it changes error *surfacing* for canvas subtrees. Errors are contained to the canvas, which does not widen the attack surface.

## User Setup Required
None. The 07-USER-SETUP.md item from 07-04 (required status checks on `main`) is still pending with Tim.

## Next Phase Readiness
- **Ready for 07-07 (step 5b).** It bumps next (and eslint-config-next) to the 2026-10-14 security release, raises the floors and completes DEPS-04.
  - SafeCanvas and the offline `{' '}` are not version-pinned, so they carry over.
  - Candidate for 07-07: a cross-version SWC compile diff of `app/` + `components/` before the visual gate, as a recurrence guard for compiler-driven diffs.
- **Pushing.** `e72c661` is on `origin/ci/07-06`. The docs commits are local only; pushing them is Tim's job.

## Verification (close-out, read-only, 2026-10-11T11:19Z)

| Check | Result |
|-------|--------|
| Lockfile `node_modules/next` / `react` / `react-dom` | 16.4.0 / 19.3.0 / 19.3.0 |
| Lockfile `@types/react` / `@types/react-dom` | 19.3.0 / 19.3.0 |
| Lockfile `@react-three/fiber` / `@react-three/drei` / `eslint-config-next` | 9.8.1 / 10.7.9 / 16.4.0 |
| `npm ls --depth=0` | exit 0; local node_modules match the lockfile |
| `npm run guard:parity` | `parity: OK`, exit 0 |
| `git show --stat a3c2b81` | package.json, package-lock.json, scripts/guards/version-floors.json (+ components/HologramTerminal.tsx) in one commit |
| `node scripts/ci/check-visual-run.mjs --sha e72c661b... --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/38134022192/job/114454066197`, exit 0 |
| `gh run view 38134022192` | success on e72c661 / ci/07-06. All jobs are success: E2E, Visual, Lint/Type, Unit, Security, Build. Dependency Review is skipped. |
| `git ls-remote origin refs/heads/ci/07-06` | e72c661befccb339a85fdae3144e192089d6fff6 |
| `check-snapshot-commit.mjs --sha a3c2b81 --none` | OK (0 changed), exit 0 |
| `check-snapshot-commit.mjs --sha 8d37032 --none` | OK (0 changed), exit 0 |
| `check-snapshot-commit.mjs --sha e72c661 --some --allow offline` | OK (6 changed), exit 0 |
| Negative control `--sha e72c661 --some --allow home` | 6 FAIL lines, exit 1 |
| `git diff --name-status ad6df3d e72c661 -- 'e2e/visual/*.png'` | exactly 6 `M`: `offline/{375,768,1440}-reduced-visual-{dark,light}-linux.png` |
| `git ls-files 'e2e/visual/*.png' \| wc -l` | 72 (count unchanged) |
| `npm view next dist-tags` | latest 16.4.0 (2026-10-06); no newer 16.4.x, so no fold |

Earlier local gates, from the debug session on the final tree:
- lint exit 0 (0 errors / 54 warnings)
- guard selftest 25/25
- tsc 0
- jest 69/69 in 8 suites
- test-count: jest 69 + e2e 65 = 134, at or above the baseline of 91
- same-classnames OK

## Self-Check: PASSED
- a3c2b81, 8d37032 and e72c661 are ancestors of HEAD. `git rev-list --count ad6df3d..e72c661` = 3.
- `components/SafeCanvas.tsx`, `components/__tests__/SafeCanvas.test.tsx`, `e2e/no-webgl.spec.ts` and `scripts/guards/version-floors.json` exist.
- Plan verification:
  - `npm ls --depth=0` exits 0.
  - CI Visual Regression and every other CI job are green on e72c661.
  - The "zero PNG changes" item is superseded by Tim's documented exception (6 offline PNGs, e72c661 only).

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-11*
