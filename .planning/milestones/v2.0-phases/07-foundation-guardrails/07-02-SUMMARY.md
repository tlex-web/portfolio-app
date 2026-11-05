---
phase: 07-foundation-guardrails
plan: 02
subsystem: infra
tags: [eslint, jsx-a11y, flat-config, eslint-config-next, react-compiler, guards, pixel-neutral]

requires:
  - phase: 07-01
    provides: "npm run lint = eslint . && guard:parity && guard:selftest; selftest case table in scripts/guards/selftest.mjs"
provides:
  - "eslint.config.mjs: flat config (next core-web-vitals + typescript, jsx-a11y recommended at error, LEGACY_COMPILER_FILES warn override, prettier/flat, globalIgnores)"
  - "eslint-plugin-jsx-a11y 6.10.2 as a direct devDependency; FlatCompat deps removed"
  - "selftest case 'a11y probe' (GUARD-06 proven able to fail)"
  - "scripts/guards/same-classnames.mjs <git-ref> | --files <before> <after>: className-literal parity check for zero-diff plans"
  - "npm run lint green: 0 errors, 48 warnings"
affects: [07-03, 07-04, 07-05, 07-06, 07-07, 07-08, phase-9, phase-10, phase-12]

actuals:
  tokens: 5957
  tasks: 2
  commits: 2
plan_head_before: 0e96235d336b343116e36b3fc5927edfe0d0829e
plan_head_after: 96f79377127ec3fe17dfc5e427e327e85ea489c9

tech-stack:
  added: [eslint-plugin-jsx-a11y@6.10.2 (direct; was already transitive)]
  patterns:
    - "Lint config is defineConfig + globalIgnores from eslint/config; presets are spread, overrides are file-scoped blocks"
    - "Disables are eslint-disable-next-line with exact rule ids and a '-- reason' naming the phase that removes the code"
    - "Inside JSX children a disable is written {/* eslint-disable-next-line ... */}; a bare // there renders as text"
    - "Zero-diff plans run node scripts/guards/same-classnames.mjs <ref> before committing"
    - "Guard fixtures that look like source use a .txt suffix so tsc, Jest and ESLint never pick them up"

key-files:
  created:
    - scripts/guards/same-classnames.mjs
    - scripts/guards/__selftest__/same-classnames/before.tsx.txt
    - scripts/guards/__selftest__/same-classnames/after-neutral.tsx.txt
    - scripts/guards/__selftest__/same-classnames/after-changed.tsx.txt
  modified:
    - eslint.config.mjs
    - package.json
    - package-lock.json
    - scripts/guards/selftest.mjs
    - app/page.tsx
    - app/roadmap/page.tsx
    - app/contact/page.tsx
    - app/error.tsx
    - components/FeedbackForm.tsx
    - components/ImageDetailModal.tsx
    - components/GlassmorphismNav.tsx
    - components/__tests__/GalleryGrid.test.tsx

key-decisions:
  - "jsx-a11y recommended rules run at error on **/*.{jsx,tsx}; React Compiler rules (purity, immutability, set-state-in-effect, refs) warn only for the 10 LEGACY_COMPILER_FILES, a list that must shrink to zero by Phase 12"
  - "All four react-hooks rule ids exist in the installed eslint-plugin-react-hooks 7.0.1 (not 7.1.1 as RESEARCH assumed), so none was dropped"
  - "same-classnames.mjs compares every string/template literal inside className={...}, not just plain className=\"...\", and adds a --files mode so the selftest can prove it fails"
  - "app/gradient-mesh/**, components/TransitionShowcase.tsx and components/TerminalDemo.tsx sit in globalIgnores until plan 07-04 deletes them"

patterns-established:
  - "selftest cases may pass stdin (input) and a cwd, so tool probes (eslint --stdin) live in the same table as script guards"

requirements-completed: [GUARD-06]

