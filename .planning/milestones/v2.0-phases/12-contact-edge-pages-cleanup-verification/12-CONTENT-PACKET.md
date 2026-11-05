# Phase 12 Content Packet (12-01)

**Drafted:** 2026-11-02 by Claude. **Status:** answered by Tim 2026-11-02 (see `## Answers (verbatim)` and `## Resolved values` at the end).

Everything below is a proposal. Nothing here is approved until Tim's own reply says so. Each row is one key that later plans look up in `## Resolved values` (12-01-SUMMARY.md). A key Tim does not answer reads `not supplied`, and the element falls back as the UI-SPEC "Content Gates, Both Cases" table (12-UI-SPEC.md lines 465-472) says.

Sources: `UI-SPEC Lnnn` = `12-UI-SPEC.md` line nnn; `RESEARCH Lnnn` = `12-RESEARCH.md` line nnn; `CONTEXT Lnnn` = `12-CONTEXT.md` line nnn. Proposed text is copied character for character from the cited line.

**How to answer:** per section, for example `A: approve all; B: confirm; C: approve, 404-body edited to "…"; D: approve; E: heads ok, log ok; F: defaults; G: reload-once yes, stale refs fix, Hobby, ci push yes; H: ok`. Per key works too (`copy.form-lead: no-claim variant`). "content done" marks every unanswered key `not supplied`.

---

## A. Contact copy

First person (Tim is "I"), sentence case, no exclamation marks (UI-SPEC L461).
If not supplied: the h1 falls back to `Contact` with no kicker; the intro and form lead are left out; error bodies fall back to the 07 strings where one exists (UI-SPEC L470).

| Key | Item (source) | Proposed text or options |
|-----|---------------|--------------------------|
| copy.contact-kicker | Contact header kicker (UI-SPEC L433) | `Summit register` |
| copy.contact-h1 | Contact h1, replaces `Get in Touch` (UI-SPEC L433) | `Contact` |
| copy.contact-intro | Contact intro sentence (UI-SPEC L434) | "Write a line in the register. I read every entry and reply by email." |
| copy.form-h2 | Form card h2 (UI-SPEC L435) | `Sign the register` |
| copy.form-lead | Form card lead (UI-SPEC L435) | Option 1: "Your name, your email and a message. Nothing else is stored." · Option 2 (no claim): "Your name, your email and a message." (The claim holds only because D-04 logs metadata only and the email goes to Tim.) |
| copy.checkbox-label | D-07 collaboration checkbox label (UI-SPEC L440) | `I'd like to talk about working together` (avoids the substrings name/email/message) |
| copy.field-errors | Six inline field errors, cause plus fix (UI-SPEC L442) | Name empty: `Enter your name.` Email empty: `Enter your email address.` Email invalid: `Enter a full email address, with an @ and a domain.` Message empty: `Write a message.` Too short: `Write at least 10 characters (now {n}).` Too long: `Shorten the message to 2,000 characters (now {formatCount(n)}).` (replace `Name is required` / `Invalid email address` / `Message must be at least 10 characters`) |
| copy.summary-title | Error summary title (UI-SPEC L443) | `Check 1 field` / `Check {n} fields` |
| copy.fail-send | Send failed / server error box (UI-SPEC L445) | title `Couldn't send.`; body "Your message is still here. Try again, or email me at {email}."; button `Retry` (name `Retry sending`) |
| copy.fail-network | Network / timeout box (UI-SPEC L446) | title `Couldn't reach the server.`; body "Check your connection. Your message is still here. Try again, or email me at {email}."; `Retry` |
| copy.fail-429 | Rate limited (429) box (UI-SPEC L447) | title `Too many attempts.`; body "This connection has sent too many entries in the last hour. Try again in {m} minutes, or email me at {email}." (`{m}` = ceil(`Retry-After` / 60), minimum 1, `1 minute` singular; header missing → "Try again later, or email me at {email}.") |
| copy.fail-403 | Origin rejected (403) box (UI-SPEC L448) | title `Couldn't verify this page.`; body "Copy your message, reload the page and send it again, or email me at {email}." |
| copy.panel-h2 | Direct-contact panel h2 (UI-SPEC L450) | `Direct contact` |

