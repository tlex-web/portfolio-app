import { fireEvent, render, screen } from '@testing-library/react';
import NextLink from 'next/link';
import ErrorBody from '../ErrorBody';
import SectionError from '@/app/(site)/error';

// A pass-through next/link, so the test can tell router links from plain anchors: the root
// variant renders inside global-error, which must not depend on the router (D-09).
jest.mock('next/link', () => ({
  __esModule: true,
  default: jest.fn(
    ({ href, children, ...rest }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  ),
}));

const mockLink = NextLink as unknown as jest.Mock;

const SECRET_MESSAGE = 'secret-stack-detail';
const SECRET_DIGEST = 'abc123';

function secretError() {
  return Object.assign(new Error(SECRET_MESSAGE), { digest: SECRET_DIGEST });
}

/** The EdgeArt sheet: an aria-hidden box holding the dashed trail. */
function artSheet(container: HTMLElement) {
  return container.querySelector('[aria-hidden="true"] svg path[stroke-dasharray="8 6"]');
}

describe('ErrorBody', () => {
  beforeEach(() => {
    mockLink.mockClear();
  });

  it('renders the section copy: Error eyebrow, h1, body, Try again and a homepage link', () => {
    render(<ErrorBody variant="section" onRetry={jest.fn()} />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
    expect(
      screen.getByText('This page hit an unexpected error. Try again, or go back to the homepage.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('link', { name: 'Go to the homepage' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('button', { name: 'Reload page' })).not.toBeInTheDocument();
  });

  it('renders the root copy with a Reload page button instead of the homepage link', () => {
    render(<ErrorBody variant="root" onRetry={jest.fn()} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText('The site failed to load. Try again, or reload the page.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload page' })).toHaveAttribute('type', 'button');
    expect(screen.queryByRole('link', { name: 'Go to the homepage' })).not.toBeInTheDocument();
  });

  it('moves focus to the h1 (tabIndex -1) on mount', () => {
    render(<ErrorBody variant="section" onRetry={jest.fn()} />);

    const heading = screen.getByRole('heading', { level: 1, name: 'Something went wrong' });
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(heading).toHaveFocus();
  });

  it('calls onRetry once when Try again is pressed', () => {
    const onRetry = jest.fn();
    render(<ErrorBody variant="section" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('reloads the page when Reload page is pressed', () => {
    // jsdom's location.reload is non-configurable, so it cannot be spied on. It reports the
    // reload it cannot perform as "Not implemented: navigation" on console.error.
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onRetry = jest.fn();
    render(<ErrorBody variant="root" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reload page' }));

    const messages = consoleError.mock.calls.map((args) => args.map(String).join(' '));
    expect(messages.some((message) => /Not implemented: navigation/.test(message))).toBe(true);
    expect(onRetry).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('sits in the edge layout next to the aria-hidden EdgeArt sheet (D-09)', () => {
    const { container } = render(<ErrorBody variant="section" onRetry={jest.fn()} />);

    expect(container.querySelector('.grid')).not.toBeNull();
    const trail = artSheet(container);
    expect(trail).not.toBeNull();
    expect(trail?.closest('[aria-hidden="true"]')?.querySelector('circle')).not.toBeNull();
    expect(trail?.closest('[aria-hidden="true"]')?.querySelector('a, button, [tabindex]')).toBeNull();
  });

  it('section: Report this error is a router link to /contact, after the homepage link', () => {
    render(<ErrorBody variant="section" onRetry={jest.fn()} />);

    const report = screen.getByRole('link', { name: 'Report this error' });
    expect(report).toHaveAttribute('href', '/contact');
    const linkHrefs = mockLink.mock.calls.map(([props]) => (props as { href: string }).href);
    expect(linkHrefs).toEqual(expect.arrayContaining(['/', '/contact']));

    const tryAgain = screen.getByRole('button', { name: 'Try again' });
    const home = screen.getByRole('link', { name: 'Go to the homepage' });
    // DOM order in the action row: Try again, Go to the homepage, Report this error.
    expect(tryAgain.compareDocumentPosition(home) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(home.compareDocumentPosition(report) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('root: Report this error is a plain anchor to /contact and no router link is used', () => {
    render(<ErrorBody variant="root" onRetry={jest.fn()} />);

    const report = screen.getByRole('link', { name: 'Report this error' });
    expect(report.tagName).toBe('A');
    expect(report).toHaveAttribute('href', '/contact');
    expect(mockLink).not.toHaveBeenCalled();
  });

  it('Try again calls onRetry once per activation and shows no pending UI', () => {
    const onRetry = jest.fn();
    render(<ErrorBody variant="section" onRetry={onRetry} />);

    const button = screen.getByRole('button', { name: 'Try again' });
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(2);

    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('aria-busy');
    expect(button).toHaveTextContent(/^Try again$/);
    expect(screen.queryByText(/retrying|loading/i)).not.toBeInTheDocument();
  });

  it('a retry that fails again renders the same error body (re-render with the same props)', () => {
    const onRetry = jest.fn();
    const { container, rerender } = render(<ErrorBody variant="section" onRetry={onRetry} />);
    const before = container.innerHTML;

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    // Next calls the boundary again with the same props when the retried render throws.
    rerender(<ErrorBody variant="section" onRetry={onRetry} />);

    expect(container.innerHTML).toBe(before);
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Report this error' })).toHaveAttribute('href', '/contact');
  });
});

describe('app/(site)/error', () => {
  it('never renders the exception message or digest, and Try again calls retry (not reset)', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const retry = jest.fn();
    const reset = jest.fn();
    const { container } = render(<SectionError error={secretError()} retry={retry} reset={reset} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
    expect(container.innerHTML).not.toContain(SECRET_MESSAGE);
    expect(container.innerHTML).not.toContain(SECRET_DIGEST);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders the edge art and the Report this error link, and still no exception text', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<SectionError error={secretError()} retry={jest.fn()} reset={jest.fn()} />);

    expect(artSheet(container)).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Report this error' })).toHaveAttribute('href', '/contact');
    expect(container.textContent).not.toContain(SECRET_MESSAGE);
    expect(container.textContent).not.toContain(SECRET_DIGEST);
    consoleError.mockRestore();
  });
});
