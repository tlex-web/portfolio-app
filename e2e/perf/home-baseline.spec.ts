import fs from 'fs';
import path from 'path';
import { test, expect, devices, type Page } from '@playwright/test';

/**
 * HOME-08 lab measurement (plan 07-26, build step 10; extended in 09-09).
 *
 * Measures Home on an emulated Pixel 7 with 4x CPU slowdown and a
 * ~1.6 Mbps / 150 ms network, in fresh contexts (cold cache each), and
 * records the medians of:
 *   - LCP (last `largest-contentful-paint` entry)
 *   - transferred and decoded script bytes (`resource` entries whose
 *     initiatorType is `script`) at load + 3 s: the Phase 7 fields
 *     `jsTransferBytes` / `jsDecodedBytes`, kept for continuity
 *   - since 09-09, the bytes of the lazy ascent canvas chunk as well
 *     (09-RESEARCH Pitfall 8): after the legacy sample the run waits for the
 *     stage's `data-ascent-mode` to settle ('3d', 'static' or
 *     'static-reduced', at most 20 s) and records it as `mode`; in '3d' it
 *     waits for the 'ascent-canvas-ready' mark (`canvasReadyMs`, else null),
 *     in a static mode for 10 s; then `initialJsTransferBytes` sums the
 *     scripts that started before the load event and `totalJsTransferBytes`
 *     sums every script. `lateScripts` lists the last run's scripts that
 *     started at or after the load event, and `scriptTimeline` every script
 *     of the last run with its start time. When the stage arms before the
 *     load event, the lazy chunk holds that event back and counts as initial
 *     (empty `lateScripts`); the timeline still shows it.
 *
 * Run only through the `perf` project, in the Playwright container:
 *   Actions -> "Update visual baselines" -> suite `perf`
 * The JSON is written to HOME08_OUT (default test-results/home-baseline.json);
 * e2e/perf/home-baseline.json is the CI-recorded copy, committed by hand.
 * `next start` gzips while Vercel serves brotli, so Phase 9 must compare
 * against this file in the same container with the same profile.
 * HOME08_RUNS (default 5) lets a local structural run take one sample;
 * recorded baselines always use the default.
 */

const RUNS = Number(process.env.HOME08_RUNS ?? 5);
const PROFILE = {
  device: 'Pixel 7',
  cpuSlowdown: 4,
  latencyMs: 150,
  downloadBps: 1.6e6 / 8, // 200000 bytes/s
  uploadBps: 750e3 / 8, // 93750 bytes/s
} as const;
const SETTLE_MS = 3000;
/** Longest wait for the stage to leave 'pending' / 'eligible'. */
const MODE_TIMEOUT_MS = 20_000;
/** Longest wait for the 'ascent-canvas-ready' mark once the stage reads '3d'. */
const CANVAS_READY_TIMEOUT_MS = 10_000;
/** Extra wait in a static mode before the script bytes are summed. */
const STATIC_WAIT_MS = 10_000;
const SETTLED_MODES = ['3d', 'static', 'static-reduced'];

interface Sample {
  lcpMs: number;
  jsTransferBytes: number;
  jsDecodedBytes: number;
  /** The stage's data-ascent-mode once settled, or whatever it read after MODE_TIMEOUT_MS. */
  mode: string;
  /** Scripts whose startTime is below the navigation entry's loadEventStart. */
  initialJsTransferBytes: number;
  /** Every script, after the canvas is ready (or after STATIC_WAIT_MS in a static mode). */
  totalJsTransferBytes: number;
  /** startTime of the 'ascent-canvas-ready' mark, or null when it never came. */
  canvasReadyMs: number | null;
  /**
   * The navigation entry's loadEventStart: the initial/late boundary. A chunk
   * the stage arms before the load event (requestIdleCallback can fire while
   * images still load) holds that event back and counts as initial.
   */
  loadEventStartMs: number;
}

