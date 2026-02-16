/**
 * CSRF protection via Origin header validation.
 *
 * Same mechanism Next.js Server Actions use internally:
 * compare the request Origin header against the Host header.
 * Cross-origin POST requests always include an Origin header (per Fetch spec),
 * so a mismatch reliably indicates a cross-site request.
 */

export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // If Origin is absent, treat as same-origin.
  // Browsers omit Origin on same-origin requests in some cases,
  // but always include it on cross-origin POST requests.
  if (!origin) {
    return true;
  }

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    // Malformed Origin header -- reject
    return false;
  }
}
