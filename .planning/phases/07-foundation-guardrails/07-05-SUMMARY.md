---
phase: 07-foundation-guardrails
plan: 05
subsystem: dependencies
tags: [motion, framer-motion, motion-react, eslint, no-restricted-imports, version-floors, visual-regression, deps-03]

requires:
  - phase: 07-01
    provides: "scripts/guards/version-floors.json (floors + forbiddenDirect), check-install-parity"
  - phase: 07-02
    provides: "eslint flat config; same-classnames.mjs parity guard for zero-diff plans"
  - phase: 07-03
    provides: "72 Linux baselines incl. Home scroll-0/50/100 captures taken with motion enabled; check-visual-run.mjs, check-snapshot-commit.mjs"
  - phase: 07-04
    provides: "CI Visual Regression job on ci/** pushes; 4 importers deleted, leaving 20"
provides:
  - "motion 14.1.0 (exact pin) as the only animation package; framer-motion is no longer a direct dependency"
  - "All 20 animation importers in app/, components/ and lib/ read from motion/react"
  - "Single motion-dom (14.1.0) in the tree"
  - "eslint.config.mjs no-restricted-imports block banning framer-motion, built to be extended (07-13 adds the Phosphor rule)"
  - "version-floors.json: motion floor 14.1.0, framer-motion in forbiddenDirect"
  - "Six home scroll-50 baselines re-baselined under a documented, Tim-approved exception (upstream useScroll/ViewTimeline fix)"
affects: [07-06, 07-07, 07-13, 07-26, phase-09, phase-10]

actuals:
  tokens: 3587
  tasks: 3
  commits: 1
plan_head_before: 3b62313ef1208b870a68e6a7782e692474a5c1fc
plan_head_after: 73880a2ed3d9272789b90e11f3ebf1903a237ec1

tech-stack:
  added: ["motion@14.1.0 (brings framer-motion, motion-dom, motion-utils 14.1.0 transitively)"]
  patterns:
    - "Animation imports come from motion/react only; ESLint no-restricted-imports enforces it"
    - "A replaced package is banned in the same commit that removes it (lint rule + forbiddenDirect floor)"

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - scripts/guards/version-floors.json
    - eslint.config.mjs
    - app/page.tsx, app/contact/page.tsx, app/roadmap/page.tsx
    - components/{FeatureShowcase,Footer,GeologicalButton,GlassmorphismNav,Header,Hero3DMountain,HologramTerminalDemo,ImageDetailModal,InteractiveHotspot,MountainTerrain3D,ProjectCard,ProjectHighlights,RoadmapFilters,RoadmapProgress,RoadmapTimeline,TechStackDisplay}.tsx
    - lib/useGlowIntensity.ts
    - e2e/visual/routes.spec.ts-snapshots/home/{375,768,1440}-scroll-50-visual-{dark,light}-linux.png (6)

key-decisions:
  - "Zero-diff exception policy: a diff that is a verified upstream bug fix, matching the code's intent, may be re-baselined with Tim's explicit approval and a documented reason"
  - "07-05 used that policy for the six home scroll-50 shots: at 50% scroll the hero indicator must be fully transparent (scrollYProgress 0.5 against useTransform [0, 0.2] -> [1, 0]); motion 14 renders it correctly, the motion 12.39 baselines had a stale faint indicator"
  - "Strict form of the exception gate: check-snapshot-commit.mjs --some --allow home (per-slug), never --allow-all"

patterns-established:
  - "Exception re-baseline verification: download visual-diff, locate the differing region, confirm the new pixels match the code's intent, regenerate via gh on ci/07-NN, blob-compare and copy only the changed PNGs, amend with the reason in the commit body"

requirements-completed: [DEPS-03]

