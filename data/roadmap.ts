/**
 * The route log at /roadmap (ROUTE-01, ROUTE-03; D-17, D-18, D-20, D-31, D-32).
 *
 * Every row, title, description and date below was drafted by Claude and
 * confirmed by Tim at the 11-02 content checkpoint (11-02-SUMMARY "Resolved
 * values": log.rows, log.descriptions, log.surveyedAt; Reply 5, 2026-11-01).
 * Nothing here is guessed: a date Tim did not confirm is left out (D-17).
 *
 * The rows cover this site (`portfolio`), `box` and `coin-flip`. `order` rises
 * from the oldest completed work (1) to the furthest plan; the route log groups
 * rows by status into Base, Current camp and Summit (lib/route-log.ts).
 *
 * Phase 11 is "in-progress" here and carries no date (Q3 rule): its completion
 * date is entered in Phase 12's first data edit, or at the v2.0 milestone close,
 * with Tim's confirmation, and `surveyedAt` moves with it. The D-20 test
 * (data/__tests__/roadmap.test.ts) keeps surveyedAt between the newest date here
 * and today whenever either changes.
 */
import type { RoadmapItem } from './schemas/roadmap';

export const roadmapItems: RoadmapItem[] = [
  {
    id: 'coin-flip-play-store',
    title: 'Play Store release',
    description: 'Releasing the app through the Play Store.',
    area: 'coin-flip',
    status: 'planned',
    order: 7,
  },
  {
    id: 'coin-flip-v1-1',
    title: 'v1.1 Smoother toss',
    description: 'Smoothing the toss and the camera follow.',
    area: 'coin-flip',
    status: 'planned',
    order: 6,
  },
  {
    id: 'portfolio-v2',
    title: 'v2.0 Topographic Identity',
    description: 'This redesign: the whole site rebuilt around the real Matterhorn terrain.',
    area: 'portfolio',
    status: 'in-progress',
    order: 5,
    phases: [
      { n: 7, name: 'Foundation & guardrails', status: 'completed', completedAt: '2026-10-24' },
      { n: 8, name: 'Data & terrain pipeline', status: 'completed', completedAt: '2026-10-24' },
      { n: 9, name: 'Home ascent', status: 'completed', completedAt: '2026-10-25' },
      { n: 10, name: 'Photography', status: 'completed', completedAt: '2026-10-26' },
      { n: 11, name: 'Engineering & roadmap', status: 'in-progress' },
      { n: 12, name: 'Contact, edge pages & cleanup', status: 'planned' },
    ],
  },
  {
    id: 'coin-flip-v1',
    title: 'v1.0 First release on device',
    description:
      'The first release, running on my own device: a fair draw, a 3D toss, no permissions and no network.',
    area: 'coin-flip',
    status: 'completed',
    order: 4,
    completedAt: '2026-08-09',
  },
  {
    id: 'box-v2',
    title: 'v2.0 Toolbox → toolkit',
    description:
      'The tools became scriptable: JSON output, `--clip`, config-file defaults, BLAKE3 hashing and previews before destructive changes.',
    area: 'box',
    status: 'completed',
    order: 3,
    completedAt: '2026-07-14',
  },
  {
    id: 'box-v1',
    title: 'v1.0 Full toolbox',
    description: 'All 23 tools in one Rust binary, installed from PowerShell 7.',
    area: 'box',
    status: 'completed',
    order: 2,
    completedAt: '2026-06-24',
  },
  {
    id: 'portfolio-v1',
    title: 'v1.0 Stabilization & Visual Identity',
    description: 'The first version of this site, stabilized and given its own visual identity.',
    area: 'portfolio',
    status: 'completed',
    order: 1,
    completedAt: '2026-03-12',
  },
];

/** The day Tim last checked the route log (log.surveyedAt, 11-02). Required: the kicker reads it. */
export const surveyedAt = '2026-11-01';
