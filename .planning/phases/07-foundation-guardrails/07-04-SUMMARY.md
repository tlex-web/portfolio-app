---
phase: 07-foundation-guardrails
plan: 04
subsystem: testing
tags: [playwright, visual-regression, github-actions, ci, shell-05, cleanup, baselines, gh-cli]

requires:
  - phase: 07-01
    provides: "install-parity guard (container tag = lockfile @playwright/test), test-count ratchet"
  - phase: 07-02
    provides: "eslint flat config with LEGACY_COMPILER_FILES and the 3 temporary globalIgnores entries this plan removes"
  - phase: 07-03
    provides: "visual-dark / visual-light projects, 72 Linux baselines, visual-baselines.yml, check-visual-run.mjs, check-snapshot-commit.mjs, re-baseline protocol README"
provides:
  - "CI job `visual-regression` (display name `Visual Regression`) in mcr.microsoft.com/playwright:v1.60.0-noble: --project=visual-dark --project=visual-light --update-snapshots=none, uploads `visual-diff` on failure"
  - "SHELL-05 removal half: /gradient-mesh, /particle-buttons, /transitions and 7 zero-consumer components deleted; no page links to them"
  - "/photos without the 'View Shader Transitions' link; its six reduced baselines re-baselined in the same commit"
  - "eslint.config.mjs: temporary globalIgnores gone, LEGACY_COMPILER_FILES down to 8"
  - "e2e/visual/README.md: optional GitHub CLI re-baseline path (gh workflow run --ref, gh run download -D)"
affects: [07-05, 07-06, 07-07, 07-08, 07-14, 07-23, 07-26, phase-10, phase-12]

actuals:
  tokens: 25079
  tasks: 3
  commits: 3
plan_head_before: c5fb9c244f18adc09cd3067295fae2b75e814314
plan_head_after: 89af5a73f15c26951ad8eb0440aed271d29f23bd

tech-stack:
  added: []
  patterns:
    - "Every push to main, develop and ci/** runs the zero-tolerance visual compare; a missing or differing PNG fails CI"
    - "Re-baselines can be driven entirely from gh: workflow run with an explicit --ref, run download with -D (no wrapper folder)"

