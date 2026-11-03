---
phase: 12-contact-edge-pages-cleanup-verification
reviewed: 2026-11-03T10:37:02Z
depth: standard
files_reviewed: 174
files_reviewed_list:
  - .gitattributes
  - .github/copilot-instructions.md
  - .github/workflows/ci.yml
  - README.md
  - app/(site)/contact/page.tsx
  - app/(site)/offline/page.tsx
  - app/(site)/page.tsx
  - app/(site)/photos/[slug]/opengraph-image.tsx
  - app/(site)/photos/page.tsx
  - app/(site)/projects/[slug]/opengraph-image.tsx
  - app/(site)/projects/[slug]/page.tsx
  - app/(site)/projects/page.tsx
  - app/(site)/roadmap/page.tsx
  - app/api/__tests__/feedback.test.ts
  - app/api/feedback/route.ts
  - app/global-error.tsx
  - app/globals.css
  - app/layout.tsx
  - app/not-found.tsx
  - app/opengraph-image.tsx
  - app/robots.ts
  - app/sitemap.ts
  - components/ServiceWorkerRegistration.tsx
  - components/__tests__/SafeCanvas.test.tsx
  - components/__tests__/global-error.test.tsx
  - components/contact/CopyEmailButton.tsx
  - components/contact/DirectContactPanel.tsx
  - components/contact/SummitRegister.tsx
  - components/contact/__tests__/CopyEmailButton.test.tsx
  - components/contact/__tests__/DirectContactPanel.test.tsx
  - components/contact/__tests__/SummitRegister.test.tsx
  - components/home/TerrainStage.tsx
  - components/home/__tests__/terrain-stage.test.tsx
  - components/photos/PhotoViewer.tsx
  - components/projects/DemoTerminal.tsx
  - components/projects/EndBlock.tsx
  - components/projects/RoutePanel.tsx
  - components/projects/__tests__/DemoTerminal.test.tsx
  - components/projects/__tests__/EndBlock.test.tsx
  - components/projects/__tests__/Metrics.test.tsx
  - components/projects/sections/Metrics.tsx
  - components/roadmap/RouteLog.tsx
  - components/roadmap/RouteRow.tsx
  - components/roadmap/__tests__/RouteLog.test.tsx
  - components/site/EdgeArt.tsx
  - components/site/EdgeLayout.tsx
  - components/site/ErrorBody.tsx
  - components/site/NotFoundBody.tsx
  - components/site/OfflineRetry.tsx
  - components/site/SavedPages.tsx
  - components/site/__tests__/EdgeLayout.test.tsx
  - components/site/__tests__/ErrorBody.test.tsx
  - components/site/__tests__/NotFoundBody.test.tsx
  - components/site/__tests__/OfflineRetry.test.tsx
  - components/site/__tests__/SavedPages.test.tsx
  - data/__tests__/asset-exists.test.ts
  - data/__tests__/editorial.test.ts
  - data/__tests__/image-manifest.test.ts
  - data/__tests__/precache.test.ts
  - data/__tests__/projects.test.ts
  - data/__tests__/roadmap.test.ts
  - data/__tests__/site.test.ts
  - data/__tests__/tokens.test.ts
  - data/generated/image-manifest.ts
  - data/generated/tokens.ts
  - data/roadmap.ts
  - data/schemas/image-manifest.ts
  - data/schemas/project.ts
  - data/schemas/roadmap.ts
  - data/site.ts
  - data/types.ts
  - e2e/a11y-contact.spec.ts
  - e2e/audit.spec.ts
  - e2e/case-study.spec.ts
  - e2e/contact-form.spec.ts
  - e2e/demo-clip.spec.ts
  - e2e/helpers/audit.ts
  - e2e/helpers/engine.ts
  - e2e/home-ascent.spec.ts
  - e2e/keyboard.spec.ts
  - e2e/no-webgl.spec.ts
  - e2e/not-found.spec.ts
  - e2e/offline.spec.ts
  - e2e/og.spec.ts
  - e2e/photos-carousel.spec.ts
  - e2e/photos-lightbox.spec.ts
  - e2e/photos-sweep.spec.ts
  - e2e/photos.spec.ts
  - e2e/projects.spec.ts
  - e2e/roadmap.spec.ts
  - e2e/routes.ts
  - e2e/seo.spec.ts
  - e2e/service-worker.spec.ts
  - e2e/shell.spec.ts
  - e2e/visual/hide-canvas.css
  - e2e/visual/routes.spec.ts-snapshots/contact/1440-reduced-visual-dark-linux.png
  - e2e/visual/routes.spec.ts-snapshots/contact/375-reduced-visual-dark-linux.png
  - e2e/visual/routes.spec.ts-snapshots/contact/768-reduced-visual-dark-linux.png
  - e2e/visual/routes.spec.ts-snapshots/not-found/1440-reduced-visual-dark-linux.png
  - e2e/visual/routes.spec.ts-snapshots/not-found/375-reduced-visual-dark-linux.png
  - e2e/visual/routes.spec.ts-snapshots/not-found/768-reduced-visual-dark-linux.png
  - e2e/visual/routes.spec.ts-snapshots/offline/1440-reduced-visual-dark-linux.png
  - e2e/visual/routes.spec.ts-snapshots/offline/375-reduced-visual-dark-linux.png
  - e2e/visual/routes.spec.ts-snapshots/offline/768-reduced-visual-dark-linux.png
  - e2e/visual/routes.spec.ts-snapshots/roadmap/1440-reduced-visual-dark-linux.png
  - e2e/visual/routes.spec.ts-snapshots/roadmap/375-reduced-visual-dark-linux.png
  - e2e/visual/routes.spec.ts-snapshots/roadmap/768-reduced-visual-dark-linux.png
  - eslint.config.mjs
  - lib/__tests__/color-backstop.test.ts
  - lib/__tests__/demo-terminal.test.ts
  - lib/__tests__/edge-art.test.ts
  - lib/__tests__/home-format.test.ts
  - lib/__tests__/metadata.test.ts
  - lib/__tests__/photos-view-model.test.ts
  - lib/__tests__/proxy.test.ts
  - lib/__tests__/saved-pages.test.ts
  - lib/__tests__/service-worker-navigation.test.ts
  - lib/__tests__/sw-update.test.ts
  - lib/__tests__/useProgressiveTextures.test.ts
  - lib/contact/__tests__/api-contract.test.ts
  - lib/contact/api-contract.ts
  - lib/demo-terminal.ts
  - lib/edge-art.ts
  - lib/edge-section.ts
  - lib/email.ts
  - lib/home-format.ts
  - lib/metadata.ts
  - lib/og/__tests__/routes.test.ts
  - lib/og/__tests__/template.test.tsx
  - lib/og/fonts/Inter-Regular.ttf
  - lib/og/fonts/JetBrainsMono-Regular.ttf
  - lib/og/fonts/OFL-Inter.txt
  - lib/og/fonts/OFL-JetBrainsMono.txt
  - lib/og/fonts/OFL-SchibstedGrotesk.txt
  - lib/og/fonts/README.md
  - lib/og/fonts/SchibstedGrotesk-SemiBold.ttf
  - lib/og/template.tsx
  - lib/photos/view-model.ts
  - lib/saved-pages.ts
  - lib/sw-update.ts
  - lib/useAscentMode.ts
  - lib/useProgressiveTextures.ts
  - next.config.ts
  - package-lock.json
  - package.json
  - playwright.config.ts
  - proxy.ts
  - public/service-worker.js
  - scripts/README.md
  - scripts/guards/__selftest__/identity/bad-former-dead-files/app/page.tsx
  - scripts/guards/__selftest__/identity/bad-former-dead-files/components/Footer.tsx
  - scripts/guards/__selftest__/identity/bad-former-dead-files/components/Header.tsx
  - scripts/guards/__selftest__/identity/bad-former-dead-files/components/Shell.tsx
  - scripts/guards/__selftest__/identity/bad-former-dead-files/data/site.ts
  - scripts/guards/__selftest__/identity/bad-former-dead-files/package.json
  - scripts/guards/__selftest__/identity/good/components/Footer.tsx
  - scripts/guards/__selftest__/identity/good/components/site/SiteChrome.tsx
  - scripts/guards/__selftest__/palette/bad-emoji-former-dead-imported/app/page.tsx
  - scripts/guards/__selftest__/palette/bad-emoji-former-dead-imported/components/Footer.tsx
  - scripts/guards/__selftest__/palette/bad-emoji-former-dead/components/Footer.tsx
  - scripts/guards/__selftest__/palette/bad-v1names-former-dead/components/Header.tsx
  - scripts/guards/check-contrast.mjs
  - scripts/guards/check-identity.mjs
  - scripts/guards/check-palette.mjs
  - scripts/guards/lib/legacy-dead-files.mjs
  - scripts/guards/palette-ratchet.json
  - scripts/guards/selftest.mjs
  - scripts/guards/test-count.baseline.json
  - scripts/guards/version-floors.json
  - scripts/photos/build-derivatives.mjs
  - scripts/photos/build-photo-data.mjs
  - scripts/photos/extract-exif.mjs
  - scripts/terrain/fetch-trails.mjs
  - scripts/tokens/build-tokens.mjs
