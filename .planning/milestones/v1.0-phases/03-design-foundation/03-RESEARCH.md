# Phase 3: Design Foundation - Research

**Researched:** 2026-02-17
**Domain:** Tailwind CSS v4 design tokens, custom typography, WCAG contrast verification
**Confidence:** HIGH

## Summary

Phase 3 establishes the visual language for the portfolio through Tailwind CSS v4's `@theme` directive. The project already runs Tailwind v4.1.18 with the CSS-first `@import "tailwindcss"` approach in `globals.css`. The existing `tailwind.config.ts` is a leftover from the v3 era and contains only a bare `content` array and empty `theme.extend` -- it can be removed since v4 uses automatic content detection and the `@theme` directive in CSS for all customization.

The current codebase uses hardcoded Tailwind color classes extensively: 111 occurrences of cyan/blue accent colors and 254 occurrences of gray/white/black across 26 components. However, Phase 3 scope is strictly **defining design tokens** -- the actual component migration to semantic tokens belongs to Phase 4. Phase 3 defines the `@theme` color palette, typography system, and creates an automated contrast verification script.

**Primary recommendation:** Define the complete Swiss Alps dark palette in `globals.css` using `@theme` with OKLCH color format, integrate JetBrains Mono (headings) and Inter (body) via `next/font/google` with `@theme inline`, and write a Node.js script using `wcag-contrast` to verify all token combinations against WCAG AA thresholds.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Tech-dominant forest aesthetic -- futuristic dark base with nature-colored accents and organic geometric shapes
- Swiss Alps inspiration -- deep pine forests and granite mountain tones as the nature foundation
- Geometric nature patterns -- hexagons, fractals, leaf vein networks abstracted into geometric line art (relevant for Phase 4 components, but informs color choices here)
- Multi-color contextual glow -- different accent colors serve different purposes (interactive, highlight, success)
- Balanced visual density -- comfortable spacing, neither sparse nor packed
- Professional edge -- polished, confident, corporate-friendly, impressive without being wild
- **Base tones:** Swiss Alps palette -- deep pine greens and granite/slate grays
- **Primary accent:** Cyan/teal -- keeps existing hologram terminal aesthetic, cold digital light against alpine nature
- **Secondary accent:** Amber/gold -- warm counterpoint for highlights and emphasis, sunrise-over-mountains feel
- **Vibrancy:** Moderate glow -- accents are clear and noticeable but not neon-loud, refined
- **Semantic colors:** Organic semantic palette -- success=forest green, error=rusty red, warning=golden amber (nature-derived, not standard conventions)
- **Headings:** Monospace/technical display font -- leans into the tech/hologram terminal side of the aesthetic
- **Body:** Clean sans-serif -- modern, neutral, lets headings be the personality
- **Weight hierarchy:** Medium contrast -- page titles bold, sections semi-bold, subsections regular (clear but not extreme)
- **Text effects:** Subtle cyan/accent glow (text-shadow) on page-level headings -- connects headings to the digital side
- **Dark only** -- no light mode variant
- **Layered dark backgrounds** -- multiple dark shades for depth: darkest background, slightly lighter surfaces, card elevations visible through shade differences
- **Green-tinted layers** -- dark background shades carry subtle forest green undertones
- **Body text:** Warm off-white -- slightly warm/cream tone, softer on eyes, feels natural against forest tones

