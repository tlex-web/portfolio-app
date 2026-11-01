---
phase: 11-engineering-roadmap
plan: 16
subsystem: ui
tags: [video, d-27, d-16, d-21, coin-flip, demo, e2e, playwright, media-manifest]

requires:
  - phase: 11-15
    provides: "DemoClip figure, coin-flip Demo branch gated on manifest entry + approved description, committed clip and poster, packet section I drafts"
  - phase: 11-14
    provides: "Route stages index and caseStudySections(), which follow hasDemo()"
provides:
  - "coin-flip clip block in data/projects.ts (id coin-flip-toss, Tim-approved intro and description, byte-identical to packet section I)"
  - "coin-flip Demo section and its Route stages index entry, live"
  - "Data test: coin-flip clip id exists in the media manifest; clip copy equals the approved drafts"
  - "e2e/demo-clip.spec.ts: populated E18 contract (attributes, poster, no early MP4 request, reduced motion, 375 overflow, 256 px frame, layout, index entry)"
affects: [11-17, coin-flip visual baselines, coin-flip case study Demo slot]

actuals:
  tokens: 3400
  tasks: 2
  commits: 2
plan_head_before: ea33cad52e6845b86108daf9f1eb110dcf1b24bb
plan_head_after: 28cabae5ab5d03fc62c0bb5d1593abf00a12167b

tech-stack:
  added: []
  patterns:
    - "Populated-contract e2e tests call approved(), which throws a 'rewrite this describe to the omitted state' error if the data loses the clip, instead of being skipped or conditionally registered"

key-files:
  created: []
  modified:
    - data/projects.ts
    - data/__tests__/projects.test.ts
    - e2e/demo-clip.spec.ts
    - e2e/case-study.spec.ts
    - .planning/phases/11-engineering-roadmap/11-CONTENT-PACKET.md

key-decisions:
  - "Tim approved the coin-flip clip, its 3.5 s poster, the description and the intro exactly as drafted (reply \"approve\", 2026-11-01); the approve branch ran, with no re-encode"
  - "case-study.spec.ts 'coin-flip has no Demo section and no terminal' rewritten (not deleted) to 'coin-flip's Demo is its approved clip, never a terminal', and its section-order helper now expects coin-flip's Demo when the clip is approved"

patterns-established:
  - "Approved copy is pinned twice: verbatim in data, and as a byte-identical constant in the data test (APPROVED_CLIP_COPY, like APPROVED_BOX_CODE_COPY)"

requirements-completed: [ENG-02]

coverage:
  - id: D1
    description: "coin-flip clip block holds exactly Tim's approved intro and description, and its id exists in the media manifest"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "data/__tests__/projects.test.ts#coin-flip clip id exists in the media manifest; #coin-flip's clip copy is byte-identical to the approved packet drafts"
        status: pass
    human_judgment: false
  - id: D2
    description: "coin-flip Demo section renders after the earlier slots: muted, controls, preload none, playsinline, no autoplay/loop, poster and size from the manifest, named and described, fallback sentence, no MP4 request before play, reduced motion identical, no 375 overflow, frame at most 256 px, description beside from 768 px and below on phones, Route stages lists Demo"
    requirement: ENG-02
    verification:
      - kind: e2e
        ref: "e2e/demo-clip.spec.ts (PW_PROD=1, chromium + firefox, 124/124 with case-study-page.spec.ts and case-study.spec.ts)"
        status: pass
    human_judgment: false
  - id: D3
    description: "How the populated Demo section looks (poster under native controls, spacing, the HEADS label under the control bar) at 375 and 1440 px"
    requirement: ENG-02
    verification: []
    human_judgment: true
    rationale: "Visual quality is Tim's call in 11-17's visual review; screenshots are in the session scratchpad"

duration: about 7 min (continuation; Task 1 was the checkpoint in the first session)
completed: 2026-11-02
status: complete
---

# Phase 11 Plan 16: coin-flip Demo clip approved and live Summary

**coin-flip now shows its Demo section: Tim approved the 4.4 s one-flip clip, its 3.5 s poster, the description and the intro as drafted, so the clip block went into `data/projects.ts` verbatim and the muted, click-to-play contract is proven attribute by attribute in Chromium and Firefox.**

## Task 1: Tim's reply (verbatim)

