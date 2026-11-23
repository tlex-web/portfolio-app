# Phase 16 deferred items

Out-of-scope discoveries logged by executors (not fixed in the plan that found them).

| Found in | Item | Notes |
|----------|------|-------|
| 16-04 | `e2e/photos-lightbox.spec.ts` is not Prettier-clean at dd6a092 (7 pre-existing spots: six `async ({ page }) =>` test heads over the print width at about lines 375, 394, 445, 701, 1032 and 1160, plus one `expect(...)` call near line 915) | `npm run lint` does not run Prettier, so nothing fails. The 16-04 edits in that file are Prettier-clean. A `prettier --write` on the file would fix it with no change in behaviour |
| 16-14 | `scripts/photos/build-photo-data.mjs` stamps every capture with `TIME_ZONE = 'Europe/Zurich'`, so the two Saalfelden stills (Austria) carry `timeZone: "Europe/Zurich"` | Same offsets as Europe/Vienna all year, so the capture time and offset are right; only the zone label is off. A per-region or per-country zone belongs with Phase 17/18 photo pages, where the label could first show |
| 16-17 | The two Ortler photos (Italy, `sam-20160717-120906`, `sam-20160717-124904`) also carry `timeZone: "Europe/Zurich"` | Same offsets as Europe/Rome all year (+02:00 in July), so the time is right; the same per-region zone fix covers them. Neither file has an OffsetTimeOriginal or a GPS time, so their offset is derived from the wall time alone |
