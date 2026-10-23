---
phase: 07-foundation-guardrails
plan: 20
subsystem: tooling
tags: [guards, lint, palette-guard, white-black-ratchet, contrast, colorjs.io, wcag, tailwind-v4, source-detection, dark-variant, zero-diff, dsgn-05, dsgn-06, guard-04, guard-05, build-step-8d]

requires:
  - phase: 07-19
    provides: "Stock palette count 0 across app, components, lib, data, e2e (all four 8c map groups done), so the palette guard can start at 0; the 10 deliberate white/black utilities in the Photos group"
  - phase: 07-15
    provides: "dark: utilities gone from code (count 0); only the temporary @custom-variant dark in app/globals.css left"
  - phase: 07-14
    provides: "Class-based @custom-variant dark plus the permanent dark class on <html> (LOCKED shell contract)"
  - phase: 07-09
    provides: "Tokens v2 L1 primitives in :root and the 16 L2 semantic tokens in @theme inline that the contrast check reads"
provides:
  - "@custom-variant dark removed from app/globals.css; no dark: variant exists anywhere; zero pixel diff (CI Visual Regression green, no re-baseline)"
  - "scripts/guards/check-palette.mjs (GUARD-04): raw-text guard over app, components, lib, data, e2e (every __tests__ included; .ts .tsx .mjs .js .css) with rule families dark, stock, wb, variant, png, v1names, emoji; read-only unless --update; --update refuses to raise a count"
  - "scripts/guards/palette-ratchet.json: 8 files, 17 white/black utilities; a higher count fails, a lower count fails until --update records it"
  - "scripts/guards/check-contrast.mjs (GUARD-05): reads :root and every @theme block of app/globals.css, resolves var() chains with cycle detection, classifies --color-* names, measures the 28 UI-SPEC pairs with colorjs.io WCAG21 as raw floats; contrast: OK (28 pairs)"
  - "npm run lint = eslint . && guard:parity && guard:palette && guard:contrast && guard:selftest (selftest 45/45: 12 palette + 8 contrast cases new)"
  - "scripts/verify-contrast.mjs, its postbuild hook, the verify-contrast npm script and wcag-contrast (plus its transitive relative-luminance, esm) removed; colorjs.io 0.7.1 devDependency added"
  - "@source not for ../.planning, ../.claude, ../graphify-out and ../scripts in app/globals.css: compiled CSS has 0 dark and 0 stock selectors (was 32 / 126)"
affects: [07-21, 07-22, 07-23, 07-24, 07-25, 09, 10, 11, 12]

actuals:
  tokens: 12877   # chars/4 over `git diff 6453c95..565f319` (51506 chars, 28 files, 846+/321-); 12064 without package-lock.json
  tasks: 3
  commits: 2      # measured: git rev-list --count 6453c95..HEAD = 2 (9656640, 565f319), before the docs commits
plan_head_before: 6453c954d2814de40b3f2d2199e65e86398ba017
plan_head_after: 565f319790df97a257d6428a270549e3af68a889

tech-stack:
  added: ["colorjs.io 0.7.1 (devDependency, ESM-only, used only from scripts/guards/*.mjs)"]
  removed: ["wcag-contrast 3.0.0 (with transitive relative-luminance 2.0.1, esm 3.2.25)"]
  patterns:
    - "Raw-text palette guard plus a per-file white/black ratchet that only decreases (--update refuses a raise; a lower count must be recorded)"
    - "Contrast pairs measured from the live globals.css tokens, never a hand-copied table; unknown --color-* names and missing pair tokens fail"
    - "Tailwind v4 source detection is fenced with @source not so docs and guard fixtures cannot emit phantom utilities"

