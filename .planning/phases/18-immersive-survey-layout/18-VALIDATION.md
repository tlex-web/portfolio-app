---
phase: "18"
slug: "immersive-survey-layout"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-24"
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `18-RESEARCH.md` § Validation Architecture. The planner fills in task IDs; until then, rows are keyed by requirement.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.5.2 (`next/jest`, jsdom default, `@jest-environment node` per file) and Playwright 1.65.0 (Chromium, Firefox and WebKit in CI; visual-dark/visual-light; perf on demand; WebKit is not installed locally) |
| **Config file** | `jest.config.js`, `playwright.config.ts`, `tsconfig.jest.json`, `tsconfig.e2e.json` |
| **Quick run command** | `npx jest <touched test paths>` + `npm run type-check` |
| **Full suite command** | `npm run type-check && npm test && npm run lint` (lint includes `data:check` and the guards), then `PW_PROD=1 npx playwright test <specs> --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s` |
| **Estimated runtime** | ~60 s per-task loop (touched Jest paths + type-check); full Jest several minutes; local production Playwright on touched specs a few minutes |

`npm run build`'s postbuild rewrites the tracked `public/service-worker.js`. Run `git restore public/service-worker.js` after every build, including the client-JS measurement build.

**Inherited red (Pitfall 1):** CI run 45445770986 on the Phase 17 tip (`4d79f22`, `ci/17-review-fixes`) failed E2E on all three engines: `e2e/og.spec.ts:160` (v2.0 og:image hash moved from `?1bf973d7cc2e42c4` to `?f8a1b67515ad261d`) and a WebKit timeout in `home-modes.spec.ts:610` (B8). Wave 0 resolves or classifies both before any Phase 18 visual or E2E evidence is trusted.

---

## Sampling Rate

