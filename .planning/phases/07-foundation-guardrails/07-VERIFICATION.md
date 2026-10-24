---
phase: 07-foundation-guardrails
verified: 2026-10-24T13:30:00Z
status: gaps_found
score: 3/5 must-haves verified
covered_files:
  - ".github/dependabot.yml"
  - ".github/workflows/ci.yml"
  - ".github/workflows/visual-baselines.yml"
  - ".planning/phases/07-foundation-guardrails/07-01-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-01-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-02-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-02-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-03-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-03-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-04-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-04-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-05-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-05-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-06-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-06-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-07-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-07-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-08-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-08-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-09-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-09-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-10-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-10-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-11-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-11-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-12-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-12-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-13-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-13-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-14-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-14-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-15-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-15-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-16-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-16-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-17-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-17-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-18-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-18-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-19-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-19-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-20-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-20-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-21-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-21-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-22-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-22-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-23-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-23-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-24-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-24-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-25-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-25-SUMMARY.md"
  - ".planning/phases/07-foundation-guardrails/07-26-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-26-SUMMARY.md"
  - "app/(site)/layout.tsx"
  - "app/global-error.tsx"
  - "app/globals.css"
  - "app/layout.tsx"
  - "app/not-found.tsx"
  - "components/Hero3DMountain.tsx"
  - "components/site/SiteChrome.tsx"
  - "components/site/SiteFooter.tsx"
  - "components/site/SiteNav.tsx"
  - "components/site/SkipLink.tsx"
  - "data/site.ts"
  - "e2e/shell.spec.ts"
  - "e2e/visual/routes.spec.ts"
  - "eslint.config.mjs"
  - "package-lock.json"
  - "package.json"
  - "playwright.config.ts"
  - "scripts/guards/check-contrast.mjs"
  - "scripts/guards/check-install-parity.mjs"
  - "scripts/guards/check-palette.mjs"
  - "scripts/guards/test-count.mjs"
  - "vercel.json"
covered_digest: "v3:sha256:2e2c99974df4d520e535bf4340e9f61fd7d29fc226ffebe958ff39b69a9c4ede"
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "On every page a keyboard user finds one skip link, exactly one primary navigation with a visible current-page indicator, and exactly one main landmark (ROADMAP SC4)"
    status: partial
    reason: "Navigation, current-page indicator and main landmark are exactly one on every route (e2e/shell.spec.ts, CI green). The skip link is not: Home renders the shell SkipLink (#main-content) AND the v1 hero's own sr-only 'Skip to content' link (#home-content), so a keyboard user meets two skip links on that page. shell.spec.ts only asserts the first Tab stop, never the count, so nothing catches it. Code review IN-04 recorded it as info/open; the roadmap wording is 'one skip link'."
    artifacts:
      - path: "components/Hero3DMountain.tsx"
        issue: "lines 159-165: second skip link with v1 classes (focus:bg-frost-600 focus:text-snow-50), target #home-content"
    missing:
      - "Remove the hero's 'Skip to content' link (or fold it into the shell link), and add a count assertion (exactly one link named /skip to/i) to the Shell landmarks test so a second one fails"
      - "Alternative: Tim accepts it as deferred to the Phase 9 hero rebuild (then record it as an override or deferred item)"
