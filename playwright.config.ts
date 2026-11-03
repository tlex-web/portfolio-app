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

/**
 * Local opt-in for per-task checks (12-VALIDATION "Execution notes"): with
 * PW_PROD=1 PW_REUSE=1, Playwright uses the production server already
 * answering on port 3000 (started from `npm run build` then `npm run start`)
 * and builds only when none answers. Ignored whenever CI is set, so CI and the
 * visual-baseline workflow always build fresh; a reused run never writes a
 * snapshot (the server may be serving an older build).
 */
const reuse = !process.env.CI && !!process.env.PW_REUSE;

/**
 * @prod-only tests need a production build (the service worker registers only
 * there; e2e/service-worker.spec.ts). Dev-server runs drop them from the list
 * instead of skipping them (test-count.mjs rejects skips); production runs keep
 * today's filters. The tag's second reason is a test that breaks under
 * dev-server on-demand compiles: e2e/design-system.spec.ts G3, whose intercepted
 * modal route compiles mid-click on `next dev`.
 */
const CHROMIUM_INVERT = prod ? undefined : /@prod-only/;
const OTHER_ENGINE_INVERT = prod ? /@chromium-only/ : /@chromium-only|@prod-only/;

/**
 * WebKit-only exclusions (12-23, D-18); Chromium and Firefox keep every one.
 * Each tagged title has a comment above it naming the reason, and
 * 12-23-SUMMARY.md lists them.
 * - @needs-tab-to-links: every step is a Tab press onto a link, which WebKit
 *   on Windows and macOS never does (Safari's default; e2e/helpers/engine.ts).
 *   Linux WebKit, which CI runs, Tabs to links and keeps them.
 * - @no-win-webkit: Playwright's Windows WebKit (WinCairo) only; Linux WebKit
 *   runs them in CI.
 * - @no-linux-webkit: Linux WebKit (CI) only; Windows WebKit runs them.
 */
const WEBKIT_PLATFORM_TAGS = {
  win32: ['@needs-tab-to-links', '@no-win-webkit'],
  darwin: ['@needs-tab-to-links'],
  linux: ['@no-linux-webkit'],
}[process.platform as string] ?? ['@needs-tab-to-links'];
const WEBKIT_INVERT = new RegExp(
  ['@chromium-only', ...WEBKIT_PLATFORM_TAGS, ...(prod ? [] : ['@prod-only'])].join('|')
);

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
  updateSnapshots: process.env.CI || reuse ? 'none' : 'missing',
  expect: { toHaveScreenshot: SCREENSHOT },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Functional projects block the production service worker, so page.route
    // sees every request (12-RESEARCH Pitfall 6); only a dedicated service-worker
    // test opts back in, with test.use({ serviceWorkers: 'allow' }).
    {
      name: 'chromium',
      testIgnore: [VISUAL, PERF],
      grepInvert: CHROMIUM_INVERT,
      use: { ...devices['Desktop Chrome'], serviceWorkers: 'block' },
    },

    {
      name: 'firefox',
      testIgnore: [VISUAL, PERF],
      grepInvert: OTHER_ENGINE_INVERT,
      use: { ...devices['Desktop Firefox'], serviceWorkers: 'block' },
    },

    // Defined in every environment. CI runs it with chromium and firefox under
    // --fail-on-flaky-tests (D-18, 12-23): a test that passes only on a retry
    // fails the run, so the retries below never hide a flake.
    {
      name: 'webkit',
      testIgnore: [VISUAL, PERF],
      grepInvert: WEBKIT_INVERT,
      use: { ...devices['Desktop Safari'], serviceWorkers: 'block' },
    },

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
    reuseExistingServer: !prod || reuse,
    timeout: prod ? 240000 : 120000, // 4 min for build+start, 2 min for dev
  },
});
