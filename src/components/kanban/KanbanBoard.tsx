import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Box, CircularProgress } from '@mui/material';
import { KanbanColumn } from './KanbanColumn';
import { CardDetailModal } from './CardDetailModal';
import { useKanbanBoard, useMoveCard } from '@/hooks/api/useKanban';
import { useKanbanStore } from '@/store/useKanbanStore';
import { EmptyState } from '@/components/common/EmptyState';

interface KanbanBoardProps {
  boardId?: string;
}

export const KanbanBoard = ({ boardId }: KanbanBoardProps) => {
  const { data: board, isLoading } = useKanbanBoard(boardId);
  const moveCard = useMoveCard(boardId);
  const { setActiveDrag, clearDrag } = useKanbanStore();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    clearDrag();
    const { active, over } = event;
    if (!over || !board) return;

    const cardId = active.id as string;
    const overColumnId = over.id as string;
    const targetColumn = board.columns.find(
      (c) => c._id === overColumnId || c.cards.some((card) => card._id === overColumnId),
    );
    if (!targetColumn) return;

    const position = targetColumn.cards?.length || 0;
    moveCard.mutate({ cardId, data: { columnId: targetColumn._id, position } });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!board) {
    return <EmptyState title="No board found" description="Create a Kanban board to get started." />;
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveDrag(e.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <Box className="kanban-board">
          {board.columns.map((column) => (
            <KanbanColumn
              key={column._id}
              column={column}
              onCardClick={setSelectedCardId}
            />
          ))}
        </Box>
        <DragOverlay />
      </DndContext>
      <CardDetailModal
        cardId={selectedCardId}
        open={!!selectedCardId}
        onClose={() => setSelectedCardId(null)}
      />
    </>
  );
};
