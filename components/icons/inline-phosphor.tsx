import type { SVGProps } from 'react';

/**
 * Single-weight copies of four Phosphor icons for client components (18-18
 * post-plan fix, Tim-approved 2026-11-25; 18-UI-SPEC icon-library row).
 *
 * `@phosphor-icons/react/dist/ssr` icons hold all six weights' path data, and a
 * client component ships all of it. ShareButton (region and photo chunks) and
 * EndCard (the viewer chunk) draw these four only at weight regular, so they
 * import these copies instead. Each renders the markup Phosphor's SSRBase
 * renders for weight "regular": the same attributes in the same order, the
 * caller's props after viewBox, and the regular `d` copied verbatim from
 * `@phosphor-icons/react` 2.1.10 (`dist/defs/*.es.js`).
 * components/icons/__tests__/inline-phosphor.test.tsx pins the markup against
 * the package, which keeps the baselined shots pixel-identical.
 *
 * Server components keep importing `@phosphor-icons/react/dist/ssr`: they ship
 * no icon JS. No hooks here and no 'use client', so either side can render
 * these.
 */
export type InlineIconProps = SVGProps<SVGSVGElement> & {
  /** Width and height, as Phosphor's `size` (default '1em'). */
  size?: number | string;
};

function icon(d: string) {
  function InlineIcon({ size = '1em', ...rest }: InlineIconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        fill="currentColor"
        viewBox="0 0 256 256"
        {...rest}
      >
        <path d={d} />
      </svg>
    );
  }
  return InlineIcon;
}

export const LinkIcon = icon(
  'M240,88.23a54.43,54.43,0,0,1-16,37L189.25,160a54.27,54.27,0,0,1-38.63,16h-.05A54.63,54.63,0,0,1,96,119.84a8,8,0,0,1,16,.45A38.62,38.62,0,0,0,150.58,160h0a38.39,38.39,0,0,0,27.31-11.31l34.75-34.75a38.63,38.63,0,0,0-54.63-54.63l-11,11A8,8,0,0,1,135.7,59l11-11A54.65,54.65,0,0,1,224,48,54.86,54.86,0,0,1,240,88.23ZM109,185.66l-11,11A38.41,38.41,0,0,1,70.6,208h0a38.63,38.63,0,0,1-27.29-65.94L78,107.31A38.63,38.63,0,0,1,144,135.71a8,8,0,0,0,16,.45A54.86,54.86,0,0,0,144,96a54.65,54.65,0,0,0-77.27,0L32,130.75A54.62,54.62,0,0,0,70.56,224h0a54.28,54.28,0,0,0,38.64-16l11-11A8,8,0,0,0,109,185.66Z'
);

export const CheckIcon = icon(
  'M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z'
);

export const ShareNetworkIcon = icon(
  'M176,160a39.89,39.89,0,0,0-28.62,12.09l-46.1-29.63a39.8,39.8,0,0,0,0-28.92l46.1-29.63a40,40,0,1,0-8.66-13.45l-46.1,29.63a40,40,0,1,0,0,55.82l46.1,29.63A40,40,0,1,0,176,160Zm0-128a24,24,0,1,1-24,24A24,24,0,0,1,176,32ZM64,152a24,24,0,1,1,24-24A24,24,0,0,1,64,152Zm112,72a24,24,0,1,1,24-24A24,24,0,0,1,176,224Z'
);

export const MapTrifoldIcon = icon(
  'M228.92,49.69a8,8,0,0,0-6.86-1.45L160.93,63.52,99.58,32.84a8,8,0,0,0-5.52-.6l-64,16A8,8,0,0,0,24,56V200a8,8,0,0,0,9.94,7.76l61.13-15.28,61.35,30.68A8.15,8.15,0,0,0,160,224a8,8,0,0,0,1.94-.24l64-16A8,8,0,0,0,232,200V56A8,8,0,0,0,228.92,49.69ZM104,52.94l48,24V203.06l-48-24ZM40,62.25l48-12v127.5l-48,12Zm176,131.5-48,12V78.25l48-12Z'
);
