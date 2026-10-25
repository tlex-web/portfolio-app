/**
 * Pins and rail on the stage (HOME-04, HOME-05; D-01, D-05, D-09; 09-UI-SPEC
 * "Pins (D-09)", "Altimeter Rail (HOME-04, D-05)" and UI Considerations E7,
 * E8). PinMark and the poster pins are server components; the rail is the
 * client island rendered through AscentHero. Every expected string is derived
 * from the committed data, and the literal UI-SPEC labels are checked too.
 */
import { render } from '@testing-library/react';
import AscentHero from '../AscentHero';
import PinMark, { SummitMark } from '../PinMark';
import PosterSheet from '../PosterSheet';
import { lowestDemM } from '@/data/generated/photos';
import { terrain } from '@/data/generated/terrain';
import { buildWaypoints } from '@/lib/ascent/waypoints';
import { formatMetres } from '@/lib/photo-format';

const waypoints = buildWaypoints();
const NBSP = / /g;
const plain = (s: string | null | undefined) => (s ?? '').replace(NBSP, ' ');

describe('PinMark (D-09)', () => {
  it('renders data-pin, the numeral in a 24 px head, a 16 px stem and the label', () => {
    const { container } = render(
      <PinMark k={2} label="Gornerschlucht · 1,668 m" approximate={false} />
    );
    const pin = container.querySelector('[data-pin]') as HTMLElement;

    expect(pin).toHaveAttribute('data-pin', '2');
    const head = pin.querySelector('[data-pin-head]') as HTMLElement;
    expect(head).toHaveTextContent('2');
    expect(head).toHaveClass('size-6', 'rounded-full', 'font-mono', 'tabular-nums');
    const stem = pin.querySelector('[data-pin-stem]') as HTMLElement;
    expect(stem).toHaveClass('h-4', 'w-px', 'bg-ink-muted');
    expect(pin.querySelector('[data-pin-label]')).toHaveTextContent('Gornerschlucht · 1,668 m');
    expect(pin.querySelector('[data-pin-label]')).toHaveClass('whitespace-nowrap');
    expect(pin).not.toHaveAttribute('data-active');
    expect(pin).not.toHaveAttribute('data-label');
  });

  it('places the label by data-label: right by default, left, above, below or none (G-09-3 a)', () => {
    const { container } = render(<PinMark k={2} label="Gornerschlucht" approximate={false} />);
    const label = container.querySelector('[data-pin-label]') as HTMLElement;

    // Right of the head (no data-label, or 'right'), vertically centred on it.
    expect(label).toHaveClass('left-full', 'ml-2', 'top-3', '-translate-y-1/2', 'hidden');
    expect(label).toHaveClass('group-data-[active]/pin:block');
    expect(label).toHaveClass(
      'group-data-[label=left]/pin:right-full',
      'group-data-[label=left]/pin:left-auto',
      'group-data-[label=left]/pin:mr-2',
      'group-data-[label=left]/pin:ml-0'
    );
    expect(label).toHaveClass(
      'group-data-[label=above]/pin:top-auto',
      'group-data-[label=above]/pin:bottom-full',
      'group-data-[label=above]/pin:mb-1',
      'group-data-[label=above]/pin:ml-0',
      'group-data-[label=above]/pin:translate-y-0',
      'group-data-[label=above]/pin:left-(--pin-label-dx)'
    );
    expect(label).toHaveClass(
      'group-data-[label=below]/pin:top-full',
      'group-data-[label=below]/pin:mt-1',
      'group-data-[label=below]/pin:ml-0',
      'group-data-[label=below]/pin:translate-y-0',
      'group-data-[label=below]/pin:left-(--pin-label-dx)'
    );
    // 'none' hides it with visibility only: never 'visible', which would override
    // the 3D layer's inherited visibility.
    expect(label).toHaveClass('group-data-[label=none]/pin:invisible');
    expect(label.className).not.toMatch(/(^|\s)(\S+:)?visible(\s|$)/);
  });

  it('renders data-u and data-v when given, and neither otherwise', () => {
    const { container: poster } = render(
      <PinMark k={1} label="Zermatt" approximate={false} u={0.25} v={0.5} />
    );
    const pin = poster.querySelector('[data-pin]') as HTMLElement;
    expect(pin).toHaveAttribute('data-u', '0.25');
    expect(pin).toHaveAttribute('data-v', '0.5');

    const { container: bare } = render(<PinMark k={1} label="Zermatt" approximate={false} />);
    const plainPin = bare.querySelector('[data-pin]') as HTMLElement;
    expect(plainPin).not.toHaveAttribute('data-u');
    expect(plainPin).not.toHaveAttribute('data-v');
  });

  it('draws an approximate position with a 2 px dashed head border and a dashed stem', () => {
    const { container } = render(<PinMark k={4} label="Riffelsee · 2,760 m approx." approximate />);
    const head = container.querySelector('[data-pin-head]') as HTMLElement;
    const stem = container.querySelector('[data-pin-stem]') as HTMLElement;

    expect(head).toHaveClass('border-2', 'border-dashed');
    expect(stem).toHaveClass('border-l', 'border-dashed', 'border-ink-muted');
    expect(stem).not.toHaveClass('bg-ink-muted');
  });

  it('renders the summit as a label-less mark', () => {
    const { container } = render(<SummitMark />);
    const mark = container.querySelector('[data-summit-mark]') as HTMLElement;
    expect(mark).not.toBeNull();
    expect(mark).toHaveClass('bg-ink-muted');
    expect(mark).toBeEmptyDOMElement();
  });
});

