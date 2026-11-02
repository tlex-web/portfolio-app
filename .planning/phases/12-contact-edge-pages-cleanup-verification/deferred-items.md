## Deferred Items

- `.github/copilot-instructions.md:88` still describes the deleted glassmorphism navigation component (found by 12-04)
  status: open
  **What:** a doc line names a component VERIFY-01 deleted in 12-04. Out of 12-04's file list; README.md gets the same cleanup in 12-22, and this line can go with it.
- `e2e/design-system.spec.ts:20` comment lists `text-shadow-glow*` among the utilities it covers (found by 12-04)
  status: open
  **What:** 12-04 deleted the glow text-shadow tokens, so that utility no longer exists. Comment only (no assertion depends on it); out of 12-04's file list.
- Prefetch requests skip the proxy, so a forged `x-edge-section` reaches the 404 render and that HTML has no CSP header (found by the 12-02 slug debug session)
  status: open, owner 12-22
  **What:** the proxy matcher's `missing` rule skips requests with `purpose: prefetch` or `next-router-prefetch: 1`. On those, a visitor-sent `x-edge-section: photos` changes the generic 404's context link, and the response carries no CSP. Pre-existing, unrelated to the slug fix (details in `.planning/debug/12-slug-script-data.md`). Tim, 2026-11-02, asked "log it / fix sooner": "Log it for 12-22 (Recommended)".
- Switch the canonical host to `https://www.tlui.de` once the domain is live (Tim, 2026-11-02)
  status: open, waits on DNS
  **What:** Tim's answer: "I already have a domain: tlui.de". On 2026-11-02 neither tlui.de nor www.tlui.de resolved (NXDOMAIN), so it is not connected to Vercel. Tim chose "When it's live (Recommended)" and "www.tlui.de" as canonical. When it serves the site: set `site.url` (D-13, `data/site.ts`) to `https://www.tlui.de`; make sure the proxy's neutral-404 host pin (`canFetchNeutral`) allows www.tlui.de (Vercel's `VERCEL_PROJECT_PRODUCTION_URL` may hold only the shortest production domain); redirect tlui.de and portfolio-app-mocha-three.vercel.app to www; re-run the seo, og and not-found specs. Until then site.url stays on the vercel.app URL.
- The edge-art contour asset (`ContourField lod="hero"`) is not in the service worker's install precache, so a first offline `/offline` can show the sheet without contours (found by 12-15)
  status: open, owner 12-17
  **What:** 12-08's install precaches `/offline`, its `/_next/static/` files and `PRECACHE` (the strip only). The hero contour SVG under `/terrain/` is cached cache-first only after some page fetched it online. If it is missing, the CSS mask fails and the sheet shows the surface-raised ground with the trail and dot (the documented EdgeArt fallback, no layout change). Adding the hero LOD to `data/generated/precache.json` (terrain build) would close it; 12-17's SW spec can assert the art offline. Out of 12-15's file list.
