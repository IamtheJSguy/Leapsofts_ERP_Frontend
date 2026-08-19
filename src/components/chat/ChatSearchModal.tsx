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
  IconButton,
  Box,
  Typography,
  InputAdornment,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { useSearchMessages } from '@/hooks/api/useChat';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateTime } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';
import { LinkifiedText } from './LinkifiedText';

interface ChatSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export const ChatSearchModal = ({ open, onClose }: ChatSearchModalProps) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const { data: results = [], isLoading } = useSearchMessages(debouncedQuery);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDarkMode ? '#1e1b24' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
          p: 1.5,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1, pr: 6, position: 'relative' }}>
        Search Messages
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          aria-label="Close search"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '12px !important' }}>
        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversation (min 3 characters)..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              },
            },
          }}
          aria-label="Search messages input"
        />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: tokens.brand.primary }} />
          </Box>
        ) : query.length > 2 && results.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              No messages found matching "{query}"
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 320, overflow: 'auto' }}>
            {results.map((msg: { _id: string; content: string; createdAt: string }) => (
              <ListItem
                key={msg._id}
                sx={{
                  px: 2,
                  py: 1.5,
                  mb: 1,
                  borderRadius: '12px',
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.008)',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`,
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      <LinkifiedText text={msg.content} />
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {formatDateTime(msg.createdAt)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};
