# Architecture Research

**Domain:** Custom Design System Integration with Tailwind CSS + Next.js App Router
**Researched:** 2026-02-16
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   CSS STYLING LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌─────────────────────────────┐    │
│  │  Tailwind Utilities│  │  Custom Design Tokens       │    │
│  │  (@layer utilities)│  │  (@theme directive)         │    │
│  └──────────┬─────────┘  └──────────┬──────────────────┘    │
│             │                       │                        │
│  ┌──────────┴───────────────────────┴──────────────────┐    │
│  │          Component Styles (@layer components)       │    │
│  └──────────────────────────────────┬──────────────────┘    │
│                                     │                        │
│  ┌──────────────────────────────────┴──────────────────┐    │
│  │          Base Styles (@layer base)                  │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                   COMPONENT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Navigation  │  │ Cards       │  │ Typography  │          │
│  │ Components  │  │ Components  │  │ Components  │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                  │
├─────────┴────────────────┴────────────────┴──────────────────┤
│                   PAGE LAYER (App Router)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Root Layout (globals.css + design tokens)          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   BUG FIX LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Dependencies │  │ Reliability  │  │ Security     │       │
│  │ (Peer deps)  │  │ (Services)   │  │ (CSP, CSRF)  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │               │
│  ┌──────┴─────────────────┴─────────────────┴───────┐       │
│  │         Code Quality (Type safety, linting)      │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **@theme directive** | Define design tokens (colors, spacing, fonts, radii, shadows) | CSS custom properties in globals.css |
| **@layer base** | Reset styles, global element defaults, Tailwind preflight | Applied via @import "tailwindcss" |
| **@layer components** | Reusable component patterns (btn, card, nav-item) | CSS classes with @layer components {} |
| **@layer utilities** | Custom atomic classes extending Tailwind | CSS classes with @layer utilities {} or @utility |
| **Navigation Components** | Header, nav, glassmorphic effects | React client components using design tokens |
| **Card Components** | Project tiles, photo cards, content containers | React components with token-based styling |
| **Typography Components** | Headings, body text, code blocks | React components with semantic HTML |
| **Root Layout** | Global style injection, theme provider | app/layout.tsx importing globals.css |

## Recommended Project Structure

### Design System Layer

```
app/
├── globals.css              # Tailwind imports + design tokens
│   ├── @import "tailwindcss"
│   ├── @theme { ... }       # Custom design tokens
│   ├── @layer base { ... }  # Global element styles
│   ├── @layer components { ... }  # Component patterns
│   └── @layer utilities { ... }   # Custom utilities
├── layout.tsx               # Import globals.css here
└── [pages]/                 # Page components using design system

components/
├── design-system/           # Design system components
│   ├── navigation/
│   │   ├── GlassmorphicNav.tsx
│   │   └── NavLink.tsx
│   ├── cards/
│   │   ├── ProjectCard.tsx
│   │   └── PhotoCard.tsx
│   ├── typography/
│   │   ├── Heading.tsx
│   │   └── BodyText.tsx
│   └── index.ts            # Barrel export
└── [feature-components]/    # Existing components

lib/
├── design-tokens.ts         # TypeScript constants matching CSS tokens
└── cn.ts                   # Class name utility (clsx + tailwind-merge)
```

### Bug Fix Organization

```
.planning/
├── bugs/
│   ├── dependencies.md      # Peer dep conflicts, version mismatches
│   ├── reliability.md       # Rate limiting, email, service worker
│   ├── security.md          # CSP, CSRF, env validation
│   └── code-quality.md      # Type safety, missing images, linting

docs/
└── bug-fix-log.md          # Chronological fix history

[relevant-files]/            # Fixes applied in context
```

### Structure Rationale

- **globals.css centralization:** Tailwind v4 uses CSS-first configuration via @theme, making globals.css the single source of truth for design tokens. This eliminates config file fragmentation.
- **@layer ordering:** CSS cascade layers ensure utilities always override components, components override base, preventing specificity battles.
- **design-system/ subdirectory:** Groups design system components separately from feature components, making the custom layer explicit and preventing accidental modifications.
- **lib/design-tokens.ts:** TypeScript mirror of CSS tokens enables type-safe runtime access (e.g., for Three.js colors, JS animations).
- **Bug fix categorization:** Separates concerns by root cause (deps, reliability, security, quality) rather than symptom, enabling parallel fixes and preventing cross-contamination.

