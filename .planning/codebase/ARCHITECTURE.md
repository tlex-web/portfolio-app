# Architecture

**Analysis Date:** 2026-02-16

## Pattern Overview

**Overall:** Next.js 14 App Router with React Server Components and Client Components separation

**Key Characteristics:**
- File-system based routing with the App Router pattern
- Server-first rendering with selective client-side interactivity
- Static data sources (TypeScript modules) for content
- Component-driven architecture with clear separation of concerns
- API Routes for backend functionality

## Layers

**Presentation Layer (Client Components):**
- Purpose: Interactive UI components with browser-specific features
- Location: `C:\Users\aster\projects-source\portfolio-app\components`
- Contains: React client components with 'use client' directive, 3D visualizations, animations, forms
- Depends on: Data layer, lib utilities, external libraries (Three.js, Framer Motion)
- Used by: Page components
- Examples: `components\Hero3DMountain.tsx`, `components\FeedbackForm.tsx`, `components\PhotoCarousel3D.tsx`

**Page Layer (Server/Hybrid):**
- Purpose: Route definitions and page-level composition
- Location: `C:\Users\aster\projects-source\portfolio-app\app`
- Contains: Page components (page.tsx), layouts, error boundaries, not-found pages
- Depends on: Components layer, data layer
- Used by: Next.js router
- Examples: `app\page.tsx`, `app\projects\page.tsx`, `app\projects\[slug]\page.tsx`

**API Layer:**
- Purpose: Backend endpoints for form submission and data processing
- Location: `C:\Users\aster\projects-source\portfolio-app\app\api`
- Contains: Route handlers with POST/GET methods
- Depends on: Lib utilities, external services (Resend for email)
- Used by: Client components (FeedbackForm)
- Examples: `app\api\feedback\route.ts`

**Data Layer:**
- Purpose: Static content and type definitions
- Location: `C:\Users\aster\projects-source\portfolio-app\data`
- Contains: TypeScript modules exporting data arrays, type definitions
- Depends on: Nothing (standalone)
- Used by: All layers
- Examples: `data\projects.ts`, `data\landscapes.ts`, `data\roadmap.ts`, `data\types.ts`

**Utility Layer:**
- Purpose: Shared functionality and custom hooks
- Location: `C:\Users\aster\projects-source\portfolio-app\lib`
- Contains: Custom hooks, service integrations, helper functions
- Depends on: External services
- Used by: Components and API routes
- Examples: `lib\email.ts`, `lib\useReducedMotion.ts`

**Static Assets:**
- Purpose: Images, service workers, public resources
- Location: `C:\Users\aster\projects-source\portfolio-app\public`
- Contains: Optimized images (WebP/JPEG), service worker script
- Depends on: Nothing
- Used by: All presentation layers

## Data Flow

**Page Rendering Flow:**

