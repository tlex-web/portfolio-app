import { expect, type Page } from '@playwright/test';

/**
 * Shared WebGL test helpers (moved unchanged from e2e/no-webgl.spec.ts in
 * 09-06; 09-RESEARCH Pitfall 3).
 *
 * `disableWebGL` makes every WebGL context request return null through an init
 * script, so a check behaves the same in every browser and Home stays on its
 * poster path (static-capability mode) in progress and visual specs.
 * `spoofSaveData` and `spoofDeviceMemory` (09-07) trigger the other two static
 * modes of the capability gate. `countDraws` and `readDraws` (09-11) count
 * WebGL2 draw calls, the proof that the canvas renders on demand and pauses
 * off-screen (HOME-07). `budgetMeasureOnly` (09-11, extended in 09-14) keeps
 * a frame-budget decline from acting, for the 3D tests that are not about the
 * budget.
 */

/** Switches WebGL off for every page load in this page's context. */
export async function disableWebGL(page: Page) {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error -- overriding the overloaded DOM signature with one implementation
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type.startsWith('webgl') || type === 'experimental-webgl') return null;
      return (getContext as (...args: unknown[]) => RenderingContext | null).call(
        this,
        type,
        ...rest
      );
    };
  });
}

/**
 * Reports Save-Data (`navigator.connection.saveData === true`) for every page
 * load in this page's context, the way Chromium does when the visitor turns on
 * a data saver. Defined in Firefox too, so the static path runs everywhere.
 */
export async function spoofSaveData(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        saveData: true,
        effectiveType: '4g',
        addEventListener() {},
        removeEventListener() {},
      },
    });
  });
}

/** Reports `navigator.deviceMemory` as `gb` for every page load in this page's context. */
export async function spoofDeviceMemory(page: Page, gb: number) {
  await page.addInitScript((value) => {
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value });
  }, gb);
}

/** Resolves once three.js has logged that it could not create a WebGL context. */
export function webglFailure(page: Page) {
  return page.waitForEvent('console', {
    predicate: (msg) =>
      msg.type() === 'error' && msg.text().includes('Error creating WebGL context'),
    timeout: 15000,
  });
}

/** Waits `count` animation frames (two by default: lets React commit what a frame scheduled). */
export async function nextFrames(page: Page, count = 2) {
  await page.evaluate(
    (n) =>
      new Promise<void>((resolve) => {
        const step = (left: number) =>
          left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1));
        step(n);
      }),
    count
  );
}

/** Asserts the route did not fall back to app/(site)/error.tsx. */
export async function expectNoErrorPage(page: Page) {
  await expect(page.getByRole('heading', { name: /Something went wrong/i })).toHaveCount(0);
}

/**
 * Counts every WebGL2 draw call (drawElements and drawArrays) into
 * `window.__draws`, for every page load in this page's context. One rendered
 * terrain frame is one draw or more; a canvas at rest adds none.
 */
export async function countDraws(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __draws: number };
    w.__draws = 0;
    if (typeof WebGL2RenderingContext !== 'function') return;
    const proto = WebGL2RenderingContext.prototype as unknown as Record<
      'drawElements' | 'drawArrays',
      (...args: unknown[]) => void
    >;
    for (const name of ['drawElements', 'drawArrays'] as const) {
      const original = proto[name];
      proto[name] = function (this: WebGL2RenderingContext, ...args: unknown[]) {
        w.__draws++;
        return original.apply(this, args);
      };
    }
  });
}

/**
 * Puts the frame budget in measure-only mode for every page load in this
 * page's context (Tim's 09-11 option A): CameraRig still runs the reveal burst
 * and marks every 'ascent-frame-budget' verdict, but a decline changes nothing,
 * so the canvas stays in '3d'. For every test that needs 3D (Tim's 09-13 B1
 * extended it from the desktop sizes, where local SwiftShader's 512² frames run
 * above the 50 ms budget, to 412 x 839, where CI's verdict is noise around it).
 * Only the tests about the budget keep the real one: 'records the frame-budget
 * verdict' and 'a slow device declines to the poster', which proves the real
 * decline path (lib/__tests__/frame-budget-policy.test.ts).
 */
export async function budgetMeasureOnly(page: Page) {
  await page.addInitScript(() => {
    (window as Window & { __ascentBudgetMeasureOnly?: boolean }).__ascentBudgetMeasureOnly = true;
  });
}

/** The number of WebGL2 draw calls since the page loaded (needs countDraws). */
export function readDraws(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __draws: number }).__draws);
}
