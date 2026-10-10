# Pitfalls Research

**Domain:** Next.js stabilization and Tailwind CSS custom design system
**Researched:** 2026-02-16
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Legacy Peer Dependencies Masking Runtime Incompatibilities

**What goes wrong:**
Using `--legacy-peer-deps` to bypass React 19 peer dependency conflicts allows installation to succeed but creates hidden runtime incompatibilities. Libraries that haven't updated for React 19 features (Server Components, Concurrent Rendering) can fail silently or cause unexpected behavior in production.

**Why it happens:**
React 19 is recent, and many ecosystem packages haven't updated their peer dependency declarations. Developers use `--legacy-peer-deps` as a quick fix to unblock installation without understanding the runtime implications.

**How to avoid:**
- Audit every package using `--legacy-peer-deps` and verify React 19 compatibility in official docs/changelog
- For testing libraries: upgrade to latest versions (e.g., `@testing-library/react` has React 19 support)
- For unmaintained packages: find alternatives or contribute compatibility fixes
- Use `npm ls` to identify the dependency tree and which packages are incompatible
- Document every use of `--legacy-peer-deps` with justification and validation plan

**Warning signs:**
- Console warnings about React version mismatches
- Hydration errors in production but not development
- Features working locally but failing in production builds
- Type errors between React versions when using TypeScript

**Phase to address:**
Foundation/Tech Debt phase - resolve before any new feature work

---

### Pitfall 2: Server Actions Treated as Internal APIs Without Proper Security

**What goes wrong:**
Developers assume Server Actions are "internal" because they're defined in server files, but every exported Server Action creates a public HTTP endpoint. Missing authentication/authorization checks allow unauthorized mutations. Unvalidated input leads to injection attacks.

**Why it happens:**
Mental model mismatch - Server Actions feel like private functions due to the `"use server"` directive, but they're actually public endpoints. The abstraction hides the HTTP layer, making it easy to forget security fundamentals.

**How to avoid:**
- **Authentication check in every Server Action** - verify user session/token at the start
- **Input validation** - use Zod/Valibot to validate all inputs before processing
- **Authorization checks** - verify the user has permission for the specific operation
- **Avoid trusting client data** - re-verify permissions server-side, don't trust searchParams/headers
- **Use Data Access Layer** - centralize authorization logic rather than repeating in each action

```typescript
// BAD: No authentication or validation
'use server'
export async function deleteUser(userId: string) {
  await db.user.delete({ where: { id: userId } })
}

// GOOD: Authentication, authorization, and validation
'use server'
export async function deleteUser(userId: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) throw new Error('Unauthorized')

  const validated = userIdSchema.parse(userId)

  if (!canDeleteUser(currentUser, validated)) {
    throw new Error('Forbidden')
  }

  await db.user.delete({ where: { id: validated } })
}
```

**Warning signs:**
- Server Actions without authentication checks at the top
- Direct database access without authorization
- Using searchParams/formData values without validation
- TypeScript `any` types in action parameters

**Phase to address:**
Security hardening phase - audit all existing actions, add validation layer

---

### Pitfall 3: Overusing Tailwind Utility Classes Instead of Building Component Abstractions

**What goes wrong:**
Every component becomes a wall of utility classes (`className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md hover:shadow-lg transition-all..."`). Code becomes unmaintainable, refactoring is painful, and the custom design system never emerges because everything is ad-hoc utilities.

**Why it happens:**
Tailwind's utility-first approach is fast for prototyping, leading to the trap of "just one more class." Teams delay creating components until it's too late. The "organic-meets-digital" design vision requires cohesive components, not scattered utilities.

**How to avoid:**
- **Component library first** - define design system components (Card, Button, Typography) BEFORE using them in features
- **@theme for design tokens** - define your custom colors, spacing, typography in `@theme` block
- **Avoid @apply entirely in v4** - use explicit CSS or component abstractions instead
- **Composition over utilities** - `<Card variant="organic">` not `<div className="...">`
- **Lint against non-token utilities** - block utility classes that aren't aligned to design tokens

```css
/* Define design tokens in CSS */
@import "tailwindcss";

@theme {
  --color-organic-primary: oklch(0.65 0.15 140);
  --color-organic-accent: oklch(0.75 0.12 200);
  --color-digital-bright: oklch(0.85 0.20 280);
  --font-organic: "Georgia", serif;
  --font-digital: "Inter", sans-serif;
  --radius-organic: 12px;
}
```

