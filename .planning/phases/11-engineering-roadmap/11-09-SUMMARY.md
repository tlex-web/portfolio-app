---
phase: 11-engineering-roadmap
plan: 09
subsystem: infra
tags: [mp4, ffmpeg, iso-bmff, served-asset-guard, service-worker, zod, sharp, d-27]

requires:
  - phase: 11-04
    provides: "trails:build -- --check in data:check (the chain this plan extends)"
  - phase: 08-09
    provides: "served-images guard, its selftest fixtures and the hashed-name / manifest rules"
provides:
  - "scripts/guards/lib/mp4-boxes.mjs: pure box walker (boxes, checkMp4, mp4Info)"
  - "Served-asset guard checks video: video-format, video (walker), 1.5 MiB budget, public/media/ hashed and listed"
  - "scripts/media/build-clip.mjs: clip:derive write mode (local ffmpeg) and --check (pure Node, in data:check)"
  - "data/schemas/media-manifest.ts: MAX_CLIP_BYTES, MIN/MAX_CLIP_SECONDS, ClipsSidecar, MediaClipEntry, MediaManifest"
  - "Empty data/generated/media-manifest.ts (mediaManifest = {}) and data/media/clips.json ({ clips: [] })"
  - "Serving path: service-worker media bypass, /media/:path* immutable header, proxy skips media/, assets/clips-original/ gitignored"
affects: [11-15, 11-16, coin-flip case study demo slot]

actuals:
  tokens: 12200
  tasks: 3
  commits: 6
plan_head_before: 69fa5efc0bbf359c4c7c8f6d998df16398ac3835
plan_head_after: 38b2428cce5c51662b24308a2e6a285a98532826

tech-stack:
  added: []
  patterns:
    - "Verify the artifact, not the flags: one pure MP4 walker shared by the guard and the derive script"
    - "Generated-media pipeline on the photos:derive pattern: local write mode, committed bytes authoritative, --check rebuilds the manifest from disk"
    - "Service-worker behaviour tested by evaluating the committed worker against self/caches/fetch stubs"

key-files:
  created:
    - scripts/guards/lib/mp4-boxes.mjs
    - scripts/media/build-clip.mjs
    - data/schemas/media-manifest.ts
    - data/generated/media-manifest.ts
    - data/media/clips.json
    - data/__tests__/media-manifest.test.ts
    - lib/__tests__/service-worker-media.test.ts
    - scripts/guards/__selftest__/served-images/good-mp4/
    - scripts/guards/__selftest__/served-images/bad-mp4-metadata/
    - scripts/guards/__selftest__/served-images/bad-mp4-audio/
    - scripts/guards/__selftest__/served-images/bad-mp4-order/
    - scripts/guards/__selftest__/served-images/bad-video-format/
  modified:
    - scripts/guards/check-served-images.mjs
    - scripts/guards/selftest.mjs
    - package.json
    - public/service-worker.js
    - next.config.ts
    - proxy.ts
    - .gitignore
    - .gitattributes

key-decisions:
  - "Q4: the clip budget is 1,572,864 bytes (1.5 MiB), MAX_CLIP_BYTES in data/schemas/media-manifest.ts; the guard holds the same literal"
  - "Track handlers are read from hdlr boxes whose parent is mdia, not by depth: udta>meta>hdlr ('mdir') sits at the same depth and made the RESEARCH snippet report every clean clip as two tracks"
  - "The walker also enforces RESEARCH C's box-tree whitelist (top level ftyp/moov/free/mdat, moov mvhd/trak/udta, udta meta, meta hdlr/ilst)"
  - "Video files are scanned for the XMP byte markers only; the Exif/IPTC markers stay image-only"
  - "build-clip.mjs takes --root <dir> so tests run write mode and --check against throwaway roots; --check also fails when the encoded duration drifts more than 0.1 s from the sidecar's"

patterns-established:
  - "Media pipeline: assets/clips-original/<id>.* (gitignored) -> public/media/<id>.<10 hex>.mp4 + <id>-poster.<10 hex>.webp -> data/generated/media-manifest.ts"

