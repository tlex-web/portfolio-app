import { render, screen } from '@testing-library/react';
import LightboxDialog, { useLightbox, type LightboxApi } from '../LightboxDialog';

/**
 * The lightbox shell in jsdom (LBOX-01; 10-RESEARCH Pitfall 11). jsdom has no
 * showModal, so jest.setup.js stubs HTMLDialogElement; this suite checks the
 * shell's contract only: a dialog labelled by the photo title, open after
 * mount, and a context that tells PhotoViewer which surface it is on. Focus,
 * Escape and the trap are proven in Playwright (e2e/photos-lightbox.spec.ts).
 */

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/photos/test',
}));

let seen: LightboxApi | null | undefined;

function Probe() {
  seen = useLightbox();
  return <h2 id="photo-title">Test photo</h2>;
}

beforeEach(() => {
  seen = undefined;
});

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
    expect(seen).toBeNull();
  });

  it('useLightbox() gives close and registerEscape inside the dialog', () => {
    render(
      <LightboxDialog labelledBy="photo-title">
        <Probe />
      </LightboxDialog>
    );
    expect(seen).not.toBeNull();
    expect(typeof seen?.close).toBe('function');
    expect(typeof seen?.registerEscape).toBe('function');
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
