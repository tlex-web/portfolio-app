---
phase: 13-repo-safety-test-debt
plan: 06
requirement: VERIFY-07
decisions: [D-16, D-17, D-18, D-19]
status: approved (Tim, 2026-11-13, at the 13-06 Task 3 checkpoint; see ## Approval)
approved_on: 2026-11-13
rows: 44
checked_against: 78ff21711f00c0fc03aaaef06ac4c1361684f36c
checked_on: 2026-11-13
---

# Phase 13: Review-ledger triage (VERIFY-07)

**Status: APPROVED** by Tim on 2026-11-13 at the 13-06 Task 3 checkpoint (D-16), with no overrides. His reply is quoted under `## Approval`. The `Proposed` column keeps the proposal he approved; the `Tim` column records his decision for each row, and for the three owner-call rows the `Enum` and `Owner` cells now carry the outcome he chose. Ledger fixes may start: each owner plan's fix task reads this approval.

**Purpose.** v2.0 left 44 review findings at `disposition: open` in four archived ledgers (Phase 7: 23, Phase 9: 6, Phase 10: 10, Phase 12: 5; these match `git grep -c "disposition: open"` per file at HEAD). Each row below was re-checked against the current tree (HEAD `78ff217`, 2026-11-13). The 13-RESEARCH.md table was the starting point, and its evidence was corrected where the tree differs.

**Decisions this follows.**
- D-16: the agent proposes one disposition per row (already fixed, fix now, accept with a reason, hand to a later phase or requirement), and Tim approves or overrides the whole table once. Fixed hand-overs: 07 WR-06 to SHELL-07 (Phase 14), 07 WR-05 to DEPS-06 (13-18), 12 IN-11 to GUARD-09 (13-02).
- D-17: rows in code that a later v2.1 phase rewrites or retires go to that phase; UI fixes go to Phase 14.
- D-18: fix when the fix is cheap, pixel-neutral and testable; accept with a written reason when it is costly, risky or purely cosmetic in tests. Guard and test-quality rows lean towards fixing.
- D-19: this file is the source of record. Plan 13-22 writes each row's final status back into the archived `*-REVIEW-DISPOSITION.md` files under `.planning/milestones/v2.0-phases/` and points them here. This plan does not edit those files.

**How a proposal maps to the disposition enum** (the enum and Source-cell convention at the bottom of `12-REVIEW-DISPOSITION.md`: `open`, `fixed`, `skipped`, `deferred`):

| Proposal | Enum |
|---|---|
| Already fixed (commit cited) | `fixed` |
| Fix now (owner plan named) | `fixed` |
| Accept with a reason | `skipped` |
| Hand to a later phase or requirement | `deferred` |
| Tim's call | whichever of the above his decision picks |

**Owner split for fix-now rows:** guard rows 07 WR-01, WR-02, WR-03, IN-06 → 13-13; 07 WR-04, IN-07 and 12 IN-12 → 13-14; 07 IN-01, IN-03, IN-11, IN-17 and 09 IN-03, IN-04, IN-07 → 13-08; 10 IN-02, IN-06, IN-07, IN-09, IN-10 → 13-09; 12 IN-09, IN-10 and any approved owner-call fix → 13-11. Fix-now means pixel-neutral: this phase allows no UI change.

**Reused Phase 9 ids.** The later 09-REVIEW.md run reused IN-01..IN-03 for different findings. The Phase 9 rows here are triaged by the titles in `09-REVIEW-DISPOSITION.md` frontmatter, and each row shows that title.

## Rows

Numbered 1-44 in ledger order (07, 09, 10, 12), each phase in its disposition file's order. `Title` is verbatim from the disposition frontmatter. The `Tim` column records his reply of 2026-11-13: `approved` for the 41 proposed rows, and `approved: <his call>` for the three owner-call rows (7, 14, 40).

| # | Row | Title | Evidence today | Proposed | Enum | Owner | Tim |
|---|---|---|---|---|---|---|---|
| 1 | 07 WR-01 | Contrast guard merges `:root` blocks nested in `@media`, so a media-scoped override can mask a failing base token | `BLOCK` regex unchanged at `scripts/guards/check-contrast.mjs:100` (`/(:root\|@theme…)\s*\{([^{}]*)\}/g`), read in one pass at `:122` with no `@media` scoping | Fix now (guard) plus a `media-override.css` selftest fixture | fixed | 13-13 | approved |
| 2 | 07 WR-02 | Palette guard regex misses directional borders, ring offsets and the shadow-colour families | `PRE` unchanged at `scripts/guards/check-palette.mjs:46` and `STOCK`/`WB` at `:47-49` still need the colour right after the prefix, so `border-t-red-500`, `ring-offset-red-500`, `drop-shadow-black`, `inset-shadow-*`, `inset-ring-*` and `text-shadow-*` are not matched | Fix now; run the widened regex first: new hits or a `wb` count change go back to Tim before the ratchet moves | fixed | 13-13 | approved |
| 3 | 07 WR-03 | The `png` rule walks the disk, so `npm run lint` fails on Windows after any local visual run | `walk()` uses `fs.readdirSync` at `scripts/guards/check-palette.mjs:101`; the `png` rule walks `e2e/` with it at `:173-178`, so untracked local PNGs are reported | Fix now (list files with `git ls-files -co --exclude-standard`) | fixed | 13-13 | approved |
| 4 | 07 WR-04 | `same-classnames` passes without comparing anything on moved files and empty diffs | `git diff --name-status --no-renames` at `scripts/guards/same-classnames.mjs:154`; A/D entries skipped at `:161-163`; the OK line at `:174` prints even when `compared` is 0 | Fix now (pair renames, fail on 0 compared) | fixed | 13-14 | approved |
| 5 | 07 WR-05 | Grouped Dependabot dev-dependency PRs will fail the new parity guard whenever `@playwright/test` moves | The dev group now excludes `@playwright/test` (`.github/dependabot.yml:39-46`), so the grouped PR no longer breaks; the lone Playwright PR is still red until the image tag moves with it | Hand to DEPS-06 (D-16) | deferred | DEPS-06 (13-18) | approved |
| 6 | 07 WR-06 | Choosing the current page in the mobile menu leaves the panel open | `components/site/SiteNav.tsx:85-87` closes the panel only when the pathname changes; the panel links at `:191` have no `onClick`, so choosing the current page changes nothing | Hand to SHELL-07, Phase 14 (D-16) | deferred | SHELL-07 (Phase 14) | approved |
| 7 | 07 WR-07 | `SafeCanvas` swallows every error below it, with no logging | `componentDidCatch` only forwards to `onError` (`components/SafeCanvas.tsx:29-31`, since 542bef5); nothing logs a non-WebGL error | Tim's call (see Owner calls) | fixed | 13-11 | approved: fix |
| 8 | 07 IN-01 | scripts/README.md lint chain and emoji row are stale | Lint chain is now correct (`scripts/README.md:52` matches `package.json` `lint`); the emoji row at `:66` still says "skipped in lint until plan 07-25", but the `emoji` rule runs in lint (`scripts/guards/check-palette.mjs:56`) | Fix now (one line) | fixed | 13-08 | approved |
| 9 | 07 IN-02 | Root layout comment names `middleware.ts`; this Next version uses `proxy.ts` | `app/layout.tsx:52` now says "proxy.ts"; `git log -S middleware.ts -- app/layout.tsx` shows the change in 123d67a | Already fixed | fixed | 123d67a | approved |
| 10 | 07 IN-03 | The G3 test comment describes the deleted v1 Header | `e2e/design-system.spec.ts:177` still reads "The v1 Header slides in from y -100 (Motion entrance, DURATION.enter)" | Fix now (comment) | fixed | 13-08 | approved |
| 11 | 07 IN-05 | The Home stats show hard-coded, false figures | No `850+` or "Tests Passing" left in `app/` or `components/`; 98de4c5 replaced the page with the server-rendered AscentHero ("the legacy stats … are gone") | Already fixed | fixed | 98de4c5 | approved |
| 12 | 07 IN-06 | The contrast self-test pins exact production ratios, so any token tweak breaks `npm run lint` | `scripts/guards/selftest.mjs:738` still pins 12 exact ratios from the real `app/globals.css` (now 47 pairs) | Fix now (assert only the OK line and the table order for the real file; keep exact ratios for fixtures) | fixed | 13-13 | approved |
| 13 | 07 IN-07 | `check-snapshot-commit` passes a merge commit without checking it under `--none` | `scripts/ci/check-snapshot-commit.mjs:119` runs `git show --name-status` with no merge detection (no `--parents` or `^1` anywhere in the file) | Fix now; more relevant now that D-03 allows merge commits only | fixed | 13-14 | approved |
| 14 | 07 IN-08 | Tests and e2e specs are excluded from `type-check` | `tsconfig.json` `exclude` unchanged; `type-check` is `tsc --noEmit` over the root config only | Tim's call; measured 5482 errors in 103 files as-is, 69 in 21 with Jest globals declared, so the proposal is a new requirement (GUARD-10, Phase 15) | deferred | GUARD-10 (Phase 15) | approved: GUARD-10 (new requirement, Phase 15) |
| 15 | 07 IN-09 | FeedbackForm parses JSON before checking the status, so a non-JSON error shows "Network error" | `components/FeedbackForm.tsx` deleted in b48c4d9; its successor `components/contact/SummitRegister.tsx` maps any unreadable body to the network failure by design (`outcomeOf`, `:223`, "anything unreadable is a network failure") | Already fixed (component retired) | fixed | b48c4d9 | approved |
| 16 | 07 IN-10 | The `high` and `critical` risk levels now render identically | `components/HologramTerminalDemo.tsx` deleted in cf369b5 (DemoTerminal replaced it) | Already fixed (component retired) | fixed | cf369b5 | approved |
| 17 | 07 IN-11 | The section error component is named `Error`, which shadows the global | `app/(site)/error.tsx:12` still `export default function Error(` | Fix now (rename to `SectionError`) | fixed | 13-08 | approved |
| 18 | 07 IN-12 | The roadmap timeline dot clips its 20 px icon | `components/RoadmapTimeline.tsx` deleted in e37f2af (/roadmap rebuilt as a Server Component) | Already fixed (component retired) | fixed | e37f2af | approved |
| 19 | 07 IN-13 | Hero badge contrast is still failing (known, deferred to Phase 9 hero rework, STATE.md) | `components/Hero3DMountain.tsx` deleted in efd11e7 (legacy hero chain removed) | Already fixed (component retired) | fixed | efd11e7 | approved |
| 20 | 07 IN-14 | Hover background lost on the white CTAs (known, deferred to Phase 9, STATE.md) | Hero CTA deleted with `Hero3DMountain.tsx` in efd11e7; the Home CTA (`hover:bg-snow-100`, codemodded in ceeb560 with the same flat hover) went with the legacy Home in 98de4c5 | Already fixed (both CTAs retired) | fixed | efd11e7, 98de4c5 | approved |
| 21 | 07 IN-15 | Tailwind v3 `bg-opacity-*` classes in the image modal (known, deferred to Phase 10, STATE.md) | `components/ImageDetailModal.tsx` deleted in aa9dff6 (legacy photo UI removed) | Already fixed (component retired) | fixed | aa9dff6 | approved |
| 22 | 07 IN-16 | `notFound()` under `/projects/[slug]` has no server-rendered 404 body (known, deferred to Phase 12 / EDGE-01, STATE.md) | Corrected from research: the server body comes from 31daaf9 (proxy.ts rewrites unknown slugs to the root not-found; `e2e/not-found.spec.ts:53,77` reads the raw server HTML for `/projects/<token>` through `request`), with `dynamicParams = false` plus `generateStaticParams` from cf369b5 (`app/(site)/projects/[slug]/page.tsx:33-35`) | Already fixed | fixed | 31daaf9, cf369b5 | approved |
| 23 | 07 IN-17 | The skip-link count passes as soon as it first reads 1, so a link added after hydration is not counted | `e2e/shell.spec.ts:67` and `:175` count skip links once, before any interaction; no re-count after Tab/Enter | Fix now (count again after the interaction) | fixed | 13-08 | approved |
| 24 | 09 IN-01 | `measurePlaque` assumes the summit block is centred at its arrival, which fails when the block is taller than the stage | `components/home/AscentController.tsx:277` still centres with `(summitRect.height - stageRect.height) / 2` | Accept with reason: it only matters on short-landscape full layout, the domain of 09 WR-01 that Tim accepted at 09-UAT, and a fix moves Home pixels | skipped | none (reason recorded) | approved |
| 25 | 09 IN-02 | Narrow-versus-wide is now decided by two different width sources in the same canvas | `components/home/TerrainStage.tsx:39,61` (stage box width below 768 px) vs `components/home/terrain/CameraRig.tsx:73,373,519` (`matchMedia('(min-width: 48rem)')`) | Accept with reason: nothing breaks, and aligning them changes the 768 px Home render (visual baselines) | skipped | none (reason recorded) | approved |
| 26 | 09 IN-03 | The three summit-layout magic numbers are a hand-measured model of rendered content | `lib/ascent/summit-layout.ts:40,43` (`COMPACT_H = 170`, `FULL_H = 478`); no e2e reads them | Fix now (one e2e assertion of the measured plaque height against `COMPACT_H` and `FULL_H`; test-only) | fixed | 13-08 | approved |
| 27 | 09 IN-04 | `fourDecimals` is not "round half up" for every input | `lib/home-format.ts:37-45` still `Math.round(Math.abs(v) * scale) / scale` | Fix now with a unit test proving the four current coordinates print unchanged (alternative if Tim prefers: hand to Phase 18, PHOTO-08 coordinate formatting) | fixed | 13-08 | approved |
| 28 | 09 IN-06 | The `/photos#slug` target only exists on the current gallery page | Home cards link `/photos/${slug}` (`components/home/WaypointCard.tsx:110`); no `/photos#` link left in `app/`, `components/` or `lib/` | Already fixed | fixed | b38b6c4 | approved |
| 29 | 09 IN-07 | The server-HTML assertion escapes only the first `&` | `e2e/homepage.spec.ts:56` still `.replace('&', '&amp;')` | Fix now (`replaceAll`) | fixed | 13-08 | approved |
| 30 | 10 IN-01 | A hidden callout silently takes the first Escape when labels are hidden on the gutter tier | `components/photos/PhotoViewer.tsx` unchanged: hiding labels leaves `expandedId` set, and the callout stays the first Escape layer (`:139-142`, collapse at `:340`) | Hand to Phase 14 (a UI behaviour choice, as the review says) | deferred | Phase 14 | approved |
| 31 | 10 IN-02 | `collapseCallout` uses `CSS.escape` without the fallback LightboxDialog provides | `components/photos/PhotoViewer.tsx:340` calls `CSS.escape` directly; the fallback lives in `components/photos/LightboxDialog.tsx:111-114` | Fix now (share `cssEscape`) | fixed | 13-09 | approved |
| 32 | 10 IN-03 | Duplicated photo-path parsing and `isEditable`, with different behaviour | `components/photos/LightboxDialog.tsx:79,90` (own `PHOTO_PATH`, `slugOf`) vs `lib/photos/stepping.ts` (`slugFromPath`); `isEditable` in `PhotoViewer.tsx:169` and `ZoomStage.tsx:98` | Hand to Phase 17 (the photo and region routes change this parsing) | deferred | Phase 17 | approved |
| 33 | 10 IN-04 | The neighbour preload asks for the AVIF set only | `components/photos/PhotoViewer.tsx:182` `img.srcset = view.stage.srcSetAvif` | Hand to Phase 18 (LBOX-09 stepping rework) | deferred | Phase 18 | approved |
| 34 | 10 IN-05 | `STAGE_SIZES` ignores the gutter tier's height condition and the key tier's height-limited box | `components/photos/PhotoViewer.tsx:149` unchanged | Hand to Phase 18 (the immersive layout resizes the stage) | deferred | Phase 18 | approved |
| 35 | 10 IN-06 | Unused parameters on component APIs | `components/photos/ZoomStage.tsx:126` still declares `at?`; `components/photos/Hotspots.tsx:326-327` `HotspotKey` still accepts `labelsOn`, passed by `PhotoViewer.tsx:585` | Fix now (type-check proves it) | fixed | 13-09 | approved |
| 36 | 10 IN-07 | Fact list items are keyed by their text | `components/photos/Hotspots.tsx:89` `<li key={fact.text}>` | Fix now | fixed | 13-09 | approved |
| 37 | 10 IN-08 | The row-height drift guard does not tie each value to its breakpoint | `components/__tests__/GalleryGrid.test.tsx:166-167` still `toContain('--row-h:…px')` with no `sm:`/`lg:` prefix | Hand to Phase 18 (PHOTO-06 rewrites the view tests) | deferred | Phase 18 | approved |
| 38 | 10 IN-09 | Absence-only assertions after fixed sleeps can pass falsely | `e2e/photos-lightbox.spec.ts:783,788,795,800,837` and `e2e/photos-sweep.spec.ts:214` still sample after fixed `waitForTimeout` | Fix now (positive settle signal first). Some of these tests cover the view switch Phase 18 retires; fix the ones that survive | fixed | 13-09 | approved |
| 39 | 10 IN-10 | `closing` is never reset in LightboxDialog | `components/photos/LightboxDialog.tsx:154,162-163` sets `closing.current = true` and never resets it | Fix now (reset in the layout effect's setup; unit-testable) | fixed | 13-09 | approved |
| 40 | 12 IN-08 | A fieldless `validation` answer now offers Retry, but the retry is deterministic and costs a rate-limit slot each time | `components/contact/SummitRegister.tsx:494-495` maps it to `{ kind: 'send' }`, and `:599` renders Retry for every `send` failure | Tim's call (see Owner calls) | skipped | none (reason recorded) | approved: accept |
| 41 | 12 IN-09 | `storeCopy` has no guard against a synchronous throw, so a cache-side failure can replace a good network answer | `public/service-worker.js:23-31` still clones and calls `waitUntil` with no `try` | Fix now (try/catch; test in the existing SW harness; separate commit from CLEAN-01's change to the same file) | fixed | 13-11 | approved |
| 42 | 12 IN-10 | The new name too-long copy hard-codes `100` beside a check that reads `FEEDBACK_LIMITS.nameMax` | `components/contact/SummitRegister.tsx:36` literal `100`; check at `:61` reads `FEEDBACK_LIMITS.nameMax` | Fix now (same output today) | fixed | 13-11 | approved |
| 43 | 12 IN-11 | README says Vercel's Upstash integration "injects them"; the code reads only the `UPSTASH_REDIS_REST_*` names | `lib/rate-limit.ts:24-25` reads only `UPSTASH_REDIS_REST_URL`/`_TOKEN`; README no longer mentions Upstash (cf7975b) | Hand to GUARD-09 (D-16) | deferred | GUARD-09 (13-02) | approved |
| 44 | 12 IN-12 | The new advisory floors (`source-map-js`, `baseline-browser-mapping`) are checked only on the hoisted lockfile copy | `scripts/guards/check-install-parity.mjs:143` `lockVersion` reads only `node_modules/<name>`; floors checked at `:209` | Fix now (guard) plus a selftest fixture with a nested older copy | fixed | 13-14 | approved |

**Proposed totals:** already fixed 10, fix now 21, handed over 8 (DEPS-06, SHELL-07, GUARD-09, Phase 14 ×1, Phase 17 ×1, Phase 18 ×3), accept 2, Tim's call 3 = 44. By phase: 07 → 23, 09 → 6, 10 → 10, 12 → 5.

**Approved totals (2026-11-13):** already fixed 10, fix now 22 (the 21 proposed plus 07 WR-07, owner 13-11), handed over 9 (the 8 proposed plus 07 IN-08 to GUARD-10, Phase 15), accept 3 (the 2 proposed plus 12 IN-08) = 44. By enum: `fixed` 32, `deferred` 9, `skipped` 3.

**Corrections to the research table** (checked 2026-11-13):
- 07 IN-16: the server-rendered body is 31daaf9's proxy rewrite, proved by `e2e/not-found.spec.ts`; cf369b5 alone only added `dynamicParams = false`. Both are cited.
- 07 WR-03: the `png` walk call site is `check-palette.mjs:173-178` (research said `:176`).
- 07 WR-06: evidence made exact (`SiteNav.tsx:85-87` close-on-route-change, no `onClick` on the panel links).
- 07 IN-17: the 404 shell test at `e2e/shell.spec.ts:175` has the same single count as `:67`.
- 09 IN-02: the wide source is `matchMedia('(min-width: 48rem)')` at `CameraRig.tsx:73,373` (research cited `:136`).
- 10 IN-06: `labelsOn` is passed at `PhotoViewer.tsx:585`.

## Owner calls

These three rows needed Tim's decision, not just his approval. He decided all three on 2026-11-13 (see `## Approval`).

**07 WR-07: `SafeCanvas` swallows every error below it, with no logging** (row 7)
- Fix: log non-WebGL errors in `componentDidCatch` (`console.error` with the error, skipping the expected WebGL context failures). Cheap and unit-testable; owner 13-11. Risk: a new `console.error` on Home can trip the audit gate's console check if any non-WebGL error fires there today.
- Accept: record the reason (errors already reach `onError`, which drives the static downgrade) and leave it. Enum `skipped`.
- **Tim's decision: fix.** Owner 13-11 (log non-WebGL errors in `componentDidCatch`, skipping the expected WebGL context failures, with a unit test). Enum `fixed`. 13-11 must check that the new `console.error` does not fire on Home in the audit gate's console check.

**07 IN-08: Tests and e2e specs are excluded from `type-check`** (row 14)
- Fix here: 13-11 adds a committed `tsconfig.test.json` and runs it from `type-check`. Proposed only if the measurement shows at most 15 errors in at most 5 files. The measurement is over that line, so a "fix here" answer would need a gap plan.
- New requirement (**proposed**, from the measurement): GUARD-10, in Phase 15. The ledger row points there. Enum `deferred`.
- Accept: record the reason and leave tests unchecked. Enum `skipped`.
- The measured basis is in the Measurement section below.
- **Tim's decision: GUARD-10**, a new requirement in Phase 15: "Tests, e2e specs and Playwright configs are type-checked by `npm run type-check` with zero errors." Basis: the Task 2 measurement, 5482 errors in 103 files as-is and 69 errors in 21 files with the Jest globals declared. It needs Jest type declarations, either `@types/jest` (a package install that Tim vets first; not approved here) or `@jest/globals` imports in the test files; Phase 15's plan makes that choice. Enum `deferred`; the ledger row points at GUARD-10. Added to `.planning/REQUIREMENTS.md` and to Phase 15 in `.planning/ROADMAP.md`.

**12 IN-08: A fieldless `validation` answer offers a pointless Retry** (row 40)
- Phase 14: hide Retry for the fieldless case (a `retryable: false` flag on the failure). It changes what the visitor sees (copy/UX), so it cannot land in this pixel-neutral phase. Enum `deferred`.
- Accept: record the reason (the case needs a malformed body or a hidden field over its limit, which a real visitor cannot produce) and leave it. Enum `skipped`.
- **Tim's decision: accept.** Reason recorded: a real visitor cannot produce the fieldless `validation` answer (it needs a malformed body or a hidden field over its limit), so the pointless Retry is never shown to one. Enum `skipped`; no owner.

## Measurement: 07 IN-08

Measured 2026-11-13 at HEAD `7b861b4` (TypeScript 6.0.3). Two throwaway configs in the session scratchpad (OS temp, outside the repository, deleted after the run). Each `extends` the repo's absolute `tsconfig.json` path, sets `compilerOptions.noEmit: true` (and `incremental: false`, so no build-info file is written), overrides `exclude` to `node_modules` and `scripts/guards/__selftest__/**` only, and includes `next-env.d.ts`, `**/__tests__/**/*.ts`, `**/__tests__/**/*.tsx`, `e2e/**/*.ts` and `playwright*.config.ts` (140 test, spec and config files).

**Run A: the tests exactly as they are.**

- Command, from the repo root: `npx tsc -p <temp>/tsconfig.in08.json`
- Result: **5482 errors in 103 files** (exit 2).
- Cause: the repo has no Jest type declarations. `@types/jest` is not installed, and no test imports from `@jest/globals`, so every `describe`, `it`, `expect` and `jest` is an unknown name. By code: TS2304 3528 (`expect` 3291, `jest` 214, `afterEach`/`beforeAll`/`afterAll` 23), TS2593 1694 (`describe`/`it`), TS7006 203, TS2503 45 (`jest.Mock` namespace), and 14 others.
- Top five files: `components/contact/__tests__/SummitRegister.test.tsx` 280, `app/api/__tests__/feedback.test.ts` 224, `components/projects/__tests__/DemoTerminal.test.tsx` 179, `lib/__tests__/proxy.test.ts` 165, `components/projects/__tests__/sections.test.tsx` 148.
- e2e and the Playwright configs: 1 error (`e2e/home-canvas.spec.ts:1012`, TS2339 `getContext` on `Element`).

**Run B: the same files with the Jest globals declared.** This shows the real type errors behind the missing declarations. A scratch `globals.d.ts` (also in temp) declared `describe`, `it`, `test`, `expect`, the hooks and the `jest` namespace from the installed `@jest/globals` 30.5.2, plus `@testing-library/jest-dom/jest-globals` 7.0.1. Nothing was installed.

- Command: `npx tsc -p <temp>/tsconfig.in08-jest.json` (Run A's config plus the scratch `globals.d.ts`)
- Result: **69 errors in 21 files** (exit 2).
- By code: TS2345 28, TS2554 13, TS2339 13, TS2322 6, TS7006 4, and 5 single errors. Many are `jest.fn()` mocks typed `Mock<UnknownFunction>` where a typed function is expected (the `@jest/globals` typing is stricter than `@types/jest`). Others are real fixture drift, for example project fixtures missing the now-required `links` field (`components/projects/__tests__/Metrics.test.tsx:207`, `sections.test.tsx:448`).
- Top five files: `lib/og/__tests__/routes.test.ts` 18, `components/contact/__tests__/SummitRegister.test.tsx` 15, `components/roadmap/__tests__/RouteLogFilters.test.tsx` 7, `components/contact/__tests__/CopyEmailButton.test.tsx` 4, `app/api/__tests__/feedback.test.ts` 4.

**Proposal rule (from the plan):** at most 15 errors in at most 5 files → propose "fix here" (13-11 adds a committed `tsconfig.test.json` and runs it from `type-check`); otherwise propose a new requirement with an ID and a phase (D-17).

**Outcome: both runs are over the threshold** (A: 5482 errors in 103 files; B: 69 errors in 21 files). **Proposed: new requirement GUARD-10**, "Jest tests, e2e specs and the Playwright configs are type-checked by `npm run type-check`, with zero errors". Proposed phase: Phase 15 (Region & Plate Data Model), the first phase after Phase 14 with no visible change, before Phases 15-18 rewrite the photo and Home tests. GUARD-10 is the next free GUARD id. Two things for Tim to know before he decides:
- It needs Jest type declarations. Either add `@types/jest` (a package install, which needs Tim to vet the package) or import from `@jest/globals` in the 102 Jest test files. That choice belongs to the requirement's plan, not this triage.
- If he answers "fix here" anyway, it is too large for 13-11's owner-call task, so it goes to a gap plan (`/gsd-plan-phase 13 --gaps`).

**Decision (Tim, 2026-11-13):** GUARD-10, Phase 15, as proposed. No gap plan is needed in Phase 13.

## Unowned fix rows

Rows Tim moved into fix-now that no owner plan's task names (each would be listed as `- <Row id>: <Title> → 13-14 Task 3`):

none

Tim approved with no overrides, so no row moved into fix-now. The one owner-call fix (07 WR-07) is owned by 13-11, which the owner split already names for "any approved owner-call fix".

## Approval

Tim's reply at the 13-06 Task 3 checkpoint, 2026-11-13, quoted verbatim (one segment of a longer message that also answered plan 13-05's questions):

> approve — WR-07 fix, IN-08 GUARD-10, 12 IN-08 accept)

What it decides:
- **approve:** every row's proposed disposition stands, with no overrides (the 41 non-owner-call rows read `approved`).
- **07 WR-07 (row 7): fix**, owner 13-11. Enum `fixed`.
- **07 IN-08 (row 14): GUARD-10**, a new requirement in Phase 15. Enum `deferred`.
- **12 IN-08 (row 40): accept**, reason recorded under `## Owner calls`. Enum `skipped`.
- **Unowned fix rows:** none.

The reply does not approve any package install. Whether GUARD-10 uses `@types/jest` (which Tim vets first) or `@jest/globals` imports stays open for Phase 15.
