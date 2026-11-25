---
phase: 18-immersive-survey-layout
plan: 18
subsystem: photos
tags: [viewer-strip, lv95, swiss-grid, share, copy-link, d-13, d-14, d-15, photo-07, photo-08, e2e, jest, tdd]
status: complete

requires:
  - phase: 18-07
    provides: "ShareButton (copy/share modes, failurePlacement 'below' default, min-w-42) and useShareMode"
  - phase: 18-17
    provides: "The strip as it stands: page breadcrumb, 'Esc back to {region}' legend, backName"
provides:
  - "lib/photos/lv95-line.ts: LV95_GRID_M { 4dp 10, 3dp 100, 2dp 1000 }, snapLv95(m, grid), lv95Line(position, country): string | null"
  - "PhotoView.country (from the generated photo) and StripFields.lv95, filled on the server by stripFields"
  - "ExifStrip: the LV95 line as the position list's last line (sr-only dt 'Swiss grid'); a `share` slot as the data column's last row (mt-4)"
  - "PhotoViewer: ShareButton for the shown photo (site.url + photoHref(current.slug), subject photo, surface gallery) on page and lightbox; none on the end card"
  - "ShareButton: a new url resets 'Link copied' and the failure line during render, with no remount"
affects: [18-20, 18-25, 18-29]

actuals:
  tokens: 13400    # chars/4 over git diff 721a488..0f19923 (53,469 chars incl. context)
  tasks: 2
  commits: 3       # git rev-list --count 721a488..0f19923; the metadata commit follows
plan_head_before: 721a488f421f207168324a7c25e90a0888cb14b3
plan_head_after: 0f19923a32e127017757c460552e818dbadbdc77

tech-stack:
  added: []
  patterns:
    - "A privacy-sensitive derived value is computed from the shown string, not the stored number: parse roundedCoordinate(..., precision) back to a number, convert, snap to the precision's grid; the test proves raw and shown inputs give the same output"
    - "A stepping viewer keeps one mounted control and resets its per-target state during render when the target prop changes (React's 'adjusting state on a prop change'), so focus survives a keyboard step"

key-files:
  created:
    - lib/photos/lv95-line.ts
    - lib/__tests__/lv95-line.test.ts
  modified:
    - lib/photos/view-model.ts
    - components/photos/ExifStrip.tsx
    - components/photos/PhotoViewer.tsx
    - components/photos/ShareButton.tsx
    - lib/__tests__/photos-view-model.test.ts
    - components/photos/__tests__/strip.test.tsx
    - components/photos/__tests__/share-button.test.tsx
    - components/photos/__tests__/photo-viewer.test.tsx
    - components/photos/region/__tests__/SequenceFigure.test.tsx
    - e2e/photos-lightbox.spec.ts

key-decisions:
  - "18-18: lv95Line runs only on the server (stripFields in view-model); the client gets the finished string in the view props and ships no conversion and no proj4. The +187 B client cost is the LV95 row's JSX in ExifStrip, which PhotoViewer (a client component) renders"
  - "18-18: the strip's data column order is rights line, shortcut legend, then the Share button (mt-4), so the column ends with the one action as the must-have states; the legend stays directly under the rights line, as LBOX-07's existing row pins"
  - "18-18: the strip's ShareButton uses the default failurePlacement 'below': the data column is a block column, so the failure note sits under the button at the column's width and only the strip grows downward"
  - "18-18: no Share button on the end card: the card replaces the strip, shows no photo, and the region page already carries Share region (the plan's 'the card step has no strip and therefore no button')"
  - "18-18: ShareButton is not keyed per photo (the arrows step while it has focus, and a remount would drop focus); it resets its copied/failure state when its url prop changes"

requirements-completed: []  # PHOTO-07 and PHOTO-08 are also declared by 18-20 and 18-29, still open; left for the phase verifier

