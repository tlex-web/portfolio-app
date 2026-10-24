# Portfolio App Scripts

This directory contains utility scripts for maintaining and optimizing the portfolio application.

## Available Scripts

### Data pipeline (local generators, committed outputs)

The generators below need inputs that CI does not have (the photo originals, the network), so their write mode runs only on Tim's machine and their outputs are committed. `npm run data:check`, the last step of `npm run lint`, re-checks every committed output in CI without those inputs:

```bash
npm run data:check   # terrain:build -- --check && photos:exif -- --check && photos:derive -- --check
```

| Script | Reads (local) | Writes (committed) |
|--------|---------------|--------------------|
| `photos:exif` (`photos/extract-exif.mjs`) | originals in `assets/photos-original/` (gitignored, never committed; D-09) | `data/photos/exif-sidecar.json` (EXIF facts, sha256 per original, GPS rounded to 4 decimals) |
| `photos:derive` (`photos/build-derivatives.mjs`) | the originals and the sidecar | `public/images/photos/<id>-<edge>.<hash>.<ext>` and `data/generated/image-manifest.ts` |
| `terrain:fetch` (`terrain/fetch-dem.mjs`) | swisstopo STAC + COG over the network (manual, never in CI) | `data/terrain/source/dem-10m.png` and `source.json` |
| `terrain:build` (`terrain/build-terrain.mjs`) | the committed DEM source | `public/terrain/*` and `data/generated/terrain.ts` |

Nothing image-related runs at build time: there is no `prebuild` step, so a Vercel build needs neither the originals nor full-resolution copies (D-11).

**After adding or editing a photo:**

```bash
# 1. Put the original (an sRGB JPEG) in assets/photos-original/
npm run photos:exif     # refresh the sidecar (sha256, EXIF facts)
npm run photos:derive   # hashed AVIF/WebP at 640/1024/1600/2560 + one 1200 JPEG, image manifest
npm run data:check      # what CI runs
# 2. Commit the sidecar, public/images/photos/ and data/generated/image-manifest.ts. Never commit an original.
```

**`photos:derive`** rotates each original from its EXIF orientation, resizes it on the long edge without enlarging it (at most 2560 px, D-13) and encodes it with sharp's default output, which keeps no EXIF, XMP, IPTC or ICC data. The script never calls a metadata-retaining sharp method, because those re-leak the GPS block. It refuses an original that is not sRGB (dropping the ICC profile must stay colour-neutral) and an original whose sha256 differs from the sidecar (run `photos:exif` first). Each file name carries the first 10 hex characters of the sha256 of its bytes. Lossy encoders are not byte-stable across platforms, so the committed files are authoritative. Write mode deletes stale files in `public/images/photos/` and builds the manifest from the files on disk and the sidecar.

`photos:derive -- --check` needs no originals. It fails when a manifest file is missing, its name hash does not match its bytes, its format or size differs from the manifest, or it carries EXIF, XMP, IPTC, ICC or an orientation tag; when a file in `public/images/photos/` is not in the manifest; when a legacy path is missing; when a `sourceSha256` differs from the sidecar's sha256 (derivatives built from an older original); or when the manifest text differs from a rebuild from disk and the sidecar.

The manifest (`imageManifest`) is the single source of image paths (DATA-08). The legacy `-large` / `-thumb` files in `public/images/optimized/` stay until Phase 12 and are reached through each entry's `legacy` block.

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
