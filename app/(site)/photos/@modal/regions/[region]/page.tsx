/**
 * The `@modal` slot at a region page (/photos/regions/<id>): nothing
 * (REGION-07, D-01; 17-RESEARCH Pitfall 1).
 *
 * A slot keeps its last active state on a soft navigation to a URL it does not
 * match, so without this page a push from an open lightbox to a region page
 * leaves the dialog open over it. Next's guide says as much: "client-side
 * navigations to a route that no longer match the slot will remain visible, we
 * need to match the slot to a route that returns null to close the modal"
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/parallel-routes.md:485).
 * The 17-01 spike measured it: with this page deleted, the dialog stayed open
 * and html overflow stayed hidden after the navigation.
 *
 * An explicit page, never a `@modal/[...catchAll]`: a catch-all beside
 * `(.)[slug]` was not tested. e2e/photos-region.spec.ts guards the behaviour.
 */
export default function ModalAtRegion() {
  return null;
}
