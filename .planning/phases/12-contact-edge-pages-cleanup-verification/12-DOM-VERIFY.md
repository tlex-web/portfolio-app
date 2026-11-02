---
schema_version: 1
wave: 2
outcome: verified
reason: ok
checked: 12
passed: 9
failed: 0
needs_review: 3
---

# Phase 12 wave 2: live-DOM verification

Target: production `next start` at http://localhost:3000, built from HEAD 789912f. Browser: claude-in-chrome. I fetched each route's server HTML from the same origin and parsed it with DOMParser. The tool's output filter blocked raw titles and URLs, so I checked canonicals and titles by exact comparison and report booleans here.

- 12-09 one absolute canonical per route: **passed**. All 8 routes return 200 and each has exactly 1 `link[rel=canonical]`, equal to `https://portfolio-app-mocha-three.vercel.app` + path.
- 12-09 /photos?view=grid canonicalises to /photos: **passed**. Its single canonical equals the base + `/photos`.
- 12-09 exactly one meta description per route: **passed**. The count is 1 on all 8 routes.
- 12-09 approved descriptions and titles: **passed**. /photos, /projects and /roadmap descriptions exactly match meta.photos, meta.projects and meta.roadmap. Their titles start `Photographs`, `Engineering` and `Roadmap`. The /photos/matterhorn-from-zermatt description matches the meta.photo-slug pattern.
- 12-09 titles and descriptions unique across routes: **passed**. The only duplicate pair is /photos vs /photos?view=grid, which is expected because both are the same page with the same canonical.
- 12-10 Home og:image / twitter:image point at /opengraph-image: **passed**. Both are absolute URLs starting with site.url + `/opengraph-image`. Both have type image/png, width 1200 and height 630.
- 12-10 approved alt text: **passed**. og:image:alt and twitter:image:alt are both `Tim Lui, developer and photographer, over a contour map of the Matterhorn`, which matches og.alt-default.
- 12-07 metric Source links named via aria-label: **passed**. On /projects/box: `Source for Tools`, `Source for Tests` and `Source for Binary`. No sr-only "(label)" suffix is left. coin-flip has no Source links.
- 12-07 EndBlock without py-3: **passed**. No element on /projects/box or /projects/coin-flip has class `py-3`. Each page has one `min-h-14` link.
- 12-07 DemoTerminal entries in one grid cell: **needs_review** (needs a timing/height trace). /projects/box has 4 elements with `[grid-area:1/1]`, so the structure is present. In the SSR HTML all 4 carry aria-hidden=true. That may be the pre-hydration state, and I did not check the live, animated active-entry state or the constant body height.
- 12-07 route log dates and RouteLog marker: **passed** for the text, **needs_review** for position.
  - Text, passed: /roadmap shows `Phase 11 · Engineering & roadmap · 2 Nov 2026`, `Phase 12 · ... · In progress` and `surveyed 2 Nov 2026`.
  - Marker, needs_review: the "Current camp" h2 contains an aria-hidden absolute span using `top-1/2`, and no `top-[39px]` is left. Whether it sits at 0 px offset needs a visual or geometry check. This counts as 1 check passed and 1 needs_review.
- 12-06 canvas idle arm after window load, first scroll arms at once: **needs_review**. This is about the timing of event ordering, and the DOM can't show it. It needs a timing trace or the existing unit tests.

Not DOM-observable (12-08, the network-first service worker): fetch strategy, cache behaviour and update flow. Not checked, and not counted above. No HTTP headers were read.

Note: the 12 checks are the bullets above with the 12-07 route-log item counted as two. That gives 9 passed and 3 needs_review: the demo grid, the marker position and the 12-06 arm timing.
