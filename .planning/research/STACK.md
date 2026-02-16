# Technology Stack Research

**Project:** Portfolio App Stabilization & Custom Design System
**Domain:** Next.js 16 + React 19 + Tailwind CSS 4 Portfolio with 3D Visualizations
**Researched:** 2026-02-16
**Confidence:** HIGH

## Recommended Stack

### Core Framework (Already In Use)

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Next.js | 16.1.6+ | App Router framework | Already deployed. Next.js 16 is stable with React 19 support. Maintain current version. | HIGH |
| React | 19.2.4+ | UI library | React 19 stable as of early 2025. Version 19.2.4 includes Activity feature and reconciler improvements. | HIGH |
| Tailwind CSS | 4.1.18+ | Utility-first CSS framework | Tailwind v4 is a ground-up rewrite with CSS-first config, Rust-based Oxide compiler (5x faster builds), and native CSS variables for design tokens. | HIGH |
| TypeScript | 5.9+ | Type safety | Industry standard. Enable strict mode for maximum type safety (catches 40% more runtime errors). | HIGH |

### Custom Design System Layer

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| class-variance-authority | 0.7.1 | Component variant management | Standard for type-safe component variants. Pairs with Tailwind to define base/variant/compound styles. Used by shadcn/ui. | HIGH |
| tailwind-merge | 3.4.1+ | Class conflict resolution | Essential for custom components. Intelligently merges Tailwind classes, preventing style conflicts. Version 3.4.1 supports Tailwind v4.0-4.1. | HIGH |
| clsx | 2.1+ | Conditional className utility | Lightweight, fast conditional class concatenation. Pairs with tailwind-merge in `cn()` utility pattern. | HIGH |
| @radix-ui/react-* | Latest stable | Headless accessible primitives | Industry-standard headless components with WAI-ARIA compliance. Foundation for custom components (dialogs, dropdowns, navigation). | HIGH |

### Design System Tooling

| Tool | Version | Purpose | When to Use | Confidence |
|------|---------|---------|-------------|------------|
| Storybook | 8.x | Component documentation & isolation | Build/document custom components in isolation. Auto-generates docs from components. Standard for design systems. | MEDIUM |
| @tailwindcss/postcss | 4.1.18 | Tailwind v4 PostCSS integration | Already installed. Required for Tailwind v4's new CSS-native architecture. | HIGH |

### Dependency Management & Tech Debt

| Tool | Version | Purpose | When to Use | Confidence |
|------|---------|---------|-------------|------------|
| npm-check-updates | 19.3+ | Dependency version updates | Run `ncu -u` to update package.json to latest versions. Active maintenance (updated 20 days ago). | HIGH |
| depcheck | 1.4.7 | Unused dependency detection | Find unused dependencies before cleanup. Run before major refactors. Note: Last updated 2 years ago. | MEDIUM |
| check-peer-dependencies | Latest | Peer dependency validation | Recursively check if installed packages meet peer dependency requirements. Find compatible versions. | MEDIUM |

### Type Safety & Validation

| Library | Version | Purpose | Why Recommended | Confidence |
|---------|---------|---------|-----------------|------------|
| Zod | 4.3.6+ | Runtime validation | Already installed. Use for form validation, API responses, and environment variables. | HIGH |
| @t3-oss/env-nextjs | 0.13+ | Environment variable validation | Type-safe env vars with Zod schemas. Validates at build + runtime. Prevents server var exposure to client. | HIGH |

### Security & Headers

| Tool | Version | Purpose | Why Recommended | Confidence |
|------|---------|---------|-----------------|------------|
| @next-safe/middleware | Latest | CSP headers via middleware | Simplifies Content Security Policy implementation. Uses Next.js Middleware (stable since 12.2). Supports nonce-based CSP. | MEDIUM |

### Code Quality & Formatting

| Tool | Version | Purpose | Why Recommended | Confidence |
|------|---------|---------|-----------------|------------|
| prettier-plugin-tailwindcss | 0.6+ | Automatic class sorting | Official Prettier plugin. Auto-sorts Tailwind classes in recommended order. Works anywhere Prettier works. | HIGH |
| eslint-plugin-tailwindcss | 3.18+ | Tailwind linting & validation | Identifies deprecated classes, enforces best practices. Complements prettier-plugin-tailwindcss (5+ additional rules). | HIGH |

### 3D Visualization (Already In Use)

| Library | Version | Purpose | Compatibility Notes | Confidence |
|---------|---------|---------|---------------------|------------|
| three | 0.182+ | 3D graphics library | Already at 0.182.0. Compatible with React 19 via react-three/fiber v9. | HIGH |
| @react-three/fiber | 9.5+ | React renderer for Three.js | Version 9 fully supports React 19.2.4 including Activity feature. Dynamically exposes Three.js features—no update lag. | HIGH |
| @react-three/drei | 10.7+ | Three.js helpers/abstractions | Already at 10.7.7. Compatible with React 19 and R3F v9. | HIGH |