human_verification:
  - test: "Confirm Vercel builds on Node 24.x with npm ci (GUARD-01, 07-USER-SETUP.md item 1)"
    expected: "Vercel -> Project -> Deployments -> latest -> Build Logs shows Node 24.x and the install step runs npm ci. If it still shows Node 20, set Settings -> Build and Deployment -> Node.js Version to 24.x"
    why_human: "Vercel project settings live outside the repo. vercel.json installCommand is 'npm ci' and package.json engines.node is '24.x' (both verified here), but no committed file can prove the live project honours them. REQUIREMENTS.md still lists GUARD-01 as Pending for exactly this reason"
  - test: "Ratify the three documented zero-diff exceptions for ROADMAP SC2 (DEPS-03, DEPS-04, DEPS-05)"
    expected: "Tim confirms in his own words that re-baselining (a) 6 home/*-scroll-50 shots in 73880a2 (motion 14 renders the hero 'Scroll to explore' indicator at opacity 0 where motion 12 left a stale faint one), (b) 6 offline/*-reduced shots in e72c661 (Next 16.2.6 SWC dropped a JSX space, fixed in 16.4.0), and (c) 6 contact/*-reduced shots in fdd2652 (Chromium 156 textarea resize-grabber, 36 px per shot) are acceptable. Then add the overrides block from the SC2 row to this file"
    why_human: "SC2 says 'zero visual diff'. All three commits re-baselined PNGs. Each commit message and SUMMARY records Tim's approval, but this verifier cannot confirm his literal reply, and whether an intended visual change is acceptable is a human judgement. DEPS-05 is permitted by the roadmap build order ('re-baseline only if Chromium rendering forces it'); DEPS-03 and DEPS-04 are not covered by that carve-out"
  - test: "Require Visual Regression, Lint and Type Check and Unit Tests as status checks on main (07-USER-SETUP.md item 2)"
    expected: "GitHub -> Settings -> Branches/Rulesets -> main lists the three jobs as Required; a PR's merge box shows them as Required"
    why_human: "Repository settings are not in the tree. Without this the CI guardrails in SC1 fail a run but do not block a merge"
  - test: "Keyboard-only smoke pass of the shell in Firefox and WebKit (07-VALIDATION.md manual row, pending)"
    expected: "Tab reaches the skip link first, then Primary nav, mobile menu opens/closes with Escape and route change, current page is visibly marked"
    why_human: "WebKit is skipped in CI (Playwright Linux WebKit issues). Chromium and Firefox are covered by shell.spec.ts"
  - test: "Visual sign-off of the final dark shell on a real device"
    expected: "Focus ring visibility, 375 px wrapping, mobile menu transition and the Contact page over the (still present) AnimatedGradientMesh look right"
    why_human: "07-UI-REVIEW.md was a code-only audit (no screenshots); pixel baselines prove stability, not taste"
---

# Phase 7: Foundation & Guardrails Verification Report

