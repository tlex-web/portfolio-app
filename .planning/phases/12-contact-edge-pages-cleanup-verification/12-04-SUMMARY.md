---
phase: 12-contact-edge-pages-cleanup-verification
plan: 04
subsystem: ui
tags: [tailwind-v4, design-tokens, guards, selftest, cleanup, jest]

requires:
  - phase: 12-02
    provides: "PW_REUSE Playwright switch used by the per-task e2e check"
  - phase: 08-05
    provides: "codemod of every live v1 alias use to its v2 name (aliases had no live user left)"
provides:
  - "Four dead v1 components deleted (Header, Footer, GlassmorphismNav, ContourBackground)"
  - "LEGACY_DEAD_FILES = [] and palette-ratchet.json {} (white/black ratchet at 0)"
  - "app/globals.css without v1 aliases, glow tokens, Phase 4 Crystalline CSS or .hologram-content"
  - "@theme { --color-*: initial; } colour backstop ahead of every --color-* definition"
  - "lib/__tests__/color-backstop.test.ts pinning the backstop position and absence of v1 names"
affects: [12-11, 12-16, 12-18, 12-22]

actuals:
  tokens: 15800
  tasks: 2
  commits: 3
plan_head_before: fbaff05098ed7325e2a5097f4f7037860252e9cf
plan_head_after: 1236b9e9b9e132df0b993c07703de365395291b0

tech-stack:
  added: []
  patterns:
    - "Tailwind v4 namespace reset (`--color-*: initial`) as a compile-time palette backstop, placed before every --color-* definition"
    - "Guard lists drain to empty but keep their helpers (isLegacyDeadFile, assertNoImporters) so call shapes stay stable"
    - "Compiled-selector parity diff (before/after build) as the zero-diff proof for CSS deletions"

key-files:
  created:
    - lib/__tests__/color-backstop.test.ts
    - .planning/phases/12-contact-edge-pages-cleanup-verification/deferred-items.md
  modified:
    - app/globals.css
    - scripts/guards/lib/legacy-dead-files.mjs
    - scripts/guards/palette-ratchet.json
    - scripts/guards/check-palette.mjs
    - scripts/guards/check-contrast.mjs
    - scripts/guards/selftest.mjs
    - scripts/guards/__selftest__/identity (bad-dead-import renamed bad-former-dead-files; good rewritten)
    - scripts/guards/__selftest__/palette (four fixtures renamed bad-*-former-dead* / bad-v1names-alias-defs)
  deleted:
    - components/Header.tsx
    - components/Footer.tsx
    - components/GlassmorphismNav.tsx
    - components/ContourBackground.tsx

key-decisions:
  - "--font-heading went with the 29 deprecated-alias lines: it carried the same marker, and git grep found no font-heading user in app, components, lib, e2e or data"
  - "check-contrast skips a `--<ns>-*` namespace reset instead of reading it as a token (Rule 3: it reported `unknown token --color-*`); its ALIAS skip stays because the contrast fixtures still carry v1 names"
  - "Former dead-file fixtures were renamed bad-*-former-dead* and now expect failures with an exact violation count, which proves no importer or exemption line is printed"
  - "Added one selftest case pinning LEGACY_DEAD_FILES empty and no importer in the repo (85 -> 86 cases)"

patterns-established:
  - "Backstop placement: the colour reset sits directly after the last @source not line"
  - "Comments in kept files and fixtures describe the post-drain rule without naming deleted components"

requirements-completed: [VERIFY-01]

