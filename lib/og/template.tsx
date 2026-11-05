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
import { imageManifest } from '@/data/generated/image-manifest';
import { terrain } from '@/data/generated/terrain';
import { tokens } from '@/data/generated/tokens';
import { trailProfiles } from '@/data/generated/trail-profiles';
import { sheet } from '@/data/sheet';
import { site } from '@/data/site';
import type { Project } from '@/data/types';
import { lv95ToWgs84 } from '@/lib/geo';
import { formatLatLon } from '@/lib/home-format';
import { formatMetres } from '@/lib/photo-format';
import type { PhotoView } from '@/lib/photos/view-model';
import { markerForGrade } from '@/lib/trail-grade';
import { profilePath } from '@/lib/trail-profile';

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
function column(...children: (ReactElement | null)[]): ReactElement {
  return createElement(
    'div',
    { style: { display: 'flex', flexDirection: 'column' } },
    ...children.filter((child): child is ReactElement => child !== null)
  );
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

/** A printable line of card text: a non-blank string. Anything else is missing data. */
function present(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/** text() for data that may be missing: the line is left out, never filled (SEO-02 empty). */
function maybeText(
  face: Face,
  size: Size,
  tone: Tone,
  value: unknown,
  style: CSSProperties = {}
): ReactElement | null {
  return present(value) ? text(face, size, tone, value, style) : null;
}

/**
 * The contain fit of a photo in the 768 x 630 subject slot (D-14; UI-SPEC E12
 * overflow): scaled until one axis fills the slot, never cropped to 1.91:1, and
 * centred on night950 mats. A 3:2 photo (1200 x 800) is 768 x 512 with 59 px mats
 * above and below; the film scan (1200 x 818) is 768 x 524.
 *
 * @throws RangeError for a non-positive or non-finite size.
 */
export function ogPhotoFit(
  width: number,
  height: number
): { width: number; height: number; matX: number; matY: number } {
  if (!(width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height))) {
    throw new RangeError(`ogPhotoFit: invalid size ${width} x ${height}`);
  }
  const scale = Math.min(SLOT_W / width, OG_SIZE.height / height);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  return {
    width: w,
    height: h,
    matX: Math.floor((SLOT_W - w) / 2),
    matY: Math.floor((OG_SIZE.height - h) / 2),
  };
}

/** A photo's OG subject: the manifest's 1200 px JPEG as a data URL with its intrinsic size. */
export type OgPhoto = { src: string; width: number; height: number };

type ManifestJpeg = { jpeg?: { src: string; width: number; height: number } };

/**
 * Reads a photo's manifest JPEG derivative (1200 px, EXIF-free, never an original)
 * from public/ for the photo route (12-14).
 *
 * @throws RangeError for an id with no manifest JPEG.
 */
export async function ogPhotoImage(id: string): Promise<OgPhoto> {
  const jpeg = (imageManifest as Readonly<Record<string, ManifestJpeg | undefined>>)[id]?.jpeg;
  if (!jpeg) throw new RangeError(`og: photo ${id} has no manifest JPEG`);
  const bytes = await readFile(join(process.cwd(), 'public', jpeg.src));
  return {
    src: `data:image/jpeg;base64,${bytes.toString('base64')}`,
    width: jpeg.width,
    height: jpeg.height,
  };
}

/** The photo subject slot: the JPEG contain-fitted and centred on the night950 ground. */
function photoSlot(photo: OgPhoto): ReactElement {
  const fit = ogPhotoFit(photo.width, photo.height);
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: SLOT_W,
        height: OG_SIZE.height,
        backgroundColor: hex.night950,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori draws <img>, not next/image */}
      <img
        src={photo.src}
        alt=""
        width={fit.width}
        height={fit.height}
        style={{ position: 'absolute', left: fit.matX, top: fit.matY }}
      />
    </div>
  );
}

const PROFILE_BOX = { w: 336, h: 120, inset: 8 } as const;

/**
 * The RouteProfile paths as an inline 336 x 120 svg (D-15): the area to the
 * baseline in firn50 at the contour alpha, the 3 px line in mist300 and the 1 px
 * baseline in night700.
 */
function profileSvg(points: readonly { x: number; y: number }[]): ReactElement {
  const { line, area, baseline } = profilePath(points, PROFILE_BOX);
  return (
    <svg
      width={PROFILE_BOX.w}
      height={PROFILE_BOX.h}
      viewBox={`0 0 ${PROFILE_BOX.w} ${PROFILE_BOX.h}`}
    >
      <path d={area} fill={hex.firn50} fillOpacity={tokens.contourAlpha} />
      <path d={line} fill="none" stroke={hex.mist300} strokeWidth={3} strokeLinejoin="round" />
      <path d={baseline} fill="none" stroke={hex.night700} strokeWidth={1} />
    </svg>
  );
}

/**
 * The TrailGradeMark drawing at 2x (32 x 24, D-06): the yellow rhombus (T1), the
 * white-red-white (T2-T3) or white-blue-white (T4-T5) bars, or the dashed
 * unmarked box (T6), in the trail paints from tokens.
 */
