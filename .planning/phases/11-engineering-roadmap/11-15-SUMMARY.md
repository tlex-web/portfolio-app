---
phase: 11-engineering-roadmap
plan: 15
subsystem: ui
tags: [video, mp4, ffmpeg, d-27, server-component, coin-flip, demo, media-manifest]

requires:
  - phase: 11-09
    provides: "clip:derive pipeline, MP4 box walker in the served-asset guard, media manifest contract"
  - phase: 11-07
    provides: "sections/Demo.tsx slot and the coin-flip Project clip type"
  - phase: 11-11
    provides: "CaseStudy section order and the route-stages index"
provides:
  - "components/projects/DemoClip.tsx: Server clip figure (muted, controls, preload none, poster, no autoplay/loop/track, figcaption description)"
  - "coin-flip branch of sections/Demo.tsx: renders only with mediaManifest['coin-flip-toss'] and project.clip.description"
  - "e2e/demo-clip.spec.ts: omitted-state contract (no Demo h2, no MP4 request), read from data and manifest"
  - "Committed clip public/media/coin-flip-toss.9b55947b70.mp4 (211,784 B, 512x1010, 4.417 s) and poster coin-flip-toss-poster.8519b0dca7.webp"
  - "MIN_CLIP_SECONDS = 4 (D-27 clip length 4-10 s, Tim-approved)"
  - "Packet section I: clip description and intro drafts for 11-16"
affects: [11-16, 11-17, coin-flip case study Demo slot]

actuals:
  tokens: 4900
  tasks: 3
  commits: 20
  own_commits: 6
plan_head_before: b30fb7b017c986c0f0d5b99c391d3287816c7b0f
plan_head_after: 1b807ed02e3301c757b64495701f0b7c11e5388f

tech-stack:
  added: []
  patterns:
    - "Gate a media section on two independent facts (manifest entry and approved data description); either missing omits the section"
    - "Generated-manifest tests compare only the clip-independent header against write mode; --check proves the object against the files"

key-files:
  created:
    - components/projects/DemoClip.tsx
    - components/projects/__tests__/DemoClip.test.tsx
    - e2e/demo-clip.spec.ts
    - public/media/coin-flip-toss.9b55947b70.mp4
    - public/media/coin-flip-toss-poster.8519b0dca7.webp
  modified:
    - components/projects/sections/Demo.tsx
    - components/projects/CaseStudy.tsx
    - data/schemas/media-manifest.ts
    - data/__tests__/media-manifest.test.ts
    - scripts/media/build-clip.mjs
    - data/media/clips.json
    - data/generated/media-manifest.ts
    - .planning/phases/11-engineering-roadmap/11-CONTENT-PACKET.md
    - .planning/phases/11-engineering-roadmap/11-CONTEXT.md
    - .planning/phases/11-engineering-roadmap/11-UI-SPEC.md

key-decisions:
  - "D-27 clip length is 4-10 s, MIN_CLIP_SECONDS 4 (Tim, 2026-11-01: \"Lower minimum to 4 s (Recommended)\"); the 4.42 s one-flip recording ships as recorded"
  - "Clip encode: whole recording (start 0, duration 4.421), posterAt 3.5 s (coin at rest, HEADS shown), CRF 26, 60 fps; 211,784 B, 13% of the 1,572,864 B budget"
  - "Packet section I sits between H and the Answers log, so the lettered sections stay in order; 11-16 reads it by heading"

patterns-established:
  - "Clip pipeline end to end: gitignored original -> sidecar with sourceSha256 -> clip:derive -> hashed MP4 and WebP poster + manifest -> section shown only after the description is approved"

requirements-completed: [ENG-02]

coverage:
  - id: D1
    description: "DemoClip Server figure: muted property, controls, playsInline, preload none, poster and dimensions from the manifest, no autoplay/loop/track, accessible name and figcaption description"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "components/projects/__tests__/DemoClip.test.tsx (full Jest run 79 suites / 1257 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "coin-flip Demo branch omitted until a manifest entry and an approved description both exist; loading coin-flip requests no MP4"
    requirement: ENG-02
    verification:
      - kind: e2e
        ref: "e2e/demo-clip.spec.ts#coin-flip has no Demo section until its clip and description are approved; #loading coin-flip requests no MP4 (PW_PROD=1, chromium, 36/36 with case-study.spec.ts)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Clip length rule 4-10 s everywhere (schema, sidecar, manifest entry, --check message, tests, D-27 and UI-SPEC lines)"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "data/__tests__/media-manifest.test.ts#accepts 4 and 10 seconds and rejects 3.9 or 10.1 seconds"
        status: pass
    human_judgment: false
  - id: D4
    description: "Tim's recording encoded, stripped and poster-framed within budget; sidecar and manifest committed; original never committed"
    requirement: ENG-02
    verification:
      - kind: other
        ref: "npm run clip:derive -- --check (clips: OK); npm run guard:images (served-images: OK); git ls-files assets/clips-original (empty)"
        status: pass
      - kind: unit
        ref: "data/__tests__/media-manifest.test.ts (11 tests)"
        status: pass
    human_judgment: true
    rationale: "Whether the clip, its poster frame and the drafted description are acceptable is Tim's call in 11-16; nothing here is approved"

