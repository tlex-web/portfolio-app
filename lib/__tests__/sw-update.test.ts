/**
 * EDGE-02, PITFALLS #17: after a deploy, the page reloads once when the new
 * service worker takes control (Tim's sw.reload-once answer: yes, only when no
 * form field is dirty).
 *
 * - Reload only on an update: a page that had no controller at load is a first
 *   install, and reloading it gains nothing.
 * - Reload at most once per tab (sessionStorage key), so two updates in a row
 *   or a reload that lands on another update cannot loop.
 * - Never reload while a visitor has typed into a text field or textarea. A
 *   checked checkbox or radio is not typing, and a tabindex=-1 field (the
 *   contact form's honeypot) is never filled by a person.
 *
 * 12-31 IN-04: the hourly `registration.update()` check stops when the
 * component unmounts (also when unmount comes before registration resolves),
 * and a rejected update() (offline, script fetch failed) is caught.
 */
import {
  SW_RELOAD_KEY,
  SW_UPDATE_INTERVAL_MS,
  hasDirtyField,
  shouldReloadOnControllerChange,
  startUpdateChecks,
} from '@/lib/sw-update';

describe('shouldReloadOnControllerChange', () => {
  test('reloads on an update that has not reloaded yet with no dirty field', () => {
    expect(shouldReloadOnControllerChange({ hadController: true, alreadyReloaded: false, dirty: false })).toBe(true);
  });

  test('does not reload on a first install (no controller at load)', () => {
    expect(shouldReloadOnControllerChange({ hadController: false, alreadyReloaded: false, dirty: false })).toBe(false);
  });

  test('does not reload a second time in the same tab', () => {
    expect(shouldReloadOnControllerChange({ hadController: true, alreadyReloaded: true, dirty: false })).toBe(false);
  });

  test('does not reload while a form field is dirty', () => {
    expect(shouldReloadOnControllerChange({ hadController: true, alreadyReloaded: false, dirty: true })).toBe(false);
  });
});

describe('SW_RELOAD_KEY', () => {
  test('is the sessionStorage key sw-reloaded', () => {
    expect(SW_RELOAD_KEY).toBe('sw-reloaded');
  });
});

describe('hasDirtyField', () => {
  function root(html: string) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div;
  }

  test('a text input holding a value is dirty', () => {
    const r = root('<input type="text" name="name">');
    (r.querySelector('input') as HTMLInputElement).value = 'Tim';
    expect(hasDirtyField(r)).toBe(true);
  });

  test('an email input holding a value is dirty', () => {
    const r = root('<input type="email" name="email">');
    (r.querySelector('input') as HTMLInputElement).value = 'a@b.ch';
    expect(hasDirtyField(r)).toBe(true);
  });

  test('an input with no type attribute holding a value is dirty', () => {
    const r = root('<input name="q">');
    (r.querySelector('input') as HTMLInputElement).value = 'x';
    expect(hasDirtyField(r)).toBe(true);
  });

  test('a textarea holding a value is dirty', () => {
    const r = root('<textarea name="message"></textarea>');
    (r.querySelector('textarea') as HTMLTextAreaElement).value = 'Hello';
    expect(hasDirtyField(r)).toBe(true);
  });

  test('empty fields are not dirty', () => {
    expect(hasDirtyField(root('<input type="text"><textarea></textarea>'))).toBe(false);
  });

  test('only a checked checkbox or radio is not dirty', () => {
    const r = root('<input type="checkbox" value="on"><input type="radio" name="r" value="a">');
    r.querySelectorAll('input').forEach((input) => {
      input.checked = true;
    });
    expect(hasDirtyField(r)).toBe(false);
  });

  test('only a tabindex=-1 field (the honeypot) holding a value is not dirty', () => {
    const r = root('<input type="text" name="website" tabindex="-1"><textarea tabindex="-1"></textarea>');
    (r.querySelector('input') as HTMLInputElement).value = 'spam';
    (r.querySelector('textarea') as HTMLTextAreaElement).value = 'spam';
    expect(hasDirtyField(r)).toBe(false);
  });

  test('a hidden input holding a value is not dirty', () => {
    expect(hasDirtyField(root('<input type="hidden" name="token" value="abc">'))).toBe(false);
  });

  test('a document with a dirty field anywhere is dirty', () => {
    document.body.innerHTML = '<main><form><textarea id="m"></textarea></form></main>';
    (document.getElementById('m') as HTMLTextAreaElement).value = 'draft';
    expect(hasDirtyField(document)).toBe(true);
    document.body.innerHTML = '';
  });
});

