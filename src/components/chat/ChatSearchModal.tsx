import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  IconButton,
  Box,
  Typography,
  InputAdornment,
  Chip,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { useSearchMessages } from '@/hooks/api/useChat';
import { useChatStore } from '@/store/useChatStore';
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
  const [searchAll, setSearchAll] = useState(false);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const navigate = useNavigate();

  // Reset query and scope whenever modal opens or closes
  useEffect(() => {
    setQuery('');
    setSearchAll(false);
  }, [open]);

  // Reset query and scope whenever active conversation/profile changes
  useEffect(() => {
    setQuery('');
    setSearchAll(false);
  }, [activeConversationId]);

  const handleClose = () => {
    setQuery('');
    setSearchAll(false);
    onClose();
  };

  const targetConversationId = searchAll ? undefined : (activeConversationId || undefined);
  const debouncedQuery = useDebounce(query);
  const { data: results = [], isLoading } = useSearchMessages(debouncedQuery, targetConversationId);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const handleSelectMessage = (msg: { _id: string; content: string; createdAt: string; conversationId?: string }) => {
    const targetConvId = msg.conversationId || activeConversationId;
    if (targetConvId) {
      setActiveConversation(targetConvId);
      navigate(`/chat/${targetConvId}?message=${msg._id}`);
    }
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          onClick={handleClose}
          sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          aria-label="Close search"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        {activeConversationId && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              size="small"
              label="This conversation"
              clickable
              color={!searchAll ? 'primary' : 'default'}
              variant={!searchAll ? 'filled' : 'outlined'}
              onClick={() => setSearchAll(false)}
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
            <Chip
              size="small"
              label="All conversations"
              clickable
              color={searchAll ? 'primary' : 'default'}
              variant={searchAll ? 'filled' : 'outlined'}
              onClick={() => setSearchAll(true)}
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>
        )}

        <TextField
          fullWidth
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            activeConversationId && !searchAll
              ? "Search in this conversation (min 3 characters)..."
              : "Search all conversations (min 3 characters)..."
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setQuery('')}
                  edge="end"
                  aria-label="Clear search"
                  sx={{ p: 0.5 }}
                >
                  <CloseIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                </IconButton>
              </InputAdornment>
            ) : null,
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
          <List sx={{ maxHeight: 320, overflow: 'auto', p: 0 }}>
            {results.map((msg: { _id: string; content: string; createdAt: string; conversationId?: string }) => (
              <ListItemButton
                key={msg._id}
                onClick={() => handleSelectMessage(msg)}
                sx={{
                  px: 2,
                  py: 1.5,
                  mb: 1,
                  borderRadius: '12px',
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.008)',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`,
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(93, 26, 137, 0.05)',
                  },
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
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};
