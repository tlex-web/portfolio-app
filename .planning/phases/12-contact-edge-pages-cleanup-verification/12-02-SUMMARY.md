---
phase: 12-contact-edge-pages-cleanup-verification
plan: 02
subsystem: infra
tags: [next-proxy, csp, not-found, playwright, webkit, service-worker]

requires:
  - phase: 07-foundation
    provides: root not-found inside SiteChrome (SHELL-05), nonce CSP in proxy.ts, Shell 404 e2e
  - phase: 10-photography
    provides: photoSlugs (lib/photos/view-model.ts), /photos/[slug] with dynamicParams = false
  - phase: 11-engineering-roadmap
    provides: projects (data/projects.ts), /projects/[slug]
provides:
  - proxy.ts unknown-slug rewrite to /__missing with the x-edge-section request header (client copies deleted)
  - lib/edge-section.ts (EDGE_SECTION_HEADER, parseEdgeSection, EdgeSection)
  - async root not-found and NotFoundBody `context` prop (D-11 labels "All photographs", "All routes")
  - exported buildCsp(nonce, url, isDev) with the D-17 loopback condition, connect-src 'self', dev-only 'unsafe-eval'
  - Playwright functional projects with serviceWorkers 'block', a webkit project in every environment, the local PW_REUSE switch
  - e2e/routes.ts shared ROUTES list (D-20)
affects: [12-06, 12-12, 12-23, 12-24, edge pages, axe sweep, cross-browser verification]

actuals:
  tokens: 7900
  tasks: 3
  commits: 4
plan_head_before: d10173ed0f73f771d22b38cd60de3b90d42330a0
plan_head_after: db24fe712190e3a0f754dae574cc190a04d7614c

tech-stack:
  added: []
  patterns:
    - "Section misses are decided in proxy.ts before render and rewritten to an unmatched path; the root not-found reads only a proxy-set header, never params or the pathname"
    - "CSP is a pure exported builder unit-tested through NextResponse's x-middleware-* encoding"
    - "Per-task e2e checks reuse one production server via PW_PROD=1 PW_REUSE=1 (local only; CI ignores it)"

key-files:
  created:
    - lib/edge-section.ts
    - e2e/not-found.spec.ts
    - lib/__tests__/proxy.test.ts
    - e2e/routes.ts
  modified:
    - proxy.ts
    - app/not-found.tsx
    - components/site/NotFoundBody.tsx
    - e2e/shell.spec.ts
    - playwright.config.ts

key-decisions:
  - "A1 holds: the proxy rewrite to /__missing gives unknown photo and project slugs a server-rendered root 404 (HTTP 404, h1, one main, no __next_error__); no checkpoint needed"
  - "'unsafe-eval' leaves the production CSP: a fresh build has 0 of 27 chunks (0 of 30 JS files under .next/static) containing eval( or new Function(, and the WebGL, carousel and no-WebGL specs pass (59) on the production build"
  - "The no-slug-echo check covers rendered markup (script elements removed), visible body text and the title: Next's RSC flight payload always carries the canonical URL as JSON and Speed Insights puts the path in its script data-route attribute; neither is rendered"
  - "The KNOWN slug sets import the data modules directly (lib/photos/view-model, data/projects); the Node-runtime proxy build accepted the module graph, so no generated-data fallback was needed"

patterns-established:
  - "Edge context header: proxy deletes then sets x-edge-section; parseEdgeSection accepts exactly 'photos' or 'projects'"
  - "Shared e2e route list: import { ROUTES, type Label } from './routes'"

requirements-completed: [EDGE-01, VERIFY-01, VERIFY-03, VERIFY-04]

