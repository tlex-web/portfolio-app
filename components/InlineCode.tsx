import { splitInlineCode } from '@/lib/inline-code';

/**
 * Approved copy with its backticked code tokens (a flag such as `--clip`, a
 * cmdlet, a file name) set in mono and kept on one line, so a flag never
 * breaks between its hyphens. The backticks mark the spans and are not
 * rendered. The site's one way to show inline code in copy: the route-log
 * descriptions (11-08) and the case-study prose (11-14). Server-safe, no
 * client code; every part renders as a React text child, so nothing in the
 * copy is parsed as HTML (T-11-26).
 */
export default function InlineCode({ text }: { text: string }) {
  return splitInlineCode(text).map((part, i) =>
    part.code ? (
      <code key={i} className="font-mono whitespace-nowrap">
        {part.text}
      </code>
    ) : (
      part.text
    )
  );
}
