import { act, fireEvent, render, screen } from '@testing-library/react';
import LightboxDialog, { LIGHTBOX_CLOSE_EVENT, useLightbox } from '../LightboxDialog';

/**
 * The lightbox shell in jsdom (LBOX-01; 10-RESEARCH Pitfall 11). jsdom has no
 * showModal, so jest.setup.js stubs HTMLDialogElement; this suite checks the
 * shell's contract only: a dialog labelled by the photo title, open after
 * mount, and a context that tells PhotoViewer which surface it is on. Focus,
 * Escape and the trap are proven in Playwright (e2e/photos-lightbox.spec.ts).
 * The one exception is a browser Back close right after a step (10-REVIEW
 * WR-01): usePathname is mocked to stay on the opened photo, which is the lag
 * the dialog must not depend on, deterministically.
 */

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/photos/test',
}));

/** Renders the title and what useLightbox() returned, as text the test can read. */
function Probe() {
  const api = useLightbox();
  const shape = api
    ? `${typeof api.close},${typeof api.registerEscape},${typeof api.setShown}`
    : 'null';
  return (
    <>
      <h2 id="photo-title">Test photo</h2>
      <p data-testid="lightbox-api">{shape}</p>
    </>
  );
}

describe('LightboxDialog', () => {
  it('renders a dialog labelled by the photo title, open after mount', () => {
    render(
      <LightboxDialog labelledBy="photo-title">
        <Probe />
      </LightboxDialog>
    );
    const dialog = screen.getByRole('dialog', { name: 'Test photo' });
    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog).toHaveAttribute('aria-labelledby', 'photo-title');
    expect((dialog as HTMLDialogElement).open).toBe(true);
  });

  it('useLightbox() is null outside the dialog', () => {
    render(<Probe />);
    expect(screen.getByTestId('lightbox-api')).toHaveTextContent('null');
  });

  it('useLightbox() gives close, registerEscape and setShown inside the dialog', () => {
    render(
      <LightboxDialog labelledBy="photo-title">
        <Probe />
      </LightboxDialog>
    );
    expect(screen.getByTestId('lightbox-api')).toHaveTextContent('function,function,function');
  });

  it('a close by browser Back right after a step tells the view and returns focus to the photo shown (10-REVIEW WR-01)', async () => {
    /** The viewer's part: a step reports the photo now shown. */
    function Step() {
      const api = useLightbox();
      return (
        <button type="button" onClick={() => api?.setShown('second')}>
          Next photo
        </button>
      );
    }
    /** The gallery behind (two tiles) and the lightbox while the route names a photo. */
    function Gallery({ open }: { open: boolean }) {
      return (
        <>
          <button type="button" data-photo-id="test">
            First tile
          </button>
          <button type="button" data-photo-id="second">
            Second tile
          </button>
          {open && (
            <LightboxDialog labelledBy="photo-title">
              <h2 id="photo-title">Test photo</h2>
              <Step />
            </LightboxDialog>
          )}
        </>
      );
    }
    const scrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = jest.fn();
    const closed: string[] = [];
    const onClose = (event: Event) => closed.push((event as CustomEvent<string>).detail);
    document.addEventListener(LIGHTBOX_CLOSE_EVENT, onClose);
    try {
      const { rerender } = render(<Gallery open />);
      fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
      // Back: the route leaves and the dialog unmounts, without close().
      rerender(<Gallery open={false} />);
      // Focus returns in a microtask after unmount.
      await act(async () => {
        await Promise.resolve();
      });
      expect(closed).toEqual(['second']);
      expect(screen.getByRole('button', { name: 'Second tile' })).toHaveFocus();
    } finally {
      document.removeEventListener(LIGHTBOX_CLOSE_EVENT, onClose);
      Element.prototype.scrollIntoView = scrollIntoView;
    }
  });

  it('locks the page scroll while open and restores it on unmount', () => {
    document.documentElement.style.overflow = '';
    const { unmount } = render(
      <LightboxDialog labelledBy="photo-title">
        <Probe />
      </LightboxDialog>
    );
    expect(document.documentElement.style.overflow).toBe('hidden');
    unmount();
    expect(document.documentElement.style.overflow).toBe('');
  });
});
