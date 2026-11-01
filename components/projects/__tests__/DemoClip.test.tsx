/**
 * coin-flip's clip figure and its Demo branch (ENG-02; D-27; 11-UI-SPEC
 * "Demo — coin-flip: muted clip", E18; RESEARCH Pitfall 7).
 *
 * A client render sets `muted` as a property only, so the tests read the
 * property, never the attribute. The manifest is mocked so the branch rules
 * are covered independently of whether a clip has been encoded yet; the
 * fixtures follow the 11-07 and 11-09 types.
 */
import { render, screen } from '@testing-library/react';
import DemoClip from '../DemoClip';
import Demo from '../sections/Demo';
import { caseStudySections } from '../CaseStudy';
import type { MediaClipEntry } from '@/data/generated/media-manifest';
import type { Project } from '@/data/types';

const mockManifest: Partial<Record<'coin-flip-toss', MediaClipEntry>> = {};
jest.mock('@/data/generated/media-manifest', () => ({
  get mediaManifest() {
    return mockManifest;
  },
}));

type CoinFlip = Extract<Project, { slug: 'coin-flip' }>;

const MEDIA: MediaClipEntry = {
  src: '/media/coin-flip-toss.0123456789.mp4',
  type: 'video/mp4',
  width: 512,
  height: 1138,
  durationS: 8,
  bytes: 900_000,
  poster: { src: '/media/coin-flip-toss-poster.abcdef0123.webp', width: 512, height: 1138 },
};

const DESCRIPTION = 'A fixture description of one toss.';
const NAME = 'coin-flip: one coin toss, screen recording';
const FALLBACK = 'This browser cannot play the clip. The description says what it shows.';

const coinFlipBase: CoinFlip = {
  slug: 'coin-flip',
  name: 'coin-flip',
  kicker: { version: 'v1', status: 'on device' },
  repository: 'private',
};

const withClip = (clip: CoinFlip['clip']): CoinFlip => ({ ...coinFlipBase, clip });

function renderClip() {
  const { container } = render(<DemoClip description={DESCRIPTION} media={MEDIA} />);
  const video = container.querySelector('video');
  if (!video) throw new Error('no video element');
  return { container, video };
}

afterEach(() => {
  delete mockManifest['coin-flip-toss'];
});

describe('DemoClip (D-27)', () => {
  it('renders one muted video with controls, playsInline and preload none', () => {
    const { container, video } = renderClip();

    expect(container.querySelectorAll('video')).toHaveLength(1);
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('preload', 'none');
  });

  it('takes the poster and the reserved box from the manifest', () => {
    const { video } = renderClip();

    expect(video).toHaveAttribute('poster', MEDIA.poster.src);
    expect(video).toHaveAttribute('width', String(MEDIA.width));
    expect(video).toHaveAttribute('height', String(MEDIA.height));
  });

  it('never autoplays or loops and carries no track', () => {
    const { video } = renderClip();

    expect(video).not.toHaveAttribute('autoplay');
    expect(video.autoplay).toBe(false);
    expect(video).not.toHaveAttribute('loop');
    expect(video.loop).toBe(false);
    expect(video.querySelectorAll('track')).toHaveLength(0);
  });

  it('has one MP4 source from the manifest and the fallback paragraph', () => {
    const { video } = renderClip();

    const sources = video.querySelectorAll('source');
    expect(sources).toHaveLength(1);
    expect(sources[0]).toHaveAttribute('type', 'video/mp4');
    expect(sources[0]).toHaveAttribute('src', MEDIA.src);
    const fallback = video.querySelector('p');
    expect(fallback).toHaveTextContent(FALLBACK);
  });

  it('is named for the clip and described by the figcaption', () => {
    const { container, video } = renderClip();

    expect(video).toHaveAccessibleName(NAME);
    expect(video).toHaveAccessibleDescription(DESCRIPTION);
    const caption = container.querySelector('figure > figcaption');
    expect(caption).toHaveAttribute('id', video.getAttribute('aria-describedby'));
    expect(caption).toHaveTextContent(DESCRIPTION);
  });
});

describe('Demo, coin-flip branch (D-27, UI-SPEC E18)', () => {
  it('renders nothing while the manifest has no coin-flip-toss entry', () => {
    const { container } = render(
      <Demo project={withClip({ id: 'coin-flip-toss', description: DESCRIPTION })} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the clip exists but no description is approved', () => {
    mockManifest['coin-flip-toss'] = MEDIA;
    const { container } = render(<Demo project={coinFlipBase} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the Demo section, the intro and the clip with both', () => {
    mockManifest['coin-flip-toss'] = MEDIA;
    const project = withClip({
      id: 'coin-flip-toss',
      intro: 'A fixture intro.',
      description: DESCRIPTION,
    });
    const { container } = render(<Demo project={project} />);

    const region = screen.getByRole('region', { name: 'Demo' });
    expect(region).toHaveAttribute('id', 'demo');
    expect(screen.getByRole('heading', { level: 2, name: 'Demo' })).toHaveAttribute(
      'id',
      'demo-title'
    );
    expect(screen.getByText('A fixture intro.')).toBeInTheDocument();
    expect(container.querySelector('video source')).toHaveAttribute('src', MEDIA.src);
    expect(container.querySelector('figcaption')).toHaveTextContent(DESCRIPTION);
  });

  it('gives coin-flip a Demo index entry only with both the clip and a description', () => {
    const described = withClip({ id: 'coin-flip-toss', description: DESCRIPTION });
    const ids = (p: Project) => caseStudySections(p).map((s) => s.id);

    expect(ids(described)).not.toContain('demo');
    mockManifest['coin-flip-toss'] = MEDIA;
    expect(ids(coinFlipBase)).not.toContain('demo');
    expect(ids(described)).toContain('demo');
  });
});
