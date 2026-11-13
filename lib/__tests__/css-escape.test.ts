/**
 * @jest-environment node
 *
 * The shared selector escape (10-REVIEW IN-02): CSS.escape when the environment has it,
 * else the quote-and-backslash fallback LightboxDialog used to keep to itself. Node has
 * no CSS global of its own, but jest.setup.js loads jest-dom, whose css.escape polyfill
 * installs one, so each block sets the global it needs and puts the original back.
 */
import { cssEscape } from '../photos/css-escape';

type CssGlobal = { CSS?: { escape(value: string): string } };
const global = globalThis as CssGlobal;
const original = Object.getOwnPropertyDescriptor(globalThis, 'CSS');

afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'CSS', original);
  else delete global.CSS;
});

describe('cssEscape without a global CSS.escape', () => {
  beforeEach(() => {
    delete global.CSS;
  });

  it('leaves a plain slug as it is', () => {
    expect(cssEscape('img-0662')).toBe('img-0662');
  });

  it('escapes a double quote, so the value cannot close the attribute', () => {
    expect(cssEscape('a"b')).toBe('a\\"b');
    expect(`[data-photo-id="${cssEscape('a"]b')}"]`).toBe('[data-photo-id="a\\"]b"]');
  });

  it('escapes a backslash', () => {
    expect(cssEscape('a\\b')).toBe('a\\\\b');
  });

  it('keeps a leading digit, which a quoted attribute value allows', () => {
    expect(cssEscape('0605-summit')).toBe('0605-summit');
  });
});

describe('cssEscape with a global CSS.escape', () => {
  const escape = jest.fn((value: string) => `escaped(${value})`);

  beforeEach(() => {
    global.CSS = { escape };
    escape.mockClear();
  });

  it('delegates to it', () => {
    expect(cssEscape('1a"b')).toBe('escaped(1a"b)');
    expect(escape).toHaveBeenCalledWith('1a"b');
  });
});
