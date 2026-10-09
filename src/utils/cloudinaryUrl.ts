const UPLOAD_MARKER = '/image/upload/';
const DEFAULT_AVATAR_SIZE = 96;

/**
 * Rewrite a Cloudinary delivery URL so the CDN returns a resized WebP/AVIF
 * (`f_auto`) instead of the original JPEG. Non-Cloudinary URLs are unchanged.
 */
export function optimizeCloudinaryAvatarUrl(
  url: string | null | undefined,
  size = DEFAULT_AVATAR_SIZE,
): string | undefined {
  if (!url) return undefined;
  const at = url.indexOf(UPLOAD_MARKER);
  if (at === -1) return url;

  const prefix = url.slice(0, at + UPLOAD_MARKER.length);
  let remainder = url.slice(at + UPLOAD_MARKER.length);

  const firstSlash = remainder.indexOf('/');
  if (firstSlash > 0) {
    const first = remainder.slice(0, firstSlash);
    if (first.includes('_') || first.includes(',')) {
      remainder = remainder.slice(firstSlash + 1);
    }
  }

  const transform = `f_auto,q_auto,c_fill,g_face,w_${size},h_${size}`;
  return `${prefix}${transform}/${remainder}`;
}

export function rewriteAvatarUrlsInPlace(data: unknown): void {
  if (Array.isArray(data)) {
    for (const item of data) rewriteAvatarUrlsInPlace(item);
    return;
  }
  if (!data || typeof data !== 'object') return;

  const obj = data as Record<string, unknown>;
  if (typeof obj.avatarUrl === 'string') {
    obj.avatarUrl = optimizeCloudinaryAvatarUrl(obj.avatarUrl) ?? obj.avatarUrl;
  }
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') rewriteAvatarUrlsInPlace(value);
  }
}
