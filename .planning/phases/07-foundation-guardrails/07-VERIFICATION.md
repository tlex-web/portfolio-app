---
phase: 07-foundation-guardrails
verified: 2026-10-24T15:10:00Z
status: passed
score: 5/5 must-haves verified (SC2 via override)
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
  - ".planning/phases/07-foundation-guardrails/07-27-PLAN.md"
  - ".planning/phases/07-foundation-guardrails/07-27-SUMMARY.md"
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
covered_digest: "v3:sha256:f6e27af0c6cbaceae1444bb9c00257f41a3475d7d9d420799af76e8b4ced6bd8"
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "Each passes the baseline run with zero visual diff, mid-scroll captures included"
    reason: "Three documented re-baselines: motion 14 hero scroll indicator (73880a2), Next 16.4 SWC JSX-space fix on /offline (e72c661), Chromium 156 textarea grabber on /contact (fdd2652); each limited to the named shots, all other shots byte-identical, CI green"
    accepted_by: "Tim"
    accepted_at: "2026-10-24T11:16:30Z"
re_verification:
  previous_status: gaps_found
  previous_score: 3/5
  gaps_closed:
    - "On every page a keyboard user finds one skip link (ROADMAP SC4 / SHELL-01): Home no longer renders the hero's second skip link; shell.spec.ts now counts skip links on 7 routes and 5 404 paths"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Confirm Vercel builds on Node 24.x with npm ci (GUARD-01, 07-USER-SETUP.md item 1)"
    expected: "Vercel -> Project -> Deployments -> latest -> Build Logs shows Node 24.x and the install step runs npm ci. If it still shows Node 20, set Settings -> Build and Deployment -> Node.js Version to 24.x"
    why_human: "Vercel project settings live outside the repo. vercel.json installCommand is 'npm ci' and package.json engines.node is '24.x' (both verified), but no committed file can prove the live project honours them. GUARD-01 stays Pending for exactly this reason"
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
**Verified:** 2026-10-24T15:10:00Z
**Status:** human_needed
**Re-verification:** Yes, after gap closure (plan 07-27)
**Code under test:** HEAD `c7e2808`. `git diff 460b3a4 HEAD -- . ':!.planning'` is empty, so the code equals the commit CI run 40086883766 tested (all jobs success). `git diff 4969072 HEAD -- . ':!.planning'` lists exactly `components/Hero3DMountain.tsx` and `e2e/shell.spec.ts`, and `git diff 4969072 HEAD -- '*.png'` is empty. Because the earlier verification covered `4969072`-identical code, the 07-27 delta is the only new surface, and I re-checked it in full. The other four truths got a regression check (lint, type-check, Jest, test-count re-run, plus the unchanged-code argument above).

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Local, CI (Node 24) and Vercel installs use `npm ci`; CI holds baselines for every route in dark and light from a Linux production build; CI fails on screenshot diff, test-count drop, `dark:`/stock palette class, sub-AA token pair, jsx-a11y violation | VERIFIED (repo side; the live Vercel setting is a human item) | Unchanged since the first verification (code identical apart from the two 07-27 files). Re-run here: `npm run lint` exit 0 with guard selftest 55/55; `npm run type-check` exit 0; Jest 13 suites / 107 tests passed; `test-count.mjs` "jest 107 + e2e 99 = 206 (baseline 206) OK". CI run 40086883766 on 460b3a4: Unit, Lint and Type Check, E2E, Visual Regression, Security Audit, Build all success (Dependency Review skipped) |
| 2 | motion 14.1, Next 16.4.x/React 19.3/R3F 9.8.1/drei 10.7.9 and Playwright 1.64 land as three separate commits; each passes the baseline run with zero visual diff, mid-scroll captures included | PASSED (override) | Override accepted by Tim on 2026-10-24 during UAT test 2 ("all three exceptions are acceptable"). Unchanged from the first verification. Three separate commits (`73880a2`, `a3c2b81` plus fix commits and the `fdeb9fe` security patch, `fdd2652`), all CI green, but each re-baselined PNGs (6 home scroll-50, 6 offline, 6 contact). Literal "zero visual diff" is not met; see human_verification and the override suggestion below. Code is not changed by 07-27 |
| 3 | Light-OS visitor sees the same dark site; tokens v2; grotesk + Inter + JetBrains Mono; one SVG icon family, no emoji icons; thin scrollbar with stable gutter; motion from shared tokens that settles under reduced motion | VERIFIED | Unchanged. Not touched by 07-27 (the only edit in `components/Hero3DMountain.tsx` is the deleted anchor and its comment; the removed class list used `sr-only`/`focus:` utilities with no palette violation). Visual Regression 72 passed on 460b3a4, including `visual-light` against the dark PNGs |
| 4 | On every page a keyboard user finds one skip link, exactly one primary navigation with a visible current-page indicator, exactly one main landmark; mobile menu has >=44 px targets and closes on route change and Escape | VERIFIED | Previously the one failing part. Now: `components/Hero3DMountain.tsx` contains no skip anchor (diff vs `4969072` shows the 8 deleted lines: comment + `<a href="#home-content" class="sr-only focus:not-sr-only ...">Skip to content</a>`). `grep 'href="#' app components lib` finds only `SkipLink.tsx:9` (`#main-content`) and the hero CTA `Hero3DMountain.tsx:96` (`#home-content`, a visible button with a layout box, target `id="home-content"` at `app/(site)/page.tsx:29` intact). `SiteChrome` renders `<SkipLink />` first (line 21). `e2e/shell.spec.ts` has `skipLinks = page.getByRole('link', { name: /skip to/i })` (line 30, no `.first()`/`:visible`/`includeHidden`) and `toHaveCount(1)` at line 69 (7 routes) and line 161 (5 404 paths); test count unchanged (23 shell tests, ratchet 206). Red/green proof checked against GitHub: run 40086334529 on RED `5f403af` has E2E Tests = failure and every other job success; run 40086883766 on GREEN `460b3a4` has all jobs success. The remaining parts (one nav, one main, aria-current, 44 px, Escape/route-change close) are unchanged and still asserted by `shell.spec.ts` and `SiteNav.test.tsx` |
| 5 | Every page shows Tim Lui's name, role line and real GitHub, LinkedIn, email; no placeholder text/links; `/gradient-mesh`, `/particle-buttons`, `/transitions` 404 inside the shell and nothing links to them; Contact heading and fields pass AA for light-OS and dark-OS | VERIFIED | Unchanged. `guard:identity` passes inside `npm run lint`; Shell 404 tests (now also asserting one skip link) and `a11y-contact.spec.ts` green in CI E2E |

