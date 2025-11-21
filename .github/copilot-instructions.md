# Portfolio App - AI Agent Instructions

## Architecture Overview

This is a **Next.js 16 App Router** portfolio showcasing landscape photography and programming projects with heavy 3D/WebGL features. The architecture splits between:
- **Static content**: Photography gallery, project showcase, roadmap (pages in `app/`)
- **Interactive 3D components**: Three.js-based visualizations (in `components/`)
- **Client-heavy design**: Most components use `'use client'` due to WebGL/animation dependencies

### Key Design Decisions
- **All interactive components are client components** (`'use client'`) - this includes anything using Three.js, Framer Motion, or browser APIs like `matchMedia`
- **Centralized data model**: All content lives in `data/` (landscapes, projects, roadmap) with TypeScript interfaces in `data/types.ts`
- **Component isolation**: Each 3D feature (mountain terrain, particle systems, carousels) is a separate component for reusability
- **Path aliases**: Use `@/` for all imports (configured in `tsconfig.json`)

## Development Workflow

### Running Locally
```bash
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm test             # Run Jest unit/integration tests (61 tests)
npm run test:watch   # Watch mode for TDD
npm run test:e2e     # Run Playwright end-to-end tests
npm run test:e2e:ui  # Run e2e tests with UI mode
npm run lint         # ESLint check
npm run build        # Production build
```

### Testing Strategy
**Unit/Integration Tests (Jest + Testing Library)**
- Tests live in `components/__tests__/`, `app/api/__tests__/`, `lib/__tests__/`
- Pattern: `ComponentName.test.tsx` or `route.test.ts`
- Mock `fetch` globally for API tests (see `app/api/__tests__/feedback.test.ts`)
- Mock Next.js Image component and Three.js canvas for rendering tests
- API tests use `/** @jest-environment node */` directive
- Coverage focuses on form validation, user interactions, API error handling, and rate limiting

**End-to-End Tests (Playwright)**
- Tests live in `e2e/` directory with `*.spec.ts` pattern
- Test critical user flows: navigation, gallery interactions, form submissions, project browsing
- Run locally with `npm run test:e2e` (auto-starts dev server)
- CI runs e2e tests on Chromium, Firefox, and WebKit

**When to Run Tests**
- After editing forms, API routes, or validation logic
- Before committing: `npm run type-check && npm test`
- Run e2e tests before major releases or after UI changes

### Key Commands
- **Type checking**: `npm run type-check` (tsc --noEmit) - run before committing
- **Linting**: `npm run lint` (ESLint 8 with .eslintrc.json) - checks code quality
- **Format code**: `npm run format` (Prettier)
- **Run all tests**: `npm test && npm run test:e2e`
- **Test coverage**: `npm run test:coverage`

**Note on ESLint**: This project uses ESLint 8 with `.eslintrc.json` configuration. ESLint 9's flat config format caused compatibility issues with Next.js plugins, so we stay on ESLint 8 for now.

**Note on TypeScript**: Test files (*.test.ts, *.test.tsx) may show TypeScript errors about missing Jest types when running `tsc --noEmit` or in your editor. This is expected and does not affect the build - Next.js excludes test files during compilation. Tests run correctly with Jest.

## Component Patterns

### Client Component Structure
Every component with WebGL, animations, or browser APIs starts with `'use client'`:
```tsx
'use client';

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
// ... Three.js components
```

### Accessibility Pattern
The codebase prioritizes accessibility:
- Use `useReducedMotion()` hook (in `lib/useReducedMotion.ts`) for animation-heavy components
- Check `prefersReducedMotion` and disable/reduce animations accordingly
- Example: `Hero3DMountain.tsx` lines 14-24 show scroll animation respecting motion preferences

### Data Flow
1. Content defined in `data/*.ts` files (landscapes, projects, roadmap)
2. TypeScript interfaces in `data/types.ts` enforce structure
3. Pages import data directly: `import { projects } from '@/data/projects'`
4. No CMS, no database - all content is compile-time static

## Styling Conventions

- **Tailwind CSS 4.1** with dark mode support (`dark:` prefix)
- **Color scheme**: Cyan/blue accents (`cyan-500`, `blue-500`) for interactive elements
- **Glassmorphism**: Used for navigation (`GlassmorphismNav.tsx`) with backdrop blur + transparency
- **Responsive**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- **Animations**: Framer Motion for UI transitions, react-spring for physics-based 3D animations

## API Routes & Validation

### Form Validation Pattern
All forms use **Zod** for both client and server validation:
```typescript
const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});
```

