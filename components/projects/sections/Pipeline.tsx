import type { Project } from '@/data/types';

type PipelineBlock = NonNullable<Project['pipeline']>;

/** Skeleton (11-11 RED): the Pipeline renderer arrives in the GREEN commit. */
export default function Pipeline(_props: {
  id: string;
  label: string;
  name: string;
  block: PipelineBlock;
}) {
  return null;
}
