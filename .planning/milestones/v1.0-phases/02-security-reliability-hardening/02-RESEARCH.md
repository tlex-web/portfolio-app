# Phase 2: Security & Reliability Hardening - Research

**Researched:** 2026-02-16
**Domain:** Web security (CSP, CSRF), serverless reliability (persistent rate limiting, service worker cache management)
**Confidence:** HIGH

## Summary

This phase hardens an existing Next.js 16.1.6 portfolio application with four capabilities: nonce-based Content Security Policy, CSRF protection on the feedback API, persistent rate limiting via Upstash Redis, and build-hash-based service worker cache invalidation. The codebase already has a rudimentary CSP (with `unsafe-inline` and `unsafe-eval`), an in-memory rate limiter that resets on every deployment, a basic service worker with a hardcoded `v1` cache version, and no CSRF protection at all.

Next.js 16 renamed `middleware.ts` to `proxy.ts` -- this is a critical migration point. The official CSP documentation now uses `proxy.ts` with a named `proxy` export. The nonce-based CSP approach requires dynamic rendering for all pages that use nonces, which has performance implications but is the standard approach for strict CSP. For this portfolio site, the user has already decided to accept a targeted `unsafe-eval` exception for Three.js shader compilation and to use nonces to remove `unsafe-inline` for scripts.

For rate limiting, Upstash's `@upstash/ratelimit` with `@upstash/redis` is the standard serverless solution -- the current in-memory `Map` approach resets on every cold start or redeployment. CSRF can be implemented efficiently with Origin header checking in the API route handler itself, avoiding the need for token management. The service worker needs a build script that injects the Next.js build ID into the service worker file during the build process.

**Primary recommendation:** Use `proxy.ts` for CSP nonce injection, Origin-header checking for CSRF, `@upstash/ratelimit` with sliding window for persistent rate limiting, and a prebuild script to inject the Next.js build hash into the service worker.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Third-party resource policy
- Vercel Analytics is the only third-party service -- CSP must allow Vercel's analytics domains
- Fonts are self-hosted (next/font or bundled) -- no external font CDN needed in CSP
- No external embeds (YouTube, CodePen, social widgets) -- no frame-src exceptions needed
- All content is self-hosted -- CSP can be tight with minimal allowlist
- Three.js: accept a targeted `unsafe-eval` exception for shader compilation -- pragmatic, minimal risk
- Remove `unsafe-inline` for scripts (use nonce-based allowlisting)

#### Rate limit thresholds
- 5 submissions per hour per user on the feedback form
- Rate limiting applies to the feedback form endpoint only -- not all API routes
- Friendly message without countdown: "Please wait a bit before sending another message."
- Use Vercel KV / Upstash as the persistent backing store (survives redeployments)

#### Cache refresh experience
- Silent background refresh -- service worker updates automatically, new version loads on next navigation, no user prompt
- Basic offline page -- show a simple "You're offline" page when network is unavailable
- Caching strategy by asset type:
  - **Cache-first:** JS, CSS, fonts, optimized images, 3D textures (fingerprinted by Next.js build, safe to cache aggressively)
  - **Stale-while-revalidate:** HTML pages (fast repeat visits, content at most one visit behind)
  - **Network-only:** API routes (feedback form -- never cached)
- Build version hash auto-embedded into service worker -- fully automatic cache invalidation on deploy

#### Security error messaging
- CSRF failure: "Your session may have expired. Please refresh and resubmit." -- specific but friendly, no technical jargon
- Rate limit hit: "Please wait a bit before sending another message." -- no countdown timer
- Security errors use the same visual style as form validation errors -- consistent, no special treatment
- CSP violations: silent, console-only -- no visible indicator to visitors, no server-side reporting
- All security rejections (CSRF, rate limit) logged server-side for monitoring abuse patterns

