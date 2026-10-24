/** DATA-01 contour serialisation (RED skeleton: signatures only, bodies land in the GREEN commit). */

export type Pt = [number, number];

export function onEdge(_p: Pt, _q: Pt, _W: number, _H: number): boolean {
  return false;
}

export function openRuns(ring: Pt[], _W: number, _H: number): { runs: Pt[][]; closed: boolean } {
  return { runs: [ring], closed: false };
}

export function roundHalf(v: number): number {
  return v;
}

export function runToPath(_points: { x: number; y: number }[], _closed: boolean): string {
  return '';
}

export function isIndexLevel(_levelM: number, _intervalM: number, _indexEvery: number): boolean {
  return false;
}

export function contourSvg(_o: {
  width: number;
  height: number;
  paths: { d: string; index: boolean }[];
}): string {
  return '';
}
