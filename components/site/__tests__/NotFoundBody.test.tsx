/**
 * EDGE-01, D-10, D-11 (12-UI-SPEC "Per-page content"): the marked-trail 404.
 *
 * Every variant shows the locked kicker and h1, one sentence and the primary
 * homepage link. The context (a two-value enum, never a slug) picks Tim's
 * sentence and puts the missed section's link first. The 404 never moves
 * focus: the route announcer reads the title (T-12-24: no slug prop exists).
 */
import { render, screen, within } from '@testing-library/react';
import NotFoundBody from '../NotFoundBody';

const GENERIC = "There's no page at this address; the link may be mistyped or out of date.";
const PHOTO = 'No photograph at this address.';
const PROJECT = 'No project at this address.';

/** The text links after the primary action, in DOM order, as [label, href]. */
function textLinks() {
  const [, ...rest] = screen.getAllByRole('link');
  return rest.map((a) => [a.textContent, a.getAttribute('href')]);
}

describe('NotFoundBody', () => {
  it('shows the locked kicker and h1', () => {
    render(<NotFoundBody />);

    expect(screen.getByText('Error 404 · Page not found')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: "You've left the marked trail" })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading')).toHaveLength(1);
  });

  it('without a context shows the generic sentence and the Photographs and Engineering links', () => {
    render(<NotFoundBody />);

    expect(screen.getByText(GENERIC)).toBeInTheDocument();
    expect(screen.queryByText(PHOTO)).not.toBeInTheDocument();
    expect(screen.queryByText(PROJECT)).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')[0]).toHaveTextContent('Go to the homepage');
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/');
    expect(textLinks()).toEqual([
      ['Photographs', '/photos'],
      ['Engineering', '/projects'],
    ]);
  });

  it('for a photo miss shows the photo sentence, then All photographs and Engineering', () => {
    render(<NotFoundBody context="photos" />);

    expect(screen.getByText(PHOTO)).toBeInTheDocument();
    expect(screen.queryByText(GENERIC)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the homepage' })).toHaveAttribute('href', '/');
    expect(textLinks()).toEqual([
      ['All photographs', '/photos'],
      ['Engineering', '/projects'],
    ]);
  });

  it('for a project miss shows the project sentence, then All routes and Photographs', () => {
    render(<NotFoundBody context="projects" />);

    expect(screen.getByText(PROJECT)).toBeInTheDocument();
    expect(screen.queryByText(GENERIC)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the homepage' })).toHaveAttribute('href', '/');
    expect(textLinks()).toEqual([
      ['All routes', '/projects'],
      ['Photographs', '/photos'],
    ]);
  });

  it('accepts only the section context, never a slug', () => {
    // @ts-expect-error NotFoundBody takes no slug: the requested address is never passed in (T-12-24).
    const { container } = render(<NotFoundBody slug="nf-secret-slug" />);

    expect(container.innerHTML).not.toContain('nf-secret-slug');
    expect(screen.getByText(GENERIC)).toBeInTheDocument();
  });

  it('moves no focus and adds no tabindex', () => {
    const { container } = render(<NotFoundBody context="photos" />);

    expect(document.activeElement).toBe(document.body);
    expect(container.querySelectorAll('[tabindex]')).toHaveLength(0);
  });

  it('renders the decorative edge art next to the text', () => {
    const { container } = render(<NotFoundBody />);

    const art = container.querySelector('svg')!.closest('[aria-hidden="true"]') as HTMLElement;
    expect(art).not.toBeNull();
    expect(within(art).queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 1 }).compareDocumentPosition(art) &
      Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
