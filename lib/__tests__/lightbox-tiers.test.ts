/**
 * The lightbox layout tiers (D-05, D-11; 10-UI-SPEC "Layout widths,
 * breakpoints, layers" and "Layout tiers"): app/globals.css spells the three
 * lb-* custom variants with exactly the media strings that
 * lib/photos/lightbox-tiers.ts exports, so the CSS and any TypeScript that
 * reasons about the tiers cannot drift apart (the 09 summit-layout pattern).
 *
 * - scroll: narrower than 768 px or lower than 640 px
 * - key: 768 px to below 1280 px wide, at least 640 px tall
 * - gutter: from 1280 px wide, at least 640 px tall
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  LB_CHROME_PX,
  LB_GUTTER_MEDIA,
  LB_GUTTER_MIN_REM,
  LB_GUTTER_PX,
  LB_KEY_MEDIA,
  LB_KEY_MIN_REM,
  LB_MIN_HEIGHT_REM,
  LB_SCROLL_MEDIA,
} from '@/lib/photos/lightbox-tiers';

const css = fs.readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf8');
const REM = 16;

/** The media condition inside `@custom-variant <name> { @media … { @slot; } }`, or undefined. */
function variantMedia(name: string): string | undefined {
  return new RegExp(`@custom-variant ${name}\\s*\\{\\s*@media ([^{]+)\\{\\s*@slot;`)
    .exec(css)?.[1]
    .trim();
}

type Tier = 'scroll' | 'key' | 'gutter';

/** The documented thresholds, applied to a viewport in CSS px. */
function tierAt(width: number, height: number): Tier {
  if (width < LB_KEY_MIN_REM * REM || height < LB_MIN_HEIGHT_REM * REM) return 'scroll';
  return width >= LB_GUTTER_MIN_REM * REM ? 'gutter' : 'key';
}

describe('lightbox tier media strings (D-05, D-11)', () => {
  it('spells the three tiers from the UI-SPEC thresholds', () => {
    expect(LB_SCROLL_MEDIA).toBe('(width < 48rem), (height < 40rem)');
    expect(LB_KEY_MEDIA).toBe('(48rem <= width < 80rem) and (height >= 40rem)');
    expect(LB_GUTTER_MEDIA).toBe('(width >= 80rem) and (height >= 40rem)');
  });

  it('keeps the three media strings pairwise different', () => {
    expect(new Set([LB_SCROLL_MEDIA, LB_KEY_MEDIA, LB_GUTTER_MEDIA]).size).toBe(3);
  });

  it('exports the 216 px gutter and the 56 px chrome bar', () => {
    expect(LB_GUTTER_PX).toBe(216);
    expect(LB_CHROME_PX).toBe(56);
  });
});

describe('app/globals.css lb-* custom variants (parity guard)', () => {
  it('defines lb-scroll with exactly LB_SCROLL_MEDIA', () => {
    expect(variantMedia('lb-scroll')).toBe(LB_SCROLL_MEDIA);
  });

  it('defines lb-key with exactly LB_KEY_MEDIA', () => {
    expect(variantMedia('lb-key')).toBe(LB_KEY_MEDIA);
  });

  it('defines lb-gutter with exactly LB_GUTTER_MEDIA', () => {
    expect(variantMedia('lb-gutter')).toBe(LB_GUTTER_MEDIA);
  });
});

describe('tier boundaries (documented thresholds)', () => {
  it.each([
    [768, 900, 'key'],
    [1280, 640, 'gutter'],
    [1279, 900, 'key'],
    [1440, 639, 'scroll'],
    [767, 900, 'scroll'],
    [375, 800, 'scroll'],
    [1024, 768, 'key'],
    [1440, 900, 'gutter'],
  ] as const)('%i x %i is the %s tier', (width, height, tier) => {
    expect(tierAt(width, height)).toBe(tier);
  });
});
