import { fireEvent, render, screen } from '@testing-library/react';
import ErrorBody from '../ErrorBody';
import SectionError from '@/app/(site)/error';

const SECRET_MESSAGE = 'secret-stack-detail';
const SECRET_DIGEST = 'abc123';

function secretError() {
  return Object.assign(new Error(SECRET_MESSAGE), { digest: SECRET_DIGEST });
}

describe('ErrorBody', () => {
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
});
