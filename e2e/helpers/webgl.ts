import { expect, type Page } from '@playwright/test';

/**
 * Shared WebGL test helpers (moved unchanged from e2e/no-webgl.spec.ts in
 * 09-06; 09-RESEARCH Pitfall 3).
 *
 * `disableWebGL` makes every WebGL context request return null through an init
 * script, so a check behaves the same in every browser and Home stays on its
 * poster path (static-capability mode) in progress and visual specs.
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
