---
phase: 12-contact-edge-pages-cleanup-verification
plan: 17
subsystem: testing
tags: [playwright, seo, open-graph, service-worker, offline, e2e]

# Dependency graph
requires:
  - phase: 12-08
    provides: "Network-first navigations, RSC bypass, offline-ready install precache"
  - phase: 12-09
    provides: "pageMetadata, SITE_DESCRIPTION, site.url canonicals, sitemap and robots"
  - phase: 12-10
    provides: "Default 1200 x 630 OG card at /opengraph-image"
  - phase: 12-14
    provides: "Per-slug photo and project OG cards (rendered on first request)"
  - phase: 12-13
    provides: "/contact metadata"
  - phase: 12-15
    provides: "/offline (noindex, edge layout, saved-pages list)"
provides:
  - "e2e/seo.spec.ts: one loop over every e2e/routes.ts route (canonical, description, title, og:image PNG, twitter:card), uniqueness, noindex for /offline and 404, /contact in the sitemap"
  - "e2e/service-worker.spec.ts: real production worker through a simulated deploy, an outage and an RSC request"
  - "playwright.config.ts: @prod-only tests dropped from dev-server runs"
affects: [12-18, 12-21, 12-22, 12-23]

# Actuals (#2632): chars/4 over the realized diff (18,565 chars)
actuals:
  tokens: 4600
  tasks: 2
  commits: 2
plan_head_before: f4f7793b74ece9eaa3119aea609e174186d45c7d
plan_head_after: 2410689c08542b06d1bc7e2c33bc8c4cabed99f6

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@prod-only title tag plus config grepInvert for tests that need a production build (no skips)"
    - "SW e2e with control assertions: response.fromServiceWorker(), a cached copy before the deploy, an offline fetch the worker forwards must fail"
    - "Simulated deploy rewrites every copy of the title (head and flight data), because hydration resets document.title from the flight payload"

key-files:
  created:
    - e2e/service-worker.spec.ts
  modified:
    - e2e/seo.spec.ts
    - playwright.config.ts

key-decisions:
  - "The simulated deploy rewrites every occurrence of the Roadmap title in the routed HTML, not only <title>: hydration sets document.title from the flight data, so a <title>-only edit was undone about a second after load even though the worker had served the new HTML"
  - "A5 holds: context.setOffline(true) cuts the worker's own fetches in Chromium. No switch to context.route abort was needed"
  - "The hero-contour precache (12-15 deferred) stays deferred: the fix lives in scripts/terrain/build-terrain.mjs and data/generated/precache.json, outside this plan's files"
  - "e2e/not-found.spec.ts keeps its 12-02 service-worker block, so two specs opt in to service workers (the plan's 'only spec' truth predates that block)"

patterns-established:
  - "Per-route head checks loop over e2e/routes.ts; og:image is requested by its path against baseURL (metadataBase is the production host)"

requirements-completed: [SEO-01, SEO-02, SEO-03, EDGE-02]