findings:
  critical: 0
  warning: 4
  info: 7
  total: 11
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-11-03T10:37:02Z
**Depth:** standard
**Files Reviewed:** 174
**Status:** issues_found

## Summary

Scope: the 174 files from the workflow list (diff base `548f731a`). All production source was read in full: the feedback route and contract, `lib/email.ts`, `proxy.ts`, the service worker and its registration, the contact islands, the edge pages, the OG template and routes, metadata, sitemap, robots, the data schemas and the build and guard scripts. Test and e2e files were checked for reliability problems (missing assertions, skips, swallowed errors). They were not traced line by line. The binary baselines and TTFs were checked only for how they are referenced. The OG font SHA-256 values in `lib/og/fonts/README.md` match the committed files. In `package-lock.json`, only the zod 4.6.7 and fflate 0.8.3 / 0.6.11 entries and the overrides were checked, and they are consistent with each other.

Checks run: `npx tsc --noEmit` is clean. Targeted Jest (feedback route, contact components, proxy, SW navigation) passes 191 of 191. The existing `.next` build trace for the photo OG route includes the fonts and the 1200 px JPEG derivatives, so the "file tracing ships them" claim holds.

Security looks sound. The proxy's neutral-404 fetch is limited to loopback and the Vercel hostnames, does not recurse on `_`, and drops `x-middleware-*`. The route checks origin, then the rate limit, then parsing, and never echoes values. The email HTML is escaped. No CSP regressions were found. The remaining problems are mostly robustness gaps. A server `validation` answer with no visible field leaves the contact form silent. The DemoTerminal IN-01 fix can leave the terminal paused because its IntersectionObserver watches a removed element. The README still names the wrong env variable for the contact form. The new navigation caching writes are not tied to the fetch event's lifetime.

