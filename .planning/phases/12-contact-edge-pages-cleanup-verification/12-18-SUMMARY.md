---
phase: 12-contact-edge-pages-cleanup-verification
plan: 18
subsystem: photos
tags: [react-compiler, eslint, react-hooks, three, r3f, jest, verify-01]

requires:
  - phase: 12-04
    provides: "GlassmorphismNav deleted (its LEGACY_COMPILER_FILES entry left inert)"
  - phase: 12-16
    provides: "AnimatedGradientMesh deleted (its LEGACY_COMPILER_FILES entry left inert)"
provides:
  - "lib/useProgressiveTextures.ts passes react-hooks/refs, purity, immutability and set-state-in-effect at error, with no exhaustive-deps warning and no eslint-disable"
  - "lib/__tests__/useProgressiveTextures.test.ts: 9 tests pinning load order, re-prioritisation, late-load disposal, unmount disposal and Strict Mode"
  - "eslint.config.mjs without LEGACY_COMPILER_FILES: the React Compiler rules apply at error everywhere"
affects: [12-19, 12-22, verify-01]

actuals:
  tokens: 6836
  tasks: 2
  commits: 3
plan_head_before: f0dce728bc254b5ca4e1f7990172af2177df7806
plan_head_after: 9b2cb05699803b183f1190f10ae2e3259352119f

tech-stack:
  added: []
  patterns:
    - "Async resource hooks: one effect run owns its loader, its objects and a local cancelled flag; cleanup disposes what that run created"
    - "Latest-props refs written in an effect declared before the effect that reads them, never during render"
    - "Reset derived state on a prop change by adjusting state while rendering (tracked value + conditional setState)"

key-files:
  created:
    - lib/__tests__/useProgressiveTextures.test.ts
  modified:
    - lib/useProgressiveTextures.ts
    - eslint.config.mjs

key-decisions:
  - "textures is empty until every thumbnail has settled, then set once from the loader callback with allThumbsLoaded; the only consumer (Ring) renders nothing before allThumbsLoaded, so nothing visible changes"
  - "Thumbnails and full-size loads share one effect keyed on the source count: the full-size chain starts from the last thumbnail callback, which replaces the allThumbsLoaded-keyed second effect and the phase2Running flag"
  - "A source-count change now resets allThumbsLoaded, loadState and textures in the same render (before, allThumbsLoaded stayed true from the old list); the carousel's list never changes length, so this only hardens an edge"
  - "The Strict Mode queueMicrotask/mountedRef disposal workaround is gone: per-run ownership makes the double run dispose run 1's objects and keep run 2's"
  - "GREEN commit uses the plan's prescribed refactor(12-18) type rather than feat(12-18)"

patterns-established:
  - "Mock three's TextureLoader with a recorded call list that tests settle on demand (resolveLoad/rejectLoad inside act)"

requirements-completed: [VERIFY-01]

coverage:
  - id: D1
    description: "useProgressiveTextures passes the four React Compiler rules at error (baseline 3 errors, 4 exhaustive-deps warnings)"
    requirement: VERIFY-01
    verification:
      - kind: other
        ref: "npx eslint lib/useProgressiveTextures.ts components/photos/PhotoCarousel3D.tsx --rule '{react-hooks/refs,purity,immutability,set-state-in-effect: error}' (0 problems)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Hook contract kept: thumbnails first, proximity-ordered full-size loads re-prioritised on index change, late loads ignored and disposed, every texture disposed on unmount"
    requirement: VERIFY-01
    verification:
      - kind: unit
        ref: "lib/__tests__/useProgressiveTextures.test.ts (9 passed)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/photos-carousel.spec.ts e2e/photos.spec.ts --project=chromium (43 passed, fresh build; baseline 43)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 PW_REUSE=1 npx playwright test e2e/photos-sweep.spec.ts e2e/no-webgl.spec.ts --project=chromium (23 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "LEGACY_COMPILER_FILES and its warn-level override removed; repo lint clean with every guard"
    requirement: VERIFY-01
    verification:
      - kind: other
        ref: "grep -c LEGACY_COMPILER_FILES eslint.config.mjs = 0; npm run lint (exit 0, 0 errors, 0 warnings); npm run type-check; npx jest --silent (102 suites, 1647 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "3D carousel pixels unchanged"
    verification: []
    human_judgment: true
    rationale: "Visual baselines are Linux-only (CI) and the photos-carousel shot runs under reduced motion on the stepper, so no local shot exercises the 3D textures; 12-19 runs the photos-carousel visual round"

duration: 10min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 18: Compiler-Clean Progressive Textures Summary

**The 3D carousel's texture hook now keeps its texture list in state and owns its loads per effect run, so it passes the React Compiler rules at error, and `LEGACY_COMPILER_FILES` is gone from eslint.config.mjs. The carousel e2e count is unchanged (43 before, 43 after).**

## Performance

- **Duration:** 10 min (wall clock)
- **Started:** 2026-11-02T23:32:39Z
- **Completed:** 2026-11-02T23:42:15Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `lib/useProgressiveTextures.ts` rewritten (306 -> 188 lines). Render reads only state. `textures` is state, set from the last thumbnail callback together with `allThumbsLoaded`. The latest sources and active index reach the async chain through refs written in an effect. One effect run per source count creates its loader, slots and `cancelled` flag, and its cleanup disposes the slots. Exported names and the `{ textures, loadState, allThumbsLoaded }` shape are unchanged, and PhotoCarousel3D needed no edit.
- Compiler-rule lint on the hook went from 3 errors and 4 warnings to 0 problems. The two `eslint-disable-next-line react-hooks/exhaustive-deps` comments are gone.
- New Jest suite (9 tests) with a mocked TextureLoader whose loads settle on demand.
- `LEGACY_COMPILER_FILES`, its comment and the warn override are deleted. `npm run lint` warnings went from 7 to 0 (all 7 were in this hook) and errors stayed at 0.

