# Coding Conventions

**Analysis Date:** 2026-02-16

## Naming Patterns

**Files:**
- Components: PascalCase - `ProjectCard.tsx`, `FeedbackForm.tsx`, `Hero3DMountain.tsx`
- Pages: kebab-case with Next.js convention - `page.tsx`, `layout.tsx`, `not-found.tsx`
- Tests: Co-located with source - `__tests__/ComponentName.test.tsx` or `ComponentName.spec.ts`
- Utilities: camelCase - `useReducedMotion.ts`, `email.ts`
- Data: camelCase - `landscapes.ts`, `projects.ts`, `types.ts`

**Functions:**
- Component functions: PascalCase - `ProjectCard`, `Footer`, `HomePage`
- Utility functions: camelCase - `sendFeedbackEmail`, `checkRateLimit`, `generateEmailHTML`
- API handlers: Uppercase HTTP methods - `POST`, `GET`
- Hooks: camelCase with 'use' prefix - `useReducedMotion`

**Variables:**
- Constants: camelCase - `mockProject`, `feedbackSchema`, `socialLinks`
- React state: camelCase - `prefersReducedMotion`, `rateLimitMap`
- Type/Interface names: PascalCase - `Project`, `LandscapeImage`, `FeedbackEmailData`

**Types:**
- Interfaces: PascalCase - `ProjectCardProps`, `FeedbackEmailData`, `RoadmapItem`
- Type aliases: PascalCase - `Project`, `DemoCommand`
- Enums: String literals preferred over enums - `status: 'active' | 'beta' | 'complete' | 'archived'`

## Code Style

**Formatting:**
- Tool: Prettier 3.8.1
- Config: `.prettierrc.json`
- Semi-colons: Required (`"semi": true`)
- Quotes: Single quotes (`"singleQuote": true`)
- Trailing commas: ES5 standard (`"trailingComma": "es5"`)
- Indentation: 2 spaces (`"tabWidth": 2`)
- Line length: 100 characters (`"printWidth": 100`)

**Linting:**
- Tool: ESLint 9.39.2 with TypeScript plugin
- Config: `eslint.config.mjs` (flat config format)
- Key rules:
  - `@typescript-eslint/no-unused-vars: "warn"` with `argsIgnorePattern: "^_"`
  - `@typescript-eslint/no-explicit-any: "warn"`
  - `react-hooks/rules-of-hooks: "error"`
  - `react-hooks/exhaustive-deps: "warn"`
- Extends: `eslint-config-prettier` for compatibility

**TypeScript:**
- Strict mode enabled
- Target: ES2020
- JSX: react-jsx (new JSX transform)
- Paths configured: `@/*` maps to project root

## Import Organization

**Order:**
1. External dependencies (React, Next.js, third-party)
2. Internal path aliases (`@/components`, `@/lib`, `@/data`)
3. Relative imports
4. Type-only imports (when needed)

**Example:**
```typescript
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Project } from '@/data/types';
```

**Path Aliases:**
- `@/*` - Maps to project root
- Used consistently: `@/components/ProjectCard`, `@/lib/email`, `@/data/types`

## Error Handling

**Patterns:**
- Zod for validation: Use `schema.parse()` in API routes
- Try-catch blocks: Wrap async operations
- Error responses: Return structured JSON with appropriate HTTP status codes
- Logging: Use `console.error()` for errors, `console.log()` for info
- Graceful degradation: Allow operations to succeed even if non-critical parts fail

**Example from `app/api/feedback/route.ts`:**
```typescript
try {
  const data = feedbackSchema.parse(body);
  // ... operation
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.issues },
      { status: 400 }
    );
  }
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Internal server error. Please try again later.' },
    { status: 500 }
  );
}
```

## Logging

**Framework:** Native console methods

**Patterns:**
- `console.log()` for informational messages - `'Feedback received:'`
- `console.error()` for errors - `'Failed to send email notification:'`
- Include context objects: `console.log('Feedback received:', { name, email, ... })`
- Never log sensitive data directly to console in production

## Comments

**When to Comment:**
- Complex business logic requiring explanation
- Non-obvious implementation decisions
- JSDoc for public APIs and exported functions
- Inline comments for complex calculations or workarounds
- NOT for obvious code (avoid redundant comments)

**JSDoc/TSDoc:**
- Used for exported functions, especially in utility modules
- Include `@param`, `@returns`, and `@throws` tags

**Example from `lib/email.ts`:**
```typescript
/**
 * Sends a feedback email using Resend
 * @param data - Feedback form data
 * @returns Promise that resolves when email is sent
 * @throws Error if email sending fails
 */
export async function sendFeedbackEmail(data: FeedbackEmailData): Promise<void>
```

## Function Design

**Size:** Keep functions focused and single-purpose. Most functions are under 50 lines.

**Parameters:**
- Props interfaces for React components: `interface ProjectCardProps { project: Project; index?: number; }`
- Object parameters for complex data: `sendFeedbackEmail(data: FeedbackEmailData)`
- Optional parameters with defaults: `index = 0`

**Return Values:**
- Explicit return types for functions: `Promise<void>`, `NextResponse`, `boolean`
- React components return JSX
- API handlers return `NextResponse.json()`

## Module Design

**Exports:**
- Default exports for components: `export default function ProjectCard()`
- Default exports for Next.js pages: `export default function HomePage()`
- Named exports for utilities: `export async function sendFeedbackEmail()`
- Named exports for types: `export interface Project`

**Barrel Files:**
- Not used extensively
- Data types consolidated in `data/types.ts`
- Components imported directly: `import ProjectCard from '@/components/ProjectCard'`

## Client/Server Directives

**Pattern:**
- Use `'use client'` at top of files with browser APIs or React hooks
- Server components by default (Next.js 13+ App Router)
- All components with motion, state, or effects use `'use client'`

**Examples:**
- `components/ProjectCard.tsx` - `'use client'` (uses framer-motion)
- `lib/useReducedMotion.ts` - `'use client'` (uses hooks and window API)
- `app/api/feedback/route.ts` - No directive (server-side API route)

## TypeScript Conventions

**Type Safety:**
- Prefer interfaces for object shapes: `interface Project { ... }`
- Use type aliases for unions: `status: 'active' | 'beta' | 'complete' | 'archived'`
- Avoid `any` (linter warns)
- Optional properties with `?`: `thumbnail?: string`
- Mark unused parameters with underscore prefix: `_unused`

**Type Inference:**
- Let TypeScript infer simple types
- Explicit types for function parameters and return values
- Explicit types for exported APIs

---

*Convention analysis: 2026-02-16*
