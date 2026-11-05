/**
 * The `@modal` slot's fallback (mandatory for a named slot in this Next
 * version): on a hard load of any /photos URL the slot has no active state,
 * so it renders nothing and no dialog appears (LBOX-01 reload lands on the
 * full page).
 */
export default function ModalDefault() {
  return null;
}
