---
phase: 07-foundation-guardrails
plan: 07
subsystem: dependencies
tags: [next, react, react-dom, sharp, eslint-config-next, security, version-floors, visual-regression, deps-04]

requires:
  - phase: 07-01
    provides: "scripts/guards/version-floors.json (floors + forbiddenDirect), check-install-parity"
  - phase: 07-03
    provides: "check-visual-run.mjs, check-snapshot-commit.mjs, 72 Linux baselines"
  - phase: 07-04
    provides: "CI Visual Regression job on ci/** pushes"
  - phase: 07-06
    provides: "next 16.4.0 / react 19.3.0 platform set, SafeCanvas, 16.4.0 floors"
provides:
  - "next 16.4.2 + eslint-config-next 16.4.2 (lockstep), react / react-dom 19.3.1, sharp 0.35.5 (devDependency) in one zero-diff commit (fdeb9fe)"
  - "version-floors.json: next / eslint-config-next 16.4.2, react / react-dom 19.3.1, NEW sharp floor 0.35.5; the parity guard fails on any downgrade"
  - "DEPS-04 complete: the platform runs on the October 2026 Next.js security release"
affects: [07-08, 07-26, phase-08, phase-12]

actuals:
  tokens: 14757   # chars/4 over the text diff b1056bc..fdeb9fe; 445 without package-lock.json
  tasks: 3
  commits: 1
plan_head_before: b1056bc3b7f395c8e2dad992cd98df007bea481b
plan_head_after: fdeb9fece69053ced9d98e542415c13fcb686eba

tech-stack:
  added:
    - "next 16.4.2 (from 16.4.0), eslint-config-next 16.4.2 (from 16.4.0)"
    - "react / react-dom 19.3.1 (from 19.3.0)"
    - "sharp 0.35.5 devDependency (from ^0.34.5); next's nested sharp dedupes to the root copy"
  patterns:
    - "A security advisory that names a transitive package (sharp) gets its own floor in version-floors.json, even when the app depends on it only as a devDependency"

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - scripts/guards/version-floors.json

key-decisions:
  - "Installed next 16.4.2, react/react-dom 19.3.1 and sharp 0.35.5, beyond the advisory's next@16.4.1, on Tim's explicit approval: \"approve all, including later versions not specifically named\""
  - "New sharp floor 0.35.5 (advisory minimum for CVE-2026-96889 / GHSA-2464-fhr4-w9xw); sharp stays a devDependency"
  - "DEPS-04 complete with 07-07; main (Vercel production) still lacks the patch until Tim merges the phase branch"

patterns-established:
  - "Security-patch bump: approved versions -> install -> raise floors -> zero-diff commit -> push to ci/07-NN -> check-visual-run PASS + check-snapshot-commit --none"

requirements-completed: [DEPS-04]

coverage:
  - id: D1
    description: "Patched versions installed in one commit: next and eslint-config-next 16.4.2, react/react-dom 19.3.1, sharp 0.35.5; @types/react* unchanged at 19.3.0"
    requirement: DEPS-04
    verification:
      - kind: other
        ref: "node -p lockfile packages['node_modules/<pkg>'].version -> next 16.4.2, eslint-config-next 16.4.2, react 19.3.1, react-dom 19.3.1, sharp 0.35.5, @types/react 19.3.0, @types/react-dom 19.3.0"
        status: pass
      - kind: other
        ref: "git show --stat fdeb9fe -> package.json, package-lock.json, scripts/guards/version-floors.json only"
        status: pass
    human_judgment: false
  - id: D2
    description: "version-floors.json floors equal the patched versions, and the parity guard rejects a downgrade"
    requirement: DEPS-04
    verification:
      - kind: other
        ref: "plan lockfile/floor one-liner -> 'next patched 16.4.2', exit 0; npm run guard:parity -> 'parity: OK'"
        status: pass
      - kind: other
        ref: "negative control (Task 2): HEAD~ lockfile against the new floors -> 5 FAIL lines, exit 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Local gates green on the patched tree (build, npm ls, lint, type-check, jest, guard selftest, same-classnames)"
    requirement: DEPS-04
    verification:
      - kind: unit
        ref: "npx jest --silent -> 8 suites, 69/69"
        status: pass
      - kind: other
        ref: "npm run build exit 0 (Next 16.4.2); npm ls --depth=0 exit 0; npm run lint 0 errors / 54 warnings; npm run type-check exit 0; guard selftest 25/25; same-classnames OK"
        status: pass
    human_judgment: false
  - id: D4
    description: "Zero-diff gate: CI Visual Regression green on the patch commit, and the commit touches no e2e/visual file"
    requirement: DEPS-04
    verification:
      - kind: automated_ui
        ref: "node scripts/ci/check-visual-run.mjs --sha fdeb9fece69053ced9d98e542415c13fcb686eba --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/39775685353/job/119813903432, exit 0"
        status: pass
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha fdeb9fe --none -> OK (0 changed), exit 0"
        status: pass
      - kind: e2e
        ref: "gh run view 39775685353 -> conclusion success on fdeb9fe / ci/07-07; E2E, Visual, Lint/Type, Unit, Security, Build all success; Dependency Review skipped (push run)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The installed versions are the ones the published advisory and Tim approved (no guessed version or package list)"
    requirement: DEPS-04
    verification: []
    human_judgment: true
    rationale: "Advisory legitimacy and version approval are human judgments by design (Task 1, gate=blocking-human). Tim reviewed https://nextjs.org/blog/nextjs-security-update-october-14-2026 and replied \"approve all, including later versions not specifically named\""

