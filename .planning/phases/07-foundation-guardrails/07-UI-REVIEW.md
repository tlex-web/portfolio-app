# Phase 07 — UI Review

**Audited:** 2026-10-24
**Baseline:** 07-UI-SPEC.md (approved 2026-10-10), cross-checked with ui-ux-pro-max rules
**Screenshots:** not captured (no dev server on 3000, 5173 or 8080); code-only audit
**Interaction captures:** off (workflow.ui_interaction_capture is false). Interaction findings are code-derived.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Shell, 404, error and footer copy match the contract. Contact keeps `font-bold` and a stale "I'd love to hear from you!" |
| 2. Visuals | 3/4 | Shell is coherent and accessible. Dead v1 `Footer.tsx` and `Header.tsx` still ship (the footer contains a heart emoji) |
| 3. Color | 3/4 | No stock palette classes, no `dark:`, no hex in new shell code. 9 legacy-alias files remain (deferred) |
| 4. Typography | 3/4 | Base h1-h4 and the type stack are in place. Contact bypasses the weight and size rules |
| 5. Spacing | 3/4 | Shell is on the 4 px scale with 44/48 px targets. `mt-0.5` half steps and 3 px-type offsets in FeedbackForm |
| 6. Experience Design | 3/4 | Menu closes on all six triggers, reduced motion handled, focus managed. Contact entrance motion uses raw values |

**Overall: 18/24**

Scores are capped at 3 because no capture or interaction run could confirm any pillar as 4.

---

## Top 3 Priority Fixes

1. **Contact page still uses `font-bold` / `text-6xl` / `text-2xl` on h1, h2, h3** (`app/(site)/contact/page.tsx:40,61,84,98,114`). This breaks the DSGN-07 rule (weights 400/600 only, sizes from the 4-token scale) on a page Phase 7 explicitly touched. Replace with the base styles (drop the size and weight utilities, or use `text-display` / `text-heading` and `font-semibold`).
2. **Dead v1 `components/Footer.tsx` and `components/Header.tsx` (and `GlassmorphismNav.tsx`) still exist with zero consumers.** `Footer.tsx:186` still contains the heart emoji that DSGN-10 says must be gone, and a repo-wide emoji grep will flag it. Delete the unused files (and their tests) or confirm the guard excludes them.
3. **Contact motion bypasses the motion tokens** (`page.tsx:55-57,76-78`, raw `duration: 0.6`, `delay: 0.1/0.2/0.3`, `y: 30` and `y: 20`). Use `DURATION` / `EASING` from `lib/animations.ts`, and confirm `MotionConfig reducedMotion="user"` neutralises the translate for reduced-motion visitors.

Minor: replace `mt-0.5` in `components/FeedbackForm.tsx:212,221` with a scale value or `items-center`; align the Contact info cards' `font-bold` h3 to `font-semibold`.

---

## Known, deferred (not scored as Phase 07 failures)

| Item | Target phase |
|------|--------------|
| Hero3DMountain badge contrast (1.42-2.17:1) | Phase 9 |
| Lost hover background on `bg-snow-50 hover:bg-snow-100` (Home, Hero) | Phase 9 |
| 37 utility-styled headings in 20 files carrying `font-bold`, glow and v1 colours | Phases 9-12 |
| Roadmap card header overflow at 375 px (Target Release pill) | Phase 11 |
| HologramTerminal inline colours | Phase 9 / 12 |
| ImageDetailModal bg-opacity classes | Phase 10 |
| Home horizontal overflow before whileInView settles | Phase 9 |
| `/projects/[slug]` notFound has no server-rendered 404 HTML | Phase 12 (EDGE-01) |

Note: the Contact `font-bold` finding above is NOT on this list. Contact is a Phase 7 deliverable (SHELL-06), so its heading classes are scored. Home and Hero headings are covered by the 37-heading deferral.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)
- PASS: 404 (`components/site/NotFoundBody.tsx`) matches the contract word for word: `Error 404`, `Page not found`, body, `Go to the homepage`, then text links to Photographs and Engineering.
- PASS: error copy (`ErrorBody.tsx:8-11,41-62`) matches both variants and has no "!" and no exception detail. Skip link text and footer copy (`SiteFooter.tsx:25-41`) match.
- PASS: the identity strings now come from `site.name` / `site.role` (`Hero3DMountain.tsx:64,72`), with no "My Portfolio".
- WARNING: Contact lead copy `I'd love to hear from you!` (`contact/page.tsx:44`) keeps an exclamation mark. The voice rule bans them in shell copy. Contact strings are contract-frozen for tests, so this is minor.
- WARNING: the 404 text links have no hover state change beyond the browser default (`NotFoundBody.tsx:29-40`), whereas `accent-hover` exists.

### Pillar 2: Visuals (3/4)
- PASS: one primary action per view (404, error). The sticky solid nav, flat footer and left-aligned edge pages follow the survey-map direction. Icon-beside-text uses `aria-hidden` Phosphor `dist/ssr` icons at 20/24 px.
- PASS: the wordmark has the accessible name `Tim Lui, home`. The menu button's visible name is "Menu" in both states.
- WARNING: `components/Footer.tsx`, `Header.tsx` and `GlassmorphismNav.tsx` are unreferenced v1 shells. The footer carries the heart emoji (`Footer.tsx:186`) and v1 aliases. They are dead code but contradict the DSGN-10 "no emoji anywhere" claim.
- WARNING: Contact still renders `AnimatedGradientMesh` behind the panels. This is acceptable per the spec (solid panels guarantee contrast), but unverified visually.

