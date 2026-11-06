# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## hidden-tab-burst-decline — A reveal burst interrupted by a hidden tab declines on return instead of restarting
- **Date:** 2026-11-06
- **Error patterns:** hidden tab, rAF suspended, visibilitychange, reveal burst, ascent-frame-budget, decline, data-ascent-mode static, frame-budget, downgrade, WR-01, G-09-5
- **Root cause(s):** CameraRig dropped an interrupted burst only in useFrame, which needs a frame to run while the stage is not shown; a hidden tab runs none, and visibilitychange fires before the held frame, so the stale budget is sampled; frame-budget.ts counts the hidden wall-clock time against the burst window
- **Fix:** 09-15: 9f35845 drops the burst in CameraRig update() when the stage stops being shown; 450b2a6 and 49a3dac add the tests
- **Files changed:** components/home/terrain/CameraRig.tsx, components/home/terrain/TerrainCanvas.tsx, lib/useAscentMode.ts, lib/__tests__/frame-budget-policy.test.ts, e2e/helpers/webgl.ts, e2e/home-canvas.spec.ts
- **Why not caught:** the e2e setVisibility helper fakes visibility while frames keep running, so it takes the useFrame drop path and cannot reach this case
- **Recurrence guard:** e2e/home-canvas.spec.ts "a tab hidden during the reveal burst restarts it at device scale 1 / 2 @chromium-only", using holdFramesWhileHidden
---

## hero-scrim-over-rail — The hero scrim dims the altimeter rail labels and readout at 768-1023 px
- **Date:** 2026-11-06
- **Error patterns:** hero scrim, altimeter rail, composed contrast, stacking context, sticky stage, isolate, z-index no effect, 768-1023, G-09-4 N1
- **Root cause(s):** HeroBlock's full-bleed scrim paints above the sticky stage, which is its own stacking context; below lg: the scrim is a full-width vertical gradient, so it lies at 0.54-0.89 over the rail
- **Fix:** 09-17: 1da76cd moves the rail to its own layer above the scrim (`data-ascent-rail-layer`); fc54409 adds the composed contrast test
- **Files changed:** components/home/AltimeterRail.tsx, components/home/AscentHero.tsx, components/home/__tests__/rail.test.tsx, e2e/home-ascent.spec.ts, e2e/home-modes.spec.ts
- **Why not caught:** B8 is summit-only and its helper compares the raw text colour, so it cannot see an overlay painted above the text
- **Recurrence guard:** e2e/home-modes.spec.ts describe "N1: rail labels and readout over the hero, composed through every overlay" (`composedContrast`); components/home/__tests__/rail.test.tsx
---

## summit-pins-under-plaque — Summit pins sit under the plaque at small and mid-width stages, in 3D and on the static poster
- **Date:** 2026-11-06
- **Error patterns:** summit plaque, pins hidden, poster pins, 375x667, 768x1024, 820x1180, 1024x768, open-loop framing, scrollbar-gutter, G-09-2
- **Root cause(s):** the plaque is a fixed-pixel, content-sized box, and the pins are placed by rules that never consult it: share-based 3D framing and fixed poster UVs
- **Fix:** 09-18: d4fc6c7, dd7c5aa, 3799586 (compact plaque, summit-layout.ts); 09-20: 3a8f228, bcdb0fe, 8798b71 (3D framing measured from the plaque). Accepted residue in 09-UAT round 2: the phone summit crop, reduced motion at 375x667, and landscape phones
- **Files changed:** app/globals.css, components/home/AscentController.tsx, components/home/AscentHero.tsx, components/home/SummitDetails.tsx, components/home/SummitPlaque.tsx, components/home/__tests__/summit.test.tsx, components/home/terrain/CameraRig.tsx, components/home/terrain/route-curve.ts, lib/ascent/framing.ts, lib/ascent/route.ts, lib/ascent/summit-layout.ts, e2e/home-ascent.spec.ts, e2e/home-canvas.spec.ts
- **Why not caught:** plaque intersection was asserted only at three sizes, all clear, and no test checked the static poster at the summit
- **Recurrence guard:** e2e/home-ascent.spec.ts describe "Summit plaque clears the poster pins (G-09-2, static)"; e2e/home-canvas.spec.ts describe "summit pins clear the plaque"; components/home/__tests__/summit.test.tsx
---

