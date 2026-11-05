'use client';

import { SpeedInsights, computeRoute } from '@vercel/speed-insights/react';
import { useParams, usePathname, useSelectedLayoutSegment } from 'next/navigation';

/** The root not-found's segment, one level below the root layout (Next's NOT_FOUND_SEGMENT_KEY). */
const NOT_FOUND_SEGMENT = '/_not-found';

/** The route Speed Insights reports for every root 404. */
export const NOT_FOUND_ROUTE = '/404';

/**
 * Vercel Speed Insights with the route named here (T-12-03).
 *
 * The `next` export derives the route from usePathname() and useParams(), and
 * the root not-found has no params, so it wrote the raw path of a missed URL,
 * slug included, into its script's data-route attribute. This uses the
 * package's React export with the same derivation (computeRoute: param values
 * become [name]) and reports every root 404 as NOT_FOUND_ROUTE. The component
 * stays mounted, so a client-side navigation away from a 404 updates the route.
 * framework, basePath and configString are what the `next` export passes.
 */
export default function SpeedInsightsRoute() {
  const pathname = usePathname();
  const params = useParams<Record<string, string | string[]>>();
  const notFound = useSelectedLayoutSegment() === NOT_FOUND_SEGMENT;

  return (
    <SpeedInsights
      route={notFound ? NOT_FOUND_ROUTE : computeRoute(pathname, params)}
      framework="next"
      basePath={process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_BASEPATH}
      configString={process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG}
    />
  );
}
