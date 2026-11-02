---
status: awaiting_human_verify
trigger: "Keep the requested slug of an unknown /photos/<slug> or /projects/<slug> URL out of the 404 response's script data (T-12-03). Tim: \"cover script data too\"."
created: 2026-11-02T00:00:00Z
updated: 2026-11-02T18:10:00Z
---

## Current Focus

status_note: fix implemented and locally verified (constraints 1-8 pass on a fresh build); awaiting a human check of the self-fetch on a Vercel preview
bug_class: Bohrbug (deterministic: every document miss embeds the slug)

reasoning_checkpoint:
  hypothesis: "Leak 1: Next serializes req.url (which a proxy rewrite never changes) into flight row 0 as \"c\", so any render at the typed URL names the slug. Leak 2: @vercel/speed-insights/next computes route = raw pathname when useParams() is empty, which it is on the root not-found, and writes it to data-route."
  confirming_evidence:
    - "app-render.js:1155-1157,1239 build c from parseRelativeUrl(req.url); resolve-routes.js:468-472 changes only parsedUrl on x-middleware-rewrite"
    - "prototype that fetched /photos/_ from the proxy produced \"c\":[\"\",\"photos\",\"_\"] and 0 token occurrences in the raw HTML (was 1)"
    - "speed-insights next/index.mjs:206-217 + computeRoute; the wrapper with a fixed /404 route produced data-route=/404 and 0 occurrences in outerHTML (was 2)"
  falsification_test: "if the client router read \"c\" for history, the neutral render would replaceState to /photos/_ ; the history spy shows replaceState('/photos/<token>') only, and create-initial-router-state.js:27-29 uses window.location in the browser"
  fix_rationale: "the slug can only leave the payload if the rendered request's URL differs from the typed one; fetching the identical 404 for /<section>/_ is that request, and the client never uses c in the browser, so the address bar and hydration are unaffected. SI route is set explicitly through the package's documented React export."
  blind_spots: "Vercel production: deployment protection, firewall/bot challenge or loop detection on the proxy's self-fetch cannot be tested locally (each failure falls back to the old rewrite, i.e. the slug returns to c silently); extra hop latency on misses"
  candidate_causes:
    - "code: Next app-render embeds req.url as c (framework design: canonical URL for SSR usePathname)"
    - "config: no Next config option or rewrite variant changes req.url (checked rewrite/middleware paths, skipProxyUrlNormalize, global-not-found)"
    - "code (3rd-party): Speed Insights route derivation falls back to raw pathname"
  and_gate: "yes - two independent sources; the target (token absent from full HTML and outerHTML) needs both fixed"

next_action: Tim checks a Vercel preview: curl -s https://<preview>/photos/nf-check | grep -c nf-check must print 0 (1 means the self-fetch fell back), and the page must still be the 404 with "All photographs"

## Symptoms

expected: random token absent from full 404 HTML (scripts + attributes), hydrated outerHTML and title; all 8 constraints still hold
actual: per 12-02 executor, token appears in (1) self.__next_f.push flight payload as "c":["","photos","<slug>"], (2) Speed Insights script data-route attribute
errors: none (assertion-level failure: whole-HTML check cannot pass)
reproduction: npm run build && next start; GET /photos/<token>; grep token
started: since 12-02 (proxy rewrite to /__missing)

## Eliminated

- hypothesis: "the client router reads \"c\" on hydration and replaceState()s to it, so a neutral c would change the visible URL"
  evidence: create-initial-router-state.js:27-29 takes canonicalUrl from window.location whenever location is non-null (app-index.js:256-261 passes window.location); history spy after the fix shows only replaceState('/photos/<token>')
  timestamp: 2026-11-02T17:03:00Z

- hypothesis: "a different rewrite variant (next.config rewrites, rewrite to another path, skipProxyUrlNormalize) or global-not-found would render without the typed URL"
  evidence: app-render.js:1902 parses req.url, which resolve-routes.js:468-472 never changes on a rewrite; getRSCPayload (:1239) and getErrorRSCPayload (:1340) both set c from it; global-not-found goes through getRSCPayload too
  timestamp: 2026-11-02T17:10:00Z

