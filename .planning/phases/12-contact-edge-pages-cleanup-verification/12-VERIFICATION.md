---
phase: 12-contact-edge-pages-cleanup-verification
verified: 2026-11-03T11:00:00Z
status: human_needed
score: 5/5 must-haves verified
covered_files:
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-01-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-01-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-02-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-02-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-03-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-03-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-04-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-04-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-05-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-05-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-06-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-06-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-07-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-07-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-08-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-08-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-09-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-09-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-10-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-10-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-11-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-11-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-12-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-12-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-13-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-13-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-14-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-14-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-15-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-15-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-16-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-16-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-17-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-17-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-18-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-18-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-19-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-19-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-20-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-20-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-21-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-21-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-22-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-22-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-23-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-23-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-24-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-24-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-25-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-25-SUMMARY.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-26-PLAN.md"
  - ".planning/phases/12-contact-edge-pages-cleanup-verification/12-26-SUMMARY.md"
  - "app/api/feedback/route.ts"
  - "app/globals.css"
  - "app/robots.ts"
  - "app/sitemap.ts"
  - "components/contact/SummitRegister.tsx"
  - "components/site/EdgeLayout.tsx"
  - "lib/metadata.ts"
  - "proxy.ts"
  - "public/service-worker.js"
covered_digest: "v4:sha256:c24bc443d12b6442d52aa9ad1539286618753d3ca914969002522f01b53ef6a4"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Real Safari (iOS and macOS): nav and mobile menu, Home ascent, lightbox (open from Grid, arrow keys, Escape), the View Transitions morph, signing the contact register"
    expected: "No broken layout, no stuck overlay, focus returns to the tile after the lightbox closes, 'register signed' appears"
    why_human: "Playwright WebKit is not Safari; Windows WebKit excludes 12 @no-win-webkit tests and Linux WebKit ignores preload=none. No CI job runs real Safari"
  - test: "Safari Back/Escape/Close pressed straight after opening a photo; load a photo URL and press Next immediately; Web Inspector Network on a project with a demo clip (UAT item i)"
    expected: "Lightbox closes, URL returns to the grid, page stays alive, tab title names the shown photo, no MP4 request before play"
    why_human: "The WinCairo history-Back crash path and the preload behaviour are tagged out of the engines that CI can run"
  - test: "Keyboard-only run across nav, /photos map, lightbox and contact form, judging focus visibility (UAT item c)"
    expected: "Focus ring clearly visible at every stop"
    why_human: "e2e/keyboard.spec.ts proves the stops are reachable; visibility is a human judgement"
  - test: "Screen-reader listen on /contact (NVDA, JAWS or VoiceOver): invalid submit, then type past 1,800 characters (UAT item j)"
    expected: "Focused error summary reads 'Check {n} fields' with field links; counter announces at 1,800, 1,900, 1,950, 2,000 and over the limit"
    why_human: "Tests assert markup only (12-26); announcement behaviour needs a screen reader"
  - test: "Link previews: paste a photo URL, /projects/box and Home into opengraph.xyz or a chat app (UAT item e); open each OG PNG at 1200x630"
    expected: "Photo card contain-fitted with the copyright line, project card shows route, grade and pitch, Home shows the default contour card; text legible"
    why_human: "The cards were verified as 1200x630 PNGs with per-slug URLs and alt text, but legibility and crop are judgement (12-VALIDATION Manual-Only; 12-UI-REVIEW notes no render was inspected)"
  - test: "Production CSP header after deploy (UAT item d) and preview slug check on a deployed preview (UAT item k)"
    expected: "Header contains upgrade-insecure-requests, no raw.githubusercontent.com, no 'unsafe-eval'; view-source of /photos/nf-check has 0 hits for nf-check"
    why_human: "Needs the deployed host; local loopback correctly omits upgrade-insecure-requests, and the proxy self-fetch may be blocked by Vercel protection"
  - test: "Firefox footer contour band at 1 px strokes (UAT item b)"
    expected: "Reads as crisp 1 px strokes, not blurred or doubled"
    why_human: "Visual judgement, open since 08-13"
---

# Phase 12: Contact, Edge Pages, Cleanup & Verification Verification Report

**Phase Goal:** The last pages join the design system, every page can be found and previews well when shared, dead code is gone, and the whole site is verified accessible, cross-browser and regression-free.
**Verified:** 2026-11-03T11:00:00Z
**Status:** human_needed
**Re-verification:** No, initial verification