The orchestrator asked, in chat on 2026-11-01: "Should coin-flip ship this clip, poster and description?" It showed the served clip `public/media/coin-flip-toss.9b55947b70.mp4` (4.4 s, 512x1010, no audio, no metadata, 212 KB, untrimmed), the poster (the frame at 3.5 s, coin at rest with HEADS below), the contact sheet, and the two drafts quoted word for word from 11-CONTENT-PACKET.md section I:

- Description: "A coin lies flat on a dark screen. About a second and a half in, it is flipped: it rises toward the viewer, turns over several times, then drops back and lands flat. It comes to rest face up, and the word HEADS appears below it."
- Intro (optional): "One toss, recorded from the screen of my own device."

Options offered: "approve" (clip, poster, description and intro ship as above), "edit: …", "edit: no intro", "edit: poster at X s", "reject".

Tim's message, verbatim:

```text
approve
```

**Branch that ran: approve.** The clip, the 3.5 s poster, the description and the intro all ship exactly as drafted. Nothing was re-encoded, and `data/media/clips.json`, the manifest and `public/media/` are unchanged.

## Performance

- **Duration:** about 7 min for this continuation (2026-11-01T23:00:48Z to about 23:08Z). Task 1 was the checkpoint, recorded in 48602d8 by the first session.
- **Tasks:** 2 of 2
- **Files modified:** 5 (4 code/test files, plus the content packet)

## Accomplishments

- `data/projects.ts`: coin-flip has `clip: { id: 'coin-flip-toss', intro, description }`, byte-identical to the drafts above. `hasDemo()` is now true for coin-flip, so the Demo section and its Route stages entry both render (Problem, Pipeline, Privacy, Metrics, Demo, Stack, Next steps).
- `data/__tests__/projects.test.ts`: three new tests. "coin-flip clip id exists in the media manifest" passes trivially without a clip block and checks the hashed `src` and `poster.src` shapes. A foreign clip id fails the strict parse. The clip copy is compared with an `APPROVED_CLIP_COPY` constant.
- `e2e/demo-clip.spec.ts` (51 to 240 lines): the two 11-15 tests were generalised and renamed, not removed. "coin-flip shows a Demo section exactly when its clip and description are approved" and "loading coin-flip makes no request for the MP4 before play (preload none)" still work in either state. A third data-driven test checks that the Route stages index lists Demo exactly when the clip is approved. A populated describe adds 7 tests:
  - the h2 order and the intro
  - controls, preload none, playsinline, no autoplay and no loop, the `muted` property, paused, the poster, width and height from the manifest, the single `video/mp4` source, and no track
  - the accessible name, plus `aria-describedby` text equal to the data description
  - the poster served as image/webp, and the fallback sentence inside `<video>`
  - reduced motion: the same attributes, the manifest poster, paused at currentTime 0, and no MP4 request
  - at 375 px: no sideways scroll, the frame at most 256 px with its box reserved, and the description below it
  - at 1440 px: the description beside the frame, and the index lists Demo
- `e2e/case-study.spec.ts`: the test at the old line 117 was rewritten, not deleted (see Deviations). The section-order helper now expects coin-flip's Demo.
- `11-CONTENT-PACKET.md`: section I now carries an approval status line, and the answers log has Reply 6 with the question, the options and Tim's message.

## Task Commits

1. **Task 1: Tim approves, edits or rejects the coin-flip clip, poster and description.** This was a checkpoint, so it has no code commit. STATE at the checkpoint is `48602d8` (docs). The reply is quoted above.
2. **Task 2: the approved description goes live and the clip contract is proven.** `28cabae` (feat).

**Plan metadata:** this SUMMARY and the packet answer are in the docs commit that follows. STATE and ROADMAP get their own docs commit.

Ledger: `git rev-list --count ea33cad..28cabae` = 2 (48602d8 and 28cabae).

## Files Created/Modified

- `data/projects.ts`: coin-flip clip block
- `data/__tests__/projects.test.ts`: manifest cross-check, foreign-id parse failure, approved-copy pin
- `e2e/demo-clip.spec.ts`: populated E18 contract
- `e2e/case-study.spec.ts`: coin-flip Demo test rewritten; `expectedLabels` includes coin-flip's Demo
- `.planning/phases/11-engineering-roadmap/11-CONTENT-PACKET.md`: section I status line and Reply 6

## Decisions Made

