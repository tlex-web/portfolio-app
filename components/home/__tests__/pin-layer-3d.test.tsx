/**
 * The 3D pin layer (HOME-05; D-09; corrections C3 and C5; 09-UI-SPEC "Pins
 * (D-09)" and UI Considerations E7). One DOM layer over the canvas, the same
 * PinMark and SummitMark as the poster, positioned by the camera rig through
 * refs (no drei Html, no portal per pin). It shows only once the stage reads
 * '3d', and it asks AscentController to re-apply the lit pin as soon as its
 * pins mount, so a canvas revealed while the visitor is stationary already
 * lights the current stage's pin.
 */
import { createRef } from 'react';
import { render } from '@testing-library/react';
import PinLayer3D from '../terrain/PinLayer3D';
import type { PinAnchor } from '@/lib/ascent/route';

const syncPins = jest.fn();
jest.mock('@/components/home/AscentController', () => ({
  useAscent: () => ({ syncPins }),
}));

const pins: PinAnchor[] = [
  { k: 1, label: 'Zermatt · 1,617 m', approximate: false, u: 0.6772, v: 0.2742 },
  { k: 2, label: 'Gornerschlucht · 1,668 m', approximate: false, u: 0.657, v: 0.344 },
  { k: 3, label: 'Matterhorn Glacier Trail · 2,585 m', approximate: false, u: 0.459, v: 0.5195 },
  { k: 4, label: 'Riffelsee · 2,760 m approx.', approximate: true, u: 0.8256, v: 0.5899 },
];

function renderLayer() {
  const pinsRef = createRef<(HTMLDivElement | null)[]>() as { current: (HTMLDivElement | null)[] };
  pinsRef.current = [];
  const utils = render(<PinLayer3D pins={pins} pinsRef={pinsRef} />);
  return { ...utils, pinsRef };
}

beforeEach(() => syncPins.mockClear());

describe('PinLayer3D (D-09, C3)', () => {
  it('is one decorative layer that shows only when the stage reads 3d', () => {
    const { container } = renderLayer();
    const layer = container.querySelector('[data-pin-layer="3d"]') as HTMLElement;

    expect(layer).not.toBeNull();
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer).toHaveClass(
      'pointer-events-none',
      'absolute',
      'inset-0',
      'invisible',
      'group-data-[ascent-mode=3d]/stage:visible'
    );
  });

  it('renders one PinMark per waypoint with the poster labels, then the summit mark', () => {
    const { container } = renderLayer();
    const marks = Array.from(container.querySelectorAll<HTMLElement>('[data-pin]'));

    expect(marks.map((m) => m.dataset.pin)).toEqual(['1', '2', '3', '4']);
    expect(marks.map((m) => m.querySelector('[data-pin-label]')?.textContent)).toEqual(
      pins.map((p) => p.label)
    );
    expect(marks[3].querySelector('[data-pin-head]')).toHaveClass('border-dashed');
    expect(container.querySelectorAll('[data-summit-mark]')).toHaveLength(1);
    // Poster-only placement input: the camera rig places the 3D labels instead.
    marks.forEach((m) => expect(m).not.toHaveAttribute('data-u'));
    marks.forEach((m) => expect(m).not.toHaveAttribute('data-v'));
  });

  it('hands every mark to the camera rig through the refs array (pins, then the summit)', () => {
    const { container, pinsRef } = renderLayer();

    expect(pinsRef.current).toHaveLength(pins.length + 1);
    pinsRef.current.slice(0, pins.length).forEach((el, i) => {
      expect(el).toHaveAttribute('data-pin', String(pins[i].k));
    });
    expect(pinsRef.current[pins.length]).toBe(container.querySelector('[data-summit-mark]'));
  });

  it('starts every mark hidden at the stage origin until the rig places it', () => {
    const { pinsRef } = renderLayer();
    expect(pinsRef.current).toHaveLength(pins.length + 1);
    for (const el of pinsRef.current) {
      expect(el?.style.visibility).toBe('hidden');
      expect(el?.style.left).toBe('0px');
      expect(el?.style.top).toBe('0px');
    }
  });

  it('asks AscentController to re-apply the lit pin once its pins have mounted', () => {
    renderLayer();
    expect(syncPins).toHaveBeenCalledTimes(1);
  });
});