describe('Poster pins (HOME-05, D-09)', () => {
  it('places one pin per waypoint, in ascent order, at its UV in the sheet box', () => {
    const { container } = render(<PosterSheet />);
    const layer = container.querySelector('[data-pin-layer="poster"]') as HTMLElement;
    expect(layer).not.toBeNull();
    expect(layer).toHaveClass('pointer-events-none');
    // Above the rail scrim inside the stage (G-09-3 a, 09-19).
    expect(layer).toHaveClass('z-10');

    const pins = Array.from(layer.querySelectorAll<HTMLElement>('[data-pin]'));
    expect(pins.map((p) => p.dataset.pin)).toEqual(waypoints.map((w) => String(w.k)));
    pins.forEach((pin, i) => {
      expect(pin.style.left).toBe(`${waypoints[i].uv.u * 100}%`);
      expect(pin.style.top).toBe(`${waypoints[i].uv.v * 100}%`);
      expect(pin).toHaveAttribute('data-u', String(waypoints[i].uv.u));
      expect(pin).toHaveAttribute('data-v', String(waypoints[i].uv.v));
    });
  });

  it('labels each pin with its short place and height, approx. only when hand-placed', () => {
    const { container } = render(<PosterSheet />);
    const labels = Array.from(
      container.querySelectorAll('[data-pin-layer="poster"] [data-pin-label]'),
      (el) => el.textContent
    );

    expect(labels).toEqual(
      waypoints.map(
        (w) => `${w.shortPlace} · ${formatMetres(w.altitudeM)}${w.approximate ? ' approx.' : ''}`
      )
    );
    expect(labels.map(plain)).toEqual([
      'Zermatt · 1,617 m',
      'Gornerschlucht · 1,668 m',
      'Matterhorn Glacier Trail · 2,585 m',
      'Riffelsee · 2,760 m approx.',
    ]);
  });

  it('puts one summit mark at terrain.summit.uv', () => {
    const { container } = render(<PosterSheet />);
    const marks = container.querySelectorAll<HTMLElement>(
      '[data-pin-layer="poster"] [data-summit-mark]'
    );

    expect(marks).toHaveLength(1);
    expect(marks[0].style.left).toBe(`${terrain.summit.uv.u * 100}%`);
    expect(marks[0].style.top).toBe(`${terrain.summit.uv.v * 100}%`);
  });
});

describe('AltimeterRail (HOME-04, D-01, D-05)', () => {
  it('labels the n + 1 ticks bottom to top from the first waypoint to the official summit height', () => {
    const { container } = render(<AscentHero />);
    const ticks = Array.from(
      container.querySelectorAll<HTMLElement>('[data-ascent-rail] [data-rail-tick]')
    );
    const labels = ticks.map((t) => t.querySelector('[data-tick-label]')?.textContent);

    expect(labels).toEqual([
      ...waypoints.map((w) => `${formatMetres(w.altitudeM)}${w.approximate ? ' approx.' : ''}`),
      formatMetres(terrain.summit.officialM),
    ]);
    expect(labels[0]).toBe(formatMetres(lowestDemM));
    expect(labels.map(plain)).toEqual([
      '1,617 m',
      '1,668 m',
      '2,585 m',
      '2,760 m approx.',
      '4,478 m',
    ]);

    const bottoms = ticks.map((t) => Number.parseFloat(t.style.bottom));
    expect(bottoms).toEqual(ticks.map((_, k) => (k / waypoints.length) * 100));
  });

  it('is decorative: in the aria-hidden rail layer after the track, no live region, nothing focusable', () => {
    const { container } = render(<AscentHero />);
    const rail = container.querySelector('[data-ascent-rail]') as HTMLElement;
    const layer = rail.closest('[data-ascent-rail-layer]') as HTMLElement;
    const scrim = container.querySelector('[data-ascent-rail-scrim]') as HTMLElement;
    const track = container.querySelector('[data-ascent-track]') as HTMLElement;

    // G-09-4 N1, Tim's option B (09-17): the rail paints above the hero scrim;
    // its own scrim stays in the stage for the camera, under the pin layers (09-19).
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer).toHaveClass('pointer-events-none', 'sticky', 'col-start-1', 'row-start-1');
    expect(rail.closest('[data-ascent-stage]')).toBeNull();
    expect(track.compareDocumentPosition(layer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(scrim.closest('[data-ascent-stage]')).toHaveAttribute('aria-hidden', 'true');
    expect(scrim).toHaveClass('pointer-events-none', 'hidden', 'md:block', 'w-56');
    expect(layer.querySelector('[aria-live], a, button, [tabindex]')).toBeNull();
    expect(rail).toHaveClass('pointer-events-none', 'hidden', 'md:block');
    expect(rail.querySelector('[aria-live], a, button, [tabindex]')).toBeNull();
    expect(rail.querySelector('[data-ascent-readout]')).toHaveClass('motion-reduce:hidden');
    expect(rail.querySelector('[data-ascent-marker]')).toHaveClass('motion-reduce:hidden');
  });
});
