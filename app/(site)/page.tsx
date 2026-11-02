import AboutSection from '@/components/home/AboutSection';
import AscentHero from '@/components/home/AscentHero';
import { SITE_DESCRIPTION, pageMetadata } from '@/lib/metadata';

// SEO-01: the root description and its own canonical; no title, so the root
// default 'Tim Lui · Developer & photographer' applies.
export const metadata = pageMetadata({ description: SITE_DESCRIPTION, path: '/' });

/**
 * Home (HOME-01, HOME-02; D-11, D-12, D-14; 09-UI-SPEC "Page Structure").
 * A Server Component: the first viewport (relief poster, name, role and the
 * trail signs) is complete server HTML with no animation and no WebGL. Nothing
 * from three, @react-three/*, motion/react or lib/animations may be imported
 * here; client islands join later as Client Components inside AscentHero.
 * The About and contact block follows the ascent, outside the sticky stage.
 */
export default function HomePage() {
  return (
    <>
      <AscentHero />
      <AboutSection />
    </>
  );
}
