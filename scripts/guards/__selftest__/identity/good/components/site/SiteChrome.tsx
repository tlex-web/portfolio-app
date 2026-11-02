// Fixture: a shell component that composes the identity-record footer
import SiteFooter from './SiteFooter';

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
