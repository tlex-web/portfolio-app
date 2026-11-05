import type { MediaClipEntry } from '@/data/generated/media-manifest';

/**
 * coin-flip's clip figure (ENG-02; D-27; 11-UI-SPEC "Demo — coin-flip: muted
 * clip"; Next `02-guides/videos.md` "Dimensions", "Poster Image", "Fallback
 * Content", "Accessible Controls"). A Server Component: a native <video> with
 * no client JS and no next/dynamic.
 *
 * Click-to-play only: no autoplay and no loop, and with preload none no
 * video byte is fetched until the visitor presses play, so the poster is what
 * every visitor, crawler and visual test sees first (and reduced motion is
 * honoured by construction). width and height come from the encoded file, so
 * the box is reserved before anything loads. The clip is silent with no audio
 * track, so there is nothing to caption and no track element; the figcaption
 * is the text alternative (WCAG 1.2.1).
 *
 * `muted` is written bare so jsx-a11y/media-has-caption accepts the silent
 * clip. React's server render emits the attribute, a client render sets only
 * the property, so tests read `video.muted` (RESEARCH Pitfall 7). Playwright's
 * Chromium cannot play H.264, so e2e never presses play (Pitfall 8).
 */
export default function DemoClip({
  description,
  media,
}: {
  description: string;
  media: MediaClipEntry;
}) {
  return (
    <figure className="mt-6 grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)] md:items-start">
      <div className="w-full max-w-64 overflow-hidden rounded-lg border border-line bg-surface-raised">
        <video
          controls
          muted
          preload="none"
          playsInline
          poster={media.poster.src}
          width={media.width}
          height={media.height}
          aria-label="coin-flip: one coin toss, screen recording"
          aria-describedby="demo-clip-description"
          className="block h-auto w-full"
        >
          <source src={media.src} type="video/mp4" />
          <p>This browser cannot play the clip. The description says what it shows.</p>
        </video>
      </div>
      <figcaption id="demo-clip-description" className="max-w-prose text-base text-ink-muted">
        {description}
      </figcaption>
    </figure>
  );
}
