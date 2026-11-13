/**
 * Escaping a value for a quoted CSS attribute selector, `[data-x="${cssEscape(value)}"]`
 * (10-REVIEW IN-02). Pure and import-free.
 *
 * CSS.escape where the environment has it (every target browser); otherwise a
 * quote-and-backslash fallback, which is all a double-quoted attribute value needs
 * (jsdom has no CSS.escape of its own). The values are schema-validated photo slugs
 * and hotspot ids, so the fallback is a guard, not a sanitiser (T-10-12).
 */
export function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
  return value.replace(/["\\]/g, '\\$&');
}
