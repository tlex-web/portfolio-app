---
status: testing
phase: 09-home-ascent
source: [09-VERIFICATION.md]
started: 2026-10-25T15:05:00Z
updated: 2026-10-25T15:05:00Z
---

## Current Test

number: 1
name: Real-device 3D quality and vestibular comfort (09-11 human-check; VALIDATION Manual-Only row, status OPEN)
expected: |
  On an iPhone, a mid-range Android phone and a laptop: the canvas fades in without a jump, scrolling is smooth with no scroll hijack, the climb is comfortable (no dizzying turns), the summit view shows all four pins, and an old or slow phone ends on the poster. Record the devices and the result here.
awaiting: user response

## Tests

### 1. Real-device 3D quality and vestibular comfort (09-11 human-check; VALIDATION Manual-Only row, status OPEN)
expected: On an iPhone, a mid-range Android phone and a laptop: the canvas fades in without a jump, scrolling is smooth with no scroll hijack, the climb is comfortable (no dizzying turns), the summit view shows all four pins, and an old or slow phone ends on the poster. Record the devices and the result here.
result: [pending]

### 2. Summit plaque and pin overlaps (known, deferred-items.md; Tim: "Gap plan after 09-14")
expected: At 375x667, 768x1024, 820x1180 and 1024x768 the four 3D pins at #summit are not hidden behind the plaque, and below 1280 px the static poster pins are not under the plaque. Tim decides here whether to accept or to run /gsd-plan-phase 09 --gaps.
result: [pending]

### 3. 768 px waypoint-2 pin label hidden behind the card (static poster) and 375 px docked kicker orphaning the "4"
expected: The pin label is legible beside the card at 768, and the kicker wraps without a lone "4" at 375.
result: [pending]

### 4. UI-REVIEW new findings: hero scrim over the altimeter rail at 768-1023 px, place line wrapping with a leading dot at 375, pin 3 under hero copy at p=0 at 375 and 768
expected: Tim accepts or routes each to the gap plan.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
