// Fixture: semantic utilities only; one white utility held by the fixture ratchet.
// The copyright sign and the prompt glyph are allowed by the emoji rule.
const tones = {
  info: 'bg-surface-raised text-ink border-line',
  warn: 'text-caution hover:bg-surface-overlay',
};

export default function Page() {
  return (
    <main className="bg-surface text-ink-muted">
      <p className={tones.info}>© 2026 Tim Lui</p>
      <code className={`font-mono ${tones.warn}`}>❯ npm run lint</code>
      <div className="text-white" />
    </main>
  );
}
