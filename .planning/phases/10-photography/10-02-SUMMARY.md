---
phase: 10-photography
plan: 02
subsystem: data-pipeline
tags: [zod, sharp, photos, exif, guards, privacy]

requires:
  - phase: 08-data-terrain-pipeline
    provides: photo pipeline (extract-exif, build-derivatives, build-photo-data), served-image guard, 08-REVIEW warnings WR-01..08
provides:
  - PhotoFacts.uv bounded to [0, 1]; build fails on a position outside the DEM extent before sampling a height (WR-01)
  - altitude-less GPS keeps lat/lon; Gps.altM nullable (WR-02)
  - build fails when a recorded OffsetTimeOriginal disagrees with the Europe/Zurich offset (WR-03)
  - corrections.json positions are hand-placed only, in the schema and in buildPosition (WR-08)
  - photos:derive write mode validates the manifest in memory before it writes, and deletes stale files last (WR-05)
  - served-image guard scans HEIF, JXL, BMP, JFIF and camera raws; public/images/landscapes/ ignored again (WR-06)
  - scripts/README.md matches the real workflow and lint chain (WR-07)
affects: [10-03, 10-09, 10-13, map pins, EXIF strip]

actuals:
  tokens: 8960
  tasks: 2
  commits: 3
plan_head_before: 9c4dfdf2af1d745c2bb033443acb078914dcb02f
plan_head_after: 9e3db726668429df393ee7264269d0fd4b47e14f

tech-stack:
  added: []
  patterns:
    - "assembleManifest(sidecar, one, problems): one manifest assembly fed by a disk resolver (--check) or an in-memory resolver (write)"
    - "Corrections positions use a refined Position (CorrectionPosition), not a second schema"

key-files:
  created:
    - scripts/guards/__selftest__/served-images/bad-raw/public/images/x.dng
  modified:
    - data/schemas/photo.ts
    - data/__tests__/photos.test.ts
    - scripts/photos/build-photo-data.mjs
    - scripts/photos/extract-exif.mjs
    - scripts/photos/build-derivatives.mjs
    - scripts/guards/check-served-images.mjs
    - scripts/guards/selftest.mjs
    - .gitignore
    - scripts/README.md
    - .planning/phases/08-data-terrain-pipeline/08-REVIEW-DISPOSITION.md

key-decisions:
  - "10-02: WR-08 is a refine on Position (CorrectionPosition) plus a buildPosition throw, not an intersection; the error names the photo id and 'hand-placed'"
  - "10-02: WR-06 item 2 (pre-commit hook) not added: the repo has no hook tooling; CI lint stays the gate, recorded in the disposition Source cell"
  - "10-02: WR-04 and IN-02 rows left open in 08-REVIEW-DISPOSITION.md for 10-13, as the plan says (WR-04 is fixed in code by 10-01, 6bb5fb6)"
  - "10-02: disposition frontmatter open count set to 10, the generator's rule (rows with disposition 'open'); the old 18 was stale because CR-01 was already deferred"

patterns-established:
  - "Write modes that replace committed files validate the complete output in memory first and delete stale files last"

requirements-completed: [PHOTO-01, LBOX-04]

coverage:
  - id: D1
    description: "WR-01: PhotoFacts rejects uv outside [0, 1]; the build throws '{id}: position lies outside the DEM extent' before the DEM sample"
    requirement: PHOTO-01
    verification:
      - kind: unit
        ref: "data/__tests__/photos.test.ts#WR-01: PhotoFacts rejects a uv outside [0, 1] (a position off the DEM sheet)"
        status: pass
      - kind: other
        ref: "temporary sidecar probe (46.5 N, 7.9 E) -> photos:build --check exits 1 with 'img-0605: position lies outside the DEM extent (uv 1.765, -4.633)'"
        status: pass
    human_judgment: false
  - id: D2
    description: "WR-02: ExifSidecarEntry accepts gps.altM null; gpsOf keeps lat/lon without GPSAltitude"
    requirement: LBOX-04
    verification:
      - kind: unit
        ref: "data/__tests__/photos.test.ts#WR-02: ExifSidecarEntry keeps a GPS fix whose altitude is missing (altM null)"
        status: pass
    human_judgment: false
  - id: D3
    description: "WR-03: build throws on an OffsetTimeOriginal that is not the derived Europe/Zurich offset; the four photos (null) build unchanged"
    requirement: LBOX-04
    verification:
      - kind: other
        ref: "temporary sidecar probe: +01:00 on img-0605 -> exit 1 'EXIF OffsetTimeOriginal +01:00 is not the Europe/Zurich offset +02:00'; +02:00 -> OK"
        status: pass
      - kind: other
        ref: "npm run data:check (photos:build: OK)"
        status: pass
    human_judgment: false
  - id: D4
    description: "WR-08: Corrections rejects a position whose source is 'exif'; the r004-011 hand-placed position parses"
    verification:
      - kind: unit
        ref: "data/__tests__/photos.test.ts#WR-08: Corrections rejects a position labelled as an exact EXIF fix"
        status: pass
      - kind: unit
        ref: "data/__tests__/photos.test.ts#WR-08: the committed corrections.json (r004-011 hand-placed) still parses"
        status: pass
    human_judgment: false
  - id: D5
    description: "WR-05: photos:derive validates in memory, writes, then unlinks stale files; a run on the four originals leaves public/images/photos/ and image-manifest.ts unchanged"
    verification:
      - kind: other
        ref: "npm run photos:derive; git status --porcelain public/images/photos data/generated/image-manifest.ts (empty)"
        status: pass
    human_judgment: false
  - id: D6
    description: "WR-06: guard scans raw and HEIF formats; x.dng fixture fails as unreadable; .gitignore lists public/images/landscapes/"
    verification:
      - kind: automated_ui
        ref: "npm run guard:selftest#served-images: a raw camera file under public fails as unreadable (73/73)"
        status: pass
      - kind: other
        ref: "npm run guard:images (served-images: OK)"
        status: pass
    human_judgment: false
  - id: D7
    description: "WR-07: scripts/README.md documents photos:build, the generator rows, the lint chain, v1names scope, 32 contrast pairs and check-served-images"
    verification: []
    human_judgment: true
    rationale: "Documentation accuracy; the grep criteria pass but whether the prose reads right is a reader's call"

