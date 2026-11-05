# Phase 12: Contact, Edge Pages, Cleanup & Verification - Context

**Gathered:** 2026-11-02
**Status:** Ready for planning

<domain>
## Phase Boundary

The last off-system pages join the design system:
- the Contact page becomes the "summit register";
- the 404, error, global-error and offline pages get contour art inside the shell.

Every route becomes findable and shareable: title, description, canonical URL, OG images, `sitemap.xml` and `robots.txt`. The dead v1 code, aliases, legacy image variants and unused CSP origins are deleted. The whole site is then verified:
- axe and a keyboard-only pass;
- Chromium, Firefox and WebKit;
- CLS, internal links, images and CSP console errors.

Requirements: CONTACT-01..03, EDGE-01..02, SEO-01..03, VERIFY-01..04. This is the last v2.0 phase; the milestone audit follows it.

Not in this phase: "Ask about this photo" / `?ref=` prefill (deferred in PROJECT.md), a public guestbook, CAPTCHA, a database for feedback, and terminal step controls (ENG-F1).

</domain>

<decisions>
## Implementation Decisions

### Carried forward (locked by ROADMAP scope notes and earlier phases, not re-asked)
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

### Summit register form (CONTACT-01..03)
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

### Contact page layout & copy
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

### Edge pages (EDGE-01, EDGE-02)
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

### Share previews & domain (SEO-01..03)
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

### WebKit & CSP (VERIFY-03)
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

### Audit gates (VERIFY-02, VERIFY-04)
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

### Carry-over backlog (Phase 12 owns all four groups)
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

