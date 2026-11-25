---
phase: 18-immersive-survey-layout
plan: 07
subsystem: ui
tags: [share, web-share-api, clipboard, client-island, region-page, useSyncExternalStore, hydration]
status: complete

requires:
  - phase: 18-06
    provides: "RegionHeader band with its right-hand slot left empty for Share region"
  - phase: 18-01
    provides: "Wave 0 decisions (P1-P7 at the UI-SPEC defaults)"
provides:
  - "lib/photos/share-mode.ts: useShareMode(url) returns 'copy' on the server and during hydration, then 'share' only where navigator.share is a function and canShare({ url }) is not false. Also exports clientShareMode(url) and the ShareMode type"
  - "components/photos/ShareButton.tsx: default ShareButton({ url, title, subject: 'photo' | 'region', surface: 'surface' | 'gallery' }), the Share / Copy link island. 18-18 mounts it in the viewer strip"
  - "lib/copy-feedback.ts: COPIED_MS (2,000 ms). CopyEmailButton re-exports it"
  - "RegionHeader renders Share region on every region page with url site.url + regionHref(id) and title '{heading} · Tim Lui'"
affects: [18-14, 18-18, 18-25, 18-29, e2e/photos-region.spec, visual region shots]

actuals:
  tokens: 8200     # chars/4 over the plan's code diff (git diff 7297818..ea08e7d = 32,672 chars incl. context)
  tasks: 2
  commits: 3       # git rev-list --count 7297818..ea08e7d; the metadata commit follows
plan_head_before: 72978187a5fe7795371963f2d46d6d889a161fd4
plan_head_after: ea08e7d95216e04e104b1ff33e1d42c89d5647f8

tech-stack:
  added: []
  patterns:
    - "A mode store with a no-op subscribe and a fixed server snapshot (useSyncExternalStore). Server HTML and hydration agree, and the client switches after hydration with no effect and no mismatch"
    - "Web Share is called synchronously first in the click handler. AbortError is matched by name, so a DOMException from any realm counts. A pending ref ignores repeat presses"
    - "Shared timing constants live in plain lib modules, never in a 'use client' component. Importing one from a component pulls the whole component and its icons into the importer's chunk"

key-files:
  created:
    - lib/photos/share-mode.ts
    - lib/copy-feedback.ts
    - components/photos/ShareButton.tsx
    - components/photos/__tests__/share-button.test.tsx
  modified:
    - components/photos/region/RegionHeader.tsx
    - components/contact/CopyEmailButton.tsx
    - e2e/photos-region.spec.ts

key-decisions:
  - "Share region sits inside RegionHeader, not in a page-level `end` prop. The unused `end` slot from 18-06 is gone, and the URL and title are built in RegionHeader on the server from site.url + regionHref(region.id)"
  - "In copy mode the accessible name stays 'Copy link to this region/photo' while the label reads 'Link copied', as in CopyEmailButton. The polite status announces 'Link copied'. Share mode sets no aria-label, so its name is the visible 'Share region/photo'"
  - "The failure line is `w-0 min-w-full`, so it takes the button column's width and never widens the header column. A long URL wraps under the button (wrap-anywhere) and doesn't push the button sideways"
  - "COPIED_MS moved to lib/copy-feedback.ts. Importing it from CopyEmailButton had put CopyEmailButton and its CopyIcon into the region pages' chunk (2,966 B)"
  - "Task 1's share-press branch was moved to Task 2's GREEN commit, so the TDD RED commit failed on a real assertion (navigator.share never called) and not on an unexpected pass"

requirements-completed: []  # PHOTO-07 stays Pending. This plan ships the component and the region-header share. 18-18 mounts it in the viewer strip (photo page and lightbox)

metrics:
  duration: "about 14 min (00:40Z to 00:54Z 2026-11-25)"
  completed: 2026-11-25
---

# Phase 18 Plan 07: Share / Copy link on the region header Summary

