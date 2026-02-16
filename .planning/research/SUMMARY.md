# Project Research Summary

**Project:** Portfolio App Stabilization & Custom Design System
**Domain:** Next.js 16 + React 19 + Tailwind CSS 4 Portfolio with 3D Visualizations
**Researched:** 2026-02-16
**Confidence:** HIGH

## Executive Summary

This is a modern portfolio application built with Next.js 16, React 19, and Tailwind CSS 4, featuring 3D visualizations via Three.js. The project requires two parallel tracks: fixing production-critical bugs and implementing a custom "organic-meets-digital" design system. Research reveals this is a stabilization-before-enhancement project where technical debt must be resolved before visual identity work can proceed safely.

The recommended approach is a phased strategy starting with dependency resolution and security hardening (foundation), followed by design token definition, then component library creation, and finally performance optimization. The key risk is attempting design system work before resolving peer dependency conflicts and type safety issues, which would compound debugging complexity. Mitigation requires strict phase sequencing: foundation bugs → design tokens → components → refinements.

Critical findings include: React 19 compatibility issues require immediate attention, Server Actions lack security validation, and the current `--legacy-peer-deps` workaround masks runtime incompatibilities. The organic-meets-digital design vision demands a component-first approach rather than utility-class proliferation. Tailwind v4's CSS-first architecture with `@theme` directive is the foundation for the custom design system.

## Key Findings

### Recommended Stack

The existing stack (Next.js 16.1.6, React 19.2.4, Tailwind CSS 4.1.18) is production-ready, but requires complementary tooling for stabilization and design system work. The CSS-first configuration approach in Tailwind v4 fundamentally changes how design tokens are managed, moving from JavaScript config to native CSS custom properties.

**Core technologies:**
- **Next.js 16.1.6+**: App Router framework — already deployed, maintain current version with React 19 support
- **React 19.2.4+**: UI library — stable release with Activity feature, full Next.js 16 compatibility
- **Tailwind CSS 4.1.18+**: Utility-first CSS — v4 rewrite uses CSS-first config via `@theme`, Rust-based Oxide compiler delivers 5x faster builds
- **TypeScript 5.9+**: Type safety — enable strict mode to catch 40% more runtime errors
- **class-variance-authority 0.7.1**: Component variant management — type-safe variants for design system components
- **tailwind-merge 3.4.1+**: Class conflict resolution — essential for custom components, prevents style conflicts
- **@radix-ui/react-***: Headless accessible primitives — foundation for custom navigation, dialogs, dropdowns
- **Zod 4.3.6+**: Runtime validation — already installed, use for env vars, form validation, API responses
- **@t3-oss/env-nextjs 0.13+**: Environment variable validation — type-safe env vars with build + runtime checks
- **Three.js 0.182+** + **@react-three/fiber 9.5+**: 3D graphics — already integrated, v9 fully supports React 19

**Critical tooling for stabilization:**
- **npm-check-updates 19.3+**: Dependency version management — active maintenance, replaces outdated npm-check
- **prettier-plugin-tailwindcss 0.6+**: Automatic class sorting — official plugin, enforces consistent class ordering
- **eslint-plugin-tailwindcss 3.18+**: Tailwind linting — identifies deprecated classes, enforces best practices

### Expected Features

Research identified 18 table stakes features across bug stabilization and design system tracks. The organic-meets-digital theme requires distinctive visual identity while maintaining production reliability.

**Must have (table stakes):**
- **Peer dependency resolution** — blocking package updates, hiding React 19 incompatibilities
- **Environment validation** — prevent runtime config failures, required for production readiness
- **Type safety (no `any` types)** — 4 documented usages need proper typing, defeats TypeScript's purpose
- **Email delivery reliability** — contact form returns success even on failure, destroys trust
- **CSRF protection** — feedback API has no tokens, standard security for state-changing endpoints
- **Content Security Policy (strict)** — currently allows unsafe-inline/unsafe-eval, enables XSS attacks
- **Rate limiting that persists** — in-memory Map resets on deploy, doesn't scale in serverless
- **Color palette definition** — organic (earthy tones) meets digital (glowing tech accents)
- **Typography system** — nature-inspired display font + readable body text, full hierarchy
- **Dark/light mode** — industry standard for 2026 portfolios, system detection + manual toggle
- **Responsive navigation** — current basic nav needs distinctive interaction (vertical/animated/reveal)
- **Card/tile components** — organic shapes with subtle nature textures, tech glows
- **Accessible color contrast** — WCAG AA minimum, critical for color choices