### Pillar 3: Color (3/4)
- PASS: grep for stock palette classes and `dark:` across `app/ components/ lib/ data/` (non-test) finds zero. Zero `#hex`, `rgb()` or `white`/`black` utilities in `components/site`, `components/providers`, `app/not-found.tsx` and `app/global-error.tsx`.
- PASS: accent is limited to the primary buttons, skip link, current-page bar, prose links and the checkbox. The nav and footer links use `ink-muted` / `ink`. Success/danger boxes pair colour with icons (`FeedbackForm.tsx:212,221`).
- WARNING: 9 files still use v1 alias classes (`text-snow-*`, `bg-alpine-*` and similar). That is expected under the L3 alias plan, with removal in Phase 12.

### Pillar 4: Typography (3/4)
- PASS: `--text-heading` and `--text-display` tokens exist (`globals.css:58-60`). Edge pages use the base h1 (`text-balance`) with mono only for the status eyebrow. The footer year is `tabular-nums`.
- WARNING: Contact bypasses the weights and sizes: `font-bold` x5 (`contact/page.tsx:40,61,84,98,114`), plus `text-6xl` and `text-2xl`. Repo-wide there are 85 `font-bold|font-medium` uses in non-test source, mostly deferred pages.
- WARNING: the wordmark uses `tracking-[-0.01em]` as an arbitrary value, as the spec itself prescribes. Acceptable.

### Pillar 5: Spacing (3/4)
- PASS: shell on the 4 px scale (`py-12`, `gap-8`, `pt-16 pb-16`, `gap-4`, `gap-x-6`). Targets are `min-h-11` (nav, footer, buttons) and `min-h-12` (menu rows) with `gap-2` between. Container, gutters and `max-w-prose` match.
- WARNING: `mt-0.5` half-step in `FeedbackForm.tsx:212,221` (Phase 7 restyled code; banned by spec).
- WARNING: the indicator bars use `h-0.5` / `w-0.5` (2 px). That is a stroke rather than spacing, so acceptable.
- WARNING: Contact `py-20` hero padding is off the declared scale (80 px is not a token).

### Pillar 6: Experience Design (3/4)
- PASS: mobile menu (`SiteNav.tsx:64-98`) closes on route change, Escape (with focus return), second press, outside pointer, focusout and viewport growth. The panel is `hidden` when closed, uses CSS motion with `motion-reduce:transition-none`, and the exit is faster than the entry via tokens.
- PASS: ErrorBody moves focus to the h1 on mount. The 404 does not. `global-error` uses the static nav variant with no router dependence. Skip link reaches `main` with `tabIndex=-1`. Global focus-visible, scrollbar and `scrollbar-gutter` rules are present in `globals.css`.
- PASS: Contact form has disabled and pending states, `aria-invalid`, `aria-describedby` and `role="alert"` errors.
- WARNING: Contact entrance animation uses raw durations and delays instead of motion tokens (`contact/page.tsx:55-57,76-78`).
- WARNING: `min-h-screen` on Contact (`page.tsx:26`) uses `100vh` instead of `dvh` on mobile.
- WARNING: no screenshots or interaction captures, so focus-ring visibility, 375 px wrapping and the menu transition are unverified visually.

---

## Files Audited
`07-UI-SPEC.md`, `.planning/STATE.md` (deferred list), `components/site/{SiteNav,SiteFooter,SkipLink,ErrorBody,NotFoundBody,SiteChrome}.tsx`, `app/not-found.tsx`, `app/global-error.tsx`, `app/(site)/error.tsx`, `app/(site)/contact/page.tsx`, `components/FeedbackForm.tsx`, `components/Hero3DMountain.tsx` (identity lines), `app/globals.css` (selected rules), `components/Footer.tsx` (emoji line). Registry audit: not applicable (no `components.json`).

---

## Orchestrator Note (execute-phase 07, 2026-10-24)

Spot-checked against the code at `c943aa0`. The cited lines are accurate. Two classifications are adjusted for downstream readers; the scores are unchanged:

- **Top fix 1 (Contact heading weights and sizes)** is already on the deferred list. `.planning/STATE.md` Blockers/Concerns "[Phase 9-12, from 07-11] 37 utility-styled headings in 20 files" names `/contact` explicitly. 07-24 (SHELL-06) promised only the interim contrast fix, and the Contact redesign comes in a later phase.
- **Top fix 2 (dead v1 shells, `Footer.tsx` emoji)** is an exemption by design. `scripts/guards/check-palette.mjs` exempts `LEGACY_DEAD_FILES` (`scripts/guards/lib/legacy-dead-files.mjs`) from the emoji rule only while nothing imports them (`assertNoImporters`). The files are scheduled for dead-code removal; they are not a missed DSGN-10 case.
- **Top fix 3 (raw Contact motion values)** and the minor items (`mt-0.5`, `py-20`, `min-h-screen`, the exclamation mark) stand as advisory findings.
