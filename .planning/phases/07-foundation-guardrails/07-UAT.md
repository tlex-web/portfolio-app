---
status: testing
phase: 07-foundation-guardrails
source: [07-VERIFICATION.md]
started: 2026-10-24T11:07:07Z
updated: 2026-10-24T11:07:07Z
---

## Current Test

number: 1
name: Confirm Vercel builds on Node 24.x with npm ci (GUARD-01, 07-USER-SETUP.md item 1)
expected: |
  Vercel -> Project -> Deployments -> latest -> Build Logs shows Node 24.x and the install step runs npm ci. If it still shows Node 20, set Settings -> Build and Deployment -> Node.js Version to 24.x
awaiting: user response

## Tests

### 1. Confirm Vercel builds on Node 24.x with npm ci (GUARD-01, 07-USER-SETUP.md item 1)
expected: Vercel -> Project -> Deployments -> latest -> Build Logs shows Node 24.x and the install step runs npm ci. If it still shows Node 20, set Settings -> Build and Deployment -> Node.js Version to 24.x
result: [pending]

### 2. Ratify the three documented zero-diff exceptions for ROADMAP SC2 (DEPS-03, DEPS-04, DEPS-05)
expected: Tim confirms in his own words that re-baselining (a) 6 home/*-scroll-50 shots in 73880a2 (motion 14 renders the hero 'Scroll to explore' indicator at opacity 0 where motion 12 left a stale faint one), (b) 6 offline/*-reduced shots in e72c661 (Next 16.2.6 SWC dropped a JSX space, fixed in 16.4.0), and (c) 6 contact/*-reduced shots in fdd2652 (Chromium 156 textarea resize-grabber, 36 px per shot) are acceptable. Then add the overrides block from the SC2 row to 07-VERIFICATION.md
result: [pending]

### 3. Require Visual Regression, Lint and Type Check and Unit Tests as status checks on main (07-USER-SETUP.md item 2)
expected: GitHub -> Settings -> Branches/Rulesets -> main lists the three jobs as Required; a PR's merge box shows them as Required
result: [pending]

### 4. Keyboard-only smoke pass of the shell in Firefox and WebKit (07-VALIDATION.md manual row)
expected: Tab reaches the skip link first, then Primary nav, mobile menu opens/closes with Escape and route change, current page is visibly marked
result: [pending]

### 5. Visual sign-off of the final dark shell on a real device
expected: Focus ring visibility, 375 px wrapping, mobile menu transition and the Contact page over the (still present) AnimatedGradientMesh look right
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
