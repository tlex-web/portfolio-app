# Phase 6: Integration Wiring Fixes - Research

**Researched:** 2026-03-12
**Domain:** Next.js middleware wiring, npm package management, npm lifecycle scripts
**Confidence:** HIGH

## Summary

Phase 6 addresses three integration wiring breaks discovered during the v1.0 milestone audit. All three issues share a common pattern: the implementation code is correct but the runtime never invokes it due to naming, dependency, or script configuration errors. The fixes are mechanical -- no new logic needs to be written.

The three breaks are: (1) CSP middleware file named `proxy.ts` instead of `middleware.ts` so Next.js never executes it, (2) `@upstash/ratelimit` and `@upstash/redis` imported in code but never added to `package.json`, and (3) `inject-build-hash.mjs` not wired into the `postbuild` npm script. Additionally, the service worker currently has a stale hardcoded hash (`T5Omvo7bhPVP9HRwZj9-X`) instead of the `__BUILD_HASH__` placeholder, so the placeholder must be restored before the postbuild script can work on future builds.

**Primary recommendation:** A single plan can address all three fixes since they are independent, low-risk changes with clear verification steps.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | Content Security Policy uses nonce-based approach, removing `unsafe-inline` and `unsafe-eval` where possible | Rename `proxy.ts` to `middleware.ts`, export function as `middleware` (not `proxy`), update comment references in `layout.tsx` and `next.config.ts` |
| REL-01 | Rate limiting persists across deployments using Redis/Vercel KV with sliding window algorithm | Install `@upstash/ratelimit` and `@upstash/redis` as production dependencies |
| REL-02 | Service worker cache version is generated from build hash, automatically invalidating stale caches on deployment | Restore `__BUILD_HASH__` placeholder in `service-worker.js`, add `inject-build-hash.mjs` to `postbuild` script |
</phase_requirements>

## Standard Stack

### Core (already in project)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| next | 16.1.6 | Framework (middleware runtime) | Installed, middleware file missing |
| @upstash/ratelimit | latest | Sliding window rate limiting | NOT installed, code exists |
| @upstash/redis | latest | Redis client for Upstash | NOT installed, code exists |

### No New Libraries Needed

All implementation code already exists. This phase only wires existing code into the runtime.

## Architecture Patterns

### Pattern 1: Next.js Middleware File Convention (Next.js 16)

**What:** Next.js requires the middleware entry point to be named `middleware.ts` (or `middleware.js`) at the project root. The exported function MUST be named `middleware` (not `proxy` or anything else). The file `proxy.ts` at the project root currently exports `function proxy()` -- both the filename and export name are wrong.

**Current state:**
```
portfolio_app/
  proxy.ts          <-- WRONG: Next.js ignores this file entirely
  middleware.ts     <-- MISSING: Next.js expects this name
```

**Required changes:**
1. Rename `proxy.ts` to `middleware.ts`
2. Rename the exported function from `proxy` to `middleware`
3. Update comment in `app/layout.tsx` line 32 ("proxy.ts" reference)
4. Update comment in `next.config.ts` line 41 ("proxy.ts" reference)

**Confidence:** HIGH -- Next.js middleware naming convention is well-established and unchanged since Next.js 12.

### Pattern 2: npm Lifecycle Scripts

**What:** npm automatically runs `prebuild` before `build` and `postbuild` after `build`. The project already uses `prebuild` for image optimization. The `postbuild` script currently only runs `verify-contrast.mjs` -- it must also run `inject-build-hash.mjs`.

**Current:**
```json
"postbuild": "node scripts/verify-contrast.mjs"
```

**Required:**
```json
"postbuild": "node scripts/inject-build-hash.mjs && node scripts/verify-contrast.mjs"
```

**Order matters:** `inject-build-hash.mjs` must run first because it modifies `public/service-worker.js` which was just built. `verify-contrast.mjs` is independent and can run after. Using `&&` ensures if hash injection fails, contrast verification is skipped (fail-fast).

**Confidence:** HIGH -- npm lifecycle hooks are stable and well-documented.

### Pattern 3: Service Worker Placeholder Restoration

**What:** The service worker file `public/service-worker.js` currently has a hardcoded stale hash (`T5Omvo7bhPVP9HRwZj9-X`) from a previous manual run. The `__BUILD_HASH__` placeholder must be restored so that `inject-build-hash.mjs` can replace it during each build.

**Current (line 4):**
```javascript
const BUILD_HASH = 'T5Omvo7bhPVP9HRwZj9-X';
```

**Required:**
```javascript
const BUILD_HASH = '__BUILD_HASH__';
```

**Confidence:** HIGH -- verified by reading both `service-worker.js` and `inject-build-hash.mjs`.

### Anti-Patterns to Avoid

- **Modifying the CSP directives while renaming:** The CSP header content is correct as-is (verified in Phase 2). Only the file name and export name need changing.
- **Changing rate-limit.ts logic:** The code is correct. Only the missing npm packages need to be installed.
- **Running inject-build-hash.mjs before next build:** The script reads `.next/BUILD_ID` which only exists after `next build` completes. It must be in `postbuild`, not `prebuild`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limiting | Custom in-memory counter | @upstash/ratelimit (already coded) | Persists across deployments, sliding window algorithm |
| CSP nonce injection | Manual header setting in route handlers | Next.js middleware (already coded) | Runs on every matching request automatically |

## Common Pitfalls