All automated evidence supports the goal. Status is `human_needed` only because the phase's own UAT checklist (12-24-SUMMARY, items a-l) contains real-device and judgement checks that no automated gate can discharge, plus a set of open code-review warnings that Tim should triage. There are no gaps and no blockers.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A visitor signs a dark "summit register" form: visible labels and borders, selectable email, coordinates; errors under each field and in a focused summary, input kept; progress then "register signed" or recoverable error; honeypot rejected; CSRF and rate limit unchanged | VERIFIED | `components/contact/SummitRegister.tsx` (774 lines), `DirectContactPanel.tsx`, `CopyEmailButton.tsx` exist and are wired from `app/(site)/contact/page.tsx`. `e2e/contact-form.spec.ts` 16/16 pass on my fresh production build (chromium). Jest `components/contact`, `app/api/__tests__/feedback.test.ts` in the 1658/1658 green run. `route.ts` order is Origin (85), limiter (91), body parse (101), schema (107), honeypot (116); I POSTed a honeypot payload to the live build: `{"code":"ok"} 200` and the server log showed `outcome: 'honeypot'`, no send. Rate limiting is a no-op locally (Upstash env unset, logged); its behaviour is covered by unit tests only |
| 2 | Any unknown URL, including the deleted playground routes, shows "You've left the marked trail" with contour art and a route home; error, global-error and offline use the same shell; after a deploy a returning visitor gets fresh pages | VERIFIED | Live build: `/gradient-mesh` returns 404 with "left the marked trail" and one `<main>`; `/photos/nope` and `/projects/nope` return 404. `EdgeLayout`, `EdgeArt`, `NotFoundBody`, `ErrorBody`, `SavedPages`, `OfflineRetry` present; `app/error.tsx`, `global-error.tsx`, `offline/page.tsx` use them. `service-worker.js` served `Cache-Control: no-cache`. `e2e/service-worker.spec.ts` "a reload after a deploy shows the new HTML, never the cached copy" and "offline: visited page from cache, unvisited gets styled /offline" pass (chromium); `e2e/offline.spec.ts` and `e2e/not-found.spec.ts` pass. This is a behaviour-dependent truth and has a passing behavioural test |
| 3 | Every route has its own title, description and canonical; every photo and project page has its own OG image; generated `sitemap.xml` and `robots.txt` | VERIFIED | Live build: distinct titles and absolute canonicals on `/`, `/photos`, `/projects`, `/roadmap`, `/contact`, `/projects/box`, `/photos/matterhorn-from-zermatt`. Per-slug `og:image` URLs (`.../opengraph-image-126xvw/card?...`) answer 200 `image/png`. `/sitemap.xml` lists nav, photo and project URLs; `/robots.txt` allows `/`, disallows `/api/` and `/offline`, names the sitemap. `e2e/seo.spec.ts` and `e2e/og.spec.ts` 58/58 pass together with `audit` and `not-found` |
| 4 | `Header`, `GlassmorphismNav`, `ParticleButton`, `AnimatedGradientMesh`, `useHexGrid`/`hex-clip`, legacy image variants, v1 token aliases and unused CSP origins are gone; build, tests, baselines stay green | VERIFIED | `git grep -i` for GlassmorphismNav, ParticleButton, AnimatedGradientMesh, useHexGrid, hex-clip outside `.planning` and markdown: 0 hits. No `components/Header*` (only `PhotosHeader`, a new component). `public/images/optimized/` absent. `app/globals.css:13` has `--color-*: initial;` backstop. `raw.githubusercontent.com` appears only in a negative assertion in `lib/__tests__/proxy.test.ts`. `npm run build` exit 0; `npm run lint` exit 0 (all guards, data:check, served-images OK); `tsc --noEmit` clean; Jest 102 suites, 1658/1658 pass, ratchet baseline 2205. Debt-marker scan (TBD/FIXME/XXX) of source: none |
| 5 | axe zero violations on every route, keyboard-only pass succeeds; Chromium, Firefox and WebKit pass including View Transitions and WebGL fallbacks; no route has CLS above 0.1, broken links, missing images or CSP console errors | VERIFIED (real Safari pending) | `e2e/audit.spec.ts` (axe, CLS, links, images, CSP, console on every route and state), `keyboard.spec.ts`, `a11y-contact.spec.ts`, `no-webgl.spec.ts`, `service-worker.spec.ts`, `offline.spec.ts` all pass on chromium against my fresh build. CI run 41571031827 on 147bc82 (read with `gh run view`): E2E Tests, Visual Regression, Unit Tests, Lint and Type Check, Build all success; `ci.yml:104` runs `--project=chromium --project=firefox --project=webkit --fail-on-flaky-tests`. HEAD differs from 147bc82 in source only by `scripts/guards/test-count.baseline.json` (`git diff --stat 147bc82 HEAD -- . ':!.planning'`), so the CI result applies. Windows WebKit exclusions are tagged with reasons (12-23 triage); real Safari is a human item |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Deferred Items

