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
- **Before `/gsd-verify-work`:** full suite green; a `ci/18-*` push (D-23 standing approval, including plan-declared dispatches) with every CI job green, including Visual Regression; per-leg E2E durations recorded (D-26); client JS measured against the cap of 1,855,841 B (phase base 1,851,745 B at `a857d35` + 4,096 B); declared baseline rounds closed with Tim's PNG commits; HOME-08 perf dispatch re-run after the last shared-chunk change (D-24)
- **Max feedback latency:** ~60 s for the per-task loop

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | REGION-01 | — | Overview layout invariants across sheet widths 312–1100; region/summit count guards; one outline per region | unit (sweep) | `npx jest lib/__tests__/overview-layout.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | REGION-01 | — | One marker per region numbered west→east; list is the keyboard path; no overlap at 375/768/1024/1440; markers `tabIndex=-1` | e2e | `PW_PROD=1 npx playwright test e2e/photos.spec.ts --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s` | ✅ rewrite | ⬜ pending |
| TBD | TBD | TBD | REGION-01 | — | West→east order derived from outlines (D-01) | unit | `npx jest lib/__tests__/regions.test.ts` | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | REGION-02 | — | Header, facts, plate, key list, next-region wrap (D-11), visible breadcrumb = `BreadcrumbList` JSON-LD (D-10) | unit + e2e | `npx jest lib/__tests__/json-ld.test.ts lib/__tests__/plate-layout.test.ts` + `PW_PROD=1 npx playwright test e2e/photos-region.spec.ts --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s` | ✅ / ❌ W0 plate-layout | ⬜ pending |
| TBD | TBD | TBD | REGION-03 | — | Ascending altitude order; uncropped (±1 %); captions always visible; `currentSrc` matches rendered width | e2e + unit | `e2e/photos-region.spec.ts` (command above); `npx jest lib/__tests__/image-sizes.test.ts` | ✅ extend / ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | REGION-04 | — | Neatline and ticks outside the image, never over it; no horizontal scroll at 375 | e2e | `e2e/photos-region.spec.ts` (command above) | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | REGION-05 | — | Rail `data-rail-current` follows the centred figure ≥768 px; hidden <768 px with `n / N` captions (D-07); >16 photos guard | e2e + unit | `e2e/photos-region.spec.ts` (command above); `npx jest lib/__tests__/region-rail.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | REGION-06 | — | Sheet margins non-empty and mapped to `/sources` anchors (D-17); `/sources` verbatim string equality (D-20); footer short credit + link on every route (D-16) | unit + e2e | `npx jest components/site/__tests__/SiteFooter.test.tsx data/__tests__/sources.test.ts`; `PW_PROD=1 npx playwright test e2e/shell.spec.ts e2e/seo.spec.ts e2e/audit.spec.ts --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s` | ✅ rewrite / ❌ W0 sources | ⬜ pending |
| TBD | TBD | TBD | PHOTO-06 | TBD | `?view=` redirect matrix: 308, query dropped, `grid`/`carousel` → Zermatt (D-03) | unit + e2e | `npx jest lib/__tests__/proxy.test.ts`; `e2e/photos.spec.ts` (command above) | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | PHOTO-06 | — | No view switcher; view tests rewritten, not deleted; the 600 ms sleep in the sweep becomes a positive signal (13 #38) | e2e | `PW_PROD=1 npx playwright test e2e/photos-sweep.spec.ts --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s` | ✅ rewrite | ⬜ pending |
| TBD | TBD | TBD | PHOTO-07 | TBD | Copy mode by default; share mode with stubbed API; `AbortError` silent; copy failure selects the URL; label and accessible name say which | unit (RTL) + e2e | `npx jest components/photos/__tests__/share-button.test.tsx`; `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | PHOTO-08 | — | LV95 only for CH, rounded by precision (D-15), `≈` when approximate, derived from the shown WGS84; WGS84 only elsewhere | unit | `npx jest lib/__tests__/photos-view-model.test.ts components/photos/__tests__/strip.test.tsx` | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | LBOX-09 | — | Region-only stepping; end card (one extra step, D-12; Next disabled; URL/title stay on last photo); focus return (LBOX-08); neighbour preload uses the right format (13 #33); stage `sizes` from the new layout (13 #34) | unit + e2e | `npx jest components/photos/__tests__/photo-viewer.test.tsx lib/__tests__/photos-stepping.test.ts lib/__tests__/lightbox-tiers.test.ts`; `e2e/photos-lightbox.spec.ts` (command above) | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | all | — | No unexpected pixel change; only declared PNG sets change (D-21, D-22, D-24) | visual + guard | CI "Visual Regression"; `node scripts/ci/check-snapshot-commit.mjs --none` (or `--allow <slug>` on Tim's PNG commits) | ✅ | ⬜ pending |
| TBD | TBD | TBD | all | — | Client JS ≤ 1,855,841 B; registry/overview/sources strings absent from client chunks | build measurement | `rm -rf .next/static && npm run build`, byte-sum `.next/static/chunks/**/*.js`, `grep -rl` checks; `git restore public/service-worker.js` | scripted | ⬜ pending |
| TBD | TBD | TBD | all | — | Client graph keeps server-only modules out | unit | `npx jest lib/__tests__/client-graph.test.ts` | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | all | — | Type-check passes on all three configs; no focus/skip; guards green | tooling + guard | `npm run type-check && npm run lint && npm run guard:selftest` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Resolve the inherited `e2e/og.spec.ts` pin failure (bisect 038a4cb..4d79f22, then restore the hash or bring Tim a re-pin decision) and classify the WebKit B8 timeout (Pitfall 1)
- [ ] `lib/__tests__/overview-layout.test.ts`: sweep S 312–1100 + count guards (REGION-01)
- [ ] `lib/__tests__/plate-layout.test.ts`: sweep S 320–634, near-duplicate pairs including Saalfelden's aerial pair (REGION-02)
- [ ] `lib/__tests__/image-sizes.test.ts`: `sizes` strings derived from tier constants (13 #34)
- [ ] `lib/__tests__/region-rail.test.ts`: tick model + >16 guard (REGION-05)
- [ ] `components/photos/__tests__/share-button.test.tsx` (PHOTO-07)
- [ ] `data/__tests__/sources.test.ts`: verbatim equality + anchors (REGION-06)
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
