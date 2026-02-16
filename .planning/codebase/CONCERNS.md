# Codebase Concerns

**Analysis Date:** 2026-02-16

## Tech Debt

**Legacy Peer Dependencies Workaround:**
- Issue: Using `legacy-peer-deps=true` in `.npmrc` to bypass peer dependency conflicts
- Files: `.npmrc`, `.github/workflows/ci.yml`, `vercel.json`
- Impact: All dependencies showing as "UNMET" in npm ls output. This masks real dependency conflicts and prevents proper version validation. Makes upgrades risky as incompatibilities are hidden.
- Fix approach: Audit peer dependency conflicts systematically. Update incompatible packages (@react-spring/three, @react-three/fiber, @testing-library/react) to versions compatible with React 19.2.4. Remove legacy flag once conflicts resolved.

**In-Memory Rate Limiting:**
- Issue: Rate limiting in `/api/feedback` uses simple Map-based in-memory storage
- Files: `app/api/feedback/route.ts` (lines 14-32)
- Impact: Rate limits reset on every deployment or server restart. Won't work across multiple serverless instances. Trivial to bypass with IP rotation.
- Fix approach: Implement Redis-backed rate limiting (Upstash or Vercel KV). Add fingerprinting beyond IP (headers, user agents). Consider implementing sliding window algorithm.

**Service Worker Cache Versioning:**
- Issue: Cache version hardcoded as 'v1', no automated invalidation strategy
- Files: `public/service-worker.js` (lines 5-8)
- Impact: Users may see stale content after deployments. Manual cache version bumps required. No way to force cache invalidation for critical updates.
- Fix approach: Generate cache version from build hash/timestamp. Implement cache-busting strategy tied to deployment. Add version API endpoint for runtime checks.

**Email Sending Failure Silently Ignored:**
- Issue: Feedback form returns success even if email sending fails
- Files: `app/api/feedback/route.ts` (lines 62-76)
- Impact: Users think their message was sent, but it may be lost. No retry mechanism. No alerting for failed emails.
- Fix approach: Implement proper job queue (Vercel Cron, BullMQ, or similar). Store submissions in database before attempting email. Add monitoring/alerting for email failures. Consider showing different success message when email fails but submission is stored.

**Large 3D Component Files:**
- Issue: Several 3D components exceed 300 lines with embedded shaders
- Files: `components/HologramTerminal.tsx` (487 lines), `components/ShaderTransition.tsx` (323 lines), `components/PhotoCarousel3D.tsx` (322 lines)
- Impact: Hard to maintain, test, and debug. Shader code mixed with component logic. Difficult to reuse shaders across components.
- Fix approach: Extract shader definitions to `lib/shaders/` directory. Split large components into smaller sub-components. Create hooks for common 3D logic (useAnimation, useTextures).

**Type Safety Issues:**
- Issue: Multiple uses of `any` type bypassing TypeScript safety
- Files: `components/ParticleButton.tsx` (line 201), `components/MountainTerrain3D.tsx` (line 11), `components/ProjectHighlights.tsx` (line 11), `app/api/__tests__/feedback.test.ts` (line 34)
- Impact: Defeats purpose of TypeScript. Potential runtime errors. Hard to refactor safely.
- Fix approach: Replace `any` with proper types. For dynamic props, use `Record<string, unknown>` or define proper interfaces. For test mocks, use typed mock factories.

## Known Bugs

**Missing Images Directory:**
- Symptoms: Images referenced in `data/landscapes.ts` point to `/images/optimized/` but no images found in `public/images/landscapes/`
- Files: `data/landscapes.ts` (lines 6-8), `public/images/` directory
- Trigger: Running the app will fail to load landscape images
- Workaround: Run `npm run optimize-images` script to generate optimized images. Script exists at `scripts/optimize-images.mjs` but images not committed.

**Deprecated Package Warnings:**
- Symptoms: Two deprecated dependencies in package-lock.json
- Files: `package-lock.json` (line 7552: deprecated memory-leak module, line 12555: glob versions prior to v9)
- Trigger: npm install shows deprecation warnings
- Workaround: These are transitive dependencies from react-markdown or other packages. No direct action needed, but monitor for upstream fixes.

## Security Considerations

**CSP Allows Unsafe Inline/Eval:**
- Risk: Content Security Policy permits 'unsafe-inline' and 'unsafe-eval' for scripts and styles
- Files: `next.config.ts` (lines 47-48)
- Current mitigation: Only applied in production. Required by Next.js and Tailwind.
- Recommendations: Implement nonce-based CSP for scripts. Consider moving to CSS-in-JS solution that works with strict CSP. Evaluate if unsafe-eval can be removed with Next.js latest optimizations.

**Environment Variables Not Validated at Startup:**
- Risk: App starts successfully without required RESEND_API_KEY, fails only when feedback form used
- Files: `lib/email.ts` (lines 6-14)
- Current mitigation: Lazy initialization prevents build/test failures. Error thrown when API called.
- Recommendations: Add environment validation at build time. Create `lib/env.ts` using zod to validate required vars. Fail fast if production build missing critical config. Consider runtime checks for optional features.

