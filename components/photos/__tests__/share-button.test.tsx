/**
 * Share / Copy link (PHOTO-07, D-13; 18-UI-SPEC Contract 4). The server HTML
 * is copy mode; after hydration the button offers the share sheet where
 * navigator.share exists and canShare({ url }) is not false. Share is called
 * synchronously in the click handler (Pitfall 6), a cancel (AbortError) does
 * nothing, any other rejection runs the copy path, and presses while a share
 * is pending are ignored (T-18-19). Copy follows CopyEmailButton: 'Link
 * copied' for COPIED_MS, restartable; a failed copy shows and selects the URL
 * until the next press. The URL is only ever the `url` prop (T-18-18).
 *
 * fireEvent, not userEvent: userEvent.setup() installs its own clipboard stub
 * over navigator.clipboard, which would hide the mock each test sets up.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import ShareButton from '../ShareButton';
import { COPIED_MS } from '@/components/contact/CopyEmailButton';

const URL_ = 'https://www.tlui.de/photos/example-photo';
const TITLE = 'Example photo · Tim Lui';
const FAILED_STATUS = "Couldn't copy the link. It's selected below.";

const photoButton = () => (
  <ShareButton url={URL_} title={TITLE} subject="photo" surface="gallery" />
);

const button = () => screen.getByRole('button');
const status = () => screen.getByRole('status');
const failureLine = () => document.querySelector('[data-share-failure]');

function stub(name: 'share' | 'canShare' | 'clipboard', value: unknown) {
  Object.defineProperty(navigator, name, { value, configurable: true, writable: true });
}

function unstub(name: 'share' | 'canShare' | 'clipboard') {
  delete (navigator as unknown as Record<string, unknown>)[name];
}

function abortError() {
  return new DOMException('Share canceled', 'AbortError');
}

/** A share stub whose promise the test settles by hand. */
function pendingShare() {
  const control: { resolve: () => void; reject: (e: unknown) => void } = {
    resolve: () => {},
    reject: () => {},
  };
  const share = jest.fn<Navigator['share']>(
    () =>
      new Promise<void>((resolve, reject) => {
        control.resolve = resolve;
        control.reject = reject;
      })
  );
  return { share, control };
}

/** Run the zero-delay timer React's scheduler queues, so getTimerCount() counts only ours. */
function flushScheduler() {
  act(() => {
    jest.advanceTimersByTime(0);
  });
}

/** Click, let the share and clipboard promises settle, then flush the scheduler. */
async function press() {
  await act(async () => {
    fireEvent.click(button());
  });
  flushScheduler();
}

beforeEach(() => {
  jest.useFakeTimers();
  window.getSelection()?.removeAllRanges();
});

afterEach(() => {
  jest.useRealTimers();
  unstub('share');
  unstub('canShare');
  unstub('clipboard');
});

describe('ShareButton modes', () => {
  it('server-renders copy mode: visible Copy link, named Copy link to this photo', () => {
    // Even where the browser could share, the server snapshot is copy mode.
    stub('share', jest.fn());
    const html = renderToString(photoButton());
    const host = document.createElement('div');
    host.innerHTML = html;
    const b = host.querySelector('button')!;
    expect(b.textContent).toBe('Copy link');
    expect(b.getAttribute('aria-label')).toBe('Copy link to this photo');
    expect(b.className).toContain('min-w-40');
    expect(b.className).toContain('hover:border-ink-muted');
    expect(host.querySelector('[role="status"]')?.textContent).toBe('');
  });

  it('names the region variant Copy link to this region with the surface hover', () => {
    render(<ShareButton url={URL_} title={TITLE} subject="region" surface="surface" />);
    expect(screen.getByRole('button', { name: 'Copy link to this region' })).toHaveTextContent(
      'Copy link'
    );
    expect(button().className).toContain('hover:bg-surface-overlay');
  });

  it('hydrates the copy-mode HTML without a mismatch, then switches to Share photo', async () => {
    stub('share', jest.fn());
    stub(
      'canShare',
      jest.fn(() => true)
    );
    const host = document.createElement('div');
    host.innerHTML = renderToString(photoButton());
    document.body.appendChild(host);
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    const recoverable: unknown[] = [];

    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(host, photoButton(), {
        onRecoverableError: (e) => recoverable.push(e),
      });
    });

    expect(recoverable).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
    expect(host.querySelector('button')?.textContent).toBe('Share photo');
    expect(host.querySelector('button')?.hasAttribute('aria-label')).toBe(false);
    act(() => root!.unmount());
    host.remove();
    errors.mockRestore();
  });

  it('stays in copy mode when canShare returns false for the URL', () => {
    stub('share', jest.fn());
    const canShare = jest.fn<Navigator['canShare']>(() => false);
    stub('canShare', canShare);
    render(photoButton());
    expect(button()).toHaveTextContent('Copy link');
    expect(canShare).toHaveBeenCalledWith({ url: URL_ });
  });

  it('Edge PHOTO-07/empty: stays in copy mode with no navigator.share', () => {
    render(photoButton());
    expect(screen.getByRole('button', { name: 'Copy link to this photo' })).toHaveTextContent(
      'Copy link'
    );
  });
});