### Claude's Discretion
- Specific font family choices (which monospace, which sans-serif) -- research should identify options that fit
- Exact color hex values -- derive from the described palette direction, verify WCAG compliance
- Number of shade steps in the layered dark system
- Heading glow intensity and spread values
- Caption and small text styling

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DSGN-01 | Custom color palette defined in Tailwind `@theme` -- organic earthy tones meeting digital accents | `@theme` directive syntax verified in Tailwind v4.1.18 official docs; OKLCH color format recommended for perceptually uniform shade ramps; Swiss Alps palette direction fully researched with specific OKLCH hue ranges |
| DSGN-02 | Custom typography system -- nature-inspired display font paired with readable body font, full hierarchy | `next/font/google` integration pattern verified for Next.js 16+ with Tailwind v4 `@theme inline`; JetBrains Mono (headings) and Inter (body) recommended; Tailwind v4.1 native `text-shadow-*` utilities available for heading glow effects |
| DSGN-03 | All custom color combinations meet WCAG AA contrast ratios (4.5:1 body, 3:1 large) | `wcag-contrast` npm package verified for programmatic hex-based contrast checking; automated verification script approach documented |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | 4.1.18 | CSS framework, design token system via `@theme` | Already installed; `@theme` replaces JS config with CSS-native tokens |
| next/font/google | (bundled with Next.js 16) | Font loading and optimization | Self-hosts fonts, eliminates external requests, zero layout shift |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| wcag-contrast | latest | Programmatic WCAG contrast ratio calculation | Automated verification script for DSGN-03 compliance |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| wcag-contrast | color-contrast-checker (BBC) | More features but heavier; wcag-contrast is simpler and sufficient for hex-to-ratio checking |
| OKLCH format | Hex format | Hex is simpler to read but OKLCH produces perceptually uniform shade ramps -- use OKLCH for generating scales, store final values as hex for simplicity |
| JetBrains Mono | Fira Code / IBM Plex Mono | Fira Code has similar ligatures but JetBrains Mono has better large-size rendering; IBM Plex Mono is more corporate, less "terminal hacker" feel |
| Inter | DM Sans / Manrope | All are excellent modern sans-serifs; Inter has the widest weight range and best screen optimization |

**Installation:**
```bash
npm install --save-dev wcag-contrast
```

No other new runtime dependencies needed. Fonts are loaded via `next/font/google` (already available). Tailwind v4.1.18 is already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── globals.css          # @theme tokens, font setup, base styles
├── layout.tsx           # Font CSS variable injection on <html>
components/              # (Phase 4: migrate to semantic token classes)
scripts/
└── verify-contrast.mjs  # Automated WCAG contrast verification
```

### Pattern 1: Tailwind v4 CSS-First Token Definition
**What:** Define all design tokens in `globals.css` using `@theme` directive instead of JS config
**When to use:** Always in Tailwind v4 -- this is the standard approach
**Example:**
```css
/* Source: https://tailwindcss.com/docs/theme */
@import "tailwindcss";

