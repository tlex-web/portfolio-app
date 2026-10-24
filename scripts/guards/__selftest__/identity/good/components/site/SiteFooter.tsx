// Fixture: footer links from the identity record
import { site } from '@/data/site';

export default function SiteFooter() {
  return (
    <footer>
      <a href={site.links.github}>GitHub</a>
      <a href={site.links.linkedin}>LinkedIn</a>
      <a href={`mailto:${site.email}`}>Email</a>
    </footer>
  );
}
