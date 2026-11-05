---
phase: 12-contact-edge-pages-cleanup-verification
reviewed: 2026-11-03T15:13:55Z
depth: standard
scope: incremental (cefd2a4..HEAD, follow-up plans 12-27..12-34)
files_reviewed: 37
files_reviewed_list:
  - README.md
  - app/api/__tests__/feedback.test.ts
  - app/api/feedback/route.ts
  - app/global-error.tsx
  - app/not-found.tsx
  - components/ServiceWorkerRegistration.tsx
  - components/__tests__/global-error.test.tsx
  - components/contact/SummitRegister.tsx
  - components/contact/__tests__/SummitRegister.test.tsx
  - components/projects/DemoTerminal.tsx
  - components/projects/__tests__/DemoTerminal.test.tsx
  - components/site/ErrorBody.tsx
  - components/site/SavedPages.tsx
  - components/site/__tests__/ErrorBody.test.tsx
  - components/site/__tests__/SavedPages.test.tsx
  - data/__tests__/precache.test.ts
  - data/generated/precache.json
  - e2e/contact-form.spec.ts
  - e2e/design-system.spec.ts
  - e2e/not-found.spec.ts
  - e2e/service-worker.spec.ts
  - e2e/shell.spec.ts
  - lib/__tests__/proxy.test.ts
  - lib/__tests__/service-worker-media.test.ts
  - lib/__tests__/service-worker-navigation.test.ts
  - lib/__tests__/sw-update.test.ts
  - lib/__tests__/useProgressiveTextures.test.ts
  - lib/edge-section.ts
  - lib/sw-update.ts
  - lib/useProgressiveTextures.ts
  - playwright.config.ts
  - proxy.ts
  - public/service-worker.js
  - scripts/guards/test-count.baseline.json
  - scripts/guards/version-floors.json
  - scripts/inject-build-hash.mjs
  - scripts/terrain/build-terrain.mjs
findings:
  critical: 0
  warning: 0
  info: 5
  total: 5
status: issues_found
---

# Phase 12: Code Review Report (incremental re-review after 12-27..12-34)

**Reviewed:** 2026-11-03T15:13:55Z
**Depth:** standard
**Files Reviewed:** 37
**Status:** issues_found

## Summary

