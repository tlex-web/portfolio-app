import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import SiteNav from '../SiteNav';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

type ChangeListener = (event: { matches: boolean }) => void;
let mediaListeners: Map<string, Set<ChangeListener>>;
const originalMatchMedia = window.matchMedia;

/** Fire a `change` on every matchMedia list registered for `query`. */
function changeMedia(query: string, matches: boolean) {
  act(() => {
    for (const listener of mediaListeners.get(query) ?? []) listener({ matches });
  });
}

function renderNav() {
  const utils = render(
    <>
      <SiteNav />
      <button type="button">Outside</button>
    </>
  );
  return {
    ...utils,
    menuButton: () => screen.getByRole('button', { name: 'Menu' }),
    panel: () => document.getElementById('site-menu'),
    outside: () => screen.getByRole('button', { name: 'Outside' }),
  };
}

beforeEach(() => {
  mockUsePathname.mockReset();
  mockUsePathname.mockReturnValue('/');
  mediaListeners = new Map();
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: (type: string, listener: ChangeListener) => {
      if (type !== 'change') return;
      if (!mediaListeners.has(query)) mediaListeners.set(query, new Set());
      mediaListeners.get(query)!.add(listener);
    },
    removeEventListener: (type: string, listener: ChangeListener) => {
      mediaListeners.get(query)?.delete(listener);
    },
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe('SiteNav mobile menu (disclosure)', () => {
  it('starts closed: a "Menu" button with aria-expanded=false controlling a hidden #site-menu', () => {
    const { menuButton, panel } = renderNav();

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton()).toHaveAttribute('aria-controls', 'site-menu');
    expect(panel()).toBeInTheDocument();
    expect(panel()).not.toBeVisible();
  });

  it('opens on press, shows the panel inside the Primary nav and keeps focus on the button', async () => {
    const user = userEvent.setup();
    const { menuButton, panel } = renderNav();

    await user.click(menuButton());

    expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
    expect(panel()).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toContainElement(panel());
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(menuButton()).toHaveFocus();
  });

  it('closes on Escape and returns focus to the button', async () => {
    const user = userEvent.setup();
    const { menuButton, panel } = renderNav();

    await user.click(menuButton());
    await user.tab();
    expect(panel()).toContainElement(document.activeElement as HTMLElement);

    await user.keyboard('{Escape}');

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toBeVisible();
    expect(menuButton()).toHaveFocus();
  });

  it('closes when the route changes', async () => {
    const user = userEvent.setup();
    const { menuButton, panel, rerender } = renderNav();

    await user.click(menuButton());
    expect(panel()).toBeVisible();

    mockUsePathname.mockReturnValue('/photos');
    rerender(
      <>
        <SiteNav />
        <button type="button">Outside</button>
      </>
    );

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toBeVisible();
  });

  it('stays open when usePathname reports a step between photos', async () => {
    mockUsePathname.mockReturnValue('/photos/first');
    const user = userEvent.setup();
    const { menuButton, panel, rerender } = renderNav();

    await user.click(menuButton());
    mockUsePathname.mockReturnValue('/photos/second');
    rerender(
      <>
        <SiteNav />
        <button type="button">Outside</button>
      </>
    );

    expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
    expect(panel()).toBeVisible();
  });

  it('closes when the route goes from a photo to the gallery', async () => {
    mockUsePathname.mockReturnValue('/photos/first');
    const user = userEvent.setup();
    const { menuButton, panel, rerender } = renderNav();

    await user.click(menuButton());
    mockUsePathname.mockReturnValue('/photos');
    rerender(
      <>
        <SiteNav />
        <button type="button">Outside</button>
      </>
    );

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toBeVisible();
  });

  it('closes when focus leaves the header (Tab past the last menu link)', async () => {
    const user = userEvent.setup();
    const { menuButton, panel, outside } = renderNav();

    await user.click(menuButton());
    // Five menu links, then the first focusable element after the header.
    for (let i = 0; i < 6; i += 1) await user.tab();

    expect(outside()).toHaveFocus();
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toBeVisible();
  });

  it('closes on a pointerdown outside the header', async () => {
    const user = userEvent.setup();
    const { menuButton, panel } = renderNav();

    await user.click(menuButton());
    expect(panel()).toBeVisible();

    fireEvent.pointerDown(document.body);

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toBeVisible();
  });

  it('closes when the viewport reaches 768px', async () => {
    const user = userEvent.setup();
    const { menuButton, panel } = renderNav();

    await user.click(menuButton());
    expect(panel()).toBeVisible();

    changeMedia('(min-width: 768px)', true);

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toBeVisible();
  });

  it('closes on a second press', async () => {
    const user = userEvent.setup();
    const { menuButton, panel } = renderNav();

    await user.click(menuButton());
    expect(panel()).toBeVisible();

    await user.click(menuButton());

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toBeVisible();
    expect(menuButton()).toHaveFocus();
  });

  // Only the current-page link is clicked here: a click that is not prevented runs
  // Next's navigate, which needs the app router Jest does not mount, so the D-23
  // query-string case is proven in the browser (e2e/shell.spec.ts).
  it('closes on a plain tap on the current page link, prevents the navigation and focuses Menu (SHELL-07, D-16)', async () => {
    mockUsePathname.mockReturnValue('/roadmap');
    const user = userEvent.setup();
    const { menuButton, panel } = renderNav();

    await user.click(menuButton());
    const link = within(panel()!).getByRole('link', { name: 'Roadmap' });
    expect(panel()).toContainElement(link);

    const notPrevented = fireEvent.click(link);

    expect(notPrevented).toBe(false);
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toBeVisible();
    expect(menuButton()).toHaveFocus();
  });

  it('keeps the panel open on a Ctrl or Shift click of the current page link (SHELL-07)', async () => {
    mockUsePathname.mockReturnValue('/roadmap');
    const user = userEvent.setup();
    const { menuButton, panel } = renderNav();

    await user.click(menuButton());
    const link = () => within(panel()!).getByRole('link', { name: 'Roadmap' });

    // jsdom may log "Not implemented: navigation" for these unprevented clicks.
    fireEvent.click(link(), { ctrlKey: true });
    expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
    expect(panel()).toBeVisible();

    fireEvent.click(link(), { shiftKey: true });
    expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
    expect(panel()).toBeVisible();
  });
});

/**
 * jsdom has no layout: give the open panel a scrollport (top 64, 260 px tall, so
 * its client bottom is 324) and stack the rows 56 px apart from y 72 (48 px row +
 * gap-2). Rows 0-3 fit with the 8 px clearance; the last row (296-344) sits 28 px
 * past the bottom edge once the clearance is added.
 */
function layOutPanel(panel: HTMLElement) {
  const rect = (top: number, height: number) =>
    ({ top, bottom: top + height, left: 0, right: 375, width: 375, height, x: 0, y: top }) as DOMRect;
  panel.getBoundingClientRect = () => rect(64, 260);
  Object.defineProperty(panel, 'clientHeight', { configurable: true, value: 260 });
  within(panel)
    .getAllByRole('link')
    .forEach((row, i) => {
      row.getBoundingClientRect = () => rect(72 + 56 * i, 48);
    });
  panel.scrollTop = 0;
}

describe('SiteNav mobile menu: revealing the focused row (SHELL-08, D-17)', () => {
  it('scrolls a partly hidden row fully into the panel when the keyboard focuses it', async () => {
    const user = userEvent.setup();
    const { menuButton, panel } = renderNav();

    await user.click(menuButton());
    layOutPanel(panel()!);
    const last = within(panel()!).getByRole('link', { name: 'Contact' });

    // Tab from Menu through the five rows. jsdom matches :focus-visible on any
    // focused element, as a browser does after keyboard input.
    for (let i = 0; i < 5; i += 1) await user.tab();

    expect(last).toHaveFocus();
    expect(last.matches(':focus-visible')).toBe(true);
    expect(panel()!.scrollTop).toBe(28);
  });

  // 14-REVIEW WR-01: Firefox focuses a link on mousedown. Scrolling the panel
  // between mousedown and mouseup moves the row from under the pointer, so the
  // click misses it. A browser does not match :focus-visible after a pointer
  // press, and jsdom cannot tell the two apart, so the browser's answer is stubbed.
  it('leaves the panel where it is when a pointer press focuses a partly hidden row (WR-01)', async () => {
    const user = userEvent.setup();
    const { menuButton, panel } = renderNav();

    await user.click(menuButton());
    layOutPanel(panel()!);
    const last = within(panel()!).getByRole('link', { name: 'Contact' });

    const matches = Element.prototype.matches;
    const spy = jest
      .spyOn(Element.prototype, 'matches')
      .mockImplementation(function (this: Element, selector: string) {
        return selector === ':focus-visible' ? false : matches.call(this, selector);
      });
    try {
      // Press without release: the mousedown that focuses the link, before any click.
      await user.pointer({ keys: '[MouseLeft>]', target: last });

      expect(last).toHaveFocus();
      expect(panel()!.scrollTop).toBe(0);
      expect(spy).toHaveBeenCalledWith(':focus-visible');
    } finally {
      spy.mockRestore();
    }
  });
});
