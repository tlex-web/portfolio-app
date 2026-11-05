/**
 * The Map · Grid · Carousel switcher (PHOTO-02, D-14; 10-UI-SPEC "Header Band
 * (D-14)", View switcher table, Interaction States "View segment", Copywriting
 * "View switcher"). A toggle group named 'View' with three aria-pressed buttons
 * in VIEWS order; exactly one is pressed. Pressing another segment replaces the
 * URL (router.replace with scroll false, so no history entry and no scroll
 * jump); the URL is the only source of view state (locked). Pressing the
 * pressed segment does nothing.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import ViewSwitcher from '@/components/photos/ViewSwitcher';

const replace = jest.fn();
const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push, back: jest.fn() }),
}));

beforeEach(() => {
  replace.mockClear();
  push.mockClear();
});

function segments() {
  return within(screen.getByRole('group', { name: 'View' })).getAllByRole('button');
}

describe('ViewSwitcher (D-14)', () => {
  it("is a group named 'View' with Map, Grid and Carousel in that order", () => {
    render(<ViewSwitcher view="map" />);
    expect(segments().map((b) => b.textContent)).toEqual(['Map', 'Grid', 'Carousel']);
    for (const button of segments()) expect(button).toHaveAttribute('type', 'button');
  });

  it("with view 'grid' only Grid is pressed", () => {
    render(<ViewSwitcher view="grid" />);
    expect(segments().map((b) => b.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
    ]);
  });

  it('marks the pressed segment with the overlay, ink and the accent bar', () => {
    render(<ViewSwitcher view="grid" />);
    const [map, grid] = segments();
    expect(grid).toHaveClass('bg-surface-overlay', 'text-ink', 'after:bg-accent', 'after:h-0.5');
    expect(map).toHaveClass('text-ink-muted');
    expect(map).not.toHaveClass('after:bg-accent');
  });

  it('puts a 20 px aria-hidden icon before each label', () => {
    render(<ViewSwitcher view="map" />);
    for (const button of segments()) {
      const icon = button.querySelector('svg') as SVGElement;
      expect(icon).not.toBeNull();
      expect(button.firstElementChild).toBe(icon);
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('width', '20');
    }
  });

  it("pressing Carousel replaces the URL with '/photos?view=carousel' and scroll false", () => {
    render(<ViewSwitcher view="grid" />);
    fireEvent.click(screen.getByRole('button', { name: 'Carousel' }));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/photos?view=carousel', { scroll: false });
    expect(push).not.toHaveBeenCalled();
  });

  it("pressing Map replaces the URL with the bare '/photos'", () => {
    render(<ViewSwitcher view="carousel" />);
    fireEvent.click(screen.getByRole('button', { name: 'Map' }));
    expect(replace).toHaveBeenCalledWith('/photos', { scroll: false });
  });

  it('pressing the pressed segment does nothing', () => {
    render(<ViewSwitcher view="grid" />);
    fireEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
