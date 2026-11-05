// Fixture: every path is scanned; a footer that takes its links from the identity record passes
import { site } from '@/data/site';

export default function Footer() {
  return (
    <footer>
      <span>{site.name}</span>
      <a href={`mailto:${site.email}`}>Email</a>
      <a href={site.links.github}>GitHub</a>
    </footer>
  );
}
