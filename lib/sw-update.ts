/**
 * EDGE-02, PITFALLS #17: the one-time reload after a service-worker update.
 *
 * A tab that was open during a deploy can hold a page from the previous build.
 * When the new worker takes control (`controllerchange`), the tab reloads once
 * so the visitor gets the new deploy, per Tim's sw.reload-once answer ("yes:
 * reload once on controllerchange only when no form field is dirty"):
 *
 * - only on an update: a page with no controller at load is a first install;
 * - at most once per tab: `SW_RELOAD_KEY` in sessionStorage (per tab, so two
 *   open tabs each reload at most once);
 * - never while a visitor has typed into a text field or textarea.
 *
 * Import-free so both the client component and Jest load it directly.
 */

/** sessionStorage key set (to '1') just before the one reload. */
export const SW_RELOAD_KEY = 'sw-reloaded';

/** Whether a `controllerchange` should reload the page. */
export function shouldReloadOnControllerChange({
  hadController,
  alreadyReloaded,
  dirty,
}: {
  /** navigator.serviceWorker.controller existed when the page loaded. */
  hadController: boolean;
  /** This tab already reloaded for an update (SW_RELOAD_KEY is '1'). */
  alreadyReloaded: boolean;
  /** A text field or textarea holds a value (see hasDirtyField). */
  dirty: boolean;
}): boolean {
  return hadController && !alreadyReloaded && !dirty;
}

/** How often an open tab asks for a new worker: hourly. */
export const SW_UPDATE_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Registers `scriptUrl` and then checks for a new worker every `everyMs`
 * (12-31 IN-04, EDGE-02). Returns a stop function for the effect cleanup:
 * it clears the interval, and a registration that resolves after stop
 * schedules nothing, so no check outlives the component. A rejected
 * update() (offline, or the script fetch failed) is caught, so an offline tab
 * logs no hourly unhandled rejection; a rejected register() is silent, as
 * before.
 */
export function startUpdateChecks(
  container: Pick<ServiceWorkerContainer, 'register'>,
  scriptUrl: string,
  everyMs: number
): () => void {
  let stopped = false;
  let interval: ReturnType<typeof setInterval> | undefined;

  container
    .register(scriptUrl)
    .then((registration) => {
      if (stopped) return;
      interval = setInterval(() => {
        registration.update().catch(() => {});
      }, everyMs);
    })
    .catch(() => {
      // Registration failed -- silent in production.
    });

  return () => {
    stopped = true;
    if (interval !== undefined) clearInterval(interval);
  };
}

/** Input types that hold no typed text. */
const NON_TEXT_TYPES = new Set([
  'hidden',
  'checkbox',
  'radio',
  'submit',
  'button',
  'reset',
  'image',
  'file',
  'range',
  'color',
]);

/**
 * True when a text-like input or a textarea under `root` holds a value. Fields
 * with tabindex="-1" (the contact form's honeypot) are skipped: a person never
 * fills them.
 */
export function hasDirtyField(root: ParentNode): boolean {
  const fields = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
  for (const field of fields) {
    if (field.getAttribute('tabindex') === '-1') continue;
    if (field.tagName === 'INPUT' && NON_TEXT_TYPES.has((field as HTMLInputElement).type)) continue;
    if (field.value !== '') return true;
  }
  return false;
}