## Architectural Patterns

### Pattern 1: CSS-First Design Tokens

**What:** Define design tokens in CSS using @theme directive instead of JavaScript config, making them available as CSS custom properties.

**When to use:** Always in Tailwind v4 projects. Required for organic-meets-digital aesthetic with custom color palettes, typography scales, and spacing systems.

**Trade-offs:**
- **Pros:** Runtime access to tokens via CSS variables, better browser DevTools support, works with CSP without unsafe-inline, smaller production CSS (70% reduction vs v3).
- **Cons:** Learning curve for teams used to tailwind.config.js, requires Tailwind v4+ (portfolio app uses v4.1.18).

**Example:**
```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Organic-meets-digital color palette */
  --color-earth-100: #f5f3f0;
  --color-earth-500: #8b7355;
  --color-earth-900: #3d2f1f;
  --color-digital-cyan: #00f0ff;
  --color-digital-magenta: #ff00aa;

  /* Typography scale */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;

  /* Custom spacing for organic layouts */
  --spacing-organic-sm: 0.625rem;
  --spacing-organic-md: 1.375rem;
  --spacing-organic-lg: 2.125rem;
}

/* TypeScript mirror for runtime access */
// lib/design-tokens.ts
export const colors = {
  earth: {
    100: '#f5f3f0',
    500: '#8b7355',
    900: '#3d2f1f',
  },
  digital: {
    cyan: '#00f0ff',
    magenta: '#ff00aa',
  },
} as const;
```

### Pattern 2: Component Layer for Reusable Patterns

**What:** Use @layer components {} to define reusable component styles that can be extended with utilities.

**When to use:** For patterns used 3+ times (buttons, cards, nav items). Avoids className="..." duplication across components.

**Trade-offs:**
- **Pros:** DRY principle, consistent styling, utilities can still override via cascade layers.
- **Cons:** Temptation to over-abstract, can hide complexity from component files.

**Example:**
```css
/* app/globals.css */
@layer components {
  .glassmorphic-panel {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
  }

  .project-card {
    @apply glassmorphic-panel p-6 transition-transform hover:scale-105;
  }

  .nav-link {
    @apply text-earth-900 hover:text-digital-cyan transition-colors;
  }
}
```

```tsx
// components/design-system/cards/ProjectCard.tsx
export function ProjectCard({ title, description }: Props) {
  return (
    <div className="project-card">
      {/* utilities still work: */}
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p>{description}</p>
    </div>
  );
}
```

### Pattern 3: Bug Fix Isolation by Domain

**What:** Organize bug fixes by domain (dependencies, reliability, security, quality) rather than by file location or component.

**When to use:** During stabilization phases, when multiple bug categories exist simultaneously.

**Trade-offs:**
- **Pros:** Parallel workstreams possible (deps team, security team), prevents fixes from interfering, clear ownership.
- **Cons:** Requires coordination to prevent merge conflicts, may duplicate effort if bugs share root causes.

**Example:**
```markdown
<!-- .planning/bugs/dependencies.md -->
## Peer Dependency Conflicts

**Issue:** npm install requires --legacy-peer-deps flag
**Root cause:** React 19.2.4 peer dep mismatches in @react-three/* packages
**Fix strategy:**
1. Audit package.json for packages without React 19 support
2. Replace or upgrade incompatible packages
3. Document remaining --legacy-peer-deps requirements

**Blockers:**
- @react-three/fiber may need release for React 19

**Timeline:** Phase 1 (Foundation)
```

```markdown
<!-- .planning/bugs/security.md -->
## CSP Nonce for Inline Styles

**Issue:** CSP blocks Framer Motion inline styles
**Root cause:** Missing nonce attribute on <style> tags
**Fix strategy:**
1. Generate nonce in middleware.ts
2. Pass via headers to app
3. Apply to Framer Motion styled-components

**Dependencies:**
- Design system work (can run parallel)

**Timeline:** Phase 1 (Foundation)
```

### Pattern 4: CSS Custom Properties Bridge

