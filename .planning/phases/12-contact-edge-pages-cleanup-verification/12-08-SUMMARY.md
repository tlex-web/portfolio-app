---
phase: 12-contact-edge-pages-cleanup-verification
plan: 08
subsystem: infra
tags: [service-worker, pwa, offline, cache-control, next-config, jest]

# Dependency graph
requires:
  - phase: 12-01
    provides: "Resolved values: sw.reload-once = yes, vercel.plan = Hobby"
  - phase: 12-02
    provides: "Proxy neutral 404 for every request kind, and the serviceWorkers: 'allow' block in e2e/not-found.spec.ts"
provides:
  - "networkFirstNavigation: page navigations go to the network first; only ok, basic, non-redirected answers are stored"
  - "isRscRequest: _rsc and RSC: 1 requests (and /api/) get no respondWith"
  - "precacheOfflineAssets: install stores '/', '/offline', PRECACHE, and every /_next/static/ file and Link-header font /offline needs"
  - "Cache-Control: no-cache on /service-worker.js"
  - "lib/sw-update.ts: SW_RELOAD_KEY, shouldReloadOnControllerChange, hasDirtyField"
  - "ServiceWorkerRegistration reloads once per tab on controllerchange (update only, never with a dirty field)"
affects: [12-17, 12-22]

# Actuals (#2632): chars/4 over the realized non-planning diff (30,830 chars)
actuals:
  tokens: 7700
  tasks: 2
  commits: 4
plan_head_before: d4389183f6fda672344ac8144894e055abf272cc
plan_head_after: 870638952db5a4c74e7a512e99ed43a6ceddc90c

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SW navigation rule: network first; store only ok && type 'basic' && !redirected; fall back only on a network error (cached page, cached /offline, 503 'Offline')"
    - "SW Jest harness with postbuild tokens replaced in the test (BUILD_HASH, PRECACHE) so cache names and the precache list are asserted, not just the placeholder form"

key-files:
  created:
    - lib/sw-update.ts
    - lib/__tests__/sw-update.test.ts
    - lib/__tests__/service-worker-navigation.test.ts
  modified:
    - public/service-worker.js
    - next.config.ts
    - components/ServiceWorkerRegistration.tsx
    - data/__tests__/precache.test.ts

key-decisions:
  - "Install puts /offline in the single all-or-nothing addAll list, as the behaviour list requires, and does not cache.put the parsing fetch separately. The no-store fetch of /offline is used only to read its asset URLs and must answer ok, or install rejects."
  - "sw.reload-once = yes (12-01). The reload is skipped when sessionStorage is unavailable, because without the once-per-tab key a reload could loop."
  - "hasDirtyField counts any non-empty value in a text-like input or textarea, whitespace included, and skips tabindex=-1, hidden, checkbox, radio and button-like inputs"

patterns-established:
  - "Pattern: every SW behaviour claim is proven in the Jest harness (lib/__tests__/service-worker-*.test.ts) or in a serviceWorkers: 'allow' Playwright context"

requirements-completed: [EDGE-02]

