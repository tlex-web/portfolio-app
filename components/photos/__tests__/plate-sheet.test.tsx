/**
 * The region plate (REGION-02; 18-09, 18-10; 18-UI-SPEC Contract 2 "Facts and
 * plate"), the successor of the v2.0 MapSheet tests (18-27, D-27): one row
 * here per row of the retired components/photos/__tests__/map.test.tsx, run
 * for every registry region. The server components are rendered from the real
 * registry the way the region page builds them (regionPlateSheet, sheetMargin,
 * the key rows from regionPhotoViews); nothing is mocked. The one synthetic
 * case flips only the approximate flag in the plain props (no position is
 * written, 16 D-25).
 *
 * The browser rows (geometry at every width, the list-plate sync, the jump to
 * the figure, no-JS) live in e2e/photos-region.spec.ts; these pin the server
 * markup contract.
 */
import { render, within } from '@testing-library/react';
import PlateKey, { type PlateKeyRow } from '@/components/photos/region/PlateKey';
import PlateSheet from '@/components/photos/region/PlateSheet';
import { plateCss, plateGroups } from '@/lib/photos/plate-layout';
import {
  type RegionPlateSheet,
  regionById,
  regionIds,
  regionPhotoViews,
  regionPlateSheet,
} from '@/lib/regions';
import { sheetMargin } from '@/lib/sheet-margin';

const NBSP = String.fromCharCode(0xa0);

const BADGE_APPROX = ['border-2', 'border-dashed', 'border-ink', 'bg-surface'];

/** The key rows as the region page builds them: each pin plus its photo's title and altitude label. */
function keyRowsOf(sheet: RegionPlateSheet): PlateKeyRow[] {
  const views = new Map(regionPhotoViews(sheet.id).map((v) => [v.slug, v]));
  return sheet.pins.map((pin) => {
    const view = views.get(pin.slug)!;
    return { ...pin, title: view.title, altitudeLabel: view.altitudeLabel };
  });
}

/** The plate and its key, as the region page renders them (PlateSheet, then PlateKey). */
function renderPlate(id: string, sheet: RegionPlateSheet = regionPlateSheet(id)) {
  const region = regionById(id)!;
  const utils = render(
    <>
      <PlateSheet sheet={sheet} margin={sheetMargin(region.plate)} />
      <PlateKey pins={keyRowsOf(sheet)} />
    </>
  );
  const figure = utils.container.querySelector('figure') as HTMLElement;
  const plate = utils.container.querySelector(`[data-plate-sheet="${id}"]`) as HTMLElement;
  const key = utils.getByRole('list', { name: 'Photographs on the map, lowest first' });
  const rows = within(key).getAllByRole('link');
  const badges = Array.from(plate.querySelectorAll<HTMLElement>('[data-plate-badge]'));
  return { ...utils, sheet, figure, plate, key, rows, badges };
}

