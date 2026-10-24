/**
 * Home first viewport (HOME-01, HOME-02, HOME-06; D-11, D-13, D-17;
 * 09-UI-SPEC "Stage: Poster, Sheet Box and Canvas", "Hero Block" and "Trail
 * Signs"): the relief poster, the hero copy and the two trail signs, all
 * server components rendered from real data.
 */
import { render, screen, within } from '@testing-library/react';
import PosterSheet from '../PosterSheet';
import HeroBlock from '../HeroBlock';
import TrailSigns from '../TrailSigns';
import { terrain } from '@/data/generated/terrain';
import { photos } from '@/data/generated/photos';
import { projects } from '@/data/projects';
import { home } from '@/data/home';
import { site } from '@/data/site';
import { lv95ToWgs84 } from '@/lib/geo';
import { countLabel, formatLatLon } from '@/lib/home-format';

const waypoints = countLabel(photos.length, 'waypoint', 'waypoints');
const routes = countLabel(projects.length, 'route', 'routes');

describe('PosterSheet (HOME-02, D-17)', () => {
  it('takes both picture sources from terrain.assets.hillshade at 640w and 1100w', () => {
    const { container } = render(<PosterSheet />);
    const sources = container.querySelectorAll('picture > source');
    const { avif, webp } = terrain.assets.hillshade;

    expect(sources).toHaveLength(2);
    expect(sources[0]).toHaveAttribute('type', 'image/avif');
    expect(sources[0]).toHaveAttribute('srcset', `${avif['640']} 640w, ${avif['1100']} 1100w`);
    expect(sources[1]).toHaveAttribute('type', 'image/webp');
    expect(sources[1]).toHaveAttribute('srcset', `${webp['640']} 640w, ${webp['1100']} 1100w`);
  });

  it('renders the poster img as an eager, high-priority, pre-sized decorative image', () => {
    const { container } = render(<PosterSheet />);
    const img = container.querySelector('img[data-poster-img]') as HTMLImageElement;

    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', terrain.assets.hillshade.webp['1100']);
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).toHaveAttribute('width', '1100');
    expect(img).toHaveAttribute('height', '1100');
    expect(img).toHaveClass('opacity-(--relief-opacity)');
  });

  it('lays the hero contour field over the relief', () => {
    const { container } = render(<PosterSheet />);
    const field = container.querySelector('.bg-contour') as HTMLElement;

    expect(field).not.toBeNull();
    expect(field.style.maskImage).toContain(terrain.assets.contours.hero);
  });

  it('emits no preload link', () => {
    const { container } = render(<PosterSheet />);
    expect(container.querySelector('link')).toBeNull();
  });
});

describe('HeroBlock (HOME-01, D-11)', () => {
  it('renders the derived kicker, one h1 with site.name, the role and the thesis', () => {
    render(<HeroBlock />);

    expect(screen.getByText(formatLatLon(lv95ToWgs84(terrain.summit.lv95)))).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(site.name);
    expect(screen.getByText(site.role)).toBeInTheDocument();
    expect(screen.getByText(home.thesis)).toBeInTheDocument();
  });

  it('holds the trail signs inside the hero block', () => {
    const { container } = render(<HeroBlock />);
    const block = container.querySelector('[data-ascent-block="hero"]') as HTMLElement;

    expect(block).not.toBeNull();
    expect(within(block).getByRole('list', { name: 'Trail signs' })).toBeInTheDocument();
  });
});

describe('TrailSigns (D-13)', () => {
  it('renders two signs named by destination and data-derived count', () => {
    render(<TrailSigns />);
    const list = screen.getByRole('list', { name: 'Trail signs' });
    const links = within(list).getAllByRole('link');

    expect(links).toHaveLength(2);
    expect(within(list).getByRole('link', { name: `Photographs, ${waypoints}` })).toHaveAttribute('href', '/photos');
    expect(within(list).getByRole('link', { name: `Engineering, ${routes}` })).toHaveAttribute('href', '/projects');
  });

  it('uses bg-trail only on the decorative tip', () => {
    const { container } = render(<TrailSigns />);
    const tips = container.querySelectorAll('.bg-trail');

    expect(tips).toHaveLength(2);
    for (const tip of Array.from(tips)) expect(tip).toHaveAttribute('aria-hidden', 'true');
  });

  it('prints the destination only when a count is zero', () => {
    jest.isolateModules(() => {
      jest.doMock('@/data/projects', () => ({ projects: [] }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- fresh registry with the mocked data
      const { renderToStaticMarkup } = require('react-dom/server');
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- fresh registry with the mocked data
      const Isolated = require('../TrailSigns').default;
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- same React copy as the component
      const { createElement } = require('react');
      const host = document.createElement('div');
      host.innerHTML = renderToStaticMarkup(createElement(Isolated));
      document.body.appendChild(host);

      expect(within(host).getByRole('link', { name: 'Engineering' })).toHaveAttribute('href', '/projects');
      expect(within(host).getByRole('link', { name: `Photographs, ${waypoints}` })).toBeInTheDocument();
      host.remove();
    });
  });
});