coverage:
  - id: D1
    description: "Page navigations are network-first: ok/basic/non-redirected answers are returned and stored; 404, 500, redirected, opaque and opaqueredirect answers are returned and never stored; a cached copy never replaces a network answer"
    requirement: EDGE-02
    verification:
      - kind: unit
        ref: "lib/__tests__/service-worker-navigation.test.ts#service worker navigations (EDGE-02, network-first)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 PW_REUSE=1 npx playwright test e2e/not-found.spec.ts --project=chromium --project=firefox --project=webkit (30 passed, including the serviceWorkers: 'allow' block)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Offline fallback: the cached page, then the cached /offline, then a plain 503 'Offline'"
    requirement: EDGE-02
    verification:
      - kind: unit
        ref: "lib/__tests__/service-worker-navigation.test.ts#offline with nothing cached, a plain 503 \"Offline\" is returned (plus the two cached-page and /offline cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "RSC (_rsc query, RSC: 1 header) and /api/ requests get no respondWith and touch no cache"
    requirement: EDGE-02
    verification:
      - kind: unit
        ref: "lib/__tests__/service-worker-navigation.test.ts#service worker bypasses (RSC and API)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Install precaches '/', '/offline', PRECACHE, /offline's /_next/static/ HTML references and its Link-header fonts, each once; install rejects on an addAll failure or a non-ok /offline; activate deletes other builds' caches"
    requirement: EDGE-02
    verification:
      - kind: unit
        ref: "lib/__tests__/service-worker-navigation.test.ts#service worker install (D-12, offline-ready precache) and #service worker activate"
        status: pass
    human_judgment: false
  - id: D5
    description: "/service-worker.js is served with Cache-Control: no-cache"
    requirement: EDGE-02
    verification:
      - kind: other
        ref: "curl -sI http://localhost:3000/service-worker.js on a fresh production build: 'Cache-Control: no-cache'"
        status: pass
    human_judgment: false
  - id: D6
    description: "Reload-once guard: reload on controllerchange only after an update, once per tab, never with a dirty field"
    requirement: EDGE-02
    verification:
      - kind: unit
        ref: "lib/__tests__/sw-update.test.ts"
        status: pass
    human_judgment: true
    rationale: "The decision helpers are unit-tested, but the wiring in ServiceWorkerRegistration (controllerchange in a real browser across a deploy) is not exercised by any automated test. The end-to-end SW test is deferred to 12-17 by the plan."

# Metrics
duration: 9min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 08: Network-first service worker and reload-once guard Summary

**The service worker now fetches page navigations network-first and stores only ok, basic, non-redirected answers. RSC and API traffic bypass it. Install precaches the /offline page together with its 13 `/_next/static/` files and 3 Link-header fonts. The worker script is served `no-cache`, and an update reloads a tab once, never while a field holds typed text.**

## Performance

