import type { Graph, Thing, WithContext } from 'schema-dts';
import { site } from '@/data/site';

/**
 * RED skeleton for 17-03 Task 3 (SEO-04): the exports lib/__tests__/json-ld.test.ts
 * pins, with the naive serializer and an empty graph. The GREEN commit replaces it.
 */
export const PERSON_ID = `${site.url}/#person`;
export const WEBSITE_ID = `${site.url}/#website`;

export function jsonLdHtml(data: Graph | WithContext<Thing>): string {
  return JSON.stringify(data);
}

export function siteRights(): string {
  return '';
}

export function siteGraph(): Graph {
  return { '@context': 'https://schema.org', '@graph': [] };
}
