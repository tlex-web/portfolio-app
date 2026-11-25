import Link from 'next/link';

/** One crumb: its visible text, and its href unless it is the current page. */
export type BreadcrumbItem = { name: string; href?: string };

/**
 * The breadcrumb trail (D-10; 18-UI-SPEC Contract 6, E10). Props only: no data
 * import and no hooks, so it renders in server trees (the region page header)
 * and in client trees (the photo viewer's strip, 18-16 and 18-17) alike, and no
 * server-only module reaches a client chunk through it (T-18-17).
 *
 * Every item but the last is a link (inline-flex min-h-11, a 44 px target)
 * followed, inside its own <li>, by an aria-hidden '/' separator, so a screen
 * reader hears the list of links and the current page, never the slashes. The
 * last item is the current page: a plain span with aria-current="page", never
 * a link. The row is flex-wrap and nothing truncates, so a long current crumb
 * wraps onto its own line. The caller's BreadcrumbList JSON-LD reads the same
 * list (regionBreadcrumb), so the structured data equals what this renders.
 */
export default function Breadcrumb({
  items,
  className,
}: {
  items: readonly BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 text-sm">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${item.name}`} className="flex items-center gap-x-2">
              {last || item.href === undefined ? (
                <span aria-current={last ? 'page' : undefined} className="text-ink">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-ink-muted underline-offset-[0.2em] hover:text-ink hover:underline"
                >
                  {item.name}
                </Link>
              )}
              {last ? null : (
                <span aria-hidden="true" className="text-ink-muted">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
