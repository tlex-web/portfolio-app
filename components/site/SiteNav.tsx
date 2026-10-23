'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, X } from '@phosphor-icons/react/dist/ssr';
import { site } from '@/data/site';

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
  // effect) closes the panel in the same render that shows the new route.
  const [menuPath, setMenuPath] = useState(pathname);
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    setOpen(false);
  }

  // Close triggers 2, 4, 5 and 6, attached only while the panel is open.
  useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    const isOutside = (node: EventTarget | null) =>
      node instanceof Node && header !== null && !header.contains(node);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      buttonRef.current?.focus();
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

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    header?.addEventListener('focusout', onFocusOut);
    desktop?.addEventListener('change', onViewportChange);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
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
            aria-controls="site-menu"
            onClick={() => setOpen((value) => !value)}
            className="md:hidden min-h-11 min-w-11 px-4 inline-flex items-center gap-2 text-ink cursor-pointer touch-manipulation"
          >
            {open ? <X size={24} aria-hidden="true" /> : <List size={24} aria-hidden="true" />}
            Menu
          </button>

          {/* Disclosure panel, not a dialog: no scroll lock, no focus trap, background stays interactive.
              `hidden` when closed so its links are not focusable. */}
          <div
            id="site-menu"
            data-state={open ? 'open' : 'closed'}
            hidden={!open}
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
                      className={`relative flex min-h-12 items-center px-4 font-display text-heading font-normal ${COLOR_TRANSITION} ${
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
