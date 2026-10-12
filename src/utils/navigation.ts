/**
 * Safely resolves the redirect path after a successful login or 2FA verification.
 *
 * Rules:
 * 1. If a valid relative route was requested (e.g. from ProtectedRoute state),
 *    redirect the user back to that route.
 * 2. If the user was on the landing page ('/'), login pages ('/login', '/login/*'),
 *    or no redirect state exists, default to '/dashboard'.
 * 3. Disallow absolute external URLs (e.g. 'https://...', '//evil.com') for security.
 */
export const getPostLoginRedirectPath = (
  fromState?: unknown,
  defaultPath = '/dashboard',
): string => {
  let path = '';

  if (typeof fromState === 'string') {
    path = fromState;
  } else if (fromState && typeof fromState === 'object' && 'pathname' in fromState) {
    const loc = fromState as { pathname?: string; search?: string; hash?: string };
    path = `${loc.pathname || ''}${loc.search || ''}${loc.hash || ''}`;
  }

  const trimmed = path.trim();

  // Security check: Must start with a single '/' and not '//'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return defaultPath;
  }

  // Prevent redirect loops to landing or auth pages
  if (trimmed === '/' || trimmed === '/login' || trimmed.startsWith('/login/')) {
    return defaultPath;
  }

  return trimmed;
};
