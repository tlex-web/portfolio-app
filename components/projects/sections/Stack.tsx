import type { Project } from '@/data/types';

type Group = NonNullable<Project['stack']>['groups'][number];

/**
 * The Stack slot (ENG-02; 11-UI-SPEC "Stack", E11). A Server Component: the
 * approved stack groups, each a label and a wrapping list of chips. Chips are
 * not interactive (no hover, no pointer) and the collection wraps, so nothing
 * hides behind "+n". A project with a single group renders it without an h3:
 * the section heading already names it. The schema forbids an empty group,
 * and a project without stack data renders no section.
 */
export default function Stack({
  id,
  label,
  groups,
}: {
  id: string;
  label: string;
  groups: Group[];
}) {
  if (groups.length === 0) return null;
  const titleId = `${id}-title`;
  const single = groups.length === 1;

  return (
    <section id={id} aria-labelledby={titleId}>
      <h2 id={titleId} className="text-heading text-balance">
        {label}
      </h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.label} className="min-w-0">
            {!single && <h3 className="text-base font-semibold text-ink">{group.label}</h3>}
            <ul className={`${single ? '' : 'mt-2 '}flex flex-wrap gap-2`}>
              {group.items.map((item) => (
                <li
                  key={item}
                  className="rounded-sm border border-line bg-surface-raised px-2 py-1 text-sm whitespace-nowrap text-ink"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
