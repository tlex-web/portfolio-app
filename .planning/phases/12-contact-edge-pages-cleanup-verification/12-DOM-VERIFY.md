---
schema_version: 1
wave: 15
outcome: verified
reason: ok
checked: 10
passed: 8
failed: 1
needs_review: 1
---

# Phase 12 wave 15: live-DOM verification (12-29)

Browser: claude-in-chrome, new tab, against `next start` at http://localhost:3000 (HEAD f70f065). The service worker was already controlling every page (`navigator.serviceWorker.controller` non-null on first load and after reload).

## 1. Designed 404 inside the shell (first load and SW-controlled reload)
- /photos/nf-check-w15: passed, same on both loads. 1 nav, 1 main, 1 h1 `You've left the marked trail`. Main links: `Go to the homepage` -> /, `All photographs` -> /photos, `Engineering` -> /projects. outerHTML does not contain `nf-check-w15`.
- /projects/nf-check-w15: passed, same on both loads. 1/1/1. Links: `All routes` -> /projects, `Photographs` -> /photos. Slug absent.
- /no-such-page-w15 shell and links: passed, same on both loads. 1/1/1. Generic links `Photographs` and `Engineering`.
- /no-such-page-w15 slug absent from document: failed (as briefed). outerHTML contains the slug once. It is not in the rendered text (`body.innerText` lacks it). It sits in Next's flight payload route-segment array: `self.__next_f.push([1,"0:{\"P\":null,\"c\":[\"\",\"no-such-page-w15\"],...`. The /photos and /projects misses are rewritten by the proxy, so they do not carry it. The plan's prohibition says "render", so this may be framework data rather than a regression. Tim should decide.

## 2. Document prefetch through the proxy (fetch from the page)
- `purpose: prefetch` + forged `x-edge-section: photos` on `/nf-check-w15-x`: passed. 404, CSP header contains `default-src 'self'`, main has `>Photographs<` and no `All photographs`. (This body also echoes the slug in the flight payload, the same pattern as above.)
- `purpose: prefetch` on `/photos/nf-check-w15` (positive control): passed. 404, CSP header present, main contains `All photographs`, slug absent.
- Home -> /photos in-app navigation: passed. Clicking the primary-nav `Photographs` link client-side navigated to /photos (h1 `Photographs`, the navigation entry stayed `/`, so no full reload).

## 3. Console
- Errors / CSP violations: passed. No messages matched `error|CSP|Refused|violat` while revisiting all three 404s and Home.
- Console capture coverage: needs_review. Capture only started after the first pass of visits, so the reload passes and the first Home -> /photos click ran before capture began. The re-run covered fresh loads of all four pages but not a second nav click.

## Orchestrator note on the failed slug row (root-level miss)

Not a 12-29 regression and not a new gap. The `"c":["","no-such-page-w15"]` flight row on a root-level miss is the state Tim accepted on 2026-11-02: asked whether every other 404 (e.g. `/photos/<x>/extra`, `/no-such-page-<x>`) should also be scrubbed of its typed path, he answered "Leave as is (Recommended)" (`.planning/debug/12-slug-script-data.md`, `other_404s`). Only unknown `/photos/<slug>` and `/projects/<slug>` are scrubbed, and both passed here. The path stays as escaped, unrendered flight data; `body.innerText` does not contain it. Disposition: accepted, no action.
