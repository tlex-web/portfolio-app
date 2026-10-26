---
phase: "10"
slug: "photography"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-26"
---

# Phase 10 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> The register was authored at plan time: all 13 plans carry a `<threat_model>`. That gives 30 threats, T-10-01 to T-10-30, plus the shared supply-chain row T-10-SC. secure-phase verified it at ASVS L1 (grep and test depth) on 2026-10-26 at HEAD e91e72c, with block_on: high. The orchestrator ran the check; the auditor was skipped (short-circuit: no threat open, register authored at plan time, ASVS 1). No SUMMARY has a `## Threat Flags` section.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| URL path → photo route | `/photos/{slug}` and the intercepted `@modal/(.)[slug]` route take a slug from the address bar | Slug string (visitor-controlled) |
| URL query → mounted view | `?view=` chooses Map, Grid or Carousel | Query string (visitor-controlled) |
| image manifest → served photos | Only pipeline derivatives (metadata-free, content-hashed, ≤ 2560 px) may reach any photo surface | Image URLs (EXIF/GPS-free) |
| photo pipeline (sidecar, corrections, DEM) → displayed facts | Positions, altitudes, capture times and coordinates are shown as facts on the strip and the map | 4-dp coordinates, DEM metres, local times |
| committed editorial data → external links | Hotspot fact links leave the site | https URLs |
| browser storage → label preference | One on/off value persists the Hide labels choice | `photos.labels` = `on` / `off` |
| committed layout numbers → inline `<style>` | Map plate positions are written as container-query CSS into the server HTML | Numbers, the four slugs, fixed selectors |
| device capability → 3D carousel | Capability signals decide whether three.js loads | Client-only capability signals |
| orchestrator → GitHub (gh) | Pushes, workflow dispatch and re-run use Tim's credentials | Branch refs, workflow inputs |
| CI artifact → committed baselines | Visual-baseline PNGs come back from the CI container | PNG files |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-10-01 | Tampering | `app/(site)/photos/[slug]/page.tsx` | medium | mitigate | `generateStaticParams` lists the four slugs, `dynamicParams` is off, and `notFound()` runs on a miss (page.tsx:1, 11-12). e2e: an unknown slug and a wrong-case slug both return 404 | closed |
| T-10-02 | Information disclosure | `lib/photos/view-model.ts`, ExifStrip | medium | mitigate | Positions are 4-dp, `≈`-prefixed and marked `±100 m (approx.)` when approximate (view-model.ts:56-58; `formatCoordinates`). Covered by unit and strip tests | closed |
| T-10-03 | Information disclosure | PhotoViewer stage | high | mitigate | Only hashed manifest derivatives are used, with no download control (PhotoViewer.tsx:62, StagePhoto.tsx:38). e2e regexes on `currentSrc` (photos-lightbox, photos-sweep) and the served-image guard in lint | closed |
| T-10-04 | Tampering | `data/schemas/photo.ts` corrections | medium | mitigate | A corrections position must be `hand-placed` and approximate (photo.ts:125-143, WR-08). Covered by schema tests | closed |
| T-10-05 | Information disclosure | `check-served-images.mjs`, `.gitignore` | high | mitigate | The guard scans raw (`*.dng`, `*.cr2`, …) and HEIF/HEIC files (check-served-images.mjs:14-15); selftest has a `bad-raw/x.dng` case; `.gitignore` lists `public/images/landscapes/` again. WR-06 item 2 (pre-commit hook) was accepted in the plan, with the CI lint gate as the control | closed |
| T-10-06 | Tampering | `scripts/photos/build-derivatives.mjs` | low | mitigate | The manifest is validated in memory before any write; stale files are unlinked last (build-derivatives.mjs:314). No regression test yet (VALIDATION G6, deferred) | closed |
| T-10-07 | Tampering | `build-photo-data.mjs`, PhotoFacts.uv | medium | mitigate | An out-of-extent position throws before a clamped height is written (build-photo-data.mjs:~221 "position lies outside the DEM extent"); the schema bounds uv (`data/__tests__/photos.test.ts:235`) | closed |
| T-10-08 | Denial of service | `StagePhoto.tsx` | low | mitigate | A failed derivative shows "Couldn't load this photo." and Retry (StagePhoto.tsx:24-25); covered by an e2e with aborted requests ("Stage states") | closed |
| T-10-09 | Information disclosure | StagePhoto error state | medium | mitigate | The error state has no download control and no image link (StagePhoto.tsx:38); e2e asserts `[download]` count 0 (photos-lightbox.spec.ts:49, 222) | closed |
| T-10-10 | Tampering | `lib/photos/view-param.ts` | low | mitigate | `parseView` whitelists three exact values and falls back to map (view-param.ts:7-9); unit tests | closed |
| T-10-11 | Information disclosure | `JustifiedGrid.tsx` | medium | mitigate | Tiles use only content-hashed manifest derivatives (JustifiedGrid.tsx:85); e2e `currentSrc` pattern; served-image guard | closed |
| T-10-12 | Tampering | `@modal/(.)[slug]/page.tsx`, restoreFocus | medium | mitigate | An unknown slug hits `notFound()` (modal page.tsx:32); the router only calls `back()` and `push('/photos')`; the focus selector uses `CSS.escape` on a pathname slug | closed |
| T-10-13 | Denial of service | `LightboxDialog.tsx` | medium | mitigate | Tab and Shift+Tab wrap; Escape is handled on keydown with `preventDefault`; `onClose` re-syncs the URL (LightboxDialog.tsx:21-28); e2e three-cycle Escape test | closed |
| T-10-14 | Tampering | PhotoViewer `stepTo` | medium | mitigate | `history.replaceState` writes `/photos/` plus a neighbour slug from the view-model; `slugFromPath` reads only paths matching `PHOTO_PATH` (PhotoViewer.tsx:85-86, stepping.ts) | closed |
| T-10-15 | Denial of service | history handling | low | mitigate | Steps replace the current entry; e2e asserts `history.length` is unchanged (photos-lightbox.spec.ts:443, 460) | closed |
| T-10-16 | Denial of service | `PhotoCarousel3D.tsx` | medium | mitigate | Capability gate (`useAscentMode`), `SafeCanvas`, `downgradeAscent` to the stepper, demand frameloop with offscreen and hidden-tab pause (PhotoCarousel3D.tsx:6-10); e2e no-webgl and hidden-tab cases | closed |
| T-10-17 | Tampering | CarouselView key handling | low | mitigate | Arrow keys use the region's own `onKeyDown` (CarouselView.tsx:120, 141); there is no window or document keydown listener (the document listeners are only `LIGHTBOX_CLOSE_EVENT` and `visibilitychange`) | closed |
| T-10-18 | Tampering | MapSheet inline style (`mapMarkCss`) | low | mitigate | The CSS is built from rounded numbers, the four slugs and fixed selectors; the generator throws on any slug outside `[a-z0-9-]` (label-layout.ts); a unit test asserts the character set | closed |
| T-10-19 | Information disclosure | MapSheet pins | low | accept | See Accepted Risks Log AR-10-01 | closed |
| T-10-20 | Tampering | `scripts/guards/palette-ratchet.json` | medium | mitigate | Changed only through `guard:palette -- --update`, which refuses a raise; now `{ "components/Header.tsx": 1 }` | closed |
| T-10-21 | Information disclosure | legacy image consumers | medium | mitigate | The bridge and every legacy consumer are deleted (10-09, aa9dff6); a Jest source guard fails if any file under app, components or lib reads a legacy path | closed |
| T-10-22 | Denial of service | `ZoomStage.tsx` | low | mitigate | `touch-action` always includes `pinch-zoom` (ZoomStage.tsx:25, 35); keys and buttons duplicate every gesture; Escape leaves zoom first (e2e "Zoom") | closed |
| T-10-23 | Tampering | Hotspots fact links | medium | mitigate | Every external link has `target=_blank rel="noopener noreferrer"` (Hotspots.tsx:67); the schema validates hrefs as https; component test | closed |
| T-10-24 | Denial of service | `lib/photos/hotspot-pref.ts` | low | mitigate | Every localStorage access is in try/catch, with labels on as the fallback (hotspot-pref.ts:15, 40-42); unit and e2e blocked-storage cases | closed |
| T-10-25 | Information disclosure | `lib/photos/hotspot-pref.ts` | low | mitigate | One `photos.labels` key holding `on`/`off` only (hotspot-pref.ts:41, 50); no cookie, no network call; a unit test asserts nothing else is written | closed |
| T-10-26 | Tampering | `e2e/visual/routes.spec.ts` | low | mitigate | Explicit snapshot name arrays; canvases hidden via `hide-canvas.css`, never masked (routes.spec.ts:62-64); new shots came only from the CI container (10-13) | closed |
| T-10-27 | Information disclosure | photo surfaces | medium | mitigate | `e2e/photos-sweep.spec.ts:12-13` checks that every loaded image is a hashed derivative and that no download control exists, on all 8 surfaces; CI E2E green (run 40367226761) | closed |
| T-10-28 | Elevation of privilege | gh push, dispatch, re-run | medium | mitigate | Nothing ran before Tim's literal replies ("approve (Recommended)"; later "A: widen + nowrap (Recommended)" for one extra dispatch). There were only plain and fast-forward pushes to `ci/10-13` (remote now 483895b): no force push, no push of the phase branch or main | closed |
| T-10-29 | Tampering | `e2e/visual/routes.spec.ts-snapshots/` | medium | mitigate | Blob-compare and per-slug `--allow`; `check-snapshot-commit --sha 483895b --some --allow photos --allow photos-grid --allow photos-carousel --allow photo --allow lightbox` → "OK (15 changed)"; Tim committed the PNGs; the determinism re-run was green | closed |
| T-10-30 | Tampering | `scripts/guards/test-count.baseline.json` | medium | mitigate | `--update` refuses a lower total; the baseline rose from 966 to 1300 (jest 942, e2e 358, commit 483895b) | closed |
| T-10-SC | Tampering | npm installs | high | mitigate | No package installs in Phase 10: `package.json` and `package-lock.json` are unchanged from 4a3a69c to HEAD. One `npx tsx` call in 10-12 only populated the npx cache; no project file changed | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-10-01 | T-10-19 | Map pin positions come from the committed 4-dp coordinates, which the photo strip and the footer already show publicly. The hand-placed film scan is marked approximate (dashed dot, "approx."). | Plan-time `accept` disposition (10-08-PLAN). It rests on Tim's PROJECT.md decision to show coordinates at 4 dp and was not re-confirmed separately for the map. Low severity, below the high threshold. | 2026-10-26 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-26 | 31 | 31 | 0 | orchestrator (secure-phase, ASVS L1 grep and test depth, short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-26