function waymarkSvg(grade: string): ReactElement {
  const marker = markerForGrade(grade);
  const bars = (middle: string) => (
    <svg width={32} height={24} viewBox="0 0 32 24">
      <rect x={0} y={0} width={32} height={8} fill={hex.trailBlaze} />
      <rect x={0} y={8} width={32} height={8} fill={middle} />
      <rect x={0} y={16} width={32} height={8} fill={hex.trailBlaze} />
    </svg>
  );
  if (marker === 'white-red-white') return bars(hex.trailMountain);
  if (marker === 'white-blue-white') return bars(hex.trailAlpine);
  if (marker === 'yellow') {
    return (
      <svg width={32} height={24} viewBox="0 0 32 24">
        <polygon points="16,0 28,12 16,24 4,12" fill={hex.trailYellow} />
      </svg>
    );
  }
  return (
    <svg width={32} height={24} viewBox="0 0 32 24">
      <rect
        x={1}
        y={1}
        width={30}
        height={22}
        fill="none"
        stroke={hex.mist300}
        strokeWidth={2}
        strokeDasharray="4 3"
      />
    </svg>
  );
}

/**
 * The project plate's top group (D-15): the profile svg, the signpost caption
 * '{start} {h} → {end} {h}' (24 Mono; the two place-and-height units never break,
 * so the caption wraps only at the arrow) and the waymark with the grade. A
 * route with no committed profile prints none of the three (no placeholder line).
 */
function projectRoute(project: Project): ReactElement | null {
  const profile = trailProfiles.find((p) => p.id === project.route);
  if (!profile) return null;
  const { start, end, sacGrade } = profile;
  const ends =
    Number.isFinite(start.heightM) &&
    Number.isFinite(end.heightM) &&
    present(start.name) &&
    present(end.name);
  const unit = { whiteSpace: 'nowrap' } as const;
  return column(
    profileSvg(profile.points),
    ends ? (
      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 16, width: PROFILE_BOX.w }}>
        {text('mono', 'label', 'primary', `${start.name} ${formatMetres(start.heightM)}`, {
          ...unit,
          marginRight: TYPE.label.fontSize * 0.6, // one Mono space (0.6 em)
        })}
        {text('mono', 'label', 'primary', `→ ${end.name} ${formatMetres(end.heightM)}`, unit)}
      </div>
    ) : null,
    <div style={{ display: 'flex', alignItems: 'center', marginTop: 16 }}>
      {waymarkSvg(sacGrade)}
      {text('mono', 'label', 'primary', sacGrade, { marginLeft: 16 })}
    </div>
  );
}

export type OgFrameProps =
  | {
      variant: 'default';
      /** contourDataUrl(): the hero contour field as a data URL. */
      contour: string;
    }
  | {
      variant: 'photo';
      contour: string;
      view: PhotoView;
      /** ogPhotoImage(view.id): the manifest JPEG and its size. */
      photo: OgPhoto;
    }
  | {
      variant: 'project';
      contour: string;
      project: Project;
    };

/**
 * The card element tree for one variant (12-UI-SPEC "Variants"). A line whose
 * data is missing is left out, never filled (SEO-02 empty).
 *
 * - default (D-16): contour field with "Tim Lui" (72) over the role (32) at the
 *   bottom left; the plate names the summit (32), its height (24 Mono) and its
 *   coordinates (24 Mono, mist300), with the sheet title at the bottom.
 * - photo (D-14): the contain-fitted JPEG; the plate prints the title (32
 *   Schibsted), the place (24 Inter, mist300), the altitude label (24 Mono, with
 *   ' approx.' when approximate) and '© {year} Tim Lui' at the bottom.
 * - project (D-15): contour field with the kicker '{version} · {status}' (24
 *   Mono, mist300), the name (72) and the pitch (32 Inter, mist300, 640 px); the
 *   plate draws the trail profile, its caption and waymark, with 'Tim Lui' at
 *   the bottom.
 */
export function OgFrame(props: OgFrameProps): ReactElement {
  if (props.variant === 'photo') {
    const { view } = props;
    return frame(
      photoSlot(props.photo),
      plate(
        props.contour,
        column(
          maybeText('display', 'title', 'primary', view.title),
          maybeText('body', 'label', 'secondary', view.place, { marginTop: 16 }),
          maybeText('mono', 'label', 'primary', view.altitudeLabel, { marginTop: 8 })
        ),
        column(
          Number.isFinite(view.years)
            ? text('body', 'label', 'secondary', `© ${view.years} ${site.name}`)
            : null
        )
      )
    );
  }

  if (props.variant === 'project') {
    const { project } = props;
    const { version, status } = project.kicker;
    return frame(
      contourSlot(
        props.contour,
        column(
          present(version) && present(status)
            ? text('mono', 'label', 'secondary', `${version} · ${status}`)
            : null,
          maybeText('display', 'display', 'primary', project.name),
          maybeText('body', 'title', 'secondary', project.pitch, {
            marginTop: 16,
            maxWidth: SLOT_W - 2 * 64,
          })
        )
      ),
      plate(
        props.contour,
        column(projectRoute(project)),
        column(text('body', 'label', 'secondary', site.name))
      )
    );
  }

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