**Score:** 5/5 truths verified (SC2 via override, accepted by Tim during UAT). 0 present-but-behavior-unverified. The behavior-dependent truths (menu close triggers, reduced-motion settle, light equals dark, single skip link) each have a passing behavioral test, and the skip-link test was demonstrated red before green.

### Deferred Items

None. The SC2 exceptions are not covered by a later phase.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `e2e/shell.spec.ts` | `skipLinks` helper plus exactly-one assertions on all shell routes and 404 paths | VERIFIED | Lines 30, 69, 161; comment header names one skip link; no test added or removed |
| `components/Hero3DMountain.tsx` | Hero without its own skip anchor; CTA to `#home-content` kept | VERIFIED | Anchor gone; `href="#home-content"` once (CTA); `app/(site)/page.tsx:29` `id="home-content"` once |
| `components/site/SkipLink.tsx` | The single skip link, first in body | VERIFIED | `href="#main-content"`, text "Skip to main content", rendered first by `SiteChrome` |
| `.planning/.../07-REVIEW-DISPOSITION.md` | IN-04 `fixed` | VERIFIED | Frontmatter entry `disposition: fixed` |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `e2e/shell.spec.ts` | `SkipLink.tsx` | `getByRole('link', { name: /skip to/i })` `toHaveCount(1)` on 7 routes + 5 404 paths | WIRED |
| `SiteChrome.tsx` | `SkipLink.tsx` | `<SkipLink />` first child (line 21) | WIRED |
| Hero CTA | `app/(site)/page.tsx` | `#home-content` target still exists | WIRED |
| `app/(site)/layout.tsx`, `not-found.tsx`, `global-error.tsx` | `SiteChrome` | all pages inherit the single skip link | WIRED (unchanged) |
| `package.json` `lint`, CI `unit-tests` | guards, `guard:tests` | re-run here, exit 0 | WIRED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Lint + all guards | `npm run lint` | exit 0, selftest 55/55 | PASS |
| Types | `npm run type-check` | exit 0 | PASS |
| Unit tests | `npx jest --silent` | 13 suites, 107 tests passed | PASS |
| Test-count ratchet | `node scripts/guards/test-count.mjs --jest <fresh json>` | 206 = baseline 206, OK | PASS |
| One skip link, red then green | `gh run view 40086334529` / `40086883766` `--json jobs` | RED: E2E Tests failure, all else success. GREEN: all success. Branch `ci/07-27` on origin = `460b3a4` | PASS (via CI) |
| Zero visual diff for the fix | `git diff --name-only 4969072 HEAD -- '*.png'` | empty; Visual Regression success on 460b3a4 | PASS |
| Code at HEAD equals CI-tested code | `git diff --name-only 460b3a4 HEAD -- . ':!.planning'` | empty | PASS |

