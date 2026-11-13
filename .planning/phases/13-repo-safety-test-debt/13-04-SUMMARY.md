---
phase: 13-repo-safety-test-debt
plan: 04
subsystem: infra
tags: [cleanup, next-config, service-worker, motion-tokens, clean-01]

# Dependency graph
requires: []
provides:
  - "next.config.ts without the unused images block (next/image loader keeps its defaults)"
  - "Service worker image cache branch keyed on request.destination === 'image' alone"
  - "app/layout.tsx head without the vercel.com dns-prefetch hint"
  - "lib/animations.ts with only EASING and DURATION (cssDuration, cssEase, kebab, TILT_CONFIG gone)"
affects: [13-15, 15, 16, 17, 18]

# Actuals (#2632)
actuals:
  tokens: 900
  tasks: 2
  commits: 2
plan_head_before: d3f4cdc641ae607f469687eb5b2bd56b01cfeda4
plan_head_after: d69b42c1aa389c0be3d2f5c2e37a95f80511c538

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prove-then-remove: every dead-code removal is preceded by a recorded git grep showing no caller"

key-files:
  created: []
  modified:
    - next.config.ts
    - public/service-worker.js
    - app/layout.tsx
    - lib/animations.ts
    - lib/__tests__/motion-tokens.test.ts

key-decisions:
  - "13-04: CLEAN-01 app-side removals landed as two commits for 13-15's per-commit check-snapshot-commit --none: 6ff759d (images block, SW /_next/image condition, vercel.com dns-prefetch) and d69b42c (cssDuration, cssEase, kebab, TILT_CONFIG and their 2 tests)"
  - "13-04: proxy.ts keeps _next/image in its matcher exclusion (out of scope, harmless); the next/image loader now runs on Next 16 defaults (qualities [75]) with no caller"

patterns-established:
  - "Commit only the source edit of public/service-worker.js: back up the edited file before next build and restore it (or git checkout the file) after the postbuild hash injection"

requirements-completed: [CLEAN-01]

coverage:
  - id: D1
    description: "images block, SW /_next/image condition and vercel.com dns-prefetch removed; build and SW tests green"
    requirement: CLEAN-01
    verification:
      - kind: unit
        ref: "npx jest lib/__tests__/service-worker-media.test.ts lib/__tests__/service-worker-navigation.test.ts (33 passed)"
        status: pass
      - kind: other
        ref: "npm run build (exit 0, no next.config validation error)"
        status: pass
    human_judgment: false
  - id: D2
    description: "cssDuration, cssEase, kebab and TILT_CONFIG removed with the 2 helper tests; parity tests kept; ratchet holds"
    requirement: CLEAN-01
    verification:
      - kind: unit
        ref: "npx jest lib/__tests__/motion-tokens.test.ts (11 passed)"
        status: pass
      - kind: other
        ref: "! git grep -n -E \"TILT_CONFIG|cssDuration|cssEase|dns-prefetch|_next/image\" -- lib app public next.config.ts (no output)"
        status: pass
      - kind: other
        ref: "npx jest --json --outputFile=jest-results.json && npm run guard:tests (jest 1730 + e2e 556 = 2286, baseline 2243)"
        status: pass
      - kind: other
        ref: "npm run type-check (exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No rendered pixel changes (zero visual diff on both commits)"
    requirement: CLEAN-01
    verification: []
    human_judgment: true
    rationale: "The pixel proof is the Visual Regression job with update mode none plus check-snapshot-commit --none per commit, owned by 13-15 on the mid-phase PR; it cannot run locally in this plan"

# Metrics
duration: 3min
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 04: CLEAN-01 App-Side Dead Code Removal Summary

**Removed the unused next.config images block, the service worker's /_next/image condition, the vercel.com dns-prefetch hint, and the test-only cssDuration/cssEase/kebab helpers with TILT_CONFIG, each proven caller-free by git grep first**

## Performance

- **Duration:** about 3 min
- **Started:** 2026-11-13T10:43:52Z
- **Completed:** 2026-11-13T10:46:14Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `next.config.ts` no longer carries the `images` block (formats, deviceSizes, imageSizes, minimumCacheTTL, qualities) or the whitespace-only line after it. Nothing imports `next/image`, so the loader's Next 16 defaults (`qualities: [75]`, per `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`) have no caller.
- `public/service-worker.js` caches images on `request.destination === 'image'` alone; the `/media/` poster case in `service-worker-media.test.ts` still lands in `images-__BUILD_HASH__`.
- `app/layout.tsx` head keeps both `rel="prefetch"` links and drops the vercel.com `dns-prefetch` link and its comment.
- `lib/animations.ts` exports only `EASING` and `DURATION`; the motion parity tests (9) stay, the 2 helper tests are gone.

## Proof of non-use (recorded before removal)

Task 1, run at d3f4cdc:

