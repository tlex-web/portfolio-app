import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */

/** Visual-regression specs (GUARD-02). Only the visual-* projects run them. */
const VISUAL = /visual\/.*\.spec\.ts$/;

/**
 * HOME-08 lab measurement (plan 07-26). On demand only: the `perf` project
 * runs it from the "Update visual baselines" workflow (suite perf), never in
 * the functional or visual runs.
 */
const PERF = /perf\/.*\.spec\.ts$/;

/**
 * Snapshot path of the dark baselines, active since build step 8a (plan 07-14,
 * the `dark:` neutralise commit): `visual-light` points its
 * `expect.toHaveScreenshot.pathTemplate` here, so the light run asserts that
 * light renders identically to dark. No light PNGs exist any more.
 */
export const DARK_PATH =
  '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}-visual-dark{-snapshotSuffix}{ext}';

/**
 * Near-zero tolerance: no maxDiffPixels and a per-pixel colour tolerance of
 * 0.01, which only absorbs the +/-1 anti-aliasing noise Chromium leaves on some
 * edges. The default threshold (0.2) let 07-09's amber -> caution stop pass.
 * Shared, because a project-level `expect` replaces the top-level one whole
 * (Playwright takeFirst), so visual-light must spread it in again.
 */
const SCREENSHOT = { animations: 'disabled', caret: 'hide', threshold: 0.01 } as const;

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
  expect: { toHaveScreenshot: SCREENSHOT },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      testIgnore: [VISUAL, PERF],
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      testIgnore: [VISUAL, PERF],
      grepInvert: /@chromium-only/,
      use: { ...devices['Desktop Firefox'] },
    },

    // Webkit skipped in CI — Playwright's Linux webkit build has known issues
    // with client-side navigation, form validation, modals, and WebGL.
    // Run locally on macOS for real Safari coverage.
    ...(!process.env.CI ? [{
      name: 'webkit',
      testIgnore: [VISUAL, PERF],
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
      // Light must equal dark (DSGN-05): compare against the visual-dark PNGs.
      expect: { toHaveScreenshot: { ...SCREENSHOT, pathTemplate: DARK_PATH } },
    },

    // HOME-08 baseline (plan 07-26). The spec opens its own Pixel 7 contexts
    // with CPU and network throttling; record it only in the Playwright
    // container (e2e/perf/home-baseline.json is committed by hand).
    {
      name: 'perf',
      testMatch: PERF,
      retries: 0,
      use: { ...devices['Desktop Chrome'], serviceWorkers: 'block' },
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