### Probe Execution

SKIPPED: the phase declares no `probe-*.sh` scripts.

### Requirements Coverage

All 20 IDs in the phase brief appear in at least one PLAN `requirements:` field (GUARD-01..06, DEPS-03/04/05, DSGN-05..10, SHELL-01/02/03/05/06) and in REQUIREMENTS.md; SHELL-04 belongs to Phase 8 and is correctly not claimed. No orphans. REQUIREMENTS.md currently shows these as "Gaps Found" (GUARD-01 "Pending"), which is stale after this re-verification; see the note below the table.

| Requirement | Source Plans | Status | Evidence |
|-------------|--------------|--------|----------|
| GUARD-01 | 07-01, 07-08 | NEEDS HUMAN | Repo side verified (SC1). Live Vercel Node 24 + `npm ci` unconfirmed |
| GUARD-02 | 07-03, 07-04 | SATISFIED | 36 dark baselines, Visual Regression 72 passed, light asserts dark |
| GUARD-03 | 07-01, 07-26 | SATISFIED | Ratchet 206/206, re-run here |
| GUARD-04 | 07-16..19, 07-20 | SATISFIED | `check-palette.mjs` in lint, passes |
| GUARD-05 | 07-20 | SATISFIED | `check-contrast.mjs` in lint, passes |
| GUARD-06 | 07-02 | SATISFIED | jsx-a11y at error, in lint |
| DEPS-03 | 07-05 | SATISFIED with caveat | 6 PNGs re-baselined (SC2 human item) |
| DEPS-04 | 07-06, 07-07 | SATISFIED with caveat | 6 offline PNGs re-baselined (SC2 human item) |
| DEPS-05 | 07-08 | SATISFIED | Chromium-forced re-baseline allowed by the roadmap |
| DSGN-05 | 07-14, 07-15, 07-20 | SATISFIED | SC3 |
| DSGN-06 | 07-09, 07-10, 07-16..19, 07-20 | SATISFIED | SC3 |
| DSGN-07 | 07-11 | SATISFIED | SC3 |
| DSGN-08 | 07-09, 07-22 | SATISFIED | SC3 |
| DSGN-09 | 07-12 | SATISFIED | SC3 |
| DSGN-10 | 07-13, 07-25 | SATISFIED | SC3 |
| SHELL-01 | 07-21, 07-22, 07-23, 07-27 | SATISFIED | Gap closed: one skip link, one nav, one main, current-page indicator on every route, enforced in CI |
| SHELL-02 | 07-21 | SATISFIED | SC4 |
| SHELL-03 | 07-21, 07-22, 07-25 | SATISFIED | SC5 |
| SHELL-05 | 07-04, 07-23 | SATISFIED | SC5 |
| SHELL-06 | 07-24 | SATISFIED | axe AA in both schemes |

