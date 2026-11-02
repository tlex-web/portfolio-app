'use client';

import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr';
import { useEffect, useState } from 'react';

type Section = { id: string; label: string };

/** The nav height plus 16 px down to 40 % of the viewport: the band a section top crosses. */
const ROOT_MARGIN = '-80px 0px -60% 0px';
/** The band's edges in viewport px, the same band ROOT_MARGIN leaves the observer. */
const BAND_TOP = 80;
const BAND_BOTTOM_SHARE = 0.4;

type Place = 'in' | 'above' | 'below';

/**
 * Where a section's live box sits against the band, or null when it has no
 * layout box (display: none) and so no place to judge. Edge contact counts as
 * in, as it does for the observer.
 */
function measure(el: HTMLElement): Place | null {
  const { top, bottom, width, height } = el.getBoundingClientRect();
  if (width === 0 && height === 0) return null;
  if (top <= window.innerHeight * BAND_BOTTOM_SHARE && bottom >= BAND_TOP) return 'in';
  return top < BAND_TOP ? 'above' : 'below';
}

const LINK =
  'relative flex min-h-11 items-center gap-2 pl-4 text-base text-ink-muted hover:text-ink';
const LINK_CURRENT =
  'relative flex min-h-11 items-center gap-2 pl-4 text-base text-ink before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-accent';

/**
 * The id in the URL hash when it names one of the sections, else null. The
 * hash is the visitor's: one that cannot be percent-decoded ('#%', '#%E0')
 * names no section rather than throwing URIError out of the observer callback
 * or the hashchange handler (WR-01).
 */
function hashSection(ids: readonly string[]): string | null {
  let id: string;
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return null;
  }
  return ids.includes(id) ? id : null;
}

/** Whether a page that scrolls at all is scrolled to its end. */
function scrolledToEnd(): boolean {
  const { scrollHeight } = document.documentElement;
  return scrollHeight > window.innerHeight && window.innerHeight + window.scrollY >= scrollHeight - 2;
}

function Links({ sections, current }: { sections: readonly Section[]; current: string | null }) {
  return sections.map(({ id, label }, i) => (
    <li key={id}>
      <a
        href={`#${id}`}
        aria-current={id === current ? 'location' : undefined}
        className={id === current ? LINK_CURRENT : LINK}
      >
        <span aria-hidden="true" className="font-mono text-sm text-ink-muted">
          {String(i + 1).padStart(2, '0')}
        </span>
        {label}
      </a>
    </li>
  ));
}

/**
 * The case-study route index (ENG-02; 11-UI-SPEC "Route index" and E5). A
 * client island that receives only the rendered sections' ids and labels
 * (T-11-31), in rendered order, so its 01…0n numbers (aria-hidden, visual
 * only) never leave a gap for an omitted section. Below two sections it
 * renders nothing (G6).
 *
 * One nav named Route stages holds two copies of the same list:
 * below 1024 px a closed `<details>` disclosure, from 1024 px a sticky list in
 * the 192 px left column of the page grid, beside the content, so it never
 * covers focus. The current link carries `aria-current="location"`, ink text
 * and the 2 px accent bar.
 *
 * Scroll-spy: one IntersectionObserver over the sections (rootMargin
 * '-80px 0px -60% 0px', a band from below the nav to 40 % of the viewport);
 * the current section is the first one in that band, else the last one
 * already scrolled above it, and at the very end of the page the last section
 * (a short last section never reaches the band's top). An anchor jump puts
 * its section's top at the band's top (scroll-margin-top), so the jumped-to
 * section is the one current. The observer alone misses a jump that moves a
 * section from above the band to below it without crossing it (back to the top
 * after reading to the end), so a passive scroll handler also re-measures every
 * section's live box against the same band (11-17). State is set only
 * in the observer callback and the hashchange and scroll handlers (React
 * Compiler rules), and only when the current section changes: the first
 * callback prefers a section named in the URL hash, so
 * '/projects/box#safety' lands with Safety current. Without JS the links still work and nothing is
 * current; the jump itself is the browser's (scroll-margin-top, no
 * animation under reduced motion). The observer disconnects on unmount
 * (T-11-32).
 */
export default function RouteIndex({ sections }: { sections: readonly Section[] }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    if (sections.length < 2 || typeof IntersectionObserver === 'undefined') return;
    const ids = sections.map((s) => s.id);
    // Where each section sits against the band: in it, wholly above it, or below.
    const where = new Map<string, Place>();
    let spied: string | null = null;
    let fromHash: string | null = null;
    let first = true;
    let atEnd = false;
    // The last value handed to setCurrent; undefined until the first one.
    let shown: string | null | undefined;

    const show = (id: string | null) => {
      if (id === shown) return;
      shown = id;
      setCurrent(id);
    };
    const spy = () => {
      const reading = ids.find((id) => where.get(id) === 'in');
      const passed = ids.filter((id) => where.get(id) === 'above');
      spied = reading ?? passed[passed.length - 1] ?? null;
      atEnd = scrolledToEnd();
      show(atEnd ? ids[ids.length - 1] : (fromHash ?? spied));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const lineTop = entry.rootBounds?.top ?? 0;
          where.set(
            entry.target.id,
            entry.isIntersecting ? 'in' : entry.boundingClientRect.top < lineTop ? 'above' : 'below'
          );
        }
        fromHash = first ? hashSection(ids) : null;
        first = false;
        spy();
      },
      { rootMargin: ROOT_MARGIN }
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    const onHashChange = () => {
      const id = hashSection(ids);
      if (id) show(id);
    };
    // The observer reports only sections whose intersection changed, so a
    // jump that carries a section from above the band to below it (or back)
    // without touching it, such as scrollTo(0, 0) after reading to the end,
    // goes unreported. Every scroll therefore re-measures each section's live
    // box against the band; at the very end of the page a short last section
    // may never reach the band, so reaching the end makes it current. Scroll
    // fires at most once per frame, the handler only reads layout, and state
    // changes only when the current section does.
    const onScroll = () => {
      for (const id of ids) {
        const el = document.getElementById(id);
        const place = el && measure(el);
        if (place) where.set(id, place);
      }
      spy();
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('scroll', onScroll);
    };
  }, [sections]);

  if (sections.length < 2) return null;

  return (
    <nav aria-label="Route stages">
      <details className="group mt-6 rounded-sm border border-line lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
          Route stages
          <CaretDownIcon size={20} aria-hidden="true" className="group-open:rotate-180" />
        </summary>
        <ol className="px-4 pb-2">
          <Links sections={sections} current={current} />
        </ol>
      </details>
      <ol className="hidden lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)] lg:block lg:self-start">
        <Links sections={sections} current={current} />
      </ol>
    </nav>
  );
}