duration: 26 min active (Task 2 start 11:59:34Z to close-out 12:25:50Z); plan opened 2026-10-11, halted at the precondition until the patch shipped
completed: 2026-10-22
status: complete
---

# Phase 7 Plan 07: Next.js 16.4.2 security release (+ React 19.3.1, sharp 0.35.5), DEPS-04 complete

**One zero-diff commit (`fdeb9fe`) moves next and eslint-config-next 16.4.0 -> 16.4.2, react and react-dom 19.3.0 -> 19.3.1, and the sharp devDependency ^0.34.5 -> ^0.35.5. It raises the matching floors and adds a new sharp floor of 0.35.5. The October 2026 Next.js advisory's two Critical issues and one High issue are patched. CI run 39775685353 on the commit is green on every job, Visual Regression 72/72 included, and no snapshot changed. DEPS-04 is complete.**

## Performance

- **Duration:** 26 min of active work today. Task 2 started at 2026-10-22T11:59:34Z, and close-out verification finished at 12:25:50Z. The plan first opened on 2026-10-11 and stayed halted at its blocking-human precondition until the patch was published.
- **Started:** 2026-10-22T11:59:34Z (Task 2)
- **Completed:** 2026-10-22T12:25:50Z
- **Tasks:** 3/3
- **Files modified:** 3

## Accomplishments
- **Security patch (DEPS-04 step 5b).** The advisory (https://nextjs.org/blog/nextjs-security-update-october-14-2026) covers:
  - GHSA-673q-mjm6-r5xr (Critical)
  - CVE-2026-96889 / GHSA-2464-fhr4-w9xw (Critical, sharp < 0.35.5)
  - GHSA-p3m5-59mp-jv5r (High)
- **Versions.**
  - next and eslint-config-next 16.4.0 -> 16.4.2, kept in lockstep.
  - react and react-dom 19.3.0 -> 19.3.1.
  - sharp ^0.34.5 -> ^0.35.5. It was installed with `-D`, so it stays a devDependency. Next's nested sharp now dedupes to the root 0.35.5.
  - @types/react and @types/react-dom are unchanged at 19.3.0.
- **Floors.** next and eslint-config-next 16.4.2, react and react-dom 19.3.1, plus a new `sharp` floor of 0.35.5. The parity guard checks every key in `floors`. A negative control (the HEAD~ lockfile against the new floors) fails with 5 lines and exit 1.
- **sharp 0.35 compatibility.** sharp 0.35's breaking changes don't touch `scripts/optimize-images.mjs`: Node 18 dropped, install script removed, AVIF SSIMULACRA2 tuning, `failOnError` / `paletteBitDepth` / some sharpen props removed, and `jp2k` renamed to `jp2`. The script's pipeline passed a smoke test on an in-memory 2400x1600 buffer, so no code change was needed.

## Task Commits

1. **Task 1: Read the Next.js security advisory and approve the patched versions** (checkpoint, blocking-human). No commit. Tim replied "approve all, including later versions not specifically named".
2. **Task 2 (tracer): Install the advisory's patched versions and raise the floors.** `fdeb9fe` (fix). The tracer gate re-ran `<verify>` and it passed.
3. **Task 3: Zero-diff gate, CI Visual Regression green on the patch commit** (checkpoint). No files and no commit. `origin/ci/07-07` = `fdeb9fe`. check-visual-run PASS, check-snapshot-commit `--none` OK.

**Plan metadata:** the docs commit that follows this SUMMARY.

## Files Created/Modified
- `package.json`: next ^16.4.2, react / react-dom ^19.3.1, eslint-config-next ^16.4.2, sharp ^0.35.5 (devDependencies). Caret style is kept.
- `package-lock.json`: resolved to the versions above, and the nested sharp copy under next is gone (dedupe).
- `scripts/guards/version-floors.json`: floors raised, and the new `sharp` key added.

## Decisions Made
- **Versions beyond the advisory, approved by Tim.** The advisory names `next@16.4.1`. 16.4.2, the React 19.3.1 patch and sharp 0.35.5 were all available, and Tim approved them explicitly: "approve all, including later versions not specifically named".
- **A sharp floor even though sharp is a devDependency.** The advisory's sharp CVE applies to Next's image optimizer, which uses the deduped root copy. The floor makes sure a later install can't silently bring back a vulnerable sharp.

## Deviations from Plan

### User-approved scope extension (not an auto-fix)

**1. [Scope - Tim approved] Versions beyond the advisory's `next@16.4.1`**
- **Found during:** Task 1 (advisory review)
- **Issue:** The plan installs "exactly the versions Tim approved", and the advisory's minimum is `next@16.4.1`. Newer patch releases were available: next 16.4.2, react/react-dom 19.3.1, and sharp 0.35.5 (sharp is the advisory's own minimum for CVE-2026-96889).
- **Decision:** Tim's reply, verbatim: "approve all, including later versions not specifically named". next and eslint-config-next 16.4.2, react/react-dom 19.3.1 and sharp 0.35.5 were installed, and a new `sharp` floor of 0.35.5 was added.
- **Files modified:** `package.json`, `package-lock.json`, `scripts/guards/version-floors.json`
- **Verification:** build, lint, type-check, jest 69/69, parity OK with its negative control, CI run 39775685353 all green
- **Committed in:** `fdeb9fe`