duration: about 20 min of execution (Task 1 in the first session, Tasks 2-3 in this continuation)
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 15: coin-flip clip figure and Tim's recording through clip:derive Summary

**Server `DemoClip` figure (muted, click-to-play, poster, text description) wired into coin-flip's Demo slot behind an approval gate, and Tim's 4.42 s one-flip recording encoded unedited to a 211,784-byte metadata-free MP4 plus WebP poster, with the clip minimum lowered to 4 s at his request and a description draft waiting in packet section I**

## Performance

- **Duration:** about 20 min of execution. Task 1 ran in the first session (RED commit 21:55:07Z, checkpoint 21:58:04Z). Tasks 2 and 3 ran in this continuation, 22:28:25Z to about 22:36Z.
- **Started:** 2026-11-01 (first session); continuation 2026-11-01T22:28:25Z
- **Completed:** 2026-11-01
- **Tasks:** 3 of 3
- **Files modified:** 17 (incl. the two binary media files)

## Accomplishments

- `DemoClip` is a Server Component. It renders a `<figure>` with a 256 px max frame and a `<video controls muted preload="none" playsInline>`. The poster, width and height come from the manifest. The fallback sentence is inside the video, and a `figcaption#demo-clip-description` holds the text description. There is no autoplay, no loop and no track element.
- `sections/Demo.tsx` renders coin-flip's Demo only when `mediaManifest['coin-flip-toss']` and `project.clip.description` both exist. The clip is now in the manifest, but `data/projects.ts` has no clip block until 11-16. So coin-flip still has no Demo h2 and requests no MP4, and e2e proves both.
- At Tim's request, clips may now run 4-10 s (`MIN_CLIP_SECONDS = 4`). The schema, the `--check` duration rule, the tests, D-27 in 11-CONTEXT.md and the two UI-SPEC clip rows all say 4-10 s.
- The whole recording went through `clip:derive` with no trim, padding or held frames. The output is `public/media/coin-flip-toss.9b55947b70.mp4`: 512 x 1010, 4.417 s, 60 fps, CRF 26, 211,784 bytes, one video track, no audio and no metadata. The poster is `coin-flip-toss-poster.8519b0dca7.webp`, the frame at 3.5 s.
- The description and the optional intro were drafted from the encoded frames into `11-CONTENT-PACKET.md` section I, for Tim to approve in 11-16.

## Task Commits

1. **Task 1: DemoClip and the coin-flip Demo branch.** `3680049` (test, RED) and `d9851a7` (feat, GREEN). `236ac76` (docs) recorded STATE at the checkpoint.
2. **Task 2: Tim records one coin flip.** This was a human-action checkpoint, so it has no code commit. Tim's replies are quoted below, and the 4 s minimum he chose is in `55a7448` (feat).
3. **Task 3: Encode, strip, poster and description draft.** `1b807ed` (feat).

**Plan metadata:** the SUMMARY commit follows this file. STATE and ROADMAP progress get their own docs commit.

Ledger: `git rev-list --count b30fb7b..1b807ed` = 20. Fifteen of those commits belong to plans 11-12 and 11-13, which ran on this branch while 11-15 waited at its checkpoint. They are not part of 11-15. 11-15's own commits are 3680049, d9851a7, 236ac76, 55a7448 and 1b807ed, and the SUMMARY commit makes six.

## Task 2: Tim's replies (verbatim)

**Reply 1, chat message, 2026-11-01.** The orchestrator had shown Task 2: record one flip, save it as `assets/clips-original/coin-flip-toss.<ext>`, then reply "dropped" or "none". It then reported two probed files (`coin-flip-toss_single.mp4`, 3.4 s, and `coin-flip-toss_threetimesbothsides.mp4`, 10.26 s) and asked which one to use. Tim replied:

```
i added another but that one should be final, one flip with ~4s
```

