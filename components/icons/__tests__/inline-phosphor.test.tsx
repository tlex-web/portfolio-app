/**
 * Inline single-weight Phosphor icons for client components (18-18 post-plan
 * fix, Tim-approved 2026-11-25; 18-UI-SPEC icon-library row amendment).
 *
 * `@phosphor-icons/react/dist/ssr` icons carry all six weights' path data, so
 * every client chunk that imports one ships about 3 KB of paths it never draws.
 * The four icons the client ShareButton and EndCard use are inline copies of
 * the regular weight. This suite is their pixel-neutrality proof: each inline
 * icon must render the exact markup the Phosphor SSR icon renders for weight
 * "regular" with the same props, so the baselined region shots can't move.
 * Only this test imports the Phosphor originals.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { ComponentType, SVGProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  CheckIcon as PhosphorCheck,
  LinkIcon as PhosphorLink,
  MapTrifoldIcon as PhosphorMapTrifold,
  ShareNetworkIcon as PhosphorShareNetwork,
} from '@phosphor-icons/react/dist/ssr';
import { CheckIcon, LinkIcon, MapTrifoldIcon, ShareNetworkIcon } from '../inline-phosphor';

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };
type Icon = ComponentType<IconProps>;

const PAIRS: ReadonlyArray<[string, Icon, Icon]> = [
  ['LinkIcon', LinkIcon, PhosphorLink as Icon],
  ['CheckIcon', CheckIcon, PhosphorCheck as Icon],
  ['ShareNetworkIcon', ShareNetworkIcon, PhosphorShareNetwork as Icon],
  ['MapTrifoldIcon', MapTrifoldIcon, PhosphorMapTrifold as Icon],
];

/** The call sites' props first (size 20, aria-hidden), then the other shapes a caller may pass. */
const PROPS: ReadonlyArray<[string, IconProps]> = [
  ['call-site props (size 20, aria-hidden)', { size: 20, 'aria-hidden': 'true' }],
  ['no props (size 1em)', {}],
  ['size 16 with a className', { size: 16, className: 'shrink-0', 'aria-hidden': 'true' }],
  ['a string size and an inline style', { size: '24px', style: { flexShrink: 0 } }],
];

const markup = (Component: Icon, props: IconProps) =>
  renderToStaticMarkup(<Component {...props} />);

describe('inline Phosphor icons', () => {
  describe.each(PAIRS)('%s', (_name, Inline, Original) => {
    it.each(PROPS)('renders the Phosphor SSR markup for weight regular: %s', (_label, props) => {
      expect(markup(Inline, props)).toBe(
        markup(Original, { ...props, weight: 'regular' } as IconProps)
      );
    });

    it('draws one path, the regular weight only', () => {
      const html = markup(Inline, { size: 20 });
      expect(html.match(/<path /g)).toHaveLength(1);
      expect(html).toContain('viewBox="0 0 256 256"');
      expect(html).toContain('fill="currentColor"');
    });
  });

  it('the module and its client call sites never import the six-weight package', () => {
    const root = path.resolve(__dirname, '..', '..');
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');
    // An import or require of the package, not a mention in a comment.
    const PHOSPHOR = /(?:from|import|require\()\s*['"]@phosphor-icons\//;
    expect(read('icons/inline-phosphor.tsx')).not.toMatch(PHOSPHOR);
    for (const rel of ['photos/ShareButton.tsx', 'photos/EndCard.tsx']) {
      const src = read(rel);
      expect(src).not.toMatch(PHOSPHOR);
      expect(src).toMatch(/from '@\/components\/icons\/inline-phosphor'/);
    }
  });
});
