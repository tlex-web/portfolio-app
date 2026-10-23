import { render, screen, within } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import SiteChrome from '../SiteChrome';
import { site } from '@/data/site';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function renderChrome(variant?: 'default' | 'static') {
  return render(
    <SiteChrome variant={variant}>
      <h1>Page body</h1>
    </SiteChrome>
  );
}

describe('SiteChrome', () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUsePathname.mockReturnValue('/');
  });

  it('renders one Primary nav inside one header, one main#main-content and one footer without a nav', () => {
    renderChrome();

    const navs = screen.getAllByRole('navigation');
    expect(navs).toHaveLength(1);
    expect(navs[0]).toHaveAccessibleName('Primary');

    const banner = screen.getByRole('banner');
    expect(banner).toContainElement(navs[0]);

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
    expect(main).toHaveTextContent('Page body');

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders the skip link as the first focusable element, targeting #main-content', () => {
    const { container } = renderChrome();

    const first = container.querySelector(FOCUSABLE);
    expect(first).toHaveTextContent('Skip to main content');
    expect(first).toHaveAttribute('href', '#main-content');
  });

  it('points the footer GitHub, LinkedIn and Email links at the site identity values', () => {
    renderChrome();

    const elsewhere = within(screen.getByRole('contentinfo')).getByRole('list', { name: 'Elsewhere' });
    expect(within(elsewhere).getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', site.links.github);
    expect(within(elsewhere).getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', site.links.linkedin);

    const email = within(elsewhere).getByRole('link', { name: 'Email' });
    expect(email.getAttribute('href')).toMatch(/^mailto:/);
    expect(email).toHaveAttribute('href', `mailto:${site.email}`);

    for (const link of within(elsewhere).getAllByRole('link')) {
      expect(link).not.toHaveAttribute('target');
    }
  });

  it('shows the footer identity and the current year', () => {
    renderChrome();

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText('Developer & photographer')).toBeInTheDocument();
    expect(
      within(footer).getByText(`© ${new Date().getFullYear()} Tim Lui. All rights reserved.`)
    ).toBeInTheDocument();
  });

  it('marks only Engineering as current on a project detail page', () => {
    mockUsePathname.mockReturnValue('/projects/clix-cli');
    renderChrome();

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getByRole('link', { name: 'Engineering' })).toHaveAttribute('aria-current', 'page');

    const current = within(nav)
      .getAllByRole('link')
      .filter((link) => link.hasAttribute('aria-current'));
    expect(current).toHaveLength(1);
  });

  it('marks only Home as current on the home page', () => {
    mockUsePathname.mockReturnValue('/');
    renderChrome();

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const current = within(nav)
      .getAllByRole('link')
      .filter((link) => link.hasAttribute('aria-current'));
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName('Home');
  });

  it('renders the static variant as five plain links with no current state and no Menu button', () => {
    renderChrome('static');

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    for (const { label, href } of site.nav) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
    expect(within(nav).getAllByRole('listitem')).toHaveLength(5);
    expect(nav.querySelector('[aria-current]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
    expect(mockUsePathname).not.toHaveBeenCalled();
  });
});
