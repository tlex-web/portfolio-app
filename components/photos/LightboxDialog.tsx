'use client';

import type { ReactNode } from 'react';

/** RED stub (10-05 Task 1): replaced by the dialog shell in the GREEN commit. */

export type LightboxApi = {
  close(): void;
  registerEscape(handler: () => boolean): () => void;
};

export function useLightbox(): LightboxApi | null {
  return null;
}

export default function LightboxDialog({
  children,
}: {
  children: ReactNode;
  labelledBy: string;
}) {
  return <>{children}</>;
}
