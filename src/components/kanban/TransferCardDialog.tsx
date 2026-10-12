import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  Typography, Box, CircularProgress, Alert
} from '@mui/material';
import { useProjectBoards } from '@/hooks/api/useProjects';
import { useKanbanBoards } from '@/hooks/api/useKanban';
import type { KanbanBoard } from '@/types';

interface TransferCardDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  sourceBoard: KanbanBoard;
  cardAssigneeIds: string[];
  onSubmit: (targetBoardId: string, targetColumnId: string) => Promise<any>;
}

const getProjectId = (board?: KanbanBoard | null): string => {
  if (!board?.projectId) return '';
  if (typeof board.projectId === 'object' && (board.projectId as any)._id) {
    return String((board.projectId as any)._id);
  }
  return String(board.projectId);
};

export const TransferCardDialog: React.FC<TransferCardDialogProps> = ({
  open,
  onClose,
  title,
  submitLabel,
  sourceBoard,
  cardAssigneeIds,
  onSubmit,
}) => {
  const projectId = useMemo(() => getProjectId(sourceBoard), [sourceBoard]);
  const { data: projectBoards, isLoading: isProjectBoardsLoading } = useProjectBoards(
    open && projectId ? projectId : undefined
  );
  const { data: allKanbanBoards, isLoading: isAllBoardsLoading } = useKanbanBoards({
    enabled: open && !projectId,
  });

  const isBoardsLoading = projectId ? isProjectBoardsLoading : isAllBoardsLoading;
  const boardsList = (projectId ? projectBoards : allKanbanBoards) || [];

  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableBoards = useMemo(() => {
    if (!boardsList || boardsList.length === 0) return [];
    const sourceBoardId = String(sourceBoard._id);
    return boardsList.filter(b => {
      const bProjId = getProjectId(b);
      return (
        b.isActive !== false &&
        bProjId &&
        projectId &&
        bProjId === projectId &&
        String(b._id) !== sourceBoardId
      );
    });
  }, [boardsList, sourceBoard._id, projectId]);

  const selectedBoard = useMemo(() => {
    return availableBoards.find(b => String(b._id) === String(selectedBoardId));
  }, [availableBoards, selectedBoardId]);

  const removedAssigneesCount = useMemo(() => {
    if (!selectedBoard || cardAssigneeIds.length === 0) return 0;
    const destMemberIds = (selectedBoard.members || []).map((m: any) => {
      const u = m.userId;
      return typeof u === 'object' && u !== null && u._id ? String(u._id) : String(u || '');
    }).filter(Boolean);
    if (selectedBoard.ownerId) {
      const owner = selectedBoard.ownerId;
      destMemberIds.push(typeof owner === 'object' && (owner as any)._id ? String((owner as any)._id) : String(owner));
    }
    const validCount = cardAssigneeIds.filter(id => destMemberIds.includes(String(id))).length;
    return cardAssigneeIds.length - validCount;
  }, [selectedBoard, cardAssigneeIds]);

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedBoardId('');
    setSelectedColumnId('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedBoardId || !selectedColumnId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(selectedBoardId, selectedColumnId);
      handleClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
      <DialogContent sx={{ overflow: 'visible' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}
        
        {isBoardsLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : availableBoards.length === 0 ? (
          <Typography color="text.secondary" p={2} textAlign="center">
            No other boards available in this project.
          </Typography>
        ) : (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Destination Board</InputLabel>
              <Select
                value={selectedBoardId}
                label="Destination Board"
                onChange={(e) => {
                  setSelectedBoardId(e.target.value as string);
                  setSelectedColumnId('');
                }}
                disabled={isSubmitting}
              >
                {availableBoards.map(board => (
                  <MenuItem key={board._id} value={board._id}>
                    {board.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedBoard && (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Destination Column</InputLabel>
                <Select
                  value={selectedColumnId}
                  label="Destination Column"
                  onChange={(e) => setSelectedColumnId(e.target.value as string)}
                  disabled={isSubmitting}
                >
                  {(selectedBoard.columns || [])
                    .filter((c: any) => c.isActive !== false)
                    .map((col: any) => (
                      <MenuItem key={col._id} value={col._id}>
                        {col.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}
            
            {removedAssigneesCount > 0 && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: '12px' }}>
                {removedAssigneesCount} assignee{removedAssigneesCount > 1 ? 's' : ''} will be removed because they do not have access to the destination board.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isSubmitting} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!selectedBoardId || !selectedColumnId || isSubmitting}
          variant="contained" 
          sx={{ fontWeight: 700, borderRadius: '24px', textTransform: 'none', px: 3 }}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