```typescript
// Component abstraction instead of utility soup
interface CardProps {
  variant: 'organic' | 'digital'
  children: React.ReactNode
}

export function Card({ variant, children }: CardProps) {
  return (
    <div className={cn(
      'p-6 shadow-lg transition-all',
      variant === 'organic'
        ? 'bg-organic-primary rounded-organic font-organic'
        : 'bg-digital-bright rounded-sm font-digital'
    )}>
      {children}
    </div>
  )
}
```

**Warning signs:**
- `className` props longer than 100 characters
- Copy-pasting the same utility combinations across files
- Difficulty changing design (e.g., "make all cards more rounded" requires find-replace)
- No reusable component library after weeks of development

**Phase to address:**
Design system foundation phase - build component library BEFORE feature work

---

### Pitfall 4: Mixing App Router and Pages Router Without Clear Boundaries

**What goes wrong:**
Hybrid routing creates inconsistencies in data fetching (Server Components vs getServerSideProps), layout handling, and middleware behavior. New developers can't understand which patterns to follow. Attempts to gradually migrate stall because of unclear completion criteria.

**Why it happens:**
App Router migration is designed to be incremental, which is good, but teams start migrating without a plan. Routes get partially converted, creating a confusing mix of old and new patterns.

**How to avoid:**
- **Define migration boundaries upfront** - choose complete features/sections to migrate, not individual pages
- **Document which router serves which routes** - create a migration tracking document
- **Avoid shared state across routers** - separate contexts/providers for each router
- **Set a "no Pages Router for new features" rule** - all new work goes in App Router
- **Complete migrations in phases** - migrate one feature completely before starting another

**Warning signs:**
- Both `app/` and `pages/` directories have routes for the same path
- Confusion about which data fetching pattern to use
- Middleware behaving differently for different routes
- New features arbitrarily choosing between routers

**Phase to address:**
Migration planning phase - document boundaries before starting any migration work

---

### Pitfall 5: Environment Variables Leaked to Client or Not Validated

**What goes wrong:**
Sensitive keys (API secrets, database URLs) get exposed to the client bundle because of `NEXT_PUBLIC_` prefix or improper Server Component usage. Alternatively, missing environment variables cause runtime crashes in production because they weren't validated at build time.

**Why it happens:**
Confusion about which code runs where (server vs client) leads to accidental exposure. No validation at startup means errors only surface after deployment.

**How to avoid:**
- **Never use `NEXT_PUBLIC_` for secrets** - only for truly public values (e.g., analytics IDs)
- **Validate environment variables at startup** - use Zod schema to validate `process.env` on app initialization
- **Use `server-only` package** - mark modules that access secrets with `import 'server-only'`
- **Centralize in Data Access Layer** - only DAL should access `process.env`
- **Fail fast** - throw errors during build if required env vars are missing

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  EMAIL_API_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
```

**Warning signs:**
- Seeing API keys in browser DevTools Network tab
- Production crashes with "undefined is not a function" for missing env vars
- TypeScript types showing `process.env.KEY` as `string | undefined`
- Database credentials imported in Client Components

**Phase to address:**
Security hardening phase - add validation immediately, audit all env var usage

---

### Pitfall 6: TypeScript `any` Types Hiding Bugs Until Production

**What goes wrong:**
Using `any` types bypasses TypeScript's safety, allowing invalid data shapes to flow through the application. Bugs surface in production as runtime errors (cannot read property of undefined, type errors) instead of compile-time failures.

**Why it happens:**
Quick prototyping shortcuts (`const data: any = await fetch(...)`), complex type inference failures, or lack of understanding of TypeScript utilities (generics, mapped types).

**How to avoid:**
- **Enable strict TypeScript** - `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
- **Type external data with Zod** - runtime validation + inferred types from one schema
- **Use `unknown` instead of `any`** - forces explicit type checking before use
- **Type Server Actions properly** - define input/output types explicitly
- **Gradual typing** - start by typing new code, then refactor high-traffic paths

```typescript
// BAD: any allows invalid data through
async function getUser(id: string): Promise<any> {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
}

// GOOD: Zod schema provides runtime validation + types
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
})

type User = z.infer<typeof UserSchema>

async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`)
  const data = await res.json()
  return UserSchema.parse(data) // Throws if invalid
}
```

**Warning signs:**
- `@ts-ignore` or `@ts-expect-error` comments proliferating
- Runtime errors in production that TypeScript should have caught
- Autocomplete not working for data structures
- Type errors appearing only at runtime

**Phase to address:**
Type safety phase - enable strict mode, incrementally type codebase starting with critical paths

---

### Pitfall 7: Silent Email Failures Without Error Tracking

**What goes wrong:**
Email sending fails (API key expired, rate limit hit, network timeout) but the application continues as if successful. Users never receive critical emails (password resets, notifications) and there's no visibility into the failure.

**Why it happens:**
Email sending is async and fire-and-forget by default. Developers don't add try/catch or assume the email service SDK handles errors gracefully. No monitoring means failures go unnoticed.

**How to avoid:**
- **Always wrap email calls in try/catch** - handle failures explicitly
- **Log email failures** - include recipient, template, and error details
- **User feedback** - show toast/message if email sending fails
- **Queue failed emails** - retry with exponential backoff using a job queue
- **Monitor email metrics** - track send rate, failure rate, delivery rate
- **Test failure scenarios** - simulate API failures in development

```typescript
// BAD: Silent failure
async function sendPasswordResetEmail(email: string) {
  await emailService.send({
    to: email,
    template: 'password-reset',
  })
  // Continues even if send failed
}