@theme {
  /* Override default colors to prevent accidental usage of wrong palette */
  --color-*: initial;

  /* Re-add essential colors */
  --color-white: #ffffff;
  --color-black: #000000;
  --color-transparent: transparent;
  --color-current: currentColor;

  /* Alpine dark background layers (green-tinted) */
  --color-alpine-950: oklch(0.13 0.015 155);   /* deepest background */
  --color-alpine-900: oklch(0.16 0.018 155);   /* page background */
  --color-alpine-800: oklch(0.20 0.020 155);   /* surface/card */
  --color-alpine-700: oklch(0.25 0.018 155);   /* elevated surface */
  --color-alpine-600: oklch(0.30 0.015 155);   /* borders, dividers */

  /* Granite neutrals (slate-tinted grays) */
  --color-granite-500: oklch(0.45 0.010 250);
  --color-granite-400: oklch(0.55 0.008 250);
  --color-granite-300: oklch(0.65 0.006 250);

  /* Body text - warm off-white */
  --color-snow-100: oklch(0.93 0.008 80);      /* primary body text */
  --color-snow-200: oklch(0.85 0.006 80);      /* secondary text */
  --color-snow-50: oklch(0.97 0.005 80);       /* brightest text */

  /* Primary accent: Cyan/teal (hologram terminal) */
  --color-frost-500: oklch(0.72 0.14 195);     /* primary interactive */
  --color-frost-400: oklch(0.78 0.12 195);     /* hover states */
  --color-frost-300: oklch(0.84 0.09 195);     /* highlights */
  --color-frost-600: oklch(0.62 0.15 195);     /* pressed/active */
  --color-frost-glow: oklch(0.72 0.14 195 / 0.3); /* glow effects */

  /* Secondary accent: Amber/gold (sunrise) */
  --color-ember-500: oklch(0.75 0.16 75);      /* emphasis, highlights */
  --color-ember-400: oklch(0.80 0.14 75);      /* hover */
  --color-ember-300: oklch(0.85 0.11 75);      /* subtle */
  --color-ember-600: oklch(0.65 0.17 75);      /* pressed */
  --color-ember-glow: oklch(0.75 0.16 75 / 0.3); /* glow effects */

  /* Semantic: Success (forest green) */
  --color-pine-500: oklch(0.60 0.14 145);
  --color-pine-400: oklch(0.68 0.12 145);
  --color-pine-600: oklch(0.50 0.15 145);

  /* Semantic: Error (rusty red) */
  --color-rust-500: oklch(0.58 0.16 25);
  --color-rust-400: oklch(0.65 0.14 25);
  --color-rust-600: oklch(0.48 0.17 25);

  /* Semantic: Warning (golden amber) */
  --color-amber-500: oklch(0.78 0.15 85);
  --color-amber-400: oklch(0.83 0.13 85);
  --color-amber-600: oklch(0.68 0.16 85);
}
```

**Confidence:** HIGH for the `@theme` syntax and structure. MEDIUM for the exact OKLCH values -- these are starting points derived from the hue ranges for each color family and will need visual tuning and contrast verification during implementation.

### Pattern 2: Next.js Font Integration with Tailwind v4
**What:** Load fonts via `next/font/google`, expose as CSS variables on `<html>`, reference in `@theme inline`
**When to use:** Always for fonts in Next.js + Tailwind v4
**Example:**

```typescript
// Source: https://nextjs.org/docs/app/getting-started/fonts
// app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export default async function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  );
}
```

```css
/* globals.css -- font token wiring */
/* Source: https://tailwindcss.com/docs/theme + https://github.com/tailwindlabs/tailwindcss/discussions/15267 */
@import "tailwindcss";