None. Phase 12 is the last phase of the milestone. Items already logged in `deferred-items.md` as post-phase follow-ups are listed under Gaps Summary.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/contact/SummitRegister.tsx` | Register form with validation, summary, honeypot, counter | VERIFIED | Substantive, wired from contact page, e2e and Jest pass |
| `app/api/feedback/route.ts` | Contract codes, honeypot after CSRF and limiter, metadata-only logs | VERIFIED | Order confirmed in source (lines 85-137) |
| `components/site/{EdgeLayout,EdgeArt,NotFoundBody,ErrorBody,SavedPages,OfflineRetry}.tsx` | Shared edge shell | VERIFIED | Present; rendered by live 404 and offline specs |
| `proxy.ts` | Slug 404 rewrite, CSP builder | VERIFIED | CSP header served; `/photos/nope` 404 |
| `public/service-worker.js` | Network-first navigations, offline precache | VERIFIED | Behavioural e2e passes; see WR-04 for a robustness warning |
| `app/sitemap.ts`, `app/robots.ts`, `lib/metadata.ts` | SEO-01/03 | VERIFIED | Served output checked |
| `app/**/opengraph-image.tsx`, `lib/og/*` | Per-slug OG | VERIFIED | 200 PNG for photo, project, root |
| `app/globals.css` | v1 aliases removed, colour backstop | VERIFIED | `--color-*: initial` at line 13 |
| `scripts/guards/test-count.baseline.json` | Ratchet raised | VERIFIED | 1658 + 547 = 2205 |
| `e2e/audit.spec.ts`, `keyboard.spec.ts`, `routes.ts` | Permanent gates | VERIFIED | Pass on chromium |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Contact page | SummitRegister | server page renders island | WIRED | Live route returns 200, e2e drives the form |
| SummitRegister | /api/feedback | fetch POST, outcome mapper | WIRED | Contract tested in `api-contract.test.ts`; e2e mocks the route |
| Unknown slug | neutral 404 | proxy rewrite | WIRED | Live 404 for photo and project misses |
| Page heads | sitemap, OG routes | `lib/metadata.ts`, `site.url` | WIRED | Absolute URLs in served heads |
| Service worker | /offline and Cache Storage | fetch handler | WIRED | service-worker and offline specs pass |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| sitemap | `photoSlugs`, `projects`, `site.nav` | `data/`, `lib/photos/view-model` | Yes (served XML lists real slugs) | FLOWING |
| OG cards | `photoBySlug`, project data, JPEG derivatives | manifest and `data/` | Yes (633 KB PNG for a photo) | FLOWING |
| SavedPages | Cache Storage keys | SW cache | Yes (offline spec) | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Production build | `npm run build` | exit 0, routes listed incl. sitemap, robots, 2 OG routes | PASS |
| Audit, SEO, 404, OG specs | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/audit.spec.ts e2e/seo.spec.ts e2e/not-found.spec.ts e2e/og.spec.ts --project=chromium` | 58 passed | PASS |
| Keyboard, SW, offline, a11y-contact, no-webgl | same flags | 27 passed | PASS |
| Contact form specs | same flags | 16 passed | PASS |
| Jest | `npx jest --silent --json` | 102 suites, 1658/1658 | PASS |
| Lint plus guards, type-check | `npm run lint`, `npm run type-check` | exit 0, clean | PASS |
| Honeypot on live build | POST with `trail_note` | 200 `ok`, server log `honeypot`, no send | PASS |
| Firefox, WebKit | not run locally | CI run 41571031827 success | PASS (CI evidence) |

The production server was stopped afterwards (port 3000 free) and `public/service-worker.js` was restored with `git checkout`.

### Probe Execution

SKIPPED: no probe scripts are declared by any Phase 12 plan, and no `scripts/*/tests/probe-*.sh` exist.

### Requirements Coverage

All 12 IDs are claimed by at least one PLAN `requirements:` field and are marked Complete in REQUIREMENTS.md (lines 101-121, 225-236). No orphaned requirements.

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| CONTACT-01 | 12-01, 13, 16, 19, 25 | Dark summit-register form, email text, coordinates | SATISFIED | contact-form spec, DirectContactPanel, `site.test.ts` |
| CONTACT-02 | 12-01, 03, 13, 26 | Errors below fields, focused summary, kept input, progress and confirmation | SATISFIED | contact-form spec, SummitRegister Jest; WR-01 and IN-01/IN-06 are edge-case warnings |
| CONTACT-03 | 12-03, 06, 13 | Honeypot, CSRF, rate limit unchanged | SATISFIED | route order, feedback tests, live honeypot probe |
| EDGE-01 | 12-01, 02, 12, 15, 19 | 404 copy and art; error and global-error in same shell | SATISFIED | live 404, not-found spec, EdgeLayout tests |
| EDGE-02 | 12-01, 08, 15, 17, 19 | Offline page in system; network-first SW | SATISFIED | service-worker and offline specs |
| SEO-01 | 12-01, 09, 13, 17, 25 | Own title, description, canonical per route | SATISFIED | served heads, seo spec |
| SEO-02 | 12-01, 10, 14, 17 | Per-photo and per-project OG image | SATISFIED | og spec, served PNGs |
| SEO-03 | 12-09, 17 | sitemap.xml and robots.txt | SATISFIED | served output, seo spec |
| VERIFY-01 | 12-02, 04, 05, 11, 16, 18, 22, 24 | Dead code removed | SATISFIED | greps, lint guards, asset-exists test |
| VERIFY-02 | 12-07, 20, 21, 23, 24 | axe zero, keyboard-only pass | SATISFIED (human judgement pending) | audit and keyboard specs |
| VERIFY-03 | 12-02, 11, 23, 24 | Three-engine pass incl. fallbacks | SATISFIED (CI) | run 41571031827; real Safari is human |
| VERIFY-04 | 12-02, 06, 07, 20, 23, 24 | CLS, links, images, CSP console | SATISFIED | audit spec |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/contact/SummitRegister.tsx` | 472-481 | A `validation` answer with no field issue leaves the form silent (WR-01) | Warning | Not reachable from today's form; no error and no confirmation if a contract drift occurs |
| `components/projects/DemoTerminal.tsx` | 177-189, 215-219 | Observer attached once to a region that the shrink-restart unmounts (WR-02) | Warning | Terminal could stay paused after a command-list shrink; data is static so it does not trigger today |
| `README.md` | 88, 326 | Documents `FEEDBACK_EMAIL`; code reads `FEEDBACK_RECIPIENT_EMAIL` (WR-03) | Warning | A deployer following the README gets 502 on every send |
| `public/service-worker.js` | 56-59 | `cache.put` not awaited or tied to `waitUntil` (WR-04) | Warning | A navigation copy can be lost, so the saved-pages list may miss a page; fetching stays network-first so freshness is unaffected |
| `e2e/design-system.spec.ts` | 20 | Comment still names deleted `text-shadow-glow*` | Info | Comment only (deferred-items) |