- hypothesis: "the sec-fetch-dest gate changes client-side navigation to a missed URL (soft vs full load)"
  evidence: fetch-server-response.js:139 does an MPA navigation on any non-ok RSC answer, so a client navigation to a 404 is a full document load with or without the fix; in the gated build client navigations take the unchanged rewrite path (curl: RSC request -> x-middleware-rewrite, text/x-component 404) and probe3 still shows the full load, so the reload is Next's existing behaviour, not the fix
  timestamp: 2026-11-02T17:55:00Z

## Evidence

- timestamp: 2026-11-02T00:00:00Z
  checked: .planning/debug/knowledge-base.md, resolved/
  found: no knowledge base file; only resolved session is offline-visual-diff-firefox (unrelated)
  implication: no known-pattern candidate

- timestamp: 2026-11-02T16:54:00Z
  checked: fresh `npm run build` + `next start` :3000, `curl /photos/nf-abc12345` (raw server HTML + headers)
  found: token occurs exactly ONCE in the raw HTML: the RSC flight row 0 inside `self.__next_f.push([1,"0:{\"P\":null,\"c\":[\"\",\"photos\",\"nf-abc12345\"],...`. Speed Insights is NOT in the raw HTML (client-injected). Response headers: `x-middleware-rewrite: /__missing` (no slug); no `x-matched-path`; CSP/Vary/Cache-Control carry no slug.
  implication: server-side leak = flight "c" only; Speed Insights leak is post-hydration only

- timestamp: 2026-11-02T16:56:00Z
  checked: Playwright (chromium, SW blocked) page.goto /photos/nf-abc12345, hydrated outerHTML, history API spy
  found: 2 occurrences in outerHTML: (1) `<script src="/_vercel/speed-insights/script.js" ... data-route="/photos/nf-abc12345">` in <head>; (2) the same flight "c" script. Title has no token. One history call: replaceState("/photos/nf-abc12345"). SiteNav marks "Photographs" aria-current="page" (desktop + mobile lists).
  implication: two leak sources confirmed; the replaceState target equals the typed URL

- timestamp: 2026-11-02T17:00:00Z
  checked: node_modules/next/dist/server/app-render/app-render.js:1155-1157 (prepareInitialCanonicalUrl), :1239 (getRSCPayload c:), :1340 (getErrorRSCPayload c:), :1902 (prepareAppPage url = parseRelativeUrl(req.url)); server/lib/router-utils/resolve-routes.js:118 (initURL), :468-472 (middleware rewrite only changes parsedUrl, not req.url)
  found: "c" = (url.pathname + url.search).split('/') of req.url. A proxy NextResponse.rewrite (and a next.config rewrite) changes only the routing parsedUrl; req.url keeps the ORIGINAL URL, so every App Router render at a rewritten URL embeds the typed path (and query) in "c". No config switch changes this.
  implication: no rewrite variant can remove the slug from "c"; only a render whose req.url differs from the typed URL (i.e. a different HTTP request) or a post-render transform can

