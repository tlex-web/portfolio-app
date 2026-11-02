---
schema_version: 1
wave: 1
outcome: verified
reason: ok
checked: 7
passed: 7
failed: 0
needs_review: 0
---

# Phase 12 wave 1: live-DOM verification (re-run)

This is the re-run after d9df0bf. It replaces the first run (dd67820), which passed 6 of 7; row 7 failed there via the service-worker path.

Browser: claude-in-chrome, new tab, real navigations. Target: `next start` on http://localhost:3000 (HEAD d9df0bf). Tokens: `nf-dom2-k8v3q1` (photo), `nf-dom2-m5w9r4` (project), `nf-dom2-x7j2` (three-segment path).

## 12-02 criteria

1. PASSED: a photo miss shows the server 404. `/photos/nf-dom2-k8v3q1` returned responseStatus 404, with 1 `<main>`, the h1 `Page not found` and no `#__next_error__`.
2. PASSED: a project miss shows the server 404. `/projects/nf-dom2-m5w9r4` returned 404, with 1 `<main>`, the h1 `Page not found` and no `#__next_error__`.
3. PASSED: the D-11 photo context link. The links in main are `Go to the homepage`->/, `All photographs`->/photos, `Engineering`->/projects.
4. PASSED: the D-11 project context link. The links in main are `Go to the homepage`->/, `Photographs`->/photos, `All routes`->/projects.
5. PASSED: a three-segment path keeps the generic links. `/photos/nf-dom2-x7j2/extra` (real navigation) returned 404 with `Photographs`->/photos and `Engineering`->/projects. Its outerHTML contains the token once. That path is outside the proxy's two-segment scope, so this is not a row-7 finding.
6. PASSED: a known slug is a normal page. `/photos/matterhorn-from-zermatt` returned 200 with the h1 `Matterhorn from Zermatt`. location.href stayed as typed on every miss.
7. PASSED: no slug anywhere, script data included. SW-controlled: YES. `/` had `navigator.serviceWorker.controller` set with 1 registration, and the controller was still set on both miss pages. After real navigations to the photo and project misses, `document.documentElement.outerHTML` contained each token 0 times. `document.title` was `Tim Lui · Developer & photographer`. The neutral flight segment `"photos","_"` (and `"projects","_"`) was present in the HTML. Speed Insights `data-route` was `/404`.