No BLOCKER-level defect could be proven.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: A `validation` answer with no visible-field issue leaves the form silent: no error, no confirmation

**File:** `components/contact/SummitRegister.tsx:472-481` (with `app/api/feedback/route.ts:54-74,107-112`)
**Issue:** The route sends `{ code: 'validation' }` with no `fields` in three cases: the body is not valid JSON, the honeypot is over 200 characters, or the only failing key is not `name`, `email` or `message` (for example a non-boolean `interestedInCollaboration`). `fieldIssues` filters to `FIELDS` and returns `undefined`. On the client, `outcomeOf` maps this to `{ kind: 'validation', fields: undefined }`. `send` then builds an empty `next`, calls `setFailure(null)` and `showErrors({})`. `showErrors` sees no invalid field and sets `summarySeq` to 0. The result: Sending ends, the button reads "Send Message" again, and nothing is announced or shown. The visitor gets neither "Register signed" nor a failure box, and the attempt has used one of the 5 hourly rate-limit slots. The form cannot reach this case today, but any future schema field, a contract drift or an autofilled honeypot lands in silent nothing. No Jest case covers a `validation` answer without `fields`; all three cases pass `fields: { email: 'invalid_email' }`.
**Fix:** If the server says `validation` but names no field the visitor can fix, show the generic failure:
```tsx
if (outcome.kind === 'validation') {
  const next: Errors = {};
  for (const field of FIELDS) {
    const issue = outcome.fields?.[field];
    if (issue) next[field] = issueMessage(field, issue, v[field]);
  }
  if (!FIELDS.some((f) => next[f])) {
    setFailure((prev) => ({ failure: { kind: 'send' }, seq: (prev?.seq ?? 0) + 1 }));
    return;
  }
  setFailure(null);
  showErrors(next);
  return;
}
```
Add a SummitRegister test for `answer(400, { code: 'validation' })`.

