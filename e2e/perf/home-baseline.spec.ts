import fs from 'fs';
import path from 'path';
import { test, expect, devices } from '@playwright/test';

/**
 * HOME-08 lab baseline (plan 07-26, build step 10).
 *
 * Measures Home on an emulated Pixel 7 with 4x CPU slowdown and a
 * ~1.6 Mbps / 150 ms network, five fresh contexts (cold cache each), and
 * records the medians of:
 *   - LCP (last `largest-contentful-paint` entry)
 *   - transferred and decoded script bytes (`resource` entries whose
 *     initiatorType is `script`)
 *
 * Run only through the `perf` project, in the Playwright container:
 *   Actions -> "Update visual baselines" -> suite `perf`
 * The JSON is written to HOME08_OUT (default test-results/home-baseline.json);
 * e2e/perf/home-baseline.json is the CI-recorded copy, committed by hand.
 * `next start` gzips while Vercel serves brotli, so Phase 9 must compare
 * against this file in the same container with the same profile.
 */

const RUNS = 5;
const PROFILE = {
  device: 'Pixel 7',
  cpuSlowdown: 4,
  latencyMs: 150,
  downloadBps: 1.6e6 / 8, // 200000 bytes/s
  uploadBps: 750e3 / 8, // 93750 bytes/s
} as const;
const SETTLE_MS = 3000;

interface Sample {
  lcpMs: number;
  jsTransferBytes: number;
  jsDecodedBytes: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

test('home mobile LCP + JS bytes', async ({ browser }, testInfo) => {
  test.setTimeout(6 * 60_000);
  const baseURL = testInfo.project.use.baseURL ?? 'http://localhost:3000';
  const samples: Sample[] = [];

  for (let run = 0; run < RUNS; run++) {
    const context = await browser.newContext({
      ...devices[PROFILE.device],
      baseURL,
      serviceWorkers: 'block',
    });
    try {
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: PROFILE.cpuSlowdown });
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: PROFILE.latencyMs,
        downloadThroughput: PROFILE.downloadBps,
        uploadThroughput: PROFILE.uploadBps,
      });

      await page.goto('/', { waitUntil: 'load', timeout: 120_000 });
      await page.waitForTimeout(SETTLE_MS);

      const sample = await page.evaluate(
        () =>
          new Promise<Sample>((resolve) => {
            const scripts = () =>
              (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
                .filter((entry) => entry.initiatorType === 'script')
                .reduce(
                  (sum, entry) => ({
                    transfer: sum.transfer + entry.transferSize,
                    decoded: sum.decoded + entry.decodedBodySize,
                  }),
                  { transfer: 0, decoded: 0 },
                );
            const finish = (lcpMs: number) => {
              const js = scripts();
              resolve({ lcpMs, jsTransferBytes: js.transfer, jsDecodedBytes: js.decoded });
            };
            // No LCP entry at all resolves NaN, which the assertions below reject.
            const fallback = setTimeout(() => finish(Number.NaN), 5000);
            new PerformanceObserver((list) => {
              const entries = list.getEntries();
              if (entries.length === 0) return;
              clearTimeout(fallback);
              finish(entries[entries.length - 1].startTime);
            }).observe({ type: 'largest-contentful-paint', buffered: true });
          }),
      );
      samples.push(sample);
    } finally {
      await context.close();
    }
  }

  for (const [i, s] of samples.entries()) {
    expect(Number.isFinite(s.lcpMs) && s.lcpMs > 0, `run ${i + 1}: LCP ${s.lcpMs}`).toBe(true);
    expect(s.jsTransferBytes, `run ${i + 1}: transferred script bytes`).toBeGreaterThan(0);
    expect(s.jsDecodedBytes, `run ${i + 1}: decoded script bytes`).toBeGreaterThan(0);
  }

  const configDir = testInfo.config.configFile
    ? path.dirname(testInfo.config.configFile)
    : process.cwd();
  const playwrightVersion = JSON.parse(
    fs.readFileSync(path.join(configDir, 'node_modules/@playwright/test/package.json'), 'utf-8'),
  ).version as string;

  const result = {
    lcpMs: median(samples.map((s) => s.lcpMs)),
    jsTransferBytes: median(samples.map((s) => s.jsTransferBytes)),
    jsDecodedBytes: median(samples.map((s) => s.jsDecodedBytes)),
    runs: RUNS,
    samples,
    profile: PROFILE,
    commit: process.env.GITHUB_SHA ?? 'local',
    playwrightVersion,
    browserVersion: browser.version(),
    containerTag: process.env.PW_CONTAINER_TAG ?? 'local',
    recordedAt: new Date().toISOString(),
  };

  const out = path.resolve(configDir, process.env.HOME08_OUT ?? 'test-results/home-baseline.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n', 'utf-8');
  await testInfo.attach('home-baseline.json', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
  console.log(
    `HOME-08: LCP ${result.lcpMs.toFixed(0)} ms, JS ${result.jsTransferBytes} B transferred / ${result.jsDecodedBytes} B decoded -> ${out}`,
  );
});