interface LateScript {
  name: string;
  transferSize: number;
  startTime: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Waits for a settled ascent mode (at most MODE_TIMEOUT_MS) and returns what the stage reads. */
async function settledMode(page: Page): Promise<string> {
  try {
    const handle = await page.waitForFunction(
      (settled) => {
        const mode = document
          .querySelector('[data-ascent-stage]')
          ?.getAttribute('data-ascent-mode');
        return mode && settled.includes(mode) ? mode : null;
      },
      SETTLED_MODES,
      { timeout: MODE_TIMEOUT_MS, polling: 100 },
    );
    return (await handle.jsonValue()) as string;
  } catch {
    const mode = await page
      .locator('[data-ascent-stage]')
      .first()
      .getAttribute('data-ascent-mode', { timeout: 1000 })
      .catch(() => null);
    return mode ?? 'missing';
  }
}

/** The 'ascent-canvas-ready' mark's startTime, or null after CANVAS_READY_TIMEOUT_MS. */
async function canvasReady(page: Page): Promise<number | null> {
  try {
    const handle = await page.waitForFunction(
      () => performance.getEntriesByName('ascent-canvas-ready', 'mark')[0]?.startTime ?? null,
      undefined,
      { timeout: CANVAS_READY_TIMEOUT_MS, polling: 100 },
    );
    return (await handle.jsonValue()) as number;
  } catch {
    return null;
  }
}

test('home mobile LCP + JS bytes', async ({ browser }, testInfo) => {
  expect(Number.isInteger(RUNS) && RUNS > 0, `HOME08_RUNS must be a positive integer`).toBe(true);
  test.setTimeout(RUNS * 90_000 + 60_000);
  const baseURL = testInfo.project.use.baseURL ?? 'http://localhost:3000';
  const samples: Sample[] = [];
  let lateScripts: LateScript[] = [];
  let scriptTimeline: LateScript[] = [];

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

      // Phase 7 sample, unchanged: LCP and script bytes at load + 3 s.
      const legacy = await page.evaluate(
        () =>
          new Promise<{ lcpMs: number; jsTransferBytes: number; jsDecodedBytes: number }>(
            (resolve) => {
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
            },
          ),
      );

      // Phase 9: let the ascent finish loading what it loads, then count it.
      const mode = await settledMode(page);
      let canvasReadyMs: number | null = null;
      if (mode === '3d') canvasReadyMs = await canvasReady(page);
      else if (mode === 'static' || mode === 'static-reduced') {
        await page.waitForTimeout(STATIC_WAIT_MS);
      }

      const bytes = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as
          | PerformanceNavigationTiming
          | undefined;
        const loadStart = nav?.loadEventStart ?? 0;
        const scripts = (
          performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        ).filter((entry) => entry.initiatorType === 'script');
        const describe = (entry: PerformanceResourceTiming) => ({
          name: new URL(entry.name).pathname,
          transferSize: entry.transferSize,
          startTime: Math.round(entry.startTime),
        });
        return {
          loadStart: Math.round(loadStart),
          initial: scripts
            .filter((entry) => entry.startTime < loadStart)
            .reduce((sum, entry) => sum + entry.transferSize, 0),
          total: scripts.reduce((sum, entry) => sum + entry.transferSize, 0),
          late: scripts.filter((entry) => entry.startTime >= loadStart).map(describe),
          timeline: scripts.map(describe),
        };
      });

      samples.push({
        ...legacy,
        mode,
        initialJsTransferBytes: bytes.initial,
        totalJsTransferBytes: bytes.total,
        canvasReadyMs: canvasReadyMs === null ? null : Math.round(canvasReadyMs),
        loadEventStartMs: bytes.loadStart,
      });
      lateScripts = bytes.late;
      scriptTimeline = bytes.timeline;
    } finally {
      await context.close();
    }
  }

  for (const [i, s] of samples.entries()) {
    expect(Number.isFinite(s.lcpMs) && s.lcpMs > 0, `run ${i + 1}: LCP ${s.lcpMs}`).toBe(true);
    expect(s.jsTransferBytes, `run ${i + 1}: transferred script bytes`).toBeGreaterThan(0);
    expect(s.jsDecodedBytes, `run ${i + 1}: decoded script bytes`).toBeGreaterThan(0);
    expect(
      s.totalJsTransferBytes,
      `run ${i + 1}: total script bytes cover the initial ones`,
    ).toBeGreaterThanOrEqual(s.initialJsTransferBytes);
  }

  const configDir = testInfo.config.configFile
    ? path.dirname(testInfo.config.configFile)
    : process.cwd();
  const playwrightVersion = JSON.parse(
    fs.readFileSync(path.join(configDir, 'node_modules/@playwright/test/package.json'), 'utf-8'),
  ).version as string;

  const readyTimes = samples
    .map((s) => s.canvasReadyMs)
    .filter((ms): ms is number => ms !== null);
  const result = {
    lcpMs: median(samples.map((s) => s.lcpMs)),
    jsTransferBytes: median(samples.map((s) => s.jsTransferBytes)),
    jsDecodedBytes: median(samples.map((s) => s.jsDecodedBytes)),
    initialJsTransferBytes: median(samples.map((s) => s.initialJsTransferBytes)),
    totalJsTransferBytes: median(samples.map((s) => s.totalJsTransferBytes)),
    canvasReadyMs: readyTimes.length > 0 ? median(readyTimes) : null,
    modes: samples.map((s) => s.mode),
    runs: RUNS,
    samples,
    lateScripts,
    scriptTimeline,
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
    `HOME-08: LCP ${result.lcpMs.toFixed(0)} ms, JS ${result.jsTransferBytes} B transferred / ${result.jsDecodedBytes} B decoded at load + 3 s; ` +
      `initial ${result.initialJsTransferBytes} B, total ${result.totalJsTransferBytes} B, ` +
      `canvas ready ${result.canvasReadyMs ?? 'n/a'} ms, modes ${result.modes.join(',')}, ` +
      `${lateScripts.length} late scripts -> ${out}`,
  );
});
