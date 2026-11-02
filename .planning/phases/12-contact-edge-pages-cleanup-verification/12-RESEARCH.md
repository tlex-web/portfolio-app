# Phase 12: Contact, Edge Pages, Cleanup & Verification - Research

**Researched:** 2026-11-02
**Domain:** Next.js 16.4 App Router (metadata, OG images, not-found, proxy), service worker, Playwright audit gates, dead-code removal
**Confidence:** HIGH for repo facts and Next 16.4 behaviour (local docs, Next source and a live probe of the production build); MEDIUM for the service-worker test design and WebKit-in-CI behaviour (they need a spike)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Carried forward (locked by ROADMAP scope notes and earlier phases, not re-asked)
- **`SummitRegister` is a restyle of `FeedbackForm`.**
  - Unchanged: the `/api/feedback` data path, the `validateOrigin` CSRF check and the Upstash `feedbackRateLimit`, which run first and in the same order. No Server Action (PITFALLS #26).
  - Kept: the accessible names `e2e/contact-form.spec.ts` asserts: labels Name, Email and Message, the button "Send Message", and a checkbox. The heading copy may change, and the spec's heading assertion is updated with it.
  - Added: the honeypot and the focusable error summary.
- **Service worker:** page navigations become network-first, covered by an update e2e test (EDGE-02). Playwright stays on `serviceWorkers: 'block'` except in that dedicated SW test.
- **Legacy image variants:** the `-thumb/-medium/-large` files and the manifest's `legacy` entries are deleted, but only behind an asset-exists Jest test. Phase 10 (10-09) already migrated every consumer, and a guard fails on any `.legacy` read.
- **v1 aliases:** the 29 `@deprecated v1 alias` lines in `app/globals.css` are removed. The white/black ratchet goes to 0 (`scripts/guards/palette-ratchet.json` holds only `components/Header.tsx: 1`). Then `@theme { --color-*: initial; }` is added as a compile-time backstop.
- **Dead files:** `components/Header.tsx`, `components/GlassmorphismNav.tsx`, `components/Footer.tsx` and `components/AnimatedGradientMesh.tsx` are deleted. Only Contact imports the mesh. `ParticleButton`, `hex-clip` and `useHexGrid` are already gone (Phase 11). The guard lists drain to empty:
  - `LEGACY_DEAD_FILES` and its exemptions (`scripts/guards/lib/legacy-dead-files.mjs`);
  - `LEGACY_COMPILER_FILES` in `eslint.config.*`, which per 07-02 must reach zero by Phase 12. That list still holds `lib/useProgressiveTextures.ts`, used by `components/photos/PhotoCarousel3D.tsx`, so it must become React-Compiler-clean.

  Guard self-tests are rewritten, never deleted.
- **CSP:** `https://raw.githubusercontent.com` is dropped from `connect-src`.
- **OG template:** one shared contour template serves photo and project pages (SEO-02). Photo and project routes already export `generateMetadata` (10, 11-01).
- **Playground routes:** the deleted routes resolve to the 404, with no redirects.
- **Investigate before EDGE-01 sign-off:** `notFound()` inside `/projects/[slug]` (check `/photos/[slug]` too) returns HTTP 404 with an empty `<html id="__next_error__">` server body. The shell renders only client-side.
- **Route-log data:** the Phase 11 completion date (2026-11-02) and the next `surveyedAt` go into Phase 12's first data edit, with Tim's confirmation (11-08 Q3).
- **Process and guard rules:**
  - Claude drafts all copy and Tim approves it at a copy checkpoint.
  - The UI work uses `ui-ux-pro-max`, and `/gsd-ui-phase 12` runs before planning.
  - Visual baselines come only from the CI `workflow_dispatch` run, and only Tim commits PNGs.
  - Tests are rewritten, never deleted. The ratchet baseline is 1749.
  - The palette guard applies: no `dark:` variants and no stock palette classes.
- **Docs:** PROJECT.md is updated. The PITFALLS "Looks Done But Isn't" checklist runs in the milestone audit, not here.

#### Summit register form (CONTACT-01..03)
- **D-01: The location is shown as Zürich, rounded to about 1 km (2 decimals).**
  - Shown in the site's mono coordinate style, roughly "47.37 N · 8.54 E · Zürich" or "47.38 N · 8.54 E · Zürich"; the second decimal depends on the reference point.
  - Research picks the reference point (e.g. the official city coordinates) from a cited source and records it. Tim confirms the figures at the copy checkpoint.
  - It is never more precise than 2 decimals. It replaces today's "Switzerland" card.
- **D-02: A failed email send is a recoverable error, never a confirmation.**
  - Today `app/api/feedback/route.ts` catches a `sendFeedbackEmail` failure and still returns 200. Instead, the API returns an error status with a machine-readable code.
  - The form then shows "Couldn't send. Your message is still here" (final copy at the checkpoint), keeps every field and offers Retry. "Register signed" therefore always means the email went out.
  - The origin check and rate limit stay ahead of this, unchanged.
  - Note for the planner: a failed send has already used up a rate-limit token. Research decides whether the 429 copy needs to account for that.
- **D-03: On success, a register entry replaces the form.** It shows:
  - the heading "Register signed";
  - the visitor's name with the local date and time;
  - "I'll reply to <their email>", echoing their own input client-side only;
  - a "Sign again" button that restores an empty form.

  The entry is a `role="status"` region, and focus moves to it. There is no summit-motif line.
- **D-04: Server logs keep metadata only.**
  - Each submission logs the event, timestamp, outcome (sent, email-failed, rate-limited, csrf-rejected, honeypot, validation-failed) and the IP, for abuse tracing.
  - Names, email addresses and message text are never logged. The email to Tim is unchanged.
  - The existing `[csrf]` and `[rate-limit]` warnings already follow this shape.

#### Contact page layout & copy
- **D-05: A form plus a details panel.**
  - From 1024 px, the register form sits on the left (wider) and a narrow "survey record" panel on the right holds:
    - the email (D-06);
    - the Zürich coordinates (D-01);
    - the reply time (D-08);
    - GitHub and LinkedIn from `data/site.ts`.
  - Below 1024 px the panel stacks **above** the form, so the email is visible without scrolling on phones.
  - `AnimatedGradientMesh` and the `motion` `whileInView` entrances are removed.
- **D-06: The email is selectable mono text, a Copy button and a `mailto:` link.**
  - Copy uses the Clipboard API and announces "Copied" politely (`aria-live="polite"`). Where the clipboard is unavailable, the control fails quietly and the text stays selectable.
  - The existing break after the "@" (`<wbr>` with `wrap-anywhere`) is kept.
- **D-07: The collaboration checkbox stays, with the same meaning.** `interestedInCollaboration` and the API schema and email template are unchanged. Only its label copy may be reworded to fit the page (copy checkpoint).
- **D-08: The reply-time line reads "Usually within a few days"**, replacing "24-48 hours". It is softened under the site's "sourced or softened" claim rule.

#### Edge pages (EDGE-01, EDGE-02)
- **D-09: The 404 art shows contours, a dashed trail and a "you are here" dot.**
  - A quiet `ContourField` of the Matterhorn sheet, with one dashed marked trail and a "you are here" dot clearly **off** it.
  - It is a static SVG with `aria-hidden`: zero JS, no motion, token colours only.
  - The same art and layout serve `error` and `global-error`. `global-error` keeps its static chrome and its own fonts and CSS.
- **D-10: The 404 headings.**
  - A mono kicker reads "Error 404 · Page not found".
  - The h1 is "You've left the marked trail".
  - One plain sentence says what happened. The Phase 7 behaviour is kept: no focus move, and the route announcer reads the title.
- **D-11: A missing photo or project gets a context link, without echoing the slug.**
  - The 404 design is the same everywhere.
  - A photo miss (`/photos/[slug]`) says something like "No photograph at this address" and leads to All photographs. A project miss leads to Engineering. Home stays the route home.
  - The URL slug is **never** rendered, so the page can't display visitor-controlled text.
- **D-12: The offline page uses the shell plus a list of the pages actually cached.**
  - It has the same shell, layout and contour art as the 404.
  - The service worker precaches what the page needs to render styled while offline (its CSS and fonts). Research decides how, given the content-hashed Next chunks.
  - It lists only the pages that are actually in Cache Storage, read on the client.
  - A "Try again" button reloads the page, and it also reloads by itself on the `online` event.
  - The stock icon SVG and the "Good news!" card go.

#### Share previews & domain (SEO-01..03)
- **D-13: The canonical base URL is a constant: `site.url = 'https://portfolio-app-mocha-three.vercel.app'` in `data/site.ts`.** That is the production URL on the GitHub repo homepage.
  - It feeds `metadataBase`, the canonicals, `sitemap.xml`, `robots.txt` and the OG image URLs.
  - It is deterministic in CI and in the visual baselines. A future custom domain is a one-line data edit plus a sitemap re-check.
  - The `Site` type and `guard:identity` cover the new field.
  - **Reversibility:** costly. Once the site is indexed and shared, a domain change needs a redirect or canonical migration on the old host.
- **D-14: A photo's OG image shows the photo plus a contour side panel.**
  - 1200×630: the photo on the left, from a manifest derivative (never an original, never more than 2560 px).
  - On the right, a contour panel holds the title, DEM altitude, place and "© {year} Tim Lui". The film scan shows "2019" and "approx." as in 10 D-07.
  - The photo's 3:2 aspect is kept inside its panel, so it is never cropped to 1.91:1.
- **D-15: A project's OG image shows the name, summary, SAC grade and profile glyph.**
  - The same template carries the project name, its one-line summary, the real SAC trail-grade badge (box T4, coin-flip T1, 11 D-07) and the build-time elevation-profile glyph from the route panel (11 D-05).
- **D-16: One site-wide default OG card.**
  - It uses the same template with "Tim Lui · Developer & photographer" and the summit coordinates. The coordinates come from data (as in 09 D-11), never hand-typed.
  - It is set once in the root metadata, so Home, `/photos`, `/projects`, `/roadmap` and `/contact` inherit it. No link previews blank.

#### WebKit & CSP (VERIFY-03)
- **D-17: `proxy.ts` leaves out `upgrade-insecure-requests` only for requests that arrived over plain HTTP.**
  - WebKit applies the directive to `http://localhost`, which breaks the local production build and is why CI skips WebKit (10-05).
  - On Vercel every request is HTTPS, so the production header is unchanged.
  - Research must confirm how the proxy sees the scheme on Vercel (`request.nextUrl.protocol`, `x-forwarded-proto`), so production can never lose the directive.
  - A unit test pins both header variants. A UAT step reads the real production response header.
  - **Reversibility:** reversible. One condition in `proxy.ts`.
- **D-18: WebKit becomes a permanent CI e2e project**, next to chromium and firefox in `.github/workflows/ci.yml`.
  - Tests that genuinely can't run in WebKit get a tag, like `@chromium-only`, with the reason recorded.
  - Research re-checks the `playwright.config.ts` note about Linux WebKit "known issues" against Playwright 1.64.
  - Expect a flake-triage period. A flake is fixed or tagged with a reason, never silently retried.
- **D-19: Tim checks real browsers by hand at UAT.** A short checklist covers:
  - real Safari (iOS and/or macOS) through nav, the Home ascent, the lightbox, View Transitions and the contact form;
  - the Firefox look of the footer contour band at 1 px (open from 08-13);
  - the keyboard run (D-22).

  Results are recorded in `12-UAT.md`.

#### Audit gates (VERIFY-02, VERIFY-04)
- **D-20: The audit is a permanent route-loop e2e spec on the production build, in CI.**
  - Routes: every route, plus one photo slug, one project slug, the 404 and `/offline`.
  - It asserts:
    - axe reports 0 violations;
    - CLS ≤ 0.1;
    - every internal link resolves;
    - no image is missing;
    - no CSP violation or console error occurs.
  - It reuses or extracts the route list from `e2e/shell.spec.ts`.
  - Its tests count toward the test-count ratchet.
- **D-21: axe scans each route's initial state and the key interactive states:**
  - the mobile menu open;
  - the lightbox open, with hotspots on and off;
  - each `/photos` view (Map, Grid, Carousel);
  - the contact form's error-summary and register-signed states;
  - the reduced-motion (static) Home.
- **D-22: The keyboard pass is automated e2e flows plus Tim's hands-on run at UAT.**
  - Playwright drives navigation, the photo map, the lightbox and the contact form using only Tab, Shift+Tab, Enter, Space, Escape and the arrow keys. The flows assert focus order, the lightbox focus trap and focus return.
  - Tim also does one hands-on keyboard run at UAT (D-19) to judge how visible focus is.

#### Carry-over backlog (Phase 12 owns all four groups)
- **D-23: Docs & dead code.**
  - Fix the README tree rows:
    - `app/page.tsx` "3D mountain hero" (09);
    - `components/HologramTerminal*.tsx` (11);
    - `components/RoadmapFilters.tsx` and the v1 `RoadmapItem` text (11);
    - the `README_CLIX*.md` rows (11).
  - Delete `components/Footer.tsx` (11).
  - The README pass sits with VERIFY-01.
- **D-24: UI-review fixes and spec deviations.** These are visual, so they fall into re-baseline round 1 (D-27).
  - From `11-UI-REVIEW.md`:
    - `components/projects/EndBlock.tsx:8` uses the banned `py-3`;
    - the native video controls in `components/projects/DemoClip.tsx` hide the coin-flip poster's HEADS label;
    - `components/projects/DemoTerminal.tsx` reserves a fixed-height body that stays mostly empty;
    - `components/roadmap/RouteLog.tsx:61` uses arbitrary `top-[39px] -left-[33px]` offsets.
  - From the Phase 9 deferred items:
    - the hero scrim switches at `lg:` instead of 768 px;
    - a small dark wedge sits at the bottom edge of the 1440 px summit frame;
    - the "2,760 m approx." rail tick measures 4.81:1, which needs a disposition.
  - The fix approach for each item is the UI-SPEC's or planner's call. Anything that changes approved copy or an approved asset (e.g. the 11-16 coin-flip poster) comes back to Tim at a checkpoint.
- **D-25: Hygiene & security.**
  - the `fflate` 0.8.2 advisory in the canvas chunk;
  - the R3F 9 `THREE.Clock` deprecation warning on every canvas mount, which also matters for the D-20 console check;
  - the canvas chunk holding the load event back by about 1.5 s on the HOME-08 profile;
  - Prettier drift in `e2e/home-canvas.spec.ts` and `lib/useAscentMode.ts`;
  - the four `delayHeightmap` e2e users that the production service worker bypasses.
- **D-26: Review rows & dev-server flakes.**
  - Every open info row in `11-REVIEW-DISPOSITION.md` (IN-01..IN-14) and the 08 leftovers (`08-REVIEW-DISPOSITION.md`: CR-01 stays deferred under D-12; IN-01, IN-03..IN-09) gets a recorded disposition: fixed, closed or deferred with a reason.
  - The dev-server-only e2e flakes in the 09, 10 and 11 `deferred-items.md` files are hardened (`test.slow()`, per-route timeouts or isolation) or closed with a reason. CI runs a production build with one worker and is unaffected today.
- **D-27: Re-baselines come in two to three batched rounds**, each with a written list of expected diffs; any diff outside the list is a regression.
  - Round 1 follows the backlog UI fixes and dead-code removal. Expected: box, coin-flip, roadmap and Home pages.
  - Round 2 follows the Contact, edge-page and SEO work.
  - Round 3 happens only if audit-gate fixes move pixels.

  The flow is the usual one: Claude dispatches the CI run and compares, Tim commits the PNGs. A plan that changes pixels outside its round's list stops for Tim.

### Claude's Discretion
- **Honeypot (CONTACT-03):**
  - a visually hidden field (`tabindex="-1"`, `autocomplete="off"`, kept out of the accessibility tree), added to the zod schema as optional;
  - checked **after** the unchanged origin and rate-limit checks;
  - a filled honeypot gets a success-shaped response without sending, logged as `honeypot` (D-04).
- **API error contract:** machine-readable codes for validation, 403, 429 (with `Retry-After`), email-failed and 5xx, so the form can show specific, recoverable messages (research FEATURES §CONTACT).
- **Validation timing:** per field on blur, then live once a field has shown an error. The error summary is built on submit and receives focus. The `zod` limits shown in the UI: message 10–2000 characters, with a counter that is announced politely near the limit.
- **Service-worker details:** how navigations go network-first, the precache of the offline page's CSS and fonts, the cut-over for pages open during a deploy (stale chunks, PITFALLS #17), and the update e2e.
- **SEO details:**
  - `/offline` is `noindex` and stays out of the sitemap;
  - `?view=` canonicalises to `/photos`;
  - an intercepted lightbox URL canonicalises to `/photos/[slug]`;
  - Twitter cards are `summary_large_image`;
  - the per-route descriptions are drafted for Tim's copy approval;
  - research decides whether Vercel previews need `noindex` beyond Vercel's default `X-Robots-Tag`.
- **OG rendering:** `next/og` or static generation at build, same-origin fonts in the renderer, and a contour SVG in the template. This is research's call within D-14..D-16. The images must be deterministic enough to test.
- **CSP review:** if research proves `'unsafe-eval'` in `script-src` is unused in production, the planner may remove it, with a test, and flag it at the plan checkpoint.
- **CLS method and link scope:**
  - CLS is measured in the lab with a PerformanceObserver at 375, 768 and 1440 px, scrolling included.
  - The link check covers internal `href`s and image sources only; external links are not fetched in CI.
- **Plan order and waves**, within D-27's re-baseline rounds.

### For the UI-SPEC (not decided here; now settled in 12-UI-SPEC.md, approved 2026-11-02)
- The Contact page background after the mesh: a plain surface or a quiet contour band.
- The final heading copy and the details-panel styling.
- The error page's secondary actions, e.g. a "Report it" link to `/contact`.
- How the dashed trail and "you are here" dot are drawn and placed at 375, 768 and 1440 px.
- The OG template layout grid.
- The fix approach for the HEADS label: move it into the figcaption, or re-crop the poster (needs Tim's approval if the approved poster changes).

### Deferred Ideas (OUT OF SCOPE)
- **"Ask about this photo" / `?ref=<photo-slug>` prefill:** still deferred (PROJECT.md Key Decisions, Pending). A "Report it" link from the error page may land on `/contact`, but there is no `?ref` prefill in this phase.
- **A custom domain:** if Tim connects one, it is a `site.url` edit plus a redirect or canonical plan for the Vercel URL (D-13).
- **Terminal step controls and static transcript (ENG-F1):** still deferred.
- **Purging the git history of the GPS-bearing originals (08 CR-01 / D-12):** stays deferred. Tim runs it separately if ever.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONTACT-01 | Dark "summit register" form with visible labels and field borders, Tim's email as selectable text, location as coordinates | §Contact: current page is `'use client'` (no metadata possible today); Zürich reference point 47.37444, 8.54111 (Wikipedia infobox) → `47.37 N · 8.54 E`; `formatLatLon` needs a `decimals` option |
| CONTACT-02 | Errors under each field and in a focusable summary; input kept; progress, then "register signed" or recoverable error | §API error contract (codes, `Retry-After` from Upstash `reset`), D-02 send-failure change, e2e success path must mock `/api/feedback` because CI's dummy Resend key will now return `send-failed` |
| CONTACT-03 | Honeypot blocks simple bots; CSRF and rate limiting unchanged | §Honeypot placement after `validateOrigin` + `feedbackRateLimit.limit`; log shape (D-04); Playwright strict-mode label collisions |
| EDGE-01 | 404 "You've left the marked trail" with contour art and route home; error and global-error in the same shell | **Reproduced the empty `__next_error__` server body** and traced it to Next 16.4's error-recovery path; fix = proxy rewrite of unknown photo/project slugs to an unmatched path (server-rendered root not-found, 404) with a section header for the D-11 context link |
| EDGE-02 | Offline page in the design system; SW navigations network-first so no stale v1 pages after deploy | §Service worker: network-first navigation handler, install-time scrape of `/offline`'s `/_next/static/` URLs + `Link` font preloads, RSC bypass, Chromium-only SW e2e using `context.route` |
| SEO-01 | Every route has its own title, description, canonical | §Metadata audit (live probe: `/contact`, `/offline` have the default title; every route except `/` and project/photo slugs has the root description; canonicals are relative today); per-route `alternates.canonical` (never at the root: it is inherited) |
| SEO-02 | Every photo and project page has its own OG image | §OG: `opengraph-image.tsx` in each `[slug]` segment with its own `generateStaticParams` (re-exported by the metadata-route loader) + root `app/opengraph-image.tsx`; Satori needs TTF/OTF/WOFF static fonts; pages must not set `openGraph` objects (they replace inherited images) |
| SEO-03 | Generated `sitemap.xml` and `robots.txt` | §`app/sitemap.ts` + `app/robots.ts` from `site.nav`, `photoSlugs`, `projects`; both 404 today |
| VERIFY-01 | Dead code removed | §Dead-code reach table: also `components/ContourBackground.tsx` (only GlassmorphismNav imports it) and the whole "Phase 4: Crystalline Design System" CSS block; legacy images = all 60 files in `public/images/optimized/`; `photos:derive --check` couples files and manifest; `useProgressiveTextures` has 3 React-Compiler errors |
| VERIFY-02 | axe zero violations on every route; keyboard-only pass | §Audit spec design; existing axe pattern only runs `color-contrast`; keyboard flows |
| VERIFY-03 | Chromium, Firefox, WebKit pass incl. View Transitions and WebGL fallbacks | §WebKit: D-17 condition design (loopback host + http); add `grepInvert: /@chromium-only/` to WebKit; `no-webgl.spec.ts` "contact keeps the form" will hang once the mesh is gone |
| VERIFY-04 | No CLS > 0.1, broken internal links, missing images or CSP console errors | §Audit spec: `securitypolicyviolation` listener (cross-engine), CLS observer (Chromium-only API), response listener for images ≥ 400, Vercel-analytics 404 allow-list under `next start` |
</phase_requirements>

## Project Constraints (from AGENTS.md, CLAUDE.md and memory)

There is no `./CLAUDE.md`; `./AGENTS.md` is the project instruction file. Directives the planner must honour:

| Source | Directive |
|--------|-----------|
| AGENTS.md | "This is NOT the Next.js you know." Read the relevant guide in `node_modules/next/dist/docs/` before writing Next code; heed deprecation notices. Every Next API in this file cites those docs (Next 16.4.2 installed). |
| AGENTS.md | The block is re-added by `next dev`; commit it unchanged if it reappears. |
| Global CLAUDE.md | Present options as comparison tables; diagnose root cause before fix; **flag regression risks explicitly before modifying working code**; lead with working code examples. |
| Memory | `ui-ux-pro-max` is required for all UI/UX work (loaded this session; guidance in §UI guidance). |
| Memory | Visual baselines: Claude dispatches the CI `workflow_dispatch` run and compares; **Tim commits PNGs**; threshold 0.01; never touch settings files. |
| Memory | Standing approval covers pushes to `ci/…` branches only; no force pushes, no phase/main pushes, no PNG commits. |
| Memory | Never tell a subagent "Tim approved X" without his literal reply. |
| Memory | Live-DOM UAT runs via a scratchpad Playwright script (msedge channel for H.264; WebKit on localhost needs CSP stripped until D-17 lands; kill orphan `next start`). |
| CONTEXT | coin-flip is private while `.planning` is public: OG text and metadata about coin-flip use only approved strings, no defect IDs or internals (11 D-23). |
| CONTEXT | Tests are rewritten, never deleted; ratchet baseline 1749 (`scripts/guards/test-count.baseline.json`). |

## Summary

Most of Phase 12 is grounded in code that already exists: the feedback API, `ContourField`, the Phase 7 edge bodies, the service worker's three strategy helpers, the axe pin and a route list in `e2e/shell.spec.ts`. The research found five things that change the plan rather than just inform it.

1. **The `notFound()` empty server body is a Next 16.4 error-recovery path, not a bug in this repo's not-found files.** I reproduced it on the current production build: `/projects/no-such-slug` and `/photos/no-such-slug` return 404 with `<html id="__next_error__">`, no `<main>`, no h1 and the *root* title. The RSC payload does contain the (site) not-found boundary, but React SSR has no error boundaries, so the `NEXT_HTTP_ERROR_FALLBACK;404` thrown by the page reaches the Fizz shell and Next falls back to the empty error shell (`node_modules/next/dist/server/app-render/app-render.js:1320-1327`). `dynamicParams = false` cannot help: the root layout's `await headers()` makes every page dynamic, so `.next/prerender-manifest.json` has no `dynamicRoutes` and the no-fallback 404 path never runs. Unmatched URLs work because Next renders the `/_not-found` entry directly. **Fix: in `proxy.ts`, rewrite `/photos/<unknown>` and `/projects/<unknown>` to an unmatched path** (the doc-endorsed "request-time check can run in Proxy before the page renders", `04-functions/not-found.md:195`), passing the section in a request header so the root not-found can show the D-11 context link without reading the slug.
2. **Metadata merging will silently drop OG images and corrupt canonicals if done naively.** Next merges metadata shallowly: a page that sets `openGraph: {...}` replaces the inherited object, including the root default image (`node_modules/next/dist/lib/metadata/metadata-resolution-primitives.js:145-147`), and a canonical set at the root is inherited by every page. Next already fills `og:title`/`og:description` from `title`/`description` (`:430-432`) and Twitter images from OG images (`:410`), so pages should set only `title`, `description` and `alternates.canonical`.
3. **The CI functional projects run with the production service worker active** (only the visual and perf projects set `serviceWorkers: 'block'`). That is why the four `delayHeightmap` tests hold nothing, and it would make a network-first change interact with every functional test. Setting `serviceWorkers: 'block'` on chromium, firefox and webkit closes D-25's item and matches the locked "Playwright stays on block" rule. The one SW spec opts back in.
4. **Dead-code reach is wider than the locked list.** `components/ContourBackground.tsx` is imported only by `GlassmorphismNav`. The whole "Phase 4: Crystalline Design System" CSS block (`.ambient-glow`, `.glow-*`, `.stratum-*`, `contour-drift`/`.contour-animate`, `app/globals.css:480-560`) and the `--text-shadow-glow*` tokens are used only by the dead files and reference the v1 glow aliases. "Legacy image variants" means all 60 files in `public/images/optimized/`, and `npm run lint` → `data:check` → `photos:derive --check` fails if the files go before the manifest's `legacy` field and the generator's `legacyOf()`.
5. **Tailwind's `--color-*: initial` clears every colour defined before it, user tokens included** (`node_modules/tailwindcss/dist/lib.js`, `clearNamespace`). The backstop must sit *above* the L2 `@theme inline` block, not appended at the end of `globals.css`.

**Primary recommendation:** sequence the phase as (a) guardrail and test-infra prep (SW block on functional projects, proxy rewrite spike, WebKit CSP condition), (b) dead code and backlog fixes → re-baseline round 1, (c) Contact, edge pages, SW, SEO and OG → round 2, (d) the permanent audit spec and WebKit CI → round 3 only if needed. Add no new npm dependency: `next/og`, `MetadataRoute`, `@axe-core/playwright` 4.13.0 and the existing Jest/Playwright stack cover everything. The OG fonts are committed static font files.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Contact form state machine, blur validation, error summary, counter, Copy button | Browser / Client (`SummitRegister`, `CopyEmailButton` islands) | — | Interaction state; the page itself becomes a Server Component |
| CSRF, rate limit, honeypot, zod validation, email send, metadata-only logs | API / Backend (`app/api/feedback/route.ts`) | — | Security checks must not move client-side or into a Server Action (PITFALLS #26) |
| 404 status + server-rendered 404 for unknown slugs | Frontend Server (`proxy.ts` rewrite → root `app/not-found.tsx`) | — | Only the proxy runs before render; page-level `notFound()` cannot SSR (finding 1) |
| CSP header, nonce, `upgrade-insecure-requests` condition | Frontend Server (`proxy.ts`) | — | Per-request header; D-17 |
| Error / global-error UI | Browser / Client (`error.tsx`/`global-error.tsx` must be client) | Frontend Server renders `EdgeLayout` markup | Next requires error boundaries to be client components |
| Offline fallback, navigation caching, precache | Browser (service worker) | CDN/Static (`public/service-worker.js`, postbuild injection) | Runs in the SW global; injected at build |
| Saved-pages list | Browser / Client (`SavedPages` reads Cache Storage) | — | Only the client can read Cache Storage |
| Per-route metadata, canonical, sitemap, robots | Frontend Server (metadata API, metadata routes) | — | Resolved on the server into the first HTML |
| OG images | Frontend Server at build time (static metadata image routes) | CDN/Static (prerendered PNGs) | `generateStaticParams` makes them static; data read from disk |
| Audit gates (axe, CLS, links, images, CSP) | Test tier (Playwright on the production build) | CI (`ci.yml`) | Lab measurement, not runtime code |

## Standard Stack

### Core (all already installed; versions read from `node_modules/*/package.json` this session)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.4.2 (16.4.4 published) | Metadata API, `opengraph-image`, `sitemap.ts`, `robots.ts`, `next/og` `ImageResponse`, proxy | `[VERIFIED: node -p require('next/package.json').version]`; every API cited from `node_modules/next/dist/docs/` |
| next/og (`ImageResponse`) | bundled with next | Satori + Resvg PNG rendering for OG cards | `[CITED: 03-api-reference/04-functions/image-response.md]` flexbox only, TTF/OTF/WOFF only, "Maximum bundle size of `500KB`" |
| @playwright/test | 1.64.0 (1.64.1 published) | e2e incl. WebKit 27.2 (rev 2370 installed locally) | `[VERIFIED: npx playwright --version; playwright-core/browsers.json]` |
| @axe-core/playwright | 4.13.0 exact pin (4.14.0 published) | axe in Playwright | Keep the pin; 07-24 deduped axe-core to 4.13.0 under jsx-a11y |
| jest + jsdom | 30.4 | Unit tests (API, SW, formatters, OG element trees) | Existing |
| zod | 4.4.3 installed; **advisory GHSA-mrhx-c7xc-m3w5 (high), fixed in ≥ 4.6.6** | API input schema | `[VERIFIED: npm audit --json]`. The advisory concerns oversized constrained collections; the feedback schema has none, so practical exposure is low, but it is a runtime dependency on the contact path |

### Supporting
| Asset / tool | Purpose | When to Use |
|--------------|---------|-------------|
| Static font files (Schibsted Grotesk 600, Inter 400, JetBrains Mono 400; Latin; TTF/OTF or WOFF, **not** woff2, **not** variable) | OG renderer fonts | Commit under e.g. `lib/og/fonts/` with the OFL licence text; read with `readFile(join(process.cwd(), …))` at module scope `[CITED: image-response.md "Custom fonts"]` |
| `data/generated/tokens.ts` `hex` | OG colours | Already exports `night950`, `night900`, `firn50`, `mist300`, `glacier400` `[VERIFIED: data/generated/tokens.ts:3-10]`; UI-SPEC adds `night700` and the trail hexes via `build-tokens.mjs` |
| `public/terrain/contours-hero.2f3a04accc.svg` (45,632 B) | OG and edge-art contours | `[VERIFIED: ls -la]` |
| Photo 1200-px JPEG derivatives (79–203 KB) | OG photo slot | `[VERIFIED: ls -la public/images/photos/*-1200.*.jpg]`; manifest field `jpeg` `[VERIFIED: data/schemas/image-manifest.ts:66-75]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `opengraph-image.tsx` file convention | A route handler `app/og/[kind]/[slug]/route.tsx` + `openGraph.images` in `generateMetadata` | Route handler gives full URL control, but pages would then set `openGraph`, which replaces inherited fields (finding 2). The file convention is merged per segment without touching the page's metadata `[VERIFIED: metadata-resolution-primitives.js:113-122]` |
| Committed font files | `@fontsource/*` packages (WOFF in `node_modules`) | Adds three dependencies plus legitimacy gates; committed files are the UI-SPEC's choice ("read from disk") |
| Proxy rewrite for unknown slugs | Wrap page content in `<Suspense>` so `notFound()` streams | Status becomes **200** + noindex `[CITED: 04-functions/not-found.md:193]`, which violates EDGE-01's HTTP 404 |
| Proxy rewrite | `experimental.globalNotFound` (`global-not-found.js`) | Only handles unmatched URLs, not `notFound()` `[CITED: 03-file-conventions/not-found.md:49-60]` |
| Hand-written SW changes | Serwist (named in `02-guides/progressive-web-apps.md:674`) | A new build integration and dependency for three small changes; the existing SW already has `networkFirst` |
| `experimental.useOffline` + `useOffline()` | — | Experimental; covers soft navigations only, and "a full page reload while offline still fails" without a service worker `[CITED: 02-guides/offline-support.md:139]`. Not recommended |

**Installation:** none. Optional dependency bumps (D-25), each behind a checkpoint:
```bash
npm install zod@^4.6.7        # runtime; advisory fix (seam verdict SUS: "too-new", see audit)
# fflate 0.8.3 via package.json "overrides": { "fflate": "0.8.3" } then npm install; three-stdlib pins 0.6.10 separately
```

## Package Legitimacy Audit

No new package is introduced. The audit covers the two version bumps D-25 may make.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| zod (bump 4.4.3 → ≥ 4.6.6) | npm | 4.6.7 published 2026-10-12 | ~443M/wk | github.com/colinhacks/zod | [SUS] reason "too-new" (the release, not the package) | Flagged: planner adds `checkpoint:human-verify` before the bump |
| fflate (override → 0.8.3) | npm | 0.8.3 published 2026-05-16 | ~142M/wk | github.com/101arrowz/fflate | [OK] | Approved; postinstall: none |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** zod (only because 4.6.7 is three weeks old; the package itself is long-established)

## Architecture Patterns

### System Architecture Diagram

```
                     Browser request (document / RSC / asset / POST)
                                   │
              ┌────────────────────┼─────────────────────────────┐
              │ Service worker (production only, after first load)│
              │  GET /api/*  ─────────────── bypass ─────────────▶│
              │  Range / video / audio ───── bypass ─────────────▶│
              │  RSC (?_rsc / RSC:1) ─────── bypass (new) ───────▶│
              │  /_next/static, /images, /terrain, fonts ─ cache-first
              │  navigate ── NETWORK-FIRST (new) ─┬─ ok → cache + return
              │                                   └─ offline → cached page → else cached /offline
              └────────────────────┬─────────────────────────────┘
                                   ▼
              proxy.ts (Node runtime; every page path by matcher)
               ├─ nonce + CSP (upgrade-insecure-requests unless http://loopback; no unsafe-eval in prod)
               ├─ /photos/<seg> or /projects/<seg> with unknown seg
               │     → rewrite to unmatched path, x-edge-section: photos|projects
               └─ otherwise NextResponse.next
                                   ▼
              App Router render (root layout awaits headers() → dynamic)
               ├─ (site) pages → SiteChrome + page + per-route metadata (title, description, canonical)
               ├─ unmatched → app/not-found.tsx (SSR, 404) → EdgeLayout + NotFoundBody(context from header)
               ├─ (site)/error.tsx, global-error.tsx → ErrorBody → EdgeLayout
               └─ metadata routes (no layout): sitemap.xml, robots.txt, opengraph-image PNGs (static)
                                   ▼
              POST /api/feedback: validateOrigin → feedbackRateLimit → JSON parse/zod
                 → honeypot? 200 {code:'ok'} (no send) → sendFeedbackEmail → 200 | 502 send-failed
```

### Recommended Project Structure (new and changed files)
```
app/
├── layout.tsx                    # + metadataBase, openGraph {type, siteName}, twitter {card}
├── opengraph-image.tsx           # default card (D-16)
├── sitemap.ts, robots.ts         # SEO-03
├── not-found.tsx                 # async; reads x-edge-section → NotFoundBody context
├── global-error.tsx              # EdgeLayout via ErrorBody
├── (site)/contact/page.tsx       # Server Component + metadata
├── (site)/offline/page.tsx       # Server Component + robots noindex; SavedPages island
├── (site)/photos/[slug]/opengraph-image.tsx    # + generateStaticParams
└── (site)/projects/[slug]/opengraph-image.tsx  # + generateStaticParams
components/
├── contact/SummitRegister.tsx, CopyEmailButton.tsx
├── site/EdgeLayout.tsx, EdgeArt.tsx, SavedPages.tsx (NotFoundBody/ErrorBody updated)
lib/
├── og/template.tsx, og/fonts/*   # shared OG template + committed fonts
├── metadata.ts                   # pageMetadata({title, description, path})
├── edge-art.ts                   # trail/dot constants (unit-tested)
└── contact/api-contract.ts       # codes shared by route and form
e2e/
├── routes.ts                     # extracted route list (shell + audit)
├── audit.spec.ts                 # D-20/D-21 route loop
├── keyboard.spec.ts              # D-22 flows
└── service-worker.spec.ts        # EDGE-02, @chromium-only, serviceWorkers: 'allow'
```

### Pattern 1: Proxy rewrite for unknown slugs + D-17 CSP condition
**What:** decide unknown slugs before render; strip `upgrade-insecure-requests` only on plain-HTTP loopback.
**When to use:** every page request (existing matcher). Only exactly two-segment paths are checked, so `/photos/<slug>/opengraph-image…` passes through.
```ts
// proxy.ts (sketch; spike first, see Assumption A1)
import { NextRequest, NextResponse } from 'next/server';
import { photoSlugs } from '@/lib/photos/view-model';
import { projects } from '@/data/projects';

const KNOWN = {
  photos: new Set(photoSlugs),
  projects: new Set(projects.map((p) => p.slug)),
} as const;
const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);

export function buildCsp(nonce: string, url: URL, isDev: boolean) {
  // D-17: drop the directive only for http on a loopback host, so a spoofed
  // x-forwarded-proto on a public host can never remove it in production.
  const localHttp = url.protocol === 'http:' && LOOPBACK.has(url.hostname);
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'none'", "object-src 'none'", "base-uri 'self'",
    "form-action 'self'", "frame-ancestors 'none'",
    ...(localHttp ? [] : ['upgrade-insecure-requests']),
  ].join('; ') + ';';
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce, request.nextUrl, process.env.NODE_ENV === 'development');
  const headers = new Headers(request.headers);
  headers.delete('x-edge-section');               // never trust a client-sent value
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);

  const m = /^\/(photos|projects)\/([^/]+)$/.exec(request.nextUrl.pathname);
  let response: NextResponse;
  if (m && !KNOWN[m[1] as keyof typeof KNOWN].has(m[2])) {
    headers.set('x-edge-section', m[1]);
    response = NextResponse.rewrite(new URL('/__missing', request.url), { request: { headers } });
  } else {
    response = NextResponse.next({ request: { headers } });
  }
  response.headers.set('Content-Security-Policy', csp);
  return response;
}
```
Sources: `[CITED: 03-file-conventions/proxy.md:21,255,320-325,476]` (pass data by headers/rewrites; Node runtime default; `NextResponse.rewrite`; RSC headers propagate on rewrite), `[CITED: 02-guides/content-security-policy.md:42]` ("`unsafe-eval` is not required for production"), `[CITED: vercel.com/docs/headers/request-headers]` (`x-forwarded-proto` "typically `https` in production and `http` in development").

The root not-found becomes `async` and reads `(await headers()).get('x-edge-section')`, validated against `'photos' | 'projects'` (`[CITED: 03-file-conventions/not-found.md:141-160]`, async not-found reading `headers()`). The slug never reaches the component. Keep `app/(site)/not-found.tsx` for any other `notFound()` call, rendering the same body (generic context).

### Pattern 2: Per-route metadata without breaking inheritance
```ts
// lib/metadata.ts
import type { Metadata } from 'next';
export function pageMetadata(o: { title?: string; description: string; path: string }): Metadata {
  return {
    ...(o.title ? { title: o.title } : {}),
    description: o.description,
    alternates: { canonical: o.path },   // relative; resolved against metadataBase
    // Do NOT set openGraph/twitter here: a child openGraph object replaces the
    // inherited one, file-based images included. Next copies title/description
    // into og:/twitter: itself.
  };
}
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: 'Tim Lui · Developer & photographer', template: '%s · Tim Lui' },
  description: '…',
  openGraph: { type: 'website', siteName: site.name, locale: 'en_GB' },
  twitter: { card: 'summary_large_image' },
  // no alternates.canonical here: it would be inherited by every route
};
```
`[CITED: 04-functions/generate-metadata.md:391-429 (metadataBase), 1344-1437 (shallow merge)]`, `[VERIFIED: node_modules/next/dist/lib/metadata/metadata-resolution-primitives.js:113-122 (file images merged only when the same level sets no openGraph.images), :145-147 (child openGraph replaces), :410 (twitter images from openGraph), :430-432 (og title/description from metadata)]`.

Canonical rules: `/photos?view=grid` keeps `canonical: '/photos'` (set by the page, query ignored). The intercepted lightbox already returns `canonical: '/photos/${slug}'` from `photoMetadata` `[VERIFIED: lib/photos/view-model.ts:382-390]`; today it renders as a *relative* `href="/photos/matterhorn-from-zermatt"` because there is no `metadataBase` (live probe). `/offline`: `robots: { index: false }`. The 404 gets `noindex` automatically `[CITED: 03-file-conventions/not-found.md:15,189]`.

### Pattern 3: Static OG image per slug
```tsx
// app/(site)/photos/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { photoBySlug, photoSlugs } from '@/lib/photos/view-model';
import { OgFrame, ogFonts } from '@/lib/og/template';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamicParams = false;
export function generateStaticParams() {
  return photoSlugs.map((slug) => ({ slug }));
}
// Per-photo alt: use generateImageMetadata (alt per item) instead of a static `alt` export.
export function generateImageMetadata({ params }: { params: { slug: string } }) {
  const v = photoBySlug(params.slug);
  return v ? [{ id: 'card', alt: `${v.title}, a photograph by Tim Lui. …`, size, contentType }] : [];
}
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const view = photoBySlug((await params).slug)!;
  const jpeg = await readFile(join(process.cwd(), 'public', view.ogJpegSrc)); // manifest `jpeg.src`
  return new ImageResponse(<OgFrame variant="photo" view={view} photo={jpeg} />, { ...size, fonts: await ogFonts() });
}
```
- The metadata-route loader re-exports the file's other named exports, so the file's own `generateStaticParams` makes the route static. With `generateImageMetadata` the loader *generates* a `generateStaticParams` over `__metadata_id__` and returns 404 for unknown ids `[VERIFIED: node_modules/next/dist/build/webpack/loaders/next-metadata-route-loader.js:139-190]`. The build uses Turbopack, whose Rust loader is assumed to match (A3). **Verify in the build output that every OG route is prerendered (●/○), not ƒ.**
- `generateImageMetadata` receives `params` as a plain object, while the image function receives a Promise `[CITED: 04-functions/generate-image-metadata.md; opengraph-image.md:220-240]`.
- Satori accepts JPEG/PNG data; pass the manifest's 1200-px JPEG (EXIF-free, ≤ 2560 px) as an `ArrayBuffer`/base64 `[CITED: opengraph-image.md:212-290]`. The contour SVG goes in as a `data:image/svg+xml` `<img>`.
- Size budget: the largest JPEG (203 KB) + SVG (46 KB) + three font files stays near the 500 KB ceiling, which applies to edge bundles. These routes run in Node at build and read from disk, so the ceiling should not bind (A4). Keep fonts Latin-only static instances.
- Proxy note: OG paths have three segments, so Pattern 1's slug check never rewrites them.

### Pattern 4: sitemap and robots
```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  return [
    ...site.nav.map((n) => ({ url: `${base}${n.href === '/' ? '' : n.href}` })),
    ...photoSlugs.map((s) => ({ url: `${base}/photos/${s}` })),
    ...projects.map((p) => ({ url: `${base}/projects/${p.slug}` })),
  ]; // no /offline; omit lastModified unless sourced (a build-time new Date() makes output non-deterministic)
}
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' , disallow: ['/api/', '/offline'] }, sitemap: `${site.url}/sitemap.xml` };
}
```
`[CITED: 03-file-conventions/01-metadata/sitemap.md, robots.md]`. Both are cached route handlers by default. Both return 404 today (live probe). Vercel previews already send `X-Robots-Tag: noindex`, and with no custom domain no extra preview handling is needed `[CITED: vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines]`; the absolute production canonical also points previews home.

### Pattern 5: Service worker navigation (network-first) and offline precache
```js
// public/service-worker.js (changes only)
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic' && !response.redirected) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response; // 404/500 pass through, never cached
  } catch {
    return (await caches.match(request)) || (await caches.match('/offline')) ||
      new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

// install: cache /offline AND every same-origin static URL it needs
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const res = await fetch('/offline', { cache: 'no-store' });
    const html = await res.clone().text();
    await cache.put('/offline', res);
    const fromHtml = [...html.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]);
    const fromLink = [...(res.headers.get('link') || '').matchAll(/<(\/_next\/static\/media\/[^>]+)>/g)].map((m) => m[1]);
    await cache.addAll([...new Set(['/', ...PRECACHE, ...fromHtml, ...fromLink])]);
  })());
  self.skipWaiting();
});

// fetch: let RSC requests go to the network (no stale RSC, no junk in Cache Storage)
if (url.searchParams.has('_rsc') || request.headers.get('RSC') === '1') return;
```
Grounding: on the current build `/offline` references 2 CSS + 11 JS files under `/_next/static/`, and the woff2 preloads arrive in the HTTP `Link` header, not in the HTML (live probe of headers and `grep`). Every navigation response carries `Vary: rsc, next-router-state-tree, …` and `Cache-Control: private, no-cache, no-store` (probe), so network-first always reaches the server. The cached `/offline` response keeps its own CSP header and matching nonces, so it is self-consistent offline.

**Cut-over for pages open during a deploy (PITFALLS #17):** the visitor's *current* SW (production `main`, stale-while-revalidate) handles the first navigation after this deploy. That one view can be stale, and no code in the new SW can prevent it. After `skipWaiting` + `clients.claim` the new SW serves every later navigation network-first. A soft navigation from a stale page fetches RSC from the new deployment, and Next's build-id check should turn it into a hard navigation (A6). Recommended extra: in `ServiceWorkerRegistration`, on `controllerchange` when a controller existed at load (an update, not the first install), reload once, guarded by a `sessionStorage` key, and skip the reload while a form field is dirty. Vercel Skew Protection would also pin chunks, but it is Pro/Enterprise only `[CITED: vercel.com/docs/skew-protection]`. Tim's plan is unknown (open question 3). Also add `Cache-Control: no-cache` for `/service-worker.js` in `next.config.ts` (served today as `public, max-age=0`, probe) `[CITED: 02-guides/progressive-web-apps.md:636-665]`.

### Pattern 6: Feedback API contract with honeypot and metadata-only logs
```ts
// order is unchanged: ip → validateOrigin → feedbackRateLimit.limit → body → zod → honeypot → send
const { success, reset } = await feedbackRateLimit.limit(ip);
if (!success) {
  const retryAfterS = Math.max(1, Math.ceil((reset - Date.now()) / 1000)); // Upstash reset = ms epoch; dev mock returns reset: 0 → clamp
  log('rate-limited', ip);
  return NextResponse.json({ code: 'rate-limited', retryAfterS }, { status: 429, headers: { 'Retry-After': String(retryAfterS) } });
}
// …parse with safeParse; on failure → 400 { code: 'validation', fields: { name?: 'too_small', … } } (no echo of values)
if (data.trail_note) { log('honeypot', ip); return NextResponse.json({ code: 'ok' }, { status: 200 }); }
try { await sendFeedbackEmail({...}); } catch { log('email-failed', ip); return NextResponse.json({ code: 'send-failed' }, { status: 502 }); }
log('sent', ip); return NextResponse.json({ code: 'ok' }, { status: 200 });
// log(): console.info('[feedback]', { event: 'feedback', outcome, ip, timestamp }) — never name/email/message
```
Facts this rests on: the current route logs name, email and message in full (`console.log('Feedback received:', {name, email, message, …})`, `app/api/feedback/route.ts:61-68`), which D-04 removes. It swallows send errors and returns 200 (`:71-87`). `feedbackRateLimit` returns `{ success, limit, remaining, reset }`, and the dev fallback returns `reset: 0` `[VERIFIED: lib/rate-limit.ts:12-17,47]`. `lib/email.ts` also logs the Resend error object (`console.error('Failed to send email via Resend:', error)`, `:56`). Check it cannot include the payload, or reduce it to the error name. Keep `request.json()` inside try/catch: a malformed body becomes `validation` (400), not 500.

**429 copy:** a failed send spends a token (the limit runs before the send), so "attempts", as the UI-SPEC already chose, is correct. Five attempts per hour per IP `[VERIFIED: lib/rate-limit.ts:30 slidingWindow(5, '1 h')]`.

### Pattern 7: Route-loop audit spec (D-20/D-21)
```ts
// e2e/audit.spec.ts (sketch)
test.use({ serviceWorkers: 'block' });
for (const route of AUDIT_ROUTES) for (const width of [375, 768, 1440]) {
  test(`${route} @${width}: axe, CLS, links, images, CSP, console`, async ({ page, request, browserName }) => {
    await page.addInitScript(() => {
      const w = window as any; w.__csp = []; w.__cls = 0;
      document.addEventListener('securitypolicyviolation', (e) => w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
      try { new PerformanceObserver((l) => { for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) w.__cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true }); } catch { /* not Chromium */ }
    });
    const errors: string[] = []; const badImages: string[] = [];
    page.on('console', (m) => m.type() === 'error' && !ALLOWED_CONSOLE.some((r) => r.test(m.text())) && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => r.request().resourceType() === 'image' && r.status() >= 400 && badImages.push(r.url()));
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route); /* settle: fonts.ready + full scroll (reuse shell.spec settle) */
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    // links: collect same-origin a[href] + img[src]/srcset, dedupe across the run, request.get each once → < 400
    // CLS (Chromium only): expect(cls).toBeLessThanOrEqual(0.1)
  });
}
```
- `ALLOWED_CONSOLE` must cover the Vercel Analytics / Speed Insights loaders, which 404 under `next start` (`/_vercel/insights/script.js`, `/_vercel/speed-insights/script.js`), in each engine's wording. The existing exact-match regex is Chromium's (`e2e/home-canvas.spec.ts:131-132`). Firefox and WebKit word the MIME refusal differently, so derive one allow-list entry per engine from a first run, and keep each one exact.
- `securitypolicyviolation` is a DOM event and works in all three engines; console-text matching (`/Content Security Policy|Refused to/`) is Chromium-centric. Use the event as the primary CSP check.
- `layout-shift` entries exist only in Chromium (the existing CLS test is `@chromium-only`, `e2e/design-system.spec.ts:78-80`). Run the CLS assertion only when `browserName === 'chromium'` and keep the rest cross-browser.
- `THREE.Clock` is a `console.warn` (R3F 9.8.1 store; 9.8.2 is published but not verified to fix it). Asserting on `error` only keeps it out; asserting on warnings would need it fixed first.
- Test count: routes (9) × widths (3) × browsers (3) = 81 tests plus the D-21 states. That is enough to matter for CI time (E2E job `timeout-minutes: 60`, `.github/workflows/ci.yml:77`). Prefer one test per route that loops widths internally if runtime becomes a problem (the ratchet counts tests, not assertions).

### Anti-Patterns to Avoid
- **`alternates.canonical` in the root layout:** inherited by every route that does not override it.
- **`openGraph: { title }` in a page:** wipes the root default image for that page (finding 2).
- **Appending `@theme { --color-*: initial; }` at the end of `globals.css`:** deletes the L2 tokens declared above it.
- **Deleting `public/images/optimized/` before the generator/schema change:** `npm run lint` (`data:check` → `photos:derive -- --check`) fails on "legacy file … is missing" (`scripts/photos/build-derivatives.mjs:416-418`).
- **Catching the honeypot before the rate limit:** reorders the locked check sequence.
- **`role="alert"` on every inline error** (today's `FeedbackForm` does this, `components/FeedbackForm.tsx:127,149,171`): it chatters on blur; the UI-SPEC moves the announcement to the summary.
- **Relying on `page.route` while a SW is active:** requests the SW answers bypass `page.route` (09-22 diagnosis).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PNG text layout for OG | Canvas/sharp text compositing | `next/og` `ImageResponse` | Satori handles wrapping and fonts; already bundled |
| sitemap XML / robots text | String templates | `app/sitemap.ts`, `app/robots.ts` (`MetadataRoute`) | Correct escaping and content types |
| Canonical URL joining | `site.url + path` string maths | `metadataBase` + relative `alternates.canonical` | Slash normalisation is built in `[CITED: generate-metadata.md:431-464]` |
| `<head>` tags | Manual `<meta>` | Metadata API | ui-ux-pro-max nextjs "Use metadata API" |
| a11y rule engine | Custom checks | `@axe-core/playwright` (pinned) | |
| CSP violation capture | Console text parsing only | `securitypolicyviolation` event | Engine-independent |
| Retry-After maths | Own window tracking | Upstash `reset` from `limit()` | Already returned |

**Key insight:** every hard part here (status codes, metadata merging, SW cut-over) has Next- or browser-level semantics that a hand-written workaround would fight. Use the framework seams (proxy, metadata routes, Cache Storage) and pin them with tests.

## Runtime State Inventory (VERIFY-01 cleanup and the SW change)

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Visitors' Cache Storage: `static-<BUILD_ID>`, `images-…`, `dynamic-…` written by the v1 and current SW, including cached v1 HTML | Code: the new SW's `activate` already deletes caches not ending in its `BUILD_HASH` (`public/service-worker.js:95-107`). No data migration possible or needed |
| Live service config | Vercel project: production alias `portfolio-app-mocha-three.vercel.app` (D-13), Skew Protection setting unknown, Upstash Redis keys `ratelimit:feedback:*` (unchanged), Resend sender/recipient env | None in code; confirm the Vercel plan for Skew Protection (open question 3) |
| OS-registered state | Installed service workers in visitors' browsers (scope `/`) | The new SW replaces them on the next visit (`skipWaiting`, hourly `registration.update()`); nothing to unregister |
| Secrets/env vars | `RESEND_API_KEY`, `FEEDBACK_RECIPIENT_EMAIL`, `FEEDBACK_FROM_EMAIL`, `UPSTASH_REDIS_REST_URL/TOKEN`; CI uses dummy values (`ci.yml:105-108`) | No rename. Note: with D-02 the CI dummy key makes every real send `send-failed`; e2e success paths must mock |
| Build artifacts | `public/service-worker.js` is mutated in place by `postbuild` (restore with `git checkout -- public/service-worker.js` after local builds); `coverage/coverage-final.json` and `jest-results.json` still list deleted files; `data/generated/image-manifest.ts` `legacy` entries; `.next/` | Regenerate the manifest via `photos:derive`; coverage/jest-results are regenerated outputs (check whether they are tracked before deleting) |

Also stale in docs outside the README: `.github/copilot-instructions.md:88` (GlassmorphismNav) and `project_concept/*.md` (Header/Footer). These are not locked; list them for the README pass or leave them with a reason.

## Common Pitfalls

### Pitfall 1: `notFound()` 404 renders nothing server-side
**What goes wrong:** HTTP 404 with an empty `<html id="__next_error__">`; without JS there is no page, and the title is the site default.
**Why:** React SSR has no error boundaries; Next 16.4 error recovery emits the empty error shell (`app-render.js:1320-1327`). Reproduced on `/projects/no-such-slug` and `/photos/no-such-slug` (33–34 KB bodies, `next_error=1`, `main=0`).
**How to avoid:** Pattern 1 proxy rewrite. Keep `dynamicParams = false` and `notFound()` as a second line of defence.
**Warning signs:** the UI-SPEC's server-HTML gate (`request.get` → h1 + one `main` + 404).

### Pitfall 2: Contact cannot export metadata today
`app/(site)/contact/page.tsx` starts with `'use client'` (line 1), so it currently renders the root title and description (probe: `/contact` → "Tim Lui · Developer & photographer"). `/offline` is also `'use client'` with the same result. Both become Server Components.

### Pitfall 3: `no-webgl.spec.ts` "contact keeps the form" hangs after the mesh goes
It awaits `webglFailure(page)` before asserting, and that console message only fires because `AnimatedGradientMesh` mounts a canvas (`e2e/no-webgl.spec.ts:44-53`). Rewrite it like "project detail keeps its content": assert `canvas` count 0, no error page, and the new heading (`Contact`).

### Pitfall 4: Playwright strict-mode collisions on Contact
`getByLabel(/Name/i)` and `getByLabel(/Message/i)` must stay unique (`e2e/contact-form.spec.ts:8-10`). The honeypot label, checkbox label and every `aria-label`/accessible name on the page must avoid "name" and "message" (UI-SPEC: `Leave this field empty`, `I'd like to talk about working together`). Field errors appear twice (inline + summary), so `getByText(/Enter your name/)` becomes ambiguous; scope assertions as the UI-SPEC lists.

### Pitfall 5: The CI e2e success path breaks with D-02
CI sets `RESEND_API_KEY: dummy_key_for_tests` (`ci.yml:106`). Today the send failure is swallowed, so "thank you" appears. After D-02 the API returns `send-failed`. Mock `/api/feedback` in success-path e2e tests, and Jest-test the real outcomes.

### Pitfall 6: Service worker hides requests from tests
Functional projects allow SWs in CI (`playwright.config.ts:61-81` sets no `serviceWorkers`). Set `serviceWorkers: 'block'` on chromium, firefox and webkit; opt in only in `e2e/service-worker.spec.ts`. This also resolves the four `delayHeightmap` items (09 deferred).

### Pitfall 7: Tailwind colour reset order
`clearNamespace('--color', 0)` deletes every `--color-*` key present when it runs `[VERIFIED: node_modules/tailwindcss/dist/lib.js add()/clearNamespace]`. Place `@theme { --color-*: initial; }` directly after `@import "tailwindcss"` and the `@source not` lines, before the L2 block. Prove parity by diffing the compiled CSS selector list before and after (the UI-SPEC requires zero-diff).

### Pitfall 8: v1 alias removal has CSS consumers beyond the 29 lines
`--text-shadow-glow*` (`app/globals.css:154-159`) and the Phase 4 block (`:480-560`, plus its reduced-motion guards for `.contour-animate`, `.ambient-glow`, `.glow-*`) reference `--color-frost-glow`/`--color-ember-glow`. Only the dead files use them (grep this session). Delete them in the same commit so no `var()` dangles. Keep the universal reduced-motion rules in that media block.

### Pitfall 9: WebKit project inherits no tag filter
Only firefox has `grepInvert: /@chromium-only/` (`playwright.config.ts:70`). A new CI webkit project needs the same, or the WebGL-dependent Home tests run in WebKit. Also remove the `!process.env.CI` guard (`:77`).

### Pitfall 10: CI retries hide flakes
`retries: process.env.CI ? 2 : 0` (`playwright.config.ts:45`) contradicts D-18's "never silently retried". Add `--fail-on-flaky-tests` to the CI e2e command (`[VERIFIED: npx playwright test --help]`), or set retries to 0 for the new projects, and record each WebKit tag reason.

### Pitfall 11: React-Compiler debt in `useProgressiveTextures`
Linting with the four compiler rules at `error` reports 3 errors (`react-hooks/refs` at `lib/useProgressiveTextures.ts:71:3` and `:302:15` ×2, "Cannot access refs during render") and 4 `exhaustive-deps` warnings (`:160,263,296,297`). The hook returns `texturesRef.current` during render. A state-based texture map (or `useSyncExternalStore`) is needed before the file leaves `LEGACY_COMPILER_FILES`. It feeds the 3D carousel (chromium-only tests), so this is a regression risk; call it out at plan review.

### Pitfall 12: Metadata OG URL is the deployment URL in CI
`metadataBase` is the production constant (D-13), so `og:image` in CI points at production, not localhost. Tests that fetch OG images must request the path portion against `baseURL`, not the absolute URL.

## Code Examples

### Zürich coordinates (D-01)
Wikipedia's Zürich infobox gives "47°22′28″N 08°32′28″E" = "47.37444°N 8.54111°E" `[CITED: en.wikipedia.org/wiki/Zurich, fetched 2026-11-02]`. Rounded to 2 decimals: **`47.37 N · 8.54 E · Zürich`**. Tim confirms at the copy checkpoint.
```ts
// data/site.ts (addition; Site type gains url and location)
url: 'https://portfolio-app-mocha-three.vercel.app',
location: { name: 'Zürich', lat: 47.37, lon: 8.54, source: 'Wikipedia "Zurich" infobox, 47.37444 N 8.54111 E, rounded to 2 decimals (2026-11-02)' },
```
`formatLatLon` currently hard-codes four decimals (`lib/home-format.ts:40-49`, comment example `'45.9764 N · 7.6586 E'`); add `{ decimals: 2 | 4 }` with 4 as default.

### SW unit test harness (extend, don't replace)
`lib/__tests__/service-worker-media.test.ts:33-55` already evaluates the committed SW with stubbed `self`, `caches` and `fetch` via `new Function('self','caches','fetch', source)`. Add `service-worker-navigation.test.ts`: (1) network ok → returns network response and `cache.put`; (2) fetch rejects → cached page; (3) none → `/offline`; (4) 404 → passes through, no `put`; (5) `_rsc` → no `respondWith`; (6) activate deletes foreign caches.

### SW update e2e (Chromium-only)
```ts
test.use({ serviceWorkers: 'allow' });
test('a returning visitor gets the new HTML on the first load after a deploy @chromium-only', async ({ page, context }) => {
  await page.goto('/roadmap');
  await page.evaluate(async () => { await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true })); });
  await page.reload();                                   // now cached by the SW
  await context.route('**/roadmap', async (route) => {   // context.route sees SW fetches (Chromium)
    const res = await route.fetch(); const body = (await res.text()).replace('<title>', '<title>DEPLOY-2 ');
    await route.fulfill({ response: res, body });
  });
  await page.reload();
  await expect(page).toHaveTitle(/^DEPLOY-2 /);          // SWR would show the old title here
  await context.unroute('**/roadmap');
  await context.setOffline(true);
  await page.goto('/projects/coin-flip').catch(() => {}); // never visited → /offline
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("You're offline");
  // styled offline: computed font-family of the h1 includes Schibsted
});
```
`[CITED: playwright.dev/docs/service-workers]`: SW network events and routing are Chromium-only; "Requests for updated service worker main script code cannot currently be routed", so a new *SW version* cannot be simulated in e2e. Cover version cut-over (cache deletion) in Jest. Whether `context.setOffline` applies to SW fetches is assumed (A5).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts`, Node runtime default, no `runtime` option | Next 16.0 `[CITED: proxy.md:255,806]` | Repo already on proxy |
| `reset()` in error boundaries | `retry()` (repo uses it, 07 deviation) | Next 16.4 | Keep |
| `params` objects | `params` Promises in pages and image functions; plain object in `generateImageMetadata` | Next 16.0 `[CITED: opengraph-image.md:304]` | Type the two differently |
| `'unsafe-eval'` always in CSP | Dev-only | Next CSP guide `[CITED: content-security-policy.md:42]` | Prod chunks contain no `eval(`/`new Function(` `[VERIFIED: grep .next/static/chunks/*.js, 0 matches]` |
| Stale-while-revalidate HTML in SW | Network-first navigation + offline fallback | This phase | |

