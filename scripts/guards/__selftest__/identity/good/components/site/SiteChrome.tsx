// Fixture: './SiteFooter' must not count as an import of the legacy components/Footer.tsx
import SiteFooter from './SiteFooter';

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