coverage:
  - id: D1
    description: "npm run lint runs eslint-config-next core-web-vitals + typescript with every jsx-a11y recommended rule at error level"
    requirement: GUARD-06
    verification:
      - kind: other
        ref: "grep eslint.config.mjs for jsxA11y.flatConfigs.recommended.rules, eslint-config-next/core-web-vitals, eslint-config-next/typescript, eslint-config-prettier/flat, globalIgnores( -> 5/5; FlatCompat -> 0"
        status: pass
      - kind: other
        ref: "npx eslint eslint.config.mjs -> exit 0, no 'Could not find rule' / 'Cannot find package'"
        status: pass
    human_judgment: false
  - id: D2
    description: "A jsx-a11y violation fails lint, proven by the selftest 'a11y probe' (div onClick via eslint --stdin -> exit 1 with jsx-a11y/ rule ids)"
    requirement: GUARD-06
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#a11y probe"
        status: pass
      - kind: other
        ref: "negative control: same probe with the two rules downgraded via --rule ...: warn -> exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "npm run lint exits 0 on the repo with zero errors (warnings only)"
    requirement: GUARD-06
    verification:
      - kind: other
        ref: "npm run lint -> exit 0; eslint . -> 0 errors, 48 warnings; selftest 12/12"
        status: pass
    human_judgment: false
  - id: D4
    description: "The source fixes are pixel-neutral: className literals identical in every touched TSX file, Jest count unchanged"
    verification:
      - kind: other
        ref: "node scripts/guards/same-classnames.mjs HEAD (before the Task 2 commit) and ... e649f92 (after) -> OK, 8 files compared"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#same-classnames: a changed className literal fails"
        status: pass
      - kind: unit
        ref: "npx jest --silent -> 66 passed, equal to test-count.baseline.json jest 66"
        status: pass
    human_judgment: false
  - id: D5
    description: "The rendered pages look identical to before (entity escapes, <a> to <Link>, JSX comments)"
    verification: []
    human_judgment: true
    rationale: "No visual baselines exist until 07-03. Neutrality is argued from the className check and the nature of the edits (&apos; decodes to ', Link renders the same <a>, JSX comments render nothing). The first 07-03 baseline run is the real proof"

duration: 6min
completed: 2026-10-10
status: complete
---

# Phase 7 Plan 02: Flat ESLint config with jsx-a11y at error (GUARD-06) Summary

**`eslint.config.mjs` is now the validated flat config: Next core-web-vitals + typescript, every jsx-a11y `recommended` rule at error, React Compiler rules downgraded to warn for 10 legacy v1 files, and `prettier/flat`. A selftest stdin probe proves an a11y violation fails lint. The 20 residual errors were fixed without touching any className (checked by the new `same-classnames.mjs` helper), so `npm run lint` is green.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-10T20:11:09Z
- **Completed:** 2026-10-10T20:17:31Z
- **Tasks:** 2/2
- **Files modified:** 16 (3 of them fixture files)

## Accomplishments
- GUARD-06: `npm run lint` (`eslint .`) now runs `eslint-config-next/core-web-vitals` + `/typescript`, with `jsxA11y.flatConfigs.recommended.rules` at error on `**/*.{jsx,tsx}` (Next alone ships 6 a11y rules at warn).
- The selftest `a11y probe` case pipes `export const X = () => <div onClick={() => {}} />;` into `eslint --stdin --stdin-filename probe.tsx` and requires exit 1 plus a `jsx-a11y/` rule id. ESLint exits 2 on config faults, so a broken config cannot pass the case. A negative control (the same rules downgraded to warn) exits 0, so the case really depends on error level (threat T-07-04).
- `LEGACY_COMPILER_FILES` override: `react-hooks/purity`, `immutability`, `set-state-in-effect`, `refs` warn for the 10 listed v1 files only. `@typescript-eslint/no-require-imports` is off for `*.config.js` / `*.cjs`. The `no-unused-vars` warn rule (`argsIgnorePattern: "^_"`) is kept.
- The 20 residual errors are fixed: 12 `&apos;` escapes, one `<a>` to `<Link>`, 3 justified disables (6 rule hits), one `alt=""`. Lint ends at 0 errors and 48 warnings.
- `scripts/guards/same-classnames.mjs` compares sorted className-literal lists between a git ref and the working tree. Later zero-diff plans can reuse it. Two selftest cases prove it passes on neutral edits and fails on a changed class.