// GOOD: Explicit error handling
async function sendPasswordResetEmail(email: string) {
  try {
    await emailService.send({
      to: email,
      template: 'password-reset',
    })
    logger.info('Password reset email sent', { email })
  } catch (error) {
    logger.error('Failed to send password reset email', {
      email,
      error: error.message
    })
    // Option 1: Queue for retry
    await emailQueue.add({ email, template: 'password-reset' })
    // Option 2: Throw error to show user feedback
    throw new Error('Failed to send email. Please try again.')
  }
}
```

**Warning signs:**
- Users reporting "I never got the email"
- No email-related logs in monitoring
- Email sending code without error handling
- No retry mechanism for failed sends

**Phase to address:**
Error handling/observability phase - add logging, monitoring, and retry logic

---

## Moderate Pitfalls

### Pitfall 8: In-Memory Rate Limiting in Serverless Production

**What goes wrong:**
In-memory rate limiting (storing request counts in a Map) works in development but fails in production serverless environments. Each function invocation has isolated memory with no shared state, so rate limits aren't enforced across requests.

**Why it happens:**
Developers test locally where a single Node.js process persists, making in-memory state appear to work. Serverless architecture (Vercel, AWS Lambda) spins up independent function instances with ephemeral memory.

**How to avoid:**
- **Use Redis for rate limiting** - centralized state across all function instances
- **Upstash Redis for serverless** - HTTP-based Redis that works well with edge/serverless
- **Test in production-like environment** - deploy to staging with serverless architecture
- **Consider edge rate limiting** - Vercel Edge Config or Cloudflare Workers KV for edge runtime

**Warning signs:**
- Rate limiting works locally but not in production
- Users reporting they can spam endpoints
- Different rate limit counters for different serverless instances
- No shared state between requests

**Phase to address:**
Infrastructure phase - replace in-memory with Redis before production deployment

---

### Pitfall 9: Missing next/image on Critical Content Images

**What goes wrong:**
Using `<img>` tags instead of `<Image>` for content images causes poor Core Web Vitals (CLS, LCP). Images aren't optimized (wrong format, too large), lazy loading is misapplied to above-fold images, and layout shifts occur.

**Why it happens:**
Developers forget to migrate from `<img>` to `<Image>`, misunderstand when to use each, or struggle with the `width`/`height` requirements.

**How to avoid:**
- **Default to `<Image>` for content images** - photos, hero images, article images
- **Use `<img>` for micro-assets** - icons, logos, SVGs, small UI elements
- **Always provide width/height** - prevents CLS by reserving space
- **Above-fold images: `loading="eager"` + `fetchPriority="high"`** - don't lazy load LCP images
- **Define `sizes` for responsive images** - tells browser which size to download

```jsx
// BAD: img tag for hero image (LCP element)
<img src="/hero.jpg" alt="Hero" />

// GOOD: Image with proper configuration
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // Same as loading="eager" + fetchPriority="high"
  sizes="100vw"
/>
```

**Warning signs:**
- CLS warnings in Lighthouse/PageSpeed Insights
- LCP scores above 2.5s
- Large images downloading at full resolution
- Layout shifts when images load

**Phase to address:**
Performance optimization phase - audit and replace `<img>` tags, add proper sizing

---

### Pitfall 10: Hardcoded Service Worker Cache Breaking Updates

**What goes wrong:**
Service worker caches assets with hardcoded versions or cache names. When you deploy updates, users keep seeing the old cached version because the service worker doesn't know to invalidate. Critical bug fixes and feature updates don't reach users.

**Why it happens:**
Service worker cache strategies are complex. Developers hardcode cache names during initial implementation and forget to update them on deployments. The service worker lifecycle (install, activate) isn't properly managed.

**How to avoid:**
- **Use build hash in cache names** - `cache-v${process.env.BUILD_ID}` auto-updates
- **Implement cache cleanup in activate event** - delete old caches
- **Skip waiting for critical updates** - use `skipWaiting: true` for immediate activation
- **Clear application cache during development** - reduces flaky behavior
- **Test update flow** - verify new service worker replaces old one
- **Use next-pwa with proper configuration** - handles cache versioning automatically

```javascript
// BAD: Hardcoded cache version
const CACHE_NAME = 'my-cache-v1'