**Every region page's header band now has one Share button. It is server-rendered as 'Copy link' and switches to 'Share region' after hydration wherever the browser can share. It only ever shares or copies the server-built canonical URL. Copy shows 'Link copied' for 2 s, and a failed copy shows the URL under the button, already selected.**

## Performance

- **Duration:** about 14 min
- **Started:** 2026-11-25T00:40:28Z
- **Completed:** 2026-11-25T00:54:04Z
- **Tasks:** 2 (3 commits: feat, test RED, feat GREEN)
- **Files:** 4 created, 3 modified

## Accomplishments

- `useShareMode(url)`: `useSyncExternalStore` with a `'copy'` server snapshot. A Jest row hydrates the server HTML with `navigator.share` stubbed and gets no recoverable error, no console error and then 'Share photo'.
- `ShareButton`: uses the 12 secondary-button classes plus `min-w-40 justify-center`, with the hover set by `surface`. Phosphor `LinkIcon`, `ShareNetworkIcon` and `CheckIcon` are 20 px and aria-hidden. The polite `role="status"` is sr-only and aria-atomic.
  - **Share mode:** a press calls `navigator.share({ title, url })` with no await before it. AbortError does nothing. Any other rejection copies. Presses during a pending share are ignored, and a share that settles after unmount does nothing.
  - **Copy mode:** a successful write shows 'Link copied' for COPIED_MS, and a repeat press restarts the window. A failed write shows `Couldn't copy the link. It's selected here: {url}` with the URL in `font-mono text-ink wrap-anywhere`, selected through a Range. The status then reads `Couldn't copy the link. It's selected below.` and the line stays until the next press. Unmounting clears the timer, and a write that resolves after unmount starts no timer.
- RegionHeader mounts it on all three region pages with the canonical URL. No code path reads `location.href`; the acceptance grep for it prints 0.
- E2E, prod server on Chromium and Firefox:
  - On Chromium only, the real clipboard on `/photos/regions/zermatt?x=1#y` copies exactly `https://www.tlui.de/photos/regions/zermatt`.
  - In both engines, a share-mode stub receives `{ title: 'Zermatt, Switzerland · Tim Lui', url }` from the query-and-hash URL.
  - In both engines, an AbortError stub leaves 'Share region' with no failure line and an empty status.
  - In both engines, a rejecting `Clipboard.prototype.writeText` shows the failure line with the URL selected.

## Task Commits

1. **Task 1 (tracer): end-to-end Copy link on the region header** - `d55ab6b` (feat). Tracer gate: interactive, end-of-phase, automated verify. The verify passed (46/46 on Chromium and Firefox, type-check 0) before expansion.
2. **Task 2 (tdd): share mode, fallback, failure, timers under test**
   - RED `ce6151b` (test). 5 of 18 failed, all share-mode rows, each on its `navigator.share` assertion. The classifier returned `RED_EVIDENCE_OK` (junit, target 'calls navigator.share once, synchronously, with { title, url }'). Semantic check: the failures came from share never being called, with no load, syntax or fixture fault. The 13 copy-mode, mode-store and failure rows passed because Task 1 built them.
   - GREEN `ea08e7d` (feat). 25/25 across share-button and CopyEmailButton; e2e 52/52 on the region spec, then 91/91 together with contact-form and a11y-contact.

**Plan metadata:** in the docs(18-07) commit that follows.

## Client JS (record-only; the cap is enforced at 18-25 and 18-29)

`rm -rf .next/static && npm run build`, then a byte sum of `.next/static/chunks/**/*.js`:

| Point | Total | Files | vs phase base 1,851,745 B | vs cap 1,855,841 B |
|---|---|---|---|---|
| 18-06 (its SUMMARY) | 1,850,219 B | n/a | -1,526 | -5,622 |
| After Task 2, importing COPIED_MS from CopyEmailButton | 1,864,238 B | 25 | +12,493 | +8,397 |
| **Final (COPIED_MS from lib/copy-feedback)** | **1,861,272 B** | **25** | **+9,527** | **+5,431** |

