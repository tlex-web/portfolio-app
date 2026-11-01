import { site } from './site';

function navHref(label: (typeof site.nav)[number]['label']): string {
  const entry = site.nav.find((item) => item.label === label);
  if (!entry) throw new Error(`data/home: no site.nav entry labelled ${label}`);
  return entry.href;
}

/**
 * Home copy (D-11, D-14; 09-UI-SPEC "Copywriting Contract").
 *
 * The thesis is the approved hero line. The About body is the copy.home-about
 * text Tim approved at the 11-02 checkpoint (D-33; see 11-02-SUMMARY.md); the
 * contact copy is from the 09-12 copy checkpoint (09-12-SUMMARY.md). The name
 * comes from data/site.ts and both link targets are looked up in site.nav, so
 * no identity or route is typed twice.
 */
export const home = {
  thesis: 'Photographs and software from one mountain.',
  about: {
    status: 'approved',
    body: `I'm ${site.name}, a developer and photographer. I build software in Rust, TypeScript and Kotlin, including box, a command-line toolkit for PowerShell, and coin-flip, an Android app that tosses a fair 3D coin. I photograph the mountains around Zermatt, and this site puts each photograph back on the terrain where I took it.`,
    contact: {
      lead: 'To work together or ask about a photograph, use the ',
      contactLink: { label: 'contact page', href: navHref('Contact') },
      middle: ". To see what I'm building next, read the ",
      roadmapLink: { label: 'roadmap', href: navHref('Roadmap') },
      end: '.',
    },
  },
} as const;