@theme inline {
  --font-body: var(--font-inter);
  --font-heading: var(--font-jetbrains);
  --font-mono: var(--font-jetbrains);
}
```

**Critical detail:** Font CSS variables MUST be applied to the `<html>` element (not `<body>`) for Tailwind's `@theme` to resolve them correctly. This was confirmed by Tailwind maintainer Adam Wathan in GitHub Discussion #15267.

**Critical detail:** Use `@theme inline` (not plain `@theme`) when referencing CSS variables from `next/font`. This ensures the actual font value is inlined in generated utilities rather than creating a circular `var()` reference.

### Pattern 3: Typography Hierarchy via Base Layer
**What:** Define heading sizes, weights, and glow effects as base styles
**When to use:** For site-wide typography defaults
**Example:**

```css
/* globals.css -- typography base styles */
@layer base {
  body {
    font-family: var(--font-body);
    color: var(--color-snow-100);
    background-color: var(--color-alpine-900);
  }

  h1 {
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 2.5rem;
    line-height: 1.2;
    color: var(--color-snow-50);
    text-shadow: 0 0 20px var(--color-frost-glow), 0 0 40px var(--color-frost-glow);
  }

  h2 {
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: 1.875rem;
    line-height: 1.3;
    color: var(--color-snow-50);
  }

  h3 {
    font-family: var(--font-heading);
    font-weight: 500;
    font-size: 1.5rem;
    line-height: 1.4;
    color: var(--color-snow-100);
  }

  h4 {
    font-family: var(--font-heading);
    font-weight: 500;
    font-size: 1.25rem;
    line-height: 1.4;
    color: var(--color-snow-100);
  }

  /* Caption/small text */
  small, .caption {
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--color-granite-400);
  }
}
```

### Pattern 4: Tailwind v4.1 Text Shadow for Heading Glow
**What:** Use native `text-shadow-*` utilities instead of custom CSS for heading glow effects
**When to use:** For any text glow effects on headings or accent text
**Example:**

```css
/* Source: https://tailwindcss.com/docs/text-shadow */
/* Define custom glow text-shadow sizes in @theme */
@theme {
  --text-shadow-glow: 0 0 10px var(--color-frost-glow), 0 0 25px var(--color-frost-glow);
  --text-shadow-glow-lg: 0 0 20px var(--color-frost-glow), 0 0 40px var(--color-frost-glow);
  --text-shadow-glow-ember: 0 0 10px var(--color-ember-glow), 0 0 25px var(--color-ember-glow);
}
```

Usage in components:
```html
<h1 class="text-shadow-glow-lg">Page Title</h1>
<span class="text-shadow-glow-ember">Highlighted text</span>
```

### Anti-Patterns to Avoid

- **Using `dark:` variants:** The site is dark-only. Do NOT define light/dark pairs. Define one set of dark tokens and use them directly. Remove all `dark:` prefixed classes during component migration (Phase 4).
- **Keeping tailwind.config.ts alongside @theme:** The empty config file is a v3 leftover. Having both creates confusion about which is the source of truth. Remove it; all configuration goes in `globals.css`.
- **Hardcoding color values in components:** Do NOT use `text-cyan-500` or `bg-gray-900`. Use semantic token names like `text-frost-500` or `bg-alpine-900`. Component migration is Phase 4, but tokens must be designed with this in mind.
- **Using `--color-*: initial` without re-adding essentials:** Resetting all colors removes `white`, `black`, `transparent`, `inherit`, `current`. Always re-define what you need.
- **Defining @theme inside @layer:** The `@theme` directive must be at the top level of your CSS file, not nested inside `@layer base` or any other at-rule.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WCAG contrast calculation | Custom luminance math | `wcag-contrast` npm package | Correct WCAG 2.1 algorithm with edge cases handled; `hex('#000', '#fff')` returns 21 |
| Font loading/optimization | Manual `@font-face` + preload | `next/font/google` | Self-hosts fonts, eliminates CLS, handles subsetting, caching automatically |
| Perceptually uniform color ramps | Manually picking hex shades | OKLCH color format + systematic L adjustments | OKLCH ensures equal perceptual steps; same L delta = same perceived brightness change |
| Text shadow glow effects | Custom CSS text-shadow everywhere | Tailwind v4.1 `text-shadow-*` utilities + `@theme` custom sizes | Native utility classes keep effects in the Tailwind workflow; `@theme` makes them reusable |
| Dark mode toggle | Any theme switching logic | Nothing -- dark-only by design | User locked "dark only" -- no toggle, no prefers-color-scheme, just one dark palette |

**Key insight:** This phase is about _defining tokens_, not _applying them_. The temptation is to start migrating all 26 components to use new token names. Resist this -- Phase 4 handles component migration. Phase 3 delivers: (1) token definitions in `@theme`, (2) font setup in layout, (3) base typography styles, (4) contrast verification passing.

## Common Pitfalls

### Pitfall 1: Font Variables on Wrong Element
**What goes wrong:** Tailwind `@theme` cannot resolve `var(--font-inter)` because the CSS variable is only defined on the `<body>` element, but `@theme` processes at the `:root` level.
**Why it happens:** Next.js docs show `className` on `<body>`, but Tailwind v4 needs variables available at the highest possible scope for `@theme` resolution.
**How to avoid:** Always apply `next/font` variable classes to `<html>`, not `<body>`. Confirmed by Tailwind maintainer in GitHub Discussion #15267.
**Warning signs:** `font-body` class produces no visible font change; browser DevTools shows `var(--font-inter)` as empty/undefined on `:root`.

### Pitfall 2: @theme vs @theme inline Confusion
**What goes wrong:** Using `@theme { --font-body: var(--font-inter); }` creates a CSS variable that references another variable, but the reference resolves at definition time (where `--font-inter` may not exist yet), not at usage time.
**Why it happens:** Regular `@theme` inlines the resolved value. If the variable isn't defined at the point where `@theme` processes, it resolves to nothing.
**How to avoid:** Use `@theme inline` for any token that references an external CSS variable (like `next/font` variables). Use regular `@theme` for literal values (like color hex/oklch).
**Warning signs:** Font utilities apply but show fallback system fonts instead of the intended font.

### Pitfall 3: Resetting Colors Without Re-adding Essentials
**What goes wrong:** Using `--color-*: initial` removes ALL default colors including `white`, `black`, `transparent`, and `inherit` -- breaking existing `text-white`, `bg-black`, `bg-transparent` classes across the site.
**Why it happens:** The wildcard reset is thorough by design. Developers forget that utility colors like white/black are part of the default color namespace.
**How to avoid:** After `--color-*: initial`, immediately re-define `--color-white`, `--color-black`, `--color-transparent`, and `--color-current`.
**Warning signs:** Build succeeds but many components lose all visible text or backgrounds.

### Pitfall 4: OKLCH Values Outside Gamut
**What goes wrong:** OKLCH allows specifying colors that cannot be displayed on standard sRGB screens. The browser clamps them silently, producing unexpected colors.
**Why it happens:** High chroma values at certain lightness/hue combinations exceed the sRGB gamut.
**How to avoid:** Keep chroma values moderate (under 0.20 for most colors). Test in browser DevTools -- if the computed color differs from the specified one, it was clamped. Tools like oklch.net show gamut boundaries.
**Warning signs:** Colors appear less saturated than expected; slight hue shifts on different screens.

### Pitfall 5: Contrast Failures on Dark Backgrounds
**What goes wrong:** Colors that look "bright enough" on screen fail WCAG 4.5:1 contrast ratio against dark backgrounds.
**Why it happens:** Human perception is poor at judging contrast ratios, especially in dark themes where everything looks "bright enough." The mathematical ratio is often lower than expected.
**How to avoid:** Run the automated contrast verification script against every text-on-background combination. Don't trust visual inspection. Target body text lightness of 0.85+ against backgrounds below 0.20.
**Warning signs:** Text feels "fine" but automated checks report sub-4.5 ratios, especially for secondary text colors and granite neutrals.

### Pitfall 6: Existing Component Breakage
**What goes wrong:** Removing default Tailwind colors causes immediate breakage of all 26 components using `text-gray-*`, `bg-gray-*`, `text-cyan-*`, `border-gray-*`, etc.
**Why it happens:** `--color-*: initial` removes the gray/cyan/blue colors that components currently depend on.
**How to avoid:** Two strategies: (A) Don't reset defaults in Phase 3 -- add custom tokens alongside defaults, then remove defaults in Phase 4 after component migration. (B) Reset defaults AND add backward-compatible aliases (`--color-gray-*` mapped to `--color-alpine-*`/`--color-granite-*`). Strategy A is safer and recommended.
**Warning signs:** Site breaks immediately after token changes; dozens of components show unstyled text.

## Code Examples

### Complete globals.css Structure
```css
/* Source: Tailwind v4 docs + Next.js font docs + research synthesis */
@import "tailwindcss";

