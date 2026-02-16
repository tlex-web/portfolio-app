# Codebase Structure

**Analysis Date:** 2026-02-16

## Directory Layout

```
portfolio-app/
├── .github/                # GitHub workflows and CI/CD config
├── .planning/              # GSD codebase documentation
│   └── codebase/          # Architecture and analysis docs
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Backend API endpoints
│   ├── [page-routes]/     # Individual page directories
│   ├── layout.tsx         # Root layout wrapper
│   ├── page.tsx           # Homepage
│   ├── globals.css        # Global styles
│   ├── error.tsx          # Error boundary
│   └── not-found.tsx      # 404 page
├── components/             # React components (mostly client-side)
│   ├── __tests__/         # Component unit tests
│   └── [ComponentName].tsx
├── data/                   # Static data sources and types
├── e2e/                    # Playwright end-to-end tests
├── lib/                    # Utility functions and custom hooks
│   ├── __tests__/         # Library unit tests
│   └── [utility].ts
├── public/                 # Static assets
│   ├── images/            # Optimized images
│   └── service-worker.js  # PWA service worker
├── scripts/                # Build and maintenance scripts
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── jest.config.js          # Jest test configuration
├── playwright.config.ts    # Playwright e2e configuration
└── package.json            # Dependencies and scripts
```

## Directory Purposes

**app/ (Next.js App Router):**
- Purpose: Application routes, pages, and API endpoints
- Contains: Page components, layouts, route handlers, special files (error, not-found)
- Key files: `layout.tsx` (root layout), `page.tsx` (homepage), `globals.css` (Tailwind base)
- Sub-directories:
  - `api/feedback/`: Feedback form submission endpoint
  - `projects/`: Project listing and detail pages
  - `photos/`: Photography gallery page
  - `contact/`: Contact page with form
  - `roadmap/`: Project roadmap timeline
  - `gradient-mesh/`, `particle-buttons/`, `transitions/`: Demo/showcase pages
  - `offline/`: Offline fallback page

**components/:**
- Purpose: Reusable React components (mostly client-side)
- Contains: UI components with 'use client' directive, 3D visualizations, forms, layouts
- Key files:
  - `Hero3DMountain.tsx`: 3D mountain scene for homepage hero
  - `FeedbackForm.tsx`: Contact form with validation
  - `PhotoCarousel3D.tsx`: 3D rotating photo carousel
  - `ProjectCard.tsx`: Project preview card
  - `GlassmorphismNav.tsx`: Glassmorphic navigation bar
  - `ServiceWorkerRegistration.tsx`: PWA service worker setup
- Testing: `__tests__/` contains Jest unit tests for components

**data/:**
- Purpose: Static content and type definitions
- Contains: TypeScript modules exporting data arrays
- Key files:
  - `types.ts`: TypeScript interfaces (LandscapeImage, Project, RoadmapItem, etc.)
  - `projects.ts`: Array of project data with details
  - `landscapes.ts`: Array of photography data with metadata
  - `roadmap.ts`: Array of roadmap items

**lib/:**
- Purpose: Shared utilities and custom hooks
- Contains: Helper functions, service integrations
- Key files:
  - `email.ts`: Resend email integration for feedback
  - `useReducedMotion.ts`: Custom hook for accessibility
- Testing: `__tests__/` contains Jest unit tests

**e2e/:**
- Purpose: End-to-end browser tests with Playwright
- Contains: Test specifications for user flows
- Key files: `homepage.spec.ts`, `projects.spec.ts`, `photos.spec.ts`, `contact-form.spec.ts`

**public/:**
- Purpose: Static assets served directly by CDN
- Contains: Images, service worker, manifest
- Key subdirectories:
  - `images/optimized/`: WebP and JPEG images in multiple sizes (thumb, medium, large)
- Key files: `service-worker.js` (PWA caching logic)

**scripts/:**
- Purpose: Build-time and maintenance utilities
- Contains: Node.js scripts for automation
- Key files: `optimize-images.mjs` (image processing with Sharp)

**.github/:**
- Purpose: GitHub-specific configuration
- Contains: GitHub Actions workflows for CI/CD
- Key files: `workflows/*.yml` (automated testing, deployment)

**.planning/:**
- Purpose: GSD codebase documentation
- Contains: Architecture analysis, structure docs, conventions
- Key files: `codebase/ARCHITECTURE.md`, `codebase/STRUCTURE.md` (this file)

## Key File Locations

**Entry Points:**
- `app\layout.tsx`: Root layout, wraps all pages
- `app\page.tsx`: Homepage (/)
- `app\projects\page.tsx`: Projects listing (/projects)
- `app\projects\[slug]\page.tsx`: Project detail (/projects/[slug])
- `app\photos\page.tsx`: Photo gallery (/photos)
- `app\contact\page.tsx`: Contact form (/contact)
- `app\roadmap\page.tsx`: Roadmap timeline (/roadmap)

