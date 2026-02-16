# Phase 1: Dependency Resolution & Code Quality - Research

**Researched:** 2026-02-16
**Domain:** npm dependency management, TypeScript strict mode, sharp image processing
**Confidence:** HIGH

## Summary

The dependency situation is significantly better than expected. A fresh `npm install` (without `--legacy-peer-deps`) succeeds with exit code 0, zero peer dependency warnings, and zero vulnerabilities. All major packages -- including React Three Fiber 9.5.0, drei 10.7.7, react-spring/three 10.0.3, Three.js 0.182.0, framer-motion 12.34.0, and Next.js 16.1.6 -- already declare React 19 compatibility. The primary work is removing the `legacy-peer-deps=true` flag from `.npmrc`, `vercel.json`, and 4 CI workflow steps, then validating the build still passes.

TypeScript strict mode is already enabled in `tsconfig.json`. The `any` type instances are confined to 6 locations across 4 files (ParticleButton, MountainTerrain3D, ProjectHighlights, feedback test, plus 2 in GalleryGrid test mocks). Each has a clear fix path. The image optimization script already exists and works with sharp 0.34.5, but needs AVIF output added and responsive sizes updated to match the user's requirements (640, 1024, 1920). The source `landscapes/` directory no longer exists -- only pre-optimized images in `public/images/optimized/`.

**Primary recommendation:** This phase is smaller than originally scoped. Focus on (1) removing `legacy-peer-deps` from all configs, (2) fixing the 6 `any` types, (3) adding AVIF format and updated responsive sizes to the existing optimize-images script, and (4) wiring it as a pre-build step.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Claude decides per-case whether to upgrade, replace, or work around incompatible packages
- Three.js / React Three Fiber ecosystem must be kept -- work around React 19 issues rather than replacing
- If a major version bump changes a package's API, Claude migrates usage but flags changes for user review
- Reasonable new dev dependencies are welcome if they meaningfully improve DX or catch bugs -- no bloat
- Generate both WebP and AVIF formats -- AVIF for modern browsers, WebP as fallback
- Balanced quality/size trade-off -- good visual quality without excessive file sizes
- Generate responsive sizes (e.g., 640, 1024, 1920 widths) for srcset, not just optimize originals
- Optimized images committed to repo (faster builds, versioned assets)
- Fix all documented `any` types (ParticleButton, MountainTerrain3D, ProjectHighlights, feedback test)
- Enable strict mode incrementally -- turn it on but use path-based exclusions for files that need more work
- Three.js/R3F components: best-effort typing -- specific types where reasonable, don't fight Three.js typing quirks
- Add JSDoc comments on exported functions and component props; internal code stays comment-free
- If fixing a type reveals a latent bug, fix it inline -- don't leave known issues

### Claude's Discretion
- Specific TypeScript compiler options beyond `strict`
- Which files get path-based exclusions initially
- Exact responsive image breakpoints and compression quality values
- Choice of image processing library
- Package-by-package upgrade vs replace decisions (within the constraints above)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| react | 19.2.4 | UI framework | Compatible, no changes needed |
| next | 16.1.6 | Framework | Compatible, no changes needed |
| three | 0.182.0 | 3D rendering | Compatible |
| @react-three/fiber | 9.5.0 | React-Three.js bridge | React 19 compatible |
| @react-three/drei | 10.7.7 | R3F helpers | React 19 compatible |
| @react-spring/three | 10.0.3 | 3D animations | React 19 compatible |
| framer-motion | 12.34.0 | Animations | React 19 compatible |
| sharp | 0.34.5 | Image processing | AVIF + WebP supported |
| typescript | 5.9.3 | Type checking | Strict mode already enabled |
| zod | 4.3.6 | Schema validation | No issues |

### Supporting (No Changes Needed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| @types/react | 19.2.14 | React types | Current |
| @types/react-dom | 19.2.3 | ReactDOM types | Current |
| eslint | 9.39.2 | Linting | Working |
| jest | 30.2.0 | Testing | Working |

### Alternatives Considered
None needed -- the current stack is fully compatible with React 19.

**Installation:** No new packages required. Current `package.json` is correct as-is.

## Architecture Patterns

### Current Project Structure (Relevant)
```
.npmrc                           # Contains legacy-peer-deps=true (REMOVE)
vercel.json                      # Contains --legacy-peer-deps in installCommand (FIX)
.github/workflows/ci.yml         # 4 steps use --legacy-peer-deps (FIX)
tsconfig.json                    # strict: true already set
scripts/optimize-images.mjs      # Exists, needs AVIF + updated sizes
components/ParticleButton.tsx    # 1 any type (line 201)
components/MountainTerrain3D.tsx # 1 any type (line 11)
components/ProjectHighlights.tsx # 2 any types (lines 6, 11)
app/api/__tests__/feedback.test.ts  # 1 any type (line 34)
components/__tests__/GalleryGrid.test.tsx # 2 any types (lines 9, 18)
data/types.ts                    # 1 Record<string, any> (line 43)
```

