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
 */
import { SW_RELOAD_KEY, hasDirtyField, shouldReloadOnControllerChange } from '@/lib/sw-update';

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
