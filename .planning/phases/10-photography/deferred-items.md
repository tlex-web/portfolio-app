# Phase 10 deferred items

## Deferred Items

- Dev-server race on a cold `/photos/[slug]` (found in 10-01)
  status: open
  **What:** with `next dev --webpack` freshly started and 4 Playwright workers requesting different `/photos/{slug}` pages at once, one request can return HTTP 500 with `SyntaxError: Unexpected end of JSON input` (server log, `page: '/photos/gornerschlucht-waterfall'`). It happened once in three local runs.
  **Not affected:** the same specs pass with 1 or 2 workers on the dev server, and with 4 workers against the production build (`PW_PROD=1`, 37/37). CI uses the production build and 1 worker.
  **Next step:** if it recurs in later plans, reproduce it with a minimal dynamic route, to tell whether it is a Next 16.4 dev-compile issue or something in this route; warming the route before the run is a workaround.
