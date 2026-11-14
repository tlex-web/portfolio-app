---
phase: "14"
slug: "ui-fixes-terminal-controls"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-14"
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `14-RESEARCH.md` § Validation Architecture. Task IDs are filled in once the plans exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 (jsdom 26.1) + Playwright 1.65 |
| **Config file** | `jest.config.js`, `playwright.config.ts` |
| **Quick run command** | `npx jest components/site/__tests__/SiteNav.test.tsx components/projects/__tests__/DemoTerminal.test.tsx lib/__tests__/demo-terminal.test.ts components/photos/__tests__/lightbox-dialog.test.tsx components/home/__tests__/rail.test.tsx` (measured 3.3 s, 77 tests) |
| **E2E quick run** | `npm run build` once, `npm run start` in the background, then `PW_PROD=1 PW_REUSE=1 npx playwright test <file> --project=chromium --reporter=line -g "<title>"`; stop the orphan `next start` on :3000 afterwards. Rebuild after every source change (a reused server serves the old build) |
| **Full suite command** | `npm run lint && npm run type-check && npm test` (local); `CI OK` on the phase PR is authoritative (three-engine E2E with `--fail-on-flaky-tests`, Unit Tests with `guard:tests`, Visual Regression) |
| **Estimated runtime** | ~4 s Jest quick run; ~2–30 s per e2e file in Chromium; ~40 min for CI |

`guard:tests` (the GUARD-03 ratchet: tests are rewritten, never deleted) runs only in CI's Unit Tests job, not in local `npm run lint`. Visual PNGs come only from the CI `visual-baselines.yml` `workflow_dispatch` container; Tim commits them.

---

## Sampling Rate

