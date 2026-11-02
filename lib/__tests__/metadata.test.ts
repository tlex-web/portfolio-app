import { pageMetadata } from '@/lib/metadata';

/**
 * pageMetadata (SEO-01; 12-RESEARCH finding 2).
 *
 * The helper returns exactly title (when given), description and
 * alternates.canonical. It must never return openGraph or twitter: Next merges
 * metadata shallowly, so either key would replace the root layout's object
 * whole and drop the inherited OG image. toEqual on the whole object pins the
 * exact key set.
 */
describe('pageMetadata (SEO-01)', () => {
  it('returns exactly the title, the description and a relative canonical', () => {
    expect(pageMetadata({ title: 'T', description: 'D', path: '/p' })).toEqual({
      title: 'T',
      description: 'D',
      alternates: { canonical: '/p' },
    });
  });

  it('has no title key without a title, so the root default title applies', () => {
    const metadata = pageMetadata({ description: 'D', path: '/' });
    expect(metadata).toEqual({ description: 'D', alternates: { canonical: '/' } });
    expect(Object.keys(metadata)).not.toContain('title');
  });

  it('never sets openGraph or twitter, which would replace the inherited cards', () => {
    const metadata = pageMetadata({ title: 'T', description: 'D', path: '/p' });
    expect(Object.keys(metadata).sort()).toEqual(['alternates', 'description', 'title']);
    expect(metadata).not.toHaveProperty('openGraph');
    expect(metadata).not.toHaveProperty('twitter');
  });
});
