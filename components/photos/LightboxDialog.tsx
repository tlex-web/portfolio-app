'use client';

import { createContext, useContext, useLayoutEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';

/**
 * The lightbox shell (LBOX-01, LBOX-03; 10-UI-SPEC "Photo Viewer", Surfaces
 * and Focus; 10-RESEARCH Spike Results and Pattern 4). The intercepted
 * `@modal/(.)[slug]` route wraps the modal PhotoViewer in this native
 * `<dialog>`, opened with showModal(): the spike's choice over an overlay
 * with `inert`, because the top layer makes the nav, footer, skip link and
 * gallery inert natively, needs no z-index token and carries modal semantics.
 *
 * - Open: showModal() in a layout effect, only when the dialog is not open
 *   yet (StrictMode runs effects twice). The element that had focus (the tile
 *   that was clicked) is kept as the opener, and focus moves to Close photo.
 *   The page behind is scroll-locked with `overflow: hidden` on `<html>`; the
 *   stable scrollbar gutter stays, so the header box does not move (G3).
 * - Keys: a document keydown listener, so a press is seen wherever focus is
 *   inside the dialog. Escape is handled on keydown with preventDefault: the
 *   registered layers run newest first and the first that returns true
 *   consumes the press; when none does, the lightbox closes. `cancel` is always
 *   prevented, because from the third consecutive Escape it is no longer
 *   cancelable and the dialog would close natively while the URL still names
 *   the photo (10-RESEARCH Pitfall 5). `close` re-syncs the URL if that ever
 *   happens (router.back() only while the URL still names a photo). Tab and
 *   Shift+Tab wrap between the first and last tabbable control (WebKit and,
 *   for the last control, Chromium otherwise let focus leave the dialog).
 * - Close: router.back() only, once (a second press while the history step is
 *   in flight would go back past the gallery). The popstate never starts a view
 *   transition (spike), so nothing waits for a close animation.
 * - Focus return (UI-SPEC "Return on close", Tim 2026-10-26): after unmount,
 *   in a microtask (once the gallery is no longer inert), focus goes to
 *   `[data-photo-id="{slug shown at close}"]` in the still-mounted view, else
 *   to the opener if it is still in the document, else to the main h1.
 *   Before going back, close() dispatches LIGHTBOX_CLOSE_EVENT on `document`
 *   with the slug shown, so a view whose front photo follows the lightbox
 *   (the carousel, 10-07) can show that photo before focus returns, even
 *   when usePathname has not caught up with the last replaceState step.
 * - The slug shown: the pathname's on mount, then whatever the viewer reports
 *   through setShown() on every step, never usePathname, which can lag a
 *   replaceState step. A close that does not go through close() (browser
 *   Back: the toolbar, Alt+←, a mouse back button, the Android back gesture)
 *   dispatches LIGHTBOX_CLOSE_EVENT after unmount, flushed before focus
 *   returns, so the carousel follows that close too (10-REVIEW WR-01).
 * - Context: useLightbox() returns `{ close, registerEscape, setShown }`
 *   inside the dialog and null outside, so PhotoViewer knows its surface
 *   (10-10 zoom and 10-11 callouts register their Escape layers here).
 * - No loading.tsx in the slot (Pitfall 4). jsdom has no showModal, so
 *   jest.setup.js stubs it (Pitfall 11); behaviour is tested in Playwright.
 */

export type LightboxApi = {
  /** Close the lightbox through the router (history Back). */
  close(): void;
  /** Register an Escape layer; returns its unregister function. */
  registerEscape(handler: () => boolean): () => void;
  /** Record the photo now shown (PhotoViewer calls it on every step). */
  setShown(slug: string): void;
};

const LightboxContext = createContext<LightboxApi | null>(null);

/**
 * Dispatched on `document` with the slug shown at close as `detail` (a
 * CustomEvent<string>): by close(), before router.back(), and after unmount
 * for a close by browser Back.
 */
export const LIGHTBOX_CLOSE_EVENT = 'photos:lightbox-close';

/** The lightbox API inside the dialog; null on the full photo page. */
export function useLightbox(): LightboxApi | null {
  return useContext(LightboxContext);
}

/** A photo URL: /photos/{slug}, the only paths the lightbox ever shows. */
const PHOTO_PATH = /^\/photos\/([^/]+)$/;

const TABBABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function slugOf(pathname: string | null): string | null {
  const match = pathname ? PHOTO_PATH.exec(pathname) : null;
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * The dialog's tabbable controls in DOM order, skipping hidden ones: display: none per tier
 * (no boxes), and visibility: hidden, which keeps its boxes but takes no focus. The gutter
 * labels are hidden that way until their first measure, which React defers while the open's
 * view transition starts. Counting them would leave the browser no next control after Close
 * and let Tab out of the dialog.
 */
function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) =>
      el.tabIndex >= 0 &&
      el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility === 'visible'
  );
}

