# Phase 10 deferred items

## Deferred Items

- Dev-server race on a cold `/photos/[slug]` (found in 10-01)
  status: open
  **What:** with `next dev --webpack` freshly started and 4 Playwright workers requesting different `/photos/{slug}` pages at once, one request can return HTTP 500 with `SyntaxError: Unexpected end of JSON input` (server log, `page: '/photos/gornerschlucht-waterfall'`). It happened once in three local runs.
  **Not affected:** the same specs pass with 1 or 2 workers on the dev server, and with 4 workers against the production build (`PW_PROD=1`, 37/37). CI uses the production build and 1 worker.
  **Next step:** if it recurs in later plans, reproduce it with a minimal dynamic route, to tell whether it is a Next 16.4 dev-compile issue or something in this route; warming the route before the run is a workaround.

- Local Playwright WebKit cannot load the site's scripts or CSS (found in 10-05)
  status: open
  **What:** `proxy.ts` sends a CSP with `upgrade-insecure-requests`. Playwright WebKit 27.2 on Windows applies it to `http://localhost:3000`, so every `/_next/static` request is upgraded to `https://localhost:3000` and fails with "SSL connect error". The page never hydrates and the `lb-*` CSS never applies. Every `e2e/photos-lightbox.spec.ts` case except the strip text check fails in WebKit, on the dev server and on the production build (`PW_PROD=1`), including the 10-01 and 10-03 cases. Chromium and Firefox exempt localhost from the upgrade.
  **Effect:** the plan's local `--project=webkit` check (flagged assumption A1, the Tab wrap in Safari) could not run. CI has no WebKit project.
  **Next step:** drop `upgrade-insecure-requests` for non-production or localhost requests in `proxy.ts` (a security-header change, so it needs its own decision), then rerun `npx playwright test e2e/photos-lightbox.spec.ts --project=webkit`. Tim's real-Safari UAT check stays in place.

- Dev-server cross-talk breaks the G3 scroll-lock case in a multi-spec run (found in 10-06)
  status: open
  **What:** with `next dev` freshly started, `npx playwright test e2e/photos-lightbox.spec.ts e2e/photos.spec.ts e2e/design-system.spec.ts --project=chromium --project=firefox --workers=2` fails one case: `design-system.spec.ts` "scroll lock keeps the header box" clicks a hydrated grid tile and gets a document navigation to the full photo page instead of the dialog. The same case passes alone (3/3) and in the same trio against the production build (`PW_PROD=1`, 190/190 with home-ascent).
  **Not caused by 10-06:** the pre-plan commit 171d4ee, run the same way in a temporary worktree, fails the same case (75 passed, 1 failed). CI uses the production build.
  **Next step:** likely an HMR reload or cold compile of the intercepted route from another worker landing during the click (G3 runs in its own Chromium). Reproduce with `--workers=1`; if it holds, warm `/photos/{slug}` before the case or move G3 to the production project.
