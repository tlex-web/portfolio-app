/**
 * The shared trail sign (18-06; 09 "Trail Signs", 11 "End block", 18-UI-SPEC
 * Contract 2 "Next-region block", P5). One props-only module: the case-study
 * EndBlock, the region page's next-region block and the viewer's end card
 * (18-16, 18-17) all render it, so it takes strings and an href and reads no
 * data (T-18-17). The accessible name is the explicit aria-label built from the
 * visible strings; the trail-yellow tip is decorative and drawn only with `tip`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import TrailSign, { PLATE, TIP_CLIP } from '../TrailSign';

const read = (...segments: string[]) =>
  fs.readFileSync(path.join(process.cwd(), ...segments), 'utf8');

describe('TrailSign', () => {
  it('is one link named by its aria-label, holding the title and the kicker', () => {
    render(
      <TrailSign
        href="/photos/regions/ortler"
        title="Ortler, Italy"
        kicker="Next region"
        ariaLabel="Ortler, Italy, next region"
        tip
      />
    );
    const link = screen.getByRole('link', { name: 'Ortler, Italy, next region' });
    expect(link).toHaveAttribute('href', '/photos/regions/ortler');
    expect(link).toHaveTextContent('Ortler, Italy Next region');
    expect(screen.getByText('Ortler, Italy')).toHaveClass('text-balance');
    expect(screen.getByText('Next region')).toHaveClass('whitespace-nowrap');
  });

  it('draws the decorative trail-yellow tip only when tip is set (P5)', () => {
    const { container, rerender } = render(
      <TrailSign href="/x" title="T" kicker="K" ariaLabel="T, k" tip />
    );
    const tip = container.querySelector('.bg-trail');
    expect(tip).not.toBeNull();
    expect(tip).toHaveAttribute('aria-hidden', 'true');
    expect((tip as HTMLElement).style.clipPath).toBe(TIP_CLIP.clipPath);

    rerender(<TrailSign href="/x" title="T" kicker="K" ariaLabel="T, k" tip={false} />);
    expect(container.querySelector('.bg-trail')).toBeNull();
  });

  it('defaults the outer link to the EndBlock sign box and takes a caller className', () => {
    const { rerender } = render(<TrailSign href="/x" title="T" kicker="K" ariaLabel="T, k" tip />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'class',
      'group flex min-h-14 w-full max-w-md items-stretch rounded-sm'
    );
    rerender(
      <TrailSign href="/x" title="T" kicker="K" ariaLabel="T, k" tip className="mt-6 flex" />
    );
    expect(screen.getByRole('link')).toHaveAttribute('class', 'mt-6 flex');
    expect(screen.getByText('T').parentElement).toHaveAttribute('class', PLATE);
  });
});

describe('props-only shared modules (T-18-17)', () => {
  it.each([['components/site/TrailSign.tsx'], ['components/photos/Breadcrumb.tsx']])(
    '%s imports no region registry, generated data or server-only model',
    (file) => {
      const imports = read(file).match(/^import\b[^;]*;/gm) ?? [];
      const banned = imports.filter((s) =>
        /from '(@\/lib\/regions|@\/data\/|@\/lib\/photos\/view-model|@\/data\/generated)/.test(s)
      );
      expect(banned).toEqual([]);
      expect(read(file)).not.toMatch(/regions\.json/);
    }
  );

  it('EndBlock renders the shared sign instead of its own plate and tip', () => {
    const code = read('components/projects/EndBlock.tsx')
      .split(/\r?\n/)
      .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line))
      .join('\n');
    expect(code).toMatch(/from '@\/components\/site\/TrailSign'/);
    expect(code).not.toContain('TIP_CLIP');
    expect(code).not.toContain('const PLATE');
  });
});