**Deprecated/outdated:** `global-not-found.js` is experimental and does not cover `notFound()`. `experimental.useOffline` is experimental and soft-navigation only. The repo comment "CSP moved to middleware.ts" (`next.config.ts:121`) and "nonces from middleware.ts" (`app/layout.tsx:42-43`) are stale wording; update them in passing.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A proxy `NextResponse.rewrite` to an unmatched path renders the root `app/not-found.tsx` server-side with HTTP 404, keeps the request headers set in the rewrite, and `usePathname()` in SiteNav still reports the original URL (so Photographs/Engineering stays current) | Pattern 1 | EDGE-01 server-HTML gate fails. **Spike first** (Wave 0) on a production build; fallback: a dedicated route like `app/(site)/__missing/page.tsx` cannot set 404, so the spike outcome matters |
| A2 | `x-edge-section` is safe to read after the proxy deletes any client-sent copy | Pattern 1 | A spoofed header would only flip between two fixed link sets; low |
| A3 | Turbopack's metadata-route handling re-exports `generateStaticParams` / generates it for `generateImageMetadata` like the webpack loader read here | Pattern 3 | OG routes become dynamic (ƒ); still work, but not deterministic at build. Check build output |
| A4 | The 500 KB ImageResponse ceiling does not bind for Node-runtime routes prerendered at build | Pattern 3 | Build error; mitigate with smaller JPEG (1024 webp is not Satori-safe; use the 1200 JPEG) |
| A5 | `context.setOffline(true)` also cuts the SW's own `fetch` in Chromium | SW e2e | Offline assertions pass vacuously or fail; use `context.route('**', r => r.abort())` instead |
| A6 | A stale page's soft navigation after a deploy falls back to a hard navigation (build-id mismatch) | Pattern 5 | One extra stale view; the reload-once guard covers it |
| A7 | `*.vercel.app` always serves HTTPS (HTTP redirected at the edge), so the loopback+http condition never triggers in production | D-17 | Lost directive; the unit test plus the UAT header read catch it |
| A8 | Linux WebKit (Playwright 1.64, WebKit 27.2) in CI runs the suite once the CSP condition lands; the config comment's "known issues with client-side navigation, form validation, modals, and WebGL" is stale | D-18 | Flake-triage period longer than planned; tags with reasons |
| A9 | axe's default run (no `withRules`/`withTags`) includes best-practice rules such as `region` and `landmark-*` | Pattern 7 | Missed violations; pin with `withTags` if needed |
| A10 | Satori renders the 45 KB contour SVG via `<img src="data:image/svg+xml,…">` correctly with the `stroke` replaced | Pattern 3 | Fallback: pre-render the contour plate to PNG at build with sharp (already a devDependency) |