coverage:
  - id: D1
    description: "Four dead v1 components deleted; nothing in app, components, lib or e2e imports them"
    requirement: VERIFY-01
    verification:
      - kind: other
        ref: "git ls-files components/{Header,Footer,GlassmorphismNav,ContourBackground}.tsx prints nothing; git grep in app components lib e2e prints nothing"
        status: pass
      - kind: other
        ref: "npm run type-check"
        status: pass
    human_judgment: false
  - id: D2
    description: "LEGACY_DEAD_FILES empty and white/black ratchet at 0, with every affected selftest case rewritten (none deleted)"
    requirement: VERIFY-01
    verification:
      - kind: unit
        ref: "npm run guard:selftest (86/86, HEAD baseline 85/85)"
        status: pass
      - kind: other
        ref: "npm run lint (palette OK, identity OK, contrast OK 47 pairs)"
        status: pass
    human_judgment: false
  - id: D3
    description: "v1 aliases, glow tokens and Phase 4 / hologram CSS removed; colour reset precedes every --color-* definition"
    requirement: VERIFY-01
    verification:
      - kind: unit
        ref: "lib/__tests__/color-backstop.test.ts (5 tests)"
        status: pass
      - kind: unit
        ref: "data/__tests__/tokens.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Compiled CSS keeps every live selector (parity diff lists only deleted CSS); chromium design-system and shell specs green"
    requirement: VERIFY-01
    verification:
      - kind: other
        ref: "diff selectors-before.txt selectors-after.txt: 23 removals, all traced to deleted CSS, 0 additions"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/design-system.spec.ts e2e/shell.spec.ts --project=chromium (40 passed)"
        status: pass
    human_judgment: true
    rationale: "Pixel zero-diff is confirmed by the visual suite in round 1 (12-11); this plan proves only selector and token parity"

duration: 14min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 04: Dead v1 Components, Drained Guard Lists and Colour Backstop Summary

**Four dead v1 components deleted, LEGACY_DEAD_FILES and the white/black ratchet drained to empty, and the v1 aliases plus their dead CSS removed from app/globals.css. A Tailwind v4 `@theme { --color-*: initial; }` reset now stops stock colour utilities compiling. The compiled-selector diff shows only the deleted CSS changed.**

## Performance

- **Duration:** about 14 min
- **Started:** 2026-11-02T17:25:31Z
- **Completed:** 2026-11-02T17:39:30Z
- **Tasks:** 2
- **Files modified:** 28 (153 insertions, 994 deletions)

## Accomplishments
- Deleted `components/Header.tsx`, `Footer.tsx`, `GlassmorphismNav.tsx` and `ContourBackground.tsx`. GlassmorphismNav was ContourBackground's only importer.
- `LEGACY_DEAD_FILES = []` (its comment states the never-add rule) and `palette-ratchet.json` is `{}`.
- Five selftest cases rewritten to the post-drain rule and one added, so selftest went from 85/85 at HEAD to 86/86. No case was deleted.
- `app/globals.css`, removed: the 29 `@deprecated v1 alias` lines, the `--text-shadow-glow*` tokens and their note, the Phase 4 Crystalline block (ambient/frost/ember glow, strata, contour drift), the unused `.hologram-content` rule set, and the Phase 4 reduced-motion guards. The universal reduced-motion rules stay.
- `@theme { --color-*: initial; }` sits right after the `@source not` lines, ahead of every `--color-*` definition.
- check-palette's v1names alias-definition exemption is removed, and its selftest now fails on an alias definition.

## Selftest counts

| | Cases |
|---|---|
| HEAD before 12-04 (`fbaff05`) | 85/85 passed |
| After Task 1 (`6d725dc`) | 86/86 passed |
| After Task 2 (`1236b9e`) | 86/86 passed |

Rewritten cases (fixture dir renamed in brackets):
- palette: emoji in an unimported `components/Footer.tsx` now fails (`emoji-legacy-dead` -> `bad-emoji-former-dead`)
- palette: imported Footer fails on its emoji alone, with no importer line (`bad-emoji-legacy-imported` -> `bad-emoji-former-dead-imported`)
- palette: v1 name in an unimported `components/Header.tsx` now fails (`v1names-dead-exempt` -> `bad-v1names-former-dead`)
- palette: an alias definition in `app/globals.css` now fails with 3 violations (`v1names-alias-defs` -> `bad-v1names-alias-defs`)
- identity: good fixture's `components/Footer.tsx` now takes its links from the identity record (still passes)
- identity: v1 placeholders in Header/Footer fail like any file, and importers add nothing (`bad-dead-import` -> `bad-former-dead-files`, exact count `identity: 2 violations`)
- New: `legacy-dead-files: the list stays empty and the repository has no dead-file importer (VERIFY-01)`

