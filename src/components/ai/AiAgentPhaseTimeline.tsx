import React, { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Typography,
  alpha,
  keyframes,
} from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import type { AiAgentPhaseItem, PendingAiOperation } from '@/store/useAiChatSessionStore';
import type { AiToolCallLog } from '@/hooks/api/useAi';

const pulseGlow = keyframes`
  0% { opacity: 0.65; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1.03); }
  100% { opacity: 0.65; transform: scale(0.98); }
`;

interface AiAgentPhaseTimelineProps {
  pendingOp: PendingAiOperation;
  compact?: boolean;
}

const getFallbackPhases = (
  pendingOp: PendingAiOperation,
  elapsedSec: number,
): AiAgentPhaseItem[] => {
  const providerName = pendingOp.provider === 'claude' ? 'Claude' : 'Gemini';

  if (pendingOp.kind === 'enrich') {
    const steps = [
      {
        stepId: 'fb_enrich_1',
        label: 'Loading lead record & checking company domain...',
        thresholdSec: 0,
      },
      {
        stepId: 'fb_enrich_2',
        label: 'Inspecting public company website & metadata...',
        thresholdSec: 0.6,
      },
      {
        stepId: 'fb_enrich_3',
        label: `Searching live web sources with ${providerName} grounding...`,
        thresholdSec: 1.8,
      },
      {
        stepId: 'fb_enrich_4',
        label: 'Comparing discovered fields & building approval card...',
        thresholdSec: 5.0,
      },
    ];

    const visible = steps.filter((s) => elapsedSec >= s.thresholdSec);
    return visible.map((s, idx) => ({
      stepId: s.stepId,
      label: s.label,
      status: idx === visible.length - 1 ? 'running' : 'completed',
      timestamp: new Date(pendingOp.startedAt + s.thresholdSec * 1000).toISOString(),
    }));
  }

  const chatSteps = [
    {
      stepId: 'fb_chat_1',
      label: `Connected to ${providerName} agent & verified workspace context`,
      thresholdSec: 0,
    },
    {
      stepId: 'fb_chat_2',
      label: 'Analyzing your request & planning tool actions...',
      thresholdSec: 0.4,
    },
    {
      stepId: 'fb_chat_3',
      label: 'Executing ERP tools & fetching live records...',
      thresholdSec: 2.2,
    },
    {
      stepId: 'fb_chat_4',
      label: 'Synthesizing final response...',
      thresholdSec: 5.5,
    },
  ];

  const visible = chatSteps.filter((s) => elapsedSec >= s.thresholdSec);
  return visible.map((s, idx) => ({
    stepId: s.stepId,
    label: s.label,
    status: idx === visible.length - 1 ? 'running' : 'completed',
    timestamp: new Date(pendingOp.startedAt + s.thresholdSec * 1000).toISOString(),
  }));
};

