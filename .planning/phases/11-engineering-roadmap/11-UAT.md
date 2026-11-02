---
status: testing
phase: 11-engineering-roadmap
source: [11-VERIFICATION.md]
started: 2026-11-02T02:25:00Z
updated: 2026-11-02T02:25:00Z
---

## Current Test

number: 1
name: coin-flip poster at rest — HEADS label vs the native control bar
expected: |
  The word HEADS on the poster is readable above the native control bar, or the figcaption carries the result so no cue is lost (11-UI-REVIEW priority fix 2).
awaiting: user response

## Tests

### 1. coin-flip poster at rest — HEADS label vs the native control bar
Open /projects/coin-flip on a real device or in desktop Chrome/Safari and look at the Demo clip at rest (poster shown, native controls visible).
expected: The word HEADS on the poster is readable above the native control bar, or the figcaption carries the result so no cue is lost (11-UI-REVIEW priority fix 2).
result: [pending]

### 2. coin-flip clip playback in real browsers
Press play on the coin-flip clip in Chrome, Safari and Firefox.
expected: The 4.4 s silent clip plays; no audio, no autoplay, no loop; the load-failure fallback paragraph is not shown.
result: [pending]

### 3. Visual quality at 375 / 768 / 1440 px
Eyeball /projects (both panels), /projects/box (Demo terminal) and /roadmap at 375, 768 and 1440 px.
expected: The elevation-profile glyph, the T4/T1 waymark badge, the terminal (no large dead area — UI-REVIEW fix 3) and the route-log axis read as intended and look good.
result: [pending]

### 4. box metric "Source" link names
Check the three box metric tiles' "Source" links with a screen reader or the accessibility tree.
expected: Each link's accessible name says what it sources (tools, tests, binary), or you accept three identical "Source" names (UI-REVIEW warning, advisory).
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
