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

/** Hostnames that only ever reach this machine (URL.hostname keeps IPv6 brackets). */
const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);

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

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = buildCsp(nonce, request.nextUrl, process.env.NODE_ENV === 'development');

  const requestHeaders = new Headers(request.headers);
  // T-12-02: only the proxy may name the section; a client copy never reaches the render.
  requestHeaders.delete(EDGE_SECTION_HEADER);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const match = DETAIL_PATH.exec(request.nextUrl.pathname);
  const section = match?.[1] as EdgeSection | undefined;
  let response: NextResponse;
  if (section && match && !KNOWN[section].has(match[2])) {
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
