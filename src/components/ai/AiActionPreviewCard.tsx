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
  FormControlLabel,
  Switch,
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
import { useCalendarStatus, useCalendarAuthUrl, openCalendarOAuthPopup } from '@/hooks/api/useCalendar';
import { useAuthStore } from '@/store/useAuthStore';
import {
  formatMeetingInstant,
  getDefaultMeetingTimeZone,
  utcToWallClock,
} from '@/utils/meetingTimezone';

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
  scheduledAt: 'Scheduled Time (UTC)',
  scheduledAtLocal: 'Scheduled Time (your timezone)',
  description: 'Description',
  meetingLink: 'Meeting Link',
  participantNames: 'Participants',
  guestEmails: 'External guest emails',
  timeZone: 'Timezone',
  durationMinutes: 'Duration (minutes)',
  sendGoogleInvite: 'Google Calendar',
};

const HIDDEN_PROPOSED_KEYS = new Set([
  'participants',
  'googleCalendarConnected',
  'sendGoogleInvite',
  'scheduledAt',
]);

const formatProposedFieldValue = (
  fieldKey: string,
  value: unknown,
  action: AiPendingAction,
  user?: { timezone?: string; timeZone?: string; organization?: { timezone?: string } },
): string => {
  if (fieldKey === 'guestEmails' && Array.isArray(value)) {
    return value.map((e) => String(e)).join(', ');
  }
  if (fieldKey === 'scheduledAtLocal' && typeof value === 'string') {
    return value;
  }
  if (fieldKey === 'scheduledAt' && typeof value === 'string') {
    const tz = String(
      action.proposed.timeZone || getDefaultMeetingTimeZone(user),
    );
    return utcToWallClock(value, tz);
  }
  return String(value);
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
  const { data: calendarStatus } = useCalendarStatus();
  const calendarAuth = useCalendarAuthUrl();
  const calendarConnected = calendarStatus?.connected === true;
  const user = useAuthStore((s) => s.user);
  const meetingTimeZone =
    action.actionType === 'create_meeting'
      ? String(action.proposed.timeZone || getDefaultMeetingTimeZone(user ?? undefined))
      : '';

  const proposedEntries = useMemo(
    () =>
      Object.entries(action.proposed || {}).filter(([k, v]) => {
        if (HIDDEN_PROPOSED_KEYS.has(k)) return false;
        if (v === undefined || v === null) return false;
        if (Array.isArray(v)) return v.length > 0;
        return String(v).trim() !== '';
      }),
    [action.proposed],
  );

  const [sendGoogleInvite, setSendGoogleInvite] = useState<boolean>(() => {
    if (action.actionType !== 'create_meeting') return false;
    if (action.proposed.sendGoogleInvite === true) return true;
    if (action.proposed.sendGoogleInvite === false) return false;
    return Boolean(action.proposed.googleCalendarConnected);
  });

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
      initial[k] = formatProposedFieldValue(k, v, action, user ?? undefined);
    }
    return initial;
  });

  const isPending = action.status === 'pending';

  const handleConfirm = () => {
    const overrides: Record<string, unknown> = {};
    for (const [k] of proposedEntries) {
      if (selectedFields[k]) {
        if (k === 'durationMinutes') {
          const n = Number(editedValues[k]);
          overrides[k] = Number.isFinite(n) ? n : action.proposed.durationMinutes;
        } else {
          overrides[k] = editedValues[k];
        }
      }
    }
    if (action.actionType === 'create_meeting' && action.proposed.participants) {
      overrides.participants = action.proposed.participants;
      overrides.sendGoogleInvite = sendGoogleInvite;
      overrides.timeZone =
        editedValues.timeZone || meetingTimeZone || action.proposed.timeZone;
      if (editedValues.scheduledAtLocal?.trim()) {
        overrides.scheduledAtLocal = editedValues.scheduledAtLocal.trim();
      }
      if (editedValues.guestEmails?.trim()) {
        overrides.guestEmails = editedValues.guestEmails
          .split(/[,;\n]+/)
          .map((e) => e.trim())
          .filter(Boolean);
      } else if (Array.isArray(action.proposed.guestEmails)) {
        overrides.guestEmails = action.proposed.guestEmails;
      }
      const link = String(overrides.meetingLink ?? editedValues.meetingLink ?? '').trim();
      if (sendGoogleInvite && !calendarConnected) {
        addToast({
          message: 'Connect Google Calendar first to book on Calendar and send invites.',
          severity: 'warning',
        });
        return;
      }
      if (!sendGoogleInvite && !link) {
        addToast({
          message: 'Add a meeting link or enable Google Calendar for this booking.',
          severity: 'warning',
        });
        return;
      }
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

      {action.actionType === 'create_meeting' && isPending && (
        <Box
          sx={{
            mb: 1.25,
            p: 1.25,
            borderRadius: '12px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(93, 26, 137, 0.15)'}`,
            bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fff',
          }}
        >
          {calendarConnected ? (
            <FormControlLabel
              control={
                <Switch
                  checked={sendGoogleInvite}
                  onChange={(e) => setSendGoogleInvite(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                  Create on Google Calendar and send invites
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', fontWeight: 500, mt: 0.25 }}
                  >
                    Generates a Google Meet link automatically if meeting link is left empty.
                  </Typography>
                </Typography>
              }
              sx={{ alignItems: 'flex-start', ml: 0, mr: 0 }}
            />
          ) : (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', mb: 0.75 }}>
                Google Calendar is not connected
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Connect your account to book meetings on Google Calendar with email invites and
                Meet links from AI booking.
              </Typography>
              <Button
                size="small"
                variant="outlined"
                disabled={calendarAuth.isPending}
                onClick={() => {
                  calendarAuth.mutate(undefined, {
                    onSuccess: (url) => openCalendarOAuthPopup(url),
                    onError: (err) => showApiError(err),
                  });
                }}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Connect Google Calendar
              </Button>
            </Box>
          )}
        </Box>
      )}

      {action.actionType === 'create_meeting' &&
        !isPending &&
        action.applied?.sendGoogleInvite === true && (
        <Chip
          size="small"
          label="Booked on Google Calendar"
          color="success"
          sx={{ mb: 1, fontWeight: 700, fontSize: '0.7rem' }}
        />
      )}

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
                    multiline={
                      fieldKey === 'notes' ||
                      fieldKey === 'description' ||
                      fieldKey === 'guestEmails'
                    }
                    maxRows={3}
                    placeholder={
                      fieldKey === 'scheduledAtLocal' ? '2026-10-20T17:00' : undefined
                    }
                    helperText={
                      fieldKey === 'scheduledAtLocal' && meetingTimeZone
                        ? `Wall-clock time in ${meetingTimeZone}. Saved as UTC in the database.`
                        : fieldKey === 'guestEmails'
                        ? 'Comma-separated emails for people outside your ERP workspace'
                        : undefined
                    }
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
                    {fieldKey === 'scheduledAtLocal' &&
                    (action.applied?.scheduledAt || action.proposed.scheduledAt) &&
                    meetingTimeZone
                      ? formatMeetingInstant(
                          String(action.applied?.scheduledAt ?? action.proposed.scheduledAt),
                          meetingTimeZone,
                        )
                      : fieldKey === 'guestEmails' && Array.isArray(action.applied?.guestEmails)
                      ? (action.applied.guestEmails as string[]).join(', ')
                      : String(action.applied?.[fieldKey] ?? action.proposed[fieldKey] ?? '')}
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
