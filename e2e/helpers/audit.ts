import type { APIRequestContext, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * The audit gate's probes (D-20, VERIFY-02, VERIFY-04), shared by e2e/audit.spec.ts.
 *
 * - CSP: the `securitypolicyviolation` DOM event, recorded by an init script.
 *   It fires in every engine, so the check never depends on console wording.
 * - Layout shift: `layout-shift` entries summed without recent input, through a
 *   buffered PerformanceObserver. Only Chromium has the API; elsewhere the sum
 *   stays `null` and the spec asserts nothing.
 * - Console: messages of type `error` only (warnings are not collected) and
 *   page errors. `ALLOWED_CONSOLE` is the only exception list.
 * - Images: any image response with status >= 400.
 * - Links: every same-origin `a[href]` (hash removed) and every `img` / `source`
 *   src and srcset URL, requested once per worker and failed at status >= 400.
 */

export type Engine = 'chromium' | 'firefox' | 'webkit';

/** One allowed console error: the engine that prints it and its exact wording. */
export interface AllowedConsole {
  engine: Engine;
  /** Matched against `<message text> @ <source url>`. */
  pattern: RegExp;
}

/**
 * The Vercel Analytics and Speed Insights loaders exist only on Vercel's edge.
 * Under `next start` (CI's production server and every local PW_PROD run),
 * /_vercel/insights/script.js and /_vercel/speed-insights/script.js answer 404,
 * and each engine reports that refused script in its own words. There is one
 * pattern per engine, anchored at both ends; every alternative in it names one
 * of those two loader URLs on the test server and nothing else. Never add a
 * broader pattern, and never add an entry for anything but these loaders.
 */
const LOADER = String.raw`http://localhost:3000/_vercel/(?:speed-)?insights/script\.js`;

export const ALLOWED_CONSOLE: ReadonlyArray<AllowedConsole> = [
  // Chromium (Vercel loaders under next start): the network 404 of the loader
  // (first run of this spec, Windows), and the strict-MIME refusal of its 404
  // body that Chromium prints in the CI container, where the body is text/html
  // (wording from e2e/home-canvas.spec.ts OFF_VERCEL_ANALYTICS_404).
  {
    engine: 'chromium',
    pattern: new RegExp(
      String.raw`^(?:Failed to load resource: the server responded with a status of 404 \(Not Found\) @ ${LOADER}` +
        String.raw`|Refused to execute script from '${LOADER}' because its MIME type \('[^']*'\) is not executable, and strict MIME type checking is enabled\. @ \S*)$`,
    ),
  },
  // Firefox (Vercel loaders under next start): the nosniff MIME block of the
  // loader's 404 body, reported against the page (first run of this spec).
  {
    engine: 'firefox',
    pattern: new RegExp(
      String.raw`^\[JavaScript Error: "The resource from “${LOADER}” was blocked due to MIME type \(“[^”]*”\) mismatch \(X-Content-Type-Options: nosniff\)\." \{file: "[^"]*" line: 0\}\] @ \S*$`,
    ),
  },
  // WebKit (Vercel loaders under next start): the network 404 of the loader and
  // the nosniff refusal of its 404 body (first run of this spec, Windows).
  {
    engine: 'webkit',
    pattern: new RegExp(
      String.raw`^(?:Failed to load resource: the server responded with a status of 404 \(Not Found\) @ ${LOADER}` +
        String.raw`|Refused to execute ${LOADER} as script because "X-Content-Type-Options: nosniff" was given and its Content-Type is not a script MIME type\. @ \S*)$`,
    ),
  },
];

/** Init script: CSP violations and (Chromium) the layout-shift sum, per document. */
export async function installAuditProbes(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __auditCsp: string[]; __auditCls: number | null };
    w.__auditCsp = [];
    w.__auditCls = null;
    document.addEventListener('securitypolicyviolation', (event) => {
      w.__auditCsp.push(
        `${event.effectiveDirective} blocked ${event.blockedURI || '(inline)'} at ${
          event.sourceFile || '(document)'
        }:${event.lineNumber}`,
      );
    });
    if (
      typeof PerformanceObserver !== 'undefined' &&
      PerformanceObserver.supportedEntryTypes?.includes('layout-shift')
    ) {
      w.__auditCls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!shift.hadRecentInput) w.__auditCls = (w.__auditCls ?? 0) + shift.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    }
  });
}

