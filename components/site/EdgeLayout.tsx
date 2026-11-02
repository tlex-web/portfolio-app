import type { ReactNode } from 'react';

/** RED skeleton (12-12 Task 1): the grid lands in the GREEN commit. */
export default function EdgeLayout({ text }: { text: ReactNode; extra?: ReactNode }) {
  return <div>{text}</div>;
}
