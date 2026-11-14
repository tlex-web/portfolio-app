---
phase: 15-region-plate-data-model
plan: 12
subsystem: guards
tags: [served-images, telemetry, mp4, gitignore, selftest, DATA-15]

requires:
  - phase: 15-11
    provides: selftest.mjs and scripts/README.md as left by wave 11 (one plan at a time in this checkout)
provides:
  - "telemetry rule in check-served-images.mjs: 13 sidecar and track types, case-insensitive, GeoJSON allowed (D-20)"
  - "repo-mode telemetry scan over git ls-files -co --exclude-standard plus a full public/ walk, ignored files included (D-21)"
  - ".gitignore block of 13 bracket-class patterns (D-22)"
  - "synthetic MP4 telemetry-track fixtures spliced from good-mp4 at selftest run time, plus a determinism case (D-23)"
  - "scripts/README.md telemetry and video rule rows; contrast paragraph says 47 pairs (D-28)"
affects: [16-photo-ingest, 19-drone-clip, served-images guard]

actuals:
  tokens: 6700
  tasks: 3
  commits: 3
plan_head_before: c788109a4d0cc180b1a5031a866b81e62b3e8844
plan_head_after: 796feff16e4de1e38890844cb43620188d579e52

tech-stack:
  added: []
  patterns:
    - "Telemetry fixtures are generated into temp roots at selftest run time, never committed (the D-22 ignore block would hide them and a real file carries GPS)"
    - "Repo-mode guard cases run the guard with no --root and cwd set to a temp git work tree built at module load"

key-files:
  created: []
  modified:
    - scripts/guards/check-served-images.mjs
    - scripts/guards/lib/mp4-boxes.mjs
    - scripts/guards/selftest.mjs
    - .gitignore
    - scripts/README.md

key-decisions:
  - "15-12: no originals-folder exception in the telemetry rule: an ignored, untracked sidecar under assets/photos-original/ or assets/clips-original/ is skipped by --exclude-standard, a force-added (tracked) one fails (flagged assumption A-15-12, pending Tim's review; reversible in one collect() condition and one selftest case)"
  - "15-12: the five MP4 telemetry-track clips are built in memory with withTrack(goodMp4(), trak(handler, entry)); a determinism case pins two builds byte-equal at 1,348 B each; no MP4 enters git"

patterns-established:
  - "telemetryTempRoots: one cleanup array for every DATA-15 temp root (sidecar roots, temp git repos, MP4 track roots, the no-git dir)"

requirements-completed: [DATA-15]

coverage:
  - id: D1
    description: "The served-asset guard rejects all 13 D-20 sidecar and track types in any case, with a telemetry violation naming the file and the fix; .geojson passes"
    requirement: DATA-15
    verification:
      - kind: integration
        ref: "scripts/guards/selftest.mjs#served-images: telemetry: every sidecar and track type fails in any case, GeoJSON passes"
        status: pass
      - kind: integration
        ref: "scripts/guards/selftest.mjs#served-images: telemetry: a DJI .SRT sidecar fails"
        status: pass
    human_judgment: false
  - id: D2
    description: "Repo mode scans tracked plus untracked-unignored files and every file under public/ (ignored included); an ignored untracked original passes, a force-added one fails; outside a work tree it exits 1 with 'scope: git ls-files failed'"
    requirement: DATA-15
    verification:
      - kind: integration
        ref: "scripts/guards/selftest.mjs#served-images: telemetry: an untracked unignored sidecar fails"
        status: pass
      - kind: integration
        ref: "scripts/guards/selftest.mjs#served-images: telemetry: an ignored file under public/ fails"
        status: pass
      - kind: integration
        ref: "scripts/guards/selftest.mjs#served-images: telemetry: an ignored untracked original's sidecar passes"
        status: pass
      - kind: integration
        ref: "scripts/guards/selftest.mjs#served-images: telemetry: a force-added sidecar under the originals folder fails"
        status: pass
      - kind: integration
        ref: "scripts/guards/selftest.mjs#served-images: telemetry: outside a git work tree the scan fails, never a silent pass"
        status: pass
      - kind: other
        ref: "npm run guard:images -> served-images: OK"
        status: pass
    human_judgment: false
  - id: D3
    description: ".gitignore ignores the 13 types in every case (bracket classes), so git add -A never stages them"
    requirement: DATA-15
    verification:
      - kind: other
        ref: "grep -cE '^\\*\\.(\\[[a-zA-Z]{2}\\])+$' .gitignore -> 13; git check-ignore -q X.SRT && git check-ignore -q y.gpx -> 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Synthetic MP4 clips with a DJI djmd, DJI dbgi, GoPro gpmd, subtitle and text track each fail the video rule; built deterministically at run time, none committed"
    requirement: DATA-15
    verification:
      - kind: integration
        ref: "scripts/guards/selftest.mjs#served-images: an MP4 with a <kind> track fails the video rule (5 cases)"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#mp4-boxes: the spliced telemetry clips are deterministic"
        status: pass
      - kind: other
        ref: "git ls-files -co --exclude-standard -- scripts/guards/__selftest__/served-images | grep -ciE '\\.mp4$' -> 6"
        status: pass
    human_judgment: false
  - id: D5
    description: "scripts/README.md documents the telemetry scope and the video track rule, and says the contrast guard measures 47 pairs"
    verification:
      - kind: other
        ref: "grep -c '47 pairs' scripts/README.md -> 1; grep -c '36 pairs' -> 0"
        status: pass
    human_judgment: true
    rationale: "Doc wording accuracy and readability need a human read; the greps prove only the pair count and presence of the rows"

