import type { Project } from '@/data/types';

type SafetyBlock = NonNullable<Extract<Project, { slug: 'box' }>['safety']>;

/** Skeleton (11-11 RED): the Safety renderer arrives in the GREEN commit. */
export default function Safety(_props: { id: string; label: string; block: SafetyBlock }) {
  return null;
}
