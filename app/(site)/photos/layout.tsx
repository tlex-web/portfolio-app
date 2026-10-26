/**
 * /photos layout (LBOX-01; 10-RESEARCH Spike Results, Pattern 1). Renders the
 * route's page and, after it, the `@modal` slot. On a soft navigation from
 * the gallery to /photos/{slug}, the slot holds the intercepted
 * `(.)[slug]` route (the lightbox dialog) while `children` keeps the gallery
 * mounted behind it; on a hard load the slot falls back to `default.tsx`
 * (null) and `children` is the full photo page.
 */
export default function PhotosLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