- **Duration:** about 9 min (measured from the start stamp)
- **Started:** 2026-11-02T18:51:16Z
- **Completed:** 2026-11-02T19:00Z
- **Tasks:** 2
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- `networkFirstNavigation` replaces the stale-while-revalidate HTML path, which has been removed. A navigation returns the network answer whenever there is one: a 404 (including the proxy's neutral 404 from 12-02) or a 500 is passed through and never stored, and a cached copy never stands in for it. Only a network error falls back: first the cached page, then the cached `/offline`, then `503 Offline` (text/plain).
- `isRscRequest` (`_rsc` query or `RSC: 1` header) returns before any strategy, next to the `/api/` bypass. A live probe in Chromium confirmed it: no `?_rsc=` request was forwarded by the worker.
- `precacheOfflineAssets`: the install event fetches `/offline` with `cache: 'no-store'` and collects `href|src="/_next/static/..."` from the HTML and `</_next/static/media/...>` from the `link` header. It then runs one deduped `cache.addAll` over those URLs, `'/'`, `'/offline'` and `PRECACHE`. Live result on the production build: the static cache held `/`, `/offline`, the contour strip, 2 CSS files, 11 JS chunks and 3 woff2 fonts. With the context offline, `/roadmap` and `/photos` rendered from the cache (2 stylesheets applied).
- `next.config.ts`: `Cache-Control: no-cache` for `/service-worker.js`. The stale "CSP moved to middleware.ts" comment now points to `proxy.ts`.
- `lib/sw-update.ts` and `ServiceWorkerRegistration`: Tim's **sw.reload-once** value from 12-01 is: *"yes: reload once on `controllerchange` only when no form field is dirty; otherwise the next in-site navigation is a hard navigation (12-08 builds the guarded reload)"*. The component reads `navigator.serviceWorker.controller` before registering. On `controllerchange` it reloads only when `shouldReloadOnControllerChange({ hadController, alreadyReloaded: sessionStorage['sw-reloaded'] === '1', dirty: hasDirtyField(document) })` is true, and it sets the key before reloading.
- **vercel.plan** is Hobby (12-01), so Skew Protection is not available. The reload guard does not depend on it.

## Curl header check (Task 2)

Fresh `npm run build`, then `npm run start`, then `curl -sI http://localhost:3000/service-worker.js`:

```
HTTP/1.1 200 OK
Cache-Control: no-cache
```

## Task Commits

1. **Task 1: Network-first navigations, RSC bypass, offline-ready install**
   - RED `63fdad7` test(12-08): failing service-worker navigation tests
   - GREEN `f9f144c` feat(12-08): network-first navigations and an offline-ready install (EDGE-02)
2. **Task 2: No-cache worker script and the reload-once guard**
   - RED `8bbcdcc` test(12-08): failing reload-once guard tests
   - GREEN `8706389` feat(12-08): no-cache worker script and the reload-once guard (EDGE-02)

## Files Created/Modified

- `public/service-worker.js`: adds `networkFirstNavigation`, `isRscRequest` and `precacheOfflineAssets`, and removes `staleWhileRevalidate`. Both postbuild tokens are kept.
- `lib/__tests__/service-worker-navigation.test.ts` (new, 321 lines, 10 `test(` blocks / 18 cases): covers navigation, fallback, the RSC/API bypass, install and activate. It runs in the Node environment, with BUILD_HASH and PRECACHE injected the way postbuild does it.
- `next.config.ts`: the `/service-worker.js` no-cache rule and the corrected comment.
- `lib/sw-update.ts` (new): `SW_RELOAD_KEY`, `shouldReloadOnControllerChange`, `hasDirtyField`.
- `lib/__tests__/sw-update.test.ts` (new, 13 cases).
- `components/ServiceWorkerRegistration.tsx`: adds the guarded reload, removes the no-op `updatefound` listener, and cleans up the listener on unmount.
- `data/__tests__/precache.test.ts`: the install assertion now follows the new `addAll` expression (see Deviations).

## Decisions Made

See `key-decisions` in the frontmatter. In short: `/offline` goes through the single all-or-nothing `addAll` rather than a separate `put`; a missing sessionStorage means no reload; any non-empty text value counts as dirty.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `data/__tests__/precache.test.ts` asserted the old install literal**
- **Found during:** Task 1 GREEN
- **Issue:** the test expected the exact string `cache.addAll(['/', '/offline', ...PRECACHE])`, which the new install necessarily replaces. The file was not in `files_modified`.
- **Fix:** the test was rewritten, not deleted. It now matches `cache.addAll([...new Set(['/', '/offline', ...PRECACHE,`, and the behaviour itself is asserted in the new navigation test.
- **Files modified:** data/__tests__/precache.test.ts
- **Verification:** the precache suite passes; full Jest run: 88 suites, 1,441 tests.
- **Committed in:** f9f144c

**2. [Rule 1 - Spec reconciliation] /offline is precached via addAll, not a separate put**
- **Found during:** Task 1 GREEN
- **Issue:** the action text says to "store the /offline response, then cache.addAll". The behaviour list (the test contract) requires `addAll` to receive `'/offline'`. Doing both fetches `/offline` twice and overwrites the first copy.
- **Fix:** `/offline` is in the `addAll` list, so it gets the same all-or-nothing guarantee as everything else. The `no-store` fetch is used only to read the asset URLs. A non-ok answer throws, so install rejects and the previous worker stays in control (an extra Jest case covers this). `&amp;` in attribute URLs is decoded before use.
- **Files modified:** public/service-worker.js
- **Committed in:** f9f144c

**3. [Rule 2 - Missing critical] sessionStorage access guarded**
- **Found during:** Task 2
- **Issue:** `sessionStorage` throws in some privacy modes. If the once-per-tab key cannot be read or written, a reload could loop (T-12-18).
- **Fix:** both the read and the write are in try/catch, and a failure means no reload.
- **Files modified:** components/ServiceWorkerRegistration.tsx
- **Committed in:** 8706389

**4. [TDD hygiene] Task 2 RED carried a signature-only stub of `lib/sw-update.ts`**
- Without the module, the RED run would fail on module resolution, which is an invalid RED. The stub exported the three names with wrong values, so the 7 target tests failed on their assertions. The GREEN commit replaced it.

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 spec reconciliation, 1 missing critical), plus 1 TDD hygiene note.
**Impact on plan:** none of these widen the scope. All of them serve the plan's own truths (all-or-nothing install, no reload loop).

