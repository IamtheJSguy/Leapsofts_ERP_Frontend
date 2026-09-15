/**
 * Sanitizes a redirect URL to prevent open redirect vulnerabilities.
 * Ensures the destination is a valid internal relative path or same-origin URL.
 */
export const getSanitizedRedirectUrl = (url: string | null | undefined, fallback = '/'): string => {
  if (!url) return fallback;

  let trimmed = url.trim();

  // If full absolute HTTP/HTTPS URL, accept ONLY if origin matches window.location.origin
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      if (typeof window !== 'undefined' && window.location?.origin) {
        const parsed = new URL(trimmed);
        if (parsed.origin === window.location.origin) {
          trimmed = parsed.pathname + parsed.search + parsed.hash;
        } else {
          return fallback;
        }
      } else {
        return fallback;
      }
    } catch {
      return fallback;
    }
  }

  // Must start with a single '/'
  if (!trimmed.startsWith('/')) return fallback;

  // Prevent protocol-relative URLs like '//evil.com'
  if (trimmed.startsWith('//')) return fallback;

  // Prevent backslashes or invalid schemes/protocols (e.g. javascript:)
  if (trimmed.includes('\\') || trimmed.includes(':')) return fallback;

  // Prevent control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) return fallback;

  return trimmed;
};