/* ===== FONT TOKENS ===== */
/* Use @theme inline for next/font CSS variable references */
@theme inline {
  --font-body: var(--font-inter);
  --font-heading: var(--font-jetbrains);
  --font-mono: var(--font-jetbrains);
}

/* ===== COLOR TOKENS ===== */
/* Use regular @theme for literal color values */
@theme {
  /* -- Alpine dark layers (forest green-tinted) -- */
  --color-alpine-950: oklch(0.13 0.015 155);
  --color-alpine-900: oklch(0.16 0.018 155);
  --color-alpine-800: oklch(0.20 0.020 155);
  --color-alpine-700: oklch(0.25 0.018 155);
  --color-alpine-600: oklch(0.30 0.015 155);

  /* -- Granite neutrals -- */
  --color-granite-500: oklch(0.45 0.010 250);
  --color-granite-400: oklch(0.55 0.008 250);
  --color-granite-300: oklch(0.65 0.006 250);

  /* -- Snow text tones (warm off-white) -- */
  --color-snow-50: oklch(0.97 0.005 80);
  --color-snow-100: oklch(0.93 0.008 80);
  --color-snow-200: oklch(0.85 0.006 80);

  /* -- Frost accent (cyan/teal) -- */
  --color-frost-600: oklch(0.62 0.15 195);
  --color-frost-500: oklch(0.72 0.14 195);
  --color-frost-400: oklch(0.78 0.12 195);
  --color-frost-300: oklch(0.84 0.09 195);
  --color-frost-glow: oklch(0.72 0.14 195 / 0.3);

  /* -- Ember accent (amber/gold) -- */
  --color-ember-600: oklch(0.65 0.17 75);
  --color-ember-500: oklch(0.75 0.16 75);
  --color-ember-400: oklch(0.80 0.14 75);
  --color-ember-300: oklch(0.85 0.11 75);
  --color-ember-glow: oklch(0.75 0.16 75 / 0.3);

  /* -- Semantic: Pine (success/forest green) -- */
  --color-pine-600: oklch(0.50 0.15 145);
  --color-pine-500: oklch(0.60 0.14 145);
  --color-pine-400: oklch(0.68 0.12 145);

  /* -- Semantic: Rust (error) -- */
  --color-rust-600: oklch(0.48 0.17 25);
  --color-rust-500: oklch(0.58 0.16 25);
  --color-rust-400: oklch(0.65 0.14 25);

  /* -- Semantic: Amber (warning) -- */
  --color-amber-600: oklch(0.68 0.16 85);
  --color-amber-500: oklch(0.78 0.15 85);
  --color-amber-400: oklch(0.83 0.13 85);

  /* -- Text shadow glow tokens -- */
  --text-shadow-glow: 0 0 10px var(--color-frost-glow), 0 0 25px var(--color-frost-glow);
  --text-shadow-glow-lg: 0 0 20px var(--color-frost-glow), 0 0 40px var(--color-frost-glow);
  --text-shadow-glow-ember: 0 0 10px var(--color-ember-glow), 0 0 25px var(--color-ember-glow);
}