key-files:
  created:
    - scripts/guards/check-palette.mjs
    - scripts/guards/palette-ratchet.json
    - scripts/guards/check-contrast.mjs
    - scripts/guards/__selftest__/palette/** (good, bad-dark, bad-stock, bad-wb, wb-tighten, bad-png, bad-emoji, bad-variant, bad-v1names)
    - scripts/guards/__selftest__/contrast/*.css (at-threshold, below-threshold, low-ink, unknown-token, missing-danger, empty, var-cycle)
  modified:
    - app/globals.css
    - package.json
    - package-lock.json
    - scripts/guards/selftest.mjs
    - scripts/README.md
  deleted:
    - scripts/verify-contrast.mjs

key-decisions:
  - "Dark variant removed and both guards enabled in lint (9656640 GUARD-04, 565f319 GUARD-05); zero-diff gate passed: CI run 40010907977 on ci/07-20 green (Visual Regression with no re-baseline, Lint and Type Check running the full guard chain, Unit, E2E, Build); Tim approved the gate"
  - "The dark class stays on <html> in app/layout.tsx: the LOCKED shell contract wins over the UI-SPEC wording 'remove the @custom-variant and the dark class'; without the custom variant the class is inert"
  - "@source not \"../.planning\", \"../.claude\", \"../graphify-out\", \"../scripts\" added to app/globals.css (resolves the 07-15 concern): without the custom variant Tailwind's default dark: compiles to prefers-color-scheme: dark, so phantom dark: candidates from Markdown docs would have emitted media rules; ../scripts because selftest expected-output strings emitted stock classes. Compiled CSS 113,128 B / 32 dark / 126 stock selectors -> 66,708 B / 0 / 0, strict subset"
  - "Emoji rule ships but guard:palette runs with --skip emoji until 07-25 (2 hits: components/Footer.tsx:186, lib/email.ts:123); exempt (C) (R) (TM), flagged check marks U+2713/2714/2717/2718 (RESEARCH reading), allowed prompt glyph U+276F"
  - "colorjs.io recorded as ^0.7.1 (npm default range); the lockfile pins 0.7.1 with the audited integrity and CI uses npm ci"
  - "GUARD-04, GUARD-05, DSGN-05 and DSGN-06 Complete: requirements.ready-ids 07-20-PLAN.md reports all four ready (07-20 is the last declaring plan)"

patterns-established:
  - "New white/black utilities need a ratchet edit that can only go down: deliberate scrims are recorded once, any growth fails lint"
  - "Any compiled-CSS reasoning must account for Tailwind source detection; non-code directories that mention class names go under @source not"

# Copied verbatim from the PLAN's `requirements`. All four are flipped in REQUIREMENTS.md:
# requirements.ready-ids 07-20-PLAN.md -> ready [GUARD-04, GUARD-05, DSGN-05, DSGN-06], blocked [].
requirements-completed: [GUARD-04, GUARD-05, DSGN-05, DSGN-06]

coverage:
  - id: D1
    description: "The temporary @custom-variant dark is removed and no dark: variant remains; removing it changes no pixel"
    requirement: DSGN-05
    verification:
      - kind: other
        ref: "grep -c '@custom-variant' app/globals.css = 0 (close-out re-run); palette guard dark + variant rules report 0"
        status: pass
      - kind: automated_ui
        ref: "CI run 40010907977 Visual Regression PASS https://github.com/tlex-web/portfolio-app/actions/runs/40010907977/job/120610726622, no re-baseline; check-snapshot-commit --sha HEAD --none and --sha HEAD^ --none OK (0 changed, close-out re-run)"
        status: pass
    human_judgment: false
  - id: D2
    description: "npm run lint fails on dark:, stock palette, white/black ratchet breach, non-linux PNG, @custom-variant, v1 names in shell files and (once enabled) emoji"
    requirement: GUARD-04
    verification:
      - kind: unit
        ref: "node scripts/guards/selftest.mjs -> 45/45 (12 palette cases incl. --update raise refused with the ratchet byte-identical); npm run guard:palette -> palette: OK (close-out re-run)"
        status: pass
      - kind: other
        ref: "CI Lint and Type Check PASS https://github.com/tlex-web/portfolio-app/actions/runs/40010907977/job/120610726904"
        status: pass
    human_judgment: false
  - id: D3
    description: "Contrast check reads every token from app/globals.css and enforces the 28 UI-SPEC pairs in lint, failing on bad, unknown or missing tokens"
    requirement: GUARD-05
    verification:
      - kind: unit
        ref: "npm run guard:contrast -> contrast: OK (28 pairs); selftest 8 contrast cases pass; mutation checks (>= to >, unknown-token check removed) both caught"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every page is on tokens v2 with the stock palette now blocked in CI, v1 names survive only as aliases and are banned in new shell files"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "palette guard stock rule 0 hits over the full scan set; v1names rule covers components/site/**, components/providers/**, data/site.ts (selftest bad-v1names)"
        status: pass
    human_judgment: false

duration: about 13 min by commit timestamps (07-19 close-out 6453c95 19:08:15Z to 565f319 19:21:02Z); push CI run 40010907977 ran 19:22:30Z-19:46:52Z, then Tim approved the gate
completed: 2026-10-23
status: complete
---

# Phase 7 Plan 20: Dark variant removed, palette and contrast guards enabled in lint (build step 8d)

**`9656640` deletes the temporary `@custom-variant dark` and adds `check-palette.mjs`: a raw-text guard for dark:, stock palette, non-linux PNGs and v1 names in shell files, plus a per-file white/black ratchet (17 utilities in 8 files). `565f319` replaces the hand-copied `verify-contrast.mjs` with `check-contrast.mjs`, which reads `app/globals.css` through colorjs.io and passes all 28 UI-SPEC pairs. Both guards run in `npm run lint`, and the selftest proves each can fail. CI run 40010907977 is green with zero visual diff, and the staged dark: removal (neutralise, collapse, map, remove) is complete.**

## Performance

- **Duration:** about 13 min of task work by commit timestamps (`6453c95` 19:08:15Z, `9656640` 19:16:54Z, `565f319` 19:21:02Z). Push CI run 40010907977 ran 19:22:30Z-19:46:52Z, then Tim approved the gate.
- **Tasks:** 3/3
- **Files modified:** 28 (incl. 1 deletion and 1 empty PNG fixture)

## Accomplishments
- **Dark variant removed (DSGN-05):** `@custom-variant dark` is gone (`grep -c` = 0). The `dark` class stays on `<html>`; see Decisions.
- **Palette guard (GUARD-04):** `check-palette.mjs` uses the RESEARCH FAM/PRE/STOCK/DARK/WB regexes and scans app, components, lib, data and e2e (`.ts .tsx .mjs .js .css`, every `__tests__` included, `node_modules` and `*-snapshots` skipped). Rules: `dark`, `stock` (CSS `@apply` included), `variant`, `wb`, `png`, `v1names`, `emoji`. It only reads files unless `--update` is passed; two runs left the ratchet unchanged. `guard:palette` runs `--skip emoji` until 07-25.
- **White/black ratchet**, created with `--update`:

  | File | Count |
  |------|-------|
  | app/page.tsx | 5 (from-black/80, via-black/40, text-white x3) |
  | components/PhotoCarousel3D.tsx | 4 |
  | components/ImageDetailModal.tsx | 2 |
  | components/PhotosPageClient.tsx | 2 |
  | components/GalleryGrid.tsx | 1 |
  | components/Header.tsx | 1 |
  | components/InteractiveHotspot.tsx | 1 |
  | components/MountainTerrain3D.tsx | 1 |
  | **Total** | **17 in 8 files** |

- **Contrast check (GUARD-05):** `check-contrast.mjs` reads `:root`, `@theme`, `@theme inline` and `@theme static` and resolves `var()` chains, failing on a cycle. It classifies `--color-*` names as SEMANTIC, ALIAS (v1, skipped) or DECORATIVE (line, contour); any other name fails as unknown. It prints the 28 pairs in UI-SPEC order. All pass. Lowest text pair: danger/surface-overlay 6.18. Lowest non-text pair: line-strong/surface-overlay 4.17. Values match UI-SPEC to two decimals except two rounding cases that RESEARCH predicted: ink-inverse/accent-hover 13.61 (spec 13.62) and danger/surface-raised 6.74 (spec 6.73).
- **Old tooling removed:** `scripts/verify-contrast.mjs` (`git rm`), the `verify-contrast` script, the `&& node scripts/verify-contrast.mjs` part of `postbuild` (`inject-build-hash` kept) and `wcag-contrast`. `scripts/README.md` now describes the guards.
- **Lint chain:** `eslint . && npm run guard:parity && npm run guard:palette && npm run guard:contrast && npm run guard:selftest`.

## Task Commits

1. **Task 1 (tracer): Remove the dark variant and enable the palette guard in lint** - `9656640` (feat), body "zero-diff (8d)".
2. **Task 2 (tdd): Contrast check from globals.css with colorjs.io** - `565f319` (feat). One commit, as the plan specifies (plan type `execute`, tdd_mode off, so tdd.md's separate RED-commit gate does not apply). RED: `selftest.mjs --tap` exit 1, 37 pass / 8 fail, all 8 new contrast cases failing because the behaviour did not exist yet. GREEN: 45/45. Mutation checks (`>=` to `>`; unknown-token check removed) were both caught. The record is in `.git/gsd-red/07-20-red.json`.
3. **Task 3: Zero-diff gate** (checkpoint:human-action, blocking-human). No commit. `565f319` was pushed to `ci/07-20` with a plain push to a new branch. The plan text says `--force`, but force-pushes to `ci/*` are blocked, and a plain push is equivalent for a new branch. CI run 40010907977 succeeded. Tim replied "approved".

`git rev-list --count 6453c95..HEAD` = 2, measured from the plan ledger.

**Plan metadata:** the docs commits that follow this SUMMARY.

## Files Created/Modified
- `app/globals.css` - `@custom-variant dark` and its comment removed; four `@source not` lines added (deviation 1).
- `scripts/guards/check-palette.mjs`, `scripts/guards/palette-ratchet.json` - GUARD-04 guard and ratchet.
- `scripts/guards/check-contrast.mjs` - GUARD-05 check (`PAIRS`, `SEMANTIC`, `WCAG21`).
- `scripts/guards/selftest.mjs` - 12 palette and 8 contrast cases (45 total).
- `scripts/guards/__selftest__/palette/**`, `scripts/guards/__selftest__/contrast/*.css` - fixtures.
- `package.json`, `package-lock.json` - guard scripts, lint chain, postbuild, colorjs.io in, wcag-contrast out.
- `scripts/README.md` - guards documented; `scripts/verify-contrast.mjs` deleted.

## Decisions Made
- **`dark` class kept on `<html>`.** The UI-SPEC says "remove the @custom-variant and the dark class". The LOCKED shell contract `<html lang="en" class="dark ...fonts">` wins, as the plan directs. Without the variant the class does nothing.
- **Emoji rule interpretation (RESEARCH reading):** the rule exempts the copyright, registered and trademark signs. It flags the check marks U+2713, U+2714, U+2717 and U+2718, and allows U+276F (prompt glyph). It currently has 2 hits, `components/Footer.tsx:186` (heart) and `lib/email.ts:123` (sparkles), which are skipped until 07-25.
- **Palette selftest, 12 cases:** pass cases are good, emoji with `--skip`, and `--update` lowering a count. Fail cases are dark; stock in an object map; wb above the ratchet; wb below it ("ratchet can tighten"); a non-linux PNG; an emoji in a data map; `@custom-variant` plus stock in a CSS `@apply`; a v1 name in `components/site`; and an `--update` raise, which is refused with the temp ratchet left byte-identical.
- **Contrast selftest, 8 cases:** the real globals.css passes. A pair at exactly 4.50 passes and one at 4.49 fails (raw float compare). Ink at 3.00 on surface fails and names the pair. An unknown `--color-foo` fails, as do a missing `--color-danger` ("missing token for pair danger/surface"), a file with no `:root`/`@theme` block, and a `var()` cycle.
- **Package gate (T-07-SC, T-07-27):** before install, `npm view colorjs.io@0.7.1` matched the audit. Integrity `sha512-LY7OHnJZxHwT5UlzNa9bbhHHDbzB6yE5+3MIPwJEQKRvSCt/T4G7epsj+9j2BExUIIfXFIJGsIXUKdfrK9Q5tA==`, MIT, color-js/color.js, latest 0.7.1, no install hooks, no dependencies. The lockfile records the same integrity. `package-lock.json` diff is +11/-34: colorjs.io 0.7.1 added; wcag-contrast 3.0.0 and its only transitive dependencies, relative-luminance 2.0.1 and esm 3.2.25, removed; no other version changed. `package.json` says `^0.7.1` (npm default range). The lockfile pins 0.7.1 and CI uses `npm ci`.
- **Staged dark: removal order (backstop must-have), visible in git history:** neutralise `5737aeb` (07-14), then collapse `0951de8` and `d114b42` (07-15), then map `1807682`, `b7b56cf`, `2d87a01` and `baffad8` (07-16..07-19), then remove `9656640` (07-20).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] `@source not` fences in app/globals.css**
- **Found during:** Task 1. This was carried as a STATE concern from 07-15 and is not in the plan text.
- **Issue:** Tailwind v4 source detection reads tracked Markdown under `.planning` and `.claude` (plus `graphify-out`). Without the custom variant, the default `dark:` compiles to `@media (prefers-color-scheme: dark)`, so phantom `dark:` candidates in docs would have emitted OS-dependent rules and broken DSGN-05. `scripts/guards/selftest.mjs` expected-output strings also emitted `.text-amber-400` and `.hover:text-red-500/80`.
- **Fix:** `@source not "../.planning"; "../.claude"; "../graphify-out"; "../scripts"`. The whole of `../scripts` is excluded, not only `__selftest__`, because the strings are in `selftest.mjs` itself. The syntax was checked against the installed tailwindcss 4.3.0 `dist/lib.js`. Negated paths that do not exist compile fine; CI has no `.claude` or `graphify-out`, and neither is gitignored.
- **Verification:** emitted CSS in `.next/static/**/*.css`:

  | Build | Files | Bytes | dark selectors | stock selectors |
  |-------|-------|-------|----------------|-----------------|
  | before | 2 | 113,128 | 32 | 126 |
  | after | 1 | 66,708 | 0 | 0 |

  The after build is a strict subset of the before build: 0 entries added, 1,004 removed over 459 selectors. Every removed name that also appears as text in app, components, lib or data was checked and is a substring false positive. No component builds class names with template literals (grep `(bg|text|border|from|to|via|ring|fill|stroke)-\${` returns no hits), so the exclusion cannot strip a used class. Next merged the 5 KB `@font-face` chunk into the main chunk (unlayered fonts against layered utilities). The cascade is unaffected, as the zero-diff gate shows.
- **Committed in:** `9656640`.

**2. [Rule 3 - Blocking] Plain push instead of `--force` for `ci/07-20`.** Force-pushes to `ci/*` are blocked in this environment. A plain push to a new branch gives the same result.

---

**Total deviations:** 2 (1 missing critical, 1 blocking)
**Impact on plan:** Deviation 1 was needed to keep DSGN-05 true once the variant was gone, and it removed 41% of the emitted CSS bytes with no pixel change. No scope creep.

## Issues Encountered
- None blocking. Full local run after both commits: `npm run lint` exit 0 (0 errors, 54 pre-existing warnings, none in the new guard files); `npm run type-check` 0; Jest 9/9 suites, 82/82; `npm run build` exit 0, and postbuild ran only `inject-build-hash` (`public/service-worker.js` was restored afterwards).

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-26 (ratchet tampering):** mitigated. `--update` refuses a raise, a lower count fails until recorded, and the selftest proves the refusal.
- **T-07-27 / T-07-SC (colorjs.io):** mitigated by the package gate above. It is a devDependency, used only from `.mjs` guards and never shipped.

## User Setup Required
None new from this plan. The two 07-USER-SETUP.md items are still open with Tim (Vercel build log Node 24.x / `npm ci`; required status checks on `main`).

## Next Phase Readiness
- **Ready for 07-21** (shell identity data and SiteChrome components). New files in `components/site/**`, `components/providers/**` and `data/site.ts` are now checked by the v1names rule. Any white/black utility there would fail the ratchet, which has no entry (that is, 0) for new files.
- **07-25** drops `--skip emoji` once `lib/email.ts:123` is gone and `components/Footer.tsx` has no importers.
- **Still open, not covered by this guard:** the Hero3DMountain badge (v1 aliases, not a UI-SPEC token pair) and the inline hex/rgba colours that a class-based guard cannot see (STATE concerns from 07-10, 07-16 and 07-18).
- **Pushing:** `565f319` is on `origin/ci/07-20`. The docs commits stay local.

## Verification (close-out, 2026-10-23)

| Check | Result |
|-------|--------|
| `npm run guard:contrast` (script run directly) | `contrast: OK (28 pairs)`, exit 0 |
| `check-palette.mjs --skip emoji` | `palette: OK`, exit 0 |
| `check-palette.mjs` (emoji on) | 2 violations (Footer.tsx:186, email.ts:123), as expected until 07-25 |
| `node scripts/guards/selftest.mjs` | `selftest: 45/45 cases passed` |
| `check-snapshot-commit.mjs --sha HEAD --none` / `--sha HEAD^ --none` | `snapshot-commit: OK (0 changed)` both |
| `grep -c "@custom-variant" app/globals.css` | 0 |
| CI run 40010907977 (push, `ci/07-20`, `565f319`) | success: Visual Regression 120610726622, Lint and Type Check 120610726904, Unit Tests 120610726570, E2E Tests 120610726687, Build Application 120611123488 |
| `requirements.ready-ids 07-20-PLAN.md GUARD-04 GUARD-05 DSGN-05 DSGN-06` | ready [GUARD-04, GUARD-05, DSGN-05, DSGN-06], blocked [] |

## Self-Check: PASSED
- `9656640` and `565f319` are ancestors of HEAD; `git rev-list --count 6453c95..HEAD` = 2 from the plan ledger.
- Created files exist (`check-palette.mjs`, `palette-ratchet.json`, `check-contrast.mjs`, fixtures); `scripts/verify-contrast.mjs` is absent.
- Guards, selftest and snapshot checks were re-run at close-out and pass.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-23*
