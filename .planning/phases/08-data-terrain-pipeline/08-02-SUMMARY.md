---
phase: 08-data-terrain-pipeline
plan: 02
subsystem: data
tags: [exif, exif-reader, sharp, zod, privacy, gps, sidecar, gitignore]

requires:
  - phase: 08-data-terrain-pipeline (08-01)
    provides: "ESLint ban on generator libraries (exif-reader, sharp) outside scripts/**; the Node type-strip import pattern for import-free .ts modules"
provides:
  - "assets/photos-original/ (gitignored, local only) holding the four originals; public/images/landscapes/ removed"
  - "data/schemas/photo.ts: NaiveLocal, Coord4, ExifSidecarEntry, ExifSidecar (zod only, Node type-strip safe)"
  - "scripts/photos/extract-exif.mjs: originals -> data/photos/exif-sidecar.json, with --check"
  - "data/photos/exif-sidecar.json: committed stage-1 EXIF facts, sha256 per original, GPS at 4 dp"
  - "npm photos:exif and data:check; npm run lint now ends with data:check"
  - "data/__tests__/exif-sidecar.test.ts: 21 Jest invariants"
affects: [08-07, 08-08, 08-09, photo-data, image-derivatives, served-image-guard]

actuals:
  tokens: 6600
  tasks: 2
  commits: 2
plan_head_before: c2af5c8c270fe8ac7b8e695628be58414bd79ada
plan_head_after: b37c3ed5822041f48a17f03b0d96bc4b15aa7639

tech-stack:
  added: ["exif-reader 2.0.3 (devDependency, exact pin)"]
  patterns:
    - "Stage-1 generator: originals -> committed JSON sidecar; --check re-extracts in memory and byte-compares when originals exist, schema-only when absent (CI)"
    - "Rounding at extraction: GPS round4 / altitude round1 before zod parse, so full precision is never written"
    - ".gitattributes eol=lf for byte-compared generated files (core.autocrlf=true on this machine)"

key-files:
  created:
    - data/schemas/photo.ts
    - scripts/photos/extract-exif.mjs
    - data/photos/exif-sidecar.json
    - data/__tests__/exif-sidecar.test.ts
    - .gitattributes
  modified:
    - .gitignore
    - package.json
    - package-lock.json

key-decisions:
  - "Sidecar GPS utc is GPSDateStamp + GPSTimeStamp as 'YYYY-MM-DDTHH:MM:SS[.fff]Z', fractional seconds kept as EXIF gives them"
  - "ICC description is parsed from the profile's 'desc' tag (v2 desc or v4 mluc) because sharp metadata() exposes only the raw ICC buffer; all four read 'sRGB IEC61966-2.1'"
  - "An empty EXIF string after trimming trailing NUL/whitespace is stored as null; a GPS block missing lat, lon or altitude yields gps: null (never a partial or guessed position)"
  - "--check with an existing but empty originals folder behaves like an absent folder (schema check only, hash check skipped)"
  - ".gitattributes pins data/photos/exif-sidecar.json to LF so the byte check survives a Windows checkout"

patterns-established:
  - "Generated-data --check output: one '<name>: stale <id> (<first differing field>)' line per entry, missing/extra-original lines, then '<name>: OK' or '<name>: N stale'"
  - "Schema failures print '<name>: schema <zod path>: <message>', one per issue"

requirements-completed: [DATA-02, DATA-05, DATA-06]

coverage:
  - id: D1
    description: "Originals moved to gitignored assets/photos-original/ outside public/; public/images/landscapes/ gone; nothing under assets/ tracked"
    requirement: DATA-05
    verification:
      - kind: other
        ref: "git check-ignore -q assets/photos-original/IMG_0605-...jpg && test ! -e public/images/landscapes && 4 jpgs && git ls-files assets public/images/landscapes empty"
        status: pass
    human_judgment: false
  - id: D2
    description: "Committed EXIF sidecar: 4 entries sorted by id with sha256, camera, lens, exposure, naive local DateTimeOriginal, GPS at 4 dp (alt 1 dp), gps null for r004-011"
    requirement: DATA-02
    verification:
      - kind: unit
        ref: "data/__tests__/exif-sidecar.test.ts (21 tests)"
        status: pass
      - kind: other
        ref: "npm run photos:exif -- --check"
        status: pass
    human_judgment: false
  - id: D3
    description: "extract-exif --check fails on any byte difference from a fresh extraction (stale <id> (<field>)) and validates schema only when originals are absent; write mode exits 1 with 'no originals found' and writes nothing"
    requirement: DATA-02
    verification:
      - kind: other
        ref: "tampered sha256 -> 'photos:exif: stale img-0605 (sha256)', exit 1; git checkout restores -> OK"
        status: pass
      - kind: other
        ref: "scratchpad CI simulation (no originals): check -> 'originals absent, schema OK, hash check skipped' exit 0; write -> 'no originals found' exit 1, no file written; 5-dp lat -> 'schema photos.0.gps.lat: max 4 decimals (DATA-06)' exit 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "Coord4 rejects more than 4 decimals; no committed lat/lon exceeds 4 decimals (DATA-06)"
    requirement: DATA-06
    verification:
      - kind: unit
        ref: "data/__tests__/exif-sidecar.test.ts#Coord4 rejects 46.01502 (5 decimals)"
        status: pass
      - kind: unit
        ref: "data/__tests__/exif-sidecar.test.ts#no lat or lon in the raw JSON text has more than 4 decimals"
        status: pass
    human_judgment: false
  - id: D5
    description: "npm run lint runs data:check; exif-reader pinned exactly with guard:parity OK"
    requirement: DATA-02
    verification:
      - kind: other
        ref: "npm run guard:parity && npm run lint (exit 0, last line 'photos:exif: OK')"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-10-24
