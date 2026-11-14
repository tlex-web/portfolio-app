---
status: complete
phase: 14-ui-fixes-terminal-controls
source: [14-VERIFICATION.md]
started: 2026-11-14T14:39:58Z
updated: 2026-11-14T16:03:36.641Z
---

## Current Test

[testing complete]

## Tests

### 1. Repeat Tim's 12-UAT test 3 keyboard check: at 1366x650, 1280x560 and 720x450 open a photo, step with the arrow keys, close with Escape, and watch where focus lands; then open the mobile menu at 375 px and Tab through every row
expected: After Escape, focus is on the current photo's trigger and the ring is fully on screen below the nav. In the menu every focus ring is whole at the sides, top and bottom, and tapping the current page's link closes the menu without a page jump
result: pass
automated: "2026-11-14, run at Tim's request on next dev (:3000) in Edge (msedge) and Firefox, keyboard only via a Playwright script: 20/20 checks pass. Lightbox on the /photos map at 1366x650, 1280x560 and 720x450: Tab to the first mark, Enter, then →→→← (3/4) or →→→ (4/4); the shown photo's trigger was off-screen behind the dialog every time. After Escape focus is on that photo's trigger, :focus-visible, 2 px ring at 2 px offset, fully inside the viewport below the 64 px nav (ring bottom lands flush on the viewport edge, 0 px spare). Menu at 375x812 on /photos and /roadmap: all 5 rows show the inset ring (2 px at -4 px) whole inside the panel and the viewport. Touch-tapping the current link (Roadmap, Photographs) at scrollY 600 closes the panel with scroll, URL and document unchanged."

## Summary

total: 1
passed: 1
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
