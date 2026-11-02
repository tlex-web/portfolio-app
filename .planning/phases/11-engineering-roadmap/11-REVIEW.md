---
phase: 11-engineering-roadmap
reviewed: 2026-11-02T02:00:05Z
depth: standard
files_reviewed: 115
files_reviewed_list:
  - .gitattributes
  - .gitignore
  - app/(site)/projects/[slug]/page.tsx
  - app/(site)/projects/page.tsx
  - app/(site)/roadmap/page.tsx
  - app/globals.css
  - components/InlineCode.tsx
  - components/projects/CaseStudy.tsx
  - components/projects/DemoClip.tsx
  - components/projects/DemoTerminal.tsx
  - components/projects/EndBlock.tsx
  - components/projects/RouteIndex.tsx
  - components/projects/RoutePanel.tsx
  - components/projects/RouteProfile.tsx
  - components/projects/TrailGradeMark.tsx
  - components/projects/Trailhead.tsx
  - components/projects/__tests__/CaseStudy.test.tsx
  - components/projects/__tests__/DemoClip.test.tsx
  - components/projects/__tests__/DemoTerminal.test.tsx
  - components/projects/__tests__/EndBlock.test.tsx
  - components/projects/__tests__/Metrics.test.tsx
  - components/projects/__tests__/RouteIndex.test.tsx
  - components/projects/__tests__/RoutePanel.test.tsx
  - components/projects/__tests__/RouteProfile.test.tsx
  - components/projects/__tests__/TrailGradeMark.test.tsx
  - components/projects/__tests__/projects-page.test.tsx
  - components/projects/__tests__/sections.test.tsx
  - components/projects/sections/Demo.tsx
  - components/projects/sections/Metrics.tsx
  - components/projects/sections/NextSteps.tsx
  - components/projects/sections/Pipeline.tsx
  - components/projects/sections/Privacy.tsx
  - components/projects/sections/Problem.tsx
  - components/projects/sections/Safety.tsx
  - components/projects/sections/Stack.tsx
  - components/roadmap/RouteLog.tsx
  - components/roadmap/RouteLogFilters.tsx
  - components/roadmap/RouteRow.tsx
  - components/roadmap/__tests__/RouteLog.test.tsx
  - components/roadmap/__tests__/RouteLogFilters.test.tsx
  - components/site/__tests__/SiteChrome.test.tsx
  - data/__tests__/media-manifest.test.ts
  - data/__tests__/precache.test.ts
  - data/__tests__/projects.test.ts
  - data/__tests__/roadmap.test.ts
  - data/__tests__/trail-profiles.test.ts
  - data/generated/media-manifest.ts
  - data/generated/trail-profiles.ts
  - data/home.ts
  - data/media/clips.json
  - data/projects.ts
  - data/roadmap.ts
  - data/schemas/media-manifest.ts
  - data/schemas/project.ts
  - data/schemas/roadmap.ts
  - data/schemas/trail.ts
  - data/terrain/source/trails.json
  - data/types.ts
  - e2e/case-study-page.spec.ts
  - e2e/case-study.spec.ts
  - e2e/demo-clip.spec.ts
  - e2e/no-webgl.spec.ts
  - e2e/projects.spec.ts
  - e2e/roadmap.spec.ts
  - e2e/shell.spec.ts
  - e2e/visual/README.md
  - e2e/visual/hide-canvas.css
  - e2e/visual/routes.spec.ts
  - eslint.config.mjs
  - lib/__tests__/demo-terminal.test.ts
  - lib/__tests__/inline-code.test.ts
  - lib/__tests__/log-date.test.ts
  - lib/__tests__/route-log.test.ts
  - lib/__tests__/service-worker-media.test.ts
  - lib/__tests__/trail-grade.test.ts
  - lib/__tests__/trail-profile.test.ts
  - lib/demo-terminal.ts
  - lib/inline-code.ts
  - lib/log-date.ts
  - lib/route-log.ts
  - lib/trail-grade.ts
  - lib/trail-profile.ts
  - next.config.ts
  - package.json
  - proxy.ts
  - public/service-worker.js
  - scripts/guards/__selftest__/contrast/at-threshold.css
  - scripts/guards/__selftest__/contrast/below-threshold.css
  - scripts/guards/__selftest__/contrast/low-ink.css
  - scripts/guards/__selftest__/contrast/low-trail.css
  - scripts/guards/__selftest__/contrast/missing-danger.css
  - scripts/guards/__selftest__/contrast/unknown-token.css
  - scripts/guards/__selftest__/contrast/var-cycle.css
  - scripts/guards/__selftest__/served-images/bad-mp4-audio/README.md
  - scripts/guards/__selftest__/served-images/bad-mp4-audio/data/generated/media-manifest.ts
  - scripts/guards/__selftest__/served-images/bad-mp4-metadata/README.md
  - scripts/guards/__selftest__/served-images/bad-mp4-metadata/data/generated/media-manifest.ts
  - scripts/guards/__selftest__/served-images/bad-mp4-order/README.md
  - scripts/guards/__selftest__/served-images/bad-mp4-order/data/generated/media-manifest.ts
  - scripts/guards/__selftest__/served-images/bad-mp4-uuid/README.md
  - scripts/guards/__selftest__/served-images/bad-mp4-uuid/data/generated/media-manifest.ts
  - scripts/guards/__selftest__/served-images/bad-mp4-xmp/README.md
  - scripts/guards/__selftest__/served-images/bad-mp4-xmp/data/generated/media-manifest.ts
  - scripts/guards/__selftest__/served-images/bad-video-format/README.md
  - scripts/guards/__selftest__/served-images/bad-video-format/public/media/coin-flip-toss.eebff415df.webm
  - scripts/guards/__selftest__/served-images/good-mp4/README.md
  - scripts/guards/__selftest__/served-images/good-mp4/data/generated/media-manifest.ts
  - scripts/guards/check-contrast.mjs
  - scripts/guards/check-served-images.mjs
  - scripts/guards/lib/mp4-boxes.mjs
  - scripts/guards/selftest.mjs
  - scripts/guards/test-count.baseline.json
  - scripts/media/build-clip.mjs
  - scripts/terrain/build-trails.mjs
  - scripts/terrain/fetch-trails.mjs
