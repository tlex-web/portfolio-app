/**
 * SiteFooter map-sheet margin (SHELL-04, DATA-04; 08-UI-SPEC "Footer Map-Sheet
 * Margin Contract"): contour band, waypoint ticks, unchanged focus contract and
 * the static, motion-free source rule (D-21).
 */
import fs from 'node:fs';
import path from 'node:path';
import { render, screen, within } from '@testing-library/react';
import SiteFooter from '../SiteFooter';
import { terrain } from '@/data/generated/terrain';
import { photos } from '@/data/generated/photos';
import { site } from '@/data/site';
import { SCALE_TIERS, formatEquidistance, formatExtentLines, formatMonthYear, scaleFraction, tickLeft } from '@/lib/footer-format';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const positioned = photos.filter((p) => p.position !== null && p.uv !== null);

function renderFooter() {
  render(<SiteFooter />);
  const footer = screen.getByRole('contentinfo');
  const band = footer.firstElementChild as HTMLElement;
  return { footer, band };
}

describe('SiteFooter contour band (D-19)', () => {
  it('starts the footer with an aria-hidden band whose mask is the strip asset', () => {
    const { footer, band } = renderFooter();

    expect(footer).toHaveClass('@container', 'bg-surface-raised', 'border-t', 'border-line');
    expect(band).toHaveAttribute('aria-hidden', 'true');
    expect(band).toHaveClass('aspect-[5/1]', 'sm:aspect-[8/1]', 'lg:aspect-[12/1]', 'border-b', 'border-line');

    const field = band.querySelector('.bg-contour') as HTMLElement;
    expect(field).not.toBeNull();
    expect(field).toHaveAttribute('aria-hidden', 'true');
    expect(field.style.maskImage).toContain(terrain.assets.contours.strip);
  });
});

describe('SiteFooter waypoint ticks (D-20, DATA-04)', () => {
  it('renders one tick per photo with a position', () => {
    const { band } = renderFooter();
    expect(band.querySelectorAll('[data-tick]')).toHaveLength(positioned.length);
  });

  it('dashes exactly the approximate photo ticks, driven by position.approximate', () => {
    const { band } = renderFooter();
    const approximate = positioned.filter((p) => p.position.approximate);
    const dashed = band.querySelectorAll('[data-tick="approximate"]');

    expect(approximate.length).toBeGreaterThan(0);
    expect(dashed).toHaveLength(approximate.length);
    for (const tick of Array.from(dashed)) expect(tick).toHaveClass('border-dashed');
    for (const tick of Array.from(band.querySelectorAll('[data-tick="exact"]'))) {
      expect(tick).not.toHaveClass('border-dashed');
      expect(tick).toHaveClass('w-px', 'bg-ink-muted');
    }
  });

  it('places each tick at tickLeft(u) in data order', () => {
    const { band } = renderFooter();
    const ticks = Array.from(band.querySelectorAll<HTMLElement>('[data-tick]'));
    expect(ticks.map((t) => t.style.left)).toEqual(positioned.map((p) => tickLeft(p.uv!.u)));
  });
});