// GOOD: Dynamic cache version based on build
const CACHE_NAME = `my-cache-${process.env.BUILD_ID}`

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
})
```

**Warning signs:**
- Users reporting "I don't see the update"
- Ctrl+F5 required to see changes
- Service worker showing old version in DevTools
- PWA updates not propagating

**Phase to address:**
PWA/caching phase - implement proper cache versioning and lifecycle management

---

### Pitfall 11: Weak CSP Allowing XSS Attacks

**What goes wrong:**
Content Security Policy is either missing or too permissive (`script-src 'unsafe-inline'`), allowing attackers to inject malicious scripts via XSS vulnerabilities. User data can be stolen, sessions hijacked, or malicious actions performed.

**Why it happens:**
CSP is complex and breaks things during initial setup (inline scripts, eval, third-party scripts). Developers weaken the policy to "make it work" instead of properly implementing nonces/hashes.

**How to avoid:**
- **Start restrictive, loosen carefully** - begin with `default-src 'self'` and add only what's needed
- **Use nonces for inline scripts** - generate cryptographic nonces for each request
- **Hash static inline scripts** - allow specific inline scripts by hash
- **Report violations** - configure CSP reporting endpoint to monitor attacks
- **Test with CSP in report-only mode** - find violations without breaking production

```typescript
// middleware.ts - Generate nonce per request
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export function middleware(request: Request) {
  const nonce = crypto.randomBytes(16).toString('base64')

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://trusted-cdn.com`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
  ].join('; ')

  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Nonce', nonce)

  return response
}
```

**Warning signs:**
- CSP header missing or containing `'unsafe-inline'`
- No CSP violation reports configured
- Third-party scripts loaded from any origin
- Inline event handlers (`onclick`, etc.)

**Phase to address:**
Security hardening phase - implement CSP with nonces, test thoroughly

---

### Pitfall 12: Tailwind v4 Upgrade Breaking Existing Styles

**What goes wrong:**
Upgrading from Tailwind v3 to v4 silently breaks styles due to renamed utilities (`shadow-sm` → `shadow-xs`), changed defaults (borders now `currentColor` instead of gray, `ring` is 1px instead of 3px), and moved important modifier position (`!flex` → `flex!`).

**Why it happens:**
Teams run `npx @tailwindcss/upgrade` without carefully reviewing changes. The upgrade tool handles ~80% of changes but can't catch all edge cases, especially with custom plugins or dynamic class names.

**How to avoid:**
- **Test upgrade in a branch** - don't upgrade directly in main
- **Run upgrade tool first** - `npx @tailwindcss/upgrade` handles most changes
- **Visual regression testing** - screenshot comparison before/after upgrade
- **Review all renamed utilities** - shadow, blur, rounded, ring, outline changed
- **Check border/divide colors** - now use `currentColor`, may need explicit colors
- **Update important syntax** - `!` moves to end (`flex!` not `!flex`)
- **Verify browser requirements** - v4 requires Safari 16.4+, Chrome 111+, Firefox 128+

```html
<!-- Common breaking changes -->

<!-- v3 → v4 -->
<div class="shadow-sm">   → <div class="shadow-xs">
<div class="shadow">      → <div class="shadow-sm">
<div class="blur-sm">     → <div class="blur-xs">
<div class="rounded-sm">  → <div class="rounded-xs">
<div class="outline-none"> → <div class="outline-hidden">
<div class="!flex">       → <div class="flex!">
<div class="border">      → <div class="border border-gray-200">
<div class="ring">        → <div class="ring-3">
```

**Warning signs:**
- Shadows appear smaller after upgrade
- Borders appearing in unexpected colors
- Important utilities not working
- Styles looking different in production vs development

**Phase to address:**
Tailwind upgrade phase - dedicated effort with thorough testing before merging

---

## Minor Pitfalls

### Pitfall 13: Dynamic Class Names Not Detected by Tailwind

**What goes wrong:**
Building class names dynamically with string interpolation/concatenation causes Tailwind's scanner to miss them. Classes don't get generated in the final CSS, resulting in missing styles.

**Why it happens:**
Tailwind scans source files as plain text and can't understand JavaScript runtime logic. Developers assume Tailwind is smart enough to figure out dynamic classes.

**How to avoid:**
- **Use complete class names** - map props to full classes, not fragments
- **Conditional classes with clsx/cn** - compose complete strings, don't concatenate
- **Safelist for truly dynamic values** - configure in `@source` directive in v4
- **Generate classes at build time** - use scripts to generate all possible combinations

```typescript
// BAD: String interpolation (classes won't be generated)
<div className={`text-${color}-500`}>