findings:
  critical: 0
  warning: 2
  info: 12
  total: 14
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-11-02T02:00:05Z
**Depth:** standard
**Files Reviewed:** 115
**Status:** issues_found

## Summary

This review covered the Phase 11 surface: the /projects route panels, the case-study slot template and its islands (RouteIndex, DemoTerminal, DemoClip), the /roadmap route log and its filter island, the pure libraries (demo-terminal, route-log, log-date, inline-code, trail-profile, trail-grade), the zod contracts and data, the trail and clip generators, the MP4 box walker and served-asset guard, the service-worker media bypass, the proxy and header config, and the tests. The `data/generated/*` files were judged through their generators, and the `__selftest__` bad fixtures were read as deliberate bad input.

Overall the code is careful. The pure modules check their inputs. Visitor input on /roadmap goes through whitelists, and `routeLogHref` rebuilds hrefs from enum values only. Copy renders as React text, so nothing is parsed as HTML. ffmpeg runs only through `execFileSync` with an argument array. I checked the MP4 box offsets (mvhd, tkhd and mdhd in v0 and v1, plus hdlr) against ISO-BMFF and they are correct. The case-study slot guards in `renderSlot` match the section components' own null rules wherever the zod `.min(1)` constraints apply.

I found no Critical issues. Two Warnings are real behaviour bugs:
- A URL hash the visitor controls can throw `URIError` inside RouteIndex's observer and hashchange handlers.
- A pending-transition race in RouteLogFilters lets a fast second press go to an empty combination that the UI says it prevents.