/** What the init script recorded in the current document. */
export async function readProbes(page: Page): Promise<{ csp: string[]; cls: number | null }> {
  return page.evaluate(() => {
    const w = window as unknown as { __auditCsp?: string[]; __auditCls?: number | null };
    return { csp: [...(w.__auditCsp ?? [])], cls: w.__auditCls ?? null };
  });
}

export interface Failures {
  console: string[];
  pageErrors: string[];
  images: string[];
}

function engineOf(page: Page): Engine {
  return (page.context().browser()?.browserType().name() ?? 'chromium') as Engine;
}

/**
 * Attaches the console (errors only, minus ALLOWED_CONSOLE), pageerror and
 * image-response listeners. The returned arrays fill as the page runs; empty
 * them between steps with `clearFailures`.
 */
export function collectFailures(page: Page): Failures {
  const engine = engineOf(page);
  const allowed = ALLOWED_CONSOLE.filter((entry) => entry.engine === engine);
  const failures: Failures = { console: [], pageErrors: [], images: [] };

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const line = `${message.text()} @ ${message.location().url}`;
    if (allowed.some((entry) => entry.pattern.test(line))) return;
    failures.console.push(line);
  });
  page.on('pageerror', (error) => {
    failures.pageErrors.push(`${error.name}: ${error.message}`);
  });
  page.on('response', (response) => {
    if (response.request().resourceType() === 'image' && response.status() >= 400) {
      failures.images.push(`${response.status()} ${response.url()}`);
    }
  });

  return failures;
}

export function clearFailures(failures: Failures): void {
  failures.console.length = 0;
  failures.pageErrors.length = 0;
  failures.images.length = 0;
}

/**
 * Fonts loaded, the full height scrolled once in half-viewport steps (so every
 * entrance and lazy image has fired), back at the top, and every finite
 * animation finished, so axe measures final colours and opacities.
 */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight / 2));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((resolve) => setTimeout(resolve, 80));
    window.scrollTo(0, 0);
  });
  await page.evaluate(async () => {
    const deadline = performance.now() + 5000;
    const running = () =>
      document.getAnimations().filter((animation) => {
        if (animation.playState !== 'running') return false;
        const iterations = animation.effect?.getComputedTiming().iterations;
        return iterations !== Infinity;
      });
    while (running().length > 0 && performance.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

/** axe's default rule set; returns the violations as readable lines and the region-rule proof. */
export async function runAxe(page: Page): Promise<{ violations: string[]; regionRan: boolean }> {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.flatMap((rule) =>
    rule.nodes.map(
      (node) =>
        `${rule.id} (${rule.impact ?? 'n/a'}) ${node.target.join(' ')} :: ${
          node.failureSummary?.replace(/\s+/g, ' ') ?? rule.help
        }`,
    ),
  );
  // 'region' is a best-practice rule: seeing it proves the default run is not WCAG-only.
  const regionRan = [...results.passes, ...results.inapplicable].some((rule) => rule.id === 'region');
  return { violations, regionRan };
}

/**
 * Requests every same-origin link and image URL on the page that `seen` does
 * not hold yet, and returns those answering with status >= 400. `mailto:`,
 * `tel:` and external hosts are skipped by the origin check.
 */
export async function checkLinks(
  page: Page,
  request: APIRequestContext,
  seen: Set<string>,
): Promise<string[]> {
  const urls = await page.evaluate(() => {
    const found = new Set<string>();
    const add = (raw: string | null) => {
      if (!raw) return;
      let url: URL;
      try {
        url = new URL(raw, document.baseURI);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;
      url.hash = '';
      found.add(url.href);
    };
    for (const anchor of document.querySelectorAll('a[href]')) add(anchor.getAttribute('href'));
    for (const el of document.querySelectorAll('img[src], img[srcset], source[srcset]')) {
      add(el.getAttribute('src'));
      for (const candidate of (el.getAttribute('srcset') ?? '').split(',')) {
        add(candidate.trim().split(/\s+/)[0] || null);
      }
    }
    return [...found];
  });

  const fresh = urls.filter((url) => !seen.has(url));
  for (const url of fresh) seen.add(url);

  const broken: string[] = [];
  const BATCH = 8;
  for (let i = 0; i < fresh.length; i += BATCH) {
    const batch = fresh.slice(i, i + BATCH);
    const statuses = await Promise.all(
      batch.map(async (url) => {
        const response = await request.get(url, { failOnStatusCode: false, timeout: 20000 });
        const status = response.status();
        await response.dispose();
        return status;
      }),
    );
    statuses.forEach((status, index) => {
      if (status >= 400) broken.push(`${status} ${batch[index]}`);
    });
  }
  return broken;
}
