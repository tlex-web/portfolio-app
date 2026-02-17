---
status: resolved
phase: 02-security-reliability-hardening
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md
started: 2026-02-16T22:00:00Z
updated: 2026-02-17T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. CSP Header with Nonce
expected: Open DevTools > Network tab, reload page, check document response headers. Content-Security-Policy header should be present with nonce-based values in script-src. No 'unsafe-inline' in script-src.
result: issue
reported: "CSP header is present with nonce, but causes massive inline style violations (style-src blocks all inline styles from React, Three.js, devtools), connect-src 'self' blocks Three.js HDRI loading from raw.githack.com causing 3D component crash ('Could not load dikhololo_night_1k.hdr: Failed to fetch'), script-src-elem report-only violations for inline scripts, and unsafe-eval report-only violations. The 3D canvas hits WebGLRenderer Context Lost."
severity: blocker

### 2. Site Functions Under Strict CSP
expected: Browse the site (home page, navigate between pages). All styles render correctly, scripts execute (interactive elements work), and the browser console shows NO CSP violation errors.
result: issue
reported: "Same CSP violations as Test 1. Dozens of blocked inline styles from React DOM, font-styles.tsx, and react-three-fiber. Three.js 3D component crashes entirely (connect-src blocks HDRI fetch from raw.githack.com, WebGLRenderer Context Lost). Styles visually broken due to blocked inline style application."
severity: blocker

### 3. Feedback Form Works (Same-Origin)
expected: Navigate to the feedback form and submit it normally from the site. The form should submit successfully and show a success response (or appropriate feedback). It should not be blocked by CSRF or rate limiting on the first attempt.
result: skipped
reason: CSP blocker makes site difficult to navigate/use for UI testing

### 4. CSRF Rejects Cross-Origin Request
expected: In a terminal, run a curl command posting to the feedback API with a fake origin header. The response should be a 403 rejection with a CSRF error, not a success.
result: pass

### 5. Service Worker Registers
expected: Open DevTools > Application > Service Workers. The service worker should be registered and active for the site. Its source should be service-worker.js.
result: issue
reported: "No active service worker visible in DevTools > Application > Service Workers. Only service workers from other origins are shown."
severity: major

### 6. Build Completes with Hash Injection
expected: Run `npm run build`. The build should complete successfully. After build, check `public/service-worker.js` -- the `__BUILD_HASH__` placeholder should be replaced with an actual hash string.
result: pass

## Summary

total: 6
passed: 2
issues: 3
pending: 0
skipped: 1

## Gaps

- truth: "CSP header present with nonce-based script allowlisting, no unsafe-inline in script-src, site loads without violations"
  status: resolved
  reason: "User reported: CSP style-src blocks all inline styles (React, Three.js, devtools inject styles dynamically). connect-src 'self' blocks Three.js HDRI from raw.githack.com causing 3D crash. Dozens of style-src and script-src-elem violations in console."
  severity: blocker
  test: 1
  root_cause: "style-src 'self' 'nonce-...' blocks inline style *attributes* — React's style prop, R3F Canvas, and 25+ components use style attributes which CANNOT receive nonces per CSP spec (only style elements can use nonces). connect-src 'self' blocks fetch to raw.githack.com where @react-three/drei Environment component loads HDRI .hdr files for presets (night, city, sunset)."
  artifacts:
    - path: "proxy.ts"
      issue: "style-src too restrictive (nonce-only, no unsafe-inline), connect-src missing raw.githack.com"
  missing:
    - "Add 'unsafe-inline' to style-src (required for React style prop attributes)"
    - "Add https://raw.githack.com to connect-src"
  debug_session: ".planning/debug/csp-violations.md"

- truth: "Site functions normally under strict CSP - styles render, scripts execute, no console violations"
  status: resolved
  reason: "User reported: Same violations as Test 1. React DOM, font-styles.tsx, and Three.js inline styles all blocked. 3D component crashes entirely. Visual rendering broken."
  severity: blocker
  test: 2
  root_cause: "Same root cause as gap 1. CSP style-src blocks all inline style attributes from React runtime. connect-src blocks Three.js HDRI loading. Both are proxy.ts CSP directive issues."
  artifacts:
    - path: "proxy.ts"
      issue: "CSP directives incompatible with React inline styles and Three.js CDN resources"
  missing:
    - "Fix proxy.ts CSP directives (same fix as gap 1)"
  debug_session: ".planning/debug/csp-violations.md"

- truth: "Service worker registers and is active in DevTools > Application > Service Workers"
  status: resolved
  reason: "User reported: No active service worker visible in DevTools. Only service workers from other origins shown."
  severity: major
  test: 5
  root_cause: "Two issues: (1) Registration gated behind process.env.NODE_ENV === 'production' so it never runs in dev. (2) Latent production bug: window.addEventListener('load', ...) inside useEffect fires after load event has already occurred, so callback never executes even in production."
  artifacts:
    - path: "components/ServiceWorkerRegistration.tsx"
      issue: "Production-only guard (line 10) and missed load event in useEffect (lines 12-14)"
  missing:
    - "Remove load event wrapper — call navigator.serviceWorker.register() directly in useEffect"
    - "Decide: keep production-only guard (common practice) or allow dev registration for testing"
  debug_session: ".planning/debug/sw-not-registering.md"
