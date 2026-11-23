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
 * Copy and slugs decided by Tim at the 08-10 copy review; see 08-10-SUMMARY.md
 * The slugs become public URLs when Phase 10 ships /photos/[slug] (D-07).
 * The five photos added in Phase 16 (img-0680, img-0682, sam-20240910-143659 and
 * the two dji- stills) carry the copy Tim approved in 16-08 (16-08-SUMMARY.md,
 * "Approved copy"), verbatim, with no annotations. The two Ortler photos
 * (sam-20160717-120906, sam-20160717-124904) carry the copy Tim approved in 16-17
 * (16-17-SUMMARY.md, "Tim's reply"), verbatim, with no annotations. All seven stay
 * off the light table and get pages in Phase 17 (D-15).
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
  'dji-20260919-162232': {
    slug: 'castle-below-limestone-peaks',
    title: 'Castle below limestone peaks',
    alt: 'From the air, a white-walled castle with grey roofs stands on a wooded hillside, with pale limestone peaks and a blue sky behind',
    location: 'Saalfelden, Austria',
    story:
      'I flew the drone near Saalfelden in September 2026. The late-afternoon sun lit the castle walls and the limestone peaks above them.',
    subjectTags: ['landscape', 'aerial', 'castle'],
    annotations: [],
  },
  'dji-20260919-163558': {
    slug: 'saalfelden-valley-from-the-air',
    title: 'Saalfelden valley from the air',
    alt: 'An aerial view across green meadows, woods and the houses of a valley town towards rounded, forested mountains under a blue sky with white cloud',
    location: 'Saalfelden, Austria',
    story:
      'A quarter of an hour later I turned the drone towards the valley. Meadows and woods run down to the town, with the mountains on the far side.',
    subjectTags: ['landscape', 'aerial', 'valley'],
    annotations: [],
  },
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
  'img-0680': {
    slug: 'mirrored-snow-peaks',
    title: 'Snow peaks mirrored in a pool',
    alt: 'A row of snow-covered peaks under streaked white cloud and patches of blue sky, mirrored in a still, shallow pool beyond a stretch of brown, stony ground',
    location: 'Zermatt, Switzerland',
    story:
      'I took this above Zermatt in September 2021. A shallow pool on the stony ground was still enough to hold the snow peaks and the cloud above them.',
    subjectTags: ['landscape', 'reflection', 'snow'],
    annotations: [],
  },
  'img-0682': {
    slug: 'butterfly-on-a-thistle',
    title: 'Butterfly on an alpine thistle',
    alt: 'An orange and black butterfly resting on a pale yellow, spiny thistle head, with grey stones out of focus behind',
    location: 'Zermatt, Switzerland',
    story:
      'On the same walk, a butterfly stopped on a thistle among the stones. I zoomed in all the way and let the background go soft.',
    subjectTags: ['nature', 'butterfly', 'thistle'],
    annotations: [],
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
  'sam-20160717-120906': {
    slug: 'meadow-stream-below-the-peaks',
    title: 'Meadow stream below the peaks',
    alt: 'A small stream runs through long, sunlit grass towards a dark conifer forest, with a snow-streaked rock massif and white cloud above under a deep blue-green sky',
    location: 'Ortler Alps, Italy',
    story:
      'I took this with my phone in July 2016, on a summer walk in the Ortler Alps. I crouched low by a small stream so it would lead up through the meadow to the peaks.',
    subjectTags: ['landscape', 'stream', 'mountains'],
    annotations: [],
  },
  'sam-20160717-124904': {
    slug: 'forested-valley-below-the-peaks',
    title: 'Forested valley below the peaks',
    alt: 'A long rock massif streaked with snow and pale scree rises above dark larch and pine forest, with green meadows and a small village in the valley below a blue sky with white cloud',
    location: 'Ortler Alps, Italy',
    story:
      'Forty minutes later the view opened up across the whole valley. The forest ran up to the pale scree and the snow-streaked rock above it.',
    subjectTags: ['landscape', 'valley', 'forest'],
    annotations: [],
  },
  'sam-20240910-143659': {
    slug: 'matterhorn-wrapped-in-cloud',
    title: 'Matterhorn in a wisp of cloud',
    alt: "The Matterhorn's snow-dusted rock pyramid against a clear blue sky, with puffs of white cloud clinging to its left flank and lower slopes",
    location: 'Zermatt, Switzerland',
    story:
      "I took this with my phone in September 2024, three years after my first visit. Small clouds were forming against the mountain's flanks while the sky around it stayed clear.",
    subjectTags: ['landscape', 'matterhorn', 'clouds'],
    annotations: [],
  },
};
