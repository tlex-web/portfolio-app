import type { Project } from '@/data/types';

type Tile = NonNullable<Project['metrics']>['tiles'][number];

/** RED skeleton (11-13 Task 1): renders nothing until the GREEN commit. */
export default function Metrics(_props: { id: string; label: string; tiles: Tile[] }) {
  return null;
}