The Info items cover defensive gaps, duplicated constants, hard-coded copy and loose schema constraints.

**coin-flip private-repo check:** I grepped every in-scope file for coin-flip internals (Android/Kotlin identifiers, source paths, package names, `SecureRandom`, defect-ID patterns, private repo URLs). Nothing leaked. The coin-flip entry in `data/projects.ts` holds only approved public wording, and `clips.json` holds only the sha256 of the local recording.

The UI audit (11-UI-REVIEW.md) already covers the visual items (EndBlock py-3, DemoClip controls over HEADS, RouteLog arbitrary offsets). They are not repeated here.

## Warnings

### WR-01: A malformed URL hash makes RouteIndex throw `URIError` on every observer callback

**File:** `components/projects/RouteIndex.tsx:34-37` (called at `:130` and `:142`)
**Issue:** `hashSection` runs `decodeURIComponent(window.location.hash.slice(1))` without a guard. The hash is controlled by the visitor: `/projects/box#%` or `/projects/box#%E0` makes `decodeURIComponent` throw `URIError: URI malformed` (reproduced in Node). Two things follow:
- In the IntersectionObserver callback, `fromHash = first ? hashSection(ids) : null;` throws before `first = false` runs. `first` stays `true`, so every later observer callback throws again and never reaches `spy()`. No section is marked current on load, and the spy works only through the passive scroll handler.
- `onHashChange` throws the same way.

Each throw is an uncaught error on `window` (console noise, error-reporting noise), caused by a link anyone can craft.
**Fix:** Decode defensively, and treat an undecodable hash as "no section":
```ts
function hashSection(ids: readonly string[]): string | null {
  let id: string;
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return null;
  }
  return ids.includes(id) ? id : null;
}
```
Add a unit test that sets `window.location.hash = '#%'` before the first observer callback.

### WR-02: RouteLogFilters judges disabled segments with stale counts while a press is pending, so a fast second press can reach an empty combination

**File:** `components/roadmap/RouteLogFilters.tsx:87-110,126`
**Issue:** `pressed` and each segment's `next` come from the optimistic filter, but `count`, and so `disabled`, come from the server `counts` prop. That prop still describes the previous filter until the RSC render lands. Example:
1. The filter is All/All and the visitor presses Project → box. The optimistic project is now `box`.
2. The Status counts still say Planned = 2 (the two coin-flip rows), so Planned is not disabled.
3. A second press on Planned before the server render lands calls `router.replace('/roadmap?project=box&status=planned')`, which is a zero-entry combination.

The component doc (lines 69-72) and the page doc ("reachable only by a typed URL", `app/(site)/roadmap/page.tsx:45-47`) both say the empty plate can't be reached by pressing segments. On a slow network this race is easy to hit, and the counts shown in the meantime contradict the pressed state.
**Fix:** Read `isPending` from `useTransition` and treat cross-group presses as inert while it is set. Alternatively, pass the item tally (area × status, 9 integers) to the island and run `countsFor` on the optimistic filter on the client:
```tsx
const [isPending, startTransition] = useTransition();
// ...
const disabled = (s.count === 0 && !s.pressed) || (isPending && !s.pressed);
```
The client-side recount is the better fix, because it also keeps the visible counts in step with the optimistic pressed state.

## Info

### IN-01: DemoTerminal and `tick` crash on an empty or shrunken command list

**File:** `components/projects/DemoTerminal.tsx:201,262`; `lib/demo-terminal.ts:74-85`
**Issue:** With `commands = []`, `current` is `undefined` and `spokenCommand(current, …)` reads `command.input`, which throws a TypeError during render. `tick` handles `count === 0` but not `state.index >= count`, where `commands[state.index]` is `undefined`. Today the schema's `.min(1)` and `hasDemo` prevent this, but the component documents G2 (one command) and is silent on zero.
**Fix:** Return `null` from DemoTerminal when `count === 0`. In `tick`, clamp or reset when `state.index >= count`, for example by returning `initialState()`.

