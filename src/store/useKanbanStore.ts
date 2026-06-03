import { create } from 'zustand';

interface KanbanState {
  activeDragId: string | null;
  overColumnId: string | null;
  setActiveDrag: (id: string | null) => void;
  setOverColumn: (id: string | null) => void;
  clearDrag: () => void;
}

export const useKanbanStore = create<KanbanState>((set) => ({
  activeDragId: null,
  overColumnId: null,
  setActiveDrag: (id) => set({ activeDragId: id }),
  setOverColumn: (id) => set({ overColumnId: id }),
  clearDrag: () => set({ activeDragId: null, overColumnId: null }),
}));