## Installation Commands

### Custom Design System Foundation
```bash
# Core variant & class management
npm install class-variance-authority tailwind-merge clsx

# Headless accessible primitives (install as needed per component)
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-navigation-menu

# Environment validation
npm install @t3-oss/env-nextjs

# Security middleware
npm install @next-safe/middleware
```

### Development Tools
```bash
# Dependency management
npm install -g npm-check-updates
npm install -D depcheck check-peer-dependencies

# Code quality
npm install -D prettier-plugin-tailwindcss eslint-plugin-tailwindcss

# Design system documentation (optional)
npm install -D storybook @storybook/react @storybook/addon-essentials
```

## Tailwind CSS 4 Architecture Changes

### CSS-First Configuration
Tailwind v4 replaces `tailwind.config.js` with CSS-native configuration using `@theme` directive:

```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #3b82f6;
  --color-brand-secondary: #8b5cf6;
  --font-family-display: 'Inter', sans-serif;
  --spacing-card: 1.5rem;
}
```

**Key changes:**
- Design tokens become native CSS custom properties (accessible via `var(--color-brand-primary)`)
- Zero-config content detection (no more `content: []` array)
- Oxide compiler (Rust-based) delivers 2-5x faster builds
- All theme values auto-exposed as CSS variables

### Migration Notes
Your existing `tailwind.config.ts` should migrate to CSS `@theme` blocks. See official migration guide: https://tailwindcss.com/blog/tailwindcss-v4

## Component Variant Pattern

**Standard pattern for custom components:**

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// components/Button.tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-brand-primary text-white hover:bg-brand-primary/90",
        secondary: "bg-brand-secondary text-white hover:bg-brand-secondary/90",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-100",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-11 px-8 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  className?: string
  children: React.ReactNode
}

export function Button({ variant, size, className, children }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </button>
  )
}
```

This pattern provides type-safe variants with IntelliSense, proper class conflict resolution via tailwind-merge, and consumer override support.

## Peer Dependency Resolution Strategy

**Current Issue:** Using `--legacy-peer-deps` as workaround for conflicts.

**Recommended Resolution Path:**

1. **Audit peer dependencies:**
   ```bash
   npx check-peer-dependencies
   ```

2. **Identify conflicting packages:**
   Common Next.js 16 conflicts: `@clerk/nextjs`, `better-auth`, `@genkit-ai/next` (all need peer dep updates for Next.js 16)

3. **Resolution hierarchy:**
   - **Preferred:** Update packages to versions with Next.js 16 peer dep support
   - **Fallback:** Use `overrides` in package.json (npm 8+):
     ```json
     {
       "overrides": {
         "package-with-conflict": {
           "next": "^16.1.6"
         }
       }
     }
     ```
   - **Last resort:** Continue with `--legacy-peer-deps` (document reason in README)

4. **Important:** After adding overrides, delete `node_modules` and `package-lock.json`, then run `npm install` to recalculate dependency graph.

**Limitation:** npm overrides do NOT work for peer dependencies themselves (architectural limitation). For peer deps, you must wait for package maintainer updates or use `--legacy-peer-deps`.

## TypeScript Strict Mode Configuration

**Recommended `tsconfig.json` additions:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true
  }
}
```

**Rationale:** Teams using strict TypeScript across full stack report 40% reduction in runtime errors. Industry adoption: 70-80% of new professional React projects start with TypeScript + strict mode.

**Migration:** Enable `"strict": true` in a feature branch, fix breaking changes incrementally. Prioritize fixing type errors in new custom components first.

## Environment Variable Validation Pattern

**Setup with @t3-oss/env-nextjs:**

```typescript
// env.ts
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    RESEND_API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_VERCEL_URL: z.string().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
  },
})
```

**Benefits:**
- Type-safe env vars with autocomplete
- Build-time + runtime validation
- Prevents server var exposure to client
- Zod schema ensures correct types/formats

Import in `next.config.js` to validate at build time.

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Tailwind CSS v3 config patterns | v4 is CSS-first, not JS config | Migrate to `@theme` directive in CSS |
| Tailwind v2 plugins without v4 support | May cause build failures or conflicts | Verify v4 compatibility before installing plugins |
| Styled-components / CSS-in-JS for design system | Adds runtime overhead, conflicts with Tailwind philosophy | Use Tailwind utilities + CVA for variants |
| shadcn/ui complete installation | Copies entire component library | Cherry-pick only needed components to reduce bloat |
| `npm install --force` for peer deps | Bypasses ALL safety checks, can break builds | Use `--legacy-peer-deps` (bypasses only peer dep checks) |
| Old dependency management tools | Outdated/unmaintained | `npm-check` (last updated 6+ years ago) → use `npm-check-updates` |