### Pitfall 1: Forgetting to Rename the Export
**What goes wrong:** File renamed to `middleware.ts` but function still exported as `proxy` -- Next.js looks for a named export called `middleware`.
**How to avoid:** Rename both the file AND the exported function.

### Pitfall 2: Service Worker Placeholder Not Restored
**What goes wrong:** `inject-build-hash.mjs` uses `replaceAll('__BUILD_HASH__', buildId)`. If the placeholder is already replaced with a real hash, the script has nothing to replace and the old hash persists forever.
**How to avoid:** Restore `__BUILD_HASH__` placeholder in the committed `service-worker.js`.

### Pitfall 3: Upstash Package Version Mismatch
**What goes wrong:** Installing incompatible versions of `@upstash/ratelimit` and `@upstash/redis`.
**How to avoid:** Install both together: `npm install @upstash/ratelimit @upstash/redis`. The latest versions of both are designed to work together.

### Pitfall 4: Stale Comment References
**What goes wrong:** Comments in `layout.tsx` and `next.config.ts` still reference "proxy.ts" after rename, causing confusion for future developers.
**How to avoid:** Update all comment references from "proxy.ts" to "middleware.ts".

## Code Examples

### Middleware Rename (the key change)

```typescript
// File: middleware.ts (renamed from proxy.ts)
// Only the function name changes, everything else stays the same

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {  // Was: export function proxy(...)
  // ... all existing CSP logic unchanged ...
}

export const config = {
  // ... matcher config unchanged ...
};
```

### Updated postbuild Script

```json
{
  "scripts": {
    "postbuild": "node scripts/inject-build-hash.mjs && node scripts/verify-contrast.mjs"
  }
}
```

### Package Installation

```bash
npm install @upstash/ratelimit @upstash/redis
```

## State of the Art

No technology changes needed. All three fixes use existing, stable patterns:

| Issue | Fix Type | Risk |
|-------|----------|------|
| proxy.ts naming | File rename + export rename | Minimal -- no logic change |
| Missing Upstash packages | npm install | Minimal -- code already imports them |
| postbuild wiring | package.json edit | Minimal -- script already exists and works |

## Open Questions

1. **Should `unsafe-eval` be removed from script-src?**
   - Current CSP includes `'unsafe-eval'` in script-src
   - The requirement says "removing `unsafe-inline` and `unsafe-eval` where possible"
   - Phase 2 decision [02-01] notes it was kept for compatibility
   - Recommendation: Leave as-is for this phase. The goal is to wire the existing CSP, not modify it. Removing `unsafe-eval` could break Three.js/R3F and should be investigated separately.

2. **connect-src uses raw.githack.com AND raw.githubusercontent.com**
   - Phase 2 decision [02-06] corrected to `raw.githubusercontent.com`
   - Current proxy.ts still has both `raw.githack.com` and `raw.githubusercontent.com`
   - Recommendation: During rename, update to match the corrected decision (only `raw.githubusercontent.com`). This is a minor fix that aligns with an existing decision.

## Verification Strategy

Each fix has a clear, automatable verification:

| Fix | Verification |
|-----|-------------|
| middleware.ts rename | File exists at `middleware.ts`, no `proxy.ts` at root. `grep -c "export function middleware" middleware.ts` returns 1 |
| Upstash packages | `npm ls @upstash/ratelimit @upstash/redis` exits 0 (packages in tree) |
| postbuild wiring | `grep "inject-build-hash" package.json` matches in postbuild script |
| SW placeholder | `grep "__BUILD_HASH__" public/service-worker.js` finds the placeholder |
| Comment updates | No remaining references to "proxy.ts" outside node_modules and .planning |

## Files That Need Changes

| File | Change | Type |
|------|--------|------|
| `proxy.ts` -> `middleware.ts` | Rename file, rename export function | Rename + edit |
| `public/service-worker.js` | Replace stale hash with `__BUILD_HASH__` placeholder | Edit (line 4 only) |
| `package.json` | Add `@upstash/ratelimit` and `@upstash/redis` to dependencies; update `postbuild` script | Edit |
| `app/layout.tsx` | Update comment on line 32 from "proxy.ts" to "middleware.ts" | Comment edit |
| `next.config.ts` | Update comment on line 41 from "proxy.ts" to "middleware.ts" | Comment edit |

Total: 5 files, all minor mechanical edits.

## Sources

### Primary (HIGH confidence)
- Project source code: `proxy.ts`, `lib/rate-limit.ts`, `scripts/inject-build-hash.mjs`, `public/service-worker.js`, `package.json`, `app/layout.tsx`, `next.config.ts`
- `.planning/v1.0-MILESTONE-AUDIT.md` -- gap analysis with specific evidence for each break
- `.planning/ROADMAP.md` -- phase definition and success criteria
- `.planning/REQUIREMENTS.md` -- SEC-01, REL-01, REL-02 requirement definitions
- Phase 2 decisions in `.planning/STATE.md` -- CSP, rate limiting, and build hash design choices

### Secondary (MEDIUM confidence)
- Next.js middleware naming convention (stable since Next.js 12, verified against Next.js 16.1.6 installed version)
- npm lifecycle hooks (stable, well-documented)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages and patterns already exist in the codebase
- Architecture: HIGH -- no architectural changes, only wiring fixes
- Pitfalls: HIGH -- each pitfall identified from direct code inspection

**Research date:** 2026-03-12
**Valid until:** Indefinite -- these are wiring fixes, not technology-dependent