**IP Address Logging:**
- Risk: Storing IP addresses in console logs and potentially emails
- Files: `app/api/feedback/route.ts` (lines 37, 52-59), `lib/email.ts` (lines 137-138)
- Current mitigation: Logs not persisted long-term on Vercel. IPs help with rate limiting.
- Recommendations: Consider GDPR implications if deployed in EU. Hash IPs before logging. Add privacy policy disclosure. Implement data retention policy. Consider IP anonymization (remove last octet).

**No CSRF Protection:**
- Risk: Feedback form API has no CSRF token validation
- Files: `app/api/feedback/route.ts`
- Current mitigation: Next.js SameSite cookie defaults provide some protection. Rate limiting limits abuse.
- Recommendations: Implement CSRF tokens for state-changing endpoints. Consider using Next.js built-in CSRF protection or middleware like `csrf-csrf`. Add Origin/Referer header validation.

## Performance Bottlenecks

**All Images Preloaded in 3D Carousel:**
- Problem: PhotoCarousel3D loads all landscape images at mount time, even if not visible
- Files: `components/PhotoCarousel3D.tsx` (line 124: `useTexture(images.map(...)`)
- Cause: useTexture hook loads all textures immediately to prevent flickering
- Improvement path: Implement progressive texture loading. Load visible images + 1 adjacent. Lazy load remaining. Use lower-resolution placeholders. Consider implementing virtual carousel (render only visible subset).

**Large Image Assets:**
- Problem: 80MB of images in public directory
- Files: `public/images/` directory
- Cause: Original high-resolution photos not optimized
- Improvement path: Images already reference `/images/optimized/` paths with WebP format and multiple sizes, but optimized images not committed. Run optimization script and commit results. Consider CDN with on-demand image optimization (Cloudinary, Vercel Image Optimization). Implement responsive images with srcSet.

**Multiple Heavy 3D Scenes:**
- Problem: Multiple pages render complex Three.js scenes simultaneously
- Files: `app/page.tsx`, `app/gradient-mesh/page.tsx`, `app/particle-buttons/page.tsx`
- Cause: No scene disposal or resource cleanup documented
- Improvement path: Implement proper Three.js resource disposal in useEffect cleanup. Use React.lazy for 3D components. Consider intersection observer to pause animations when off-screen. Add reduced motion preferences check (already exists at `lib/useReducedMotion.ts` but not used consistently).

**Client-Side State Management:**
- Problem: Heavy use of useState/useEffect (121 occurrences) without optimization
- Files: 29 components use hooks extensively
- Cause: Many 3D components re-render frequently, some without memoization
- Improvement path: Audit components for unnecessary re-renders. Increase use of useMemo/useCallback (only 24 occurrences vs 121 useState). Consider React.memo for expensive 3D components. Profile with React DevTools to identify performance bottlenecks.

## Fragile Areas

**Three.js Component Integration:**
- Files: All components in `components/` using @react-three/fiber (15+ components)
- Why fragile: Complex interaction between React lifecycle and Three.js rendering. Texture loading timing issues. Memory leaks possible if resources not disposed. Version upgrades break rendering APIs.
- Safe modification: Always test with different image counts and sizes. Check Chrome DevTools Performance/Memory tabs for leaks. Use prefersReducedMotion checks. Implement proper cleanup in useEffect returns. Test on mobile devices.
- Test coverage: Only 5 component tests exist, no tests for 3D components

**Service Worker Registration:**
- Files: `components/ServiceWorkerRegistration.tsx`, `public/service-worker.js`
- Why fragile: Service workers cache aggressively and can break site if misconfigured. Hard to debug in production. Browser compatibility issues. Can prevent deployments from reaching users.
- Safe modification: Always test in incognito mode after changes. Implement kill switch (ability to unregister from server). Version cache names properly. Test update flow explicitly. Add service worker skip waiting strategy carefully.
- Test coverage: No tests for service worker functionality

**Feedback Form Flow:**
- Files: `components/FeedbackForm.tsx`, `app/api/feedback/route.ts`, `lib/email.ts`
- Why fragile: Chain of dependencies (Form → API → Email service). Multiple failure modes (validation, network, rate limit, email). No transaction safety.
- Safe modification: Maintain test coverage for all failure modes. Test rate limiting edge cases. Mock email service in tests. Validate both client and server side.
- Test coverage: Partial - `app/api/__tests__/feedback.test.ts` (307 lines) and `components/__tests__/FeedbackForm.test.tsx` exist

**Shader Transitions:**
- Files: `components/ShaderTransition.tsx` (323 lines with 5 shader definitions)
- Why fragile: GLSL shader code has no type safety. Typos cause runtime failures. Different GPU/driver behavior. Mobile GPU limitations.
- Safe modification: Test on multiple devices (desktop, mobile, different GPUs). Check browser console for WebGL errors. Provide fallback for shader compilation failures. Use shader validation tools.
- Test coverage: None for shader components

## Scaling Limits

