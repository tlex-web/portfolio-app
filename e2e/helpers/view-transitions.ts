import { expect, type Page } from '@playwright/test';

/**
 * View Transition test helpers (10-06; LBOX-06; 10-RESEARCH Spike Results,
 * whose probe wrapped document.startViewTransition the same way).
 *
 * `recordViewTransitions` adds an init script that, where the browser has
 * `document.startViewTransition`, wraps it: every call increments
 * `window.__vt.count`, and when the returned transition is `ready` the
 * pseudo-elements that carry a running animation at that moment
 * (`document.getAnimations()` -> `effect.pseudoElement`, for example
 * `::view-transition-group(photo-{slug})`) are pushed to `window.__vt.pseudos`
 * and, per transition, to `window.__vt.transitions`. Finished animations are
 * left out: React itself adds duration-0, fill-forwards animations on
 * `::view-transition-group(root)` and `::view-transition` when the root does
 * not take part, and those move nothing. Where the API is missing
 * the counter stays at 0. `readViewTransitions` returns that record;
 * `removeViewTransitions` deletes the API, to test the instant fallback.
 *
 * `window.__vt.settled` counts the transitions whose `finished` promise has
 * settled (resolved or rejected), so `settled === count` is a positive signal
 * that every transition started so far has run to its end, and its `ready`
 * record is complete. A test samples for an absence only after it holds
 * (`waitForViewTransitionsSettled`), not after a fixed sleep (10-REVIEW IN-09).
 */

export type ViewTransitionRecord = {
  /** startViewTransition calls since the page loaded. */
  count: number;
  /** Every animated pseudo-element seen at `ready`, across all transitions. */
  pseudos: string[];
  /** The same, one list per transition, in call order. */
  transitions: string[][];
  /** Transitions whose `finished` promise has settled. */
  settled: number;
};

type VtWindow = Window & { __vt?: ViewTransitionRecord };

/** Records startViewTransition calls and their animated pseudo-elements for every load in this page. */
export async function recordViewTransitions(page: Page) {
  await page.addInitScript(() => {
    const w = window as VtWindow;
    w.__vt = { count: 0, pseudos: [], transitions: [], settled: 0 };
    const start = document.startViewTransition;
    if (typeof start !== 'function') return;
    document.startViewTransition = function (
      this: Document,
      ...args: Parameters<Document['startViewTransition']>
    ) {
      const transition = start.apply(this, args);
      const record = w.__vt!;
      record.count += 1;
      const seen: string[] = [];
      record.transitions.push(seen);
      transition.ready
        .then(() => {
          for (const animation of document.getAnimations()) {
            const pseudo = (animation.effect as KeyframeEffect | null)?.pseudoElement;
            if (pseudo && animation.playState === 'running') {
              seen.push(pseudo);
              record.pseudos.push(pseudo);
            }
          }
        })
        .catch(() => {
          // A skipped transition has no pseudo-elements to record.
        });
      // `ready` settles before `finished`, so the record above is complete when this counts.
      const settle = () => {
        record.settled += 1;
      };
      transition.finished.then(settle, settle);
      return transition;
    } as Document['startViewTransition'];
  });
}

/** The record so far (count 0 and empty lists when the API is missing or nothing ran). */
export async function readViewTransitions(page: Page): Promise<ViewTransitionRecord> {
  return page.evaluate(() => {
    const record = (window as VtWindow).__vt;
    return record
      ? {
          count: record.count,
          pseudos: [...record.pseudos],
          transitions: record.transitions,
          settled: record.settled,
        }
      : { count: 0, pseudos: [], transitions: [], settled: 0 };
  });
}

/**
 * Waits until every view transition started so far has finished (`settled === count`),
 * the positive signal an absence sample needs first. Returns the record at that point.
 */
export async function waitForViewTransitionsSettled(page: Page): Promise<ViewTransitionRecord> {
  let record = await readViewTransitions(page);
  await expect
    .poll(async () => {
      record = await readViewTransitions(page);
      return record.settled === record.count;
    })
    .toBe(true);
  return record;
}

/** Deletes document.startViewTransition for every load in this page, like a browser without it. */
export async function removeViewTransitions(page: Page) {
  await page.addInitScript(() => {
    // Own property first (a polyfill or a wrapper), then the prototype method.
    Reflect.deleteProperty(document, 'startViewTransition');
    Reflect.deleteProperty(Document.prototype, 'startViewTransition');
  });
}
