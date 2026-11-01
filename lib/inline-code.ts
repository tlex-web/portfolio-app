/**
 * Inline code in approved copy (11-08 route-log descriptions; 11-14 case-study
 * prose, Tim's "yes", 2026-11-01). Copy marks a code token with backticks, as
 * the 11-02 review copy did: "`--clip` for the clipboard". This is the one
 * tokenizer the renderers share; components/InlineCode.tsx sets each code part
 * as a <code> element, so the backticks never reach the page and nothing is
 * parsed as HTML (T-11-26).
 *
 * Pure and dependency-free. A backtick without a partner is kept as plain
 * text rather than opening a span that runs to the end; an empty pair adds
 * nothing. The data test keeps backticks paired in tokenized copy.
 */
export type InlinePart = { text: string; code: boolean };

export function splitInlineCode(text: string): InlinePart[] {
  const pieces = text.split('`');
  // An even piece count means one backtick has no partner: merge the last two
  // pieces back together with it, as plain text.
  if (pieces.length % 2 === 0) {
    const tail = pieces.pop() ?? '';
    pieces[pieces.length - 1] = `${pieces[pieces.length - 1]}\`${tail}`;
  }
  const parts: InlinePart[] = [];
  pieces.forEach((piece, i) => {
    const code = i % 2 === 1;
    if (piece === '') return;
    const prev = parts[parts.length - 1];
    if (prev && !prev.code && !code) prev.text += piece;
    else parts.push({ text: piece, code });
  });
  return parts;
}

/** The text as a reader sees it: every part's text, without the backticks. */
export function plainText(text: string): string {
  return splitInlineCode(text)
    .map((part) => part.text)
    .join('');
}
