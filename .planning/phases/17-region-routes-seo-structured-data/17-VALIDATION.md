---
phase: "17"
slug: "region-routes-seo-structured-data"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-23"
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `17-RESEARCH.md` § Validation Architecture. The planner fills in task IDs; until then, rows are keyed by requirement.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 (`next/jest`, jsdom default, `@jest-environment node` per file) and Playwright 1.65 (Chromium, Firefox and WebKit in CI; WebKit is not installed locally) |
| **Config file** | `jest.config.js`, `playwright.config.ts`, `tsconfig.jest.json`, `tsconfig.e2e.json` |
| **Quick run command** | `npx jest <touched test paths>`, e.g. `npx jest lib/__tests__/photo-routes.test.ts lib/__tests__/proxy.test.ts lib/__tests__/saved-pages.test.ts lib/__tests__/client-graph.test.ts lib/__tests__/json-ld.test.ts` |
| **Full suite command** | `npm run type-check && npm test && npm run lint` (lint includes `data:check` and the guards), then locally `PW_PROD=1 npx playwright test --project=chromium --project=firefox` |
| **Estimated runtime** | ~60 s per-task loop (touched Jest paths + type-check); full Jest several minutes; local production Playwright on touched specs a few minutes |

`npm run build`'s postbuild rewrites the tracked `public/service-worker.js`. Run `git restore public/service-worker.js` after every build, including the client-JS measurement build.

**Spike verdict (D-01/D-02):** PASS under both bundlers. `/photos/regions/<id>` is the region path. It needs the `null` slot page `app/(site)/photos/@modal/regions/[region]/page.tsx` and a three-segment region branch in `proxy.ts`; both were proven required.

---

## Sampling Rate

