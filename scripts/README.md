# Portfolio App Scripts

This directory contains utility scripts for maintaining and optimizing the portfolio application.

## Available Scripts

### `optimize-images.mjs`

Image optimization script that converts and compresses images for production use.

**Purpose:** Reduces image file sizes by 85-90% while maintaining visual quality, improving page load times from 500ms+ to <150ms.

**Usage:**
```bash
# Basic usage (optimizes all images in public/images/landscapes/)
npm run optimize-images

# Custom input directory
node scripts/optimize-images.mjs --input ./path/to/images

# Custom output directory
node scripts/optimize-images.mjs --output ./public/images/custom

# Custom quality (default: 85)
node scripts/optimize-images.mjs --quality 80

# Combine options
node scripts/optimize-images.mjs --input ./photos --output ./optimized --quality 90
```

**What It Does:**
1. Converts images to WebP format (30-50% smaller than JPEG)
2. Generates multiple responsive sizes:
   - Thumbnail: 400px width
   - Medium: 1200px width
   - Large: 2400px width
   - Original: Full size, optimized
3. Creates JPEG fallbacks for browser compatibility
4. Preserves EXIF metadata (camera settings, dates)
5. Generates optimization manifest with statistics

**Output:**
```
public/images/optimized/
├── IMG_0605-Enhanced-thumb.webp (150 KB)
├── IMG_0605-Enhanced-thumb.jpg (250 KB)
├── IMG_0605-Enhanced-medium.webp (800 KB)
├── IMG_0605-Enhanced-medium.jpg (1.2 MB)
├── IMG_0605-Enhanced-large.webp (2.5 MB)
├── IMG_0605-Enhanced-large.jpg (4.0 MB)
└── optimization-manifest.json
```

**Requirements:**
- Node.js 18+
- `sharp` package (automatically installed with `npm install`)

**Configuration:**
Edit the `CONFIG` object in `optimize-images.mjs`:
```javascript
const CONFIG = {
  quality: {
    webp: 85,  // WebP quality (0-100)
    jpeg: 85,  // JPEG quality (0-100)
  },
  sizes: {
    thumbnail: { width: 400, suffix: '-thumb' },
    medium: { width: 1200, suffix: '-medium' },
    large: { width: 2400, suffix: '-large' },
  },
  formats: ['webp', 'jpeg'],
  preserveMetadata: true,
};
```

**Performance Impact:**
- **Before:** 51-77 MB per image
- **After:** 2-5 MB per image (90% reduction)
- **Page Load:** 500ms+ → <150ms (70% improvement)
- **LCP:** 4-6s → <2.5s (60% improvement)

**Troubleshooting:**

*Error: Cannot find module 'sharp'*
```bash
npm install
```

*Error: ENOENT: no such file or directory*
```bash
# Ensure input directory exists
mkdir -p public/images/landscapes
```

*Images look too compressed*
```bash
# Increase quality
node scripts/optimize-images.mjs --quality 95
```

*Need to re-optimize after changes*
```bash
# Delete optimized folder and re-run
rm -rf public/images/optimized
npm run optimize-images
```

## Guards (`scripts/guards/`)

CI guards that run in `npm run lint` (`eslint . && guard:parity && guard:palette && guard:contrast && guard:selftest`). Each guard prints one line per violation and exits 1 on any failure. `selftest.mjs` runs every guard against the fixtures in `scripts/guards/__selftest__/` and proves that each one can fail.

### `check-palette.mjs` (GUARD-04)

Raw-text scan of `app/`, `components/`, `lib/`, `data/` and `e2e/` (every `__tests__` included), so object maps, template literals, tests and CSS `@apply` are covered.

| Rule | Fails on |
|------|----------|
| `dark` | any `dark:` variant |
| `stock` | any stock Tailwind palette class (`bg-red-500`, `hover:text-cyan-400/50`, ...) |
| `variant` | a `@custom-variant dark` line in CSS |
| `wb` | a file's `white`/`black` utility count differing from `palette-ratchet.json` (absent entry = 0) |
| `png` | a `.png` under `e2e/` that does not end in `-linux.png` |
| `v1names` | a v1 alias name (`frost-500`, ...) in `components/site/**`, `components/providers/**`, `data/site.ts` |
| `emoji` | emoji in `.ts/.tsx/.js/.mjs` (©, ®, ™ and ❯ allowed; ✓ ✔ ✗ ✘ banned); skipped in lint until plan 07-25 |

```bash
npm run guard:palette                     # read-only check (never writes the ratchet)
npm run guard:palette -- --update         # record lower white/black counts
node scripts/guards/check-palette.mjs --root <dir> [--ratchet <file>] [--skip <rule,...>]
```

The ratchet only goes down: a higher count fails, a lower count fails until `--update` records it, and `--update` refuses to raise any count. Never raise a count or add an exemption to make the guard pass.

### `check-contrast.mjs` (GUARD-05)

Reads every token from `app/globals.css` (`:root` and all `@theme` blocks), resolves `var()` chains and measures the 28 UI-SPEC pairs with `colorjs.io` (`contrast(…, 'WCAG21')`): text pairs need 4.5:1, non-text pairs (focus, line-strong) 3:1, compared as raw floats. An unknown `--color-*` token, a missing pair token, an alpha token in a measured pair or a file without token blocks fails. v1 alias tokens are skipped; `line` and `contour` are decorative and exempt. Adding a semantic token means adding it and its pairs to the script in the same commit.

```bash
npm run guard:contrast
node scripts/guards/check-contrast.mjs --css <file>
```

This replaces the old `verify-contrast.mjs` postbuild step, which checked a hand-copied hex table.

### Other guards

- `check-install-parity.mjs` (`guard:parity`): npm ci everywhere, Node 24 pins, Playwright image matches the lockfile, version floors.
- `test-count.mjs` (`guard:tests`, CI unit job): the test count may only go up; no skipped or focused tests.
- `same-classnames.mjs`: proves a refactor left every `className` literal unchanged.

## Adding New Scripts

To add a new utility script:

1. Create the file: `scripts/your-script-name.mjs`
2. Add shebang: `#!/usr/bin/env node`
3. Add to package.json:
   ```json
   "scripts": {
     "your-script": "node scripts/your-script-name.mjs"
   }
   ```
4. Document it in this README

## Related Documentation

- **OPTIMIZATION_QUICKSTART.md** - Step-by-step implementation guide
- **PERFORMANCE_OPTIMIZATION.md** - Detailed performance analysis
- **DEPLOYMENT.md** - Production deployment instructions