1. Next.js router matches URL to file-system route in `app\` directory
2. Server component (page.tsx) executes on server, imports data from `data\` modules
3. Server component composes layout with client components
4. HTML is streamed to browser with serialized props
5. Client components hydrate and become interactive
6. Framer Motion/Three.js initialize on client side

**State Management:**
- React hooks (useState, useEffect) for local component state
- URL parameters for navigation state (e.g., `[slug]` for project detail)
- No global state management library (Redux/Zustand) - intentionally simple
- Service Worker for offline state

**Form Submission Flow:**

1. User fills `components\FeedbackForm.tsx` (client component)
2. Form validates input using Zod schema
3. Client sends POST to `app\api\feedback\route.ts`
4. API route validates, rate limits, and processes
5. `lib\email.ts` sends notification via Resend API
6. Response returns to client, UI updates with success/error

**3D Visualization Flow:**

1. Page component imports landscape data from `data\landscapes.ts`
2. Client component receives data as props
3. React Three Fiber Canvas initializes WebGL context
4. Textures load from `public\images\optimized\`
5. Animation loop runs via useFrame hook
6. User interaction triggers state updates, re-renders

## Key Abstractions

**Route Handlers:**
- Purpose: Serverless API endpoints
- Examples: `app\api\feedback\route.ts`
- Pattern: Export async POST/GET functions with NextRequest/NextResponse

**Server Components:**
- Purpose: Data fetching and initial HTML generation
- Examples: `app\projects\[slug]\page.tsx` (async function, no 'use client')
- Pattern: Async functions that can directly import data, pass props to client components

**Client Components:**
- Purpose: Interactive features requiring browser APIs
- Examples: `components\Hero3DMountain.tsx`, `components\FeedbackForm.tsx`
- Pattern: 'use client' directive at top, use React hooks, event handlers

**Type Definitions:**
- Purpose: Ensure type safety across data and components
- Examples: `data\types.ts` (LandscapeImage, Project, RoadmapItem)
- Pattern: Exported interfaces matching data structure

**Custom Hooks:**
- Purpose: Reusable stateful logic
- Examples: `lib\useReducedMotion.ts`
- Pattern: Function starting with 'use', returns state/values

## Entry Points

**Root Layout:**
- Location: `app\layout.tsx`
- Triggers: Every page render
- Responsibilities: HTML structure, global styles, analytics setup, metadata

**Home Page:**
- Location: `app\page.tsx`
- Triggers: Accessing root URL (/)
- Responsibilities: Hero section, project/photo previews, CTA sections

**Dynamic Project Page:**
- Location: `app\projects\[slug]\page.tsx`
- Triggers: URL pattern /projects/[slug]
- Responsibilities: Fetch project by slug, render detail view, 404 if not found

**Feedback API:**
- Location: `app\api\feedback\route.ts`
- Triggers: POST request to /api/feedback
- Responsibilities: Validate, rate limit, send email, return status

**Service Worker:**
- Location: `public\service-worker.js`
- Triggers: Browser registration via `components\ServiceWorkerRegistration.tsx`
- Responsibilities: Offline caching, asset preloading

## Error Handling

**Strategy:** Layered error boundaries with graceful degradation

**Patterns:**
- API Route Level: Try-catch blocks with specific error types (ZodError, general Error), sanitized error messages returned to client
- Component Level: Error boundaries (`app\error.tsx`) catch rendering errors, provide fallback UI
- Form Level: Client-side validation before submission, server-side validation in API route
- 404 Handling: Custom not-found page (`app\not-found.tsx`) for missing routes
- Type Safety: Zod schemas validate runtime data, TypeScript catches compile-time errors

**Examples:**
- `app\api\feedback\route.ts`: Catches ZodError for validation, returns 400 with details
- `app\projects\[slug]\page.tsx`: Calls notFound() if project slug doesn't exist
- `app\error.tsx`: Displays user-friendly error with reset option

## Cross-Cutting Concerns

**Logging:** Console-based logging in API routes, analytics via Vercel Analytics

**Validation:** Zod schemas for API input validation (`app\api\feedback\route.ts`), TypeScript for compile-time type checking

**Authentication:** Not implemented - public portfolio site

**Performance Optimization:**
- Image optimization: Next.js Image component with WebP/AVIF formats
- Code splitting: Automatic via Next.js App Router
- Lazy loading: Suspense boundaries for heavy components (3D scenes)
- Caching: Service worker caches static assets, CDN caching headers in `next.config.ts`
- Reduced motion: `lib\useReducedMotion.ts` respects user preferences

**Accessibility:**
- Semantic HTML in all components
- Alt text for images (stored in `data\landscapes.ts`)
- Keyboard navigation support
- ARIA labels where needed

**Analytics:**
- Vercel Analytics for page views (`@vercel/analytics/react`)
- Speed Insights for performance metrics (`@vercel/speed-insights/next`)

---

*Architecture analysis: 2026-02-16*
