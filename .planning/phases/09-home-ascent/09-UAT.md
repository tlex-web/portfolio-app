---
status: complete
phase: 09-home-ascent
source: [09-VERIFICATION.md]
started: 2026-10-25T21:50:31Z
updated: 2026-10-25T22:12:34.183Z
---

> Round 2, after the gap closure (09-15 to 09-22). Round 1, with Tim's literal replies (including "N3 accept" and the gap-plan decisions behind G-09-2 to G-09-5), is kept verbatim in `09-UAT-round1.md`.

## Current Test

[testing complete]

## Tests

### 1. S3: summit pins on a portrait phone, static poster (Tim to accept or route to a gap plan)
expected: At 375x900, 390x844 and 412x915 with #summit centred in the static poster, all four pins and the summit triangle are on screen (D-09). Today pin 4 is past the right edge and the triangle is off the left edge. I reproduced this by arithmetic from posterFrame and the committed UVs: at 390x844 pin 4 sits at x 394 in a 390 px stage, at 412x839 at x 408 of 412. The 11-size e2e guards check plaque clearance (static) and in-stage (3D only), so no test sees it.
result: pass

### 2. Reduced motion at 375x667 (09-18 overlap; deferred-items.md; UI-REVIEW fix 2): full summit plaque over the poster pins
expected: Tim either accepts that reduced motion shows the stacked layout with the full plaque over decorative pins, or routes a compact layout under reduced motion into a gap plan.
result: pass

### 3. Landscape phones (code review WR-01): 667x375 and 740x360 with #summit centred, static poster
expected: Poster pin 3 is not under the compact plaque. By the repo's own geometry the gap is -44 px at 667x375 and -16 px at 740x360; 844x390 is clear (+31 px). Tim chooses: add a min-height condition to the compact layout, move the column on landscape phones, or accept.
result: pass

### 4. Real-device 3D quality and vestibular comfort, re-run after gap closure (09-11 human-check; 09-VALIDATION Manual-Only row, status OPEN)
expected: On an iPhone, a mid-range Android phone and a laptop: the canvas fades in without a jump, scrolling is smooth with no scroll hijack, the climb is comfortable, the summit view shows all four pins, and an old or slow phone ends on the poster. Record the devices and the result in 09-UAT.md.
result: pass
note: Tim's reply was "pass"; the devices were not named in the reply.

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