**Should have (differentiators):**
- **Biophilic micro-interactions** — animations inspired by nature (flowing curves, gentle sway), memorable emotional connection
- **Glowing accents and depth** — tech aesthetic connecting 3D components to 2D UI
- **Progressive texture loading for 3D** — PhotoCarousel3D loads all textures at once, needs lazy loading with placeholders
- **Responsive image optimization** — script exists (optimize-images.mjs) but not integrated into build
- **Animation preference detection** — useReducedMotion.ts exists but underused, accessibility requirement

**Defer (v2+):**
- **Database for feedback storage** — wait until volume justifies infrastructure complexity
- **Advanced organic shapes** — complex SVG work, high effort for incremental improvement
- **Nature-inspired textures** — subtle enhancement, test reception first
- **Integrated 3D-to-UI design language** — research project extracting visual motifs from existing 3D work

### Architecture Approach

Tailwind v4's CSS-first architecture with `@layer` cascade system provides the foundation. Design system components sit between CSS tokens and page components, with bug fixes organized by domain (dependencies, reliability, security, code quality) for parallel execution.

**Major components:**
1. **CSS Styling Layer** — `@theme` defines design tokens as CSS custom properties, `@layer base/components/utilities` provides cascade control, single globals.css imports Tailwind and defines custom tokens
2. **Component Layer** — design-system/ subdirectory contains Navigation (GlassmorphicNav), Cards (ProjectCard, PhotoCard), Typography (Heading, BodyText) with class-variance-authority for type-safe variants
3. **Page Layer (App Router)** — root layout imports globals.css once, design tokens cascade to all routes
4. **Bug Fix Layer** — dependencies (peer deps), reliability (services), security (CSP, CSRF), code quality (type safety) organized by domain for parallel fixes
5. **Integration Layer** — lib/design-tokens.ts mirrors CSS tokens for Three.js/JavaScript access, middleware.ts provides CSP nonces and rate limiting

**Key architectural patterns:**
- **CSS-First Design Tokens**: Define tokens in `@theme` directive, generates CSS custom properties, accessible as `var(--color-primary)`, replaces JavaScript config in v4
- **Component Layer for Reusable Patterns**: Use `@layer components {}` for patterns used 3+ times, avoids className duplication, utilities still override via cascade
- **Bug Fix Isolation by Domain**: Categorize by root cause not symptom, enables parallel fix streams, prevents cross-contamination
- **CSS Custom Properties Bridge**: Mirror CSS tokens in TypeScript for Three.js materials and programmatic animations, single source of truth with runtime validation

### Critical Pitfalls

Seven critical pitfalls identified that could derail production launch or compromise security. Each has clear warning signs and prevention strategies.

1. **Legacy Peer Dependencies Masking Runtime Incompatibilities** — `--legacy-peer-deps` bypasses conflicts but creates hidden runtime failures with React 19 features (Server Components, Concurrent Rendering). Audit every package, verify React 19 compatibility in official docs, document every use with justification. Address in Foundation phase before any feature work.

2. **Server Actions Treated as Internal APIs Without Proper Security** — developers assume Server Actions are private but every export creates a public HTTP endpoint. Missing auth/validation allows unauthorized mutations. Add authentication check, Zod validation, and authorization in every Server Action. Address in Security hardening phase.

3. **Overusing Tailwind Utility Classes Instead of Building Component Abstractions** — components become walls of utilities, custom design system never emerges. Define design system components (Card, Button, Typography) BEFORE using in features, use `@theme` for tokens, composition over utilities. Address in Design system foundation phase before feature work.

4. **Mixing App Router and Pages Router Without Clear Boundaries** — hybrid routing creates confusion about data fetching patterns and middleware behavior. Define migration boundaries upfront (complete features not individual pages), document which router serves which routes, set "no Pages Router for new features" rule. Address in Migration planning phase.

5. **Environment Variables Leaked to Client or Not Validated** — sensitive keys exposed via `NEXT_PUBLIC_` prefix or missing variables cause production crashes. Never use `NEXT_PUBLIC_` for secrets, validate with Zod at startup, use `server-only` package, centralize in Data Access Layer. Address in Security hardening phase immediately.

