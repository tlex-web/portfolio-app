import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */

/** Visual-regression specs (GUARD-02). Only the visual-* projects run them. */
const VISUAL = /visual\/.*\.spec\.ts$/;

/**
 * Snapshot path of the dark baselines. Unused until plan 07-14 (the `dark:`
 * neutralise commit): from then on `visual-light` points its
 * `expect.toHaveScreenshot.pathTemplate` here, so the light run asserts that
 * light renders identically to dark. Exported so it is not flagged as unused.
 */
export const DARK_PATH =
  '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}-visual-dark{-snapshotSuffix}{ext}';

/**
 * Production server in CI, and locally when PW_PROD is set. Visual baselines
 * are only ever captured from a production build.
 */
const prod = !!process.env.CI || !!process.env.PW_PROD;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000, // 30 seconds per test
  /* A missing baseline fails a CI run instead of being written silently.
   * Baselines are regenerated only by the "Update visual baselines" workflow. */
  updateSnapshots: process.env.CI ? 'none' : 'missing',
  expect: {
    // Zero tolerance: default threshold, no maxDiffPixels.
    toHaveScreenshot: { animations: 'disabled', caret: 'hide' },
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      testIgnore: VISUAL,
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      testIgnore: VISUAL,
      grepInvert: /@chromium-only/,
      use: { ...devices['Desktop Firefox'] },
    },

    // Webkit skipped in CI — Playwright's Linux webkit build has known issues
    // with client-side navigation, form validation, modals, and WebGL.
    // Run locally on macOS for real Safari coverage.
    ...(!process.env.CI ? [{
      name: 'webkit',
      testIgnore: VISUAL,
      use: { ...devices['Desktop Safari'] },
    }] : []),

    // Visual regression (GUARD-02). Baselines are -linux.png files captured in
    // mcr.microsoft.com/playwright:v<lockfile version>-noble; see e2e/visual/README.md.
    {
      name: 'visual-dark',
      testMatch: VISUAL,
      retries: 0,
      use: { ...devices['Desktop Chrome'], colorScheme: 'dark', serviceWorkers: 'block' },
    },
    {
      name: 'visual-light',
      testMatch: VISUAL,
      retries: 0,
      use: { ...devices['Desktop Chrome'], colorScheme: 'light', serviceWorkers: 'block' },
      // From plan 07-14 on (light must equal dark):
      // expect: { toHaveScreenshot: { pathTemplate: DARK_PATH } },
    },
  ],

  /* Run a server before starting the tests.
   * Production build in CI (and with PW_PROD) to avoid HMR WebSocket
   * connections that prevent 'networkidle' from ever resolving, and so that
   * screenshots match what ships. Dev server otherwise. */
  webServer: {
    command: prod ? 'npm run build && npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !prod,
    timeout: prod ? 240000 : 120000, // 4 min for build+start, 2 min for dev
  },
});