## Open Questions

1. **Zürich figures (D-01).** What we know: Wikipedia infobox 47.37444 N, 8.54111 E → `47.37 N · 8.54 E`. Unclear: Tim's preferred reference point. Recommendation: present this at the copy checkpoint; if he declines, omit the Location row (UI-SPEC content gate).
2. **Proxy rewrite target (A1).** Recommendation: a 30-minute spike plan at the start of the edge-page wave, with the server-HTML e2e as its acceptance test.
3. **Vercel plan / Skew Protection.** Unknown whether the project is Hobby. Recommendation: ask Tim; the SW reload-once guard works either way.
4. **Phase 11 completion date and next `surveyedAt` (11-08 Q3).** `data/roadmap.ts:50` still reads `{ n: 11, name: 'Engineering & roadmap', status: 'in-progress' }`. Recommendation: first data-edit task with a Tim checkpoint (`2026-11-02` proposed by CONTEXT).
5. **zod bump.** Recommendation: bump to ^4.6.7 behind a checkpoint (SUS verdict is age-only); rerun `app/api/__tests__/feedback.test.ts`.
6. **`.github/copilot-instructions.md` and `project_concept/*` stale references.** Not in the locked list. Recommendation: include them in the README pass or record a reason to leave them.
7. **Reload-on-update UX.** A one-time reload after a deploy could interrupt reading. Recommendation: reload only when no field is dirty; otherwise make the next in-site navigation a hard navigation. Confirm at plan review (Claude's discretion area, but user-visible).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build, tests | ✓ | 26.13.0 local; `.node-version` = 24 for CI | — |
| Next production build | e2e, probes | ✓ | `.next` from 2026-11-02 12:25 | `npm run build` (restore SW after) |
| Playwright browsers | e2e | ✓ | chromium 156 (1248), firefox 157 (1555), webkit 27.2 (2370) | — |
| Python | ui-ux-pro-max search | ✓ | (ran this session) | Quick Reference |
| Upstash / Resend | live API | ✗ locally/CI (dummy or mock) | — | Jest mocks; Playwright `page.route` |
| Real Safari | D-19 UAT | Tim's devices | — | WebKit CI project |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.4 (jsdom; `@jest-environment node` for API), Playwright 1.64 |
| Config file | `jest.config.js`, `playwright.config.ts` |
| Quick run command | `npx jest <files> --silent` ; `npx playwright test <specs> --project=chromium` (set `PW_PROD=1` for the production server) |
| Full suite command | `npm run lint && npm run type-check && npm test && PW_PROD=1 npx playwright test --project=chromium --project=firefox --project=webkit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONTACT-01 | Labels, borders, mono email, Copy (status), location row, server page with metadata | component + e2e | `npx jest components/contact --silent`; `npx playwright test e2e/contact-form.spec.ts --project=chromium` | ❌ `SummitRegister.test.tsx` (rewrite of `FeedbackForm.test.tsx`); spec exists (rewrite heading) |
| CONTACT-02 | Blur/live validation, summary focus, kept input, Sending, Signed entry, failure box per code, 15 s abort | component + e2e (mocked API) | same + `e2e/a11y-contact.spec.ts` | ❌ new cases; ✅ files exist |
| CONTACT-03 | Honeypot 200 no send; order csrf→ratelimit→honeypot; 429 + Retry-After; send-failed 502; logs without PII | unit | `npx jest app/api/__tests__/feedback.test.ts --silent` | ✅ (extend) |
| EDGE-01 | 404 h1/kicker/art; server HTML for unknown slugs (no JS) has h1 + one main + 404; context link; no slug echo; error/global-error in EdgeLayout | e2e + component | `npx playwright test e2e/shell.spec.ts --project=chromium`; `npx jest components/site components/__tests__/global-error.test.tsx --silent`; `lib/__tests__/edge-art.test.ts` | ✅ shell.spec (rewrite h1); ❌ edge-art test, server-HTML test |
| EDGE-02 | Network-first nav, offline fallback, RSC bypass, cache cleanup; update e2e; styled offline; saved-pages list | unit + e2e | `npx jest lib/__tests__/service-worker-*.test.ts --silent`; `npx playwright test e2e/service-worker.spec.ts --project=chromium` | ✅ media test; ❌ navigation test, SW spec |
| SEO-01 | Every route: own title, description, absolute canonical; `/offline` noindex; `?view=` canonical | e2e (HTML head) | `npx playwright test e2e/seo.spec.ts --project=chromium` | ❌ |
| SEO-02 | Each OG URL 200 `image/png` 1200×630; og:image on every route; element-tree strings (no undefined/NaN) | e2e + unit | `npx jest lib/og --silent`; seo.spec | ❌ |
| SEO-03 | `/sitemap.xml` lists nav + 4 photos + 2 projects, no /offline; `/robots.txt` points at it | e2e/unit | seo.spec; `npx jest app/__tests__/sitemap.test.ts` | ❌ |
| VERIFY-01 | Dead files gone; guard lists empty; asset-exists test; 0 v1 names; ratchet 0; colour reset parity; no raw.githubusercontent | unit + guards | `npm run lint` (guards + selftest + data:check); `npx jest data/__tests__/asset-exists.test.ts` | ❌ asset-exists test; ✅ guards (selftests rewritten) |
| VERIFY-02 | axe 0 on every route × state; keyboard flows | e2e | `npx playwright test e2e/audit.spec.ts e2e/keyboard.spec.ts --project=chromium` | ❌ |
| VERIFY-03 | Suite green in chromium, firefox, webkit; VT + WebGL fallbacks | e2e | full suite with three projects; `e2e/no-webgl.spec.ts` | ✅ (WebKit project + tags) |
| VERIFY-04 | CLS ≤ 0.1 @375/768/1440, links/images resolve, no CSP violation/console error | e2e | `npx playwright test e2e/audit.spec.ts` | ❌ |

### Sampling Rate
- **Per task commit:** the touched Jest files + the one relevant spec on chromium (`PW_PROD=1` for SW/404/OG work).
- **Per wave merge:** `npm run lint && npm run type-check && npm test`, then the e2e set for that wave on chromium + firefox (+ webkit once D-17 lands).
- **Phase gate:** full suite, CI green on a `ci/12-NN` push, the visual round's expected-diff list matched, test-count ≥ 1749.

### Wave 0 Gaps
- [ ] Spike: proxy rewrite → server-rendered 404 (A1), with `e2e/shell.spec.ts` server-HTML case.
- [ ] `serviceWorkers: 'block'` on functional projects; webkit project with `grepInvert`; `--fail-on-flaky-tests`.
- [ ] `e2e/routes.ts` extracted from `shell.spec.ts`.
- [ ] `lib/__tests__/service-worker-navigation.test.ts`.
- [ ] `data/__tests__/asset-exists.test.ts` (every `/images/`, `/terrain/`, `/media/` path in `data/**` and generated manifests exists under `public/`) **before** deleting `public/images/optimized/`.
- [ ] Proxy CSP unit test (both header variants; dev vs prod `unsafe-eval`).

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | partial (CSRF on the POST) | `validateOrigin` (Origin vs Host), unchanged |
| V5 Input Validation | yes | zod `safeParse`; honeypot field `max(200)`; React escaping for echoed name/email; `escapeHtml` in the email template |
| V6 Cryptography | no (nonce from `crypto.randomUUID`) | unchanged |
| V7 Error handling & logging | yes | D-04 metadata-only logs; no error detail in responses or on error pages |
| V14 Config | yes | CSP: remove `raw.githubusercontent.com`, `'unsafe-eval'` dev-only, D-17 condition |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Spam bots on the form | Denial of service / spoofing | Honeypot after rate limit; Upstash 5/h/IP |
| PII in logs (today: full name, email, message logged) | Information disclosure | D-04 log shape; Jest asserts no PII in log calls |
| Reflected slug on 404 | Tampering/XSS | Never render the slug; header enum only |
| Header spoofing to strip `upgrade-insecure-requests` | Tampering | Condition on loopback hostname, not `x-forwarded-proto` alone |
| Stale SW serving old pages | Integrity | Network-first, versioned caches, `no-cache` on the SW script |
| `x-forwarded-for` spoofing of rate-limit key | Spoofing | Vercel overwrites `X-Forwarded-For` `[CITED: vercel.com/docs/headers/request-headers]` |

## UI guidance (ui-ux-pro-max, run 2026-11-02)
- `"error summary validation"` (ux, Forms/Accessibility "Focusable Error Summary", High): summary at the top of the form, focus moves to it after a failed submit, items link to fields, inline errors stay, and focus does not move on every blur. This matches the UI-SPEC.
- nextjs stack: "Use metadata API" / "Use generateMetadata for dynamic" / "Include OpenGraph images" (opengraph-image.tsx); "Use proxy.ts for redirects, rewrites, and lightweight request guards" (supports Pattern 1); "Keep proxy runtime-safe … Don't … fs.readFile in middleware" (the proxy imports data modules only, no fs).
- The UI-SPEC's evidence table already covers the rest (counter announcements, Copy feedback, offline). The planner carries its "Guardrails and Regression Risks" table into task acceptance criteria.

## Dead-code reach (VERIFY-01), verified by grep this session

| Item | Importers / users today | Safe to delete? |
|------|------------------------|-----------------|
| `components/Header.tsx` | none (in `LEGACY_DEAD_FILES`; ratchet `{"components/Header.tsx": 1}`) | Yes; ratchet → `{}`; selftest fixture `__selftest__/identity/bad-dead-import` references it (rewrite) |
| `components/Footer.tsx` | none (in `LEGACY_DEAD_FILES`) | Yes; selftest fixtures `good/components/site/SiteChrome.tsx`, `palette/bad-emoji-legacy-imported` mention it (rewrite) |
| `components/GlassmorphismNav.tsx` | none (in `LEGACY_DEAD_FILES` and `LEGACY_COMPILER_FILES`) | Yes |
| `components/ContourBackground.tsx` | only `GlassmorphismNav.tsx` | Yes, with it (**not in the locked list**: add) |
| `components/AnimatedGradientMesh.tsx` | `app/(site)/contact/page.tsx` | After the Contact rewrite; also `eslint.config.mjs:10`, comments in `e2e/visual/hide-canvas.css:4`, `e2e/a11y-contact.spec.ts` |
| `components/FeedbackForm.tsx` + test | contact page | Replaced by `SummitRegister` (test rewritten, not deleted) |
| `lib/useProgressiveTextures.ts` | `components/photos/PhotoCarousel3D.tsx` | Keep; make compiler-clean (3 errors) then drop from `LEGACY_COMPILER_FILES` |
| `ParticleButton`, `useHexGrid`, `hex-clip`/`hex-grid` | none (only `coverage/coverage-final.json`) | Already gone |
| v1 aliases (29 marked lines) + `--text-shadow-glow*` + Phase 4 CSS block | only dead files | Yes, same commit |
| `public/images/optimized/` (60 files: thumb/medium/large + old sm/md/lg) | manifest `legacy` field, `build-derivatives.mjs` `legacyOf()` + check, schema `LegacyUrl`, `data/__tests__/editorial.test.ts:129`, `image-manifest.test.ts:75` | Yes, after the asset-exists test and generator/schema change |
| `connect-src https://raw.githubusercontent.com` | no fetch to it in app code (grep: only `proxy.ts`) | Yes |
| README tree (`README.md:181,185-195,201,222-223,333`) | docs | Rewrite the tree section from the real tree |

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md`, `04-functions/not-found.md` (status codes, noindex, async not-found, proxy check)
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` (metadataBase, merging, twitter, robots)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md`, `sitemap.md`, `robots.md`; `04-functions/image-response.md`, `generate-image-metadata.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`; `02-guides/content-security-policy.md`; `02-guides/progressive-web-apps.md`; `02-guides/offline-support.md`; `04-functions/use-offline.md`
- Next source: `server/app-render/app-render.js:1320-1327, 2480-2560`; `build/templates/app-page-runtime.js:577-581, 1092-1097`; `lib/metadata/metadata-resolution-primitives.js:91-122,145-152,376-432`; `build/webpack/loaders/next-metadata-route-loader.js:139-205`
- Tailwind source `node_modules/tailwindcss/dist/lib.js` (`add`, `clearNamespace`), v4.3.0
- Live probe of the production build on port 3123 (status, body, head tags, headers for `/projects/no-such-slug`, `/photos/no-such-slug`, `/__no-such-page__`, `/offline`, `/contact`, `/sitemap.xml`, `/robots.txt`, `/service-worker.js`)
- Repo files read this session (cited inline with line numbers)

### Secondary (MEDIUM confidence)
- [Vercel request headers](https://vercel.com/docs/headers/request-headers): `x-forwarded-proto`, `x-forwarded-for` overwrite
- [Vercel Skew Protection](https://vercel.com/docs/skew-protection): Pro/Enterprise
- [Vercel preview indexing](https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines): `X-Robots-Tag: noindex` default
- [Playwright service workers](https://playwright.dev/docs/service-workers): Chromium-only routing; SW script updates not routable
- [Wikipedia: Zurich](https://en.wikipedia.org/wiki/Zurich): infobox coordinates
- `npm audit --json` (2026-11-02): zod GHSA-mrhx-c7xc-m3w5, fflate GHSA-px8p-9vwx-vf98

### Tertiary (LOW confidence)
- Behaviour of Linux WebKit 27.2 in CI (A8), Turbopack metadata-route parity (A3)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (no new dependency; versions read from disk)
- Architecture: HIGH for metadata/OG/404 root cause (source + live probe); MEDIUM for the proxy rewrite outcome (A1 spike)
- Pitfalls: HIGH (each grounded in a repo line or a probe)
- Service worker test design: MEDIUM (Playwright SW routing limits)

**Research date:** 2026-11-02
**Valid until:** 2026-12-02 (Next 16.4.x patch releases could change the error-recovery path; re-probe if `next` is bumped)
</content>
</invoke>
