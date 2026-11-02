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
 * T-12-03: a missed document is answered with the 404 rendered under the
 * neutral slug, fetched by the proxy; fetch is mocked here (no network). The
 * fetch runs only on loopback and on the hostnames Vercel names in
 * VERCEL_URL, VERCEL_BRANCH_URL and VERCEL_PROJECT_PRODUCTION_URL; the tests
 * clear those variables and set them where needed.
 */

import { NextRequest } from 'next/server';
import { buildCsp, canFetchNeutral, NEUTRAL_SLUG, NEUTRAL_TIMEOUT_MS, proxy } from '../../proxy';
import { projects } from '@/data/projects';
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

/** A client-side navigation: the proxy keeps the plain rewrite for it. */
const NAVIGATION = { 'sec-fetch-dest': 'empty' };

/** The production host the tests use, and the Vercel variables that can allow a host. */
const PROD_HOST = 'portfolio-app-mocha-three.vercel.app';
const VERCEL_HOST_VARS = [
  'VERCEL_URL',
  'VERCEL_BRANCH_URL',
  'VERCEL_PROJECT_PRODUCTION_URL',
] as const;
const savedEnv = Object.fromEntries(VERCEL_HOST_VARS.map((name) => [name, process.env[name]]));

let fetchMock: jest.SpiedFunction<typeof fetch>;
beforeEach(() => {
  fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new Error('no network in unit tests'));
  for (const name of VERCEL_HOST_VARS) delete process.env[name];
});
afterEach(() => {
  fetchMock.mockRestore();
  for (const name of VERCEL_HOST_VARS) {
    if (savedEnv[name] === undefined) delete process.env[name];
    else process.env[name] = savedEnv[name];
  }
});

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
  it('a forged x-forwarded-proto: http on the production host keeps upgrade-insecure-requests', async () => {
    const response = await run('https://portfolio-app-mocha-three.vercel.app/', {
      'x-forwarded-proto': 'http',
    });
    expect(response.headers.get('Content-Security-Policy')).toContain(UPGRADE);
  });

  it('serves plain HTTP on localhost without upgrade-insecure-requests', async () => {
    const response = await run('http://localhost:3000/');
    expect(response.headers.get('Content-Security-Policy')).not.toContain(UPGRADE);
  });

  it("sends no 'unsafe-eval' outside next dev, and the same CSP and nonce to the render", async () => {
    const response = await run('https://portfolio-app-mocha-three.vercel.app/roadmap');
    const csp = response.headers.get('Content-Security-Policy') ?? '';
    const request = forwarded(response);

    expect(csp).not.toContain("'unsafe-eval'");
    expect(request.get('content-security-policy')).toBe(csp);
    expect(csp).toContain(`'nonce-${request.get('x-nonce')}'`);
  });
});