## Task Commits

1. **Task 1 (tracer): Validated flat config with jsx-a11y at error, proven by a stdin probe** - `e649f92` (feat)
2. **Task 2: Pixel-neutral fixes until npm run lint has zero errors** - `96f7937` (fix)

Tracer gate: interactive run, `human_verify_mode` end-of-phase, automated-only verify. I re-ran the verify (selftest 10/10, `npx eslint eslint.config.mjs` exit 0), it passed, so I expanded with no checkpoint.

**Plan metadata:** see the final docs commit

## Files Created/Modified
- `eslint.config.mjs` - flat config as above. `globalIgnores` adds `.claude/**`, `.planning/**`, `graphify-out/**`, `project_concept/**`, `public/**`, `scripts/guards/__selftest__/**`, plus 3 temporary entries (`app/gradient-mesh/**`, `components/TransitionShowcase.tsx`, `components/TerminalDemo.tsx`) for plan 07-04 to remove
- `package.json` / `package-lock.json` - `eslint-plugin-jsx-a11y: "6.10.2"` added. `@eslint/compat`, `@eslint/eslintrc`, `@eslint/js` removed (only the old config imported them; `@eslint/eslintrc` and `@eslint/js` stay in the tree as `eslint`'s own deps). The lockfile drops `@eslint/compat` and its `@eslint/core@1.2.1`, and npm recomputed some `dev`/`peer` flags. No package version changed
- `scripts/guards/selftest.mjs` - cases can take `input` (stdin) and `cwd`; adds `a11y probe` and 2 same-classnames cases (12 cases total)
- `scripts/guards/same-classnames.mjs` - `<git-ref>` mode (`git diff --name-status --no-renames <ref> -- app components`, `.ts`/`.tsx` only, added/deleted files reported and skipped) and `--files <before> <after>` mode
- `scripts/guards/__selftest__/same-classnames/*.tsx.txt` - before / neutral-after / changed-after fixtures
- `app/page.tsx` (5), `app/roadmap/page.tsx` (3), `app/contact/page.tsx` (3), `components/FeedbackForm.tsx` (1) - `'` to `&apos;` in JSX text
- `app/error.tsx` - `import Link from 'next/link'`, `<a href="/">` to `<Link href="/">`, className unchanged
- `components/ImageDetailModal.tsx` - disables for `click-events-have-key-events` + `no-noninteractive-element-interactions` (dialog backdrop) and `click-events-have-key-events` + `no-static-element-interactions` (inner panel), reason "Escape is handled on document; replaced by the Phase 10 lightbox"
- `components/GlassmorphismNav.tsx` - disable for `click-events-have-key-events` + `no-static-element-interactions` on the mobile backdrop, reason "component removed from the page tree in build step 9"
- `components/__tests__/GalleryGrid.test.tsx` - `<img alt="" {...rest} />`, so a passed `alt` still wins

## Decisions Made
- **Exact pin** `"6.10.2"` (`--save-exact`). The plan allowed exact or caret. Exact matches the RESEARCH audit verdict for this one version.
- **react-hooks version:** the installed plugin (through eslint-config-next 16.2.6) is 7.0.1, not 7.1.1. All four override rule ids resolve, so nothing was dropped. Residual errors came to 20, not RESEARCH's 16/25 estimate, but all 20 were in the planned classes.
- **Wider className extraction** than the plan's minimum: every string and template literal inside `className={...}` is collected, with comments skipped. A conditional class swap is therefore caught too.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JSX-child disables written as `{/* ... */}`, not `//`**
- **Found during:** Task 2
- **Issue:** The plan says to add `// eslint-disable-next-line ...`. On the ImageDetailModal inner panel and the GlassmorphismNav backdrop, the element is a JSX child, where `//` is JSX text. It would render visibly on the page, which is a rendering change before baselines exist.
- **Fix:** Used `{/* eslint-disable-next-line <rule ids> -- <reason> */}` there (renders nothing). The ImageDetailModal outer `<div>` sits directly after `return (`, so it uses the plain `//` form.
- **Files modified:** components/ImageDetailModal.tsx, components/GlassmorphismNav.tsx
- **Verification:** `eslint .` reports 0 errors and no unused-directive warnings. same-classnames OK
- **Committed in:** `96f7937`

**2. [Rule 2 - Missing critical] Selftest coverage for same-classnames.mjs**
- **Found during:** Task 2
- **Issue:** The 07-01 convention is that every guard is proven able to fail. A git-ref-only helper cannot be exercised from fixtures.
- **Fix:** Added a `--files <before> <after>` mode, 3 fixtures (`.tsx.txt`, so tsc/Jest/ESLint ignore them), and 2 selftest cases (neutral passes, changed class fails with `-`/`+` lines). Ref mode was also checked by hand against `HEAD~40`: it reports 3 files with real className drift and exits 1.
- **Files modified:** scripts/guards/same-classnames.mjs, scripts/guards/selftest.mjs, scripts/guards/__selftest__/same-classnames/
- **Committed in:** `96f7937`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing-critical)
**Impact on plan:** No scope creep. No error outside the planned classes appeared, and no className, JSX structure, hook or effect changed.

