import { trailProfiles } from '@/data/generated/trail-profiles';
import { formatMetres } from '@/lib/photo-format';
import { profilePath } from '@/lib/trail-profile';
import TrailGradeMark from './TrailGradeMark';

/**
 * The elevation-profile glyph of a project's real trail with its signpost
 * caption (D-05, D-06, D-07; 11-UI-SPEC "RouteProfile glyph").
 *
 * A Server Component with zero JS: it is the only reader of the generated,
 * RSC-only trail profiles, so their geometry never reaches a client bundle
 * (T-11-27; no client directive here, ever).
 *
 * The svg is decorative (`aria-hidden`, `focusable="false"`) and stretches
 * with `preserveAspectRatio="none"`, so it holds only paths: the area to the
 * baseline in the contour tint, the 2 px profile line and the 1 px baseline,
 * both strokes non-scaling. The meaning sits in the caption, read from the
 * generator's DEM endpoints (08 D-17): '{start} {h} m → {end} {h} m · [glyph]
 * T4'. Each place-and-height and the '· [glyph] T4' badge are nowrap units, so
 * the caption wraps only between them; the arrow and the middle dot are
 * aria-hidden, with ' to ' and ', ' for screen readers ("Schwarzsee 2,587 m to
 * Hörnlihütte 3,262 m, T4, white-blue-white waymark").
 *
 * An id with no committed profile renders nothing: no placeholder line and no
 * generic mountain.
 */
export default function RouteProfile({ id, className }: { id: string; className?: string }) {
  const profile = trailProfiles.find((p) => p.id === id);
  if (!profile) return null;
  const { line, area, baseline } = profilePath(profile.points);

  return (
    <figure className={className}>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 320 96"
        preserveAspectRatio="none"
        className="block h-24 w-full"
      >
        <path d={area} className="fill-contour" />
        <path
          d={line}
          className="fill-none stroke-ink-muted"
          strokeWidth={2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={baseline}
          className="fill-none stroke-line"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <figcaption className="mt-2 font-mono text-sm text-ink">
        <span className="whitespace-nowrap">
          {profile.start.name} {formatMetres(profile.start.heightM)}
        </span>
        <span aria-hidden="true"> → </span>
        <span className="sr-only"> to </span>
        <span className="whitespace-nowrap">
          {profile.end.name} {formatMetres(profile.end.heightM)}
        </span>
        <span aria-hidden="true"> </span>
        <span className="whitespace-nowrap">
          <span aria-hidden="true">· </span>
          <span className="sr-only">, </span>
          <TrailGradeMark grade={profile.sacGrade} />
        </span>
      </figcaption>
    </figure>
  );
}
