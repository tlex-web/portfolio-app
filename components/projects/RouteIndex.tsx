'use client';

import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr';
import { useEffect, useState } from 'react';

type Section = { id: string; label: string };

/** The nav height plus 16 px down to 40 % of the viewport: the band a section top crosses. */
const ROOT_MARGIN = '-80px 0px -60% 0px';

const LINK =
  'relative flex min-h-11 items-center gap-2 pl-4 text-base text-ink-muted hover:text-ink';
const LINK_CURRENT =
  'relative flex min-h-11 items-center gap-2 pl-4 text-base text-ink before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-accent';

/** The id in the URL hash when it names one of the sections, else null. */
function hashSection(ids: readonly string[]): string | null {
  const id = decodeURIComponent(window.location.hash.slice(1));
  return ids.includes(id) ? id : null;
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
 * '-80px 0px -60% 0px'); the current section is the last one whose top has
 * passed the band's lower line. State is set only in the observer callback
 * and the hashchange handler (React Compiler rules): the first callback
 * prefers a section named in the URL hash, so '/projects/box#safety' lands
 * with Safety current. Without JS the links still work and nothing is
 * current; the jump itself is the browser's (scroll-margin-top, no
 * animation under reduced motion). The observer disconnects on unmount
 * (T-11-32).
 */
export default function RouteIndex({ sections }: { sections: readonly Section[] }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    if (sections.length < 2 || typeof IntersectionObserver === 'undefined') return;
    const ids = sections.map((s) => s.id);
    // Whether each section's top has passed the line: it overlaps the band,
    // or it lies wholly above it.
    const passed = new Map<string, boolean>();
    let first = true;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const lineTop = entry.rootBounds?.top ?? 0;
          passed.set(
            entry.target.id,
            entry.isIntersecting || entry.boundingClientRect.top < lineTop
          );
        }
        const fromHash = first ? hashSection(ids) : null;
        first = false;
        let last: string | null = null;
        for (const id of ids) if (passed.get(id)) last = id;
        setCurrent(fromHash ?? last);
      },
      { rootMargin: ROOT_MARGIN }
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    const onHashChange = () => {
      const id = hashSection(ids);
      if (id) setCurrent(id);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', onHashChange);
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
