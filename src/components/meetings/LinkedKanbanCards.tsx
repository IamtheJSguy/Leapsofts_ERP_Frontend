import React from 'react';
import { Avatar, AvatarGroup, Box, Chip, Typography } from '@mui/material';
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { format } from 'date-fns';

import type { MeetingLinkedCard, User } from '@/types';
import { tokens } from '@/styles/tokens';

const PRIORITY_STYLES: Record<string, { label: string; bgcolor: string; color: string }> = {
  low: { label: 'Low', bgcolor: 'rgba(96,165,250,0.12)', color: '#3b82f6' },
  medium: { label: 'Medium', bgcolor: 'rgba(251,191,36,0.12)', color: '#d97706' },
  high: { label: 'High', bgcolor: 'rgba(251,146,60,0.12)', color: '#ea580c' },
  urgent: { label: 'Urgent', bgcolor: 'rgba(248,113,113,0.12)', color: '#dc2626' },
};

const personName = (user: User) =>
  `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '?';

const personInitials = (user: User) =>
  personName(user)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

const cardHref = (card: MeetingLinkedCard) => {
  const boardId = typeof card.boardId === 'object' && card.boardId ? (card.boardId as { _id?: string })._id : card.boardId;
  const projectId =
    typeof card.projectId === 'object' && card.projectId
      ? (card.projectId as { _id?: string })._id
      : card.projectId;
  if (!boardId) return null;
  return `/projects/${projectId || boardId}/boards/${boardId}?card=${card._id}`;
};

interface LinkedKanbanCardsProps {
  cards?: MeetingLinkedCard[];
  isDarkMode: boolean;
}

export const LinkedKanbanCards: React.FC<LinkedKanbanCardsProps> = ({ cards, isDarkMode }) => {
  if (!cards?.length) return null;

  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
        Linked Kanban {cards.length === 1 ? 'Card' : 'Cards'}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {cards.map((card) => {
          const href = cardHref(card);
          const priority = PRIORITY_STYLES[card.priority || ''] || PRIORITY_STYLES.medium;
          const assignees = (card.assignedTo || []).filter(
            (person): person is User => typeof person === 'object' && person !== null,
          );
          const statusLabel = card.isDone ? 'Done' : card.columnName || 'Open';

          return (
            <Box
              key={card._id}
              onClick={() => {
                if (href) window.open(href, '_blank', 'noopener,noreferrer');
              }}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                p: 1.5,
                borderRadius: '12px',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`,
                bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.08)' : 'rgba(93, 26, 137, 0.04)',
                cursor: href ? 'pointer' : 'default',
                transition: 'background 0.15s',
                '&:hover': href
                  ? {
                      bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.14)' : 'rgba(93, 26, 137, 0.08)',
                    }
                  : undefined,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  bgcolor: tokens.brand.primary,
                  color: '#fff',
                }}
              >
                <ViewKanbanOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {card.title}
                </Typography>
                {(card.boardName || card.columnName) && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {[card.boardName, card.columnName].filter(Boolean).join(' / ')}
                  </Typography>
                )}
                {card.description && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mt: 0.5,
                    }}
                  >
                    {card.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mt: 1 }}>
                  <Chip
                    label={statusLabel}
                    size="small"
                    sx={{
                      height: 22,
                      borderRadius: '8px',
                      fontWeight: 750,
                      fontSize: '0.62rem',
                      bgcolor: card.isDone ? 'rgba(16, 185, 129, 0.12)' : 'rgba(93, 26, 137, 0.1)',
                      color: card.isDone ? '#10B981' : tokens.brand.primaryLight,
                    }}
                  />
                  {card.priority && (
                    <Chip
                      label={priority.label}
                      size="small"
                      sx={{
                        height: 22,
                        borderRadius: '8px',
                        fontWeight: 750,
                        fontSize: '0.62rem',
                        bgcolor: priority.bgcolor,
                        color: priority.color,
                      }}
                    />
                  )}
                  {card.dueDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'text.secondary' }}>
                      <EventAvailableOutlinedIcon sx={{ fontSize: 14 }} />
                      <Typography variant="caption" sx={{ fontWeight: 650 }}>
                        {format(new Date(card.dueDate), 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                  )}
                </Box>
                {assignees.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <AvatarGroup
                      max={4}
                      sx={{
                        '& .MuiAvatar-root': {
                          width: 22,
                          height: 22,
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          border: '1px solid',
                          borderColor: 'background.paper',
                        },
                      }}
                    >
                      {assignees.map((person) => (
                        <Avatar key={person._id} alt={personName(person)}>
                          {personInitials(person)}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {assignees.length === 1 ? personName(assignees[0]) : `${assignees.length} assignees`}
                    </Typography>
                  </Box>
                )}
              </Box>
              {href && <OpenInNewIcon sx={{ color: tokens.brand.primaryLight, fontSize: 16, mt: 0.5, flexShrink: 0 }} />}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
