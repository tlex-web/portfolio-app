/**
 * The Alps overview sheet (18-23; REGION-01, REGION-06; 18-UI-SPEC Contract 1
 * "Sheet", "Markers are pointer-only", "Overview sheet margin"). The server
 * component rendered from the real registry and overview data; only
 * overviewCss is wrapped in a spy (it still runs) so the per-process memo is
 * observable.
 *
 * The browser rows (geometry at four widths, tiers, sync, no-JS, Tab) live in
 * e2e/photos.spec.ts 'Overview sheet'; these pin the server markup contract.
 */
import { render } from '@testing-library/react';
import OverviewSheet from '@/components/photos/overview/OverviewSheet';
import { overviewCss } from '@/lib/photos/overview-layout';
import { regionHref } from '@/lib/photos/routes';
import { overviewSheetInput } from '@/lib/regions';

jest.mock('@/lib/photos/overview-layout', () => {
  const actual = jest.requireActual<typeof import('@/lib/photos/overview-layout')>(
    '@/lib/photos/overview-layout'
  );
  return { ...actual, overviewCss: jest.fn(actual.overviewCss) };
});

const input = overviewSheetInput();

describe('OverviewSheet (18-23; REGION-01, REGION-06)', () => {
  it('is a labelled Map section whose figure holds the sheet and the overview margin as its figcaption', () => {
    const { container } = render(<OverviewSheet />);
    const section = container.querySelector('section[aria-labelledby="overview-map"]')!;
    const h2 = section.querySelector('h2#overview-map')!;
    expect(h2.textContent).toBe('Map');
    expect(h2).toHaveClass('sr-only');
    const figure = section.querySelector(':scope > figure')!;
    expect(figure).toHaveClass('-mx-4', 'sm:mx-0');
    expect(figure.querySelector(':scope > [data-overview-sheet]')).not.toBeNull();
    const caption = figure.querySelector(':scope > figcaption[data-sheet-margin]')!;
    expect(caption.querySelector('p')?.textContent).toBe(
      `The Alps · contours every 1,000${String.fromCharCode(0xa0)}m`
    );
    expect(caption.querySelector('a')?.getAttribute('href')).toBe('/sources#copernicus-glo-90');
    // Full-bleed below 640 px: the margin takes the container's gutters back.
    expect(caption).toHaveClass('px-4', 'sm:px-0');
  });

  it('draws the sheet edge as an inset outline on an exact-ratio size container (18-13 note)', () => {
    const { container } = render(<OverviewSheet />);
    const sheet = container.querySelector('[data-overview-sheet]') as HTMLElement;
    expect(sheet).toHaveClass(
      'relative',
      'aspect-[1200/872]',
      'overflow-hidden',
      'bg-surface',
      'outline-1',
      '-outline-offset-1',
      'outline-line',
      '[container-type:size]'
    );
    expect(sheet.className).not.toMatch(/(^|\s)border(\s|-)/);
    expect(sheet.style.containerName).toBe('overview-sheet');
  });

  it('renders one pointer-only marker per region, 1..N west to east, with its plate, and one rectangle per outline', () => {
    const { container } = render(<OverviewSheet />);
    const markers = [...container.querySelectorAll('a[data-region-marker]')];
    expect(markers.map((m) => m.getAttribute('data-region-marker'))).toEqual([
      'zermatt',
      'ortler',
      'saalfelden',
    ]);
    markers.forEach((m, i) => {
      const r = input.regions[i];
      expect(m.getAttribute('href')).toBe(regionHref(r.id));
      expect(m.getAttribute('tabindex')).toBe('-1');
      expect(m.getAttribute('aria-hidden')).toBe('true');
      expect(m.querySelector('[data-region-dot]')?.textContent).toBe(String(i + 1));
      expect(m.querySelector('[data-region-leader]')).not.toBeNull();
      const plate = m.querySelector('[data-region-plate]')!;
      expect(plate).toHaveClass('h-12', 'w-36', 'ring-1', 'ring-inset', 'ring-line-strong');
      expect(plate.textContent).toBe(`${r.name}${r.count}`);
    });
    const rects = [...container.querySelectorAll('polygon[data-region-rect]')];
    expect(rects.map((p) => p.getAttribute('data-region-rect'))).toEqual(
      input.regions.map((r) => r.id)
    );
    rects.forEach((p, i) => {
      expect(p.getAttribute('points')?.split(' ')).toHaveLength(4);
      expect(p.getAttribute('points')).toBe(
        input.regions[i].corners.map((c) => `${c.u},${c.v}`).join(' ')
      );
      expect(p.getAttribute('fill')).toBe('none');
      expect(p.getAttribute('vector-effect')).toBe('non-scaling-stroke');
      expect(p.closest('svg')?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('renders every summit as an aria-hidden triangle and label, and nothing in the sheet is tabbable', () => {
    const { container } = render(<OverviewSheet />);
    const marks = [...container.querySelectorAll('[data-summit-mark]')];
    const plates = [...container.querySelectorAll('[data-summit-plate]')];
    expect(marks).toHaveLength(input.summits.length);
    expect(plates.map((p) => p.textContent)).toEqual(
      input.summits.map((s) => `${s.name}${s.height}`)
    );
    for (const el of [...marks, ...plates])
      expect(el.closest('[aria-hidden="true"]')).not.toBeNull();
    const sheet = container.querySelector('[data-overview-sheet]')!;
    const tabbable = [...sheet.querySelectorAll<HTMLElement>('a, button, [tabindex]')].filter(
      (el) => el.tabIndex >= 0
    );
    expect(tabbable).toEqual([]);
  });

  it("carries overviewCss's rules, one :has() per sync state (no :is() inside :has()), computed once per process", () => {
    const first = render(<OverviewSheet />).container.querySelector('style')?.textContent ?? '';
    const second = render(<OverviewSheet />).container.querySelector('style')?.textContent ?? '';
    const want = jest
      .requireActual<typeof import('@/lib/photos/overview-layout')>('@/lib/photos/overview-layout')
      .overviewCss(input, 'overview-sheet');
    expect(first).toBe(want);
    expect(second).toBe(want);
    expect(first).toContain('[data-overview]:has([data-region-row="ortler"]:hover)');
    expect(first).toContain('[data-overview]:has([data-region-row="ortler"]:focus-visible)');
    expect(first).not.toMatch(/:has\([^)]*:(?:is|where)\(/);
    // The sweep runs once per server process, never per request (about 0.6 s each): every
    // render in this file (six) shares the one call.
    expect(overviewCss).toHaveBeenCalledTimes(1);
  });
});
