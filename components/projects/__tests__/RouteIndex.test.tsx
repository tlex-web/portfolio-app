/**
 * The case-study route index (ENG-02; 11-UI-SPEC "Route index", E5).
 * The island receives only `{ id, label }` pairs. The scroll-spy is driven
 * through a capturing IntersectionObserver: a test reports which sections
 * have crossed the line, the way the browser would, and reads the result
 * from `aria-current`. Assertions use roles, names, hrefs, order and
 * attributes, never colour classes.
 */
import { act, render, screen, within } from '@testing-library/react';
import RouteIndex from '../RouteIndex';

type Section = { id: string; label: string };

const THREE: Section[] = [
  { id: 'problem', label: 'Problem' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'safety', label: 'Safety' },
];

interface Record {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  observed: string[];
  disconnected: boolean;
}

let observers: Record[] = [];
const OriginalIO = window.IntersectionObserver;

class CapturingIntersectionObserver {
  record: Record;
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.record = { callback, options, observed: [], disconnected: false };
    observers.push(this.record);
  }
  observe(el: Element) {
    this.record.observed.push(el.id);
  }
  unobserve() {}
  disconnect() {
    this.record.disconnected = true;
  }
  takeRecords() {
    return [];
  }
}

/** The band the rootMargin leaves in a 900 px viewport: 80 px down to 40 %. */
const ROOT_BOUNDS = { top: 80, bottom: 360 };

/**
 * Report section positions to every live observer. `top` is the section's top
 * edge in the viewport; `isIntersecting` says whether it overlaps the band.
 */
function report(entries: { id: string; isIntersecting: boolean; top: number }[]) {
  const live = observers.filter((o) => !o.disconnected);
  act(() => {
    for (const o of live) {
      o.callback(
        entries.map(
          ({ id, isIntersecting, top }) =>
            ({
              target: document.getElementById(id) as Element,
              isIntersecting,
              boundingClientRect: { top } as DOMRectReadOnly,
              rootBounds: ROOT_BOUNDS as DOMRectReadOnly,
            }) as IntersectionObserverEntry
        ),
        {} as unknown as IntersectionObserver
      );
    }
  });
}

