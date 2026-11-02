---
status: complete
phase: 11-engineering-roadmap
source: [11-VERIFICATION.md]
started: 2026-11-02T02:25:00Z
updated: 2026-11-02T10:59:32.181Z
---

## Current Test

[testing complete]

## Tests

### 1. coin-flip poster at rest — HEADS label vs the native control bar
Open /projects/coin-flip on a real device or in desktop Chrome/Safari and look at the Demo clip at rest (poster shown, native controls visible).
expected: The word HEADS on the poster is readable above the native control bar, or the figcaption carries the result so no cue is lost (11-UI-REVIEW priority fix 2).
result: pass
source: automated
evidence: "Live DOM (Playwright, production build): figcaption reads '...It comes to rest face up, and the word HEADS appears below it.', so no cue is lost. HEADS sits clear above the control bar in Firefox 157 and WebKit 27.2. In Edge 156 (Chromium, same control bar as Chrome) the bar overlaps HEADS and the cast icon covers 'AD'; the figcaption branch of the criterion carries it."

### 2. coin-flip clip playback in real browsers
Press play on the coin-flip clip in Chrome, Safari and Firefox.
expected: The 4.4 s silent clip plays; no audio, no autoplay, no loop; the load-failure fallback paragraph is not shown.
result: pass
source: automated
evidence: "Live DOM (Playwright, production build): Edge 156 (Chromium + H.264, standing in for Chrome), Firefox 157 and WebKit 27.2 each played 0 -> 4.42 s and ended, no media error, stayed paused at the end; autoplay=false, loop=false, muted, preload=none (only the poster is fetched at rest); fallback <p> not visible; no audio (mozHasAudio=false, webkitAudioDecodedByteCount=0, audioTracks=0). File: one video track, no audio track, H.264 High@3.2, moov before mdat, server answers Range with 206. WebKit on http://localhost needed the CSP header stripped (upgrade-insecure-requests -> https://localhost SSL error, a localhost-only artifact). Real Safari on macOS/iOS was not run."

### 3. Visual quality at 375 / 768 / 1440 px
Eyeball /projects (both panels), /projects/box (Demo terminal) and /roadmap at 375, 768 and 1440 px.
expected: The elevation-profile glyph, the T4/T1 waymark badge, the terminal (no large dead area — UI-REVIEW fix 3) and the route-log axis read as intended and look good.
result: pass

### 4. box metric "Source" link names
Check the three box metric tiles' "Source" links with a screen reader or the accessibility tree.
expected: Each link's accessible name says what it sources (tools, tests, binary), or you accept three identical "Source" names (UI-REVIEW warning, advisory).
result: issue
reported: "yes change to a suffix on each link"
severity: minor
evidence: "Live DOM (Edge 156, production build): all three links in the box Metrics tiles have the accessible name 'Source' (icon aria-hidden, no aria-label): Tools -> box#readme, Tests -> .planning/MILESTONES.md, Binary -> box#readme."

## Summary

total: 4
passed: 3
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-11-4
  truth: "Each box metric Source link's accessible name says what it sources (tools, tests, binary)"
  status: failed
  reason: "User reported: yes change to a suffix on each link"
  severity: minor
  test: 4
  artifacts: []
  missing: []
