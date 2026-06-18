import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimeTrackerState {
  isCheckedIn: boolean;
  checkInTime: string | null;
  elapsedSeconds: number;
  checkIn: () => void;
  checkOut: () => void;
  tick: () => void;
  syncWithShift: (shift: any) => void;
}

export const useTimeTrackerStore = create<TimeTrackerState>()(
  persist(
    (set, get) => ({
      isCheckedIn: false,
      checkInTime: null,
      elapsedSeconds: 0,
      checkIn: () => {
        const now = new Date().toISOString();
        set({
          isCheckedIn: true,
          checkInTime: now,
          elapsedSeconds: 0,
        });
      },
      checkOut: () => {
        set({
          isCheckedIn: false,
          checkInTime: null,
          elapsedSeconds: 0,
        });
      },
      tick: () => {
        const { isCheckedIn, checkInTime } = get();
        if (!isCheckedIn || !checkInTime) {
          if (get().elapsedSeconds !== 0) {
            set({ elapsedSeconds: 0 });
          }
          return;
        }
        const elapsed = Math.floor((Date.now() - new Date(checkInTime).getTime()) / 1000);
        set({ elapsedSeconds: elapsed >= 0 ? elapsed : 0 });
      },
      syncWithShift: (shift) => {
        if (!shift) {
          set({ isCheckedIn: false, checkInTime: null, elapsedSeconds: 0 });
          return;
        }
        if (shift.status === 'checked_in' && shift.checkInTime) {
          const elapsed = Math.floor((Date.now() - new Date(shift.checkInTime).getTime()) / 1000);
          set({
            isCheckedIn: true,
            checkInTime: shift.checkInTime,
            elapsedSeconds: elapsed >= 0 ? elapsed : 0,
          });
        } else {
          set({ isCheckedIn: false, checkInTime: null, elapsedSeconds: 0 });
        }
      },
    }),
    {
      name: 'time-tracker-storage',
    }
  )
);