coverage:
  - id: D1
    description: "Every content route (Home, Photographs, a photo page, Engineering, a project page, Roadmap, Contact) has exactly one canonical equal to site.url + path, one non-empty description, its own title, an og:image whose path answers a 1200 x 630 PNG, and twitter:card summary_large_image"
    requirement: SEO-01
    verification:
      - kind: e2e
        ref: "e2e/seo.spec.ts#Own head per content route (SEO-01, SEO-02) (7 route tests; chromium and firefox, fresh build)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No two routes share a title or a description; only Home uses the root description; /photos?view=grid canonicalises to /photos"
    requirement: SEO-01
    verification:
      - kind: e2e
        ref: "e2e/seo.spec.ts#no two routes share a title or a description, and #/photos?view=grid canonicalises to /photos"
        status: pass
    human_judgment: false
  - id: D3
    description: "SEO-02 presence on every route: an og:image (own or inherited default) answering 200 image/png at 1200 x 630, and per-slug cards distinct"
    requirement: SEO-02
    verification:
      - kind: e2e
        ref: "e2e/seo.spec.ts route loop plus e2e/og.spec.ts (9 tests), chromium and firefox"
        status: pass
    human_judgment: false
  - id: D4
    description: "/offline is noindex with no canonical and absent from the sitemap; an unknown URL's 404 is noindex; the sitemap lists /contact; robots unchanged"
    requirement: SEO-03
    verification:
      - kind: e2e
        ref: "e2e/seo.spec.ts#Kept out of the index (SEO-01, SEO-03) and #sitemap.xml and robots.txt (SEO-03)"
        status: pass
    human_judgment: false
  - id: D5
    description: "With the production worker in control, a reload after the server's HTML changes shows the new HTML and replaces the stored copy (network-first)"
    requirement: EDGE-02
    verification:
      - kind: e2e
        ref: "e2e/service-worker.spec.ts#a reload after a deploy shows the new HTML, never the cached copy (chromium, fresh build; 5/5 with --repeat-each=5; fails against a cache-first navigation mutant)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Offline: a visited page comes from the cache; an unvisited page gets the precached /offline with Schibsted Grotesk loaded and Roadmap in the saved pages; RSC requests are never answered by the worker"
    requirement: EDGE-02
    verification:
      - kind: e2e
        ref: "e2e/service-worker.spec.ts#offline: a visited page comes from the cache, an unvisited one gets the styled /offline, and #an RSC request (?_rsc=) is not answered by the worker"
        status: pass
    human_judgment: false
  - id: D7
    description: "@prod-only tests are dropped from dev-server runs on every engine; production runs keep today's filters"
    verification:
      - kind: other
        ref: "npx playwright test e2e/service-worker.spec.ts --project=chromium --list (dev): Total 0 tests; PW_PROD=1 --list: 3 tests, chromium only"
        status: pass
    human_judgment: false

# Metrics
duration: 8min
completed: 2026-11-03
status: complete
---

# Phase 12 Plan 17: Every route's head tags and the live service-worker e2e Summary

**One loop in `e2e/seo.spec.ts` now checks every content route's canonical, description, title, OG card (fetched by path, 1200 x 630 PNG) and twitter:card, plus uniqueness and the noindex exclusions. The new `e2e/service-worker.spec.ts` drives the real production worker through a simulated deploy (fresh HTML, never the cached copy), an outage (cached page, styled `/offline` with saved pages) and an RSC request (never answered by the worker). A `@prod-only` tag keeps it out of dev-server runs.**

## Performance

- **Duration:** about 8 min (measured from the start stamp)
- **Started:** 2026-11-02T23:20:56Z
- **Completed:** 2026-11-02T23:29:11Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- **SEO loop (SEO-01, SEO-02).** One `for` over `ROUTES` minus `/offline` generates a test per route. Each test checks: exactly one `link[rel=canonical]` equal to `site.url + path` (Home: `site.url`, with no trailing slash, as Next writes it); exactly one non-empty `meta[name=description]`, where only Home's equals `SITE_DESCRIPTION`; a non-empty title; exactly one `og:image`, whose pathname plus search answers 200 `image/png` with IHDR 1200 x 630; and exactly one `twitter:card` reading `summary_large_image`. A separate test asserts that all 7 titles and all 7 descriptions are unique.
- **Exclusions (SEO-03).** `/offline` has one robots meta containing `noindex` and no canonical. `/__no-such-page__` answers 404 with a `noindex` robots meta. The sitemap still equals the data-derived list exactly, and it now also asserts `/contact` explicitly and no `/offline`. The `/photos?view=grid` canonical is `/photos`.
- **Service-worker spec (EDGE-02, D-12).** It is the first spec to drive the worker's behaviour itself. 12-02's not-found block only needs the worker to be in control. The spec has three tests, each tagged `@chromium-only @prod-only`. Each test opens a page, waits for `navigator.serviceWorker.ready` and a controller, and reloads. It then asserts that the reload came `fromServiceWorker()`.
  1. **Update:** the control is that `/roadmap` is already stored with its old title. Then `context.route('**/roadmap')` serves the real response with the title changed to `DEPLOY-2 Roadmap · Tim Lui`. The reload response body, `document.title` and the stored copy all show `DEPLOY-2`.
  2. **Offline:** first the controls: `/roadmap` is cached and the unvisited project page is not. With `context.setOffline(true)`, a page fetch to an uncached URL fails with a network error (A5). `/roadmap` then renders its h1 from the worker. `/projects/coin-flip` (the last project in the data) renders `You're offline`. That h1's computed font-family contains `Schibsted`, and a loaded `FontFace` named Schibsted exists. The "Saved on this device" region links to `/roadmap`.
  3. **RSC:** the control is that `fetch('/roadmap?sw-control=1')` is answered by the worker. `fetch('/roadmap?_rsc=e2e')` is not (`fromServiceWorker()` is false).