## Stack Patterns by Use Case

### For Custom Navigation Components
- **Foundation:** `@radix-ui/react-navigation-menu` (headless, accessible)
- **Styling:** Tailwind utilities + CVA for variants
- **State management:** React 19 `use()` hook for async state (if needed)

### For Custom Card Components
- **Container queries:** Tailwind v4 built-in `@container` (no plugin needed)
- **Responsive:** Use `@container` instead of viewport breakpoints for true component-level responsiveness
- **Variants:** CVA for size/variant options

### For Typography System
- **Define in CSS:** Use `@theme` for font families, sizes, line-heights
- **Utilities:** Leverage Tailwind's typography utilities
- **Custom component:** Wrap in CVA-based `<Text>` component with variant props

### For Dark Mode
- **CSS variables:** Define light/dark tokens in `@theme`
- **Toggle:** Tailwind's `dark:` variant (class-based or media query)
- **Scalability:** CSS variables scale better than class toggles

## Version Compatibility Matrix

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Tailwind CSS 4.1.18 | Next.js 16+, PostCSS 8.5+ | Requires `@tailwindcss/postcss` |
| tailwind-merge 3.4.1 | Tailwind v4.0-4.1 | Use v2.6.0 for Tailwind v3 |
| @react-three/fiber 9.5+ | React 19.2+, Three.js 0.180+ | v9 = React 19 compatible |
| class-variance-authority 0.7.1 | Any React version | Framework agnostic |
| npm-check-updates 19.3+ | npm 7+, Node 18+ | Active maintenance |

## Tech Debt Cleanup Workflow

**Recommended sequence:**

1. **Identify unused dependencies:**
   ```bash
   npx depcheck
   ```

2. **Check for updates:**
   ```bash
   npx npm-check-updates
   ```

3. **Review peer dependencies:**
   ```bash
   npx check-peer-dependencies
   ```

4. **Update dependencies (interactive):**
   ```bash
   npx npm-check-updates -i
   ```

5. **Test thoroughly:**
   - Run `npm run build` to catch build errors
   - Run `npm run type-check` to verify TypeScript
   - Test critical user flows

6. **Document changes:**
   - Note any breaking changes in CHANGELOG
   - Update README if peer dep workarounds required

## Sources

**Official Documentation (HIGH confidence):**
- [Tailwind CSS v4.0 Announcement](https://tailwindcss.com/blog/tailwindcss-v4) — Architecture changes, CSS-first config, Oxide compiler
- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme) — Design tokens in v4
- [Class Variance Authority Docs](https://cva.style/docs) — Component variant patterns
- [T3 Env Documentation](https://env.t3.gg/docs/nextjs) — Environment validation setup
- [@next-safe/middleware](https://next-safe-middleware.vercel.app/) — CSP headers implementation

**npm Packages (HIGH confidence):**
- [tailwind-merge npm](https://www.npmjs.com/package/tailwind-merge) — Latest version 3.4.1
- [class-variance-authority npm](https://www.npmjs.com/package/class-variance-authority) — Latest version 0.7.1
- [npm-check-updates npm](https://www.npmjs.com/package/npm-check-updates) — Latest version 19.3.2
- [depcheck npm](https://www.npmjs.com/package/depcheck) — Latest version 1.4.7

**Community Resources (MEDIUM confidence):**
- [Tailwind CSS v4 Complete Guide 2026](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide) — Migration patterns
- [Tailwind CSS Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns) — Design system architecture
- [shadcn/ui Complete Guide 2026](https://designrevision.com/blog/shadcn-ui-guide) — Component patterns with Radix + Tailwind
- [How to Fix npm Peer Dependency Conflicts](https://oneuptime.com/blog/post/2026-01-22-nodejs-fix-npm-peer-dependency-conflicts/view) — Resolution strategies
- [TypeScript Strict Mode Guide 2026](https://oneuptime.com/blog/post/2026-01-15-strict-typescript-configuration-react/view) — Configuration best practices

**GitHub Issues (MEDIUM confidence):**
- [Next.js 16 Peer Dependency Issues](https://github.com/vercel/next.js/discussions/66259) — Common conflicts
- [React 19 R3F Compatibility](https://github.com/pmndrs/drei/discussions/2213) — Three.js ecosystem status
- [npm Overrides Limitation](https://github.com/npm/rfcs/discussions/552) — Peer dependency override constraints

---

*Stack research for: Portfolio App Stabilization & Custom Design System*
*Researched: 2026-02-16*
*Researcher: GSD Project Researcher*
