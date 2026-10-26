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

- A dev server that cold-compiled the intercepted route under parallel load stopped intercepting (found in 10-07)
  status: open
  **What:** after the first 10-07 run (chromium + firefox, 4 workers, `next dev` freshly started, the `@modal/(.)[slug]` route compiled during the run), every in-site click on a photo link became a document navigation to the full photo page: the 10-07 carousel cases and the existing `photos-lightbox.spec.ts` "a tile click opens the photo in a dialog over the grid" and "Escape closes through the router" cases all failed with no dialog. After a dev-server restart the same cases passed (lightbox 65/65 with no-webgl, carousel 20/20 with `--repeat-each=2`). The same run also hit the known 09 first-compile timeouts in `no-webgl.spec.ts` ("contact keeps the form", "project detail keeps its content"), which passed warm.
  **Not caused by 10-07:** the grid tiles, which 10-07 does not touch, lost interception the same way on the same server.
  **Next step:** likely the same dev-compile race as the 10-01 item. CI runs the production build; warm `/photos/{slug}` before the lightbox specs if it recurs locally.

- The dev server stopped intercepting again after in-place edits (found in 10-08)
  status: open
  **What:** twice in 10-08, after `next dev` had served the photos specs and then hot-reloaded edits to `app/(site)/photos/page.tsx` (once also with a concurrent `npm run build`), every in-site photo click became a document navigation: the map lightbox cases and the grid "clicking the first tile opens its photo in the lightbox" case failed with no dialog. A fresh dev server passed `e2e/photos.spec.ts` 41/41 (chromium + firefox), and the production build (`PW_PROD=1`) passed `e2e/photos.spec.ts e2e/shell.spec.ts` 107/107.
  **Not caused by 10-08:** the grid tile, which 10-08 does not touch, lost interception the same way.
  **Next step:** same as the 10-01 and 10-07 items; restart the dev server after editing the photos routes, or verify on the production build.

- Dev-server run reset the reduced-motion carousel stepper mid-test (found in 10-09)
  status: open
  **What:** with `next dev` and 2 workers, `photos-carousel.spec.ts` "the stepper shows one photo with the controls and never advances by itself" failed in Chromium twice (once in a lightbox + carousel run, once in 1 of 2 `--repeat-each=2` repeats): after Next stepped to 2 / 4, the six idle seconds ended on "1 / 4", so the stepper had remounted. A probe on the same dev server (4 runs) never reset, and the production build (`PW_PROD=1`) passed the case 4 of 4 in `photos-carousel.spec.ts` + `photos.spec.ts` (130/130) and again in the 238-case photo/shell/privacy/design run.
  **Not caused by 10-09:** the carousel's key does not change on that page and no view switch happens in the case; the reset matches the dev-server cross-talk items above (an HMR reload or compile from another worker).
  **Next step:** same as the 10-01, 10-06 and 10-07 items; verify on the production build, which CI uses.