- **Config.** `CHROMIUM_INVERT = prod ? undefined : /@prod-only/` and `OTHER_ENGINE_INVERT = prod ? /@chromium-only/ : /@chromium-only|@prod-only/`. The projects, `PW_REUSE` and the per-project `serviceWorkers: 'block'` are unchanged.

## Routes as observed (production build, `next start`)

| Route | Title | Canonical | og:image path |
|-------|-------|-----------|---------------|
| `/` | Tim Lui · Developer & photographer | https://portfolio-app-mocha-three.vercel.app | /opengraph-image?ddc1dda9afc67a8f |
| `/photos` | Photographs · Tim Lui | https://portfolio-app-mocha-three.vercel.app/photos | /opengraph-image?ddc1dda9afc67a8f |
| `/photos/matterhorn-from-zermatt` | Matterhorn from Zermatt · Tim Lui | https://portfolio-app-mocha-three.vercel.app/photos/matterhorn-from-zermatt | /photos/matterhorn-from-zermatt/opengraph-image-126xvw/card?1bf973d7cc2e42c4 |
| `/projects` | Engineering · Tim Lui | https://portfolio-app-mocha-three.vercel.app/projects | /opengraph-image?ddc1dda9afc67a8f |
| `/projects/box` | box · Tim Lui | https://portfolio-app-mocha-three.vercel.app/projects/box | /projects/box/opengraph-image-umay0l/card?71187a44ebae097a |
| `/roadmap` | Roadmap · Tim Lui | https://portfolio-app-mocha-three.vercel.app/roadmap | /opengraph-image?ddc1dda9afc67a8f |
| `/contact` | Contact · Tim Lui | https://portfolio-app-mocha-three.vercel.app/contact | /opengraph-image?ddc1dda9afc67a8f |
| `/offline` | Offline · Tim Lui | (none, noindex) | /opengraph-image?ddc1dda9afc67a8f |

The per-slug cards are not asserted as prerendered (12-14: they render on first request). The loop only proves that they exist and answer a 1200 x 630 PNG. `e2e/og.spec.ts` proves that they differ per slug.

## A5 outcome

**Holds.** In Chromium, `context.setOffline(true)` cuts the worker's own fetches too. Offline, a page `fetch('/projects/coin-flip?a5-control=1')` goes through the worker's network-first path, finds nothing cached, and rejects with a network error. So the offline answers come from the caches, not the network. No switch to `context.route('**', r => r.abort())` was needed.

## Task Commits

1. **Task 1: Every route's title, description, canonical and OG image in one loop:** `a8d16b1` (test)
2. **Task 2: The production service worker serves fresh HTML after a deploy and a styled offline page:** `2410689` (test)

## Files Created/Modified

- `e2e/seo.spec.ts` (190 lines): the route loop, the uniqueness test, the noindex tests, `/contact` in the sitemap. The Roadmap head test and robots test are unchanged.
- `e2e/service-worker.spec.ts` (188 lines, new): the three worker tests.
- `playwright.config.ts`: the `@prod-only` grepInvert for dev-server runs.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test correctness] The simulated deploy changes every copy of the title, not only `<title>`**
- **Found during:** Task 2, first run. `toHaveTitle(/^DEPLOY-2 /)` received `Roadmap · Tim Lui`.
- **Diagnosis:** a probe (`scratchpad/sw-probe.cjs`) showed that the route fired once, on the worker's fetch. The reload response came `fromServiceWorker`, and its body carried `<title>DEPLOY-2 …`. `document.title` read `DEPLOY-2 …` at DOMContentLoaded and `Roadmap · Tim Lui` 1.5 s later: hydration sets the title from the flight data, which still held the old string. So the worker behaved correctly, and the test's "deploy" was only half a deploy.
- **Fix:** the route handler replaces every occurrence of `Roadmap · Tim Lui` in the HTML (the head, plus the og/twitter titles and flight data), as a real new build would. The test also asserts the served response's `<title>` directly, so the claim does not rest on `document.title` alone.
- **Proof that it is not vacuous:** I temporarily mutated the running build's worker to serve cached navigations first, then restored it from a byte copy. The update test then failed with `Expected "DEPLOY-2 Roadmap · Tim Lui" / Received "Roadmap · Tim Lui"`.
- **Files modified:** e2e/service-worker.spec.ts
- **Committed in:** 2410689

