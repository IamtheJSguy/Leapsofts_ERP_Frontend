import type { KanbanBoard, KanbanCard } from '@/types';

export const optimisticMoveCard = (
  board: KanbanBoard | undefined,
  cardId: string,
  data: { columnId: string; position: number },
): KanbanBoard | undefined => {
  if (!board) return board;

  let movedCard: KanbanCard | null = null;
  const columns = board.columns.map((col) => {
    const filtered = col.cards.filter((c) => {
      if (c._id === cardId) {
        movedCard = { ...c, columnId: data.columnId, position: data.position };
        return false;
      }
      return true;
    });
    return { ...col, cards: filtered };
  });

  if (!movedCard) return board;

  return {
    ...board,
    columns: columns.map((col) => {
      if (col._id !== data.columnId) return col;
      const cards = [...col.cards, movedCard!].sort((a, b) => a.position - b.position);
      return { ...col, cards };
    }),
  };
};
