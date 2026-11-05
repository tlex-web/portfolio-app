/**
 * First focusable element on every page (SHELL-01, UI-SPEC "SkipLink").
 * Hidden until focused; activating it moves focus to <main id="main-content" tabIndex={-1}>
 * through native fragment navigation.
 */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-(--z-skip) focus:min-h-11 focus:px-4 focus:inline-flex focus:items-center focus:rounded-sm focus:bg-accent focus:text-ink-inverse focus:text-base focus:font-semibold"
    >
      Skip to main content
    </a>
  );
}
