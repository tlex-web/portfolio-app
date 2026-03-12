import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000, // 30 seconds per test
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Webkit skipped in CI — Playwright's Linux webkit build has known issues
    // with client-side navigation, form validation, modals, and WebGL.
    // Run locally on macOS for real Safari coverage.
    ...(!process.env.CI ? [{
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    }] : []),
  ],

  /* Run local dev server before starting the tests.
   * In CI, use a production build to avoid HMR WebSocket connections
   * that prevent 'networkidle' from ever resolving. */
  webServer: {
    command: process.env.CI
      ? 'npm run build && npm run start'
      : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 180000 : 120000, // 3 min in CI (build+start), 2 min locally
  },
});
