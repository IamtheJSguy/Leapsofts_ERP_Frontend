import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Checkbox,
  TextField,
  Link,
  Divider,
  useTheme,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  useConfirmAiAction,
  useRejectAiAction,
  type AiPendingAction,
} from '@/hooks/api/useAi';
import { useUIStore } from '@/store/useUIStore';
import { showApiError } from '@/utils/apiError';
import { tokens } from '@/styles/tokens';

const FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  prospectName: 'Prospect Name',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
  jobTitle: 'Job Title',
  website: 'Website',
  industry: 'Industry',
  location: 'Location',
  companySize: 'Company Size',
  profileUrl: 'LinkedIn URL',
  icp: 'ICP',
  notes: 'Notes',
  connectionStatus: 'Connection Status',
  messageStatus: 'Message Status',
  bio: 'Bio',
  shiftStart: 'Shift Start',
  shiftEnd: 'Shift End',
  title: 'Meeting Title',
  scheduledAt: 'Scheduled Time',
  description: 'Description',
  meetingLink: 'Meeting Link',
  participantNames: 'Participants',
};

const ACTION_TYPE_TITLES: Record<AiPendingAction['actionType'], string> = {
  enrich_lead: 'AI Lead Enrichment Preview',
  update_lead: 'Lead Edit Proposal',
  update_user: 'User Profile Edit Proposal',
  create_meeting: 'Meeting Booking Proposal',
};

interface AiActionPreviewCardProps {
  action: AiPendingAction;
  onConfirmed?: (action: AiPendingAction, entityResult: unknown) => void;
}

export const AiActionPreviewCard = ({
  action,
  onConfirmed,
}: AiActionPreviewCardProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const addToast = useUIStore((s) => s.addToast);
  const confirmAction = useConfirmAiAction();
  const rejectAction = useRejectAiAction();

  const proposedEntries = useMemo(
    () =>
      Object.entries(action.proposed || {}).filter(
        ([k, v]) => k !== 'participants' && v !== undefined && v !== null && String(v).trim() !== '',
      ),
    [action.proposed],
  );

  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const [k] of proposedEntries) {
      initial[k] = true;
    }
    return initial;
  });

  const [editedValues, setEditedValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [k, v] of proposedEntries) {
      initial[k] = String(v);
    }
    return initial;
  });

  const isPending = action.status === 'pending';

  const handleConfirm = () => {
    const overrides: Record<string, unknown> = {};
    for (const [k] of proposedEntries) {
      if (selectedFields[k]) {
        overrides[k] = editedValues[k];
      }
    }
    if (action.actionType === 'create_meeting' && action.proposed.participants) {
      overrides.participants = action.proposed.participants;
    }

    confirmAction.mutate(
      { actionId: action.actionId, overrides },
      {
        onSuccess: (res) => {
          addToast({
            message: `${ACTION_TYPE_TITLES[action.actionType]} applied successfully!`,
            severity: 'success',
          });
          onConfirmed?.(res.action, res.entityResult);
        },
        onError: (err) => showApiError(err),
      },
    );
  };

  const handleReject = () => {
    rejectAction.mutate(action.actionId, {
      onSuccess: () => {
        addToast({
          message: 'Proposal discarded',
          severity: 'info',
        });
      },
      onError: (err) => showApiError(err),
    });
  };

  if (proposedEntries.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        mt: 1.5,
        p: 2,
        borderRadius: '16px',
        border: `1px solid ${
          action.status === 'confirmed'
            ? 'rgba(45, 138, 94, 0.4)'
            : action.status === 'rejected'
            ? 'rgba(211, 47, 47, 0.3)'
            : isDarkMode
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(93, 26, 137, 0.2)'
        }`,
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#faf8fc',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ fontSize: 18, color: tokens.brand.primary }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {ACTION_TYPE_TITLES[action.actionType]} — {action.targetLabel}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={
            action.status === 'confirmed'
              ? 'Applied'
              : action.status === 'rejected'
              ? 'Discarded'
              : 'Needs Confirmation'
          }
          color={
            action.status === 'confirmed'
              ? 'success'
              : action.status === 'rejected'
              ? 'default'
              : 'warning'
          }
          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
        />
      </Box>

      {/* Diff Rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, my: 1.5 }}>
        {proposedEntries.map(([fieldKey]) => {
          const prevVal = action.before?.[fieldKey];
          const checked = Boolean(selectedFields[fieldKey]);
          return (
            <Box
              key={fieldKey}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                p: 1,
                borderRadius: '10px',
                bgcolor: isDarkMode ? 'rgba(0,0,0,0.25)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              }}
            >
              {isPending && (
                <Checkbox
                  size="small"
                  checked={checked}
                  onChange={(e) =>
                    setSelectedFields((prev) => ({ ...prev, [fieldKey]: e.target.checked }))
                  }
                  sx={{ p: 0.25, mt: 0.25 }}
                />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'text.secondary',
                    }}
                  >
                    {FIELD_LABELS[fieldKey] || fieldKey}
                  </Typography>
                  {prevVal ? (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.disabled',
                        textDecoration: 'line-through',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {String(prevVal)}
                    </Typography>
                  ) : (
                    <Chip
                      size="small"
                      label="New"
                      sx={{
                        height: 16,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        bgcolor: 'rgba(45, 138, 94, 0.12)',
                        color: tokens.semantic.success,
                      }}
                    />
                  )}
                </Box>
                {isPending ? (
                  <TextField
                    fullWidth
                    size="small"
                    disabled={!checked}
                    multiline={fieldKey === 'notes' || fieldKey === 'description'}
                    maxRows={3}
                    value={editedValues[fieldKey] ?? ''}
                    onChange={(e) =>
                      setEditedValues((prev) => ({ ...prev, [fieldKey]: e.target.value }))
                    }
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: '0.82rem',
                        py: 0.6,
                      },
                    }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                    {String(action.applied?.[fieldKey] ?? action.proposed[fieldKey] ?? '')}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Sources */}
      {action.sources && action.sources.length > 0 && (
        <Box sx={{ mb: isPending ? 1.5 : 0 }}>
          <Divider sx={{ mb: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
            Verified Web Sources:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {action.sources.map((src, idx) => (
              <Link
                key={`${src.url}-${idx}`}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.4,
                  fontSize: '0.72rem',
                  px: 1,
                  py: 0.25,
                  borderRadius: '8px',
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(93, 26, 137, 0.06)',
                }}
              >
                {src.title || src.url}
                <OpenInNewIcon sx={{ fontSize: 11 }} />
              </Link>
            ))}
          </Box>
        </Box>
      )}

      {/* Action Buttons */}
      {isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<CloseOutlinedIcon />}
            onClick={handleReject}
            disabled={confirmAction.isPending || rejectAction.isPending}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Discard
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={handleConfirm}
            disabled={
              confirmAction.isPending ||
              rejectAction.isPending ||
              Object.values(selectedFields).every((v) => !v)
            }
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: tokens.brand.primary,
            }}
          >
            {confirmAction.isPending ? 'Applying...' : 'Approve & Apply'}
          </Button>
        </Box>
      )}
    </Box>
  );
};
