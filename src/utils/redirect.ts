/**
 * Sanitizes a redirect URL to prevent open redirect vulnerabilities.
 * Ensures the destination is a valid internal relative path.
 */
export const getSanitizedRedirectUrl = (url: string | null | undefined, fallback = '/'): string => {
  if (!url) return fallback;

  const trimmed = url.trim();

  // Must start with a single '/'
  if (!trimmed.startsWith('/')) return fallback;

  // Prevent protocol-relative URLs like '//evil.com'
  if (trimmed.startsWith('//')) return fallback;

  // Prevent backslashes or invalid schemes
  if (trimmed.includes('\\') || trimmed.includes(':')) return fallback;

  // Prevent control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) return fallback;

  return trimmed;
};