## TDD Gate Compliance

- **Task 1 RED** `63fdad7`: `npx jest lib/__tests__/service-worker-navigation.test.ts` exited 1 with `Tests: 9 failed, 9 passed, 18 total`. Failures: the network-first case got the stale cached copy (`toBe(fresh)`); redirected and opaque answers were stored (`put` called once, expected 0); the network-404 case got the cached page; the 503 body was `"Offline - please check your connection"`, not `"Offline"`; the `_rsc` and `RSC: 1` requests got a `respondWith`; install never fetched `/offline` with `no-store`; a 500 from `/offline` did not reject install. The 9 that passed (ok-answer store, 404/500/opaqueredirect not stored, cached-page and /offline fallbacks, /api bypass, addAll rejection, activate) were already true of the old worker. Raw Jest JSON: `C:/Users/tim/AppData/Local/Temp/claude/C--Users-tim-MyDocuments-Programming-portfolio-app/db4d785f-fc8b-44f3-9be7-c9aef8d6fcda/scratchpad/red-12-08-t1.json`.
- **Task 2 RED** `8bbcdcc`: exited 1 with `Tests: 7 failed, 7 passed, 14 total`. Each failure was `Expected: true / Received: false`, or `"sw-reloaded"` vs `""`, against the stub. Raw JSON: `.../scratchpad/red-12-08-t2.json`.
- **Semantic assessment:** every target test ran and failed on its planned assertion. There were no load, syntax or discovery faults. `check tdd-red-evidence` was not run: Jest's reporters are not a supported format, and no TAP or JUnit reporter is installed (package installs are excluded from auto-fix). This plan is `type: execute`, so the plan-level classifier gate does not apply.
- **GREEN** `f9f144c` and `8706389` each follow their RED commit. There was no refactor commit.

## Issues Encountered

- **Observation for 12-17 (no change made):** the live probe found that the `<link rel="prefetch">` HTML prefetches of `/projects` and `/photos` (`sec-purpose: prefetch`, not RSC) take the existing `networkFirst` "everything else" path. Their HTML is stored in the dynamic cache. Navigations never read that cache while the network answers, so this cannot serve a stale page online. It only widens what is available offline. It is pre-existing behaviour of the generic path and outside this plan's navigation rule.

## Verification

- `npx jest lib/__tests__/service-worker-navigation.test.ts lib/__tests__/service-worker-media.test.ts lib/__tests__/sw-update.test.ts --silent`: 3 suites, 39 tests passed.
- `npm run lint`: exit 0. `npm run type-check`: exit 0. Full Jest: 88 suites, 1,441 tests passed.
- `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/not-found.spec.ts` on chromium, firefox and webkit, against a fresh production build: 30 passed. This includes the `serviceWorkers: 'allow'` block (SW-controlled misses and a `router.push` to a miss) on each engine.
- `git status --porcelain public/service-worker.js`: empty (restored after the build).
- Acceptance greps: `async function networkFirstNavigation` 1, `staleWhileRevalidate` 0, `__PRECACHE_URLS__` 1, `'__BUILD_HASH__'` 1, `test(` lines 10 (≥ 8); `source: '/service-worker.js'` 1, `middleware.ts` 0.
- The server on :3000 was stopped, and no listener remains.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 12-17 can build its end-to-end SW test on these paths: network-first navigation, the RSC bypass, the offline precache and the reload guard.
- Flagged assumption (PITFALLS #17): the first navigation after this deploy is still answered by the visitor's old worker (stale-while-revalidate). From the next navigation on, the new worker serves network-first, and the reload guard covers tabs that were open during the deploy.

## Self-Check: PASSED

- FOUND: lib/sw-update.ts, lib/__tests__/sw-update.test.ts, lib/__tests__/service-worker-navigation.test.ts
- FOUND commits on this branch: 63fdad7, f9f144c, 8bbcdcc, 8706389

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*
