---
phase: 14-ui-fixes-terminal-controls
plan: 04
subsystem: ui
tags: [react, lightbox, keyboard, escape-layers, hotspots, playwright, jest, a11y]

requires:
  - phase: 14-ui-fixes-terminal-controls
    provides: "14-03 (wave 3) tip; the serial depends_on chain on the shared :3000 e2e server and the lightbox test files"
  - phase: 10
    provides: "LightboxDialog registerEscape layers (callout, zoom, close), useLabelsOn cross-tab store, HotspotKey rows that stay when labels hide"
provides:
  - "setLabels(on) in PhotoViewer: the single path for the Hide labels button and the H key; hiding clears expandedId (D-12)"
  - "collapseCallout visibility guard: a callout whose label and key row have no client rects is cleared without taking the Escape press (D-22)"
  - "Jest rows D-12 and D-22; IN-02 row rewritten in place with a getClientRects stub"
  - "Playwright Hotspots rows: H then Escape (D-12), Hide labels button then Escape (D-12), show again collapsed (D-12), zoom-unwind row rewritten for D-22"
affects: [14-07 (writes the fix commits back to ledger row #30 and the archived 10-REVIEW-DISPOSITION.md IN-01 row), 14-08 (Linux WebKit runs the new rows in CI)]

actuals:
  tokens: 2905
  tasks: 2
  commits: 2
plan_head_before: 1007b9344341d3d8af8fec7e7b2f69229435059f
plan_head_after: 945d23522e1644a0f7179a25b184df3e93055990

tech-stack:
  added: []
  patterns:
    - "Preference toggles that also reset local UI state go through one local setter, never an effect on a cross-tab useSyncExternalStore value"
    - "An Escape layer consumes the press only when its target is visible (getClientRects().length > 0); otherwise it clears its state and returns false so the next layer runs"
    - "Jest rows that need a visible element stub that element's getClientRects with jest.spyOn (jsdom has no layout)"

key-files:
  created: []
  modified:
    - components/photos/PhotoViewer.tsx
    - components/photos/__tests__/lightbox-dialog.test.tsx
    - e2e/photos-lightbox.spec.ts

key-decisions:
  - "D-12: setLabels(on) clears expandedId on hide; no effect on labelsOn, because another tab's storage event would collapse a callout the visitor is reading"
  - "D-22: collapseCallout returns false when no label or key row for the open callout is visible, so zoom and then close take the same press; a visible callout stays the first Escape layer"
  - "The rewritten zoom-unwind e2e row keeps its untagged state (no @no-win-webkit added), so Windows WebKit coverage of that row does not change; the three new history-closing rows carry the tag"

patterns-established:
  - "Visible-or-pass Escape layer: clear hidden state, return false"

requirements-completed: [LBOX-08]

coverage:
  - id: D1
    description: "Hiding labels by the Hide labels button or the H key collapses the open callout, and showing labels again starts with every callout collapsed (D-12)"
    requirement: "LBOX-08"
    verification:
      - kind: unit
        ref: "components/photos/__tests__/lightbox-dialog.test.tsx#hiding labels collapses the open callout; showing them again starts collapsed (D-12)"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Hotspots (LBOX-05) > showing labels again starts with every callout collapsed (D-12) (chromium, firefox)"
        status: pass
    human_judgment: false
  - id: D2
    description: "At the gutter tier, a callout open, then H or the Hide labels button, then one Escape closes the lightbox"
    requirement: "LBOX-08"
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#with a callout open, H hides labels and one Escape closes the lightbox (D-12) @no-win-webkit (chromium, firefox)"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#with a callout open, the Hide labels button collapses it and one Escape closes the lightbox (D-12) @no-win-webkit (chromium, firefox)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A hidden callout (zoomed) never takes Escape: from zoomed with a callout open, one Escape leaves zoom and drops the callout, the next closes (D-22)"
    requirement: "LBOX-08"
    verification:
      - kind: unit
        ref: "components/photos/__tests__/lightbox-dialog.test.tsx#a hidden callout is cleared without taking Escape, so the lightbox closes (D-22)"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#from zoomed with a callout open, one Escape leaves zoom and drops the hidden callout, the next closes (D-22) (chromium, firefox)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A visible callout stays the first Escape layer (callout, zoom, close): the gutter-tier row passes unchanged and the rewritten IN-02 Jest row passes"
    requirement: "LBOX-08"
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#gutter tier: Enter expands a label, Escape collapses it to the label, then closes @no-win-webkit (chromium, firefox)"
        status: pass
      - kind: unit
        ref: "components/photos/__tests__/lightbox-dialog.test.tsx#Escape collapses an open callout before it closes, without CSS.escape (10-REVIEW IN-02)"
        status: pass
    human_judgment: false
  - id: D5
    description: "No regression in the rest of the lightbox e2e file"
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox (122 passed)"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-11-14
status: complete
---

# Phase 14 Plan 04: Hidden-callout Escape trap removed (ledger 10 IN-01) Summary

**One `setLabels(on)` path now collapses the open callout whenever labels hide (D-12). `collapseCallout` only takes an Escape press when the callout's label or key row is visible, so a callout hidden by zoom or by Hide labels passes the press on to zoom and then to close (D-22). The order for visible callouts (callout, zoom, close) is unchanged.**

## Fix commits (for 14-07, ledger row #30 and 10-REVIEW-DISPOSITION IN-01)

- **D-12:** `d6873c8`
- **D-22:** `945d235`

## Performance

- **Duration:** 7 min
- **Started:** 2026-11-14T11:41:15Z
- **Completed:** 2026-11-14T11:48:27Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `components/photos/PhotoViewer.tsx`: a local `setLabels(on)` calls the store setter and, on hide, `setExpandedId(null)`. The H-key `useEffectEvent` and the 'Hide labels' button both call it. Neither calls `setLabelsOn(!labelsOn)` directly any more (count 0). The comment cites D-12 and ledger 10 IN-01, and says why the clear is not an effect on the cross-tab preference.
- `collapseCallout` keeps its name and boolean return. It returns false early when nothing is expanded, otherwise it clears `expandedId`, finds the first candidate with client rects, and focuses it and returns true. With no visible candidate it now returns false, so the same press reaches zoom, then `api.close()`. On the page surface the window-capture handler runs before ZoomStage's document-capture handler, so the same rule holds there with no change to the page handler.
- Jest: a new D-12 row (button, then H, each hide and show leaves every key row collapsed; the stored preference is removed in `finally`). The IN-02 row is rewritten in place: it stubs the expanded row's `getClientRects` to one rect, and now also asserts focus returns to the row. A new D-22 row without the stub shows the callout is cleared and `mockRouter.back` is called once.
- Playwright (Hotspots describe): three new rows (H then Escape, Hide labels button then Escape, show again collapsed). The zoom-unwind row is rewritten in place for D-22.

## Task Commits

1. **Task 1 (tracer): hide-labels collapse (D-12), Jest row and the H then Escape row** - `d6873c8` (fix)
2. **Task 2: hidden-callout guard (D-22), IN-02 and zoom-unwind rows rewritten, two more D-12 rows** - `945d235` (fix)

## Files Created/Modified

- `components/photos/PhotoViewer.tsx`: `setLabels`, both toggles routed through it, the `collapseCallout` visibility guard and its comment.
- `components/photos/__tests__/lightbox-dialog.test.tsx`: the D-12 and D-22 rows, the IN-02 row rewritten with a `getClientRects` stub, and the `HOTSPOT_PREF_KEY` import.
- `e2e/photos-lightbox.spec.ts`: three D-12 rows and the rewritten D-22 zoom-unwind row.

## Decisions Made

- The rewritten zoom-unwind row keeps the plan's title without `@no-win-webkit`. The old row closed through history untagged, so adding the tag would have dropped Windows WebKit coverage of a row that already ran there. The two new rows that close through history carry the tag and the file's standard comment. The show-again row never closes, so it has no tag.
- In the IN-02 row I also assert `toHaveFocus()` on the stubbed row. It pins the "return focus to the visible label or row" half of the layer, which the stub makes testable in jsdom.

## Deviations from Plan

None. The plan ran as written. The two additions above (the focus assertion, keeping the rewritten row untagged) sit inside the plan's wording.

## Issues Encountered

- My first rewrite comment quoted the old row title, and that tripped the `unwinds callout, then zoom, then close` == 0 acceptance grep. I reworded the comment before committing Task 2.
- Each `PW_PROD` build injects a hash into `public/service-worker.js`. I restored it with `git checkout` after every build and never committed it. No server is listening on :3000.

## Verification

- `npx jest components/photos/__tests__/lightbox-dialog.test.tsx components/photos/__tests__/hotspots.test.tsx`: 29 passed.
- `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox --reporter=line -g "Hotspots"` (after Task 1): 24 passed.
- `... -g "Hotspots|Zoom"` (after Task 2): 42 passed. This includes "Escape twice from zoomed closes the lightbox" and the gutter-tier row, which is unchanged.
- The whole file in Chromium and Firefox: 122 passed (116 before, plus 3 new rows in 2 engines).
- Mutations (Jest): without the hide clear, the D-12 row fails. With `return true` for a hidden callout, the D-22 row fails and IN-02 still passes. Source restored both times.
- `npm run lint`: exit 0. `npm run type-check`: clean.
- Acceptance greps: `setLabels(` 3, `setLabelsOn(!labelsOn)` 0, `D-12` in e2e 3, `D-22` in e2e 2, `unwinds callout, then zoom, then close` 0, `D-22` in Jest 2, `10-REVIEW IN-02` 1.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- Ready for 14-05. 14-07 writes `d6873c8` (D-12) and `945d235` (D-22) back to ledger row #30 and the archived IN-01 row.
- Linux WebKit runs the new rows in CI in 14-08.

## Self-Check: PASSED

- FOUND: components/photos/PhotoViewer.tsx, components/photos/__tests__/lightbox-dialog.test.tsx, e2e/photos-lightbox.spec.ts
- FOUND: d6873c8, 945d235 (ancestors of HEAD)

---
*Phase: 14-ui-fixes-terminal-controls*
*Completed: 2026-11-14*