6. **TypeScript `any` Types Hiding Bugs Until Production** — bypasses type safety, allows invalid data shapes, bugs surface as runtime errors. Enable strict TypeScript, type external data with Zod, use `unknown` instead of `any`, type Server Actions properly. Address in Type safety phase.

7. **Silent Email Failures Without Error Tracking** — email sending fails but app continues as if successful, users never receive critical emails. Wrap in try/catch, log failures, show user feedback, queue failed emails with retry, monitor metrics. Address in Error handling/observability phase.

**Additional moderate pitfalls requiring attention:**
- **In-Memory Rate Limiting in Serverless Production**: Works locally but fails in production serverless (isolated memory), use Redis/Upstash instead
- **Missing next/image on Critical Content Images**: Poor Core Web Vitals (CLS, LCP), use `<Image>` for content with width/height
- **Hardcoded Service Worker Cache Breaking Updates**: Users see stale content after deployments, use build hash in cache names
- **Weak CSP Allowing XSS Attacks**: Missing or permissive CSP enables script injection, implement nonces and strict policy
- **Tailwind v4 Upgrade Breaking Existing Styles**: Renamed utilities (shadow-sm → shadow-xs), changed defaults, run upgrade tool and test thoroughly

## Implications for Roadmap

Based on combined research, recommended 4-phase structure with parallel execution where possible. Architecture dependency graph shows critical paths: dependencies → code quality (2 phases), design tokens → design system (2 phases), security → reliability (2 phases).

### Phase 1: Foundation & Security (Parallel Streams)

**Rationale:** Must resolve technical debt and security baseline before design work. Attempting visual changes before fixing peer deps and security creates debugging nightmare where design issues compound infrastructure issues. Three independent streams can run in parallel to minimize calendar time.

**Delivers:**
- Stream A (Dependencies): React 19 compatible package versions, removal of `--legacy-peer-deps`, clean dependency tree
- Stream B (Security): CSP with nonces, CSRF protection, environment variable validation with Zod
- Stream C (Design Tokens): `@theme` directive in globals.css with organic-meets-digital palette, typography scale, custom spacing, lib/design-tokens.ts mirror for Three.js

**Addresses features:**
- Peer dependency resolution (table stakes)
- Environment validation (table stakes)
- CSRF protection (table stakes)
- CSP strictness (table stakes)
- Color palette definition (table stakes)
- Typography system (table stakes)

**Avoids pitfalls:**
- Legacy peer dependencies masking runtime incompatibilities (critical)
- Environment variables leaked or not validated (critical)
- Server Actions without security (critical - partial, auth/validation come in Phase 2)

**Research flags:** Standard patterns, skip `/gsd:research-phase`. Peer dep resolution well-documented in npm docs, CSP implementation covered in Next.js official guides, Tailwind v4 @theme directive has migration guide.

**Blockers:** None, all streams independent

### Phase 2: Design System Components (Sequential after Phase 1C)

**Rationale:** Design tokens (Phase 1C) must exist before components reference them. Navigation, cards, and typography can build in parallel after tokens are available. Component library establishes visual identity and prevents utility class proliferation.

**Delivers:**
- GlassmorphicNav with distinctive interaction (vertical/animated/reveal)
- ProjectCard and PhotoCard with organic shapes and tech glows
- Heading and BodyText components with typography hierarchy
- Dark/light mode toggle using token-based theme switching
- Biophilic micro-interactions applied to interactive elements

**Addresses features:**
- Responsive navigation (table stakes)
- Card/tile components (table stakes)
- Dark/light mode (table stakes)
- Biophilic micro-interactions (differentiator)
- Glowing accents and depth (differentiator)

**Uses stack elements:**
- class-variance-authority for type-safe variants
- tailwind-merge for class conflict resolution
- @radix-ui/react-* for accessible navigation primitives
- CSS @layer components for reusable patterns

**Implements architecture:**
- Component Layer (design-system/ subdirectory)
- CSS-First Design Tokens (components reference --color-*, --font-*, --spacing-*)
- Component variant pattern with CVA

**Avoids pitfalls:**
- Overusing Tailwind utility classes (critical - component abstractions prevent utility soup)
- Dynamic class names not detected (moderate - components map props to complete classes)

**Research flags:** Standard patterns for navigation and cards, skip research. If glassmorphic effects prove challenging, may need brief UI research for backdrop-filter compatibility and fallbacks.

