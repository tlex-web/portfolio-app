/**
 * ContourField(plate, lod) (DATA-11): the plate selects the sheet from
 * data/generated/plates.ts, and for plate matterhorn every mask URL is the same
 * string the v2.0 visual baselines were taken with (terrain.ts), at every LOD.
 */
import { render } from '@testing-library/react';
import ContourField, { type ContourLod } from '../ContourField';
import { terrain } from '@/data/generated/terrain';

const LODS = ['hero', 'map', 'strip'] as const satisfies readonly ContourLod<'matterhorn'>[];

describe('ContourField(plate, lod)', () => {
  test.each(LODS)('draws the matterhorn %s mask with the v2.0 URL string', (lod) => {
    const { container } = render(<ContourField plate="matterhorn" lod={lod} />);
    const field = container.firstElementChild as HTMLElement;

    expect(field.style.maskImage).toBe(`url(${terrain.assets.contours[lod]})`);
    expect(field).toHaveAttribute('aria-hidden', 'true');
    expect(field).toHaveClass('bg-contour');
  });

  it('types lod per plate (an LOD the plate does not ship is a compile error)', () => {
    // @ts-expect-error 'nope' is not one of matterhorn's contour LODs
    const bogus: ContourLod<'matterhorn'> = 'nope';
    expect(LODS).not.toContain(bogus);
  });

  it('keeps the caller class after bg-contour', () => {
    const { container } = render(<ContourField plate="matterhorn" lod="strip" className="absolute inset-0" />);
    expect((container.firstElementChild as HTMLElement).className).toBe('bg-contour absolute inset-0');
  });
});
