---
phase: "12"
slug: "contact-edge-pages-cleanup-verification"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-02"
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.4 (next/jest, jsdom; `@jest-environment node` for API routes) + Playwright 1.64 (`chromium`, `firefox`, and `webkit` once added in Wave 0; `visual-*` in CI only) + @axe-core/playwright |
| **Config file** | `jest.config.js`, `jest.setup.js`, `playwright.config.ts` |
| **Quick run command** | `npm run lint && npm run type-check && npx jest <touched paths> --silent` (lint runs every guard, `data:check` and `photos:derive --check`) |
| **Full suite command** | `npm run lint && npm run type-check && npm test && PW_PROD=1 npx playwright test --project=chromium --project=firefox --project=webkit` |
| **Guards** | `npm run data:check`; `npm run guard:selftest && npm run guard:images`; `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` (tests are rewritten, never deleted; test-count ratchet ≥ 1749 at phase start) |
| **Estimated runtime** | ~40 seconds quick (measured 2026-11-02 on this machine: `npm run lint` 32 s, `npm run type-check` 3 s, touched Jest files a few seconds; the full Jest suite 12 s, 82 suites); a per-task production check is one or two specs against the already-running build (no build inside the command, see Execution notes); ~300 seconds full with three browser projects (visual suite runs only in CI) |

---

## Sampling Rate