**What:** Mirror CSS design tokens in TypeScript for runtime JavaScript access (Three.js materials, canvas animations).

**When to use:** When design tokens need to be accessed outside CSS (3D scenes, programmatic animations, chart colors).

**Trade-offs:**
- **Pros:** Single source of truth (CSS), TypeScript type safety for JS usage, no prop drilling.
- **Cons:** Manual synchronization required, introduces duplication risk.

**Example:**
```css
/* app/globals.css */
@theme {
  --color-primary: #00f0ff;
  --color-secondary: #ff00aa;
}
```

```typescript
// lib/design-tokens.ts
export const colors = {
  primary: '#00f0ff',
  secondary: '#ff00aa',
} as const;

// Validation at build time
if (typeof window !== 'undefined') {
  const root = getComputedStyle(document.documentElement);
  const cssPrimary = root.getPropertyValue('--color-primary').trim();
  if (cssPrimary !== colors.primary) {
    console.warn('CSS token mismatch detected');
  }
}
```

```tsx
// components/Hero3DMountain.tsx
import { colors } from '@/lib/design-tokens';
import * as THREE from 'three';

export function Hero3DMountain() {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.primary), // TypeScript validates
  });
  // ...
}
```

## Data Flow

### Design System Application Flow

```
1. Next.js Build
   ↓
2. app/layout.tsx imports app/globals.css
   ↓
3. Tailwind CSS v4 processes:
   - @import "tailwindcss" → injects base layer
   - @theme { ... } → generates CSS custom properties
   - @layer components { ... } → registers component styles
   - @layer utilities { ... } → registers custom utilities
   ↓
4. CSS Cascade Layers Applied (base → components → utilities)
   ↓
5. Production build:
   - Lightning CSS minifies (70% smaller than v3)
   - CSS variables tree-shaken if unused
   - Output to .next/static/css/
   ↓
6. Browser renders:
   - CSS custom properties available in :root
   - Components apply utility classes
   - Utilities override components via cascade layers
```

### Bug Fix Workflow

```
1. Bug Discovery
   ↓
2. Categorize by domain:
   - Dependencies → .planning/bugs/dependencies.md
   - Reliability → .planning/bugs/reliability.md
   - Security → .planning/bugs/security.md
   - Code Quality → .planning/bugs/code-quality.md
   ↓
3. Analyze root cause:
   - Peer dep version conflict?
   - Missing rate limiting?
   - CSP misconfiguration?
   - Type unsafety?
   ↓
4. Plan fix in parallel streams:
   - Dependencies can fix while security fixes happen
   - Reliability independent of code quality
   ↓
5. Implement in relevant files:
   - package.json (deps)
   - middleware.ts (rate limiting, CSP)
   - next.config.ts (security headers)
   - components/*.tsx (type fixes)
   ↓
6. Verify fix doesn't break other domains:
   - Run full test suite
   - Check for cascading effects
   ↓
7. Document in bug-fix-log.md
```

### Key Data Flows

1. **Design Token Propagation:** CSS @theme → CSS custom properties → Tailwind utilities → React className → DOM styles
2. **Runtime Token Access:** CSS @theme → lib/design-tokens.ts → JavaScript code → Three.js/animations
3. **Bug Fix Coordination:** Bug discovery → domain categorization → parallel fix streams → integration testing → deployment

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **Initial (current: 15+ components)** | Single globals.css file, flat component structure, manual token sync acceptable |
| **Medium (50+ components)** | Split design system into modules (navigation.css, cards.css, typography.css), use CSS @import to compose, create design-tokens package |
| **Large (200+ components, multiple apps)** | Extract design system to separate npm package, use monorepo (Turborepo/Nx), automate token sync (Style Dictionary), implement visual regression testing (Chromatic) |

### Scaling Priorities

1. **First bottleneck (at ~30 components):** globals.css becomes hard to navigate
   - **Fix:** Split into @import-ed modules: `@import "./tokens.css"; @import "./components.css"; @import "./utilities.css";`
   - **Complexity:** Low (Tailwind v4 supports CSS @import natively)

2. **Second bottleneck (at ~50 components):** Design token sync errors between CSS and TypeScript
   - **Fix:** Automate with Style Dictionary (JSON → CSS + TS)
   - **Complexity:** Medium (requires build pipeline changes)