key-files:
  created: []
  modified:
    - .github/workflows/ci.yml
    - app/photos/page.tsx
    - eslint.config.mjs
    - README.md
    - e2e/visual/README.md
    - e2e/visual/routes.spec.ts-snapshots/photos/*-reduced-visual-{dark,light}-linux.png (6)
  deleted:
    - app/gradient-mesh/page.tsx
    - app/particle-buttons/page.tsx
    - app/transitions/page.tsx
    - components/ParticleButton.tsx
    - components/TransitionShowcase.tsx
    - components/ShaderTransition.tsx
    - components/Hero3DSection.tsx
    - components/ProgressiveImage.tsx
    - components/TerminalDemo.tsx
    - components/ZoomableImage.tsx

key-decisions:
  - "Re-baselines should go through gh: `gh workflow run visual-baselines.yml --ref ci/07-NN ...` and `gh run download <id> -n visual-baselines -D e2e/visual/routes.spec.ts-snapshots`; the browser dialog defaults to main and Windows Extract-all adds a wrapper folder"
  - "The visual-baselines artifact carries the WHOLE routes.spec.ts-snapshots folder, so a stray subfolder committed there comes back in the next artifact; review git status against the expected list every time"
  - "GUARD-02 is complete (baselines from 07-03 plus the live CI gate from 07-04); SHELL-05 stays open until 07-23 delivers the designed 404 inside the shell"
  - "Making Visual Regression, Lint and Type Check and Unit Tests required checks on main is a manual GitHub setting (07-USER-SETUP.md), pending Tim"

patterns-established:
  - "Intentional re-baseline verification: check-snapshot-commit.mjs --some --allow <slug> plus a negative control with a wrong slug, then check-visual-run.mjs PASS on the amended SHA"

requirements-completed: [GUARD-02, SHELL-05]  # copied from the plan; the shared-ID gate marks only GUARD-02 now, SHELL-05 completes with 07-23

coverage:
  - id: D1
    description: "CI 'Visual Regression' job compares visual-dark and visual-light against the committed PNGs with --update-snapshots=none in the lockfile-matched container, and is green on the amended HEAD"
    requirement: GUARD-02
    verification:
      - kind: other
        ref: "node scripts/ci/check-visual-run.mjs --sha 0c19fe295b3b04b3554f51f49eeae869b2d725bd --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/38095944534/job/114341737833"
        status: pass
      - kind: other
        ref: "Task 1 node check on ci.yml -> 'visual job OK'; node scripts/guards/check-install-parity.mjs -> exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "/gradient-mesh, /particle-buttons, /transitions and the 7 zero-consumer components are deleted and nothing links to them; AnimatedGradientMesh and InteractiveHotspot kept"
    requirement: SHELL-05
    verification:
      - kind: other
        ref: "grep -rEn '/(gradient-mesh|particle-buttons|transitions)([^a-z-]|$)' app components data lib | wc -l -> 0"
        status: pass
      - kind: other
        ref: "npm run build route list: /, /_not-found, /api/feedback, /contact, /offline, /photos, /projects, /projects/[slug], /roadmap"
        status: pass
      - kind: other
        ref: "npm run lint (0 errors) && npm run type-check && npx jest (66/66) && npm run guard:tests"
        status: pass
    human_judgment: false
  - id: D3
    description: "Exactly the six /photos reduced baselines changed in the deletion commit, nothing else under e2e/visual"
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha HEAD --allow photos --some -> OK (6 changed), exit 0 (run at 0c19fe2)"
        status: pass
      - kind: other
        ref: "negative control --allow home -> 6 FAIL lines, exit 1; git ls-files 'e2e/visual/*.png' -> 72, 0 outside routes.spec.ts-snapshots/<slug>/*-linux.png"
        status: pass
    human_judgment: false
  - id: D4
    description: "The re-baselined /photos PNGs differ only by the removed 'View Shader Transitions' pill and the content below moving up"
    verification: []
    human_judgment: true
    rationale: "Tim reviewed the six PNGs before amending; the orchestrator spot-checked the 768 dark shot (pill gone, content about 68px higher, nothing else). No automated check judges what changed inside a PNG"
  - id: D5
    description: "The 404 half of SHELL-05: deleted URLs resolve to the designed 404 inside the shell"
    requirement: SHELL-05
    verification: []
    human_judgment: true
    rationale: "Out of scope for 07-04 by plan design; the deleted URLs fall through to the v1 app/not-found.tsx until plan 07-23"

duration: 2h 38m
completed: 2026-10-11
status: complete
---

# Phase 7 Plan 04: CI visual gate and playground deletion (GUARD-02, SHELL-05) Summary

**CI now runs a zero-tolerance `Visual Regression` job in the `playwright:v1.60.0-noble` container on every push to main, develop and `ci/**`. The three playground routes and seven zero-consumer components are gone. `/photos` lost its "View Shader Transitions" link, and only its six reduced baselines were re-baselined, in the same commit. The CI job is green on that commit.**

## Performance

- **Duration:** 2h 38m wall-clock, mostly the human checkpoint and its three baseline attempts (executor work was short)
- **Started:** 2026-10-10T21:12:00Z
- **Completed:** 2026-10-10T23:50:10Z
- **Tasks:** 3/3
- **Files modified:** 21 (10 deleted, 5 text files edited, 6 PNGs), plus 07-USER-SETUP.md

## Accomplishments
- GUARD-02 is closed: 07-03's baselines plus a CI compare job that fails on any missing or differing pixel (`--update-snapshots=none`, retries 0, `visual-diff` artifact on failure).
- SHELL-05 removal half: `/gradient-mesh`, `/particle-buttons`, `/transitions`, ParticleButton, TransitionShowcase, ShaderTransition, Hero3DSection, ProgressiveImage, TerminalDemo and ZoomableImage are deleted, with no redirects. AnimatedGradientMesh (Contact) and InteractiveHotspot (ImageDetailModal) are kept.
- `eslint.config.mjs` carry-forward from 07-02 is done: the 3 temporary `globalIgnores` entries are gone and `LEGACY_COMPILER_FILES` has 8 entries.
- The re-baseline protocol in `e2e/visual/README.md` has an optional GitHub CLI path. It removes both failure modes hit in this plan.

## Task Commits

1. **Task 1 (tracer): CI Visual Regression compare job** - `0a3c1f8` (ci)
2. **Task 2: Delete the playground routes, zero-consumer components and the /transitions link** - `0c19fe2` (feat; Tim amended the original 89c1607 to add the PNGs)
3. **Task 3: Re-baseline the six /photos snapshots (Tim)** - folded into `0c19fe2` by `git commit --amend`, as the plan specifies
4. **README: GitHub CLI re-baseline path** - `89af5a7` (docs)

**Plan metadata:** see the final docs commits

## Files Created/Modified
- `.github/workflows/ci.yml` - new `visual-regression` job (`name: Visual Regression`, `contents: read`, container `mcr.microsoft.com/playwright:v1.60.0-noble`, `--ipc=host`)
- `app/photos/page.tsx` - removed the shader-transitions Link block and the unused `Link` import
- `eslint.config.mjs` - removed 3 temporary `globalIgnores` entries; dropped ShaderTransition/TerminalDemo from `LEGACY_COMPILER_FILES`
- `README.md` - removed the deleted routes and components
- `e2e/visual/README.md` - "With the GitHub CLI" subsection under Intentional re-baseline
- `e2e/visual/routes.spec.ts-snapshots/photos/{375,768,1440}-reduced-visual-{dark,light}-linux.png` - re-baselined
- 10 files deleted (see frontmatter `key-files.deleted`)
- `.planning/phases/07-foundation-guardrails/07-USER-SETUP.md` - branch-protection item appended

## Decisions Made
- Future re-baselines should use `gh` (`--ref ci/07-NN`, `gh run download -D`). The browser path defaulted to `main` twice in this plan.
- GUARD-02 is marked complete. SHELL-05 stays Pending until 07-23 ships the shell 404 (the shared-ID gate holds it).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CI comment tripped the plan's own verify regex**
- **Found during:** Task 1
- **Issue:** A comment in the new job quoted the forbidden flag value literally (`--update-snapshots=` followed by `missing`), which matched the verify regex `update-snapshots=(missing|all|changed)`.
- **Fix:** Reworded the comment so it no longer contains the literal flag.
- **Files modified:** .github/workflows/ci.yml
- **Verification:** "visual job OK"
- **Committed in:** `0a3c1f8`

**2. [Rule 3 - Blocking] Stale `.next/dev/types/validator.ts` broke local build/tsc**
- **Found during:** Task 2
- **Issue:** A gitignored type file left by an earlier `next dev` run still imported the deleted pages, so local `next build` and `tsc` failed.
- **Fix:** Deleted only `.next/dev/types`. CI is unaffected, since it starts from a clean checkout.
- **Files modified:** none tracked
- **Verification:** type-check 0 errors, build route list clean
- **Committed in:** n/a

**3. [Rule 2 - Missing critical] README re-baseline protocol gained the gh path**
- **Found during:** Task 3 (from what went wrong in attempts 1-2)
- **Issue:** The browser-only protocol allowed dispatching on the wrong branch and keeping a wrapper folder.
- **Fix:** Optional "With the GitHub CLI" subsection with the three commands, the overwrite fallback and the whole-folder artifact warning.
- **Files modified:** e2e/visual/README.md
- **Committed in:** `89af5a7`

---

**Total deviations:** 3 (1 bug, 1 blocking, 1 missing-critical)
**Impact on plan:** No scope creep. No app behaviour changed beyond the planned deletion.

## Issues Encountered
Task 3 needed three attempts:
- **Attempt 1:** the baseline workflow ran on `main` (2c4e106), because the GitHub "Run workflow" dialog defaults to main. The artifact held unchanged main renders, and they were committed under a wrapper folder `e2e/visual/playwright-report/`. CI Visual Regression failed, as expected with stale `/photos` baselines.
- **Attempt 2:** dispatched on `main` again. The zip was extracted with its wrapper into `routes.spec.ts-snapshots/visual-baselines/`.
- **Attempt 3:** the orchestrator used Tim's authenticated `gh`:
  - `gh workflow run visual-baselines.yml --ref ci/07-04 -f suite=visual -f update_mode=changed` (run 38095389642, success), then `gh run download` into a scratch folder.
  - A blob comparison against HEAD found 6 changed (`/photos`), 66 identical and 0 new.
  - Only the 6 were copied into place, and removal of the 72 stray duplicates was staged.
  - Tim reviewed, amended (0c19fe2) and pushed.
- **Spot-check:** the 768 dark shot shows the pill gone and everything below about 68px higher, with no other change.
- **Lesson** (now in the README): `gh` removes both failure modes. Also, the baseline workflow uploads the whole snapshot folder, so any stray subfolder committed there comes back in the artifact.

0c19fe2 is on `origin/ci/07-04`. `origin/main` is still 2c4e106, and 89af5a7 plus the docs commits are local only. Pushing is Tim's job.

## Known Stubs
None.

## User Setup Required

**GitHub repository settings need one manual change.** See [07-USER-SETUP.md](./07-USER-SETUP.md): add `Visual Regression`, `Lint and Type Check` and `Unit Tests` as required status checks on `main`. Tim has been told; it is not confirmed done.

## Next Phase Readiness
- Every later Phase 7 plan is now gated by CI Visual Regression. Zero-diff plans follow the README gate (`check-visual-run.mjs --wait 30` + `check-snapshot-commit.mjs --none`).
- 07-23 must deliver the designed 404 inside the shell for the three deleted URLs to close SHELL-05.
- Until the required-checks setting is on, a red visual job does not block merges into main.

## Task 3 verification (re-run by this continuation)

| Check | Result |
|-------|--------|
| `git merge-base --is-ancestor` 0a3c1f8 / 0c19fe2 HEAD | both FOUND |
| `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --allow photos --some` (HEAD = 0c19fe2) | `snapshot-commit: OK (6 changed)`, exit 0 |
| Negative control: `--allow home --some` | 6 FAIL lines (photos outside allowed dirs), exit 1 |
| `node scripts/ci/check-visual-run.mjs --sha 0c19fe295b3b04b3554f51f49eeae869b2d725bd --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/38095944534/job/114341737833`, exit 0 |
| `git diff --name-status 0a3c1f8 HEAD -- 'e2e/visual/*.png'` | exactly the 6 `photos/*-reduced-*` files, all `M` |
| `git ls-files 'e2e/visual/*.png'` | 72; 0 outside `routes.spec.ts-snapshots/<slug>/*-linux.png` |
| Snapshot folders | clix-cli, clix-website, contact, home, not-found, offline, photos, projects, roadmap (no stray folders) |
| 0c19fe2 author / body | tlex-web; body carries the `Re-baseline: /photos loses the "View Shader Transitions" link ...` reason |
| 10 deleted files absent; AnimatedGradientMesh + InteractiveHotspot present | yes |
| `grep -c "Shader Transitions" app/photos/page.tsx` | 0 |
| Route-reference grep in app/components/data/lib | 0 |

First executor's Task 1-2 verification (all passed): parity guard OK (container tag = lockfile 1.60.0); "visual job OK"; YAML parses with job `visual-regression`; selftest 24/24; lint 0 errors / 47 warnings; type-check 0; Jest 66/66; guard:tests OK; build route list `/`, `/_not-found`, `/api/feedback`, `/contact`, `/offline`, `/photos`, `/projects`, `/projects/[slug]`, `/roadmap`; LEGACY_COMPILER_FILES 8 entries.

## Self-Check: PASSED
- Commits 0a3c1f8, 0c19fe2 and 89af5a7 are ancestors of HEAD; `git rev-list --count c5fb9c2..HEAD` = 3
- e2e/visual/README.md, .github/workflows/ci.yml and the 6 /photos PNGs exist; the 10 deleted files do not
- Plan verification: CI Visual Regression PASS on the amended HEAD; build route list has no playground routes

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-11*