describe.each(regionIds)('PlateSheet and PlateKey for %s (18-27; successor of map.test)', (id) => {
  // map.test 'renders a section named for the map with an ordered list of four links'
  it("renders the key as an ordered list 'Photographs on the map, lowest first' with one row per positioned photo", () => {
    const { sheet, key, rows } = renderPlate(id);
    expect(key.tagName).toBe('OL');
    expect(sheet.pins.length).toBeGreaterThan(0);
    expect(rows).toHaveLength(sheet.pins.length);
    expect(key.closest('section')?.querySelector('h2')?.textContent).toBe('Map');
  });

  // map.test 'links each waypoint to its photo in the canonical order'
  it('links each key row and each plate badge to its figure (#photo-{slug}), the rows in sequence order', () => {
    const { sheet, rows, badges } = renderPlate(id);
    const sequence = regionPhotoViews(id)
      .filter((v) => sheet.pins.some((p) => p.slug === v.slug))
      .map((v) => v.slug);
    expect(rows.map((a) => a.getAttribute('data-key-row'))).toEqual(sequence);
    rows.forEach((a, i) => expect(a).toHaveAttribute('href', `#photo-${sequence[i]}`));
    expect(badges.map((b) => b.getAttribute('data-plate-badge')).sort()).toEqual(
      [...sequence].sort()
    );
    for (const b of badges) {
      expect(b).toHaveAttribute('href', `#photo-${b.getAttribute('data-plate-badge')}`);
    }
  });

  // map.test "names each link '{title}, {altitude}', the film scan with 'approx.'"
  it("names each key row '{title} · {altitude}', an approximate photo's altitude ending in 'approx.'", () => {
    const { sheet, rows } = renderPlate(id);
    const views = new Map(regionPhotoViews(id).map((v) => [v.slug, v]));
    rows.forEach((a, i) => {
      const pin = sheet.pins[i];
      const view = views.get(pin.slug)!;
      expect(a).toHaveAccessibleName(`${view.title} · ${view.altitudeLabel}`);
      expect(view.altitudeLabel).toContain(NBSP);
      if (pin.approximate) expect(view.altitudeLabel).toMatch(/ approx\.$/);
      else expect(view.altitudeLabel).not.toMatch(/approx\./);
    });
  });

  // map.test 'shows the title and altitude on each plate'
  it("shows each photo's place in the sequence (1 = lowest) on its plate badge and its key badge", () => {
    const { sheet, rows, plate } = renderPlate(id);
    const views = regionPhotoViews(id);
    for (const pin of sheet.pins) {
      expect(pin.n).toBe(views.findIndex((v) => v.slug === pin.slug) + 1);
      const badge = plate.querySelector(`[data-plate-badge="${pin.slug}"]`)!;
      expect(badge.textContent).toBe(String(pin.n));
    }
    rows.forEach((a, i) => {
      expect(a.querySelector('[data-key-badge]')?.textContent).toBe(String(sheet.pins[i].n));
    });
  });

  // map.test 'puts the dot and the leader inside the link, the leader hidden from assistive tech'
  it('gives every pin group its dot, its aria-hidden leader and its badge unit, one group per dot', () => {
    const { sheet, plate } = renderPlate(id);
    const groups = plateGroups(sheet.pins);
    const pins = Array.from(plate.querySelectorAll<HTMLElement>('[data-plate-pin]'));
    expect(pins.map((p) => p.getAttribute('data-plate-pin'))).toEqual(groups.map((g) => g.key));
    pins.forEach((pin, i) => {
      expect(pin.querySelectorAll('[data-plate-dot]')).toHaveLength(1);
      expect(pin.querySelector('[data-plate-dot]')).toHaveAttribute('aria-hidden', 'true');
      const leader = pin.querySelector('[data-plate-leader]');
      expect(leader).toHaveAttribute('aria-hidden', 'true');
      const unit = pin.querySelector('[data-plate-unit]')!;
      expect(
        Array.from(unit.querySelectorAll('[data-plate-badge]')).map((b) =>
          b.getAttribute('data-plate-badge')
        )
      ).toEqual(groups[i].pins.map((p) => p.slug));
    });
  });

  // map.test 'draws the approximate dot hollow with a 2 px dashed ink border, the exact dots solid'
  it("draws an approximate photo's dot and badges hollow and dashed, an exact one's solid", () => {
    const { sheet, plate, rows } = renderPlate(id);
    for (const g of plateGroups(sheet.pins)) {
      const dot = plate.querySelector(`[data-plate-pin="${g.key}"] [data-plate-dot]`)!;
      if (g.approximate) expect(dot).toHaveClass(...BADGE_APPROX);
      else {
        expect(dot).toHaveClass('bg-ink');
        expect(dot).not.toHaveClass('border-dashed');
      }
    }
    sheet.pins.forEach((pin, i) => {
      const badge = plate.querySelector(`[data-plate-badge="${pin.slug}"]`)!;
      const keyBadge = rows[i].querySelector('[data-key-badge]')!;
      for (const b of [badge, keyBadge]) {
        if (pin.approximate) {
          expect(b).toHaveClass(...BADGE_APPROX);
          expect(b).toHaveAttribute('data-approximate', 'true');
        } else {
          expect(b).toHaveClass('bg-ink', 'text-ink-inverse');
          expect(b).not.toHaveClass('border-dashed');
          expect(b).not.toHaveAttribute('data-approximate');
        }
      }
    });
  });

  // map.test "draws a synthetic coarse photo's dot dashed and names it approx. (16 D-01)"
  it('follows a flipped approximate flag in the plain props: dot, plate badge and key badge (16 D-01)', () => {
    const real = regionPlateSheet(id);
    const flipped: RegionPlateSheet = {
      ...real,
      pins: real.pins.map((p) => ({ ...p, approximate: !p.approximate })),
    };
    const { plate, rows } = renderPlate(id, flipped);
    flipped.pins.forEach((pin, i) => {
      const badge = plate.querySelector(`[data-plate-badge="${pin.slug}"]`)!;
      const keyBadge = rows[i].querySelector('[data-key-badge]')!;
      for (const b of [badge, keyBadge]) {
        if (pin.approximate) expect(b).toHaveClass(...BADGE_APPROX);
        else expect(b).toHaveClass('bg-ink');
      }
    });
    for (const g of plateGroups(flipped.pins)) {
      const dot = plate.querySelector(`[data-plate-pin="${g.key}"] [data-plate-dot]`)!;
      expect(dot.classList.contains('border-dashed')).toBe(g.approximate);
    }
  });

  // map.test 'draws the summit as an aria-hidden plate that is not a link'
  it('keeps every plate badge pointer-only (tabindex -1, aria-hidden), so nothing inside the sheet is focusable', () => {
    const { plate, badges } = renderPlate(id);
    expect(badges.length).toBeGreaterThan(0);
    for (const b of badges) {
      expect(b.tagName).toBe('A');
      expect(b).toHaveAttribute('tabindex', '-1');
      expect(b).toHaveAttribute('aria-hidden', 'true');
    }
    const focusable = plate.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex], [contenteditable]'
    );
    for (const el of Array.from(focusable)) expect(el).toHaveAttribute('tabindex', '-1');
    expect(within(plate).queryAllByRole('link')).toHaveLength(0);
  });

  // map.test 'emits the label positions as a style element with container queries'
  it("emits plateCss(pins, 'plate-{id}') as the sheet's style element", () => {
    const { sheet, plate } = renderPlate(id);
    const styles = plate.querySelectorAll('style');
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toBe(plateCss(sheet.pins, `plate-${id}`));
    for (const pin of sheet.pins) {
      expect(styles[0].textContent).toContain(`[data-plate-badge="${pin.slug}"]`);
    }
  });

  // map.test 'names the sheet container and lays the relief and contours under the marks'
  it('names the inline-size sheet container plate-{id} and lays the lazy relief and the contours under the pins', () => {
    const { plate } = renderPlate(id);
    expect(plate).toHaveClass('relative', 'aspect-square', '[container-type:inline-size]');
    expect(plate.style.containerName).toBe(`plate-${id}`);
    const img = plate.querySelector('picture img') as HTMLImageElement;
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveClass('opacity-(--relief-opacity)');
    const kids = Array.from(plate.children);
    const picture = kids.findIndex((el) => el.tagName === 'PICTURE');
    const contours = kids.findIndex((el) => el.classList.contains('bg-contour'));
    const firstPin = kids.findIndex((el) => el.hasAttribute('data-plate-pin'));
    expect(picture).toBeGreaterThanOrEqual(0);
    expect(contours).toBeGreaterThan(picture);
    expect(firstPin).toBeGreaterThan(contours);
    expect(kids[contours]).toHaveAttribute('aria-hidden', 'true');
  });

  // map.test 'prints the margin line under the sheet'
  it("prints the plate's sheet margin as the figure's figcaption, after the sheet", () => {
    const { figure, plate } = renderPlate(id);
    const margin = sheetMargin(regionById(id)!.plate);
    const caption = figure.querySelector(':scope > figcaption[data-sheet-margin]') as HTMLElement;
    expect(caption).not.toBeNull();
    expect(plate.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(caption.querySelector('p')?.textContent).toBe(
      `${margin.title} · contours every ${margin.interval}`
    );
    expect(caption.textContent).toContain(margin.lastSurveyed);
  });
});
