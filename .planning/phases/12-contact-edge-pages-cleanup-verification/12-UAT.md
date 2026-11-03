---
status: testing
phase: 12-contact-edge-pages-cleanup-verification
source: [12-VERIFICATION.md]
started: 2026-11-03T11:05:00Z
updated: 2026-11-03T17:05:00Z
---

## Current Test

number: 1
name: Real Safari (iOS and macOS) pass
expected: |
  Nav and mobile menu, Home ascent, lightbox (open from Grid, arrow keys, Escape), the View
  Transitions morph and signing the contact register all work: no broken layout, no stuck
  overlay, focus returns to the tile after the lightbox closes, 'register signed' appears.
awaiting: user response

## Tests

### 1. Real Safari (iOS and macOS): nav and mobile menu, Home ascent, lightbox (open from Grid, arrow keys, Escape), the View Transitions morph, signing the contact register
expected: No broken layout, no stuck overlay, focus returns to the tile after the lightbox closes, 'register signed' appears
result: [pending]

### 2. Safari Back/Escape/Close pressed straight after opening a photo; load a photo URL and press Next immediately; Web Inspector Network on a project with a demo clip (12-24 UAT item i)
expected: Lightbox closes, URL returns to the grid, page stays alive, tab title names the shown photo, no MP4 request before play
result: [pending]

### 3. Keyboard-only run across nav, /photos map, lightbox and contact form, judging focus visibility (12-24 UAT item c)
expected: Focus ring clearly visible at every stop
result: [pending]

### 4. Screen-reader listen on /contact (NVDA, JAWS or VoiceOver): invalid submit, then type past 1,800 characters (12-24 UAT item j); also the follow-up's fieldless-validation failure state (WR-01) and Retry validating first (IN-06)
expected: Focused error summary reads 'Check {n} fields' with field links; counter announces at 1,800, 1,900, 1,950, 2,000 and over the limit; a fieldless server 'validation' answer announces the "Couldn't send." state, and Retry after an invalid edit announces the field summary instead of sending
result: [pending]

### 5. Link previews: paste a photo URL, /projects/box and Home into opengraph.xyz or a chat app (12-24 UAT item e); open each OG PNG at 1200x630
expected: Photo card contain-fitted with the copyright line, project card shows route, grade and pitch, Home shows the default contour card; text legible
result: [pending]

### 6. Production CSP header after deploy (12-24 UAT item d) and preview slug check on a deployed preview (12-24 UAT item k)
expected: Header contains upgrade-insecure-requests, no raw.githubusercontent.com, no 'unsafe-eval'; view-source of /photos/nf-check has 0 hits for nf-check; a document prefetch (purpose: prefetch) of an unknown URL also carries the CSP header (new since 12-29)
result: [pending]

### 7. Firefox footer contour band at 1 px strokes (12-24 UAT item b)
expected: Reads as crisp 1 px strokes, not blurred or doubled
result: [pending]

### 8. Error page and /offline glance: the 'Report this error' link (ink-muted underline, 44 px target) next to Try again, and a saved-page row hovering to surface-overlay on /offline (new, from 12-32 D1 and D2)
expected: Try again reads as the one accent element; the Report link is identifiable by its underline; the hover shade is visible but quiet
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
