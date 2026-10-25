/**
 * Waypoint cards and the waypoint list (HOME-05; D-07, D-08, D-10, D-20;
 * 09-UI-SPEC "Waypoint Cards"): every card field in DOM order, the photo from
 * the content-hashed manifest variants, and one ordered list of stage blocks
 * in ascending DEM height. Server components rendered from real data.
 */
import { render, screen, within } from '@testing-library/react';
import WaypointCard from '../WaypointCard';
import AscentHero from '../AscentHero';
import { buildWaypoints, waypointKicker, waypointKickerParts } from '@/lib/ascent/waypoints';

const waypoints = buildWaypoints();
const second = waypoints[1];

describe('WaypointCard (HOME-05, D-07, D-10)', () => {
  it('is a section labelled by its h2 title', () => {
    render(<WaypointCard waypoint={second} />);
    const section = screen.getByRole('region', { name: second.title });
    const heading = within(section).getByRole('heading', { level: 2, name: second.title });
    expect(heading).toHaveAttribute('id', `waypoint-${second.slug}-title`);
    expect(section).toHaveAttribute('aria-labelledby', `waypoint-${second.slug}-title`);
  });

  it('renders kicker, h2, picture, place and date, story and link in DOM order', () => {
    const { container } = render(<WaypointCard waypoint={second} />);
    const section = container.querySelector('section')!;
    // The kicker and the place line span child elements (their break points,
    // G-09-3 b, G-09-4 N2), and ByText matches an element's own text nodes
    // only, so match the paragraph whose whole textContent is the string.
    const paragraphWithText = (text: string) =>
      screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === text);
    const order = [
      paragraphWithText(waypointKicker(second)),
      screen.getByRole('heading', { level: 2 }),
      section.querySelector('picture')!,
      paragraphWithText(second.placeDate),
      screen.getByText(second.story),
      screen.getByRole('link', { name: `View photo: ${second.title}` }),
    ];
    order.forEach((el) => expect(el).not.toBeNull());
    for (let i = 1; i < order.length; i++) {
      // DOCUMENT_POSITION_FOLLOWING: each element comes after the previous one.
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it('lists the AVIF source before the WebP source, each with 640w and 1024w', () => {
    const { container } = render(<WaypointCard waypoint={second} />);
    const sources = container.querySelectorAll('picture > source');
    expect(sources).toHaveLength(2);
    expect(sources[0]).toHaveAttribute('type', 'image/avif');
    expect(sources[0]).toHaveAttribute('srcset', second.image.srcSetAvif);
    expect(sources[1]).toHaveAttribute('type', 'image/webp');
    expect(sources[1]).toHaveAttribute('srcset', second.image.srcSetWebp);
    for (const source of sources) {
      expect(source).toHaveAttribute('sizes', '(min-width: 768px) 400px, 128px');
    }
  });

  it('pre-sizes a lazy img at the photo ratio with the editorial alt', () => {
    render(<WaypointCard waypoint={second} />);
    const img = screen.getByRole('img', { name: second.alt }) as HTMLImageElement;
    expect(img).toHaveAttribute('src', second.image.src);
    expect(img).toHaveAttribute('width', String(second.image.width));
    expect(img).toHaveAttribute('height', String(second.image.height));
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img.style.aspectRatio).toBe(`${second.image.width} / ${second.image.height}`);
    expect(img).toHaveClass('bg-surface-overlay');
  });

  it('links View photo to the gallery fragment of its slug', () => {
    render(<WaypointCard waypoint={second} />);
    const link = screen.getByRole('link', { name: `View photo: ${second.title}` });
    expect(link).toHaveAttribute('href', `/photos#${second.slug}`);
    expect(link).toHaveTextContent(/^View photo/);
  });

  it('hides the story in the docked panel only, and pads the panel past the safe area (D-20)', () => {
    const { container } = render(<WaypointCard waypoint={second} />);
    const story = screen.getByText(second.story);
    expect(story).toHaveClass('hidden', 'md:block', 'motion-reduce:block');
    const section = container.querySelector('section')!;
    expect(section).toHaveClass('sticky', 'bottom-0', 'md:static', 'motion-reduce:static', 'ascent-card-fade');
    expect(section.className).toContain('env(safe-area-inset-bottom)');
  });
});

describe('WaypointCard break points (G-09-3 b, G-09-4 N2; D-10, D-20)', () => {
  it('renders the kicker as two nowrap parts that read as the kicker', () => {
    const { container } = render(<WaypointCard waypoint={second} />);
    const parts = [...container.querySelectorAll('[data-kicker-part]')];
    expect(parts.map((el) => el.getAttribute('data-kicker-part'))).toEqual(['altitude', 'waypoint']);
    expect(parts.map((el) => el.textContent)).toEqual([...waypointKickerParts(second)]);
    for (const part of parts) expect(part).toHaveClass('whitespace-nowrap');
    expect(parts[0].parentElement!.textContent).toBe(waypointKicker(second));
  });

  it('glues a nowrap separator-and-date tail to the place, hidden separator and block date docked', () => {
    const { container } = render(<WaypointCard waypoint={second} />);
    const tail = container.querySelector('[data-place-tail]')!;
    const sep = tail.querySelector('[data-place-sep]')!;
    const date = tail.querySelector('[data-place-date]')!;
    expect(tail).toHaveClass('whitespace-nowrap');
    expect(sep).toHaveClass('hidden', 'md:inline', 'motion-reduce:inline');
    expect(sep.textContent).toBe(' · ');
    expect(date).toHaveClass('block', 'md:inline', 'motion-reduce:inline');
    expect(date.textContent).toBe(second.captureMonth);
    // No whitespace between the place text and the tail: the tail can never start a line.
    expect(tail.previousSibling?.textContent).toBe(second.place);
    expect(tail.parentElement!.textContent).toBe(second.placeDate);
  });
});

describe('AscentHero waypoint list (HOME-05, D-08)', () => {
  it('renders one ol labelled "Waypoints, lowest first" with a stage block per photo, ascending', () => {
    render(<AscentHero />);
    const list = screen.getByRole('list', { name: 'Waypoints, lowest first' });
    expect(screen.getAllByRole('list', { name: 'Waypoints, lowest first' })).toHaveLength(1);
    const items = within(list).getAllByRole('listitem');
    expect(items.map((li) => li.id)).toEqual(waypoints.map((w) => `waypoint-${w.slug}`));
    items.forEach((li, i) => {
      expect(li).toHaveAttribute('data-ascent-block', 'waypoint');
      expect(li).toHaveAttribute('data-k', String(i + 1));
      expect(within(li).getByRole('heading', { level: 2 })).toHaveTextContent(waypoints[i].title);
    });
  });
});
