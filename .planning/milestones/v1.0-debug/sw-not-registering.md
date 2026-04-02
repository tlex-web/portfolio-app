---
status: resolved
trigger: "service worker not registering in dev, not visible in DevTools"
created: 2026-02-16T00:00:00Z
updated: 2026-02-16T00:00:00Z
---

## Current Focus

hypothesis: confirmed - production-only guard prevents SW registration in dev
test: read ServiceWorkerRegistration.tsx line 10
expecting: process.env.NODE_ENV === 'production' check
next_action: document findings

## Symptoms

expected: Service worker visible in DevTools > Application > Service Workers for localhost:3000
actual: No service worker registered for localhost:3000
errors: none visible (silent failure by design)
reproduction: Run `next dev`, open DevTools > Application > Service Workers
started: Always been this way in dev

## Eliminated

(none needed -- root cause found immediately)

## Evidence

- timestamp: 2026-02-16
  checked: components/ServiceWorkerRegistration.tsx line 10
  found: `process.env.NODE_ENV === 'production'` guard prevents registration in dev
  implication: Primary cause -- SW registration is skipped entirely in development

- timestamp: 2026-02-16
  checked: components/ServiceWorkerRegistration.tsx lines 12-13
  found: Registration is wrapped inside `window.addEventListener('load', ...)` inside a useEffect
  implication: Secondary issue -- the 'load' event may have already fired by the time useEffect runs in a hydrated SPA, meaning registration could silently fail even in production

- timestamp: 2026-02-16
  checked: proxy.ts CSP header (lines 6-18)
  found: CSP has no `worker-src` directive; default-src is 'self' which would allow same-origin workers
  implication: CSP is NOT blocking SW registration (default-src 'self' covers worker-src fallback)

- timestamp: 2026-02-16
  checked: proxy.ts CSP script-src (line 8)
  found: script-src includes 'self' which permits the service-worker.js script execution
  implication: CSP script-src is NOT blocking the service worker script

- timestamp: 2026-02-16
  checked: proxy.ts matcher (line 47)
  found: Matcher explicitly excludes service-worker.js from CSP middleware
  implication: Even if CSP were restrictive, service-worker.js is excluded from middleware processing

- timestamp: 2026-02-16
  checked: middleware-manifest.json
  found: `"middleware": {}` -- the manifest is empty, proxy.ts is NOT wired as middleware
  implication: CSP headers from proxy.ts are not being applied at all (separate issue)

- timestamp: 2026-02-16
  checked: app/layout.tsx line 34
  found: `<ServiceWorkerRegistration />` is rendered in the body
  implication: Component IS mounted -- that is not the issue

## Resolution

root_cause: |
  PRIMARY: The service worker registration in `components/ServiceWorkerRegistration.tsx` line 10 has a
  `process.env.NODE_ENV === 'production'` guard that prevents registration in development mode.
  The entire registration block (lines 7-43) is wrapped in a conditional that requires production env.

  SECONDARY: Even in production, the registration wraps `navigator.serviceWorker.register()` inside
  `window.addEventListener('load', ...)` (line 12) which fires inside a `useEffect`. In a hydrated
  Next.js app, the `load` event has very likely already fired by the time React hydration completes
  and useEffect runs, meaning the load listener callback would never execute. This is a latent bug
  that would cause the service worker to silently fail to register even in production builds.

  ADDITIONAL FINDING: `proxy.ts` exports a CSP middleware function but is NOT wired as Next.js
  middleware (the file is named `proxy.ts`, not `middleware.ts`, and nothing imports it). The
  middleware-manifest.json is empty. This means CSP headers are not being applied, but this is
  a separate issue from the SW registration.

fix: (not applied -- diagnosis only)
verification: (not applicable)
files_changed: []