status: complete
---

# Phase 8 Plan 02: Originals Out of Public and EXIF Sidecar (Stage 1) Summary

**The four GPS-bearing originals now live in a gitignored `assets/photos-original/`, and their EXIF is committed as a zod-validated sidecar. The sidecar holds a sha256 per original and GPS rounded to 4 decimals at extraction. `npm run lint` checks it on every run.**

## Performance

- **Duration:** about 7 min
- **Started:** 2026-10-24T14:21:47Z
- **Completed:** 2026-10-24T14:28:32Z
- **Tasks:** 2
- **Files modified:** 8 (5 created, 3 modified)

## Accomplishments

- The 194 MB of originals moved from `public/images/landscapes/` to `assets/photos-original/`. The read-only attribute was kept. The `.gitignore` entry was swapped before the move, and `git check-ignore` confirmed the new path was ignored first. `public/images/landscapes/` no longer exists, and no original was ever staged.
- `data/photos/exif-sidecar.json` matches D-04 exactly. The capture times are img-0605 2021-09-06T10:48:46, img-0629 2021-09-06T11:22:57 and img-0662 2021-09-07T10:58:25, all on a Canon EOS 6D Mark II with the EF24-105mm f/4L IS II USM. r004-011 has `gps: null` and keeps its raw scan date 2020-02-12T15:38:16 (D-03).
- `extract-exif --check` works in both settings. With originals present it re-hashes and re-extracts them, and it names the first differing field per entry. In CI, without originals, it runs the schema check only. It is wired into `lint` through `data:check`.
- 21 Jest invariants pin the D-04 facts, the D-03 trap, the 4-decimal rule (on the raw text and on the parsed values) and the schema boundaries: Coord4, NaiveLocal, strictObject, and sorted, unique ids.

## Task Commits

1. **Task 1 (tracer): originals out of public, exif-reader, schema, extract-exif with --check wired into lint** - `a5f4a78` (feat)
2. **Task 2: Jest invariants for the sidecar** - `b37c3ed` (test)

**Tracer gate:** the run was interactive, `human_verify_mode` was end-of-phase, and the verify step was automated only. All three `<verify>` commands were re-run after the commit and passed, so the plan continued to Task 2 with no checkpoint.

## Files Created/Modified

- `data/schemas/photo.ts`: the zod schemas `NaiveLocal`, `Coord4`, `ExifSidecarEntry` and `ExifSidecar`, plus same-name inferred types. It imports only `zod`.
- `scripts/photos/extract-exif.mjs`: builds the sidecar from the originals and supports `--check`. It only reads the images and never calls a sharp output method.
- `data/photos/exif-sidecar.json`: the committed stage-1 facts (schemaVersion 1).
- `data/__tests__/exif-sidecar.test.ts`: the sidecar and schema invariants.
- `.gitattributes`: keeps the sidecar at LF in every working tree.
- `.gitignore`: `public/images/landscapes/` is replaced by `assets/photos-original/` with the D-09 comment.
- `package.json` / `package-lock.json`: adds `exif-reader` 2.0.3 (exact pin) and the `photos:exif` and `data:check` scripts, and `lint` now runs `data:check`.

## Decisions Made

- The ICC description comes from the profile's `desc` tag, because sharp only returns the raw ICC buffer. It handles both the v2 `desc` type and the v4 `mluc` type. All four originals report `sRGB IEC61966-2.1`.
- GPS `utc` is written as `YYYY-MM-DDTHH:MM:SS[.fff]Z`, keeping the fractional seconds exactly as EXIF gives them. 08-08 can use it for the ±60 s offset cross-check (RESEARCH Pitfall 4).
- After trailing NUL and whitespace are trimmed, an empty string becomes `null`. A GPS block that lacks lat, lon or altitude becomes `gps: null` rather than a partial record.
- `--check` treats an existing but empty originals folder like an absent one, so only the schema is checked.
- The same-name type exports (`export type ExifSidecar = z.infer<...>`) are an addition to the interface block, made for 08-07 and 08-08. They are erased by type-stripping and change nothing at runtime.

## TDD Gate Compliance

