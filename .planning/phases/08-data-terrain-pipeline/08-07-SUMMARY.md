---
phase: 08-data-terrain-pipeline
plan: 07
subsystem: data
tags: [sharp, avif, webp, jpeg, image-manifest, content-hash, privacy, exif, zod, prebuild]

requires:
  - phase: 08-data-terrain-pipeline (08-02)
    provides: "originals in gitignored assets/photos-original/, data/photos/exif-sidecar.json (sha256, size, orientation, space, iccDescription), --check CLI conventions, .gitattributes LF precedent"
  - phase: 08-data-terrain-pipeline (08-04)
    provides: "content-hashed <name>.<10 hex>.<ext> convention, lossy-asset --check (hash = name, format, size, no metadata), generated .ts module shape"
provides:
  - "scripts/photos/build-derivatives.mjs: originals -> rotated, metadata-free, hashed AVIF/WebP (640/1024/1600/2560) + 1200 JPEG, image manifest; --check without originals"
  - "data/schemas/image-manifest.ts: ImageManifest, ImageManifestEntry, ImageVariant, ImageJpeg, MAX_LONG_EDGE, VARIANT_LONG_EDGES, JPEG_LONG_EDGE (zod only)"
  - "data/generated/image-manifest.ts: imageManifest (id -> sourceSha256, oriented size, variants, jpeg, legacy -large/-thumb paths)"
  - "public/images/photos/: 36 hashed derivatives (7.0 MB)"
  - "npm photos:derive; data:check (inside npm run lint) runs photos:derive -- --check"
  - "full-res copies, optimization-manifest.json, scripts/optimize-images.mjs and the prebuild/optimize-images scripts removed"
  - "data/__tests__/image-manifest.test.ts: 6 fs-only invariants"
  - "PROJECT.md Key Decisions row for D-12"
affects: [08-09 served-image guard, 08-10 landscapes bridge, phase 10 lightbox and photo pages, phase 12 legacy cleanup and OG images]

actuals:
  tokens: 8800
  tasks: 2
  commits: 3
plan_head_before: 865ca82212e57ec20a1ffbaf08485515fe312749
plan_head_after: e5422b504fbc46459453de79b98847a04e8adc8c

tech-stack:
  added: []
  patterns:
    - "Manifest as a pure function of disk + sidecar: write mode writes the files, then builds the manifest from what is on disk; --check rebuilds it the same way and byte-compares"
    - "Encode everything in memory before writing anything, so a failing original leaves the committed derivatives untouched"
    - "Privacy by default output: rotate() + resize + encoder only; no metadata-retaining sharp method anywhere in the script (grep-checked)"

key-files:
  created:
    - scripts/photos/build-derivatives.mjs
    - data/schemas/image-manifest.ts
    - data/generated/image-manifest.ts
    - data/__tests__/image-manifest.test.ts
    - public/images/photos/ (36 files)
  modified:
    - package.json
    - .gitattributes
    - scripts/README.md
    - .planning/PROJECT.md
  deleted:
    - "public/images/optimized/*UTC).jpg and *UTC).webp (8 full-res copies)"
    - public/images/optimized/optimization-manifest.json
    - scripts/optimize-images.mjs

key-decisions:
  - "Derivative hash is the first 10 hex of sha256 over the encoded bytes (RESEARCH Pattern 3); the committed bytes are authoritative because lossy encoders are not byte-stable across platforms. Re-running write mode on Tim's machine reproduced all 36 names and the manifest byte for byte"
  - "Write mode also refuses an original whose sha256 differs from the sidecar (run photos:exif first), so sourceSha256 in the manifest always describes the bytes that were encoded"
  - "The manifest's width/height is the oriented original size from the sidecar (orientation 5-8 swaps), so --check can rebuild it without originals"
  - "RED for the tdd task is the full-res-absent invariant, which fails until the git rm; the other five invariants pass against the Task 1 manifest by design"

patterns-established:
  - "Photo derivative names: <id>-<long edge>.<sha256[:10]>.<avif|webp|jpg> under public/images/photos/"
  - "--check output: 'photos:derive: <problem>' per line, then 'photos:derive: OK' or 'photos:derive: N problems'"

requirements-completed: [DATA-05, DATA-08]

