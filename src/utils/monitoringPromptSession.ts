/** Session-only flags: workplace monitoring prompt is shown once per login, not on refresh/org switch. */
const PENDING_KEY = 'monitoringPromptPending';
const DONE_USER_KEY = 'monitoringPromptDoneUserId';

export const markMonitoringPromptPendingForLogin = (): void => {
  try {
    sessionStorage.setItem(PENDING_KEY, '1');
    sessionStorage.removeItem(DONE_USER_KEY);
  } catch {
    // ignore storage failures (private mode, etc.)
  }
};

export const clearMonitoringPromptSession = (): void => {
  try {
    sessionStorage.removeItem(PENDING_KEY);
    sessionStorage.removeItem(DONE_USER_KEY);
  } catch {
    // ignore
  }
};

export const isMonitoringPromptPending = (): boolean => {
  try {
    return sessionStorage.getItem(PENDING_KEY) === '1';
  } catch {
    return false;
  }
};

export const hasCompletedMonitoringPromptThisSession = (userId: string): boolean => {
  try {
    return sessionStorage.getItem(DONE_USER_KEY) === userId;
  } catch {
    return false;
  }
};

export const markMonitoringPromptCompleted = (userId: string): void => {
  try {
    sessionStorage.setItem(DONE_USER_KEY, userId);
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
};