This counts as "dropped". The clip is `assets/clips-original/coin-flip-toss.mp4`: 3,009,997 bytes, H.264 1066 x 2102 at 120 fps nominal, with an AAC audio track, 4.420900 s long, sha256 `9445ed117114ed0c51c8322ee544900ed48d2c70602e03b56809143d993970f3`. Tim gave no tap time and no landing face, so both were read from the frames. The folder now holds only this file.

**Reply 2, question dialog, 2026-11-01.** The question, verbatim: "The final coin-flip clip (coin-flip-toss.mp4, one flip) is 4.42 s, but D-27 and the clip pipeline require 5–10 s, so the pipeline would reject it. How should 11-15 handle it?" Tim selected:

```
Lower minimum to 4 s (Recommended)
```

The option description shown with it: "Change D-27 to 4–10 s and set MIN_CLIP_SECONDS = 4 (with its tests and the --check). The footage ships exactly as recorded, apart from the usual encode and metadata strip."

Task 2 verification: `ls assets/clips-original/` shows `coin-flip-toss.mp4`. `git check-ignore -q assets/clips-original/coin-flip-toss.mp4` exits 0. `git status --porcelain -- assets/` prints nothing.

## Clip parameters (Task 3)

| Setting | Value |
|---------|-------|
| sourceSha256 | `9445ed117114ed0c51c8322ee544900ed48d2c70602e03b56809143d993970f3` |
| start / duration | 0 / 4.421 s. This is the whole recording. The encoded mvhd duration is 4.417 s, inside the 0.1 s tolerance |
| posterAt | 3.5 s: the coin at rest, with HEADS below it |
| fps / crf | 60 (the source rate, capped at 60) / 26 |
| MP4 | `public/media/coin-flip-toss.9b55947b70.mp4`, 512 x 1010, **211,784 bytes** against a budget of 1,572,864. The first try fit, so no fps or CRF fallback was needed |
| Poster | `public/media/coin-flip-toss-poster.8519b0dca7.webp`, 512 x 1010, 6,604 bytes |

The frames viewed were taken from the encoded clip at 0.5, 1.3, 1.5, 1.7, 1.9, 2.1, 2.3, 2.6, 3.5 and 4.3 s, plus a 10 fps contact sheet, all in the session scratchpad. Up to about 1.5 s the coin rests. Then it rises toward the viewer and turns over several times, showing both faces. It lands flat at about 2.4 s. From about 2.5 s it rests face up and the HEADS label shows below it. The only UI on screen is a small settings gear. There are no notifications, no debug overlays and nothing personal.

## Description draft for 11-16 (not approved)

Description (`clip.description`):

> A coin lies flat on a dark screen. About a second and a half in, it is flipped: it rises toward the viewer, turns over several times, then drops back and lands flat. It comes to rest face up, and the word HEADS appears below it.

Intro, optional (`clip.intro`):

> One toss, recorded from the screen of my own device.

The draft uses no polish words and does not mention the camera following the coin (claim.cf-stage-toss, claim.cf-stage-landing, Pitfall 9). The same text is in packet section I.

## Files Created/Modified

- `components/projects/DemoClip.tsx`: Server clip figure (Task 1)
- `components/projects/__tests__/DemoClip.test.tsx`: element contract and the two-fact branch gate (Task 1)
- `components/projects/sections/Demo.tsx`: coin-flip branch (Task 1)
- `components/projects/CaseStudy.tsx`: passes the project to the Demo slot (Task 1; 11-13 edited it afterwards)
- `e2e/demo-clip.spec.ts`: omitted state and no early MP4 request (Task 1)
- `data/schemas/media-manifest.ts`: `MIN_CLIP_SECONDS = 4`
- `scripts/media/build-clip.mjs`: header comments now say 4-10 s (the message uses the constants)
- `data/__tests__/media-manifest.test.ts`: tests for the 4-10 s bounds and for a committed clip
- `data/media/clips.json`, `data/generated/media-manifest.ts`: the coin-flip-toss entry
- `public/media/coin-flip-toss.9b55947b70.mp4`, `public/media/coin-flip-toss-poster.8519b0dca7.webp`: the derivatives
- `.planning/phases/11-engineering-roadmap/11-CONTENT-PACKET.md`: section I and a header pointer to it
- `.planning/phases/11-engineering-roadmap/11-CONTEXT.md`: D-27 now says 4–10 s "(changed 2026-11-01, Tim, 11-15; it was 5–10 s)"
- `.planning/phases/11-engineering-roadmap/11-UI-SPEC.md`: the two clip rows now say 4–10 s

## Decisions Made

See `key-decisions`. The main one is Tim's: the clip minimum drops from 5 s to 4 s, so his one-flip recording ships exactly as recorded.