- **After every task commit:** the touched Jest files plus the one relevant spec on chromium (`PW_PROD=1 PW_REUSE=1` against the plan's one production build for service-worker, 404, OG-image and other production work; 12-02 Tasks 1 and 2 run before the switch exists and keep one fresh build per check)
- **After every plan wave:** `npm run lint && npm run type-check && npm test`, then that wave's e2e set on chromium + firefox (+ webkit once the D-17 CSP condition lands)
- **Before `/gsd-verify-work`:** full suite green on all three projects, CI green on a `ci/12-NN` push, the visual round's expected-diff list matched, test count ≥ 1749
- **Max feedback latency:** 300 seconds

---

## Execution Notes

**Build once, reuse the server (per-task checks).** 12-02 Task 3 adds a local opt-in to `playwright.config.ts`: with `PW_PROD=1 PW_REUSE=1` (and no `CI`), Playwright runs against the production server already answering on port 3000 and builds only when none answers. Every later per-task production check carries `PW_REUSE=1`. Each plan's context repeats the rule:
- With port 3000 free, run `npm run build`, start `npm run start` in the background, and wait until `curl -sf -o /dev/null http://localhost:3000/` succeeds.
- Stop the server before any edit outside `e2e/` and `.planning/`, and rebuild before the next check. A spec-only edit keeps the server.
- Stop it before any Playwright run without `PW_REUSE` (a `--list` call starts no server). Plan-level verification, full or three-engine runs and the round gates (12-11, 12-19, 12-23) keep plain `PW_PROD=1` and build fresh. Dev-server runs need the port free, because dev mode reuses whatever answers there.
- While it runs, `public/service-worker.js` holds the injected build hash: never stage it, and restore it only after the server has stopped.

Cost per source state: one build. A warm local `npm run build` took 5 s here on 2026-11-02 (Turbopack cache); a cold build plus start stays capped at 240 s by the webServer timeout, and it runs before the check, not inside it. The full Jest suite in 12-06 Task 3 and 12-22 Task 1 measured 12 s.

**Fresh-build guards stay.** The switch is ignored whenever `CI` is set, so CI and `visual-baselines.yml` (both set `CI`) always build fresh. A reused run never writes a snapshot (`updateSnapshots` is `'none'`), and visual baselines still come only from the CI `workflow_dispatch` container (T-12-44).

**One plan at a time.** Phase 12 runs on one checkout with shared `.next` and port 3000 (isolation `none`), so same-wave plans run one after another, never two at once. Waves are unchanged. The multi-plan waves are:
- wave 1: 12-01 to 12-05, with one run-order rule: 12-04 and 12-05 start only after 12-02 has finished, because 12-02 Task 3 adds the `PW_REUSE` switch their per-task checks use (both plans check that `grep -c "process.env.PW_REUSE" playwright.config.ts` prints at least 1 before their first task and stop if it prints 0); 12-01 and 12-03 have no order constraint;
- wave 2: 12-06 to 12-10;
- wave 4: 12-12, 12-13, 12-14 and 12-25;
- wave 5: 12-15, 12-16 and 12-26;
- wave 6: 12-17 and 12-18.

Each of those plans states the rule in its context. A plan starts only when the previous one has finished and port 3000 is free.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-T1 | 01 | 1 | CONTACT-01, SEO-01 | T-12-01 | only quoted answers ship | doc gate | `grep -cE "^\| (copy\|geo\|meta\|og\|log\|default\|sw\|docs\|vercel\|ci\|info)\." 12-CONTENT-PACKET.md` (>= 52) | ✅ (packet) | ✅ green |
| 12-02-T1 | 02 | 1 | EDGE-01 | T-12-02, T-12-03 | slug never echoed; client header ignored | e2e | `PW_PROD=1 npx playwright test e2e/not-found.spec.ts e2e/shell.spec.ts --project=chromium` | ✅ W0 landed | ✅ green |
| 12-02-T2 | 02 | 1 | VERIFY-01, VERIFY-03 | T-12-04, T-12-05 | upgrade-insecure-requests kept off loopback | unit | `npx jest lib/__tests__/proxy.test.ts --silent` | ✅ W0 landed | ✅ green |
| 12-02-T3 | 02 | 1 | VERIFY-03 | T-12-44 | SW blocked in functional projects; CI never reuses a server or writes a snapshot from one | config probe + e2e | four-case `node --input-type=module` probe of `playwright.config.ts` (CI unchanged); `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/not-found.spec.ts --project=webkit` | ✅ config | ✅ green |
| 12-03-T1 | 03 | 1 | CONTACT-02 | — | shared codes | unit | `npx jest lib/contact/__tests__/api-contract.test.ts --silent` | ✅ W0 landed | ✅ green |
| 12-03-T2 | 03 | 1 | CONTACT-03 | T-12-06..T-12-10 | no PII in logs; order csrf, rate limit, honeypot | unit | `npx jest app/api/__tests__/feedback.test.ts lib/contact --silent` | ✅ extend | ✅ green |
| 12-04-T1 | 04 | 1 | VERIFY-01 | T-12-11 | empty exemptions | guards | `npm run lint && npm run type-check && npx jest --silent` | ✅ | ✅ green |
| 12-04-T2 | 04 | 1 | VERIFY-01 | T-12-12 | colour reset before L2 | unit + e2e | `npx jest lib/__tests__/color-backstop.test.ts --silent`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/design-system.spec.ts --project=chromium` | ✅ W0 landed | ✅ green |
| 12-05-T1 | 05 | 1 | VERIFY-01 | T-12-13 | assets exist before deletion | unit | `npx jest data/__tests__/asset-exists.test.ts --silent` | ✅ W0 landed | ✅ green |
| 12-05-T2 | 05 | 1 | VERIFY-01 | T-12-13 | — | guards + e2e | `npm run lint`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/data-privacy.spec.ts e2e/photos.spec.ts --project=chromium` | ✅ | ✅ green |
| 12-06-T1/T3 | 06 | 2 | CONTACT-03, VERIFY-04 | T-12-SC, T-12-14 | legitimacy checkpoint before install; a D-25 item is deferred only on Tim's quoted reply | guards + e2e | `npm run lint && npx jest --silent`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/home-canvas.spec.ts e2e/contact-form.spec.ts --project=chromium` | ✅ | ✅ green |
| 12-07-T1 | 07 | 2 | VERIFY-02, VERIFY-04 | — | — | unit + e2e | `npx jest components/projects --silent`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/case-study.spec.ts e2e/demo-clip.spec.ts --project=chromium` | ✅ | ✅ green |
| 12-07-T2 | 07 | 2 | VERIFY-04 | T-12-15 | confirmed dates only | unit + e2e | `npx jest data/__tests__/roadmap.test.ts components/roadmap --silent` | ✅ | ✅ green |
| 12-08-T1 | 08 | 2 | EDGE-02 | T-12-16, T-12-17 | network-first; RSC and API bypass | unit | `npx jest lib/__tests__/service-worker-navigation.test.ts lib/__tests__/service-worker-media.test.ts --silent` | ✅ W0 landed | ✅ green |
| 12-08-T2 | 08 | 2 | EDGE-02 | T-12-18 | one reload, never on dirty forms | unit | `npx jest lib/__tests__/sw-update.test.ts --silent` | ✅ W0 landed | ✅ green |
| 12-09-T1 | 09 | 2 | SEO-01, SEO-03 | T-12-19 | absolute canonical host | e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/seo.spec.ts --project=chromium` | ✅ W0 landed | ✅ green |
| 12-09-T2 | 09 | 2 | SEO-01 | T-12-19 | own canonical per route; helper never sets openGraph | unit + e2e | `npx jest lib/__tests__/metadata.test.ts lib/__tests__/photos-view-model.test.ts --silent`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/seo.spec.ts --project=chromium` | ✅ W0 landed | ✅ green |
| 12-10-T1 | 10 | 2 | SEO-02 | T-12-21 | same-origin fonts only | e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/og.spec.ts --project=chromium` | ✅ W0 landed | ✅ green |
| 12-10-T2 | 10 | 2 | SEO-02 | T-12-22 | no undefined or NaN | unit | `npx jest lib/og --silent` | ✅ W0 landed | ✅ green |
| 12-11-T1/T3 | 11 | 3 | VERIFY-01, VERIFY-03 | T-12-23 | expected list before run; Tim commits | CI | `node scripts/ci/check-visual-run.mjs --sha $(git rev-parse HEAD) --job "Visual Regression"` (one check; the action waits) | ✅ | ✅ green |
| 12-12-T1 | 12 | 4 | EDGE-01 | — | — | unit | `npx jest lib/__tests__/edge-art.test.ts components/site --silent` | ✅ W0 landed | ✅ green |
| 12-12-T2 | 12 | 4 | EDGE-01 | T-12-24 | slug never echoed | e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/not-found.spec.ts e2e/shell.spec.ts --project=chromium` (three engines at plan level) | ✅ | ✅ green |
| 12-13-T1 | 13 | 4 | CONTACT-01, CONTACT-02 | T-12-26 | signed only on ok | e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/contact-form.spec.ts e2e/a11y-contact.spec.ts --project=chromium` (three engines at plan level) | ✅ rewrite | ✅ green |
| 12-13-T2 | 13 | 4 | CONTACT-02 | T-12-25 | submit-time validation; input kept on every failure | unit | `npx jest components/contact lib/__tests__/home-format.test.ts --silent` | ✅ rewrite | ✅ green |
| 12-14-T1/T2 | 14 | 4 | SEO-02 | T-12-27, T-12-28 | derivatives only, never originals | unit + e2e | `npx jest lib/og --silent && PW_PROD=1 PW_REUSE=1 npx playwright test e2e/og.spec.ts --project=chromium` | ✅ W0 landed | ✅ green |
| 12-15-T1 | 15 | 5 | EDGE-01 | T-12-29 | no exception text or digest | unit | `npx jest components/site components/__tests__/global-error.test.tsx --silent` | ✅ | ✅ green |
| 12-15-T2 | 15 | 5 | EDGE-02 | T-12-30 | rows from data only | unit + e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/offline.spec.ts --project=chromium` (three engines at plan level) | ✅ W0 landed | ✅ green |
| 12-16-T1 | 16 | 5 | CONTACT-01 | T-12-31, T-12-32 | clipboard gets site.email only | unit + e2e | `npx jest components/contact --silent`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/contact-form.spec.ts --project=chromium` | ✅ W0 landed | ✅ green |
| 12-16-T2 | 16 | 5 | VERIFY-01 | — | — | unit + guards | `npx jest components/__tests__/SafeCanvas.test.tsx --silent && npm run lint` | ✅ | ✅ green |
| 12-17-T1 | 17 | 6 | SEO-01, SEO-02, SEO-03 | — | — | e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/seo.spec.ts --project=chromium` (og and firefox at plan level) | ✅ | ✅ green |
| 12-17-T2 | 17 | 6 | EDGE-02 | T-12-33 | fresh HTML after deploy | e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/service-worker.spec.ts --project=chromium` | ✅ W0 landed | ✅ green |
| 12-18-T1/T2 | 18 | 6 | VERIFY-01 | T-12-34 | — | unit + lint + e2e | `npx jest lib/__tests__/useProgressiveTextures.test.ts --silent && npm run lint`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/photos-carousel.spec.ts --project=chromium` | ✅ W0 landed | ✅ green |
| 12-19-T1/T3 | 19 | 7 | CONTACT-01, EDGE-01, EDGE-02 | T-12-35 | Tim commits PNGs | CI | `node scripts/ci/check-visual-run.mjs --sha $(git rev-parse HEAD) --job "Visual Regression"` (one check; the action waits) | ✅ | ✅ green |
| 12-20-T1..T3 | 20 | 8 | VERIFY-02, VERIFY-04 | T-12-36 | exact allow-list | e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/audit.spec.ts --project=chromium` (three engines recorded by the action and at plan level) | ✅ W0 landed | ✅ green |
| 12-21-T1/T2 | 21 | 9 | VERIFY-02 | T-12-37 | dialog-only focus trap | e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/keyboard.spec.ts --project=chromium` (three engines recorded by the action and at plan level) | ✅ W0 landed | ✅ green |
| 12-22-T1..T3 | 22 | 10 | VERIFY-01 | T-12-38 | reasons recorded; pixel-moving fixes on the round-3 list | guards + docs | `npm run lint && npx jest --silent`; `! git grep -n -e HologramTerminal -e RoadmapFilters -e README_CLIX -e GlassmorphismNav -e "3D mountain hero" -- README.md` | ✅ | ✅ green |
| 12-23-T1/T2 | 23 | 11 | VERIFY-03 | T-12-39 | no hidden retries | e2e + CI | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/no-webgl.spec.ts --project=webkit` (full WebKit run is the action's round-level gate); `node scripts/ci/check-visual-run.mjs --sha $(git rev-parse HEAD) --job "E2E Tests"` (one check; the action waits) | ✅ | ✅ green |
| 12-24-T1 | 24 | 12 | VERIFY-01..04 | T-12-40, T-12-41 | ratchet only rises | guard | `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` | ✅ | ✅ green |
| 12-25-T1 | 25 | 4 | SEO-01 | T-12-43 | non-https or local base URL fails lint | unit + guard | `npx jest data/__tests__/site.test.ts --silent && npm run guard:selftest && npm run lint` | ✅ W0 landed | ✅ green |
| 12-25-T2 | 25 | 4 | CONTACT-01 | T-12-20 | location at 2 decimals, only as Tim confirmed | unit | `npx jest data/__tests__/site.test.ts --silent && npm run type-check` | ✅ W0 landed | ✅ green |
| 12-26-T1 | 26 | 5 | CONTACT-02 | T-12-42 | values kept; messages never echo input | unit | `npx jest components/contact/__tests__/SummitRegister.test.tsx --silent` | ✅ extend | ✅ green |
| 12-26-T2 | 26 | 5 | CONTACT-02 | T-12-42 | focused summary; threshold-only counter status | unit + e2e | `npx jest components/contact --silent`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/contact-form.spec.ts --project=chromium` (three engines at plan level) | ✅ extend | ✅ green |
| 12-27-T1 | 27 | 13 | VERIFY-01 | T-12-SC, T-12-45 | registry facts and copy proposals before any decision | doc gate | npm audit reader and Resolved values reader (12-27-SUMMARY "Verification") | ✅ (SUMMARY draft) | ✅ green |
| 12-27-T2 | 27 | 13 | CONTACT-02, CONTACT-03, EDGE-01 | T-12-SC, T-12-46 | only Tim's literal answers ship (blocking-human) | checkpoint | Tim's verbatim answers recorded (12-27-SUMMARY "Answers (verbatim)") | ✅ | ✅ green |
| 12-27-T3 | 27 | 13 | VERIFY-01 | T-12-SC, T-12-45, T-12-46 | lockfile integrity equals the approved strings; floors raised | guards + unit + e2e | `node scripts/guards/check-install-parity.mjs`; `npm run lint && npm run type-check && npx jest --silent`; `PW_PROD=1 npx playwright test e2e/shell.spec.ts --project=chromium` | ✅ | ✅ green |
| 12-28-T1 | 28 | 14 | CONTACT-02 | T-12-47 | a fieldless validation answer shows the send failure | unit + e2e | `npx jest components/contact/__tests__/SummitRegister.test.tsx -t "WR-01"`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/contact-form.spec.ts --project=chromium` | ✅ extend | ✅ green |
| 12-28-T2 | 28 | 14 | CONTACT-02 | T-12-48 | Retry validates before sending | unit | `npx jest components/contact/__tests__/SummitRegister.test.tsx -t "IN-06\|IN-01\|validateField"` | ✅ extend | ✅ green |
| 12-28-T3 | 28 | 14 | CONTACT-03 | T-12-49 | same email contract under z.email() | unit | `npx jest app/api/__tests__/feedback.test.ts lib/contact --silent`; three engines at plan level (contact-form, a11y-contact, keyboard: 91 passed) | ✅ extend | ✅ green |
| 12-29-T1 | 29 | 15 | EDGE-01, VERIFY-04 | T-12-50 | document prefetches pass the proxy (CSP, header delete) | unit + e2e | `npx jest lib/__tests__/proxy.test.ts --silent`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/not-found.spec.ts --project=chromium` | ✅ extend | ✅ green |
| 12-29-T2 | 29 | 15 | EDGE-01 | T-12-51, T-12-52 | option A: comments scoped, residual AR-12-02 | unit + type-check | `npx jest lib/__tests__/proxy.test.ts --silent && npm run type-check` | ✅ | ✅ green |
| 12-29-T3 | 29 | 15 | EDGE-01, VERIFY-04 | T-12-02 | T-12-02 closed with evidence | doc gate + e2e | scratchpad verify-t1202.js (`T-12-02 closed`); `PW_PROD=1 npx playwright test e2e/not-found.spec.ts e2e/shell.spec.ts e2e/audit.spec.ts --project=chromium --project=firefox --project=webkit` (210 passed) | ✅ | ✅ green |
| 12-30-T1 | 30 | 16 | EDGE-02 | T-12-55 | hero contour precached; install stays all-or-nothing | unit + e2e | `npx jest data/__tests__/precache.test.ts --silent`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/service-worker.spec.ts --project=chromium` | ✅ extend | ✅ green |
| 12-30-T2 | 30 | 16 | EDGE-02 | T-12-53, T-12-54 | cache writes under waitUntil; a rejected put is caught | unit + e2e | `npx jest lib/__tests__/service-worker-navigation.test.ts lib/__tests__/service-worker-media.test.ts --silent`; three engines at plan level (service-worker, offline, not-found: 79 passed) | ✅ extend | ✅ green |
| 12-31-T1 | 31 | 17 | VERIFY-01 | T-12-57 | the terminal observer follows its region | unit + e2e | `npx jest components/projects/__tests__/DemoTerminal.test.tsx --silent`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/case-study.spec.ts e2e/keyboard.spec.ts --project=chromium` | ✅ extend | ✅ green |
| 12-31-T2 | 31 | 17 | VERIFY-01 | T-12-57 | textures reload when the sources change at the same count | unit + e2e | `npx jest lib/__tests__/useProgressiveTextures.test.ts --silent`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/photos-carousel.spec.ts --project=chromium` | ✅ extend | ✅ green |
| 12-31-T3 | 31 | 17 | EDGE-02, VERIFY-03 | T-12-56 | the update interval stops on unmount; update() rejections caught | unit + e2e | `npx jest lib/__tests__/sw-update.test.ts --silent`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/service-worker.spec.ts --project=chromium` | ✅ extend | ✅ green |
| 12-32-T1 | 32 | 18 | EDGE-01, SEO-01, VERIFY-04 | T-12-58, T-12-59 | ink-muted Report link; only Tim's global-error title | unit + e2e | `npx jest components/site/__tests__/ErrorBody.test.tsx components/__tests__/global-error.test.tsx --silent && npm run guard:contrast`; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/keyboard.spec.ts -g "error page" --project=chromium` | ✅ extend | ✅ green |
| 12-32-T2 | 32 | 18 | EDGE-02 | — | saved-row hover on surface-overlay | unit | `npx jest components/site/__tests__/SavedPages.test.tsx --silent`; three engines at plan level (keyboard, offline, not-found, audit: 162 passed) | ✅ extend | ✅ green |
| 12-33-T1 | 33 | 19 | VERIFY-01 | T-12-60 | README names the variables the code reads | doc gate | scratchpad check-12-33-readme.js (`README env OK`); `! git grep -nw -e FEEDBACK_EMAIL -e "Node.js 20" -- README.md` | ✅ | ✅ green |
| 12-33-T2 | 33 | 19 | VERIFY-03 | T-12-61 | credit test slow; G3 production-only with a reason | e2e | `npx playwright test e2e/shell.spec.ts -g "every route credits the source" --project=chromium --repeat-each=5`; `PW_PROD=1 npx playwright test e2e/design-system.spec.ts --project=chromium` | ✅ | ✅ green |
| 12-34-T1 | 34 | 20 | VERIFY-03 | T-12-63 | the whole tree green on one fresh build; the ratchet only rises | guards + unit + e2e | `npm run lint && npm run type-check && npx jest --silent`; `PW_PROD=1 npx playwright test --project=chromium --project=firefox --project=webkit` (1360 passed); `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` | ✅ | ✅ green |
| 12-34-T2 | 34 | 20 | VERIFY-03 | T-12-63 | no flaky pass, no unlisted visual diff | CI | `node scripts/ci/check-visual-run.mjs --sha $(git rev-parse HEAD) --job "<job>" --wait 60` for the four jobs | ✅ | ✅ green |
| 12-34-T3 | 34 | 20 | VERIFY-01 | T-12-62 | every review row, threat and deferred row has an outcome | doc gate | Task 3 node check (`ledgers OK`) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Requirement-level command seeds live in `12-RESEARCH.md` §"Validation Architecture → Phase Requirements → Test Map". The planner binds them to task IDs.*

---

## Wave 0 Requirements

- [x] Spike: `proxy.ts` rewrite of unknown photo/project slugs → server-rendered 404 (research assumption A1), with an `e2e/shell.spec.ts` server-HTML case (h1, one `<main>`, status 404, no JS) — EDGE-01
- [x] `playwright.config.ts`: `serviceWorkers: 'block'` on the functional projects; `webkit` project with `grepInvert`; the local `PW_REUSE` opt-in (ignored under CI); `--fail-on-flaky-tests` — VERIFY-03, EDGE-02
- [x] `e2e/routes.ts` extracted from `e2e/shell.spec.ts` (shared route list for SEO, audit and keyboard specs) — SEO-01, VERIFY-02, VERIFY-04
- [x] `lib/__tests__/service-worker-navigation.test.ts` — EDGE-02
- [x] `data/__tests__/asset-exists.test.ts` (every `/images/`, `/terrain/`, `/media/` path in `data/**` and generated manifests exists under `public/`), landed **before** `public/images/optimized/` is deleted — VERIFY-01
- [x] Proxy CSP unit test (both header variants; `'unsafe-eval'` dev-only; D-17 loopback condition) — VERIFY-01, VERIFY-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual baselines for contact, 404/error/offline and every route touched by the v1-alias and colour-reset removal | CONTACT-01, EDGE-01, VERIFY-01 | Baselines come only from the CI `workflow_dispatch` container; Tim commits PNGs | Push `ci/12-NN`, dispatch the visual workflow, download and compare against the expected-diff list; Tim commits the PNGs |
| Contact-page coordinates and copy | CONTACT-01 | Fact only Tim can confirm (ROADMAP "Inputs from Tim", CONTEXT D-01) | Checkpoint; Tim's literal reply quoted in the SUMMARY before the value ships |
| Shared-link previews look right (OG image legibility, crop) | SEO-02 | Judgement | Open each OG PNG at 1200×630 at the visual review |
| Keyboard-only pass feels right beyond the scripted flows | VERIFY-02 | Judgement on focus order and visibility | Manual tab-through of nav, map, lightbox and contact form during UAT |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 300s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-11-03 (validate-phase audit at the Phase 12 gates: 42/42 rows green; Jest 1658/1658 local at 4bf7f32; e2e chromium + firefox + webkit and visual green in CI run 41571031827 on 147bc82, source-identical to HEAD)

**Approval (follow-up 12-27..12-34):** re-validated 2026-11-03 at the follow-up gates: the 21 new rows (12-27..12-34) have 15 automated and green, and 6 manual or doc-only (12-27 T1/T2 packet and checkpoint, 12-33 T1 README, 12-34 T3 ledgers, 12-34 T1/T2 as gates); 0 partial, 0 missing. Jest 1694/1694 (102 suites) local at 3814242; Playwright chromium + firefox + webkit 1360/1360 local on a fresh build; CI run 41648599366 on 53171db green in all four jobs (E2E 1373 under `--fail-on-flaky-tests`, Visual no diff); ratchet 2243. The `≥ 1749` and `82 suites` figures above are phase-start measurements and stay as recorded.

## Validation Audit 2026-11-03

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