Task 2 is `tdd="true"`, but the plan has Task 1 (the tracer) build the sidecar and schema first. Task 2 therefore pins invariants of an artifact that already exists. That is why the plan has one `test(08-02)` commit (`b37c3ed`), which comes after the `feat(08-02)` commit (`a5f4a78`) instead of before it. The order is by design, not a skipped RED.

- **RED (mutation):** the new suite ran against a working-tree sidecar in which img-0605's `dateTimeOriginal` was set back to the filename-derived `2022-02-01T09:47:03`, the D-04 regression this suite exists to catch. Evidence came from the flat-TAP scratchpad reporter and is stored in `.git/gsd-red/08-02-red.json`. `gsd check tdd-red-evidence` returned **RED_EVIDENCE_OK** (`target_test_failed`, 21 tests, 1 failing). Semantic assessment: only the target failed (`exif sidecar: D-04 capture facts > img-0605 dateTimeOriginal is the naive local 2021-09-06T10:48:46`), on its `toBe` assertion (expected `2021-09-06T10:48:46`, received `2022-02-01T09:47:03`). There was no load, syntax or fixture fault. The sidecar was then restored with `git checkout`.
- **Second mutation (sanity):** setting one lat to 5 decimals failed 3 tests: the schema parse, the raw-text regex and Coord4.
- **GREEN:** 21/21 pass against the committed sidecar. The full Jest run has 212 passing tests, and `guard:tests` is OK (311 against the 206 baseline).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `.gitattributes` to keep the sidecar at LF**
- **Found during:** Task 1
- **Issue:** This machine sets `core.autocrlf=true` system-wide. A plain `git checkout -- data/photos/exif-sidecar.json`, which the plan's own stale-detection criterion runs, would write the file back with CRLF. The byte comparison in `--check` would then fail, and a re-run would no longer be byte-identical.
- **Fix:** A new `.gitattributes` with `data/photos/exif-sidecar.json text eol=lf`. It covers only this one path.
- **Files modified:** `.gitattributes`
- **Verification:** `git ls-files --eol` shows `i/lf w/lf attr/text eol=lf`. After the tamper and `git checkout --` restore, `--check` printed `photos:exif: OK`.
- **Committed in:** `a5f4a78`

**2. [Rule 2 - Missing critical] Unknown CLI arguments fail**
- **Found during:** Task 1
- **Issue:** The plan allows `--check` as the only flag. A mistyped flag such as `--chek` would otherwise run write mode silently and overwrite the sidecar.
- **Fix:** Any argument other than `--check` exits 1 with a message.
- **Files modified:** `scripts/photos/extract-exif.mjs`
- **Verification:** `--bogus` exited 1 in the scratchpad simulation.
- **Committed in:** `a5f4a78`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both are small. Both protect the byte-equality and no-silent-overwrite contracts. No scope creep.

## Issues Encountered

- **img-0662 longitude is 7.7103, not the 7.7104 in CONTEXT D-06 and D-14.** EXIF gives 7° 42.6207′, which is 7.710345°. Under the specified `Math.round(v * 1e4) / 1e4` (half-up), 77103.45 rounds to 77103. The sidecar value is the correct output of the specified rule. The CONTEXT figure was an approximate reference. 08-08 samples the DEM at the rounded coordinates, so it should use the sidecar value, not the CONTEXT one. img-0605 lat serialises as `46.015`, because JSON drops the trailing zero of 46.0150.
- `npm install` reported 10 pre-existing audit findings (1 low, 3 moderate, 6 high) in the existing dependency tree. exif-reader has zero dependencies. These findings are out of scope and were not changed.

## Privacy Notes (T-08-03, T-08-04, T-08-06)

- `git check-ignore` confirmed the new folder was ignored before anything moved. Before each commit, the staged list was checked for images, `assets/` and `landscapes` paths, and none were staged.
- The committed sidecar carries GPS at 4 dp only. The full-precision DMS values never leave the process.
- D-12 (accepted, unchanged): the GPS-bearing originals remain in public git history at `287c2e9`. This plan rewrites nothing. 08-07 records the exposure in PROJECT.md.

## User Setup Required

None. No external service configuration is required. Tim's originals now live in `assets/photos-original/` (local only), so his backup should cover that folder.

## Next Phase Readiness

- 08-07 can read `sha256` and `sourceSha256` from the sidecar, and 08-08 can build stage 2 (sidecar to `data/generated/photos.ts`) on `ExifSidecar`.
- DATA-02, DATA-05 and DATA-06 are also declared by later Phase 8 plans. The shared-ID gate keeps them pending until the last of those plans finishes.

---
*Phase: 08-data-terrain-pipeline*
*Completed: 2026-10-24*

## Self-Check: PASSED

- FOUND: data/schemas/photo.ts, scripts/photos/extract-exif.mjs, data/photos/exif-sidecar.json, data/__tests__/exif-sidecar.test.ts, .gitattributes
- FOUND: a5f4a78, b37c3ed (ancestors of HEAD; evaluation-scope resolves both)
- Plan verification: `npm run lint` exit 0 (ends `photos:exif: OK`), `npm run type-check` exit 0, `npx jest data --silent` 21/21