## Compiled-selector parity diff (Task 2 step 5)

Baseline build after Task 1: 769 unique selector-like tokens. After Task 2: 746. **0 added, 23 removed**, each one traced to deleted CSS:

| Removed token(s) | Source (deleted CSS) |
|---|---|
| `.ambient-glow`, `.ambient-glow:after`, `.ambient-glow:hover:after` | Phase 4 ambient glow |
| `.glow-frost`, `.glow-frost:hover`, `.glow-ember` | Phase 4 frost/ember glow |
| `.stratum-1`, `.stratum-2`, `.stratum-3` | Phase 4 strata |
| `.contour-animate` | Phase 4 contour drift (with `@keyframes contour-drift`) |
| `.hologram-content` | unused hologram content rule (6 media variants) |
| `.0641`, `.77395`, `.892293/.08`, `.892293/.1`, `.892293/.15`, `.892293/.2`, `.892293/.4` | regex hits inside the strata `box-shadow` `lab(2.0641% -1.77395 .892293/…)` values |
| `.2506/.3`, `.3457/.3` | regex hits inside the `--color-ember-glow` / `--color-frost-glow` `lab(…/.3)` values |
| `.6` | `opacity: .6` in `.ambient-glow:after` |
| `.8125rem`, `.9375rem` | `.hologram-content` font sizes |

Custom-property diff on the compiled CSS: only `--color-frost-glow` and `--color-ember-glow` disappeared (hex and `lab()` forms). No default-palette variable was emitted before, so the reset drops nothing live. A rule-level diff found nothing else, beyond the reduced-motion block being re-chunked once its Phase 4 guards were gone. `--font-heading` was never emitted because nothing used it.

## Task Commits

1. **Task 1: Delete the four dead components and drain the dead-file and ratchet lists**: `6d725dc` (refactor)
2. **Task 2 RED: failing colour backstop test**: `b755711` (test)
3. **Task 2 GREEN: remove the v1 aliases and add the colour reset backstop**: `1236b9e` (refactor; the plan specified this commit type)

## TDD (Task 2)

- **RED:** `lib/__tests__/color-backstop.test.ts` has 5 tests from the behaviour list. Command: `npx jest lib/__tests__/color-backstop.test.ts`, exit 1, `Tests: 5 failed, 5 total`. Each test failed on its own assertion against the then-current stylesheet: no reset line found (`toHaveLength(1)` got 0, and reset index -1), the 29 marker lines, the 27 v1-named `--color-` definitions, and the 3 `--text-shadow-glow*` lines. There were no load, syntax or discovery faults. `gsd check tdd-red-evidence` could not classify this run: Jest's console and `--json` reports are not among the supported formats (TAP, JUnit XML, go test, swift-testing, unittest), and no TAP/JUnit reporter is installed. Package installs are excluded from auto-fix. The raw Jest JSON was kept at `C:/Users/tim/AppData/Local/Temp/claude/C--Users-tim-MyDocuments-Programming-portfolio-app/db4d785f-fc8b-44f3-9be7-c9aef8d6fcda/scratchpad/red-jest.json`. Semantic assessment: a valid RED, because all five target tests ran and failed on the planned assertion for the intended reason.
- **GREEN:** the globals.css edits plus the reset. 5/5 pass, and `data/__tests__/tokens.test.ts` also passes (11/11 across both files).
- **REFACTOR:** none needed.

