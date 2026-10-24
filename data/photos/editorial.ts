/**
 * Hand-written photo copy (D-05, D-07, DATA-03), keyed by camera id.
 *
 * Facts that come from data (capture time, exposure, position, DEM height,
 * year and season tags) live in data/generated/photos.ts and are never typed
 * here. This file holds only what a person writes: the slug, title, alt text,
 * location, a short first-person story, subject tags and hotspot copy.
 * Annotation elevations are references (`photo` = the photo's DEM height,
 * `summit` = the official summit height), and every fact names its source.
 * The schema is data/schemas/editorial.ts; data/__tests__/editorial.test.ts
 * parses this file with it.
 *
 * Status: draft pending Tim's approval at 08-10 Task 3. The slugs become
 * public URLs when Phase 10 ships /photos/[slug] (D-07).
 */
import type { Editorial } from '@/data/schemas/editorial';
import type { photos } from '@/data/generated/photos';

/** A camera id from the generated photo facts. */
export type PhotoId = (typeof photos)[number]['id'];

const WIKI_MATTERHORN = 'https://en.wikipedia.org/wiki/Matterhorn';
const WIKI_GORNER_GLACIER = 'https://en.wikipedia.org/wiki/Gorner_Glacier';
const WIKI_ZERMATT = 'https://en.wikipedia.org/wiki/Zermatt';
const WIKI_RIFFELSEE = 'https://en.wikipedia.org/wiki/Riffelsee';

export const editorial: Record<PhotoId, Editorial> = {
  'img-0605': {
    slug: 'matterhorn-from-zermatt',
    title: 'Matterhorn from Zermatt',
    alt: 'The Matterhorn half hidden by a bank of white cloud under a deep blue sky, with conifers and a rock face in the foreground',
    location: 'Zermatt, Switzerland',
    story:
      'I took this from the village of Zermatt with the zoom at its longest. A bank of cloud covered much of the mountain, and only the summit stood clear of it.',
    subjectTags: ['landscape', 'matterhorn', 'clouds'],
    annotations: [
      {
        id: 'summit-from-zermatt',
        title: 'Matterhorn summit',
        description: 'The summit pyramid, clear of the cloud bank on its flank.',
        position: { x: 52, y: 52 },
        icon: 'peak',
        details: {
          elevation: { kind: 'summit' },
          facts: [
            {
              text: 'The Matterhorn straddles the border between Switzerland and Italy.',
              source: WIKI_MATTERHORN,
            },
          ],
        },
      },
    ],
  },
  'img-0629': {
    slug: 'gornerschlucht-waterfall',
    title: 'Waterfall in the Gornerschlucht',
    alt: 'Seen from above, turquoise water spills over a lip of rock into a narrow white cascade between grey boulders',
    location: 'Gornerschlucht, Zermatt',
    story:
      'Just south of Zermatt, the Gornera runs through the Gornerschlucht. I pointed the camera straight down at the water where it spills over a lip of rock into a narrow chute.',
    subjectTags: ['landscape', 'waterfall', 'river'],
    annotations: [
      {
        id: 'gornera-cascade',
        title: 'Gornera',
        description:
          'The river that runs through the gorge, dropping through a gap between two boulders.',
        position: { x: 50, y: 66 },
        icon: 'water',
        details: {
          elevation: { kind: 'photo' },
          facts: [
            {
              text: 'The Gornera rises at the Gorner Glacier and flows down through Zermatt.',
              source: WIKI_GORNER_GLACIER,
            },
            {
              text: 'The gorge lies south of Zermatt; the hamlet of Zum See sits on its west bank.',
              source: WIKI_ZERMATT,
            },
            {
              text: "Located from the camera's GPS and confirmed by Tim.",
              source: 'Tim',
            },
          ],
        },
      },
    ],
  },
  'img-0662': {
    slug: 'matterhorn-glacier-trail',
    title: 'Matterhorn from the Glacier Trail',
    alt: "The Matterhorn's rock pyramid against a dark blue sky, with cloud trailing off both flanks above grey moraine and glacier ice",
    location: 'Matterhorn Glacier Trail, Zermatt',
    story:
      'A day later I was on the Matterhorn Glacier Trail, near its Schwarzsee end. From here the mountain fills the frame, with cloud trailing off both of its flanks.',
    subjectTags: ['landscape', 'matterhorn', 'hiking'],
    annotations: [
      {
        id: 'summit-from-glacier-trail',
        title: 'Matterhorn summit',
        description: 'The top of the mountain, above the cloud on its flanks.',
        position: { x: 50, y: 18 },
        icon: 'peak',
        details: {
          elevation: { kind: 'summit' },
          facts: [
            {
              text: "First climbed on 14 July 1865 by Edward Whymper's party, by the Hörnli ridge.",
              source: WIKI_MATTERHORN,
            },
          ],
        },
      },
      {
        id: 'glacier-trail-viewpoint',
        title: 'Matterhorn Glacier Trail',
        description: 'I took the photo from the trail, near its Schwarzsee end.',
        position: { x: 50, y: 92 },
        icon: 'trail',
        details: {
          elevation: { kind: 'photo' },
          facts: [
            {
              text: "Height from the swissALTIRegio terrain model at the camera's GPS position.",
              source: 'dem',
            },
          ],
        },
      },
    ],
  },
  'r004-011': {
    slug: 'riffelsee-reflection',
    title: 'Matterhorn in the Riffelsee',
    alt: 'The Matterhorn and the snowfields below it mirrored in a small, still alpine lake, framed by boulders and grass',
    location: 'Riffelsee, Zermatt',
    story:
      'I shot this on film at the Riffelsee in 2019. The water was calm enough to hold an upside-down Matterhorn between the boulders.',
    subjectTags: ['landscape', 'matterhorn', 'reflection', 'lake', 'film'],
    annotations: [
      {
        id: 'riffelsee-lake',
        title: 'Riffelsee',
        description:
          'The Matterhorn reflected in the lake. This film photo has no GPS, so its pin is placed by hand and its height is approximate.',
        position: { x: 44, y: 66 },
        icon: 'lake',
        details: {
          elevation: { kind: 'photo' },
          facts: [
            {
              text: 'The lake lies below the Riffelhorn and covers about 0.45 ha.',
              source: WIKI_RIFFELSEE,
            },
            {
              text: 'It can be reached from Rotenboden station on the Gornergrat railway.',
              source: WIKI_RIFFELSEE,
            },
          ],
        },
      },
      {
        id: 'summit-above-riffelsee',
        title: 'Matterhorn summit',
        description: 'The summit, mirrored upside down in the water below.',
        position: { x: 43, y: 16 },
        icon: 'peak',
        details: {
          elevation: { kind: 'summit' },
        },
      },
    ],
  },
};
