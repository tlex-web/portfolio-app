/**
 * TrailGradeMark (D-06, D-24 vocabulary; 11-UI-SPEC "TrailGradeMark"): the
 * SAC waymark badge drawn beside a trail's real grade. The one class
 * assertion allowed in these tests is a waymark's paint utility, because the
 * paint is the contract here; everything else asserts text, roles and data
 * attributes.
 */
import { render, screen } from '@testing-library/react';
import { TRAIL_GRADES, markerForGrade } from '@/lib/trail-grade';
import TrailGradeMark from '../TrailGradeMark';

function glyphOf(container: HTMLElement): HTMLElement {
  const glyph = container.querySelector<HTMLElement>('[data-marker]');
  if (!glyph) throw new Error('no waymark glyph rendered');
  return glyph;
}

describe('TrailGradeMark', () => {
  it('draws T1 as the yellow diamond, followed by the grade and the waymark name', () => {
    const { container } = render(<TrailGradeMark grade="T1" />);

    const glyph = glyphOf(container);
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(glyph).toHaveAttribute('data-marker', 'yellow');
    expect(glyph).toHaveClass('bg-trail');
    expect(glyph.children).toHaveLength(0);

    const grade = screen.getByText('T1');
    expect(glyph.compareDocumentPosition(grade) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const name = screen.getByText(', yellow waymark');
    expect(name).toHaveClass('sr-only');
    expect(grade.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.textContent).toBe('T1, yellow waymark');
  });

  it('draws T4 as three bars, white-blue-white, with the accessible waymark name', () => {
    const { container } = render(<TrailGradeMark grade="T4" />);

    const glyph = glyphOf(container);
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(glyph).toHaveAttribute('data-marker', 'white-blue-white');
    const bars = Array.from(glyph.children);
    expect(bars).toHaveLength(3);
    expect(bars[0]).toHaveClass('bg-trail-blaze');
    expect(bars[1]).toHaveClass('bg-trail-alpine');
    expect(bars[2]).toHaveClass('bg-trail-blaze');
    expect(container.textContent).toBe('T4, white-blue-white waymark');
  });

  it('paints the middle bar of T2 with the mountain paint (white-red-white)', () => {
    const { container } = render(<TrailGradeMark grade="T2" />);

    const glyph = glyphOf(container);
    expect(glyph).toHaveAttribute('data-marker', 'white-red-white');
    const bars = Array.from(glyph.children);
    expect(bars).toHaveLength(3);
    expect(bars[0]).toHaveClass('bg-trail-blaze');
    expect(bars[1]).toHaveClass('bg-trail-mountain');
    expect(bars[2]).toHaveClass('bg-trail-blaze');
    expect(container.textContent).toBe('T2, white-red-white waymark');
  });

  it('draws T6 as a dashed, unpainted box', () => {
    const { container } = render(<TrailGradeMark grade="T6" />);

    const glyph = glyphOf(container);
    expect(glyph).toHaveAttribute('data-marker', 'unmarked');
    expect(glyph).toHaveClass('border-dashed');
    expect(glyph.children).toHaveLength(0);
    expect(glyph.className).not.toMatch(/\bbg-trail/);
    expect(container.textContent).toBe('T6, unmarked');
  });

  it.each(TRAIL_GRADES)(
    'keeps the %s glyph and its grade text together in one nowrap unit',
    (grade) => {
      const { container } = render(<TrailGradeMark grade={grade} />);

      const glyph = glyphOf(container);
      expect(glyph).toHaveAttribute('data-marker', markerForGrade(grade));
      const unit = glyph.parentElement as HTMLElement;
      expect(unit).toHaveClass('whitespace-nowrap');
      expect(unit).toContainElement(screen.getByText(grade));
      expect(unit.firstElementChild).toBe(glyph);
    }
  );

  it('throws for a grade outside T1 to T6', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TrailGradeMark grade="T7" />)).toThrow(RangeError);
    jest.restoreAllMocks();
  });
});