The new region-page chunk is 10,917 B. Most of it is the three Phosphor SSR icons, each carrying all six weight maps (about 2.5 KB each), plus the component and the mode store. The total is now 5,431 B over the cap. The plan defers enforcement to 18-25, after the switch, grid and carousel retirements, but that offset has to cover at least this much. If it falls short, an inline single-weight SVG for the three icons would save about 6 KB.

## Decisions Made

See key-decisions in the frontmatter. ui-ux-pro-max ran two searches. "error recovery copy fallback" (ux) returned Error Recovery (clear next step) and Error Messages (announce through aria-live); the selected URL and the polite status satisfy both. The UI-SPEC's own UUPM rows (success-feedback, content-jumping, long-token wrapping) are applied as written.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug/perf] COPIED_MS import pulled CopyEmailButton into the region bundle**
- **Found during:** Task 2, client JS measurement
- **Issue:** The plan says to import `COPIED_MS` from CopyEmailButton. Turbopack doesn't tree-shake a 'use client' module, so the region chunk carried CopyEmailButton and its CopyIcon (2,966 B).
- **Fix:** Moved the constant to `lib/copy-feedback.ts`. CopyEmailButton imports and re-exports it, so its test import is unchanged. The value and the contact page are unchanged.
- **Files modified:** lib/copy-feedback.ts, components/contact/CopyEmailButton.tsx, components/photos/ShareButton.tsx, components/photos/__tests__/share-button.test.tsx
- **Verification:** CopyEmailButton Jest 7/7. contact-form and a11y-contact e2e pass in both engines. Client JS -2,966 B.
- **Committed in:** ea08e7d

**2. [TDD ordering] The share-press branch moved from Task 1 to Task 2 GREEN**
- **Found during:** Task 1
- **Issue:** Task 1's action listed the full press logic, including the share call, AbortError handling and the pending guard. Building all of it in Task 1 would make Task 2's RED pass unexpectedly, which is a fail-fast stop in tdd.md.
- **Fix:** Task 1 shipped the mode store, both labels, the copy path and the failure path. In Task 1 a press in share mode copied. Task 2's GREEN added the share call.
- **Committed in:** d55ab6b, ea08e7d

**3. [Cleanup] RegionHeader's unused `end` prop removed**
- The slot was only a placeholder for this button. RegionHeader now renders ShareButton itself, as the plan's key_link requires. Nothing else passed `end`.

---

**Total deviations:** 3 (1 bug/perf, 1 TDD ordering, 1 cleanup). **Impact:** no scope creep. The baselined contact page has no pixel change: only a constant moved.

## Open UX notes (for Tim / the 18-14 shots)

Seen in Chromium screenshots of the prod build at 375 and 1440 (scratchpad `share-{copy,share,fail}-{375,1440}.png`):

1. **The failure line lifts the button on wide layouts.** The band is `items-end`. At 1440 the button sits beside the title, and the 5-line failure line raises the button by about 80 px when it appears. On phones the button wraps below the title and doesn't move. This only happens when the copy fails (insecure origin, denied permission). Holding the button still would need a band layout change (a grid with the line in a second row, or the button column aligned another way). That is a RegionHeader layout decision, so I left it for review.
2. **'Share region' measures 160.08 px.** That is 0.08 px wider than `min-w-40` with this font in Chromium/Windows, so the copy-to-share swap moves the button by a sub-pixel amount: invisible, but not strictly zero. `min-w-42` would leave about 8 px of room for other platforms' font rendering. I kept the UI-SPEC's min-w-40 because the spec locks it.
3. The failure line takes the button's width (160 px), so at 375 the URL wraps over three mono lines. It is readable and selected, but narrower than the row allows.

## Issues Encountered

- None blocking. The Firefox /offline audit flake didn't come up because audit wasn't in this plan's runs.

## Verification

