// Fixture (07 WR-02): directional borders, ring offsets and the shadow-colour
// families must fail. Stock colours fail the stock rule; white/black ones fail the
// wb rule, since this fixture has no palette-ratchet.json (a ratchet of 0).
export default function Page() {
  return (
    <main className="bg-surface">
      <div className="border-t-red-500 hover:border-x-cyan-400" />
      <div className="ring-offset-red-500 inset-ring-blue-500" />
      <div className="drop-shadow-red-500 inset-shadow-red-500 text-shadow-red-500" />
      <div className="border-l-white/10 ring-offset-white drop-shadow-black" />
    </main>
  );
}