/** The index beside the page's sections, as the case-study page renders it. */
function renderPage(sections: Section[]) {
  return render(
    <>
      <RouteIndex sections={sections} />
      {sections.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`}>
          <h2 id={`${s.id}-title`}>{s.label}</h2>
        </section>
      ))}
    </>
  );
}

function nav() {
  return screen.getByRole('navigation', { name: 'Route stages' });
}

/** The wide-screen list: the one outside the narrow-screen disclosure. */
function stickyList(): HTMLElement {
  const list = within(nav())
    .getAllByRole('list')
    .find((l) => !l.closest('details'));
  if (!list) throw new Error('no sticky list');
  return list;
}

function currentNames(list: HTMLElement): string[] {
  return within(list)
    .getAllByRole('link')
    .filter((a) => a.getAttribute('aria-current') === 'location')
    .map((a) => a.textContent?.replace(/^\d\d/, '') ?? '');
}

beforeEach(() => {
  observers = [];
  window.IntersectionObserver =
    CapturingIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  window.IntersectionObserver = OriginalIO;
  window.history.replaceState(null, '', '/');
});

describe('RouteIndex', () => {
  it("renders one 'Route stages' nav whose list links to each section, numbered 01…03", () => {
    renderPage(THREE);

    expect(screen.getAllByRole('navigation', { name: 'Route stages' })).toHaveLength(1);
    const links = within(stickyList()).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#problem', '#pipeline', '#safety']);
    expect(links.map((a) => a.textContent?.replace(/^\d\d/, ''))).toEqual([
      'Problem',
      'Pipeline',
      'Safety',
    ]);
    // The number is visual only: the accessible name is the label alone.
    links.forEach((a, i) => expect(a).toHaveAccessibleName(THREE[i].label));
    expect(
      links.map((a) => a.querySelector('[aria-hidden="true"]')?.textContent)
    ).toEqual(['01', '02', '03']);
  });

  it('marks nothing current before the observer reports (no JS: links only)', () => {
    renderPage(THREE);

    expect(nav().querySelector('[aria-current]')).toBeNull();
  });

  it('renders nothing below two sections (G6)', () => {
    const { container } = render(<RouteIndex sections={[THREE[0]]} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('observes each section by id with the nav-offset rootMargin, and disconnects on unmount', () => {
    const { unmount } = renderPage(THREE);

    const live = observers.filter((o) => !o.disconnected);
    expect(live).toHaveLength(1);
    expect(live[0].observed).toEqual(['problem', 'pipeline', 'safety']);
    expect(live[0].options?.rootMargin).toBe('-80px 0px -60% 0px');
    unmount();
    expect(observers.every((o) => o.disconnected)).toBe(true);
  });

  it('marks the section at the top of the band current, and moves on as the next takes its place', () => {
    renderPage(THREE);

    report([
      { id: 'problem', isIntersecting: false, top: -400 },
      { id: 'pipeline', isIntersecting: true, top: 120 },
      { id: 'safety', isIntersecting: false, top: 700 },
    ]);
    expect(currentNames(stickyList())).toEqual(['Pipeline']);

    // Safety enters the band below Pipeline: Pipeline still leads.
    report([{ id: 'safety', isIntersecting: true, top: 300 }]);
    expect(currentNames(stickyList())).toEqual(['Pipeline']);

    // Pipeline leaves the band upwards: Safety leads.
    report([{ id: 'pipeline', isIntersecting: false, top: -200 }]);
    expect(currentNames(stickyList())).toEqual(['Safety']);

    // Scrolling back up: Pipeline returns to the band and leads again.
    report([{ id: 'pipeline', isIntersecting: true, top: 40 }]);
    expect(currentNames(stickyList())).toEqual(['Pipeline']);
  });

  it('keeps the last section above the band current while a gap sits in it', () => {
    renderPage(THREE);

    report([
      { id: 'problem', isIntersecting: false, top: -400 },
      { id: 'pipeline', isIntersecting: false, top: -100 },
      { id: 'safety', isIntersecting: false, top: 400 },
    ]);
    expect(currentNames(stickyList())).toEqual(['Pipeline']);
  });

  it('marks nothing current while every section is still below the band', () => {
    renderPage(THREE);

    report([
      { id: 'problem', isIntersecting: false, top: 500 },
      { id: 'pipeline', isIntersecting: false, top: 900 },
      { id: 'safety', isIntersecting: false, top: 1400 },
    ]);
    expect(nav().querySelector('[aria-current]')).toBeNull();
  });

  it('marks the hash section current when the page loads with one', () => {
    window.history.replaceState(null, '', '/#pipeline');
    renderPage(THREE);

    report([
      { id: 'problem', isIntersecting: false, top: -400 },
      { id: 'pipeline', isIntersecting: false, top: 80 },
      { id: 'safety', isIntersecting: false, top: 900 },
    ]);
    expect(currentNames(stickyList())).toEqual(['Pipeline']);
  });

  it('follows a later hash change to a section', () => {
    renderPage(THREE);

    act(() => {
      window.history.replaceState(null, '', '/#safety');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(currentNames(stickyList())).toEqual(['Safety']);
  });

  it('marks the last section current at the end of the page, and gives it back on leaving', () => {
    renderPage(THREE);
    report([
      { id: 'problem', isIntersecting: false, top: -400 },
      { id: 'pipeline', isIntersecting: true, top: 120 },
      { id: 'safety', isIntersecting: false, top: 500 },
    ]);
    expect(currentNames(stickyList())).toEqual(['Pipeline']);

    const scrollTo = (y: number) =>
      act(() => {
        Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
        window.dispatchEvent(new Event('scroll'));
      });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: window.innerHeight + 1000,
    });
    try {
      scrollTo(1000);
      expect(currentNames(stickyList())).toEqual(['Safety']);
      scrollTo(600);
      expect(currentNames(stickyList())).toEqual(['Pipeline']);
    } finally {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        configurable: true,
        value: 0,
      });
    }
  });

  it("holds a closed 'Route stages' disclosure with the same list for narrow screens", () => {
    renderPage(THREE);

    const details = nav().querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(details?.querySelector('summary')).toHaveTextContent(/^Route stages$/);
    const links = within(details as HTMLElement).getAllByRole('link', { hidden: true });
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#problem', '#pipeline', '#safety']);
  });
});
