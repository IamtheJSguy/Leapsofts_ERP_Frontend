import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  Typography, Box, CircularProgress, Alert
} from '@mui/material';
import { useSalesBoards } from '@/hooks/api/useKanban';
import type { KanbanBoard } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

interface TransferCardDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  sourceBoard: KanbanBoard;
  cardAssigneeIds: string[];
  onSubmit: (targetBoardId: string, targetColumnId: string) => Promise<any>;
}

export const TransferCardDialog: React.FC<TransferCardDialogProps> = ({
  open,
  onClose,
  title,
  submitLabel,
  sourceBoard,
  cardAssigneeIds,
  onSubmit,
}) => {
  const { data: allSalesBoards, isLoading: isBoardsLoading } = useSalesBoards({ enabled: open });
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableBoards = useMemo(() => {
    if (!allSalesBoards) return [];
    return allSalesBoards.filter(b => b.projectId === sourceBoard.projectId && b._id !== sourceBoard._id);
  }, [allSalesBoards, sourceBoard]);

  const selectedBoard = useMemo(() => {
    return availableBoards.find(b => b._id === selectedBoardId);
  }, [availableBoards, selectedBoardId]);

  const removedAssigneesCount = useMemo(() => {
    if (!selectedBoard || cardAssigneeIds.length === 0) return 0;
    const destMemberIds = selectedBoard.members.map(m => m.userId.toString());
    if (selectedBoard.ownerId) destMemberIds.push(selectedBoard.ownerId.toString());
    const validCount = cardAssigneeIds.filter(id => destMemberIds.includes(id)).length;
    return cardAssigneeIds.length - validCount;
  }, [selectedBoard, cardAssigneeIds]);

  const handleSubmit = async () => {
    if (!selectedBoardId || !selectedColumnId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(selectedBoardId, selectedColumnId);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedBoardId('');
    setSelectedColumnId('');
    setError(null);
    onClose();
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
            No other Sales boards available in this project.
          </Typography>
        ) : (
          <Box sx={{ mt: 1, display: 'flex', flexDir: 'column', gap: 3 }}>
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
                  {selectedBoard.columns.filter(c => c.isActive !== false).map(col => (
                    <MenuItem key={col._id || col.id} value={col._id || col.id as string}>
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
