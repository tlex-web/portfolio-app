/**
 * The one shared Open Graph template (SEO-02; D-14, D-15, D-16; 12-UI-SPEC
 * "Open Graph Template").
 *
 * Every card is a 1200 x 630 frame: a 768 px subject slot on the night950 ground
 * and a 432 px plate (night900, a 1 px night700 left border, the contour field
 * behind it, 48 px padding, a top group and a bottom line). Type runs on three
 * sizes, 24 / 32 / 72 canvas px with line heights 32 / 40 / 76, in two weights,
 * coloured firn50 (primary) or mist300 (secondary).
 *
 * Renderer rules (next/og ImageResponse, i.e. Satori + Resvg; installed docs
 * 04-functions/image-response.md):
 * - flexbox only, and every element with more than one child sets
 *   `display: 'flex'`;
 * - fonts are the committed static TTFs in lib/og/fonts (README records their
 *   sources and SHA-256), read from disk: nothing is fetched from a third-party
 *   origin at build or request time;
 * - every colour is a hex from data/generated/tokens.ts (no hex literal here).
 *
 * OgFrame returns a plain element tree built from host elements only (helpers
 * are called as functions, never mounted as components), so a Jest test can walk
 * `props.children` and read every string the card will draw.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createElement, type CSSProperties, type ReactElement } from 'react';
import { terrain } from '@/data/generated/terrain';
import { tokens } from '@/data/generated/tokens';
import { sheet } from '@/data/sheet';
import { site } from '@/data/site';
import { lv95ToWgs84 } from '@/lib/geo';
import { formatLatLon } from '@/lib/home-format';
import { formatMetres } from '@/lib/photo-format';

/** The card size every OG route exports and renders at. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

const SLOT_W = 768;
const PLATE_W = OG_SIZE.width - SLOT_W; // 432
const PLATE_PAD = 48;
const BORDER = 1;
/** The square hero contour SVG drawn to cover the canvas, centred vertically. */
const CONTOUR_SIDE = OG_SIZE.width;
const CONTOUR_TOP = -(CONTOUR_SIDE - OG_SIZE.height) / 2; // -285

const { hex } = tokens;

const FONT = {
  display: 'Schibsted Grotesk',
  body: 'Inter',
  mono: 'JetBrains Mono',
} as const;

/** The three type sizes (canvas px) with their line heights. */
const TYPE = {
  label: { fontSize: 24, lineHeight: '32px' },
  title: { fontSize: 32, lineHeight: '40px' },
  display: { fontSize: 72, lineHeight: '76px' },
} as const;

type Face = keyof typeof FONT;
type Size = keyof typeof TYPE;
type Tone = 'primary' | 'secondary';

/** One line (or wrapping block) of card text. */
function text(
  face: Face,
  size: Size,
  tone: Tone,
  value: string,
  style: CSSProperties = {}
): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        fontFamily: FONT[face],
        fontWeight: face === 'display' ? 600 : 400,
        ...TYPE[size],
        color: tone === 'primary' ? hex.firn50 : hex.mist300,
        ...style,
      }}
    >
      {value}
    </div>
  );
}

/**
 * A vertical stack. Satori lays a fragment out as a row, so stacks are always
 * real flex-column elements; the children go in as separate arguments (not an
 * array) so they need no keys.
 */
function column(...children: ReactElement[]): ReactElement {
  return createElement('div', { style: { display: 'flex', flexDirection: 'column' } }, ...children);
}

/**
 * The contour field: the hero SVG at canvas coordinates, offset by the box it is
 * clipped into so the lines run on unbroken from the subject slot into the plate.
 */
function contourLayer(contour: string, offsetX: number): ReactElement {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Satori draws <img>, not next/image
    <img
      src={contour}
      alt=""
      width={CONTOUR_SIDE}
      height={CONTOUR_SIDE}
      style={{ position: 'absolute', left: -offsetX, top: CONTOUR_TOP }}
    />
  );
}

/**
 * The 432 x 630 plate: night900, a 1 px night700 left border, the contour field
 * behind the content, and a 336 x 534 content box (48 px padding; the left one is
 * 47 px so the border keeps the box at 336) split into a top group and a bottom line.
 */