**80MB Image Directory:**
- Current capacity: ~80MB of images in public directory, referenced but not optimized versions committed
- Limit: Git repository size grows with each image addition. Vercel has deployment size limits (~250MB total, ~50MB per function). Browser caching limited by disk space.
- Scaling path: Move images to external CDN (Cloudinary, Vercel Blob Storage). Implement on-demand image optimization. Use next/image for automatic optimization. Consider separate image repository with Git LFS.

**In-Memory Rate Limiting Map:**
- Current capacity: No limit on Map size, but resets on deployment
- Limit: Single serverless function memory (1GB default). Map grows unbounded. No cleanup of old entries.
- Scaling path: Implement Redis-backed rate limiting. Add automatic cleanup of expired entries. Use Vercel KV for serverless-friendly storage. Implement sliding window with automatic expiration.

**Client-Side 3D Rendering:**
- Current capacity: Works on desktop, may struggle on mobile with many images
- Limit: Mobile GPU memory limited. Texture size impacts VRAM. No fallback for low-end devices.
- Scaling path: Implement device capability detection. Reduce quality/quantity on mobile. Provide 2D fallback mode. Lazy load textures. Reduce polygon counts for mobile. Add quality presets (low/medium/high).

## Dependencies at Risk

**React 19.2.4 Peer Dependency Issues:**
- Risk: Multiple packages have unmet peer dependencies with React 19
- Impact: `@testing-library/react`, `@react-three/fiber`, `@react-spring/three` all expect older React versions
- Migration plan: Monitor package updates for React 19 compatibility. Consider downgrading to React 18 if issues arise. Test all 3D functionality after any React version changes. Some packages may require major version upgrades.

**Three.js 0.182.0:**
- Risk: Three.js has breaking changes between versions, currently on 0.182.0
- Impact: Shader APIs, geometry definitions, and material properties change frequently. @react-three/fiber may require specific Three.js versions.
- Migration plan: Pin Three.js version. Test thoroughly before upgrading. Check @react-three/fiber compatibility matrix. Review migration guides for shader changes.

## Missing Critical Features

**No Database/Persistent Storage:**
- Problem: Feedback submissions not persisted anywhere
- Blocks: Cannot review submissions history, implement retry logic, or analyze trends
- Fix approach: Add database (Vercel Postgres, Supabase). Create submissions table. Store all feedback attempts. Implement admin dashboard to view submissions.

**No Error Monitoring:**
- Problem: No Sentry, LogRocket, or error tracking configured
- Blocks: Cannot identify production errors, debug user-reported issues, or track error rates
- Fix approach: Add Sentry or similar. Integrate with Next.js error boundaries. Track API failures. Set up alerts for critical errors.

**No Analytics:**
- Problem: Despite Vercel Analytics imports, no usage tracking configured
- Blocks: Cannot understand user behavior, identify popular features, or measure engagement
- Fix approach: Vercel Analytics already imported (`@vercel/analytics`). Just needs NEXT_PUBLIC environment variables set. Add custom events for 3D interactions.

**No Image Optimization Pipeline:**
- Problem: Optimization script exists but not integrated into build/deployment
- Blocks: Large image files impact performance. Manual optimization required.
- Fix approach: Integrate `scripts/optimize-images.mjs` into pre-build step. Automate image processing. Add CI check for unoptimized images. Document image contribution workflow.

## Test Coverage Gaps

**3D Components Untested:**
- What's not tested: All Three.js/react-three-fiber components
- Files: `components/HologramTerminal.tsx`, `components/PhotoCarousel3D.tsx`, `components/ShaderTransition.tsx`, `components/AnimatedGradientMesh.tsx`, `components/MountainTerrain3D.tsx`, `components/ParticleButton.tsx`, and 10+ more 3D components
- Risk: Shader changes, texture loading, animation logic could break silently. Memory leaks undetected. Mobile rendering issues not caught.
- Priority: High - these are core features of the portfolio

**API Integration Tests Missing:**
- What's not tested: Full integration tests for feedback flow
- Files: Unit tests exist for `app/api/feedback/route.ts` but no integration tests with actual email sending
- Risk: Email service integration could fail in production. Rate limiting edge cases not covered. Error handling paths not verified.
- Priority: Medium - critical user-facing feature

**Service Worker Not Tested:**
- What's not tested: Offline functionality, cache strategies, update flow
- Files: `public/service-worker.js`, `components/ServiceWorkerRegistration.tsx`
- Risk: Offline mode could be completely broken. Cache invalidation issues. Service worker update failures.
- Priority: Medium - impacts offline experience and deployment updates

**E2E Tests Limited:**
- What's not tested: Only 3 E2E test files exist (photos, homepage, projects)
- Files: `e2e/photos.spec.ts`, `e2e/homepage.spec.ts`, `e2e/projects.spec.ts`
- Risk: Contact form flow untested. 3D interactions untested. Cross-page navigation edge cases. Mobile-specific issues.
- Priority: Medium - 10 test files found but limited coverage

**Performance Tests Missing:**
- What's not tested: No performance benchmarks or regression tests
- Files: None exist
- Risk: Performance degradation undetected. Memory leaks in 3D scenes. Image loading performance not measured.
- Priority: Low - would be nice to have but not critical

---

*Concerns audit: 2026-02-16*