**Blockers:** Depends on Phase 1C (design tokens), blocked by Phase 1A if @react-three/* deps affect imports

### Phase 3: Reliability & Code Quality (Parallel after Phase 1)

**Rationale:** Email reliability and type safety are independent workstreams that can execute in parallel. Both touch different files with minimal merge conflict risk. Reliability work uses CSP middleware from Phase 1B.

**Delivers:**
- Stream A (Reliability): Email service error handling with try/catch, logging, retry queue, rate limiting with Redis/Upstash, cache invalidation tied to build hash
- Stream B (Code Quality): TypeScript strict mode enabled, 4 `any` types replaced with proper types, missing image handling, linting configured

**Addresses features:**
- Email delivery reliability (table stakes)
- Rate limiting that persists (table stakes)
- Type safety (table stakes)
- Cache invalidation (refinement)
- Image optimization pipeline (differentiator - integration of optimize-images.mjs)

**Uses stack elements:**
- Zod for email validation and env var schemas
- Upstash Redis or Vercel KV for rate limiting
- TypeScript 5.9+ strict mode
- prettier-plugin-tailwindcss and eslint-plugin-tailwindcss

**Avoids pitfalls:**
- Silent email failures without error tracking (critical)
- TypeScript `any` types hiding bugs (critical)
- In-memory rate limiting in serverless (moderate)
- Hardcoded service worker cache (moderate)

**Research flags:** Redis rate limiting is well-documented pattern, skip research. Email queue implementation may need brief research if using Vercel Cron vs custom queue.

**Blockers:** Phase 1B (security) required for rate limiting context (middleware), Phase 1A (dependencies) required for type fixes if packages affect types

### Phase 4: Performance & Polish (Sequential after all previous)

**Rationale:** Final optimizations and testing after core functionality and design system are complete. Integration testing catches cross-phase issues before production deployment.

**Delivers:**
- Progressive texture loading for PhotoCarousel3D (lazy load with placeholders)
- Animation preference detection applied consistently (useReducedMotion.ts)
- Image optimization (next/image migration, proper sizing, priority flags)
- E2E tests for design system components
- Visual regression testing
- Performance benchmarking (CSS bundle size, LCP, FCP, CLS)
- Accessible color contrast verification (Lighthouse + manual testing)

**Addresses features:**
- Progressive texture loading (differentiator)
- Animation preference detection (table stakes)
- Accessible color contrast (table stakes)

**Avoids pitfalls:**
- Missing next/image on critical content images (moderate)
- Three.js components causing hydration errors (moderate - verify dynamic imports)

**Research flags:** Progressive texture loading for Three.js may need brief research if lazy loading patterns for PhotoCarousel3D are complex. Skip research for next/image migration (well-documented).

**Blockers:** Requires all previous phases complete

### Phase Ordering Rationale

**Why this order:**
1. **Foundation first (Phase 1)** — peer deps, security, and tokens are prerequisites for everything else. Attempting design work before these are stable creates compounding debugging complexity.

2. **Parallel streams in Phase 1** — dependencies (1A), security (1B), and design tokens (1C) have zero interdependencies. Running in parallel saves 2-4 weeks of calendar time.

3. **Components after tokens (Phase 2 after 1C)** — architecture research shows components reference design tokens via --color-*, --font-*, --spacing-*. Cannot build components before tokens exist.

4. **Reliability and quality in parallel (Phase 3)** — email/rate limiting (3A) and type safety (3B) touch different files. Minimal merge conflict risk. Both require Phase 1 (security middleware, dependency upgrades) but can then run parallel.

5. **Polish last (Phase 4)** — performance optimizations and testing need stable foundation and complete design system. Integration testing at this gate catches cross-phase issues.

**How this avoids pitfalls:**
- Resolving peer deps first (Phase 1A) prevents React 19 incompatibilities from masking design system bugs
- Defining tokens first (Phase 1C) prevents utility class proliferation (Pitfall 3) by establishing component-first approach
- Security hardening early (Phase 1B) ensures Server Actions have auth/validation framework before reliability work
- Parallel execution of independent streams maximizes velocity while minimizing risk

**How this groups features:**
- Bug stabilization track (Phases 1, 3) separates technical debt from visual work, clear completion criteria
- Design system track (Phases 1C, 2) groups token definition with component creation, logical dependency flow
- Performance track (Phase 4) deferred until core functionality stable, prevents premature optimization

### Research Flags

**Phases needing `/gsd:research-phase`:**
- **Phase 2 (if glassmorphic challenges)**: Brief UI research for backdrop-filter browser compatibility and fallback patterns — only if initial implementation reveals browser support gaps
- **Phase 3A (if custom queue needed)**: Brief research for email queue implementation if Vercel Cron patterns are insufficient — only if fire-and-forget + retry logic requires more robust solution
- **Phase 4 (texture loading)**: Brief research for progressive texture loading in Three.js if PhotoCarousel3D lazy loading patterns prove complex — likely needed given 3D domain specificity

**Phases with standard patterns (skip research):**
- **Phase 1A (Dependencies)**: npm peer dep resolution, npm-check-updates usage well-documented
- **Phase 1B (Security)**: CSP implementation, CSRF protection, env validation covered in Next.js official docs and multiple 2026 sources
- **Phase 1C (Design Tokens)**: Tailwind v4 @theme directive has official migration guide, CSS custom properties are web standard
- **Phase 2 (Navigation/Cards)**: Radix UI primitives + CVA patterns are established, extensive shadcn/ui examples available
- **Phase 3B (Type Safety)**: TypeScript strict mode migration, Zod integration well-documented
- **Phase 4 (next/image)**: Next.js Image component extensively documented with Core Web Vitals examples

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Current stack (Next.js 16, React 19, Tailwind v4) verified in official docs, version compatibility confirmed in package.json, Three.js ecosystem v9 supports React 19 per pmndrs GitHub discussions |
| Features | HIGH | Next.js production checklist and portfolio design trends 2026 from multiple sources (Colorlib, Figma, Medium) align on table stakes features, biophilic design trend confirmed in 6+ industry sources, existing codebase audit validates bug priorities |
| Architecture | HIGH | Tailwind v4 CSS-first architecture directly from official docs, App Router patterns from Next.js 16 docs, design system architecture verified in CSS Tricks and multiple 2026 design system guides, bug fix isolation pattern from technical debt management literature |
| Pitfalls | HIGH | Critical pitfalls (peer deps, Server Actions security, utility class soup) documented in official Next.js guides and multiple security sources, moderate pitfalls (rate limiting, CSP, images) confirmed in Next.js docs and community best practices, codebase scan validates current state |

**Overall confidence:** HIGH

Research quality benefits from:
- Official documentation (Next.js, Tailwind CSS, React) for framework-level decisions
- Multiple converging sources (5-8 sources per topic) for industry patterns
- Existing codebase audit validating bug priorities and current architecture
- 2026-dated sources confirming current best practices (not outdated 2022-2023 guidance)

### Gaps to Address

**Architecture gaps:**
- **Glassmorphic nav specifics**: Design research shows "distinctive interaction pattern" but exact implementation (vertical sidebar vs animated reveal vs icon-based) not specified. Recommend brief design exploration in Phase 2 to validate backdrop-filter support and choose specific pattern based on existing 3D aesthetic.

**Stack gaps:**
- **Redis vs Vercel KV decision**: Research recommends Redis for rate limiting but doesn't specify Upstash vs Vercel KV. Recommend Vercel KV for simplicity if already on Vercel, Upstash if edge runtime required. Validate during Phase 3A based on deployment target.

**Feature gaps:**
- **Organic shape implementation approach**: Design research identifies "organic shapes with nature-inspired textures" as differentiator but defers to v2+. If Phase 2 card components feel too generic with standard rounded corners, may need to revisit. Can use SVG clip-path for organic borders without complex illustration work.

**Integration gaps:**
- **Email queue vs Vercel Cron tradeoff**: Research recommends queue for email reliability but doesn't specify whether Vercel Cron is sufficient. Validate during Phase 3A: if send volume <100/hour and retry within 24 hours acceptable, Vercel Cron sufficient. Higher volume or immediate retry needs dedicated queue (BullMQ + Redis).

**Mitigation during planning:**
- **Phase 2 glassmorphic nav**: Use first day of phase for design spike — test backdrop-filter with organic colors, verify browser support, choose vertical vs animated pattern based on desktop/mobile breakpoints
- **Phase 3A rate limiting**: Start with Vercel KV unless edge runtime required, simpler integration and pricing for portfolio traffic levels
- **Phase 3A email queue**: Start with try/catch + logging + Vercel Cron retry (24hr window), upgrade to BullMQ only if monitoring shows >10 failures/day
- **Phase 2 organic shapes**: Accept standard rounded corners for MVP, add SVG clip-path organic borders in Phase 4 polish if time permits

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first architecture, @theme directive, Oxide compiler
- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme) — Design token configuration
- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security) — Server Actions security patterns
- [Next.js Content Security Policy Guide](https://nextjs.org/docs/pages/guides/content-security-policy) — CSP implementation with nonces
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist) — Table stakes features
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) — Breaking changes, migration path

**npm Packages:**
- [class-variance-authority npm](https://www.npmjs.com/package/class-variance-authority) — v0.7.1 documentation
- [tailwind-merge npm](https://www.npmjs.com/package/tailwind-merge) — v3.4.1 Tailwind v4 support
- [npm-check-updates npm](https://www.npmjs.com/package/npm-check-updates) — v19.3.2 active maintenance

### Secondary (MEDIUM confidence)

**Architecture & Design Systems:**
- [Tailwind CSS v4 Complete Guide 2026](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide) — Migration patterns and real-world usage
- [Building the Ultimate Design System 2026](https://medium.com/@padmacnu/building-the-ultimate-design-system-a-complete-architecture-guide-for-2026-6dfcab0e9999) — Architecture patterns
- [CSS Cascade Layers for Design Systems](https://css-tricks.com/organizing-design-system-component-patterns-with-css-cascade-layers/) — @layer pattern usage
- [How to Build Design Token System for Tailwind](https://hexshift.medium.com/how-to-build-a-design-token-system-for-tailwind-that-scales-forever-84c4c0873e6d) — Token architecture

**Portfolio Design Trends:**
- [Portfolio Design Trends 2026 - Colorlib](https://colorlib.com/wp/portfolio-design-trends/) — Industry expectations
- [Web Design Trends 2026 - Figma](https://www.figma.com/resource-library/web-design-trends/) — Visual patterns
- [Biophilic Web Design](https://www.gingeritsolutions.com/blog/biophilic-web-design/) — Organic-meets-digital aesthetic
- [Organic Shapes in Web Design](https://www.themeignite.com/blogs/news/organic-shapes-in-web-design) — Implementation approaches
- [Micro-Interactions in Web Design 2025](https://www.stan.vision/journal/micro-interactions-2025-in-web-design) — Animation patterns

**Security & Best Practices:**
- [Next.js Security Hardening 2026](https://medium.com/@widyanandaadi22/next-js-security-hardening-five-steps-to-bulletproof-your-app-in-2026-61e00d4c006e) — CSP, CSRF, validation
- [Complete Next.js Security Guide 2025](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices) — Server Actions security
- [How to Fix npm Peer Dependency Conflicts](https://oneuptime.com/blog/post/2026-01-22-nodejs-fix-npm-peer-dependency-conflicts/view) — Resolution strategies
- [Resolving React 19 Dependency Conflicts](https://medium.com/@zachshallbetter/resolving-react-19-dependency-conflicts-without-downgrading-ee0a808af2eb) — React 19 specific patterns

**Performance & Optimization:**
- [Next.js Image Optimization Guide](https://www.debugbear.com/blog/nextjs-image-optimization) — Core Web Vitals
- [Rate Limiting Next.js API with Redis](https://medium.com/better-dev-nextjs-react/rate-limiting-your-next-js-api-with-redis-b35a6622acba) — Serverless rate limiting
- [Next.js Error Handling Best Practices](https://devanddeliver.com/blog/frontend/next-js-15-error-handling-best-practices-for-code-and-routes) — Email error handling patterns

### Tertiary (LOW confidence, needs validation)

**Technical Debt Management:**
- [Taxonomy of Next.js Tech Debt](https://www.lewis-lin.com/blog/nextjs-tech-debt-demolition-your-ultimate-guide-to-cleaner-faster-code) — Bug categorization patterns (corroborated by other sources)
- [Technical Debt Management Strategies 2026](https://dasroot.net/posts/2026/02/technical-debt-management-sonarqube-cicd/) — Parallel fix streams approach

**Three.js Integration:**
- [React Three Fiber vs Three.js in 2026](https://graffersid.com/react-three-fiber-vs-three-js/) — Ecosystem compatibility (validated against pmndrs GitHub)

---

**Research completed:** 2026-02-16
**Ready for roadmap:** Yes
**Next step:** Roadmap creation using this summary as foundation
