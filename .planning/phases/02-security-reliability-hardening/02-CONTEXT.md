# Phase 2: Security & Reliability Hardening - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden the application with proper security boundaries (CSP, CSRF) and infrastructure that persists across serverless deployments (rate limiting, service worker cache invalidation). The site already works — this phase makes it secure and resilient without changing functionality.

</domain>

<decisions>
## Implementation Decisions

### Third-party resource policy
- Vercel Analytics is the only third-party service — CSP must allow Vercel's analytics domains
- Fonts are self-hosted (next/font or bundled) — no external font CDN needed in CSP
- No external embeds (YouTube, CodePen, social widgets) — no frame-src exceptions needed
- All content is self-hosted — CSP can be tight with minimal allowlist
- Three.js: accept a targeted `unsafe-eval` exception for shader compilation — pragmatic, minimal risk
- Remove `unsafe-inline` for scripts (use nonce-based allowlisting)

### Rate limit thresholds
- 5 submissions per hour per user on the feedback form
- Rate limiting applies to the feedback form endpoint only — not all API routes
- Friendly message without countdown: "Please wait a bit before sending another message."
- Use Vercel KV / Upstash as the persistent backing store (survives redeployments)

### Cache refresh experience
- Silent background refresh — service worker updates automatically, new version loads on next navigation, no user prompt
- Basic offline page — show a simple "You're offline" page when network is unavailable
- Caching strategy by asset type:
  - **Cache-first:** JS, CSS, fonts, optimized images, 3D textures (fingerprinted by Next.js build, safe to cache aggressively)
  - **Stale-while-revalidate:** HTML pages (fast repeat visits, content at most one visit behind)
  - **Network-only:** API routes (feedback form — never cached)
- Build version hash auto-embedded into service worker — fully automatic cache invalidation on deploy

### Security error messaging
- CSRF failure: "Your session may have expired. Please refresh and resubmit." — specific but friendly, no technical jargon
- Rate limit hit: "Please wait a bit before sending another message." — no countdown timer
- Security errors use the same visual style as form validation errors — consistent, no special treatment
- CSP violations: silent, console-only — no visible indicator to visitors, no server-side reporting
- All security rejections (CSRF, rate limit) logged server-side for monitoring abuse patterns

### Claude's Discretion
- CSRF implementation approach (token-based vs double-submit cookie vs origin checking)
- CSP nonce generation and injection mechanism
- Rate limit key derivation (IP, fingerprint, etc.)
- Service worker registration and lifecycle management
- Offline page design
- Exact Vercel KV/Upstash configuration

</decisions>

<specifics>
## Specific Ideas

- Caching strategy is intentionally granular: fingerprinted assets get cache-first (build hash handles freshness), HTML gets stale-while-revalidate (fast loads, at most one visit behind), API routes are never cached
- User prefers invisible security — errors should feel like normal form issues, not security warnings
- Logging security events is important even for a portfolio — helps spot abuse patterns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-security-reliability-hardening*
*Context gathered: 2026-02-16*
