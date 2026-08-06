import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  useTheme,
  alpha,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EventIcon from '@mui/icons-material/Event';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import {
  useAssistantChat,
  useAssistantConversation,
  useAssistantConversations,
  useDeleteAssistantConversation,
} from '@/hooks/api/useAssistant';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import type { AssistantEntity, AssistantMessage, AiProvider } from '@/types';

const markdownSx = {
  fontWeight: 500,
  lineHeight: 1.55,
  fontSize: '0.88rem',
  '& p': { m: 0, mb: 0.75 },
  '& p:last-child': { mb: 0 },
  '& ul, & ol': { m: 0, pl: 2.25, mb: 0.75 },
  '& ul:last-child, & ol:last-child': { mb: 0 },
  '& li': { mb: 0.35 },
  '& li:last-child': { mb: 0 },
  '& strong': { fontWeight: 700 },
  '& a': {
    color: 'inherit',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
    wordBreak: 'break-word',
  },
  '& code': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.82em',
    px: 0.5,
    py: 0.15,
    borderRadius: 0.75,
    bgcolor: 'rgba(0,0,0,0.06)',
  },
  '& pre': {
    m: 0,
    mb: 0.75,
    p: 1,
    borderRadius: 1,
    overflowX: 'auto',
    bgcolor: 'rgba(0,0,0,0.06)',
  },
  '& pre:last-child': { mb: 0 },
  '& pre code': { p: 0, bgcolor: 'transparent' },
  '& h1, & h2, & h3, & h4': {
    m: 0,
    mb: 0.75,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  '& h1': { fontSize: '1.05rem' },
  '& h2': { fontSize: '1rem' },
  '& h3, & h4': { fontSize: '0.92rem' },
  '& blockquote': {
    m: 0,
    mb: 0.75,
    pl: 1.25,
    borderLeft: '3px solid rgba(0,0,0,0.18)',
    opacity: 0.9,
  },
  '& hr': {
    my: 1,
    border: 0,
    borderTop: '1px solid rgba(0,0,0,0.12)',
  },
} as const;

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  entities?: AssistantEntity[];
  provider?: AiProvider;
  pending?: boolean;
  error?: boolean;
}

interface AssistantChatProps {
  /** Compact drawer vs full page */
  variant?: 'compact' | 'full';
  onNavigateAway?: () => void;
  /** Extra actions rendered in the chat header (e.g. close / expand for bubble) */
  headerActions?: ReactNode;
}

const entityIcon = (type: AssistantEntity['type']) => {
  switch (type) {
    case 'lead':
      return <PersonOutlineIcon sx={{ fontSize: 14 }} />;
    case 'meeting':
      return <EventIcon sx={{ fontSize: 14 }} />;
    case 'task':
      return <ViewKanbanIcon sx={{ fontSize: 14 }} />;
    default:
      return null;
  }
};

const providerLabel = (provider?: AiProvider) => {
  if (!provider) return null;
  const map: Record<AiProvider, string> = {
    gemini: 'Gemini',
    kimi: 'Kimi',
    grok: 'Grok',
    openai: 'GPT',
    anthropic: 'Claude',
  };
  return map[provider] ?? provider;
};