## E2E counts (chromium, production build)

| Run | Before | After |
|-----|--------|-------|
| photos-carousel + photos, `PW_PROD=1 PW_REUSE=1` (per-task) | 43 passed | 43 passed |
| photos-carousel + photos, plain `PW_PROD=1` (fresh build, plan level) | - | 43 passed |
| photos-sweep + no-webgl, `PW_PROD=1 PW_REUSE=1` (extra) | - | 23 passed |

The photos-carousel spec holds 10 tests (4 `@chromium-only` 3D ones). There were no failed or flaky lines.

## Task Commits

1. **Task 1 RED: hook contract tests** - `a93e2bd` (test)
2. **Task 1 GREEN: compiler-clean hook** - `d573029` (refactor, the message the plan prescribes)
3. **Task 2: drain the exemption list** - `9b2cb05` (chore)

## TDD

- **RED:** 9 tests. 8 passed against the old hook. They are characterisation tests that pin the existing contract as a regression guard. The target `starts over when the source list changes: the old textures are disposed and never returned` failed on `expect(allThumbsLoaded).toBe(false)` (received `true`: the old hook kept the flag from the previous list). Jest's default reporter is not a supported classifier format, so the target was rerun through the same `npx jest` command with a scratchpad TAP reporter that prints Jest's own results. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` / `target_test_failed`. Semantic assessment: the target ran and failed on the planned assertion for the intended reason, with no load, syntax or fixture fault.
- **GREEN:** 9/9 passed after the rewrite.
- **REFACTOR:** no separate refactor commit was needed.

## TDD Gate Compliance

`workflow.tdd_mode` is off and the plan is `type: execute`, so this is advisory. The RED commit `test(12-18)` precedes the GREEN commit. The GREEN commit is typed `refactor(12-18)` because the plan names that exact message, so a strict `feat(12-18)` GREEN lookup will not find it. `d573029` is the GREEN commit.

## Files Created/Modified

- `lib/__tests__/useProgressiveTextures.test.ts`: new, 282 lines, 9 tests
- `lib/useProgressiveTextures.ts`: state-based texture list, per-run ownership, no refs read in render
- `eslint.config.mjs`: `LEGACY_COMPILER_FILES` and the warn block removed (stale GlassmorphismNav and AnimatedGradientMesh entries included)

## Decisions Made

See key-decisions in the frontmatter. In short:
- `textures` stays empty until the thumbnails settle. The consumer already gates on `allThumbsLoaded`.
- A source-count change resets the hook in the same render. It used to leave `allThumbsLoaded` stale.
- A single effect replaces the two-effect chain, the `phase2Running` flag and the Strict Mode microtask workaround.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale allThumbsLoaded after a source-count change**
- **Found during:** Task 1 (writing the behaviour tests)
- **Issue:** When the number of sources changed, the old hook kept `allThumbsLoaded` true from the previous list while it reallocated placeholders. A consumer could then render textures that had not loaded.
- **Fix:** On a count change the hook resets `allThumbsLoaded`, `loadState` and `textures` while rendering, and the effect cleanup disposes the old slots.
- **Files modified:** lib/useProgressiveTextures.ts
- **Verification:** the RED target test now passes
- **Committed in:** d573029

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** An edge-case hardening that the plan's "superseded loads ignored" behaviour implies. The carousel's photo list has a fixed length, so nothing user-facing changes.

## Issues Encountered

- `npm run start` background tasks report exit code 1 each time. That is the expected result of stopping the server with taskkill, not a failure. Port 3000 is free and `public/service-worker.js` is restored after every build.

## Regression Notes

- Timing: the full-size chain now starts inside the last thumbnail callback, not one render later in a second effect. Load order and one-at-a-time behaviour are the same (Jest-pinned).
- Texture objects keep the same identity through every swap, as before, so R3F materials are untouched.
- Pixels: there was no local visual run. The photos-carousel visual shot renders the stepper under reduced motion and baselines are Linux-only. 12-19 covers the visual round.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- No file is exempt from the React Compiler rules. VERIFY-01's guard-drain scope for this list is closed.
- `README.md` still mentions AnimatedGradientMesh (12-22 docs pass). The JSDoc of the new test names `LEGACY_COMPILER_FILES` only to cite the 07-02 rule.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*

## Self-Check: PASSED

- FOUND: lib/__tests__/useProgressiveTextures.test.ts, lib/useProgressiveTextures.ts, eslint.config.mjs
- FOUND: a93e2bd, d573029, 9b2cb05 (ancestors of HEAD; evaluation-scope resolved 12-18 commits)
- Acceptance: eslint compiler rules 0 errors (baseline 3); it/test count 9 (>= 4); `grep -c LEGACY_COMPILER_FILES eslint.config.mjs` = 0 (baseline 2); e2e before/after recorded
- Plan verification: `npm run lint && npm run type-check && npx jest --silent` green; `PW_PROD=1 npx playwright test e2e/photos-carousel.spec.ts e2e/photos.spec.ts --project=chromium` 43 passed