/* ===== BASE TYPOGRAPHY ===== */
@layer base {
  body {
    font-family: var(--font-body);
    color: var(--color-snow-100);
    background-color: var(--color-alpine-900);
  }

  h1 {
    font-family: var(--font-heading);
    font-weight: 700;
    text-shadow: var(--text-shadow-glow-lg);
  }

  h2 {
    font-family: var(--font-heading);
    font-weight: 600;
  }

  h3, h4 {
    font-family: var(--font-heading);
    font-weight: 500;
  }
}
```

### Contrast Verification Script
```javascript
// scripts/verify-contrast.mjs
// Source: wcag-contrast npm package API
import { hex, score } from 'wcag-contrast';

// Define all text-on-background combinations to verify
const combinations = [
  // Body text on backgrounds
  { fg: '#ECE8E1', bg: '#1F2A1F', label: 'snow-100 on alpine-900', minRatio: 4.5 },
  { fg: '#ECE8E1', bg: '#1A2319', label: 'snow-100 on alpine-950', minRatio: 4.5 },
  { fg: '#D9D3CB', bg: '#1F2A1F', label: 'snow-200 on alpine-900', minRatio: 4.5 },

  // Accent text on backgrounds
  { fg: '#5CC8C8', bg: '#1F2A1F', label: 'frost-500 on alpine-900', minRatio: 3.0 },
  { fg: '#C49A3C', bg: '#1F2A1F', label: 'ember-500 on alpine-900', minRatio: 3.0 },

  // Heading text (large text = 3:1 minimum)
  { fg: '#F5F2EE', bg: '#1F2A1F', label: 'snow-50 on alpine-900 (h1)', minRatio: 3.0 },
  { fg: '#F5F2EE', bg: '#1A2319', label: 'snow-50 on alpine-950 (h1)', minRatio: 3.0 },

  // Semantic colors on backgrounds
  { fg: '#4DAA6A', bg: '#1F2A1F', label: 'pine-500 on alpine-900', minRatio: 3.0 },
  { fg: '#B85C3A', bg: '#1F2A1F', label: 'rust-500 on alpine-900', minRatio: 3.0 },
  { fg: '#C9A83D', bg: '#1F2A1F', label: 'amber-500 on alpine-900', minRatio: 3.0 },

  // Text on elevated surfaces
  { fg: '#ECE8E1', bg: '#283828', label: 'snow-100 on alpine-800', minRatio: 4.5 },
  { fg: '#5CC8C8', bg: '#283828', label: 'frost-500 on alpine-800', minRatio: 3.0 },
];