coverage:
  - id: D1
    description: "Swiss photos show 'LV95 [≈ ]E … N …' after the Altitude · Position line, at the shown precision's grid; every other country (LI included) shows none; collars never show LV95"
    requirement: "PHOTO-08"
    verification:
      - kind: unit
        ref: "lib/__tests__/lv95-line.test.ts (all); photos-view-model.test 'LV95 line (18-18…)'; strip.test 'ExifStrip LV95 line (18-18…)'; SequenceFigure.test 'never prints the LV95 line'"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts 'LV95 line on the photo page (18-18; PHOTO-08)' x11 photo pages + the Zermatt collar row (chromium, firefox, local webkit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The strip ends with Share / Copy link for the shown photo; after a step it copies or shares the stepped photo's bare canonical URL; none on the end card"
    requirement: "PHOTO-07"
    verification:
      - kind: unit
        ref: "strip.test 'ExifStrip share slot (18-18…)'; photo-viewer.test 'the strip Share button follows the shown photo (18-18…)'; share-button.test 'ShareButton across a url change (18-18…)'"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts 'Share in the viewer strip (18-18; PHOTO-07)' 4 rows (clipboard row @chromium-only)"
        status: pass
    human_judgment: false

metrics:
  duration: "about 20 min (19:39Z to 19:58Z 2026-11-25)"
  completed: 2026-11-25
---

# Phase 18 Plan 18: LV95 line and Share in the viewer strip (D-13, D-14, D-15) Summary

**Swiss photos now show a second position line in the viewer strip, 'LV95 E 2’…’… N 1’…’…' (or 'LV95 ≈ …' for the film scan). It is computed on the server from the rounded WGS84 the page already shows and snapped to that precision's grid, so it can never reveal more than the page shows. Every other country, Liechtenstein included, shows none. The strip's data column now ends with the 18-07 Share / Copy link button. It follows every step: after Next it copies or shares the URL of the photo now on screen, and it is absent on the end card.**

## Performance

- **Duration:** about 20 min (2026-11-25, 19:39 to 19:58 UTC)
- **Tasks:** 2 (a tdd tracer, then an auto task)
- **Files:** 2 created, 10 modified

## Accomplishments

- **`lib/photos/lv95-line.ts`** (pure, server only):
  - `lv95Line(position, country)` returns null unless the country is `CH` and there is a position.
  - It parses `roundedCoordinate(lat|lon, precision)` back to numbers (the digits the strip prints), converts them with `wgs84ToLv95` and snaps each value with `Math.round(m / grid) * grid` (10 / 100 / 1,000 m).
  - It formats easting first with `formatLv95` (U+2019 grouping) and puts `≈ ` after `LV95 ` when the position is approximate.
- **view-model:**
  - `PhotoView.country` is copied from the generated photo.
  - `StripFields.lv95` is filled by `stripFields`. `StripSource.country` is required, so no caller can forget it.
- **ExifStrip:**
  - A Swiss photo's position list gets a second visual line, `<div data-strip-lv95><dt class="sr-only">Swiss grid</dt><dd class="whitespace-nowrap">…</dd></div>`, in the list's mono / text-sm / ink / tabular-nums style.
  - A new `share` slot renders as the data column's last row (`mt-4`), so the strip stays server-safe and presentational.
- **PhotoViewer:** fills the slot on both surfaces with `<ShareButton url={site.url + photoHref(current.slug)} title="{title} · Tim Lui" subject="photo" surface="gallery" />`. The end card replaces the strip, so it has no button.
- **ShareButton:** when its `url` prop changes, it clears `Link copied`, the failure line and the status during render. The button element stays mounted, so focus survives an arrow-key step.
- **Tracer gate:** Task 1's verify passed end to end before Task 2 started: Jest 118/118, and production e2e `-g LV95` 24/24 in Chromium and Firefox.

## Task Commits

1. **Task 1 RED:** `b9bd3e8` test(18-18): LV95 line from the shown WGS84, Swiss photos only (RED, D-14, D-15)
2. **Task 1 GREEN:** `a55b0d2` feat(18-18): LV95 line for Swiss photos from the shown WGS84 at its precision's grid (D-14, D-15, PHOTO-08)
3. **Task 2:** `0f19923` feat(18-18): Share / Copy link in the viewer strip, following every step (D-13, PHOTO-07)

## TDD Gate Compliance (Task 1)

- **RED** `b9bd3e8`: **33 failed, 85 passed** across lv95-line, photos-view-model and strip. geo stayed green. `lib/photos/lv95-line.ts` was committed as a null-returning stub (`snapLv95` the identity), so every suite loaded and every target row failed on its assertion. The rows were: CH lines missing (`null`), non-multiples from the identity snap, `strip.lv95` undefined where `null` or a line was expected, and no `[data-strip-lv95]` row.
  - The rows that passed in RED are guard rows: non-CH and no-position return null, and `LV95_GRID_M` is a constant.
  - **Semantic assessment:** valid RED. Every failure was a planned assertion on the new behaviour; there were no load or syntax faults.
  - Jest's console report is not a format the `tdd-red-evidence` classifier reads, and `workflow.tdd_mode` is off, so the classifier was not run. This entry is the record.
- **GREEN** `a55b0d2`: 118/118 in the four suites.
- **REFACTOR:** none.

## Test mapping (PHOTO-06: rewritten, never deleted)

| Suite › old test | Now |
|---|---|
| photos-view-model › strip fields › img-0605 … exact position | same title; `toEqual` adds `lv95: expect.stringMatching(LV95_EXACT)` and checks it equals `lv95Line(position, 'CH')` (no literal digits) |
| › r004-011 … approximate with its radius | same title; adds `lv95: expect.stringMatching(LV95_APPROX)` and the same derivation check |
| › drops the Position row for a view without coordinates (stripFields) | same title; passes `country: 'CH'` and expects `lv95: null` |
| strip › img-0605: two lists … and the position line | same title; the position terms add 'Swiss grid'; the visible text is read from the list's first line (`positionLine`) |
| strip › r004-011: the film line … | same title; first line as before, plus the `LV95 ≈` line |
| strip › ExifStrip for a coarse position › prints a 3dp position … | same title; first line as before, plus the LV95 line at 100 m multiples |
| photo-viewer › `status()` helper | it now reads the viewer's own `p[role="status"]`, because the strip's Share button adds a second (span) status. Every row that uses it is unchanged |
| SequenceFigure.test › `strip()` fixture | adds `lv95: null` (a type fix) |
| (new) lv95-line.test | 26 rows: the grid table; null for 7 countries, LI and no position; the CH format; grid multiples and derivation over a 70-point synthetic sweep per precision; the approximate sign; raw equals shown; one shown cell gives one line; halves up |
| (new) photos-view-model | 11 published rows (country and line iff CH); the light-table views agree; Swiss photo moved to IT, AT or LI gives no line; synthetic 3dp/2dp at 100 / 1,000 m |
| (new) strip | 4 LV95 rows (one per v2.0 photo); a non-CH photo has no row; share slot ×2 levels, server copy mode, no slot gives no button |
| (new) share-button | a new url clears Link copied (same element, focus kept); a new url drops the failure line and the next press copies the new url. Both rows fail with the reset removed (checked by mutation) |
| (new) photo-viewer | page/modal: Next, then Copy link writes `site.url + photoHref(second)`; end card has no button, Previous brings it back |
| (new) SequenceFigure | collars never print the LV95 line |
| (new) e2e photos-lightbox › LV95 line on the photo page | 11 photo pages (7 CH: format, `≈` iff the Position has it, multiples of the grid read from the shown decimals, own line under the position line; 4 AT/IT: no row, no 'Swiss grid', no 'LV95' in the strip) + Zermatt collars show no LV95 |
| (new) e2e photos-lightbox › Share in the viewer strip | lightbox clipboard after Next (@chromium-only); lightbox `navigator.share` stub after Next; page loaded with `?x=1#y`, Next, stub gets the bare canonical URL (T-18-39); end card has none, Previous restores it |

## Count gate (GUARD-03)

```
before (18-17): jest 2687 + e2e 795 = 3482
after  (18-18): jest 2742 + e2e 811 = 3553 (baseline 3024) OK
```

## Share on the end card (orchestrator decision point)

**Hidden.** The card replaces the stage and the strip and shows no photo, so there is no photo URL to share. The region page behind the lightbox (and the region link on the card) already carries Share region. This is the plan's own line ("The card step has no strip and therefore no button"). The photo-viewer.test and e2e end-card rows pin it.

## failurePlacement in the strip

**`'below'` (the default).** The data column is a block column, not a flex-wrap row, so `'row'` has nothing to wrap into. With `'below'` the note (`mt-2 w-0 min-w-full`) takes the width of the button's block wrapper, which here is the whole data column (about 420 px at 1440), so the URL stays on one or two mono lines. Nothing above the button moves; only the strip grows downward. On the key and gutter tiers a taller strip shortens the stage by the note's height while it shows. That is accepted: the failure is rare (no clipboard), the note stays only until the next press, and the region band's `'row'` mode solved a different problem (an `items-end` row lifting its siblings).

## ui-ux-pro-max

Queries run (`--domain ux`): "screen reader term data list", "primary action placement order", "content jumping layout shift", "tabular numbers mono data".

- **Screen Reader (Medium):** "use semantic HTML". The LV95 line is a `dt`/`dd` pair inside the existing `dl`, so a reader hears "Swiss grid, LV95 E …", as UI-SPEC Contract 4 asks.
- **Content Jumping (High):** "keep async states in a stable content-driven container". `min-w-42` already holds every Share label, and the failure note grows the strip downward only.
- **Number Formatting (Low):** use thousand separators. `formatLv95`'s U+2019 grouping (the footer's) is used; the list's `tabular-nums` keeps the digits aligned.
- **Error Placement:** keep the message near its control. The `'below'` note sits under the button.
- "primary action placement order" returned no verified match (error placement and consistent help, both off-topic). The order decision (rights, legend, Share) follows the plan's must-have "the data column ends with the Share button" instead.

