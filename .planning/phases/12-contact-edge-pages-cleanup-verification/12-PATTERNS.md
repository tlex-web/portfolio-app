# Phase 12: Contact, Edge Pages, Cleanup & Verification - Pattern Map

**Mapped:** 2026-11-02
**Files analyzed:** 46 (new + modified + delete targets)
**Analogs found:** 40 / 46 (all analogs are git-tracked source; no mirror paths)

Next 16.4 rule (AGENTS.md): every Next API below is grounded in this repo's code or the docs cited in 12-RESEARCH.md, not memory.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/api/feedback/route.ts` (MOD) | route handler | request-response | itself (lines 15-104) | exact (modify in place) |
| `lib/contact/api-contract.ts` (NEW) | utility (shared enum/types) | transform | `lib/route-log.ts` label maps (`STATUS_LABELS` etc., imported by `app/(site)/roadmap/page.tsx:7-15`) | role-match |
| `components/contact/SummitRegister.tsx` (NEW, replaces FeedbackForm) | component (client island) | request-response | `components/FeedbackForm.tsx` | exact (restyle) |
| `components/contact/CopyEmailButton.tsx` (NEW) | component (client island) | event-driven | `components/photos/CarouselControls.tsx:104-106` (sr-only status) | partial |
| `app/(site)/contact/page.tsx` (MOD → Server) | page | request-response | `app/(site)/roadmap/page.tsx` (server page + `metadata` + header band) | exact |
| `components/site/EdgeLayout.tsx` (NEW) | component (server, zero JS) | transform | `components/site/NotFoundBody.tsx` skeleton | role-match |
| `components/site/EdgeArt.tsx` (NEW) | component (server, zero JS) | transform | `components/terrain/ContourField.tsx` | role-match |
| `lib/edge-art.ts` + `lib/__tests__/edge-art.test.ts` (NEW) | utility + test | transform | `lib/home-format.ts` + `lib/__tests__/home-format.test.ts` | role-match |
| `components/site/NotFoundBody.tsx` (MOD, `context?` prop) | component | transform | itself | exact |
| `components/site/ErrorBody.tsx` (MOD, wrap in EdgeLayout) | component (client) | event-driven | itself | exact |
| `app/not-found.tsx` (MOD, async, reads `x-edge-section`) | page (not-found) | request-response | itself + `app/layout.tsx:44` (`await headers()`) | exact |
| `app/(site)/not-found.tsx` (MOD) | page | transform | itself | exact |
| `app/(site)/error.tsx`, `app/global-error.tsx` (MOD, minimal) | error boundary | event-driven | themselves | exact |
| `app/(site)/offline/page.tsx` (MOD → Server + `robots` noindex) | page | request-response | `app/(site)/roadmap/page.tsx` | role-match |
| `components/site/SavedPages.tsx` (NEW) | component (client island) | file-I/O (Cache Storage) | `components/ServiceWorkerRegistration.tsx` (browser-API island) | partial |
| `proxy.ts` (MOD: `buildCsp`, rewrite, D-17) | middleware | request-response | itself (lines 1-56) | exact |
| `lib/__tests__/proxy-csp.test.ts` (NEW) | test | — | `app/api/__tests__/feedback.test.ts` (`@jest-environment node`, NextRequest) | role-match |
| `public/service-worker.js` (MOD) | service worker | event-driven | itself (`networkFirst` lines 67-79, install 84-92, fetch 111-172) | exact |
| `lib/__tests__/service-worker-navigation.test.ts` (NEW) | test | event-driven | `lib/__tests__/service-worker-media.test.ts:33-55` | exact |
| `components/ServiceWorkerRegistration.tsx` (MOD, reload-once) | component | event-driven | itself | exact |
| `next.config.ts` (MOD: SW `no-cache`, stale comment) | config | — | its existing `headers()` immutable rules | exact |
| `data/site.ts` + `data/types.ts` (MOD: `url`, `location`) | config/data | — | `data/site.ts:15-34`, `data/types.ts:30-41` | exact |
| `lib/home-format.ts` (MOD: `decimals`, `formatEntryTime`, `formatCount`) | utility | transform | `lib/home-format.ts:34-49` | exact |
| `lib/metadata.ts` (NEW `pageMetadata`) | utility | transform | `lib/photos/view-model.ts:382-390` (`photoMetadata`) | exact |
| `app/layout.tsx` (MOD: metadataBase, openGraph, twitter) | layout | — | itself (lines 30-35) | exact |
| section pages `photos`, `projects`, `roadmap`, `contact`, `offline` (MOD metadata) | page | — | `app/(site)/roadmap/page.tsx:17` | exact |
| `app/(site)/projects/[slug]/page.tsx` (MOD: add canonical) | page | — | itself lines 39-46 + `photoMetadata` | exact |
| `app/sitemap.ts`, `app/robots.ts` (NEW) | metadata route | batch | none in repo; data from `site.nav`, `photoSlugs`, `projects` (same sources as `generateStaticParams` in `projects/[slug]/page.tsx:35-37`) | no analog (use RESEARCH Pattern 4) |
| `app/opengraph-image.tsx`, `app/(site)/photos/[slug]/opengraph-image.tsx`, `app/(site)/projects/[slug]/opengraph-image.tsx` (NEW) | metadata route | file-I/O | `app/(site)/projects/[slug]/page.tsx:33-37` (static params) | partial (use RESEARCH Pattern 3) |
| `lib/og/template.tsx` + `lib/og/fonts/*` + test (NEW) | utility (element tree) | transform | `components/projects/RouteProfile.tsx`, `components/projects/TrailGradeMark.tsx` (drawings to port) | partial |
| `scripts/tokens/build-tokens.mjs` (MOD: add hexes) | build script | transform | itself → `data/generated/tokens.ts:3-10` | exact |
| `e2e/routes.ts` (NEW, extracted) | test helper | — | `e2e/shell.spec.ts:21-32` `ROUTES` | exact |
| `e2e/audit.spec.ts` (NEW) | e2e test | batch | `e2e/a11y-contact.spec.ts` (AxeBuilder + `settle`) + `e2e/shell.spec.ts` route loop (70-72) | role-match |
| `e2e/keyboard.spec.ts` (NEW) | e2e test | event-driven | `e2e/shell.spec.ts:247-306` (mobile menu Escape/focus) | role-match |
| `e2e/service-worker.spec.ts` (NEW, `@chromium-only`) | e2e test | event-driven | none (RESEARCH "SW update e2e") | no analog |
| `e2e/seo.spec.ts` (NEW) | e2e test | request-response | `e2e/shell.spec.ts:167-210` (HTTP status checks) | partial |
| `e2e/contact-form.spec.ts`, `e2e/a11y-contact.spec.ts`, `e2e/no-webgl.spec.ts`, `e2e/shell.spec.ts` (MOD, rewrite) | e2e test | — | themselves | exact |
| `components/contact/__tests__/SummitRegister.test.tsx` (rewrite of `components/__tests__/FeedbackForm.test.tsx`) | test | — | `components/__tests__/FeedbackForm.test.tsx` | exact |
| `app/api/__tests__/feedback.test.ts` (extend) | test | — | itself lines 1-45 | exact |
| `data/__tests__/asset-exists.test.ts` (NEW) | test | file-I/O | `data/__tests__/image-manifest.test.ts` | role-match |
| `playwright.config.ts`, `.github/workflows/ci.yml:104` (MOD) | config | — | `playwright.config.ts:61-81` firefox project | exact |
| `scripts/guards/lib/legacy-dead-files.mjs`, `eslint.config.mjs:9-13`, `scripts/guards/palette-ratchet.json`, selftest fixtures (MOD/drain) | guard config | — | themselves | exact |
| `app/globals.css` (MOD: drop aliases, Phase 4 block, add backstop) | config (CSS) | — | itself | exact |
| `lib/useProgressiveTextures.ts` (MOD, compiler-clean) | hook | event-driven | none clean in-repo for texture maps | no analog (state map / `useSyncExternalStore`) |
| D-24 files: `components/projects/EndBlock.tsx`, `DemoClip.tsx`, `DemoTerminal.tsx`, `components/roadmap/RouteLog.tsx` | component | — | themselves (+ 09 TrailSigns `min-h-14`) | exact |
| Delete targets (see below) | — | — | — | n/a |

