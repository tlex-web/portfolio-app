---
phase: 12-contact-edge-pages-cleanup-verification
plan: 06
subsystem: infra
tags: [npm-audit, zod, fflate, overrides, lockfile, three, r3f, canvas, home-08, d-25]

requires:
  - phase: 12-02
    provides: "Playwright serviceWorkers 'block', which makes the four delayHeightmap e2e users reach their stub (closes the D-25 delayHeightmap item)"
  - phase: 12-03
    provides: "Wave-1 tree that the bumps and the canvas fix land on"
provides:
  - "zod ^4.6.7 (GHSA-mrhx-c7xc-m3w5 fixed) with a 4.6.7 floor"
  - "Scoped fflate overrides: fflate@^0.8.0 -> 0.8.3 and three-stdlib's fflate@^0.6.0 -> 0.6.11 (GHSA-px8p-9vwx-vf98 fixed), with a 0.8.3 floor"
  - "TerrainStage idle arm gated on the window load event (D-25); first-scroll arm and capability gate unchanged"
  - "components/home/__tests__/terrain-stage.test.tsx: 9 arm-order tests"
  - "D-25 dispositions table (5 rows) for 12-22 to copy into the Phase 9 deferred list"
affects: [12-22, 12-23, 12-24, home-canvas, contact, ci-install]

actuals:
  tokens: 3000
  tasks: 3
  commits: 28
  plan_commits: 4
plan_head_before: 76fb356525f09b7b7afcfda65678f2b77c0e2156
plan_head_after: ae1c0fef397b2427c3a68d232a29d76c80316f83

tech-stack:
  added: []
  patterns:
    - "Version-scoped npm overrides (`fflate@^0.8.0`, `fflate@^0.6.0`) patch every major line of a transitive package without forcing one version onto a dependent that asks for an older line"
    - "On this Windows/npm 11.6.1 setup a plain `npm install` rewrites the optional @emnapi wasm entries and `npm ci` then rejects the lockfile; bump lockfiles by patching only the changed entries and prove them with `npm ci --dry-run` in a clean directory"
    - "Deferred-work arms on Home wait for the window load event, so lazy chunks never delay loadEventStart"

key-files:
  created:
    - components/home/__tests__/terrain-stage.test.tsx
  modified:
    - package.json
    - package-lock.json
    - scripts/guards/version-floors.json
    - components/home/TerrainStage.tsx
    - lib/useAscentMode.ts

key-decisions:
  - "zod bumped to ^4.6.7 on Tim's \"Approve (Recommended)\"; floor 4.6.7"
  - "fflate patched with version-scoped overrides on Tim's \"Approve scoped (Recommended)\": 0.8.x -> 0.8.3 and three-stdlib's 0.6 copy -> 0.6.11; floor 0.8.3 (the floors file holds one x.y.z per package and checks only the top-level copy, so the 0.6.11 pin lives in package.json overrides)"
  - "THREE.Clock warning deferred on Tim's \"Defer (Recommended)\": an upstream console.warn that the D-20 audit gate (errors only) ignores, owned by the next r3f release that moves to THREE.Timer"
  - "Canvas arm moved behind the window load event on Tim's \"Canvas fix\"; loadEventStart now precedes the three/R3F chunk in all three HOME-08 samples, LCP unchanged"
  - "@react-three/fiber not proposed (9.8.2 still constructs THREE.Clock); no reply sought"
  - "package-lock.json hand-patched to only the zod and fflate entries because npm install's rewrite made npm ci fail; validated with npm ci --dry-run and a real npm ci"

patterns-established:
  - "Lockfile bumps on Windows: patch the changed entries, then prove with `npm ci --dry-run` in a clean copy before committing"

requirements-completed: [CONTACT-03, VERIFY-04]

