import fs from 'fs';
import path from 'path';
import { test, expect, devices, type Browser } from '@playwright/test';
import { regionPhotoViews } from '@/lib/regions';

/**
 * Region and photo page LCP, record-only (18-19; 18-RESEARCH "sizes per
 * breakpoint (13 #34) and LCP"). There is no prior number to gate against, so
 * this spec asserts only that every sample measured something; a gate can
 * follow from the next phase, against the first recorded baseline.
 *
 * Same lab profile as HOME-08 (e2e/perf/home-baseline.spec.ts): an emulated
 * Pixel 7 with 4x CPU slowdown and a ~1.6 Mbps / 150 ms network, a fresh
 * context (cold cache) per sample. Per run it loads
 *   - the Zermatt region page, /photos/regions/zermatt, and
 *   - the film-scan photo page (the one Zermatt photo with a film line),
 * and records the last `largest-contentful-paint` entry of each; the medians
 * over the runs are `regionLcpMs` and `photoLcpMs`.
 *
 * On demand only, through the `perf` project, never in the functional or
 * visual runs. 18-29's declared dispatch ("Update visual baselines", suite
 * perf) records the first baseline in the Playwright container. The JSON is
 * written to PHOTO_LCP_OUT (default test-results/photo-baseline.json), attached
 * to the test, and summarised in one 'PHOTO-LCP:' log line.
 * PHOTO_LCP_RUNS (default 5) lets a local structural run take one sample;
 * recorded baselines always use the default (the HOME08_RUNS convention).
 */

const RUNS = Number(process.env.PHOTO_LCP_RUNS ?? 5);
const PROFILE = {
  device: 'Pixel 7',
  cpuSlowdown: 4,
  latencyMs: 150,
  downloadBps: 1.6e6 / 8, // 200000 bytes/s
  uploadBps: 750e3 / 8, // 93750 bytes/s
} as const;
const SETTLE_MS = 3000;

const REGION_PATH = '/photos/regions/zermatt';

/** The film-scan photo: the one Zermatt photo whose strip carries a film line. */
const filmScans = regionPhotoViews('zermatt').filter((v) => v.strip.filmLine);

interface Sample {
  regionLcpMs: number;
  photoLcpMs: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** The last LCP entry's startTime for one cold load of `url` under the profile (NaN if none). */
async function measureLcp(browser: Browser, baseURL: string, url: string): Promise<number> {
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

    await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
    await page.waitForTimeout(SETTLE_MS);
    return await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          // No LCP entry at all resolves NaN, which the assertions below reject.
          const fallback = setTimeout(() => resolve(Number.NaN), 5000);
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length === 0) return;
            clearTimeout(fallback);
            resolve(entries[entries.length - 1].startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        })
    );
  } finally {
    await context.close();
  }
}

test('region and photo page mobile LCP (record-only)', async ({ browser }, testInfo) => {
  expect(Number.isInteger(RUNS) && RUNS > 0, 'PHOTO_LCP_RUNS must be a positive integer').toBe(
    true
  );
  expect(filmScans, 'exactly one Zermatt photo is a film scan').toHaveLength(1);
  test.setTimeout(RUNS * 2 * 60_000 + 60_000);
  const baseURL = testInfo.project.use.baseURL ?? 'http://localhost:3000';
  const photoPath = `/photos/${filmScans[0].slug}`;

  const samples: Sample[] = [];
  for (let run = 0; run < RUNS; run++) {
    const regionLcpMs = await measureLcp(browser, baseURL, REGION_PATH);
    const photoLcpMs = await measureLcp(browser, baseURL, photoPath);
    samples.push({ regionLcpMs, photoLcpMs });
  }

  for (const [i, s] of samples.entries()) {
    expect(
      Number.isFinite(s.regionLcpMs) && s.regionLcpMs > 0,
      `run ${i + 1}: region LCP ${s.regionLcpMs}`
    ).toBe(true);
    expect(
      Number.isFinite(s.photoLcpMs) && s.photoLcpMs > 0,
      `run ${i + 1}: photo LCP ${s.photoLcpMs}`
    ).toBe(true);
  }

  const configDir = testInfo.config.configFile
    ? path.dirname(testInfo.config.configFile)
    : process.cwd();
  const playwrightVersion = JSON.parse(
    fs.readFileSync(path.join(configDir, 'node_modules/@playwright/test/package.json'), 'utf-8')
  ).version as string;

  const result = {
    regionLcpMs: median(samples.map((s) => s.regionLcpMs)),
    photoLcpMs: median(samples.map((s) => s.photoLcpMs)),
    runs: RUNS,
    samples,
    pages: { region: REGION_PATH, photo: photoPath },
    profile: PROFILE,
    commit: process.env.GITHUB_SHA ?? 'local',
    playwrightVersion,
    browserVersion: browser.version(),
    containerTag: process.env.PW_CONTAINER_TAG ?? 'local',
    recordedAt: new Date().toISOString(),
  };

  const out = path.resolve(
    configDir,
    process.env.PHOTO_LCP_OUT ?? 'test-results/photo-baseline.json'
  );
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n', 'utf-8');
  await testInfo.attach('photo-baseline.json', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
  console.log(
    `PHOTO-LCP: region ${result.regionLcpMs.toFixed(0)} ms, photo ${result.photoLcpMs.toFixed(0)} ms ` +
      `(median of ${RUNS}; ${REGION_PATH}, ${photoPath}) -> ${out}`
  );
});
