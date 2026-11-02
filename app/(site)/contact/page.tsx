import type { Metadata } from 'next';
import SummitRegister from '@/components/contact/SummitRegister';
import { pageMetadata } from '@/lib/metadata';

// SEO-01: own title, description (12-01 meta.contact) and canonical.
export const metadata: Metadata = pageMetadata({
  title: 'Contact',
  description:
    'Write to Tim Lui. Messages go straight to his inbox, and he usually replies within a few days.',
  path: '/contact',
});

/**
 * /contact, the summit register (CONTACT-01, CONTACT-02, CONTACT-03; D-02,
 * D-03, D-05; 12-UI-SPEC "/contact — Summit Register"). A Server Component on
 * the plain surface: no background animation, no canvas and no motion import.
 *
 * The header band carries the approved kicker, the h1 (the nav label, as on
 * Photographs, Engineering and Roadmap) and the intro. The content grid holds
 * the form card, whose heading, lead and required note are server-rendered
 * around the SummitRegister island, the only client code on the page. The grid
 * already reserves the second column for the Direct contact panel (12-16),
 * which follows the form in the DOM and moves first below 1024 px.
 */
export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="border-b border-line pt-8 pb-6">
        <p className="mb-2 text-sm font-semibold text-ink-muted">Summit register</p>
        <h1>Contact</h1>
        <p className="mt-4 max-w-prose text-base text-ink-muted">
          Write a line in the register. I read every entry and reply by email.
        </p>
      </div>

      <div className="mt-8 grid gap-8 pb-12 md:pb-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start lg:gap-x-12">
        <div className="min-w-0 rounded-lg border border-line bg-surface-raised p-6 lg:p-8">
          <h2 id="register-title" className="text-heading">
            Sign the register
          </h2>
          <p className="mt-2 max-w-prose text-base text-ink-muted">
            Your name, your email and a message.
          </p>
          <p className="mt-4 text-sm text-ink-muted">Fields marked * are required.</p>
          <SummitRegister />
        </div>
      </div>
    </div>
  );
}
