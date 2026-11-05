import Link from 'next/link';
import { photos } from '@/data/generated/photos';
import { projects } from '@/data/projects';
import { site } from '@/data/site';
import { countLabel } from '@/lib/home-format';

const PLATE =
  'flex flex-1 items-center justify-between gap-4 rounded-l-sm border border-line-strong bg-surface-raised px-4 transition-colors duration-(--duration-fast) ease-erosion group-hover:border-ink-muted group-hover:bg-surface-overlay';
const TIP_CLIP = { clipPath: 'polygon(0 0, 100% 50%, 0 100%)' } as const;

function navLabel(href: string): string {
  const entry = site.nav.find((item) => item.href === href);
  if (!entry) throw new Error(`TrailSigns: no site.nav entry for ${href}`);
  return entry.label;
}

/**
 * The two trail signs, Home's call to action (HOME-01, HOME-06; D-13;
 * 09-UI-SPEC "Trail Signs" and "Trail yellow"). Server component.
 *
 * Labels and hrefs come from site.nav, counts from the photo and project data,
 * so the accessible names read "Photographs, 4 waypoints" and "Engineering, 2
 * routes". The name is an explicit aria-label built from the same strings: the
 * plate is a flex box, so its children are blockified and name computation
 * would put a space before an sr-only comma ("Photographs , 4 waypoints"). The
 * label starts with the visible destination (label in name). A zero count
 * prints, and names, the destination only. The plate is a dark surface-raised panel; the yellow arrow tip is the
 * only use of bg-trail and is decorative. Hover changes colour only, never
 * scale or position; the focus ring draws on the link rectangle, unclipped.
 */
export default function TrailSigns() {
  const signs = [
    { href: '/photos', count: countLabel(photos.length, 'waypoint', 'waypoints') },
    { href: '/projects', count: countLabel(projects.length, 'route', 'routes') },
  ].map((sign) => ({ ...sign, label: navLabel(sign.href) }));

  return (
    <ul aria-label="Trail signs" className="flex w-full max-w-80 flex-col gap-2">
      {signs.map(({ href, label, count }) => (
        <li key={href}>
          <Link
            href={href}
            aria-label={count ? `${label}, ${count}` : label}
            className="group flex min-h-14 w-full items-stretch rounded-sm"
          >
            <span className={PLATE}>
              <span className="text-base font-semibold text-ink">{label}</span>
              {count ? <span className="font-mono text-sm text-ink-muted tabular-nums">{count}</span> : null}
            </span>
            <span aria-hidden="true" className="w-6 shrink-0 bg-trail" style={TIP_CLIP} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