coverage:
  - id: D1
    description: "36 hashed derivatives (4 photos x AVIF/WebP at 640/1024/1600/2560 + one 1200 JPEG), rotated, at most 2560 px, carrying no EXIF/XMP/IPTC/ICC/orientation"
    requirement: DATA-05
    verification:
      - kind: other
        ref: "node -e filename regex check -> 'derivatives 36'"
        status: pass
      - kind: other
        ref: "scratchpad privacy-scan.cjs: sharp metadata + raw byte scan for Exif/XMP/IPTC/ICC/GPS markers -> 'scanned 36 bad 0 max long edge 2560'"
        status: pass
      - kind: unit
        ref: "data/__tests__/image-manifest.test.ts#every variant and JPEG URL is hashed, exists under public/ and stays within 2560 px"
        status: pass
    human_judgment: false
  - id: D2
    description: "photos:derive --check in npm run lint fails on a missing file, a hash/bytes mismatch, a size or format mismatch, a metadata-bearing file, an orphan, a missing legacy path, a stale sourceSha256 and stale manifest bytes"
    requirement: DATA-08
    verification:
      - kind: other
        ref: "npm run lint -> exit 0, 'photos:derive: OK'"
        status: pass
      - kind: other
        ref: "tamper proofs: byte appended, file deleted, sidecar sha256 changed, manifest height edited, manifest whitespace edited, EXIF-bearing file under a valid hash, stray-640.0123456789.webp orphan -> each exit 1 naming the file; restore -> OK"
        status: pass
    human_judgment: false
  - id: D3
    description: "data/generated/image-manifest.ts maps each sidecar id to sourceSha256, oriented size, hashed variants and legacy -large/-thumb paths"
    requirement: DATA-08
    verification:
      - kind: unit
        ref: "data/__tests__/image-manifest.test.ts (6 tests)"
        status: pass
      - kind: other
        ref: "npm run type-check exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Full-res copies, optimization-manifest.json, scripts/optimize-images.mjs and the prebuild step are gone; the build succeeds without them"
    requirement: DATA-05
    verification:
      - kind: unit
        ref: "data/__tests__/image-manifest.test.ts#the eight full-resolution copies and optimization-manifest.json are gone from public/images/optimized/"
        status: pass
      - kind: other
        ref: "git ls-files check -> 'full-res and prebuild gone'; git ls-files public/images/optimized -> 60; npm run build exit 0 with no prebuild"
        status: pass
    human_judgment: false
  - id: D5
    description: "Derivative orientation and colour look right"
    verification:
      - kind: other
        ref: "scratchpad 900 px renders of img-0629-2560 and r004-011-2560 WebP viewed: upright, landscape, colours as expected"
        status: pass
    human_judgment: true
    rationale: "Only the executor viewed two downscaled renders; the photos as served are reviewed with Tim in the Phase 10 lightbox work and the 08-13 visual review"

duration: 10min
completed: 2026-10-24
status: complete
---

# Phase 8 Plan 07: Hashed Photo Derivatives, Image Manifest and Full-Res Removal Summary

**The four originals now become 36 rotated, metadata-free, content-hashed AVIF/WebP/JPEG derivatives (largest 2560 px) plus a zod-validated `imageManifest`, all checked in `npm run lint` without the originals. The eight full-resolution copies, their manifest, `optimize-images.mjs` and the `prebuild` step are gone from HEAD.**

## Performance

- **Duration:** about 10 min
- **Started:** 2026-10-24T16:31:55Z
- **Completed:** 2026-10-24T16:41:20Z
- **Tasks:** 2 (Task 1 tracer, Task 2 tdd)
- **Files modified:** 54 (40 created, 4 modified, 10 deleted)

## Accomplishments

- **Derivatives (D-13).** `photos:derive` encodes each original with `rotate()`, a long-edge resize that never enlarges, and sharp's default output: AVIF q50 effort 4 and WebP q82 effort 6 at 640, 1024, 1600 and 2560 px, plus one 1200 px progressive mozjpeg JPEG. The 36 files total 7.0 MB. The 2560 sizes are 2560 x 1707 for the three 3:2 digital frames and 2560 x 1745 for the film scan.
- **Privacy (DATA-05, T-08-18).** An independent scan (sharp metadata plus a raw byte search for `Exif`, XMP, Photoshop/IPTC, `ICC_PROFILE`, `acsp` and `GPS`) found nothing in any of the 36 files. The script contains no metadata-retaining sharp call (grep count 0), and `--check` rejects any EXIF, XMP, IPTC, ICC or orientation tag.
- **sRGB guard.** Write mode refuses an original that is not sRGB, either by sharp's `space` or by the sidecar ICC description. Proved by setting one sidecar ICC description to "Adobe RGB (1998)": exit 1, nothing written.
- **Manifest (DATA-08).** `data/generated/image-manifest.ts` is built from the files on disk and the sidecar. `--check` rebuilds it the same way and compares bytes, so any edit to the manifest, the files or the sidecar fails lint.
- **Full-res removal (D-11).** The 8 full-res copies (12480 x 8320 and 4712 x 3212) and `optimization-manifest.json` were removed with a normal `git rm`, together with `scripts/optimize-images.mjs`. `package.json` no longer has `prebuild` or `optimize-images`. `npm run build` passes with no prebuild step, and 60 legacy variants remain in `public/images/optimized/`.
- **D-12 recorded.** PROJECT.md Key Decisions now states that the GPS originals (287c2e9, deleted in 347d8e1) and the full-res copies (8fa0991) stay reachable in public history. Tim accepted this. Nothing was rewritten.