### Claude's Discretion
- CSRF implementation approach (token-based vs double-submit cookie vs origin checking)
- CSP nonce generation and injection mechanism
- Rate limit key derivation (IP, fingerprint, etc.)
- Service worker registration and lifecycle management
- Offline page design
- Exact Vercel KV/Upstash configuration

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | Content Security Policy uses nonce-based approach, removing `unsafe-inline` and `unsafe-eval` where possible | Proxy.ts nonce generation pattern from official Next.js 16 docs; `unsafe-eval` kept only in script-src for Three.js shaders; `strict-dynamic` allows nonce-loaded scripts to load their dependencies |
| SEC-02 | Feedback API endpoint has CSRF token validation preventing cross-origin form submissions | Origin header checking pattern (same approach Next.js Server Actions use internally); implemented directly in the API route handler |
| REL-01 | Rate limiting persists across deployments using Redis/Vercel KV with sliding window algorithm | `@upstash/ratelimit` with `Ratelimit.slidingWindow(5, "1 h")` backed by `@upstash/redis` using `Redis.fromEnv()` |
| REL-02 | Service worker cache version is generated from build hash, automatically invalidating stale caches on deployment | Build script reads `.next/BUILD_ID` post-build and injects into service worker; `NEXT_PUBLIC_BUILD_ID` env var set via `next.config.ts` for runtime access |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | Framework (proxy.ts for CSP nonces) | Already installed; proxy.ts is the official CSP nonce mechanism |
| @upstash/ratelimit | ^2.0.x | Sliding window rate limiting | Purpose-built for serverless; supports fixed/sliding window and token bucket algorithms |
| @upstash/redis | ^1.x | Redis client for Upstash (backing store) | Required by @upstash/ratelimit; connects via REST API (no persistent connections needed) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | CSRF protection | Origin-header checking is hand-written (< 15 lines); no library needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Origin-header CSRF | @edge-csrf/nextjs | Library adds middleware complexity and token management; origin checking is simpler and sufficient for a single-endpoint portfolio |
| Origin-header CSRF | Double-submit cookie | Requires cookie management and form hidden field; more moving parts than needed for one endpoint |
| @upstash/ratelimit | Custom sliding window on Vercel KV | Hand-rolling sliding window has edge cases (race conditions, key expiry); library handles these correctly |
| Manual service worker | next-pwa or @serwist/next | These libraries are heavy PWA frameworks; this project only needs a simple service worker with cache strategies -- hand-written is clearer |

**Installation:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

## Architecture Patterns

### Recommended Project Structure
```
portfolio-app/
├── proxy.ts                           # CSP nonce generation + response headers (replaces next.config headers)
├── next.config.ts                     # Remove CSP headers section (moved to proxy.ts); add generateBuildId
├── app/
│   ├── layout.tsx                     # Read nonce from headers, pass to Analytics components
│   ├── api/
│   │   └── feedback/
│   │       └── route.ts              # CSRF check + Upstash rate limiting (replace in-memory Map)
│   └── offline/
│       └── page.tsx                  # Already exists -- keep as-is
├── lib/
│   ├── csrf.ts                       # Origin validation helper
│   ├── rate-limit.ts                 # Upstash ratelimit singleton
│   └── email.ts                      # Already exists -- no changes
├── components/
│   ├── FeedbackForm.tsx              # Add CSRF token to submission (if using token approach) or keep as-is for origin checking
│   └── ServiceWorkerRegistration.tsx # Update lifecycle management for silent refresh
├── public/
│   └── service-worker.js            # Template with BUILD_HASH placeholder, injected at build time
└── scripts/
    └── inject-build-hash.mjs        # Post-build script: reads .next/BUILD_ID, writes into service-worker.js
```

### Pattern 1: CSP Nonce via proxy.ts
**What:** Generate a per-request nonce in `proxy.ts`, set it in the CSP header and a custom `x-nonce` request header. Next.js automatically applies the nonce to all framework scripts.
**When to use:** Always -- this is the only path for nonce-based CSP in Next.js 16.
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/content-security-policy
// File: proxy.ts (project root)
import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : " 'unsafe-eval'"};
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self' data:;
    connect-src 'self';
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;
  // Note: 'unsafe-eval' stays in production for Three.js shader compilation (user decision)
  // Note: 'strict-dynamic' allows nonce-whitelisted scripts to load their own dependencies

  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|service-worker.js).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
