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

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self' data:;
    connect-src 'self' https://raw.githubusercontent.com;
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim();

  const requestHeaders = new Headers(request.headers);
  // T-12-02: only the proxy may name the section; a client copy never reaches the render.
  requestHeaders.delete(EDGE_SECTION_HEADER);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  );

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
  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  );

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
