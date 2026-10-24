import type { Site } from './types';

/**
 * The single source for identity, nav and links (SHELL-03).
 * name, role and GitHub are LOCKED (UI-SPEC); email and LinkedIn were supplied
 * by Tim at the 07-21 Task 1 checkpoint.
 *
 * attribution.terrain is the swissALTIRegio source reference (D-15): the
 * "For the 2025 and all subsequent versions:" string, copied character for
 * character from https://www.swisstopo.admin.ch/en/height-model-swissaltiregio
 * (fetched 2026-10-24). Tim chose the full string (Option A) with no copyright
 * sign at the 08-04 sheet checkpoint; the source's own typo and stray closing
 * quote are kept verbatim.
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
  attribution: {
    terrain:
      'Bundesamt für Landestopografie swisstopo; Tarquini S., I. Isola, M. Favalli, A. Battistini, G. Dotta (2023). TINITALY, a digital elevation model of Italy with a 10 meters cell size (Version 1.1). Istituto Nazionale di Geofisica e Vulcanologia (INGV). https://doi.org/10.13127/tinitaly/1.1; DGM Österreich, geoland.at; DGM1, Bayerische Vermessungsverwaltung – www.geodaten.bayern.de; DGM1, Baden-Württemberg: LGL, www.lgl-bw.de, dl-de/by-2-0”; RGEAlti, Institut National de l’information géographique et forestière, données originales tétéchargées sur https://geoservices.ign.fr/rgealti#telechargement5m, mise à jour du juillet 2023',
  },
} as const satisfies Site;