Suggested REQUIREMENTS.md status: 17 IDs can move to Complete now (all except GUARD-01, DEPS-03, DEPS-04). DEPS-03 and DEPS-04 are code-satisfied but wait on Tim's ratification of the SC2 re-baselines; GUARD-01 waits on the Vercel check. That call is the orchestrator's; I did not edit REQUIREMENTS.md.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `e2e/shell.spec.ts` | 30, 68-69, 160-161 | Skip-link guard matches name `/skip to/i` only, but the comment says any second skip link fails (review WR-09); count is taken once before hydration settles (IN-17) | Warning (advisory, review `open`) | Does not falsify SC4 today: I grepped every `href="#` in `app components lib` and found only the shell link and the visible Hero CTA. It weakens the regression guard for the Phase 9 hero, the likeliest source of a new second link. The 07-27 SUMMARY "Phase 9" note advises naming around the guard (the review's complaint). Fix before or during Phase 9 |
| `app/layout.tsx` | 30-35 | One shared `document.title` on every route (CR-01) | Warning, outside the five SCs | Route announcer never fires; WCAG 2.4.2. Triage before Phase 12 EDGE-01 |
| `components/site/SiteNav.tsx` | 62-98 | Current-page link does not close the mobile panel (WR-06) | Warning | SC4 needs only route-change and Escape close |
| `scripts/guards/check-contrast.mjs` | 71, 89-103 | Merges `:root` blocks nested in `@media` (WR-01) | Warning | Hardens GUARD-05 |
| `components/Header.tsx`, `Footer.tsx`, `GlassmorphismNav.tsx` | n/a | Dead v1 shells, zero importers | Info | Removal scheduled for Phase 12 |
| `app/(site)/page.tsx` | 19-20 | Hard-coded "850+ Tests Passing" / "20% Roadmap Complete" (IN-05) | Info | Phase 9 rebuild |
| Debt markers | n/a | No unreferenced `TBD`/`FIXME`/`XXX` in the 07-27 files | n/a | n/a |

The Hero3DMountain.tsx diff contains no new markers or stubs. Remaining open review findings (24, `07-REVIEW-DISPOSITION.md`) were read for contradiction with the five SCs; none contradicts one.

### Human Verification Required

See the `human_verification` frontmatter: (1) Vercel Node 24 and `npm ci` confirmation, (2) Tim's ratification of the three PNG re-baseline exceptions with the override stanza below, (3) required status checks on `main`, (4) Firefox/WebKit keyboard pass, (5) device visual sign-off.

Override suggestion for SC2, to add only after Tim confirms in his own words (the verifier does not fabricate `accepted_by`):

```yaml
overrides:
  - must_have: "Each passes the baseline run with zero visual diff, mid-scroll captures included"
    reason: "Three documented re-baselines: motion 14 hero scroll indicator (73880a2), Next 16.4 SWC JSX-space fix on /offline (e72c661), Chromium 156 textarea grabber on /contact (fdd2652); each limited to the named shots, all other shots byte-identical, CI green"
    accepted_by: "<Tim>"
    accepted_at: "<ISO timestamp>"
```

### Gaps Summary

No gaps remain. The single gap from the first verification (Home rendering two skip links) is closed in the code, not just in the SUMMARY: the hero anchor is deleted, the only remaining skip link is the shell's, the count assertion exists in both the 7-route and 5-path tests, GitHub shows the assertion red on the pre-fix commit and green on the fix, and nothing outside the two planned files or any PNG changed. Lint, type-check, Jest and the test-count ratchet were re-run here and are green; HEAD code equals the CI-green commit.

The status is `human_needed`, not `passed`, because five items are outside the verifier's reach: the live Vercel configuration (GUARD-01), Tim's decision on the SC2 "zero visual diff" exceptions, branch protection on `main`, a Firefox/WebKit keyboard pass and a device visual sign-off. None is a code defect. Advisory review findings WR-09 and IN-17 (the guard is name-based and counts once) are recommended hardening before the Phase 9 hero rebuild, not blockers for this phase.

---

_Verified: 2026-10-24T15:10:00Z_
_Verifier: Claude (gsd-verifier)_