describe('ShareButton share mode', () => {
  it('calls navigator.share once, synchronously, with { title, url }', async () => {
    const { share, control } = pendingShare();
    stub('share', share);
    const writeText = jest.fn<Clipboard['writeText']>().mockResolvedValue(undefined);
    stub('clipboard', { writeText });
    render(photoButton());
    expect(button()).toHaveTextContent('Share photo');

    // No await before the share call: it runs inside the click (transient activation).
    act(() => {
      fireEvent.click(button());
    });
    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith({ title: TITLE, url: URL_ });

    await act(async () => control.resolve());
    flushScheduler();
    expect(writeText).not.toHaveBeenCalled();
    expect(status()).toHaveTextContent('');
    expect(button()).toHaveTextContent('Share photo');
  });

  it('Edge PHOTO-07/concurrency: a second press while a share is pending starts no second share', async () => {
    const { share, control } = pendingShare();
    stub('share', share);
    const writeText = jest.fn<Clipboard['writeText']>().mockResolvedValue(undefined);
    stub('clipboard', { writeText });
    render(photoButton());

    await press();
    await press();
    expect(share).toHaveBeenCalledTimes(1);
    expect(writeText).not.toHaveBeenCalled();

    // Once it settles, the next press shares again.
    await act(async () => control.resolve());
    await press();
    expect(share).toHaveBeenCalledTimes(2);
  });

  it('AbortError (a cancelled sheet) does nothing: no copy, no status, no failure line', async () => {
    const share = jest.fn(() => Promise.reject(abortError()));
    stub('share', share);
    const writeText = jest.fn<Clipboard['writeText']>().mockResolvedValue(undefined);
    stub('clipboard', { writeText });
    render(photoButton());

    await press();

    expect(share).toHaveBeenCalledTimes(1);
    expect(writeText).not.toHaveBeenCalled();
    expect(status()).toHaveTextContent('');
    expect(failureLine()).toBeNull();
    expect(button()).toHaveTextContent('Share photo');
  });

  it('a NotAllowedError falls back to copy: writes the url and shows Link copied', async () => {
    const share = jest.fn(() =>
      Promise.reject(new DOMException('No activation', 'NotAllowedError'))
    );
    stub('share', share);
    const writeText = jest.fn<Clipboard['writeText']>().mockResolvedValue(undefined);
    stub('clipboard', { writeText });
    render(photoButton());

    await press();

    expect(share).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(URL_);
    expect(button()).toHaveTextContent('Link copied');
    expect(status()).toHaveTextContent('Link copied');
  });

  it('a share rejection whose copy also fails shows and selects the URL', async () => {
    stub(
      'share',
      jest.fn(() => Promise.reject(new TypeError('bad data')))
    );
    stub('clipboard', {
      writeText: jest.fn<Clipboard['writeText']>().mockRejectedValue(new Error('denied')),
    });
    render(photoButton());

    await press();

    expect(failureLine()).toHaveTextContent(URL_);
    expect(window.getSelection()?.toString()).toBe(URL_);
    expect(status()).toHaveTextContent(FAILED_STATUS);
  });

  it('a share settling after unmount starts no copy and no timer', async () => {
    const { share, control } = pendingShare();
    stub('share', share);
    const writeText = jest.fn<Clipboard['writeText']>().mockResolvedValue(undefined);
    stub('clipboard', { writeText });
    const { unmount } = render(photoButton());

    await press();
    unmount();
    await act(async () => control.reject(new DOMException('gone', 'NotAllowedError')));
    flushScheduler();

    expect(writeText).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('ShareButton copy mode', () => {
  it('writes the url, shows Link copied with a polite status for 2,000 ms, then reverts', async () => {
    const writeText = jest.fn<Clipboard['writeText']>().mockResolvedValue(undefined);
    stub('clipboard', { writeText });
    render(photoButton());

    await press();

    expect(writeText).toHaveBeenCalledWith(URL_);
    expect(COPIED_MS).toBe(2000);
    expect(button()).toHaveTextContent('Link copied');
    expect(status()).toHaveAttribute('aria-live', 'polite');
    expect(status()).toHaveAttribute('aria-atomic', 'true');
    expect(status()).toHaveTextContent('Link copied');

    act(() => {
      jest.advanceTimersByTime(COPIED_MS - 1);
    });
    expect(button()).toHaveTextContent('Link copied');
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(button()).toHaveTextContent('Copy link');
    expect(status()).toHaveTextContent('');
  });

  it('a press at 1,500 ms restarts the window: still copied at 3,000 ms, reverted at 3,500 ms', async () => {
    stub('clipboard', {
      writeText: jest.fn<Clipboard['writeText']>().mockResolvedValue(undefined),
    });
    render(photoButton());

    await press();
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    await press();
    expect(jest.getTimerCount()).toBe(1);

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(button()).toHaveTextContent('Link copied');
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(button()).toHaveTextContent('Copy link');
  });

  it('Edge PHOTO-07/encoding: copies the url prop, never the window address with its query and hash', async () => {
    window.history.pushState({}, '', '/photos/example-photo?utm=1#frag');
    const writeText = jest.fn<Clipboard['writeText']>().mockResolvedValue(undefined);
    stub('clipboard', { writeText });
    render(photoButton());

    await press();

    expect(writeText).toHaveBeenCalledWith(URL_);
    window.history.pushState({}, '', '/');
  });

  it('a rejected write shows and selects the URL, with the failure status', async () => {
    stub('clipboard', {
      writeText: jest.fn<Clipboard['writeText']>().mockRejectedValue(new Error('denied')),
    });
    render(photoButton());

    await press();

    const line = failureLine();
    expect(line).toHaveTextContent(`Couldn't copy the link. It's selected here: ${URL_}`);
    expect(line?.querySelector('span')?.className).toContain('wrap-anywhere');
    expect(window.getSelection()?.toString()).toBe(URL_);
    expect(status()).toHaveTextContent(FAILED_STATUS);
    expect(button()).toHaveTextContent('Copy link');

    // The line stays until the next press, which clears it before trying again.
    act(() => {
      jest.advanceTimersByTime(10 * COPIED_MS);
    });
    expect(failureLine()).not.toBeNull();
    stub('clipboard', {
      writeText: jest.fn<Clipboard['writeText']>().mockResolvedValue(undefined),
    });
    await press();
    expect(failureLine()).toBeNull();
    expect(status()).toHaveTextContent('Link copied');
  });

  it('Edge PHOTO-07/empty: with no navigator.clipboard the failure path shows and selects the URL', async () => {
    render(photoButton());

    await press();

    expect(failureLine()).toHaveTextContent(URL_);
    expect(window.getSelection()?.toString()).toBe(URL_);
    expect(status()).toHaveTextContent(FAILED_STATUS);
  });

  it('clears its timer when unmounted inside the copied window', async () => {
    stub('clipboard', {
      writeText: jest.fn<Clipboard['writeText']>().mockResolvedValue(undefined),
    });
    const { unmount } = render(photoButton());

    await press();
    expect(jest.getTimerCount()).toBe(1);
    unmount();
    flushScheduler();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('starts no timer and warns of nothing when unmounted before the clipboard answers', async () => {
    let resolveWrite: () => void = () => {};
    const writeText = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        })
    );
    stub('clipboard', { writeText });
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(photoButton());

    await press();
    unmount();
    await act(async () => resolveWrite());
    flushScheduler();

    expect(jest.getTimerCount()).toBe(0);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});
