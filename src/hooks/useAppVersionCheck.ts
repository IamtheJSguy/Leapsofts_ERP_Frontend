import { useEffect, useState } from 'react';

const POLL_MS = 3 * 60 * 1000;

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

    void check();
    const id = window.setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return updateAvailable;
}