- `npm run type-check` 0. `npm run lint` 0, including the test-count scan. Full Jest: 124 suites, 2,484 tests passed.
- GUARD-03: `test-count.mjs --jest`: jest 2,484 + e2e 661 = 3,145, floor 3,024. OK.
- `PW_PROD=1` photos-region: 52/52 on Chromium and Firefox. With contact-form and a11y-contact: 91/91. No flaky tests.
- `node scripts/ci/check-snapshot-commit.mjs --none` passed on each of the 3 commits. No PNG was staged.
- `public/service-worker.js` was restored after every build. No `next start` is left on :3000 or :3017.
- Privacy: no coordinate was written anywhere. The only URL is the region's canonical path.

## Threat Flags

None. The share and clipboard surface is T-18-18/19/20 in the plan's register: the URL comes only from the prop, with an e2e row for the query and hash, and the pending guard has a Jest row.

## Next Phase Readiness

- 18-18 can mount `<ShareButton url={site.url + photoHref(slug)} title={'{title} · Tim Lui'} subject="photo" surface="gallery" />` in the strip. It has to pass the shown photo's URL on every step.
- 18-14's visual spec should force copy mode, for example with the `forceCopyMode` init script now in photos-region.spec.ts (delete `Navigator.prototype.share`/`canShare`), so baselines never depend on the engine build.

## Self-Check: PASSED

All 4 created files exist; commits d55ab6b, ce6151b and ea08e7d are ancestors of HEAD.

## Post-plan fix (Tim-approved, 2026-11-25)

Scope-added after 18-04, before 18-14. Tim's answer (AskUserQuestion, 2026-11-25, after 18-07): "Fix before 18-14 (Recommended)". It closes Open UX notes 1-3 above. 18-07 stays complete; this section is the record (no new SUMMARY, no STATE/ROADMAP plan-progress change).

**What changed**

- `ShareButton` takes `failurePlacement?: 'below' | 'row'`. `'below'` (the default) is unchanged: the note sits under the button, as wide as the button, for a standalone use such as 18-18's viewer strip. In `'row'` mode the component renders two flex items for a flex-wrap parent: the button group (`shrink-0`, button + polite status) and, after a failure, the note with `basis-full`, which takes its own full-width row at the end of the parent.
- `RegionHeader` mounts ShareButton straight into the band with `failurePlacement="row"` (its own `shrink-0` wrapper is gone). The band only grows downward; the note is its last row, `gap-y-4` under the title/button line, above the band's `pb-6` and border.
- `min-w-40` → `min-w-42` (168 px), so `Share region` (160.08 px in Chromium/Windows) has about 8 px of room.
- Text, Range selection, the polite status, "stays until the next press", share mode, AbortError and the pending guard are unchanged. All 18-07 Jest and e2e rows stay green. The one edited Jest assertion is `min-w-40` → `min-w-42`.
- 18-UI-SPEC.md amended: lines 78, 433, 434, 439, 660, 661, 727 and the Contract 2 Share row, plus an "Amended 2026-11-25 (Tim, after 18-07)" note under the Contract 4 Share table.

**Commits**

| Commit | Subject |
|--------|---------|
| 5c2934f | test(18-07): pin the Copy failed row under the band and min-w-42 (post-plan fix, failing) |
| 33bd377 | test(18-07): measure the band's last-row gap as its padding plus border (post-plan fix) |
| af38a74 | fix(18-07): Copy failed note takes a full-width row under the band, Share is min-w-42 (post-plan fix) |
| (this commit) | docs(18-07): amend the UI-SPEC and record the Share failure-row post-plan fix |

RED: on 965eaf7 all 6 new e2e rows failed (1440/768: the breadcrumb dropped 28 px in Chromium and 29.5 px in Firefox; 375: the note was 160 px wide, 173/183 px short of the band), and the 2 new-behaviour Jest rows failed. 33bd377 only repairs a RED bound: the gap under the note is `pb-6` + `border-b` = 25 px, not < 25, so the row now reads both from the computed style.

**Measured positions** (Chromium, prod build, page-relative `[x, y, w, h]` in px, writeText rejecting; Firefox passes the same < 1 px assertions)

