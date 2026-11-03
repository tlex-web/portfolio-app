/**
 * Which section a missed URL belonged to (EDGE-01, D-11).
 *
 * proxy.ts rewrites an unknown /photos/<slug> or /projects/<slug> to an
 * unmatched path and sets EDGE_SECTION_HEADER on the forwarded request, after
 * deleting any copy the visitor sent. app/not-found.tsx reads it back through
 * headers() and parseEdgeSection, so the 404 can offer a link back to the
 * right section without ever seeing (or echoing) the requested slug.
 *
 * The proxy alone names the section on requests the proxy handles. On the
 * requests its matcher skips (RSC prefetches with next-router-prefetch, paths
 * starting with `api`, missing files under images/, terrain/ and media/) a
 * visitor-sent header reaches the 404 unchanged and can pick one of the two
 * values below for the sender's own response: the accepted residual
 * 12-SECURITY AR-12-02.
 *
 * Pure and import-free: the proxy and the server render both use it.
 */

/** The request header the proxy sets on a section miss. */
export const EDGE_SECTION_HEADER = 'x-edge-section';

/** The sections whose detail routes have a context-aware 404. */
export type EdgeSection = 'photos' | 'projects';

/**
 * The section named by a header value, or undefined for anything other than
 * exactly 'photos' or 'projects' (absent, empty, differently cased or forged).
 */
export function parseEdgeSection(value: string | null | undefined): EdgeSection | undefined {
  return value === 'photos' || value === 'projects' ? value : undefined;
}
