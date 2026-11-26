import { Activity } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import LightboxDialog, { restoreFocus, revealTrigger, useLightbox } from '../LightboxDialog';
import PhotoViewer from '../PhotoViewer';
import { HOTSPOT_PREF_KEY } from '@/lib/photos/hotspot-pref';
import { regionEndCard, regionPhotoViews } from '@/lib/regions';
import { SLUGS, viewBySlug } from '../../../e2e/helpers/photo-fixtures';

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

// One router for the whole suite, as Next's useRouter is stable across renders, so a
// test can count back() calls.
const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn() };
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/photos/test',
}));

beforeEach(() => {
  mockRouter.back.mockClear();
});

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

  it('a close by browser Back right after a step returns focus to the photo shown (10-REVIEW WR-01)', async () => {
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
    // jsdom does not implement window scrolling; the reveal (LBOX-08) scrolls the window only.
    const scrollBy = window.scrollBy;
    window.scrollBy = jest.fn();
    try {
      const { rerender } = render(<Gallery open />);
      fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
      // Back: the route leaves and the dialog unmounts, without close().
      rerender(<Gallery open={false} />);
      // Focus returns in a microtask after unmount.
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.getByRole('button', { name: 'Second tile' })).toHaveFocus();
      // The re-reveal runs in the next frame; let it run while scrollBy is still stubbed.
      await act(async () => {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      });
    } finally {
      window.scrollBy = scrollBy;
    }
  });

  it('closes again after it is shown again in the same instance (10-REVIEW IN-10)', () => {
    /** The viewer's Close photo control. */
    function CloseControl() {
      const api = useLightbox();
      return (
        <button type="button" onClick={() => api?.close()}>
          Close photo
        </button>
      );
    }
    /** An Activity keeps the dialog instance mounted while it is hidden and shown again. */
    function Kept({ mode }: { mode: 'visible' | 'hidden' }) {
      return (
        <Activity mode={mode}>
          <LightboxDialog labelledBy="photo-title">
            <h2 id="photo-title">Test photo</h2>
            <CloseControl />
          </LightboxDialog>
        </Activity>
      );
    }
    const { rerender } = render(<Kept mode="visible" />);
    const closeControl = () => screen.getByRole('button', { name: 'Close photo', hidden: true });
    fireEvent.click(closeControl());
    // A second press while the first history step is in flight goes back only once.
    fireEvent.click(closeControl());
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    // The back step failed to unmount it; the dialog is hidden and shown again.
    rerender(<Kept mode="hidden" />);
    rerender(<Kept mode="visible" />);
    fireEvent.click(closeControl());
    expect(mockRouter.back).toHaveBeenCalledTimes(2);
  });

  it('Escape collapses an open callout before it closes, without CSS.escape (10-REVIEW IN-02)', () => {
    // jsdom has no CSS.escape of its own; jest-dom's css.escape polyfill adds one, so it is
    // removed here to run the callout's Escape layer where it is missing.
    const escape = CSS.escape;
    // @ts-expect-error -- simulating an environment without CSS.escape
    delete CSS.escape;
    try {
      const view = viewBySlug(SLUGS.matterhornGlacierTrail);
      render(
        <LightboxDialog labelledBy="photo-title">
          <PhotoViewer
            variant="modal"
            photos={regionPhotoViews('zermatt')}
            initialSlug={view.slug}
            endCard={regionEndCard('zermatt')}
          />
        </LightboxDialog>
      );
      const key = screen.getByRole('list', { name: 'Labels', hidden: true });
      const [first] = within(key).getAllByRole('button', { hidden: true });
      fireEvent.click(first);
      expect(first).toHaveAttribute('aria-expanded', 'true');
      // jsdom has no layout, so no element has client rects. One rect stands in for the key
      // tier, where the row is shown: only a visible callout takes Escape (D-22).
      jest.spyOn(first, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(first).toHaveAttribute('aria-expanded', 'false');
      expect(first).toHaveFocus();
      // The callout took the press, so the lightbox did not close.
      expect(mockRouter.back).not.toHaveBeenCalled();
    } finally {
      CSS.escape = escape;
    }
  });

  it('a hidden callout is cleared without taking Escape, so the lightbox closes (D-22)', () => {
    const view = viewBySlug(SLUGS.matterhornGlacierTrail);
    render(
      <LightboxDialog labelledBy="photo-title">
        <PhotoViewer
          variant="modal"
          photos={regionPhotoViews('zermatt')}
          initialSlug={view.slug}
          endCard={regionEndCard('zermatt')}
        />
      </LightboxDialog>
    );
    const key = screen.getByRole('list', { name: 'Labels', hidden: true });
    const [first] = within(key).getAllByRole('button', { hidden: true });
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    // No stub: jsdom reports no client rects, so neither the label nor the row is visible.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('hiding labels collapses the open callout; showing them again starts collapsed (D-12)', () => {
    const view = viewBySlug(SLUGS.matterhornGlacierTrail);
    try {
      render(
        <LightboxDialog labelledBy="photo-title">
          <PhotoViewer
            variant="modal"
            photos={regionPhotoViews('zermatt')}
            initialSlug={view.slug}
            endCard={regionEndCard('zermatt')}
          />
        </LightboxDialog>
      );
      const key = screen.getByRole('list', { name: 'Labels', hidden: true });
      const rows = () => within(key).getAllByRole('button', { hidden: true });
      const expectAllCollapsed = () => {
        for (const row of rows()) expect(row).toHaveAttribute('aria-expanded', 'false');
      };
      const hide = screen.getByRole('button', { name: 'Hide labels', hidden: true });

      // The button: the key stays rendered while labels hide, every row collapsed.
      fireEvent.click(rows()[0]);
      expect(rows()[0]).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(hide);
      expect(hide).toHaveAttribute('aria-pressed', 'true');
      expectAllCollapsed();
      fireEvent.click(hide);
      expect(hide).toHaveAttribute('aria-pressed', 'false');
      expectAllCollapsed();

      // The H key takes the same path.
      fireEvent.click(rows()[0]);
      expect(rows()[0]).toHaveAttribute('aria-expanded', 'true');
      fireEvent.keyDown(document, { key: 'h' });
      expect(hide).toHaveAttribute('aria-pressed', 'true');
      expectAllCollapsed();
      fireEvent.keyDown(document, { key: 'h' });
      expect(hide).toHaveAttribute('aria-pressed', 'false');
      expectAllCollapsed();
    } finally {
      // The preference is stored; keep it out of the other rows.
      window.localStorage.removeItem(HOTSPOT_PREF_KEY);
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

/**
 * The reveal after close (LBOX-08, D-09, D-21). jsdom has no layout, so each row stubs the
 * trigger's rect, the viewport height (documentElement.clientHeight, 14-REVIEW IN-02) and
 * window.scrollBy. The nav height is read through a probe sized var(--nav-h) (14-REVIEW
 * IN-01), so the probe's measured height is stubbed too: 64 px as in app/globals.css. The
 * history traversal that makes the second, next-frame reveal necessary is browser behaviour,
 * proven in e2e/photos-lightbox.spec.ts "Focus on close stays in view".
 */
describe('revealTrigger (LBOX-08)', () => {
  const NAV_H = 64;
  const RING = 4;
  const INNER_HEIGHT = 450;
  let scrollBy: typeof window.scrollBy;
  let scrollSpy: jest.Mock;
  /** What the nav-height probe measures; a real browser resolves var(--nav-h) to CSS px. */
  let probeHeight: number;
  /** The inline height of every element measured through the prototype (only the probe is). */
  let probed: string[];
  let rectSpy: { mockRestore(): void };

  beforeEach(() => {
    Object.defineProperty(document.documentElement, 'clientHeight', {
      configurable: true,
      value: INNER_HEIGHT,
    });
    document.documentElement.style.setProperty('--nav-h', `${NAV_H}px`);
    probeHeight = NAV_H;
    probed = [];
    // trigger() gives each trigger its own getBoundingClientRect, so only the probe reaches
    // the prototype; it measures probeHeight when sized var(--nav-h), else 0.
    rectSpy = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element
    ) {
      const height =
        this instanceof HTMLElement && this.style.height === 'var(--nav-h)' ? probeHeight : 0;
      if (this instanceof HTMLElement) probed.push(this.style.height);
      return {
        top: 0,
        bottom: height,
        left: 0,
        right: 0,
        width: 0,
        height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    });
    scrollBy = window.scrollBy;
    scrollSpy = jest.fn();
    window.scrollBy = scrollSpy as unknown as typeof window.scrollBy;
  });

  afterEach(() => {
    delete (document.documentElement as { clientHeight?: number }).clientHeight;
    rectSpy.mockRestore();
    document.documentElement.style.removeProperty('--nav-h');
    window.scrollBy = scrollBy;
    document.body.innerHTML = '';
  });

  /** A focusable trigger whose box is `top`..`top + height` in viewport coordinates. */
  function trigger(top: number, height: number, slug = 'shown'): HTMLElement {
    const el = document.createElement('a');
    el.href = `/photos/${slug}`;
    el.setAttribute('data-photo-id', slug);
    el.textContent = slug;
    el.getBoundingClientRect = () =>
      ({
        top,
        bottom: top + height,
        left: 20,
        right: 120,
        width: 100,
        height,
        x: 20,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;
    document.body.appendChild(el);
    return el;
  }

  it('measures --nav-h through a probe sized var(--nav-h), removed in the same call (14 IN-01)', () => {
    revealTrigger(trigger(30, 44));
    expect(probed).toEqual(['var(--nav-h)']);
    expect(document.body.children).toHaveLength(1);
    expect(scrollSpy).toHaveBeenCalledWith({ top: 30 - RING - NAV_H, behavior: 'instant' });
  });

  it('revealTrigger clears a nav height given in rem by its resolved px, not the parsed number (14 IN-01)', () => {
    // A parse of '4rem' would read 4 and leave the trigger 60 px under the nav.
    document.documentElement.style.setProperty('--nav-h', '4rem');
    probeHeight = 64;
    revealTrigger(trigger(30, 44));
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith({ top: 30 - RING - 64, behavior: 'instant' });
  });

  it('revealTrigger measures the viewport bottom with documentElement.clientHeight (14 IN-02)', () => {
    // A horizontal scrollbar makes innerHeight taller than the visible area; clientHeight wins.
    const inner = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: INNER_HEIGHT + 17 });
    try {
      revealTrigger(trigger(INNER_HEIGHT - 50, 48));
    } finally {
      if (inner) Object.defineProperty(window, 'innerHeight', inner);
      else delete (window as { innerHeight?: number }).innerHeight;
    }
    expect(scrollSpy).toHaveBeenCalledWith({ top: 2, behavior: 'instant' });
  });

  it('revealTrigger scrolls a trigger below the viewport up by its overflow plus the ring', () => {
    const el = trigger(500, 68);
    revealTrigger(el);
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith({
      top: 500 + 68 + RING - INNER_HEIGHT,
      behavior: 'instant',
    });
  });

  it('revealTrigger scrolls a trigger under the nav down to just below it (negative delta)', () => {
    const el = trigger(30, 44);
    revealTrigger(el);
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith({ top: 30 - RING - NAV_H, behavior: 'instant' });
  });

  it('revealTrigger top-aligns a trigger taller than the room below the nav', () => {
    // The room is 450 - 64 - 8 = 378 px; a 503 px grid tile cannot fit.
    const el = trigger(600, 503);
    revealTrigger(el);
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith({ top: 600 - RING - NAV_H, behavior: 'instant' });
  });

  it('revealTrigger rounds the target outward to a whole pixel, since the browser snaps window scrolling', () => {
    // Below the fold by 4.4 px with the ring: 5, never 4 (Chromium snapped 348.375 to 348).
    revealTrigger(trigger(300.4, 150, 'below'));
    // Under the nav by 37.5 px with the ring: -38.
    revealTrigger(trigger(30.5, 44, 'under'));
    // Taller than the room: top-aligned, rounded so the ring stays clear of the nav.
    revealTrigger(trigger(600.5, 503, 'tall'));
    expect(scrollSpy.mock.calls).toEqual([
      [{ top: 5, behavior: 'instant' }],
      [{ top: -38, behavior: 'instant' }],
      [{ top: 532, behavior: 'instant' }],
    ]);
  });

  it('revealTrigger does not scroll when the trigger and its ring are already in view', () => {
    // Exactly the ring's room on both edges: top - 4 = 64 and bottom + 4 = 450.
    revealTrigger(trigger(NAV_H + RING, INNER_HEIGHT - NAV_H - 2 * RING));
    // And with room to spare.
    revealTrigger(trigger(200, 68, 'other'));
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('restoreFocus (LBOX-08) focuses the mark without a scroll and reveals it again in the next frame', async () => {
    const el = trigger(500, 68);
    const focus = jest.spyOn(el, 'focus');
    restoreFocus('shown', null);
    expect(el).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    // jsdom does not move the box, so the next-frame reveal finds it still below the fold.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(scrollSpy).toHaveBeenCalledTimes(2);
    expect(scrollSpy).toHaveBeenLastCalledWith({
      top: 500 + 68 + RING - INNER_HEIGHT,
      behavior: 'instant',
    });
  });

  it('restoreFocus (LBOX-08) skips the next-frame reveal once focus has moved on', async () => {
    trigger(500, 68);
    const elsewhere = document.createElement('button');
    document.body.appendChild(elsewhere);
    restoreFocus('shown', null);
    elsewhere.focus();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(scrollSpy).toHaveBeenCalledTimes(1);
  });

  it('restoreFocus (LBOX-08) falls back to a connected opener when no mark carries the slug', () => {
    const opener = document.createElement('button');
    opener.textContent = 'Opener';
    document.body.appendChild(opener);
    restoreFocus('missing', opener);
    expect(opener).toHaveFocus();
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('restoreFocus (LBOX-08) falls back to the main h1, made focusable, when the opener is gone', () => {
    document.body.innerHTML = '<main><h1>Photographs</h1></main>';
    const heading = document.querySelector('h1')!;
    const opener = document.createElement('button');
    restoreFocus('missing', opener);
    expect(opener.isConnected).toBe(false);
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(heading).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);
  });
});
