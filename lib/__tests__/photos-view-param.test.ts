/**
 * The gallery view parameter (PHOTO-02, D-14; 10-UI-SPEC "Page Structure",
 * URLs row): the URL is the only source of view state. `/photos` is the Map
 * (the locked default), `?view=grid` and `?view=carousel` the other two, and
 * every other value, including a wrong case, an empty string or a repeated
 * parameter, falls back to the Map (T-10-10).
 */
import { VIEWS, VIEW_LABELS, parseView, viewHref } from '@/lib/photos/view-param';

describe('VIEWS', () => {
  it('lists map, grid and carousel in that order', () => {
    expect(VIEWS).toEqual(['map', 'grid', 'carousel']);
  });

  it('labels each view for the switcher and the sr-only h2', () => {
    expect(VIEW_LABELS).toEqual({ map: 'Map', grid: 'Grid', carousel: 'Carousel' });
  });
});

describe('parseView (Map default, locked)', () => {
  it.each([
    ['undefined', undefined],
    ['an empty string', ''],
    ['a wrong case', 'MAP'],
    ['a wrong-case grid', 'Grid'],
    ['a repeated parameter', ['grid']],
    ['an unknown value', 'xyz'],
    ['a number', 1],
    ['null', null],
  ])('returns map for %s', (_, value) => {
    expect(parseView(value)).toBe('map');
  });

  it.each(['map', 'grid', 'carousel'] as const)('returns %s for itself', (view) => {
    expect(parseView(view)).toBe(view);
  });
});

describe('viewHref', () => {
  it('gives the Map the bare /photos URL', () => {
    expect(viewHref('map')).toBe('/photos');
  });

  it('puts grid and carousel in ?view=', () => {
    expect(viewHref('grid')).toBe('/photos?view=grid');
    expect(viewHref('carousel')).toBe('/photos?view=carousel');
  });

  it('round-trips through parseView for every view', () => {
    for (const view of VIEWS) {
      const query = new URL(viewHref(view), 'http://localhost').searchParams.get('view');
      expect(parseView(query ?? undefined)).toBe(view);
    }
  });
});