**Phase Goal:** Every page renders inside one dark, token-driven site shell with Tim Lui's real identity, on upgraded dependencies, behind CI guardrails that catch visual regressions, deleted tests and off-system styling before they ship.
**Verified:** 2026-10-24T13:30:00Z
**Status:** gaps_found
**Re-verification:** No, initial verification
**Code under test:** HEAD `ec04d2a`; `git diff 4969072 HEAD -- . ':!.planning'` is empty, so the code equals the commit CI run 40045453857 tested.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Local, CI (Node 24) and Vercel installs use `npm ci`; CI holds baselines for every route in dark and light from a Linux production build; CI fails on screenshot diff, test-count drop, `dark:`/stock palette class, sub-AA token pair, jsx-a11y violation | VERIFIED (repo side; Vercel live setting is a human item) | `.node-version`=24, `engines.node`=24.x, `vercel.json installCommand: npm ci`, every `ci.yml` job runs `npm ci` + `npm ls --depth=0`. 9 routes x 3 widths reduced + 9 home scroll shots = 36 `*-visual-dark-linux.png` on disk; `playwright.config.ts` visual-dark/visual-light with `retries: 0`, `serviceWorkers: 'block'`, `threshold: 0.01`, prod build when `CI`; `visual-light` compares against the dark PNGs. Guards in `npm run lint` (re-run here, exit 0): parity, palette (dark/stock/white-black ratchet/emoji), contrast (28 pairs from `app/globals.css`), identity, selftest 55/55. `guard:tests` in the CI unit job: "jest 107 + e2e 99 = 206 (baseline 206) OK" re-run here. jsx-a11y recommended at error in `eslint.config.mjs`. CI run 40045453857: Visual Regression (72 passed), Unit, E2E (122 passed), Lint and Type Check, Build, Security Audit all success |
| 2 | motion 14.1, Next 16.4.x/React 19.3/R3F 9.8.1/drei 10.7.9 and Playwright 1.64 land as three separate commits; each passes the baseline run with zero visual diff, mid-scroll captures included | UNCERTAIN (human decision) | Three separate commits exist: `73880a2` (motion 14.1.0), `a3c2b81` (Next 16.4.0, React 19.3.0, R3F 9.8.1, drei 10.7.9; followed by fix commits `8d37032`, `e72c661` and the security release `fdeb9fe` Next 16.4.2/React 19.3.1, Next 16.4.0 was the latest at the time, the patch shipped later), `fdd2652` (Playwright 1.64.0). Installed: `npm ls` motion 14.1.0, next 16.4.2, react 19.3.1, fiber 9.8.1, drei 10.7.9, playwright 1.64.0; single `motion-dom@14.1.0`; no `framer-motion` import in source. All CI-green. **But not zero diff:** 6 home scroll-50 PNGs re-baselined in `73880a2`, 6 offline PNGs in `e72c661`, 6 contact PNGs in `fdd2652` (see human_verification) |
| 3 | Light-OS visitor sees the same dark site; tokens v2 colours; grotesk display + Inter + JetBrains Mono only for data, tabular figures; one SVG icon family, no emoji icons; thin visible scrollbar with stable gutter; motion from shared tokens that settles under reduced motion | VERIFIED | No `dark:` and no stock palette class in `app/ components/ lib/ data/` (grep, zero hits); no `@custom-variant`; `<html class="dark">` + `html { color-scheme: dark; scrollbar-gutter: stable; scrollbar-width: thin }`; `visual-light` passes against the dark PNGs in CI. Night-map OKLCH L1 + L2 semantic tokens + v1 aliases marked `@deprecated` in `app/globals.css`. `Schibsted_Grotesk` + `Inter` + `JetBrains_Mono` in `app/layout.tsx`; `e2e/design-system.spec.ts` asserts computed families, 40/44 h1, tabular mono. Only `@phosphor-icons/react/dist/ssr` allowed (ESLint ban on the root and csr entries); an Extended_Pictographic scan of `app components lib data` finds only the unimported legacy `components/Footer.tsx:186` (guard-exempt while unimported) and the (c) sign. Motion: `DURATION`/`EASING` in `lib/animations.ts` mirrored by `--duration-*`/`--ease-*`, parity pinned by `lib/__tests__/motion-tokens.test.ts` (jest, passes); `MotionConfig reducedMotion="user"` in `MotionProvider`; reduced-motion CSS block in `globals.css`; `shell.spec.ts` "Shell reduced motion" asserts 0 running animations |
| 4 | Keyboard user finds one skip link, exactly one primary nav with a visible current-page indicator, exactly one main landmark; mobile menu has >=44 px targets and closes on route change and Escape | FAILED (partial) | Verified: `SiteChrome` (mounted by `app/(site)/layout.tsx`, `app/not-found.tsx`, `app/global-error.tsx`) renders SkipLink first, one `nav[aria-label=Primary]` in one header, one `main#main-content`, one footer. `shell.spec.ts` asserts `toHaveCount(1)` for banner/nav/main/contentinfo, `aria-current="page"` and the first Tab stop on 7 routes + 5 404 paths; 44 px button and 48 px rows; Escape and route-change close. `SiteNav.test.tsx` covers all six close triggers (jest passes). CI E2E 122 passed (chromium + firefox). **Not verified:** "one skip link" is false on Home, see gap |
| 5 | Every page shows Tim Lui's name, role line and real GitHub, LinkedIn, email; no placeholder text/links; `/gradient-mesh`, `/particle-buttons`, `/transitions` 404 inside the shell and nothing links to them; Contact heading and fields pass AA for light-OS and dark-OS | VERIFIED | `data/site.ts` is the single source (name "Tim Lui", role "Developer & photographer", github.com/tlex-web, linkedin.com/in/luitim, email); `SiteNav` wordmark and `SiteFooter` read it on every route; `guard:identity` (in lint, passes) fails on `example.com`, split wordmark, `package.json` author drift. Live code contains no placeholder email or "My Portfolio" (hits only in unimported legacy `components/Footer.tsx`). The three playground routes are gone from `app/`, no source link to them; `shell.spec.ts` "Shell 404" asserts HTTP 404, no redirect, one shell, designed body for all three. `e2e/a11y-contact.spec.ts` runs axe color-contrast for dark-OS, light-OS and no-mesh with field errors and failure box, CI green |