3. **Third bottleneck (at multiple consuming apps):** Duplicate design system code across projects
   - **Fix:** Extract to @yourorg/design-system npm package
   - **Complexity:** High (requires monorepo infrastructure, versioning strategy)

## Anti-Patterns

### Anti-Pattern 1: Mixing v3 and v4 Configuration

**What people do:** Keep tailwind.config.ts while using @theme directive, causing duplicate token definitions.

**Why it's wrong:**
- Tailwind v4 ignores JavaScript config for theme values
- Creates confusion about source of truth
- Leads to divergence between config and actual output

**Do this instead:**
- Delete tailwind.config.ts (or reduce to minimal PostCSS plugin config)
- Move all theme customization to @theme in globals.css
- Use only postcss.config.mjs for plugin configuration

**Example:**
```javascript
// ❌ BAD: tailwind.config.ts in v4 project
export default {
  theme: {
    extend: {
      colors: {
        primary: '#00f0ff', // Ignored by v4!
      },
    },
  },
};
```

```css
/* ✅ GOOD: app/globals.css with @theme */
@theme {
  --color-primary: #00f0ff; /* Single source of truth */
}
```

### Anti-Pattern 2: Inline Styles Breaking CSP

**What people do:** Add style={{ ... }} for dynamic values, breaking Content Security Policy with 'unsafe-inline'.

**Why it's wrong:**
- CSP violations in production
- Forces 'unsafe-inline' in script-src or style-src, defeating CSP purpose
- Breaks SSR hydration in strict CSP environments

**Do this instead:**
- Use CSS custom properties for dynamic values
- Apply via className with CSS variable updates
- Use nonce-based CSP for legitimate inline styles

**Example:**
```tsx
// ❌ BAD: Inline styles violate CSP
<div style={{ backgroundColor: userColor }}>

// ✅ GOOD: CSS custom properties
<div
  className="dynamic-bg"
  style={{ '--user-color': userColor } as React.CSSProperties}
>

/* CSS */
.dynamic-bg {
  background-color: var(--user-color);
}
```

### Anti-Pattern 3: Bug Fix "Whack-a-Mole"

**What people do:** Fix bugs in isolation without categorizing by domain, leading to fixes that break other areas.

**Why it's wrong:**
- Peer dep fix might break type safety fix
- Security header change might break email service
- No visibility into fix relationships
- Regression risk increases with each fix

**Do this instead:**
- Categorize all bugs by domain first
- Document dependencies between fixes
- Fix in domain-based phases with integration testing between
- Maintain bug fix log with cross-references

**Example:**
```markdown
<!-- ❌ BAD: Linear bug list -->
- Fix peer deps
- Fix type error in Hero3DMountain
- Add CSP nonce
- Fix email rate limiting

<!-- ✅ GOOD: Domain-categorized with dependencies -->
## Dependencies (Phase 1a)
- Upgrade @react-three/fiber to React 19 compatible version
- **Blocks:** Type fixes in 3D components (Phase 1b)

## Security (Phase 1a - can run parallel)
- Add CSP nonce generation in middleware
- **No blockers:** Independent of deps/reliability

## Reliability (Phase 1b - depends on deps)
- Add rate limiting to /api/feedback
- **Depends on:** Middleware changes (security phase)

## Code Quality (Phase 1c - depends on deps)
- Fix TypeScript errors in Hero3DMountain
- **Depends on:** @react-three/fiber upgrade (deps phase)
```

### Anti-Pattern 4: Over-Abstracting Component Styles

**What people do:** Create @layer components classes for every repeated pattern, even single-use ones.

**Why it's wrong:**
- Hides styling logic from component files
- Makes Tailwind's utility-first approach less visible
- Creates indirection that slows development
- Harder to override with utilities when cascade layer fights occur

**Do this instead:**
- Use @layer components only for patterns used 3+ times
- Keep 1-2 use patterns as className utilities in components
- Extract to component styles only when duplication becomes painful
- Prefer composition (shared React components) over CSS abstraction