## Client JS (record only; the cap is enforced at 18-25 and 18-29)

Measured after the last code commit (`rm -rf .next/static && npm run build`, byte sum of `.next/static/chunks/**/*.js`, `public/service-worker.js` restored). The build is deterministic: two HEAD builds gave identical chunk lists.

| Build | Total | vs running total 1,871,174 | vs cap 1,855,841 |
|-------|-------|----------------------------|------------------|
| a55b0d2 (Task 1; Task 2's three source files at their a55b0d2 versions) | 1,871,361 B | +187 | +15,520 |
| **0f19923 (HEAD)** | **1,882,651 B** | **+11,477** | **+26,810** |

**Per chunk (Task 1 build → HEAD):**

| Chunk role | Task 1 | HEAD | Delta |
|------------|--------|------|-------|
| Viewer (PhotoViewer + ExifStrip; 'Swiss grid' and `data-photo-viewer` inside) | 2sfoj-ep7c1ya 43,692 | 15cby9nt1-he- 43,922 | +230 (the share slot and ShareButton props) |
| Region (RegionHeader's ShareButton) | 1ugrm7nr0n3qc 13,824 | 2v3_dqmmb7cgb 13,879 | +55 (the url-reset logic) |
| Photo routes' shared chunk (LightboxDialog, cssEscape; listed in both photo routes' client-reference manifests) | 0y1qj54gvh192 10,762 | 3kly0g95h-y_2 21,767 | **+11,005** |

The Task 1 cost (+187 B) is the LV95 row's JSX in ExifStrip. ExifStrip renders inside the client PhotoViewer; the conversion itself ships nothing.

**Icon duplication (input for 18-25's icon decision): yes.** Mounting ShareButton in the viewer copies ShareButton, `useShareMode`, `COPIED_MS` and its three Phosphor icons (`CheckIcon`, `LinkIcon`, `ShareNetworkIcon` from `dist/ssr`) into the photo routes' shared chunk. The region chunk keeps its own copy, because Turbopack does not hoist the module into a chunk the two route groups share.

- **What the copy costs:** +11,005 B. About 6.4 KB of that is the icons' six-weight path data. Each Phosphor ssr icon carries bold, duotone, fill, light, regular and thin paths; the region chunk holds 6,424 path characters in 21 `d` strings. The rest is ShareButton and share-mode.
- **Options for 18-25:** inline regular-weight SVGs (one path each, roughly 0.5-0.7 KB per icon), which would save most of the path data in both chunks; or a shared client chunk for ShareButton.

## Baselined shots this plan changes (round 18-20)

| Shot | Why |
|------|-----|
| `photo/{375,768,1440}-reduced` | The film-scan page (r004-011, CH, approximate) gains the `LV95 ≈ E … N …` line under its position line and the `Copy link` button (copy mode) at the end of the data column (mt-4, 44 px) |
| `lightbox/{375,768,1440}` | matterhorn-from-zermatt (CH, exact) gains the `LV95 E … N …` line and the `Copy link` button in the lightbox strip; on the key and gutter tiers the taller strip can shorten the stage |

**Every other baselined shot is unchanged.** No other baselined route renders ExifStrip or PhotoViewer:

- home, photos, photos-grid, photos-carousel, projects, box, coin-flip, roadmap, sources, contact, offline, not-found and menu render neither.
- The 24 region shots render RegionHeader's ShareButton, whose markup is unchanged (the reset logic adds no element), and SequenceFigure's `ListLine` / `collarParts`, which are unchanged; a Jest row now pins that collars ignore `lv95`.

No PNG was staged and `--update-snapshots` was never run. Baselines are Linux (CI); 18-20 re-baselines.

## Verification

- **Jest:**
  - Plan suites: lv95-line, photos-view-model, strip and geo pass (118), as do strip, share-button and photo-viewer (80).
  - Full suite: **130 suites, 2,742 tests** passed.
  - `npm run type-check` exit 0 (all three configs). `npm run lint` exit 0 (eslint and every guard, including data:check and the test-count scan).
- **check-snapshot-commit --none:** OK (0 changed) on all three commits.
- **Production e2e, Chromium and Firefox:**
  - Task 1 `-g LV95`: **24 passed**.
  - Task 2 (photos-lightbox, photos-stepping): **195 passed**, 0 failed, 0 flaky.
  - Wider set (photos-region, photos-sweep, photos, keyboard, audit, seo, offline, not-found, home-ascent, data-privacy): **623 passed, 1 failed**. The failure was Firefox "Page crashed" inside axe on `/offline` (audit). `/offline` renders no viewer, strip or Share button, and the row passed 3/3 when re-run alone (`--repeat-each=3`). This is a transient engine crash, not a regression.
- **Production e2e, local Windows WebKit (webkit-2388):** photos-lightbox, photos-stepping and photos-region gave **178 passed, 1 failed**. The failure is the pre-existing Hotspots D-22 row (deferred since 18-15, unchanged). Every new LV95 and Share row that runs in WebKit passed. The clipboard row is `@chromium-only`.
- **Privacy (16 D-25):** lv95-line.test and every new row use synthetic positions (the WGS84 of made-up LV95 points) or read formats and grid multiples from the page. No LV95 literal of a real photo appears in any committed file; a scan of the plan diff for `d’ddd’ddd` and 5+ decimal numbers found only the two pre-existing 4dp shown values (img-0605's strip text, moved into `positionLine`), which match the page's precision.
- **Acceptance greps:**
  - `grep -c "export function lv95Line" lib/photos/lv95-line.ts` prints 1.
  - `grep -c "lv95" lib/photos/view-model.ts` prints 4.
  - `grep -c "ShareButton" components/photos/PhotoViewer.tsx` prints 4.
- `public/service-worker.js` was restored after every build. No `next start` was left on :3000.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ShareButton kept the previous photo's state after a step**
- **Found during:** Task 2
- **Issue:** In the strip the button stays mounted while `url` changes with each step. 'Link copied', or a failure line showing the *previous* photo's URL, would stand beside the next photo. A `key` per slug would fix that, but it would also drop keyboard focus: the arrows step while the button has focus.
- **Fix:** ShareButton resets copied, failure and status during render when `url` changes. Two share-button.test rows pin it, and both fail with the reset removed.
- **Files modified:** components/photos/ShareButton.tsx (not in the plan's file list), components/photos/__tests__/share-button.test.tsx
- **Commit:** 0f19923

**2. [Rule 3 - Blocking] Test helpers that assumed one status region and the old StripFields shape**
- **Found during:** Tasks 1 and 2
- **Issue:** `StripFields.lv95` is required, so SequenceFigure.test's `strip()` fixture no longer type-checked. photo-viewer.test's `status()` (`getByRole('status')`) found two elements once the strip carried the Share button's polite status.
- **Fix:** The fixture gains `lv95: null`, plus one guard row (collars never print LV95). `status()` reads the viewer's own `p[role="status"]`, the selector the e2e specs already use.
- **Files modified:** components/photos/region/__tests__/SequenceFigure.test.tsx, components/photos/__tests__/photo-viewer.test.tsx
- **Commits:** a55b0d2, 0f19923

**3. [Scope] Rows beyond the plan's list:** photo-viewer.test (the step changes the copied URL; none on the end card) and one more e2e Share row (a page loaded with a query and hash). The plan's verify already runs photo-viewer.test.

## Known Stubs

None. The RED stub in `lib/photos/lv95-line.ts` (b9bd3e8) was replaced in a55b0d2.

## Threat Flags

None. No new endpoint, auth path or schema boundary. T-18-38 is mitigated as planned (lv95Line reads only the shown strings, and the property rows prove it). T-18-39 is mitigated (the URL is built from site.url + photoHref of the shown slug; the e2e page row loads `?x=1#y` and gets the bare URL).

## Deferred Issues

None new. The Windows WebKit Hotspots D-22 row is unchanged (deferred-items.md). The Firefox `/offline` axe crash happened once and passed 3/3 alone; it is not logged as Windows-only.

## Self-Check: PASSED

- FOUND: lib/photos/lv95-line.ts, lib/__tests__/lv95-line.test.ts
- FOUND: b9bd3e8, a55b0d2, 0f19923 (ancestors of HEAD)
- Acceptance greps re-run: 1, 4, 4; lv95-line.test 26 rows