/** CSS.escape, with a quote-and-backslash fallback where it is missing (jsdom). */
function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
  return value.replace(/["\\]/g, '\\$&');
}

/**
 * Return focus after the lightbox closes (UI-SPEC "Return on close"): the
 * shown photo's mark in the mounted view, else the opener, else the main h1.
 * The slug only ever comes from the pathname of a known photo route, and it is
 * escaped for the selector (T-10-12).
 */
export function restoreFocus(slug: string, opener: Element | null): void {
  const mark = slug
    ? document.querySelector<HTMLElement>(`[data-photo-id="${cssEscape(slug)}"]`)
    : null;
  if (mark) {
    mark.focus({ preventScroll: true });
    mark.scrollIntoView({ block: 'nearest' });
    return;
  }
  if (opener instanceof HTMLElement && opener.isConnected) {
    opener.focus({ preventScroll: true });
    return;
  }
  const heading = document.querySelector<HTMLElement>('main h1');
  if (heading) {
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus();
  }
}

export default function LightboxDialog({
  children,
  labelledBy,
}: {
  children: ReactNode;
  labelledBy: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const escapeLayers = useRef<Array<() => boolean>>([]);
  const closing = useRef(false);
  const opener = useRef<Element | null>(null);
  // The slug shown: the route's on mount, then each step's (setShown).
  const shownSlug = useRef<string | null>(slugOf(pathname));

  const api = useMemo<LightboxApi>(
    () => ({
      close: () => {
        if (closing.current) return;
        closing.current = true;
        // The URL is the latest truth: usePathname can lag a replaceState step
        // that ran while a view transition held React's commits back.
        const slug = slugOf(window.location.pathname);
        if (slug) {
          shownSlug.current = slug;
          document.dispatchEvent(new CustomEvent<string>(LIGHTBOX_CLOSE_EVENT, { detail: slug }));
        }
        router.back();
      },
      registerEscape: (handler) => {
        escapeLayers.current.push(handler);
        return () => {
          escapeLayers.current = escapeLayers.current.filter((h) => h !== handler);
        };
      },
      setShown: (slug) => {
        shownSlug.current = slug;
      },
    }),
    [router]
  );

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Shown (again): a close from an earlier showing must not swallow this one's, in case
    // the instance outlives a back step (10-REVIEW IN-10).
    closing.current = false;
    // StrictMode re-runs this effect; keep the first opener (the clicked tile).
    if (opener.current === null) opener.current = document.activeElement;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>('[aria-label="Close photo"]')?.focus();

    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        const layers = [...escapeLayers.current].reverse();
        if (!layers.some((handler) => handler())) api.close();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = tabbables(dialog);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && dialog.contains(active);
      if (event.shiftKey && (!inside || active === firstItem)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && (!inside || active === lastItem)) {
        event.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      html.style.overflow = previousOverflow;
      queueMicrotask(() => {
        // StrictMode's simulated unmount keeps the dialog in the document.
        if (dialog.isConnected) return;
        const slug = shownSlug.current ?? '';
        // Closed without close() (browser Back): tell the view now, and let it
        // render the photo shown before focus looks for its mark.
        if (!closing.current && slug) {
          flushSync(() => {
            document.dispatchEvent(new CustomEvent<string>(LIGHTBOX_CLOSE_EVENT, { detail: slug }));
          });
        }
        restoreFocus(slug, opener.current);
      });
    };
  }, [api]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-gallery p-0 text-ink backdrop:bg-gallery"
      onCancel={(event) => event.preventDefault()}
      onClose={() => {
        if (PHOTO_PATH.test(window.location.pathname)) api.close();
      }}
    >
      <LightboxContext.Provider value={api}>{children}</LightboxContext.Provider>
    </dialog>
  );
}
