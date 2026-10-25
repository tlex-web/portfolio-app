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
 * Since 09-15 that includes 'context loss falls back to the poster' (WR-02: a
 * decline would race its loseContext()) and the hidden-tab burst test (WR-01).
 * Only the tests about the budget keep the real one: 'records the frame-budget
 * verdict' and 'a slow device declines to the poster', which proves the real
 * decline path (lib/__tests__/frame-budget-policy.test.ts).
 */
export async function budgetMeasureOnly(page: Page) {
  await page.addInitScript(() => {
    (window as Window & { __ascentBudgetMeasureOnly?: boolean }).__ascentBudgetMeasureOnly = true;
  });
}

/** What holdFramesWhileHidden exposes as `window.__tab`. */
export type HiddenTab = {
  /** performance.now() when the model hid the tab, or null before. */
  hiddenAt: number | null;
  /** performance.now() when show() made the tab visible again, or null before. */
  shownAt: number | null;
  /** window.__draws at the start of the first frame in '3d' (null without countDraws). */
  drawsAt3dStart: number | null;
  /** The animation-frame callbacks held while hidden (released by show()). */
  held: number;
  /** Makes the tab visible again, then runs every held callback in one frame. */
  show: () => void;
};

/**
 * A background tab the way Chromium has one, for every page load in this
 * page's context (G-09-5, 09-REVIEW WR-01; .planning/debug/hidden-tab-burst-decline.md).
 *
 * Why a page-side model: Playwright enables focus emulation on every page, so
 * CDP Page.setWebLifecycleState frozen and a second tab with bringToFront
 * leave this page visible with its frames running (debug "Eliminated",
 * 16:20). setVisibility in home-canvas.spec.ts fakes only the flag, and a
 * frame still runs while 'hidden', so it cannot show a bug that needs no frame
 * to run during the pause.
 *
 * The model: requestAnimationFrame and cancelAnimationFrame are wrapped. Every
 * callback is scheduled on the native requestAnimationFrame through a
 * trampoline; a trampoline that runs while hidden queues its callback instead
 * of calling it (so a callback requested before the hide is held too). Native
 * frames (distinct rAF timestamps) that start while the stage reads
 * data-ascent-mode '3d' are counted: at the start of the first one, before any
 * of its callbacks, `drawsAt3dStart` records window.__draws (countDraws); at
 * the start of the frame that would exceed `hideAfterFrames`, before any of
 * its callbacks, the tab hides: document.visibilityState reads 'hidden' and
 * document.hidden true, 'visibilitychange' is dispatched and `hiddenAt`
 * recorded. It hides once.
 *
 * window.__tab.show() makes the tab visible, dispatches 'visibilitychange',
 * records `shownAt` and then requests one native frame that releases the hold
 * and runs every queued callback with that frame's timestamp, in queue order:
 * Chromium fires visibilitychange before the held frame (debug Resolution).
 * Test-only: product code reads none of it (T-09-26).
 */
export async function holdFramesWhileHidden(
  page: Page,
  { hideAfterFrames }: { hideAfterFrames: number }
) {
  await page.addInitScript((limit) => {
    const w = window as unknown as { __tab: HiddenTab; __draws?: number };
    const nativeRequest = window.requestAnimationFrame.bind(window);
    const nativeCancel = window.cancelAnimationFrame.bind(window);
    let hidden = false;
    let lastStamp: number | null = null;
    let counted = 0;
    const queue: { id: number; callback: FrameRequestCallback }[] = [];

    const setVisibility = (value: 'hidden' | 'visible') => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value });
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => value === 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    };

    const tab: HiddenTab = {
      hiddenAt: null,
      shownAt: null,
      drawsAt3dStart: null,
      held: 0,
      show() {
        setVisibility('visible');
        tab.shownAt = performance.now();
        nativeRequest((time) => {
          hidden = false;
          lastStamp = time;
          const release = queue.splice(0);
          tab.held = 0;
          for (const { callback } of release) callback(time);
        });
      },
    };
    w.__tab = tab;

    /** Runs once per native frame, before the first callback of that frame. */
    const frameStart = (time: number) => {
      if (time === lastStamp) return;
      lastStamp = time;
      if (hidden || tab.hiddenAt !== null) return;
      const mode = document.querySelector('[data-ascent-stage]')?.getAttribute('data-ascent-mode');
      if (mode !== '3d') return;
      counted++;
      if (counted === 1) tab.drawsAt3dStart = typeof w.__draws === 'number' ? w.__draws : null;
      if (counted > limit) {
        hidden = true;
        setVisibility('hidden');
        tab.hiddenAt = performance.now();
      }
    };

    window.requestAnimationFrame = (callback) => {
      const id: number = nativeRequest((time) => {
        frameStart(time);
        if (hidden) {
          queue.push({ id, callback });
          tab.held = queue.length;
          return;
        }
        callback(time);
      });
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      const index = queue.findIndex((entry) => entry.id === id);
      if (index >= 0) {
        queue.splice(index, 1);
        tab.held = queue.length;
      } else nativeCancel(id);
    };
  }, hideAfterFrames);
}

/** The number of WebGL2 draw calls since the page loaded (needs countDraws). */
export function readDraws(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __draws: number }).__draws);
}
