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
