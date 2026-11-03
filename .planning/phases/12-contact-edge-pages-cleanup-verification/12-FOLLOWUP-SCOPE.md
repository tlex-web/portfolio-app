# Phase 12 — Follow-up scope (gate findings and deferred rows)

**Created:** 2026-11-03 at the Phase 12 gates, after VERIFICATION came back `human_needed` (5/5, no gaps).
**Why:** Tim asked to "plan to fix the remaining gaps". At the scope question he selected all four optional groups: "npm prod advisories, New copy (checkpoint), UI token fixes, Info code fixes". The review warnings and deferred rows were always in scope.
**Mode:** add plans 12-27 onward to Phase 12 ("Add more plans"). These are not new requirements. Each plan names the source row it closes, and execute-phase then runs only the new plans and re-verifies.

## Items

### A. Code review warnings (source: 12-REVIEW.md; ledger 12-REVIEW-DISPOSITION.md)

| ID | Where | Fix direction |
|----|-------|---------------|
| WR-01 | `components/contact/SummitRegister.tsx:472-481` | A `{ code: 'validation' }` answer with no name/email/message `fields` entry must not leave the form silent. Show the existing approved send-failure state (12-01 Resolved values `copy.fail-send`: title `Couldn't send.`, body, `Retry`) and keep the input. Add a Jest case that reproduces the silent path first. Uses no new copy. |
| WR-02 | `components/projects/DemoTerminal.tsx:177-189, 215-219` | The IntersectionObserver must follow the observed element through the "restart on shrink" null render, and attach when the first mount has no commands (callback ref or element-keyed effect). Add a Jest case for the shrink, and one for a mount with an empty list followed by a non-empty one. |
| WR-03 | `README.md:88, 326, 385` | Use the env var name `FEEDBACK_RECIPIENT_EMAIL` (what `lib/email.ts` reads), and set the Node version to `engines` 24.x. Check every env var the README lists against `lib/email.ts`, `lib/rate-limit.ts` and `.env.example`, if it exists. |
| WR-04 | `public/service-worker.js:56-59` and the older helpers it names | Tie every `cache.put` to `event.waitUntil` (or await it inside the handler's promise chain) and catch quota errors. Extend `lib/__tests__/service-worker-navigation.test.ts` / `service-worker-media.test.ts` so a rejected `put` neither throws unhandled nor breaks the network answer. Network-first freshness must stay as it is. |

### B. Info findings (source: 12-REVIEW.md)

| ID | Fix direction |
|----|---------------|
| IN-02 | Merged with C1 below (prefetch path and the proxy-skipped paths, `/api…`). The 404 render must ignore a visitor-sent `x-edge-section` wherever the proxy did not run. |
| IN-03 | `lib/useProgressiveTextures.ts`: reload when the source URLs change, not only when their count does. Key the effect on a stable joined key. Keep 12-18's load-order and disposal tests green and add an equal-count-different-sources case. |
| IN-04 | `components/ServiceWorkerRegistration.tsx` / `lib/sw-update.ts`: clear the update interval on unmount, and catch the `registration.update()` rejection. |
| IN-06 | `SummitRegister` Retry: validate on the client before re-sending. An invalid edit must show the field errors instead of using up a rate-limit slot. |
| IN-07 | Replace `z.string().email()` with `z.email()`, the Zod 4 form, wherever it appears (the feedback schema). The shared contract tests must stay green. |
| IN-01 | **Copy checkpoint, see E.** The name field's "too long" error currently reads "Enter your name." |
| IN-05 | **Copy checkpoint, see E.** `app/global-error.tsx` renders no `<title>`. |

### C. Deferred rows (source: deferred-items.md; 12-24-SUMMARY `## Open follow-ups`)

| # | Row | Exact fix already recorded |
|---|-----|----------------------------|
| C1 | Prefetch requests skip the proxy, so a forged `x-edge-section` reaches the 404 with no CSP. Security register T-12-02 (low, kept open by Tim's "Keep open, non-blocking (Recommended)") | `proxy.ts` `config.matcher[0].missing`: drop the `{ type: 'header', key: 'purpose', value: 'prefetch' }` entry so document prefetches pass the proxy, and/or make the 404 render ignore the header when the proxy did not set it (with IN-02). Add an e2e or unit case with `purpose: prefetch` + forged header: a neutral context link and a CSP header present. Update 12-SECURITY.md T-12-02 to `closed` with evidence. |
| C2 | The hero contour is not in the SW install precache, so a first offline `/offline` shows the sheet without contours | `scripts/terrain/build-terrain.mjs:464`: write `[meta.assets.contours.strip, meta.assets.contours.hero]` into `precacheText`, run `npm run terrain:build` to regenerate `data/generated/precache.json`, then adjust `data/__tests__/precache.test.ts` and add an SW-spec assertion. No hand edit of `public/service-worker.js`. |
| C3 | `e2e/shell.spec.ts:402` "every route credits the source" cold-compiles eight routes in one 30 s dev test | Add `test.slow()` (12-22 reproduced 5/5 timeouts at `/offline` on dev). No assertion change. |
| C4 | The design-system G3 scroll-lock case breaks under dev-server cross-talk, and the `e2e/design-system.spec.ts:20` comment still lists `text-shadow-glow*` | Tag G3 `@prod-only`, following the project's existing tag conventions in `playwright.config.ts` (every tag carries a reason comment, T-12-39). Comment lines 19-21: "(font-bold, text-shadow-glow*, colour classes) keep their own weight, glow and colour" becomes "(font-bold, colour classes) keep their own weight and colour". |

**Out of scope:** the canonical-host switch to `https://www.tlui.de`, which waits on DNS (Tim: "When it's live (Recommended)").

### D. UI-review token fixes (source: 12-UI-REVIEW.md priority fixes 2-3)

| # | Where | Fix |
|---|-------|-----|
| D1 | `components/site/ErrorBody.tsx` `TEXT_LINK` ("Report this error") | Move from `text-accent underline` to the spec's `ink-muted` text-link style: `text-ink-muted underline decoration-1 underline-offset-4 hover:text-ink`, plus `min-h-11` (44 px target). First check whether NotFoundBody shares `TEXT_LINK` and what 12-UI-SPEC/07 say for 404 links. If the 404 link is spec-sanctioned accent, change only the error-page usage. |
| D2 | `components/site/SavedPages.tsx:14` | `hover:bg-surface-raised` → `hover:bg-surface-overlay` (12-UI-SPEC line 108). |

No visual baseline covers the error page or the hover state (snapshot dirs: box, coin-flip, contact, home, lightbox, not-found, offline, photo, photos, photos-carousel, photos-grid, projects, roadmap). If D1 changes a shared not-found link, the not-found shots move, and that needs a visual round (Tim commits PNGs; see 12-11/12-19). Prefer the error-page-only change.

### E. Copy checkpoint (blocking-human; ship only Tim's literal reply)

| Key | Proposal to put to Tim |
|-----|------------------------|
| copy.field-error-name-long (IN-01) | e.g. "Shorten your name to 100 characters." (zod max 100; the input's `maxLength={100}` means only a server answer can reach it) |
| meta.global-error-title (IN-05) | e.g. "Something went wrong · Tim Lui" (follow the site's title template and ErrorBody's approved h1 "Something went wrong") |

Present both proposals, with alternatives, in one checkpoint. Record Tim's literal answers in the plan SUMMARY before the strings ship. A key he does not supply stays unshipped.

### F. npm prod-tree advisories (supply-chain checkpoint, the 12-06 / T-12-SC pattern)

| Package | Now | Target | Advisory | Path |
|---------|-----|--------|----------|------|
| source-map-js | 1.2.1 | ≥ 1.2.2 | high: event-loop DoS via indexed source-map section offsets (`>=1.0.0 <1.2.2`) | postcss, @tailwindcss/node |
| baseline-browser-mapping | 2.10.13 | ≥ 2.11.0 | moderate: process termination on invalid input (`>=2.0.0 <2.11.0`) | next 16.4.2, browserslist |

`npm audit` reports both as `fixAvailable: true` (non-breaking). Before install, show Tim the registry facts: publisher, publish date, integrity, and dist-tag. Install only on his quoted approval, with exact versions or version-scoped overrides as in 12-06 (`package.json` overrides, `scripts/guards/version-floors.json`), and record the `npm audit` count before and after. The remaining dev-tree advisories mostly need semver-major bumps (jest, eslint-config-next and others) and stay out.

## Constraints that carry over (from 12-CONTEXT, 12-VALIDATION execution notes and memory)

- Run one plan at a time on the shared checkout, `.next` and port 3000, with isolation `none`. Per-task production checks use `PW_PROD=1 PW_REUSE=1` against one build. Never stage `public/service-worker.js` while a server runs (postbuild injects the hash), and restore it after the server stops.
- For SW-touching work (WR-04, IN-04, C2), keep a `serviceWorkers: 'allow'` e2e case (`e2e/service-worker.spec.ts`), because functional projects block service workers.
- Tests are rewritten, never deleted, and the test-count ratchet only rises (baseline 2205; raise it at the end).
- After the last plan, push a `ci/12-NN` branch (standing approval) and get a three-engine CI run green with `--fail-on-flaky-tests`. Update 12-REVIEW-DISPOSITION.md rows to `fixed` with commit refs, update 12-SECURITY.md T-12-02, and update the deferred-items.md rows.
