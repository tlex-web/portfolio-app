import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import {
  checkLinks,
  clearFailures,
  collectFailures,
  installAuditProbes,
  readProbes,
  runAxe,
  settle,
  type Failures,
} from './helpers/audit';

/**
 * The audit gate (D-20, VERIFY-02, VERIFY-04): on the production build, a page
 * fails on any axe violation (default rule set), CSP violation, console error
 * outside ALLOWED_CONSOLE, page error, image response >= 400, same-origin link
 * or image URL answering >= 400, or (Chromium) cumulative layout shift > 0.1.
 */

/** Links already requested in this worker; each URL is fetched once per run. */
const seen = new Set<string>();

/** The CLS budget (D-20). Never raise it to pass. */
const CLS_BUDGET = 0.1;

/**
 * Runs every check on the page as it stands and returns one line per finding,
 * each prefixed with `label` (route, width or state).
 */
async function audit(
  page: Page,
  request: APIRequestContext,
  failures: Failures,
  browserName: string,
  label: string,
): Promise<string[]> {
  const findings: string[] = [];

  const axe = await runAxe(page);
  findings.push(...axe.violations.map((line) => `${label} axe: ${line}`));
  if (!axe.regionRan) findings.push(`${label} axe: the best-practice 'region' rule did not run`);

  const probes = await readProbes(page);
  findings.push(...probes.csp.map((line) => `${label} CSP: ${line}`));
  if (browserName === 'chromium') {
    if (probes.cls === null) findings.push(`${label} CLS: layout-shift API missing in Chromium`);
    else if (probes.cls > CLS_BUDGET) findings.push(`${label} CLS: ${probes.cls.toFixed(4)} > ${CLS_BUDGET}`);
  }

  findings.push(...failures.console.map((line) => `${label} console: ${line}`));
  findings.push(...failures.pageErrors.map((line) => `${label} pageerror: ${line}`));
  findings.push(...failures.images.map((line) => `${label} image: ${line}`));

  const broken = await checkLinks(page, request, seen);
  findings.push(...broken.map((line) => `${label} link: ${line}`));

  clearFailures(failures);
  return findings;
}

test.describe('Audit (D-20)', () => {
  test('/roadmap @1440: axe, CLS, links, images, CSP, console', async ({
    page,
    request,
    browserName,
  }) => {
    await installAuditProbes(page);
    const failures = collectFailures(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/roadmap', { waitUntil: 'load' });
    await settle(page);

    const findings = await audit(page, request, failures, browserName, '/roadmap @1440');
    expect(findings, findings.join('\n')).toEqual([]);
  });
});