// GOOD: Map to complete class names
const colorClasses = {
  red: 'text-red-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
}
<div className={colorClasses[color]}>
```

**Warning signs:**
- Styles missing in production but present in development
- Classes visible in DevTools but no styles applied
- Random classes missing from final CSS bundle

**Phase to address:**
Design system phase - establish patterns for dynamic styling during component library creation

---

### Pitfall 14: Three.js Components Causing Hydration Errors

**What goes wrong:**
Three.js components render on server and client but produce different output, causing React hydration mismatches. WebGL context isn't available during SSR, leading to errors or blank screens.

**Why it happens:**
Next.js defaults to SSR for all components. Three.js/React Three Fiber require browser APIs (WebGL, canvas, window) that don't exist in Node.js.

**How to avoid:**
- **Dynamic import with `ssr: false`** - disable SSR for Three.js components
- **Check `typeof window !== 'undefined'`** - guard browser-only code
- **Use `'use client'` directive** - mark Three.js components as client-only
- **Lazy load with Suspense** - improve initial page load by deferring 3D content

```typescript
// BAD: Three.js component rendered on server
import Scene from '@/components/Scene'
export default function Page() {
  return <Scene />
}

// GOOD: Dynamic import with SSR disabled
import dynamic from 'next/dynamic'
const Scene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
  loading: () => <div>Loading 3D scene...</div>
})

export default function Page() {
  return <Scene />
}
```

**Warning signs:**
- Hydration errors mentioning Three.js/WebGL
- "window is not defined" errors during build
- Blank canvas on initial render
- Errors in server logs but not client

**Phase to address:**
Three.js integration phase - configure dynamic imports before adding 3D features

---

### Pitfall 15: No CSRF Protection for Forms

**What goes wrong:**
Forms submit to Server Actions without CSRF tokens, allowing attackers to trick users into submitting malicious requests from third-party sites. User accounts can be compromised or unauthorized actions performed.

**Why it happens:**
Server Actions use POST and Origin header checking, which provides basic CSRF protection. However, this isn't sufficient for all attack scenarios, especially with misconfigured CORS or proxy setups.

**How to avoid:**
- **Rely on built-in protection for simple cases** - Server Actions check Origin vs Host header
- **Add explicit CSRF tokens for sensitive actions** - use `@csrf-armor/nextjs` for token-based protection
- **Configure allowed origins for proxies** - `serverActions.allowedOrigins` in next.config.js
- **Use SameSite cookies** - default in modern browsers, prevents some CSRF
- **Avoid GET requests for mutations** - always use POST/Server Actions

```typescript
// next.config.js - Configure for proxy setups
module.exports = {
  experimental: {
    serverActions: {
      allowedOrigins: ['my-proxy.com', '*.my-proxy.com'],
    },
  },
}

// For extra protection on sensitive actions
import { csrf } from '@csrf-armor/nextjs'