This is an incremental re-review (#3661) of `git diff cefd2a4..HEAD` for the 37 files the follow-up plans 12-27 to 12-34 changed. It replaces the earlier 12-REVIEW.md. Unchanged code was read only for context. As instructed, these are not raised: IN-02's accepted residual (AR-12-02: paths the matcher skips trust `x-edge-section`), the root-level 404's typed path in RSC flight data, and the `__BUILD_HASH__` / `__PRECACHE_URLS__` placeholders in the committed `public/service-worker.js`.

New finding IDs continue from the earlier review (IN-08 onward). Reusing WR-01..IN-07 for different findings would make the disposition gate drop the rows already recorded in 12-REVIEW-DISPOSITION.md.

**Checks on the ten fixed findings.** Each fix was traced through its call path. None introduced a regression.

| Earlier finding | Fix verified | Notes |
|---|---|---|
| WR-01 | Yes | `send()` (SummitRegister.tsx:493-497) turns a `validation` answer with no visible-field issue into the `send` failure box, which gets focus and has Retry. `errors` and `summarySeq` are already clear at that point: the submit or Retry that started the send ran `showErrors({})`, and the fields are read-only while sending. See IN-08 for the Retry that follows. |
| WR-02 | Yes | The callback ref with a cleanup (DemoTerminal.tsx:181-192) works with React 19 ref cleanups. `useCallback([])` keeps the ref stable, so React calls it only on attach and detach. `setOffscreen` is a stable setter. A stale `offscreen` value left from a removed node is corrected by the first callback the new observer fires on `observe()`. The tests report only to live observers (`reportVisibility`), so they would catch a missing re-attach. |
| WR-03 | Yes | The README names match `lib/email.ts:8,33-34` and `lib/rate-limit.ts:24-25`. "Couldn't send." is right: a missing key throws in `sendFeedbackEmail`, which returns 502 `send-failed` and maps to the `send` failure. Node 24 matches `engines.node` and `.node-version`. See IN-11. |
| WR-04 | Yes | `storeCopy` clones right away and calls `event.waitUntil` synchronously, before the `respondWith` promise settles (service-worker.js:43, 75, 113). That is allowed while the promise is pending. A rejected `put` is caught. The navigation test checks the order (`handedOverAtAnswer === 1`). See IN-09 for a small robustness gap. |
| IN-01 | Yes | The `too_long` name copy is used both by the client `validateField` and by the server-answer path. See IN-10 for the hard-coded literal. |
| IN-03 | Yes | `sourcesKey` drives both the render-phase reset and the effect deps. The loader effect is declared after the ref-writing effect, so it reads the new `sourcesRef.current` in the same commit. A new array holding the same URLs starts no new load (tested). |
| IN-04 | Yes | `startUpdateChecks` clears the interval, schedules nothing if stopped before `register()` resolves, and catches `update()` rejections. `register` is called as a method on the container, so `this` stays bound. |
| IN-05 | Yes | The React `<title>` in global-error is hoisted into the head. The test checks for exactly one title element. |
| IN-06 | Yes | `retry()` runs the same `validateAll` gate as submit. When fields are invalid, `showErrors` clears the failure box and opens a focused summary. |
| IN-07 | Yes | In Zod 4, `z.email()` uses the same check as the deprecated `z.string().email()`. The new accept/reject cases pin it. |

**Other changes checked.**
- **C1 matcher:** dropping only the `purpose: prefetch` entry, with `next-router-prefetch` kept, matches the stated intent. This departs on purpose from the Next 16.4 CSP guide (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md:148-152`). The e2e RED test (`/__no-such-page__` with a forged header) would fail under the old matcher.
- **C2 hero precache:** `contours-hero.2f3a04accc.svg` (45 KB) passes the `PRECACHE_URL` pattern in `inject-build-hash.mjs:40`. EdgeArt is the only `/offline` consumer of the hero LOD. No other code reads precache.json's length.
- **Comments:** the comment claims in `not-found.tsx`, `edge-section.ts` and `proxy.ts` are accurate. `HIDDEN_REQUEST_HEADERS` in `node_modules/next/dist/server/async-storage/request-store.js:47-54` does spread `FLIGHT_HEADERS`.
- **Test-count baseline:** the totals add up (1694 + 549 = 2243).
- **Version floors:** both new floors match the only lockfile copy of each package (no nested copies).

No BLOCKER or WARNING findings. The five Info items below are robustness and maintainability gaps in the new code.

## Narrative Findings (AI reviewer)

## Info

### IN-08: A fieldless `validation` answer now offers Retry, but the retry is deterministic and costs a rate-limit slot each time

**File:** `components/contact/SummitRegister.tsx:494-497` (with `app/api/feedback/route.ts:91-111`)
**Issue:** The WR-01 fix maps a `validation` answer that names no visible field to `{ kind: 'send' }`, and that failure renders the Retry button (line 599). A fieldless answer comes from server-side validation of the same payload: malformed JSON, or a field the visitor cannot see or change, such as `trail_note` over `honeypotMax`. Retrying the same values gets the same 400 every time. The route consumes the rate-limit slot before it parses the body (route.ts:91 before :101). Five retries in an hour therefore turn the box into "Too many attempts." The visitor is invited to retry an outcome that cannot change. The mailto link in the copy is the only real way out.
**Fix:** Keep the `send` copy but do not offer Retry for this case. For example, add a flag to the failure:
```tsx
// send()
if (!FIELDS.some((f) => next[f])) {
  setFailure((prev) => ({ failure: { kind: 'send', retryable: false }, seq: (prev?.seq ?? 0) + 1 }));
  return;
}
// render
{(failure.failure.kind === 'send' && failure.failure.retryable !== false) || failure.failure.kind === 'network' ? <RetryButton/> : null}
```
Since Tim approved the copy, this needs his call on whether Retry should show here.

### IN-09: `storeCopy` has no guard against a synchronous throw, so a cache-side failure can replace a good network answer

**File:** `public/service-worker.js:23-31, 40-48, 108-119`
**Issue:** `storeCopy` runs `response.clone()` and `event.waitUntil(...)` synchronously. In `cacheFirst` and `networkFirst` the call sits inside the `try` that wraps `fetch`. If either call throws (`clone()` throws a TypeError on a used or locked body; `waitUntil` throws InvalidStateError on an inactive event), the `catch` treats it as a network failure. `cacheFirst` then returns `undefined` (a network error for an asset that downloaded fine), and `networkFirst` returns a cache match or `undefined`. In `networkFirstNavigation` the same call is outside the `try`, so a throw rejects `respondWith` instead. Neither throw happens on the current paths, because the response is fresh and the event is still pending. But the helper's own comment says a store failure must never cost the visitor the network answer, and only the asynchronous rejection is protected.
**Fix:**
```js
function storeCopy(event, cacheName, request, response) {
  try {
    const copy = response.clone();
    event.waitUntil(caches.open(cacheName).then((cache) => cache.put(request, copy)).catch(() => {}));
  } catch {
    // The visitor still gets the network answer; this copy is just not stored.
  }
}
```

### IN-10: The new name too-long copy hard-codes `100` beside a check that reads `FEEDBACK_LIMITS.nameMax`

**File:** `components/contact/SummitRegister.tsx:36` (check at :61, limit at `lib/contact/api-contract.ts:62`)
**Issue:** `validateField` checks `value.length > FEEDBACK_LIMITS.nameMax`, but the message reads the literal `"Shorten your name to 100 characters"`. If `nameMax` changes, the input's `maxLength`, the client check and the server all move, but the copy still says 100. The message copy (`2,000`, `10`) follows the same pattern, but this string is new in 12-28.
**Fix:** `` `Shorten your name to ${formatCount(FEEDBACK_LIMITS.nameMax)} characters (now ${formatCount(value.length)}).` `` gives the same output today (the existing `validateField` tests still pass).

### IN-11: README says Vercel's Upstash integration "injects them"; the code reads only the `UPSTASH_REDIS_REST_*` names

**File:** `README.md:338` (code: `lib/rate-limit.ts:24-27`)
**Issue:** The deploy section offers "add Vercel's Upstash integration, which injects them" as an alternative to setting `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. `createRateLimiter` gates on those two names exactly and otherwise falls back to an always-allow limiter, logging a single `console.warn`. As far as I know, Vercel Marketplace Upstash stores provisioned through the former Vercel KV path inject `KV_REST_API_URL` and `KV_REST_API_TOKEN`. I could not confirm this offline. If that is what a store injects, following the README leaves production `/api/feedback` with no rate limit, and nothing visible shows it. The README also calls the Upstash pair "optional" (line 20) with no note that this means unlimited sends in production.
**Fix:** Do one of these. (a) Accept both name pairs in `lib/rate-limit.ts`, e.g. `const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL`, and pass `url` and `token` to `new Redis({ url, token })`. (b) Reword the README to "make sure the integration exposes `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`" and note that without them production sends are unlimited.

### IN-12: The new advisory floors (`source-map-js`, `baseline-browser-mapping`) are checked only on the hoisted lockfile copy

**File:** `scripts/guards/version-floors.json:16-17` (guard: `scripts/guards/check-install-parity.mjs:143, 215`)
**Issue:** `lockVersion(name)` reads only `packages["node_modules/<name>"]`. These two floors were added to pin advisory patches (12-27, D-25), and both are transitive. If a later dependency bump nests an older copy (`node_modules/<dep>/node_modules/source-map-js`), the guard passes while the vulnerable version ships. The repo already has this nested pattern with `three-stdlib/node_modules/fflate`. Today each package has a single copy, so nothing fails yet.
**Fix:** For floored packages, check every lockfile entry whose key ends in `node_modules/<name>`:
```js
const versions = Object.entries(lock.packages)
  .filter(([k]) => k === `node_modules/${name}` || k.endsWith(`/node_modules/${name}`))
  .map(([, v]) => v.version);
```
Keep an allow-list for intentional nested pins such as `fflate@^0.6.0` (see the `overrides` in package.json).

---

_Reviewed: 2026-11-03T15:13:55Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard (incremental, cefd2a4..HEAD)_
