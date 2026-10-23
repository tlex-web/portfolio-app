import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier/flat';

// Legacy v1 files replaced or deleted in Phases 9-12: the React Compiler rules
// only warn here. The list shrinks to zero by Phase 12; never add a new file.
const LEGACY_COMPILER_FILES = [
  'components/DualParticleSystem.tsx',
  'components/HologramTerminal.tsx',
  'components/HologramTerminalDemo.tsx',
  'components/MountainTerrain3D.tsx',
  'components/GeologicalButton.tsx',
  'components/AnimatedGradientMesh.tsx',
  'components/GlassmorphismNav.tsx',
  'lib/useProgressiveTextures.ts',
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
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
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
          ],
          patterns: [
            {
              group: ['@phosphor-icons/react/dist/csr*'],
              message: 'Import icons from @phosphor-icons/react/dist/ssr (DSGN-10)',
            },
          ],
        },
      ],
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