coverage:
  - id: D1
    description: "zod resolves to 4.6.7 and GHSA-mrhx-c7xc-m3w5 is gone from npm audit; the floor is 4.6.7"
    requirement: CONTACT-03
    verification:
      - kind: other
        ref: "npm ls zod (4.6.7 everywhere); npm audit --json --package-lock-only (no zod entry; 44 total)"
        status: pass
      - kind: unit
        ref: "app/api/__tests__/feedback.test.ts (48 passed)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 PW_REUSE=1 npx playwright test e2e/contact-form.spec.ts e2e/not-found.spec.ts --project=chromium"
        status: pass
      - kind: other
        ref: "npm run guard:parity (floor zod 4.6.7)"
        status: pass
    human_judgment: false
  - id: D2
    description: "fflate 0.8.x copies resolve to 0.8.3 and three-stdlib's copy to 0.6.11; GHSA-px8p-9vwx-vf98 is gone from npm audit; the lockfile passes npm ci"
    verification:
      - kind: other
        ref: "npm ls fflate (0.8.3 overridden/deduped, three-stdlib 0.6.11 overridden)"
        status: pass
      - kind: other
        ref: "npm ci --dry-run --ignore-scripts in a clean copy (exit 0) and npm ci in the repo"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 PW_REUSE=1 npx playwright test e2e/home-canvas.spec.ts --project=chromium"
        status: pass
    human_judgment: false
  - id: D3
    description: "TerrainStage starts its idle arm only after the window load event; the first scroll still arms at once; ineligible stages never arm"
    requirement: VERIFY-04
    verification:
      - kind: unit
        ref: "components/home/__tests__/terrain-stage.test.tsx (9 passed)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 PW_REUSE=1 npx playwright test e2e/home-canvas.spec.ts --project=chromium (62 passed with contact-form and not-found)"
        status: pass
      - kind: other
        ref: "scratchpad d25-measure.mjs home08 on the production build: loadEventStart before chunk start and responseEnd in 3/3 samples"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every D-25 item has a recorded disposition, deferrals quoting Tim's literal selection"
    verification: []
    human_judgment: true
    rationale: "The dispositions table is a record of Tim's decisions; only a human can confirm it reflects his intent"

duration: 11min (continuation, Task 3) + Task 1 in an earlier session
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 06: D-25 Hygiene and Security Summary

