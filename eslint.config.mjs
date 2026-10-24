import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier/flat';

// Legacy v1 files replaced or deleted in Phases 9-12: the React Compiler rules
// only warn here. The list shrinks to zero by Phase 12; never add a new file.
const LEGACY_COMPILER_FILES = [
  'components/HologramTerminal.tsx',
  'components/HologramTerminalDemo.tsx',
  'components/AnimatedGradientMesh.tsx',
  'components/GlassmorphismNav.tsx',
  'lib/useProgressiveTextures.ts',
];

// Banned everywhere, scripts included. Shared by the global block and the
// scripts/**/*.mjs block below, because flat config REPLACES no-restricted-imports
// options per matching object instead of merging them (RESEARCH Pitfall 8).
const BANNED_PATHS = [
  { name: 'framer-motion', message: 'Import from motion/react (DEPS-03).' },
  {
    name: '@react-three/fiber',
    importNames: ['Canvas'],
    message:
      'Use @/components/SafeCanvas: since R3F 9.8 a bare <Canvas> without WebGL replaces the whole route with app/(site)/error.tsx.',
  },
  {
    name: '@phosphor-icons/react',
    message: 'Import icons from @phosphor-icons/react/dist/ssr (DSGN-10)',
  },
];
const BANNED_PATTERNS = [
  {
    group: ['@phosphor-icons/react/dist/csr*'],
    message: 'Import icons from @phosphor-icons/react/dist/ssr (DSGN-10)',
  },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // GUARD-06: every jsx-a11y recommended rule at error level (Next alone ships 6 rules at warn)
    files: ['**/*.{jsx,tsx}'],
    rules: { ...jsxA11y.flatConfigs.recommended.rules },
  },
  {
    files: LEGACY_COMPILER_FILES,
    rules: {
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
  {
    files: ['**/*.config.js', '**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Banned import paths, all files. Add one entry per replaced package.
    // The generator libraries are build-time only (DATA-01): no generator code or
    // raw DEM data may reach a module that app/, components/, lib/ or data/ import.
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...BANNED_PATHS,
            {
              name: 'd3-contour',
              message: 'Build-time only: import generator libraries from scripts/** (DATA-01).',
            },
            {
              name: 'geotiff',
              message: 'Build-time only: import generator libraries from scripts/** (DATA-01).',
            },
            {
              name: 'simplify-js',
              message: 'Build-time only: import generator libraries from scripts/** (DATA-01).',
            },
            {
              name: 'exif-reader',
              message: 'Build-time only: import generator libraries from scripts/** (DATA-01).',
            },
            {
              name: 'sharp',
              message: 'Build-time only: import generator libraries from scripts/** (DATA-01).',
            },
          ],
          patterns: BANNED_PATTERNS,
        },
      ],
    },
  },
  {
    // Build scripts may import the generator libraries; every other ban still applies.
    // This block must restate BANNED_PATHS/BANNED_PATTERNS (Pitfall 8: options replace).
    files: ['scripts/**/*.mjs'],
    rules: {
      'no-restricted-imports': ['error', { paths: BANNED_PATHS, patterns: BANNED_PATTERNS }],
    },
  },
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    '.claude/**',
    '.planning/**',
    'graphify-out/**',
    'project_concept/**',
    'public/**',
    'scripts/guards/__selftest__/**',
  ]),
]);