Note for A: the UI-SPEC checker flagged (non-blocking, UI-SPEC L669) that the visible labels `Retry` and `Copy` are verb-only; their accessible names carry the noun (`Retry sending`, `Copy email address`). If Tim wants visible nouns too, say so with copy.fail-send.

---

## B. Location (D-01)

Shown in the Direct-contact panel as `{lat} N · {lon} E · Zürich`, 2 decimals, about 1 km (UI-SPEC L450, CONTEXT L54-56).
If not supplied: the Location row is left out. No "Switzerland", no unconfirmed figure (UI-SPEC L469).

| Key | Item (source) | Proposed text or options |
|-----|---------------|--------------------------|
| geo.location | Zürich reference point (RESEARCH L695, L699) | `47.37 N · 8.54 E · Zürich` · source: Wikipedia "Zurich" infobox, "47°22′28″N 08°32′28″E" = 47.37444 N 8.54111 E, rounded to 2 decimals (fetched 2026-11-02). Confirm, give other figures (2 decimals at most), or decline. |

---

## C. Edge-page copy

Locked strings around these stay as they are: 404 kicker `Error 404 · Page not found` and h1 `You've left the marked trail` (D-10), error h1 `Something went wrong`, offline kicker `Offline`, buttons **Go to the homepage** and **Try again** (UI-SPEC L431-432, L451-453).
If not supplied: a Draft-only element is left out (UI-SPEC L470).

| Key | Item (source) | Proposed text or options |
|-----|---------------|--------------------------|
| copy.404-body | 404 body sentence (UI-SPEC L451) | "There's no page at this address; the link may be mistyped or out of date." |
| copy.404-photo | 404 for a missing photograph (UI-SPEC L451) | "No photograph at this address." + `All photographs` |
| copy.404-project | 404 for a missing project (UI-SPEC L451) | "No project at this address." + `All routes` |
| copy.error-report | New link on error / global-error, goes to `/contact` (UI-SPEC L452) | `Report this error` |
| copy.offline-h1 | Offline h1, replaces `You're Offline` (UI-SPEC L453) | `You're offline` |
| copy.offline-body | Offline body (UI-SPEC L453) | "This page needs a connection and reloads by itself when you're back online." |
| copy.offline-h2 | Offline saved-pages heading (UI-SPEC L453) | `Saved on this device` |
| copy.offline-empty | Offline empty list (UI-SPEC L453) | "No pages are saved on this device yet." |
| copy.offline-unsupported | Offline, browser cannot list the cache (UI-SPEC L453) | "This browser can't list saved pages." |

---

## D. Metadata and OG alt text

Third person, title template `%s · Tim Lui` (UI-SPEC L355-357). `/`, `/projects/[slug]`, `/offline` and 404 keep their inherited values and are not asked here.
If not supplied: the route keeps its current metadata.

| Key | Item (source) | Proposed text or options |
|-----|---------------|--------------------------|
| meta.photos | `/photos` (UI-SPEC L360) | title `Photographs` · description "Landscape photographs from around Zermatt, each placed on the terrain where Tim took it." |
| meta.photo-slug | `/photos/[slug]`, derived per photo (UI-SPEC L361) | title `{title}` · description "{title}: a photograph by Tim Lui from {short place} at {altitude}[ approx.], {Mon YYYY \| YYYY}." |
| meta.projects | `/projects` (UI-SPEC L362) | title `Engineering` · description "What Tim builds: box, a command-line toolkit for PowerShell, and coin-flip, a fair 3D coin toss for Android." |
| meta.roadmap | `/roadmap` (UI-SPEC L364) | title `Roadmap` · description "What Tim has finished, is working on and plans next for this site, box and coin-flip." |
| meta.contact | `/contact` (UI-SPEC L365) | title `Contact` · description "Write to Tim Lui. Messages go straight to his inbox, and he usually replies within a few days." |
| og.alt-default | Default OG image alt (UI-SPEC L371) | `Tim Lui, developer and photographer, over a contour map of the Matterhorn` |
| og.alt-photo | Photo OG image alt (UI-SPEC L372) | `{title}, a photograph by Tim Lui. {short place}, {altitude}[ approx.]` |
| og.alt-project | Project OG image alt (UI-SPEC L373) | `{name}: {pitch}` |

