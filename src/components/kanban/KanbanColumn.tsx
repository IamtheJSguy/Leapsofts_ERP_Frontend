import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Box, Typography, Paper } from '@mui/material';
import { KanbanCard } from './KanbanCard';
import type { KanbanColumn as KanbanColumnType } from '@/types';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onCardClick: (cardId: string) => void;
}

export const KanbanColumn = ({ column, onCardClick }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column._id });

  return (
    <Paper
      ref={setNodeRef}
      className="kanban-column"
      sx={{
        p: 1.5,
        bgcolor: isOver ? 'action.hover' : 'grey.50',
        minHeight: 400,
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5, px: 0.5 }}>
        {column.name}
        <Typography component="span" variant="caption" sx={{ ml: 1 }}>
          ({column.cards?.length || 0})
        </Typography>
      </Typography>
      <SortableContext
        items={(column.cards || []).map((c) => c._id)}
        strategy={verticalListSortingStrategy}
      >
        <Box>
          {(column.cards || []).map((card) => (
            <KanbanCard key={card._id} card={card} onClick={() => onCardClick(card._id)} />
          ))}
        </Box>
      </SortableContext>
    </Paper>
  );
};