duration: 8min
completed: 2026-11-14
status: complete
---

# Phase 15 Plan 12: Telemetry Guard (DATA-15) Summary

**The served-asset guard now fails on 13 drone, camera and GPS sidecar types (any case, tracked, untracked-unignored or anywhere under public/), .gitignore blocks them case-proof, and five synthetic spliced MP4s prove the box walker rejects DJI, GoPro, subtitle and text tracks**

## Performance

- **Duration:** about 8 min
- **Started:** 2026-11-14T22:13:52Z
- **Completed:** 2026-11-14T22:21:27Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- `telemetry` rule (`TELEMETRY_EXT`, `TELEMETRY_PATHSPECS`, `isTelemetry`): `.srt .lrf .dat .lrv .thm .xmp .gpx .kml .kmz .nmea .igc .fit .tcx`, case-folded, one violation per file: `<rel> telemetry: <ext> is a drone, camera or GPS sidecar or track (DATA-15); delete it, never commit or serve it`. `.geojson` passes.
- Repo mode: `repoTelemetry()` unions `git ls-files -z -co --exclude-standard` (new `gitLsFilesVisible`, throws on git failure like `gitLsFiles`) with a full walk of `public/`, minus `__selftest__`, de-duplicated. Fixture mode only gained the rule.
- `.gitignore`: 13 bracket-class lines (`*.[sS][rR][tT]` ...) under a DATA-15/D-22 comment.
- Selftest 232 -> 250 cases: 7 telemetry cases (fixture mode plus four temp-git-repo cases and the outside-a-work-tree case), 5 MP4 track guard cases, 5 `checkMp4` fn cases, 1 determinism case.
- `mp4-boxes.mjs` track message: `(need exactly one video track: no audio, telemetry or subtitle track)`.
- README: telemetry scope paragraph, `telemetry` and `video-format`/`video` rule rows, contrast pair count 36 -> 47 with the toggle and trail pairs listed.

## Task Commits

1. **Task 1: one drone sidecar fails end to end (tracer)** - `5fec09b` (feat)
2. **Task 2: all 13 types, -co --exclude-standard plus public/ walk, .gitignore block, temp-git-repo proofs** - `a1c6dcd` (feat)
3. **Task 3: synthetic MP4 telemetry-track fixtures, track message, README 47 pairs** - `796feff` (test)

Tracer gate (Task 1, end-of-phase mode, automated-only verify): re-ran selftest (233/233, the telemetry case PASS) and `guard:images` (OK) before expanding.

## Files Created/Modified

- `scripts/guards/check-served-images.mjs` - telemetry constants, rule, `gitLsFilesVisible`, `repoTelemetry`, header docs
- `scripts/guards/lib/mp4-boxes.mjs` - clearer track message
- `scripts/guards/selftest.mjs` - splice helpers under the provenance comment, `tempTelemetryRoot`, `tempTelemetryRepo`, `tempNoGitDir`, `tempMp4TrackRoot`, 18 new cases, `telemetryTempRoots` cleanup
- `.gitignore` - 13-line telemetry block
- `scripts/README.md` - telemetry and video rows, scan scope, 47 pairs