```

### Pattern 2: Origin-Header CSRF Checking
**What:** Validate the `Origin` header against the expected host in the API route handler. This is the same mechanism Next.js Server Actions use internally.
**When to use:** For custom Route Handlers (API routes) that accept POST requests.
**Example:**
```typescript
// File: lib/csrf.ts
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // Same-origin requests from fetch() include the Origin header
  // Cross-site requests will have a mismatched origin
  if (!origin) {
    // Requests without Origin header (e.g., same-origin navigation)
    // are safe -- browsers always send Origin on cross-origin POST
    return true;
  }

  const originHost = new URL(origin).host;
  return originHost === host;
}
```

### Pattern 3: Persistent Rate Limiting with Upstash
**What:** Use `@upstash/ratelimit` with a sliding window algorithm backed by Upstash Redis. Data persists across serverless function cold starts and redeployments.
**When to use:** Any API endpoint that needs rate limiting in a serverless environment.
**Example:**
```typescript
// File: lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Singleton -- reused across requests in the same serverless instance
export const feedbackRateLimit = new Ratelimit({
  redis: Redis.fromEnv(), // uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 requests per hour
  analytics: true,
  prefix: 'ratelimit:feedback',
});
```

### Pattern 4: Build Hash Service Worker Cache Invalidation
**What:** Inject the Next.js build ID into the service worker at build time so cache names change automatically on every deployment.
**When to use:** When using a custom service worker (not a PWA library) and needing automatic cache busting.
**Example:**
```javascript
// File: scripts/inject-build-hash.mjs (runs as postbuild script)
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const buildId = readFileSync(join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim();
const swPath = join(process.cwd(), 'public', 'service-worker.js');
let swContent = readFileSync(swPath, 'utf8');
swContent = swContent.replace(/__BUILD_HASH__/g, buildId);
writeFileSync(swPath, swContent);
console.log(`Injected build hash ${buildId} into service worker`);
```

### Anti-Patterns to Avoid
- **In-memory rate limiting in serverless:** The current `Map<string, {...}>` approach resets on every cold start and every redeployment. This is the exact problem REL-01 aims to solve.
- **CSP in next.config.ts headers():** Static headers cannot contain per-request nonces. CSP with nonces MUST go through proxy.ts.
- **Hardcoded service worker cache version:** `const CACHE_VERSION = 'v1'` never changes between deployments, causing stale asset issues.
- **CSRF tokens for a single-endpoint API:** Token-based CSRF requires cookie management, form state coordination, and adds significant complexity. Origin checking is sufficient when the API is called via `fetch()` from the same origin.
- **Using `middleware.ts` in Next.js 16:** The file convention was renamed to `proxy.ts`. While `middleware.ts` may still work for backward compatibility, the official docs use `proxy.ts` exclusively.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sliding window rate limiting | Custom Redis Lua scripts or in-memory counters | `@upstash/ratelimit` with `Ratelimit.slidingWindow()` | Race conditions in concurrent requests, key expiry edge cases, time window alignment |
| Redis client for serverless | Raw HTTP calls to Upstash REST API | `@upstash/redis` with `Redis.fromEnv()` | Handles retries, connection pooling (none needed -- REST), environment variable parsing |
| Nonce generation and injection | Custom header manipulation in route handlers | `proxy.ts` with Next.js auto-nonce injection | Next.js automatically applies nonces to all framework scripts, page bundles, and inline scripts/styles |

**Key insight:** In serverless environments, anything stored in memory (Maps, variables, module-scope state) is ephemeral. Persistent state MUST use an external store. Upstash Redis via REST API is the standard solution for Vercel deployments because it requires no persistent connections.

## Common Pitfalls

### Pitfall 1: Dynamic Rendering Requirement for Nonces
**What goes wrong:** Pages that use nonce-based CSP must be dynamically rendered. Static pages generated at build time have no request context, so no nonce can be injected. Pages may appear to work in development but fail in production if they were statically generated.
**Why it happens:** Next.js applies nonces during server-side rendering based on the CSP header in the request. Build-time generation has no request.
**How to avoid:** Use `await connection()` from `next/server` in pages that need nonces to force dynamic rendering. For this portfolio app, most pages are likely already dynamic due to the use of client components. Test by checking response headers for the `Content-Security-Policy` header with a nonce value.
**Warning signs:** CSP header in response has `nonce-` but scripts are blocked; pages load without the nonce attribute on script tags.

### Pitfall 2: Missing proxy.ts Migration from middleware.ts
**What goes wrong:** This project currently has NO middleware.ts file. But developers may create `middleware.ts` based on older tutorials. Next.js 16 renamed `middleware.ts` to `proxy.ts` with the function renamed from `middleware` to `proxy`.
**Why it happens:** Most online tutorials and StackOverflow answers still reference `middleware.ts` (pre-16 convention).
**How to avoid:** Create `proxy.ts` at project root with `export function proxy(request)`. The official migration codemod is: `npx @next/codemod@canary middleware-to-proxy .`
**Warning signs:** `middleware.ts` files that don't execute; deprecation warnings in console.

### Pitfall 3: Vercel Analytics Blocked by CSP
**What goes wrong:** Vercel Analytics and Speed Insights scripts fail to load or fail to send data because CSP blocks them.
**Why it happens:** `@vercel/analytics` and `@vercel/speed-insights` both inject inline scripts and make network requests. With `'strict-dynamic'`, scripts loaded by nonce-whitelisted parent scripts can execute, so the Analytics component (loaded by the app bundle) should work. But `connect-src` must allow the endpoints.
**How to avoid:** Both `@vercel/analytics` and `@vercel/speed-insights` use same-origin endpoints by default (`/_vercel/insights` and `/_vercel/speed-insights/vitals`), which are covered by `connect-src 'self'`. However, if scripts are loaded from external CDN domains, those need explicit allowlisting. The `'strict-dynamic'` directive helps because it allows scripts loaded by trusted (nonce-bearing) scripts to also execute. Test thoroughly in production.
**Warning signs:** Missing analytics data in Vercel dashboard; CSP violation errors in browser console mentioning `vercel` domains.

### Pitfall 4: Service Worker Serving Stale proxy.ts Responses
**What goes wrong:** The service worker intercepts HTML page requests and serves cached versions that have old CSP headers (with old nonces). When JavaScript tries to execute, the nonce in the script tag doesn't match the CSP header.
**Why it happens:** Service worker cache-first strategy for HTML pages returns responses with outdated CSP headers.
**How to avoid:** Use stale-while-revalidate for HTML pages (user's chosen strategy), which serves the cached version first but immediately fetches a fresh copy. The fresh copy will have the current nonce. On the next navigation, the updated version is used. This is acceptable because CSP nonces in cached HTML are already "spent" -- the browser already executed those scripts. New navigations get fresh nonces.
**Warning signs:** CSP errors appearing intermittently after deployment; scripts blocked on first visit after deploy.

### Pitfall 5: CSRF Origin Header Missing on Same-Origin Requests
**What goes wrong:** Same-origin `fetch()` requests may not include the `Origin` header in some browsers or configurations.
**Why it happens:** The `Origin` header is not always sent for same-origin requests. The Fetch spec says browsers SHOULD send it, but some older browsers omit it for same-origin.
**How to avoid:** Treat a missing `Origin` header as same-origin (safe). Cross-origin POST requests ALWAYS include the `Origin` header per the Fetch specification. Only reject when `Origin` is present AND doesn't match the host.
**Warning signs:** Legitimate form submissions rejected with CSRF error; intermittent failures in testing.

### Pitfall 6: Rate Limit Key Collision
**What goes wrong:** Multiple users behind the same NAT/proxy share a single IP address and collectively hit the rate limit faster than expected.
**Why it happens:** Using `x-forwarded-for` as the sole rate limit key; corporate networks and mobile carriers share IPs.
**How to avoid:** For a portfolio site with a 5/hour limit, IP-based limiting is pragmatic. Shared IPs affecting 5+ people submitting feedback per hour is extremely unlikely. Accept this tradeoff rather than adding fingerprinting complexity.
**Warning signs:** Users reporting they can't submit feedback despite not having submitted before (very unlikely for a portfolio).

### Pitfall 7: Upstash Environment Variables Missing
**What goes wrong:** Application crashes in development or staging because `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not set.
**Why it happens:** `Redis.fromEnv()` throws immediately if the env vars are missing.
**How to avoid:** Use lazy initialization -- only create the Ratelimit instance when the feedback endpoint is actually called. Provide a fallback in-memory rate limiter for development. Set env vars in Vercel project settings and `.env.local`.
**Warning signs:** 500 errors on feedback form submission; `Error: UPSTASH_REDIS_REST_URL is not defined` in logs.

## Code Examples

### Reading the Nonce in Layout (Server Component)
```typescript
// Source: https://nextjs.org/docs/app/guides/content-security-policy
// File: app/layout.tsx
import { headers } from 'next/headers';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get('x-nonce') || undefined;

  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Analytics nonce={nonce} />
        <SpeedInsights nonce={nonce} />
      </body>
    </html>
  );
}
```

### Updated Feedback API Route with CSRF + Rate Limiting
```typescript
// File: app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendFeedbackEmail } from '@/lib/email';
import { validateOrigin } from '@/lib/csrf';
import { feedbackRateLimit } from '@/lib/rate-limit';

const feedbackSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
  interestedInCollaboration: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // CSRF check: validate Origin header
    if (!validateOrigin(request)) {
      console.warn('CSRF validation failed:', {
        origin: request.headers.get('origin'),
        host: request.headers.get('host'),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json(
        { error: 'Your session may have expired. Please refresh and resubmit.' },
        { status: 403 }
      );
    }

    // Rate limiting (persistent via Upstash)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const { success } = await feedbackRateLimit.limit(ip);
    if (!success) {
      console.warn('Rate limit exceeded:', { ip });
      return NextResponse.json(
        { error: 'Please wait a bit before sending another message.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = feedbackSchema.parse(body);
    // ... rest of existing logic
  } catch (error) {
    // ... existing error handling
  }
}
```

### Service Worker with Build Hash Cache Strategy
```javascript
// File: public/service-worker.js (template -- __BUILD_HASH__ replaced at build time)
const BUILD_HASH = '__BUILD_HASH__';
const STATIC_CACHE = `static-${BUILD_HASH}`;
const IMAGE_CACHE = `images-${BUILD_HASH}`;
const DYNAMIC_CACHE = `dynamic-${BUILD_HASH}`;

// Install: precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(['/', '/offline'])
    )
  );
  self.skipWaiting();
});

// Activate: delete old caches from previous builds
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => !name.endsWith(BUILD_HASH))
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch: strategy per asset type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Network-only for API routes
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first for fingerprinted static assets
  if (url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/images/') ||
      url.pathname.match(/\.(woff2?|ttf|otf)$/)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Stale-while-revalidate for HTML pages
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  // Cache-first for images
  if (url.pathname.startsWith('/_next/image') ||
      request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Network-first for everything else
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached || caches.match('/offline'));
  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with `export function middleware()` | `proxy.ts` with `export function proxy()` | Next.js 16.0.0 (2025) | File and function must be renamed; `middleware.ts` is deprecated |
| CSP headers in `next.config.ts headers()` | CSP with nonces via `proxy.ts` | Next.js 14+ (proxy.ts in 16) | Static headers cannot contain per-request nonces; must use proxy |
| In-memory rate limiting (`Map`) | External store (`@upstash/ratelimit` + Redis) | Always true for serverless | In-memory state is ephemeral in serverless; redeployment resets everything |
| Manual CSRF token management | Origin header checking | Browsers standardized `Origin` header | All modern browsers send `Origin` on cross-origin POST; simpler than tokens |

**Deprecated/outdated:**
- `middleware.ts`: Deprecated in Next.js 16 in favor of `proxy.ts`. A codemod exists: `npx @next/codemod@canary middleware-to-proxy .`
- `unsafe-inline` in script-src: Nonce-based approach removes the need for this entirely
- In-memory rate limiting on Vercel: Was never reliable due to serverless cold starts; just happened to "work" enough to go unnoticed

## Discretion Recommendations

### CSRF: Use Origin Header Checking (RECOMMENDED)
**Rationale:** The feedback form calls `/api/feedback` via `fetch()` from the same origin. Modern browsers always include the `Origin` header on cross-origin POST requests. Checking `Origin` against `Host` is the same mechanism Next.js Server Actions use internally. No tokens to manage, no cookies to coordinate, no client-side changes needed. The only change is adding a ~15-line validation function to the API route.

### CSP Nonce: Use proxy.ts with Auto-Injection (RECOMMENDED)
**Rationale:** Next.js 16 automatically injects nonces into all framework scripts, page bundles, and inline scripts when the nonce is present in the CSP header and the `x-nonce` request header. No manual nonce propagation needed. The only manual step is passing the nonce to `<Analytics>` and `<SpeedInsights>` components.

### Rate Limit Key: Use IP Address (RECOMMENDED)
**Rationale:** For a portfolio feedback form limited to 5/hour, IP-based rate limiting is sufficient. The alternative (browser fingerprinting) adds complexity, privacy concerns, and dependencies -- all unjustified for this use case. Use `x-forwarded-for` (first IP in the chain) on Vercel, with fallback to `x-real-ip`.

### Service Worker Lifecycle: Silent skipWaiting + clients.claim (RECOMMENDED)
**Rationale:** The user explicitly chose "silent background refresh." Use `self.skipWaiting()` in install and `self.clients.claim()` in activate. The new service worker takes over immediately. Combined with stale-while-revalidate for HTML, users get fresh content on the next navigation without any visible prompt.

### Upstash Configuration: Use Vercel Integration (RECOMMENDED)
**Rationale:** Connect Upstash via the Vercel Marketplace integration. This automatically provisions the Redis database and injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables into the Vercel project. For local development, copy these to `.env.local`.

## Open Questions

1. **Vercel Analytics/SpeedInsights CSP compatibility with strict-dynamic**
   - What we know: Both packages use same-origin endpoints (`/_vercel/insights`, `/_vercel/speed-insights/vitals`) by default, which are covered by `connect-src 'self'`. The `@vercel/analytics` component is loaded as part of the app bundle (nonce-whitelisted), and `'strict-dynamic'` allows its dynamically loaded scripts to execute.
   - What's unclear: Whether `@vercel/analytics` or `@vercel/speed-insights` load any external scripts from CDN domains (like `cdn.vercel-insights.com`) that would be blocked by CSP. The official Vercel docs don't provide a definitive CSP allowlist.
   - Recommendation: Start with `connect-src 'self'` and `script-src` with nonce + `'strict-dynamic'`. Test in production preview deployment. If analytics data stops appearing in the Vercel dashboard, check browser console for CSP violations and add the specific blocked domains.

2. **Build hash injection timing**
   - What we know: The `.next/BUILD_ID` file is created during `next build`. A post-build script can read it and inject into the service worker.
   - What's unclear: Whether Vercel's build pipeline allows a postbuild script to modify `public/service-worker.js` and have it deployed correctly.
   - Recommendation: Use the `next.config.ts` `generateBuildId` to ensure a consistent build ID, and add a postbuild step to the npm scripts. Test by deploying to Vercel preview and verifying the service worker contains the actual build hash (not `__BUILD_HASH__`). Alternative approach: generate the service worker from a template file during build, writing the output to `public/`.

3. **layout.tsx becoming async Server Component**
   - What we know: Reading the nonce requires `await headers()`, which means `layout.tsx` must be an async Server Component. The current `layout.tsx` is a sync Server Component.
   - What's unclear: Whether this change interacts with any existing client components or causes hydration issues.
   - Recommendation: The conversion is straightforward -- just add `async` to the function and `await` the headers call. Test that ServiceWorkerRegistration and other client components still work correctly.

## Sources

### Primary (HIGH confidence)
- [Next.js 16.1.6 CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy) - Full proxy.ts nonce implementation, matcher config, nonce auto-injection behavior, dynamic rendering requirement
- [Next.js 16.1.6 proxy.ts API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) - proxy.ts file convention, migration from middleware.ts, matcher API, named export pattern
- [Next.js 16.1.6 generateBuildId](https://nextjs.org/docs/app/api-reference/config/next-config-js/generateBuildId) - Build ID generation and customization
- [Next.js Security Blog Post](https://nextjs.org/blog/security-nextjs-server-components-actions) - CSRF protection in Server Actions (Origin header checking), Route Handler security considerations
- [Upstash Ratelimit Getting Started](https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted) - Installation, sliding window API, Redis.fromEnv() pattern

### Secondary (MEDIUM confidence)
- [Upstash Blog: Rate Limiting Next.js API Routes](https://upstash.com/blog/nextjs-ratelimiting) - Practical implementation examples, identifier strategies
- [Vercel Analytics Package Docs](https://vercel.com/docs/analytics/package) - Analytics configuration, endpoint defaults (same-origin `/_vercel/insights`)
- [Vercel Speed Insights Package Docs](https://vercel.com/docs/speed-insights/package) - Speed Insights configuration, endpoint defaults
- [Vercel CSP Security Headers Guide](https://vercel.com/docs/headers/security-headers) - General CSP best practices on Vercel platform

### Tertiary (LOW confidence)
- Vercel Analytics CSP domain requirements: Multiple community sources mention `vitals.vercel-insights.com` for connect-src, but this may only apply when not using the default same-origin proxy endpoint. Needs production testing validation.
- Three.js `unsafe-eval` requirement: Based on general knowledge that WebGL shader compilation uses `new Function()` internally. Not verified against Three.js 0.182.0 specifically. The user has already decided to accept this exception, so it is a non-blocking question.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Next.js proxy.ts documented in official 16.1.6 docs; @upstash/ratelimit is the established serverless rate limiting solution
- Architecture: HIGH - proxy.ts nonce pattern is the canonical approach from official docs; Origin-checking CSRF matches Server Actions internal behavior
- Pitfalls: HIGH - Dynamic rendering requirement, middleware-to-proxy migration, and in-memory rate limiting issues are well-documented
- Service worker build hash injection: MEDIUM - The approach is sound (read BUILD_ID, inject into SW), but Vercel build pipeline behavior for postbuild modifications to public/ needs validation

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days -- Next.js and Upstash APIs are stable)