## Pattern Assignments

### `app/api/feedback/route.ts` (route handler, request-response) — modify in place

**Keep verbatim (order locked):** lines 17-21 IP extraction, lines 24-38 `validateOrigin` block, line 41 `feedbackRateLimit.limit(ip)`. The existing warn shape is the D-04 log shape to generalise:
```ts
// route.ts:27-33
console.warn('[csrf] Cross-origin request rejected', {
  event: 'csrf', ip, origin, host, timestamp: new Date().toISOString(),
});
```
**Change:**
- line 41: destructure `{ success, reset }`; 429 body `{ code: 'rate-limited', retryAfterS }` + `Retry-After` header (clamp: dev mock returns `reset: 0`, `lib/rate-limit.ts:47`).
- 403 body → `{ code: 'origin-rejected' }`.
- line 56: `.parse` → `.safeParse`; failure → 400 `{ code: 'validation', fields }` (no value echo); keep `request.json()` inside try so malformed JSON is 400.
- schema lines 8-13: add `trail_note: z.string().max(200).optional()`; honeypot check after zod, before send → 200 `{ code: 'ok' }`, log `honeypot`.
- **Delete** lines 61-68 (logs name/email/message — PII, D-04).
- lines 80-84: swallow → `return 502 { code: 'send-failed' }`; also check `lib/email.ts:56` logs only the error name.
- lines 97-102: 500 `{ code: 'server-error' }`.
Codes and the body type come from `lib/contact/api-contract.ts` so the form and route share them.