### WR-02: DemoTerminal's IN-01 "restart on shrink" unmounts the observed region; the IntersectionObserver then watches a removed element

**File:** `components/projects/DemoTerminal.tsx:177-189, 215-219`
**Issue:** The IntersectionObserver effect has empty deps (`}, []);` at line 189). It observes `regionRef.current` exactly once, at mount. The new guard at 215-219 returns `null` for one render when `state.index >= count`, which unmounts the `role="region"` div. The next render mounts a new div. The observer still holds the removed node. When an observed target leaves the document, the browser reports it as not intersecting, so `setOffscreen(true)` runs. After that, nothing ever observes the new region, and `offscreen` stays `true`, so `isPlaying` is false: the terminal stays paused for the rest of the page's life. A second path: if the component first mounts with `commands = []`, the effect finds no region, returns, and never runs again, so a later non-empty list is never observed. jsdom has no real IntersectionObserver, so the Jest suite cannot see this.
**Fix:** Keep the region mounted and clamp the index instead of returning `null`, or attach the observer through a callback ref so it follows the node:
```tsx
// replace the early return
const index = state.index < count ? state.index : 0;
if (count === 0) return null; // only after every hook, and only for a truly empty list
if (state.index >= count) setState(initialState()); // render continues with `index`
const current = commands[index];
```
Or make the observer effect depend on `count > 0` (or use a ref callback) so it re-observes whenever the region node changes.

### WR-03: README still documents `FEEDBACK_EMAIL`; the code requires `FEEDBACK_RECIPIENT_EMAIL`, so following the README makes every contact send return 502

**File:** `README.md:88`, `README.md:326`, `README.md:385` (code: `lib/email.ts:33-37`)
**Issue:** This phase rewrote much of the README (315 lines) but left `FEEDBACK_EMAIL=your.email@example.com` in setup step 4 (line 88) and "Add `FEEDBACK_EMAIL` if using email notifications" in the Vercel deploy steps (line 326). `sendFeedbackEmail` reads only `FEEDBACK_RECIPIENT_EMAIL` and throws when it is unset. The route turns that into a 502 `send-failed` on every submission, and the visitor sees "Couldn't send." A deployer who follows the README ships a contact form that never delivers. Lines 294-300 do list the right names, so the README now contradicts itself. Line 385 also still says "any Node.js 20+ server", while `package.json` `engines.node` is `24.x`, and the data scripts use Node 24 type-stripping.
**Fix:** Replace both `FEEDBACK_EMAIL` mentions with `RESEND_API_KEY`, `FEEDBACK_RECIPIENT_EMAIL` and optionally `FEEDBACK_FROM_EMAIL` (and `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`), matching `.env.example`. Change "Node.js 20+" to "Node.js 24".

### WR-04: Service-worker cache writes are fire-and-forget, so a navigation copy can be lost and a quota error is an unhandled rejection

**File:** `public/service-worker.js:56-59` (same pattern at `24-27` and `94-97`)
**Issue:** `networkFirstNavigation` is the new EDGE-02 path that saves pages for the offline list and the offline fallback. It calls `cache.put(request, response.clone())` without awaiting it and without `event.waitUntil`. The fetch event's lifetime extension ends once the `respondWith` promise settles, so the browser may stop the worker while the clone is still streaming into Cache Storage. The page then is not saved, and `/offline`'s "Saved on this device" list and the offline fallback miss it with no error. If `put` rejects (QuotaExceededError, or the body was already consumed), the rejection is unhandled in the worker. `cacheFirst` and `networkFirst` have the same pattern; it predates this phase, but the new function copies it.
**Fix:** Pass the event (or a `waitUntil` callback) into the helpers and tie the write to it:
```js
async function networkFirstNavigation(event) {
  const { request } = event;
  // ...
  if (response.ok && response.type === 'basic' && !response.redirected) {
    const copy = response.clone();
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
    );
  }
  return response;
}
// fetch handler: event.respondWith(networkFirstNavigation(event));
```

## Info

### IN-01: The name field's "too long" error reads "Enter your name."