**Score:** 3/5 truths verified (SC2 awaiting a human decision, SC4 partial failure). 0 present-but-behavior-unverified. The behavior-dependent truths (menu close triggers, reduced-motion settle, light equals dark) all have a passing behavioral test.

### Requirements Coverage

All 20 phase IDs appear in at least one PLAN `requirements:` field and in REQUIREMENTS.md; no orphans.

| Requirement | Source Plans | Status | Evidence |
|-------------|--------------|--------|----------|
| GUARD-01 | 07-01, 07-08 | NEEDS HUMAN | Repo side verified (see SC1). Live Vercel Node 24 + `npm ci` unconfirmed; REQUIREMENTS.md correctly leaves it `[ ]`/Pending |
| GUARD-02 | 07-03, 07-04 | SATISFIED | 36 dark baselines, CI Visual Regression 72 passed, light asserts dark |
| GUARD-03 | 07-01, 07-26 | SATISFIED | `test-count.mjs` ratchet 206/206, fails on drop, `.skip(`, `.only(`, in CI unit job |
| GUARD-04 | 07-16..19, 07-20 | SATISFIED | `check-palette.mjs` in lint; independent grep finds zero `dark:`/stock classes; ratchet 17 across 8 files |
| GUARD-05 | 07-20 | SATISFIED | `check-contrast.mjs` reads `app/globals.css`, 28 pairs, in lint |
| GUARD-06 | 07-02 | SATISFIED | jsx-a11y recommended at error; selftest probe |
| DEPS-03 | 07-05 | SATISFIED with caveat | motion 14.1.0 own commit; 6 PNGs re-baselined (SC2 human item) |
| DEPS-04 | 07-06, 07-07 | SATISFIED with caveat | Versions installed; 6 offline PNGs re-baselined; patch is a second commit (SC2 human item) |
| DEPS-05 | 07-08 | SATISFIED | Playwright 1.64.0 own commit, container tags equal lockfile (parity guard); Chromium-forced re-baseline allowed by roadmap |
| DSGN-05 | 07-14, 07-15, 07-20 | SATISFIED | See SC3 |
| DSGN-06 | 07-09, 07-10, 07-16..19, 07-20 | SATISFIED | Tokens v2 + deprecated aliases |
| DSGN-07 | 07-11 | SATISFIED | See SC3 |
| DSGN-08 | 07-09, 07-22 | SATISFIED | See SC3 |
| DSGN-09 | 07-12 | SATISFIED | `scrollbar-gutter: stable`, thin; `design-system.spec.ts` asserts gutter and scroll-lock header box |
| DSGN-10 | 07-13, 07-25 | SATISFIED | Phosphor only; emoji rule on in lint |
| SHELL-01 | 07-21, 07-22, 07-23 | PARTIAL | One nav/main and skip link present; Home has a second skip link (gap) |
| SHELL-02 | 07-21 | SATISFIED | See SC4 |
| SHELL-03 | 07-21, 07-22, 07-25 | SATISFIED | See SC5 |
| SHELL-05 | 07-04, 07-23 | SATISFIED | See SC5 |
| SHELL-06 | 07-24 | SATISFIED | axe AA in both schemes |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `app/(site)/layout.tsx` | `SiteChrome` | direct render of all 8 content routes | WIRED |
| `app/not-found.tsx` / `app/global-error.tsx` | `SiteChrome` | root 404 and error render the chrome themselves (static variant for global-error) | WIRED |
| `SiteNav` / `SiteFooter` | `data/site.ts` | `site.nav`, `site.links`, `site.email` | WIRED |
| `package.json` `lint` | five guards + eslint | `npm run lint` chain, re-run here exit 0 | WIRED |
| CI `unit-tests` | `guard:tests` | step "Test-count ratchet" after `jest --json` | WIRED |
| CI `visual-regression` | container `playwright:v1.64.0-noble` | tag equals lockfile (parity guard) | WIRED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Lint + all guards | `npm run lint` | exit 0, selftest 55/55 | PASS |
| Types | `npm run type-check` | exit 0 | PASS |
| Unit tests | `npx jest --silent` | 13 suites, 107 tests passed | PASS |
| Test-count ratchet | `node scripts/guards/test-count.mjs --jest <fresh json>` | 206 = baseline 206, OK | PASS |
| Installed tree matches lockfile | `npm ls --depth=0`, `npm ls motion-dom` | versions as required, one motion-dom | PASS |
| CI on the same code | `gh run view 40045453857` | all jobs success on `4969072`; code identical to HEAD | PASS |
| Visual and E2E suites | CI only (not run locally per instructions) | 72 and 122 passed in the run above | PASS (via CI) |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/Hero3DMountain.tsx` | 159-165 | Second skip link, v1 classes | Blocker for SC4 literal wording | The gap above |
| `app/layout.tsx` / all pages | 30-35 | Every route shares one `document.title` (review CR-01); the template comment promises per-page titles that no segment provides | Warning, outside the five SCs | Client navigations are not announced by Next's route announcer; WCAG 2.4.2. Review disposition still `open`. Worth triage before Phase 12 EDGE-01, which relies on the announcement |
| `components/site/SiteNav.tsx` | 62-98 | Choosing the current page link does not close the mobile panel (review WR-06) | Warning | SC4 only requires close on route change and Escape; minor UX |
| `scripts/guards/check-contrast.mjs` | 71, 89-103 | Merges `:root` blocks nested in `@media` (review WR-01) | Warning | Guard can be masked by a media-scoped override; hardens GUARD-05 |
| `components/Header.tsx`, `Footer.tsx`, `GlassmorphismNav.tsx` | n/a | Dead v1 shells with zero importers (verified), `Footer.tsx` holds placeholders and an emoji | Info | Not rendered; palette/identity guards exempt them only while unimported; removal scheduled for Phase 12 |
| `app/(site)/page.tsx` | 19-20 | Hard-coded "850+ Tests Passing" / "20% Roadmap Complete" (review IN-05) | Info | False figures on Home; Phase 9 rebuild |
| Debt markers | n/a | No unreferenced `TBD`/`FIXME`/`XXX` found in the guard and shell files read | n/a | n/a |

Review findings WR-02, WR-03, WR-04, WR-05, WR-07, WR-08 and the other info items in `07-REVIEW.md` (all still `open` in `07-REVIEW-DISPOSITION.md`) were read but not re-verified one by one; none contradicts a success criterion.

### Human Verification Required

See the `human_verification` frontmatter: Vercel Node/`npm ci` confirmation, ratification of the three PNG re-baseline exceptions (with the override stanza below), required status checks on `main`, a Firefox/WebKit keyboard pass, and a visual sign-off.

Override suggestion for SC2, to add only after Tim confirms in his own words (the verifier does not fabricate `accepted_by`):

```yaml
overrides:
  - must_have: "Each passes the baseline run with zero visual diff, mid-scroll captures included"
    reason: "Three documented re-baselines: motion 14 hero scroll indicator (73880a2), Next 16.4 SWC JSX-space fix on /offline (e72c661), Chromium 156 textarea grabber on /contact (fdd2652); each limited to the named shots, all other shots byte-identical, CI green"
    accepted_by: "<Tim>"
    accepted_at: "<ISO timestamp>"
```

### Gaps Summary

One gap blocks a clean pass. Home renders two skip links, the shell's and the v1 hero's, against a success criterion that says "one skip link". The fix is small: delete the hero link (or merge it), and add a count assertion to `e2e/shell.spec.ts` so it cannot recur. It cannot be deferred on current evidence, because Phase 9's skip link ("jumps past the ascent") is a new, separate feature rather than this duplicate; Tim may still choose to accept it.

Everything else holds in the code, not just in the SUMMARYs. The shell, identity, tokens, type stack, scrollbar, icon family, 404 and error boundaries, and the guard suite exist, are wired, and are exercised by passing tests. I re-ran lint, type-check and Jest locally (all green, 206 = baseline 206), and CI run 40045453857 is green on code identical to HEAD (Visual 72 passed, E2E 122 passed).

Two items are outside the verifier's reach and keep the phase from being fully closed even after the gap is fixed: the live Vercel configuration (GUARD-01 stays Pending) and Tim's ratification of the three visual re-baselines that SC2's "zero visual diff" wording does not literally allow.

---

_Verified: 2026-10-24T13:30:00Z_
_Verifier: Claude (gsd-verifier)_