**Test analog:** `app/api/__tests__/feedback.test.ts:1-45` — `@jest-environment node`, `jest.mock` of `@/lib/email`, `@/lib/csrf`, `@/lib/rate-limit` before imports, console spies. Extend: order csrf→ratelimit→honeypot, 429 `Retry-After`, 502 on send reject, and assert no console call args contain name/email/message.

---

### `components/contact/SummitRegister.tsx` (client island, request-response)

**Analog:** `components/FeedbackForm.tsx` (228 lines).

Imports / field class (lines 1-10) — keep icon import style (`@phosphor-icons/react/dist/ssr`, switch to `*Icon` names per UI-SPEC):
```tsx
'use client';
import { useState } from 'react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr';
const fieldClass = (invalid: boolean) =>
  `w-full min-h-11 px-4 py-2 rounded-sm bg-surface-overlay text-ink border placeholder:text-ink-muted ${
    invalid ? 'border-danger' : 'border-line-strong'
  }`;
```
Label pattern (lines ~113-116): `<label htmlFor="name" className="block text-sm font-semibold mb-2 text-ink">Name <span className="text-danger" aria-hidden="true">*</span></label>` — keep names Name/Email/Message/"Send Message" (locked e2e contract).

Submit core (lines 64-106): `fetch('/api/feedback', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(formData) })`. Replace the `response.ok` branch with a `switch (data.code)` over the api-contract codes, add AbortController 15 s, and **do not reset fields on failure** (D-02). Remove `role="alert"` from inline errors (lines 127,149,171 — RESEARCH anti-pattern); announcements move to the summary (`role="alert" tabIndex={-1}`) and register entry (`role="status" tabIndex={-1}`).

Honeypot label/name must avoid "name"/"message" (`trail_note`, "Leave this field empty") — `e2e/contact-form.spec.ts:8-10` uses `getByLabel(/Name/i)`, `/Message/i`.

**Test:** rewrite `components/__tests__/FeedbackForm.test.tsx` into `components/contact/__tests__/SummitRegister.test.tsx` (count must not drop; ratchet 1749).

---

### `components/contact/CopyEmailButton.tsx` (client island, event-driven)

**Analog for the polite announcer:** `components/photos/CarouselControls.tsx:104-106`
```tsx
<p role="status" aria-atomic="true" className="sr-only">
  {announce}
</p>
```
Render the status node always (server-rendered, no CLS). Button class from UI-SPEC "Direct contact panel" (07 secondary at `px-4`). Use the same pattern for SummitRegister's counter announcer.

---

### `app/(site)/contact/page.tsx` (page → Server Component)

**Analog:** `app/(site)/roadmap/page.tsx:1-17`
```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
...
export const metadata: Metadata = { title: 'Roadmap' };
```
Drop `'use client'`, `AnimatedGradientMesh` and all `motion` imports. Use `pageMetadata({ title: 'Contact', description, path: '/contact' })`. Header band classes from UI-SPEC; panel is server markup with `CopyEmailButton` and `SummitRegister` islands. Location row uses `formatLatLon(site.location, { decimals: 2 })`.

---

### `components/site/EdgeLayout.tsx` + `components/site/EdgeArt.tsx` (server, zero JS)

