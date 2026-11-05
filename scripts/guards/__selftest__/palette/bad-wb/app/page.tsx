// Fixture: two white/black utilities against a ratchet entry of 1 must fail
export default function Page() {
  return (
    <main className="bg-surface">
      <div className="bg-black/60" />
      <div className="hover:bg-white/10" />
    </main>
  );
}