### Rate Limiting
- API route at `app/api/feedback/route.ts` implements in-memory rate limiting
- 5 requests per hour per IP (for production, migrate to Redis or Vercel KV)
- Check IP from `x-forwarded-for` or `x-real-ip` headers

### Email Integration
When adding email service (e.g., Resend, SendGrid):
1. Install package: `npm install resend` or `npm install @sendgrid/mail`
2. Add environment variable to Vercel dashboard (not `.env.local`)
3. Update `app/api/feedback/route.ts` to call email service after validation
4. Keep console.log for debugging in development mode
5. Example pattern in route.ts comments shows integration point (line 58-63)

## 3D/WebGL Integration

### Three.js Stack
- **react-three-fiber**: React renderer for Three.js (import from `@react-three/fiber`)
- **@react-three/drei**: Helper components (`OrbitControls`, `PerspectiveCamera`, etc.)
- **@react-spring/three**: Spring animations for 3D objects

### Performance Considerations
- 3D components lazy-load when possible
- Use `<Canvas>` with `frameloop="demand"` for static scenes
- Mountain terrain uses noise-based geometry generation (see `MountainTerrain3D.tsx`)
- Particle systems capped at 50-100 particles for mobile performance

## Content Management

### Adding New Projects
1. Edit `data/projects.ts` and add a new `Project` object
2. Required fields: `slug`, `name`, `tagline`, `shortDescription`, `techStack`, `status`
3. Project detail pages auto-generate at `/projects/[slug]`
4. Add `featured: true` to pin to homepage

### Adding New Photos
1. Place image in `public/images/landscapes/`
2. Add `LandscapeImage` object to `data/landscapes.ts`
3. Include `technicalDetails` (camera, lens, ISO) and `story` for engagement
4. Optional: Add `annotations` array for interactive hotspots

## Testing New Features

When adding components:
1. Create unit test in `components/__tests__/ComponentName.test.tsx`
2. Mock external dependencies (fetch, Three.js canvas, Next.js Image)
3. Test user interactions with `@testing-library/user-event`
4. Verify accessibility (ARIA roles, keyboard nav)
5. For client components, mock browser APIs like `matchMedia`
6. Run `npm run test:coverage` and aim for >80% coverage

When adding pages or critical flows:
1. Create e2e test in `e2e/feature-name.spec.ts`
2. Test full user journeys (navigation → interaction → outcome)
3. Verify visual elements with `expect().toBeVisible()`
4. Test form submissions end-to-end
5. Run `npm run test:e2e:headed` to debug visually

## Continuous Integration

**GitHub Actions Workflows**
- `.github/workflows/ci.yml`: Runs lint, type-check, unit tests, e2e tests, and build
- Separate jobs for: linting, unit tests, e2e tests, build, security audit, dependency review
- E2e tests run on Chrome, Firefox, and Safari (WebKit)
- Build artifacts uploaded for 7 days
- Playwright reports uploaded on test failure

**Dependabot Configuration**
- `.github/dependabot.yml`: Weekly dependency updates on Mondays
- Groups minor/patch updates together
- Ignores major version updates for Next.js, React (requires manual review)
- Auto-labels PRs with `dependencies`, `automated`

**Running CI Locally**
```bash
npm run lint && npm run type-check && npm test && npm run build
npm run test:e2e  # Separate command for e2e
```

## Deployment (Vercel)

### Pre-deployment Checklist
1. Run `npm run build` locally to verify production build
2. Check `npm run type-check` passes with no errors
3. Verify all tests pass with `npm test`
4. Ensure `next.config.ts` is properly configured

### Vercel Configuration
- **Framework preset**: Next.js (auto-detected)
- **Build command**: `npm run build` (default)
- **Output directory**: `.next` (default)
- **Install command**: `npm install` (default)
- **Node version**: 18.x or higher

### Environment Variables
Set in Vercel dashboard (not in repo):
- Email service API keys (when integrated)
- Any third-party API tokens

### Performance Notes
- Three.js/WebGL works on Vercel Edge with client-side rendering
- Static images in `public/images/` are automatically optimized by Next.js Image component
- Rate limiting uses in-memory storage (fine for single instance, upgrade to Vercel KV for multi-region)

## Common Gotchas

- **Canvas SSR**: Three.js components will error if rendered server-side - always use `'use client'`
- **Framer Motion + Next.js**: Some motion components need `'use client'` even if they seem static
- **Image optimization**: Use Next.js `<Image>` component with `width`/`height` for all images
- **TypeScript strict mode**: Enabled - all props must be typed, no implicit any
- **Path imports**: Always use `@/` prefix (e.g., `@/components/Hero3DMountain`) not relative paths
- **Vercel deployments**: Preview deployments work identically to production, test there first
