import { notFound } from 'next/navigation';
import { OG_SIZE } from '@/lib/og/template';

/** RED skeleton (17-07 Task 3): no card yet; GREEN replaces this file. */

type Params = { region: string };

export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateImageMetadata(_: { params: Params }) {
  return [] as { id: string; alt: string; size: typeof OG_SIZE; contentType: string }[];
}

export default async function Image({ params }: { params: Promise<Params> }) {
  await params;
  notFound();
}
