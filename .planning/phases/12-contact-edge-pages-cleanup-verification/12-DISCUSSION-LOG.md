# Phase 12: Contact, Edge Pages, Cleanup & Verification - Discussion Log

> **Audit trail only.** Do not use it as input to planning, research or execution agents.
> The decisions are in 12-CONTEXT.md; this log keeps the alternatives considered.

**Date:** 2026-11-02
**Phase:** 12-contact-edge-pages-cleanup-verification
**Areas discussed:** Summit register form, Contact page layout & copy, Edge pages (404/error/offline), Share previews & domain, WebKit & CSP on localhost, Audit gates (CI vs one-off), Carry-over backlog

---

## Summit register form

**Location shown as coordinates**

| Option | Description | Selected |
|--------|-------------|----------|
| Base town, ~1 km (Recommended) | Where Tim is based, rounded to 2 decimals, with the town name | ✓ |
| Matterhorn summit | 45.9763 N · 7.6586 E, the Home kicker; a motif, misleading as "Location" | |
| Zermatt trailhead | 46.02 N · 7.75 E, the start of the ascent | |
| Centre of Switzerland | Älggi-Alp 46.80 N · 8.23 E, labelled "Switzerland" | |

**User's choice:** Base town, ~1 km. Free text: "Zürich".
**Notes:** About 47.37–47.38 N · 8.54 E. Research picks the cited reference point, and Tim confirms at the copy checkpoint.

**When the Resend email fails**

| Option | Description | Selected |
|--------|-------------|----------|
| Show a recoverable error (Recommended) | API returns an error; the form keeps input and offers Retry | ✓ |
| Keep confirming anyway | Log server-side and still show "register signed" | |

**Register-signed confirmation**

| Option | Description | Selected |
|--------|-------------|----------|
| Entry replaces the form (Recommended) | "Register signed", name + local date/time, "I'll reply to <email>", Sign again; role=status, focus moved | ✓ |
| Entry + summit motif line | As above plus "Gipfelbuch · 4,478 m" | |
| Banner above a cleared form | As today, restyled | |

**Server logging of submissions**

| Option | Description | Selected |
|--------|-------------|----------|
| Log metadata only (Recommended) | Event, timestamp, outcome, IP; no name, email or message | ✓ |
| Keep full logging | As today (name, email, message, IP) | |
| Drop the IP as well | Event, timestamp and outcome only | |

**Area close:** "Next area". Validation timing, error wording and honeypot details go to the UI-SPEC and planner.

---

## Contact page layout & copy

**Page layout without the gradient mesh**

| Option | Description | Selected |
|--------|-------------|----------|
| Form + details panel (Recommended) | Form left, survey-record panel right from 1024 px; the panel stacks above the form below | ✓ |
| Single column, details below | Header, form, details strip | |
| Details in the header | Email and coordinates as a kicker line, full-width form | |

**How the email is offered**

| Option | Description | Selected |
|--------|-------------|----------|
| Text + Copy + mailto (Recommended) | Selectable text, Copy with a polite "Copied" announcement, mailto link | ✓ |
| Text + mailto only | No Copy button | |
| Plain selectable text | Only what CONTACT-01 asks | |

**Collaboration checkbox**

| Option | Description | Selected |
|--------|-------------|----------|
| Keep it, same meaning (Recommended) | No schema, API or email change; e2e contract holds | ✓ |
| Drop it | Three fields only; schema, email and tests change | |

**Reply-time promise**

| Option | Description | Selected |
|--------|-------------|----------|
| "Usually within a few days" | A softer commitment | ✓ |
| Keep "24–48 hours" | A specific promise | |
| No reply-time line | Drop it | |

**Area close:** "Next area". The background and heading copy go to the UI-SPEC and copy checkpoint.

---

## Edge pages (404/error/offline)

**404 contour art**

| Option | Description | Selected |
|--------|-------------|----------|
| Contours + trail + "you are here" (Recommended) | ContourField, a dashed marked trail and a dot off it; static, aria-hidden | ✓ |
| Contour field only | A calm backdrop, no trail or marker | |
| Footer-style contour band | A strip across the top of the body | |

**404 h1**

| Option | Description | Selected |
|--------|-------------|----------|
| Metaphor h1, plain kicker (Recommended) | Kicker "Error 404 · Page not found", h1 "You've left the marked trail" | ✓ |
| Plain h1, metaphor below | h1 "Page not found" | |
| Combined h1 | "Page not found. You've left the marked trail" | |

**Slug-specific 404s**

| Option | Description | Selected |
|--------|-------------|----------|
| Context links, no echo (Recommended) | Photo miss leads to All photographs, project miss to Engineering; slug never rendered | ✓ |
| Echo the slug | "No photo called 'xyz'" | |
| One generic 404 | Same page for every miss | |

**Offline page**

| Option | Description | Selected |
|--------|-------------|----------|
| Shell + real cached list (Recommended) | Same shell and art; SW precaches CSS and fonts; lists the actually cached pages; Try again; reloads when back online | ✓ |
| Shell + fixed section list | A fixed list as today | |
| Minimal, no shell | Self-contained inline-styled page | |

**Area close:** "Next area". error and global-error share the 404 art and layout; a "Report it" link goes to the UI-SPEC.

---

## Share previews & domain