### IN-02: The MP4 walker can throw `RangeError` on truncated box payloads, and the guard does not catch it

**File:** `scripts/guards/lib/mp4-boxes.mjs:61-64,116-133`; `scripts/guards/check-served-images.mjs:306`
**Issue:** `times()` and `mp4Info()` read fixed offsets inside mvhd, tkhd and mdhd without checking that the box payload is long enough. A truncated box at the end of the buffer makes `readUInt32BE` or `readBigUInt64BE` throw. `main()` in check-served-images is called without `.catch`, so the guard dies with an unhandled-rejection stack trace instead of a `<path> video:` violation line. It still exits non-zero, so it fails closed, but the output loses the file name.
**Fix:** Before reading, check that `b.size - b.header` covers the offsets (24 bytes for v0 mvhd, 36 for v1, and so on) and push a `truncated <type>` violation if not. Add `main().catch((e) => { console.log(\`served-images: ${e.message}\`); process.exit(1); })`.

### IN-03: The metric `sourceUrl` accepts any URL scheme

**File:** `data/schemas/project.ts:39`
**Issue:** `sourceUrl: z.url().optional()` accepts `http:`, `javascript:` and `data:` URLs. In the same phase, `TrailSpec.listingUrl` (`data/schemas/trail.ts:44`) uses `z.url({ protocol: /^https$/ })`. React 19 blocks `javascript:` hrefs, so the real risk is low, but the contract is looser than the site's other external links.
**Fix:** `sourceUrl: z.url({ protocol: /^https$/ }).optional()`.

### IN-04: Route-log row ids are unconstrained, yet they become DOM ids and URL fragments next to fixed band ids

**File:** `data/schemas/roadmap.ts:37`; `components/roadmap/RouteRow.tsx:110,124`; `components/roadmap/RouteLog.tsx:44,64`
**Issue:** `id: z.string().min(1)` allows spaces, `#` and uppercase. It also allows ids that collide with ids already on /roadmap: `summit`, `current-camp`, `base`, `*-heading` and `main-content`. Each row id becomes `<li id>` and the `#id` fragment in the compact Next-steps link. The data test checks uniqueness only.
**Fix:** `id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)`, plus a data test that rejects the reserved band and heading ids.

### IN-05: DemoClip hard-codes coin-flip copy and a fixed DOM id, and Demo hard-codes the clip id

**File:** `components/projects/DemoClip.tsx:40-41,48`; `components/projects/sections/Demo.tsx:14,34`
**Issue:**
- The accessible name `"coin-flip: one coin toss, screen recording"` is copy that lives in the component instead of in the approved data, so a different clip would silently keep the wrong name.
- `id="demo-clip-description"` is fixed, so a second clip on one page would duplicate it.
- `hasDemo` and `Demo` index `mediaManifest['coin-flip-toss']` directly instead of using `project.clip.id`.

**Fix:** Pass `label` from the data, for example a `clip.label` field. Derive the description id from the clip id (`${clip.id}-description`) or use `useId` in a tiny wrapper. Look up `mediaManifest[project.clip.id]`.

### IN-06: The roadmap empty-state sentence breaks when no filter is set

**File:** `app/(site)/roadmap/page.tsx:99`
**Issue:** With the All/All filter and an empty `roadmapItems`, `filterLabels(filter)` is `[]` and the plate reads "Nothing matches . Show every entry…", and the "Show all entries" link points back to the same page. This can't happen with today's data, but the branch exists.
**Fix:** When `filterLabels(filter).length === 0`, render a separate sentence ("No entries yet.") and leave out the reset link.

### IN-07: RouteIndex hard-codes the band top that CSS derives from `--nav-h`

