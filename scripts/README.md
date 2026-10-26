# Portfolio App Scripts

This directory contains utility scripts for maintaining and optimizing the portfolio application.

## Available Scripts

### Data pipeline (local generators, committed outputs)

The generators below need inputs that CI does not have (the photo originals, the network), so their write mode runs only on Tim's machine and their outputs are committed. `npm run data:check`, the last step of `npm run lint`, re-checks every committed output in CI without those inputs:

```bash
npm run data:check   # terrain:build -- --check && photos:exif -- --check && photos:derive -- --check && photos:build -- --check && tokens:build -- --check
```

| Script | Reads (local) | Writes (committed) |
|--------|---------------|--------------------|
| `photos:exif` (`photos/extract-exif.mjs`) | originals in `assets/photos-original/` (gitignored, never committed; D-09) | `data/photos/exif-sidecar.json` (EXIF facts, sha256 per original, GPS rounded to 4 decimals) |
| `photos:derive` (`photos/build-derivatives.mjs`) | the originals and the sidecar | `public/images/photos/<id>-<edge>.<hash>.<ext>` and `data/generated/image-manifest.ts` |
| `photos:build` (`photos/build-photo-data.mjs`) | the sidecar, `data/photos/corrections.json` and the committed DEM source (no originals) | `data/generated/photos.ts` (capture, position, DEM height, UV, exposure and tags per photo) |
| `terrain:fetch` (`terrain/fetch-dem.mjs`) | swisstopo STAC + COG over the network (manual, never in CI) | `data/terrain/source/dem-10m.png` and `source.json` |
| `terrain:build` (`terrain/build-terrain.mjs`) | the committed DEM source | `public/terrain/*`, `data/generated/terrain.ts` and `data/generated/precache.json` (the URLs the service worker precaches) |
| `tokens:build` (`tokens/build-tokens.mjs`) | `app/globals.css` | `data/generated/tokens.ts` (the shader colour tokens) |

Nothing image-related runs at build time: there is no `prebuild` step, so a Vercel build needs neither the originals nor full-resolution copies (D-11).

**After adding or editing a photo:**

```bash
# 1. Put the original (an sRGB JPEG) in assets/photos-original/
npm run photos:exif     # refresh the sidecar (sha256, EXIF facts)
npm run photos:derive   # hashed AVIF/WebP at 640/1024/1600/2560 + one 1200 JPEG, image manifest
npm run photos:build    # typed photo facts (data/generated/photos.ts) from the sidecar and corrections
npm run data:check      # what CI runs
# 2. Commit the sidecar, public/images/photos/, data/generated/image-manifest.ts and
#    data/generated/photos.ts. Never commit an original.
```

**`photos:build`** fails the build, rather than publish a wrong fact, when a position lies outside the DEM extent (no pin or height can be placed off the sheet), when a recorded EXIF `OffsetTimeOriginal` is not the derived Europe/Zurich offset, or when a `corrections.json` position is not `hand-placed`. A GPS fix without an altitude keeps its latitude and longitude; heights come from the DEM.

**`photos:derive`** rotates each original from its EXIF orientation, resizes it on the long edge without enlarging it (at most 2560 px, D-13) and encodes it with sharp's default output, which keeps no EXIF, XMP, IPTC or ICC data. The script never calls a metadata-retaining sharp method, because those re-leak the GPS block. It refuses an original that is not sRGB (dropping the ICC profile must stay colour-neutral) and an original whose sha256 differs from the sidecar (run `photos:exif` first). Each file name carries the first 10 hex characters of the sha256 of its bytes. Lossy encoders are not byte-stable across platforms, so the committed files are authoritative. Write mode encodes everything in memory, builds and validates the manifest from those buffers, only then writes the files and the manifest, and deletes stale files in `public/images/photos/` last, so a failed run leaves the committed files untouched.

`photos:derive -- --check` needs no originals. It fails when a manifest file is missing, its name hash does not match its bytes, its format or size differs from the manifest, or it carries EXIF, XMP, IPTC, ICC or an orientation tag; when a file in `public/images/photos/` is not in the manifest; when a legacy path is missing; when a `sourceSha256` differs from the sidecar's sha256 (derivatives built from an older original); or when the manifest text differs from a rebuild from disk and the sidecar.

The manifest (`imageManifest`) is the single source of image paths (DATA-08). The legacy `-large` / `-thumb` files in `public/images/optimized/` stay until Phase 12 and are reached through each entry's `legacy` block.

