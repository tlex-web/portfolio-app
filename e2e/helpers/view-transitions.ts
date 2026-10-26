import type { Page } from '@playwright/test';

/**
 * View Transition test helpers (10-06; LBOX-06; 10-RESEARCH Spike Results,
 * whose probe wrapped document.startViewTransition the same way).
 *
 * `recordViewTransitions` adds an init script that, where the browser has
 * `document.startViewTransition`, wraps it: every call increments
 * `window.__vt.count`, and when the returned transition is `ready` the
 * pseudo-elements that carry an animation at that moment
 * (`document.getAnimations()` -> `effect.pseudoElement`, for example
 * `::view-transition-group(photo-{slug})`) are pushed to `window.__vt.pseudos`
 * and, per transition, to `window.__vt.transitions`. Where the API is missing
 * the counter stays at 0. `readViewTransitions` returns that record;
 * `removeViewTransitions` deletes the API, to test the instant fallback.
 */

export type ViewTransitionRecord = {
  /** startViewTransition calls since the page loaded. */
  count: number;
  /** Every animated pseudo-element seen at `ready`, across all transitions. */
  pseudos: string[];
  /** The same, one list per transition, in call order. */
  transitions: string[][];
};

type VtWindow = Window & { __vt?: ViewTransitionRecord };

/** Records startViewTransition calls and their animated pseudo-elements for every load in this page. */
export async function recordViewTransitions(page: Page) {
  await page.addInitScript(() => {
    const w = window as VtWindow;
    w.__vt = { count: 0, pseudos: [], transitions: [] };
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
            if (pseudo) {
              seen.push(pseudo);
              record.pseudos.push(pseudo);
            }
          }
        })
        .catch(() => {
          // A skipped transition has no pseudo-elements to record.
        });
      return transition;
    } as Document['startViewTransition'];
  });
}

/** The record so far (count 0 and empty lists when the API is missing or nothing ran). */
export async function readViewTransitions(page: Page): Promise<ViewTransitionRecord> {
  return page.evaluate(() => {
    const record = (window as VtWindow).__vt;
    return record
      ? { count: record.count, pseudos: [...record.pseudos], transitions: record.transitions }
      : { count: 0, pseudos: [], transitions: [] };
  });
}

/** Deletes document.startViewTransition for every load in this page, like a browser without it. */
export async function removeViewTransitions(page: Page) {
  await page.addInitScript(() => {
    // Own property first (a polyfill or a wrapper), then the prototype method.
    Reflect.deleteProperty(document, 'startViewTransition');
    Reflect.deleteProperty(Document.prototype, 'startViewTransition');
  });
}
