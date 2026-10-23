'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { site } from '@/data/site';

type SiteNavVariant = 'default' | 'static';

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

  return (
    <header className="sticky top-0 z-(--z-nav) h-16 bg-surface border-b border-line">
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