## Files Created/Modified
- `app/globals.css`: v1 aliases and dead CSS removed, colour reset added (9 insertions, 200 deletions)
- `lib/__tests__/color-backstop.test.ts`: new Jest test for the backstop position and the absence of v1 names
- `scripts/guards/lib/legacy-dead-files.mjs`: empty list, never-add comment
- `scripts/guards/palette-ratchet.json`: `{}`
- `scripts/guards/check-palette.mjs`: alias-definition exemption and `V1_ALIAS_DEF` removed, header comment updated
- `scripts/guards/check-contrast.mjs`: skips `--<ns>-*` namespace resets
- `scripts/guards/selftest.mjs`: 6 cases rewritten, 1 added
- `scripts/guards/__selftest__/{identity,palette}/…`: fixtures rewritten or renamed

## Decisions Made
See `key-decisions` in the frontmatter. The main one: `--font-heading` carried the deprecated-alias marker and had no user, so it went with the 29 lines the acceptance grep counts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] check-contrast read the colour reset as an unknown token**
- **Found during:** Task 2 (after inserting `@theme { --color-*: initial; }`)
- **Issue:** `scripts/guards/check-contrast.mjs` collects every `--…` declaration in `@theme` blocks, so `--color-*` failed with `unknown token --color-*`, and the real-globals selftest case went red.
- **Fix:** declarations whose name ends in `-*` (Tailwind namespace resets) are skipped, and the header comment documents this. The file was not in the plan's list.
- **Files modified:** scripts/guards/check-contrast.mjs
- **Verification:** `contrast: OK (47 pairs)`; selftest 86/86
- **Committed in:** `1236b9e`

**2. [Rule 1 - Bug] The new test's JSDoc tripped the palette guard**
- **Found during:** Task 2 lint
- **Issue:** the RED commit's JSDoc used two stock utility names as examples, and `lib/__tests__` is scanned by the palette guard (`stock` and `wb` violations).
- **Fix:** reworded the JSDoc without class names (doc-only, in the GREEN commit).
- **Files modified:** lib/__tests__/color-backstop.test.ts
- **Verification:** `palette: OK`
- **Committed in:** `1236b9e`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** both were needed for green guards. No scope creep: the contrast guard only learned to ignore the reset, and its ALIAS skip is unchanged.

## Issues Encountered
- Prettier reports `scripts/guards/selftest.mjs`, `check-palette.mjs` and `check-contrast.mjs` as non-conforming. They were already non-conforming at HEAD and Prettier is not part of `npm run lint`, so I left them alone. The new test file conforms.
- Out-of-scope leftovers are logged in `deferred-items.md`: a `.github/copilot-instructions.md` line naming the deleted nav, and an `e2e/design-system.spec.ts` comment mentioning `text-shadow-glow*`. The README mention is covered by 12-22, and `eslint.config.mjs` still lists `components/GlassmorphismNav.tsx` in LEGACY_COMPILER_FILES until 12-18 drains it. That entry is harmless because the pattern matches no file.

## User Setup Required
None. No external service configuration required.

## Next Phase Readiness
- The visual zero-diff confirmation belongs to 12-11 (round-1 re-baseline). No visual spec ran here, and no PNG was touched.
- 12-16 (AnimatedGradientMesh) and 12-18 (LEGACY_COMPILER_FILES) can drain their lists the same way.
- Port 3000 is free, no server is left running, and `public/service-worker.js` is clean.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*

## Self-Check: PASSED

- FOUND: lib/__tests__/color-backstop.test.ts, 12-04-SUMMARY.md
- FOUND commits: 6d725dc, b755711, 1236b9e, 7e89d0b
- Acceptance re-run: dead files untracked (0 lines), ratchet `{}`, `LEGACY_DEAD_FILES = []` (1), `@deprecated v1 alias` 0, `text-shadow-glow` 0, `--color-*: initial` 1; selftest 86 >= 85
- Plan verification: lint, type-check, jest (85 suites / 1384 tests) green; `PW_PROD=1` design-system + shell chromium 40 passed on a fresh build; `public/service-worker.js` clean
