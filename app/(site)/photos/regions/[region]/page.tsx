import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowSquareOutIcon } from '@phosphor-icons/react/dist/ssr';
import type { RegionFact } from '@/data/schemas/region';
import {
  regionById,
  regionHeading,
  regionIds,
  regionMetadata,
  regionPhotoViews,
  regionRights,
} from '@/lib/regions';
import { photoHref } from '@/lib/photos/routes';
import { factSource } from '@/lib/photos/view-model';

/**
 * The region page (REGION-07; D-01, D-02, D-05, D-11, D-15). A plain stand-in
 * inside the site shell until Phase 18's region plates: the region heading as
 * the h1, the region's sourced facts, its photos as text links in the series
 * order, and the printed rights line. No images, map or rail (D-11).
 *
 * The page lives at /photos/regions/<id>, beside photos/[slug] in the photos
 * layout, so "Photographs" is the current nav item and a photo link clicked
 * here opens the lightbox in the @modal slot over this page (the intercept
 * covers every page under /photos). @modal/regions/[region]/page.tsx closes
 * the lightbox on a soft navigation back here (17-RESEARCH Pitfall 1).
 *
 * Only the registry ids exist: generateStaticParams lists them and turning
 * dynamicParams off makes every other id a 404. A miss never reaches this page:
 * proxy.ts answers an unknown or wrong-case id with the neutral 404 before
 * render (D-05, T-17-01), because a notFound() thrown here would give Next
 * 16.4's empty __next_error__ shell and echo the typed id in the flight data.
 * The notFound() below is the unreachable guard, never the miss path.
 *
 * Each photo link carries data-photo-id, where the lightbox's restoreFocus
 * returns focus when the dialog closes.
 */

type PageProps = { params: Promise<{ region: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return regionIds.map((region) => ({ region }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region } = await params;
  return regionMetadata(region);
}

/** A fact's source: an external link (Wikipedia or the host) or 'Source: Tim'. */
function FactSource({ source }: { source: RegionFact['source'] }) {
  const s = factSource(source);
  if (s.kind === 'text') return <span>{s.label}</span>;
  return (
    <a
      href={s.href}
      target="_blank"
      rel="noopener noreferrer"
      className="prose-link inline-flex min-h-11 items-center gap-1 whitespace-nowrap"
    >
      {s.label}
      <ArrowSquareOutIcon size={16} aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default async function RegionPage({ params }: PageProps) {
  const { region: id } = await params;
  const region = regionById(id);
  if (!region) notFound();
  const views = regionPhotoViews(region.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 md:pb-16 lg:px-8">
      <div className="border-b border-line pt-8 pb-6">
        <h1>{regionHeading(region)}</h1>
      </div>

      <section aria-labelledby="region-facts" className="mt-8 max-w-prose">
        <h2 id="region-facts">Facts</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {region.facts.map((fact) => (
            <li key={fact.text} className="text-base">
              <p>{fact.text}</p>
              <p className="text-sm text-ink-muted">
                <FactSource source={fact.source} />
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="region-photos" className="mt-12 max-w-prose">
        <h2 id="region-photos">Photographs</h2>
        <ol className="mt-4 flex flex-col">
          {views.map((v) => (
            <li
              key={v.slug}
              className="flex flex-col gap-x-3 border-b border-line py-2 sm:flex-row sm:items-baseline"
            >
              <Link
                href={photoHref(v.slug)}
                data-photo-id={v.slug}
                className="prose-link inline-flex min-h-11 items-center text-base"
              >
                {v.title}
              </Link>
              <span className="font-mono text-sm text-ink-muted">
                {v.altitudeLabel} · {v.captureLabel}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-12 text-sm text-ink-muted">{regionRights(region.id)}</p>
    </div>
  );
}