export const AssistantChat = ({ variant = 'full', onNavigateAway, headerActions }: AssistantChatProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [historyAnchor, setHistoryAnchor] = useState<null | HTMLElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useAssistantConversations();
  const { data: conversationDetail, isLoading: detailLoading } =
    useAssistantConversation(conversationId);
  const chatMutation = useAssistantChat();
  const deleteMutation = useDeleteAssistantConversation();

  const isCompact = variant === 'compact';

  useEffect(() => {
    if (!conversationId || !conversationDetail?.messages) return;
    setLocalMessages(
      conversationDetail.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m: AssistantMessage) => ({
          id: m._id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          entities: m.entities,
          provider: m.provider,
        })),
    );
  }, [conversationId, conversationDetail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, chatMutation.isPending]);

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [conversations],
  );

  const startNewConversation = () => {
    setConversationId(null);
    setLocalMessages([]);
    setInput('');
    setHistoryAnchor(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const selectConversation = (id: string) => {
    setConversationId(id);
    setLocalMessages([]);
    setHistoryAnchor(null);
  };

  const handleDeleteConversation = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (conversationId === id) startNewConversation();
        addToast({ message: 'Conversation deleted.', severity: 'success' });
      },
      onError: () => {
        addToast({ message: 'Failed to delete conversation.', severity: 'error' });
      },
    });
  };

  const handleEntityClick = (entity: AssistantEntity) => {
    onNavigateAway?.();
    navigate(entity.route);
  };

  const handleSend = () => {
    const message = input.trim();
    if (!message || chatMutation.isPending) return;

    const tempUserId = `local-user-${Date.now()}`;
    const tempAssistantId = `local-assistant-${Date.now()}`;

    setLocalMessages((prev) => [
      ...prev,
      { id: tempUserId, role: 'user', content: message },
      {
        id: tempAssistantId,
        role: 'assistant',
        content: 'Thinking…',
        pending: true,
      },
    ]);
    setInput('');

    chatMutation.mutate(
      {
        conversationId: conversationId ?? undefined,
        message,
      },
      {
        onSuccess: (data) => {
          setConversationId(data.conversationId);
          setLocalMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantId
                ? {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: data.message,
                    entities: data.entities ?? [],
                    provider: data.provider,
                    pending: false,
                  }
                : m,
            ),
          );
        },
        onError: (err: any) => {
          const errMsg =
            err?.response?.data?.message ||
            'Sorry, I could not answer that. Please try again.';
          setLocalMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantId
                ? {
                    ...m,
                    content: errMsg,
                    pending: false,
                    error: true,
                  }
                : m,
            ),
          );
        },
      },
    );
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const surfaceBg = isDarkMode ? 'rgba(30, 27, 36, 0.95)' : '#fff';
  const mutedText = isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        bgcolor: surfaceBg,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: isCompact ? 2 : 3,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${tokens.brand.primary} 0%, ${tokens.brand.accent} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <SmartToyOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            Work Monitor
          </Typography>
          <Typography variant="caption" sx={{ color: mutedText }}>
            Ask about leads, meetings, and tasks
          </Typography>
        </Box>
        <Tooltip title="Conversation history">
          <IconButton
            size="small"
            onClick={(e) => setHistoryAnchor(e.currentTarget)}
            aria-label="Conversation history"
          >
            <HistoryIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="New conversation">
          <IconButton size="small" onClick={startNewConversation} aria-label="New conversation">
            <AddIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        {headerActions}
      </Box>

      <Menu
        anchorEl={historyAnchor}
        open={Boolean(historyAnchor)}
        onClose={() => setHistoryAnchor(null)}
        PaperProps={{
          sx: {
            width: 300,
            maxHeight: 360,
            borderRadius: '14px',
            mt: 1,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: mutedText }}>
            Recent conversations
          </Typography>
        </Box>
        <Divider />
        {conversationsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={22} sx={{ color: tokens.brand.primary }} />
          </Box>
        ) : sortedConversations.length === 0 ? (
          <Box sx={{ px: 2, py: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              No conversations yet.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {sortedConversations.map((c) => (
              <ListItemButton
                key={c._id}
                selected={c._id === conversationId}
                onClick={() => selectConversation(c._id)}
                sx={{ py: 1.1, px: 2 }}
              >
                <ListItemText
                  primary={c.title || 'Untitled'}
                  secondary={new Date(c.updatedAt).toLocaleString()}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    noWrap: true,
                  }}
                  secondaryTypographyProps={{ fontSize: '0.72rem' }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => handleDeleteConversation(c._id, e)}
                  aria-label="Delete conversation"
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        )}
        <Divider />
        <MenuItem onClick={startNewConversation} sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
          <AddIcon sx={{ fontSize: 18, mr: 1 }} />
          New conversation
        </MenuItem>
      </Menu>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: isCompact ? 2 : 3,
          py: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minHeight: 0,
        }}
      >
        {detailLoading && conversationId && localMessages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: tokens.brand.primary }} />
          </Box>
        ) : localMessages.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 2,
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                bgcolor: alpha(tokens.brand.primary, isDarkMode ? 0.2 : 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <SmartToyOutlinedIcon sx={{ color: tokens.brand.primary, fontSize: 28 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              How can I help?
            </Typography>
            <Typography variant="body2" sx={{ color: mutedText, maxWidth: 320 }}>
              Try “What meetings do I have this week?” or “Show my open tasks.”
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5, justifyContent: 'center' }}>
              {[
                'Summarize my workload',
                'Upcoming meetings',
                'Open tasks assigned to me',
              ].map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  clickable
                  onClick={() => {
                    setInput(suggestion);
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : alpha(tokens.brand.primary, 0.06),
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : alpha(tokens.brand.primary, 0.12)}`,
                  }}
                />
              ))}
            </Box>
          </Box>
        ) : (
          localMessages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <Box
                key={m.id}
                sx={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <Box
                  sx={{
                    maxWidth: '88%',
                    px: 2,
                    py: 1.35,
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    bgcolor: isUser
                      ? tokens.brand.primary
                      : isDarkMode
                        ? 'rgba(255,255,255,0.06)'
                        : alpha(tokens.brand.primary, 0.06),
                    color: isUser ? '#fff' : isDarkMode ? '#fff' : tokens.text.primary,
                    border: isUser
                      ? 'none'
                      : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : alpha(tokens.brand.primary, 0.1)}`,
                  }}
                >
                  {m.pending ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={14} sx={{ color: tokens.brand.primary }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Thinking…
                      </Typography>
                    </Box>
                  ) : isUser ? (
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        fontWeight: 500,
                        lineHeight: 1.55,
                        fontSize: '0.88rem',
                      }}
                    >
                      {m.content}
                    </Typography>
                  ) : (
                    <Box
                      sx={{
                        ...markdownSx,
                        color: m.error ? tokens.semantic.error : 'inherit',
                        '& code, & pre': {
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        },
                        '& blockquote': {
                          borderLeft: `3px solid ${isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)'}`,
                        },
                        '& hr': {
                          borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                        },
                      }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </Box>
                  )}

                  {!isUser && !m.pending && m.provider && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.75,
                        opacity: 0.55,
                        fontWeight: 600,
                        fontSize: '0.68rem',
                      }}
                    >
                      via {providerLabel(m.provider)}
                    </Typography>
                  )}

                  {!isUser && !m.pending && m.entities && m.entities.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.25 }}>
                      {m.entities.map((entity) => (
                        <Chip
                          key={`${entity.type}-${entity.id}`}
                          icon={entityIcon(entity.type) as ReactElement}
                          label={entity.title || entity.type}
                          size="small"
                          clickable
                          onClick={() => handleEntityClick(entity)}
                          deleteIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
                          onDelete={() => handleEntityClick(entity)}
                          sx={{
                            height: 26,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff',
                            border: `1px solid ${alpha(tokens.brand.primary, 0.2)}`,
                            '& .MuiChip-icon': { color: tokens.brand.primary },
                            '& .MuiChip-deleteIcon': { color: tokens.brand.primaryMuted },
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Input */}
      <Box
        sx={{
          px: isCompact ? 2 : 3,
          py: 2,
          borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          flexShrink: 0,
          display: 'flex',
          gap: 1,
          alignItems: 'flex-end',
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask about your work…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={chatMutation.isPending}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '14px',
              bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : alpha(tokens.brand.primary, 0.03),
              fontSize: '0.88rem',
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              },
              '&:hover fieldset': {
                borderColor: tokens.brand.primaryMuted,
              },
              '&.Mui-focused fieldset': {
                borderColor: tokens.brand.primary,
                borderWidth: 1,
              },
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!input.trim() || chatMutation.isPending}
          aria-label="Send message"
          sx={{
            minWidth: 44,
            width: 44,
            height: 40,
            borderRadius: '12px',
            bgcolor: tokens.brand.primary,
            boxShadow: 'none',
            p: 0,
            '&:hover': {
              bgcolor: tokens.brand.primaryDark,
              boxShadow: 'none',
            },
          }}
        >
          {chatMutation.isPending ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <SendIcon sx={{ fontSize: 18 }} />
          )}
        </Button>
      </Box>
    </Box>
  );
};
