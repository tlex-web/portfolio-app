import { site } from '@/data/site';

/**
 * Home's first viewport copy (HOME-01; D-11; 09-UI-SPEC "Hero Block"). Server
 * component: complete HTML with no script, animation or WebGL, and it scrolls
 * away natively. The h1 and role come from data/site.ts, never copied into JSX.
 *
 * The block is at least one stage tall (min-h, so short viewports grow instead
 * of clipping); the copy sits bottom-left on phones and centred-left from md,
 * in a max-w-xl column on the 07 container.
 */
export default function HeroBlock() {
  return (
    <div data-ascent-block="hero" className="relative isolate min-h-[calc(100svh-var(--nav-h))]">
      <div className="mx-auto flex min-h-[calc(100svh-var(--nav-h))] w-full max-w-6xl flex-col justify-end px-4 py-12 sm:px-6 md:justify-center lg:px-8">
        <div className="max-w-xl">
          <h1 className="font-display text-hero font-semibold text-ink">{site.name}</h1>
          <p className="mt-4 text-base text-ink-muted">{site.role}</p>
        </div>
      </div>
    </div>
  );
}
