/**
 * VERIFY-01: the compile-time colour backstop and the end of the v1 colour names.
 *
 * `@theme { --color-*: initial; }` removes Tailwind's default palette, so a stock
 * colour utility (bg-red-500, text-white) no longer compiles and only the L2
 * semantic tokens produce colour utilities. Tailwind clears every --color-* key
 * present when the reset runs (12-RESEARCH Pitfall 7), so the reset must come
 * before the first --color-* definition or it would delete the L2 tokens too.
 * The v1 alias layer, its glow text-shadow tokens and the deprecated-alias
 * marker are gone from the stylesheet for good.
 */
import fs from 'node:fs';
import path from 'node:path';

const lines = fs.readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf8').split(/\r?\n/);

const firstIndex = (pattern: RegExp) => lines.findIndex((line) => pattern.test(line));
const RESET = /^\s*(@theme\s*\{\s*)?--color-\*:\s*initial;/;
const COLOR_DEFINITION = /^\s*(@theme\s*\{\s*)?--color-[a-z0-9-]+:/;
const V1_NAME = /alpine|granite|snow|frost|ember|pine|rust/;

describe('colour reset backstop in app/globals.css (VERIFY-01, RESEARCH Pitfall 7)', () => {
  it('holds exactly one --color-*: initial reset inside an @theme block', () => {
    const resets = lines.filter((line) => RESET.test(line));
    expect(resets).toHaveLength(1);
    const index = firstIndex(RESET);
    const opener = lines
      .slice(0, index + 1)
      .reverse()
      .find((line) => /@theme\b|\}/.test(line));
    expect(opener).toMatch(/@theme\s*\{/);
  });

  it('places the reset before the first line that defines a --color- custom property', () => {
    const reset = firstIndex(RESET);
    const firstDefinition = firstIndex(COLOR_DEFINITION);
    expect(reset).toBeGreaterThanOrEqual(0);
    expect(firstDefinition).toBeGreaterThan(reset);
  });
});

describe('no v1 colour names in app/globals.css (VERIFY-01)', () => {
  it('carries no deprecated-alias marker', () => {
    expect(lines.filter((line) => line.includes('@deprecated v1 alias'))).toEqual([]);
  });

  it('defines no --color- property with a v1 name', () => {
    const v1Definitions = lines.filter(
      (line) => COLOR_DEFINITION.test(line) && V1_NAME.test(line.split(':')[0])
    );
    expect(v1Definitions).toEqual([]);
  });

  it('defines no --text-shadow- property', () => {
    expect(lines.filter((line) => /^\s*--text-shadow-[a-z0-9-]*:/.test(line))).toEqual([]);
  });
});