function plate(contour: string, top: ReactElement, bottom: ReactElement): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: PLATE_W,
        height: OG_SIZE.height,
        overflow: 'hidden',
        backgroundColor: hex.night900,
        borderLeft: `${BORDER}px solid ${hex.night700}`,
        padding: PLATE_PAD,
        paddingLeft: PLATE_PAD - BORDER,
      }}
    >
      {contourLayer(contour, SLOT_W + BORDER)}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: PLATE_W - BORDER - (PLATE_PAD - BORDER) - PLATE_PAD,
          height: OG_SIZE.height - 2 * PLATE_PAD,
        }}
      >
        {top}
        {bottom}
      </div>
    </div>
  );
}

/** The 768 x 630 subject slot over the contour field, its text block bottom-left at 64 px. */
function contourSlot(contour: string, block: ReactElement): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: SLOT_W,
        height: OG_SIZE.height,
        overflow: 'hidden',
        padding: 64,
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {contourLayer(contour, 0)}
      {block}
    </div>
  );
}

/** The ground: night950 behind the slot and the plate. */
function frame(slot: ReactElement, side: ReactElement): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        backgroundColor: hex.night950,
      }}
    >
      {slot}
      {side}
    </div>
  );
}

/**
 * What the default card prints (D-16), every value derived: the name and role
 * from data/site.ts, the summit name, official height and coordinates from
 * terrain.summit through formatMetres and formatLatLon (09 D-11, never typed),
 * and the sheet title from data/sheet.ts.
 */
export function defaultCardText() {
  const { summit } = terrain;
  return {
    name: site.name,
    role: site.role,
    summit: summit.name,
    altitude: formatMetres(summit.officialM),
    coordinates: formatLatLon(lv95ToWgs84(summit.lv95)),
    sheetTitle: sheet.title,
  };
}

export type OgFrameProps = {
  variant: 'default';
  /** contourDataUrl(): the hero contour field as a data URL. */
  contour: string;
};

/**
 * The card element tree for one variant (12-UI-SPEC "Variants").
 *
 * - default (D-16): contour field with "Tim Lui" (72) over the role (32) at the
 *   bottom left; the plate names the summit (32), its height (24 Mono) and its
 *   coordinates (24 Mono, mist300), with the sheet title at the bottom.
 */
export function OgFrame(props: OgFrameProps): ReactElement {
  const card = defaultCardText();
  return frame(
    contourSlot(
      props.contour,
      column(
        text('display', 'display', 'primary', card.name),
        text('body', 'title', 'secondary', card.role, { marginTop: 8 })
      )
    ),
    plate(
      props.contour,
      column(
        text('display', 'title', 'primary', card.summit),
        text('mono', 'label', 'primary', card.altitude, { marginTop: 8 }),
        text('mono', 'label', 'secondary', card.coordinates, { marginTop: 8 })
      ),
      column(text('body', 'label', 'secondary', card.sheetTitle))
    )
  );
}

const FONT_FILES = [
  { name: FONT.display, file: 'SchibstedGrotesk-SemiBold.ttf', weight: 600 },
  { name: FONT.body, file: 'Inter-Regular.ttf', weight: 400 },
  { name: FONT.mono, file: 'JetBrainsMono-Regular.ttf', weight: 400 },
] as const;

/** The ImageResponse font list, read once from the committed TTFs (same origin, no fetch). */
export async function ogFonts() {
  return Promise.all(
    FONT_FILES.map(async ({ name, file, weight }) => ({
      name,
      data: await readFile(join(process.cwd(), 'lib/og/fonts', file)),
      weight,
      style: 'normal' as const,
    }))
  );
}

/**
 * The hero contour SVG named in `terrain.assets.contours.hero`, read from public/,
 * its group stroke swapped for firn50 and the group wrapped at the index-line alpha
 * (0.14; the minor lines keep their own stroke-opacity 0.6, so they land at 0.084,
 * the 09 shader convention), returned as a base64 `data:image/svg+xml` URL.
 * Throws when the SVG no longer has the one stroked group this expects.
 */
export async function contourDataUrl(): Promise<string> {
  const svg = await readFile(join(process.cwd(), 'public', terrain.assets.contours.hero), 'utf8');
  const group = /<g\b([^>]*?)\sstroke="[^"]*"/;
  if (!group.test(svg)) throw new Error('og: the hero contour SVG has no stroked <g>');
  const tinted = svg.replace(
    group,
    (_, attrs: string) => `<g${attrs} stroke="${hex.firn50}" opacity="${tokens.contourAlpha}"`
  );
  return `data:image/svg+xml;base64,${Buffer.from(tinted, 'utf8').toString('base64')}`;
}