- **After every task commit:** `npx jest <touched test paths>` + `npm run type-check` + `node scripts/ci/check-snapshot-commit.mjs --none`
- **After every plan wave:** `npm test && npm run lint`, plus a local production Playwright run of the touched specs (Chromium, Firefox)
- **Before `/gsd-verify-work`:** full suite green; a `ci/18-*` push (D-23 standing approval, including plan-declared dispatches) with every CI job green, including Visual Regression; per-leg E2E durations recorded (D-26); client JS measured against the cap of 1,855,841 B (phase base 1,851,745 B at `a857d35` + 4,096 B; record-only in 18-07, 18-12, 18-18 and 18-22, enforced in 18-25 and 18-29); declared baseline rounds closed with Tim's PNG commits; HOME-08 perf dispatch re-run after the last shared-chunk change (D-24)
- **Max feedback latency:** ~60 s for the per-task loop

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 18-13-T1 | 18-13 | 2 | REGION-01 | — | Overview layout invariants across sheet widths 312–1100; region/summit count guards; one outline per region | unit (sweep) | `npx jest lib/__tests__/overview-layout.test.ts` | ❌ W0 | ⬜ pending |
| 18-23-T1, 18-23-T2 | 18-23 | 18 | REGION-01 | — | One marker per region numbered west→east; list is the keyboard path; no overlap at 375/768/1024/1440; markers `tabIndex=-1` | e2e | `PW_PROD=1 npx playwright test e2e/photos.spec.ts --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s` | ✅ rewrite | ⬜ pending |
| 18-02-T1, 18-02-T2 | 18-02 | 1 | REGION-01 | — | West→east order derived from outlines (D-01) | unit | `npx jest lib/__tests__/regions.test.ts` | ✅ extend | ⬜ pending |
| 18-06-T1, 18-06-T2, 18-09-T1, 18-09-T2, 18-10-T1, 18-10-T2 | 18-06, 18-09, 18-10 | 2, 5, 6 | REGION-02 | — | Header, facts, plate, key list, next-region wrap (D-11), visible breadcrumb = `BreadcrumbList` JSON-LD (D-10) | unit + e2e | `npx jest lib/__tests__/json-ld.test.ts lib/__tests__/plate-layout.test.ts` + `PW_PROD=1 npx playwright test e2e/photos-region.spec.ts --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s` | ✅ / ❌ W0 plate-layout | ⬜ pending |
| 18-08-T1, 18-08-T2 | 18-08 | 4 | REGION-03 | — | Ascending altitude order; uncropped (±1 %); captions always visible; `currentSrc` matches rendered width | e2e + unit | `e2e/photos-region.spec.ts` (command above); `npx jest lib/__tests__/image-sizes.test.ts` | ✅ extend / ❌ W0 | ⬜ pending |
| 18-08-T1, 18-08-T2 | 18-08 | 4 | REGION-04 | — | Neatline and ticks outside the image, never over it; no horizontal scroll at 375 | e2e | `e2e/photos-region.spec.ts` (command above) | ✅ extend | ⬜ pending |
| 18-12-T1, 18-12-T2 | 18-12 | 8 | REGION-05 | — | Rail `data-rail-current` follows the centred figure ≥768 px, stays on the most recently current figure while the centre line is in a gap between figures (never 1 or N), and is right after a jump (1 above the first figure, N below the last); hidden <768 px with `n / N` captions (D-07); >16 photos guard | e2e + unit | `e2e/photos-region.spec.ts` (command above); `npx jest lib/__tests__/region-rail.test.ts` | ❌ W0 | ⬜ pending |
| 18-02-T2, 18-03-T1, 18-11-T1, 18-11-T2 | 18-02, 18-03, 18-11 | 1, 2, 7 | REGION-06 | — | Sheet margins non-empty and mapped to `/sources` anchors (D-17); `/sources` verbatim string equality (D-20); footer short credit + link on every route (D-16) | unit + e2e | `npx jest components/site/__tests__/SiteFooter.test.tsx data/__tests__/sources.test.ts`; `PW_PROD=1 npx playwright test e2e/shell.spec.ts e2e/seo.spec.ts e2e/audit.spec.ts --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s` | ✅ rewrite / ❌ W0 sources | ⬜ pending |
| 18-22-T1 | 18-22 | 17 | PHOTO-06 | T-18-44 | `?view=` redirect matrix: 308, query dropped, `grid`/`carousel` → Zermatt (D-03) | unit + e2e | `npx jest lib/__tests__/proxy.test.ts`; `e2e/photos.spec.ts` (command above) | ✅ extend | ⬜ pending |
| 18-15-T2, 18-16-T2, 18-21-T1, 18-21-T2, 18-22-T1, 18-22-T2 | 18-15, 18-16, 18-21, 18-22 | 10, 11, 16, 17 | PHOTO-06 | T-18-64, T-18-68 | Every test of the Map/Grid/Carousel views rewritten with a mapping row, never deleted: the LBOX-08 matrix on the region pages (18-15), the carousel spec as the stepping spec (18-16), grid, carousel and grid-lightbox tests onto the region pages (18-21: keyboard, photos-sweep, photos, photos-region, audit, no-webgl, seo), Map, switcher and `?view=` tests onto the overview and the redirect (18-22: photos, keyboard, photos-sweep, audit, seo, shell; one successor per retired test, the plate rows at all six old widths); the breaking plan runs every affected spec; the 600 ms sleep in the sweep becomes a positive signal (13 #38); per-plan count gate (18-15, 18-16, and 18-26 of the next row): neither the Jest nor the e2e count ends below the value its Task 1 recorded in `.test-count-18-NN-start.tmp` before the first edit; per-plan allowance gate (18-21, 18-22: Task 1 records the start file and re-measures the declared titles from the Playwright `--list`; the end gate fails if Jest < start − R_jest or e2e < start − R_e2e, the start file is missing, a focus/skip marker exists, or guard:tests fails): 18-21 R_e2e 2 (photos.spec's Grid view true-ratio rows at 768 x 900 and 1440 x 900 → 18-08's ratio row at 768 and 1440), 18-22 R_e2e 1 (photos.spec's Map view 'Escape closes it and focus returns to the plate' → 18-21's keyboard row 'Enter on a figure link opens the lightbox on Close photo; Tab stays inside; arrows step; Escape returns focus'), R_jest 0 in both | e2e + guard | `PW_PROD=1 npx playwright test e2e/photos.spec.ts e2e/photos-region.spec.ts e2e/photos-lightbox.spec.ts e2e/photos-stepping.spec.ts e2e/photos-sweep.spec.ts e2e/keyboard.spec.ts e2e/audit.spec.ts e2e/no-webgl.spec.ts e2e/seo.spec.ts e2e/shell.spec.ts e2e/design-system.spec.ts e2e/not-found.spec.ts --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s`; for 18-21 and 18-22 also the end gate's six checks (start file, `npm run guard:tests:scan`, end record via `test-count.mjs --update` into `.test-count-18-NN-end.tmp`, Jest allowance, e2e allowance, `npm run guard:tests`) | ✅ rewrite | ⬜ pending |
| 18-24-T1, 18-24-T2, 18-25-T1, 18-25-T2, 18-26-T1, 18-26-T2, 18-27-T1, 18-27-T2 | 18-24, 18-25, 18-26, 18-27 | 19, 20, 21, 22 | PHOTO-06 | T-18-49, T-18-66, T-18-52 | Retired modules deleted with every Jest test mapped to a successor; per-plan allowance gates (Task 1 records `.test-count-18-NN-start.tmp` and re-measures the declared retired files or rows; the end gate fails if Jest < start − R_jest or e2e < start − R_e2e, the start file is missing, a focus/skip marker exists, or guard:tests fails): 18-24 R_jest 16 (photos-view-param.test → 18-22 proxy rows; the other 48 retired tests get successors in 18-24), 18-25 R_jest 11 (useProgressiveTextures.test → 18-16 stepping row), 18-27 R_jest 23 (photos-label-layout rows outside stack1D → 18-09/18-10/18-13 rows; map.test's 11 get plate-sheet rows), R_e2e 0 in all three; 18-26 keeps the plain count gate; no retired or light-table name remains | unit + guard | the end gate's six checks (start file, `npm run guard:tests:scan`, end record via `test-count.mjs --update` into `.test-count-18-NN-end.tmp`, Jest allowance, e2e allowance, `npm run guard:tests`) | ✅ rewrite | ⬜ pending |
| 18-28-T1 | 18-28 | 23 | PHOTO-06 | T-18-55 | The six photos-grid and photos-carousel visual entries retire onto 18-14's D-21 region shots; allowance gate before the push: e2e ≥ start − 6 (R_e2e pinned and re-measured from the visual `--list`), Jest ≥ start, scan, guard:tests | guard | the same six end-gate checks with R_jest 0, R_e2e 6 | ✅ rewrite | ⬜ pending |
| 18-01-T3 | 18-01 | 1 | all (GUARD-03) | T-18-67 | The committed ratchet `scripts/guards/test-count.baseline.json` is raised by the guard's own `--update` mode (dev listing) from 2,243 to the phase-start count in a commit naming GUARD-03; every later `npm run guard:tests` (local and CI Unit Tests, first on ci/18-01) fails on a net drop below the phase start | guard | `npx jest --json --outputFile=jest-results.json > /dev/null 2>&1; env -u PW_PROD -u CI npm run guard:tests; s=$?; rm -f jest-results.json; exit $s` plus the floor-commit check | ✅ | ⬜ pending |
| 18-07-T1, 18-07-T2, 18-18-T2 | 18-07, 18-18 | 3, 13 | PHOTO-07 | T-18-18 | Copy mode by default; share mode with stubbed API; `AbortError` silent; copy failure selects the URL; label and accessible name say which | unit (RTL) + e2e | `npx jest components/photos/__tests__/share-button.test.tsx`; `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s` | ❌ W0 | ⬜ pending |
| 18-18-T1 | 18-18 | 13 | PHOTO-08 | — | LV95 only for CH, rounded by precision (D-15), `≈` when approximate, derived from the shown WGS84; WGS84 only elsewhere | unit | `npx jest lib/__tests__/photos-view-model.test.ts components/photos/__tests__/strip.test.tsx` | ✅ extend | ⬜ pending |
| 18-15-T1, 18-15-T2, 18-16-T1, 18-16-T2, 18-19-T1, 18-19-T2 | 18-15, 18-16, 18-19 | 10, 11, 14 | LBOX-09 | — | Region-only stepping (18-15); end card (one extra step, D-12; Next disabled on the card; URL/title stay on last photo) (18-16); focus return (LBOX-08); neighbour preload uses the right format (13 #33); stage `sizes` from the new layout (13 #34) | unit + e2e | `npx jest components/photos/__tests__/photo-viewer.test.tsx components/photos/__tests__/lightbox-dialog.test.tsx lib/__tests__/photos-stepping.test.ts lib/__tests__/regions.test.ts lib/__tests__/lightbox-tiers.test.ts`; `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts e2e/photos-stepping.spec.ts e2e/photos-region.spec.ts --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s` | ✅ extend | ⬜ pending |
| 18-04, 18-05, 18-14, 18-20, 18-28 (T1-T3) | rounds | 3, 4, 9, 15, 23 | all | — | No unexpected pixel change; only declared PNG sets change (D-21, D-22, D-24) | visual + guard | CI "Visual Regression"; `node scripts/ci/check-snapshot-commit.mjs --none` (or `--allow <slug>` on Tim's PNG commits) | ✅ | ⬜ pending |
| 18-07-T2, 18-12-T2, 18-18-T2, 18-22-T2 (record) · 18-25-T2, 18-29-T1 (gate) | several | 3-24 | all | — | Client JS recorded after each addition (18-07, 18-12, 18-18) and after the switch leaves /photos (18-22); enforced at ≤ 1,855,841 B once the switch, grid and carousel are retired (18-25) and at the tip (18-29); registry/overview/sources strings absent from client chunks | build measurement | `rm -rf .next/static && npm run build`, byte-sum `.next/static/chunks/**/*.js`, `grep -rl` checks; `git restore public/service-worker.js` | scripted | ⬜ pending |
| 18-02-T2, 18-23-T1, 18-29-T1 | 18-02, 18-23, 18-29 | 1, 18, 24 | all | — | Client graph keeps server-only modules out | unit | `npx jest lib/__tests__/client-graph.test.ts` | ✅ extend | ⬜ pending |
| 18-29-T1 | 18-29 | 24 | all | — | Type-check passes on all three configs; no focus/skip; guards green | tooling + guard | `npm run type-check && npm run lint && npm run guard:selftest` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

### GUARD-03 phase floor: projected counts

Phase start measured at `769e1b8` (dev listing): Jest 2,385 + e2e 639 = 3,024; 18-01 Task 3 raises the committed floor to the re-measured value. Deltas are lower bounds from the plans' own task text (one test per behavior row, named row or visual shot; rows for functions or pages that do not exist yet count as additions, in-place rewrites as zero; retirements per the allowance tables). Execution order is wave order. `*` marks a `ci/18-*` push, where CI's Unit Tests job runs guard:tests (its production listing only adds @prod-only rows, so CI never counts less than this table).

| Plan | ΔJest ≥ | Δe2e ≥ | Jest | e2e | Total | Over floor |
|---|---|---|---|---|---|---|
| 18-01 * | 0 | 0 | 2,385 | 639 | 3,024 | 0 |
| 18-02, 03, 06, 13 | +21 | +4 | 2,406 | 643 | 3,049 | +25 |
| 18-04 * | 0 | 0 | 2,406 | 643 | 3,049 | +25 |
| 18-07 | +7 | 0 | 2,413 | 643 | 3,056 | +32 |
| 18-05 * | 0 | +3 | 2,413 | 646 | 3,059 | +35 |
| 18-08 to 18-12 | +15 | +5 | 2,428 | 651 | 3,079 | +55 |
| 18-14 * | 0 | +15 | 2,428 | 666 | 3,094 | +70 |
| 18-15 to 18-19 | +12 | +6 | 2,440 | 672 | 3,112 | +88 |
| 18-20 * | 0 | 0 | 2,440 | 672 | 3,112 | +88 |
| 18-21 | 0 | −2 | 2,440 | 670 | 3,110 | +86 |
| 18-22 | +4 | −1 | 2,444 | 669 | 3,113 | +89 |
| 18-23 | 0 | +3 | 2,444 | 672 | 3,116 | +92 |
| 18-24 | −16 | 0 | 2,428 | 672 | 3,100 | +76 |
| 18-25 | −11 | 0 | 2,417 | 672 | 3,089 | +65 |
| 18-26 | 0 | 0 | 2,417 | 672 | 3,089 | +65 |
| 18-27 | −23 | 0 | 2,394 | 672 | 3,066 | +42 |
| 18-28 * | 0 | −6 | 2,394 | 666 | 3,060 | +36 |
| 18-29 * | 0 | 0 | 2,394 | 666 | 3,060 | +36 |

18-21 and 18-22 are counted at their allowance-gate floors for e2e (start − R_e2e: 2 and 1), ignoring the additions their task text implies (18-21's sweep loops gain region and photo-page surfaces; 18-22 adds a browser redirect row); 18-22's Jest delta is its four proxy behavior rows, and 18-23's e2e delta is its new overview-sheet rows (its regions.test row is not counted). Against the earlier projection this lowers every total from 18-21 on by 3. The floor is still never crossed; the lowest margin after a retirement is +36 (18-28, 18-29, the `ci/18-28` and `ci/18-29` pushes), and each runner also ends at or above its own phase-start count (Jest 2,394 ≥ 2,385, e2e 666 ≥ 639).

---

## Wave 0 Requirements

- [ ] (18-01) Resolve the inherited `e2e/og.spec.ts` pin failure (bisect 038a4cb..4d79f22, then restore the hash or bring Tim a re-pin decision) and classify the WebKit B8 timeout (Pitfall 1)
- [ ] (18-13) `lib/__tests__/overview-layout.test.ts`: sweep S 312–1100 + count guards (REGION-01)
- [ ] (18-09) `lib/__tests__/plate-layout.test.ts`: sweep S 320–634, near-duplicate pairs including Saalfelden's aerial pair (REGION-02)
- [ ] (18-08, 18-19) `lib/__tests__/image-sizes.test.ts`: `sizes` strings derived from tier constants (13 #34)
- [ ] (18-12) `lib/__tests__/region-rail.test.ts`: tick model + >16 guard (REGION-05)
- [ ] (18-07) `components/photos/__tests__/share-button.test.tsx` (PHOTO-07)
- [ ] (18-02, 18-03) `data/__tests__/sources.test.ts`: verbatim equality + anchors (REGION-06)
- [ ] No framework install needed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Web Share sheet opens on a device with `navigator.share` | PHOTO-07 | Headless Chromium and Firefox have no `navigator.share`; the share path is only stubbed in automation | On a phone (iOS Safari or Android Chrome), open a photo page and a region page, press Share, confirm the OS sheet opens with the right URL and title |
| Declared baseline PNGs look right before Tim commits them | all (D-24) | Visual judgement on the downloaded artifact | Download the `visual-baselines` artifact, compare against the UI-SPEC, then Tim commits the PNGs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