**Example:**
```css
/* ❌ BAD: Over-abstraction */
@layer components {
  .hero-title { /* used once */ }
  .hero-subtitle { /* used once */ }
  .hero-cta { /* used once */ }
}
```

```tsx
/* ✅ GOOD: Utilities in component, extract only common patterns */
// components/Hero.tsx
<h1 className="text-6xl font-bold text-earth-900 mb-4">
<h2 className="text-2xl text-earth-500 mb-8">
<button className="btn-primary"> {/* 3+ uses, worth extracting */}

/* app/globals.css */
@layer components {
  .btn-primary { /* Used across multiple components */ }
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Vercel Deployment** | Auto-detects Next.js, builds with Tailwind v4 | Set `VERCEL_ENV` for environment-specific configs |
| **Resend Email** | API route handler with rate limiting | Add rate limit before email call to prevent abuse |
| **Three.js** | Import design tokens via lib/design-tokens.ts | Use CSS custom property values for material colors |
| **Framer Motion** | Client components with CSP nonce | Generate nonce in middleware, pass to motion.div |
| **Service Worker** | Register in client component, cache CSS bundles | Update cache on design system changes |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **globals.css ↔ React components** | className prop with Tailwind utilities | One-way: CSS defines, React applies |
| **@theme ↔ lib/design-tokens.ts** | Manual sync (or Style Dictionary automation) | Bidirectional consistency required |
| **Bug fixes ↔ Design system work** | Independent except type fixes | Run in parallel, integrate at end of phase |
| **App Router ↔ Design system** | Import globals.css in root layout | CSS loaded once, applies to all routes |
| **CSP middleware ↔ Inline styles** | Nonce generation and injection | Middleware provides nonce, components consume |

## CSP-Compliant Architecture

### CSP Header Strategy

```typescript
// middleware.ts (recommended pattern for Next.js 16+)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}
```

### Nonce Injection Pattern

```tsx
// app/layout.tsx
import { headers } from 'next/headers';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');

  return (
    <html lang="en">
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content={headersList.get('Content-Security-Policy') || ''}
        />
      </head>
      <body>
        {children}
        {/* Pass nonce to client components via context */}
        <script nonce={nonce} dangerouslySetInnerHTML={{
          __html: `window.__CSP_NONCE__="${nonce}";`
        }} />
      </body>
    </html>
  );
}
```

**Note:** Tailwind v4's CSS-first approach naturally supports CSP because all styles are in external CSS files, not inline. Only Framer Motion or other dynamic style libraries require nonce handling.

## Build Order Implications

### Recommended Phase Structure

**Phase 1: Foundation (Parallel Streams)**
- **Stream A (Dependencies):** Fix peer deps, upgrade incompatible packages
- **Stream B (Security):** CSP nonce, CSRF protection, env validation
- **Stream C (Design Tokens):** Define @theme in globals.css, create lib/design-tokens.ts

**Dependencies:**
- None (all three can run in parallel)
- Integration point: End-of-phase testing to ensure no conflicts

**Phase 2: Design System Components (Sequential after Phase 1)**
- **2a:** Navigation components (GlassmorphicNav, NavLink)
- **2b:** Card components (ProjectCard, PhotoCard)
- **2c:** Typography components (Heading, BodyText)

**Dependencies:**
- **Requires:** Phase 1 Stream C (design tokens must exist)
- **Blocked by:** Phase 1 Stream A (if @react-three/* deps affect imports)

**Phase 3: Reliability & Code Quality (Parallel)**
- **Stream A:** Rate limiting, email service hardening
- **Stream B:** Type safety fixes, missing image handling, linting

**Dependencies:**
- **Requires:** Phase 1 Stream B (CSP middleware for rate limiting context)
- **Can run parallel:** Reliability and code quality independent

**Phase 4: Integration & Testing**
- E2E tests for design system components
- Visual regression testing
- Performance benchmarking (CSS bundle size, LCP, FCP)

**Dependencies:**
- **Requires:** All previous phases complete

### Build Order Rationale

1. **Phase 1 parallelization:** Dependencies, security, and design tokens have no interdependencies. Running in parallel saves calendar time.

2. **Phase 2 sequencing:** Design system components require tokens (Phase 1C) but can build in any order internally (navigation ≠ cards ≠ typography).

3. **Phase 3 parallelization:** Reliability work (rate limiting) and code quality (type fixes) touch different files, minimal merge conflict risk.

4. **Phase 4 as gate:** Integration testing catches cross-phase issues before production deployment.

### Critical Path

```
Dependencies (1A) → Code Quality (3B) [TypeScript fixes need upgraded deps]
Design Tokens (1C) → Design System (2a/2b/2c) [Components need tokens]
Security (1B) → Reliability (3A) [Rate limiting uses middleware from security]