---

## E. D-24 HEADS sentence and route log

| Key | Item (source) | Proposed text or options |
|-----|---------------|--------------------------|
| copy.heads-sentence | Coin-flip clip figcaption addition (UI-SPEC L458; CONTEXT L177, L229) | Current approved description (`data/projects.ts:222`): "A coin lies flat on a dark screen. About a second and a half in, it is flipped: it rises toward the viewer, turns over several times, then drops back and lands flat. It comes to rest face up, and the word HEADS appears below it." · Proposed appended sentence: "The coin lands heads." |
| log.phase11 | Route log, 11-08 Q3 (CONTEXT L44; RESEARCH L766) | Current (`data/roadmap.ts:50-51, 95`): Phase 11 `in-progress`, no completedAt; Phase 12 `planned`; `surveyedAt` `2026-11-01` → Proposed: Phase 11 `completed`, completedAt `2026-11-02`; Phase 12 `in-progress`; `surveyedAt` `2026-11-02` |

Note for copy.heads-sentence: the native video controls hide the HEADS label on the poster (D-24); the sentence puts the result in text. The approved description already ends with "the word HEADS appears below it", so Tim may judge the extra sentence redundant.
If not supplied: the figcaption stays as approved and the item stays open with Tim's reason; `/roadmap` keeps its current values (UI-SPEC L471-472).

---

## F. UI-SPEC defaults to confirm (#1-#14)

Source: UI-SPEC L646-663. Answer `default` or `alternative` per row ("F: defaults" picks every default).

| Key | Item (source) | Proposed text or options |
|-----|---------------|--------------------------|
| default.1 | Contact background (UI-SPEC L650) | Default: Contact on plain `surface` · Alternative: A quiet contour band behind the header band (adds a third contour use on the page with the footer) |
| default.2 | Contact DOM order (UI-SPEC L651) | Default: DOM order form → panel; panel `order-first` below 1024 · Alternative: DOM panel → form (keyboard reaches the email before the form at every width; desktop Tab order then runs right column first) |
| default.3 | Copy-button failure (UI-SPEC L652) | Default: Copy failure: select the address silently · Alternative: Hide the Copy button where `navigator.clipboard` is missing (needs a post-hydration render, a CLS risk) |
| default.4 | Contact heading pair (UI-SPEC L653) | Default: Kicker `Summit register` + h1 `Contact` · Alternative: h1 `Summit register` (stronger metaphor, differs from the nav label) |
| default.5 | Error announcement (UI-SPEC L654) | Default: Inline errors without a live role; summary `role="alert"` + focus · Alternative: `role="alert"` on each inline error (announces on blur, noisier) |
| default.6 | Error copy style (UI-SPEC L655) | Default: Error copy rewritten to cause + fix (`Enter your name.`) · Alternative: Keep the v1 strings (`Name is required`), so fewer test rewrites |
| default.7 | Edge-page art (UI-SPEC L656) | Default: Edge art: square sheet, max 448 px · Alternative: A full-width band above the text (art first on phones, pushes the h1 down) |
| default.8 | OG photo layout (UI-SPEC L657) | Default: OG photo: contain-fit in a 768 slot with mats · Alternative: Full-bleed photo 945 × 630 with a 255 px plate (bigger photo, plate text too narrow for "Gornerschlucht" at 32 px) |
| default.9 | HEADS fix approach (UI-SPEC L658) | Default: HEADS fix via a figcaption sentence · Alternative: Re-crop or pad the poster above the control bar |
| default.10 | Hero scrim breakpoint (UI-SPEC L659) | Default: Hero scrim: amend the 09 spec to `lg:` · Alternative: Change the code to `md:` (Home 768 re-baseline) |
| default.11 | Summit dark wedge (UI-SPEC L660) | Default: Summit dark wedge: close as terrain · Alternative: Tune `SUMMIT_LIFT_M` / pull-back (3D re-check, no baseline effect) |
| default.12 | Rail tick contrast 4.81:1 (UI-SPEC L661) | Default: Rail tick 4.81:1: accept, B8 keeps the floor · Alternative: Widen the rail scrim over the label run |
| default.13 | Primary CTA casing (UI-SPEC L662) | Default: `Send Message` kept exactly · Alternative: `Send message` (sentence case; the e2e regex is case-insensitive) |
| default.14 | Honeypot field (UI-SPEC L663) | Default: Honeypot `trail_note`, label `Leave this field empty` · Alternative: Any name that avoids autofill heuristics and the name/email/message substrings |

