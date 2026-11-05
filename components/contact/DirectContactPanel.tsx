import { EnvelopeSimpleIcon, GithubLogoIcon, LinkedinLogoIcon } from '@phosphor-icons/react/dist/ssr';
import CopyEmailButton from '@/components/contact/CopyEmailButton';
import { formatLatLon } from '@/lib/home-format';

/** The 07 footer link style with its 20 px marks. */
const LINK =
  'min-h-11 inline-flex items-center gap-2 text-ink-muted hover:text-ink transition-colors duration-(--duration-fast) ease-erosion';

/** The 11 text-link style for the mailto link. */
const TEXT_LINK =
  'min-h-11 inline-flex items-center gap-2 text-base text-ink-muted underline decoration-1 underline-offset-4 hover:text-ink transition-colors duration-(--duration-fast) ease-erosion';

const DT = 'text-sm text-ink-muted';

/** The id of the address paragraph, which Copy selects when the clipboard fails. */
const EMAIL_ID = 'contact-email';

interface DirectContactPanelProps {
  email: string;
  /** Tim's confirmed location; without it the Location row is left out. */
  location?: { name: string; lat: number; lon: number; source: string };
  links: { github: string; linkedin: string };
}

/**
 * The Direct contact panel on /contact (CONTACT-01; D-01, D-05, D-06, D-08;
 * 12-UI-SPEC "Direct contact panel"). A Server Component, so its final content,
 * the Copy button included, is in the first paint. It is a <section
 * aria-labelledby>, not an <aside>, so axe's landmark-complementary-is-top-level
 * cannot fire inside <main>.
 *
 * Email: the address as selectable mono text with a break chance after '@'
 * (a <wbr>, which adds no character, so a selection still copies the plain
 * address), then Copy (the client island) and a mailto link. Location: the
 * confirmed coordinates at 2 decimals, never finer (D-01), and the place name.
 * Replies: the reply time (D-08). Elsewhere: GitHub and LinkedIn, same tab.
 */
export default function DirectContactPanel({ email, location, links }: DirectContactPanelProps) {
  const at = email.lastIndexOf('@');
  const user = email.slice(0, at);
  const domain = email.slice(at + 1);

  const elsewhere = [
    { label: 'GitHub', href: links.github, Icon: GithubLogoIcon },
    { label: 'LinkedIn', href: links.linkedin, Icon: LinkedinLogoIcon },
  ];

  return (
    <section
      aria-labelledby="direct-contact-title"
      className="min-w-0 rounded-lg border border-line bg-surface-raised p-6 lg:p-8"
    >
      <h2 id="direct-contact-title" className="text-heading">
        Direct contact
      </h2>
      <dl className="mt-6 flex flex-col gap-6">
        <div>
          <dt className={DT}>Email</dt>
          <dd className="mt-1">
            <p id={EMAIL_ID} className="font-mono text-base text-ink wrap-anywhere">
              {user}@<wbr />
              {domain}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <CopyEmailButton email={email} targetId={EMAIL_ID} />
              <a href={`mailto:${email}`} className={TEXT_LINK}>
                <EnvelopeSimpleIcon size={20} aria-hidden="true" />
                Write an email
              </a>
            </div>
          </dd>
        </div>
        {location ? (
          <div>
            <dt className={DT}>Location</dt>
            <dd className="mt-1">
              <p className="font-mono text-sm text-ink tabular-nums">
                {`${formatLatLon(location, { decimals: 2 })} · ${location.name}`}
              </p>
            </dd>
          </div>
        ) : null}
        <div>
          <dt className={DT}>Replies</dt>
          <dd className="mt-1">
            <p className="text-base text-ink">Usually within a few days</p>
          </dd>
        </div>
        <div>
          <dt className={DT}>Elsewhere</dt>
          <dd className="mt-1">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {elsewhere.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a href={href} className={LINK}>
                    <Icon size={20} aria-hidden="true" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </section>
  );
}