## Issues Encountered
- The 48 remaining warnings are allowed by the plan. They are the React Compiler rules in the legacy files (downgraded), plus `no-unused-vars` (6, GalleryGrid test mock), `react-hooks/exhaustive-deps` (3) and `@next/next/no-img-element` (1) in non-legacy files. They are left for the phases that replace those files.
- `npx tsc --noEmit` shows no errors outside the stale, gitignored `.next/dev/types/**` (already noted in 07-01).

## Known Stubs
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 07-03 (visual baselines) can rely on `npm run lint` failing on any a11y regression.
- 07-04 must remove the three temporary `globalIgnores` entries (`app/gradient-mesh/**`, `components/TransitionShowcase.tsx`, `components/TerminalDemo.tsx`) when it deletes those files, and also drop `components/TerminalDemo.tsx` from `LEGACY_COMPILER_FILES`.
- 07-05 (eslint-config-next 16.4.0) will bring react-hooks 7.1.x. RESEARCH says it adds compiler errors in `GeologicalButton.tsx`, `HologramTerminalDemo.tsx` and `lib/useProgressiveTextures.ts`, which are already in the override list. Re-run `npm run lint` there.
- Zero-diff plans run `node scripts/guards/same-classnames.mjs <ref>` before committing.

## Self-Check: PASSED
- All 5 created artifacts were found on disk
- Commits e649f92 and 96f7937 are ancestors of HEAD; `git rev-list --count 0e96235..HEAD` = 2
- Task 1 criteria: 5/5 required strings in eslint.config.mjs, 0 FlatCompat, `"eslint-plugin-jsx-a11y": "6.10.2"`, no `@eslint/eslintrc` in package.json, `a11y probe` PASS
- Task 2 criteria: `npm run lint` exit 0 (0 errors); `<Link` count 1 and `next/link` import in app/error.tsx; `alt=""` in the GalleryGrid test; same-classnames OK vs HEAD before the commit and vs e649f92 after it; Jest 66 = baseline 66
- Plan verification: `npm run lint` exit 0, `guard:selftest` 12/12 including the a11y probe

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-10*
