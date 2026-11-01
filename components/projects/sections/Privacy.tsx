import type { Project } from '@/data/types';

type PrivacyBlock = NonNullable<Extract<Project, { slug: 'coin-flip' }>['privacy']>;

/** Skeleton (11-11 RED): the Privacy renderer arrives in the GREEN commit. */
export default function Privacy(_props: { id: string; label: string; block: PrivacyBlock }) {
  return null;
}
