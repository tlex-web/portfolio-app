import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowSquareOutIcon } from '@phosphor-icons/react/dist/ssr';
import type { RegionFact } from '@/data/schemas/region';
import HeaderSlot from '@/components/photos/region/HeaderSlot';
import NextRegion from '@/components/photos/region/NextRegion';
import PlateKey from '@/components/photos/region/PlateKey';
import PlateSheet from '@/components/photos/region/PlateSheet';
import RegionHeader from '@/components/photos/region/RegionHeader';
import RegionSequence from '@/components/photos/region/RegionSequence';
import { breadcrumbLd, regionGalleryLd } from '@/lib/json-ld/content';
import { jsonLdHtml } from '@/lib/json-ld/site';
import {
  regionBreadcrumb,
  regionById,
  regionIds,
  regionMetadata,
  regionPhotoViews,
  regionPlateSheet,
} from '@/lib/regions';
import { factSource } from '@/lib/photos/view-model';
import { sheetMargin } from '@/lib/sheet-margin';

/**
 * The region page (REGION-07; D-01, D-02, D-05, D-11, D-15), built up by
 * Phase 18 inside the site shell: the header band, the region's sourced facts,
 * its photos as the sequence in the series order with the printed rights line,
 * and the next-region block. The plate and the rail follow (18-09, 18-12).
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
 *
 * The region's ImageGallery (17-14; SEO-04, D-16) is a native JSON-LD data
 * block ahead of the stand-in, on this page only: the @modal region page never
 * carries one. Its texts are this page's own (heading, description, rights
 * line) and its hasPart lists the photos linked below, in the same order.
 *
 * 18-06 (REGION-02, D-10): RegionHeader is the header band (breadcrumb, h1,
 * data line). Its breadcrumb and the second data block, breadcrumbLd, both
 * read regionBreadcrumb(id), so the BreadcrumbList equals the visible crumbs.
 * The facts list stays until 18-09.
 *
 * 18-08 (REGION-03, REGION-04, D-07): RegionSequence replaces the stand-in's
 * text photo list: a full-bleed gallery band, after the container, holding
 * each photo uncropped in its map collar with its caption, and the rights line
 * after the list. Each photo link still carries data-photo-id. HeaderSlot,
 * between the header band and the facts, holds the region's cover in Phase
 * 19's 16:9 box (D-05), the page's LCP image.
 * NextRegion closes the page after the sequence (D-01, D-11): the trail
 * sign to the next region west to east, wrapping to the first, and 'All
 * regions'; its own py-12 md:py-16 replaces the container's bottom padding.
 *
 * 18-09 (REGION-02): the region's local plate follows the facts under an h2
 * 'Map': PlateSheet, server-rendered from regionPlateSheet(id)'s plain props,
 * with an exact dot and a numbered badge per photo (a same-page anchor to its
 * figure, pointer-only). 18-10 adds the key list and the facts and plate grid.
 *
 * 18-10 (REGION-02, D-08): the facts and plate block, data-plate-root (the
 * root of the list-plate :has() sync in plateCss). Below 1024 px one column:
 * Facts, the plate, then PlateKey (the h2 'Map' and the key list of anchors
 * to the sequence). From 1024 px a 2fr/3fr grid: Facts then the key list on
 * the left, the plate on the right (634 px at 1440). DOM order stays Facts,
 * plate, key list; the plate holds nothing focusable, so the tab order is the
 * left column's visual order. Key rows get each photo's title and altitude
 * label here, on the server, as plain props.
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
  const sheet = regionPlateSheet(region.id);
  // 18-11 Task 1: the LV95 sheets' margins; Task 2 emits Saalfelden's WGS84 corners.
  const margin = region.plate === 'saalfelden' ? undefined : sheetMargin(region.plate);
  const views = new Map(regionPhotoViews(region.id).map((v) => [v.slug, v]));
  const keyRows = sheet.pins.map((pin) => {
    const view = views.get(pin.slug);
    if (!view) throw new RangeError(`region page: pin ${pin.slug} has no photo view`);
    return { ...pin, title: view.title, altitudeLabel: view.altitudeLabel };
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(regionGalleryLd(region.id)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbLd(regionBreadcrumb(region.id))) }}
      />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <RegionHeader id={region.id} />
        <HeaderSlot id={region.id} />

        <div
          data-plate-root
          className="mt-12 flex flex-col gap-12 lg:mt-16 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-rows-[auto_1fr] lg:gap-8"
        >
          <section aria-labelledby="region-facts" className="lg:col-start-1 lg:row-start-1">
            <h2 id="region-facts">Facts</h2>
            <ul className="mt-4 flex max-w-prose flex-col gap-4">
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
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <PlateSheet sheet={sheet} margin={margin} />
          </div>
          <div className="lg:col-start-1 lg:row-start-2">
            <PlateKey pins={keyRows} />
          </div>
        </div>
      </div>
      <RegionSequence id={region.id} />
      <NextRegion id={region.id} />
    </>
  );
}