duration: 10min
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 02: Phase 8 pipeline warnings (WR-01..03, WR-05..08) Summary

**The photo build now refuses a pin off the DEM sheet, a foreign camera time zone and an exif-labelled hand position, keeps altitude-less GPS, writes derivatives only after an in-memory manifest check, and the served-image guard catches raw and HEIF originals.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-10-26T10:34:03Z
- **Completed:** 2026-10-26T10:44:28Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- WR-01: `PhotoFacts.uv` is bounded to [0, 1]. `build-photo-data` throws `{id}: position lies outside the DEM extent (uv u, v)` before `sampleAtLv95`, so no clamped edge height is published as a DEM fact.
- WR-02: `gpsOf` returns null only when latitude or longitude is missing. `altM` is null without GPSAltitude, and the `Gps` schema allows that.
- WR-03: `buildCapture` throws when a recorded `offsetTimeOriginal` differs from the derived Zurich offset. The GPS drift check stays as the second check.
- WR-08: `Corrections` positions go through `CorrectionPosition` (Position refined to `source: 'hand-placed'`), and `buildPosition` throws for any other source with the photo id in the message.
- WR-05: `photos:derive` write mode encodes into memory, then builds and validates the manifest from the buffers (decodable, AVIF/WebP sizes agree, no duplicate, `ImageManifest`). Only then does it write the files and the manifest, and it unlinks stale files last. `--check` and write share `assembleManifest`, so the manifest text is built the same way in both.
- WR-06: `IMAGE_EXT` adds `.jfif .heif .jxl .dng .cr2 .cr3 .nef .arw .bmp`. New selftest case `bad-raw`: a text `x.dng` fails as `metadata: unreadable by sharp`. `.gitignore` lists `public/images/landscapes/` again.
- WR-07: scripts/README.md now covers the photos:build step and row, the precache.json and tokens:build outputs, the current lint chain and data:check line, the v1names scope, 32 contrast pairs, the new derive write order and a check-served-images section.
- 08-REVIEW-DISPOSITION.md: WR-01, 02, 03, 05, 07 and 08 are `fixed` with source `10-02 (Phase 10)`. WR-06 is `fixed` with the hook note. Frontmatter is updated and `open` is 10.

## Task Commits

1. **Task 1: schema and build guards (WR-01, WR-02, WR-03, WR-08)**: `d9262db` (test, RED), `ae5cf28` (fix, GREEN)
2. **Task 2: atomic derive, wider guard, ignore line, README, disposition (WR-05, WR-06, WR-07)**: `9e3db72` (fix)

**Plan metadata:** see the docs(10-02) commit that adds this file.

## TDD (Task 1)

- **RED (`d9262db`):** five cases in `describe('Phase 8 review fixes (WR-01, WR-02, WR-08)')`. Three target tests failed on their planned assertions: WR-01 reject (Expected false, Received true), WR-02 altM null (Expected true, Received false) and WR-08 reject (Expected false, Received true). The two regression guards passed as intended (edge uv 0/1 plus every committed photo; committed corrections.json). Semantic assessment: valid RED. All 43 tests were discovered and ran, there were no load or syntax errors, and the failures were the intended schema gaps. Jest's report format is not one the `tdd-red-evidence` classifier supports (TAP, JUnit, go, swift, unittest), so no machine verdict was recorded. The evidence is the console assertion output above.
- **GREEN (`ae5cf28`):** schema and pipeline fixes. All 64 tests in photos + exif-sidecar pass, and the full suite is 770/770. The plan names this commit `fix(10-02)`, not `feat(10-02)`; this is an execute plan with tdd tasks, not a `type: tdd` plan.
- **REFACTOR:** none needed.

