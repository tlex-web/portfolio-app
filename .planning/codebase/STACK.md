# Technology Stack

**Analysis Date:** 2026-02-16

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code (components, API routes, utilities)
- JavaScript (ES2020 target) - Build scripts and config files

**Secondary:**
- CSS (via Tailwind) - Styling through utility classes
- JSX/TSX - React component syntax

## Runtime

**Environment:**
- Node.js 20 (specified in `.node-version`)
- Next.js 16.1.6 App Router with Turbopack

**Package Manager:**
- npm (with `--legacy-peer-deps` flag required)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 - React framework with App Router, server components, API routes
- React 19.2.4 - UI library
- React DOM 19.2.4 - React renderer

**Styling:**
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- PostCSS 8.5.6 - CSS processing with Autoprefixer 10.4.24
- Framer Motion 12.34.0 - Animation library for React components

**3D & Graphics:**
- Three.js 0.182.0 - WebGL-based 3D library
- @react-three/fiber 9.5.0 - React renderer for Three.js
- @react-three/drei 10.7.7 - Useful helpers for react-three-fiber
- @react-spring/three 10.0.3 - Spring physics-based animations for 3D

**Validation:**
- Zod 4.3.6 - Runtime type validation and schema definition

**Content:**
- react-markdown 10.1.0 - Markdown rendering for project descriptions

**Email:**
- Resend 6.9.2 - Transactional email service SDK

**Testing:**
- Jest 30.2.0 - Test runner
- @testing-library/react 16.3.2 - React component testing utilities
- @testing-library/jest-dom 6.9.1 - Custom Jest matchers
- @testing-library/user-event 14.6.1 - User interaction simulation
- jest-environment-jsdom 30.2.0 - Browser-like test environment
- Playwright 1.58.2 - End-to-end testing framework

**Build/Dev:**
- TypeScript 5.9.3 - Type checking and compilation
- ESLint 9.39.2 - Code linting with TypeScript and React plugins
- Prettier 3.8.1 - Code formatting
- Sharp 0.34.5 - Image optimization (used in build scripts)
- cross-env 10.1.0 - Cross-platform environment variables

## Key Dependencies

**Critical:**
- `next` 16.1.6 - Core framework powering routing, SSR, API routes, image optimization
- `react` + `react-dom` 19.2.4 - UI rendering foundation
- `typescript` 5.9.3 - Type safety throughout codebase
- `three` 0.182.0 - 3D visualizations for portfolio showcase
- `zod` 4.3.6 - Input validation for contact form API

**Infrastructure:**
- `@vercel/analytics` 1.6.1 - Analytics tracking for Vercel deployments
- `@vercel/speed-insights` 1.3.1 - Performance monitoring for Vercel
- `resend` 6.9.2 - Email sending service for feedback form
- `sharp` 0.34.5 - Server-side image processing and optimization

**Developer Experience:**
- `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` 8.55.0 - TypeScript linting
- `eslint-config-next` 16.1.6 - Next.js-specific linting rules
- `eslint-config-prettier` 10.1.8 - Disable conflicting ESLint rules
- `prettier` 3.8.1 - Consistent code formatting

## Configuration

**Environment:**
- Environment variables configured via `.env` file (see `.env.example`)
- Required for production: `RESEND_API_KEY`, `FEEDBACK_RECIPIENT_EMAIL`, `FEEDBACK_FROM_EMAIL`
- Optional analytics variables: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`
- Development/test can use dummy values for email vars

**Build:**
- `next.config.ts` - Next.js configuration with image optimization, security headers, CSP
- `tsconfig.json` - TypeScript compiler options (strict mode, ES2020 target, path aliases)
- `tailwind.config.ts` - Tailwind CSS configuration (content paths, theme extensions)
- `postcss.config.js` - PostCSS with Tailwind and Autoprefixer plugins
- `eslint.config.mjs` - Flat config format with TypeScript and React rules
- `.prettierrc.json` - Code formatting rules (single quotes, 2-space tabs, 100 char width)
- `jest.config.js` - Unit test configuration with jsdom environment
- `playwright.config.ts` - E2E test configuration (Chromium, Firefox, Webkit)
- `vercel.json` - Vercel deployment settings (build commands, framework detection)

**TypeScript:**
- Strict mode enabled
- Path alias: `@/*` maps to project root
- Module resolution: bundler
- Target: ES2020
- JSX: react-jsx (automatic runtime)

**Linting:**
- ESLint flat config with TypeScript, React, and React Hooks plugins
- Prettier integration to avoid conflicts
- Warning for unused vars (ignore pattern `^_`)
- React Hooks rules enforced

**Formatting:**
- Single quotes, semicolons, trailing commas (ES5)
- 2-space indentation, 100 char line width
- Configured in `.prettierrc.json`

## Platform Requirements

**Development:**
- Node.js 20.x (specified in `.node-version`)
- npm with `--legacy-peer-deps` flag
- Modern browser with WebGL support for 3D components

**Production:**
- Vercel (primary deployment target, configured in `vercel.json`)
- Static file serving capability for optimized images
- Environment variables for email service (Resend API)
- CDN support for image optimization (Next.js Image component)

**Build Process:**
- `npm run build` - Production build with Next.js
- `npm run dev` - Development server on localhost:3000
- `npm run start` - Production server
- `npm run optimize-images` - Sharp-based image optimization script

**CI/CD:**
- GitHub Actions workflow at `.github/workflows/ci.yml`
- Jobs: lint-and-typecheck, unit-tests, e2e-tests, build, dependency-review, security-audit
- Runs on Node 20, Ubuntu latest
- Codecov integration for coverage reports
- Artifact uploads for test reports and builds

---

*Stack analysis: 2026-02-16*
