---
schema_version: 1
wave: 6
outcome: could_not_look
reason: target_unreachable
checked: 0
passed: 0
failed: 0
needs_review: 1
---

# Phase 14 wave 1 (plan 14-01) live-DOM verification

Browser: claude-in-chrome (own tab, closed afterwards). chrome-devtools MCP was not exposed in this session.

What happened:
- The first navigation to `http://localhost:3000/roadmap` loaded. The service-worker cleanup ran on it: 1 registration unregistered and 3 caches deleted. Then the page reloaded.
- That reload, and a second navigation after it, landed on Chrome's network error page (`chrome-error://chromewebdata/`).
- No criterion was observed. None is marked failed.

Orchestrator follow-up (corrects the verifier's guess that the server crashed):
- The server never went down. Throughout, `curl` from the agent shell got 200 on `/roadmap`, and the process kept listening on 0.0.0.0:3000 and [::]:3000.
- Chrome couldn't reach the server on any loopback address: `localhost`, `127.0.0.1` and `[::1]` all gave "This site can't be reached". The same happened after the server was restarted outside the shell sandbox.
- The first load most likely came from an old service worker left over from a Phase 12 session, which served `/roadmap` from cache. Once it was unregistered, every request went to the network and failed.
- So the browser and the agent shell don't share loopback right now. Phases 11 and 12 reached `localhost:3000` from claude-in-chrome on 2026-11-03, so something has changed since then: a proxy, a VPN, Chrome policy or the sandbox.

Criteria not observed (all could_not_look / target_unreachable):
- SHELL-07 / D-16: a plain tap on 'Roadmap' on /roadmap (scrolled) closes the panel, focuses Menu, and leaves scrollY, the URL and the document unchanged. Covered by e2e/shell.spec.ts "tapping the current page's link closes the panel and keeps the scroll (SHELL-07, D-16)".
- SHELL-07: a Ctrl/Shift click on the current-page link leaves the panel open. Covered by Jest SHELL-07 rows.
- D-23: on /photos?view=grid, 'Photographs' navigates to /photos, and the panel ends closed with Menu focused. Covered by e2e/shell.spec.ts "on a view URL, Photographs still navigates to the plain page (D-23)".
- SHELL-08 / D-17: panel links get outline-offset -4px and width 2px, and the ring stays inside the panel client rect at the top and bottom rows at 375x812. Covered by e2e/shell.spec.ts "focused panel links draw an inset ring the panel never clips (SHELL-08, D-17)".
- SHELL-08: the ring is still contained at 375x320 while the panel scrolls. Covered by e2e/shell.spec.ts "the inset ring stays inside the panel while it scrolls at 375 x 320 (SHELL-08, D-17)".

To fix (for the operator): check why Chrome can't open `http://localhost:3000` while `next start` is running from the agent shell. Look at the proxy and VPN bypass for `<-loopback>` and at Chrome policy. Then re-run this verifier. Meanwhile, the e2e rows above cover every criterion in Chromium and Firefox (14-01 SUMMARY: shell.spec 74/74). The window size was restored to 1280x900. The service-worker registration and caches for localhost:3000 were already removed during the first load. No end-of-run cleanup was possible because the origin did not load.

## Wave 2 (plan 14-02): could_not_look / target_unreachable

The verifier wasn't dispatched. A pre-check showed Chrome can't reach any server this session starts. A bare Node `http` server on `localhost:3999` gave the same "This site can't be reached" page. Every 14-02 criterion stays unobserved and none failed:
- HOME-10 rail scrim contrast, at least 4.5:1 for every tick label on the poster and the live canvas: covered by B8 in `e2e/home-modes.spec.ts`, now 12 rows. Lowest values: 7.93:1 poster and 7.91:1 live in Chromium, 7.85:1 poster in Firefox.
- The scrim stays 224 px wide (CameraRig reads its width): covered by the 4 B8 geometry rows in Chromium and Firefox.
- HOME-09, no sideways scroll at 375 px in every mode and stop: covered by the extended 375 px guard (4 modes × 8 stops).

## Wave 3 (plan 14-03): could_not_look / target_unreachable

The verifier wasn't dispatched, for the same reason as wave 2: Chrome reaches no server this session starts. LBOX-08 is unobserved and nothing failed. After stepping and then closing by Escape, 'Close photo' or Back, focus lands on the shown photo's trigger, and the trigger plus its 4 px ring sit fully in view below the nav. This is covered by the D-11 matrix in `e2e/photos-lightbox.spec.ts`: 14 rows in Chromium and 1 in Firefox; the WebKit row runs in CI (14-08). The whole lightbox file passes 116/116 in Chromium and Firefox.

## Wave 4 (plan 14-04): could_not_look / target_unreachable

The verifier wasn't dispatched, for the same reason as wave 2. D-12 and D-22 are unobserved and nothing failed. Hiding labels collapses the open callout; a callout that can't be seen (zoomed, or labels hidden) doesn't take Escape; for a visible callout the order is still callout, then zoom, then close. Covered by the D-12 and D-22 Jest rows, the rewritten IN-02 and zoom-unwind rows, and 3 new D-12 Playwright rows. `e2e/photos-lightbox.spec.ts` passes 122/122 in Chromium and Firefox; WebKit runs in CI (14-08).

## Wave 5 (plan 14-05): could_not_look / target_unreachable

The verifier wasn't dispatched, for the same reason as wave 2. ENG-06 step controls are unobserved and nothing failed:
- Previous and Next sit around the dots.
- Pressing a step or a dot shows that command complete and turns on the sticky Pause.
- At the end stops the buttons are aria-disabled but still focusable, and they never wrap.
Covered by the 14-05 Jest rows (57 tests) and `e2e/case-study.spec.ts` (118 in Chromium and Firefox).

needs_review: in desktop Chromium at 375 px, the command bar wraps onto 2 rows, because the reserved scrollbar gutter leaves 299 px inside against the 304 px it needs. Phones and Firefox show 1 row. This goes to Tim before the 14-08 baseline.

## Wave 6 (plan 14-06): could_not_look / target_unreachable

The verifier wasn't dispatched, for the same reason as wave 2. The ENG-06 transcript is unobserved and nothing failed. It's a server-rendered `<details data-transcript>` under the terminal, closed by default, opened once under reduced motion, and it presses Pause when a visitor opens it. Covered by 65 Jest rows and 126/126 case-study e2e rows in Chromium and Firefox, including axe with the transcript present and the sitemap audit (no hydration mismatch on /projects/box).

## Wave 7 (plan 14-07): nothing_to_report / no_criteria

14-07 states no UI acceptance criteria. It writes the ledger back and runs the local gate. The gate's one fix is test-only: the E5 row in `e2e/photos-sweep.spec.ts` now expects the D-22 Escape order. On the tip, the 9 Phase 14 e2e files pass 592/592 in Chromium and Firefox.

## Wave 8 (plan 14-08): nothing_to_report / no_criteria

14-08 states no UI acceptance criteria. It proves the phase in CI and re-baselines the declared PNGs. Its UI evidence comes from CI, not a live DOM. On Tim's baseline commit `55160a4` (run 43600436335), E2E passed 1471 rows in Chromium, Firefox and WebKit, including the WebKit LBOX-08, SHELL-07, SHELL-08, B8 poster and 375 px rows, and Visual Regression passed 98/98 against the 12 re-baselined shots. Tim reviewed those shots before committing them.
