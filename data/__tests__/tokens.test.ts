/**
 * D-17, HOME-02: the shader colour constants equal the CSS poster's colours.
 *
 * data/generated/tokens.ts is written by scripts/tokens/build-tokens.mjs from
 * app/globals.css (09-UI-SPEC "Night-tinted relief": ground =
 * mix(night-950, firn-50, shade x 0.32) in sRGB, contour lines in firn-50 at
 * alpha 0.14 index / 0.084 intermediate). These tests pin the parity numbers;
 * `npm run tokens:build -- --check` (inside data:check / lint) catches a
 * generated file that no longer matches the stylesheet.
 */
import fs from 'node:fs';
import path from 'node:path';
import { tokens } from '@/data/generated/tokens';

const text = fs.readFileSync(path.join(process.cwd(), 'data/generated/tokens.ts'), 'utf8');
const TOLERANCE = 0.5 / 255;

const expectChannelsNear = (actual: readonly number[], bytes: readonly number[]) => {
  expect(actual).toHaveLength(3);
  actual.forEach((c, i) => {
    expect(Math.abs(c - bytes[i] / 255)).toBeLessThanOrEqual(TOLERANCE);
  });
};

describe('generated shader tokens (D-17, 09-UI-SPEC "Night-tinted relief")', () => {
  it('night-950 (the ground and clear colour) is #08101a, floats within 0.5/255 of [8, 16, 26]', () => {
    expect(tokens.hex.night950).toBe('#08101a');
    expectChannelsNear(tokens.srgb.night950, [8, 16, 26]);
  });

  it('firn-50 (the relief highlight and contour line colour) is #eeebe5, floats within 0.5/255 of [238, 235, 229]', () => {
    expect(tokens.hex.firn50).toBe('#eeebe5');
    expectChannelsNear(tokens.srgb.firn50, [238, 235, 229]);
  });

  it('every hex is lowercase #rrggbb and every sRGB channel is in [0, 1]', () => {
    const keys = Object.keys(tokens.hex).sort();
    expect(keys).toEqual(['firn50', 'glacier400', 'mist300', 'night900', 'night950']);
    expect(Object.keys(tokens.srgb).sort()).toEqual(keys);
    for (const hex of Object.values(tokens.hex)) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    for (const triple of Object.values(tokens.srgb)) {
      expect(triple).toHaveLength(3);
      for (const c of triple) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    }
  });

  it('each hex is the 8-bit rounding of its sRGB floats', () => {
    for (const [key, hex] of Object.entries(tokens.hex)) {
      const triple = tokens.srgb[key as keyof typeof tokens.srgb];
      const bytes = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      expectChannelsNear(triple, bytes);
    }
  });

  it('contour alpha is 0.14 (index), 0.084 intermediate (x 0.6), relief opacity 0.32', () => {
    expect(tokens.contourAlpha).toBe(0.14);
    expect(tokens.contourMinorAlpha).toBe(0.084);
    expect(tokens.reliefOpacity).toBe(0.32);
  });

  it('the generated module has no import statement (the lazy terrain chunk pulls nothing else)', () => {
    expect(text.split('\n').filter((line) => line.startsWith('import'))).toEqual([]);
  });
});