**File:** `components/projects/RouteIndex.tsx:9-11` vs `app/globals.css:39,253`
**Issue:** `BAND_TOP = 80` and `ROOT_MARGIN '-80px …'` restate `calc(var(--nav-h) + 16px)` with `--nav-h: 64px`. The scroll-spy depends on an anchor jump landing exactly on the band edge, so changing `--nav-h` would silently break "the jumped-to section is current".
**Fix:** Export one `NAV_H` constant used by both, or read `--nav-h` with `getComputedStyle` once in the effect and build the root margin from it.

### IN-08: React keys come from content whose uniqueness the schema does not enforce

**File:** `components/projects/sections/Privacy.tsx:32`; `components/projects/sections/Stack.tsx:33,38`; `components/projects/sections/Metrics.tsx:77`; `components/roadmap/RouteRow.tsx:86`; `components/projects/RoutePanel.tsx:60,82`
**Issue:** The keys are `fact`, `group.label`, `item`, `tile.key`, `phase.n` and the kicker `unit`. None of these is checked for uniqueness by zod or the data tests. A duplicate causes a React key warning and possibly a mis-reconciled list.
**Fix:** Add `.refine` uniqueness checks on the relevant arrays (as `TrailsFile` does for trail ids), or key by index where the list is static.

### IN-09: Section emptiness rules are written twice, so the index can list a section that renders nothing

**File:** `components/projects/CaseStudy.tsx:84,89,103` vs `sections/Pipeline.tsx:38`, `sections/Privacy.tsx:20`, `sections/Stack.tsx:22`
**Issue:** `renderSlot` returns an element when `project.pipeline`, `project.privacy` or `project.stack` exists. The section components then return `null` for zero stages, facts or groups. `caseStudySections` only checks that the element is non-null, so an object that bypassed the schema would still produce a RouteIndex entry and an `mt-16` wrapper around nothing. `data/projects.ts` is typed but not parsed at runtime (only in tests), and the inferred zod type does not encode `.min(1)`.
**Fix:** Put the emptiness predicate in `renderSlot` only (for example `project.pipeline?.stages.length`), as Metrics and Problem already do, and drop the duplicate guards, or have the components export their own predicates the way `hasDemo` does.

### IN-10: fetch-trails reads source.json without the schema

**File:** `scripts/terrain/fetch-trails.mjs:379`
**Issue:** `JSON.parse(...)` of `source.json` is used directly for `extent`. build-trails parses the same file with `TerrainSource.parse`. A malformed extent would give confusing "outside the extent" failures, or none at all, instead of a schema error.
**Fix:** `const source = TerrainSource.parse(JSON.parse(...))`, importing from `../../data/schemas/terrain.ts`.

### IN-11: A RouteRow comment calls /roadmap static, but the page is rendered per request

**File:** `components/roadmap/RouteRow.tsx:103-106`
**Issue:** The comment says "A document navigation to the static /roadmap makes the row the :target". `app/(site)/roadmap/page.tsx` awaits `searchParams`, so the route is rendered per request. The plain-anchor reasoning still holds, but the stated premise is wrong and could mislead a later change.
**Fix:** Change "static /roadmap" to "/roadmap".

### IN-12: In write mode, build-clip is not atomic and deletes any file in public/media/ it did not produce

**File:** `scripts/media/build-clip.mjs:314-330`
**Issue:** The new clips are written, then the manifest, then every other file in `public/media/` is unlinked. A failure partway through, such as a manifest write error, leaves new files with the old manifest. Any non-clip asset placed in `public/media/` is deleted without asking. The guard's orphan rule makes such a file invalid anyway, but write mode removes it instead of reporting it.
**Fix:** Write the manifest to a temp path and rename it into place. In write mode, only delete files whose names match a known clip stem (`^<id>(-poster)?\.[0-9a-f]{10}\.(mp4|webp)$`), and report any other file as an orphan, as check mode does.

---

_Reviewed: 2026-11-02T02:00:05Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