**Skeleton analog:** `components/site/NotFoundBody.tsx:12-20`
```tsx
<div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-16">
  <div className="max-w-prose">
    <p className="font-mono text-sm text-ink-muted tabular-nums mb-4">Error 404</p>
    <h1 className="mb-4 text-balance">Page not found</h1>
    <p className="text-base text-ink-muted mb-8">…</p>
    <div className="flex flex-wrap gap-4">…</div>
```
EdgeLayout adds the grid `grid gap-y-12 lg:grid-cols-[minmax(0,1fr)_28rem] …` with text/art/extra slots (UI-SPEC). No hooks, so it renders inside client `ErrorBody` and static `global-error`.

**Art analog:** `components/terrain/ContourField.tsx:16-34` — server, `aria-hidden`, token class (`bg-contour`), inline mask style. EdgeArt = `<ContourField lod="hero" className="absolute inset-0" />` + overlay `<svg viewBox="0 0 512 512">` with trail path and dot from `lib/edge-art.ts`.

**`lib/edge-art.ts` analog:** `lib/home-format.ts` (pure, import-free, unit-tested constants/functions); test like `lib/__tests__/home-format.test.ts` asserting dot-to-segment distance ≥ 56 and safe box [48,464].

---

### `components/site/NotFoundBody.tsx` / `ErrorBody.tsx` (modify)

- NotFoundBody: add `context?: 'photos' | 'projects'`; swap link set (lines 27-38 link class `text-accent underline underline-offset-[0.2em] min-h-11 inline-flex items-center`); kicker → `Error 404 · Page not found`, h1 → `You've left the marked trail`. Never accept a slug prop.
- ErrorBody: keep lines 32-36 (focus h1 on mount) and `PRIMARY`/`SECONDARY` consts (13-16); keep h1 `Something went wrong` (e2e `helpers/webgl.ts` relies on it); add "Report this error" link (plain `<a>` in `root` variant, as the existing `variant` branch at 50-62 does).
- Tests: `components/site/__tests__/ErrorBody.test.tsx`, `components/__tests__/global-error.test.tsx` (keeps the "secret never rendered" assertions, lines 15-29).

### `app/not-found.tsx` (modify)
Current lines 11-17 render `<SiteChrome><NotFoundBody /></SiteChrome>`. Make it `async`, read `(await headers()).get('x-edge-section')` (pattern: `app/layout.tsx:2,44`), validate to `'photos' | 'projects' | undefined`, pass as `context`. `app/(site)/not-found.tsx` keeps generic context.

---

### `proxy.ts` (middleware, request-response)

**Analog:** itself. Keep lines 25-40 header plumbing:
```ts
const requestHeaders = new Headers(request.headers);
requestHeaders.set('x-nonce', nonce);
requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);
const response = NextResponse.next({ request: { headers: requestHeaders } });
response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);
```
Changes: extract exported `buildCsp(nonce, url, isDev)` (RESEARCH Pattern 1) so a unit test can pin both variants; line 12 drop `https://raw.githubusercontent.com`; line 8 `'unsafe-eval'` dev-only (flag at checkpoint); line 18 omit only for `http:` + loopback host; delete client `x-edge-section` then `NextResponse.rewrite` for unknown two-segment `/photos|projects/<slug>`. Keep `config.matcher` (43-56) unchanged — OG paths have 3 segments. Imports must be data modules only (no fs). Update stale "middleware.ts" comments in `app/layout.tsx:42-43`, `next.config.ts:121`.

---

### `public/service-worker.js` (event-driven)

**Analog:** itself. Reuse `networkFirst` (lines 67-79) as the base for `networkFirstNavigation`:
```js
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached;
  }
}
```
Replace the SWR branch at lines 161-168 (`request.mode === 'navigate' … staleWhileRevalidate`) with the navigation handler (+ `/offline` fallback, only `basic`, non-redirected 200s cached). Add RSC bypass (`_rsc` / `RSC: 1`) next to the `/api/` bypass (lines 133-136). Install (84-92): keep `['/', '/offline', ...PRECACHE]` (the `/*__PRECACHE_URLS__*/` placeholder at line 12 is injected by `scripts/inject-build-hash.mjs`) and add the `/offline` HTML + `Link` header scrape. Activate (95-107) unchanged.

**Test analog:** `lib/__tests__/service-worker-media.test.ts:33-55` `loadWorker()` — `new Function('self','caches','fetch', source)(self, caches, fetchStub)` with jest stubs; copy it into `service-worker-navigation.test.ts` (6 cases in RESEARCH).

