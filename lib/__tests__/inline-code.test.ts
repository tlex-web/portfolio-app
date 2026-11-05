/**
 * The inline-code tokenizer (orchestrator-added task in 11-14, Tim's "yes",
 * 2026-11-01): approved copy marks code tokens with backticks, as the 11-02
 * review copy did; the renderer sets each span as code and never shows the
 * backticks. One tokenizer serves the route log and the case-study prose.
 */
import { plainText, splitInlineCode } from '@/lib/inline-code';

describe('splitInlineCode', () => {
  it('splits text into plain and code parts, dropping the backticks', () => {
    expect(splitInlineCode('JSON output that `ConvertFrom-Json` reads, `--clip` for the clipboard.')).toEqual([
      { text: 'JSON output that ', code: false },
      { text: 'ConvertFrom-Json', code: true },
      { text: ' reads, ', code: false },
      { text: '--clip', code: true },
      { text: ' for the clipboard.', code: false },
    ]);
  });

  it('returns one plain part for text without backticks', () => {
    expect(splitInlineCode('Plain words.')).toEqual([{ text: 'Plain words.', code: false }]);
  });

  it('handles a code span at the start and at the end', () => {
    expect(splitInlineCode('`a` and `b`')).toEqual([
      { text: 'a', code: true },
      { text: ' and ', code: false },
      { text: 'b', code: true },
    ]);
  });

  it('returns nothing for empty text and drops an empty code span', () => {
    expect(splitInlineCode('')).toEqual([]);
    expect(splitInlineCode('a `` b')).toEqual([{ text: 'a  b', code: false }]);
  });

  it('keeps an unmatched backtick as plain text instead of opening a span', () => {
    expect(splitInlineCode('one `two` three `four')).toEqual([
      { text: 'one ', code: false },
      { text: 'two', code: true },
      { text: ' three `four', code: false },
    ]);
  });
});

describe('plainText', () => {
  it('is the text a reader sees: the spans without their backticks', () => {
    expect(
      plainText(
        'With `--force`, box would rename `hut.txt` to `hut.md` and `zmutt.txt` to `zmutt.md`, and leave the `copies` folder alone.'
      )
    ).toBe(
      'With --force, box would rename hut.txt to hut.md and zmutt.txt to zmutt.md, and leave the copies folder alone.'
    );
  });

  it('leaves text without spans unchanged, an unmatched backtick included', () => {
    expect(plainText('No spans here.')).toBe('No spans here.');
    expect(plainText('a `b')).toBe('a `b');
  });
});