### For the UI-SPEC (not decided here)
- The Contact page background after the mesh: a plain surface or a quiet contour band.
- The final heading copy and the details-panel styling.
- The error page's secondary actions, e.g. a "Report it" link to `/contact`.
- How the dashed trail and "you are here" dot are drawn and placed at 375, 768 and 1440 px.
- The OG template layout grid.
- The fix approach for the HEADS label: move it into the figcaption, or re-crop the poster (needs Tim's approval if the approved poster changes).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md` § "Phase 12: Contact, Edge Pages, Cleanup & Verification": goal, 5 success criteria, scope notes, "Why SEO-02 is here".
- `.planning/REQUIREMENTS.md`: CONTACT-01..03, EDGE-01..02, SEO-01..03, VERIFY-01..04.
- `.planning/PROJECT.md`: Constraints (dark-only, ui-ux-pro-max, same-origin assets, photo rights, location privacy) and Key Decisions. It must be updated at phase end.
- `.planning/STATE.md`: Blockers/Concerns and Pending Todos tagged Phase 12. These include the `notFound()` empty server HTML, the Firefox 1 px stroke check, local WebKit, the legacy variants and the SWR stale-HTML todo.

### Milestone research (behaviour and pitfalls)
- `.planning/research/FEATURES.md` § "CONTACT: Summit register (Gipfelbuch) contact" and § "EDGE: 404 / offline / error": the state model, error messages and anti-features. Superseded where D-01..D-12 differ: slug echo, redirects and the summit coordinates in the confirmation.
- `.planning/research/PITFALLS.md`:
  - #17: the service worker serving stale HTML and missing chunks, and the unstyled offline page;
  - #26: the summit register quietly dropping security;
  - #28: attribution on edge pages;
  - the "Looks Done But Isn't" checklist, which runs in the milestone audit.
- `.planning/research/ARCHITECTURE.md`: `components/contact/SummitRegister.tsx` (MOD), the e2e accessible-name contract table, and the Resend/Upstash "unchanged" row.

### Prior phase contracts
- `.planning/phases/07-foundation-guardrails/07-UI-SPEC.md` § "Edge Pages Inside the Shell", § "Contact Interim Contrast Fix (SHELL-06)" and § "Copywriting Contract": the Phase 7 edge-page and contact baseline this phase replaces.
- `.planning/phases/09-home-ascent/09-CONTEXT.md`: D-11 (summit coordinates from data) and D-17/D-21 (night-tinted contour poster, static mode).
- `.planning/phases/10-photography/10-CONTEXT.md`: D-07 (film-scan fields) and D-08 (photo page in the shell).
- `.planning/phases/11-engineering-roadmap/11-CONTEXT.md`: D-05/D-06/D-07 (profile glyph, SAC badges) and D-23 (coin-flip privacy wording, which applies to its OG card).

### Carry-over sources (D-23..D-26)
- `.planning/phases/09-home-ascent/deferred-items.md`: 10 open.
- `.planning/phases/10-photography/deferred-items.md`: 6 open.
- `.planning/phases/11-engineering-roadmap/deferred-items.md`: 6 open.
- `.planning/phases/11-engineering-roadmap/11-UI-REVIEW.md` § "Top 3 Priority Fixes" and the RouteLog note.
- `.planning/phases/11-engineering-roadmap/11-REVIEW-DISPOSITION.md`: IN-01..IN-14 open.
- `.planning/phases/08-data-terrain-pipeline/08-REVIEW-DISPOSITION.md`: CR-01 deferred (D-12); IN-01 and IN-03..IN-09 open.

### Next.js 16.4 docs (AGENTS.md: read before writing code)
- `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md` and `.../04-functions/not-found.md`

### Test and CI contracts
- `e2e/contact-form.spec.ts`: the accessible-name contract (see Carried forward).
- `e2e/a11y-contact.spec.ts`: the existing axe pattern (`@axe-core/playwright` 4.13.0, exact pin).
- `e2e/shell.spec.ts`: the `ROUTES` list and the shell 404 cases.
- `e2e/visual/README.md`: the re-baseline protocol, with `scripts/ci/check-snapshot-commit.mjs`.
- `playwright.config.ts`: the projects, including the WebKit "known issues" comment and the `serviceWorkers: 'block'` visual projects.
- `.github/workflows/ci.yml` and `.github/workflows/visual-baselines.yml`.
- `scripts/guards/test-count.baseline.json` (1749), `scripts/guards/palette-ratchet.json` and `scripts/guards/lib/legacy-dead-files.mjs`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/FeedbackForm.tsx` (228 lines): the base for `SummitRegister`. It already has `aria-invalid`, `aria-describedby` errors, token classes and `noValidate`. Missing: the error summary, honeypot, blur validation, the success state machine and error codes.
- `app/api/feedback/route.ts`: zod `feedbackSchema`, `validateOrigin` (`lib/csrf.ts`), `feedbackRateLimit` (`lib/rate-limit.ts`) and `sendFeedbackEmail` (`lib/email.ts`). Tests: `app/api/__tests__/feedback.test.ts`, `components/__tests__/FeedbackForm.test.tsx`.
- `components/terrain/ContourField.tsx`: a zero-JS contour CSS mask over the `contour` token, with LODs from `data/generated/terrain.ts`. Assets: `public/terrain/contours-{hero,map,strip}.<hash>.svg`. Used by `SiteFooter`, `home/PosterSheet`, `photos/MapSheet`. This is the 404, error and offline art base.
- `components/site/NotFoundBody.tsx` and `components/site/ErrorBody.tsx`: the Phase 7 edge bodies. ErrorBody moves focus to the h1 and calls Next 16.4's `retry()`.
- `components/site/SiteChrome.tsx` (with `variant="static"` for global-error), `SiteNav`, `SiteFooter` and `SkipLink`.
- `data/site.ts` (`as const satisfies Site`): identity, email, links and nav. `site.url` (D-13) goes here.
- `data/generated/photos.ts`, the image manifest, and the photo and project view-models (`lib/photos/*`, `lib/trail-profile.ts`, `lib/trail-grade.ts`): the data for the OG cards.
- `public/service-worker.js`: `cacheFirst`, `staleWhileRevalidate` (used today for navigations) and `networkFirst` helpers. The precache is `['/', '/offline', ...PRECACHE]`, injected by `scripts/inject-build-hash.mjs`. Media bypasses the cache. Test: `lib/__tests__/service-worker-media.test.ts`.

### Established Patterns
- **Metadata:** the root `app/layout.tsx` sets the title template `'%s · Tim Lui'` and a description. Section pages export `metadata`, and photo and project pages `generateMetadata`. There is no `metadataBase`, canonical, OG, sitemap or robots yet.
- **CSP:** `proxy.ts` builds a nonce CSP per request: `script-src 'self' 'nonce-…' 'strict-dynamic' 'unsafe-eval'`, `connect-src 'self' https://raw.githubusercontent.com`, `upgrade-insecure-requests`. The root layout calls `await headers()` to force dynamic rendering for nonces.
- **Caching:** `next.config.ts` serves 4 asset paths `max-age=31536000, immutable`. Generated assets are content-hashed (PITFALLS #17).
- **Guards:** `guard:identity`, `guard:palette` (with the white/black ratchet), `guard:contrast`, `guard:images` (served-image guard), the test-count ratchet, and selftests in `scripts/guards/__selftest__`. Every deletion must keep these green, and their exemption lists shrink with the files.
- **Visual tests:** canvases are hidden via `e2e/visual/hide-canvas.css`, and the native video controls are hidden in shots. Visual projects block service workers.

### Integration Points
- `app/(site)/contact/page.tsx`: today a `'use client'` page with mesh and motion. It becomes a server page with the `SummitRegister` client island.
- `app/not-found.tsx` (root, renders `SiteChrome` itself) and `app/(site)/not-found.tsx` (group). The slug-aware context link (D-11) needs the miss's section, from the route segment or pathname, without the slug.
- `app/(site)/error.tsx`, `app/global-error.tsx` and `app/(site)/offline/page.tsx` (today a `'use client'` v1-styled page).
- New: `app/sitemap.ts` and `app/robots.ts`, OG image routes or files for `photos/[slug]`, `projects/[slug]` and the root default, and `metadataBase` in `app/layout.tsx`.
- `.github/workflows/ci.yml:104`: the e2e step runs `--project=chromium --project=firefox`, and `--project=webkit` is added (D-18).

</code_context>

<specifics>
## Specific Ideas

- The summit register is a Gipfelbuch: signing it ends with an entry, not a toast (D-03).
- The 404's "you are here" dot sits visibly **off** a dashed marked trail. That picture is the metaphor, and the h1 names it (D-09, D-10).
- Coordinates follow the site's mono style ("N · E" with a middle dot). The Contact location uses 2 decimals (Zürich, ~1 km). The default OG card's summit uses the 4-decimal value from data.
- The photo OG card carries the "© {year} Tim Lui" rights line wherever the preview travels (PROJECT.md photo rights).

</specifics>

<deferred>
## Deferred Ideas

- **"Ask about this photo" / `?ref=<photo-slug>` prefill:** still deferred (PROJECT.md Key Decisions, Pending). A "Report it" link from the error page may land on `/contact`, but there is no `?ref` prefill in this phase.
- **A custom domain:** if Tim connects one, it is a `site.url` edit plus a redirect or canonical plan for the Vercel URL (D-13).
- **Terminal step controls and static transcript (ENG-F1):** still deferred.
- **Purging the git history of the GPS-bearing originals (08 CR-01 / D-12):** stays deferred. Tim runs it separately if ever.

</deferred>

---

*Phase: 12-contact-edge-pages-cleanup-verification*
*Context gathered: 2026-11-02*
