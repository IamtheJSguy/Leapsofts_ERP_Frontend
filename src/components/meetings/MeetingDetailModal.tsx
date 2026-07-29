import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BusinessIcon from '@mui/icons-material/Business';
import VideocamIcon from '@mui/icons-material/Videocam';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { format } from 'date-fns';

import type { Meeting, User } from '@/types';
import { tokens } from '@/styles/tokens';
import { useUsers } from '@/hooks/api/useUsers';
import { useLeads } from '@/hooks/api/useLeads';
import { useAuth } from '@/hooks/useAuth';
import { MeetingReminderBadge } from './MeetingReminderBadge';

interface MeetingDetailModalProps {
  meeting: Meeting | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (meetingId: string) => void;
}

export const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({
  meeting,
  open,
  onClose,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { user: currentUser, isAdmin } = useAuth();

  const { data: allUsers = [] } = useUsers();
  const { data: leadsResponse } = useLeads();
  const allLeads = leadsResponse?.data || [];

  if (!meeting) return null;

  const joinUrl = meeting.meetingLink || meeting.link || '';

  // Helpers
  const getParticipantDetails = (p: string | User): User | undefined => {
    const targetId = typeof p === 'string' ? p : p?._id;
    const userFromStore = allUsers.find((u) => u._id === targetId);
    if (userFromStore) {
      return {
        ...(typeof p === 'object' && p !== null ? p : {}),
        ...userFromStore,
      };
    }
    if (typeof p === 'object' && p !== null) return p;
    return undefined;
  };

  const getLinkedLead = (leadId?: string | any) => {
    if (!leadId) return null;
    if (typeof leadId === 'object') {
      const name = `${leadId.firstName || ''} ${leadId.lastName || ''}`.trim() || leadId.company || 'Unknown Lead';
      return { id: leadId._id, name, company: leadId.company, email: leadId.email };
    }
    const found = allLeads.find((l) => l._id === leadId);
    if (found) {
      const name = `${found.firstName || ''} ${found.lastName || ''}`.trim() || found.company || 'Unknown Lead';
      return { id: found._id, name, company: found.company, email: found.email };
    }
    return null;
  };

  const canEditOrDelete = () => {
    if (!currentUser || !meeting) return false;
    if (isAdmin) return true;
    const createdById = typeof meeting.createdBy === 'object' ? meeting.createdBy._id : meeting.createdBy;
    return createdById === currentUser._id;
  };

  const createdById = meeting.createdBy
    ? typeof meeting.createdBy === 'string'
      ? meeting.createdBy
      : meeting.createdBy._id
    : null;

  const participantsToDisplay =
    meeting.participants?.filter((p) => {
      const id = typeof p === 'string' ? p : p._id;
      return id !== createdById;
    }) || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          border: '1px solid',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          p: 1,
          bgcolor: 'background.paper',
          boxShadow: tokens.shadow.cardHover,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2, px: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <MeetingReminderBadge scheduledAt={meeting.scheduledAt} status={meeting.status} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {canEditOrDelete() && onEdit && (
              <IconButton
                size="small"
                onClick={() => {
                  onEdit(meeting);
                  onClose();
                }}
                sx={{
                  color: tokens.brand.primaryLight,
                  bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.12)' : 'rgba(93, 26, 137, 0.06)',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.2)' : 'rgba(93, 26, 137, 0.12)',
                  },
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 850, letterSpacing: '-0.02em', lineHeight: 1.3, color: 'text.primary' }}>
          {meeting.title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 1.5, overflowX: 'hidden' }}>
        {/* Timing Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            mb: 2.5,
            p: 2,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F9F8F7',
            borderRadius: '16px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}`,
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scheduled Date
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <CalendarTodayIcon sx={{ color: tokens.brand.primaryLight, fontSize: 18 }} />
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {meeting.scheduledAt ? format(new Date(meeting.scheduledAt), 'eeee, MMM d, yyyy') : 'N/A'}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scheduled Time
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <AccessTimeIcon sx={{ color: tokens.brand.primaryLight, fontSize: 18 }} />
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {meeting.scheduledAt ? format(new Date(meeting.scheduledAt), 'h:mm a') : 'N/A'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Linked Lead */}
        {(() => {
          const linked = getLinkedLead(meeting.leadId);
          if (!linked) return null;
          const initials = linked.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'L';
          return (
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
                Linked Lead
              </Typography>
              <Box
                onClick={() => {
                  window.open(`/sales/leads/${linked.id}`, '_blank', 'noopener,noreferrer');
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.25,
                  borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`,
                  bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.08)' : 'rgba(93, 26, 137, 0.04)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.14)' : 'rgba(93, 26, 137, 0.08)',
                  },
                }}
              >
                <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', fontWeight: 800, bgcolor: tokens.brand.primary, color: '#fff' }}>
                  {initials}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {linked.name}
                  </Typography>
                  {(linked.company || linked.email) && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {linked.company ? (
                        <>
                          <BusinessIcon sx={{ fontSize: 12 }} />
                          {linked.company}
                        </>
                      ) : (
                        linked.email
                      )}
                    </Typography>
                  )}
                </Box>
                <PersonOutlineIcon sx={{ color: tokens.brand.primaryLight, fontSize: 18 }} />
              </Box>
            </Box>
          );
        })()}

        {/* Organizer */}
        {(() => {
          if (!meeting.createdBy) return null;
          const details = getParticipantDetails(meeting.createdBy);
          const name = details
            ? `${details.firstName || ''} ${details.lastName || ''}`.trim()
            : typeof meeting.createdBy === 'string'
            ? meeting.createdBy
            : 'Unknown Organizer';
          const email = details?.email || '';
          const role = details?.role || 'user';
          const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

          return (
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
                Organizer
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.25,
                  borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`,
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                }}
              >
                <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', fontWeight: 800, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  {initials}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {name}
                  </Typography>
                  {email && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      {email}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={role === 'admin' ? 'ADMIN' : role === 'manager' ? 'MANAGER' : 'EMPLOYEE'}
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    fontWeight: 750,
                    fontSize: '0.62rem',
                    bgcolor: role === 'admin' ? 'rgba(217, 82, 54, 0.08)' : role === 'manager' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(93, 26, 137, 0.08)',
                    color: role === 'admin' ? '#d95236' : role === 'manager' ? '#10B981' : tokens.brand.primaryLight,
                  }}
                />
              </Box>
            </Box>
          );
        })()}

        {/* Participants List */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
          Participants ({participantsToDisplay.length})
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
          {participantsToDisplay.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              No participants added yet.
            </Typography>
          ) : (
            participantsToDisplay.map((p, idx) => {
              const details = getParticipantDetails(p);
              const name = details
                ? `${details.firstName || ''} ${details.lastName || ''}`.trim()
                : typeof p === 'string'
                ? p
                : 'Unknown Participant';
              const email = details?.email || '';
              const role = details?.role || 'user';
              const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

              return (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.25,
                    borderRadius: '12px',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`,
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                  }}
                >
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', fontWeight: 800, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                    {initials}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {name}
                    </Typography>
                    {email && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {email}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={role === 'admin' ? 'ADMIN' : role === 'manager' ? 'MANAGER' : 'EMPLOYEE'}
                    size="small"
                    sx={{
                      borderRadius: '8px',
                      fontWeight: 750,
                      fontSize: '0.62rem',
                      bgcolor: role === 'admin' ? 'rgba(217, 82, 54, 0.08)' : role === 'manager' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(93, 26, 137, 0.08)',
                      color: role === 'admin' ? '#d95236' : role === 'manager' ? '#10B981' : tokens.brand.primaryLight,
                    }}
                  />
                </Box>
              );
            })
          )}
        </Box>

        {/* Description */}
        {meeting.description && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F9F8F7',
              borderRadius: '14px',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
            }}
          >
            <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.75 }}>
              Description
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
              {meeting.description}
            </Typography>
          </Box>
        )}

        {/* Meeting Link Detail */}
        {joinUrl && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.06)' : 'rgba(93, 26, 137, 0.03)',
              borderRadius: '14px',
              border: `1px solid ${isDarkMode ? 'rgba(123, 61, 168, 0.15)' : 'rgba(93, 26, 137, 0.08)'}`,
            }}
          >
            <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.75 }}>
              Meeting Link
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: tokens.brand.primaryLight,
                fontWeight: 650,
                wordBreak: 'break-all',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
              onClick={() => window.open(joinUrl, '_blank', 'noopener,noreferrer')}
            >
              {joinUrl}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
          pt: 1,
          flexDirection: 'column',
          gap: 1.5,
          alignItems: 'stretch',
        }}
      >
        {/* Delete option if available */}
        {canEditOrDelete() && onDelete && (
          <Button
            onClick={() => {
              onDelete(meeting._id);
              onClose();
            }}
            fullWidth
            sx={{
              py: 1,
              borderRadius: '14px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: tokens.semantic.error,
              bgcolor: isDarkMode ? 'rgba(196, 69, 69, 0.08)' : 'rgba(196, 69, 69, 0.05)',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(196, 69, 69, 0.15)' : 'rgba(196, 69, 69, 0.08)',
              },
            }}
          >
            Cancel Meeting
          </Button>
        )}

        {/* Main Action Row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              flex: 1,
              py: 1,
              borderRadius: '14px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'text.secondary',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
            }}
          >
            Close
          </Button>

          {canEditOrDelete() && onEdit && (
            <Button
              variant="contained"
              startIcon={<EditOutlinedIcon />}
              onClick={() => {
                onEdit(meeting);
                onClose();
              }}
              sx={{
                flex: 1,
                py: 1,
                borderRadius: '14px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                bgcolor: tokens.brand.primary,
                color: '#fff',
                '&:hover': {
                  bgcolor: tokens.brand.primaryDark,
                },
              }}
            >
              Edit Meeting
            </Button>
          )}

          {joinUrl && (
            <Button
              variant={canEditOrDelete() && onEdit ? 'outlined' : 'contained'}
              startIcon={<VideocamIcon />}
              endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
              onClick={() => window.open(joinUrl, '_blank', 'noopener,noreferrer')}
              sx={{
                flex: 1.5,
                py: 1,
                borderRadius: '14px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                ...(canEditOrDelete() && onEdit
                  ? {
                      borderColor: tokens.brand.primaryLight,
                      color: tokens.brand.primaryLight,
                      '&:hover': {
                        borderColor: tokens.brand.primaryDark,
                        bgcolor: 'rgba(93, 26, 137, 0.04)',
                      },
                    }
                  : {
                      bgcolor: tokens.brand.primary,
                      color: '#fff',
                      '&:hover': {
                        bgcolor: tokens.brand.primaryDark,
                      },
                    }),
              }}
            >
              Join Meeting
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};