---

## G. Open decisions

| Key | Item (source) | Proposed text or options |
|-----|---------------|--------------------------|
| sw.reload-once | One reload after a deploy (RESEARCH L772-773) | Proposal: reload once on `controllerchange` only when no form field is dirty; otherwise make the next in-site navigation a hard navigation. Answer yes (12-08 builds the guarded reload) or no (the `controllerchange` handler stays silent). |
| docs.stale-refs | Stale references outside the README (RESEARCH L649, L770-771) | `.github/copilot-instructions.md:88` still describes `GlassmorphismNav.tsx`; `project_concept/*.md` still names Header/Footer. Proposal: fix the Copilot notes in the README pass (12-22). `project_concept/` is gitignored local material (`.gitignore:90`) and stays unchanged either way. Answer fix or leave (with a reason). |
| vercel.plan | Vercel plan, for Skew Protection (RESEARCH L764-765) | Hobby, Pro or Enterprise? Informational: Skew Protection is Pro/Enterprise; the SW reload guard works either way. 12-24 carries the answer into the UAT checklist. |
| ci.push | Plain pushes of `ci/12-NN` branches (plan 12-01 key index) | May the executor push plain (never force) `ci/12-NN` branches for this phase's CI and re-baseline runs? Answer yes or no. Without it, the round plans (12-11, 12-19, 12-23) stop for Tim to push each ci branch himself. |

---

## H. For the record

| Key | Item (source) | Proposed text or options |
|-----|---------------|--------------------------|
| info.csp | CSP review (plan 12-01 key index; CONTEXT "CSP review") | 12-02 drops the GitHub raw-content origin (locked) and keeps `'unsafe-eval'` only under `next dev` (planner call, flagged at plan review). No answer needed; reply "keep unsafe-eval" to veto. |

---

## Answers (verbatim)

Tim, 2026-11-02:

A: approve all, lead option 2; B: confirm; C: approve; D: approve; E: heads skip, log ok; F: defaults; G: reload-once yes, stale refs fix, Hobby, ci push yes; H: ok

## Resolved values

One line per packet key (52). `supplied` rows carry the final value; the one `not supplied` row carries its UI-SPEC Content Gates fallback.