coverage:
  - id: D1
    description: "motion 14.1.0 is pinned exactly and framer-motion is gone as a direct dependency; lockfile integrity equals the hash Tim approved"
    requirement: DEPS-03
    verification:
      - kind: other
        ref: "node -e package.json check -> motion 14.1.0, no framer-motion in dependencies or devDependencies"
        status: pass
      - kind: other
        ref: "package-lock.json node_modules/motion integrity sha512-lsCsW9uJ+iMJj8MSiLccpUC+ZUpoSspaX6Pm78KrnZKMioCPAPG6WeG1d1d/Ywg+z1mny+STP6VyEYW+3nAqNw== (equals the approved hash)"
        status: pass
    human_judgment: false
  - id: D2
    description: "All 20 importers use motion/react, none use framer-motion, and ESLint rejects an import of framer-motion"
    requirement: DEPS-03
    verification:
      - kind: other
        ref: "grep -rln framer-motion app components lib --include=*.ts --include=*.tsx | wc -l -> 0; motion/react importers -> 20"
        status: pass
      - kind: other
        ref: "ESLint stdin probe on a framer-motion import -> error 'Import from motion/react (DEPS-03).'"
        status: pass
      - kind: other
        ref: "npm run lint (0 errors / 47 warnings) && npm run type-check && npx jest (66/66, 7 suites) && node scripts/guards/same-classnames.mjs HEAD (OK, 19 files)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Exactly one motion-dom version in the tree"
    requirement: DEPS-03
    verification:
      - kind: other
        ref: "npm ls motion-dom --all --json walk -> single motion-dom 14.1.0"
        status: pass
    human_judgment: false
  - id: D4
    description: "version-floors.json raises motion to 14.1.0 and forbids framer-motion as a direct dependency"
    requirement: DEPS-03
    verification:
      - kind: other
        ref: "node -e version-floors check -> motion \"14.1.0\", forbiddenDirect [\"framer-motion\"]; check-install-parity OK"
        status: pass
    human_judgment: false
  - id: D5
    description: "CI Visual Regression is green on the motion commit; only the six home scroll-50 PNGs changed"
    requirement: DEPS-03
    verification:
      - kind: other
        ref: "node scripts/ci/check-visual-run.mjs --sha 73880a2ed3d9272789b90e11f3ebf1903a237ec1 --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/38098396864/job/114349021519"
        status: pass
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some --allow home -> OK (6 changed); negative control --allow photos -> 6 FAIL, exit 1"
        status: pass
    human_judgment: false
  - id: D6
    description: "The six re-baselined shots differ only because motion 14 renders the hero 'Scroll to explore' indicator at its correct opacity 0 at 50% scroll"
    requirement: DEPS-03
    verification: []
    human_judgment: true
    rationale: "No automated check judges what changed inside a PNG or whether it matches intent. The orchestrator measured the indicator region from the visual-diff artifact (old peak brightness 93, new 4 = background) and Tim reviewed and approved the exception before amending"

duration: 43min
completed: 2026-10-11
status: complete
---

# Phase 7 Plan 05: framer-motion -> motion 14.1.0 (DEPS-03) Summary

**motion 14.1.0 now replaces framer-motion, in a single commit (`73880a2`). The 20 importers use `motion/react`, the tree has one motion-dom (14.1.0), ESLint bans the old import, and the version floors are raised. CI Visual Regression is green. The commit re-baselines six PNGs, all of them `home` scroll-50 shots. Tim approved this as an exception: motion 14 fixed an upstream `useScroll` bug, and the old baselines had captured it.**

## Performance

- **Duration:** about 43 min wall-clock, mostly the task 3 diff investigation and re-baseline
- **Started:** 2026-10-10T23:52:12Z (after the 07-04 close-out commit)
- **Completed:** 2026-10-11T00:35:00Z
- **Tasks:** 3/3
- **Files modified:** 30 (24 text files, 6 PNGs)

## Accomplishments
- DEPS-03: `npm uninstall framer-motion` followed by `npm install --save-exact motion@14.1.0`. framer-motion, motion-dom and motion-utils moved from 12.39.0 to 14.1.0, and all three are now transitive only.
- Each of the 20 importers had only its module specifier changed to `motion/react`. No symbols, props or hooks changed (same-classnames OK).
- `eslint.config.mjs` has a new `no-restricted-imports` block that applies to all files and is built to be extended. It rejects `framer-motion` with the message "Import from motion/react (DEPS-03).".
- In `scripts/guards/version-floors.json`, the `motion` floor is 14.1.0 and `framer-motion` is in `forbiddenDirect`.
- The Home mid-scroll baselines did their job: they caught the one place where motion's behaviour changed.

## Task Commits

1. **Task 1: Package legitimacy check for motion@14.1.0** - no commit (blocking-human checkpoint; Tim answered "approved")
2. **Task 2 (tracer): Swap to motion/react, ban the old import, raise floors** - `73880a2` (chore). The original commit was `4645ddb`; Tim amended it to add the six re-baselined PNGs and an extended message.
3. **Task 3: Zero-diff gate: CI Visual Regression green on the motion commit** - gate passed on `73880a2` after the documented re-baseline; no separate commit

