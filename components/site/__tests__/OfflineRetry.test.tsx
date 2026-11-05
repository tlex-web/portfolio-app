import { fireEvent, render, screen } from '@testing-library/react';
import OfflineRetry from '../OfflineRetry';

/**
 * The offline page's Try again button and its one-time online reload (D-12).
 * jsdom's location.reload is non-configurable, so it cannot be spied on; jsdom
 * reports each reload it cannot perform as "Not implemented: navigation" on
 * console.error, and those reports are counted instead.
 */

function reloadCount(consoleError: jest.SpyInstance) {
  return consoleError.mock.calls
    .map((args) => args.map(String).join(' '))
    .filter((message) => /Not implemented: navigation/.test(message)).length;
}

describe('OfflineRetry', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    jest.restoreAllMocks();
  });

  it('renders a primary Try again button that reloads the page', () => {
    render(<OfflineRetry />);

    const button = screen.getByRole('button', { name: 'Try again' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('bg-accent', 'min-h-11');
    fireEvent.click(button);
    expect(reloadCount(consoleError)).toBe(1);
  });

  it('registers one online listener with once: true that reloads', () => {
    const add = jest.spyOn(window, 'addEventListener');
    render(<OfflineRetry />);

    const onlineCalls = add.mock.calls.filter(([type]) => type === 'online');
    expect(onlineCalls).toHaveLength(1);
    expect(onlineCalls[0][2]).toEqual(expect.objectContaining({ once: true }));

    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('online'));
    expect(reloadCount(consoleError)).toBe(1);
  });

  it('removes the online listener on unmount', () => {
    const { unmount } = render(<OfflineRetry />);
    unmount();

    window.dispatchEvent(new Event('online'));
    expect(reloadCount(consoleError)).toBe(0);
  });
});
