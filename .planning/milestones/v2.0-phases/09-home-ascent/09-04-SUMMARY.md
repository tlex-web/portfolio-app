---
phase: 09-home-ascent
plan: 04
subsystem: ui
tags: [design-tokens, colorjs.io, codegen, three.js, shader, ci-guard, jest]

requires:
  - phase: 09-home-ascent
    provides: "09-01: --relief-opacity: 0.32 in app/globals.css :root (the CSS poster tint)"
  - phase: 07
    provides: "tokens v2 L1 primitives and --color-contour in app/globals.css; check-contrast.mjs BLOCK/var() parsing with colorjs.io 0.7.1"
  - phase: 08
    provides: "generated-module + --check CLI shape (build-terrain.mjs), LF pinning in .gitattributes"
provides:
  - "scripts/tokens/build-tokens.mjs: app/globals.css -> data/generated/tokens.ts (write) / byte-compare (--check)"
  - "data/generated/tokens.ts: tokens.hex.{night950,night900,firn50,mist300,glacier400}, tokens.srgb.* (0-1 floats, 6 dp), contourAlpha 0.14, contourMinorAlpha 0.084, reliefOpacity 0.32; import-free"
  - "npm run tokens:build; data:check (and so lint and CI) runs tokens:build -- --check"
  - "data/__tests__/tokens.test.ts: 6 parity tests"
affects: [09-08, 09-12]

actuals:
  tokens: 3400
  tasks: 2
  commits: 2
plan_head_before: 1eb71243193e53498c7c6e335b27b618efc00009
plan_head_after: f40508a842d60ab8ec14289dcbe17bd565146676

tech-stack:
  added: []
  patterns:
    - "Shader colours come only from data/generated/tokens.ts, generated from app/globals.css; no hex typed into a Three.js material"
    - "sRGB floats are the unquantised gamut-mapped coords (6 dp); hex is their 8-bit rounding, so both agree within 0.5/255"

key-files:
  created:
    - scripts/tokens/build-tokens.mjs
    - data/generated/tokens.ts
    - data/__tests__/tokens.test.ts
  modified:
    - package.json
    - .gitattributes

key-decisions:
  - "tokens.srgb holds the unquantised gamut-mapped sRGB coords rounded to 6 dp (not hex/255); firn-50 red is 0.931425 = 237.51/255, inside the 0.5/255 tolerance of #ee"
  - "The five shader colours must be opaque (alpha 1) or the generator fails; --relief-opacity and the --color-contour alpha must be finite and within 0-1, and an empty --relief-opacity is rejected (Number('') would read as 0)"
  - "The generator resolves paths from its own location, not the cwd, and accepts only --check; tokens:build runs plain node (the script imports no .ts, so no MODULE_TYPELESS flag)"
  - "The generated file follows the terrain.ts precedent and is not Prettier-formatted (JSON.stringify output); the generator script is"

patterns-established:
  - "Generated colour contract: any new shader colour is added to COLORS in build-tokens.mjs, never typed into a component"

requirements-completed: [HOME-02]

coverage:
  - id: D1
    description: "data/generated/tokens.ts generated from app/globals.css: night-950 #08101a / firn-50 #eeebe5 with floats within 0.5/255, five lowercase hex, channels in [0,1], contourAlpha 0.14, contourMinorAlpha 0.084, reliefOpacity 0.32, no import line"
    requirement: HOME-02
    verification:
      - kind: unit
        ref: "data/__tests__/tokens.test.ts#generated shader tokens (D-17, 09-UI-SPEC \"Night-tinted relief\")"
        status: pass
    human_judgment: false
  - id: D2
    description: "npm run tokens:build -- --check prints 'tokens: OK' on a fresh tree and 'tokens: stale data/generated/tokens.ts' with exit 1 after a source edit; it runs inside data:check and so inside npm run lint"
    requirement: HOME-02
    verification:
      - kind: other
        ref: "npm run lint (data:check output contains 'tokens: OK', exit 0)"
        status: pass
      - kind: manual_procedural
        ref: "drift proof: --relief-opacity 0.33 in app/globals.css -> 'tokens: stale data/generated/tokens.ts', exit 1; git checkout -- app/globals.css -> 'tokens: OK', exit 0"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 04: Generated shader colour tokens Summary

**`scripts/tokens/build-tokens.mjs` converts five tokens from `app/globals.css` (night-950, night-900, firn-50, mist-300, glacier-400) to gamut-mapped sRGB hex and 0-1 floats with colorjs.io. It also reads the contour alpha (0.14, intermediate 0.084) and `--relief-opacity` (0.32) and writes all of them to an import-free `data/generated/tokens.ts`. A byte-compared `--check` runs inside `npm run lint`, so the 09-08 shader can only use the colours the CSS poster uses.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-25T00:05:43Z
- **Completed:** 2026-10-25T00:10:27Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- The generator parses every `:root` / `@theme` / `@theme inline` / `@theme static` block with the same BLOCK rule as the contrast guard. It strips comments, resolves `var()` chains (failing on a cycle or an undeclared reference) and fails with `tokens: <token>: <problem>` on a missing token, a non-finite number or an alpha or opacity outside 0-1. Probed: removing `--mist-300` gives `tokens: --mist-300: missing`, and `--relief-opacity: 1.5` is rejected as outside 0-1.
- Generated values: night950 `#08101a` [0.032238, 0.062102, 0.10086], night900 `#0f1823`, firn50 `#eeebe5` [0.931425, 0.920749, 0.898926], mist300 `#aab2bb`, glacier400 `#70d5ed`, contourAlpha 0.14, contourMinorAlpha 0.084, reliefOpacity 0.32. All five colours are inside the sRGB gamut, so `toGamut()` changed nothing.
- `npm run tokens:build` (write) and `tokens:build -- --check` (the last step of `data:check`). `.gitattributes` pins the generated file to LF, so the byte check holds under `core.autocrlf=true`.
- 6 unit tests pin the D-17 parity numbers. They fail on a tampered generated file.

