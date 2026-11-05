// Fixture: the v1 split wordmark (a styled P, then a lone text node) must fail
export default function Brand() {
  return (
    <span>
      <span className="text-accent">P</span>
      ortfolio
    </span>
  );
}
