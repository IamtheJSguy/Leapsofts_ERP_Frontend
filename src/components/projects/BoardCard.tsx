import { useMemo } from 'react';
import {
  Box,
  Typography,
  AvatarGroup,
  Avatar,
  Tooltip,
  useTheme,
  useMediaQuery,
  IconButton,
  Chip,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { tokens } from '@/styles/tokens';
import type { KanbanBoard, User } from '@/types';
import { useUsers } from '@/hooks/api/useUsers';
import { getBoardCategoryOption } from '@/lib/boardCategories';

interface BoardCardProps {
  board: KanbanBoard;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const BoardCard = ({ board, onClick, onEdit, onDelete }: BoardCardProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'));
  const { data: dbUsers = [] } = useUsers();
  const category = getBoardCategoryOption(board.category);

  const totalCards = useMemo(() => {
    if (typeof board.totalCards === 'number') return board.totalCards;
    return board.columns?.reduce(
      (acc, col) => acc + (col.totalCards ?? col.cards?.length ?? 0),
      0,
    ) || 0;
  }, [board.columns, board.totalCards]);

  // Resolve member users
  const boardMembers = useMemo(() => {
    return board.members
      ?.map((member) => {
        const userId = typeof member.userId === 'string' ? member.userId : member.userId?._id;
        return dbUsers.find((u) => u._id === userId);
      })
      .filter(Boolean) as User[];
  }, [board.members, dbUsers]);

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
        borderRadius: '24px',
        p: { xs: 2, sm: 3 },
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(26, 22, 37, 0.04)',
        ...(!isCompact && {
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: tokens.shadow.cardHover,
            borderColor: tokens.brand.primary,
          },
        }),
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ minWidth: 0, mb: 1, flex: '1 1 auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
            <FolderIcon sx={{ color: tokens.brand.primary, fontSize: 20, mt: 0.25, flexShrink: 0 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: 'text.primary',
                letterSpacing: '-0.01em',
                fontSize: { xs: '1rem', sm: '1.25rem' },
                lineHeight: 1.3,
                overflowWrap: 'break-word',
                minWidth: 0,
              }}
            >
              {board.name}
            </Typography>
          </Box>
          <Chip
            label={category.label}
            size="small"
            sx={{
              mt: 1.25,
              height: 24,
              color: category.color,
              bgcolor: category.backgroundColor,
              fontWeight: 700,
              fontSize: '0.7rem',
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0, ml: 0.5 }}>
          {onEdit && (
            <Tooltip title="Edit board" arrow>
              <IconButton
                size={isCompact ? 'medium' : 'small'}
                aria-label={`Edit ${board.name} board`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(e);
                }}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: tokens.brand.primary, bgcolor: 'rgba(255, 87, 51, 0.08)' },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete board" arrow>
              <IconButton
                size={isCompact ? 'medium' : 'small'}
                aria-label={`Delete ${board.name} board`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(e);
                }}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: tokens.semantic.error, bgcolor: 'rgba(239, 68, 68, 0.08)' },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
        {board.columns?.length || 0} columns · {totalCards} tasks
      </Typography>

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          pt: { xs: 1.5, sm: 2 },
          borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        }}
      >
        <AvatarGroup
          max={4}
          sx={{
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            '& .MuiAvatar-root': {
              width: { xs: 28, sm: 26 },
              height: { xs: 28, sm: 26 },
              fontSize: '0.68rem',
              fontWeight: 700,
              borderColor: isDarkMode ? '#1e1b24' : '#fff',
            },
          }}
        >
          {boardMembers.map((m, idx) => {
            const name = `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email || 'User';
            const initial = (m.firstName?.charAt(0) || m.email?.charAt(0) || 'U').toUpperCase();

            return (
              <Tooltip
                key={m._id || idx}
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {name}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                      {m.email}
                    </Typography>
                    {m.jobTitle && (
                      <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                        {m.jobTitle}
                      </Typography>
                    )}
                  </Box>
                }
                arrow
              >
                <Avatar src={m.avatarUrl || undefined} sx={{ bgcolor: tokens.brand.primaryMuted }}>{initial}</Avatar>
              </Tooltip>
            );
          })}
        </AvatarGroup>
      </Box>
    </Box>
  );
};
