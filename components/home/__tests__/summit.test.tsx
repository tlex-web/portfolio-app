/**
 * The end of the ascent and the way past it (HOME-03, HOME-06; D-13, D-14,
 * D-15; 09-UI-SPEC "Summit Section", "Hero Block" cue row and "About and
 * Contact"): the summit plaque with its derived stats and repeated trail
 * signs, the hero's two cue links, and the About and contact block. Every
 * expected string comes from summitPlaque(), data/home.ts or buildWaypoints().
 */
import { getDefaultNormalizer, render, screen, within } from '@testing-library/react';
import AboutSection from '../AboutSection';
import HeroBlock from '../HeroBlock';
import SummitDetails from '../SummitDetails';
import SummitPlaque from '../SummitPlaque';
import { home } from '@/data/home';
import { summitPlaque } from '@/lib/ascent/summit';
import { buildWaypoints } from '@/lib/ascent/waypoints';

/** The formatters put U+00A0 before units; keep it when matching text. */
const keepSpaces = { normalizer: getDefaultNormalizer({ collapseWhitespace: false }) };

describe('SummitPlaque (HOME-06, D-03, D-13)', () => {
  const plaque = summitPlaque();

  it('is section#summit, focusable by script and labelled by its h2', () => {
    const { container } = render(<SummitPlaque />);
    const section = container.querySelector('section#summit');

    expect(section).not.toBeNull();
    expect(section).toHaveAttribute('tabindex', '-1');
    expect(section).toHaveAttribute('aria-labelledby', 'summit-title');
    expect(section).toHaveAttribute('data-ascent-block', 'summit');
    expect(screen.getByRole('region', { name: plaque.title })).toBe(section);
    expect(screen.getByRole('heading', { level: 2, name: 'Matterhorn summit' })).toHaveAttribute(
      'id',
      'summit-title',
    );
  });

  it('prints the derived kicker and summit height', () => {
    render(<SummitPlaque />);

    expect(screen.getByText(plaque.kicker, keepSpaces)).toBeInTheDocument();
    expect(screen.getByText(plaque.height, keepSpaces)).toBeInTheDocument();
  });

  it('lists the four stats in order, each value with its note', () => {
    const { container } = render(<SummitPlaque />);
    const terms = [...container.querySelectorAll('dl > div > dt')];
    const details = [...container.querySelectorAll('dl > div > dd')];

    expect(terms.map((dt) => dt.textContent)).toEqual(plaque.stats.map((s) => s.label));
    expect(details).toHaveLength(4);
    plaque.stats.forEach((stat, i) => {
      expect(details[i].textContent).toBe(`${stat.value}${stat.note ?? ''}`);
      if (stat.note) {
        expect(within(details[i] as HTMLElement).getByText(stat.note)).toHaveClass('block', 'text-sm', 'text-ink-muted');
      }
    });
  });

  it('repeats the trail signs below the plaque', () => {
    render(<SummitPlaque />);

    expect(screen.getAllByRole('list', { name: 'Trail signs' })).toHaveLength(1);
  });

  it('collapses to the compact plate under summit-compact, with no block scrim (G-09-2, 09-18)', () => {
    const { container } = render(<SummitPlaque />);

    expect(screen.getByText(plaque.kicker, keepSpaces)).toHaveClass('summit-compact:motion-safe:hidden');
    expect(container.querySelector('dl')).toHaveClass('summit-compact:motion-safe:hidden');
    expect(container.querySelector('[data-summit-plaque]')).toHaveClass('summit-compact:motion-safe:max-w-80');
    const gradients = [...container.querySelectorAll('*')].filter((el) =>
      /(^|\s)(\S+:)*bg-(linear|radial|conic|gradient)-/.test(el.getAttribute('class') ?? ''),
    );
    expect(gradients).toEqual([]);
  });
});

describe('SummitDetails (HOME-06; G-09-2, 09-18)', () => {
  const plaque = summitPlaque();

  it('renders the kicker and the four stats in order', () => {
    const { container } = render(<SummitDetails />);

    expect(screen.getByText(plaque.kicker, keepSpaces)).toBeInTheDocument();
    const terms = [...container.querySelectorAll('dl > div > dt')];
    expect(terms.map((dt) => dt.textContent)).toEqual(plaque.stats.map((s) => s.label));
    expect(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(0);
  });

  it('is a group labelled by the summit h2, shown only in the compact layout', () => {
    render(
      <>
        <SummitPlaque />
        <SummitDetails />
      </>,
    );
    const group = screen.getByRole('group', { name: plaque.title });

    expect(group).toHaveAttribute('data-summit-details');
    expect(group).toHaveAttribute('aria-labelledby', 'summit-title');
    expect(group).toHaveClass('hidden', 'summit-compact:motion-safe:block');
  });
});

describe('HeroBlock cue links (HOME-03, D-13, D-15)', () => {
  it('links Start the ascent to the first waypoint and Skip to the summit to #summit', () => {
    render(<HeroBlock />);
    const start = screen.getByRole('link', { name: 'Start the ascent' });
    const skip = screen.getByRole('link', { name: 'Skip to the summit' });

    expect(start).toHaveAttribute('href', `#waypoint-${buildWaypoints()[0].slug}`);
    expect(start).toHaveAttribute('href', '#waypoint-matterhorn-from-zermatt');
    expect(skip).toHaveAttribute('href', '#summit');
    for (const link of [start, skip]) {
      expect(link.querySelectorAll('svg')).toHaveLength(1);
      expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      expect(link).toHaveClass('min-h-11');
    }
  });

  it('wraps the cue row instead of overflowing', () => {
    render(<HeroBlock />);
    const row = screen.getByRole('link', { name: 'Start the ascent' }).parentElement;

    expect(row).toHaveClass('flex', 'flex-wrap', 'gap-x-6', 'gap-y-2');
  });
});

describe('AboutSection (D-14, DRAFT copy)', () => {
  const { contactLink, roadmapLink } = home.about.contact;

  it('is a region labelled by its h2 About', () => {
    render(<AboutSection />);
    const heading = screen.getByRole('heading', { level: 2, name: 'About' });

    expect(heading).toHaveAttribute('id', 'about-title');
    expect(screen.getByRole('region', { name: 'About' })).toHaveAttribute('aria-labelledby', 'about-title');
  });

  it('renders the body copy from data/home.ts as one paragraph', () => {
    render(<AboutSection />);
    const body = screen.getByText(home.about.body);

    expect(body.tagName).toBe('P');
    expect(body).toHaveTextContent(home.about.body);
  });

  it('links the contact line to /contact and /roadmap as prose links', () => {
    render(<AboutSection />);
    const contact = screen.getByRole('link', { name: contactLink.label });
    const roadmap = screen.getByRole('link', { name: roadmapLink.label });

    expect(contact).toHaveAttribute('href', contactLink.href);
    expect(contact).toHaveAttribute('href', '/contact');
    expect(roadmap).toHaveAttribute('href', roadmapLink.href);
    expect(roadmap).toHaveAttribute('href', '/roadmap');
    expect(contact.closest('p')).toBe(roadmap.closest('p'));
    const { lead, middle, end } = home.about.contact;
    expect(contact.closest('p')).toHaveTextContent(
      `${lead}${contactLink.label}${middle}${roadmapLink.label}${end}`,
    );
    for (const link of [contact, roadmap]) expect(link).toHaveClass('prose-link');
  });
});
