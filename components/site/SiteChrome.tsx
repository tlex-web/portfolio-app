import MotionProvider from '@/components/providers/MotionProvider';
import SkipLink from './SkipLink';
import SiteNav from './SiteNav';
import SiteFooter from './SiteFooter';

/**
 * The site shell (SHELL-01; UI-SPEC "Shell Contract"): skip link, one header
 * with the Primary nav, one main#main-content and one footer.
 * The default variant mounts MotionProvider; the static variant (global-error)
 * has no motion and no router-dependent nav (PITFALLS 14).
 */
export default function SiteChrome({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'static';
}) {
  const shell = (
    <>
      <SkipLink />
      <SiteNav variant={variant} />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </>
  );

  return variant === 'static' ? shell : <MotionProvider>{shell}</MotionProvider>;
}