**Plan metadata:** see the docs commits that follow

## Task 1 evidence (package legitimacy)

Confirmed after install against the approved values:

| Package | Version | Lockfile integrity |
|---------|---------|--------------------|
| motion | 14.1.0 | `sha512-lsCsW9uJ+iMJj8MSiLccpUC+ZUpoSspaX6Pm78KrnZKMioCPAPG6WeG1d1d/Ywg+z1mny+STP6VyEYW+3nAqNw==` (equals the approved hash) |
| framer-motion | 12.39.0 -> 14.1.0 | `sha512-QsdZSdWoyQfUmgi+GZfow8Du5COG6VRYEo9FlgKUPgH87/Le/fYekHCAKwLdYKHdCZcZfWHg4iOxlD6RoqXciQ==` |
| motion-dom | 12.39.0 -> 14.1.0 | `sha512-FyFLkNUAAETzCvf851mZcl+v+kaZrKq+UM+XmkY4G8n+ny/WYfiWh9j0fhSQ1KOKVQrM9/cLO11THO2k71HJlg==` |
| motion-utils | 12.39.0 -> 14.1.0 | `sha512-xd4FeWOnnXsJHmAaRCLNbOS7mEaNOangjMt3Pl241H07f1kxW48fADQ/8O5hLLNhf1qdlozgY3PPAHBdOoU7AA==` |

- `npm ls motion-dom --all` shows a single copy.
- The optional peer `@emotion/is-prop-valid` was dropped from the lockfile.
- No framer-motion imports remain in app/, components/ or lib/. The two remaining mentions are expected: the guard selftest fixtures, and the dependabot hold, which 07-26 removes.

## Files Created/Modified
- `package.json`, `package-lock.json`: `motion` 14.1.0 replaces `framer-motion`
- `scripts/guards/version-floors.json`: floor `motion: 14.1.0`; `forbiddenDirect: ["framer-motion"]`
- `eslint.config.mjs`: `no-restricted-imports` block (11 lines)
- 20 importers (3 in app/, 16 in components/, 1 in lib/): one-line module-specifier change each
- `e2e/visual/routes.spec.ts-snapshots/home/{375,768,1440}-scroll-50-visual-{dark,light}-linux.png`: re-baselined (see Deviations)

## Decisions Made
- **Zero-diff exception policy** (new, recorded in STATE.md): a diff that is a verified upstream bug fix, matching the code's intent, may be re-baselined with Tim's explicit approval and a documented reason.
- The exception is verified with the strict per-slug form `check-snapshot-commit.mjs --some --allow home`, never `--allow-all`.

## Deviations from Plan

### Human-approved exception (not an auto-fix)

**1. [Exception - Tim approved] Six home scroll-50 baselines re-baselined in the zero-diff commit**
- **Found during:** Task 3 (zero-diff gate)
- **Issue:** The first push of `4645ddb` to `ci/07-05` failed CI Visual Regression. Exactly 6 shots failed: `home scroll 50%` at 375, 768 and 1440 in dark and light, each with about 264-265 differing pixels (ratio 0.01). The other 66 passed.
  - The orchestrator downloaded the `visual-diff` artifact with gh. The diff is confined to the hero "Scroll to explore" indicator in `components/Hero3DMountain.tsx`, which uses `opacity: useTransform(scrollYProgress, [0, 0.2], [1, 0])`.
  - Peak brightness over the indicator region was 93 in the old baseline (faintly visible) and 4 with motion 14, which equals the background (fully transparent).
- **Root cause:** The spec scrolls to `innerHeight * 0.5`. The hero is `h-screen` with `useScroll({ target, offset: ['start start', 'end start'] })`, so `scrollYProgress` is 0.5 and the opacity must clamp to 0.
  - motion 14 renders the intended value.
  - The motion 12.39 baseline captured a stale value from the ViewTimeline-accelerated path. motion 13.4.7 fixed that path ("Ensure offsets work the same across the JS main thread and ViewTimeline").
- **Decision:** Tim was offered three options: re-baseline, investigate first, or reproduce the old look in code. He chose to re-baseline the 6 shots as a documented exception to the plan's locked zero-diff rule and its `MUST NOT re-baseline` prohibition.
- **Fix:**
  - The orchestrator ran `gh workflow run visual-baselines.yml --ref ci/07-05` (run 38097440026, success) and downloaded the artifact to a scratch folder.
  - A blob comparison found exactly those 6 changed, 66 identical and 0 new. Only the 6 were copied into place.
  - Tim reviewed them, amended `4645ddb` into `73880a2` with an extended commit message recording the reason, and force-pushed to `ci/07-05`.
