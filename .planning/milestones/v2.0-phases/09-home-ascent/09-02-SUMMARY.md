---
phase: 09-home-ascent
plan: 02
subsystem: ui
tags: [nextjs, react-server-components, jest, playwright, eslint, guards, cleanup]

requires:
  - phase: 09-01
    provides: "Server Component Home (AscentHero, HeroBlock, TrailSigns), lib/home-format formatLatLon/countLabel, trail-sign accessible names"
provides:
  - "Legacy hero chain deleted (Hero3DMountain, MountainTerrain3D, DualParticleSystem, GeologicalButton, lib/useGlowIntensity)"
  - "LEGACY_COMPILER_FILES 8 -> 5; palette ratchet without the MountainTerrain3D entry"
  - "components/home/__tests__/boundary.test.ts: self-discovering RSC import-graph guard for components/home"
  - "e2e 'Home without JavaScript (HOME-01)' at 375x667 and 1440x900"
  - "hide-canvas.css without the hero scroll-arrow pin"
affects: [09-03, 09-04, 09-05, 09-08, 09-09, 09-10, 09-14, 12]

actuals:
  tokens: 11750
  tasks: 3
  commits: 3
plan_head_before: eb55e8b97510b7ff5d2bccbc5399cf87fbee2c93
plan_head_after: dfdacdb04a2e4cc45b3b83588adc8936041f11b7

tech-stack:
  added: []
  patterns:
    - "Boundary tests discover files with a recursive readdirSync walk, so later plans' files are checked without editing the test"
    - "Import specifiers are read from comment-stripped source; import type / export type are exempt (erased at compile time)"
    - "No-JavaScript e2e via test.use({ javaScriptEnabled: false }), with expected strings built from data and the Home formatters"

key-files:
  created:
    - components/home/__tests__/boundary.test.ts
    - .planning/phases/09-home-ascent/deferred-items.md
  modified:
    - eslint.config.mjs
    - scripts/guards/palette-ratchet.json
    - e2e/visual/hide-canvas.css
    - README.md
    - e2e/homepage.spec.ts
    - .planning/phases/08-data-terrain-pipeline/deferred-items.md
  deleted:
    - components/Hero3DMountain.tsx
    - components/MountainTerrain3D.tsx
    - components/DualParticleSystem.tsx
    - components/GeologicalButton.tsx
    - lib/useGlowIntensity.ts

key-decisions:
  - "The boundary test exempts import type / export type: they are erased at compile time, pull in no code, and would otherwise give false positives when a later server file needs a terrain type"
  - "The boundary test also reads import() and require() specifiers for rules (a)-(c), so a dynamic import of three from a server file still fails"

patterns-established:
  - "Every file under components/home is held to the ARCH §5 rules automatically; new Home files need no test edit"

requirements-completed: [HOME-01]

coverage:
  - id: D1
    description: "The five hero-chain files are deleted; git grep showed no importer outside the chain; LEGACY_COMPILER_FILES lost three entries and gained none; the palette ratchet holds no entry for a deleted file"
    requirement: HOME-01
    verification:
      - kind: other
        ref: "test ! -e (5 files); grep -cE 'DualParticleSystem|MountainTerrain3D|GeologicalButton' eslint.config.mjs = 0; ratchet key check exits 0"
        status: pass
      - kind: other
        ref: "npm run lint && npm run type-check && npm run build"
        status: pass
    human_judgment: false
  - id: D2
    description: "Home renders exactly as 09-01 left it after the deletions"
    requirement: HOME-01
    verification:
      - kind: e2e
        ref: "npx playwright test e2e/homepage.spec.ts e2e/design-system.spec.ts --project=chromium (14 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "hide-canvas.css keeps its canvas rule but no longer pins the scroll arrow or names a deleted component; README lists no deleted component"
    verification:
      - kind: other
        ref: "stale-refs node check prints 'stale refs: none'; grep 'M19 14l-7 7' = 0; canvas rule count = 1; playwright --list --project=visual-dark builds (36 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "RSC boundary test for components/home (rules a-e), shown not to be vacuous by probe runs"
    requirement: HOME-01
    verification:
      - kind: unit
        ref: "components/home/__tests__/boundary.test.ts (6 tests)"
        status: pass
    human_judgment: false
  - id: D5
    description: "With JavaScript disabled at 375x667 and 1440x900, the h1, role, kicker and both trail-sign links are visible and end inside the first viewport, and scrollWidth <= clientWidth"
    requirement: HOME-01
    verification:
      - kind: e2e
        ref: "e2e/homepage.spec.ts#Home without JavaScript (HOME-01) first viewport at 375 x 667 / 1440 x 900"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 02: Dead hero chain removal and the Home boundary guards Summary

