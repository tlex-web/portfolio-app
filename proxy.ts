import { NextRequest, NextResponse } from 'next/server';
import { projects } from '@/data/projects';
import { EDGE_SECTION_HEADER, type EdgeSection } from '@/lib/edge-section';
import { photoSlugs } from '@/lib/photos/view-model';

/**
 * Known detail slugs per section (EDGE-01). A miss is decided here, before
 * render: a notFound() thrown inside the [slug] page makes Next 16.4 emit an
 * empty `__next_error__` shell with no h1 and no main (12-RESEARCH Pitfall 1,
 * the 07-23 STATE blocker), so unknown slugs never reach those pages.
 */
const KNOWN: Record<EdgeSection, ReadonlySet<string>> = {
  photos: new Set(photoSlugs),
  projects: new Set(projects.map((p) => p.slug)),
};

/**
 * An unmatched path: the rewrite lands on the root not-found, which renders
 * server-side with HTTP 404 (app/not-found.tsx). The visible URL is unchanged.
 */
const MISSING_PATH = '/__missing';

/** Exactly two segments; /photos/<x>/opengraph-image and deeper paths pass through. */
const DETAIL_PATH = /^\/(photos|projects)\/([^/]+)$/;

/**
 * The slug a document 404 is rendered under (T-12-03). Next writes the URL it
 * renders into the flight payload as `"c":["","photos","<slug>"]`, and a
 * rewrite keeps the requested URL there. So a document miss is fetched again
 * as /<section>/_ (an ordinary miss, rewritten below) and that HTML is served
 * at the typed URL: the page names no requested slug. Never a real slug.
 */
export const NEUTRAL_SLUG = '_';

/** Request headers the neutral render needs: content negotiation and the cookies. */
const NEUTRAL_REQUEST_HEADERS = ['accept', 'accept-language', 'cookie', 'user-agent'];

/** How long the neutral render may take to answer before the plain rewrite is used. */
export const NEUTRAL_TIMEOUT_MS = 5000;

/** Hop and encoding headers of the neutral render (fetch already decoded the body). */
const NEUTRAL_DROPPED_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'transfer-encoding',
]);

/**
 * The 404 page for a missed document, rendered under NEUTRAL_SLUG, or null.
 * Called only for a host canFetchNeutral allows.
 *
 * Only document requests: a client-side navigation (sec-fetch-dest "empty")
 * keeps the plain rewrite and gets its flight answer, which is never written
 * into the page (the router loads a 404 answer as a new document, which comes
 * back here). Null on any failure, an unexpected status or no answer within
 * NEUTRAL_TIMEOUT_MS; the caller then rewrites as before, so the visitor still
 * gets the 404 (with the slug back in the flight data). The timeout covers the
 * response headers only, so a slow body is never cut off. The response keeps
 * the neutral render's own CSP header (its scripts carry that render's nonce)
 * and drops its x-middleware-* headers, which would otherwise read as a second
 * proxy result.
 */
async function neutral404(request: NextRequest, section: EdgeSection): Promise<Response | null> {
  const dest = request.headers.get('sec-fetch-dest');
  if (dest !== null && dest !== 'document') return null;

  const headers = new Headers();
  for (const name of NEUTRAL_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NEUTRAL_TIMEOUT_MS);
  try {
    const neutral = await fetch(new URL(`/${section}/${NEUTRAL_SLUG}`, request.url), {
      headers,
      redirect: 'manual',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (neutral.status !== 404 || neutral.body === null) return null;

    const responseHeaders = new Headers();
    neutral.headers.forEach((value, name) => {
      if (!NEUTRAL_DROPPED_HEADERS.has(name) && !name.startsWith('x-middleware-')) {
        responseHeaders.append(name, value);
      }
    });
    return new Response(neutral.body, { status: 404, headers: responseHeaders });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Hostnames that only ever reach this machine (URL.hostname keeps IPv6 brackets). */
const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * The hostname of one Vercel system variable (a bare hostname such as
 * "portfolio-app-abc.vercel.app"), lower-cased, or null when it is unset,
 * empty or not a hostname. A scheme or path, should one appear, is ignored.
 */
function envHostname(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    // URL lower-cases the hostname.
    return new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`).hostname || null;
  } catch {
    return null;
  }
}

/**
 * Whether the proxy may fetch the neutral 404 from this host (T-12-03).
 *
 * The fetch goes to the request's own origin, and its answer is served under
 * this site's origin, so it runs only on loopback or on a hostname Vercel
 * names for this deployment (VERCEL_URL, VERCEL_BRANCH_URL,
 * VERCEL_PROJECT_PRODUCTION_URL, read per request). Exact matches only. Any
 * other host gets the plain rewrite: still the 404, with the slug in the
 * flight data. `hostname` is the host of request.url, the URL the fetch
 * resolves against.
 */
export function canFetchNeutral(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (LOOPBACK.has(host)) return true;
  return [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].some((value) => envHostname(value) === host);
}

/**
 * The Content-Security-Policy for one response (VERIFY-01, VERIFY-03, D-17).
 *
 * D-17: `upgrade-insecure-requests` is sent on every request except plain
 * HTTP to a loopback host, where it would upgrade the local production
 * build's own sub-resources to an https://localhost nobody serves (local
 * WebKit then loads no CSS or scripts). The rule reads only the request URL:
 * a visitor-sent x-forwarded-proto cannot remove the directive on a public
 * host, and Vercel serves every public request over HTTPS (T-12-04).
 *
 * script-src carries the per-request nonce and 'strict-dynamic';
 * 'unsafe-eval' is added only under `next dev`, where React needs it for
 * error stacks (Next CSP guide: not required in production). connect-src is
 * 'self' only: the site fetches nothing cross-origin.
 */
export function buildCsp(nonce: string, url: URL, isDev: boolean): string {
  const localHttp = url.protocol === 'http:' && LOOPBACK.has(url.hostname);
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(localHttp ? [] : ['upgrade-insecure-requests']),
  ];
  return `${directives.join('; ')};`;
}

export async function proxy(request: NextRequest): Promise<Response> {
  const match = DETAIL_PATH.exec(request.nextUrl.pathname);
  const section = match?.[1] as EdgeSection | undefined;
  const miss = section !== undefined && match !== null && !KNOWN[section].has(match[2]);

  if (miss && match[2] !== NEUTRAL_SLUG && canFetchNeutral(new URL(request.url).hostname)) {
    const neutral = await neutral404(request, section);
    if (neutral) return neutral;
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = buildCsp(nonce, request.nextUrl, process.env.NODE_ENV === 'development');

  const requestHeaders = new Headers(request.headers);
  // T-12-02: only the proxy may name the section; a client copy never reaches the render.
  requestHeaders.delete(EDGE_SECTION_HEADER);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  let response: NextResponse;
  if (miss) {
    requestHeaders.set(EDGE_SECTION_HEADER, section);
    response = NextResponse.rewrite(new URL(MISSING_PATH, request.url), {
      request: { headers: requestHeaders },
    });
  } else {
    response = NextResponse.next({
      request: { headers: requestHeaders },
    });
  }
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    {
      // Static public assets (images/, terrain/, media/; trailing slash so a
      // future /images-x page still gets its CSP) skip the per-request nonce work.
      source:
        '/((?!api|_next/static|_next/image|favicon.ico|service-worker.js|images/|terrain/|media/).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
