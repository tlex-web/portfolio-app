/**
 * The survey sheet's title (10-UI-SPEC "Header Band (D-14)" Kicker row and
 * "Map View" Sheet margin line; Tim 2026-10-26). One source for the footer's
 * sheet title (components/site/SiteFooter.tsx, unchanged on screen), the map
 * margin line and the /photos kicker's place. Pure and import-free.
 */
export const sheet = { title: 'Zermatt – Matterhorn' } as const;

/** The place: the part of the sheet title before ' – ' ('Zermatt'). */
export const sheetPlace: string = sheet.title.split(' – ')[0];
