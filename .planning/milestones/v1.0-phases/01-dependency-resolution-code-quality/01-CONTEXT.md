# Phase 1: Dependency Resolution & Code Quality - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Clean dependency tree compatible with React 19, proper TypeScript types across the codebase, and automated image optimization in the build pipeline. No new features — this is infrastructure cleanup that unblocks all subsequent phases.

</domain>

<decisions>
## Implementation Decisions

### Package replacement
- Claude decides per-case whether to upgrade, replace, or work around incompatible packages
- Three.js / React Three Fiber ecosystem must be kept — work around React 19 issues rather than replacing
- If a major version bump changes a package's API, Claude migrates usage but flags changes for user review (comments or notes in PR)
- Reasonable new dev dependencies are welcome if they meaningfully improve DX or catch bugs — no bloat

### Image optimization
- Generate both WebP and AVIF formats — AVIF for modern browsers, WebP as fallback
- Balanced quality/size trade-off — good visual quality without excessive file sizes
- Generate responsive sizes (e.g., 640, 1024, 1920 widths) for srcset, not just optimize originals
- Optimized images committed to repo (faster builds, versioned assets)

### TypeScript strictness
- Fix all documented `any` types (ParticleButton, MountainTerrain3D, ProjectHighlights, feedback test)
- Enable strict mode incrementally — turn it on but use path-based exclusions for files that need more work
- Three.js/R3F components: best-effort typing — specific types where reasonable, don't fight Three.js typing quirks
- Add JSDoc comments on exported functions and component props; internal code stays comment-free
- If fixing a type reveals a latent bug, fix it inline — don't leave known issues

### Claude's Discretion
- Specific TypeScript compiler options beyond `strict`
- Which files get path-based exclusions initially
- Exact responsive image breakpoints and compression quality values
- Choice of image processing library
- Package-by-package upgrade vs replace decisions (within the constraints above)

</decisions>

<specifics>
## Specific Ideas

- Three.js ecosystem is core to the portfolio's identity — prioritize compatibility over replacement
- Flag API migrations for review rather than silently changing behavior

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-dependency-resolution-code-quality*
*Context gathered: 2026-02-16*
