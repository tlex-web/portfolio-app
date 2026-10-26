/**
 * The hotspot callouts (LBOX-05; D-09, D-10, D-11; 10-UI-SPEC "Hotspots"):
 * the strip key is a list named 'Labels' of aria-expanded rows, one hotspot
 * open at a time, with its description and sourced facts (external links in
 * a new tab with rel 'noopener noreferrer'); a photo without annotations
 * draws nothing; with labels hidden nothing is drawn on or around the photo
 * while the key stays; while zoomed the overlay is gone. jsdom applies no
 * media queries, so every tier's markup is present at once here; the tiers
 * themselves are covered by e2e/photos-lightbox.spec.ts 'Hotspots (LBOX-05)'.
 */
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { HotspotKey, HotspotMarks, HotspotOverlay } from '../Hotspots';
import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { editorial } from '@/data/photos/editorial';
import { buildPhotoViews, photoViews, type PhotoView } from '@/lib/photos/view-model';

const viewOf = (id: string, views: readonly PhotoView[] = photoViews) =>
  views.find((v) => v.id === id)!;

/** A photo whose editorial has no annotations, built through buildPhotoViews. */
const bare = viewOf(
  'img-0605',
  buildPhotoViews({
    photos,
    imageManifest,
    editorial: { ...editorial, 'img-0605': { ...editorial['img-0605'], annotations: [] } },
  })
);

/** Everything drawn on or around the photo (the key lives in the strip). */
const DRAWN =
  '[data-hotspot-marker], [data-hotspot-dot], [data-hotspot-leader], [data-hotspot-label]';

function Viewer({
  view,
  labelsOn = true,
  zoomed = false,
}: {
  view: PhotoView;
  labelsOn?: boolean;
  zoomed?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const onToggle = (id: string) => setExpandedId((open) => (open === id ? null : id));
  const props = { view, labelsOn, expandedId, onToggle };
  return (
    <>
      <div data-testid="box">
        <HotspotMarks {...props} zoomed={zoomed} />
      </div>
      <div data-testid="stage">
        <HotspotOverlay {...props} zoomed={zoomed} />
      </div>
      <div data-testid="strip">
        <HotspotKey {...props} />
      </div>
    </>
  );
}

describe('HotspotKey (D-11)', () => {
  const view = viewOf('img-0662');

  it("img-0662: a list named 'Labels' with two collapsed rows in reading order", () => {
    render(<Viewer view={view} />);
    const rows = within(screen.getByRole('list', { name: 'Labels' })).getAllByRole('button');
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(rows[0]).toHaveTextContent(/^1\s*Matterhorn summit · 4,478\sm$/);
    expect(rows[1]).toHaveTextContent(/^2\s*Matterhorn Glacier Trail · 2,585\sm$/);
  });

  it('activating a row expands its description and a Wikipedia link in a new tab', () => {
    render(<Viewer view={view} />);
    const key = screen.getByRole('list', { name: 'Labels' });
    const [first] = within(key).getAllByRole('button');
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(first.getAttribute('aria-controls')!)!;
    expect(panel).toBeVisible();
    expect(panel).toHaveTextContent('The top of the mountain, above the cloud on its flanks.');
    const link = within(panel).getByRole('link', { name: 'Wikipedia (opens in a new tab)' });
    expect(link).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Matterhorn');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('only one hotspot is expanded at a time; activating it again collapses it', () => {
    render(<Viewer view={view} />);
    const [first, second] = within(screen.getByRole('list', { name: 'Labels' })).getAllByRole(
      'button'
    );
    fireEvent.click(first);
    fireEvent.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(second.getAttribute('aria-controls')!)!;
    expect(panel).toHaveTextContent('Source: swissALTIRegio terrain model');
    fireEvent.click(second);
    expect(second).toHaveAttribute('aria-expanded', 'false');
  });

  it('an annotation without facts expands to its description only (E7 partial)', () => {
    render(<Viewer view={viewOf('r004-011')} />);
    const [summit] = within(screen.getByRole('list', { name: 'Labels' })).getAllByRole('button');
    fireEvent.click(summit);
    const panel = document.getElementById(summit.getAttribute('aria-controls')!)!;
    expect(panel).toHaveTextContent('The summit, mirrored upside down in the water below.');
    expect(within(panel).queryByRole('list')).toBeNull();
    expect(within(panel).queryByRole('link')).toBeNull();
  });
});

describe('HotspotOverlay and HotspotMarks (D-09, D-10)', () => {
  const view = viewOf('img-0662');

  it('draws a marker, a numbered dot and an aria-expanded gutter label per hotspot', () => {
    const { container } = render(<Viewer view={view} />);
    expect(container.querySelectorAll('[data-hotspot-marker]')).toHaveLength(2);
    const dots = container.querySelectorAll('[data-hotspot-dot]');
    expect([...dots].map((d) => d.textContent)).toEqual(['1', '2']);
    for (const dot of dots) {
      expect(dot).toHaveAttribute('aria-hidden', 'true');
      expect(dot).toHaveAttribute('tabindex', '-1');
    }
    const labels = within(screen.getByTestId('stage')).getAllByRole('button');
    expect(labels.map((l) => l.getAttribute('aria-expanded'))).toEqual(['false', 'false']);
    expect(labels[0]).toHaveAttribute('aria-controls');
  });

  it('a tap on a dot expands the matching key row', () => {
    const { container } = render(<Viewer view={view} />);
    fireEvent.click(container.querySelectorAll('[data-hotspot-dot]')[1]);
    const rows = within(screen.getByRole('list', { name: 'Labels' })).getAllByRole('button');
    expect(rows[1]).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelectorAll('[data-hotspot-dot]')[1]).toHaveAttribute(
      'data-expanded',
      ''
    );
  });

  it('with labels hidden nothing is drawn on or around the photo, and the key stays', () => {
    const { container } = render(<Viewer view={view} labelsOn={false} />);
    expect(container.querySelectorAll(DRAWN)).toHaveLength(0);
    expect(
      within(screen.getByRole('list', { name: 'Labels' })).getAllByRole('button')
    ).toHaveLength(2);
  });

  it('while zoomed nothing is drawn on or around the photo', () => {
    const { container } = render(<Viewer view={view} zoomed />);
    expect(container.querySelectorAll(DRAWN)).toHaveLength(0);
  });

  it('a photo without annotations renders no marker, dot, label or key (E7 empty)', () => {
    const { container } = render(<Viewer view={bare} />);
    expect(container.querySelectorAll(DRAWN)).toHaveLength(0);
    expect(screen.queryByRole('list', { name: 'Labels' })).toBeNull();
    for (const id of ['box', 'stage', 'strip'])
      expect(screen.getByTestId(id)).toBeEmptyDOMElement();
  });
});
