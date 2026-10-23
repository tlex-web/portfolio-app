import { act, fireEvent, render, screen } from '@testing-library/react';
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
});