**Canonical base URL**

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel URL as a constant (Recommended) | `site.url = 'https://portfolio-app-mocha-three.vercel.app'` in data/site.ts | ✓ |
| Vercel env var, constant fallback | VERCEL_PROJECT_PRODUCTION_URL at build | |
| A custom domain | Tim types it | |

**Photo OG image**

| Option | Description | Selected |
|--------|-------------|----------|
| Photo + contour side panel (Recommended) | Derivative photo left; contour panel with title, altitude, place, © line | ✓ |
| Contours + text only | No photo in the preview | |
| Full-bleed photo + caption | The 1.91:1 crop cuts the 3:2 photos | |

**Project OG image**

| Option | Description | Selected |
|--------|-------------|----------|
| Name, tagline, grade + profile (Recommended) | SAC badge and elevation-profile glyph from Phase 11 | ✓ |
| Name + tagline only | Plain text on contours | |

**OG for the other routes**

| Option | Description | Selected |
|--------|-------------|----------|
| One site-wide default card (Recommended) | "Tim Lui · Developer & photographer" + summit coordinates in the root metadata | ✓ |
| Per-section cards | Five more images | |
| None beyond SEO-02 | Title and description only | |

**Area close:** "Next area". Sitemap, robots, canonical and Twitter-card details go to research.

---

## WebKit & CSP on localhost

**WebKit path vs `upgrade-insecure-requests`**

| Option | Description | Selected |
|--------|-------------|----------|
| Omit it on plain-HTTP requests (Recommended) | Only local http requests lose the directive; production unchanged; unit test pins both | ✓ |
| Strip it in tests only | page.route removes the header in WebKit e2e | |
| Drop the directive | Remove it everywhere | |
| WebKit on Vercel previews | Real HTTPS, but slower and flakier | |

**WebKit in CI**

| Option | Description | Selected |
|--------|-------------|----------|
| Permanent CI project (Recommended) | webkit joins the CI e2e job, with tags for tests that can't run there | ✓ |
| Phase-end pass only | One local run for sign-off | |
| Smoke subset in CI | A tagged subset in CI, the full suite once | |

**Hands-on browser checks**

| Option | Description | Selected |
|--------|-------------|----------|
| Safari + Firefox at UAT (Recommended) | Real Safari through the key flows + the Firefox footer-stroke check | ✓ |
| Firefox stroke only | Trust Playwright WebKit for Safari | |
| Automated only | No hands-on pass | |

**Area close:** "Next area". Whether `'unsafe-eval'` is still needed goes to research, and a removal is flagged at the plan checkpoint.

---

## Audit gates: CI vs one-off

**Permanent CI or one-off**

| Option | Description | Selected |
|--------|-------------|----------|
| Permanent route-loop spec (Recommended) | axe, CLS, links, images and CSP console checks on every route in CI | ✓ |
| One-off audit report | 12-AUDIT.md for sign-off only | |
| axe in CI, rest one-off | CLS, links and images audited once | |

**axe states**

| Option | Description | Selected |
|--------|-------------|----------|
| Initial + key states (Recommended) | Menu, lightbox, photo views, form error and signed states, static Home | ✓ |
| Initial state only | One scan per route | |

**Keyboard pass**

| Option | Description | Selected |
|--------|-------------|----------|
| e2e flows + your UAT pass (Recommended) | Keyboard-only Playwright flows + Tim's hands-on run | ✓ |
| e2e flows only | No manual pass | |
| Manual UAT only | No automated guard | |

**Area close:** "Next area". The CLS method and link scope go to research.

---

## Carry-over backlog

**Groups Phase 12 owns** (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| Docs & dead code | README tree rows, delete components/Footer.tsx | ✓ |
| UI-review & spec deviations | 11-UI-REVIEW fixes, Phase 9 hero scrim and summit wedge | ✓ |
| Hygiene & security | fflate advisory, THREE.Clock warning, load-event delay, Prettier drift, delayHeightmap tests | ✓ |
| Review rows & dev flakes | Disposition for the 11/08 info rows; harden the dev-only flakes | ✓ |

**Re-baseline batching**

| Option | Description | Selected |
|--------|-------------|----------|
| Two to three batched rounds (Recommended) | R1 backlog UI + dead code, R2 Contact, edge pages and SEO, R3 only if needed; expected-diff lists | ✓ |
| One round at the end | Fewest commits; regressions hide | |
| A round per visual plan | Cleanest attribution; 5–7 PNG commits | |

**Area close:** "Wrap up". Fix approaches go to the UI-SPEC and planner; changes to approved copy or assets come back to Tim.

---

## Claude's Discretion

- The honeypot mechanics and its response (after the unchanged origin and rate-limit checks).
- The API error-code contract, including `Retry-After` on 429.
- Validation timing (on blur, then live) and the error-summary behaviour.
- Service-worker implementation: network-first navigations, the offline precache, the deploy cut-over and the update e2e.
- SEO details: `/offline` noindex, canonicals for `?view=` and the lightbox, Twitter card type, description drafts and Vercel preview indexing.
- OG rendering technique (next/og or a build step) within D-14..D-16.
- Removing `'unsafe-eval'`, if it is proven unused (flagged at the plan checkpoint).
- The CLS method, the link-check scope, and plan order and waves within D-27.

## Deferred Ideas

- "Ask about this photo" / `?ref=` prefill: still deferred.
- A custom domain: a later `site.url` edit plus a redirect or canonical plan.
- ENG-F1 terminal step controls and transcript: still deferred.
- Purging the git history of the GPS originals (08 CR-01): stays deferred.
