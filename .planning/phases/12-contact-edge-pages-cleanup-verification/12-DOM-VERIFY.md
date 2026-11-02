---
schema_version: 1
wave: 1
outcome: verified
reason: ok
checked: 7
passed: 6
failed: 1
needs_review: 0
---

# Phase 12 wave 1: live-DOM verification

Browser: claude-in-chrome, in a new tab. Target: `next start` on http://localhost:3000 (HEAD f1a2caa).
Tokens: `nf-dom-q7x3k9` (photo), `nf-dom-p4m8w2` (project), `nf-dom-z2r6` (three-segment path).
Only 12-02 has UI criteria. 12-01 and 12-03 have no UI. 12-04 and 12-05 are "pixels unchanged", which needs screenshot diffing, so they are out of scope here and covered by the visual suite.

## 12-02 criteria

1. PASSED: a photo miss shows the server 404. After navigating to `/photos/nf-dom-q7x3k9`, the navigation entry's responseStatus is 404. The page has 1 `<main>`, the h1 `Page not found`, and no `#__next_error__`.
2. PASSED: a project miss shows the server 404. `/projects/nf-dom-p4m8w2` gives status 404, 1 `<main>`, the h1 `Page not found`, and no `__next_error__`.
3. PASSED: D-11 photo context link. The links in main are `Go to the homepage`->/, `All photographs`->/photos, `Engineering`->/projects.
4. PASSED: D-11 project context link. The links in main are `Go to the homepage`->/, `Photographs`->/photos, `All routes`->/projects.
5. PASSED: a three-segment path keeps the generic links. `/photos/nf-dom-z2r6/extra` (fetched) gives 404 with the links `Photographs`->/photos and `Engineering`->/projects.
6. PASSED: a known slug is a normal page. `/photos/matterhorn-from-zermatt` gives 200 with the h1 `Matterhorn from Zermatt`. The URL stays as typed on every miss (location.href unchanged).
7. FAILED: no slug anywhere in the HTML, script data included (the 12-02 follow-up). The token is absent from `document.title` and from `body.innerText`, and the Speed Insights `data-route` is `/404`. However, `document.documentElement.outerHTML` contains each token exactly once, in flight row 0 of the RSC payload: `"c":["","photos","nf-dom-q7x3k9"]` (and the same for `projects` / `nf-dom-p4m8w2`). These were real document navigations, not fetch() calls. The neutral `"photos","_"` payload was absent. So on this server the neutral self-fetch did not run, and the proxy used its fallback, the plain rewrite.

## Notes for the operator

- Likely cause of criterion 7, inferred and not observed: `canFetchNeutral` or the self-fetch fell back. Two possibilities: `request.url` under this `next start` does not resolve to a loopback hostname (for example when the server binds to a LAN name or 0.0.0.0), or the internal fetch failed or timed out. Compare the command that started this server with the one 12-02's spec used, and check the proxy's fallback path.
- The fetch()-based probes (rows 5 and 6, and the server-HTML copies of rows 1 and 2) send `sec-fetch-dest: empty`. By design they take the plain rewrite, so their token hits say nothing about criterion 7. Only the navigation results count for it.
- The HTTP status was read from `PerformanceNavigationTiming.responseStatus` and the fetch Response. e2e/not-found.spec.ts covers the status authoritatively.
