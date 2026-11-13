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

`photos:derive -- --check` needs no originals. It fails when a manifest file is missing, its name hash does not match its bytes, its format or size differs from the manifest, or it carries EXIF, XMP, IPTC, ICC or an orientation tag; when a file in `public/images/photos/` is not in the manifest; when a `sourceSha256` differs from the sidecar's sha256 (derivatives built from an older original); or when the manifest text differs from a rebuild from disk and the sidecar.

The manifest (`imageManifest`) is the only image source (DATA-08): every photo path a component renders comes from it, and it lists only the hashed derivatives in `public/images/photos/`. The v1 `-large` / `-thumb` files and their `public/images/optimized/` folder were deleted in Phase 12 (VERIFY-01), behind `data/__tests__/asset-exists.test.ts`, which fails when any path referenced from `data/` is missing under `public/`.

### Icons

`npm run icons:build` writes `app/favicon.ico` (16, 32 and 48 px) and `app/apple-icon.png` (180 px) from `app/icon.svg`. Run it after editing the SVG and commit the outputs.

## Guards (`scripts/guards/`)

CI guards that run in `npm run lint` (`eslint . && guard:parity && guard:ci && guard:palette && guard:contrast && guard:identity && guard:selftest && data:check && guard:images`). Each guard prints one line per violation and exits 1 on any failure. `selftest.mjs` runs every guard against the fixtures in `scripts/guards/__selftest__/` and proves that each one can fail.

### `check-palette.mjs` (GUARD-04)

Raw-text scan of `app/`, `components/`, `lib/`, `data/` and `e2e/` (every `__tests__` included), so object maps, template literals, tests and CSS `@apply` are covered.

| Rule | Fails on |
|------|----------|
| `dark` | any `dark:` variant |
| `stock` | any stock Tailwind palette class (`bg-red-500`, `hover:text-cyan-400/50`, `border-t-red-500`, `ring-offset-red-500`, `drop-shadow-red-500`, ...), directional borders, ring offsets and the `inset-ring`/`inset-shadow`/`drop-shadow`/`text-shadow` colours included (the `wb` rule reads the same prefixes) |
| `variant` | a `@custom-variant dark` line in CSS |
| `wb` | a file's `white`/`black` utility count differing from `palette-ratchet.json` (absent entry = 0) |
| `png` | a `.png` under `e2e/` that does not end in `-linux.png`, among the files git lists (`git ls-files -co --exclude-standard`: tracked plus untracked, ignored skipped), so the git-ignored `-win32.png` files a local visual run writes do not fail lint; outside a git work tree it walks the disk |
| `v1names` | a v1 alias name (`frost-500`, ...) in any scanned file (the v1 dead files are exempt only while nothing imports them) |
| `emoji` | emoji in `.ts/.tsx/.js/.mjs` (©, ®, ™ and ❯ allowed; ✓ ✔ ✗ ✘ banned) |

```bash
npm run guard:palette                     # read-only check (never writes the ratchet)
npm run guard:palette -- --update         # record lower white/black counts
node scripts/guards/check-palette.mjs --root <dir> [--ratchet <file>] [--skip <rule,...>]
```

The ratchet only goes down: a higher count fails, a lower count fails until `--update` records it, and `--update` refuses to raise any count. Never raise a count or add an exemption to make the guard pass.

### `check-contrast.mjs` (GUARD-05)

Reads every token from `app/globals.css` (the top-level `:root` and `@theme` blocks; a token block nested in an at-rule such as `@media` or `@supports` is not merged, and fails if it declares a custom property, because media-scoped palettes are not measured), resolves `var()` chains and measures 36 pairs (the 28 UI-SPEC pairs, 4 `accent-strong` pairs and the 4 photo-viewer `gallery` pairs: `accent`/`gallery`, `gallery`/`ink`, `focus`/`gallery`, `line-strong`/`gallery`) with `colorjs.io` (`contrast(…, 'WCAG21')`): text pairs need 4.5:1, non-text pairs (focus, line-strong) 3:1, compared as raw floats. An unknown `--color-*` token, a missing pair token, an alpha token in a measured pair or a file without token blocks fails. v1 alias tokens are skipped; `line` and `contour` are decorative and exempt. Adding a semantic token means adding it and its pairs to the script in the same commit.

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