## Guards (`scripts/guards/`)

CI guards that run in `npm run lint` (`eslint . && guard:parity && guard:palette && guard:contrast && guard:identity && guard:selftest && data:check && guard:images`). Each guard prints one line per violation and exits 1 on any failure. `selftest.mjs` runs every guard against the fixtures in `scripts/guards/__selftest__/` and proves that each one can fail.

### `check-palette.mjs` (GUARD-04)

Raw-text scan of `app/`, `components/`, `lib/`, `data/` and `e2e/` (every `__tests__` included), so object maps, template literals, tests and CSS `@apply` are covered.

| Rule | Fails on |
|------|----------|
| `dark` | any `dark:` variant |
| `stock` | any stock Tailwind palette class (`bg-red-500`, `hover:text-cyan-400/50`, ...) |
| `variant` | a `@custom-variant dark` line in CSS |
| `wb` | a file's `white`/`black` utility count differing from `palette-ratchet.json` (absent entry = 0) |
| `png` | a `.png` under `e2e/` that does not end in `-linux.png` |
| `v1names` | a v1 alias name (`frost-500`, ...) in any scanned file (the v1 dead files are exempt only while nothing imports them) |
| `emoji` | emoji in `.ts/.tsx/.js/.mjs` (©, ®, ™ and ❯ allowed; ✓ ✔ ✗ ✘ banned); skipped in lint until plan 07-25 |

```bash
npm run guard:palette                     # read-only check (never writes the ratchet)
npm run guard:palette -- --update         # record lower white/black counts
node scripts/guards/check-palette.mjs --root <dir> [--ratchet <file>] [--skip <rule,...>]
```

The ratchet only goes down: a higher count fails, a lower count fails until `--update` records it, and `--update` refuses to raise any count. Never raise a count or add an exemption to make the guard pass.

### `check-contrast.mjs` (GUARD-05)

Reads every token from `app/globals.css` (`:root` and all `@theme` blocks), resolves `var()` chains and measures 32 pairs (the 28 UI-SPEC pairs plus 4 `accent-strong` pairs) with `colorjs.io` (`contrast(…, 'WCAG21')`): text pairs need 4.5:1, non-text pairs (focus, line-strong) 3:1, compared as raw floats. An unknown `--color-*` token, a missing pair token, an alpha token in a measured pair or a file without token blocks fails. v1 alias tokens are skipped; `line` and `contour` are decorative and exempt. Adding a semantic token means adding it and its pairs to the script in the same commit.

```bash
npm run guard:contrast
node scripts/guards/check-contrast.mjs --css <file>
```

This replaces the old `verify-contrast.mjs` postbuild step, which checked a hand-copied hex table.

### `check-served-images.mjs` (DATA-05)

Keeps photo originals and their GPS out of the repository and out of what is served. In repo mode it scans every tracked image anywhere in the repo (`git ls-files`, case-insensitive): `.jpg`, `.jpeg`, `.jfif`, `.png`, `.webp`, `.avif`, `.gif`, `.tif`, `.tiff`, `.heic`, `.heif`, `.jxl`, `.bmp`, `.svg` and the camera raws `.dng`, `.cr2`, `.cr3`, `.nef`, `.arw`. The `__selftest__` fixtures are excluded; with `--root <dir>` it walks a fixture folder instead.

| Rule | Fails on |
|------|----------|
| `metadata` | a raster with EXIF, XMP or IPTC, or one sharp cannot read (most raw formats fail here) |
| `oversize` | a raster under `public/` above 2560 px on its long edge (D-13) |
| `orientation` | an image under `public/` with an orientation tag |
| `hash-name` | a file in `public/terrain/` or `public/images/photos/` whose name hash is not the first 10 hex of its sha256 |
| `orphan` / `missing` | a hashed file no generated manifest lists, or a manifest URL with no file |
| `svg-content` | an SVG under `public/` with a script element, an `on*=` handler, an `href` or a `foreignObject` |
| `metadata-call` | a `scripts/photos/` or `scripts/terrain/` source calling a metadata-keeping sharp method |

```bash
npm run guard:images
node scripts/guards/check-served-images.mjs --root <dir>
```

It runs in `npm run lint` and CI, so it catches a committed original only after the push; there is no pre-commit hook. Never stage `assets/photos-original/` or `public/images/landscapes/` (both gitignored).

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