IN-01 to IN-07 from `12-REVIEW.md` are informational. All 11 review findings are recorded at disposition `open` in `12-REVIEW-DISPOSITION.md`; none is a BLOCKER by the reviewer's assessment, and I found nothing that contradicts that.

### Human Verification Required

See the `human_verification` frontmatter list; each item maps to the phase's UAT checklist in `12-24-SUMMARY.md`:

1. **Real Safari pass** (UAT a, i). Playwright WebKit is not Safari.
2. **Keyboard focus visibility** (UAT c).
3. **Screen-reader listen on /contact** (UAT j).
4. **Link previews and OG legibility** (UAT e; `12-UI-REVIEW.md` never rendered a page).
5. **Production CSP header and preview slug check** (UAT d, k).
6. **Firefox footer contour band** (UAT b).

### Gaps Summary

No must-have is failed. Items to carry forward, none gating the phase goal:

- **Open code-review warnings WR-01 to WR-04**, all `open`. WR-03 (README env var) is the cheapest and the most likely to bite a real deploy.
- **Logged follow-ups (deferred-items.md):** prefetch requests skip the proxy so a forged `x-edge-section` reaches the 404 without CSP (T-12-02 is the one security row left open, below the `high` block threshold); hero contour not in the SW install precache; canonical host switch to `https://www.tlui.de` waits on DNS (until then `site.url` is the vercel.app URL, and the sitemap and canonicals use it).
- **`npm audit`** currently reports 2 advisories (`source-map-js` high, `baseline-browser-mapping` moderate), build and tooling dependencies. The CI Security Audit step is `continue-on-error` and only warns, so it does not gate; flagging so it is a conscious choice.
- **UI review** (20/24) was code-only. Its two token deviations (`text-accent` on "Report this error", `hover:bg-surface-raised` on saved rows) are cosmetic and unresolved.
- **Unpushed commits:** the test-count ratchet and PROJECT.md commits (and later docs commits) are local; UAT item (h) is to read CI on the pushed sha. The verified CI run is on 147bc82, which has identical source.

Side effect to disclose: while probing the live local build I POSTed one valid-looking payload (name "a", message "hello hello hello") to `/api/feedback` without a honeypot. The local environment has Resend configured, so one real notification email was likely delivered to the configured recipient. It is harmless test content, but Tim may see it in his inbox.

---

_Verified: 2026-11-03T11:00:00Z_
_Verifier: Claude (gsd-verifier)_
