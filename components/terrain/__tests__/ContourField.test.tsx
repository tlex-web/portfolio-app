/**
 * ContourField(sheet, lod) (DATA-11, DATA-13): the caller passes the plate's
 * sheet, and for homePlate (data/generated/home-plate.ts) every mask URL is the
 * same string the v2.0 visual baselines were taken with (terrain.ts), at every LOD.
 */
import { render } from '@testing-library/react';
import ContourField, { type ContourLod } from '../ContourField';
import { homePlate } from '@/data/generated/home-plate';
import { terrain } from '@/data/generated/terrain';

const LODS = ['hero', 'map', 'strip'] as const satisfies readonly ContourLod<typeof homePlate>[];

describe('ContourField(sheet, lod)', () => {
  test.each(LODS)('draws the home sheet %s mask with the v2.0 URL string', (lod) => {
    const { container } = render(<ContourField sheet={homePlate} lod={lod} />);
    const field = container.firstElementChild as HTMLElement;

    expect(field.style.maskImage).toBe(`url(${terrain.assets.contours[lod]})`);
    expect(field).toHaveAttribute('aria-hidden', 'true');
    expect(field).toHaveClass('bg-contour');
  });

  it('types lod per sheet (an LOD the sheet does not ship is a compile error)', () => {
    // @ts-expect-error 'nope' is not one of the home sheet's contour LODs
    const bogus: ContourLod<typeof homePlate> = 'nope';
    expect(LODS).not.toContain(bogus);
  });

  it('keeps the caller class after bg-contour', () => {
    const { container } = render(<ContourField sheet={homePlate} lod="strip" className="absolute inset-0" />);
    expect((container.firstElementChild as HTMLElement).className).toBe('bg-contour absolute inset-0');
  });
});
