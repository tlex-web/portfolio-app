---
status: resolved
phase: 02-security-reliability-hardening
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md
started: 2026-02-17T12:00:00Z
updated: 2026-02-17T13:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. CSP Header with Nonce and Style-src Fix
expected: Open DevTools > Network tab, reload page, check document response headers. Content-Security-Policy header present with nonce in script-src (no unsafe-inline in script-src), 'unsafe-inline' in style-src, and 'https://raw.githack.com' in connect-src.
result: issue
reported: "CSP header present with nonce, but style-src has both nonce and 'unsafe-inline' — per CSP spec, 'unsafe-inline' is ignored when a nonce is present, so all inline styles are blocked. connect-src has wrong domain (raw.githack.com instead of raw.githubusercontent.com where drei actually loads HDRI assets from)."
severity: blocker

### 2. Site Renders Without CSP Violations
expected: Browse the site (home page, navigate between pages). All styles render correctly, scripts execute, interactive elements work. Browser console shows NO CSP violation errors. No blocked inline styles.
result: issue
reported: "Dozens of blocked inline style violations from React DOM, font-styles, and react-three-fiber. connect-src blocks HDRI fetch from raw.githubusercontent.com causing 3D component crash and WebGL Context Lost. Same root cause as Test 1."
severity: blocker

### 3. 3D Components Load Under CSP
expected: Navigate to a page with 3D components (terrain, carousel). The 3D scene renders fully — no WebGL context lost, no HDRI loading errors, environment lighting works correctly.
result: issue
reported: "3D crashes with HDRI fetch error and WebGL context lost"
severity: blocker

### 4. Feedback Form Submits Successfully
expected: Navigate to the feedback form and submit it from the site. The form should submit successfully and show a success response. Not blocked by CSRF or rate limiting on first attempt.
result: skipped
reason: Can't test without fixing CSP style-src first

### 5. CSRF Rejects Cross-Origin Request
expected: In a terminal, run a curl/fetch posting to the feedback API with a fake Origin header (e.g., https://evil.com). The response should be a 403 rejection with a CSRF error.
result: pass

### 6. Service Worker Registers
expected: Run a production build, open in browser, go to DevTools > Application > Service Workers. The service worker should be registered and active. (Note: production-only.)
result: pass

### 7. Build Completes with Hash Injection
expected: Run `npm run build`. Build completes successfully. After build, check `public/service-worker.js` — the __BUILD_HASH__ placeholder should be replaced with an actual hash string.
result: pass

## Summary

total: 7
passed: 3
issues: 3
pending: 0
skipped: 1

## Gaps

- truth: "CSP style-src allows React inline style attributes"
  status: resolved
  reason: "User reported: style-src has both nonce and 'unsafe-inline' — per CSP spec, 'unsafe-inline' is ignored when a nonce is present, so all inline styles are blocked."
  severity: blocker
  test: 1
  root_cause: "proxy.ts line 9: style-src 'self' 'nonce-${nonce}' 'unsafe-inline' — CSP Level 2 spec states that 'unsafe-inline' is ignored when any nonce or hash source is present in the directive. The nonce was added by 02-01 for style elements, then 02-04 added 'unsafe-inline' for style attributes, but the nonce's presence nullifies it."
  artifacts:
    - path: "proxy.ts"
      issue: "style-src line 9 has nonce AND unsafe-inline — nonce must be removed from style-src"
  missing:
    - "Remove 'nonce-${nonce}' from style-src, keep only 'self' 'unsafe-inline'"
  debug_session: ""

- truth: "CSP connect-src allows Three.js HDRI loading from drei CDN"
  status: resolved
  reason: "User reported: connect-src has wrong domain (raw.githack.com instead of raw.githubusercontent.com where drei actually loads HDRI assets from). HDRI fetch blocked, 3D crash."
  severity: blocker
  test: 3
  root_cause: "proxy.ts line 12: connect-src 'self' https://raw.githack.com — the previous diagnosis incorrectly identified the CDN as raw.githack.com. The actual fetch URL shown in browser console is https://raw.githubusercontent.com/pmndrs/drei-assets/..."
  artifacts:
    - path: "proxy.ts"
      issue: "connect-src line 12 has wrong domain: raw.githack.com should be raw.githubusercontent.com"
  missing:
    - "Change https://raw.githack.com to https://raw.githubusercontent.com in connect-src"
  debug_session: ""
