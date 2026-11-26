/**
 * The region ids, for proxy.ts only (REGION-07, D-04, D-05).
 *
 * proxy.ts decides an unknown /photos/regions/<id> before render, so it needs
 * the registry's id list. The list lives here, not in lib/photos/routes.ts:
 * client components import photoHref from routes.ts, and a JSON import there
 * ships the whole registry (names and sourced facts) to the browser. 17-RESEARCH
 * measured +2,200 B of client JS, with the facts in two client chunks, when
 * routes.ts imported regions.json, even with the pure annotation. Nothing but
 * proxy.ts imports this module; the server-side region model is lib/regions.ts.
 */
import registry from '@/data/regions/regions.json';

/** The registry ids in registry order (ortler, saalfelden, zermatt). */
export const regionRouteIds: readonly string[] = registry.regions.map((r) => r.id);

/**
 * The region the retired `?view=grid` and `?view=carousel` URLs land on (18
 * D-03, PHOTO-06): the v2.0 grid and carousel showed the Zermatt photos, so
 * proxy.ts answers those two URLs with a 308 to this region's page. A constant,
 * never read from the request (T-18-44), and for proxy.ts only, like the id
 * list above. lib/__tests__/proxy.test.ts pins it to a registry id.
 */
export const LEGACY_VIEW_REGION = 'zermatt';
