'use client';

import type { PhotoView } from '@/lib/photos/view-model';

/** RED stub (10-11 Task 2): replaced by the callouts in the GREEN commit. */
type Props = {
  view: PhotoView;
  labelsOn: boolean;
  zoomed: boolean;
  expandedId: string | null;
  onToggle(id: string): void;
};

export function HotspotMarks(_props: Props) {
  return null;
}

export function HotspotOverlay(_props: Props) {
  return null;
}

export function HotspotKey(_props: Omit<Props, 'zoomed'>) {
  return null;
}
