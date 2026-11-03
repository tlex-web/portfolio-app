---
phase: "12"
slug: "contact-edge-pages-cleanup-verification"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: "2026-11-03"
---

# Phase 12 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register authored at plan time: every one of the 26 PLAN files carries a `<threat_model>` block (70 entries: T-12-01 to T-12-44, plus one T-12-SC supply-chain row per plan, keyed here by plan). The audit verified the existing mitigations at ASVS L1 depth and did not look for new threats. The evidence is a file:line for each control, or for a test that asserts it.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser request -> proxy -> server render | Visitor controls path and headers; only proxy-set headers may steer the 404 content | URL path, x-edge-section, x-forwarded-proto, Host |
| Browser -> POST /api/feedback | Visitor controls body, Origin and forwarding headers | name, email, message, trail_note honeypot, Origin, XFF |
| Route -> host logs | Server logs persist at the host | outcome, IP, timestamp |
| Visitor input -> client validation, summary and register echo | Field values echoed client-side; the server names invalid fields by code only | field values, server issue codes |
| Network -> service worker Cache Storage -> page | Stored responses are replayed later, possibly offline; cached HTML carries its own CSP/nonces | navigation HTML, static assets |
| Thrown errors / Cache Storage -> error and offline UI | Exception text may hold internals; cached URLs may carry query strings | error message and digest, cached request URLs |
| Committed data -> page heads, sitemap, OG PNGs, Contact panel, clipboard | Published to crawlers, link previews and visitors | site.url, site.location, site.email, OG text, photo derivative pixels |
| Third-party sources (npm registry, fonts.gstatic.com) -> repository | Third-party code and fonts enter build and runtime | packages, lockfile, TTF files |
| Tim's replies -> committed copy and data | Only quoted approvals may ship | content-packet values |
| CI artifact -> committed visual baselines | Committed PNGs become the reference every later run must match | screenshot PNGs |
| Test harness and CI config -> release gate | A vacuous test, broad allow-list, reused server or tag could let regressions ship | e2e results, browser tags, retries, allow-lists, ratchet |
| Review records -> milestone audit | The audit trusts these dispositions and PROJECT.md | disposition tables, deferred lists |

---

## Threat Register

