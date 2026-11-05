/**
 * The Direct contact panel (CONTACT-01; D-01, D-06, D-08; 12-UI-SPEC "Direct
 * contact panel"): a <section aria-labelledby> with a <dl> of Email,
 * Location, Replies and Elsewhere. The Location row exists only when a
 * confirmed location is passed, and shows it at 2 decimals.
 */
import { render, screen, within } from '@testing-library/react';
import DirectContactPanel from '../DirectContactPanel';
import { site } from '@/data/site';

const ZURICH = { name: 'Zürich', lat: 47.37, lon: 8.54, source: 'test' };

const terms = () => screen.getAllByRole('term').map((dt) => dt.textContent);

/**
 * The Location value's exact text. Testing Library's string matchers compare
 * whitespace-normalised node text, which would turn formatLatLon's no-break
 * spaces into plain ones; textContent keeps them.
 */
const locationText = () =>
  (screen.getByText('Location').closest('div') as HTMLElement).querySelector('dd')?.textContent;

/** formatLatLon's U+00A0 between each figure and its hemisphere letter. */
const ZURICH_LINE = '47.37\u00a0N · 8.54\u00a0E · Zürich';

describe('DirectContactPanel', () => {
  it('is a region named Direct contact, not a complementary landmark', () => {
    render(<DirectContactPanel email={site.email} location={ZURICH} links={site.links} />);

    const region = screen.getByRole('region', { name: 'Direct contact' });
    expect(region.tagName).toBe('SECTION');
    expect(screen.getByRole('heading', { level: 2, name: 'Direct contact' })).toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('lists Email, Location, Replies and Elsewhere when a location is set', () => {
    render(<DirectContactPanel email={site.email} location={ZURICH} links={site.links} />);

    expect(terms()).toEqual(['Email', 'Location', 'Replies', 'Elsewhere']);
  });

  it('omits the Location row when no location is set and keeps the others', () => {
    render(<DirectContactPanel email={site.email} links={site.links} />);

    expect(terms()).toEqual(['Email', 'Replies', 'Elsewhere']);
    expect(screen.queryByText('Location')).not.toBeInTheDocument();
    expect(screen.getByText('Usually within a few days')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
  });

  it('shows the address as one selectable string with a break chance after @', () => {
    const { container } = render(
      <DirectContactPanel email={site.email} location={ZURICH} links={site.links} />,
    );

    const address = container.querySelector('#contact-email');
    expect(address).not.toBeNull();
    expect(address?.textContent).toBe(site.email);
    const wbr = address?.querySelector('wbr');
    expect(wbr).not.toBeNull();
    expect(wbr?.previousSibling?.textContent?.endsWith('@')).toBe(true);
  });

  it('offers Copy and a mailto link carrying exactly the address', () => {
    render(<DirectContactPanel email={site.email} location={ZURICH} links={site.links} />);

    expect(screen.getByRole('button', { name: 'Copy email address' })).toHaveTextContent('Copy');
    expect(screen.getByRole('link', { name: 'Write an email' })).toHaveAttribute(
      'href',
      `mailto:${site.email}`,
    );
  });

  it('reads the location at 2 decimals with the place name as written', () => {
    render(<DirectContactPanel email={site.email} location={ZURICH} links={site.links} />);

    expect(locationText()).toBe(ZURICH_LINE);
  });

  it('never shows more than 2 decimals, even for a more precise input', () => {
    render(
      <DirectContactPanel
        email={site.email}
        location={{ ...ZURICH, lat: 47.37444, lon: 8.54111 }}
        links={site.links}
      />,
    );

    expect(locationText()).toBe(ZURICH_LINE);
    expect(screen.queryByText(/47\.374/)).not.toBeInTheDocument();
  });

  it('says how soon Tim replies and links his profiles from site data', () => {
    render(<DirectContactPanel email={site.email} location={ZURICH} links={site.links} />);

    const replies = screen.getByText('Replies').closest('div') as HTMLElement;
    expect(within(replies).getByText('Usually within a few days')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', site.links.github);
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      site.links.linkedin,
    );
  });

  it('names nothing Name or Message, so the register labels stay unique', () => {
    render(<DirectContactPanel email={site.email} location={ZURICH} links={site.links} />);

    expect(screen.queryAllByRole('button', { name: /Name|Message/i })).toHaveLength(0);
    expect(screen.queryAllByRole('link', { name: /Name|Message/i })).toHaveLength(0);
  });
});
