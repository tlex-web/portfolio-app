#!/usr/bin/env node

// RED stub (13-07 Task 1): the exports exist so the selftest loads; the
// behaviour lands in the GREEN commit.

export const DOCS_ONLY_FILES = [];

export function isDocsOnlyPath() {
  return false;
}

export function classify() {
  return { docsOnly: false, reason: 'not implemented' };
}