describe('startUpdateChecks (IN-04)', () => {
  const EVERY = 1000;
  const SCRIPT = '/service-worker.js';

  /** A container whose register() settles only when the test says so. */
  function fakeContainer(update: () => Promise<unknown> = () => Promise.resolve(undefined)) {
    const registration = { update: jest.fn(update) };
    let settle: { resolve: () => void; reject: () => void } = {
      resolve: () => {},
      reject: () => {},
    };
    const register = jest.fn(
      () =>
        new Promise((resolve, reject) => {
          settle = {
            resolve: () => resolve(registration),
            reject: () => reject(new Error('register failed')),
          };
        })
    );
    const container = { register } as unknown as Pick<ServiceWorkerContainer, 'register'>;
    return {
      container,
      register,
      update: registration.update,
      resolve: () => settle.resolve(),
      reject: () => settle.reject(),
    };
  }

  /** Lets settled promises run their handlers (fake timers do not touch microtasks). */
  async function flush() {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  }

  /**
   * Node reports an unhandled rejection once the microtask queue drains, so
   * wait one real macrotask (the timers module's setImmediate is not faked).
   */
  const { setImmediate: realSetImmediate } = jest.requireActual<typeof import('timers')>('timers');
  async function afterRejectionsReport() {
    await flush();
    await new Promise<void>((resolve) => realSetImmediate(resolve));
  }

  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => unhandled.push(reason);

  beforeEach(() => {
    jest.useFakeTimers();
    unhandled.length = 0;
    process.on('unhandledRejection', onUnhandled);
  });

  afterEach(() => {
    process.off('unhandledRejection', onUnhandled);
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('checks hourly in production', () => {
    expect(SW_UPDATE_INTERVAL_MS).toBe(60 * 60 * 1000);
  });

  test('registers the script once and calls update() once per interval', async () => {
    const sw = fakeContainer();
    startUpdateChecks(sw.container, SCRIPT, EVERY);
    sw.resolve();
    await flush();
    expect(sw.register).toHaveBeenCalledTimes(1);
    expect(sw.register).toHaveBeenCalledWith(SCRIPT);
    expect(sw.update).not.toHaveBeenCalled();

    jest.advanceTimersByTime(EVERY);
    expect(sw.update).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(EVERY);
    expect(sw.update).toHaveBeenCalledTimes(2);
    expect(sw.register).toHaveBeenCalledTimes(1);
  });

  test('catches a rejected update(), so an offline tab reports no unhandled rejection', async () => {
    const sw = fakeContainer(() => Promise.reject(new Error('offline')));
    startUpdateChecks(sw.container, SCRIPT, EVERY);
    sw.resolve();
    await flush();

    jest.advanceTimersByTime(EVERY * 2);
    expect(sw.update).toHaveBeenCalledTimes(2);
    await afterRejectionsReport();
    expect(unhandled).toEqual([]);
  });

  test('stop() after registration resolves: no update() afterwards', async () => {
    const sw = fakeContainer();
    const stop = startUpdateChecks(sw.container, SCRIPT, EVERY);
    sw.resolve();
    await flush();
    jest.advanceTimersByTime(EVERY);
    expect(sw.update).toHaveBeenCalledTimes(1);

    stop();
    jest.advanceTimersByTime(EVERY * 5);
    expect(sw.update).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  test('stop() before registration resolves: no interval is ever created and update() never runs', async () => {
    const sw = fakeContainer();
    const stop = startUpdateChecks(sw.container, SCRIPT, EVERY);
    stop();
    sw.resolve();
    await flush();

    expect(jest.getTimerCount()).toBe(0);
    jest.advanceTimersByTime(EVERY * 5);
    expect(sw.update).not.toHaveBeenCalled();
  });

  test('a rejected register() throws nothing and schedules nothing', async () => {
    const sw = fakeContainer();
    expect(() => startUpdateChecks(sw.container, SCRIPT, EVERY)).not.toThrow();
    sw.reject();
    await afterRejectionsReport();

    expect(jest.getTimerCount()).toBe(0);
    expect(sw.update).not.toHaveBeenCalled();
    expect(unhandled).toEqual([]);
  });
});