| Threat ID | Plan | Category | Component | Severity | Disposition | Mitigation | Status | Evidence |
|-----------|------|----------|-----------|----------|-------------|------------|--------|----------|
| T-12-01 | 12-01 | Repudiation | 12-01-SUMMARY Resolved values | medium | mitigate | Each supplied row backed by Tim's verbatim answer; absent key reads not supplied | closed | 12-01-SUMMARY.md:133-137, :139-145 |
| T-12-SC (12-01) | 12-01 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-02 | 12-02 | Spoofing | x-edge-section request header | low | mitigate | Proxy deletes the client copy on every request it handles; document prefetches (`purpose: prefetch`) pass the proxy since 12-29 (C1); parseEdgeSection allow-lists two values; spoof and document-prefetch e2e | closed | proxy.ts:199 (header delete), proxy.ts:229 (matcher `missing` holds only `next-router-prefetch`), lib/edge-section.ts:30-32; lib/__tests__/proxy.test.ts:157 "skips only RSC prefetches: missing holds the next-router-prefetch entry alone"; e2e/not-found.spec.ts:138 "a client-sent x-edge-section header cannot choose the context link", :151 "a document prefetch with a client-sent x-edge-section gets the CSP header and the generic links", :166 "a document prefetch of an unknown photo slug gets the proxy miss handling" (12-29 commits 16deede, 099fab7; scoped comments 0b3b5c4); residual accepted: AR-12-02 |
| T-12-03 | 12-02 | Tampering | 404 body and title | medium | mitigate | 404 reads only the proxy header, never params or pathname; random-token e2e | closed | app/not-found.tsx:36; e2e/not-found.spec.ts:83,112-114 |
| T-12-04 | 12-02 | Tampering | CSP upgrade-insecure-requests | high | mitigate | Condition reads URL protocol + loopback set only; forged-proto unit test | closed | proxy.ts:160-161,174; lib/__tests__/proxy.test.ts:163-168 |
| T-12-05 | 12-02 | Denial of service | prod script-src without 'unsafe-eval' | medium | mitigate | 'unsafe-eval' dev-only; fresh-build chunk grep 0; WebGL specs pass | closed | proxy.ts:164; proxy.test.ts:114-116,175-180 |
| T-12-44 | 12-02 | Tampering | reused prod server (PW_REUSE) | medium | mitigate | Ignored when CI is set; reused run writes no snapshots | closed | playwright.config.ts:49,90,162 |
| T-12-SC (12-02) | 12-02 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-06 | 12-03 | Information disclosure | console logs in route.ts / lib/email.ts | high | mitigate | Logs hold outcome, IP, timestamp only; Resend error name only; console spy test | closed | app/api/feedback/route.ts:37-44,140-144, lib/email.ts:57; app/api/__tests__/feedback.test.ts:33-38,86-91 |
| T-12-07 | 12-03 | Denial of service | spam bots on the form | medium | mitigate | Upstash 5/hour limit kept; honeypot answers quiet 200 | closed | lib/rate-limit.ts:30; route.ts:116-118 |
| T-12-08 | 12-03 | Tampering | check order | high | mitigate | Origin, then limiter, then body, then honeypot; order tests | closed | route.ts:85,91,101,116; feedback.test.ts:360,430,443-466 |
| T-12-09 | 12-03 | Information disclosure | error responses | medium | mitigate | Bodies carry codes only; field issue codes never values; generic 500 | closed | route.ts:54-74,145; feedback.test.ts:245-273,640-647 |
| T-12-10 | 12-03 | Denial of service | malformed JSON | low | mitigate | Separate try around body parse returns 400 'validation' | closed | route.ts:99-105; feedback.test.ts:289 |
| T-12-SC (12-03) | 12-03 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-11 | 12-04 | Tampering | guard exemptions | medium | mitigate | LEGACY_DEAD_FILES and ratchet empty; selftest pins the empty list | closed | scripts/guards/lib/legacy-dead-files.mjs:17; scripts/guards/selftest.mjs:550-556 |
| T-12-12 | 12-04 | Denial of service | globals.css colour reset | medium | mitigate | Reset precedes every --color- definition (Jest); selector diff | closed | app/globals.css:13; lib/__tests__/color-backstop.test.ts:34 |
| T-12-SC (12-04) | 12-04 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-13 | 12-05 | Denial of service | public/images/optimized deletion | medium | mitigate | Asset-exists test committed before the deletion | closed | data/__tests__/asset-exists.test.ts; b26ea6f (test) before e78a010 (delete) |
| T-12-SC (12-05) | 12-05 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-SC (12-06) | 12-06 | Tampering | npm installs (zod, fflate, r3f) | high | mitigate | Registry facts, Tim's quoted approval, floors raised, lockfile integrity, exact overrides | closed | 12-06-SUMMARY.md:153-165; scripts/guards/version-floors.json, package.json:112-114 |
| T-12-14 | 12-06 | Information disclosure | known-vulnerable zod and fflate | medium | mitigate | Bumped to fixed versions; npm audit 46 -> 44 | closed | package.json:78, package-lock.json:7013,14056; 12-06-SUMMARY.md:130 |
| T-12-15 | 12-07 | Repudiation | data/roadmap.ts, coin-flip description | medium | mitigate | Values only from supplied rows; D-20 test bounds surveyedAt | closed | data/roadmap.ts:96; data/__tests__/roadmap.test.ts:22,161 |
| T-12-SC (12-07) | 12-07 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-16 | 12-08 | Tampering | stale cached HTML after deploy | high | mitigate | Network-first navigations; activate purges other builds; no-cache on SW script | closed | public/service-worker.js:40-61,115-127, next.config.ts:64-73; lib/__tests__/service-worker-navigation.test.ts:165,313 |
| T-12-17 | 12-08 | Information disclosure | Cache Storage contents | medium | mitigate | Caches only ok/basic/non-redirected navigations; /api/ and RSC bypass | closed | service-worker.js:56,156-163; service-worker-navigation.test.ts:176-179,226-240 |
| T-12-18 | 12-08 | Denial of service | reload loop after controllerchange | medium | mitigate | sessionStorage once-per-tab guard; no reload on first install or dirty form | closed | components/ServiceWorkerRegistration.tsx:17,36-58, lib/sw-update.ts:33; lib/__tests__/sw-update.test.ts:17-29 |
| T-12-SC (12-08) | 12-08 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-19 | 12-09 | Spoofing | canonical host | medium | mitigate | One site.url constant feeds metadataBase; e2e checks absolute canonical | closed | data/site.ts:21, app/layout.tsx:35; e2e/seo.spec.ts:39,55 |
| T-12-SC (12-09) | 12-09 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-21 | 12-10 | Tampering | lib/og/fonts/*.ttf | medium | mitigate | HTTPS download, magic bytes, SHA-256 recorded, OFL committed, never in public/ | closed | lib/og/fonts/README.md:17-21 (hashes re-computed, 3/3 match); lib/og/template.tsx:514 |
| T-12-22 | 12-10 | Information disclosure | OG card text | medium | mitigate | Card text only from site and project data; Jest asserts every string | closed | lib/og/__tests__/template.test.tsx:228-241,257-268 |
| T-12-SC (12-10) | 12-10 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-23 | 12-11 | Tampering | visual baselines (round 1) | high | mitigate | Expected-diff list committed first; Tim commits; per-slug --allow only | closed | 12-11-EXPECTED-DIFFS.md (9d2a86f before a046347); 12-11-SUMMARY.md:218-223 |
| T-12-SC (12-11) | 12-11 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-24 | 12-12 | Tampering | NotFoundBody | medium | mitigate | Only a two-value context prop; @ts-expect-error test rejects a slug prop | closed | components/site/NotFoundBody.tsx:54; components/site/__tests__/NotFoundBody.test.tsx:72-75 |
| T-12-SC (12-12) | 12-12 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-25 | 12-13 | Tampering | register entry echo | medium | mitigate | Echo through React text nodes only; no dangerouslySetInnerHTML; server sends codes | closed | components/contact/SummitRegister.tsx:521-523; route.ts:46-48 |
| T-12-26 | 12-13 | Repudiation | false confirmation | medium | mitigate | 'Register signed' only on code 'ok'; every failure code and 15 s timeout tested | closed | SummitRegister.tsx:208-230,467-470; SummitRegister.test.tsx:156,234,326; e2e/contact-form.spec.ts:163-196 |
| T-12-SC (12-13) | 12-13 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-27 | 12-14 | Information disclosure | photo OG route | high | mitigate | Reads only the manifest's hashed JPEG derivative; Jest checks path, width cap, files read | closed | lib/og/template.tsx:271-274; lib/og/__tests__/routes.test.ts:140-163 |
| T-12-28 | 12-14 | Information disclosure | coin-flip OG text | medium | mitigate | Name, pitch, alt from data/projects.ts, unchanged in Phase 12 | closed | template.test.tsx:235-236; routes.test.ts:118-121 |
| T-12-SC (12-14) | 12-14 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-29 | 12-15 | Information disclosure | ErrorBody, global-error | medium | mitigate | Error never passed to the body; tests assert message and digest absent | closed | app/global-error.tsx:56, app/(site)/error.tsx:25; components/__tests__/global-error.test.tsx:82-86,117-118 |
| T-12-30 | 12-15 | Tampering | SavedPages rows | low | mitigate | Rows only from catalog titles; query strings and unknown paths dropped | closed | lib/saved-pages.ts:54,69; lib/__tests__/saved-pages.test.ts:48,83,92 |
| T-12-SC (12-15) | 12-15 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-31 | 12-16 | Information disclosure | Location row | medium | mitigate | Renders only site.location at 2 decimals, only when present | closed | app/(site)/contact/page.tsx:53; components/contact/DirectContactPanel.tsx:73-78 |
| T-12-32 | 12-16 | Tampering | clipboard write | low | mitigate | writeText gets site.email on click only; Jest asserts the exact argument | closed | components/contact/CopyEmailButton.tsx:60,78; CopyEmailButton.test.tsx:84 |
| T-12-SC (12-16) | 12-16 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-33 | 12-17 | Repudiation | service-worker e2e | medium | mitigate | Control assertions: worker in control, offline blocks, RSC not from worker | closed | e2e/service-worker.spec.ts:56-64,122-133,184-186 |
| T-12-SC (12-17) | 12-17 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-34 | 12-18 | Denial of service | PhotoCarousel3D textures | medium | mitigate | Jest for load order and disposal; carousel e2e count 43 before and after | closed | lib/__tests__/useProgressiveTextures.test.ts:114-248; 12-18-SUMMARY.md:116-117 |
| T-12-SC (12-18) | 12-18 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-35 | 12-19 | Tampering | visual baselines (round 2) | high | mitigate | List committed first; Tim commits; exactly three per-slug --allow | closed | 12-19-EXPECTED-DIFFS.md (30fabaf before b743ca0); 12-19-SUMMARY.md:99 |
| T-12-SC (12-19) | 12-19 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-36 | 12-20 | Repudiation | ALLOWED_CONSOLE and CSP check | medium | mitigate | Anchored per-engine patterns, each commented; CSP via securitypolicyviolation event | closed | e2e/helpers/audit.ts:39-68,76 |
| T-12-SC (12-20) | 12-20 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-37 | 12-21 | Denial of service | focus traps and lost focus | medium | mitigate | Exact Tab order; menu not a trap; dialog trap with focus return | closed | e2e/keyboard.spec.ts:51,187-193,242-306 |
| T-12-SC (12-21) | 12-21 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-38 | 12-22 | Repudiation | disposition tables, deferred lists | low | mitigate | Each row has a commit or a reason; flakes have five-repeat proofs | closed | 12-22-SUMMARY.md:185-197; deferred-items.md:13-25 |
| T-12-SC (12-22) | 12-22 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-39 | 12-23 | Repudiation | browser tags and retries | medium | mitigate | --fail-on-flaky-tests in CI; every tag (17/17) has a reason comment | closed | .github/workflows/ci.yml:104; playwright.config.ts:60-77 |
| T-12-SC (12-23) | 12-23 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-40 | 12-24 | Tampering | production CSP header | high | mitigate | Unit test pins both variants; UAT item (d) reads the live header after deploy | closed | lib/__tests__/proxy.test.ts:84-107,163-180; 12-24-SUMMARY.md:157-163 |
| T-12-41 | 12-24 | Repudiation | test-count ratchet | low | mitigate | --update refuses a lower total; selftest proves it | closed | scripts/guards/test-count.mjs:168-187; scripts/guards/selftest.mjs:161-173 |
| T-12-SC (12-24) | 12-24 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-43 | 12-25 | Spoofing | canonical url rule (guard:identity) | medium | mitigate | Rejects non-https, trailing slash, localhost, example.com; bad-url selftest | closed | scripts/guards/check-identity.mjs:56,163-164; scripts/guards/selftest.mjs:532-536 |
| T-12-20 | 12-25 | Information disclosure | site.location | medium | mitigate | Stored at 2 decimals with a data test; Tim's quoted confirmation | closed | data/site.ts:36-41; data/__tests__/site.test.ts:42-46 |
| T-12-SC (12-25) | 12-25 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |
| T-12-42 | 12-26 | Tampering | validation messages and summary | low | mitigate | Fixed strings; only value.length used; server codes mapped through issueMessage | closed | components/contact/SummitRegister.tsx:32-44,471-476 |
| T-12-SC (12-26) | 12-26 | Tampering | npm installs | low | accept | No package installed | closed | see Accepted Risks |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

### Open below threshold

- No threat is open. T-12-02, the one row that was open here (low, non-blocking), was closed by 12-29: the `purpose: prefetch` entry left the matcher's `missing` list (proxy.ts:229), so document prefetches get the proxy's header delete and CSP header. The paths the matcher still skips are the accepted residual AR-12-02 (Tim's 12-27 choice, "A (Recommended)").

### Unregistered flags (informational)

- **Prefetch-path 404 without CSP (closed by C1).** A document prefetch (`purpose: prefetch`) used to get 404 HTML with no CSP header, because the proxy never ran (deferred-items.md:15). 12-29's C1 matcher fix (proxy.ts:229) sends it through the proxy, and e2e/not-found.spec.ts:151 and :166 assert the CSP header on both prefetch cases. RSC prefetches (`next-router-prefetch`) still skip the proxy; they are flight payloads, not documents.
- **404 self-fetch outbound request (mitigated).** 12-02 added a server-side self-fetch for the neutral 404 (proxy.ts:73-103). It is pinned to loopback and the VERCEL_* hostnames (proxy.ts:135-143), and lib/__tests__/proxy.test.ts:394-445 tests that. It is folded into T-12-03, and no action is needed.
- **Live-header checks (T-12-04, T-12-40).** The code controls and their unit tests are in place. Tim still reads the live production header at UAT item (d) (12-24-SUMMARY.md:157-163) after the deploy.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-12-01 | T-12-SC (12-01..12-05, 12-07..12-26) | These 25 plans install no package. `git log 8363f1f..HEAD -- package.json package-lock.json` returns only 646f3ac (12-06), so no other Phase 12 plan touched the manifests. Each plan's `<threat_model>` records the accept disposition. | plan-time threat model (planner; plans approved by Tim 2026-11-02) | 2026-11-02 |
| AR-12-02 | T-12-02 | On the paths proxy.ts config.matcher skips (RSC prefetches with `next-router-prefetch`, paths starting with `api`, missing files under `images/`, `terrain/` and `media/`) the proxy's delete never runs, so a visitor-sent `x-edge-section` can pick the generic 404's context link. It affects only the sender's own response, and `parseEdgeSection` limits it to a two-value allow-list (`photos`, `projects`); the slug is never rendered (T-12-03). Next 16.4 hides `next-router-prefetch` from `headers()`, so the 404 render cannot tell those requests apart; the per-build proxy token (12-27 option C) was declined. IN-02 is narrowed, not fixed as written (12-34 records it deferred). | Tim, 12-27 checkpoint: "A (Recommended)" (12-27-SUMMARY.md Answers row 4, Resolved values `edge.header-guard`) | 2026-11-03 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-03 | 70 | 69 | 1 (low, below high threshold) | gsd-security-auditor (ASVS L1) at the Phase 12 gates |
| 2026-11-03 | 70 | 70 | 0 | 12-29 executor: T-12-02 closed (C1 matcher fix, residual AR-12-02) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-03 (threats_open 0; T-12-02 was kept open below the high threshold by Tim's choice, then closed by 12-29 with residual AR-12-02)