### Pattern 1: Removing legacy-peer-deps
**What:** Delete `.npmrc` content, update `vercel.json` installCommand, update CI workflow
**Where it lives:**
- `.npmrc` -- line 1: `legacy-peer-deps=true`
- `vercel.json` -- line 5: `"installCommand": "npm install --legacy-peer-deps"`
- `.github/workflows/ci.yml` -- lines 27, 51, 82, 123: `npm ci --legacy-peer-deps`

**Verification:** `rm -rf node_modules package-lock.json && npm install` exits 0 with no peer dep warnings (already verified during research).

### Pattern 2: TypeScript Any-Type Fixes
**What:** Replace each `any` with a specific type
**Key insight:** tsconfig.json already has `"strict": true`. The `any` types exist despite strict mode because they were intentionally written as `any`, not inferred.

### Pattern 3: Image Optimization Script Enhancement
**What:** Update `scripts/optimize-images.mjs` to add AVIF output and adjust responsive sizes
**Current state:** Script generates WebP + JPEG at sizes 400/1200/2400. Needs AVIF added and sizes changed to 640/1024/1920.
**Note:** Source `landscapes/` directory no longer exists. Only `public/images/optimized/` has images. The script input path may need adjustment, or original images need to be restored.

### Anti-Patterns to Avoid
- **Using `npm overrides` for peer deps:** Not needed here since all packages are already compatible. Overrides would add unnecessary complexity.
- **Creating a `tsconfig.strict.json` alongside `tsconfig.json`:** Just use the existing `tsconfig.json` which already has strict mode. Add path-based exclusions via the `exclude` array if needed.
- **Running `npm install --force`:** Bypasses all safety checks. The clean install already works without any flags.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image format conversion | Custom ffmpeg/libvips wrapper | sharp 0.34.5 `.avif()` / `.webp()` | Sharp already installed, handles AVIF/WebP natively with libvips |
| Recursive type for highlights | Complex generic utility types | `HighlightValue` recursive union type | Simple union of primitives, arrays, and nested records covers all cases |
| Mock request typing in tests | Custom mock class | `Partial<NextRequest>` with `as unknown as NextRequest` | Standard test pattern, already used |

## Common Pitfalls

### Pitfall 1: sharp Platform Binary Missing
**What goes wrong:** `npm install` downloads sharp but the platform-specific binary for win32-x64 is missing, causing `Could not load the "sharp" module using the win32-x64 runtime`
**Why it happens:** Omitting optional dependencies during install (e.g., `--no-optional` flag) or lockfile generated on a different platform
**How to avoid:** Use `npm install --include=optional sharp` if the standard install doesn't pick up the binary. Ensure the lockfile is regenerated on the target platform.
**Warning signs:** Error when running `node scripts/optimize-images.mjs` -- the error message is very clear and includes solution steps.