See `key-decisions`. The only decision is Tim's: approve as drafted.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] case-study.spec.ts assumed coin-flip has no Demo**
- **Found during:** Task 2
- **Issue:** "coin-flip has no Demo section and no terminal (UI-SPEC E10)" would fail once the clip shipped. The section-order helper `expectedLabels` only expected Demo on box. Its filter would then have quietly dropped coin-flip's Demo from the order check, so the test passed while proving less.
- **Fix:** the test was rewritten as "coin-flip's Demo is its approved clip, never a terminal (UI-SPEC E10, E18)". The Demo h2 and the `section#demo video` counts follow the data, and the terminal region count stays at 0. `expectedLabels` now mirrors `hasDemo()` (box: `demo`; coin-flip: manifest entry and clip description). The test was not deleted.
- **Files modified:** e2e/case-study.spec.ts
- **Verification:** 124/124 e2e on the production build, chromium and firefox
- **Committed in:** 28cabae

### Scope notes

**2. Packet answers log.** The plan does not ask for it. Packet section I said "Nothing here is approved yet", so a status line and Reply 6 (verbatim, in the format of Replies 1-5) were added. That keeps the packet from contradicting the shipped data. The intro sentence of the answers log still says "five replies" and was left as a historical record.

**3. Extra data tests.** Besides the planned manifest cross-check, two small tests were added: a foreign clip id fails the strict parse, and the clip copy is pinned byte for byte. These follow the box `APPROVED_BOX_CODE_COPY` precedent (D-21).

---

**Total deviations:** 1 auto-fixed (Rule 1), 2 scope notes.
**Impact on plan:** the planned rewrite of the existing coin-flip Demo test, plus test hardening. No production code beyond the data block changed.

## Issues Encountered

- Prettier reformatted the two new test files before the commit. The production build rewrote `public/service-worker.js`, which was restored with `git restore` and not committed.
- The orchestrator asked for screenshots of the coin-flip Demo section at 375 and 1440 px. They were taken with Playwright's bundled Chromium against the production server, under reduced motion. Two things show up in them that matter for 11-17 (see below).

## Verification

- `npx jest data/__tests__/projects.test.ts data/__tests__/media-manifest.test.ts --silent`: 44 passed. Full `npx jest --silent`: 82 suites, 1288 tests passed.
- `npm run clip:derive -- --check` printed `clips: OK`. `npm run guard:images` printed `served-images: OK`. `npm run data:check`, `npm run lint` and `tsc --noEmit` all exit 0.
- `PW_PROD=1 npx playwright test e2e/demo-clip.spec.ts e2e/case-study-page.spec.ts e2e/case-study.spec.ts --project=chromium --project=firefox`: **124 passed**, including firefox.
- Acceptance: `grep -c "id: 'coin-flip-toss'" data/projects.ts` prints 1. `--list` for demo-clip.spec.ts finds 1 test containing "no request" and 1 containing "muted". There are no `.only(`, `.skip(` or `.fixme(` calls.

## User Setup Required

None.

## Next Phase Readiness

- **11-17: the coin-flip baselines DO include the Demo section** (poster, native controls, intro and description), so coin-flip's visual baselines need re-capturing. Its Route stages index now lists 7 entries (01-07).
- **Visual-baseline risk for 11-17:** Playwright's bundled Chromium cannot play H.264 (Pitfall 8). Its native controls drew a small white loading or spinner mark over the poster, at a different position in each capture: a dash under the coin in one, an arc over the coin in another. That will make the Demo region nondeterministic. Mask `section#demo video` (or its frame) in the visual specs, or allow for it. The controls bar also covers the HEADS label at the bottom of the poster. That is a design note for Tim's visual review, not a test failure.
- Screenshots for Tim's review (session scratchpad, not committed):
  - C:/Users/tim/AppData/Local/Temp/claude/C--Users-tim-MyDocuments-Programming-portfolio-app/ebfba413-5614-4b39-a7f0-e6f6989d984a/scratchpad/11-16/coin-flip-demo-375.png
  - C:/Users/tim/AppData/Local/Temp/claude/C--Users-tim-MyDocuments-Programming-portfolio-app/ebfba413-5614-4b39-a7f0-e6f6989d984a/scratchpad/11-16/coin-flip-demo-1440.png
  - Viewport versions: coin-flip-demo-viewport-375.png and coin-flip-demo-viewport-1440.png in the same folder.

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-02*

## Self-Check: PASSED

- Modified files present: data/projects.ts, data/__tests__/projects.test.ts, e2e/demo-clip.spec.ts, e2e/case-study.spec.ts.
- Commits 48602d8 and 28cabae are ancestors of HEAD.
