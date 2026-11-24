/**
 * 16 IN-03: homePhotos' RangeError points at the file and the command that fix
 * it. homePhotos reads data/generated/home-photos.ts (photos:build's second
 * output, 16-05), so a Home waypoint id with no generated photo names that
 * module, `npm run photos:build`, and the Home list photos:build reads
 * (data/home-waypoints.ts).
 */
import { homePhotos } from '@/lib/ascent/home-photos';

describe('homePhotos error (16 IN-03)', () => {
  const missing = () => homePhotos(['no-such-photo']);

  it('throws a RangeError for an id with no generated Home photo', () => {
    expect(missing).toThrow(RangeError);
  });

  it('names the id, data/generated/home-photos.ts and npm run photos:build', () => {
    let message = '';
    try {
      missing();
    } catch (e) {
      message = e instanceof Error ? e.message : String(e);
    }
    expect(message).toContain('no-such-photo');
    expect(message).toContain('data/generated/home-photos.ts');
    expect(message).toContain('npm run photos:build');
    expect(message).not.toContain('data/generated/photos.ts');
  });
});
