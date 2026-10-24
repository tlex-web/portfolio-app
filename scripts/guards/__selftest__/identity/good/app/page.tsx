// Fixture: live page with real identity; "portfolio" and "Portfolio" inside words are not the split wordmark
import SiteChrome from '@/components/site/SiteChrome';
import { site } from '@/data/site';

export default function Page() {
  return (
    <SiteChrome>
      <h1>{site.name}</h1>
      <p>A Portfolio of landscape photographs and the portfolio-app source.</p>
      <a href="https://github.com/tlex-web">GitHub</a>
    </SiteChrome>
  );
}
