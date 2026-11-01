/** RED stub (11-14 inline code): replaced in the GREEN commit. */
export type InlinePart = { text: string; code: boolean };

export function splitInlineCode(text: string): InlinePart[] {
  return [{ text, code: false }];
}

export function plainText(text: string): string {
  return text.replace(/`/g, '');
}
