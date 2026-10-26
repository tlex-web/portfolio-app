---
status: testing
phase: 10-photography
source: [10-VERIFICATION.md]
started: 2026-10-26T19:30:00Z
updated: 2026-10-26T19:30:00Z
---

## Current Test

number: 1
name: Real Safari (macOS and iOS): photo page and lightbox, Tab / Shift+Tab around the dialog, open morph or instant open
expected: |
  Focus stays inside the dialog (assumption A1, the manual Tab wrap). Escape and Back close it, focus returns to the opener, and the page hydrates normally.
awaiting: user response

## Tests

### 1. Real Safari (macOS and iOS): photo page and lightbox, Tab / Shift+Tab around the dialog, open morph or instant open
expected: Focus stays inside the dialog (assumption A1, the manual Tab wrap). Escape and Back close it, focus returns to the opener, and the page hydrates normally. No automated run covers Safari: local Playwright WebKit cannot hydrate localhost under the CSP `upgrade-insecure-requests` header, and CI has no WebKit project.
result: [pending]

### 2. Real touch device: swipe the lightbox photo left and right, pinch-zoom the fitted photo, drag-pan the 1:1 zoomed photo
expected: A swipe steps with no history entry, the browser's pinch-zoom is not blocked, and a drag on the zoomed photo pans the stage. Drag-and-drop of the image is suppressed only while zoomed, which is your approved exception: "Keep, record exception (Recommended)".
result: [pending]

### 3. Motion feel: grid-to-lightbox morph, Map · Grid · Carousel crossfade, swipe follow and spring-back, 3D carousel step easing and idle float
expected: Smooth, with no flash and no empty box during the morph; instant under reduced motion. A map plate opens with a plain enter (D-03), not a morph.
result: [pending]

### 4. Visual quality of the 15 committed baselines (map, grid, carousel stepper, photo page, lightbox at 375/768/1440; commit 483895b)
expected: Each baseline looks as designed. You committed them with the reply "pushed" and no per-shot notes, so no per-image look has been recorded yet. The UI review (10-UI-REVIEW.md, 20/24) flagged mono lines breaking mid-phrase (EXIF before "ISO 100", the shortcut legend, "Zermatt, / Switzerland" at 375) and the key glyphs not reading as `<kbd>`. Accept them, or route them to a gap plan.
result: [pending]

### 5. The 3D carousel and the flat stepper at 1280 and 375 wide
expected: The restyled frames, caption, controls and "Open photo" read cleanly with no overlap or clipping. The UI review flagged about 200 px of empty frame around the photo in the 375 stepper (448 px frame). Accept it, or route it to a gap plan.
result: [pending]

### 6. Key tier at 1024 × 768: open a photo and judge its size
expected: The contain-fit photo is still large enough after the 56 px chrome and the two-column strip take their share, including when a hotspot key row is open. This is a design call (flagged by 10-11 and the UI review).
result: [pending]

### 7. Scroll the 3D carousel offscreen and switch tabs, with DevTools frame monitoring
expected: The idle float and frame loop stop offscreen (IntersectionObserver) and in a hidden tab. Only the hidden-tab case has an automated test.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