**Deleted the five-file legacy hero chain (about 1,000 lines) and the guard entries that named it. Added a self-discovering Jest test that keeps three, R3F, drei, fast-png, motion and the client-only lib modules out of Home's Server Component graph. Added a JavaScript-disabled Playwright proof: at 375 and 1440 px the h1, role, kicker and both trail signs fit in the first viewport, with no horizontal overflow.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-24T23:32:01Z
- **Completed:** 2026-10-24T23:39:39Z
- **Tasks:** 3
- **Files modified:** 12 (5 deleted, 1 test created, 6 modified), plus the new phase deferred-items file

## Accomplishments
- `git grep` found no importer of the chain outside its own five files. All five were removed with `git rm`. `LEGACY_COMPILER_FILES` went from 8 entries to 5. `npm run guard:palette -- --update` dropped the `MountainTerrain3D` entry and raised no count. Lint, type-check and the production build are green. This also closes the STATE items on the hero badge contrast and the lost hover state.
- `e2e/visual/hide-canvas.css` no longer has the scroll-arrow pin. Its unchanged canvas rule now names the Contact AnimatedGradientMesh and the Home terrain canvas. README lost the three structure lines for the deleted components. `.github/copilot-instructions.md` is left for Phase 12.
- `components/home/__tests__/boundary.test.ts` walks every `.ts`/`.tsx` file under `components/home` (excluding `__tests__`). It enforces rules (a) to (e) from the plan, and each failure names the file and the specifier.
- The new e2e describe `Home without JavaScript (HOME-01)` passes at both viewports. The homepage spec now lists 7 tests.
- The Phase 8 deferred item "Home overflows horizontally at 375 px" is marked resolved.

## Boundary test probe runs (never committed)

1. **Planned probe:** `components/home/BoundaryProbe.tsx`, no client directive, `import * as THREE from 'three'`. `npx jest components/home/__tests__/boundary.test.ts --silent` exited 1 with `Tests: 2 failed, 4 passed, 6 total`. The failure lines were:
   - `"components/home/BoundaryProbe.tsx imports 'three' without the 'use client' directive"` (rule a)
   - `"components/home/BoundaryProbe.tsx imports 'three' outside components/home/terrain/"` (rule c)
2. **Extra probe (rules b, d):** a client file importing `@react-three/drei` and statically importing `./terrain/Stage`. It exited 1 with 2 failures: `"... imports '@react-three/drei'"` and `"... names './terrain/' outside a dynamic import() call"`. Rule (a) correctly stayed green, because the file is a client file.
3. **Extra probe (rule e, plus the legitimate pattern):** a client file using `dynamic(() => import('./terrain/Stage'))`, with `'use client'` temporarily prepended to `app/(site)/page.tsx`. Only rule (e) failed (`Expected: false, Received: true`); the dynamic import passed rule (d). `page.tsx` was restored with `git checkout -- 'app/(site)/page.tsx'`.

After each probe the file was deleted and the suite was re-run: 6/6 passed. `test ! -e components/home/BoundaryProbe.tsx` exits 0.

## Task Commits

1. **Task 1 (tracer): Delete the dead hero chain, its compiler-list entries and ratchet entry**: `efd11e7` (refactor)
2. **Task 2: Remove the stale references in hide-canvas.css and the README**: `9e1cb57` (docs)
3. **Task 3: RSC boundary test and the HOME-01 no-JavaScript proof**: `dfdacdb` (test)

