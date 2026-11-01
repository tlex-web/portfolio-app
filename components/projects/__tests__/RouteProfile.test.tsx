/**
 * RouteProfile (D-05, D-06, D-07; 11-UI-SPEC "RouteProfile glyph") and the
 * trailhead figure (11-UI-SPEC "Trailhead"). Expected captions are built from
 * the generated trail profiles and formatMetres, never typed heights, so a
 * changed DEM endpoint changes the expectation with the caption. Assertions use
 * roles, text, attributes, data attributes and DOM order only.
 */
import { render, screen, within } from '@testing-library/react';
import { trailProfiles } from '@/data/generated/trail-profiles';
import { projects } from '@/data/projects';
import type { Project } from '@/data/types';
import { formatMetres } from '@/lib/photo-format';
import RouteProfile from '../RouteProfile';
import Trailhead from '../Trailhead';

function profileOf(id: string) {
  const profile = trailProfiles.find((p) => p.id === id);
  if (!profile) throw new Error(`no generated profile ${id}`);
  return profile;
}

function projectOf(slug: string): Project {
  const project = projects.find((p) => p.slug === slug);
  if (!project) throw new Error(`no project ${slug}`);
  return project;
}

/** The caption as read on screen: '{start} {h} m → {end} {h} m · T4' (U+00A0 before each m). */
function visibleCaption(id: string): string {
  const p = profileOf(id);
  return `${p.start.name} ${formatMetres(p.start.heightM)} → ${p.end.name} ${formatMetres(p.end.heightM)} · ${p.sacGrade}`;
}

/** The caption with its sr-only words and without its aria-hidden glyphs, as a screen reader hears it. */
function accessibleCaption(figcaption: HTMLElement): string {
  const clone = figcaption.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[aria-hidden="true"]').forEach((el) => el.remove());
  return clone.textContent ?? '';
}

/** The caption with its aria-hidden glyphs and without its sr-only words, as it reads on screen. */
function screenCaption(figcaption: HTMLElement): string {
  const clone = figcaption.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.sr-only').forEach((el) => el.remove());
  return clone.textContent ?? '';
}

describe('RouteProfile', () => {
  it('renders one figure with one decorative svg holding exactly three paths', () => {
    const { container } = render(<RouteProfile id="hoernliweg-27" />);

    const figures = container.querySelectorAll('figure');
    expect(figures).toHaveLength(1);
    const svgs = figures[0].querySelectorAll('svg');
    expect(svgs).toHaveLength(1);
    const svg = svgs[0];
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveAttribute('viewBox', '0 0 320 96');
    expect(svg).toHaveAttribute('preserveAspectRatio', 'none');
    expect(svg.querySelectorAll('path')).toHaveLength(3);
    expect(svg.querySelectorAll('text, circle')).toHaveLength(0);
    const line = Array.from(svg.querySelectorAll('path')).filter(
      (path) => path.getAttribute('vector-effect') === 'non-scaling-stroke'
    );
    expect(line).toHaveLength(2);
  });

  it("captions box's Hörnliweg with its DEM heights and the T4 white-blue-white waymark", () => {
    render(<RouteProfile id="hoernliweg-27" />);

    const figcaption = screen.getByRole('figure').querySelector('figcaption') as HTMLElement;
    expect(figcaption).not.toBeNull();
    expect(screenCaption(figcaption)).toBe(visibleCaption('hoernliweg-27'));
    const p = profileOf('hoernliweg-27');
    expect(accessibleCaption(figcaption)).toBe(
      `${p.start.name} ${formatMetres(p.start.heightM)} to ${p.end.name} ${formatMetres(p.end.heightM)}, T4, white-blue-white waymark`
    );
    expect(within(figcaption).getByText('→')).toHaveAttribute('aria-hidden', 'true');
    expect(figcaption.querySelector('[data-marker]')).toHaveAttribute(
      'data-marker',
      'white-blue-white'
    );
  });

  it("captions coin-flip's Zmutt path with T1 and the yellow waymark", () => {
    render(<RouteProfile id="zmutt-2" />);

    const figcaption = screen.getByRole('figure').querySelector('figcaption') as HTMLElement;
    expect(screenCaption(figcaption)).toBe(visibleCaption('zmutt-2'));
    expect(within(figcaption).getByText('T1')).toBeInTheDocument();
    expect(figcaption.querySelector('[data-marker]')).toHaveAttribute('data-marker', 'yellow');
  });

  it('renders nothing for a trail with no committed profile (no placeholder, no generic mountain)', () => {
    const { container } = render(<RouteProfile id="no-such-trail" />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('Trailhead figure', () => {
  it.each(['box', 'coin-flip'])(
    'renders the %s route profile after the title column, once',
    (slug) => {
      const project = projectOf(slug);
      if (!project.route) throw new Error(`${slug} has no route`);
      render(<Trailhead project={project} />);

      const figures = screen.getAllByRole('figure');
      expect(figures).toHaveLength(1);
      const figcaption = figures[0].querySelector('figcaption') as HTMLElement;
      expect(screenCaption(figcaption)).toBe(visibleCaption(project.route));
      const heading = screen.getByRole('heading', { level: 1 });
      expect(
        heading.compareDocumentPosition(figures[0]) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      expect(figures[0].contains(heading)).toBe(false);
    }
  );

  it('renders no figure for a project without a route', () => {
    const project = { ...projectOf('box'), route: undefined };
    render(<Trailhead project={project} />);

    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
  });
});
