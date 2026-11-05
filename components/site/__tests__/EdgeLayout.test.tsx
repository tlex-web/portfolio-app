/**
 * EDGE-01, D-09 (12-UI-SPEC "EdgeLayout grid", "EdgeArt"): the shared edge
 * layout used by the 404 (and, from 12-15, the error, global-error and offline
 * pages).
 *
 * DOM order is text, art, extra at every width, so the reading and focus order
 * never depends on the lg grid placement. The art is decorative: aria-hidden,
 * no focusable element, no text. Its overlay draws one dashed trail (8 6) and
 * one r 8 "you are here" dot over the contour field.
 */
import { render } from '@testing-library/react';
import EdgeLayout from '../EdgeLayout';
import EdgeArt from '../EdgeArt';

describe('EdgeLayout', () => {
  it('renders text, then art, then extra in DOM order', () => {
    const { container } = render(
      <EdgeLayout text={<p data-testid="text">Text</p>} extra={<p data-testid="extra">Extra</p>} />
    );

    const text = container.querySelector('[data-testid="text"]')!;
    const art = container.querySelector('svg')!;
    const extra = container.querySelector('[data-testid="extra"]')!;
    expect(text).not.toBeNull();
    expect(art).not.toBeNull();
    expect(extra).not.toBeNull();
    expect(text.compareDocumentPosition(art) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(art.compareDocumentPosition(extra) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('places the art in the right column spanning both rows from lg, with items-start', () => {
    const { container } = render(<EdgeLayout text={<p>Text</p>} />);

    const grid = container.querySelector('.grid')!;
    expect(grid.className).toContain('lg:grid-cols-[minmax(0,1fr)_28rem]');
    expect(grid.className).toContain('lg:items-start');
    const artSlot = grid.children[1];
    expect(artSlot.className).toContain('lg:col-start-2');
    expect(artSlot.className).toContain('lg:row-span-2');
    expect(artSlot.className).toContain('lg:row-start-1');
  });

  it('renders no extra slot content when extra is omitted', () => {
    const { container } = render(<EdgeLayout text={<p>Text</p>} />);

    const grid = container.querySelector('.grid')!;
    expect(grid.children[0].className).toContain('max-w-prose');
    expect(grid.textContent).toBe('Text');
  });

  it('hides the art wrapper from assistive technology and gives it nothing focusable', () => {
    const { container } = render(<EdgeLayout text={<p>Text</p>} />);

    const svg = container.querySelector('svg')!;
    const hidden = svg.closest('[aria-hidden="true"]');
    expect(hidden).not.toBeNull();
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(hidden!.querySelectorAll('a, button, [tabindex]')).toHaveLength(0);
    expect(hidden!.textContent).toBe('');
  });
});

describe('EdgeArt', () => {
  it('is an aspect-square sheet with a raised ground, so its size is fixed before the contours load', () => {
    const { container } = render(<EdgeArt />);

    const sheet = container.firstElementChild!;
    expect(sheet).toHaveAttribute('aria-hidden', 'true');
    for (const cls of ['relative', 'aspect-square', 'w-full', 'max-w-md', 'overflow-hidden', 'bg-surface-raised']) {
      expect(sheet).toHaveClass(cls);
    }
  });

  it('draws one dashed trail path (8 6) and one r 8 dot over the contour field', () => {
    const { container } = render(<EdgeArt />);

    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('viewBox', '0 0 512 512');
    const paths = svg.querySelectorAll('path');
    expect(paths).toHaveLength(1);
    expect(paths[0]).toHaveAttribute('stroke-dasharray', '8 6');
    expect(paths[0]).toHaveAttribute('fill', 'none');
    expect(paths[0].getAttribute('d')).toMatch(/^M/);
    expect(paths[0].getAttribute('class')).toContain('stroke-ink-muted');
    const circles = svg.querySelectorAll('circle');
    expect(circles).toHaveLength(1);
    expect(circles[0]).toHaveAttribute('r', '8');
    expect(circles[0].getAttribute('class')).toContain('fill-accent');
    expect(container.querySelector('.bg-contour')).not.toBeNull();
  });
});