export const AiAgentPhaseTimeline: React.FC<AiAgentPhaseTimelineProps> = ({
  pendingOp,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [elapsedMs, setElapsedMs] = useState<number>(() =>
    Math.max(0, Date.now() - pendingOp.startedAt),
  );

  useEffect(() => {
    setElapsedMs(Math.max(0, Date.now() - pendingOp.startedAt));
    const timer = setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - pendingOp.startedAt));
    }, 200);
    return () => clearInterval(timer);
  }, [pendingOp.startedAt]);

  const elapsedSec = elapsedMs / 1000;
  const phases =
    pendingOp.phases && pendingOp.phases.length > 0
      ? pendingOp.phases
      : getFallbackPhases(pendingOp, elapsedSec);

  const activePhase =
    phases.find((p) => p.status === 'running') ?? phases[phases.length - 1];
  const providerLabel = pendingOp.provider === 'claude' ? 'Claude' : 'Gemini';

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          px: compact ? 1.75 : 2.25,
          py: compact ? 1.15 : 1.4,
          borderRadius: 2.5,
          width: '100%',
          maxWidth: compact ? '100%' : 560,
          border: '1px solid',
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.25),
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
          boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette.primary.main, 0.06)}`,
        }}
      >
        {/* Clickable Header Bar for Expand / Collapse */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          onClick={() => setExpanded((prev) => !prev)}
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: '#fff',
                flexShrink: 0,
                animation: `${pulseGlow} 2s ease-in-out infinite`,
              }}
            >
              <AutoAwesomeRoundedIcon sx={{ fontSize: 14 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="caption" fontWeight={700} color="text.primary" noWrap sx={{ display: 'block' }}>
                {pendingOp.kind === 'enrich'
                  ? `Lumi (${providerLabel}) Web Enrichment — Live Phases (${phases.length})`
                  : `Lumi (${providerLabel}) — Live Execution Phases (${phases.length})`}
              </Typography>
              {!expanded && activePhase && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: 'block', fontSize: '0.7rem' }}
                >
                  {activePhase.label}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Chip
              size="small"
              label={`${elapsedSec.toFixed(1)}s`}
              sx={{
                height: 20,
                fontSize: '0.68rem',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
              }}
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
              sx={{ p: 0.25, color: 'text.secondary' }}
            >
              {expanded ? (
                <ExpandLessRoundedIcon sx={{ fontSize: 18 }} />
              ) : (
                <ExpandMoreRoundedIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Stack>
        </Stack>

        {/* Live Step-by-Step Timeline */}
        <Collapse in={expanded} timeout="auto">
          <Stack spacing={0.85} sx={{ mt: 1.25 }}>
            {phases.map((step, index) => {
              const isRunning = step.status === 'running';
              const isCompleted = step.status === 'completed';
              const isLast = index === phases.length - 1;

              return (
                <Box key={step.stepId} sx={{ position: 'relative' }}>
                  <Stack direction="row" alignItems="flex-start" spacing={1.25}>
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        mt: 0.15,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isRunning ? (
                        <CircularProgress size={14} thickness={5} color="primary" />
                      ) : isCompleted ? (
                        <CheckCircleRoundedIcon
                          sx={{ fontSize: 16, color: 'success.main' }}
                        />
                      ) : (
                        <RadioButtonUncheckedRoundedIcon
                          sx={{ fontSize: 15, color: 'text.disabled' }}
                        />
                      )}
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontWeight: isRunning ? 700 : 500,
                          color: isRunning
                            ? 'text.primary'
                            : isCompleted
                            ? 'text.secondary'
                            : 'text.disabled',
                          lineHeight: 1.4,
                          transition: 'color 0.2s ease',
                        }}
                      >
                        {step.label}
                      </Typography>
                      {step.detail && (isRunning || isLast) && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            fontSize: '0.68rem',
                            color: 'primary.main',
                            opacity: 0.85,
                            mt: 0.15,
                          }}
                        >
                          {step.detail}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          {/* Subtle footer hint when a step takes longer */}
          {elapsedSec >= 6 && activePhase && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{
                display: 'block',
                mt: 1.1,
                pt: 0.85,
                borderTop: '1px dashed',
                borderColor: 'divider',
                fontSize: '0.68rem',
              }}
            >
              {pendingOp.kind === 'enrich'
                ? 'Verifying live public web sources & contact data — this can take a few seconds...'
                : 'Executing multi-step reasoning & ERP tools — hang tight...'}
            </Typography>
          )}
        </Collapse>
      </Paper>
    </Box>
  );
};

interface AiCompletedPhasesSummaryProps {
  toolCalls?: AiToolCallLog[];
  phases?: AiAgentPhaseItem[];
  provider?: string;
}

export const AiCompletedPhasesSummary: React.FC<AiCompletedPhasesSummaryProps> = ({
  toolCalls,
  phases,
  provider,
}) => {
  // Collapsed by default once the agent turn is done
  const [expanded, setExpanded] = useState(false);
  const providerName = provider === 'claude' ? 'Claude' : 'Gemini';

  const items: Array<{ key: string; label: string }> = [];
  if (phases && phases.length > 0) {
    for (const p of phases) {
      items.push({ key: p.stepId, label: p.label });
    }
  } else {
    items.push({
      key: 'init',
      label: `Connected to ${providerName} & analyzed request`,
    });
    if (toolCalls && toolCalls.length > 0) {
      toolCalls.forEach((tc, idx) => {
        items.push({
          key: `tc_${idx}_${tc.name}`,
          label: tc.summary || `Executed ${tc.name}`,
        });
      });
    }
    items.push({
      key: 'done',
      label: 'Synthesized final response',
    });
  }

  return (
    <Box
      sx={{
        mb: 1.1,
        px: 1.15,
        py: 0.65,
        borderRadius: '10px',
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette.success.main, 0.24),
        bgcolor: (theme) => alpha(theme.palette.success.main, 0.04),
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 14, color: 'success.main', flexShrink: 0 }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              color: 'success.main',
              lineHeight: 1.3,
            }}
          >
            Completed {items.length} agent phase{items.length === 1 ? '' : 's'}
            {toolCalls && toolCalls.length > 0
              ? ` · ${toolCalls.length} tool${toolCalls.length === 1 ? '' : 's'} used`
              : ''}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.25}>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.67rem',
              fontWeight: 600,
              color: 'text.secondary',
            }}
          >
            {expanded ? 'Hide' : 'Show'}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            sx={{ p: 0.15, color: 'text.secondary' }}
          >
            {expanded ? (
              <ExpandLessRoundedIcon sx={{ fontSize: 16 }} />
            ) : (
              <ExpandMoreRoundedIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Stack>
      </Stack>

      <Collapse in={expanded} timeout="auto">
        <Stack
          spacing={0.45}
          sx={{
            mt: 0.85,
            pt: 0.75,
            borderTop: '1px dashed',
            borderColor: (theme) => alpha(theme.palette.success.main, 0.2),
          }}
        >
          {items.map((item) => (
            <Stack key={item.key} direction="row" alignItems="flex-start" spacing={0.75}>
              <CheckCircleRoundedIcon
                sx={{ fontSize: 13, color: 'success.main', mt: 0.2, flexShrink: 0 }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.73rem',
                  color: 'text.secondary',
                  lineHeight: 1.35,
                }}
              >
                {item.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
};