**Configuration:**
- `next.config.ts`: Next.js settings (image optimization, headers, CSP)
- `tailwind.config.ts`: Tailwind CSS customization
- `tsconfig.json`: TypeScript compiler options with path aliases (@/*)
- `jest.config.js`: Jest test runner configuration
- `playwright.config.ts`: Playwright e2e test settings
- `.prettierrc.json`: Code formatting rules
- `eslint.config.mjs`: ESLint linting rules
- `postcss.config.js`: PostCSS plugins (Tailwind)

**Core Logic:**
- `app\api\feedback\route.ts`: Feedback API endpoint (POST handler)
- `lib\email.ts`: Email sending via Resend
- `data\projects.ts`: Project data source
- `data\landscapes.ts`: Photography data source
- `data\types.ts`: Type definitions for all data models

**Testing:**
- `jest.config.js`: Jest configuration
- `jest.setup.js`: Jest test setup file
- `components\__tests__\*.test.tsx`: Component tests
- `lib\__tests__\*.test.tsx`: Utility tests
- `app\api\__tests__\*.test.ts`: API route tests
- `e2e\*.spec.ts`: End-to-end tests

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js App Router convention)
- Layouts: `layout.tsx` (Next.js App Router convention)
- Components: `PascalCase.tsx` (e.g., `Hero3DMountain.tsx`)
- Utilities: `camelCase.ts` (e.g., `useReducedMotion.ts`)
- Tests: `ComponentName.test.tsx` or `utility.test.ts`
- E2E Tests: `feature-name.spec.ts` (e.g., `contact-form.spec.ts`)
- Config: `kebab-case.config.ts` or `.rc.json` (e.g., `next.config.ts`, `.prettierrc.json`)

**Directories:**
- Pages: `kebab-case` for route directories (e.g., `gradient-mesh/`, `particle-buttons/`)
- Dynamic routes: `[param]` syntax (e.g., `[slug]/`)
- Components: No subdirectories, flat structure (except `__tests__/`)
- Private: `__tests__/` for test co-location

**Variables (TypeScript):**
- Components: PascalCase (e.g., `Hero3DMountain`, `FeedbackForm`)
- Functions/variables: camelCase (e.g., `sendFeedbackEmail`, `prefersReducedMotion`)
- Constants: UPPER_SNAKE_CASE or camelCase depending on context
- Types/Interfaces: PascalCase (e.g., `LandscapeImage`, `Project`)

## Where to Add New Code

**New Page/Route:**
- Primary code: `app\[page-name]\page.tsx`
- Layout (if needed): `app\[page-name]\layout.tsx`
- Tests: `e2e\[page-name].spec.ts`
- Example: To add `/about` page → create `app\about\page.tsx`

**New API Endpoint:**
- Implementation: `app\api\[endpoint-name]\route.ts`
- Tests: `app\api\__tests__\[endpoint-name].test.ts`
- Example: To add `/api/subscribe` → create `app\api\subscribe\route.ts`

**New Component:**
- Implementation: `components\ComponentName.tsx`
- Tests: `components\__tests__\ComponentName.test.tsx`
- Example: To add a new modal → create `components\Modal.tsx`

**New Data Source:**
- Implementation: `data\source-name.ts`
- Types: Add interfaces to `data\types.ts`
- Example: To add blog posts → create `data\posts.ts` and add `Post` interface to `types.ts`

**New Utility:**
- Shared helpers: `lib\utility-name.ts`
- Tests: `lib\__tests__\utility-name.test.tsx`
- Example: To add date formatting → create `lib\formatDate.ts`

**New Static Asset:**
- Images: `public\images\[category]\filename.ext`
- Other assets: `public\[asset-type]\filename.ext`
- Example: To add a logo → `public\images\logo.png`

## Special Directories

**node_modules/:**
- Purpose: Installed npm dependencies
- Generated: Yes (via npm install)
- Committed: No (.gitignored)

**.next/:**
- Purpose: Next.js build output and cache
- Generated: Yes (via next build/dev)
- Committed: No (.gitignored)

**.git/:**
- Purpose: Git version control metadata
- Generated: Yes (via git init)
- Committed: No (internal Git structure)

**public/images/optimized/:**
- Purpose: Pre-processed images at multiple sizes
- Generated: Yes (via `npm run optimize-images`)
- Committed: Yes (optimized assets for deployment)

**__tests__/:**
- Purpose: Co-located test files
- Generated: No (manually written)
- Committed: Yes
- Pattern: Appears in `components/`, `lib/`, `app/api/`

**coverage/:**
- Purpose: Jest coverage reports
- Generated: Yes (via `npm run test:coverage`)
- Committed: No (.gitignored)

**playwright-report/:**
- Purpose: Playwright test results
- Generated: Yes (via `npm run test:e2e`)
- Committed: No (.gitignored)

## Path Aliases

**Configured in tsconfig.json:**
- `@/*` maps to project root (`./`)
- Examples:
  - `import Hero from '@/components/Hero3DMountain'`
  - `import { projects } from '@/data/projects'`
  - `import { sendEmail } from '@/lib/email'`

**Benefits:**
- Avoids relative path hell (`../../../components`)
- Makes imports consistent across the codebase
- Easier refactoring and file moves

---

*Structure analysis: 2026-02-16*
