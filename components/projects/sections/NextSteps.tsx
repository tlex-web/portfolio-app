import Link from 'next/link';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import RouteRow from '@/components/roadmap/RouteRow';
import { routeLogHref, type LogProject, type RouteLogItem } from '@/lib/route-log';

/**
 * The Next steps slot (ENG-02, ROUTE-01; D-30, D-32, N4; 11-UI-SPEC "Next
 * steps", E12). A Server Component: the project's planned or in-progress
 * route-log rows as compact RouteRows, each one link to that row in the
 * filtered route log, then a link to the project's full route log. The rows
 * arrive resolved and in the project's order (CaseStudy drops unknown and
 * completed ids); without a row there is no section.
 */
export default function NextSteps({
  id,
  label,
  slug,
  rows,
}: {
  id: string;
  label: string;
  slug: LogProject;
  rows: RouteLogItem[];
}) {
  if (rows.length === 0) return null;
  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={titleId}>
      <h2 id={titleId} className="text-heading text-balance">
        {label}
      </h2>
      <ul className="mt-6 flex flex-col">
        {rows.map((row) => (
          <RouteRow key={row.id} item={row} variant="compact" />
        ))}
      </ul>
      <Link
        href={routeLogHref({ project: slug, status: 'all' })}
        className="mt-4 inline-flex min-h-11 items-center gap-2 text-base font-semibold text-ink-muted hover:text-ink"
      >
        Full route log
        <ArrowRightIcon size={20} aria-hidden="true" />
      </Link>
    </section>
  );
}