## Deviations from Plan

### Tim-approved deviation

**1. [Tim-approved] Clip length 4-10 s instead of 5-10 s**
- **Found during:** Task 2. The final recording is 4.42 s, and the 11-09 schema and `--check` reject anything under 5 s.
- **Decision:** Tim chose "Lower minimum to 4 s (Recommended)" (Reply 2 above, verbatim).
- **Change:** `MIN_CLIP_SECONDS` went from 5 to 4. The test now asserts 4 and accepts 4 and 10 s while rejecting 3.9 and 10.1 s; it used to reject 4 and 11. The build-clip header comments, D-27 in 11-CONTEXT.md and the two UI-SPEC clip rows (Native controls, motion table) were updated too. The `--check` message prints the constants, so it now reads "outside 4-10 s".
- **Footage:** unedited (start 0, full length). There is no trim, padding or frame hold.
- **Committed in:** 55a7448

### Auto-fixed Issues

**2. [Rule 1 - Bug] media-manifest tests assumed an empty manifest**
- **Found during:** Task 3. After `clip:derive`, two 11-09 tests failed: "is empty while the sidecar holds no clip" and "equals what write mode produces from an empty sidecar, byte for byte". Both hard-coded the no-clip state. The plan's Task 3 verify runs this test file.
- **Fix:** both tests were rewritten, not deleted. The first now checks that the manifest lists exactly the sidecar clips, that each entry passes the schema and stays within budget and 4-10 s, and that the file sizes match. The second compares the clip-independent header and interface with write mode's output for an empty sidecar, byte for byte. The full object is already compared against the files by `--check`. The "passes on the repo" test was renamed to say what it now proves.
- **Files modified:** data/__tests__/media-manifest.test.ts
- **Verification:** 11/11 pass. Full Jest: 79 suites, 1257 tests.
- **Committed in:** 1b807ed

**3. [Scope note] UI-SPEC rows updated along with D-27**
- The orchestrator asked for the D-27 line and "4–10 s everywhere". The two UI-SPEC clip rows are part of the design contract that 11-16 and the verifier check against, so they were changed in the same commit. 11-RESEARCH.md, the 11-09 plan and summary, and packet section H were left as historical records. Section I records the change.

---

**Total deviations:** 1 Tim-approved, 1 auto-fixed (Rule 1), 1 scope note.
**Impact on plan:** the clip ships unedited under the new 4 s minimum. The test rewrite was needed for the committed clip. There is no other scope change.

## Issues Encountered

- `npm run guard:images` reported both new media files as "listed in the manifest but not tracked" until they were staged. The guard reads tracked files, so staging resolved it, and it then printed OK.
- The production build for e2e rewrote `public/service-worker.js`. Its precache list had no `/media/` entry. The file was restored with `git restore` and was not committed.

## Verification

- `npm run clip:derive -- --check` printed `clips: OK`. `npm run guard:images` printed `served-images: OK`. `npm run data:check` passed.
- `npm run lint` exited 0, `npm run type-check` exited 0, and `npx jest --silent` passed 79 suites / 1257 tests.
- `PW_PROD=1 npx playwright test e2e/demo-clip.spec.ts e2e/case-study.spec.ts --project=chromium`: 36 passed, including "loading coin-flip requests no MP4".
- Acceptance: the hashed MP4 count is 1, and the size check exits 0 (211,784 bytes, at most 1,572,864). `git ls-files assets/clips-original` prints nothing. `git show --name-only 1b807ed` lists no `data/projects.ts`. The committed blobs hash to their names (9b55947b70, 8519b0dca7).
- ENG-02 stays open: `requirements.ready-ids` reports it blocked by sibling plans that have not finished (11-14, 11-16, 11-17).

## User Setup Required

None.

## Next Phase Readiness

- 11-16 can show Tim `public/media/coin-flip-toss.9b55947b70.mp4` and its poster, along with the section I draft. Once he approves, the clip block (`id: 'coin-flip-toss'`, description and optional intro) goes into `data/projects.ts` and the Demo section appears. If he rejects it, `clips.json` goes back to `{ "clips": [] }` and `npm run clip:derive` removes the media.
- `e2e/demo-clip.spec.ts` reads the manifest and the data, so its omitted-state test flips to the populated contract that 11-16 adds.

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-01*

## Self-Check: PASSED

- Found on disk: DemoClip.tsx, DemoClip.test.tsx, demo-clip.spec.ts, both public/media files, clips.json, media-manifest.ts.
- Commits 3680049, d9851a7, 236ac76, 55a7448 and 1b807ed are ancestors of HEAD.
