/**
 * The editable-target check for keyboard handlers (17 D-24, 13 IN-03): one
 * definition for PhotoViewer (arrows, Escape) and ZoomStage (pan keys), so the
 * two cannot drift. Pure and import-free.
 */

/** True when a key press belongs to a text field, where the arrows move the caret. */
export function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  );
}
