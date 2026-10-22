/**
 * DSGN-08 motion-token parity: every DURATION and EASING key in
 * lib/animations.ts must have a matching CSS variable in app/globals.css with
 * the same value. Matching is by key name, so declaration order never matters.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DURATION, EASING, cssDuration, cssEase } from '@/lib/animations';

const css = fs.readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf8');
const camelToKebab = (k: string) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

describe('motion tokens: CSS/JS parity', () => {
  test.each(Object.entries(DURATION))('--duration-%s matches', (k, sec) => {
    const m = css.match(new RegExp(`--duration-${camelToKebab(k)}:\\s*(\\d+)ms`));
    expect(m && Number(m[1])).toBe(Math.round(sec * 1000));
  });

  test.each(Object.entries(EASING))('--ease-%s matches', (k, arr) => {
    const m = css.match(new RegExp(`--ease-${camelToKebab(k)}:\\s*cubic-bezier\\(([^)]+)\\)`));
    expect(m && m[1].split(',').map(Number)).toEqual([...arr]);
  });
});

describe('motion token helpers', () => {
  test("cssDuration('fast') returns the CSS variable reference", () => {
    expect(cssDuration('fast')).toBe('var(--duration-fast)');
  });

  test("cssEase('descent') returns the CSS variable reference", () => {
    expect(cssEase('descent')).toBe('var(--ease-descent)');
  });
});