### `check-ci-gate.mjs` (GUARD-07, GUARD-08)

`CI OK` (job `ci-ok`, the last job in `.github/workflows/ci.yml`) is the only check the `main` ruleset requires. It runs with `if: always()`, needs every other `ci.yml` job and passes only when `scripts/ci/ci-ok.jq` accepts `toJSON(needs)`: the `changes` job (`Classify changes`) must succeed, and every other result must be `success`, except `dependency-review`, which may be `skipped` outside `pull_request`, and the six heavy jobs, which may be `skipped` when `changes` reported `docs_only` `true`. An empty `needs`, a missing or failed `changes`, a `failure`, a `cancelled` or any other `skipped` fails it.

The docs-only fast path (D-08, D-09): `scripts/ci/classify-changes.mjs` gets every changed file name, old names of renames included, from one compare API call. The diff is docs-only only when every path is under `.planning/` or is exactly `README.md`, `AGENTS.md`, `scripts/README.md`, `e2e/visual/README.md` or `.github/copilot-instructions.md`. There is no `*.md` rule, because the READMEs under `scripts/guards/__selftest__/` are fixtures. No base commit, a failed compare call, an empty list or a list of 300 or more files runs the full CI. This guard keeps a job from escaping that aggregate. It reads the workflow YAML line by line, with comments stripped.

| Rule | Fails on |
|------|----------|
| `ci.yml` | `.github/workflows/ci.yml` missing |
| one `CI OK` | no job named `CI OK`, more than one, or one whose id is not `ci-ok` |
| `if: always()` | `ci-ok` with any other job-level `if:`, or none (a job skipped by `if:` reports Success) |
| needs set | `ci-ok.needs` missing a job id (`ci-ok needs is missing <id>`) or listing one that does not exist; the lists are compared as sets, so order never matters |
| jq verdict | `ci-ok` not running `jq` with `-f scripts/ci/ci-ok.jq`, or that file missing |
| unique name | a job named `CI OK` in any other workflow. The one exception (`CI_OK_ELSEWHERE_ALLOWED`) is job `relay` in `ci-skip-relay.yml`, and only while `CI OK` sits inside one `${{ }}` name expression that reads `needs.` on a job with `needs:`; a literal `name: CI OK` there still fails |
| `checks: write` | any workflow line granting it, directly or through `permissions: write-all` (such a job could post a forged `CI OK` check run) |
| token scope | a job with no `permissions:` block in a workflow that sets none at the top (the repository default token may include `checks: write`) |
| triggers | `ci.yml` without `push`, `pull_request` or `workflow_dispatch` in `on:` (the skip-marker relay dispatches `ci.yml`) |
| no path filter | a `paths:` or `paths-ignore:` key anywhere in `ci.yml`'s `on:` block (a workflow skipped by its trigger filter leaves `CI OK` pending) |
| heavy-job set | the jobs whose `if:` reads `needs.changes.outputs.docs_only` differ from the ids in the one `IN(...)` call of `scripts/ci/ci-ok.jq`, or one of those jobs does not need `changes` |
| relay: no checkout | `ci-skip-relay.yml` with a checkout action, or a run block running `git clone`/`checkout`/`switch`/`fetch`/`pull`/`worktree`, `gh pr checkout` or `gh repo clone` |
| relay: no expression in `run` | a `${{` on any line of a relay run block, shell comments included (event fields go through `env:`) |
| relay: no job-level `if:` | a job-level `if:` on the relay job whose name can be `CI OK` |
| relay: one trigger | any relay trigger other than `pull_request_target` |
| relay: token scope | relay top-level `permissions:` other than `{}`, or any write scope other than `actions: write` on the `CI OK` relay job |

```bash
npm run guard:ci
node scripts/guards/check-ci-gate.mjs --root <dir>
```

A new `ci.yml` job must join `ci-ok.needs` in the same commit. A new heavy job also gets the docs-only `if:` and joins the `IN(...)` list. The selftest runs the `ci-ok.jq` and `classify` cases (the jq cases need `jq` on the PATH, as `ubuntu-latest` has) and at least one failing case per rule, from the fixtures under `scripts/guards/__selftest__/ci-gate/` (plus temp copies of `good/` for the rename, jq-verdict, `paths-ignore` and heavy-set variants).

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