## Task Commits

1. **Task 1 (tracer): derivatives, manifest, --check in lint**: `1bbd0fc` (feat)
2. **Task 2 RED: manifest and full-res invariants**: `bfe100b` (test)
3. **Task 2 GREEN: remove full-res copies and prebuild, README, D-12**: `e5422b5` (chore)

**Tracer gate:** the run was interactive, `human_verify_mode` was end-of-phase, and the verify step was automated only. All three Task 1 `<verify>` commands were re-run after the commit and passed, so the plan expanded to Task 2 with no checkpoint.

## Files Created/Modified

- `scripts/photos/build-derivatives.mjs`: write mode (needs the originals) and `--check` (CI). It rejects unknown flags.
- `data/schemas/image-manifest.ts`: the zod contract. URLs must match the hashed pattern for their own extension and name their long edge, variants must be exactly 640/1024/1600/2560 in order, and nothing may exceed 2560 px.
- `data/generated/image-manifest.ts`: the generated `imageManifest`.
- `public/images/photos/*`: the 36 derivatives.
- `data/__tests__/image-manifest.test.ts`: 6 fs-only invariants.
- `package.json`: adds `photos:derive` and extends `data:check`. Removes `optimize-images` and `prebuild`.
- `.gitattributes`: the manifest stays LF, and the derivatives are binary.
- `scripts/README.md`: the old optimize-images section is replaced by the data-pipeline section (local generators, committed outputs, `data:check` in CI).
- `.planning/PROJECT.md`: adds the D-12 Key Decisions row.
- Deleted: the 8 full-res copies, `optimization-manifest.json` and `scripts/optimize-images.mjs`.

## Decisions Made

- The hash covers the encoded bytes, and the committed files are authoritative. A second write run on this machine reproduced all 36 names and the manifest byte for byte.
- Write mode checks each original's sha256 against the sidecar before encoding. A mismatch means the sidecar is stale, so `photos:exif` must run first.
- The manifest's top-level width and height are the oriented original size, taken from the sidecar. That lets `--check` rebuild the manifest without originals.

## TDD Gate Compliance

Task 2 is `tdd="true"`. Task 1 had already built the manifest, so five of the six invariants describe an artifact that already exists. The RED target is the D-11 behaviour that did not exist yet.

- **RED:** `bfe100b`. The new suite was run with the scratchpad flat-TAP reporter before the `git rm`. Evidence is in `.git/gsd-red/08-07-red.json`, and `gsd check tdd-red-evidence` returned **RED_EVIDENCE_OK** (`target_test_failed`, 6 tests, 1 failing). Semantic assessment: only the target failed (`served images (DATA-05, D-11) > the eight full-resolution copies and optimization-manifest.json are gone from public/images/optimized/`), on its `toEqual([])` assertion, because 9 files (8 full-res + the manifest json) were still on disk. There was no load, syntax or fixture fault.
- **GREEN:** `e5422b5` (a `chore` commit, as the plan names it) passes 6/6. The full Jest run has 23 suites and 292 tests, up from 22 / 286.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `.gitattributes` rules for the manifest and the derivatives**
- **Found during:** Task 1
- **Issue:** This machine sets `core.autocrlf=true`. Without a rule, a checkout would write the manifest with CRLF and the byte comparison in `--check` would fail. Git could also treat the binary derivatives as text.
- **Fix:** Added `data/generated/image-manifest.ts text eol=lf` and `public/images/photos/* binary`, following the 08-02 and 08-04 precedent.
- **Files modified:** `.gitattributes`
- **Verification:** `git ls-files --eol` shows `i/lf w/lf attr/text eol=lf` for the manifest and `-text` for the derivatives.
- **Committed in:** `1bbd0fc`

