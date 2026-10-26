/**
 * The `@modal` slot at /photos itself: nothing. A soft navigation back to the
 * gallery matches this page, so the slot unmounts the lightbox instead of
 * keeping its last active state (Next "Parallel Routes", Modals).
 */
export default function ModalAtGallery() {
  return null;
}
