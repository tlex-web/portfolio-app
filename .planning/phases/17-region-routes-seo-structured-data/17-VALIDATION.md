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
- **Execution order:** plans run one at a time in the shared working tree (executor isolation none); wave numbers order dependencies, not concurrency. No two plans build, serve or delete `.next/` output at once (port 3000 for Playwright's webServer, 3017 for the identity capture); every plan that builds or serves carries this as an executor rule.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-05-T1 | 17-05 | 2 | PHOTO-05 | T-17-11 | Proxy admits exactly the published slugs; static params = the published set; the v2.0 four keep their view (k/n/prev/next) | unit | `npx jest lib/__tests__/photo-routes.test.ts lib/__tests__/photos-view-model.test.ts` | ✅ rewrite pins | ⬜ pending |
| 17-05-T2, 17-07-T3 | 17-05, 17-07 | 2, 3 | PHOTO-05 | T-17-12 | v2.0 four: same `og:image` URL (with `?hash`) and 200 PNG; new photo pages 200 with cards | e2e | `npx playwright test e2e/og.spec.ts e2e/seo.spec.ts` | ✅ extend | ⬜ pending |
| 17-05-T1 (base), 17-05-T2, 17-06-T2, 17-07-T3, 17-12-T2, 17-13-T2, 17-15-T1 | 17-05, 17-06, 17-07, 17-12, 17-13, 17-15 | 2-7 | PHOTO-05 | T-17-12 | v2.0 four identical to the phase base 285b6d5 on every field: status, title, head tags, `og:image` URL with `?hash`, OG PNG SHA-256, `<main>` and whole HTML, with every `script[type="application/ld+json"]` removed from `<main>` on both the base and the later capture (D-07 amendment); rerun after each plan that edits the page, the viewer or the OG template; 17-13's rerun proves one block is stripped per slug | identity capture | the 17-05 scratchpad script in compare mode, `node <scratchpad>/v20-identity.mjs http://localhost:3017 <scratchpad>/v20-base.json` (exit 1 on any difference; source and base JSON recorded in 17-05-SUMMARY; each run's stdout, ending in its `v20-identity:` result line, pasted under the plan's "v2.0 identity (after 17-NN)" heading) | scripted | ⬜ pending |
| 17-05-T1 (control), 17-15-T1 (audit) | 17-05, 17-15 | 2, 7 | PHOTO-05 | T-17-12 | The identity comparison is shown able to fail (exit 1 with `differing=1` on each of 36 single-value mutants of the base, exit 0 on the unchanged base and on an `ldJsonRemoved`-only change), and every rerun's pasted `v20-identity:` result line is checked mechanically: exit=0, differing=0, compared=36, the base hash of 17-05's recorded base JSON, removed counts 1,1,1,1 for 17-13 and 0,0,0,0 otherwise, five distinct heads in the tip's history | control run + record audit | 17-05's scratchpad harness `node <scratchpad>/v20-control.mjs` (only passing record: `v20-control: mutants=36 caught=36 uncompared-exit=0 self-exit=0`); the record-audit node one-liner in 17-15-T1's verify, over the 17-05, 17-06, 17-07, 17-12 and 17-13 SUMMARYs | scripted | ⬜ pending |
| 17-06-T1, 17-06-T2 | 17-06 | 3 | PHOTO-05 | T-17-14 | New photo page hides stepping and counter; arrow keys and a touch swipe do nothing on a one-photo set; back link → region page; v2.0 four unchanged (D-08, D-09) | unit (RTL) + e2e | `npx jest components/photos` + `npx playwright test e2e/photos-region.spec.ts` | ❌ W0 (e2e, created by 17-01-T1) | ⬜ pending |
| every task; 17-15-T3 | all | 1-7 | PHOTO-05 | T-17-31 | No pixel change (D-10) | visual + guard | CI "Visual Regression" + `node scripts/ci/check-snapshot-commit.mjs --none` | ✅ | ⬜ pending |
| 17-07-T3, 17-10-T1, 17-10-T2 | 17-07, 17-10 | 3, 4 | REGION-07 | T-17-21 | Region pages: title, description, absolute canonical, OG card, sitemap entry; sitemap = canonicals exactly (D-15) | e2e + unit | `npx playwright test e2e/seo.spec.ts e2e/og.spec.ts`; `npx jest lib/og/__tests__/routes.test.ts` | ✅ extend | ⬜ pending |
| 17-01-T1 | 17-01 | 1 | REGION-07 | — | Spike checks as permanent tests: hard load/reload; `/photos` → region not intercepted; region → photo opens lightbox + Back; lightbox → region leaves no stuck modal | e2e (3 engines) | `npx playwright test e2e/photos-region.spec.ts` | ❌ W0 (17-01-T1 creates it) | ⬜ pending |
| 17-01-T1, 17-01-T3 | 17-01 | 1 | REGION-07 | T-17-01 | Unknown region and bare `/photos/regions` give the designed 404 with no token echo in HTML or flight data (D-04, D-05) | e2e + unit | `npx playwright test e2e/not-found.spec.ts`; `npx jest lib/__tests__/proxy.test.ts` | ✅ extend `MISSES` | ⬜ pending |
| 17-05-T2, 17-10-T2 | 17-05, 17-10 | 2, 4 | REGION-07 | — | Region page passes the production audit gate (`ROUTES` gains `/photos/regions/zermatt` in 17-01-T1; the other regions join the sweep in 17-10) | e2e | `npx playwright test e2e/audit.spec.ts`; `npx jest lib/__tests__/audit-routes.test.ts` | ✅ extend | ⬜ pending |
| 17-16-T1 | 17-16 | 2 | REGION-07 | T-17-33 | Region ids ∩ photo slugs ∩ reserved words (`regions`, `_`, `opengraph-image`, other static `/photos` segments) = ∅ (D-03) | unit | `npx jest lib/__tests__/regions.test.ts` | ❌ W0 (17-01-T3 creates the file, 17-16-T1 adds the D-03 rows) | ⬜ pending |
| 17-01-T3 | 17-01 | 1 | REGION-07 | — | No hand-built region path anywhere; every region URL from `regionHref` (D-06) | unit (source scan) | `npx jest lib/__tests__/photo-routes.test.ts` | ✅ extend patterns | ⬜ pending |
| 17-07-T2 | 17-07 | 3 | REGION-07 | T-17-16 | `cover` required and one of the region's own photos (D-13) | unit (schema) | `npx jest data/__tests__/photo-map.test.ts` | ✅ extend | ⬜ pending |
| 17-03-T3, 17-13-T2, 17-14-T1 | 17-03, 17-13, 17-14 | 1, 5, 6 | SEO-04 | T-17-06, T-17-25 | Every block parses; `<` escaped; no `license`/`acquireLicensePage`; coordinate decimals = the page's; every non-Person node (WebSite, ImageObject, ImageGallery, Software*) has `creator`, `copyrightNotice` and `creditText`, the Person none (reasoned exemption: CreativeWork properties); `copyrightNotice` = the printed rights line (the footer line for WebSite); `creditText` = `creator.name` (D-16..D-20) | unit | `npx jest lib/__tests__/json-ld.test.ts` | ❌ W0 (17-03-T3 creates it) | ⬜ pending |
| 17-14-T2 | 17-14 | 6 | SEO-04 | T-17-08 | Rendered pages carry exactly the expected `@type`s (none in the `@modal` page), the per-node creator/copyrightNotice/creditText rule holds, and no CSP violations | e2e | `npx playwright test e2e/seo.spec.ts e2e/audit.spec.ts` | ✅ extend | ⬜ pending |
| 17-03-T1, 17-03-T2 | 17-03 | 1 | SEO-04 | T-17-SC | `schema-dts` imported with `import type` only; exact pin; installed via bundled npm after Tim's package checkpoint (D-21) | unit + lockfile review | `npm run type-check` + `npm run guard:parity` | ✅ | ⬜ pending |
| 17-11-T1, 17-11-T2 | 17-11 | 3 | EDGE-03 | T-17-22 | Catalog lists regions + all photos with a region section label; rows only for cached exact paths (D-22) | unit + e2e | `npx jest lib/__tests__/saved-pages.test.ts components/site/__tests__/SavedPages.test.tsx`; `npx playwright test e2e/offline.spec.ts` | ✅ extend | ⬜ pending |
| 17-04-T1 | 17-04 | 1 | all (D-26) | T-17-09 | IT/AT photos get `Europe/Rome`/`Europe/Vienna`; every CH photo byte-identical in every generated output | unit + data check | `npx jest data/__tests__/photos.test.ts`; `npm run data:check` | ✅ extend | ⬜ pending |
| 17-12-T1, 17-12-T2 | 17-12 | 4 | all (D-24) | T-17-23, T-17-24 | One photo-path parser that never reads `/photos/regions[/<id>]` as a slug; one `isEditable` | unit | `npx jest lib/__tests__/photos-stepping.test.ts` | ✅ extend | ⬜ pending |
| 17-04-T2, 17-08-T1, 17-08-T2, 17-09-T1..T3, 17-13-T1, 17-15-T2 | 17-04, 17-08, 17-09, 17-13, 17-15 | 1-7 | all (D-23) | T-17-17, T-17-19 | 16 IN-01..IN-09 fixed; each written back to `16-REVIEW-DISPOSITION.md` with its SHA; `data:check` and selftest stay green | unit + guard | `npm test && npm run lint` | ✅ | ⬜ pending |
| 17-16-T2 | 17-16 | 2 | all | T-17-34 | Region registry stays out of client chunks (`data/regions/regions.json` in `SERVER_ONLY_MODULES`) | unit | `npx jest lib/__tests__/client-graph.test.ts` | ✅ extend | ⬜ pending |
| 17-16-T2, 17-05-T2, 17-06-T2, 17-11-T2, 17-12-T2, 17-15-T1 | 17-16, 17-05, 17-06, 17-11, 17-12, 17-15 | 2-7 | all | T-17-02, T-17-34 | Client JS ≤ 1,855,781 B; no region facts or new slugs in chunks | build measurement | `rm -rf .next/static && npm run build`, then the 16-01 byte-sum one-liner and a `grep -rl` over chunks; `git restore public/service-worker.js` | scripted | ⬜ pending |
| 17-02-T1 | 17-02 | 1 | all (D-25) | T-17-04, T-17-05 | CI gate still well-formed after any E2E shard/matrix; job names literal | guard | `npm run guard:ci && npm run guard:selftest` | ✅ | ⬜ pending |
| every task; 17-15-T1 | all | 1-7 | all | — | Type-check passes on all three configs; no focus/skip | tooling + guard | `npm run type-check && npm run guard:tests:scan` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/__tests__/json-ld.test.ts`: SEO-04 (parse, `<` escape, precision, no `license`, text equality with the page) — created by 17-03-T3, extended by 17-13-T2 and 17-14-T1
- [ ] `e2e/photos-region.spec.ts`: the D-01 navigation checks as permanent tests (17-01-T1), plus D-08/D-09 behaviour (17-06-T2)
- [ ] D-03 reserved-word and collision test — `lib/__tests__/regions.test.ts` (created by 17-01-T3), rows added by 17-16-T1
- [ ] `lib/__tests__/client-graph.test.ts`: add `data/regions/regions.json` to `SERVER_ONLY_MODULES` — 17-16-T2
- [ ] `e2e/audit.spec.ts`: a sweep timeout that scales with `AUDIT_SWEEP.length` (RESEARCH Pitfall 3) — 17-02-T2

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Region cover photos | REGION-07 (D-13) | Tim's choice | 17-07-T1 decision checkpoint before the region OG route is built; record his literal answer |
| Region titles, descriptions, OG alt, region rights line, case-study `copyrightNotice` and aerial description wording | REGION-07, SEO-04 (D-14) | Tim approves copy | 17-01-T2, the one copy checkpoint; approved text goes in verbatim (17-01-T3, 17-05-T2, 17-07-T3, 17-14-T1); the case-study option is (a) or (b), both readings of D-17, and a printed project rights line is not offered (it needs a D-10 amendment outside the phase) |
| `schema-dts` package verification | SEO-04 (D-21) | Tim's "verified" before install | 17-03-T1 package checkpoint (16-09 pattern): exact pin, registry facts, bundled npm |
| E2E Tests duration under ~45 min | all (D-25) | CI wall-clock | 17-15-T3 reads the `ci/17-15` run's per-leg job durations with `gh run view` and records them |
| Region OG card on a deployed build | REGION-07 (Pitfall 6) | Output tracing on Vercel | 17-15-T3 checks a deployment of the tip when one exists; otherwise /gsd-verify-work's live-DOM step |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
