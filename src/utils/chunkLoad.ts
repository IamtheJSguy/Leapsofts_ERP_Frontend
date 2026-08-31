const CHUNK_RELOAD_KEY = 'chunk-reload';

const CHUNK_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /loading chunk/i,
  /unexpected token '<'/i,
  /unable to preload css/i,
];

export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : String(error ?? '');
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/** Returns true if a reload was triggered. */
export function reloadOnceForStaleChunk(): boolean {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  } catch {
    // sessionStorage may be unavailable; still attempt one reload this navigation.
  }
  window.location.reload();
  return true;
}