**zod 4.6.7 and version-scoped fflate overrides (0.8.3, plus three-stdlib's 0.6.11) close both advisories (npm audit 46 -> 44). The Home canvas idle arm now waits for the load event, so loadEventStart lands about 1.8 s earlier on the HOME-08 profile with LCP unchanged. All five D-25 items are recorded, and the THREE.Clock deferral quotes Tim.**

## Performance

- **Duration:** 11 min for this continuation (Task 3: 20:09:09Z to 20:19:45Z). Task 1 ran in an earlier session (commit 8fae4f8 at 18:22:50Z), and Task 2 was Tim's checkpoint.
- **Started (continuation):** 2026-11-02T20:09:09Z
- **Completed:** 2026-11-02T20:19:45Z
- **Tasks:** 3 of 3 (Task 2 was the blocking-human checkpoint, answered by Tim)
- **Files modified:** 7 (6 in Tasks 1 and 3, plus this SUMMARY)

## Accomplishments

- zod ^4.4.3 -> ^4.6.7 (GHSA-mrhx-c7xc-m3w5, high, fixed). The floor is 4.6.7.
- fflate patched with version-scoped overrides: `"fflate@^0.8.0": "0.8.3"` and `"fflate@^0.6.0": "0.6.11"`. Both GHSA-px8p-9vwx-vf98 ranges are fixed. The floor is 0.8.3.
- npm audit went from 46 (4 low, 36 moderate, 6 high) to 44 (4 low, 35 moderate, 5 high). The zod and fflate entries are gone.
- TerrainStage arms its idle callback only after the window `load` event. The first passive scroll still arms at once, and the capability gate is unchanged. 9 new Jest tests pin this order.
- HOME-08 re-measure: loadEventStart is now 3432 / 3456 / 3451 ms. At HEAD it was 5271 / 5255 / 5167 ms, and it now comes before the three/R3F chunk's start and responseEnd in every sample.

## Task Commits

1. **Task 1: Prettier drift, registry facts, measurements:** `8fae4f8` (style). Earlier session.
2. **Task 2: Tim's package and D-25 decisions:** checkpoint, no commit. His answers are quoted below.
3. **Task 3: Apply approvals and D-25 choices:**
   - `646f3ac` fix(12-06): patch the zod and fflate advisories (D-25)
   - `8f07cd0` test(12-06): failing arm-order tests for the Home canvas (D-25, HOME-08) (RED)
   - `ae1c0fe` fix(12-06): arm the Home canvas after the load event (D-25) (GREEN)

**Plan metadata:** the docs(12-06) commit that holds this SUMMARY.

The ledger range `76fb356..ae1c0fe` holds 28 commits (measured, `actuals.commits`). 24 of them belong to 12-07, 12-08, 12-09 and 12-10, which ran between Task 1 and Task 3. 12-06's own commits are the four above (`actuals.plan_commits`).

## Tim's Task 2 answers (literal, 2026-11-02)

Tim answered through a structured question dialog. These are his selections, quoted byte for byte:

| Question | Tim's selection |
|----------|-----------------|
| zod 4.4.3 -> ^4.6.7 | "Approve (Recommended)" |
| fflate (scoped: 0.8.x -> 0.8.3, three-stdlib's 0.6 copy -> 0.6.11) | "Approve scoped (Recommended)" |
| THREE.Clock warning | "Defer (Recommended)" |
| Canvas-chunk load delay | "Canvas fix" |
| @react-three/fiber | not proposed (9.8.2 does not fix THREE.Clock); no reply sought |

## Registry facts (Task 1, re-checked in Task 3)

| Package | Current | Proposed | Published | Publisher / repository | Advisory | Verdict |
|---------|---------|----------|-----------|------------------------|----------|---------|
| zod | 4.4.3 | ^4.6.7 (4.6.7) | 2026-10-12T16:29Z (4.6.6: 2026-10-11) | GitHub Actions trusted publisher, approver colinhacks; github.com/colinhacks/zod | GHSA-mrhx-c7xc-m3w5, high, `<4.6.6`: memory exhaustion validating oversized constrained collections | [SUS] (age only), approved by Tim |
| fflate (0.8 line) | 0.8.2 | 0.8.3 | 2026-05-16T00:14Z | 101arrowz; github.com/101arrowz/fflate | GHSA-px8p-9vwx-vf98, moderate, `>=0.8.0 <0.8.3`: unzipSync infinite loop on malformed ZIP64 | [OK], approved by Tim |
| fflate (three-stdlib's 0.6 copy) | 0.6.10 | 0.6.11 | 2026-07-20T16:20Z | 101arrowz (`_npmUser` and sole maintainer); github.com/101arrowz/fflate | GHSA-px8p-9vwx-vf98, `>=0.6.0 <0.6.11` | [OK], re-checked before install per the resume instructions; approved by Tim (scoped) |
| @react-three/fiber | 9.8.1 | not proposed | 9.8.2: 2026-10-14 | pmndrs | none; 9.8.2 still constructs THREE.Clock | not proposed |

`npm view` does not report weekly downloads, so that column is omitted.

## D-25 measurements

### THREE.Clock warning (Task 1, step 3a)

Production build, Chromium 156.0.8078.4, 1440 x 900, WebGL2 available, one scroll, mode `3d`:

- **1 warning per canvas mount:** `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`
- It is a `console.warn`. The D-20 console audit gate counts errors only.
- The Task 3 re-run on the fixed build gives the same result (1 warning), as expected: the canvas fix does not touch it.

### Canvas-chunk load delay (Task 1, step 3b; Task 3 re-measure)

HOME-08 profile: Pixel 7 device, 4x CPU throttling, 150 ms latency, 200000 B/s down, service workers blocked, Chromium 156.0.8078.4. The chunk is `3v-t5wd_vujbt.js` (241921 B transferred) in both builds.

| Build | Run | LCP (ms) | loadEventStart (ms) | chunk start (ms) | chunk responseEnd (ms) | canvas ready (ms) |
|-------|-----|----------|---------------------|------------------|------------------------|-------------------|
| HEAD (before) | 1 | 3236 | 5271 | 3267 | 4849 | 6552 |
| HEAD (before) | 2 | 3280 | 5255 | 3289 | 4898 | 6477 |
| HEAD (before) | 3 | 3216 | 5167 | 3226 | 4835 | 6365 |
| ae1c0fe (after) | 1 | 3188 | **3432** | 3690 | 5312 | 6932 |
| ae1c0fe (after) | 2 | 3140 | **3456** | 3465 | 4983 | 6631 |
| ae1c0fe (after) | 3 | 3204 | **3451** | 3767 | 5391 | 7013 |

- **Before:** loadEventStart came 350 to 420 ms after the chunk's responseEnd, because the idle arm started the chunk request during page load.
- **After:** loadEventStart comes before the chunk's start (and so before its responseEnd) in 3 of 3 samples. That meets the plan's acceptance.
- **Cost:** LCP is unchanged (about 3.2 s), and the 3D view appears about 0.3 to 0.6 s later on this profile while the poster stays visible. This is within the "up to about 1.5 s" that Tim was shown.

## D-25 dispositions

12-22 copies these rows into `.planning/phases/09-home-ascent/deferred-items.md`.

| D-25 item | Disposition | Evidence |
|-----------|-------------|----------|
| fflate advisory (GHSA-px8p-9vwx-vf98) | **Fixed (scoped)** on Tim's "Approve scoped (Recommended)" | `646f3ac`: overrides `fflate@^0.8.0` -> 0.8.3 and `fflate@^0.6.0` -> 0.6.11. `npm ls fflate` shows 0.8.3 (fast-png, @types/three) and 0.6.11 (three-stdlib). npm audit no longer lists fflate (46 -> 44). Floor 0.8.3. |
| THREE.Clock deprecation warning | **Deferred** on Tim's "Defer (Recommended)" | The reason Tim was shown: an upstream `console.warn` from R3F's store that the D-20 audit gate (errors only) ignores, owned by the next r3f release that moves to THREE.Timer. The measured state is 1 warning per canvas mount (Chromium 156, production build). "clock fix" was not available because no r3f release fixes it (9.8.2 still constructs THREE.Clock). |
| Canvas-chunk load delay | **Fixed** on Tim's "Canvas fix" | `8f07cd0` (RED) and `ae1c0fe` (GREEN). loadEventStart before: 5271 / 5255 / 5167 ms, after the chunk's responseEnd (4849 / 4898 / 4835). After: 3432 / 3456 / 3451 ms, before the chunk's start (3690 / 3465 / 3767) and responseEnd (5312 / 4983 / 5391). LCP 3140 to 3204 ms (was 3216 to 3280). |
| Prettier drift (lib/useAscentMode.ts, e2e/home-canvas.spec.ts) | **Fixed** (this plan) | `8fae4f8`. `npx prettier --check lib/useAscentMode.ts e2e/home-canvas.spec.ts` passes (re-run in Task 3). |
| delayHeightmap e2e users bypassed by the service worker | **Closed by 12-02** | 12-02-SUMMARY "delayHeightmap result": "`PW_PROD=1 PW_REUSE=1 npx playwright test e2e/home-canvas.spec.ts --project=chromium` gave 45 passed, including all four `delayHeightmap` users". Its stub probe saw 1 hit with `serviceWorkers: 'block'`. Re-confirmed here: home-canvas passes on the bumped tree (62 passed together with contact-form and not-found). |

The zod advisory (GHSA-mrhx-c7xc-m3w5, on the contact path) is outside the five D-25 rows. It is **fixed** on Tim's "Approve (Recommended)" in `646f3ac`: zod 4.6.7, floor 4.6.7, and npm audit no longer lists zod.

## RED / GREEN (canvas fix)

- **RED (`8f07cd0`):** 9 tests, 5 failed and 4 passed (`--json` report in the scratchpad: `red-12-06.json`, 0 runtime-error suites). Each failure is an assertion on the planned behaviour. The pre-fix component called `requestIdleCallback` at mount (`Expected number of calls: 0, Received: 1`), and without rIC the fallback timer rendered the canvas after 5 s while the document was still loading. The 4 passes are the behaviours that must not change: the immediate arm when the page has already loaded, and no arm for static, static-reduced or pending stages. **Semantic assessment:** the target tests ran and failed for the intended reason, with no setup, import or syntax faults. This is valid RED. The plan's type is `execute` and Jest's JSON reporter is not one of the classifier's formats, so `check tdd-red-evidence` was not run. This follows the 12-08 precedent.
- **GREEN (`ae1c0fe`):** 9 of 9 pass. The full Jest suite passes (91 suites, 1479 tests).
- **REFACTOR:** none needed.

## Files Created/Modified

- `package.json`: zod `^4.6.7`, plus a new `overrides` block with the two version-scoped fflate keys.
- `package-lock.json`: only the root zod range and the zod, fflate and three-stdlib/fflate entries changed (10+ / 10-).
- `scripts/guards/version-floors.json`: floors `zod` 4.6.7 and `fflate` 0.8.3.
- `components/home/TerrainStage.tsx`: the idle arm starts at once when `document.readyState === 'complete'`, otherwise from a once-only window `load` listener that `disarm` removes. JSDoc updated (D-25).
- `components/home/__tests__/terrain-stage.test.tsx` (new): 9 arm-order tests.
- `lib/useAscentMode.ts`, `e2e/home-canvas.spec.ts`: Prettier only (Task 1, `8fae4f8`).

## Decisions Made

- **fflate floor format.** The floors file holds one `x.y.z` per package, and the parity guard checks only the top-level `node_modules/<pkg>` copy. So the floor is 0.8.3, and the 0.6.11 pin for three-stdlib's copy lives only in the package.json override. I added no notes key, to keep the file's documented shape.
- **Lockfile written by patch, not by npm's rewrite.** See deviation 1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `npm install` produced a lockfile that `npm ci` rejects**
- **Found during:** Task 3, step 1.
- **Issue:** `npm install zod@^4.6.7` followed by `npm install` (npm 11.6.1 on Windows, Node 26) dropped the top-level optional `@emnapi/core` and `@emnapi/runtime` entries. Those are wasm-only dependencies of `@napi-rs/wasm-runtime` and the wasm32 sharp and tailwind bindings. `npm ci --dry-run` then failed with `Invalid: lock file's @emnapi/wasi-threads@1.2.1 does not satisfy @emnapi/wasi-threads@1.2.3`. CI, Vercel and the parity guard all install with `npm ci`, so committing that lockfile would have broken every install.
- **Fix:** Rebuilt package-lock.json from HEAD and patched only the root zod range and the three changed entries (version, resolved, integrity taken from npm's own resolution). Then validated: `npm ci --dry-run --ignore-scripts` in a clean copy exits 0, a real `npm ci` in the repo succeeded without touching the lockfile, `npm ls` shows the intended versions, and `npm audit --package-lock-only` gives 44.
- **Files modified:** package-lock.json
- **Committed in:** `646f3ac`

**2. [Instruction - scope] fflate patched with scoped overrides instead of the plan's global `"fflate": "0.8.3"`**
- **Found during:** Task 3, step 1.
- **Issue:** The plan's global override would force 0.8.3 onto three-stdlib, which asks for `^0.6.9`. Tim chose the scoped option ("Approve scoped (Recommended)").
- **Fix:** Used version-scoped override keys. npm accepted them, and `npm ls` marks both copies `overridden`.
- **Committed in:** `646f3ac`

**3. [Plan branch not taken] No @react-three/fiber bump and no "clock fix" re-capture**
- 9.8.2 still constructs THREE.Clock, so the r3f bump was not proposed and the item was deferred on Tim's answer. Task 3's "clock fix" branch does not apply. The re-run on the fixed build still shows 1 warning, which is recorded for completeness.

---

**Total deviations:** 1 auto-fixed (Rule 1), 1 instruction-driven scope change, 1 plan branch not taken.
**Impact on plan:** The lockfile fix was needed to keep `npm ci` working. Nothing was added beyond Tim's approvals.

## Issues Encountered

- The local Node is v26.13.0, while `engines` asks for 24.x. npm prints EBADENGINE warnings only. CI and Vercel use Node 24 via `.node-version`, and the parity guard passes.

## Threat model

- **T-12-SC:** Mitigated. Registry facts were gathered in Task 1, Tim decided at the blocking-human checkpoint, fflate 0.6.11 was re-checked (101arrowz, same repository) before install, exact versions and integrity hashes are in the lockfile, and the floors were raised in the same commit.
- **T-12-14:** Mitigated. Both advisories are gone from npm audit (46 -> 44, recorded before and after).
- No new security surface.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 12-22 can copy `## D-25 dispositions` into the Phase 9 deferred list.
- The THREE.Clock warning stays deferred until an r3f release moves to THREE.Timer. A later dependency pass should re-check `@react-three/fiber` release notes.
- Regression watch: if a future bump runs plain `npm install` on Windows, check `npm ci --dry-run` before committing the lockfile (see deviation 1).

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*

## Self-Check: PASSED

- All 7 key files exist on disk. Commits 8fae4f8, 646f3ac, 8f07cd0 and ae1c0fe are ancestors of HEAD.
- Task 3 acceptance re-run: `npm ls zod fflate` shows 4.6.7 / 0.8.3 / 0.6.11, and version-floors.json carries zod 4.6.7 and fflate 0.8.3 (`guard:parity` OK). npm audit lists neither advisory (46 -> 44). The dispositions table has 5 rows, and the one deferral quotes Tim. terrain-stage.test.tsx: 9 passed. loadEventStart comes before the chunk's responseEnd in 3 of 3 new samples. `git status --porcelain public/service-worker.js` is empty.
- Plan verification: `npm run lint` exit 0, `npm run type-check` exit 0 (0 `error TS`), `npx jest --silent` 91 suites and 1479 tests passed. `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/home-canvas.spec.ts e2e/contact-form.spec.ts e2e/not-found.spec.ts --project=chromium`: 62 passed, 0 flaky, against a fresh production build of ae1c0fe. That server was stopped, the SW file restored and port 3000 freed.