- **After every task commit:** `npx jest <touched test paths>` + `npm run type-check` + `node scripts/ci/check-snapshot-commit.mjs --none` (D-10)
- **After every plan wave:** `npm test && npm run lint`, plus a local production Playwright run of the touched specs (`PW_PROD=1 PW_REUSE=1`)
- **Before `/gsd-verify-work`:** full suite green; a `ci/17-*` push (D-27 standing approval) with every CI job green, including Visual Regression with no baseline update; `check-snapshot-commit --none` over the phase commits; the E2E Tests duration recorded (D-25); client JS measured against the cap of 1,855,781 B (phase base 1,851,685 B + 4,096 B)
- **Max feedback latency:** ~60 s for the per-task loop

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | PHOTO-05 | TBD | Proxy admits exactly the published slugs; static params = the published set; the v2.0 four keep their view (k/n/prev/next) | unit | `npx jest lib/__tests__/photo-routes.test.ts lib/__tests__/photos-view-model.test.ts` | ✅ rewrite pins | ⬜ pending |
| TBD | TBD | TBD | PHOTO-05 | — | v2.0 four: same `og:image` URL (with `?hash`) and 200 PNG; new photo pages 200 with cards | e2e | `npx playwright test e2e/og.spec.ts e2e/seo.spec.ts` | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | PHOTO-05 | — | New photo page hides stepping and counter; back link → region page; v2.0 four unchanged (D-08, D-09) | unit (RTL) + e2e | `npx jest components/photos` + `npx playwright test e2e/photos-region.spec.ts` | ❌ W0 (e2e) | ⬜ pending |
| TBD | TBD | TBD | PHOTO-05 | — | No pixel change (D-10) | visual + guard | CI "Visual Regression" + `node scripts/ci/check-snapshot-commit.mjs --none` | ✅ | ⬜ pending |
| TBD | TBD | TBD | REGION-07 | — | Region pages: title, description, absolute canonical, OG card, sitemap entry; sitemap = canonicals exactly (D-15) | e2e + unit | `npx playwright test e2e/seo.spec.ts e2e/og.spec.ts`; `npx jest lib/og/__tests__/routes.test.ts` | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | REGION-07 | — | Spike checks as permanent tests: hard load/reload; `/photos` → region not intercepted; region → photo opens lightbox + Back; lightbox → region leaves no stuck modal | e2e (3 engines) | `npx playwright test e2e/photos-region.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | REGION-07 | TBD | Unknown region and bare `/photos/regions` give the designed 404 with no token echo in HTML or flight data (D-04, D-05) | e2e + unit | `npx playwright test e2e/not-found.spec.ts`; `npx jest lib/__tests__/proxy.test.ts` | ✅ extend `MISSES` | ⬜ pending |
| TBD | TBD | TBD | REGION-07 | — | Region page passes the production audit gate (`ROUTES` gains `/photos/regions/zermatt`) | e2e | `npx playwright test e2e/audit.spec.ts`; `npx jest lib/__tests__/audit-routes.test.ts` | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | REGION-07 | — | Region ids ∩ photo slugs ∩ reserved words (`regions`, `_`, `opengraph-image`, other static `/photos` segments) = ∅ (D-03) | unit | `npx jest lib/__tests__/photo-routes.test.ts` (or `region-series.test.ts`) | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | REGION-07 | — | No hand-built region path anywhere; every region URL from `regionHref` (D-06) | unit (source scan) | `npx jest lib/__tests__/photo-routes.test.ts` | ✅ extend patterns | ⬜ pending |
| TBD | TBD | TBD | REGION-07 | — | `cover` required and one of the region's own photos (D-13) | unit (schema) | `npx jest data/__tests__` (region schema test) | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | SEO-04 | TBD | Every block parses; `<` escaped; no `license`/`acquireLicensePage`; coordinate decimals = the page's; `copyrightNotice` = the printed rights line; `creditText` = `creator.name` (D-16..D-20) | unit | `npx jest lib/__tests__/json-ld.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SEO-04 | TBD | Rendered pages carry exactly the expected `@type`s (none in the `@modal` page) and no CSP violations | e2e | `npx playwright test e2e/seo.spec.ts e2e/audit.spec.ts` | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | SEO-04 | — | `schema-dts` imported with `import type` only; exact pin; installed via bundled npm after Tim's package checkpoint (D-21) | unit + lockfile review | `npm run type-check` + `npm run guard:parity` | ✅ | ⬜ pending |
| TBD | TBD | TBD | EDGE-03 | — | Catalog lists regions + all photos with a region section label; rows only for cached exact paths (D-22) | unit + e2e | `npx jest lib/__tests__/saved-pages.test.ts components/site/__tests__/SavedPages.test.tsx`; `npx playwright test e2e/offline.spec.ts` | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | all (D-26) | — | IT/AT photos get `Europe/Rome`/`Europe/Vienna`; the four CH photos byte-identical in every generated output | unit + data check | `npx jest data/__tests__/photos.test.ts`; `npm run data:check` | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | all (D-24) | — | One photo-path parser that never reads `/photos/regions[/<id>]` as a slug; one `isEditable` | unit | `npx jest lib/__tests__/photos-stepping.test.ts` | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | all (D-23) | — | 16 IN-01..IN-09 fixed; each written back to `16-REVIEW-DISPOSITION.md` with its SHA; `data:check` and selftest stay green | unit + guard | `npm test && npm run lint` | ✅ | ⬜ pending |
| TBD | TBD | TBD | all | — | Region registry stays out of client chunks (`data/regions/regions.json` in `SERVER_ONLY_MODULES`) | unit | `npx jest lib/__tests__/client-graph.test.ts` | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | all | — | Client JS ≤ 1,855,781 B; no region facts or new slugs in chunks | build measurement | `rm -rf .next/static && npm run build`, then the 16-01 byte-sum one-liner and a `grep -rl` over chunks; `git restore public/service-worker.js` | scripted | ⬜ pending |
| TBD | TBD | TBD | all (D-25) | — | CI gate still well-formed after any E2E shard/matrix; job names literal | guard | `npm run guard:ci && npm run guard:selftest` | ✅ | ⬜ pending |
| TBD | TBD | TBD | all | — | Type-check passes on all three configs; no focus/skip | tooling + guard | `npm run type-check && npm run guard:tests:scan` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/__tests__/json-ld.test.ts`: SEO-04 (parse, `<` escape, precision, no `license`, text equality with the page)
- [ ] `e2e/photos-region.spec.ts`: the D-01 navigation checks as permanent tests, plus D-08/D-09 behaviour
- [ ] D-03 reserved-word and collision test
- [ ] `lib/__tests__/client-graph.test.ts`: add `data/regions/regions.json` to `SERVER_ONLY_MODULES`
- [ ] `e2e/audit.spec.ts`: a sweep timeout that scales with `AUDIT_SWEEP.length` (RESEARCH Pitfall 3)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Region cover photos | REGION-07 (D-13) | Tim's choice | Decision checkpoint before the region OG route is built; record his literal answer |
| Region titles, descriptions, OG alt and case-study `copyrightNotice` wording | REGION-07, SEO-04 (D-14) | Tim approves copy | One copy checkpoint during execution; approved text goes in verbatim |
| `schema-dts` package verification | SEO-04 (D-21) | Tim's "verified" before install | Package checkpoint (16-09 pattern): exact pin, registry facts, bundled npm |
| E2E Tests duration under ~45 min | all (D-25) | CI wall-clock | Read the `ci/17-*` run's job durations with `gh run view` and record them |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