## waypoint2-label-and-kicker — The waypoint-2 pin label hides behind its card at 768 px, and the 375 px kicker orphans "4"
- **Date:** 2026-11-06
- **Error patterns:** pin label under card, data-flip, flipPinLabels, kicker wraps, lone 4, leading dot, line break, glyph advance, G-09-3, G-09-4 N2
- **Root cause(s):** (a) the md card and the fixed poster pin UVs never consult each other, and the flip rule knew only the right obstacle; (b) the kicker and place line are plain strings, so greedy line breaking breaks at whichever space falls at the column edge
- **Fix:** 09-16: d307211, d4ed0b3 (`waypointKickerParts`, `data-kicker-part`); 09-19: 7ef7ea2, ce1b985, 68fd6d5 (`placePinLabel`); 09-21: 40c50f9, e8c85f8 (`waypointTarget`). Accepted residue: waypoint 3's label is hidden in the static poster at about 768-1090 px (D-09 amendment)
- **Files changed:** components/home/AltimeterRail.tsx, components/home/AscentController.tsx, components/home/AscentHero.tsx, components/home/PinMark.tsx, components/home/PosterSheet.tsx, components/home/WaypointCard.tsx, components/home/__tests__/waypoints.test.tsx, components/home/terrain/CameraRig.tsx, lib/ascent/framing.ts, lib/ascent/waypoints.ts, lib/__tests__/ascent-waypoints.test.ts, lib/__tests__/frame-budget-policy.test.ts, lib/__tests__/framing.test.ts, e2e/home-ascent.spec.ts, e2e/home-canvas.spec.ts
- **Why not caught:** no test intersected a lit label or pin head with the card box, and none read line breaks; the visual baselines showed both only as pixels
- **Recurrence guard:** e2e/home-ascent.spec.ts describes "Card line breaks (G-09-3 b, G-09-4 N2)" and "Lit poster label clears its card and the rail (G-09-3 a)"; e2e/home-canvas.spec.ts describe "md stages keep the lit 3D pin and its label clear of the card (G-09-3 a)"
---

## 12-slug-script-data — The requested slug of an unknown photo or project URL leaks into the 404's script data
- **Date:** 2026-11-06
- **Error patterns:** self.__next_f.push, flight row 0, "c", req.url, proxy rewrite, data-route, Speed Insights, slug echo, service worker, sec-fetch-dest, T-12-03
- **Root cause(s):** Next serializes the rendered request's URL into flight row 0 as "c", and a proxy rewrite never changes req.url; @vercel/speed-insights derives the route from the raw pathname on the root not-found, which has no params
- **Fix:** Phase 12: b32eb35, 67970b3, d9df0bf (proxy self-fetches a neutral 404; `components/SpeedInsightsRoute.tsx` sets the route); 261105-wty: 945a8c5, ce4c99c (www.tlui.de allowed for the neutral render). The Vercel preview itself was not checked; an agent's production probes passed
- **Files changed:** proxy.ts, components/SpeedInsightsRoute.tsx, app/layout.tsx, lib/__tests__/proxy.test.ts, e2e/not-found.spec.ts, data/site.ts, data/__tests__/site.test.ts
- **Why not caught:** the functional Playwright projects block service workers, so no e2e run saw the service-worker path
- **Recurrence guard:** e2e/not-found.spec.ts "no slug echo" tests and the describe "Unknown detail slugs with the service worker in control (T-12-03)"; lib/__tests__/proxy.test.ts. Localhost only: a failed self-fetch in production falls back silently
---

## e2e-test-ci-failures — E2E tests time out in CI against the Next.js dev server
- **Date:** 2026-11-06
- **Error patterns:** Process completed with exit code 1, waitForLoadState networkidle, timeout, HMR WebSocket, on-demand compilation, npm run dev, webServer
- **Root cause(s):** the Playwright webServer used the dev server, whose HMR connection stops networkidle from resolving and whose on-demand compilation exceeds test timeouts
- **Fix:** 241cbbf: production server in CI and no networkidle waits. The job first read success at 369130e, after 6470b58 and 369130e ("fix: skip webkit E2E tests in CI")
- **Files changed:** playwright.config.ts, e2e/homepage.spec.ts, e2e/contact-form.spec.ts, e2e/photos.spec.ts, e2e/projects.spec.ts
- **Why not caught:** no gate named in the session could catch it; the tests never worked reliably against the dev server, so failure was the job's standing state
- **Recurrence guard:** playwright.config.ts `prod` and the webServer command `npm run build && npm run start`, run by the `E2E Tests` job. No rule forbids `networkidle`
---

## eslint10-ci-failures — CI jobs fail after the bare ESLint 9 to 10 bump
- **Date:** 2026-11-06
- **Error patterns:** Cannot find package '@eslint/js', ERR_MODULE_NOT_FOUND, --ext, flat config, window.matchMedia is not a function, IntersectionObserver is not defined
- **Root cause(s):** ESLint 10 no longer bundles @eslint/js; the lint script relied on --ext while the config had no ts/tsx files patterns; jest.setup.js lacked jsdom mocks, a pre-existing gap
- **Fix:** superseded: b4e0cbb's ESLint 10 fix can no longer be checked on main, because 5deb55c took ESLint back to 9.x and e649f92 removed @eslint/js. Its jest.setup.js mocks remain
- **Files changed:** package.json, package-lock.json, eslint.config.mjs, jest.setup.js
- **Why not caught:** Dependabot did a bare version bump without migration, and local node_modules held ESLint 9.39.2 while the lockfile had 10.0.3
- **Recurrence guard:** the ESLint major ignore in .github/dependabot.yml
---