describe('SiteFooter sheet margin (D-15, D-18)', () => {
  const items = (footer: HTMLElement) => Array.from(footer.querySelectorAll('dl > div'));
  const dd = (footer: HTMLElement, label: string) =>
    items(footer)
      .find((item) => item.querySelector('dt')?.textContent === label)
      ?.querySelector('dd') as HTMLElement;

  it('titles the sheet "Zermatt – Matterhorn" in a p, not a heading', () => {
    const { footer } = renderFooter();
    const title = within(footer).getByText('Zermatt – Matterhorn');
    expect(title.tagName).toBe('P');
    expect(title).toHaveClass('text-base', 'font-semibold', 'text-ink');
    expect(within(footer).queryAllByRole('heading')).toHaveLength(0);
  });

  it('lists the dt labels in the UI-SPEC order', () => {
    const { footer } = renderFooter();
    expect(Array.from(footer.querySelectorAll('dl dt')).map((dt) => dt.textContent)).toEqual([
      'Scale',
      'Equidistance',
      'Extent (LV95)',
      'Last surveyed',
      'Source',
    ]);
  });

  it('spans Extent and Source across the grid as the UI-SPEC places them', () => {
    const { footer } = renderFooter();
    const [, , extent, , source] = items(footer);
    expect(extent).toHaveClass('col-span-2', 'lg:col-span-1');
    expect(source).toHaveClass('col-span-2', 'lg:col-span-4');
    expect(footer.querySelector('dl')).toHaveClass('grid-cols-2', 'gap-x-8', 'gap-y-6', 'lg:grid-cols-4');
  });

  it('prints the strip equidistance, the LV95 extent and the DEM edition from the terrain metadata', () => {
    const { footer } = renderFooter();
    expect(dd(footer, 'Equidistance')).toHaveTextContent(formatEquidistance(terrain.contours.strip.intervalM), {
      normalizeWhitespace: false,
    });
    const lines = Array.from(dd(footer, 'Extent (LV95)').children).map((line) => line.textContent);
    expect(lines).toEqual(formatExtentLines(terrain.extent.lv95));
    expect(dd(footer, 'Last surveyed')).toHaveTextContent(formatMonthYear(terrain.dem.edition));
    for (const label of ['Equidistance', 'Extent (LV95)', 'Last surveyed']) {
      expect(dd(footer, label)).toHaveClass('font-mono', 'text-sm', 'text-ink', 'tabular-nums');
    }
  });

  it('credits the source with the full attribution constant and no copyright sign', () => {
    const { footer } = renderFooter();
    const source = dd(footer, 'Source');
    expect(typeof site.attribution.terrain).toBe('string');
    expect(site.attribution.terrain.length).toBeGreaterThan(0);
    expect(source.textContent).toBe(`Contours derived from swissALTIRegio. ${site.attribution.terrain}`);
    expect(source).toHaveClass('text-sm', 'text-ink-muted', 'max-w-prose', 'wrap-anywhere');
  });

  it('renders three scale variants, one per tier, each true to the extent width', () => {
    const { footer } = renderFooter();
    const variants = Array.from(dd(footer, 'Scale').children) as HTMLElement[];
    const classes = [
      ['flex', 'flex-col', 'lg:hidden'],
      ['hidden', 'lg:flex', 'lg:flex-col', 'min-[1792px]:hidden'],
      ['hidden', 'min-[1792px]:flex', 'min-[1792px]:flex-col'],
    ];

    expect(variants).toHaveLength(SCALE_TIERS.length);
    variants.forEach((variant, i) => {
      const tier = SCALE_TIERS[i];
      expect(variant).toHaveClass(...classes[i]);
      const bar = variant.querySelector('.h-2') as HTMLElement;
      expect(bar).toHaveClass('flex', 'border', 'border-ink-muted');
      expect(bar.getAttribute('style')).toContain(
        `calc(100cqw * ${scaleFraction(tier.lengthM, terrain.extent.widthM)})`
      );
      const labels = variant.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(Array.from(labels.children).map((l) => l.textContent)).toEqual([...tier.labels]);
      expect(variant.querySelector('.sr-only')).toHaveTextContent(tier.srText);
    });
  });
});

describe('SiteFooter focus and landmarks (unchanged 07 contract)', () => {
  it('keeps exactly three focusable elements and no navigation', () => {
    const { footer } = renderFooter();
    expect(footer.querySelectorAll(FOCUSABLE)).toHaveLength(3);
    expect(within(footer).queryByRole('navigation')).not.toBeInTheDocument();
  });
});

describe('SiteFooter static source (D-21)', () => {
  const read = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
  const sources = {
    'components/site/SiteFooter.tsx': read('components/site/SiteFooter.tsx'),
    'components/terrain/ContourField.tsx': read('components/terrain/ContourField.tsx'),
  };

  test.each(Object.entries(sources))('%s has no client, motion, locale or animation code', (_file, src) => {
    expect(src).not.toMatch(/['"]use client['"]/);
    expect(src).not.toMatch(/motion\/react/);
    expect(src).not.toMatch(/\bIntl\b/);
    expect(src).not.toMatch(/toLocale/);
    expect(src).not.toMatch(/\buse(State|Effect|LayoutEffect|Ref)\b/);
    expect(src).not.toMatch(/\banimate-/);
  });

  it('puts no transition utility on band elements (only the 07 link hover keeps one)', () => {
    const footerSrc = sources['components/site/SiteFooter.tsx'];
    const transitions = footerSrc.match(/transition-[a-z]+/g) ?? [];
    expect(transitions).toEqual(['transition-colors']);
    expect(footerSrc).toMatch(/const LINK =\s*\n\s*'[^']*transition-colors/);
    expect(sources['components/terrain/ContourField.tsx']).not.toMatch(/transition/);
  });
});
