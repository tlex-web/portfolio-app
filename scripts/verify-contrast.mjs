/**
 * WCAG AA Contrast Verification Script
 *
 * Verifies all custom text-on-background color combinations from the
 * Swiss Alps design token system meet WCAG AA contrast requirements.
 *
 * Hex values are derived from the OKLCH tokens in app/globals.css
 * using colorjs.io for accurate color space conversion.
 *
 * Thresholds:
 *   - Body text: 4.5:1 minimum
 *   - Large text / headings: 3:1 minimum
 *
 * Usage: node scripts/verify-contrast.mjs
 */

import { hex } from "wcag-contrast";

// ─── Hex equivalents of OKLCH tokens from globals.css ───────────────
// Converted via colorjs.io (oklch → srgb → hex)

const colors = {
  // Alpine dark layers (green-tinted backgrounds)
  "alpine-950": "#040905",
  "alpine-900": "#07100a",
  "alpine-800": "#0f1912",
  "alpine-700": "#1b241e",
  "alpine-600": "#28302b",

  // Granite neutrals (slate-tinted grays)
  "granite-500": "#51565b",
  "granite-400": "#7d8185",
  "granite-300": "#8c8f93",

  // Snow text tones (warm off-white)
  "snow-50": "#f7f5f1",
  "snow-100": "#ebe7e2",
  "snow-200": "#d0cdc9",

  // Frost accent (cyan/teal)
  "frost-600": "#009d9d",
  "frost-500": "#00bfc0",
  "frost-400": "#3bcfcf",
  "frost-300": "#7fdddd",

  // Ember accent (amber/gold)
  "ember-600": "#c57e00",
  "ember-500": "#e89d00",
  "ember-400": "#f2af48",
  "ember-300": "#f8c379",

  // Semantic -- Pine (success/forest green)
  "pine-600": "#107823",
  "pine-500": "#419547",
  "pine-400": "#66ac69",

  // Semantic -- Rust (error)
  "rust-600": "#a92227",
  "rust-500": "#c74b47",
  "rust-400": "#d76963",

  // Semantic -- Amber (warning)
  "amber-600": "#c48e00",
  "amber-500": "#e3ae28",
  "amber-400": "#eec05b",
};

// ─── Combination definitions ────────────────────────────────────────

const combinations = [
  // Body text (4.5:1 minimum)
  {
    fg: "snow-100",
    bg: "alpine-950",
    label: "body text on deepest bg",
    min: 4.5,
  },
  {
    fg: "snow-100",
    bg: "alpine-900",
    label: "body text on page bg",
    min: 4.5,
  },
  {
    fg: "snow-100",
    bg: "alpine-800",
    label: "body text on card/surface",
    min: 4.5,
  },
  {
    fg: "snow-100",
    bg: "alpine-700",
    label: "body text on elevated surface",
    min: 4.5,
  },
  {
    fg: "snow-200",
    bg: "alpine-900",
    label: "secondary text on page bg",
    min: 4.5,
  },
  {
    fg: "snow-200",
    bg: "alpine-800",
    label: "secondary text on card",
    min: 4.5,
  },

  // Large text / headings (3:1 minimum)
  {
    fg: "snow-50",
    bg: "alpine-950",
    label: "h1 on deepest bg",
    min: 3.0,
  },
  {
    fg: "snow-50",
    bg: "alpine-900",
    label: "h1 on page bg",
    min: 3.0,
  },
  {
    fg: "snow-50",
    bg: "alpine-800",
    label: "h1 on card",
    min: 3.0,
  },

  // Accent text -- frost (3:1 minimum for large text)
  {
    fg: "frost-500",
    bg: "alpine-900",
    label: "interactive text on page bg",
    min: 3.0,
  },
  {
    fg: "frost-500",
    bg: "alpine-800",
    label: "interactive text on card",
    min: 3.0,
  },
  {
    fg: "frost-400",
    bg: "alpine-900",
    label: "hover state text",
    min: 3.0,
  },

  // Accent text -- ember (3:1 minimum for large text)
  {
    fg: "ember-500",
    bg: "alpine-900",
    label: "highlight text on page bg",
    min: 3.0,
  },
  {
    fg: "ember-500",
    bg: "alpine-800",
    label: "highlight text on card",
    min: 3.0,
  },
  {
    fg: "ember-400",
    bg: "alpine-900",
    label: "hover highlight",
    min: 3.0,
  },

  // Semantic -- pine (3:1 minimum for large text)
  {
    fg: "pine-500",
    bg: "alpine-900",
    label: "success on page bg",
    min: 3.0,
  },
  {
    fg: "pine-400",
    bg: "alpine-800",
    label: "success on card",
    min: 3.0,
  },

  // Semantic -- rust (3:1 minimum for large text)
  {
    fg: "rust-500",
    bg: "alpine-900",
    label: "error on page bg",
    min: 3.0,
  },
  {
    fg: "rust-400",
    bg: "alpine-800",
    label: "error on card",
    min: 3.0,
  },

  // Semantic -- amber (3:1 minimum for large text)
  {
    fg: "amber-500",
    bg: "alpine-900",
    label: "warning on page bg",
    min: 3.0,
  },
  {
    fg: "amber-400",
    bg: "alpine-800",
    label: "warning on card",
    min: 3.0,
  },

  // Caption/muted text (4.5:1 minimum for body-sized caption)
  {
    fg: "granite-400",
    bg: "alpine-900",
    label: "caption on page bg",
    min: 4.5,
  },
  {
    fg: "granite-400",
    bg: "alpine-800",
    label: "caption on card",
    min: 4.5,
  },
  {
    fg: "granite-300",
    bg: "alpine-900",
    label: "slightly brighter caption",
    min: 4.5,
  },
];

// ─── Run verification ───────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

console.log("WCAG AA Contrast Verification");
console.log("=".repeat(70));
console.log("");

for (const { fg, bg, label, min } of combinations) {
  const fgHex = colors[fg];
  const bgHex = colors[bg];
  const ratio = hex(fgHex, bgHex);
  const ok = ratio >= min;

  const status = ok ? "PASS" : "FAIL";
  const icon = ok ? "+" : "x";

  console.log(
    `  [${icon}] ${status}  ${ratio.toFixed(2)}:1  (min ${min}:1)  ${fg} on ${bg} -- ${label}`
  );

  if (ok) {
    passed++;
  } else {
    failed++;
    failures.push({ fg, bg, label, ratio, min });
  }
}

console.log("");
console.log("=".repeat(70));
console.log(`  ${passed}/${passed + failed} combinations passed`);

if (failed > 0) {
  console.log("");
  console.log("  FAILURES:");
  for (const f of failures) {
    console.log(
      `    - ${f.fg} on ${f.bg} (${f.label}): ${f.ratio.toFixed(2)}:1 < ${f.min}:1`
    );
  }
  console.log("");
  process.exit(1);
} else {
  console.log("  All combinations meet WCAG AA requirements.");
  console.log("");
  process.exit(0);
}
