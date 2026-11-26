'use client';

import {
  useEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, X } from '@phosphor-icons/react/dist/ssr';
import { site } from '@/data/site';
import { slugFromPath } from '@/lib/photos/stepping';

type SiteNavVariant = 'default' | 'static';

/** The desktop nav appears at md (768px); reaching it closes the mobile menu. */
const DESKTOP_QUERY = '(min-width: 768px)';

/**
 * Mobile menu motion (UI-SPEC "Mobile menu"), CSS only, driven by data-state:
 * open fades in and settles from -8px over --duration-panel (geological);
 * close fades out over --duration-fast (descent). @starting-style gives the
 * entry its from-state and allow-discrete keeps the panel displayed until the
 * fade ends. Under reduced motion there is no transition and no translate.
 */
const PANEL_MOTION = [
  'motion-safe:transition-[opacity,translate,display] motion-safe:transition-discrete',
  'motion-safe:starting:opacity-0 motion-safe:starting:-translate-y-2',
  'data-[state=open]:duration-(--duration-panel) data-[state=open]:ease-geological',
  'data-[state=closed]:opacity-0 data-[state=closed]:duration-(--duration-fast) data-[state=closed]:ease-descent',
  'motion-reduce:transition-none',
].join(' ');

const CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';
const WORDMARK =
  'font-display text-base font-semibold tracking-[-0.01em] text-ink min-h-11 inline-flex items-center';
const COLOR_TRANSITION = 'transition-colors duration-(--duration-fast) ease-erosion';

/** The mobile menu panel's id (the disclosure button's aria-controls). */
const MENU_ID = 'site-menu';

/**
 * True when a key press belongs to the site chrome, not to the page content
 * (10-REVIEW CR-01): the mobile menu is open (it sits over the page and owns
 * the keyboard until it closes), or the press comes from outside `<main>`
 * (the skip link, this nav, the footer). A press with nothing focused (the
 * body) belongs to the page. Page shortcuts that listen on the document (the
 * photo page viewer) skip these presses.
 */
export function keyBelongsToChrome(event: KeyboardEvent): boolean {
  if (document.getElementById(MENU_ID)?.hidden === false) return true;
  const { target } = event;
  return (
    target instanceof Element &&
    target !== document.body &&
    target !== document.documentElement &&
    target.closest('main') === null
  );
}

/** Space kept between a revealed row and the panel's edge: the panel's py-2. */
const ROW_CLEARANCE = 8;

/**
 * Keeps a focused panel row fully inside the panel's scrollport (SHELL-08, D-17):
 * when the panel scrolls (a short viewport), Firefox leaves a partly visible row
 * where it is when focus lands on it, cutting the row and its ring at the panel's
 * edge; Chromium already scrolls it in, so this is a no-op there. It scrolls the
 * panel only, never the page.
 *
 * Keyboard focus only (`:focus-visible`, the case the ring draws for; 14-REVIEW
 * WR-01): Firefox focuses a link on mousedown, and scrolling the panel between
 * mousedown and mouseup can move the row out from under the pointer, so the
 * click lands on the list instead and nothing navigates.
 */
function revealFocusedRow(event: ReactFocusEvent<HTMLDivElement>) {
  const panel = event.currentTarget;
  const row = event.target;
  if (row === panel || !(row instanceof HTMLElement) || !row.matches(':focus-visible')) return;
  const box = row.getBoundingClientRect();
  const top = panel.getBoundingClientRect().top + panel.clientTop;
  const bottom = top + panel.clientHeight;
  if (box.bottom + ROW_CLEARANCE > bottom) panel.scrollTop += box.bottom + ROW_CLEARANCE - bottom;
  else if (box.top - ROW_CLEARANCE < top) panel.scrollTop -= top - (box.top - ROW_CLEARANCE);
}

/** `/` matches exactly; every other destination also matches its sub-paths. */
export function isCurrentPath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Primary navigation (SHELL-01, SHELL-02; UI-SPEC "SiteNav").
 * `variant="static"` is the global-error fallback: plain links, no usePathname,
 * no current-page indicator and no menu state, so a broken hook cannot crash it.
 */
export default function SiteNav({ variant = 'default' }: { variant?: SiteNavVariant }) {
  return variant === 'static' ? <StaticNav /> : <DefaultNav />;
}

function DefaultNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close trigger 1: route change. Adjusting state while rendering (not in an
  // effect) closes the panel in the same render that shows the new route. A step
  // between photos is not a route change: the viewer replaces the URL in place, and
  // usePathname can report that late, after the menu has opened (no menu link goes
  // from one photo to another, so nothing here needs to close it).
  const [menuPath, setMenuPath] = useState(pathname);
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    if (slugFromPath(pathname) === null || slugFromPath(menuPath) === null) setOpen(false);
  }

  // Close trigger 7 (SHELL-07, D-16, D-23): a plain tap on the panel link whose
  // href equals the pathname (strict equality, not isCurrentPath: 'Photographs'
  // on a photo page is current but navigates, so trigger 1 closes it). Modified or
  // non-primary activations keep the browser's behaviour (new tab, download). With
  // no query string the tap is default-prevented: Next skips its navigation and its
  // scroll-to-top (no scroll jump). With one (/photos?view=map, /roadmap?project=box)
  // Next still navigates to the plain page, but usePathname drops the query, so the
  // pathname does not change and trigger 1 never fires: this handler closes the panel
  // at tap in both cases. Escape's order: focus Menu before the link hides, so focus
  // never drops to <body> and the header focusout close stays quiet. preventScroll:
  // the button sits in the sticky header, always in view, but the global
  // scroll-margin-top (nav height + 16 px) makes a plain focus() scroll the page up
  // to "reveal" it (D-16 keeps the scroll position).
  function closeOnCurrentLink(event: ReactMouseEvent<HTMLAnchorElement>, href: string) {
    const plain =
      event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    if (!plain || href !== pathname) return;
    if (window.location.search === '') event.preventDefault();
    buttonRef.current?.focus({ preventScroll: true });
    setOpen(false);
  }

  // Close triggers 2, 4, 5 and 6, attached only while the panel is open.
  useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    const isOutside = (node: EventTarget | null) =>
      node instanceof Node && header !== null && !header.contains(node);

    // Escape is the open menu's: a document capture listener that prevents the
    // press, so a page's own Escape handling (the photo page goes to /photos)
    // skips it (10-REVIEW CR-01). Focus moves to Menu with preventScroll for the
    // reason at the tap close above: a plain focus() scrolled the page up (/roadmap
    // at 375 x 812 from 600 to 530 in Chromium, 185.5 in Firefox).
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      buttonRef.current?.focus({ preventScroll: true });
      setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (isOutside(event.target)) setOpen(false);
    };
    // A null relatedTarget (window blur, tab switch) is not "focus moved outside".
    const onFocusOut = (event: FocusEvent) => {
      if (isOutside(event.relatedTarget)) setOpen(false);
    };
    const desktop = typeof window.matchMedia === 'function' ? window.matchMedia(DESKTOP_QUERY) : null;
    const onViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown);
    header?.addEventListener('focusout', onFocusOut);
    desktop?.addEventListener('change', onViewportChange);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown);
      header?.removeEventListener('focusout', onFocusOut);
      desktop?.removeEventListener('change', onViewportChange);
    };
  }, [open]);

  return (
    <header ref={headerRef} className="sticky top-0 z-(--z-nav) h-16 bg-surface border-b border-line">
      <div className={`${CONTAINER} h-full`}>
        <nav aria-label="Primary" className="flex h-full items-center justify-between gap-4">
          <Link href="/" aria-label={`${site.name}, home`} className={WORDMARK}>
            {site.name}
          </Link>

          <ul className="hidden md:flex md:items-center md:gap-2">
            {site.nav.map((item) => {
              const current = isCurrentPath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    className={`relative min-h-11 px-4 inline-flex items-center text-base font-normal ${COLOR_TRANSITION} ${
                      current ? 'text-ink' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {item.label}
                    {current && (
                      <span
                        aria-hidden="true"
                        data-indicator="current"
                        className="pointer-events-none absolute inset-x-4 bottom-2 h-0.5 bg-accent"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Mobile (<768px): disclosure button. Visible text "Menu" in both states (label-in-name);
              the state is carried by aria-expanded. Close trigger 3: a second press. */}
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls={MENU_ID}
            onClick={() => setOpen((value) => !value)}
            className="md:hidden min-h-11 min-w-11 px-4 inline-flex items-center gap-2 text-ink cursor-pointer touch-manipulation"
          >
            {open ? <X size={24} aria-hidden="true" /> : <List size={24} aria-hidden="true" />}
            Menu
          </button>

          {/* Disclosure panel, not a dialog: no scroll lock, no focus trap, background stays interactive.
              `hidden` when closed so its links are not focusable. */}
          <div
            id={MENU_ID}
            data-state={open ? 'open' : 'closed'}
            hidden={!open}
            onFocus={revealFocusedRow}
            className={`md:hidden absolute inset-x-0 top-16 z-(--z-menu) bg-surface-raised border-b border-line max-h-[calc(100svh-var(--nav-h))] overflow-y-auto py-2 ${PANEL_MOTION}`}
          >
            <ul className="flex flex-col gap-2">
              {site.nav.map((item) => {
                const current = isCurrentPath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current ? 'page' : undefined}
                      onClick={(event) => closeOnCurrentLink(event, item.href)}
                      // SHELL-08, D-17: the ring draws 2-4 px inside the row (offset -4,
                      // width 2 from the global rule), so the panel's overflow-y-auto can
                      // never clip it; it starts at x 2 and abuts the 2 px accent bar.
                      className={`relative flex min-h-12 items-center px-4 font-display text-heading font-normal focus-visible:-outline-offset-4 ${COLOR_TRANSITION} ${
                        current ? 'text-ink' : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {current && (
                        <span
                          aria-hidden="true"
                          data-indicator="current"
                          className="pointer-events-none absolute left-0 inset-y-2 w-0.5 bg-accent"
                        />
                      )}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}

function StaticNav() {
  return (
    <header className="sticky top-0 z-(--z-nav) min-h-16 bg-surface border-b border-line">
      <div className={CONTAINER}>
        <nav aria-label="Primary" className="flex min-h-16 flex-wrap items-center gap-2">
          {/* Plain anchors on purpose: the global-error fallback must not depend on the router */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" aria-label={`${site.name}, home`} className={`${WORDMARK} mr-4`}>
            {site.name}
          </a>
          <ul className="flex flex-wrap items-center gap-2">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`min-h-11 px-4 inline-flex items-center text-base font-normal text-ink-muted hover:text-ink ${COLOR_TRANSITION}`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
