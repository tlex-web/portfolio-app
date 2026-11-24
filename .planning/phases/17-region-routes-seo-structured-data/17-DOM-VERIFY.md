---
schema_version: 1
wave: all
outcome: could_not_look
reason: target_unreachable
checked: 0
passed: 0
needs_review: 0
---

# Phase 17 live-DOM verification (execute:wave:post, live-dom-uat)

**Dispatch:** the gsd-dom-verifier agent was not dispatched per wave. It has no shell, so it cannot start a server, and in Phase 14 the browser MCP could not reach any server started from the agent shell. The orchestrator ran one reachability probe at phase end instead, before deciding to dispatch.

**Probe (2026-11-24, tip d4f608e, fresh `npm run build`):**
- `next start -p 3017` was started from the agent shell. `curl http://localhost:3017/photos/regions/zermatt` answered 200.
- claude-in-chrome had two connected browsers: "Browser 1" (in use) and "Browser 2". In "Browser 1", navigating a new tab to the same URL left the frame on an error page ("Frame with ID 0 is showing error page"), so no DOM was readable.
- The tab and the server were closed afterwards.

**Outcome:** could_not_look / target_unreachable for every wave (1-7). No criterion was observed in a live DOM by the browser MCP, so this is not a pass.

**What would change it:** a browser on the same machine as the shell that serves the build, selected for the session (`select_browser`), or a reachable deployed URL. The Vercel preview for 038a4cb is behind Vercel Authentication (see 17-15-SUMMARY).

**Covering automated evidence (Playwright, real browser DOM; not a substitute for this capability's verdict):**
- Wave 1 (17-01 region route and copy, 17-03 site JSON-LD): photos-region, not-found, shell, seo, audit specs, production build, Chromium and Firefox (17-01: 166 passed; 17-03: audit 6/6).
- Wave 2 (17-05 published photo pages, 17-16 guards): 137 passed incl. the Zermatt region audit.
- Wave 3 (17-06 one-photo viewer, 17-07 region OG cards, 17-11 offline catalog): 220, 70 and 12 passed.
- Wave 4 (17-12 parser, 17-10 sitemap canonicals): 178 and 109 passed, plus the 13-page audit sweep.
- Waves 5-6 (17-13 ImageObject, 17-14 ImageGallery/project blocks): 158 and 38 passed, incl. CSP checks.
- Wave 7 (17-15 close): 487 passed locally over the 10 touched specs; CI run 45306356650 green on ci/17-15 (three E2E legs, Visual Regression PASS).