export async function deleteAccount(formData: FormData) {
  'use server'
  await csrf.verify(formData)
  // ... delete account logic
}
```

**Warning signs:**
- Forms submitting from localhost to production
- CORS errors in production with proxies/load balancers
- Security audit flagging missing CSRF protection
- Suspicious form submissions in logs

**Phase to address:**
Security hardening phase - configure allowed origins, add explicit tokens for sensitive actions

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `--legacy-peer-deps` for all installs | Bypass dependency conflicts quickly | Hidden runtime incompatibilities, harder to upgrade packages | Never for production - always investigate and resolve |
| `any` types in TypeScript | Skip complex type definitions | Runtime errors in production, poor IDE support | Only during rapid prototyping, must be replaced before PR |
| In-memory rate limiting | Simple implementation, no external dependencies | Doesn't work in serverless, no cross-instance enforcement | Local development only, never production |
| Component-level data fetching | Fast prototyping, less boilerplate | Easy to leak sensitive data, poor security audit trail | MVP/prototype only, refactor to DAL before launch |
| Inline utility classes everywhere | Fast styling, no abstraction overhead | Unmaintainable, hard to refactor, no design system | Initial exploration only, extract components within 1-2 sprints |
| Disabling CSP or using `unsafe-inline` | Unblock third-party scripts quickly | XSS vulnerabilities, security audit failures | Never acceptable - fix scripts with nonces instead |
| Hardcoded environment variables | Works immediately, no validation setup | Crashes in production, secrets in code | Never acceptable - use proper env validation from start |
| Skipping `next/image` for content images | Simpler HTML, no sizing requirements | Poor Core Web Vitals, slow page loads | Small UI icons only, never content images |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Email services | Fire-and-forget without error handling | Wrap in try/catch, log failures, queue retries, monitor metrics |
| Redis rate limiting | Using localhost URL in production | Configure proper connection string, use connection pooling, test failover |
| Three.js rendering | Attempting SSR without dynamic imports | Dynamic import with `ssr: false`, check `typeof window`, use `'use client'` |
| Database queries | Directly in Server Components | Use Data Access Layer, validate inputs with Zod, return DTOs only |
| Third-party scripts | Loading without CSP consideration | Use nonces, configure CSP to allow specific domains, test violations |
| Auth providers | Trusting client-side session data | Re-verify server-side for every protected action, use secure cookies |
| Image CDNs | Forgetting to configure `remotePatterns` | Add domains to `next.config.js`, include port for localhost |
| API routes | Using GET for mutations | Always POST for mutations, use Server Actions instead of API routes |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| In-memory caching in serverless | Rate limits/session storage not persisting | Use Redis or edge KV storage | First production deployment with multiple instances |
| Large bundle sizes from barrel imports | Slow page loads, high TTI/LCP | Explicit imports, code splitting, dynamic imports | >500KB bundle size |
| Three.js rendering on every page | High memory usage, GPU overload | Lazy load with Suspense, dispose objects, limit complexity | 10+ concurrent 3D scenes |
| Unoptimized images | High CLS, slow LCP, large bandwidth | Use `next/image`, proper sizing, modern formats (WebP/AVIF) | >500KB images, mobile users |
| Synchronous email sending | Request timeouts, poor UX | Use background jobs, queue with retry logic | >100 emails/hour |
| No caching strategy | Slow API responses, high DB load | Implement fetch caching, revalidation, Redis for computed data | >1000 requests/minute |
| Fetching data in components | Waterfall requests, slow rendering | Use parallel fetching, streaming, React Suspense | >5 serial requests per page |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Server Actions without auth checks | Unauthorized mutations, data leaks | Authenticate in every action, centralize in DAL |
| `NEXT_PUBLIC_` prefix on secrets | API keys exposed in client bundle | Only use for truly public values, check DevTools Network tab |
| No input validation on Server Actions | SQL injection, command injection | Use Zod/Valibot, sanitize all inputs, parameterized queries |
| Weak or missing CSP | XSS attacks, script injection | Use nonces, strict CSP, report violations, test regularly |
| Trusting searchParams/headers | Parameter tampering, privilege escalation | Re-verify server-side, never trust client data for auth |
| No CSRF protection with proxies | Cross-site request forgery | Configure `allowedOrigins`, use CSRF tokens for sensitive actions |
| Environment variables not validated | Crashes in production, missing config | Validate with Zod at startup, fail fast if invalid |
| Passing raw database objects to client | Sensitive data exposure, PII leaks | Use DTOs, filter fields, apply authorization |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Silent email failures | Users never receive critical emails | Show feedback, log errors, retry failed sends, monitor delivery |
| Missing loading states for Server Actions | Forms appear broken, double submissions | Use `useFormState`, show pending state, disable button while loading |
| Hydration errors causing flicker | Content flashes/changes on load | Fix SSR/client mismatches, use dynamic imports for client-only code |
| Poor image loading (no size reservation) | Layout shifts while scrolling (CLS) | Always set width/height on images, use `next/image` properly |
| Service worker cache serving stale content | Users see old version after updates | Implement cache versioning, clear old caches, test update flow |
| Three.js scenes blocking main thread | Janky scrolling, unresponsive UI | Offload to Web Workers, reduce complexity, use level-of-detail |
| No error boundaries | White screen on errors | Add error.tsx files, catch errors gracefully, show user-friendly messages |
| Missing accessibility on custom components | Screen reader failures, keyboard nav broken | Use semantic HTML, ARIA labels, test with keyboard/screen reader |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Server Actions:** Often missing authentication checks - verify every action checks user session
- [ ] **Environment variables:** Often missing validation - verify startup validation with Zod
- [ ] **Email sending:** Often missing error handling - verify try/catch, logging, retry logic
- [ ] **Images:** Often missing optimization - verify using `next/image` with proper sizing
- [ ] **TypeScript:** Often has `any` types - verify strict mode enabled, no implicit any
- [ ] **Rate limiting:** Often using in-memory in serverless - verify using Redis in production
- [ ] **CSP:** Often missing or too permissive - verify nonces configured, no unsafe-inline
- [ ] **CSRF protection:** Often relying only on defaults - verify configured for proxy setup
- [ ] **Design system:** Often just utility classes - verify component library exists
- [ ] **Three.js:** Often causes hydration errors - verify dynamic imports with ssr: false
- [ ] **Service worker:** Often has hardcoded cache - verify cache versioning based on build ID
- [ ] **Data fetching:** Often leaks sensitive data - verify using DTOs, Data Access Layer

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Legacy peer dependencies in production | MEDIUM | Audit dependency tree with `npm ls`, update libraries to React 19 compatible versions, remove `--legacy-peer-deps`, test thoroughly |
| Server Actions without security | HIGH | Audit all actions, add authentication/validation layer, use Zod schemas, add rate limiting, security review before deploying |
| Utility class soup | MEDIUM | Extract reusable components, define design tokens, create component library, gradually migrate from utilities to components |
| Weak CSP allowing XSS | HIGH | Implement strict CSP with nonces, audit all inline scripts, add CSP reporting, penetration testing |
| Type any causing production bugs | LOW-MEDIUM | Enable strict TypeScript, gradually type starting with error-prone paths, use Zod for external data |
| In-memory rate limiting in production | LOW | Set up Redis/Upstash, update rate limit logic to use centralized store, deploy and verify across instances |
| Missing image optimization | LOW | Replace `<img>` with `<Image>`, add width/height, configure priority for above-fold, test Core Web Vitals |
| Hardcoded service worker cache | LOW | Update cache name to use BUILD_ID, implement activate cleanup, test update flow, clear old caches |
| Silent email failures | MEDIUM | Add error handling, implement job queue for retries, set up monitoring/alerts, notify users of failures |
| Tailwind v4 upgrade breakage | MEDIUM | Run upgrade tool, visual regression testing, fix renamed utilities manually, test in all browsers |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Legacy peer dependencies | Foundation: Dependency audit | `npm ls` shows no peer dependency warnings, all packages React 19 compatible |
| Insecure Server Actions | Security hardening | Every Server Action has auth check, input validation with Zod, security audit passes |
| Tailwind utility class soup | Design system foundation | Component library exists with >10 reusable components, design tokens defined |
| App Router/Pages Router mixing | Migration planning | Clear boundaries documented, tracking sheet shows progress, no new Pages Router code |
| Environment variable leaks | Security hardening | Validation at startup, no `NEXT_PUBLIC_` on secrets, `server-only` package used |
| TypeScript any types | Type safety | Strict mode enabled, <5 `any` types in codebase, external data validated with Zod |
| Silent email failures | Error handling/observability | Try/catch on all sends, logging configured, monitoring dashboard shows delivery rate |
| In-memory rate limiting | Infrastructure setup | Redis configured, rate limiting tested across multiple instances |
| Missing next/image | Performance optimization | Lighthouse CLS <0.1, all content images use `<Image>`, proper sizing configured |
| Hardcoded service worker cache | PWA/caching | Cache names use BUILD_ID, update flow tested, old caches cleaned on activate |
| Weak CSP | Security hardening | Strict CSP with nonces, no unsafe-inline, violations monitored and addressed |
| Tailwind v4 breaking changes | Tailwind upgrade | Visual regression tests pass, all renamed utilities updated, browser compatibility verified |
| Dynamic class names not detected | Design system foundation | Component props map to complete class names, no string interpolation for classes |
| Three.js hydration errors | Three.js integration | Dynamic imports with ssr: false, no hydration errors in console |
| No CSRF protection | Security hardening | Allowed origins configured, CSRF tokens on sensitive actions, security audit passes |

## Sources

### Next.js Documentation & Official Sources
- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security) (OFFICIAL - HIGH CONFIDENCE)
- [Next.js Content Security Policy Guide](https://nextjs.org/docs/pages/guides/content-security-policy) (OFFICIAL - HIGH CONFIDENCE)
- [Next.js App Router Migration Guide](https://nextjs.org/docs/app/guides/migrating/app-router-migration) (OFFICIAL - HIGH CONFIDENCE)
- [Next.js Version 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) (OFFICIAL - HIGH CONFIDENCE)

### Tailwind CSS Documentation
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) (OFFICIAL - HIGH CONFIDENCE)
- [Tailwind CSS Content Configuration](https://tailwindcss.com/docs/content-configuration) (OFFICIAL - HIGH CONFIDENCE)

### Community & Technical Articles
- [Taxonomy of Next.js Tech Debt](https://www.lewis-lin.com/blog/nextjs-tech-debt-demolition-your-ultimate-guide-to-cleaner-faster-code) (MEDIUM CONFIDENCE)
- [Next.js 15 & 16 Features: Complete Migration Guide 2026](https://jishulabs.com/blog/nextjs-15-16-features-migration-guide-2026) (MEDIUM CONFIDENCE)
- [Next.js App Router Migration: The Good, Bad, and Ugly](https://www.flightcontrol.dev/blog/nextjs-app-router-migration-the-good-bad-and-ugly) (MEDIUM CONFIDENCE)
- [Don't use Tailwind for your Design System](https://sancho.dev/blog/tailwind-and-design-systems) (MEDIUM CONFIDENCE)
- [5 Tailwind CSS Anti-Patterns to Avoid](https://spin.atomicobject.com/tailwind-css-anti-patterns/) (MEDIUM CONFIDENCE)
- [How to Build a Design Token System for Tailwind](https://hexshift.medium.com/how-to-build-a-design-token-system-for-tailwind-that-scales-forever-84c4c0873e6d) (MEDIUM CONFIDENCE)
- [Tailwind CSS Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns) (MEDIUM CONFIDENCE)

### React 19 & Dependencies
- [Resolving React 19 Dependency Conflicts](https://medium.com/@zachshallbetter/resolving-react-19-dependency-conflicts-without-downgrading-ee0a808af2eb) (MEDIUM CONFIDENCE)
- [React 19.1 Release Notes](https://www.wisp.blog/blog/react-191-is-out-heres-what-you-need-to-know) (MEDIUM CONFIDENCE)

### Security & Best Practices
- [Next.js Security Hardening: Five Steps to Bulletproof Your App in 2026](https://medium.com/@widyanandaadi22/next-js-security-hardening-five-steps-to-bulletproof-your-app-in-2026-61e00d4c006e) (MEDIUM CONFIDENCE)
- [Complete Next.js Security Guide 2025](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices) (MEDIUM CONFIDENCE)
- [Implementing CSRF Protection in Next.js](https://medium.com/@mmalishshrestha/implementing-csrf-protection-in-next-js-applications-9a29d137a12d) (MEDIUM CONFIDENCE)

### Type Safety & TypeScript
- [An Inconsistent Truth: Next.js and Type Safety](https://t3.gg/blog/post/types-and-nextjs) (MEDIUM CONFIDENCE)
- [TypeScript Fundamentals in 2026](https://www.nucamp.co/blog/typescript-fundamentals-in-2026-why-every-full-stack-developer-needs-type-safety) (MEDIUM CONFIDENCE)

### Performance & Optimization
- [Next.js Image Optimization Guide](https://www.debugbear.com/blog/nextjs-image-optimization) (MEDIUM CONFIDENCE)
- [Next.js Image Component: Performance and CWV in Practice](https://pagepro.co/blog/nextjs-image-component-performance-cwv/) (MEDIUM CONFIDENCE)

### Service Workers & PWA
- [Next.js PWA Offline Capability with Service Worker](https://adropincalm.com/blog/nextjs-offline-service-worker/) (MEDIUM CONFIDENCE)
- [Build a Next.js 16 PWA with True Offline Support](https://blog.logrocket.com/nextjs-16-pwa-offline-support/) (MEDIUM CONFIDENCE)

### Rate Limiting
- [Rate Limiting Next.js API with Redis](https://medium.com/better-dev-nextjs-react/rate-limiting-your-next-js-api-with-redis-b35a6622acba) (MEDIUM CONFIDENCE)
- [Set up Rate Limiting in Next.js with Redis](https://blog.logrocket.com/set-up-rate-limiting-next-js-redis/) (MEDIUM CONFIDENCE)
- [Building an In-Memory Rate Limiter in Next.js](https://www.javacodegeeks.com/building-an-in-memory-rate-limiter-in-next-js.html) (LOW CONFIDENCE)

### Three.js Integration
- [React Three Fiber vs. Three.js in 2026](https://graffersid.com/react-three-fiber-vs-three-js/) (MEDIUM CONFIDENCE)
- [Integrating Three.js with Next.js and TypeScript](https://medium.com/@claudeando/integrating-three-js-with-next-js-and-typescript-81f47730103e) (LOW CONFIDENCE)

### Error Handling
- [Next.js 15: Error Handling Best Practices](https://devanddeliver.com/blog/frontend/next-js-15-error-handling-best-practices-for-code-and-routes) (MEDIUM CONFIDENCE)
- [Next.js Error Handling Patterns](https://betterstack.com/community/guides/scaling-nodejs/error-handling-nextjs/) (MEDIUM CONFIDENCE)

---
*Pitfalls research for: Next.js stabilization and Tailwind CSS custom design system*
*Researched: 2026-02-16*