let allPassed = true;

for (const combo of combinations) {
  const ratio = hex(combo.fg, combo.bg);
  const wcagScore = score(ratio);
  const passed = ratio >= combo.minRatio;

  if (!passed) allPassed = false;

  console.log(
    `${passed ? 'PASS' : 'FAIL'} | ${ratio.toFixed(2)}:1 | ${wcagScore} | ${combo.label} (need ${combo.minRatio}:1)`
  );
}

process.exit(allPassed ? 0 : 1);
```

**Note:** The hex values in the verification script are approximate sRGB conversions of the OKLCH tokens. During implementation, the exact hex values must be derived from the final OKLCH values using a converter tool (e.g., oklch.net or browser DevTools computed styles). The script should be updated to match the final token values.

### layout.tsx Font Integration
```typescript
// Source: https://nextjs.org/docs/app/getting-started/fonts
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

// In the return JSX:
// <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
//   <body className="font-body antialiased">
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.ts` theme section | `@theme` directive in CSS | Tailwind v4.0 (Jan 2025) | All token configuration moves to CSS; JS config optional for backward compat only |
| `@tailwind base; @tailwind components; @tailwind utilities;` | `@import "tailwindcss";` | Tailwind v4.0 | Single import replaces three directives |
| Manual `content` array for class scanning | Automatic content detection | Tailwind v4.0 | No need for content paths; uses .gitignore heuristics |
| Custom CSS for text-shadow | Native `text-shadow-*` utilities | Tailwind v4.1 (Apr 2025) | Built-in text-shadow with color, size, and opacity utilities |
| Hex/HSL color format | OKLCH color format | Tailwind v4.0 default | Perceptually uniform; default palette ships in OKLCH; recommended for custom palettes |
| `next/font` className approach | `next/font` variable + `@theme inline` | Tailwind v4.0 + Next.js 15+ | CSS variable approach integrates cleanly with Tailwind's CSS-first config |

**Deprecated/outdated:**
- `tailwind.config.ts` with `theme.extend.colors` -- replaced by `@theme` in CSS
- `@tailwind` directives -- replaced by `@import "tailwindcss"`
- `darkMode: 'class'` config -- not needed; this site is dark-only

## Open Questions

1. **Exact OKLCH values need visual verification**
   - What we know: The hue ranges (155 for green-tint, 195 for cyan, 75 for amber, etc.) are correct for the described color families. Lightness and chroma starting points are reasonable.
   - What's unclear: Whether the exact lightness/chroma values produce the intended visual feel. OKLCH is perceptually uniform but creative intent requires subjective tuning.
   - Recommendation: During implementation, render all tokens as swatches on the actual dark backgrounds and fine-tune visually. The automated contrast script will catch any adjustments that break accessibility.

2. **Strategy for existing component compatibility during Phase 3**
   - What we know: 111 cyan/blue and 254 gray/white/black color references across 26 components will break if default colors are removed.
   - What's unclear: Whether to keep defaults during Phase 3 and remove in Phase 4, or to provide backward-compatible aliases.
   - Recommendation: **Keep Tailwind default colors during Phase 3** (do NOT use `--color-*: initial`). Add the custom palette alongside defaults. Phase 4 migrates components and removes defaults. This is the safest approach.

3. **Heading glow intensity calibration**
   - What we know: User wants "subtle" glow. Tailwind v4.1 has text-shadow utilities. Custom glow tokens can be defined in `@theme`.
   - What's unclear: The exact blur radius and opacity that reads as "subtle cyan glow" on dark backgrounds without being garish.
   - Recommendation: Start conservative (10px blur, 30% opacity glow color). Can be tuned up. Easier to increase glow than reduce it without looking washed out.

4. **`tailwind.config.ts` removal timing**
   - What we know: The file contains only `content` array and empty `theme.extend`. Tailwind v4 auto-detects content and uses `@theme` for config. The file is functionally unused.
   - What's unclear: Whether any build tooling or ESLint plugins reference this file.
   - Recommendation: Remove it in Phase 3 as a cleanup step. If anything breaks, it will be immediately obvious in the build.

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme) -- `@theme` directive syntax, `@theme inline`, namespaces, override vs extend, complete examples
- [Tailwind CSS v4 Customizing Colors](https://tailwindcss.com/docs/customizing-colors) -- Color scales, `--color-*: initial`, OKLCH format, CSS variable usage
- [Tailwind CSS v4 Text Shadow](https://tailwindcss.com/docs/text-shadow) -- All size utilities (2xs through lg), color customization, `@theme` definition, opacity modifiers
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) -- Google font import, CSS variables, `display: 'swap'`, layout integration (verified doc version 16.1.6)
- [Tailwind CSS v4.0 Release Blog](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first config, automatic content detection, `@import "tailwindcss"` migration

### Secondary (MEDIUM confidence)
- [GitHub Discussion #15267](https://github.com/tailwindlabs/tailwindcss/discussions/15267) -- Adam Wathan confirming font variables must go on `<html>` not `<body>` for `@theme` resolution
- [GitHub Discussion #13410](https://github.com/tailwindlabs/tailwindcss/discussions/13410) -- Next.js font variable resolution issues with Tailwind v4
- [OKLCH Color Picker](https://oklch.net/) -- Hue/chroma/lightness ranges for target color families; gamut boundary visualization
- [JetBrains Mono Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono) -- Variable font, weights 100-800, available via `next/font/google`
- [wcag-contrast npm](https://www.npmjs.com/package/wcag-contrast) -- `hex()` function API, `score()` function API

### Tertiary (LOW confidence)
- Exact OKLCH values in code examples are starting estimates based on hue range research, not visually verified -- marked for calibration during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Tailwind v4.1.18 `@theme` syntax thoroughly documented in official docs; `next/font` pattern verified against Next.js 16.1.6 docs
- Architecture: HIGH -- CSS-first token pattern is the documented standard for Tailwind v4; font integration pattern confirmed by Tailwind maintainer
- Pitfalls: HIGH -- Font variable scoping issue, `@theme`/`@theme inline` distinction, and color reset gotchas all verified through official GitHub discussions
- Color values: MEDIUM -- OKLCH hue ranges are correct but exact L/C values need visual tuning and contrast verification during implementation

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable domain -- Tailwind v4 API is settled)
