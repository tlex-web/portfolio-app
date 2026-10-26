---
phase: "10"
slug: "photography"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: false
wave_0_complete: true
created: "2026-10-26"
validated: "2026-10-26"
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.4.2 (next/jest, jsdom 26.1.0) + Playwright 1.64.0 (`chromium`, `firefox`, `visual-dark`, `visual-light`; local `webkit` cannot hydrate localhost under the CSP `upgrade-insecure-requests` header, and CI has no WebKit project) |
| **Config file** | `jest.config.js`, `jest.setup.js`, `playwright.config.ts` |
| **Quick run command** | `npx jest --silent` (63 suites, 942 tests, ~10 s; the earlier `lib/__tests__/photos components/photos` filter missed 8 Phase 10 suites), plus `npm run lint && npm run type-check` |
| **Full suite command** | `npm run lint && npm run type-check && npm test && npx playwright test --project=chromium --project=firefox` (`PW_PROD=1` for production parity, as CI runs) |
| **Estimated runtime** | ~240 seconds full, ~10 seconds quick; the visual suite runs only in CI |

---

## Sampling Rate

- **After every task commit:** Run the quick command above
- **After every plan wave:** Run the full suite command above, then push `ci/10-NN` and dispatch the visuals (Tim approves each push)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 240 seconds

---

## Per-Task Verification Map

