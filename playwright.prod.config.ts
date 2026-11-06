import { defineConfig, devices } from '@playwright/test';
import { site } from './data/site';

/**
 * Tests that run against the deployed production site, never in CI: see
 * e2e/prod/contact-form.prod.ts for what each one costs. The file name
 * (*.prod.ts) keeps them out of the default config's test match, and this config
 * starts no server. No retries and one worker: a retry could send a second real
 * email, and the rate limiter counts every request from this IP.
 */
export default defineConfig({
  testDir: './e2e/prod',
  testMatch: '**/*.prod.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: 'list',
  timeout: 60000,
  outputDir: 'test-results/prod',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.PROD_URL ?? site.url,
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
  },
});
