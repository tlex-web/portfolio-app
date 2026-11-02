/**
 * The Copy island of the Direct contact panel (CONTACT-01, D-06; 12-UI-SPEC
 * "Direct contact panel", Copy behaviour). Success swaps the label to
 * 'Copied' for COPIED_MS and fills a persistent polite status; a missing or
 * rejecting clipboard stays quiet and selects the address for a manual copy.
 *
 * fireEvent, not userEvent: userEvent.setup() installs its own clipboard stub
 * over navigator.clipboard, which would hide the mock each test sets up.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import CopyEmailButton, { COPIED_MS } from '../CopyEmailButton';
import { site } from '@/data/site';

const TARGET = 'copy-target';

function renderButton() {
  const [user, domain] = site.email.split('@');
  return render(
    <>
      <p id={TARGET}>
        {user}@<wbr />
        {domain}
      </p>
      <CopyEmailButton email={site.email} targetId={TARGET} />
    </>,
  );
}

const button = () => screen.getByRole('button', { name: 'Copy email address' });
const status = () => screen.getByRole('status');

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

async function press() {
  await act(async () => {
    fireEvent.click(button());
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  window.getSelection()?.removeAllRanges();
});

afterEach(() => {
  jest.useRealTimers();
  setClipboard(undefined);
});

describe('CopyEmailButton', () => {
  it('server-renders a Copy button with its accessible name and an empty status', () => {
    setClipboard(undefined);
    renderButton();

    expect(button()).toHaveTextContent('Copy');
    expect(button()).not.toHaveTextContent('Copied');
    expect(status()).toHaveAttribute('aria-live', 'polite');
    expect(status()).toHaveAttribute('aria-atomic', 'true');
    expect(status()).toHaveTextContent('');
  });

  it('writes exactly the address, shows Copied and announces it for 2,000 ms', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    renderButton();

    await press();

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(site.email);
    expect(COPIED_MS).toBe(2000);
    expect(button()).toHaveTextContent('Copied');
    expect(status()).toHaveTextContent('Copied');

    act(() => {
      jest.advanceTimersByTime(COPIED_MS - 1);
    });
    expect(button()).toHaveTextContent('Copied');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(button()).toHaveTextContent('Copy');
    expect(button()).not.toHaveTextContent('Copied');
    expect(status()).toHaveTextContent('');
  });

  it('restarts the 2,000 ms window on a second press without stacking timers', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    renderButton();

    await press();
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    await press();

    expect(writeText).toHaveBeenCalledTimes(2);
    expect(jest.getTimerCount()).toBe(1);

    // The first press would have reverted at 2,000 ms; the second holds to 3,500 ms.
    act(() => {
      jest.advanceTimersByTime(1999);
    });
    expect(button()).toHaveTextContent('Copied');
    expect(status()).toHaveTextContent('Copied');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(button()).not.toHaveTextContent('Copied');
    expect(status()).toHaveTextContent('');
  });

  it('selects the address quietly when the clipboard is missing', async () => {
    setClipboard(undefined);
    renderButton();

    await press();

    expect(button()).not.toHaveTextContent('Copied');
    expect(status()).toHaveTextContent('');
    expect(window.getSelection()?.toString()).toBe(site.email);
  });

  it('selects the address quietly when the clipboard write rejects', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('NotAllowedError'));
    setClipboard({ writeText });
    renderButton();

    await press();

    expect(writeText).toHaveBeenCalledWith(site.email);
    expect(button()).not.toHaveTextContent('Copied');
    expect(status()).toHaveTextContent('');
    expect(window.getSelection()?.toString()).toBe(site.email);
  });

  it('clears its timer when unmounted inside the Copied window', async () => {
    setClipboard({ writeText: jest.fn().mockResolvedValue(undefined) });
    const { unmount } = renderButton();

    await press();
    expect(jest.getTimerCount()).toBe(1);

    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('starts no timer when unmounted before the clipboard answers', async () => {
    let resolveWrite: () => void = () => {};
    const writeText = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        }),
    );
    setClipboard({ writeText });
    const { unmount } = renderButton();

    await press();
    unmount();
    await act(async () => {
      resolveWrite();
    });

    expect(jest.getTimerCount()).toBe(0);
  });
});