**2. [Rule 2 - Missing critical] Source-hash, unknown-flag and atomic-write guards**
- **Found during:** Task 1
- **Issue:** The plan's write mode would encode whatever file sits under the sidecar file name, which could be an edited original whose sidecar was not refreshed, and still record the sidecar sha256 as `sourceSha256`. A mistyped flag would also run write mode silently.
- **Fix:** Write mode now requires sha256(original) to equal the sidecar sha256. It encodes all 36 outputs in memory before writing anything. Any argument other than `--check` exits 1.
- **Files modified:** `scripts/photos/build-derivatives.mjs`
- **Verification:** `--bogus` exits 1. The non-sRGB proof exits 1 with nothing written (`git status` clean).
- **Committed in:** `1bbd0fc`

**3. [Process] Separate RED commit for Task 2**
- **Found during:** Task 2
- **Issue:** The plan names a single `chore(08-07)` commit for Task 2, but the task is `tdd="true"`.
- **Fix:** The test went in first as `test(08-07)` (`bfe100b`). The plan's `chore(08-07)` commit (`e5422b5`) then turns it green.
- **Committed in:** `bfe100b`, `e5422b5`

**4. [Formatting] README line endings**
- **Found during:** Task 2
- **Issue:** The `scripts/README.md` working copy was CRLF (index LF). Splicing in the new LF section left mixed endings.
- **Fix:** Normalised the working copy to LF. The index content is LF as before.
- **Committed in:** `e5422b5`

---

**Total deviations:** 4 (1 blocking, 1 missing critical, 1 process, 1 formatting)
**Impact on plan:** These protect the byte-equality, source-provenance and no-silent-overwrite contracts. There is no scope creep, and the interfaces match the plan's `<interfaces>` block.

## Issues Encountered

- `.github/workflows/ci.yml` still has two commented-out `# run: npm run optimize-images` lines (98, 189). They are inert comments in a file outside this plan, so they were left alone. A later CI clean-up can drop them.
- `npm run build` ran once and its postbuild injected a hash into `public/service-worker.js`. The file was restored with `git checkout -- public/service-worker.js` and still carries `__BUILD_HASH__`.
- The lint baseline is unchanged at 0 errors and 54 warnings, all in pre-existing v1 components.

## Privacy Notes (T-08-18, T-08-19, T-08-20)

- Before each commit, the staged list was checked for originals, `assets/` paths and new images outside `public/images/photos/`. None were staged, and nothing from `assets/photos-original/` was ever staged.
- **D-12 (accepted):** the GPS-bearing originals stay in public git history at `287c2e9` (deleted in `347d8e1`), and the full-res copies at `8fa0991`. Browsers and CDNs that already cached the old full-res URLs keep their copies, while new deploys return 404 (the 08-09 e2e checks this). No history was rewritten and nothing was force-pushed. A `git filter-repo` purge remains possible later as a separate step that Tim runs.

## User Setup Required

None. `photos:derive` runs on Tim's machine only after a photo is added or edited.

## Next Phase Readiness

- 08-09's served-image guard can scan `public/images/photos/` against this manifest. 08-10 can rewire `data/landscapes.ts` to `imageManifest[id].legacy` and the new variants. The Phase 10 lightbox uses the 2560 variants.
- DATA-05 and DATA-08 are also declared by later Phase 8 plans. `requirements.ready-ids` reports both as blocked until the last declaring plan finishes, so they were not marked complete here.
- 08-06 is still paused at its Task 3 hillshade-poster checkpoint. This plan touched none of its files.

---
*Phase: 08-data-terrain-pipeline*
*Completed: 2026-10-24*

## Self-Check: PASSED

- FOUND: scripts/photos/build-derivatives.mjs, data/schemas/image-manifest.ts, data/generated/image-manifest.ts, data/__tests__/image-manifest.test.ts, public/images/photos/ (36 files)
- FOUND: commits 1bbd0fc, bfe100b, e5422b5 (ancestors of HEAD; evaluation-scope resolves all three)
- Plan verification: `npm run lint` exit 0 (prints `photos:derive: OK`), `npm run type-check` exit 0, `npx jest --silent` 23 suites / 292 tests, `npm run build` exit 0 without prebuild; 36 hashed derivatives; 60 legacy files tracked; no full-res file tracked
- Acceptance re-run: `photos:derive -- --check` grep 1, metadata-method grep 0, orphan proof exit 1 then OK, ls-files optimized 60, D-12 grep 1, README optimize-images grep 0