```
$ git grep -n "next/image" -- app components lib
lib/og/template.tsx:114:    // eslint-disable-next-line @next/next/no-img-element -- Satori draws <img>, not next/image
lib/og/template.tsx:295:      {/* eslint-disable-next-line @next/next/no-img-element -- Satori draws <img>, not next/image */}

$ git grep -n "_next/image" -- lib app components e2e scripts
(no output, exit 1)

$ git grep -n "_next/image" -- ':!.planning'      # whole repo, to show where the SW match lives
proxy.ts:237:        '/((?!api|_next/static|_next/image|favicon.ico|service-worker.js|images/|terrain/|media/).*)',
public/service-worker.js:196:    url.pathname.startsWith('/_next/image') ||

$ git grep -n "dns-prefetch"                       # outside .planning
app/layout.tsx:59:        <link rel="dns-prefetch" href="https://vercel.com" />
```

The plan expected the service worker to show up in the second command, but it lives under `public/`, outside that pathspec; the whole-repo grep confirms the SW condition and the `proxy.ts` matcher exclusion (out of scope) are the only hits. Only comments mention `next/image`.

Task 2, run at d3f4cdc:

```
$ git grep -n -E "TILT_CONFIG|cssDuration|cssEase|kebab" -- app components lib e2e scripts data
lib/__tests__/motion-tokens.test.ts:8:import { DURATION, EASING, cssDuration, cssEase } from '@/lib/animations';
lib/__tests__/motion-tokens.test.ts:26:  test("cssDuration('fast') returns the CSS variable reference", () => {
lib/__tests__/motion-tokens.test.ts:27:    expect(cssDuration('fast')).toBe('var(--duration-fast)');
lib/__tests__/motion-tokens.test.ts:30:  test("cssEase('descent') returns the CSS variable reference", () => {
lib/__tests__/motion-tokens.test.ts:31:    expect(cssEase('descent')).toBe('var(--ease-descent)');
lib/animations.ts:41:const kebab = (k: string) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
lib/animations.ts:44:export function cssDuration(k: keyof typeof DURATION): string {
lib/animations.ts:45:  return `var(--duration-${kebab(k)})`;
lib/animations.ts:49:export function cssEase(k: keyof typeof EASING): string {
lib/animations.ts:50:  return `var(--ease-${kebab(k)})`;
lib/animations.ts:54:export const TILT_CONFIG = {
```

Every hit is the definition itself or the helper test. A whole-repo grep outside `.planning` gave the same lines.

## Task Commits

1. **Task 1: Remove the runtime-facing dead config** - `6ff759d` (refactor)
2. **Task 2: Remove the test-only motion helpers and TILT_CONFIG** - `d69b42c` (refactor)

For 13-15's per-commit zero-diff check: `node scripts/ci/check-snapshot-commit.mjs --sha 6ff759d --none` and `--sha d69b42c --none`.

## Verification results

| Check | Result |
|---|---|
| `grep -c -E "deviceSizes\|imageSizes\|minimumCacheTTL\|qualities" next.config.ts` | 0 (HEAD before: 4) |
| `grep -c "destination === 'image'" public/service-worker.js` | 1 |
| `grep -c 'rel="prefetch"' app/layout.tsx` | 2 before, 2 after |
| SW media + navigation jest | 33 passed |
| `npm run build` (after Task 1, and again after Task 2) | exit 0, no "Failed to compile", no config validation error |
| `npx jest lib/__tests__/motion-tokens.test.ts` | 11 passed |
| Negative `git grep` over lib, app, public, next.config.ts | no output (HEAD before: 10 lines) |
| `npm run type-check` | exit 0 |
| Full jest + `npm run guard:tests` | 104 suites, 1730 tests passed; jest 1730 + e2e 556 = 2286 vs baseline 2243, OK |
| `jest-results.json` | deleted after the check, not committed |

The build prints a "Custom Cache-Control headers detected" warning for `/_next/static/:path*`; that comes from the unchanged `headers()` block and predates this plan.

## Files Created/Modified

- `next.config.ts` - images block and its trailing whitespace line removed
- `public/service-worker.js` - image branch condition reduced to the destination check
- `app/layout.tsx` - vercel.com dns-prefetch link and its comment removed
- `lib/animations.ts` - kebab, cssDuration, cssEase and TILT_CONFIG removed
- `lib/__tests__/motion-tokens.test.ts` - helper import and the 2-test helper describe removed

## Decisions Made

- The two removals are separate commits so 13-15 can run `check-snapshot-commit --none` on each.
- `proxy.ts` keeps `_next/image` in its matcher exclusion, as the plan scoped it out; with no `next/image` caller the exclusion is inert.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Each `next build` ran the postbuild hash injection, which rewrote `public/service-worker.js`. The edited source was backed up before the first build and restored after it, so commit 6ff759d holds only the intended one-condition change (`BUILD_HASH` stays `'__BUILD_HASH__'`). After the second build the file was restored with `git checkout -- public/service-worker.js`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CLEAN-01's app side is done; the two commented CI steps are 13-07's. The pixel proof for commits 6ff759d and d69b42c belongs to 13-15, against the current 1.64.1 baselines before the Playwright bump.
- No `next start` or `next dev` was started.

## Self-Check: PASSED

- All five modified files exist on disk.
- Commits 6ff759d and d69b42c are ancestors of HEAD; `git rev-list --count d3f4cdc..HEAD` = 2.

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
