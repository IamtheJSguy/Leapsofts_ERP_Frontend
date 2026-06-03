import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Typography, Chip } from '@mui/material';
import type { KanbanCard as KanbanCardType } from '@/types';
import { getLeadDisplayName } from '@/utils/formatters';

interface KanbanCardProps {
  card: KanbanCardType;
  onClick: () => void;
}

export const KanbanCard = memo(({ card, onClick }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card._id,
  });

  const lead = typeof card.leadId === 'object' ? card.leadId : null;
  const title = card.title || (lead ? getLeadDisplayName(lead) : 'Card');

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      sx={{
        mb: 1,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="body2" fontWeight={600}>
          {title}
        </Typography>
        {lead?.company && (
          <Typography variant="caption" color="text.secondary">
            {lead.company}
          </Typography>
        )}
        {card.members && card.members.length > 0 && (
          <Chip label={`${card.members.length} members`} size="small" sx={{ mt: 0.5 }} />
        )}
      </CardContent>
    </Card>
  );
});

KanbanCard.displayName = 'KanbanCard';
