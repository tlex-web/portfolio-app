import Link from 'next/link';
import { home } from '@/data/home';

/**
 * About and contact, below the ascent (D-14; 09-UI-SPEC "About and Contact").
 * Server component.
 *
 * A plain prose section on the page surface: an h2, one body paragraph and the
 * contact line, in a max-w-prose column on the 07 container. The copy and both
 * link targets come from data/home.ts (targets looked up in site.nav); it is a
 * DRAFT pending Tim's approval at the 09-12 copy checkpoint, so nothing here
 * presents it as final. The links use the 07 prose-link style (accent,
 * underlined, accent-hover). No Motion components and no view-triggered
 * animation: the legacy Home's in-view entrance offsets were what overflowed at
 * 375 px.
 */
export default function AboutSection() {
  const { body, contact } = home.about;

  return (
    <section aria-labelledby="about-title" className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-prose">
          <h2 id="about-title" className="mb-4">
            About
          </h2>
          <p className="text-base text-ink-muted">{body}</p>
          <p className="mt-4 text-base text-ink-muted">
            {contact.lead}
            <Link href={contact.contactLink.href} className="prose-link">
              {contact.contactLink.label}
            </Link>
            {contact.middle}
            <Link href={contact.roadmapLink.href} className="prose-link">
              {contact.roadmapLink.label}
            </Link>
            {contact.end}
          </p>
        </div>
      </div>
    </section>
  );
}