| Width | State | Breadcrumb | h1 | Facts line | Button | Band | Note row |
|-------|-------|------------|----|------------|--------|------|----------|
| 1440 | before fix, after the failure | 171,96 → 171,124 | 148 → 176 | 200 → 228 | 1099,176 → 1099,96 (160 w) | h 181 → 209 | x 1099, w 160, h 100, URL 3 lines |
| 1440 | after fix, after the failure | 171,96 → 171,96 | 148 → 148 | 200 → 200 | 1091,176 → 1091,176 (168 w) | top 64 → 64, h 181 → 217 | x 171, w 1088 (= band), h 20, URL 1 line |
| 768 | before fix | 24,96 → 24,124 | 148 → 176 | 200 → 228 | 574,176 → 574,96 | h 181 → 209 | w 160, URL 3 lines |
| 768 | after fix | 24,96 → 24,96 | 148 → 148 | 200 → 200 | 566,176 → 566,176 | top 64 → 64, h 181 → 217 | x 24, w 710 (= band), h 20, URL 1 line |
| 375 | before fix | 16,96 (holds) | 148 (holds) | 244 (holds) | 16,300 (holds) | h 305 → 413 | w 160, h 100, URL 3 lines |
| 375 | after fix | 16,96 → 16,96 | 148 → 148 | 244 → 244 | 16,300 → 16,300 | top 64 → 64, h 305 → 381 | x 16, w 333 (= band), h 60, URL **2 lines** (`wrap-anywhere` fallback) |

The button's x moved left by 8 px at 1440/768 (1099 → 1091, 574 → 566) only because it is now 168 px wide and right-aligned; that is the min-w-42 change, not a failure-state shift. URL line counts (Chromium and Firefox alike): 1440: 1, 768: 1, 375: 2. Screenshots: scratchpad `share-fix-{before,after}-{1440,375}.png`.

**ui-ux-pro-max** (`--domain ux` "content jumping layout shift", "error message near action recovery", "long url token wrapping"; `--stack html-tailwind` "flex wrap full width row")

- Content Jumping (High): "keep async states in a stable content-driven container"; "Badge insertion pushes toolbar actions" is the bad example. The note is in a row of its own, so nothing that was already on screen moves; the band grows downward only.
- Error Placement / Error Recovery: keep the message near its control, with a recovery path. The note sits 16 px (`gap-y-4`) under the title/button line; the recovery is the pre-selected URL (Ctrl/Cmd+C), and the polite status announces it.
- Long Token Wrapping (High): `overflow-wrap: anywhere` on a shrinkable child, not `break-all`, so `wrap-anywhere` stays as the 375 fallback.
- Container Width (65-75ch): the full-width note is one short sentence plus a 42-character URL (~640 px at 1440), so no max-width was added.
- Stack (Tailwind 4.3): flex-wrap with `shrink-0` controls; the `basis-full` item is the standard way to force a full-width flex line.

**Design choice the brief left open:** the note sits inside the band, above its bottom border (not below it), because it belongs to the band's Share control and "grows the band downward" keeps the border as the band's edge.

**Client JS** (`rm -rf .next/static && npm run build`, byte sum of `.next/static/chunks/**/*.js`): HEAD 965eaf7 reproduced 1,861,272 B. After the fix: **1,861,419 B (+147 B)**, the `failurePlacement` branch and its class strings. That is 5,578 B over the 1,855,841 cap; HEAD was already 5,431 B over (Tim tracks it to 18-25). A first draft that duplicated the button JSX cost +168 B; it was folded into one group element to get to +147. No new icon imports.

**Verification**

- Jest: 124 suites, 2,486 tests passed (+2 rows). `npm run type-check` 0. `npm run lint` 0. GUARD-03: jest 2,486 + e2e 664 = 3,150, baseline 3,024, OK.
- `PW_PROD=1` photos-region: 58/58 on Chromium and Firefox (52 + the 6 new rows). contact-form + a11y-contact: 39/39 on both. No flaky tests.
- `node scripts/ci/check-snapshot-commit.mjs --sha <sha> --none` passed on each new commit. No PNG staged; region pages are not baselined, so nothing is re-baselined.
- `public/service-worker.js` restored after every build; no `next start` left on :3000 or :3017.
