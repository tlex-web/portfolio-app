/**
 * @jest-environment node
 */

/**
 * proxy.ts: the CSP builder and the unknown-slug rewrite (D-17, VERIFY-01,
 * VERIFY-03, EDGE-01).
 *
 * D-17: `upgrade-insecure-requests` is dropped only for plain HTTP on a
 * loopback host, so local WebKit can load the production build over
 * http://localhost while every public request keeps it. The decision reads
 * the request URL only; a forged x-forwarded-proto cannot change it (T-12-04).
 * VERIFY-01: connect-src is exactly 'self' (the unused GitHub raw-content
 * origin is gone) and 'unsafe-eval' is a `next dev` allowance only (T-12-05).
 * NextResponse encodes a rewrite as x-middleware-rewrite and each forwarded
 * request header as x-middleware-request-<name>, listed in
 * x-middleware-override-headers; the rewrite tests read those (T-12-02).
 */

import { NextRequest } from 'next/server';
import { buildCsp, proxy } from '../../proxy';
import { photoSlugs } from '@/lib/photos/view-model';

const NONCE = 'bm9uY2U=';
const UPGRADE = 'upgrade-insecure-requests';

/** The directive starting with `name`, e.g. "connect-src 'self'". */
function directive(csp: string, name: string): string | undefined {
  return csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d === name || d.startsWith(`${name} `));
}

const run = (url: string, headers: Record<string, string> = {}) =>
  proxy(new NextRequest(url, { headers }));

/** Request headers the proxy forwards to the render (NextResponse's override encoding). */
function forwarded(response: Response): Map<string, string> {
  const names = (response.headers.get('x-middleware-override-headers') ?? '')
    .split(',')
    .filter(Boolean);
  return new Map(names.map((n) => [n, response.headers.get(`x-middleware-request-${n}`) ?? '']));
}

describe('buildCsp: D-17 loopback condition', () => {
  it.each(['http://localhost:3000/', 'http://127.0.0.1:3000/photos', 'http://[::1]:3000/'])(
    'omits upgrade-insecure-requests for plain HTTP on loopback (%s)',
    (url) => {
      expect(buildCsp(NONCE, new URL(url), false)).not.toContain(UPGRADE);
    }
  );

  it('keeps upgrade-insecure-requests for https on the production host', () => {
    expect(
      buildCsp(NONCE, new URL('https://portfolio-app-mocha-three.vercel.app/'), false)
    ).toContain(UPGRADE);
  });

  it('keeps upgrade-insecure-requests for http on a public host', () => {
    expect(buildCsp(NONCE, new URL('http://example.org/'), false)).toContain(UPGRADE);
  });

  it('keeps upgrade-insecure-requests for https on localhost', () => {
    expect(buildCsp(NONCE, new URL('https://localhost:3000/'), false)).toContain(UPGRADE);
  });

  it('does not treat a loopback-looking public hostname as loopback', () => {
    expect(buildCsp(NONCE, new URL('http://localhost.example.org/'), false)).toContain(UPGRADE);
  });
});

describe('buildCsp: script-src and origins', () => {
  const url = new URL('https://portfolio-app-mocha-three.vercel.app/');

  it("adds 'unsafe-eval' to script-src only in development", () => {
    expect(directive(buildCsp(NONCE, url, true), 'script-src')).toContain("'unsafe-eval'");
    expect(buildCsp(NONCE, url, false)).not.toContain("'unsafe-eval'");
  });

  it.each([true, false])(
    "keeps the nonce and 'strict-dynamic' in script-src (isDev %s)",
    (isDev) => {
      const scriptSrc = directive(buildCsp(NONCE, url, isDev), 'script-src');
      expect(scriptSrc).toContain(`'nonce-${NONCE}'`);
      expect(scriptSrc).toContain("'strict-dynamic'");
      expect(scriptSrc?.startsWith("script-src 'self' ")).toBe(true);
    }
  );

  it("allows connections to 'self' only", () => {
    expect(directive(buildCsp(NONCE, url, false), 'connect-src')).toBe("connect-src 'self'");
    expect(buildCsp(NONCE, url, true)).not.toContain('raw.githubusercontent');
  });

  it('keeps the locked directives and ends with a semicolon', () => {
    const csp = buildCsp(NONCE, url, false);
    for (const d of [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data:",
      "font-src 'self' data:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ]) {
      expect(csp).toContain(`${d};`);
    }
    expect(csp.endsWith(';')).toBe(true);
  });
});

describe('proxy(): CSP header', () => {
  it('a forged x-forwarded-proto: http on the production host keeps upgrade-insecure-requests', () => {
    const response = run('https://portfolio-app-mocha-three.vercel.app/', {
      'x-forwarded-proto': 'http',
    });
    expect(response.headers.get('Content-Security-Policy')).toContain(UPGRADE);
  });

  it('serves plain HTTP on localhost without upgrade-insecure-requests', () => {
    const response = run('http://localhost:3000/');
    expect(response.headers.get('Content-Security-Policy')).not.toContain(UPGRADE);
  });

  it("sends no 'unsafe-eval' outside next dev, and the same CSP and nonce to the render", () => {
    const response = run('https://portfolio-app-mocha-three.vercel.app/roadmap');
    const csp = response.headers.get('Content-Security-Policy') ?? '';
    const request = forwarded(response);

    expect(csp).not.toContain("'unsafe-eval'");
    expect(request.get('content-security-policy')).toBe(csp);
    expect(csp).toContain(`'nonce-${request.get('x-nonce')}'`);
  });
});

describe('proxy(): unknown-slug rewrite (EDGE-01)', () => {
  it('rewrites an unknown project slug to /__missing with x-edge-section=projects', () => {
    const response = run('https://portfolio-app-mocha-three.vercel.app/projects/no-such-slug');

    expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/__missing$/);
    expect(forwarded(response).get('x-edge-section')).toBe('projects');
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
  });

  it('rewrites an unknown photo slug with x-edge-section=photos', () => {
    const response = run('https://portfolio-app-mocha-three.vercel.app/photos/no-such-slug');

    expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/__missing$/);
    expect(forwarded(response).get('x-edge-section')).toBe('photos');
  });

  it('deletes a client-sent x-edge-section header before the render sees it', () => {
    const response = run('https://portfolio-app-mocha-three.vercel.app/roadmap', {
      'x-edge-section': 'photos',
    });

    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
    expect(forwarded(response).has('x-edge-section')).toBe(false);
    expect(response.headers.get('x-middleware-request-x-edge-section')).toBeNull();
  });

  it('replaces a client-sent x-edge-section on a miss with the proxy value', () => {
    const response = run('https://portfolio-app-mocha-three.vercel.app/projects/nope', {
      'x-edge-section': 'photos',
    });
    expect(forwarded(response).get('x-edge-section')).toBe('projects');
  });

  it.each([
    `/photos/${photoSlugs[0]}`,
    '/projects/box',
    '/photos/no-such-slug/opengraph-image',
    '/photos',
  ])('passes %s through without a rewrite', (path) => {
    const response = run(`https://portfolio-app-mocha-three.vercel.app${path}`);
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
