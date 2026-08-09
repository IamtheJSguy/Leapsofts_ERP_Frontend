import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shift, ShiftBreak } from '@/types';

interface TimeTrackerState {
  isCheckedIn: boolean;
  isOnBreak: boolean;
  checkInTime: string | null;
  breaks: ShiftBreak[];
  /** Net worked seconds only (excludes break time). Freezes while on break. */
  elapsedSeconds: number;
  checkIn: () => void;
  checkOut: () => void;
  tick: () => void;
  syncWithShift: (shift: Shift | null | undefined) => void;
}

const getBreakSeconds = (breaks: ShiftBreak[], untilMs: number): number =>
  breaks.reduce((sum, b) => {
    const start = new Date(b.startTime).getTime();
    if (Number.isNaN(start)) return sum;
    const end = b.endTime ? new Date(b.endTime).getTime() : untilMs;
    if (Number.isNaN(end)) return sum;
    return sum + Math.max(0, Math.floor((end - start) / 1000));
  }, 0);

const getWorkedSeconds = (
  checkInTime: string,
  breaks: ShiftBreak[],
  untilMs: number = Date.now()
): number => {
  const checkInMs = new Date(checkInTime).getTime();
  if (Number.isNaN(checkInMs)) return 0;
  const wallSeconds = Math.floor((untilMs - checkInMs) / 1000);
  const breakSeconds = getBreakSeconds(breaks, untilMs);
  return Math.max(0, wallSeconds - breakSeconds);
};

const hasOpenBreak = (breaks: ShiftBreak[] | undefined): boolean => {
  if (!breaks?.length) return false;
  return breaks[breaks.length - 1]?.endTime === null;
};

export const useTimeTrackerStore = create<TimeTrackerState>()(
  persist(
    (set, get) => ({
      isCheckedIn: false,
      isOnBreak: false,
      checkInTime: null,
      breaks: [],
      elapsedSeconds: 0,
      checkIn: () => {
        const now = new Date().toISOString();
        set({
          isCheckedIn: true,
          isOnBreak: false,
          checkInTime: now,
          breaks: [],
          elapsedSeconds: 0,
        });
      },
      checkOut: () => {
        set({
          isCheckedIn: false,
          isOnBreak: false,
          checkInTime: null,
          breaks: [],
          elapsedSeconds: 0,
        });
      },
      tick: () => {
        const { isCheckedIn, checkInTime, breaks } = get();
        if (!isCheckedIn || !checkInTime) {
          if (get().elapsedSeconds !== 0) {
            set({ elapsedSeconds: 0 });
          }
          return;
        }
        set({ elapsedSeconds: getWorkedSeconds(checkInTime, breaks) });
      },
      syncWithShift: (shift) => {
        if (!shift) {
          set({
            isCheckedIn: false,
            isOnBreak: false,
            checkInTime: null,
            breaks: [],
            elapsedSeconds: 0,
          });
          return;
        }
        if (shift.status === 'checked_in' && shift.checkInTime) {
          const breaks = Array.isArray(shift.breaks) ? shift.breaks : [];
          const onBreak = hasOpenBreak(breaks);
          set({
            isCheckedIn: true,
            isOnBreak: onBreak,
            checkInTime: shift.checkInTime,
            breaks,
            elapsedSeconds: getWorkedSeconds(shift.checkInTime, breaks),
          });
        } else {
          set({
            isCheckedIn: false,
            isOnBreak: false,
            checkInTime: null,
            breaks: [],
            elapsedSeconds: 0,
          });
        }
      },
    }),
    {
      name: 'time-tracker-storage',
    }
  )
);
