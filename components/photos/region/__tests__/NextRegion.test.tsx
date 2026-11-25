/**
 * The next-region block (18-06; REGION-02, D-01, D-11; 18-UI-SPEC Contract 2
 * "Next-region block", UI E7). Expected text comes from lib/regions.ts: the
 * sign to the next region west to east (wrapping from the last to the first),
 * named '{heading}, next region', the next region's regionCardFacts line, then
 * 'All regions' to /photos. With no next region (a one-region registry) only
 * 'All regions' renders (UI E7/empty).
 */
import { render, screen, within } from '@testing-library/react';
import NextRegion, { NextRegionView } from '../NextRegion';
import { nextRegion, regionCardFacts, regionHeading, regionIds } from '@/lib/regions';

describe('NextRegion', () => {
  it.each(regionIds.map((id) => [id] as const))(
    '%s: a trail sign to the next region, its facts line, then All regions',
    (id) => {
      const next = nextRegion(id)!;
      const heading = regionHeading(next);
      const { container } = render(<NextRegion id={id} />);

      const section = container.querySelector('section#next-region') as HTMLElement;
      expect(section).not.toBeNull();
      expect(section).toHaveAttribute('aria-labelledby', 'next-region-title');
      const title = within(section).getByRole('heading', { level: 2, name: 'Next region' });
      expect(title).toHaveAttribute('id', 'next-region-title');

      const sign = within(section).getByRole('link', { name: `${heading}, next region` });
      expect(sign).toHaveAttribute('href', `/photos/regions/${next.id}`);
      expect(sign).toHaveTextContent(`${heading} Next region`);
      // P5 (18-01, Tim kept the default): the sign carries the trail-yellow tip.
      expect(sign.querySelector('.bg-trail')).not.toBeNull();

      const facts = regionCardFacts(next.id);
      const line = section.querySelector('[data-facts-line]');
      expect(line?.textContent).toBe([facts.count, facts.range, facts.years].join(' · '));

      const all = within(section).getByRole('link', { name: 'All regions' });
      expect(all).toHaveAttribute('href', '/photos');
      // Sign, facts, All regions, in document order.
      const links = within(section).getAllByRole('link');
      expect(links.map((l) => l.getAttribute('href'))).toEqual([
        `/photos/regions/${next.id}`,
        '/photos',
      ]);
    }
  );

  it('Saalfelden wraps to Zermatt (D-11)', () => {
    render(<NextRegion id="saalfelden" />);
    expect(screen.getByRole('link', { name: 'Zermatt, Switzerland, next region' })).toHaveAttribute(
      'href',
      '/photos/regions/zermatt'
    );
  });

  it('with no next region renders only All regions (UI E7/empty)', () => {
    const { container } = render(<NextRegionView next={undefined} />);
    const section = container.querySelector('section#next-region') as HTMLElement;
    expect(
      within(section)
        .getAllByRole('link')
        .map((l) => l.textContent)
    ).toEqual(['All regions']);
    expect(section.querySelector('[data-facts-line]')).toBeNull();
    expect(section.querySelector('.bg-trail')).toBeNull();
  });
});
