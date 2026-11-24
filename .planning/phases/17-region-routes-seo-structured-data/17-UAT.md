---
status: complete
phase: 17-region-routes-seo-structured-data
source: [17-VERIFICATION.md]
started: 2026-11-24T17:10:43Z
updated: 2026-11-24T17:18:24.463Z
---

## Current Test

[testing complete]

## Tests

### 1. Fetch a region Open Graph card on the deployed build
expected: HTTP 200, content-type image/png, 1200 x 630, showing the region's cover photo over its plate contour with name, country, photo count, height range and the copyright line. Take the exact URL from the og:image meta tag of /photos/regions/zermatt on a Vercel deployment (preview or production), for at least one region, and view it. Why human: the card reads the plate contour SVG through a computed path that Vercel's output file tracing may not include (17-RESEARCH Pitfall 6, review IN-03); the preview is behind Vercel Authentication.
result: pass

## Summary

total: 1
passed: 1
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