requirements-completed: [ENG-02]

coverage:
  - id: D1
    description: "MP4 box walker and served-asset guard reject metadata, audio, wrong box order, wrong format and over-budget video"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "npm run guard:selftest (80/80, incl. good-mp4, bad-mp4-metadata, bad-mp4-audio, bad-mp4-order, bad-video-format and the two mp4-boxes pure cases)"
        status: pass
      - kind: other
        ref: "npm run guard:images"
        status: pass
    human_judgment: false
  - id: D2
    description: "clip:derive pipeline: schema and budget constants, empty generated manifest, --check in data:check"
    requirement: ENG-02
    verification:
      - kind: integration
        ref: "data/__tests__/media-manifest.test.ts (11 tests)"
        status: pass
      - kind: other
        ref: "npm run data:check (clips: OK, trails: OK)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Write mode encodes a real recording into a clean, hashed clip and poster"
    requirement: ENG-02
    verification:
      - kind: manual_procedural
        ref: "Synthetic 9 s 540x1200 .mov with planted creation_time/location/title and an audio track, encoded with --root in the scratchpad: 1,018,379 B MP4 512x1138 8 s, poster 512x1138; --check OK; guard passed the media and flagged the raw .mov"
        status: pass
    human_judgment: true
    rationale: "Tim's real coin-flip recording does not exist yet (11-15); its size against the budget and the poster frame choice need his recording and eye"
  - id: D4
    description: "Serving path: service-worker media bypass, /media immutable header, proxy exclusion, gitignored originals"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "lib/__tests__/service-worker-media.test.ts (7 tests) and data/__tests__/precache.test.ts"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 09: Clip pipeline and served-video guard Summary

**A pure ISO-BMFF walker in the served-asset guard, a local-ffmpeg clip:derive with a pure-Node --check in data:check, the 1.5 MiB media manifest contract (empty until 11-15), and a /media serving path the service worker leaves to the network**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-11-01T20:47:33Z
- **Completed:** 2026-11-01T20:59:24Z
- **Tasks:** 3
- **Files modified:** 30 (incl. 21 fixture files)

## Accomplishments

- `checkMp4` rejects moov after mdat, uuid/XMP_/©xyz/loci boxes, boxes outside the whitelist, ilst items, non-zero mvhd/tkhd/mdhd times, anything but one `vide` track, and a size over the budget. `npm run guard:images` now covers `.mp4 .m4v .mov .webm .mkv .3gp` anywhere in the tree. Only MP4 is allowed. `public/media/` is a hashed directory listed by `data/generated/media-manifest.ts`.
- `scripts/media/build-clip.mjs` write mode refuses an original whose sha256 differs from the sidecar. It encodes through `execFileSync('ffmpeg', args)`, takes the poster from the encoded clip, and runs every check before it writes anything. `--check` needs neither ffmpeg nor the original.
- The sidecar holds no clip yet (`{ "clips": [] }`) and the generated manifest exports `{}`. `clips: OK` runs in every `data:check`.
- Range requests and video/audio requests bypass the service worker. `/media/` is immutable at the CDN, the proxy skips it, and `assets/clips-original/` cannot be committed.

## Task Commits

1. **Task 1: MP4 box walker in the served-asset guard** - `2aad9ca` (test, RED), `a939643` (feat, GREEN)
2. **Task 2: Clip derive script, contracts, empty manifest** - `231eb8b` (test, RED), `c0162b1` (feat, GREEN)
3. **Task 3: Serving path for media** - `831058c` (test, RED), `38b2428` (feat, GREEN)

## TDD record

