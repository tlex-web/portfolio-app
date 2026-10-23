import { fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import GlobalError from '@/app/global-error';
import MotionProvider from '@/components/providers/MotionProvider';
import { site } from '@/data/site';

// SiteChrome's default variant mounts MotionProvider; global-error must not (PITFALLS 14).
jest.mock('@/components/providers/MotionProvider', () => ({
  __esModule: true,
  default: jest.fn(({ children }: { children: React.ReactNode }) => children),
}));

const mockMotionProvider = MotionProvider as unknown as jest.Mock;

const SECRET_MESSAGE = 'secret-stack-detail';
const SECRET_DIGEST = 'abc123';

function secretError() {
  return Object.assign(new Error(SECRET_MESSAGE), { digest: SECRET_DIGEST });
}

// DOMParser documents have no defaultView, so jest-dom element matchers do not apply to them;
// the parsed nodes are checked with plain DOM reads.
function renderMarkup() {
  const markup = renderToStaticMarkup(
    <GlobalError error={secretError()} retry={jest.fn()} reset={jest.fn()} />
  );
  return { markup, doc: new DOMParser().parseFromString(markup, 'text/html') };
}

describe('app/global-error (UI-SPEC E7 backstop)', () => {
  beforeEach(() => {
    mockMotionProvider.mockClear();
  });

  it('renders its own html.dark and body with the static chrome: one Primary nav of five plain links, one main, the h1', () => {
    const { markup, doc } = renderMarkup();

    expect(markup.startsWith('<html')).toBe(true);
    const html = doc.documentElement;
    expect(html.getAttribute('lang')).toBe('en');
    expect(html.classList.contains('dark')).toBe(true);
    expect(markup).toMatch(/<body[\s>]/);

    const navs = doc.querySelectorAll('nav');
    expect(navs).toHaveLength(1);
    const nav = navs[0];
    expect(nav.getAttribute('aria-label')).toBe('Primary');
    expect(nav.querySelectorAll('li')).toHaveLength(5);
    for (const { href } of site.nav) {
      expect(nav.querySelector(`li a[href="${href}"]`)).not.toBeNull();
    }
    expect(doc.querySelector('[aria-current]')).toBeNull();
    expect(nav.querySelector('button')).toBeNull();
    expect(doc.body.textContent).not.toMatch(/\bMenu\b/);

    const mains = doc.querySelectorAll('main');
    expect(mains).toHaveLength(1);
    expect(mains[0].getAttribute('id')).toBe('main-content');
    expect(mains[0].querySelector('h1')?.textContent).toBe('Something went wrong');
    expect(doc.body.textContent).toContain('The site failed to load. Try again, or reload the page.');
  });

  it('does not mount MotionProvider (no motion in the fallback)', () => {
    const { doc } = renderMarkup();
    // The chrome did render, so the absence of MotionProvider is meaningful.
    expect(doc.querySelector('nav[aria-label="Primary"]')).not.toBeNull();
    expect(mockMotionProvider).not.toHaveBeenCalled();
  });

  it('never renders the exception message or digest', () => {
    const { markup, doc } = renderMarkup();
    expect(doc.querySelector('h1')?.textContent).toBe('Something went wrong');
    expect(markup).not.toContain(SECRET_MESSAGE);
    expect(markup).not.toContain(SECRET_DIGEST);
  });

  it('calls retry (not reset) when Try again is pressed', () => {
    // Rendering <html> inside Testing Library's container div is invalid DOM nesting; React warns.
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const retry = jest.fn();
    const reset = jest.fn();
    render(<GlobalError error={secretError()} retry={retry} reset={reset} />);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