## Task Commits

1. **Task 1 (tracer): globals.css -> colorjs.io generator -> tokens.ts -> --check in lint**: `aff2043` (feat)
2. **Task 2: unit test of the generated values + recorded drift proof**: `f40508a` (test)

## Tracer gate
Interactive run, `human_verify_mode` end-of-phase, `<verify>` automated only. I re-ran it after the commit: `tokens: OK`, and `npm run lint` exits 0 with `tokens: OK` in the data:check output. Then I continued to Task 2.

## Drift proof (Task 2, not committed)
- Tamper: `--relief-opacity: 0.32;` changed to `0.33;` in `app/globals.css`.
- `npm run tokens:build -- --check` printed **`tokens: stale data/generated/tokens.ts`** and exited with **code 1**.
- `git checkout -- app/globals.css`: `git status --short app/globals.css` printed nothing, and `npm run tokens:build -- --check` printed `tokens: OK` (exit 0).
- Second probe on the generated file itself: changing `"night950"` to `#08101b` and `reliefOpacity` to 0.33 in `data/generated/tokens.ts` made `--check` print `tokens: stale data/generated/tokens.ts` (exit 1) and made 3 of the 6 Jest tests fail on their assertions (hex `#08101a` vs `#08101b`, channel delta 0.00502 > 0.00196, 0.32 vs 0.33). I reverted it with `git checkout -- data/generated/tokens.ts`.

## TDD note
Task 2 is test-only (`<files>` is just `data/__tests__/tokens.test.ts`), and Task 1, the tracer, had already generated the module, as the plan orders. So the suite passed on its first run and works as a characterisation test, with no RED commit. To show it can fail, I ran it against the tampered generated file above, where it failed on assertions with no load or import fault.

## Files Created/Modified
- `scripts/tokens/build-tokens.mjs`: the generator (write, `--check`, usage line on any other argument).
- `data/generated/tokens.ts`: the generated shader constants (two header lines, `export const tokens = {...} as const;`).
- `data/__tests__/tokens.test.ts`: the parity tests (hex, floats within 0.5/255, gamut, hex = rounding of floats, alphas, no import).
- `package.json`: `tokens:build` script; `data:check` ends with `&& npm run tokens:build -- --check`.
- `.gitattributes`: `data/generated/tokens.ts text eol=lf`.

## Decisions Made
- `srgb` holds the unquantised coords (6 dp), as the plan says ("coords rounded to 6 decimals"), not hex / 255. Each float is within 0.5/255 of its hex byte, and a test asserts that.
- Opaque-only shader colours, unit-interval alphas and opacity, and an empty `--relief-opacity` rejected (see key-decisions).
- `tokens:build` runs plain `node` because the script imports no `.ts` file.

## Deviations from Plan

None. The plan was executed as written. Small additions inside the plan's scope:
- The generator also rejects a non-opaque shader colour and an empty `--relief-opacity`. Both fall under the plan's "non-finite number / alpha outside 0-1" failure class.
- The test file has one extra test beyond the behavior block: each hex is the 8-bit rounding of its floats.

**Total deviations:** 0.
**Impact on plan:** none.

## Issues Encountered
- None. `npm run lint` still prints 24 React Compiler / legacy warnings, all in pre-existing files (AnimatedGradientMesh, GlassmorphismNav, HologramTerminal, PhotoCarousel3D, useProgressiveTextures and others). The new files are eslint-clean.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- 09-08 (3D terrain) imports `tokens` from `@/data/generated/tokens`: `uSurface` = `tokens.srgb.night950`, the highlight and contour colour = `tokens.srgb.firn50`, the alphas = `tokens.contourAlpha` / `tokens.contourMinorAlpha`, the relief = `tokens.reliefOpacity`, and the clear colour = `tokens.hex.night950`.
- 09-12 tunes `--relief-opacity`: after any edit to `app/globals.css`, run `npm run tokens:build`, or lint fails with `tokens: stale data/generated/tokens.ts`.

## Self-Check: PASSED
- All 5 key files exist on disk. Commits `aff2043` and `f40508a` are ancestors of HEAD (measured `git rev-list --count 1eb7124..HEAD` = 2).
- Acceptance: `tokens:build -- --check` appears once in package.json, `tokens.ts text eol=lf` once in .gitattributes, `"night950": "#08101a"` once in tokens.ts, and tokens.ts has 0 lines starting with `import`. `git status --short app/globals.css` is empty after the drift proof.
- Verification: `npx jest data/__tests__/tokens.test.ts` 6/6. Full Jest 36 suites, 486/486. `npm run guard:tests` reports jest 486 + e2e 124 = 610 (baseline 533), OK. `npm run lint` and `npm run type-check` exit 0.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*
