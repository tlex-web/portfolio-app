import type { ReactNode } from 'react';
import EdgeArt from '@/components/site/EdgeArt';

/**
 * The shared edge-page layout (EDGE-01, EDGE-02, D-09; 12-UI-SPEC "EdgeLayout
 * grid"): the 07 edge skeleton plus the contour art.
 *
 * Server component, zero JS and no hooks, so it can also render inside the
 * client ErrorBody and the static global-error chrome. DOM order is text, art,
 * extra at every width. Below 1024 px everything stacks in that order; from
 * 1024 px the text and extra share column 1 and the art takes the 28rem right
 * column across both rows. The art is aria-hidden and not focusable, so the
 * placement changes neither reading nor focus order, and `items-start` keeps
 * the art put when content arrives later in `extra` (the offline saved-pages
 * list).
 */
export default function EdgeLayout({ text, extra }: { text: ReactNode; extra?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-16">
      <div className="grid gap-y-12 lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-x-12 lg:items-start">
        <div className="max-w-prose">{text}</div>
        <div className="w-full lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:justify-self-end">
          <EdgeArt />
        </div>
        {extra ? <div className="lg:col-start-1">{extra}</div> : null}
      </div>
    </div>
  );
}