- timestamp: 2026-11-02T17:03:00Z
  checked: client consumption of "c": next/dist/client/components/router-reducer/create-initial-router-state.js:21-29 (cjs) and esm/...:11-20; client/app-index.js:256-261 (location: window.location); client/components/app-router.js:146-156 and esm app-router.js:68-98 (HistoryUpdater)
  found: `canonicalUrl = location ? createHrefFromUrl(location) : initialCanonicalUrl`. In the browser location is window.location, so "c" is NOT used for history; HistoryUpdater replaceState()s canonicalUrl = the typed URL. "c" is only used when location is null = the SSR pass (app-render.js:1368-1376 App, :1401 ErrorApp), where it seeds canonicalUrl and therefore the SSR value of usePathname()/useSearchParams() (app-router.js:146-156).
  implication: orchestrator suspicion REFUTED for Next 16.4.2: a neutral "c" does not change the visible URL. Its only effect is the server-rendered usePathname(); a mismatch with the client pathname would be a hydration mismatch in any component that renders from usePathname (here only SiteNav's aria-current/className via isCurrentPath)

- timestamp: 2026-11-02T17:05:00Z
  checked: node_modules/@vercel/speed-insights/dist/next/index.mjs:206-217 (useRoute), :41-62 (computeRoute), :93-130 (loadProps: dataset.route = props.route), :134-160 (injectSpeedInsights), :232-246 (SpeedInsightsComponent: `{ route, ...props }`), next/index.d.ts:36 (`Props = Omit<SpeedInsightsProps, 'route'>`)
  found: route = computeRoute(usePathname(), useParams() or searchParams). On the root not-found params = {} -> computeRoute returns the raw pathname -> data-route="/photos/<slug>". `route === null` skips injection entirely. The Next export's TYPES omit `route`, but at runtime an explicit route prop overrides the computed one (spread order). The script element is never removed on unmount, and a remount finds it and returns null (no setRoute any more).
  implication: Speed Insights leak is fixable independently of "c" (fixed route on 404s, or not rendering it there), but each variant has a soft-navigation edge case to check

- timestamp: 2026-11-02T17:10:00Z
  checked: candidate mechanisms for "c": next.config rewrites / middleware rewrite variants (resolve-routes.js), skipProxyUrlNormalize (docs 05-config/01-next-config-js/skipProxyUrlNormalize.md), global-not-found (docs not-found.md:49-57; getRSCPayload still sets c), notFound() in [slug] page (getErrorRSCPayload:1340 still sets c from req.url), x-middleware-subrequest recursion guard (absent from Next 16.4 dist)
  found: every in-process render path writes c from req.url = typed URL. Only a separate HTTP request (proxy fetch or external rewrite) or a patched Next runtime can change it. Next 16.4 has no middleware recursion guard, so a self-fetch must guard itself.
  implication: candidate full fix = proxy fetches the same 404 for /<section>/_ and returns it at the typed URL; must exclude the neutral slug from re-fetching

- timestamp: 2026-11-02T17:04:00Z
  checked: prototype A (proxy self-fetch of /<section>/_) + SpeedInsightsRoute wrapper, fresh build, curl + Playwright probes
  found: raw HTML 0 token occurrences, c=["","photos","_"]; status 404; one <main>, h1, "All photographs", no __next_error__; response headers carry no slug and no duplicate security headers; hydrated outerHTML 0 occurrences for /photos and /projects; replaceState only to the typed URL; data-route=/404 on root 404s, /photos, /photos/[slug], /projects, /projects/[slug], / on real pages incl. soft navigations; no page errors
  implication: both leaks closed locally

- timestamp: 2026-11-02T17:06:00Z
  checked: RSC request (RSC: 1 header) to an unknown slug under prototype A; client router.push to an unknown slug; Back to a missed URL
  found: proxy cannot see RSC headers (docs proxy.md:474-480: Flight headers stripped), so the ungated prototype answered RSC requests with HTML -> client fell back to a full page load (router.push and Back both reloaded)
  implication: gate the neutral fetch on sec-fetch-dest (document or absent) so client navigations keep the plain rewrite (soft), whose flight answer is never written into the DOM

- timestamp: 2026-11-02T17:40:00Z
  checked: final fix on a fresh build: curl, Playwright probes (chromium, firefox, webkit), x-forwarded-proto https fallback, HEAD, RSC request
  found: /photos/<t> and /projects/<t>: 404, 0 token occurrences in body and headers, c=["","<section>","_"], one <main>, h1, context link, no __next_error__. Response headers carry no slug: no x-matched-path; x-middleware-rewrite is absent on the neutral answer (it was "/__missing" before, also slug-free). Hydrated outerHTML 0 occurrences, title clean, replaceState only to the typed URL. Mobile menu opens and its link navigates client-side, desktop header link navigates client-side, no page errors (3 engines). RSC request with sec-fetch-dest: empty keeps the rewrite (text/x-component). x-forwarded-proto: https on localhost makes the self-fetch fail and falls back to the old rewrite (404, page intact, token back in c). HEAD answers 404. Local latency 42 ms vs 35 ms. No theme toggle exists in the current shell (html class is fixed "dark"), so that part of constraint 5 is vacuous.
  implication: constraints 1-7 hold locally; fallback keeps 1-6 even when the self-fetch fails

- timestamp: 2026-11-02T17:50:00Z
  checked: pre-existing, out of scope: proxy matcher `missing` (next-router-prefetch, purpose: prefetch)
  found: a request carrying `purpose: prefetch` or `next-router-prefetch: 1` skips the proxy, so a client-sent `x-edge-section: photos` reaches the render ("All photographs" on /__no-such-page__) and the HTML has no CSP header
  implication: T-12-02 gap and a CSP gap unrelated to this fix; reported, not changed

## Resolution

root_cause: "Two independent sources (AND-gate). (1) Next 16.4.2 serializes the rendered request's URL into flight row 0 as \"c\" (server/app-render/app-render.js:1155-1157 prepareInitialCanonicalUrl, :1239 getRSCPayload, url from :1902 parseRelativeUrl(req.url)); a proxy rewrite only changes the routing parsedUrl (server/lib/router-utils/resolve-routes.js:468-472), never req.url, so the rewrite to /__missing still renders with the typed URL. c is only read on the server (SSR usePathname), never for browser history (client/components/router-reducer/create-initial-router-state.js:27-29). (2) @vercel/speed-insights 2.0.0 next export derives route = computeRoute(usePathname(), useParams() || searchParams) (dist/next/index.mjs:206-217, :41-62); the root not-found has no params, so the raw path went into data-route (loadProps :113-115, injectSpeedInsights :144-147)."
fix: "proxy.ts: a missed DOCUMENT request (sec-fetch-dest document or absent) is answered with the 404 the proxy fetches for /<section>/_ (NEUTRAL_SLUG, itself an ordinary miss handled by the existing rewrite), served at the typed URL with the neutral render's CSP and status 404; x-middleware-*/hop/encoding headers dropped; any failure, non-404 status or no headers within 5 s falls back to the old rewrite. Client navigations and the neutral slug keep the rewrite. components/SpeedInsightsRoute.tsx: Speed Insights via the package's React export with an explicit route = /404 on the root not-found (useSelectedLayoutSegment() === '/_not-found'), else computeRoute(pathname, params); framework/basePath/configString as the next export passes them. e2e/not-found.spec.ts checks the full HTML and full outerHTML."
verification:
  target_test: { result: pass, detail: "e2e/not-found.spec.ts token checks on the full HTML and full outerHTML + data-route=/404; chromium, firefox, webkit; 105/105 with --repeat-each=5" }
  mutation_check: { result: pass, reason_if_skipped: "no Stryker configured; 9 manual mutants at the fix sites instead", mutant_killed: "9/9 (x-middleware filter, sec-fetch-dest gate, neutral-slug guard, status check, content-encoding drop, header forwarding, fetch disabled, timeout signal, clearTimeout)" }
  no_op_deletion: { result: pass, deletion_justified_by_rca: true, detail: "additive; the only removed lines are the old proxy signature and the miss condition, moved up" }
  adjacent_tests: { result: pass, suites_run: ["jest full: 84 suites / 1379 tests", "lib/__tests__/proxy.test.ts 33/33", "e2e not-found+shell chromium+firefox 80/80", "e2e not-found webkit 7/7", "npm run lint exit 0", "npm run type-check exit 0"] }
  revert_and_reconfirm: { result: pass, bug_returned_on_revert: true, fixed_on_reapply: true, detail: "source reverted, tightened spec kept, fresh build: 4 failures (body token x2, data-route=/photos|projects/<token> x2); reapplied, fresh build: all pass" }
  guardrail_verdict: accepted
files_changed: [proxy.ts, components/SpeedInsightsRoute.tsx, app/layout.tsx, lib/__tests__/proxy.test.ts, e2e/not-found.spec.ts]