---

### Metadata: `lib/metadata.ts`, `app/layout.tsx`, section pages

**Analog:** `lib/photos/view-model.ts:382-390`
```ts
export function photoMetadata(slug: string): Metadata {
  const view = photoBySlug(slug);
  if (!view) return {};
  return { title: view.title, description: view.story, alternates: { canonical: `/photos/${view.slug}` } };
}
```
`pageMetadata` generalises this (title/description/relative canonical; **never** `openGraph`). `app/layout.tsx:30-35` gains `metadataBase: new URL(site.url)`, `openGraph {type, siteName, locale}`, `twitter {card:'summary_large_image'}`; no root canonical. `projects/[slug]/page.tsx:39-46` adds `alternates.canonical`. `/offline` adds `robots: { index: false }`.

### OG routes + `lib/og/template.tsx`
Static params analog: `app/(site)/projects/[slug]/page.tsx:33-37` (`dynamicParams = false`, `generateStaticParams` from `projects`); photos use `photoSlugs` / `photoBySlug` from `lib/photos/view-model.ts`. Colours only from `data/generated/tokens.ts` `tokens.hex` (lines 3-10; extend via `scripts/tokens/build-tokens.mjs`). Profile glyph and waymark: port the path maths from `components/projects/RouteProfile.tsx` / `lib/trail-profile.ts` and `components/projects/TrailGradeMark.tsx` (flexbox-only Satori). Summit coordinates via `formatLatLon(lv95ToWgs84(terrain.summit.lv95))` as in `lib/ascent/summit.ts:48`. Rest: RESEARCH Pattern 3.

### `data/site.ts` / `data/types.ts`
Add to `Site` interface (`data/types.ts:30-41`) `url: string` and `location: { name; lat; lon; source }`, following the commented-required `attribution` precedent (line 39-40). Add values in `data/site.ts` with a sourcing comment like lines 8-14. `guard:identity` (`scripts/guards/check-identity.mjs`) + its `__selftest__/identity/good` fixture cover the new field.

### `lib/home-format.ts`
`fourDecimals` (34-37) → `fixedDecimals(v, d)`; `formatLatLon(pos, { decimals = 4 } = {})` (lines 46-50) keeps default output byte-identical (`lib/__tests__/home-format.test.ts:32-40` must still pass). Add `formatEntryTime` using the existing month table (lines ~20-32) and `formatCount`.

---

### e2e

- **`e2e/routes.ts`:** move `ROUTES` from `e2e/shell.spec.ts:21-32` verbatim (it imports `site`, `buildPhotoViews`); shell.spec imports it back.
- **`e2e/audit.spec.ts`:** copy the `settle()` scroll+fonts helper from `e2e/a11y-contact.spec.ts:22-40` (drop the opacity wait once motion is gone) and `import AxeBuilder from '@axe-core/playwright'` (line 2); loop structure from `e2e/shell.spec.ts:70-72` (`for (const [path] of ROUTES) test(...)`). CLS only when `browserName === 'chromium'` (precedent `e2e/design-system.spec.ts:78-80`); console allow-list precedent `e2e/home-canvas.spec.ts:131-132`.
- **`e2e/keyboard.spec.ts`:** analog `e2e/shell.spec.ts:250-306` (menu, Escape returns focus to button).
- **`e2e/seo.spec.ts` / server-HTML 404 case:** extend `e2e/shell.spec.ts:167-210` "Shell 404" (`HTTP 404, no redirect`) with `request.get('/projects/<token>')` body assertions; OG fetch uses path relative to baseURL (Pitfall 12).
- **`e2e/no-webgl.spec.ts:44-53`:** rewrite "contact keeps the form" like its "project detail keeps its content" sibling (canvas count 0).
- **`playwright.config.ts:61-81`:** copy the firefox block for webkit (`grepInvert: /@chromium-only/`, `testIgnore: [VISUAL, PERF]`), drop the `!process.env.CI` guard and stale comment (74-76); add `serviceWorkers: 'block'` to chromium/firefox/webkit `use` (pattern already on visual projects, lines 85/91). Retries line 45 vs `--fail-on-flaky-tests` per Pitfall 10.

## Shared Patterns

### Button / link classes
**Source:** `components/site/ErrorBody.tsx:13-16` (`PRIMARY`, `SECONDARY` consts) and `NotFoundBody.tsx:28-29` (text link). Apply to Contact, all edge pages, SavedPages, register entry. Copy as module consts, not new variants.

