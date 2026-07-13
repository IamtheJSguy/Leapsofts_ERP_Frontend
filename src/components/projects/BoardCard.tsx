import { useMemo } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  AvatarGroup,
  Avatar,
  Tooltip,
  useTheme,
  IconButton,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';
import { tokens } from '@/styles/tokens';
import type { KanbanBoard, User } from '@/types';
import { useUsers } from '@/hooks/api/useUsers';

interface BoardCardProps {
  board: KanbanBoard;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const BoardCard = ({ board, onClick, onDelete }: BoardCardProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { data: dbUsers = [] } = useUsers();

  const totalCards = useMemo(() => {
    return board.columns?.reduce((acc, col) => acc + (col.cards?.length || 0), 0) || 0;
  }, [board.columns]);

  const closedCards = useMemo(() => {
    const doneColumn = board.columns?.find(
      (col) =>
        col.name.toLowerCase() === 'closed' ||
        col.name.toLowerCase() === 'done' ||
        col.name.toLowerCase() === 'completed'
    );
    return doneColumn?.cards?.length || 0;
  }, [board.columns]);

  const progress = totalCards > 0 ? Math.round((closedCards / totalCards) * 100) : 0;

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
        p: 3,
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(26, 22, 37, 0.04)',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: tokens.shadow.cardHover,
          borderColor: tokens.brand.primary,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <FolderIcon sx={{ color: tokens.brand.primary, fontSize: 20 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em' }}>
            {board.name}
          </Typography>
        </Box>
        {onDelete && (
          <IconButton
            size="small"
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
        )}
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        {board.columns?.length || 0} columns · {totalCards} tasks
      </Typography>

      {totalCards > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Progress
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 800 }}>
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: '3px',
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              '& .MuiLinearProgress-bar': {
                bgcolor: tokens.brand.primary,
                borderRadius: '3px',
              },
            }}
          />
        </Box>
      )}

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pt: 2,
          borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        }}
      >
        <AvatarGroup
          max={4}
          sx={{
            '& .MuiAvatar-root': {
              width: 26,
              height: 26,
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
                <Avatar sx={{ bgcolor: tokens.brand.primaryMuted }}>{initial}</Avatar>
              </Tooltip>
            );
          })}
        </AvatarGroup>
      </Box>
    </Box>
  );
};
