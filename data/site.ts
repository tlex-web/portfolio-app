import type { Site } from './types';

/**
 * The single source for identity, nav and links (SHELL-03).
 * name, role and GitHub are LOCKED (UI-SPEC); email and LinkedIn were supplied
 * by Tim at the 07-21 Task 1 checkpoint.
 *
 * The swissALTIRegio source reference left this module in 18-03 (D-16): it is
 * SWISSALTIREGIO_CREDIT in server-only data/sources.ts, because the footer, and
 * so this module, ships in the app/global-error.tsx client chunk.
 */
export const site = {
  name: 'Tim Lui',
  role: 'Developer & photographer',
  // D-13: the canonical host. Tim chose www.tlui.de on 2026-11-02; tlui.de and
  // the vercel.app host redirect here at Vercel. No trailing slash. Costly to
  // change once indexed (it needs a redirect or a canonical plan on the old host).
  url: 'https://www.tlui.de',
  // The public address: a tlui.de alias that forwards to the inbox, so it can be
  // replaced if it draws spam. The form's recipient is FEEDBACK_RECIPIENT_EMAIL.
  email: 'contact@tlui.de',
  links: {
    github: 'https://github.com/tlex-web',
    linkedin: 'https://www.linkedin.com/in/luitim/',
  },
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Photographs', href: '/photos' },
    { label: 'Engineering', href: '/projects' },
    { label: 'Roadmap', href: '/roadmap' },
    { label: 'Contact', href: '/contact' },
  ],
  // D-01: confirmed by Tim at the 12-01 packet ("B: confirm"). 2 decimals at
  // most (about 1 km); never store a more precise position here.
  location: {
    name: 'Zürich',
    lat: 47.37,
    lon: 8.54,
    source: 'Wikipedia "Zurich" infobox, 47.37444 N 8.54111 E, rounded to 2 decimals (2026-11-02)',
  },
} as const satisfies Site;
