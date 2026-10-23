import type { Site } from './types';

/**
 * The single source for identity, nav and links (SHELL-03).
 * name, role and GitHub are LOCKED (UI-SPEC); email and LinkedIn were supplied
 * by Tim at the 07-21 Task 1 checkpoint.
 */
export const site = {
  name: 'Tim Lui',
  role: 'Developer & photographer',
  email: 'old2shatterhand@gmail.com',
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
} as const satisfies Site;