- **Task 1 RED:** `node scripts/guards/selftest.mjs --tap` exited 1 with 5 of 80 cases failing: the four bad fixtures exited 0 instead of 1, and the 100-byte budget case got no size line. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK`, with target "an MP4 without +faststart (mdat before moov) fails the video rule". The failures came from the missing rules, not from loading: `mp4-boxes.mjs` was committed as an interface stub that returns `[]`. GREEN: 80/80.
- **Task 2 RED:** Jest stopped with `Cannot find module '../generated/media-manifest'` because the modules under test did not exist yet. That is a module-resolution RED, not an assertion RED. The classifier does not read Jest's reporter format, so this one was not machine-classified. GREEN: 11/11.
- **Task 3 RED:** 4 of 7 tests failed on `expect(event.respondWith).not.toHaveBeenCalled()` (received 1 call). That is the intended reason: the worker sent media into cacheFirst or networkFirst. GREEN: 7/7. The precache test still passes.
- No REFACTOR commits.

## Fixture ffmpeg commands (ffmpeg 9.0.1, run once)

Shared parts: `SRC = -f lavfi -i testsrc=size=64x64:rate=10 -t 0.2`, `ENC = -vf format=yuv420p -c:v libx264 -profile:v high -preset slow -crf 40`, `STRIP = -map_metadata -1 -map_chapters -1 -bsf:v filter_units=remove_types=6 -fflags +bitexact -flags:v +bitexact -metadata:s:v:0 encoder=`.

- good-mp4: `ffmpeg SRC -map 0:v:0 -an -sn -dn STRIP ENC -movflags +faststart` (1,115 B). The poster is the frame at 0.1 s, encoded with sharp `.webp({ quality: 82 })` (992 B).
- bad-mp4-metadata: `ffmpeg SRC ENC -movflags +faststart -metadata creation_time=2026-10-31T10:00:00Z -metadata location=+46.0207+007.7491/` (no strip flags). It fails on mvhd/tkhd/mdhd timestamps, ilst items and the loci box.
- bad-mp4-audio: `ffmpeg SRC -f lavfi -i sine=frequency=440:sample_rate=8000 -t 0.2 -map 0:v:0 -map 1:a:0 STRIP ENC -c:a aac -b:a 16k -movflags +faststart`. It fails with `tracks: vide,soun`.
- bad-mp4-order: `ffmpeg SRC -map 0:v:0 -an -sn -dn STRIP ENC` (no `+faststart`). It fails with `moov must precede mdat`.
- bad-video-format: `ffmpeg SRC -c:v libvpx-vp9 -crf 50 -b:v 0 -an` to `.webm`. It fails with `video-format: only MP4 is served`.

Each folder has a one-line README with its command.

## Budget (Q4)

`MAX_CLIP_BYTES = 1_572_864` (1.5 MiB) in `data/schemas/media-manifest.ts`. The guard uses the same literal for every MP4 under `public/`. Clips run 5-10 s (`MIN_CLIP_SECONDS`, `MAX_CLIP_SECONDS`).

## Write mode for 11-15

1. Put the recording at `assets/clips-original/coin-flip-toss.<ext>`. The folder is gitignored, and it must hold exactly one file named `coin-flip-toss.*`.
2. Take its hash: `node -e "console.log(require('crypto').createHash('sha256').update(require('fs').readFileSync(process.argv[1])).digest('hex'))" assets/clips-original/coin-flip-toss.<ext>`
3. Edit `data/media/clips.json`: `{ "clips": [ { "id": "coin-flip-toss", "sourceSha256": "<hash>", "start": <s>, "duration": <5-10>, "posterAt": <s into the clip, less than duration>, "crf": 26 } ] }`. Add `"fps": 30` only if the clip is over budget.
4. `npm run clip:derive`, then `npm run clip:derive -- --check`, `npm run guard:images` and `npm run data:check`. Commit `public/media/*`, `data/generated/media-manifest.ts` and `data/media/clips.json`.

A dry run on a synthetic 9 s 540x1200 30 fps recording gave 1,018,379 B at CRF 26 and 592,969 B at CRF 30. That recording had a planted creation_time, location, title and an audio track. A real dark screen recording compresses further. Write mode removed the old files after the CRF change. It refused the original when its bytes no longer matched `sourceSha256`.

## Decisions Made

See `key-decisions` in the frontmatter. The main one: the walker reads track handlers by parent box, not by depth. The RESEARCH snippet's `depth === 3` filter also matched `udta>meta>hdlr` ('mdir'), so it reported every clean ffmpeg clip as `tracks: vide,mdir`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Track-handler filter in the RESEARCH walker**
- **Found during:** Task 1
- **Issue:** `hdlr` at depth 3 matches `udta>meta>hdlr` as well as `trak>mdia>hdlr`, so clean clips failed the track rule.
- **Fix:** `boxes()` records each box's parent (an optional 6th argument), and track handlers come from `hdlr` boxes whose parent is `mdia`.
- **Files modified:** scripts/guards/lib/mp4-boxes.mjs
- **Committed in:** a939643

**2. [Rule 3 - Blocking] .gitattributes for the generated manifest and media**
- **Found during:** Task 2
- **Issue:** `--check` and the Jest test compare `data/generated/media-manifest.ts` byte for byte. Under `core.autocrlf` a Windows checkout would get CRLF and fail. Hashed media must never be normalised.
- **Fix:** Added `data/media/clips.json text eol=lf`, `data/generated/media-manifest.ts text eol=lf` and `public/media/* binary`, as earlier plans did for the other generated files.
- **Files modified:** .gitattributes
- **Committed in:** c0162b1

**3. [Rule 2 - Missing critical] Extra checks beyond the listed rules**
- **Found during:** Tasks 1-2
- **Issue:** RESEARCH C specifies a box-tree whitelist that the snippet does not implement. A clip whose duration differs from the sidecar's (stale encode) would pass `--check`.
- **Fix:** Added the whitelist, a `mp4Info` export (mvhd duration, tkhd size), `--check` failures for a duration more than 0.1 s from the sidecar's or for an orphan file in `public/media/`, and a check that the poster matches the clip's size. Also added `--root <dir>` to build-clip.mjs so tests can run in throwaway roots.
- **Files modified:** scripts/guards/lib/mp4-boxes.mjs, scripts/media/build-clip.mjs
- **Committed in:** a939643, c0162b1

**4. [Process] Task 1 RED commit includes an interface stub**
- `scripts/guards/lib/mp4-boxes.mjs` was committed in the RED commit as a stub returning `[]`, so the selftest failed on its assertions instead of on an import error.

---

**Total deviations:** 3 auto-fixed (1 bug, 1 blocking, 1 missing critical) plus 1 process note.
**Impact on plan:** All are needed for correctness or a stable check. There is no scope creep beyond the RESEARCH spec.

## Issues Encountered

- The service worker was not built, so `public/service-worker.js` keeps its `'__BUILD_HASH__'` and `/*__PRECACHE_URLS__*/[]` placeholders. Both were checked with grep after the edit.
- `.gitignore`: the comment line sits between `assets/photos-original/` and `assets/clips-original/`, so the entry is two lines after, not directly after. The acceptance grep passes.

## Verification

- `npm run guard:selftest` 80/80; `npm run guard:images` OK; `npm run data:check` passed (clips: OK, trails: OK)
- `npm run lint` exit 0; `npm run type-check` exit 0; `npx jest --silent` 73 suites / 1136 tests passed
- All acceptance greps for the three tasks passed (checkMp4 1, public/media/ 2, si(...) 6, clip:derive -- --check 1, execFileSync('ffmpeg' 2, execSync/shell 0, destination video 1, /media/:path* 1, terrain/|media/ 1, ^assets/clips-original/ 1, CSP line 1)

## User Setup Required

None. ffmpeg is needed only on Tim's machine, for write mode in 11-15.

## Next Phase Readiness

- 11-15 drops Tim's recording through `npm run clip:derive` (steps above). 11-16 can import `mediaManifest` from `@/data/generated/media-manifest`. It is `{}` until then, so the Demo slot must handle a missing entry.

## Self-Check: PASSED

- All created files found on disk. Commits 2aad9ca, a939643, 231eb8b, c0162b1, 831058c and 38b2428 are ancestors of HEAD. evaluation-scope resolves the plan's commits.

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-01*
