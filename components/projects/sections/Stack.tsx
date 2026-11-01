import type { Project } from '@/data/types';

type Group = NonNullable<Project['stack']>['groups'][number];

/** RED skeleton (11-13 Task 2): renders nothing until the GREEN commit. */
export default function Stack(_props: { id: string; label: string; groups: Group[] }) {
  return null;
}
