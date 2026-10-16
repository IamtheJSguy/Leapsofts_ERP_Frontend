import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Select,
  MenuItem,
  Tooltip,
  Divider,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import {
  useAiConfig,
  useAiConversations,
  useAiConversation,
  useSendAiMessage,
  useDeleteAiConversation,
  useEnrichLeadWithAi,
  type AiProviderType,
  type AiMessage,
} from '@/hooks/api/useAi';
import { useUIStore } from '@/store/useUIStore';
import { showApiError } from '@/utils/apiError';
import { tokens } from '@/styles/tokens';
import { AiActionPreviewCard } from './AiActionPreviewCard';
import { AiApiKeyModal } from './AiApiKeyModal';

const STARTER_PROMPTS = [
  'What meetings do I have scheduled this week?',
  'Show me the sales team progress report for this week',
  'Search leads and enrich missing phone, email & company details',
  'Get my profile details and daily KPI summary',
  'Book a meeting — ask me for time and participants',
];

const formatTokenCount = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

export const AiAssistantDrawer = () => {
  const aiDrawerOpen = useUIStore((s) => s.aiDrawerOpen);
  const aiContextLeadId = useUIStore((s) => s.aiContextLeadId);
  const setAiDrawerOpen = useUIStore((s) => s.setAiDrawerOpen);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const { data: config } = useAiConfig({ enabled: aiDrawerOpen });
  const { data: conversations = [] } = useAiConversations({ enabled: aiDrawerOpen });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [provider, setProvider] = useState<AiProviderType>('gemini');
  const [input, setInput] = useState('');
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  const { data: activeConversation, isLoading: isLoadingConv } =
    useAiConversation(activeConversationId);
  const sendMessage = useSendAiMessage();
  const enrichLeadWithAi = useEnrichLeadWithAi();
  const deleteConversation = useDeleteAiConversation();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAutoEnrichedLeadRef = useRef<string | null>(null);

  useEffect(() => {
    if (config?.preferredProvider) {
      setProvider(config.preferredProvider);
    }
  }, [config?.preferredProvider]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages?.length, sendMessage.isPending, enrichLeadWithAi.isPending]);

  // If opened with a specific contextLeadId, automatically select or start enrichment if requested
  useEffect(() => {
    if (!aiDrawerOpen || !aiContextLeadId) return;
    const existingForLead = conversations.find((c) => c.contextLeadId === aiContextLeadId);
    if (existingForLead) {
      setActiveConversationId(existingForLead._id);
    }
  }, [aiDrawerOpen, aiContextLeadId, conversations]);

  const handleSend = (promptOverride?: string) => {
    const text = (promptOverride ?? input).trim();
    if (!text || sendMessage.isPending) return;
    if (!promptOverride) setInput('');

    sendMessage.mutate(
      {
        conversationId: activeConversationId ?? undefined,
        message: text,
        provider,
        contextLeadId: aiContextLeadId ?? undefined,
      },
      {
        onSuccess: (res) => {
          setActiveConversationId(res.conversation._id);
        },
        onError: (err: unknown) => {
          showApiError(err);
        },
      },
    );
  };

  const handleEnrichActiveLead = () => {
    if (!aiContextLeadId || enrichLeadWithAi.isPending) return;
    lastAutoEnrichedLeadRef.current = aiContextLeadId;
    enrichLeadWithAi.mutate(
      {
        leadId: aiContextLeadId,
        provider,
        conversationId: activeConversationId ?? undefined,
      },
      {
        onSuccess: (res) => {
          setActiveConversationId(res.conversation._id);
        },
        onError: (err) => showApiError(err),
      },
    );
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setInput('');
  };

  const handleDeleteCurrentChat = () => {
    if (!activeConversationId) return;
    const idToRemove = activeConversationId;
    deleteConversation.mutate(idToRemove, {
      onSuccess: () => {
        setActiveConversationId(null);
      },
      onError: (err) => showApiError(err),
    });
  };

  const messages: AiMessage[] = activeConversation?.messages ?? [];
  const hasActiveByok =
    provider === 'gemini' ? Boolean(config?.hasGeminiKey) : Boolean(config?.hasClaudeKey);

  return (
    <>
      <Drawer
        anchor="right"
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 460, md: 520 },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: isDarkMode ? '#141218' : '#ffffff',
            borderLeft: `1px solid ${tokens.surface.border}`,
          },
        }}
      >
        {/* Top Bar */}
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${tokens.surface.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: isDarkMode
                    ? 'rgba(138, 63, 252, 0.2)'
                    : 'rgba(93, 26, 137, 0.1)',
                  color: tokens.brand.primary,
                }}
              >
                <AutoAwesomeIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                  ERP AI Agent
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Enrich leads, check sales reports & automate tasks
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title="New Conversation">
                <IconButton size="small" onClick={handleNewChat}>
                  <AddCommentOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="API Keys & Token Quota">
                <IconButton size="small" onClick={() => setKeyModalOpen(true)}>
                  <KeyOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => setAiDrawerOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Provider Switcher + Token Badge + Thread Selector */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Chip
                size="small"
                label="Gemini"
                onClick={() => setProvider('gemini')}
                color={provider === 'gemini' ? 'primary' : 'default'}
                variant={provider === 'gemini' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, cursor: 'pointer' }}
              />
              <Chip
                size="small"
                label="Claude"
                onClick={() => setProvider('claude')}
                color={provider === 'claude' ? 'primary' : 'default'}
                variant={provider === 'claude' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, cursor: 'pointer' }}
              />
            </Box>

            <Chip
              size="small"
              icon={<KeyOutlinedIcon sx={{ fontSize: '14px !important' }} />}
              onClick={() => setKeyModalOpen(true)}
              label={
                hasActiveByok
                  ? `${provider === 'gemini' ? 'Gemini' : 'Claude'} Personal Key Active`
                  : `${formatTokenCount(config?.tokensUsed ?? 0)} / ${formatTokenCount(
                      config?.effectiveTokenLimit ?? 10000,
                    )} tokens`
              }
              color={
                hasActiveByok
                  ? 'success'
                  : (config?.remainingTokens ?? 1) === 0
                  ? 'error'
                  : 'default'
              }
              variant="outlined"
              sx={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem' }}
            />
          </Box>

          {/* Thread History Dropdown & Active Lead Quick Enrich */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Select
              size="small"
              fullWidth
              displayEmpty
              value={activeConversationId ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                setActiveConversationId(v ? String(v) : null);
              }}
              sx={{
                fontSize: '0.8rem',
                borderRadius: '10px',
                '& .MuiSelect-select': { py: 0.75 },
              }}
            >
              <MenuItem value="">
                <em>New AI Chat Session</em>
              </MenuItem>
              {conversations.map((c) => (
                <MenuItem key={c._id} value={c._id} sx={{ fontSize: '0.8rem' }}>
                  {c.title} ({c.provider})
                </MenuItem>
              ))}
            </Select>
            {activeConversationId && (
              <Tooltip title="Delete this conversation">
                <IconButton size="small" color="error" onClick={handleDeleteCurrentChat}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {aiContextLeadId && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.5,
                py: 0.75,
                borderRadius: '10px',
                bgcolor: isDarkMode
                  ? 'rgba(138, 63, 252, 0.12)'
                  : 'rgba(93, 26, 137, 0.06)',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Lead context linked
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                onClick={handleEnrichActiveLead}
                disabled={enrichLeadWithAi.isPending}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  py: 0.25,
                  bgcolor: tokens.brand.primary,
                }}
              >
                {enrichLeadWithAi.isPending ? 'Enriching...' : 'Enrich This Lead Now'}
              </Button>
            </Box>
          )}
        </Box>

        {/* Message List */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {isLoadingConv && activeConversationId ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ my: 'auto', textAlign: 'center', px: 2 }}>
              <AutoAwesomeIcon
                sx={{ fontSize: 42, color: tokens.brand.primary, opacity: 0.85, mb: 1 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                How can I help you today?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Ask me to enrich B2B leads using live web grounding, check sales team progress,
                view or book meetings, or update user/lead details.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {STARTER_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outlined"
                    size="small"
                    onClick={() => handleSend(prompt)}
                    sx={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: '12px',
                      py: 1,
                      px: 1.5,
                      borderColor: tokens.surface.border,
                      color: 'text.primary',
                    }}
                  >
                    {prompt}
                  </Button>
                ))}
              </Box>
            </Box>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <Box
                  key={m._id || idx}
                  sx={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: isUser ? '85%' : '96%',
                    width: m.pendingAction ? '100%' : 'auto',
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      bgcolor: isUser
                        ? tokens.brand.primary
                        : isDarkMode
                        ? 'rgba(255,255,255,0.06)'
                        : '#f4f2f7',
                      color: isUser ? '#fff' : 'text.primary',
                    }}
                  >
                    {/* Tool execution badges */}
                    {!isUser && m.toolCalls && m.toolCalls.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        {m.toolCalls.map((tc, tIdx) => (
                          <Chip
                            key={`${tc.name}-${tIdx}`}
                            size="small"
                            icon={<BuildCircleOutlinedIcon sx={{ fontSize: '13px !important' }} />}
                            label={tc.summary || tc.name}
                            sx={{
                              height: 20,
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              bgcolor: isDarkMode
                                ? 'rgba(255,255,255,0.08)'
                                : 'rgba(93, 26, 137, 0.08)',
                            }}
                          />
                        ))}
                      </Box>
                    )}

                    {isUser ? (
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.55,
                        }}
                      >
                        {m.content}
                      </Typography>
                    ) : (
                      <Box
                        sx={{
                          fontSize: '0.875rem',
                          lineHeight: 1.6,
                          wordBreak: 'break-word',
                          '& p': { m: 0, mb: 1 },
                          '& p:last-child': { mb: 0 },
                          '& h1, & h2, & h3, & h4': {
                            fontWeight: 800,
                            mt: 1.25,
                            mb: 0.5,
                            lineHeight: 1.3,
                          },
                          '& h1': { fontSize: '1.05rem' },
                          '& h2': { fontSize: '0.98rem' },
                          '& h3, & h4': { fontSize: '0.92rem' },
                          '& ul, & ol': {
                            pl: 2.5,
                            my: 0.75,
                          },
                          '& ul': { listStyleType: 'disc' },
                          '& ol': { listStyleType: 'decimal' },
                          '& li': { mb: 0.35 },
                          '& li > p': { mb: 0.25 },
                          '& strong': { fontWeight: 700 },
                          '& a': {
                            color: tokens.brand.primary,
                            textDecoration: 'underline',
                          },
                          '& code': {
                            px: 0.6,
                            py: 0.15,
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontFamily: 'monospace',
                            bgcolor: isDarkMode
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.06)',
                          },
                          '& pre': {
                            p: 1.25,
                            my: 1,
                            borderRadius: '8px',
                            overflowX: 'auto',
                            bgcolor: isDarkMode
                              ? 'rgba(0,0,0,0.35)'
                              : 'rgba(0,0,0,0.05)',
                            '& code': {
                              p: 0,
                              bgcolor: 'transparent',
                            },
                          },
                          '& table': {
                            width: '100%',
                            borderCollapse: 'collapse',
                            my: 1,
                            fontSize: '0.8rem',
                          },
                          '& th, & td': {
                            border: `1px solid ${tokens.surface.border}`,
                            px: 1,
                            py: 0.5,
                            textAlign: 'left',
                          },
                          '& th': {
                            fontWeight: 700,
                            bgcolor: isDarkMode
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.03)',
                          },
                          '& hr': {
                            border: 0,
                            borderTop: `1px solid ${tokens.surface.border}`,
                            my: 1.25,
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

                    {!isUser && m.tokenUsage && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.75,
                          opacity: 0.65,
                          fontSize: '0.66rem',
                        }}
                      >
                        {m.provider === 'claude' ? 'Claude' : 'Gemini'} ·{' '}
                        {m.tokenUsage.totalTokens.toLocaleString()} tokens
                        {m.tokenUsage.usingByok ? ' (Personal Key)' : ''}
                      </Typography>
                    )}
                  </Box>

                  {/* Interactive Before/After Diff Preview Card */}
                  {m.pendingAction && <AiActionPreviewCard action={m.pendingAction} />}
                </Box>
              );
            })
          )}

          {(sendMessage.isPending || enrichLeadWithAi.isPending) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1 }}>
              <CircularProgress size={18} sx={{ color: tokens.brand.primary }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {enrichLeadWithAi.isPending
                  ? 'Searching the web & enriching lead data...'
                  : `Running ${provider === 'claude' ? 'Claude' : 'Gemini'} agent...`}
              </Typography>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        {/* Composer */}
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            size="small"
            placeholder="Ask AI to enrich a lead, check sales progress, or book a meeting..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '14px',
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={() => handleSend()}
            disabled={!input.trim() || sendMessage.isPending || enrichLeadWithAi.isPending}
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              width: 40,
              height: 40,
              '&:hover': {
                bgcolor: tokens.brand.primary,
                opacity: 0.9,
              },
              '&.Mui-disabled': {
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              },
            }}
          >
            <SendRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Drawer>

      <AiApiKeyModal open={keyModalOpen} onClose={() => setKeyModalOpen(false)} />
    </>
  );
};
