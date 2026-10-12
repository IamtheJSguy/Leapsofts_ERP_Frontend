import { useEffect, useState } from 'react';

const POLL_MS = 3 * 60 * 1000;
// Stay off the first-load critical path (HTML → JS → version.json).
const FIRST_CHECK_DELAY_MS = 30_000;

export function useAppVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          return;
        }
        const data: { buildId?: string } = await response.json();
        if (!cancelled && data.buildId && data.buildId !== __APP_BUILD_ID__) {
          setUpdateAvailable(true);
        }
      } catch {
        // Ignore network errors; next poll will retry.
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void check();
      }
    };

    const delayed = window.setTimeout(() => void check(), FIRST_CHECK_DELAY_MS);
    const id = window.setInterval(check, POLL_MS);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearTimeout(delayed);
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return updateAvailable;
}
