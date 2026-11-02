---
schema_version: 1
wave: 4
outcome: verified
reason: ok
checked: 17
passed: 15
failed: 0
needs_review: 2
---

# Phase 12 wave 4 live-DOM verification

Target: `next start` at http://localhost:3000 (HEAD 8fc975b). Browser: claude-in-chrome. Server HTML was fetched same-origin and parsed. For /contact the hydrated DOM was also checked, after one empty submit.

## 12-12 404 edge layout
- 12-12 404 status and title: passed. All three misses return 404 with `Page not found · Tim Lui`.
- 12-12 Kicker, h1 and context: passed. Generic miss reads `Error 404 · Page not found` / h1 `You've left the marked trail` / the approved copy.404-body sentence.
- 12-12 Section copy on photo miss: passed. Shows `No photograph at this address.` with links Go to the homepage -> /, `All photographs` -> /photos, Engineering -> /projects.
- 12-12 Section copy on project miss: passed. Shows `No project at this address.` with links Go to the homepage -> /, `All routes` -> /projects, Photographs -> /photos.
- 12-12 "Section link first": needs_review. In DOM order "Go to the homepage" comes first and the section link second, ahead of the cross-section link. Someone needs to decide whether "first" means first among the secondary links (true) or before the homepage CTA (false).
- 12-12 Art is aria-hidden: passed. Two decorative wrapper divs inside main carry `aria-hidden="true"`. The inline svg sits inside them.
- 12-12 Exactly one `<main>`: passed on all three misses.
- 12-12 Slug absent from outerHTML: needs_review. Passed for the /photos and /projects misses (slug not in the response HTML). On the generic miss `/no-such-page-q7x2`, the slug does appear once, in Next's RSC flight payload (`self.__next_f.push(... "c":["","no-such-page-q7x2"] ...)`). It is not in the rendered markup. Someone needs to decide whether 12-02's follow-up covers the generic catch-all route.

## 12-13 Contact
- 12-13 Server-rendered: passed. The raw /contact response already contains h1 `Contact` and the form.
- 12-13 Meta: passed. Title is `Contact · Tim Lui` and the description matches meta.contact.
- 12-13 Header copy: passed. Kicker `Summit register`, h1 `Contact`, and the approved intro.
- 12-13 Form card: passed. h2 `Sign the register` and lead `Your name, your email and a message.`
- 12-13 Labels and checkbox: passed. Labels are Name/Email/Message (each with ` *`). There is exactly one checkbox, labelled `I'd like to talk about working together`.
- 12-13 Honeypot: passed. `input[name=trail_note]` has tabindex `-1`. aria-hidden="true" sits on its wrapper, not the input itself, which is equivalent for AT.
- 12-13 Button: passed. One `Send Message` button, type=submit.
- 12-13 Empty submit: passed. URL is unchanged and nothing was sent. name, email and message have aria-invalid=true, with errors `Error: Enter your name.`, `Error: Enter your email address.` and `Error: Write a message.` The `Error: ` prefix is in `.sr-only`. Focus moved to `name` (first invalid).

## 12-14 Per-slug OG cards (judged against SUMMARY: rendered on request)
- 12-14 Own og:image, alt and image response: passed.
  - matterhorn-from-zermatt: `/photos/matterhorn-from-zermatt/opengraph-image-126xvw/card`, alt `Matterhorn from Zermatt, a photograph by Tim Lui. Zermatt, 1,617 m`.
  - box: `/projects/box/opengraph-image-umay0l/card`, alt `box: Twenty-three command-line tools in one Rust binary, ...`.
  - coin-flip: `/projects/coin-flip/opengraph-image-umay0l/card`, alt `coin-flip: A 3D coin toss for Android ...`.
  - None of them is /opengraph-image. twitter:image equals og:image on all three. Each card fetch returns `200 image/png`. The absolute URLs use the metadataBase host (vercel.app). Only the path was fetched locally.

## 12-25
- Data only. No DOM-observable criterion in this wave (the location is displayed by 12-16). Not counted.

## Orchestrator note on the two needs_review rows

- 12-12 link order: 12-UI-SPEC.md line 284-285 specifies the primary **Go to the homepage** first, then the section text link (All photographs / All routes) replacing its generic counterpart, then the other section. The observed order matches the spec.
- 12-12 generic-miss slug in flight data: out of scope by Tim's decision of 2026-11-02 ("Leave as is (Recommended)" for every 404 other than unknown /photos/<slug> and /projects/<slug>; recorded in `.planning/debug/12-slug-script-data.md`).