- **Superseded criterion:** Task 3's acceptance literally requires `check-snapshot-commit.mjs --sha HEAD --none`, meaning zero PNGs. Tim's exception supersedes that criterion. Re-run here, `--none` fails with exit 1 on the 6 home PNGs, as expected. The strict replacement `--some --allow home` passes.
- **Files modified:** the 6 PNGs listed above
- **Verification:** see "Task 3 verification" below
- **Committed in:** `73880a2`

---

**Total deviations:** 1 human-approved exception (0 auto-fixes)
**Impact on plan:** No code change beyond the planned swap. The plan's "zero re-baselined PNGs" truth and its prohibition are knowingly waived for 6 shots, where the new pixels are the correct rendering of unchanged code.

## Issues Encountered
- The first executor's `sed -i` import rewrite wrote LF line endings to the working tree. Git normalises them through autocrlf, so the committed content is unaffected.
- `npm run build` stamped `public/service-worker.js`, as it always does. The file was reverted before committing.

## Known Stubs
None.

## Threat Flags
None. T-07-10 / T-07-SC are mitigated: Tim passed the blocking-human legitimacy check, the version is pinned exactly, the integrity hash is recorded in the lockfile and equals the approved hash, and the package has no postinstall script.

## User Setup Required
None. The 07-USER-SETUP.md item from 07-04 (required status checks on `main`) is still pending with Tim.

## Next Phase Readiness
- Ready for 07-06, the next isolated upgrade (Next 16.4 + React 19.3 + R3F 9.8.1 + drei 10.7.9). It follows the same zero-diff gate. The exception policy is available, but only with Tim's explicit approval.
- 07-13 extends the `no-restricted-imports` block with the Phosphor path rule.
- 07-26 removes the dependabot framer-motion hold.
- `73880a2` is on `origin/ci/07-05`. The docs commits are local only, and pushing is Tim's job.

## Task 3 verification (re-run by this continuation)

| Check | Result |
|-------|--------|
| `git merge-base --is-ancestor 73880a2 HEAD` | FOUND (HEAD = 73880a2ed3d9272789b90e11f3ebf1903a237ec1 before the docs commits) |
| `node scripts/ci/check-visual-run.mjs --sha 73880a2ed3d9272789b90e11f3ebf1903a237ec1 --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/38098396864/job/114349021519`, exit 0 |
| `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some --allow home` | `snapshot-commit: OK (6 changed)`, exit 0 |
| Negative control: `--some --allow photos` | 6 FAIL lines (home outside allowed dirs), exit 1 |
| Plan literal: `--none` | 6 FAIL lines, exit 1 (expected; superseded by the exception) |
| `git diff --name-status 3b62313 HEAD -- 'e2e/visual/*.png'` | exactly 6 `M`: `home/{375,768,1440}-scroll-50-visual-{dark,light}-linux.png` |
| `git ls-files 'e2e/visual/*.png' \| wc -l` | 72 (unchanged count) |
| Deletions in 73880a2 | none |
| Task 2 static re-check | motion 14.1.0, no framer-motion key; floors `"14.1.0"` / `["framer-motion"]`; `no-restricted-imports` present; 0 framer-motion imports, 20 motion/react importers; single motion-dom 14.1.0 |

First executor's task 2 verification (all passed): lint 0 errors / 47 warnings; selftest 24/24; type-check 0; Jest 66/66 in 7 suites; same-classnames OK (19 files); check-install-parity OK; build exit 0 (service-worker reverted); ESLint stdin probe rejects a framer-motion import with "Import from motion/react (DEPS-03)".

## Self-Check: PASSED
- `73880a2` is an ancestor of HEAD; `git rev-list --count 3b62313..73880a2` = 1
- package.json, package-lock.json, scripts/guards/version-floors.json, eslint.config.mjs and the 6 home PNGs exist
- Plan verification: single motion-dom, 0 imports of the old package, the ESLint ban is in place, and CI Visual Regression PASSES on 73880a2. The "zero PNG changes" item is superseded by Tim's documented exception (6 home scroll-50 PNGs).

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-11*
