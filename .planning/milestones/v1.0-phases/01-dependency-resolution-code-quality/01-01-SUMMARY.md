---
phase: 01-dependency-resolution-code-quality
plan: 01
subsystem: infra, testing
tags: [npm, typescript, legacy-peer-deps, type-safety, jsdoc]

# Dependency graph
requires:
  - phase: none
    provides: n/a
provides:
  - Clean npm config without legacy-peer-deps workarounds
  - Type-safe components and test mocks (zero any types in target files)
  - HighlightValue recursive type for project highlights data
  - JSDoc on exported components and props
affects: [01-02, phase-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Conditional rendering to avoid union type any (ParticleButton)"
    - "Recursive type aliases for nested data (HighlightValue)"
    - "Type-safe mock factories in tests with index signatures"

key-files:
  created: []
  modified:
    - .npmrc
    - vercel.json
    - .github/workflows/ci.yml
    - components/ParticleButton.tsx
    - components/MountainTerrain3D.tsx
    - components/ProjectHighlights.tsx
    - data/types.ts
    - app/api/__tests__/feedback.test.ts
    - components/__tests__/GalleryGrid.test.tsx

key-decisions:
  - "HighlightValue defined in data/types.ts (not component file) to avoid circular deps"
  - "ParticleButton uses conditional rendering (separate button/anchor returns) instead of dynamic Component variable"
  - "Test mock factories use Partial<T> & Record<string, unknown> for flexibility with type safety"

patterns-established:
  - "Shared types go in data/types.ts, components import from there"
  - "JSDoc on exported functions and props interfaces, internal code stays comment-free"

# Metrics
duration: 10min
completed: 2026-02-16
---

# Phase 1 Plan 1: Legacy-peer-deps Removal and Type Safety Summary

**Removed all legacy-peer-deps workarounds from 3 config files and replaced 7 any types across 6 files with specific TypeScript types**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-16T19:56:58Z
- **Completed:** 2026-02-16T20:07:27Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Eliminated legacy-peer-deps from .npmrc, vercel.json, and CI workflow (4 occurrences)
- Clean npm install succeeds without --legacy-peer-deps flag, confirming React 19 peer deps are resolved
- All 7 documented any types replaced: HighlightValue recursive type, MotionValue<number>, conditional rendering, typed test mocks
- JSDoc comments added to ParticleButton, MountainTerrain3D, ProjectHighlights, and ProjectHighlightsProps
- npm run type-check passes with zero errors; all 63 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove legacy-peer-deps from all configs** - `93f577e` (chore)
2. **Task 2: Replace all any types with specific TypeScript types** - `078dc5a` (feat)

## Files Created/Modified
- `.npmrc` - Removed legacy-peer-deps=true
- `vercel.json` - Changed installCommand to plain npm install
- `.github/workflows/ci.yml` - Replaced 4x npm ci --legacy-peer-deps with npm ci
- `data/types.ts` - Added HighlightValue type, updated Project.highlights field
- `components/ParticleButton.tsx` - Replaced props: any with conditional rendering, added JSDoc
- `components/MountainTerrain3D.tsx` - Typed scrollProgress as MotionValue<number>, added JSDoc
- `components/ProjectHighlights.tsx` - Imported HighlightValue, typed highlights/renderValue, added JSDoc
- `app/api/__tests__/feedback.test.ts` - Added FeedbackRequestBody interface, typed mock factory
- `components/__tests__/GalleryGrid.test.tsx` - Typed mock component props with specific interfaces

## Decisions Made
- Defined HighlightValue in data/types.ts rather than ProjectHighlights.tsx to prevent circular dependency (component imports from data layer, not vice versa)
- Used conditional rendering pattern for ParticleButton (separate `<a>` and `<button>` returns) to eliminate the need for a union type variable
- Used `Partial<FeedbackRequestBody> & Record<string, unknown>` for test mock factory to allow both valid and invalid data while maintaining type safety

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- npm install on Windows produced tar extraction warnings for @sinclair/typebox and next package, requiring a targeted reinstall of next to get clean type declarations. This is a known Windows npm issue, not related to legacy-peer-deps removal.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Config files are clean, ready for CI to run without workarounds
- Type safety foundation established, ready for Plan 02 (image optimization)
- All 63 existing tests continue to pass

## Self-Check: PASSED

All 9 modified files verified on disk. Both task commits (93f577e, 078dc5a) verified in git log.

---
*Phase: 01-dependency-resolution-code-quality*
*Completed: 2026-02-16*