"Green" means Jest green locally at HEAD, and e2e and visual green on CI run 40367226761 (attempts 1 and 2) on 483895b. The four Nyquist tests added in dabafb4 were run locally against the production build (`PW_PROD=1`, `--repeat-each=3`, chromium and firefox): 21/21 passed. In the commands, `-g` narrows a plan's verify command to that task's describe block; where a cell shows `\|`, type a plain `|` in a real shell.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | LBOX-01, PHOTO-03 | T-10-01, T-10-03 | Unknown or wrong-case slug returns 404 (`dynamicParams = false`); stage serves only hashed derivatives | unit + e2e | `npx jest lib/__tests__/photos-view-model.test.ts --silent && npx playwright test e2e/photos-lightbox.spec.ts e2e/shell.spec.ts --project=chromium` | ✅ | ✅ green |
| 10-01-02 | 01 | 1 | LBOX-04 | T-10-02 | Coordinates printed at 4 dp; film scan always "≈ … ±100 m (approx.)" | unit | `npx jest lib/__tests__/photo-format.test.ts lib/__tests__/home-format.test.ts lib/__tests__/photos-view-model.test.ts --silent` | ✅ | ✅ green |
| 10-01-03 | 01 | 1 | LBOX-04, LBOX-07 | T-10-03 | No link or download control in the strip or viewer | component + e2e | `npx jest components/photos/__tests__/strip.test.tsx --silent && npx playwright test e2e/photos-lightbox.spec.ts --project=chromium -g "Photo page"` | ✅ | ✅ green |
| 10-02-01 | 02 | 1 | PHOTO-01, LBOX-04 | T-10-04, T-10-07 | Off-sheet uv rejected; hand-placed position cannot claim `exif` | unit + build check | `npx jest data/__tests__/photos.test.ts data/__tests__/exif-sidecar.test.ts --silent && npm run data:check` | ✅ | ⚠️ partial: the WR-03 offset guard and the WR-01 build-time throw have no regression test (G5, deferred; WR-01 is also enforced by the schema, `data/__tests__/photos.test.ts:235`) |
| 10-02-02 | 02 | 1 | PHOTO-01, LBOX-04 (WR-05/06/07) | T-10-05, T-10-06 | Raw and HEIF files under public fail the guard; derive validates before it unlinks | guard selftest | `npm run guard:selftest && npm run guard:images && npm run data:check` | ✅ | ⚠️ partial: WR-06 covered (`scripts/guards/selftest.mjs:564`); WR-05 order untested (G6, deferred); WR-07 manual |
| 10-03-01 | 03 | 2 | LBOX-04 | — | Gallery contrast pairs guarded (36 pairs) | unit + e2e + guard | `npx jest lib/__tests__/lightbox-tiers.test.ts --silent && npm run guard:contrast && npx playwright test e2e/photos-lightbox.spec.ts --project=chromium -g "Viewer layout tiers"` | ✅ | ✅ green |
| 10-03-02 | 03 | 2 | LBOX-07 | T-10-08, T-10-09 | Error state offers Retry, no file link, no download | e2e | `npx playwright test e2e/photos-lightbox.spec.ts --project=chromium -g "Stage states"` | ✅ | ✅ green |
| 10-04-01 | 04 | 2 | PHOTO-02 | T-10-10 | `?view` whitelisted; anything else falls back to the map | unit | `npx jest lib/__tests__/photos-view-param.test.ts lib/__tests__/photos-justify.test.ts --silent` | ✅ | ✅ green |
| 10-04-02 | 04 | 2 | PHOTO-02, PHOTO-03 | T-10-11 | Tiles use only hashed derivatives | component + e2e | `npx jest components/__tests__/GalleryGrid.test.tsx --silent && npx playwright test e2e/photos.spec.ts --project=chromium -g "Grid view"` | ✅ | ✅ green |
| 10-05-01 | 05 | 3 | LBOX-01 | T-10-12 | Intercepted route only for known slugs | component + e2e | `npx jest components/photos/__tests__/lightbox-dialog.test.tsx --silent && npx playwright test e2e/photos-lightbox.spec.ts e2e/photos.spec.ts --project=chromium --project=firefox -g "Lightbox over the gallery\|Grid view"` | ✅ | ✅ green |
| 10-05-02 | 05 | 3 | LBOX-03 | T-10-13 | Escape and close guards; scroll lock released on unmount | e2e + component | `npx playwright test e2e/photos-lightbox.spec.ts e2e/design-system.spec.ts --project=chromium --project=firefox -g "Focus and Escape\|scroll lock"` | ✅ | ✅ green (Safari manual) |
| 10-05-03 | 05 | 3 | LBOX-01 (D-08) | — | N/A | component + e2e | `npx jest components/home/__tests__/waypoints.test.tsx --silent && npx playwright test e2e/home-ascent.spec.ts --project=chromium -g "View photo"` | ✅ | ✅ green |
| 10-06-01 | 06 | 4 | LBOX-02 (URL mechanism decision) | — | N/A | checkpoint:decision | n/a (Tim's answer recorded in 10-06-SUMMARY) | — | n/a |
| 10-06-02 | 06 | 4 | LBOX-02 | T-10-14, T-10-15 | Steps only to known neighbour slugs; `replaceState` adds no history entries; the next photo is preloaded | unit + e2e | `npx jest lib/__tests__/photos-stepping.test.ts --silent && npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox -g "Moving between photos\|preload"` | ✅ | ✅ green (preload added in dabafb4, `e2e/photos-lightbox.spec.ts:489`) |
| 10-06-03 | 06 | 4 | LBOX-06 | — | N/A | e2e | `npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox -g "Morph and motion"` | ✅ | ✅ green (feel manual) |
| 10-07-01 | 07 | 4 | PHOTO-02, PHOTO-04 | T-10-17 | Arrow keys act only with focus inside the region | e2e | `npx playwright test e2e/photos-carousel.spec.ts e2e/no-webgl.spec.ts --project=chromium --project=firefox` | ✅ | ✅ green |
| 10-07-02 | 07 | 4 | PHOTO-04, PHOTO-03 | T-10-16 | WebGL failure falls back to the stepper; float pauses; textures are hashed derivatives only | e2e (@chromium-only) | `npx playwright test e2e/photos-carousel.spec.ts --project=chromium -g "3D carousel\|3D textures"` | ✅ | ✅ green (3D textures added in dabafb4, `e2e/photos-carousel.spec.ts:256`; offscreen pause manual) |
| 10-08-01 | 08 | 5 | PHOTO-01 | T-10-18 | Map CSS built only from numbers, the 4 slugs and fixed selectors | unit | `npx jest lib/__tests__/photos-label-layout.test.ts --silent` | ✅ | ✅ green |
| 10-08-02 | 08 | 5 | PHOTO-01, PHOTO-03 | T-10-19 (accept) | N/A | component + e2e | `npx jest components/photos/__tests__/map.test.tsx --silent && npx playwright test e2e/photos.spec.ts --project=chromium --project=firefox -g "Map view"` | ✅ | ✅ green (plate-fit e2e added in 487e113) |
| 10-08-03 | 08 | 5 | PHOTO-01 (D-14) | — | N/A | component + unit | `npx jest components/photos/__tests__/header.test.tsx lib/__tests__/home-format.test.ts components/site/__tests__/SiteFooter.test.tsx --silent` | ✅ | ✅ green |
| 10-10-01 | 10 | 5 | LBOX-02 | — | N/A | unit | `npx jest lib/__tests__/photos-zoom.test.ts --silent` | ✅ | ✅ green |
| 10-10-02 | 10 | 5 | LBOX-02, LBOX-03 | T-10-22 | Native pinch never blocked (touch-action) | e2e | `npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox -g "Zoom"` | ✅ | ✅ green (touch feel manual) |
| 10-09-01 | 09 | 6 | PHOTO-02 | — | N/A | component + unit + e2e | `npx jest components/photos/__tests__/view-switcher.test.tsx lib/__tests__/photos-view-param.test.ts --silent && npx playwright test e2e/photos.spec.ts --project=chromium --project=firefox -g "View switcher"` | ✅ | ✅ green |
| 10-09-02 | 09 | 6 | LBOX-04 | T-10-20, T-10-21 | No source reads a legacy path; palette ratchet tightened | unit + guard + ratchet | `npx jest lib/__tests__/photos-view-model.test.ts data/__tests__/editorial.test.ts components/photos/__tests__/strip.test.tsx --silent && npm run guard:palette` | ✅ | ✅ green |
| 10-11-01 | 11 | 6 | LBOX-05 | T-10-24, T-10-25 | One `photos.labels` key; safe when storage throws; nothing else stored | unit | `npx jest lib/__tests__/photos-hotspots.test.ts lib/__tests__/photos-hotspot-pref.test.ts lib/__tests__/photos-view-model.test.ts --silent` | ✅ | ✅ green |
| 10-11-02 | 11 | 6 | LBOX-05, LBOX-04 | T-10-23 | Fact links open with `target=_blank rel="noopener noreferrer"` | component + e2e | `npx jest components/photos/__tests__/hotspots.test.tsx components/photos/__tests__/strip.test.tsx --silent && npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox -g "Hotspots"` | ✅ | ✅ green (scroll-tier dots and key, `:1032`, and leader lines, `:1063`, added in dabafb4) |
| 10-12-01 | 12 | 7 | PHOTO-02, LBOX-01 | T-10-26 | Explicit snapshot name arrays (no orphan PNGs) | visual | `npx playwright test e2e/visual/routes.spec.ts --list --project=visual-dark` (CI: `--project=visual-dark --project=visual-light --update-snapshots=none`) | ✅ | ✅ green (CI 96 passed) |
| 10-12-02 | 12 | 7 | PHOTO-02, LBOX-01, LBOX-02, LBOX-03, LBOX-07 | T-10-27 | Only hashed images and no download on all 8 surfaces | e2e | `npx playwright test e2e/photos-sweep.spec.ts --project=chromium --project=firefox` | ✅ | ✅ green |
| 10-13-01 | 13 | 8 | — | T-10-28 | Push and dispatch gated on Tim | checkpoint:decision | n/a | — | n/a |
| 10-13-02 | 13 | 8 | PHOTO-01, PHOTO-02, LBOX-04, LBOX-06 | T-10-29 | Only the allowed snapshot directories changed | CI visual + snapshot guard | `node scripts/ci/check-snapshot-commit.mjs --sha 483895b --some --allow photos --allow photos-grid --allow photos-carousel --allow photo --allow lightbox` | ✅ (15 PNGs in 483895b) | ✅ green (look manual) |
| 10-13-03 | 13 | 8 | — | T-10-30 | Ratchet only rises | guard | `npx jest --json --outputFile=<tmp>/jest-results.json --silent && node scripts/guards/test-count.mjs --jest <tmp>/jest-results.json` | ✅ | ✅ green (1304 ≥ baseline 1300 after dabafb4) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky or partial*

Sampling continuity: every task has an `<automated>` verify except the three checkpoints (10-06-01, 10-13-01, 10-13-02); 10-13-02 is still machine-checked by `check-visual-run.mjs` and `check-snapshot-commit.mjs`. No three consecutive tasks lack an automated verify, and no command uses watch mode.

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Jest, Playwright and their configs already existed. Every TDD task committed its failing tests first (RED evidence in the SUMMARYs and in `.red/`: 10-07-t1, 10-07-t2, 10-08-t2, 10-09-t1, 10-11-t2). Shared fixtures were added inside the tasks that needed them: the `HTMLDialogElement` stub in `jest.setup.js:42-52` (10-05) and `e2e/helpers/view-transitions.ts` (10-06).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dialog Tab wrap, stepping with `replaceState`, morph and zoom in real Safari (assumption A1) | LBOX-03, LBOX-02, LBOX-06 | Local Playwright WebKit cannot hydrate localhost: the CSP `upgrade-insecure-requests` header from `proxy.ts` upgrades `/_next/static` to https (deferred-items.md, 10-05). CI has no WebKit project (`playwright.config.ts:75-82`). | On macOS or iOS Safari against the production preview: open a grid tile; Tab and Shift+Tab 12 times each stay in the dialog; Next three times leaves Back one step from the grid; Escape returns focus to the tile; the morph plays where supported; Z zooms and pans. |
| Swipe follow and spring-back, drag pan, native pinch over zoom with a real finger | LBOX-02 | e2e dispatches synthetic pointer events; it proves the state changes, not the feel. | On a phone: swipe left and right on the photo; pinch the zoomed photo; drag-pan at 1:1. |
| Quality of the morph, the 250 ms view crossfade and the 150 ms plain-enter fade | LBOX-06, PHOTO-02 | Motion feel needs a human eye; e2e proves only the pseudo-elements. | Open from the grid, map and carousel at 375, 1024 and 1440; switch views. |
| Visual look of the map, grid, 3D scene and stepper, photo page tiers, lightbox, strip hierarchy, callout legibility over sky and rock, and the 1024 × 768 key tier shrinking the photo when a key row opens | PHOTO-01, PHOTO-02, LBOX-04, LBOX-05 | Design judgement. The baselines (commit 483895b) prove stability, not quality; Tim committed them with the reply "pushed" and no per-shot notes. | Review the 15 PNGs against the 10-13 Task 2 checklist and the live site at 375, 768 and 1440. |
| 3D float pauses when the canvas is scrolled offscreen (IntersectionObserver) | PHOTO-04 (adjunct) | The test page cannot scroll the region fully out of view; only the hidden-tab pause is automated (`e2e/photos-carousel.spec.ts:274`). | On a capable device, scroll the carousel off screen and confirm with the DevTools FPS meter that frames stop. |
| `scripts/README.md` accuracy (WR-07) | — | Prose correctness. | Read it against the `package.json` scripts and the lint chain. |
| G5 (deferred): WR-03 `OffsetTimeOriginal` guard and WR-01 build-time throw in `scripts/photos/build-photo-data.mjs` | PHOTO-01, LBOX-04 (data correctness) | Automatable, but the script exports nothing and reads fixed paths, so a regression test needs a source change. Tim deferred it on 2026-10-26 ("Fill G1–G4, defer G5/G6 (Recommended)"). Verified once in 10-02 by a temporary sidecar probe. | Phase 12: move `zurichOffset`/`buildCapture` into an importable module or add `--sidecar`/`--corrections` flags plus a selftest fixture, then test +01:00 on a September capture throws. |
| G6 (deferred): WR-05 validate → write → unlink order in `scripts/photos/build-derivatives.mjs` | PHOTO-01 (data pipeline) | Same testability limit (no `--out-dir`); deferred by Tim with G5. Verified once in 10-02 by a manual run with a clean `git status`. | Phase 12: add an `--out-dir` flag and a selftest case with an invalid source; existing files must survive and the exit code must be 1. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 240s
- [ ] `nyquist_compliant: true` set in frontmatter — not set: all 11 requirements have green automated coverage, but two automatable task-level regression tests (G5, G6) are deferred to Phase 12 by Tim's choice

**Approval:** validated 2026-10-26 (partial: G5 and G6 deferred)

## Validation Audit 2026-10-26

| Metric | Count |
|---|---|
| Gaps found | 6 |
| Resolved | 4 |
| Escalated | 0 |
| Deferred to manual-only (Tim) | 2 |