### Pitfall 2: picomatch/fdir Version Mismatch Warning
**What goes wrong:** `npm ls --all` shows `picomatch@2.3.1 invalid: "^3 || ^4" from node_modules/fdir` deep in the tree
**Why it happens:** Transitive dependency conflict between `tinyglobby` (used by `@typescript-eslint`) and `anymatch` (used by Jest's `jest-haste-map`). Both pull in picomatch but at different version ranges.
**How to avoid:** This is a cosmetic issue. `npm ls` (without `--all`) shows zero issues. The `npm install` exit code is 0. Do NOT try to fix this with overrides -- it will resolve naturally as upstream packages update.
**Warning signs:** Only visible in `npm ls --all` output. Does not affect functionality.

### Pitfall 3: Missing Source Images for Optimization
**What goes wrong:** The optimize-images script expects source images in `public/images/landscapes/` but that directory no longer exists. Only optimized images remain in `public/images/optimized/`.
**Why it happens:** Source images were likely removed after initial optimization to save repo space.
**How to avoid:** Either (a) treat existing optimized JPEGs as the new source and re-process them for AVIF, or (b) ask the user to restore original images. Option (a) is pragmatic but loses quality from double-compression.
**Warning signs:** Script exits with "No images found in input directory" error.

### Pitfall 4: AVIF Encoding Performance
**What goes wrong:** AVIF encoding is significantly slower than WebP or JPEG (can be 10-50x slower depending on effort level).
**Why it happens:** AV1 codec is computationally expensive. Default effort of 4 is a reasonable balance.
**How to avoid:** Keep AVIF effort at 4 (default). For 4 images at 3 sizes each, total encoding time should still be under 2 minutes. Use `effort: 4` not maximum `effort: 9`.
**Warning signs:** Build times suddenly 5-10 minutes longer if effort is set too high.

### Pitfall 5: Vercel Build vs Local Build Divergence
**What goes wrong:** Build passes locally but fails on Vercel because `vercel.json` still has `--legacy-peer-deps` or vice versa.
**Why it happens:** Multiple config locations for install commands.
**How to avoid:** Update ALL locations simultaneously: `.npmrc`, `vercel.json`, `.github/workflows/ci.yml`. Test with a clean `rm -rf node_modules package-lock.json && npm install && npm run build` locally.

## Code Examples

Verified patterns from direct codebase investigation:

### Fix 1: ParticleButton.tsx -- Replace `any` props union (line 201)
```typescript
// BEFORE (line 201):
const props: any = href ? { ...commonProps, ref: anchorRef, href } : { ...commonProps, ref: buttonRef, type, disabled };

// AFTER: Use discriminated union or separate render paths
// Option A: Conditional rendering (cleanest)
if (href) {
  return (
    <a ref={anchorRef} {...commonProps} href={href} style={{ position: 'relative', display: 'inline-block' }}>
      {/* particle children */}
    </a>
  );
}
return (
  <button ref={buttonRef} {...commonProps} type={type} disabled={disabled} style={{ position: 'relative', display: 'inline-block' }}>
    {/* particle children */}
  </button>
);

// Option B: Type assertion with union (simpler change)
const anchorProps: React.AnchorHTMLAttributes<HTMLAnchorElement> & { ref: React.RefObject<HTMLAnchorElement | null> } = {
  ...commonProps, ref: anchorRef, href: href!,
};
const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> & { ref: React.RefObject<HTMLButtonElement | null> } = {
  ...commonProps, ref: buttonRef, type, disabled,
};
```

### Fix 2: MountainTerrain3D.tsx -- Replace `scrollProgress: any` (line 11)
```typescript
// BEFORE:
import { useScroll, useTransform } from 'framer-motion';
interface MountainProps {
  scrollProgress: any;
  prefersReducedMotion: boolean;
}

// AFTER:
import { useScroll, useTransform, type MotionValue } from 'framer-motion';
interface MountainProps {
  scrollProgress: MotionValue<number>;
  prefersReducedMotion: boolean;
}
```
**Confidence:** HIGH -- verified `scrollYProgress` returns `MotionValue<number>` from framer-motion type definitions.

### Fix 3: ProjectHighlights.tsx -- Replace `Record<string, any>` (lines 6, 11)
```typescript
// BEFORE:
interface ProjectHighlightsProps {
  highlights: Record<string, any>;
  title?: string;
}
const renderValue = (value: any): React.ReactNode => { ... };

// AFTER: Recursive highlight value type
type HighlightPrimitive = string | number | boolean;
type HighlightValue = HighlightPrimitive | HighlightValue[] | { [key: string]: HighlightValue };

interface ProjectHighlightsProps {
  highlights: Record<string, HighlightValue>;
  title?: string;
}
const renderValue = (value: HighlightValue): React.ReactNode => { ... };
```
**Note:** Must also update `data/types.ts` line 43 from `Record<string, any>` to `Record<string, HighlightValue>`. The `HighlightValue` type should be defined in `data/types.ts` and imported by `ProjectHighlights.tsx`.

### Fix 4: feedback.test.ts -- Replace `body: any` (line 34)
```typescript
// BEFORE:
const createMockRequest = (body: any, headers: Record<string, string> = {}) => {

// AFTER: Use the Zod schema's input type
interface FeedbackRequestBody {
  name: string;
  email: string;
  message: string;
  interestedInCollaboration?: boolean;
}
const createMockRequest = (body: Partial<FeedbackRequestBody> & Record<string, unknown>, headers: Record<string, string> = {}) => {
```
**Note:** Using `Partial` plus `Record<string, unknown>` allows tests to pass invalid data (empty strings, wrong types) which is needed for validation tests.

### Fix 5: GalleryGrid.test.tsx -- Replace mock `any` types (lines 9, 18)
```typescript
// BEFORE (line 9):
default: (props: any) => {

// AFTER:
default: (props: { fill?: boolean; src?: string; alt?: string; [key: string]: unknown }) => {

// BEFORE (line 18):
default: ({ image, onClose }: any) => {

// AFTER:
default: ({ image, onClose }: { image: LandscapeImage | null; onClose: () => void }) => {
```

### AVIF Addition to optimize-images.mjs
```javascript
// Current CONFIG.formats (line 45):
formats: ['webp', 'jpeg'],

// Updated:
formats: ['webp', 'avif', 'jpeg'],

// Current CONFIG.sizes (lines 38-44):
sizes: {
  thumbnail: { width: 400, suffix: '-thumb' },
  medium: { width: 1200, suffix: '-medium' },
  large: { width: 2400, suffix: '-large' },
  original: { width: null, suffix: '' },
},

// Updated per user requirements (640, 1024, 1920):
sizes: {
  small: { width: 640, suffix: '-sm' },
  medium: { width: 1024, suffix: '-md' },
  large: { width: 1920, suffix: '-lg' },
},

// Add AVIF processing block after WebP block (around line 118):
} else if (format === 'avif') {
  processor = processor.clone().avif({
    quality: config.quality.avif || 50,  // AVIF default quality 50 = good balance
    effort: 4,  // 0-9, higher = slower but better compression
  });
}

// Update quality config:
quality: {
  webp: 85,
  avif: 50,  // AVIF is more efficient; quality 50 ≈ JPEG 85
  jpeg: 85,
},
```

### Pre-build Hook in package.json
```json
{
  "scripts": {
    "prebuild": "node scripts/optimize-images.mjs",
    "build": "next build"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `--legacy-peer-deps` everywhere | Clean install without flags | Already works (verified 2026-02-16) | Can remove all workarounds now |
| WebP + JPEG only | WebP + AVIF + JPEG | sharp 0.32+ (2023) | AVIF 20-50% smaller than WebP at same visual quality |
| Fixed image sizes (400/1200/2400) | Responsive sizes (640/1024/1920) | User decision | Better match for common viewport widths |
| `tsconfig.json` strict: false | strict: true (already enabled) | Already done | No change needed, just fix remaining `any` types |

**Note:** The `tsconfig.json` already has `"strict": true`. No incremental enablement needed -- just fix the existing `any` types and add path exclusions if any files prove too hard to type immediately.

## Open Questions

1. **Missing source landscape images**
   - What we know: `public/images/landscapes/` directory does not exist. Only `public/images/optimized/` contains images (WebP + JPEG at old sizes).
   - What's unclear: Whether the originals are available elsewhere or need to be restored from git history.
   - Recommendation: Check git history for the `public/images/landscapes/` directory. If available, restore them as source images. If not, use the existing `-large.jpg` files as source (they are the highest quality available in the repo). Re-processing JPEGs into AVIF/WebP loses minimal quality since they are already high-quality 85% JPEGs.

2. **Pre-build hook vs separate CI step**
   - What we know: CI currently has image optimization commented out (`# - name: Optimize images for build`). Success criteria says "optimize-images.mjs executes as a pre-build step."
   - What's unclear: Whether to use npm `prebuild` script (runs automatically before `npm run build`) or keep as explicit CI step.
   - Recommendation: Use npm `prebuild` script for local development. In CI, the images are committed to the repo so the prebuild step can be a no-op (check if optimized images are already up to date). Add a `--check` flag to the script that exits 0 if images are current, or exits 1 if re-optimization is needed.

3. **GalleryGrid.test.tsx `any` types -- in scope?**
   - What we know: The CONTEXT.md lists "ParticleButton, MountainTerrain3D, ProjectHighlights, feedback test" as documented `any` types. GalleryGrid test also has 2 `any` types.
   - What's unclear: Whether GalleryGrid test mocks are "documented" `any` types or bonus cleanup.
   - Recommendation: Fix them anyway -- they are trivial to type and the eslint rule `@typescript-eslint/no-explicit-any: warn` will flag them. Better to clean up all `any` types while we are at it.

## Sources

### Primary (HIGH confidence)
- Direct codebase investigation: `package.json`, `tsconfig.json`, `.npmrc`, `vercel.json`, `.github/workflows/ci.yml`
- Fresh `npm install` without `--legacy-peer-deps` -- verified exit code 0, zero peer dep warnings (2026-02-16)
- `npm ls --all` -- verified zero UNMET PEER dependencies
- `npx tsc --noEmit` -- verified zero TypeScript errors
- sharp 0.34.5 format check -- confirmed AVIF input/output support (heif 1.20.2, aom 3.13.1)
- framer-motion type definitions -- confirmed `scrollYProgress: MotionValue<number>`

### Secondary (MEDIUM confidence)
- [sharp API output documentation](https://sharp.pixelplumbing.com/api-output) -- AVIF options: quality 1-100 (default 50), effort 0-9 (default 4), chromaSubsampling, bitdepth
- [sharp GitHub issue #4227](https://github.com/lovell/sharp/issues/4227) -- Discussion on AVIF quality defaults

### Tertiary (LOW confidence)
- None -- all findings verified directly

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- verified by direct `npm install` and `npm ls` with zero issues
- Architecture: HIGH -- all files examined directly, types verified against installed package .d.ts files
- Pitfalls: HIGH -- sharp platform issue encountered and resolved during research; picomatch issue observed directly
- Image optimization: MEDIUM -- AVIF quality values are from docs but optimal quality for this specific use case may need visual tuning

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (stable -- no fast-moving dependencies)
