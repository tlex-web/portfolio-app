/**
 * The case-study end block (ENG-02; 11-UI-SPEC "End block", E13; §I #6
 * default: Tim's "All defaults (Recommended)", 11-02 default.6).
 * The Next route sign points at the other project and the one primary link
 * asks for a walkthrough. Assertions use roles, names and hrefs, plus the
 * sign's height contract (min-h-14, no py-3; 12-UI-SPEC D-24), never colour.
 */
import { render, screen } from '@testing-library/react';
import EndBlock from '../EndBlock';
import { projects } from '@/data/projects';

function project(slug: string) {
  const found = projects.find((p) => p.slug === slug);
  if (!found) throw new Error(`no project ${slug}`);
  return found;
}

describe('EndBlock', () => {
  it("on box, the Next route sign is one link named 'coin-flip, next route' to /projects/coin-flip", () => {
    render(<EndBlock current={project('box')} />);

    const sign = screen.getAllByRole('link', { name: 'coin-flip, next route' });
    expect(sign).toHaveLength(1);
    expect(sign[0]).toHaveAttribute('href', '/projects/coin-flip');
  });

  it("on coin-flip, the sign is named 'box, next route' and goes to /projects/box", () => {
    render(<EndBlock current={project('coin-flip')} />);

    expect(screen.getByRole('link', { name: 'box, next route' })).toHaveAttribute(
      'href',
      '/projects/box'
    );
    expect(screen.queryByRole('link', { name: /^coin-flip/ })).not.toBeInTheDocument();
  });

  it("offers 'Ask for a walkthrough' to /contact (default.6)", () => {
    render(<EndBlock current={project('box')} />);

    expect(screen.getByRole('link', { name: 'Ask for a walkthrough' })).toHaveAttribute(
      'href',
      '/contact'
    );
  });

  it('has exactly two links and no heading', () => {
    render(<EndBlock current={project('coin-flip')} />);

    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('takes its height from min-h-14 (the 09 TrailSigns height), not from 12 px padding (12 D-24)', () => {
    render(<EndBlock current={project('box')} />);

    const sign = screen.getByRole('link', { name: 'coin-flip, next route' });
    expect(sign).toHaveClass('min-h-14', 'items-stretch');
    // The plate is the sign's first child; the banned 12 px vertical padding is gone.
    const plate = sign.firstElementChild as HTMLElement;
    expect(plate).toHaveTextContent('coin-flip Next route');
    expect(plate).not.toHaveClass('py-3');
  });
});
