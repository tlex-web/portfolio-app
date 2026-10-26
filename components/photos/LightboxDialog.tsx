'use client';

import { createContext, useContext, useLayoutEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

/**
 * The lightbox shell (LBOX-01, LBOX-03; 10-UI-SPEC "Photo Viewer", Surfaces;
 * 10-RESEARCH Spike Results and Pattern 4). The intercepted
 * `@modal/(.)[slug]` route wraps the modal PhotoViewer in this native
 * `<dialog>`, opened with showModal(): the spike's choice over an overlay
 * with `inert`, because the top layer makes the nav, footer, skip link and
 * gallery inert natively, needs no z-index token and carries modal semantics.
 *
 * - Open: showModal() in a layout effect, only when the dialog is not open
 *   yet (StrictMode runs effects twice). The page behind is scroll-locked with
 *   `overflow: hidden` on `<html>`; the stable scrollbar gutter stays, so the
 *   header box does not move (G3 in e2e/design-system.spec.ts).
 * - Close: router.back() only (the Close button, and from Task 2 Escape). The
 *   popstate never starts a view transition (spike), so nothing waits for a
 *   close animation. `cancel` is always prevented: from the third consecutive
 *   Escape it stops being cancelable and the dialog would close natively
 *   while the URL still names the photo (10-RESEARCH Pitfall 5).
 * - Context: useLightbox() returns `{ close, registerEscape }` inside the
 *   dialog and null outside, so PhotoViewer knows its surface. Escape layers
 *   (10-10 zoom, 10-11 callouts) register handlers; the newest that returns
 *   true consumes the press.
 * - No loading.tsx in the slot (Pitfall 4). jsdom has no showModal, so
 *   jest.setup.js stubs it (Pitfall 11); behaviour is tested in Playwright.
 */

export type LightboxApi = {
  /** Close the lightbox through the router (history Back). */
  close(): void;
  /** Register an Escape layer; returns its unregister function. */
  registerEscape(handler: () => boolean): () => void;
};

const LightboxContext = createContext<LightboxApi | null>(null);

/** The lightbox API inside the dialog; null on the full photo page. */
export function useLightbox(): LightboxApi | null {
  return useContext(LightboxContext);
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
  const escapeLayers = useRef<Array<() => boolean>>([]);

  const api = useMemo<LightboxApi>(
    () => ({
      close: () => router.back(),
      registerEscape: (handler) => {
        escapeLayers.current.push(handler);
        return () => {
          escapeLayers.current = escapeLayers.current.filter((h) => h !== handler);
        };
      },
    }),
    [router]
  );

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-gallery p-0 text-ink backdrop:bg-gallery"
      onCancel={(event) => event.preventDefault()}
    >
      <LightboxContext.Provider value={api}>{children}</LightboxContext.Provider>
    </dialog>
  );
}
