import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { useCard, useAddComment } from '@/hooks/api/useKanban';
import { formatDateTime, getDisplayName } from '@/utils/formatters';
import { useUIStore } from '@/store/useUIStore';

interface CardDetailModalProps {
  cardId: string | null;
  open: boolean;
  onClose: () => void;
}

export const CardDetailModal = ({ cardId, open, onClose }: CardDetailModalProps) => {
  const { data: card, isLoading } = useCard(cardId || undefined);
  const addComment = useAddComment();
  const [comment, setComment] = useState('');
  const addToast = useUIStore((s) => s.addToast);

  const handleAddComment = () => {
    if (!cardId || !comment.trim()) return;
    addComment.mutate(
      { cardId, data: { text: comment } },
      {
        onSuccess: () => {
          setComment('');
          addToast({ message: 'Comment added', severity: 'success' });
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Card Details</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <CircularProgress />
        ) : card ? (
          <>
            <Typography variant="h6" gutterBottom>
              {card.title || 'Card'}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Comments
            </Typography>
            <List dense>
              {(card.comments || []).map((c) => (
                <ListItem key={c._id}>
                  <ListItemText
                    primary={c.text}
                    secondary={`${getDisplayName(typeof c.author === 'object' ? c.author : undefined)} — ${formatDateTime(c.createdAt)}`}
                  />
                </ListItem>
              ))}
            </List>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                aria-label="Comment"
              />
              <Button
                variant="contained"
                onClick={handleAddComment}
                disabled={addComment.isPending}
              >
                Send
              </Button>
            </Box>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