**2. [Spec reconciliation] Two specs opt in to service workers, not one**
- **Issue:** the must-have truth and the acceptance check `git grep -l "serviceWorkers: 'allow'" -- e2e` expect only `e2e/service-worker.spec.ts`. 12-02's follow-up added a service-worker block to `e2e/not-found.spec.ts` (T-12-03), and the orchestrator asked to keep it green. That file is not in this plan's list.
- **Result:** `grep -c` is 1 in the new spec. The `git grep` lists `e2e/not-found.spec.ts` and `e2e/service-worker.spec.ts`. The not-found block passed (17/17 on chromium against the reused build). The not-found block is not tagged `@prod-only` because it already runs without a worker on the dev server (`openControlledHome` returns early).

**3. [Additive] Stronger D-12 proof**
- Beyond the computed `font-family` (which also names the `Schibsted Grotesk Fallback` face), the offline test asserts that a Schibsted `FontFace` has `status === 'loaded'`, so the font really came from the precache.

---

**Total deviations:** 1 auto-fixed (Rule 1), 1 spec reconciliation, 1 additive check.
**Impact on plan:** no scope change. The fix makes the update e2e a faithful deploy, and the mutant run proves the test catches stale HTML.

## Deferred

**12-15's hero-contour precache stays open** (deferred-items.md row updated with a pointer). The fix is outside this plan's files:
- `scripts/terrain/build-terrain.mjs` line 464: `precacheText` should list `[meta.assets.contours.strip, meta.assets.contours.hero]`.
- Run `npm run terrain:build` to regenerate `data/generated/precache.json`. Postbuild's `PRECACHE_URL` regex already accepts a hashed `/terrain/*.svg`, and `public/service-worker.js` needs no change because it spreads `PRECACHE` into `addAll`.
- Update `data/__tests__/precache.test.ts` if it pins the list.
- Then add to `e2e/service-worker.spec.ts`: after `navigator.serviceWorker.ready`, `caches.match(terrain.assets.contours.hero)` is non-null.

## Verification

- **Per task (one reused production build, `PW_PROD=1 PW_REUSE=1`):** `e2e/seo.spec.ts --project=chromium` passed 14 of 14. `e2e/service-worker.spec.ts --project=chromium` passed 3 of 3, and 15 of 15 with `--repeat-each=5`. `e2e/not-found.spec.ts --project=chromium` passed 17 of 17, including the service-worker block.
- **Dev list:** `npx playwright test e2e/service-worker.spec.ts --project=chromium --list` gives `Total: 0 tests in 0 files`. It exits non-zero with "No tests found", which is expected because the filter drops every test in the file. The same holds for firefox and webkit. With `PW_PROD=1 … --list` (all projects) it lists 3 tests, all chromium.
- **Plan level, fresh build:** `PW_PROD=1 npx playwright test e2e/seo.spec.ts e2e/og.spec.ts e2e/service-worker.spec.ts --project=chromium --project=firefox` passed 49 of 49 (exit 0). chromium: seo 14, og 9, service-worker 3. firefox: seo 14, og 9, service-worker 0 (excluded by `@chromium-only`). There were no failed or flaky lines.
- `npm run lint` exit 0. `npx tsc --noEmit` exit 0.
- **Acceptance:** `grep -c "from './routes'" e2e/seo.spec.ts` = 1. `grep -c "serviceWorkers: 'allow'" e2e/service-worker.spec.ts` = 1. `grep -cE "^\s*test\(" e2e/service-worker.spec.ts` = 3. `git status --porcelain public/service-worker.js` is empty (restored after each server stopped). No `.only(`, `.skip(` or `.fixme(` appears.
- No visual spec was run, and no PNG was touched. The changes are test and config only. Port 3000 is free and no server is left running.

## Issues Encountered

None beyond the deviation above.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- 12-18 (same wave) can start: port 3000 is free and `public/service-worker.js` is clean.
- 12-23 (CI and webkit): the SW spec is chromium-only by design. CI runs it because `CI` implies a production build.
- When `site.url` moves to www.tlui.de (deferred), the seo loop follows `site.url` automatically.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-03*

## Self-Check: PASSED

- FOUND: e2e/service-worker.spec.ts, e2e/seo.spec.ts, playwright.config.ts
- FOUND commits on this branch: a8d16b1, 2410689
