/**
 * SiteFooter map-sheet margin (SHELL-04, DATA-04; 08-UI-SPEC "Footer Map-Sheet
 * Margin Contract"): contour band, waypoint ticks, unchanged focus contract and
 * the static, motion-free source rule (D-21).
 */
import fs from 'node:fs';
import path from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import SiteFooter from '../SiteFooter';
import { terrain } from '@/data/generated/terrain';
import { SHORT_CREDIT, SOURCES_PAGE, sourceHref } from '@/data/source-credits';
import { SWISSALTIREGIO_CREDIT } from '@/data/sources';
import { homePhotos } from '@/lib/ascent/home-photos';
import { SCALE_TIERS, formatEquidistance, formatExtentLines, formatMonthYear, scaleFraction, tickLeft } from '@/lib/footer-format';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** The footer ticks are the Home waypoints (DATA-09): photos outside the Home list add none. */
const homeList = homePhotos();
const positioned = homeList.filter((p) => p.position !== null && p.uv !== null);

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
    expect(dd(footer, 'Equidistance').textContent).toBe(formatEquidistance(terrain.contours.strip.intervalM));
    const lines = Array.from(dd(footer, 'Extent (LV95)').children).map((line) => line.textContent);
    expect(lines).toEqual(formatExtentLines(terrain.extent.lv95));
    expect(dd(footer, 'Last surveyed')).toHaveTextContent(formatMonthYear(terrain.dem.edition));
    for (const label of ['Equidistance', 'Extent (LV95)', 'Last surveyed']) {
      expect(dd(footer, label)).toHaveClass('font-mono', 'text-sm', 'text-ink', 'tabular-nums');
    }
  });

  it('credits the source with a short credit linked to /sources#swissaltiregio and an All data sources link (18 D-16)', () => {
    const { footer } = renderFooter();
    const source = dd(footer, 'Source');
    expect(source).toHaveClass('text-sm', 'text-ink-muted', 'max-w-prose', 'wrap-anywhere');

    const [credit, all] = within(source).getAllByRole('link');
    expect(within(source).getAllByRole('link')).toHaveLength(2);
    expect(credit).toHaveTextContent(SHORT_CREDIT.swissaltiregio);
    expect(credit).toHaveAttribute('href', '/sources#swissaltiregio');
    expect(credit).toHaveAttribute('href', sourceHref('swissaltiregio'));
    expect(credit).toHaveClass('prose-link');
    expect(all).toHaveTextContent('All data sources');
    expect(all).toHaveAttribute('href', '/sources');
    expect(all).toHaveAttribute('href', SOURCES_PAGE.href);
    // A standalone link meets 44 px on its own line (18-UI-SPEC Contract 7).
    expect(all).toHaveClass('prose-link', 'inline-flex', 'min-h-11', 'items-center');
    expect(all.parentElement).toHaveClass('mt-1', 'block');
    expect(source.textContent).toBe(`Contours derived from ${SHORT_CREDIT.swissaltiregio}.All data sources`);
    // Tim's approved wording (18-03 D-20, 2026-11-25, rows 3a and 3d), typed literally.
    expect(credit.textContent).toBe('swissALTIRegio, swisstopo');
    expect(source.textContent).toBe('Contours derived from swissALTIRegio, swisstopo.All data sources');

    // The long reference stays on /sources: nothing past its first word is in the footer.
    const [first, ...rest] = SWISSALTIREGIO_CREDIT.split(' ');
    expect(first).toBe('Bundesamt');
    for (const word of rest.filter((w) => w.length > 3)) {
      expect(footer.textContent).not.toContain(word);
    }
    expect(footer.textContent).not.toContain('Tarquini');
    expect(source.textContent).not.toContain('©');
  });

  it('renders three scale variants, one per tier, each true to the extent width', () => {
    const { footer } = renderFooter();
    const variants = Array.from(dd(footer, 'Scale').children) as HTMLElement[];
    const classes = [
      ['flex', 'flex-col', 'lg:hidden'],
      ['hidden', 'lg:flex', 'lg:flex-col', 'min-[112rem]:hidden'],
      ['hidden', 'min-[112rem]:flex', 'min-[112rem]:flex-col'],
    ];

    expect(variants).toHaveLength(SCALE_TIERS.length);
    variants.forEach((variant, i) => {
      const tier = SCALE_TIERS[i];
      expect(variant).toHaveClass(...classes[i]);
      const bar = variant.querySelector('.h-2') as HTMLElement;
      expect(bar).toHaveClass('flex', 'border', 'border-ink-muted');
      // jsdom folds calc(); the server markup below carries the literal expression.
      const probe = document.createElement('div');
      probe.style.width = `calc(100cqw * ${scaleFraction(tier.lengthM, terrain.extent.widthM)})`;
      expect(bar.style.width).toBe(probe.style.width);
      const labels = variant.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(Array.from(labels.children).map((l) => l.textContent)).toEqual([...tier.labels]);
      expect(variant.querySelector('.sr-only')).toHaveTextContent(tier.srText);
    });
  });

  it('writes each bar width as calc(100cqw * L / extentWidthM) in the server markup', () => {
    const markup = renderToStaticMarkup(<SiteFooter />);
    for (const tier of SCALE_TIERS) {
      expect(markup).toContain(`width:calc(100cqw * ${scaleFraction(tier.lengthM, terrain.extent.widthM)})`);
    }
  });
});

describe('SiteFooter focus and landmarks (07 contract; 18 D-16 Source links)', () => {
  it('keeps the three Elsewhere links, adds only the two Source links (18 D-16) and no navigation', () => {
    const { footer } = renderFooter();
    const focusable = Array.from(footer.querySelectorAll(FOCUSABLE));
    expect(focusable.map((el) => el.textContent?.trim())).toEqual([
      'GitHub',
      'LinkedIn',
      'Email',
      SHORT_CREDIT.swissaltiregio,
      'All data sources',
    ]);
    expect(within(footer).queryByRole('navigation')).not.toBeInTheDocument();
  });
});

describe('SiteFooter static source (D-21)', () => {
  const read = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
  const sources = {
    'components/site/SiteFooter.tsx': read('components/site/SiteFooter.tsx'),
    'components/terrain/ContourField.tsx': read('components/terrain/ContourField.tsx'),
    'components/terrain/SheetBand.tsx': read('components/terrain/SheetBand.tsx'),
    'components/terrain/SheetLegend.tsx': read('components/terrain/SheetLegend.tsx'),
  };

  test.each(Object.entries(sources))('%s has no client, motion, locale or animation code', (_file, src) => {
    expect(src).not.toMatch(/['"]use client['"]/);
    expect(src).not.toMatch(/motion\/react/);
    expect(src).not.toMatch(/\bIntl\b/);
    expect(src).not.toMatch(/toLocale/);
    expect(src).not.toMatch(/\buse(State|Effect|LayoutEffect|Ref)\b/);
    expect(src).not.toMatch(/\banimate-/);
  });

  it('puts no transition utility on band or legend elements (only the 07 link hover keeps one)', () => {
    const footerSrc = sources['components/site/SiteFooter.tsx'];
    const transitions = footerSrc.match(/transition-[a-z]+/g) ?? [];
    expect(transitions).toEqual(['transition-colors']);
    expect(footerSrc).toMatch(/const LINK =\s*\n\s*'[^']*transition-colors/);
    const terrainFiles = Object.entries(sources).filter(([file]) => file.startsWith('components/terrain/'));
    expect(terrainFiles.map(([file]) => file)).toHaveLength(3);
    for (const [, src] of terrainFiles) expect(src).not.toMatch(/transition/);
  });
});
