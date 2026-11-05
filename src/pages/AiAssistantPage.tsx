import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
  Drawer,
  alpha,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import CloseIcon from '@mui/icons-material/Close';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import {
  useAiConfig,
  useAiConversations,
  useAiConversation,
  useSendAiMessage,
  useDeleteAiConversation,
  useEnrichLeadWithAi,
  type AiConversationSummary,
} from '@/hooks/api/useAi';
import { useUIStore } from '@/store/useUIStore';
import {
  useAiChatSessionStore,
  getConvKey,
  NEW_CONV_KEY,
  isDraftKey,
  generateClientObjectId,
  type AiChatDisplayMessage,
} from '@/store/useAiChatSessionStore';
import { getApiErrorMessage, showApiError } from '@/utils/apiError';
import { tokens } from '@/styles/tokens';
import { AiActionPreviewCard } from '@/components/ai/AiActionPreviewCard';
import { AiApiKeyModal } from '@/components/ai/AiApiKeyModal';
import {
  AiAgentPhaseTimeline,
  AiCompletedPhasesSummary,
} from '@/components/ai/AiAgentPhaseTimeline';
import { AI_STARTER_PROMPTS, formatTokenCount } from '@/components/ai/aiUiConstants';

const formatRelativeDate = (iso: string): string => {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
};

