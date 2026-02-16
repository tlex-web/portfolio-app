---
status: resolved
trigger: "Investigate a minor test issue in this portfolio app. **Issue:** React console.error warning during GalleryGrid test: \"React does not recognize the `blurDataURL` prop on a DOM element.\" The warning occurs at `components/__tests__/GalleryGrid.test.tsx:72` when rendering `<GalleryGrid images={mockImages} />`. **Task:** Find the root cause."
created: 2026-02-16T00:00:00Z
updated: 2026-02-16T00:05:00Z
---

## Current Focus

hypothesis: blurDataURL prop is being spread onto a DOM element instead of being consumed by Next.js Image component
test: examine GalleryGrid component and test file to see how props are passed
expecting: find blurDataURL being spread to a div or other DOM element
next_action: read test file and GalleryGrid component

## Symptoms

expected: GalleryGrid component renders without React warnings
actual: React console.error warning "React does not recognize the `blurDataURL` prop on a DOM element"
errors: React does not recognize the `blurDataURL` prop on a DOM element
reproduction: run test at components/__tests__/GalleryGrid.test.tsx:72
started: unknown

## Eliminated

## Evidence

- timestamp: 2026-02-16T00:01:00Z
  checked: components/__tests__/GalleryGrid.test.tsx lines 6-13
  found: Next.js Image mock spreads all props to <img> tag using {...rest}
  implication: blurDataURL prop is passed through to DOM element

- timestamp: 2026-02-16T00:02:00Z
  checked: components/GalleryGrid.tsx line 48
  found: Component passes blurDataURL prop to Next.js Image component
  implication: In production this works fine (Next.js Image consumes the prop), but in tests the mock spreads it to <img>

- timestamp: 2026-02-16T00:03:00Z
  checked: Test mock implementation (line 9-12)
  found: Mock destructures `fill` but spreads all other props including blurDataURL
  implication: blurDataURL needs to be destructured and excluded from rest spread

## Resolution

root_cause: Test mock for Next.js Image spreads Next.js-specific props (blurDataURL, placeholder) to DOM <img> element
fix: Destructure and exclude Next.js-specific props in the Image mock
verification: Run test and verify no React warnings
files_changed: []
