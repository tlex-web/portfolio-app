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