coverage:
  - id: D1
    description: "Unknown /photos/<slug> and /projects/<slug> return a server-rendered HTTP 404 (h1, one main, no __next_error__) with the D-11 context link, and the slug is not echoed in rendered markup or the title"
    requirement: EDGE-01
    verification:
      - kind: e2e
        ref: "e2e/not-found.spec.ts (chromium, firefox, webkit; PW_PROD=1 fresh build)"
        status: pass
      - kind: e2e
        ref: "e2e/shell.spec.ts#Shell 404 (chromium, firefox)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Only exactly-two-segment unknown slugs are rewritten; known slugs and three-segment paths pass through; a client-sent x-edge-section never reaches the render"
    requirement: EDGE-01
    verification:
      - kind: unit
        ref: "lib/__tests__/proxy.test.ts#proxy(): unknown-slug rewrite (EDGE-01)"
        status: pass
      - kind: e2e
        ref: "e2e/not-found.spec.ts#a client-sent x-edge-section header cannot choose the context link"
        status: pass
    human_judgment: false
  - id: D3
    description: "buildCsp: upgrade-insecure-requests dropped only for http on loopback, unaffected by a forged x-forwarded-proto; connect-src 'self'; 'unsafe-eval' only in development"
    requirement: VERIFY-01
    verification:
      - kind: unit
        ref: "lib/__tests__/proxy.test.ts (23 tests)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/home-canvas.spec.ts e2e/photos-carousel.spec.ts e2e/no-webgl.spec.ts --project=chromium (59 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Local WebKit loads the production build on http://localhost (D-17); webkit project present in every environment with grepInvert /@chromium-only/"
    requirement: VERIFY-03
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/not-found.spec.ts --project=webkit (7 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Functional projects block service workers; PW_REUSE is local-only and leaves CI behaviour unchanged; shared ROUTES list"
    requirement: VERIFY-04
    verification:
      - kind: other
        ref: "four node --input-type=module probes of playwright.config.ts (Task 3 verify)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 PW_REUSE=1 npx playwright test e2e/home-canvas.spec.ts --project=chromium (45 passed)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Production CSP header on the Vercel deployment still carries upgrade-insecure-requests and no 'unsafe-eval'"
    requirement: VERIFY-01
    verification: []
    human_judgment: true
    rationale: "Only observable on the deployed site; 12-24 UAT reads the production header (T-12-04)"

duration: 17min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 02: Proxy rewrite 404, CSP builder and Playwright infrastructure Summary

**Unknown photo and project slugs now get a server-rendered HTTP 404 with a link back to their section, through a proxy.ts rewrite to an unmatched path. The CSP is an exported, tested builder (D-17 loopback condition, connect-src 'self', 'unsafe-eval' in dev only). Playwright blocks service workers, has an always-defined WebKit project, and a local PW_REUSE switch.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-11-02T16:18:40Z
- **Completed:** 2026-11-02T16:36:07Z
- **Tasks:** 3
- **Files modified:** 9 (4 created, 5 modified)

## Accomplishments

- **A1 outcome: TRUE.** `GET /photos/<unknown>` and `/projects/<unknown>` without JavaScript return HTTP 404. The server HTML has an h1, exactly one `<main>` and no `__next_error__`, and the visible URL is unchanged. This clears the 07-23 STATE blocker for EDGE-01's server-HTML sign-off.
- D-11 context links: a photo miss shows "All photographs" (`/photos`) and a project miss shows "All routes" (`/projects`). Unmatched URLs, three-segment paths and a forged `x-edge-section` keep the generic links. Classes, kicker, h1 and body copy are unchanged, so the generic 404 pixels stay the same.
- `buildCsp(nonce, url, isDev)` drops `upgrade-insecure-requests` only for `http:` on `localhost`, `127.0.0.1` or `[::1]`. The decision reads `request.nextUrl` only, so a forged `x-forwarded-proto` changes nothing. `connect-src 'self'` replaces the unused `https://raw.githubusercontent.com` origin.
- **Eval-chunk count from a fresh production build: 0** (the plan's `.next/static/chunks/*.js` glob covers 27 files; all 30 JS files under `.next/static` were also checked). `'unsafe-eval'` is now sent only under `next dev`.
- Playwright: `serviceWorkers: 'block'` on chromium, firefox and webkit. The webkit project is always defined, with `grepInvert: /@chromium-only/`. `PW_REUSE` is a local-only switch to reuse the production server. `e2e/routes.ts` holds the shared `ROUTES` list.

## Task Commits

1. **Task 1 (tracer): server-rendered 404 for unknown photo and project slugs.** `31daaf9` (feat)
2. **Task 2: CSP builder with the D-17 loopback condition.** RED `8a6983f` (test), GREEN `f111d49` (feat). No refactor commit was needed.
3. **Task 3: block service workers, add webkit and the reuse switch, share ROUTES.** `db24fe7` (test)

**Plan metadata:** recorded in the docs(12-02) commit that follows this SUMMARY.

## Files Created/Modified

- `proxy.ts`: KNOWN slug sets, `MISSING_PATH = '/__missing'`, the exactly-two-segment rewrite, deleting the client's `x-edge-section`, and the exported `buildCsp`.
- `lib/edge-section.ts`: `EDGE_SECTION_HEADER`, `EdgeSection`, `parseEdgeSection`. Pure, no imports.
- `app/not-found.tsx`: async; reads the header through `headers()` and passes `context` to `NotFoundBody`.
- `components/site/NotFoundBody.tsx`: optional `context` prop that swaps two labels.
- `e2e/not-found.spec.ts`: server-HTML gate, context links, no slug echo, known slug returns 200, three-segment path, spoofed header (7 tests).
- `lib/__tests__/proxy.test.ts`: both CSP variants, dev/prod `'unsafe-eval'`, forged proto, rewrite and header deletion (23 tests).
- `e2e/routes.ts`: `Label` and `ROUTES`, moved verbatim from shell.spec.
- `e2e/shell.spec.ts`: imports `ROUTES`. The Shell 404 rows gained a context column (see Deviations).
- `playwright.config.ts`: `reuse` constant, `serviceWorkers: 'block'` on the functional projects, always-defined webkit project, `reuseExistingServer: !prod || reuse`, `updateSnapshots` set to `'none'` when CI or reuse is on.

## TDD (Task 2)

- **RED** (`8a6983f`): `npx jest lib/__tests__/proxy.test.ts` gave 14 failed and 9 passed.
  - 12 tests failed with `buildCsp is not a function`, because the export did not exist yet.
  - Two failed on genuine assertions: `proxy()` on `http://localhost:3000/` still sent `upgrade-insecure-requests`, and the production CSP still contained `'unsafe-eval'`.
  - The 9 passing tests cover the rewrite and header deletion Task 1 had already shipped, plus the forged-proto case, which the old unconditional directive already satisfied.
  - Semantic assessment: the failures are the planned missing behaviour. No load, syntax or fixture faults. The classifier-format RED check does not apply here (Jest reporter; `workflow.tdd_mode` is not enabled).
- **GREEN** (`f111d49`): 23/23 pass; lint and type-check exit 0.
- **REFACTOR:** none needed. Prettier made no changes to `proxy.ts`.

## Decisions Made

- `'unsafe-eval'` is removed from production (flagged for plan review). Evidence: 0 eval chunks, and the 59 WebGL, carousel and no-WebGL tests pass on the production build. Tim can veto through `info.csp` in 12-01; a veto is a one-line change in `buildCsp`.
- The KNOWN sets import `lib/photos/view-model` and `data/projects` directly. The Node-runtime proxy build accepted that module graph, so no generated-data fallback was needed.

## delayHeightmap result (Task 3, step 3)

`PW_PROD=1 PW_REUSE=1 npx playwright test e2e/home-canvas.spec.ts --project=chromium` gave 45 passed, including all four `delayHeightmap` users:
- "reveal keeps the layout"
- "a load abandoned for reduced motion reveals nothing"
- "a late canvas reveals at the current progress"
- "a canvas revealed while stationary lights its 3D pin"

A scratch probe against the same production server shows the stub is now reachable:
- With `serviceWorkers: 'allow'`, the page is SW-controlled after the first visit and `page.route` saw **0** heightmap requests on reload.
- With `'block'`, it saw **1**.

So the 09 deferred item "four `delayHeightmap` e2e users bypassed by the service worker" is resolved by this config. 12-06 can close it.

## WebKit shell.spec failures (Task 3, step 4; for 12-23, not tagged here)

`PW_PROD=1 PW_REUSE=1 npx playwright test e2e/not-found.spec.ts e2e/shell.spec.ts --project=webkit` on Windows gave 31 passed and 9 failed. not-found.spec passed in full (7/7), which proves that D-17 lets WebKit load the local production build. All 9 failures are the same `toBeFocused()` timeout after a Tab key press on a link: WebKit does not Tab-focus links by default, like Safari with "Press Tab to highlight each item" turned off.

1. `Shell landmarks › /: one shell, skip link first, current page Home`. Skip link: `Expected: focused, Received: inactive`.
2. `Shell landmarks › /photos: … current page Photographs`. Same.
3. `Shell landmarks › /photos/matterhorn-from-zermatt: … current page Photographs`. Same.
4. `Shell landmarks › /projects: … current page Engineering`. Same.
5. `Shell landmarks › /projects/box: … current page Engineering`. Same.
6. `Shell landmarks › /roadmap: … current page Roadmap`. Same.
7. `Shell landmarks › /contact: … current page Contact`. Same.
8. `Shell landmarks › /offline: … current page none`. Same.
9. `Shell mobile menu › Menu button and panel rows meet the touch-target sizes; Escape closes to the button`. `locator('#site-menu').getByRole('link').first()` is not focused after Tab.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The no-slug-echo assertion was stricter than any Next App Router response can satisfy**
- **Found during:** Task 1
- **Issue:** The planned checks ("the body … not the token", token absent from `document.documentElement.outerHTML`) failed for two framework-owned reasons, even though the slug is never rendered:
  - Next's RSC flight payload always carries the page's canonical URL as JSON (`self.__next_f.push([1,"0:{\"P\":null,\"c\":[\"\",\"photos\",\"<slug>\"]…`). This is emitted for every App Router response at any URL, including the pre-existing `/__no-such-page__` 404.
  - Vercel Speed Insights adds the path in its client-side `<script data-route="…">` attribute.
- **Fix:** The check now looks at markup with `<script>` elements (and their attributes) removed, plus `body.innerText` and `document.title`. The JSDoc explains why. The known-slug test reads markup the same way, because every page's flight payload also serializes the not-found boundary's "Page not found" text.
- **Impact on the prohibition** ("MUST NOT render the requested URL slug anywhere"): no slug is rendered in the DOM or the title. The slug does still appear as escaped data inside script elements. Flagged for review in case the prohibition was meant to include those.
- **Files modified:** e2e/not-found.spec.ts
- **Committed in:** 31daaf9

**2. [Rule 3 - Blocking] The Shell 404 test expected the generic labels on section misses**
- **Found during:** Task 1
- **Issue:** `e2e/shell.spec.ts` "Shell 404" asserted `Photographs` and `Engineering` links inside main for `/projects/no-such-slug`, `/photos/no-such-slug` and `/photos/MATTERHORN-FROM-ZERMATT`. The D-11 context labels replace those links, so Task 1's own verify would have failed. shell.spec.ts was listed only under Task 3.
- **Fix:** Rewritten, not deleted. Each `NOT_FOUND_PATHS` row now carries a `context` column, and the test expects "All photographs" or "All routes" for section misses. The header comment now says these misses go through the proxy rewrite.
- **Files modified:** e2e/shell.spec.ts
- **Committed in:** 31daaf9

---

**Total deviations:** 2 auto-fixed (1 bug in a planned assertion, 1 blocking test update).
**Impact on plan:** No change in scope. Deviation 1 narrows a test to what Next can deliver and is flagged for review.

## Issues Encountered

- A second production build failed at `postbuild` because `public/service-worker.js` still held the hash injected by the previous build ("no placeholder … already injected"). Restoring the file with `git checkout -- public/service-worker.js` before each build fixed it. The file is clean at the end.
- The Bash tool collapses doubled backslashes in inline scripts. One regex edit produced a literal backspace byte, which was caught and fixed before commit. Later script edits were written to the scratchpad with the Write tool.
- Prettier is not enforced in CI, and `proxy.ts` and `e2e/shell.spec.ts` already failed its check before this plan. New files were formatted; shell.spec.ts was left at its existing style.

## Verification (plan level)

- Reuse-switch probes (four `node --input-type=module` checks): exit 0.
- `npm run lint`: exit 0. `npm run type-check`: exit 0. `npx jest lib/__tests__/proxy.test.ts`: 23/23. The full Jest suite also passes: 83 suites, 1,330 tests.
- `PW_PROD=1 npx playwright test e2e/not-found.spec.ts e2e/shell.spec.ts --project=chromium --project=firefox`: 80 passed (fresh build).
- `PW_PROD=1 npx playwright test e2e/not-found.spec.ts --project=webkit`: 7 passed (fresh build).
- `git status --porcelain public/service-worker.js`: empty. Port 3000 is free and no `next start` is left running.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 12-12 can style the edge-page body on top of the context mechanism. The visual baseline uses `/__no-such-page__`, so no baseline moved.
- 12-23 owns the WebKit CI rollout. The 9 Tab-focus failures above need triage there (tag or test change).
- 12-06 can close the 09 `delayHeightmap` deferred item.
- 12-24 UAT should read the deployed CSP header (D6).

## Self-Check: PASSED

- All 9 key files exist on disk. Commits 31daaf9, 8a6983f, f111d49 and db24fe7 are ancestors of HEAD.
- Every acceptance criterion from Tasks 1 to 3 was re-run and passes.
- No stub patterns in the created or modified files.

## Follow-up: slug kept out of script data

The narrowed no-echo check (markup with `<script>` elements removed) was put to Tim. His literal reply: "cover script data too". The token check now covers the whole server HTML and the whole hydrated `document.documentElement.outerHTML`, scripts and attributes included (debug session `.planning/debug/12-slug-script-data.md`).

**Root cause of each occurrence**

1. Flight payload `"c":["","photos","<slug>"]`: Next 16.4.2 writes the URL of the request it renders into flight row 0 (`node_modules/next/dist/server/app-render/app-render.js:1155-1157` `prepareInitialCanonicalUrl`, `:1239`, with `url` parsed from `req.url` at `:1902`). A proxy rewrite changes only the routing URL (`server/lib/router-utils/resolve-routes.js:468-472`), never `req.url`, so no rewrite variant can drop it. The browser does not use `"c"`: the client router takes its URL from `window.location` (`client/components/router-reducer/create-initial-router-state.js:27-29`). `"c"` only seeds `usePathname()` during SSR.
2. Speed Insights `data-route`: the `@vercel/speed-insights/next` export derives the route from `usePathname()` and `useParams()` (`dist/next/index.mjs:206-217`). The root not-found has no params, so the raw path, slug included, went into the attribute.

**Fix**

- `proxy.ts`: a missed document request (`sec-fetch-dest` of `document`, or none) is answered with the 404 the proxy fetches for `/<section>/_` (`NEUTRAL_SLUG`), served at the typed URL with status 404 and that render's CSP header. `/<section>/_` is an ordinary miss handled by the existing rewrite, so the page and the D-11 context link are unchanged and its flight data reads `"c":["","photos","_"]`. Client navigations and the neutral slug keep the plain rewrite. If the fetch fails, answers anything but 404, or sends no headers within 5 s, the proxy falls back to the old rewrite: still a 404, but with the slug back in the flight data.
- `components/SpeedInsightsRoute.tsx` (replaces `<SpeedInsights />` in `app/layout.tsx`): it uses the package's React export with an explicit route. Every root 404 is reported as `/404` (`useSelectedLayoutSegment() === '/_not-found'`); every other page gets `computeRoute(pathname, params)`, so it still reports `/photos/[slug]`, `/projects/[slug]` and so on. The component stays mounted, so client navigations update the route.
- `e2e/not-found.spec.ts`: `withoutScripts` is gone from the token checks. The hydrated check waits for the Speed Insights script and expects `data-route="/404"`. The known-slug "Page not found" check keeps `withoutScripts`.

**Verification:** fresh build. not-found.spec and shell.spec pass on chromium and firefox (80/80), and not-found.spec passes on webkit (7/7, and 105/105 with `--repeat-each=5` on all three engines). Jest: 84 suites, 1,379 tests. `npm run lint` and `npm run type-check` exit 0. With the source reverted and the tightened spec kept, the spec fails 4 tests; with the fix reapplied, all pass. Response headers never carried the slug: there is no `x-matched-path`, and `x-middleware-rewrite` read `/__missing` before and is now absent.

**Open:** the self-fetch could not be exercised on Vercel. If deployment protection, the firewall or a bot challenge blocks it there, the proxy silently falls back to the old rewrite. Check on a preview: `curl -s https://<preview>/photos/nf-check | grep -c nf-check` should print 0. A miss now costs one extra proxy run and one internal HTTP hop (42 ms vs 35 ms locally).

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*
