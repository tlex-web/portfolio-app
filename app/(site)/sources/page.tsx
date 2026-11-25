import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowSquareOutIcon } from '@phosphor-icons/react/dist/ssr';
import { SOURCES_PAGE } from '@/data/source-credits';
import { SOURCES, SOURCES_INTRO, type SourceEntry } from '@/data/sources';
import { pageMetadata } from '@/lib/metadata';

/**
 * The data sources page (REGION-06; 18 D-20; 18-UI-SPEC Contract 7 "/sources
 * page"). A Server Component in the site shell, outside /photos, so no nav
 * item is current and there is no breadcrumb (Contract 6).
 *
 * One section per data source, in SOURCE_IDS order, each anchored at its id
 * (`/sources#<id>`, the target of the footer and every sheet margin) and
 * holding a definition list: the verbatim credit, the licence linked to its
 * official text in a new tab, the changes made, and the maps that use it.
 * Every string comes from data/sources.ts (server-only); the credits are the
 * data sources' own strings and wrap anywhere, so a long DOI or URL never
 * widens the page at 375 px.
 *
 * The description below, like every sentence in data/sources.ts that is not a
 * credit, is Tim's approved D-20 copy (18-03 Task 2, "approve-G1", 2026-11-25);
 * e2e/sources.spec.ts pins it literally.
 */
export const metadata: Metadata = pageMetadata({
  title: SOURCES_PAGE.title,
  description:
    'The elevation models behind the maps on this site, with the credit each licence asks for, the licence and the changes made.',
  path: SOURCES_PAGE.href,
});

const DT = 'text-sm text-ink-muted';
const ITEM_LINK = 'prose-link inline-flex min-h-11 items-center text-base';

function Entry({ entry }: { entry: SourceEntry }) {
  const headingId = `${entry.id}-name`;
  return (
    <section id={entry.id} aria-labelledby={headingId} className="mt-8 border-t border-line pt-8">
      <h2 id={headingId}>{entry.name}</h2>
      <dl className="mt-4 grid max-w-prose gap-y-4">
        <div>
          <dt className={DT}>Credit</dt>
          <dd data-field="credit" className="mt-1 flex min-w-0 flex-col gap-2">
            {entry.credit.map((text) => (
              <p key={text} className="text-base text-ink wrap-anywhere">
                {text}
              </p>
            ))}
          </dd>
        </div>
        <div>
          <dt className={DT}>Licence</dt>
          <dd data-field="licence" className="mt-1 min-w-0">
            <a
              href={entry.licence.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ITEM_LINK} gap-1 wrap-anywhere`}
            >
              {entry.licence.name}
              <ArrowSquareOutIcon size={16} aria-hidden="true" className="shrink-0" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </dd>
        </div>
        <div>
          <dt className={DT}>Changes</dt>
          <dd data-field="changes" className="mt-1 flex min-w-0 flex-col gap-2">
            {entry.changes.map((text) => (
              <p key={text} className="text-base text-ink-muted">
                {text}
              </p>
            ))}
          </dd>
        </div>
        <div>
          <dt className={DT}>Used on</dt>
          <dd data-field="used-on" className="mt-1 min-w-0">
            <ul className="flex flex-col">
              {entry.usedOn.map((item) => (
                <li key={item.label}>
                  {'href' in item ? (
                    <Link href={item.href} className={ITEM_LINK}>
                      {item.label}
                    </Link>
                  ) : (
                    <span className="inline-flex min-h-11 items-center text-base text-ink">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default function SourcesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 md:pb-16 lg:px-8">
      <div className="border-b border-line pt-8 pb-6">
        <h1>{SOURCES_PAGE.title}</h1>
      </div>
      <p className="mt-6 max-w-prose text-base text-ink-muted">{SOURCES_INTRO}</p>
      {SOURCES.map((entry) => (
        <Entry key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
