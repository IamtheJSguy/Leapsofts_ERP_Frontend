import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { useSearchMessages } from '@/hooks/api/useChat';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateTime } from '@/utils/formatters';

interface ChatSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export const ChatSearchModal = ({ open, onClose }: ChatSearchModalProps) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const { data: results = [], isLoading } = useSearchMessages(debouncedQuery);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Search Messages</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search (min 3 characters)..."
          sx={{ mb: 2 }}
          aria-label="Search messages"
        />
        {isLoading ? (
          <CircularProgress />
        ) : (
          <List>
            {results.map((msg: { _id: string; content: string; createdAt: string }) => (
              <ListItem key={msg._id}>
                <ListItemText primary={msg.content} secondary={formatDateTime(msg.createdAt)} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};