describe('proxy(): unknown-slug rewrite (EDGE-01)', () => {
  it('rewrites an unknown project slug to /__missing with x-edge-section=projects', async () => {
    const response = await run(
      'https://portfolio-app-mocha-three.vercel.app/projects/no-such-slug',
      NAVIGATION
    );

    expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/__missing$/);
    expect(forwarded(response).get('x-edge-section')).toBe('projects');
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rewrites an unknown photo slug with x-edge-section=photos', async () => {
    const response = await run(
      'https://portfolio-app-mocha-three.vercel.app/photos/no-such-slug',
      NAVIGATION
    );

    expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/__missing$/);
    expect(forwarded(response).get('x-edge-section')).toBe('photos');
  });

  it('rewrites the neutral slug itself without fetching, even for a document', async () => {
    const response = await run(
      `https://portfolio-app-mocha-three.vercel.app/photos/${NEUTRAL_SLUG}`,
      { 'sec-fetch-dest': 'document' }
    );

    expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/__missing$/);
    expect(forwarded(response).get('x-edge-section')).toBe('photos');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deletes a client-sent x-edge-section header before the render sees it', async () => {
    const response = await run('https://portfolio-app-mocha-three.vercel.app/roadmap', {
      'x-edge-section': 'photos',
    });

    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
    expect(forwarded(response).has('x-edge-section')).toBe(false);
    expect(response.headers.get('x-middleware-request-x-edge-section')).toBeNull();
  });

  it('replaces a client-sent x-edge-section on a miss with the proxy value', async () => {
    const response = await run('https://portfolio-app-mocha-three.vercel.app/projects/nope', {
      ...NAVIGATION,
      'x-edge-section': 'photos',
    });
    expect(forwarded(response).get('x-edge-section')).toBe('projects');
  });

  it.each([
    `/photos/${photoSlugs[0]}`,
    '/projects/box',
    '/photos/no-such-slug/opengraph-image',
    '/photos',
  ])('passes %s through without a rewrite', async (path) => {
    const response = await run(`https://portfolio-app-mocha-three.vercel.app${path}`);
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('proxy(): neutral 404 for a missed document (T-12-03)', () => {
  // The production host is a Vercel-named host in these tests.
  beforeEach(() => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = PROD_HOST;
  });

  const NEUTRAL_CSP = "default-src 'self'; script-src 'self' 'nonce-bmV1dHJhbA==';";
  const HTML = '<!DOCTYPE html><html><body><main><h1>Page not found</h1></main></body></html>';

  /** The neutral render's answer, as the inner proxy run and render would send it. */
  const neutralAnswer = (status = 404) =>
    new Response(HTML, {
      status,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-security-policy': NEUTRAL_CSP,
        'content-encoding': 'gzip',
        'x-middleware-rewrite': '/__missing',
        vary: 'rsc, next-router-state-tree',
      },
    });

  it('the neutral slug is no known slug in either section', () => {
    expect(photoSlugs).not.toContain(NEUTRAL_SLUG);
    expect(projects.map((p) => p.slug)).not.toContain(NEUTRAL_SLUG);
  });

  it.each([
    ['photos', {}],
    ['projects', { 'sec-fetch-dest': 'document' }],
  ] as const)(
    'serves the %s 404 rendered under the neutral slug (request headers %j)',
    async (section, extra) => {
      fetchMock.mockResolvedValue(neutralAnswer());
      const response = await run(
        `https://portfolio-app-mocha-three.vercel.app/${section}/nf-token?q=nf-token`,
        { ...extra, accept: 'text/html', cookie: 'a=b', 'x-edge-section': 'photos', 'x-other': '1' }
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toBe(
        `https://portfolio-app-mocha-three.vercel.app/${section}/${NEUTRAL_SLUG}`
      );
      const sent = new Headers(init?.headers);
      expect(sent.get('accept')).toBe('text/html');
      expect(sent.get('cookie')).toBe('a=b');
      expect(sent.has('x-edge-section')).toBe(false);
      expect(sent.has('x-other')).toBe(false);

      expect(response.status).toBe(404);
      expect(await response.text()).toBe(HTML);
      expect(response.headers.get('content-security-policy')).toBe(NEUTRAL_CSP);
      expect(response.headers.get('vary')).toBe('rsc, next-router-state-tree');
      expect(response.headers.get('content-encoding')).toBeNull();
      expect(response.headers.get('x-middleware-rewrite')).toBeNull();
      expect(response.headers.get('x-middleware-next')).toBeNull();
    }
  );

  it('falls back to the rewrite when the neutral fetch fails', async () => {
    const response = await run('https://portfolio-app-mocha-three.vercel.app/photos/nf-token');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/__missing$/);
    expect(forwarded(response).get('x-edge-section')).toBe('photos');
  });

  it.each([200, 401, 500])(
    'falls back to the rewrite when the neutral render answers %i',
    async (status) => {
      fetchMock.mockResolvedValue(neutralAnswer(status));
      const response = await run('https://portfolio-app-mocha-three.vercel.app/projects/nf-token');

      expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/__missing$/);
      expect(forwarded(response).get('x-edge-section')).toBe('projects');
    }
  );

  it(`falls back to the rewrite when the neutral render has not answered after ${NEUTRAL_TIMEOUT_MS} ms`, async () => {
    jest.useFakeTimers();
    try {
      // A render that never answers: the request settles only when its signal aborts.
      fetchMock.mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          })
      );
      const pending = run('https://portfolio-app-mocha-three.vercel.app/photos/nf-token');

      await jest.advanceTimersByTimeAsync(NEUTRAL_TIMEOUT_MS - 1);
      expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(false);
      await jest.advanceTimersByTimeAsync(1);
      const response = await pending;

      expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/__missing$/);
      expect(forwarded(response).get('x-edge-section')).toBe('photos');
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not abort the neutral body once its headers have arrived', async () => {
    jest.useFakeTimers();
    try {
      fetchMock.mockResolvedValue(neutralAnswer());
      const response = await run('https://portfolio-app-mocha-three.vercel.app/photos/nf-token');
      await jest.advanceTimersByTimeAsync(NEUTRAL_TIMEOUT_MS * 2);

      expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(false);
      expect(await response.text()).toBe(HTML);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('proxy(): the neutral fetch runs only on loopback and Vercel hosts (T-12-03)', () => {
  const miss = (host: string) => `https://${host}/photos/nf-token`;

  it('a forged host gets the plain rewrite and no fetch', async () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = PROD_HOST;
    const response = await run(miss('evil.example'));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.headers.get('x-middleware-rewrite')).toMatch(/\/__missing$/);
    expect(forwarded(response).get('x-edge-section')).toBe('photos');
  });

  it.each([`${PROD_HOST}.evil.example`, `evil-${PROD_HOST}`, 'vercel.app'])(
    'only an exact hostname matches (%s gets no fetch)',
    async (host) => {
      process.env.VERCEL_PROJECT_PRODUCTION_URL = PROD_HOST;
      await run(miss(host));
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it.each(VERCEL_HOST_VARS)('the hostname in %s self-fetches', async (name) => {
    process.env[name] = 'portfolio-app-git-branch-tlex.vercel.app';
    await run(miss('portfolio-app-git-branch-tlex.vercel.app'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `https://portfolio-app-git-branch-tlex.vercel.app/photos/${NEUTRAL_SLUG}`
    );
  });

  it.each([
    ['unset', undefined],
    ['empty', ''],
    ['blank', '   '],
  ])('%s variables allow no host', async (_label, value) => {
    for (const name of VERCEL_HOST_VARS) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    await run(miss(PROD_HOST));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(canFetchNeutral('')).toBe(false);
  });

  it('compares case-insensitively and tolerates a scheme or path in the variable', () => {
    process.env.VERCEL_URL = ' Portfolio-App-ABC.Vercel.App ';
    process.env.VERCEL_BRANCH_URL = 'https://portfolio-app-branch.vercel.app/';
    expect(canFetchNeutral('portfolio-app-abc.vercel.app')).toBe(true);
    expect(canFetchNeutral('PORTFOLIO-APP-BRANCH.VERCEL.APP')).toBe(true);
    expect(canFetchNeutral('portfolio-app-other.vercel.app')).toBe(false);
  });

  it.each(['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000'])(
    'loopback (%s) self-fetches with no Vercel variable set',
    async (origin) => {
      await run(`${origin}/projects/nf-token`);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(new URL(String(fetchMock.mock.calls[0][0])).pathname).toBe(
        `/projects/${NEUTRAL_SLUG}`
      );
    }
  );

  it('compares the host the fetch targets (request.url), not a Host header', async () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = PROD_HOST;
    await run(miss(PROD_HOST), { host: 'evil.example' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new URL(String(fetchMock.mock.calls[0][0])).hostname).toBe(PROD_HOST);
  });
});
