---
status: resolved
phase: 02-security-reliability-hardening
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md
started: 2026-02-17T14:00:00Z
updated: 2026-02-17T14:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. CSP Header Directives
expected: Open DevTools > Network tab, reload page, check document response headers. Content-Security-Policy header present with: script-src has nonce and strict-dynamic (no unsafe-inline), style-src has 'self' 'unsafe-inline' without nonce, connect-src allows drei CDN domains.
result: issue → resolved
reported: "connect-src had only raw.githubusercontent.com but drei fetches from raw.githack.com which redirects to raw.githubusercontent.com — both domains needed"
severity: blocker
fix: "Added both https://raw.githack.com and https://raw.githubusercontent.com to connect-src (commit 1b6bf11)"

### 2. Site Renders Without CSP Violations
expected: Browse the site (home page, navigate between pages). All styles render correctly, scripts execute, interactive elements work. Browser console shows NO CSP violation errors.
result: issue → resolved
reported: "Homepage crashed due to 3D HDRI fetch blocked by CSP"
severity: blocker
fix: "Same connect-src fix as Test 1 — page renders correctly with both CDN domains allowed"

### 3. 3D Components Load Under CSP
expected: Navigate to a page with 3D components (terrain, carousel). The 3D scene renders fully — no WebGL context lost, no HDRI loading errors, environment lighting works correctly.
result: issue → resolved
reported: "3D crashes with HDRI fetch error — same root cause as Test 1"
severity: blocker
fix: "Same connect-src fix — 3D terrain and environment lighting load correctly"

### 4. Feedback Form Submits Successfully
expected: Navigate to the feedback form and submit it from the site. The form should submit successfully and show a success response. Not blocked by CSRF or rate limiting on first attempt.
result: pass

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
passed: 4
issues: 3 (all resolved)
pending: 0
skipped: 0

## Gaps

- truth: "CSP connect-src allows Three.js HDRI loading from drei CDN"
  status: resolved
  reason: "drei Environment preset fetches HDRI from raw.githack.com which redirects to raw.githubusercontent.com — both domains must be in connect-src"
  severity: blocker
  test: 1
  root_cause: "proxy.ts connect-src had only one CDN domain. drei uses raw.githack.com as CDN which redirects to raw.githubusercontent.com. Both domains needed in connect-src."
  artifacts:
    - path: "proxy.ts"
      issue: "connect-src needed both raw.githack.com and raw.githubusercontent.com"
  missing: []
  debug_session: ""
  fix_commit: "1b6bf11"
