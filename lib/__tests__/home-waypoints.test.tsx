/**
 * Success criterion 1 of Phase 15 (DATA-09; 15-CONTEXT D-06 to D-09): adding a
 * photo outside the Home list changes nothing on Home. The generated photo
 * module is extended with one extra photo in a fresh module registry, and the
 * ascent ids and order, the 1,617 m rail start, the footer ticks and the trail
 * sign are read again from the real modules.
 *
 * Variant A puts the extra photo in another region, lower than every waypoint
 * (900 m), the photo that would have moved the rail before D-08. Variant B puts
 * it in Zermatt, unlisted, at exactly the lowest waypoint's height (the
 * adjacency edge: a DEM tie would have sorted img-9001 after img-0605 and
 * still added a fifth waypoint). Both copy img-0605's position and uv, so a
 * leak would show as a fifth footer tick.
 *
 * Components are rendered with react-dom/server from the same isolated
 * registry as the mocked data (the hero.test.tsx pattern), so the component
 * and React come from one module copy.
 */
import { buildWaypoints, homeLowestDemM } from '@/lib/ascent/waypoints';
import { countLabel } from '@/lib/home-format';
import { formatMetres } from '@/lib/photo-format';

type PhotosModule = typeof import('@/data/generated/photos');

const HOME_IDS = ['img-0605', 'img-0629', 'img-0662', 'r004-011'];
const RAIL_START_M = 1617;
const realOrder = buildWaypoints().map((w) => w.id);

function extraPhoto(region: string, m: number) {
  const { photos } = jest.requireActual<PhotosModule>('@/data/generated/photos');
  const base = photos.find((p) => p.id === 'img-0605');
  if (!base) throw new Error('home-waypoints.test: img-0605 is missing from the generated photos');
  return { ...base, id: 'img-9001', region, elevation: { source: 'dem', m } };
}

/** Renders a component from the isolated registry into a detached host. */
async function renderIsolated(load: () => Promise<{ default: () => unknown }>): Promise<HTMLElement> {
  const [{ renderToStaticMarkup }, { createElement }, { default: Component }] = await Promise.all([
    import('react-dom/server'),
    import('react'),
    load(),
  ]);
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(createElement(Component as () => null));
  return host;
}

/**
 * Mocks the generated photos with `photo` appended, inside the caller's
 * isolated registry, and asserts every Home surface is unchanged.
 */
async function expectHomeUnchanged(photo: ReturnType<typeof extraPhoto>): Promise<void> {
  jest.doMock('@/data/generated/photos', () => {
    const actual = jest.requireActual<PhotosModule>('@/data/generated/photos');
    return { ...actual, photos: [...actual.photos, photo] };
  });

  const mocked = await import('@/data/generated/photos');
  // The mock took: the global photo set now holds five photos.
  expect(mocked.photos.map((p) => p.id)).toContain('img-9001');

  const waypoints = await import('@/lib/ascent/waypoints');
  expect(waypoints.buildWaypoints().map((w) => w.id)).toEqual(realOrder);
  expect(waypoints.homeLowestDemM).toBe(RAIL_START_M);

  const footer = await renderIsolated(() => import('@/components/site/SiteFooter'));
  expect(footer.querySelectorAll('[data-tick]')).toHaveLength(4);

  const signs = await renderIsolated(() => import('@/components/home/TrailSigns'));
  expect(signs.textContent).toContain('4 waypoints');
  const photographs = signs.querySelector('a[href="/photos"]');
  expect(photographs).toHaveAttribute('aria-label', `Photographs, ${countLabel(4, 'waypoint', 'waypoints')}`);

  const hero = await renderIsolated(() => import('@/components/home/AscentHero'));
  const firstLabel = hero.querySelector('[data-ascent-rail] [data-rail-tick] [data-tick-label]');
  expect(firstLabel?.textContent).toBe(formatMetres(RAIL_START_M));
}

describe('Home reads its own waypoint list (DATA-09, success criterion 1)', () => {
  it('gives the four Home ids and the 1,617 m rail start on the real data (control)', () => {
    expect(realOrder).toEqual(HOME_IDS);
    expect(homeLowestDemM).toBe(RAIL_START_M);
  });

  it('leaves Home unchanged after adding a photo in another region, lower than every waypoint', async () => {
    const photo = extraPhoto('elsewhere', 900);
    await jest.isolateModulesAsync(() => expectHomeUnchanged(photo));
  });

  it('leaves Home unchanged after adding an unlisted Zermatt photo at exactly the lowest waypoint height', async () => {
    const photo = extraPhoto('zermatt', RAIL_START_M);
    await jest.isolateModulesAsync(() => expectHomeUnchanged(photo));
  });
});