### Server-first with small client islands
**Source:** `app/(site)/projects/[slug]/page.tsx:9-17` doc comment (server page importing islands directly, no `next/dynamic`). Apply to contact and offline pages.

### Doc-comment header with requirement IDs
Every component/page opens with a JSDoc naming the requirement and UI-SPEC section (e.g. `NotFoundBody.tsx:3-9`, `app/not-found.tsx:4-10`). Apply to every new file.

### Metadata-only structured logs
**Source:** `app/api/feedback/route.ts:27-33`, `43-47` (`console.warn('[tag] …', { event, ip, timestamp })`). Apply to every feedback outcome.

### Never render visitor-controlled or error detail
**Source:** `components/site/ErrorBody.tsx:21-23` + `components/__tests__/global-error.test.tsx:15-29` (secret message/digest assertion). Apply the same assertion style to the slug-not-echoed test (NotFoundBody + e2e).

### Guards and selftests
**Source:** `scripts/guards/lib/legacy-dead-files.mjs:16`, `eslint.config.mjs:9-13`, `scripts/guards/palette-ratchet.json`. Drain lists to `[]`/`{}`; rewrite (not delete) fixtures `__selftest__/identity/bad-dead-import`, `identity/good` (SiteChrome mention of Footer), `palette/bad-emoji-legacy-imported`, `palette/emoji-legacy-dead`, `palette/v1names-dead-exempt`, `palette/v1names-alias-defs`, `palette/bad-wb`/`wb-tighten`. Run `npm run lint` (includes selftest + data:check).

## Delete Targets (not analogs)

| Target | Replaced by | References to fix |
|---|---|---|
| `components/Header.tsx` | `components/site/SiteNav.tsx` | `LEGACY_DEAD_FILES`, ratchet json, `identity/bad-dead-import` fixture |
| `components/Footer.tsx` | `components/site/SiteFooter.tsx` | `LEGACY_DEAD_FILES`, `identity/good/components/site/SiteChrome.tsx`, `palette/bad-emoji-legacy-imported` |
| `components/GlassmorphismNav.tsx` + `components/ContourBackground.tsx` | SiteNav / ContourField | `LEGACY_DEAD_FILES`, `LEGACY_COMPILER_FILES`, `.github/copilot-instructions.md:88` |
| `components/AnimatedGradientMesh.tsx` | plain `surface` | contact page, `eslint.config.mjs:10`, `e2e/visual/hide-canvas.css:4`, `e2e/a11y-contact.spec.ts` doc comment, `e2e/no-webgl.spec.ts:44-53` |
| `components/FeedbackForm.tsx` (+ test renamed) | `SummitRegister` | contact page |
| v1 aliases, `--text-shadow-glow*` (`globals.css:154-159`), Phase 4 block (`:480-560`) | L2 tokens | backstop placed after `@import "tailwindcss"`, before L2 block (Pitfall 7) |
| `public/images/optimized/` (60 files) | manifest derivatives | first: `asset-exists` test, `scripts/photos/build-derivatives.mjs` `legacyOf()` (~416-418), schema `LegacyUrl`, `data/__tests__/editorial.test.ts:129`, `image-manifest.test.ts:75` |

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `app/sitemap.ts`, `app/robots.ts` | metadata route | batch | No metadata routes exist; use RESEARCH Pattern 4 + Next docs |
| `app/**/opengraph-image.tsx`, `lib/og/template.tsx` | metadata route | file-I/O | No `next/og` use yet; RESEARCH Pattern 3 (spike A3/A4/A10) |
| `e2e/service-worker.spec.ts` | e2e | event-driven | No SW-enabled spec; RESEARCH "SW update e2e" |
| `components/site/SavedPages.tsx` | client island | Cache Storage read | No Cache Storage reader; closest browser-API island is `components/ServiceWorkerRegistration.tsx` |
| `lib/useProgressiveTextures.ts` refactor | hook | event-driven | No compiler-clean texture-map hook in repo |
| proxy rewrite to unmatched path | middleware | request-response | Unproven (A1) — Wave 0 spike |

## Metadata

**Analog search scope:** `app/`, `components/`, `lib/`, `data/`, `e2e/`, `public/service-worker.js`, `proxy.ts`, `playwright.config.ts`, `eslint.config.mjs`, `scripts/guards/`
**Files scanned:** ~45
**Pattern extraction date:** 2026-11-02