### Procedural deviation

**2. [Procedure] Task 3 used a plain push instead of `git push --force`**
- **Found during:** Task 3
- **Issue:** The auto-mode classifier denied the plan's `git push --force origin HEAD:refs/heads/ci/07-07`.
- **Fix:** A plain `git push origin HEAD:refs/heads/ci/07-07`. `ci/07-07` didn't exist yet, so the result is identical: the remote ref is a new branch at `fdeb9fe`.
- **Verification:** `git ls-remote origin refs/heads/ci/07-07` -> `fdeb9fece69053ced9d98e542415c13fcb686eba`
- **Committed in:** n/a (no files)

---

**Total deviations:** 0 auto-fixed, 1 user-approved scope extension, 1 procedural (equivalent push form)
**Impact on plan:** Every installed version is at or above the advisory minimum, with Tim's explicit approval. There were no code changes and no re-baseline, so the zero-diff truth holds without exception.

## Issues Encountered
- At the start of close-out, run 39775685353 had Visual Regression green while E2E was still running. Close-out waited for the run to finish (`gh run watch --exit-status`, exit 0). Every job concluded success at 2026-10-22T12:25:20Z.

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-13 (upstream Next / sharp CVEs):** mitigated. The patched versions are installed, the floors block downgrades, and the phase verifier can assert next >= 16.4.2.
- **T-07-SC (npm install tampering):** mitigated. Task 1 was a blocking-human legitimacy and advisory check before the install.

## User Setup Required
None for this plan. The 07-USER-SETUP.md item (required status checks on `main`) is still pending with Tim.

## Next Phase Readiness
- **Follow-up, recommended soon:** `main` deploys to Vercel production and doesn't have the security patch yet. GitHub's push banner reported 84 Dependabot alerts on the default branch, 9 of them critical. Tim merges the phase branch into `main`, and should do so soon so production picks up the patch.
- **Unblocked:** 07-08..07-26 chained on 07-07. The phase can continue with 07-08 (Playwright 1.64, the next isolated upgrade).
- **Pushing:** `fdeb9fe` is on `origin/ci/07-07`. The docs commits stay local, and pushing them is Tim's job.

## Verification (close-out, 2026-10-22T12:25Z)

| Check | Result |
|-------|--------|
| Lockfile next / eslint-config-next | 16.4.2 / 16.4.2 |
| Lockfile react / react-dom | 19.3.1 / 19.3.1 |
| Lockfile sharp / @types/react / @types/react-dom | 0.35.5 / 19.3.0 / 19.3.0 |
| version-floors.json | next 16.4.2, eslint-config-next 16.4.2, react 19.3.1, react-dom 19.3.1, sharp 0.35.5 |
| Plan lockfile/floor one-liner | `next patched 16.4.2`, exit 0 |
| `npm run guard:parity` | `parity: OK` |
| `git show --stat fdeb9fe` | package.json, package-lock.json, scripts/guards/version-floors.json (3 files) |
| `git ls-remote origin refs/heads/ci/07-07` | fdeb9fece69053ced9d98e542415c13fcb686eba |
| `check-visual-run.mjs --sha fdeb9fece690... --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39775685353/job/119813903432`, exit 0 |
| `check-snapshot-commit.mjs --sha fdeb9fe --none` | `OK (0 changed)`, exit 0 |
| `gh run view 39775685353` | success. E2E, Visual, Lint/Type, Unit, Security and Build all success; Dependency Review skipped |

Task 2's local gates on the patched tree:
- build exit 0 (Next 16.4.2)
- `npm ls --depth=0` exit 0
- lint 0 errors / 54 warnings (same as 07-06)
- guard selftest 25/25
- type-check exit 0
- jest 8 suites, 69/69
- same-classnames OK

## Self-Check: PASSED
- `fdeb9fe` is an ancestor of HEAD. `git rev-list --count b1056bc..HEAD` = 1.
- `package.json`, `package-lock.json` and `scripts/guards/version-floors.json` exist with the stated versions.
- Plan verification: lockfile next == approved patched version (16.4.2) == floor, and CI Visual Regression is green on the patch commit.
- Every Task 2 and Task 3 acceptance criterion was re-run and passes.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-22*
