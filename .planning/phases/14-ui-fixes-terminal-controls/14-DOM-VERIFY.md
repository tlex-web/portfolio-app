---
schema_version: 1
wave: 1
outcome: could_not_look
reason: target_unreachable
checked: 0
passed: 0
failed: 0
needs_review: 0
---

# Phase 14 wave 1 (plan 14-01) live-DOM verification

Browser: claude-in-chrome (own tab, closed afterwards). chrome-devtools MCP was not exposed in this session.

What happened:
- The first navigation to `http://localhost:3000/roadmap` loaded. The service-worker cleanup ran on it: 1 registration unregistered and 3 caches deleted. Then the page reloaded.
- That reload, and a second navigation after it, landed on Chrome's network error page (`chrome-error://chromewebdata/`).
- No criterion was observed. None is marked failed.

Orchestrator follow-up (corrects the verifier's guess that the server crashed):
- The server never went down. Throughout, `curl` from the agent shell got 200 on `/roadmap`, and the process kept listening on 0.0.0.0:3000 and [::]:3000.
- Chrome couldn't reach the server on any loopback address: `localhost`, `127.0.0.1` and `[::1]` all gave "This site can't be reached". The same happened after the server was restarted outside the shell sandbox.
- The first load most likely came from an old service worker left over from a Phase 12 session, which served `/roadmap` from cache. Once it was unregistered, every request went to the network and failed.
- So the browser and the agent shell don't share loopback right now. Phases 11 and 12 reached `localhost:3000` from claude-in-chrome on 2026-11-03, so something has changed since then: a proxy, a VPN, Chrome policy or the sandbox.

Criteria not observed (all could_not_look / target_unreachable):
- SHELL-07 / D-16: a plain tap on 'Roadmap' on /roadmap (scrolled) closes the panel, focuses Menu, and leaves scrollY, the URL and the document unchanged. Covered by e2e/shell.spec.ts "tapping the current page's link closes the panel and keeps the scroll (SHELL-07, D-16)".
- SHELL-07: a Ctrl/Shift click on the current-page link leaves the panel open. Covered by Jest SHELL-07 rows.
- D-23: on /photos?view=grid, 'Photographs' navigates to /photos, and the panel ends closed with Menu focused. Covered by e2e/shell.spec.ts "on a view URL, Photographs still navigates to the plain page (D-23)".
- SHELL-08 / D-17: panel links get outline-offset -4px and width 2px, and the ring stays inside the panel client rect at the top and bottom rows at 375x812. Covered by e2e/shell.spec.ts "focused panel links draw an inset ring the panel never clips (SHELL-08, D-17)".
- SHELL-08: the ring is still contained at 375x320 while the panel scrolls. Covered by e2e/shell.spec.ts "the inset ring stays inside the panel while it scrolls at 375 x 320 (SHELL-08, D-17)".

To fix (for the operator): check why Chrome can't open `http://localhost:3000` while `next start` is running from the agent shell. Look at the proxy and VPN bypass for `<-loopback>` and at Chrome policy. Then re-run this verifier. Meanwhile, the e2e rows above cover every criterion in Chromium and Firefox (14-01 SUMMARY: shell.spec 74/74). The window size was restored to 1280x900. The service-worker registration and caches for localhost:3000 were already removed during the first load. No end-of-run cleanup was possible because the origin did not load.
