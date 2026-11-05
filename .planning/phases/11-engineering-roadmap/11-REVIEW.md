---
phase: 11-engineering-roadmap
reviewed: 2026-11-02T11:32:57Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - components/projects/sections/Metrics.tsx
  - components/projects/__tests__/Metrics.test.tsx
  - e2e/case-study.spec.ts
findings:
  critical: 0
  warning: 0
  info: 3
  total: 3
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-11-02T11:32:57Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

This is an incremental re-review (#3661). It covers only the files changed since the last full-phase review (diff base `67f3660`), which is gap plan 11-19 (UAT gap G-11-4):
- The sr-only ` ({tile.label})` suffix on each box Metrics "Source" link (`components/projects/sections/Metrics.tsx:100`).
- The rewritten Metrics unit tests.
- The updated Metrics e2e assertions and the new layout-invisibility e2e (`e2e/case-study.spec.ts:297-392`).

The prior full-phase findings (WR-01, WR-02, IN-01 to IN-12) are still tracked in `11-REVIEW-DISPOSITION.md`. Only IN-08 touches a file in this scope, so it is carried forward below with its updated line. IN-03 (the `sourceUrl` scheme) is unchanged. Its sink is `Metrics.tsx:95`, but its fix belongs in `data/schemas/project.ts`, which is outside this scope, so it is not repeated here.

The change is correct:
- **Layout:** the suffix uses Tailwind v4's `sr-only` (position absolute, 1 x 1 px, clipped). An absolutely positioned child takes no part in the inline-flex layout or its `gap-1`, so it cannot widen the link.
- **Accessible name:** the leading space gives jsdom, Playwright's accname implementation and the browser the same name, `Source (Tools)`. The visible word "Source" stays at the start of the name, so WCAG 2.5.3 (Label in Name) holds.
- **No regressions elsewhere:** no other unit test or e2e queried a bare `'Source'` link (grep of `components/`, `e2e/`, `lib/` and `app/`). The `SiteFooter` "Source" is a `dd` label, not this link.
- **The e2e invisibility test is sound:** it measures, removes the suffixes and re-measures in one synchronous `evaluate`, so no frame or font swap can land between the two measurements. It would fail if `sr-only` were lost (the link rect changes and the suffix rect grows past 1 px) or swapped for `hidden` (the suffix count drops to 0).

No Critical or Warning issues. The three Info items are:
- G-11-4 relies on tile labels being non-empty and distinct, and nothing enforces that (IN-13).
- One unit assertion can never fail (IN-14).
- The carried-forward key-uniqueness gap (IN-08).

## Info

### IN-08: React keys come from content whose uniqueness the schema does not enforce

**File:** `components/projects/sections/Metrics.tsx:82` (previously cited as `:77`; the other sites listed in the original finding are outside this scope)
**Issue:** The tile wrapper is keyed by `tile.key`, and `MetricTile.key` is a plain `z.string()` (`data/schemas/project.ts:35`) with no uniqueness check on the `tiles` array. A duplicate key causes a React key warning and possibly a mis-reconciled list. This is the same finding as the full-phase IN-08, still open. It is listed again only because Metrics.tsx is in this review's scope.
**Fix:** Add a `.refine` on `tiles` that rejects duplicate keys, as `TrailsFile` does for trail ids. IN-13's fix can share that refine.

### IN-13: The G-11-4 link names are only distinct if tile labels are non-empty and unique, and nothing enforces either

**File:** `components/projects/sections/Metrics.tsx:100`; contract at `data/schemas/project.ts:36,70`
**Issue:** G-11-4 promises that source links sharing a page are "still told apart" (doc comment at `Metrics.tsx:52-54`). The suffix comes entirely from `tile.label`, but:
- `MetricTile.label` is `z.string()`, so `''` is valid. An empty label gives the link the name `Source ()`, and its `dt` is empty too.
- `tiles: z.array(MetricTile).min(1)` has no uniqueness check on labels. Two sourced tiles with the same label (for example two "Tests" tiles pointing at different milestones) would again produce identical link names. That is exactly the defect G-11-4 closed.

Today's box labels (Tools, Tests, Binary) are fine, so nothing is broken now. The guarantee lives only in the current data, though. The unit test cannot catch a regression either, because its `tiles(n)` fixture makes labels unique by construction (`Metrics.test.tsx:19-26`).
**Fix:** Enforce the contract in the schema and pin it with a data test:
```ts
const MetricTile = z.strictObject({
  key: z.string().min(1),
  label: z.string().min(1),
  // ...
});
// in ProjectBase.metrics:
tiles: z
  .array(MetricTile)
  .min(1)
  .refine((t) => new Set(t.map((x) => x.key)).size === t.length, 'duplicate metric key')
  .refine((t) => new Set(t.map((x) => x.label)).size === t.length, 'duplicate metric label'),
```

### IN-14: A unit assertion that the suffix "has class sr-only" can never fail

**File:** `components/projects/__tests__/Metrics.test.tsx:104-106`
**Issue:** `suffixes` is selected with `link.querySelectorAll('.sr-only')`, so `expect(suffixes[0]).toHaveClass('sr-only')` is always true. The real protection comes from two other checks: the `toHaveLength(1)` on line 105, and the `onScreen` text check on lines 100-102. If the class were dropped, the selection would be empty and line 105 would fail before line 106 runs. Line 106 reads as the guard named in the file header ("the sr-only class of a source link's suffix") but adds no coverage, which misleads anyone editing the test later.
**Fix:** Select the suffix structurally and assert the class on the result, so the assertion carries weight:
```ts
const suffix = link.lastElementChild as HTMLElement; // the span after the icon
expect(suffix.tagName).toBe('SPAN');
expect(suffix).toHaveClass('sr-only');
expect(suffix.textContent).toBe(' (Label 1)');
expect(link.querySelectorAll('.sr-only')).toHaveLength(1);
```

---

_Reviewed: 2026-11-02T11:32:57Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