export const AiAssistantPage = () => {
  const { conversationId: routeConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const aiContextLeadId = useUIStore((s) => s.aiContextLeadId);

  const activeConversationId = useAiChatSessionStore((s) => s.activeConversationId);
  const setActiveConversationId = useAiChatSessionStore((s) => s.setActiveConversationId);
  const provider = useAiChatSessionStore((s) => s.provider);
  const setProvider = useAiChatSessionStore((s) => s.setProvider);
  const drafts = useAiChatSessionStore((s) => s.drafts);
  const ephemeralByConv = useAiChatSessionStore((s) => s.ephemeralByConv);
  const pendingByConv = useAiChatSessionStore((s) => s.pendingByConv);
  const lastCompletedPhasesByConv = useAiChatSessionStore(
    (s) => s.lastCompletedPhasesByConv,
  );
  const appendEphemeralMessage = useAiChatSessionStore((s) => s.appendEphemeralMessage);
  const updateEphemeralMessages = useAiChatSessionStore((s) => s.updateEphemeralMessages);
  const clearConversationEphemeral = useAiChatSessionStore((s) => s.clearConversationEphemeral);
  const moveConversationState = useAiChatSessionStore((s) => s.moveConversationState);
  const setPendingOperation = useAiChatSessionStore((s) => s.setPendingOperation);
  const createDraftConversation = useAiChatSessionStore((s) => s.createDraftConversation);
  const removeDraft = useAiChatSessionStore((s) => s.removeDraft);
  const registerAbortController = useAiChatSessionStore((s) => s.registerAbortController);
  const unregisterAbortController = useAiChatSessionStore((s) => s.unregisterAbortController);
  const abortOperation = useAiChatSessionStore((s) => s.abortOperation);

  const { data: config } = useAiConfig();
  const { data: conversations = [], isLoading: isLoadingList } = useAiConversations();

  const [input, setInput] = useState('');
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});

  // Sync URL param <-> store activeConversationId
  useEffect(() => {
    if (routeConversationId && routeConversationId !== activeConversationId) {
      setActiveConversationId(routeConversationId);
    } else if (!routeConversationId && activeConversationId && !isDraftKey(activeConversationId)) {
      setActiveConversationId(null);
    }
  }, [routeConversationId]);

  const { data: activeConversation, isLoading: isLoadingConv } =
    useAiConversation(activeConversationId);
  const sendMessage = useSendAiMessage();
  const enrichLeadWithAi = useEnrichLeadWithAi();
  const deleteConversation = useDeleteAiConversation();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentConvKey = getConvKey(activeConversationId);
  const currentEphemeral = ephemeralByConv[currentConvKey] ?? [];
  const currentPendingOp = pendingByConv[currentConvKey];

  useEffect(() => {
    if (config?.preferredProvider) {
      setProvider(config.preferredProvider);
    }
  }, [config?.preferredProvider, setProvider]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [
    activeConversation?.messages?.length,
    currentEphemeral.length,
    Boolean(currentPendingOp),
    currentPendingOp?.phases?.length,
  ]);

  const handleSelectConversation = (id: string | null) => {
    setActiveConversationId(id);
    setMobileHistoryOpen(false);
    if (id && !isDraftKey(id)) {
      navigate(`/ai/${id}`, { replace: true });
    } else {
      navigate('/ai', { replace: true });
    }
  };

  const handleNewChat = () => {
    const hasRunningTask = Boolean(currentPendingOp);
    const hasMessages =
      currentEphemeral.length > 0 || (activeConversation?.messages?.length ?? 0) > 0;

    if (hasRunningTask || hasMessages || activeConversationId !== null) {
      createDraftConversation();
    } else {
      setActiveConversationId(null);
    }
    setMobileHistoryOpen(false);
    navigate('/ai', { replace: true });
  };

  const activeDraftKeys = Array.from(
    new Set([
      ...drafts,
      ...Object.keys(pendingByConv).filter(isDraftKey),
      ...Object.keys(ephemeralByConv).filter(isDraftKey),
    ]),
  ).filter((key) => {
    const isCurrent =
      key === activeConversationId || (activeConversationId === null && key === NEW_CONV_KEY);
    const hasPending = Boolean(pendingByConv[key]);
    const hasEphemeral = (ephemeralByConv[key]?.length ?? 0) > 0;
    return isCurrent || hasPending || hasEphemeral;
  });

  const handleDeleteConversation = (
    e: React.MouseEvent,
    conv: AiConversationSummary,
  ) => {
    e.stopPropagation();
    const idToRemove = conv._id;
    setDeletingIds((prev) => ({ ...prev, [idToRemove]: true }));

    deleteConversation.mutate(idToRemove, {
      onSuccess: () => {
        setDeletingIds((prev) => {
          const next = { ...prev };
          delete next[idToRemove];
          return next;
        });
        clearConversationEphemeral(idToRemove);
        setPendingOperation(idToRemove, null);
        if (useAiChatSessionStore.getState().activeConversationId === idToRemove) {
          handleSelectConversation(null);
        }
      },
      onError: (err) => {
        setDeletingIds((prev) => {
          const next = { ...prev };
          delete next[idToRemove];
          return next;
        });
        showApiError(err);
      },
    });
  };

  const handleSend = (promptOverride?: string) => {
    const text = (promptOverride ?? input).trim();
    if (!text || Boolean(currentPendingOp)) return;
    if (!promptOverride) setInput('');

    const originConvId = activeConversationId;
    const isNewDraft = !originConvId || isDraftKey(originConvId);
    const targetConvId = isNewDraft ? generateClientObjectId() : originConvId;
    const targetKey = targetConvId;
    const selectedProvider = provider;
    const tempUserMsgId = `temp-user-${Date.now()}`;
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const controller = new AbortController();
    registerAbortController(targetKey, controller);

    if (isNewDraft && originConvId && isDraftKey(originConvId)) {
      moveConversationState(originConvId, targetKey);
      removeDraft(originConvId);
    }
    if (isNewDraft) {
      setActiveConversationId(targetConvId);
      navigate(`/ai/${targetConvId}`, { replace: true });
    }

    // Clear any previous stopped/failed ephemeral markers for this conversation
    updateEphemeralMessages(targetKey, (prev) =>
      prev.filter((m) => !m.isStopped && !m.isError),
    );

    const optimisticUserMsg: AiChatDisplayMessage = {
      _id: tempUserMsgId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    appendEphemeralMessage(targetKey, optimisticUserMsg);
    setPendingOperation(targetKey, {
      conversationKey: targetKey,
      requestId,
      provider: selectedProvider,
      kind: 'chat',
      startedAt: Date.now(),
      phases: [],
    });

    sendMessage.mutate(
      {
        conversationId: targetConvId,
        message: text,
        provider: selectedProvider,
        contextLeadId: aiContextLeadId ?? undefined,
        requestId,
        signal: controller.signal,
      },
      {
        onSuccess: (res) => {
          unregisterAbortController(targetKey);
          const resolvedId = res.conversation._id;
          setPendingOperation(targetKey, null);
          updateEphemeralMessages(targetKey, (prev) =>
            prev.filter((m) => m._id !== tempUserMsgId && !m.isStopped),
          );
          if (resolvedId !== targetKey) {
            moveConversationState(targetKey, resolvedId);
            if (useAiChatSessionStore.getState().activeConversationId === targetKey) {
              setActiveConversationId(resolvedId);
              navigate(`/ai/${resolvedId}`, { replace: true });
            }
          }
        },
        onError: (err: unknown) => {
          unregisterAbortController(targetKey);
          if (
            (err as { name?: string })?.name === 'CanceledError' ||
            (err as { code?: string })?.code === 'ERR_CANCELED' ||
            (err as { response?: { status?: number } })?.response?.status === 499
          ) {
            setPendingOperation(targetKey, null);
            updateEphemeralMessages(targetKey, (prev) =>
              prev.map((m) =>
                m._id === tempUserMsgId ? { ...m, isOptimistic: false, isStopped: true } : m,
              ),
            );
            return;
          }

          const errorText = getApiErrorMessage(err);
          setPendingOperation(targetKey, null);
          updateEphemeralMessages(targetKey, (prev) => [
            ...prev.map((m) => (m._id === tempUserMsgId ? { ...m, isOptimistic: false } : m)),
            {
              _id: `err-${Date.now()}`,
              role: 'system',
              content: errorText,
              provider: selectedProvider,
              createdAt: new Date().toISOString(),
              isError: true,
              retryPrompt: text,
              failedUserMsgId: tempUserMsgId,
            },
          ]);
        },
      },
    );
  };

  const handleEnrichActiveLead = () => {
    if (!aiContextLeadId || Boolean(currentPendingOp)) return;

    const originConvId = activeConversationId;
    const isNewDraft = !originConvId || isDraftKey(originConvId);
    const targetConvId = isNewDraft ? generateClientObjectId() : originConvId;
    const targetKey = targetConvId;
    const selectedProvider = provider;
    const tempUserMsgId = `temp-enrich-${Date.now()}`;
    const requestId = `enrich-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const controller = new AbortController();
    registerAbortController(targetKey, controller);

    if (isNewDraft && originConvId && isDraftKey(originConvId)) {
      moveConversationState(originConvId, targetKey);
      removeDraft(originConvId);
    }
    if (isNewDraft) {
      setActiveConversationId(targetConvId);
      navigate(`/ai/${targetConvId}`, { replace: true });
    }

    updateEphemeralMessages(targetKey, (prev) =>
      prev.filter((m) => !m.isStopped && !m.isError),
    );

    appendEphemeralMessage(targetKey, {
      _id: tempUserMsgId,
      role: 'user',
      content: 'Enrich lead data with missing phone, email, and company details.',
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    });
    setPendingOperation(targetKey, {
      conversationKey: targetKey,
      requestId,
      provider: selectedProvider,
      kind: 'enrich',
      startedAt: Date.now(),
      phases: [],
    });

    enrichLeadWithAi.mutate(
      {
        leadId: aiContextLeadId,
        provider: selectedProvider,
        conversationId: targetConvId,
        requestId,
        signal: controller.signal,
      },
      {
        onSuccess: (res) => {
          unregisterAbortController(targetKey);
          const resolvedId = res.conversation._id;
          setPendingOperation(targetKey, null);
          updateEphemeralMessages(targetKey, (prev) =>
            prev.filter((m) => m._id !== tempUserMsgId && !m.isStopped),
          );
          if (resolvedId !== targetKey) {
            moveConversationState(targetKey, resolvedId);
            if (useAiChatSessionStore.getState().activeConversationId === targetKey) {
              setActiveConversationId(resolvedId);
              navigate(`/ai/${resolvedId}`, { replace: true });
            }
          }
        },
        onError: (err: unknown) => {
          unregisterAbortController(targetKey);
          if (
            (err as { name?: string })?.name === 'CanceledError' ||
            (err as { code?: string })?.code === 'ERR_CANCELED' ||
            (err as { response?: { status?: number } })?.response?.status === 499
          ) {
            setPendingOperation(targetKey, null);
            updateEphemeralMessages(targetKey, (prev) =>
              prev.map((m) =>
                m._id === tempUserMsgId ? { ...m, isOptimistic: false, isStopped: true } : m,
              ),
            );
            return;
          }

          const errorText = getApiErrorMessage(err);
          setPendingOperation(targetKey, null);
          updateEphemeralMessages(targetKey, (prev) => [
            ...prev.map((m) => (m._id === tempUserMsgId ? { ...m, isOptimistic: false } : m)),
            {
              _id: `err-${Date.now()}`,
              role: 'system',
              content: errorText,
              provider: selectedProvider,
              createdAt: new Date().toISOString(),
              isError: true,
            },
          ]);
        },
      },
    );
  };

  const handleContinue = () => {
    if (Boolean(currentPendingOp)) return;

    const targetConvId = activeConversationId;
    if (!targetConvId || isDraftKey(targetConvId)) return;
    const targetKey = targetConvId;
    const selectedProvider = provider;
    const requestId = `req-cont-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const controller = new AbortController();
    registerAbortController(targetKey, controller);

    updateEphemeralMessages(targetKey, (prev) =>
      prev.map((m) => (m.isStopped ? { ...m, isStopped: false } : m)),
    );

    setPendingOperation(targetKey, {
      conversationKey: targetKey,
      requestId,
      provider: selectedProvider,
      kind: 'chat',
      startedAt: Date.now(),
      phases: [],
    });

    sendMessage.mutate(
      {
        conversationId: targetConvId,
        message: 'continue',
        provider: selectedProvider,
        contextLeadId: aiContextLeadId ?? undefined,
        requestId,
        signal: controller.signal,
      },
      {
        onSuccess: () => {
          unregisterAbortController(targetKey);
          setPendingOperation(targetKey, null);
          updateEphemeralMessages(targetKey, (prev) => prev.filter((m) => !m.isStopped));
        },
        onError: (err: unknown) => {
          unregisterAbortController(targetKey);
          if (
            (err as { name?: string })?.name === 'CanceledError' ||
            (err as { code?: string })?.code === 'ERR_CANCELED' ||
            (err as { response?: { status?: number } })?.response?.status === 499
          ) {
            setPendingOperation(targetKey, null);
            updateEphemeralMessages(targetKey, (prev) =>
              prev.map((m) => ({ ...m, isStopped: true })),
            );
            return;
          }
          const errorText = getApiErrorMessage(err);
          setPendingOperation(targetKey, null);
          updateEphemeralMessages(targetKey, (prev) => [
            ...prev,
            {
              _id: `err-${Date.now()}`,
              role: 'system',
              content: errorText,
              provider: selectedProvider,
              createdAt: new Date().toISOString(),
              isError: true,
            },
          ]);
        },
      },
    );
  };

  const serverMessages: AiChatDisplayMessage[] = activeConversation?.messages ?? [];
  const currentEphemeralFiltered = currentEphemeral.filter(
    (e) =>
      !serverMessages.some(
        (s) => s._id === e._id || (s.role === e.role && s.content === e.content),
      ),
  );
  const messages: AiChatDisplayMessage[] = [...serverMessages, ...currentEphemeralFiltered];
  const hasActiveByok =
    provider === 'gemini' ? Boolean(config?.hasGeminiKey) : Boolean(config?.hasClaudeKey);

  const historySidebarContent = (
    <Box
      sx={{
        width: { xs: 280, md: 300 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${tokens.surface.border}`,
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.015)' : '#faf9fc',
        flexShrink: 0,
      }}
    >
      {/* New Chat Button Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${tokens.surface.border}` }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddCommentOutlinedIcon />}
          onClick={handleNewChat}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '12px',
            py: 1,
            bgcolor: tokens.brand.solid,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: tokens.brand.solid,
              opacity: 0.92,
              boxShadow: 'none',
            },
          }}
        >
          New Lumi Chat
        </Button>
      </Box>

      {/* Unsaved draft thread items (active or running in background) */}
      {activeDraftKeys.map((draftKey) => {
        const isCurrent =
          activeConversationId === draftKey ||
          (activeConversationId === null && draftKey === NEW_CONV_KEY);
        const isPending = Boolean(pendingByConv[draftKey]);
        const firstUserMsg = ephemeralByConv[draftKey]?.find(
          (m) => m.role === 'user',
        )?.content;
        const draftTitle = firstUserMsg
          ? firstUserMsg.slice(0, 36) + (firstUserMsg.length > 36 ? '...' : '')
          : 'New Lumi Chat';

        return (
          <Box key={draftKey} sx={{ px: 1.25, pt: 1 }}>
            <Box
              onClick={() => handleSelectConversation(draftKey === NEW_CONV_KEY ? null : draftKey)}
              sx={{
                p: 1.25,
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                bgcolor: isCurrent
                  ? isDarkMode
                    ? 'rgba(138, 63, 252, 0.18)'
                    : 'rgba(93, 26, 137, 0.1)'
                  : 'transparent',
                border: `1px solid ${
                  isCurrent
                    ? 'rgba(138, 63, 252, 0.35)'
                    : 'transparent'
                }`,
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  '& .draft-close-btn': { opacity: 1 },
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                {isPending ? (
                  <CircularProgress size={14} sx={{ color: tokens.brand.primary, flexShrink: 0 }} />
                ) : (
                  <AutoAwesomeIcon sx={{ fontSize: 16, color: tokens.brand.primary, flexShrink: 0 }} />
                )}
                <Typography variant="body2" noWrap sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  {draftTitle}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isPending && (
                  <Chip
                    size="small"
                    label="Running"
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                      color: 'primary.main',
                    }}
                  />
                )}
                <Tooltip title="Close chat">
                  <IconButton
                    size="small"
                    className="draft-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDraft(draftKey);
                    }}
                    sx={{
                      p: 0.25,
                      opacity: isCurrent ? 0.7 : 0,
                      transition: 'opacity 0.15s ease',
                      '&:hover': { opacity: 1, color: 'error.main' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        );
      })}

      {/* Conversations List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.25, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            px: 1,
            py: 0.5,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: '0.68rem',
          }}
        >
          Your Lumi Chats ({conversations.length})
        </Typography>

        {isLoadingList ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : conversations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
            <ChatBubbleOutlineRoundedIcon
              sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              No past chats yet
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Start a chat with Lumi to enrich leads or run sales reports.
            </Typography>
          </Box>
        ) : (
          conversations.map((conv) => {
            const isSelected = activeConversationId === conv._id;
            const isRunning = Boolean(pendingByConv[conv._id]);
            const isDeleting = Boolean(deletingIds[conv._id]);

            return (
              <Box
                key={conv._id}
                onClick={() => handleSelectConversation(conv._id)}
                sx={{
                  group: 'true',
                  p: 1.25,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  transition: 'all 0.15s ease',
                  bgcolor: isSelected
                    ? isDarkMode
                      ? 'rgba(138, 63, 252, 0.18)'
                      : 'rgba(93, 26, 137, 0.09)'
                    : 'transparent',
                  border: `1px solid ${
                    isSelected
                      ? isDarkMode
                        ? 'rgba(138, 63, 252, 0.35)'
                        : 'rgba(93, 26, 137, 0.22)'
                      : 'transparent'
                  }`,
                  '&:hover': {
                    bgcolor: isSelected
                      ? isDarkMode
                        ? 'rgba(138, 63, 252, 0.22)'
                        : 'rgba(93, 26, 137, 0.12)'
                      : isDarkMode
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(0,0,0,0.035)',
                  },
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {isRunning && (
                      <CircularProgress
                        size={12}
                        sx={{ color: tokens.brand.primary, flexShrink: 0 }}
                      />
                    )}
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        fontWeight: isSelected ? 700 : 600,
                        fontSize: '0.83rem',
                        color: 'text.primary',
                      }}
                    >
                      {conv.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.68rem',
                        color: 'text.secondary',
                        textTransform: 'capitalize',
                      }}
                    >
                      {conv.provider}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>
                      • {isRunning ? 'Generating...' : formatRelativeDate(conv.updatedAt)}
                    </Typography>
                  </Box>
                </Box>

                <Tooltip title="Delete chat">
                  <IconButton
                    size="small"
                    color="error"
                    disabled={isDeleting}
                    onClick={(e) => handleDeleteConversation(e, conv)}
                    sx={{
                      opacity: isSelected ? 0.9 : 0.55,
                      '&:hover': { opacity: 1, bgcolor: 'rgba(211, 47, 47, 0.1)' },
                    }}
                  >
                    {isDeleting ? (
                      <CircularProgress size={14} color="error" />
                    ) : (
                      <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        height: 'calc(100vh - 116px)',
        minHeight: 540,
        display: 'flex',
        borderRadius: '18px',
        overflow: 'hidden',
        border: `1px solid ${tokens.surface.border}`,
        bgcolor: isDarkMode ? '#141218' : '#ffffff',
        boxShadow: isDarkMode
          ? '0 12px 32px rgba(0,0,0,0.35)'
          : '0 8px 28px rgba(26, 22, 37, 0.05)',
      }}
    >
      {/* Left Sidebar for Desktop / Drawer for Mobile */}
      {isMobile ? (
        <Drawer
          open={mobileHistoryOpen}
          onClose={() => setMobileHistoryOpen(false)}
          PaperProps={{ sx: { width: 280 } }}
        >
          {historySidebarContent}
        </Drawer>
      ) : (
        historySidebarContent
      )}

      {/* Main Chat Pane */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Chat Top Header */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 1.75,
            borderBottom: `1px solid ${tokens.surface.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            {isMobile && (
              <IconButton size="small" onClick={() => setMobileHistoryOpen(true)}>
                <MenuOpenRoundedIcon />
              </IconButton>
            )}
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isDarkMode ? 'rgba(138, 63, 252, 0.2)' : 'rgba(93, 26, 137, 0.1)',
                color: tokens.brand.primary,
                flexShrink: 0,
              }}
            >
              <AutoAwesomeIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {activeConversation?.title || 'New Lumi Chat'}
              </Typography>
              {/* <Typography variant="caption" color="text.secondary" noWrap>
                Web-grounded B2B lead enrichment, sales analytics, meetings & profile management
              </Typography> */}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
              sx={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.74rem' }}
            />

            {aiContextLeadId && (
              <Button
                size="small"
                variant="contained"
                startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                onClick={handleEnrichActiveLead}
                disabled={Boolean(currentPendingOp)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderRadius: '10px',
                  bgcolor: tokens.brand.solid,
                }}
              >
                {currentPendingOp?.kind === 'enrich' ? 'Enriching...' : 'Enrich Linked Lead'}
              </Button>
            )}
          </Box>
        </Box>

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: { xs: 2, sm: 4 },
            py: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.25,
          }}
        >
          {isLoadingConv && activeConversationId && messages.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={30} />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ my: 'auto', maxWidth: 620, mx: 'auto', textAlign: 'center', px: 2 }}>
              <AutoAwesomeIcon
                sx={{ fontSize: 48, color: tokens.brand.primary, opacity: 0.85, mb: 1.5 }}
              />
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.75 }}>
                Hi, I’m Lumi, your ERP assistant
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
                Switch between Gemini and Claude at any time. Enrich leads with live web search,
                inspect sales team KPIs and outreach metrics, manage meetings, or propose profile
                and lead edits with interactive confirmation previews.
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.25,
                }}
              >
                {AI_STARTER_PROMPTS.map((prompt) => (
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
                      py: 1.25,
                      px: 1.75,
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
              const isErrorMsg = Boolean(m.isError || (m.role === 'system' && !m.isStopped));

              if (isErrorMsg) {
                const isKeyOrQuotaIssue =
                  /key|quota|token|exhausted|configured/i.test(m.content);
                return (
                  <Box
                    key={m._id || idx}
                    sx={{
                      alignSelf: 'flex-start',
                      maxWidth: 780,
                      width: '100%',
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '14px',
                        border: '1px solid rgba(211, 47, 47, 0.35)',
                        bgcolor: isDarkMode
                          ? 'rgba(211, 47, 47, 0.12)'
                          : 'rgba(211, 47, 47, 0.06)',
                        color: isDarkMode ? '#fca5a5' : '#b91c1c',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                        <ErrorOutlineRoundedIcon
                          sx={{ fontSize: 20, mt: 0.2, flexShrink: 0 }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              display: 'block',
                              mb: 0.25,
                            }}
                          >
                            {m.provider === 'claude' ? 'Claude' : 'Gemini'} Error
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              lineHeight: 1.5,
                            }}
                          >
                            {m.content}
                          </Typography>

                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.25 }}>
                            {m.retryPrompt && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<ReplayRoundedIcon sx={{ fontSize: 14 }} />}
                                disabled={Boolean(currentPendingOp)}
                                onClick={() => {
                                  updateEphemeralMessages(currentConvKey, (prev) =>
                                    prev.filter(
                                      (item) =>
                                        item._id !== m._id && item._id !== m.failedUserMsgId,
                                    ),
                                  );
                                  handleSend(m.retryPrompt);
                                }}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              >
                                Retry
                              </Button>
                            )}
                            {isKeyOrQuotaIssue && (
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                startIcon={<KeyOutlinedIcon sx={{ fontSize: 14 }} />}
                                onClick={() => setKeyModalOpen(true)}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              >
                                Configure API Key
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              }

              return (
                <Box
                  key={m._id || idx}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    width: '100%',
                    gap: 1.25,
                  }}
                >
                  <Box
                    sx={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: isUser ? '75%' : 820,
                      width: m.pendingAction ? '100%' : isUser ? 'fit-content' : 'auto',
                      p: 2,
                      borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      bgcolor: isUser
                        ? tokens.brand.primary
                        : isDarkMode
                        ? 'rgba(255,255,255,0.06)'
                        : '#f4f2f7',
                      color: isUser ? '#fff' : 'text.primary',
                    }}
                  >
                    {/* Completed Agent Phases & Tool execution badges */}
                    {!isUser && (
                      <AiCompletedPhasesSummary
                        toolCalls={m.toolCalls}
                        phases={
                          idx === messages.length - 1
                            ? lastCompletedPhasesByConv[currentConvKey]
                            : undefined
                        }
                        provider={m.provider}
                      />
                    )}

                    {isUser ? (
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.6,
                        }}
                      >
                        {m.content}
                      </Typography>
                    ) : (
                      <Box
                        sx={{
                          fontSize: '0.9rem',
                          lineHeight: 1.65,
                          wordBreak: 'break-word',
                          '& p': { m: 0, mb: 1 },
                          '& p:last-child': { mb: 0 },
                          '& h1, & h2, & h3, & h4': {
                            fontWeight: 800,
                            mt: 1.5,
                            mb: 0.5,
                            lineHeight: 1.3,
                          },
                          '& h1': { fontSize: '1.1rem' },
                          '& h2': { fontSize: '1.02rem' },
                          '& h3, & h4': { fontSize: '0.95rem' },
                          '& ul, & ol': {
                            pl: 2.5,
                            my: 0.75,
                          },
                          '& ul': { listStyleType: 'disc' },
                          '& ol': { listStyleType: 'decimal' },
                          '& li': { mb: 0.4 },
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
                            fontSize: '0.82rem',
                            fontFamily: 'monospace',
                            bgcolor: isDarkMode
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.06)',
                          },
                          '& pre': {
                            p: 1.5,
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
                            fontSize: '0.82rem',
                          },
                          '& th, & td': {
                            border: `1px solid ${tokens.surface.border}`,
                            px: 1.25,
                            py: 0.6,
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
                          mt: 0.85,
                          opacity: 0.65,
                          fontSize: '0.68rem',
                        }}
                      >
                        {m.provider === 'claude' ? 'Claude' : 'Gemini'} ·{' '}
                        {m.tokenUsage.totalTokens.toLocaleString()} tokens
                        {m.tokenUsage.usingByok ? ' (Personal Key)' : ''}
                      </Typography>
                    )}
                  </Box>

                  {/* Tareeqa 1 (ChatGPT style): Response stopped card on the assistant side (LEFT) */}
                  {m.isStopped && (
                    <Box
                      sx={{
                        alignSelf: 'flex-start',
                        maxWidth: 720,
                        width: '100%',
                      }}
                    >
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: '16px 16px 16px 4px',
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8f7fa',
                          border: `1px solid ${
                            isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'
                          }`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              bgcolor: '#ef4444',
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.82rem',
                              color: isDarkMode ? '#fca5a5' : '#b91c1c',
                              fontWeight: 500,
                            }}
                          >
                            Response generation was stopped.
                          </Typography>
                        </Box>

                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PlayArrowRoundedIcon sx={{ fontSize: '15px !important' }} />}
                          disabled={Boolean(currentPendingOp)}
                          onClick={handleContinue}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            py: 0.35,
                            px: 1.5,
                            borderRadius: '8px',
                            color: tokens.brand.primary,
                            borderColor: tokens.brand.primary,
                            bgcolor: isDarkMode
                              ? 'rgba(138, 63, 252, 0.08)'
                              : 'rgba(93, 26, 137, 0.05)',
                            '&:hover': {
                              borderColor: tokens.brand.primary,
                              bgcolor: isDarkMode
                                ? 'rgba(138, 63, 252, 0.16)'
                                : 'rgba(93, 26, 137, 0.1)',
                            },
                          }}
                        >
                          Continue generating
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Interactive Before/After Diff Preview Card */}
                  {m.pendingAction && <AiActionPreviewCard action={m.pendingAction} />}
                </Box>
              );
            })
          )}

          {currentPendingOp && (
            <AiAgentPhaseTimeline
              pendingOp={currentPendingOp}
              onStop={() => abortOperation(currentConvKey)}
            />
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        {/* Composer */}
        <Box sx={{ px: { xs: 2, sm: 4 }, py: 2, display: 'flex', alignItems: 'flex-end', gap: 1.25 }}>
          <TextField
            fullWidth
            multiline
            maxRows={5}
            size="small"
            placeholder="Ask Lumi to enrich a lead, check sales progress, or book a meeting..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && currentPendingOp) {
                e.preventDefault();
                abortOperation(currentConvKey);
              } else if (e.key === 'Enter' && !e.shiftKey) {
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
          {currentPendingOp ? (
            <Tooltip title="Stop generating (Esc)" arrow>
              <IconButton
                color="error"
                onClick={() => abortOperation(currentConvKey)}
                sx={{
                  bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)',
                  color: theme.palette.error.main,
                  width: 42,
                  height: 42,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                  '&:hover': {
                    bgcolor: theme.palette.error.main,
                    color: '#fff',
                  },
                }}
              >
                <StopRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <IconButton
              color="primary"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              sx={{
                bgcolor: tokens.brand.solid,
                color: '#fff',
                width: 42,
                height: 42,
                '&:hover': {
                  bgcolor: tokens.brand.solid,
                  opacity: 0.9,
                },
                '&.Mui-disabled': {
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                },
              }}
            >
              <SendRoundedIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      <AiApiKeyModal open={keyModalOpen} onClose={() => setKeyModalOpen(false)} />
    </Box>
  );
};

export default AiAssistantPage;