Longest path: Dependencies → Code Quality = 2 phases
All paths converge at Integration (Phase 4)
```

## Sources

**Tailwind CSS v4 & Design Tokens:**
- [Tailwind CSS v4.0 Official Release](https://tailwindcss.com/blog/tailwindcss-v4)
- [Theme variables - Tailwind CSS](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4: The Complete Guide for 2026](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide)
- [Tailwind CSS 4 @theme: The Future of Design Tokens](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06)

**Next.js CSS Architecture:**
- [Getting Started: CSS | Next.js](https://nextjs.org/docs/app/getting-started/css)
- [Install Tailwind CSS with Next.js - Tailwind CSS](https://tailwindcss.com/docs/guides/nextjs)
- [Modern CSS Architecture with Tailwind CSS and Next.js](https://vladimirsiedykh.com/blog/modern-css-architecture-tailwind-nextjs)
- [Tailwind + Next.js: The Complete Setup Guide (2026)](https://designrevision.com/blog/tailwind-nextjs-setup)

**Design System Architecture:**
- [Organizing Design System Component Patterns With CSS Cascade Layers](https://css-tricks.com/organizing-design-system-component-patterns-with-css-cascade-layers/)
- [Building the Ultimate Design System: A Complete Architecture Guide for 2026](https://medium.com/@padmacnu/building-the-ultimate-design-system-a-complete-architecture-guide-for-2026-6dfcab0e9999)
- [The Three-Layer UI Component Architecture](https://markus.oberlehner.net/blog/the-three-layer-ui-component-architecture-versatile-building-blocks-for-crafting-multiple-design-systems)

**Technical Debt & Bug Management:**
- [Technical Debt vs. Architecture Debt: Don't Confuse Them](https://thenewstack.io/technical-debt-vs-architecture-debt-dont-confuse-them/)
- [Technical debt: a strategic guide for 2026](https://monday.com/blog/rnd/technical-debt/)
- [Technical Debt Management Strategies for Sustainable Software Development](https://dasroot.net/posts/2026/02/technical-debt-management-sonarqube-cicd/)

**Dependency Management & Security:**
- [How to Fix npm Peer Dependency Conflicts](https://oneuptime.com/blog/post/2026-01-22-nodejs-fix-npm-peer-dependency-conflicts/view)
- [16 Best Practices for Reducing Dependabot Noise](https://nesbitt.io/2026/01/10/16-best-practices-for-reducing-dependabot-noise.html)
- [DevSecOps Trends 2026: The Ultimate Guide](https://www.practical-devsecops.com/devsecops-trends-2026/)

**Next.js Security & CSP:**
- [Guides: Content Security Policy | Next.js](https://nextjs.org/docs/app/guides/content-security-policy)
- [Next.js Security Hardening: Five Steps to Bulletproof Your App in 2026](https://medium.com/@widyanandaadi22/next-js-security-hardening-five-steps-to-bulletproof-your-app-in-2026-61e00d4c006e)
- [@next-safe/middleware: Strict Content-Security-Policy (CSP) for Next.js](https://next-safe-middleware.vercel.app/guides/strict-csp-configuration)

**Rate Limiting & Reliability:**
- [How to Implement Rate Limiting in Next.js](https://peerlist.io/blog/engineering/how-to-implement-rate-limiting-in-nextjs)
- [Rate-limiting Server Actions in Next.js](https://nextjsweekly.com/blog/rate-limiting-server-actions)
- [Complete Next.js security guide 2025](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices)

---

*Architecture research for: Portfolio App Stabilization & Custom Design System*
*Researched: 2026-02-16*
*Confidence: HIGH (verified with official Tailwind v4 docs, Next.js 16.1.6 docs, multiple 2026 sources)*