- **After every task commit:** the Jest quick run plus the one touched e2e file against the reused prod server, Chromium
- **After every plan wave:** `npm run lint`, `npm run type-check`, full Jest, then the touched e2e files in Chromium and Firefox locally (WebKit runs in CI; local WebKit for Playwright 1.65 is not installed)
- **Before `/gsd-verify-work`:** CI green on the phase branch, including Visual Regression after Tim commits the re-baselined PNGs
- **Max feedback latency:** 60 seconds locally (CI excluded)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | SHELL-07 | — | Plain click on the link whose `href === pathname` closes the panel, focuses Menu, no navigation; modifier click keeps the panel open | unit | `npx jest components/site/__tests__/SiteNav.test.tsx` | ✅ (extend) | ⬜ pending |
| TBD | TBD | TBD | SHELL-07 | — | At 375 on `/roadmap` scrolled down, tapping 'Roadmap' hides `#site-menu`, focuses the button, leaves `scrollY` and the URL unchanged | e2e (3 engines) | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/shell.spec.ts --project=chromium` | ✅ (extend) | ⬜ pending |
| TBD | TBD | TBD | SHELL-08 | — | Focused panel link has `outline-offset: -4px`; ring rect inside `#site-menu` client rect for top and bottom rows | e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/shell.spec.ts --project=chromium` | ✅ (extend) | ⬜ pending |
| TBD | TBD | TBD | SHELL-08 | — | Menu open at 375 on `/projects`, current row focused | visual (new PNG) | CI Visual Regression (`e2e/visual/routes.spec.ts`) | ✅ file / ❌ PNG | ⬜ pending |
| TBD | TBD | TBD | HOME-09 | — | `scrollWidth <= clientWidth` at 375 in live / static / reduced / no-JS × hero, waypoints 1–4, summit, About, footer | e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/home-modes.spec.ts --project=chromium -g "sideways"` | ✅ (extend `:363`) | ⬜ pending |
| TBD | TBD | TBD | HOME-10 | — | Every `[data-tick-label]` worst pixel ≥ 4.5:1 at 768/1023/1280/1440 × waypoints 1–4 + summit × WebGL off (all engines) / on (Chromium only) | e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/home-modes.spec.ts --project=chromium -g "B8"` | ✅ (rewrite `:482`) | ⬜ pending |
| TBD | TBD | TBD | HOME-10 | — | `scrim.offsetWidth === 224` and every label's left edge inside the dense stop at the four widths | e2e | same B8 describe, geometric row | ✅ (extend) | ⬜ pending |
| TBD | TBD | TBD | HOME-10 | — | Darker band at md+ | visual (re-baseline) | CI Visual Regression (`home/{768,1440}-ascent-*`, `home/{768,1440}-reduced`) | ✅ | ⬜ pending |
| TBD | TBD | TBD | LBOX-08 | — | Focus on `[data-photo-id=shown]`, rect ± 4 px inside the viewport below `--nav-h`: Chromium Map/Grid/Carousel × 1366×650, 1280×560, 720×450, 375×667 (Escape); 'Close photo' and `page.goBack()` at 720×450; Firefox and WebKit Map 720×450 Escape | e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium -g "LBOX-08"` | ✅ (new describe) | ⬜ pending |
| TBD | TBD | TBD | LBOX-08 | — | `revealTrigger` math: above, below, too tall, already visible → no scroll | unit | `npx jest components/photos/__tests__/lightbox-dialog.test.tsx` | ✅ (extend) | ⬜ pending |
| TBD | TBD | TBD | LBOX-08 (D-12) | — | Callout expanded → H or 'Hide labels' → one Escape closes the lightbox; showing labels again → every `aria-expanded="false"` | e2e (1440×900) | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium -g "Hotspots"` | ✅ (extend) | ⬜ pending |
| TBD | TBD | TBD | ENG-06 | — | Previous/Next render only with ≥ 2 commands; `aria-disabled` at the ends; an end press changes neither `data-command` nor `aria-pressed`; `stepTo` pure | unit | `npx jest components/projects/__tests__/DemoTerminal.test.tsx lib/__tests__/demo-terminal.test.ts` | ✅ (extend) | ⬜ pending |
| TBD | TBD | TBD | ENG-06 | — | Step / dot press → `aria-pressed="true"`, `data-playback="paused"`; leaving does not resume; release resumes; Tab order Pause → Previous → dots → Next | unit + e2e | `npx jest components/projects/__tests__/DemoTerminal.test.tsx` ; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/case-study.spec.ts --project=chromium` | ✅ (rewrite `DemoTerminal.test.tsx:278/314`, `case-study.spec.ts:577/638`) | ⬜ pending |
| TBD | TBD | TBD | ENG-06 | — | SSR markup has `details[data-transcript]` without `open`, holding every command, output and note | unit | `npx jest components/projects/__tests__/DemoTerminal.test.tsx` (`renderToString` row) | ✅ (extend) | ⬜ pending |
| TBD | TBD | TBD | ENG-06 | — | Reduced motion: transcript open after hydration with Pause pressed; default: closed; no-JS: closed and openable; opening presses Pause, closing leaves it pressed; 375 px with the transcript open has no sideways scroll | e2e | `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/case-study.spec.ts --project=chromium` | ✅ (extend) | ⬜ pending |
| TBD | TBD | TBD | ENG-06 | — | `box/{375,768,1440}-reduced` with step buttons and the open transcript | visual (re-baseline) | CI Visual Regression (`e2e/visual/routes.spec.ts`) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Shared helpers: export `waitForRevealed` and a settle-at-stop helper from `e2e/helpers/ascent.ts` (file-local in `home-canvas.spec.ts` today; moving them deletes no test)
- [ ] An `openOffscreen(page, slug)` / `expectTriggerFullyInView(page, slug)` pair for the LBOX-08 describe
- [ ] No framework install needed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Re-baselined PNG sets (mobile menu, rail scrim, box terminal; Home at 375 only if pixels change) | SHELL-08, HOME-10, ENG-06 | Baselines come only from the CI `workflow_dispatch` container and Tim commits them | Dispatch `visual-baselines.yml` (`suite=visual`, `update_mode=changed`) after Tim's ask, download and compare, Tim commits the PNGs |
| Keyboard-focus check Tim made at 12-UAT test 3 | LBOX-08, SHELL-08 | Tim's own hands-on re-check of the original finding | Repeat the 12-UAT test 3 steps at 1366×650, 1280×560, 720×450 and the menu at 375 px |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
