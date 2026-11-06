const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^three$': '<rootDir>/node_modules/three/build/three.module.js',
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/e2e/'],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
const resolveConfig = createJestConfig(customJestConfig);

// three 0.187 ships no real CommonJS build: build/three.cjs is a deprecated shim that
// require()s the ES module, which Node allows and Jest's CommonJS runtime cannot parse.
// next/jest always ignores node_modules, and custom patterns can only append to that,
// so three is mapped to its ES module above and unignored once the config has resolved.
// This affects tests only; the production bundle already uses the ES module.
module.exports = async () => {
  const config = await resolveConfig();
  return {
    ...config,
    transformIgnorePatterns: config.transformIgnorePatterns.map((pattern) =>
      pattern.startsWith('/node_modules/')
        ? pattern.replace('/node_modules/', '/node_modules/(?!three/)')
        : pattern
    ),
  };
};