Tracer gate: interactive run, `human_verify_mode` end-of-phase, automated-only verify. The Task 1 verify passed (lint, type-check, build, 12/12 Playwright), so expansion continued with no checkpoint.

## Files Created/Modified
- `components/home/__tests__/boundary.test.ts`: the ARCH §5 import-graph guard for `components/home`.
- `e2e/homepage.spec.ts`: the `Home without JavaScript (HOME-01)` describe, with two viewport tests and expected strings taken from `site`, `terrain`, `photos`, `projects`, `lv95ToWgs84`, `formatLatLon` and `countLabel`. The 5 existing tests are unchanged.
- `eslint.config.mjs`: three hero-chain entries removed from `LEGACY_COMPILER_FILES`.
- `scripts/guards/palette-ratchet.json`: the `components/MountainTerrain3D.tsx` entry dropped (tightened with `--update`).
- `e2e/visual/hide-canvas.css`: the scroll-arrow rule and its comment removed, and the canvas comment reworded.
- `README.md`: three structure lines removed.
- `.planning/phases/08-data-terrain-pipeline/deferred-items.md`: the 375 px overflow item resolved.
- `.planning/phases/09-home-ascent/deferred-items.md`: one out-of-scope README note (see Issues).
- Deleted: `components/Hero3DMountain.tsx`, `components/MountainTerrain3D.tsx`, `components/DualParticleSystem.tsx`, `components/GeologicalButton.tsx` and `lib/useGlowIntensity.ts`.

## Decisions Made
- `import type` / `export type` statements are exempt from the boundary rules (see key-decisions).
- Rules (a) to (c) read static, side-effect, `import()` and `require()` specifiers. Rule (d) strips comments and `import('…')` calls, then searches for the terrain path strings, so any other mention (including `require`) fails.
- The e2e also asserts that each element's box top is at or below 0 and that each target matches exactly one element (`toHaveCount(1)`) inside `#main-content`. Without that, a duplicated element could pass the visibility check.

## Deviations from Plan

None. The plan was executed as written. Two additions went beyond the planned probe and are recorded above: the extra probe runs for rules (b), (d) and (e), and the type-only exemption.

## Issues Encountered
- `npx prettier --check` flags `e2e/visual/hide-canvas.css`. That was already the case at the base commit (`eb55e8b`), and Prettier would rewrite the one-line canvas rule that the plan's acceptance grep requires, so the file was left as it is. 529 files fail Prettier repo-wide, so formatting is not enforced. `boundary.test.ts` was formatted with Prettier before it was committed.
- Out of scope, logged to `.planning/phases/09-home-ascent/deferred-items.md`: the README tree still describes `page.tsx` as "Homepage with 3D mountain hero", for Phase 12.
- `npm run lint` still prints 24 warnings. They come from the five remaining `LEGACY_COMPILER_FILES` and other legacy files outside Home. There are 0 errors, and all guards report OK.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- From now on, every new file under `components/home` (cards, plaque, terrain stage, controller) is checked by the boundary test without any edit to it. WebGL code must live in `components/home/terrain/` and be reached only through `import()`.
- The `home/*` visual baselines are still out of date from 09-01. They are re-baselined in 09-14.

## Self-Check: PASSED
- Created files exist: `components/home/__tests__/boundary.test.ts` and `.planning/phases/09-home-ascent/deferred-items.md`. The five deleted files are absent, and so is the probe.
- Commits `efd11e7`, `9e1cb57` and `dfdacdb` are ancestors of HEAD. `git rev-list --count eb55e8b..HEAD` = 3.
- Plan verification: lint, type-check and build exit 0, and `public/service-worker.js` was restored after the build. Jest boundary + hero: 2 suites, 15/15. Full Jest: 33 suites, 456/456. `guard:tests` reports jest 456 + e2e 119 = 575 (baseline 533), OK. Playwright homepage + design-system on chromium: 14 passed. The homepage spec lists 7 tests.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*
