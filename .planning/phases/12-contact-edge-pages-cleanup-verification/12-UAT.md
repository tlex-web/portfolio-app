---
status: complete
phase: 12-contact-edge-pages-cleanup-verification
source: [12-VERIFICATION.md]
started: 2026-11-03T11:05:00Z
updated: 2026-11-05T20:24:42.196Z
---

## Current Test

[testing complete]

## Tests

### 1. Real Safari (iOS and macOS): nav and mobile menu, Home ascent, lightbox (open from Grid, arrow keys, Escape), the View Transitions morph, signing the contact register
expected: No broken layout, no stuck overlay, focus returns to the tile after the lightbox closes, 'register signed' appears
result: pass

### 2. Safari Back/Escape/Close pressed straight after opening a photo; load a photo URL and press Next immediately; Web Inspector Network on a project with a demo clip (12-24 UAT item i)
expected: Lightbox closes, URL returns to the grid, page stays alive, tab title names the shown photo, no MP4 request before play
result: pass

### 3. Keyboard-only run across nav, /photos map, lightbox and contact form, judging focus visibility (12-24 UAT item c)
expected: Focus ring clearly visible at every stop
result: pass
automated: "2026-11-05, Edge and Firefox. Ring is 2 px with at least 11.73:1 contrast at every Tab stop. Needs review: (a) after stepping in the lightbox then Escape, focus lands on a map mark outside the viewport in short windows (1366x650 partly, 1280x560 and 720x450 fully); (b) in the 375 px mobile menu the panel clips the left and right sides of the ring."
note: "Passed by Tim on 2026-11-05 with both findings accepted as they stand. Neither was fixed."

### 4. Screen-reader listen on /contact (NVDA, JAWS or VoiceOver): invalid submit, then type past 1,800 characters (12-24 UAT item j); also the follow-up's fieldless-validation failure state (WR-01) and Retry validating first (IN-06)
expected: Focused error summary reads 'Check {n} fields' with field links; counter announces at 1,800, 1,900, 1,950, 2,000 and over the limit; a fieldless server 'validation' answer announces the "Couldn't send." state, and Retry after an invalid edit announces the field summary instead of sending
result: pass
automated: "2026-11-05, Edge against next start, DOM only, no screen reader heard. Invalid submit focuses the alert 'Check 3 fields' with 3 field links. The status text changes only at 1,800, 1,900, 1,950, 2,000 and over the limit. A fieldless validation answer focuses the \"Couldn't send.\" alert with Retry. Retry after an invalid edit focuses 'Check 1 field' and sends nothing."

### 5. Link previews: paste a photo URL, /projects/box and Home into opengraph.xyz or a chat app (12-24 UAT item e); open each OG PNG at 1200x630
expected: Photo card contain-fitted with the copyright line, project card shows route, grade and pitch, Home shows the default contour card; text legible
result: pass
automated: "2026-11-05. All three OG PNGs are 1200x630 and match on inspection: photo contain-fitted with the copyright line, project with route, grade and pitch, Home with the contour card, text legible. The link-preview paste is still open: the preview is behind Vercel SSO and production is pre-Phase 12."
note: "Passed by Tim on 2026-11-05 on the PNG evidence. On production the same day, the three OG images load publicly at 1200x630. Whether the paste into a link-preview tool was run is not recorded."

### 6. Production CSP header after deploy (12-24 UAT item d) and preview slug check on a deployed preview (12-24 UAT item k)
expected: Header contains upgrade-insecure-requests, no raw.githubusercontent.com, no 'unsafe-eval'; view-source of /photos/nf-check has 0 hits for nf-check; a document prefetch (purpose: prefetch) of an unknown URL also carries the CSP header (new since 12-29)
result: pass
automated: "2026-11-05, production (portfolio-app-mocha-three.vercel.app, rebuilt from 53171db). Every expected value holds on /, a known photo, /photos/nf-check (404, 0 hits) and an unknown URL sent with purpose: prefetch. The preview of 53171db passed the same checks earlier. Was blocked on the deploy (Tim: 'blocked: deploy') until this rebuild went live."

### 7. Firefox footer contour band at 1 px strokes (12-24 UAT item b)
expected: Reads as crisp 1 px strokes, not blurred or doubled
result: pass
source: automated
evidence: "Playwright Firefox 157 at 1x against next start, 2026-11-05. A 4x nearest-neighbour crop shows single strokes, none blurred or doubled, with the same stroke profile as Edge (peak 30 above background in both). Retail Firefox is not installed on this machine, so this is Playwright's build."

### 8. Error page and /offline glance: the 'Report this error' link (ink-muted underline, 44 px target) next to Try again, and a saved-page row hovering to surface-overlay on /offline (new, from 12-32 D1 and D2)
expected: Try again reads as the one accent element; the Report link is identifiable by its underline; the hover shade is visible but quiet
result: pass
source: automated
evidence: "Edge against next start, 2026-11-05. Try again is the only filled accent control; Report link is ink-muted with a 1 px underline and a 44 px height. A saved-page row goes from transparent to surface-overlay on hover, visible and quiet in the screenshot."

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