| Key | Status | Value |
|-----|--------|-------|
| copy.contact-kicker | supplied | `Summit register` |
| copy.contact-h1 | supplied | `Contact` |
| copy.contact-intro | supplied | "Write a line in the register. I read every entry and reply by email." |
| copy.form-h2 | supplied | `Sign the register` |
| copy.form-lead | supplied | "Your name, your email and a message." (option 2, no claim) |
| copy.checkbox-label | supplied | `I'd like to talk about working together` |
| copy.field-errors | supplied | Name empty: `Enter your name.` Email empty: `Enter your email address.` Email invalid: `Enter a full email address, with an @ and a domain.` Message empty: `Write a message.` Too short: `Write at least 10 characters (now {n}).` Too long: `Shorten the message to 2,000 characters (now {formatCount(n)}).` |
| copy.summary-title | supplied | `Check 1 field` / `Check {n} fields` |
| copy.fail-send | supplied | title `Couldn't send.`; body "Your message is still here. Try again, or email me at {email}."; button `Retry` (name `Retry sending`) |
| copy.fail-network | supplied | title `Couldn't reach the server.`; body "Check your connection. Your message is still here. Try again, or email me at {email}."; `Retry` |
| copy.fail-429 | supplied | title `Too many attempts.`; body "This connection has sent too many entries in the last hour. Try again in {m} minutes, or email me at {email}." (`{m}` = ceil(`Retry-After` / 60), minimum 1, `1 minute` singular; header missing → "Try again later, or email me at {email}.") |
| copy.fail-403 | supplied | title `Couldn't verify this page.`; body "Copy your message, reload the page and send it again, or email me at {email}." |
| copy.panel-h2 | supplied | `Direct contact` |
| geo.location | supplied | `47.37 N · 8.54 E · Zürich` (source: Wikipedia "Zurich" infobox, 47.37444 N 8.54111 E, rounded to 2 decimals) |
| copy.404-body | supplied | "There's no page at this address; the link may be mistyped or out of date." |
| copy.404-photo | supplied | "No photograph at this address." + `All photographs` |
| copy.404-project | supplied | "No project at this address." + `All routes` |
| copy.error-report | supplied | `Report this error` |
| copy.offline-h1 | supplied | `You're offline` |
| copy.offline-body | supplied | "This page needs a connection and reloads by itself when you're back online." |
| copy.offline-h2 | supplied | `Saved on this device` |
| copy.offline-empty | supplied | "No pages are saved on this device yet." |
| copy.offline-unsupported | supplied | "This browser can't list saved pages." |
| meta.photos | supplied | title `Photographs` · description "Landscape photographs from around Zermatt, each placed on the terrain where Tim took it." |
| meta.photo-slug | supplied | title `{title}` · description "{title}: a photograph by Tim Lui from {short place} at {altitude}[ approx.], {Mon YYYY \| YYYY}." |
| meta.projects | supplied | title `Engineering` · description "What Tim builds: box, a command-line toolkit for PowerShell, and coin-flip, a fair 3D coin toss for Android." |
| meta.roadmap | supplied | title `Roadmap` · description "What Tim has finished, is working on and plans next for this site, box and coin-flip." |
| meta.contact | supplied | title `Contact` · description "Write to Tim Lui. Messages go straight to his inbox, and he usually replies within a few days." |
| og.alt-default | supplied | `Tim Lui, developer and photographer, over a contour map of the Matterhorn` |
| og.alt-photo | supplied | `{title}, a photograph by Tim Lui. {short place}, {altitude}[ approx.]` |
| og.alt-project | supplied | `{name}: {pitch}` |
| copy.heads-sentence | not supplied | The figcaption stays as approved; the item stays open with Tim's reason (Tim's reply: "heads skip"; no further reason given) |
| log.phase11 | supplied | Phase 11 `completed`, completedAt `2026-11-02`; Phase 12 `in-progress`; `surveyedAt` `2026-11-02` |
| default.1 | supplied | Default: Contact on plain `surface` |
| default.2 | supplied | Default: DOM order form → panel; panel `order-first` below 1024 |
| default.3 | supplied | Default: Copy failure: select the address silently |
| default.4 | supplied | Default: Kicker `Summit register` + h1 `Contact` |
| default.5 | supplied | Default: Inline errors without a live role; summary `role="alert"` + focus |
| default.6 | supplied | Default: Error copy rewritten to cause + fix (`Enter your name.`) |
| default.7 | supplied | Default: Edge art: square sheet, max 448 px |
| default.8 | supplied | Default: OG photo: contain-fit in a 768 slot with mats |
| default.9 | supplied | Default: HEADS fix via a figcaption sentence |
| default.10 | supplied | Default: Hero scrim: amend the 09 spec to `lg:` |
| default.11 | supplied | Default: Summit dark wedge: close as terrain |
| default.12 | supplied | Default: Rail tick 4.81:1: accept, B8 keeps the floor |
| default.13 | supplied | Default: `Send Message` kept exactly |
| default.14 | supplied | Default: Honeypot `trail_note`, label `Leave this field empty` |
| sw.reload-once | supplied | yes: reload once on `controllerchange` only when no form field is dirty; otherwise the next in-site navigation is a hard navigation (12-08 builds the guarded reload) |
| docs.stale-refs | supplied | fix: update `.github/copilot-instructions.md` in the README pass (12-22); `project_concept/` is gitignored (`.gitignore:90`) and stays unchanged |
| vercel.plan | supplied | Hobby (Skew Protection is Pro/Enterprise, so not available; the SW reload guard works either way) |
| ci.push | supplied | yes: plain pushes only, never force, of `ci/12-NN` branches for this phase's CI and re-baseline runs |
| info.csp | supplied | acknowledged, no veto: 12-02 drops the GitHub raw-content origin and keeps `'unsafe-eval'` only under `next dev` |