**File:** `components/contact/SummitRegister.tsx:33, 56`
**Issue:** `issueMessage` returns `'Enter your name.'` for every name issue, including `too_long`. Both `validateField` (`value.length > nameMax`) and a server `fields.name: 'too_long'` therefore tell the visitor to enter a name they already entered. `maxLength={100}` stops typing past the limit, so the main path is programmatic input or a server-side limit change, but the copy is wrong whenever it shows.
**Fix:** Add a cause-plus-fix message for `name`/`too_long`, for example `Shorten your name to 100 characters (now ${value.length}).`, approved like the other field copy.

### IN-02: The T-12-02 "only the proxy may name the section" guarantee does not hold where the proxy does not run

**File:** `proxy.ts:195, 216-226`; `app/not-found.tsx:27`
**Issue:** The proxy deletes a visitor-sent `x-edge-section` only on requests its matcher covers. The matcher skips `/api…` (no trailing slash, so `/apiary` too) and every request carrying `next-router-prefetch` or `purpose: prefetch`. An unmatched path in those groups still renders `app/not-found.tsx`, which trusts the header. The impact is cosmetic: `parseEdgeSection` only accepts `photos` or `projects`, and only the sender sees the result. Still, the code comment states a guarantee the matcher does not give.
**Fix:** Either narrow the comment to "on proxied requests", or make the 404 ignore the header unless a proxy-only marker is also present (for example, the proxy sets a second header whose value is a per-deploy secret, and the 404 checks it).

### IN-03: `useProgressiveTextures` never reloads when the sources change but their count does not

**File:** `lib/useProgressiveTextures.ts:105-192`
**Issue:** The loader effect is keyed on `[count]` only and captures `sourcesRef.current` once. A new `sources` array of the same length (different photos, a reordered list) keeps the old textures, and `loadState` describes the old images. Today's only consumer (`PhotoCarousel3D`) passes a static list, so this is latent.
**Fix:** Key the effect on a stable identity of the URLs, for example `const key = sources.map((s) => s.fullSrc).join('\n')`, and use `[key]` in place of `[count]`. Reset state the same way the `trackedCount` block does.

### IN-04: The service-worker update interval is never cleared, and its rejection is unhandled

**File:** `components/ServiceWorkerRegistration.tsx:24-26`
**Issue:** The hourly `setInterval(() => registration.update(), …)` is created inside the `.then`, and the effect cleanup never clears it. `registration.update()` rejects while offline or when the script fetch fails, and nothing catches it, so an offline tab (the `/offline` page, for instance) logs an "Uncaught (in promise)" error every hour.
**Fix:** Store the interval id, clear it in the effect cleanup, and use `registration.update().catch(() => {})`.

### IN-05: `global-error` renders no `<title>`

**File:** `app/global-error.tsx:86-94`
**Issue:** The component replaces the root layout and correctly exports no `metadata`. The installed Next docs (`03-file-conventions/error.md`, "Good to know") recommend a React `<title>` instead. Without one, the document title the route announcer reads after a root failure is empty or stale.
**Fix:** Add `<title>Something went wrong · Tim Lui</title>` inside `<html>` (React 19 hoists it into the head).

### IN-06: Retry re-sends the current values without client-side validation

**File:** `components/contact/SummitRegister.tsx:582`
**Issue:** `onClick={() => void send(values)}` skips `validateField`. If the visitor changed a field after the failure (for example, shortened the message below 10 characters), the request goes out anyway, uses a rate-limit slot (5 per hour), and the server's `validation` answer brings the error back. The client could have caught it without a request.
**Fix:** Route Retry through the same validation as submit, for example by extracting `validateAll(values)` from `onSubmit` and calling it before `send`.

### IN-07: `z.string().email()` is the deprecated Zod 4 form

**File:** `app/api/feedback/route.ts:28`
**Issue:** Zod 4 (4.6.7 here) deprecates the `.email()` string method in favour of the top-level `z.email()`. It still works, but it will warn or break on a future major version, and the version floor pins zod in `scripts/guards/version-floors.json`.
**Fix:** `email: z.email(),`. The issue code stays `invalid_format`, which `fieldIssues` already maps to `invalid_email`.

---

_Reviewed: 2026-11-03T10:37:02Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