## Decisions Made

- Flagged assumption A-15-12 implemented as planned: no originals-folder exception. Ignored, untracked originals are skipped by `--exclude-standard`; a force-added sidecar there fails. Pending Tim's review; reversing it is one path condition in `repoTelemetry()` and one selftest case.
- The temp git repos are built at module load (like the same-classnames repos) because a case's `cwd` is read when the case runs, not after `setup()`.
- The outside-a-work-tree case records whether `git rev-parse --is-inside-work-tree` fails in its temp dir and reports through `check` if git finds a work tree there, so the case fails rather than proving nothing and does not crash the runner.
- The MP4 track cases are generated from one `TELEMETRY_TRACKS` table (name, handler, entry, kind), so guard, `checkMp4` and determinism cases cannot drift apart. The determinism case also pins 1,348 B, the RESEARCH measurement.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] README video rule row and video scope**
- **Found during:** Task 3
- **Issue:** The plan asks the README to say the video rule's one-video-track requirement rejects telemetry and subtitle tracks, but the check-served-images table had no `video` or `video-format` row and the scope sentence listed images only.
- **Fix:** Added a `video-format` / `video` row (including the D-23 track kinds) and named the tracked video extensions in the scope sentence.
- **Files modified:** scripts/README.md
- **Committed in:** 796feff

**2. [Rule 2 - Missing critical] Violation counts pinned in the telemetry expectations**
- **Found during:** Tasks 1-3
- **Issue:** Matching only the telemetry line would let an extra, unexpected violation pass unnoticed.
- **Fix:** Each telemetry and MP4-track guard case also expects `served-images: N violations` with the exact N (1, or 13 for the all-types case).
- **Files modified:** scripts/guards/selftest.mjs
- **Committed in:** 5fec09b, a1c6dcd, 796feff

---

**Total deviations:** 2 auto-fixed (2 missing critical, both documentation or test-strength additions)
**Impact on plan:** No scope creep; the guard behaviour is exactly as planned.

## Issues Encountered

- The guard, `mp4-boxes.mjs`, README and `.gitignore` are CRLF in this checkout (`core.autocrlf=true`), so a scripted LF string replacement found nothing. The Edit tool was used instead. No file was changed by that failed attempt.
- `/tmp` holds 28 `guard-selftest-*` directories from a run at 22:00 (before this plan). Each holds `root/data`, so they come from another case's helper, not from the DATA-15 helpers, which all clean up through `telemetryTempRoots`. Out of scope; not changed.

## Verification

- `npm run guard:selftest`: 250/250 (7 `PASS served-images: telemetry`, 5 new MP4-track guard cases, `PASS mp4-boxes: the spliced telemetry clips are deterministic`).
- `npm run guard:images`: `served-images: OK`. No tracked, untracked-unignored or `public/` file has a telemetry extension. The local untracked paths (`.claude/`, `.planning/state.json`, `.planning/ui-reviews/`, `graphify-out/`) hold none; the guard matches on extension and never reads a file's contents for this rule, so `.env*` files are never opened.
- `npm run lint`: exit 0. `npm run type-check`: exit 0. Full Jest: 113 suites / 1910 tests pass (`data/__tests__/plates.test.ts` reads the guard source; its 42 tests pass).
- Acceptance greps: `TELEMETRY_EXT` 3, README `telemetry` >= 1, `exclude-standard` 4, `.gitignore` bracket lines 13, `check-ignore` X.SRT and y.gpx exit 0, real-tree `ls-files -co` telemetry check exit 0, `47 pairs` 1, `36 pairs` 0, `withTrack` 5, provenance comment 1, committed or untracked fixture MP4s 6.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Success criterion 4 holds before Phase 16 ingests new originals and Phase 19 ships a drone clip.
- Tim to confirm A-15-12 (a force-added sidecar under the originals folders fails).
- Ready for 15-13.

## Self-Check: PASSED

- Files: all five modified files exist; no file was created outside the plan.
- Commits: 5fec09b, a1c6dcd, 796feff are ancestors of HEAD; `git rev-list --count c788109..HEAD` = 3.

---
*Phase: 15-region-plate-data-model*
*Completed: 2026-11-14*
