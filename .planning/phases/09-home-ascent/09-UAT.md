---
status: complete
phase: 09-home-ascent
source: [09-VERIFICATION.md]
started: 2026-10-25T15:05:00Z
updated: 2026-10-25T13:58:40.295Z
---

## Current Test

[testing complete]

## Tests

### 1. Real-device 3D quality and vestibular comfort (09-11 human-check; VALIDATION Manual-Only row, status OPEN)
expected: On an iPhone, a mid-range Android phone and a laptop: the canvas fades in without a jump, scrolling is smooth with no scroll hijack, the climb is comfortable (no dizzying turns), the summit view shows all four pins, and an old or slow phone ends on the poster. Record the devices and the result here.
result: pass

### 2. Summit plaque and pin overlaps (known, deferred-items.md; Tim: "Gap plan after 09-14")
expected: At 375x667, 768x1024, 820x1180 and 1024x768 the four 3D pins at #summit are not hidden behind the plaque, and below 1280 px the static poster pins are not under the plaque. Tim decides here whether to accept or to run /gsd-plan-phase 09 --gaps.
result: issue
reported: "gap plan — pins still hidden behind the plaque"
severity: major

### 3. 768 px waypoint-2 pin label hidden behind the card (static poster) and 375 px docked kicker orphaning the "4"
expected: The pin label is legible beside the card at 768, and the kicker wraps without a lone "4" at 375.
result: issue
reported: "gap plan — both still there"
severity: major

### 4. UI-REVIEW new findings: hero scrim over the altimeter rail at 768-1023 px, place line wrapping with a leading dot at 375, pin 3 under hero copy at p=0 at 375 and 768
expected: Tim accepts or routes each to the gap plan.
result: issue
reported: "N1 gap, N2 gap, N3 accept"
severity: major
note: N1 (scrim dims rail at 768-1023) and N2 (place line leading dot at 375) routed to the gap plan; N3 (pin 3 vs hero copy at p=0) accepted as decorative.

### 5. Hidden-tab reveal burst restarts (WR-01; VERIFICATION behavior_unverified item)
expected: On a capable device at pixel ratio 1, load Home and, within the first second after the canvas fades in, switch to another tab for 2 s, then return. A fresh burst starts on return, the 'ascent-frame-budget' performance mark's verdict is 'ok', and data-ascent-mode stays '3d' (no fall back to the poster).
result: issue
reported: "i dont see a fallback to the poster"
severity: major
note: The manual run did not show the fallback, but the trigger needs pixel ratio 1 and a tab switch inside the ~350 ms burst window (09-REVIEW WR-01), which is hard to hit by hand, so the code trace stands. Tim routed it to the gap plan (fix plus a deterministic CDP frozen-lifecycle e2e).

## Summary

total: 5
passed: 1
issues: 4
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-09-2
  truth: "At 375x667, 768x1024, 820x1180 and 1024x768 the four 3D pins at #summit are not hidden behind the plaque, and below 1280 px the static poster pins are not under the plaque (D-03)"
  status: failed
  reason: "User reported: gap plan — pins still hidden behind the plaque"
  severity: major
  test: 2
  artifacts: []  # Filled by diagnosis
  missing: []    # Filled by diagnosis

- gap_id: G-09-3
  truth: "At 768 px the waypoint-2 pin label on the static poster is legible beside its card, and at 375 px the docked kicker wraps without a lone \"4\""
  status: failed
  reason: "User reported: gap plan — both still there"
  severity: major
  test: 3
  artifacts: []  # Filled by diagnosis
  missing: []    # Filled by diagnosis

- gap_id: G-09-4
  truth: "At 768-1023 px the hero scrim does not dim the altimeter rail labels and readout (UI-REVIEW N1), and at 375 px the docked card's place line never starts a line with the \"·\" separator (UI-REVIEW N2). N3 (pin 3 vs hero copy at p=0) accepted, out of scope."
  status: failed
  reason: "User reported: N1 gap, N2 gap, N3 accept"
  severity: major
  test: 4
  artifacts: []  # Filled by diagnosis
  missing: []    # Filled by diagnosis

- gap_id: G-09-5
  truth: "A reveal burst interrupted by a hidden tab (rAF suspended) restarts on return instead of declining: at pixel ratio 1 the 'ascent-frame-budget' verdict is 'ok' and data-ascent-mode stays '3d' (09-REVIEW WR-01, HOME-07 pause contract)"
  status: failed
  reason: "User reported: i dont see a fallback to the poster (manual run could not reliably hit the ~350 ms trigger window; code trace in 09-REVIEW WR-01 says the burst is not dropped while hidden; Tim routed to the gap plan)"
  severity: major
  test: 5
  artifacts: []  # Filled by diagnosis
  missing: []    # Filled by diagnosis