## Files Created/Modified

- `data/schemas/photo.ts`: `Gps.altM` nullable, `CorrectionPosition`, bounded `PhotoFacts.uv`
- `data/__tests__/photos.test.ts`: WR-01/02/08 cases
- `scripts/photos/build-photo-data.mjs`: out-of-extent, OffsetTimeOriginal and non-hand-placed correction errors; header updated
- `scripts/photos/extract-exif.mjs`: altitude-optional `gpsOf`
- `scripts/photos/build-derivatives.mjs`: `assembleManifest` / `manifestFromDisk` / `manifestFromMemory`; write order validate → write → unlink; header updated
- `scripts/guards/check-served-images.mjs`: widened `IMAGE_EXT` and scope header
- `scripts/guards/selftest.mjs`, `scripts/guards/__selftest__/served-images/bad-raw/public/images/x.dng`: the raw-file case
- `.gitignore`: `public/images/landscapes/` with a WR-06 comment
- `scripts/README.md`: WR-07 corrections
- `.planning/phases/08-data-terrain-pipeline/08-REVIEW-DISPOSITION.md`: seven rows and frontmatter entries fixed

## Decisions Made

- WR-08 uses a refine instead of the review's `.and(z.object(...))` intersection. The plan allows either. The refine gives one readable error and keeps the inferred type a plain object.
- WR-06 item 2 (pre-commit hook) was accepted, not built (plan's flagged assumption): there is no hook tooling and adding it would be a new dependency.
- WR-04 stays `open` in the disposition even though 10-01 fixed it in code (6bb5fb6). The plan explicitly leaves WR-04 and IN-02 for 10-13 to record.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Disposition `open` count follows the generator's rule**
- **Found during:** Task 2 (disposition rows)
- **Issue:** The frontmatter said `open: 18`, but CR-01 was already `deferred`. The generator (`code-review-disposition.md`, `rows.filter(r => r.d === 'open')`) counts only `open` rows, so 18 was stale and "18 minus 7" would have given a wrong 11.
- **Fix:** Set `open: 10` (WR-04 plus IN-01..09).
- **Files modified:** .planning/phases/08-data-terrain-pipeline/08-REVIEW-DISPOSITION.md
- **Verification:** `grep -c "disposition: open"` prints 10
- **Committed in:** 9e3db72

**2. [Rule 2 - Missing critical] README covers tokens:build and the full data:check chain**
- **Found during:** Task 2 (WR-07)
- **Issue:** package.json's `data:check` also runs `photos:build` and `tokens:build`. A README that listed only the photos:build addition would still show a stale chain.
- **Fix:** The data:check line matches package.json, and there is a tokens:build row in the generator table.
- **Files modified:** scripts/README.md
- **Committed in:** 9e3db72

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical). **Impact:** both keep the records accurate. No scope creep.

## Issues Encountered

- One bash heredoc with nested quotes failed to parse before any write, so the derive edits were redone with the Edit tool. Nothing was half-applied (`git status` was clean between the attempts).
- Before the derive write run, a read-only probe re-encoded all 36 outputs from the four originals and matched every committed hashed name. So on this machine the WR-05 no-change run could not rewrite a derivative, and it did not.
- `scripts/README.md` was not Prettier-clean before this plan (its tables are unaligned), and it is still not. Prettier is not part of `npm run lint`, and I did not reformat the whole document.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Map pins (PHOTO-01) and the strip (LBOX-04) can rely on photos.ts: every uv lies within [0, 1], every position has an honest source, and every capture offset is checked.
- 10-13 still records WR-04 (fixed by 10-01) and IN-02 in the disposition.
- `npm run lint` passes end to end (exit 0). The generated photos.ts, image-manifest.ts, terrain.ts and the sidecar are byte-identical to the plan base.

## Self-Check: PASSED

- All 11 key files are present on disk. Commits d9262db, ae5cf28 and 9e3db72 are ancestors of HEAD.
- Acceptance: `outside the DEM extent` 1, `OffsetTimeOriginal` 2, `'.dng'` 1, `'.heif'` 1, `public/images/landscapes/` 1, `photos:build` in README 4, `^| WR-0[1235678] | warning | fixed` 7. The derive run's porcelain output is empty, and `git diff --exit-code` on the generated data and the sidecar exits 0.
- Plan verification: jest photos + exif-sidecar 64/64, data:check all OK, guard:selftest 73/73, guard:images OK, full `npm run lint` exit 0.

---
*Phase: 10-photography*
*Completed: 2026-10-26*
