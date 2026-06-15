import { useMemo, useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isPast } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  useTheme,
  Typography,
  InputAdornment,
  Autocomplete,
  Chip,
  Avatar,
  IconButton,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useMeetings, useCreateMeeting, useUpdateMeeting, useDeleteMeeting } from '@/hooks/api/useMeetings';
import { useUsers } from '@/hooks/api/useUsers';
import { meetingSchema, type MeetingFormData } from '@/utils/validators';
import { useUIStore } from '@/store/useUIStore';
import type { Meeting } from '@/types';
import { tokens } from '@/styles/tokens';
import LabelIcon from '@mui/icons-material/Label';
import VideocamIcon from '@mui/icons-material/Videocam';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAuth } from '@/hooks/useAuth';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface MeetingSchedulerProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  currentUser?: any;
}

export const MeetingScheduler = ({ dialogOpen, setDialogOpen, currentUser }: MeetingSchedulerProps) => {
  const { data: meetings = [] } = useMeetings();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const { data: dbUsers = [] } = useUsers();
  const addToast = useUIStore((s) => s.addToast);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Filter meetings to only show those the current user is a participant of
  const myMeetings = meetings.filter((m: Meeting) => {
    if (!currentUser) return false;
    const participantIds = (m.participants || []).map((p: any) =>
      typeof p === 'string' ? p : p._id
    );
    return participantIds.includes(currentUser._id);
  });

  // Check if the meeting was created by an admin
  const isCreatedByAdmin = (meeting: Meeting) => {
    if (!meeting.createdBy) return false;
    if (typeof meeting.createdBy === 'object' && (meeting.createdBy as any).role) {
      return (meeting.createdBy as any).role === 'admin';
    }
    return false; // can't determine without populated createdBy
  };

  // Can the current user edit or delete this meeting?
  const canEditOrDelete = (meeting: Meeting) => {
    if (isAdmin) return true;
    if (isCreatedByAdmin(meeting)) return false;
    if (!currentUser) return false;
    const creatorId = typeof meeting.createdBy === 'string'
      ? meeting.createdBy
      : (meeting.createdBy as any)?._id;
    return creatorId === currentUser._id;
  };

  const { register, handleSubmit, reset, setValue, control } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
  });

  const events = useMemo(
    () =>
      myMeetings.map((m: Meeting) => ({
        id: m._id,
        title: m.title,
        start: new Date(m.scheduledAt),
        end: new Date(m.scheduledAt),
        resource: m,
      })),
    [myMeetings],
  );

  useEffect(() => {
    if (dialogOpen) {
      if (editingMeeting) {
        setValue('title', editingMeeting.title);
        setValue('description', editingMeeting.description || '');
        setValue('meetingLink', editingMeeting.meetingLink || editingMeeting.link || '');
        setValue('scheduledAt', format(new Date(editingMeeting.scheduledAt), "yyyy-MM-dd'T'HH:mm"));
        const participantIds = (editingMeeting.participants || []).map((p: any) =>
          typeof p === 'string' ? p : p._id
        );
        setValue('participants', participantIds);
      } else {
        setValue('title', '');
        setValue('description', '');
        setValue('meetingLink', '');
        // Auto-add current user as first participant
        const defaultParticipants = currentUser?._id ? [currentUser._id] : [];
        setValue('participants', defaultParticipants);
        if (selectedSlot) {
          setValue('scheduledAt', format(selectedSlot, "yyyy-MM-dd'T'HH:mm"));
        } else {
          setValue('scheduledAt', format(new Date(), "yyyy-MM-dd'T'HH:mm"));
        }
      }
    }
  }, [dialogOpen, selectedSlot, editingMeeting, setValue, currentUser]);

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedSlot(null);
    setEditingMeeting(null);
    reset();
  };

  const handleDelete = () => {
    if (editingMeeting) {
      if (window.confirm("Are you sure you want to cancel this meeting?")) {
        deleteMeeting.mutate(editingMeeting._id, {
          onSuccess: () => {
            addToast({ message: 'Meeting canceled successfully', severity: 'success' });
            handleClose();
          }
        });
      }
    }
  };

  const onSubmit = (data: MeetingFormData) => {
    const payload = {
      title: data.title,
      description: data.description,
      meetingLink: data.meetingLink,
      scheduledAt: new Date(data.scheduledAt).toISOString(),
      participants: data.participants ?? [],
    };

    if (editingMeeting) {
      updateMeeting.mutate(
        { id: editingMeeting._id, data: payload },
        {
          onSuccess: () => {
            addToast({ message: 'Meeting updated successfully', severity: 'success' });
            handleClose();
          },
        }
      );
    } else {
      createMeeting.mutate(
        payload,
        {
          onSuccess: () => {
            addToast({ message: 'Meeting scheduled successfully', severity: 'success' });
            handleClose();
          },
        },
      );
    }
  };

  const eventPropGetter = (event: any) => {
    const past = isPast(new Date(event.start));
    return {
      style: {
        backgroundColor: past
          ? (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)')
          : tokens.brand.primary,
        color: past
          ? (isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)')
          : '#fff',
        borderRadius: '8px',
        border: 'none',
        fontSize: '0.8rem',
        fontWeight: 600,
        padding: '2px 8px',
      },
    };
  };

  return (
    <Box>
      <Box
        sx={{
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
          p: 3,
          borderRadius: '24px',
          border: '1px solid',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)',
          boxShadow: tokens.shadow.card,
          '& .rbc-calendar': {
            fontFamily: 'inherit',
            border: 'none',
          },
          '& .rbc-header': {
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            padding: '12px',
            fontWeight: 700,
            color: 'text.secondary',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
          '& .rbc-month-view': {
            border: 'none',
            borderRadius: '16px',
            overflow: 'hidden',
          },
          '& .rbc-month-row': {
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            minHeight: '90px',
            '&:last-child': {
              borderBottom: 'none',
            },
          },
          '& .rbc-day-bg': {
            borderRight: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            '&:last-child': {
              borderRight: 'none',
            },
          },
          '& .rbc-today': {
            bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.15) !important' : 'rgba(93, 26, 137, 0.04) !important',
          },
          '& .rbc-date-cell': {
            padding: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'text.primary',
            textAlign: 'center',
            '&.rbc-now': {
              '& a': {
                color: isDarkMode ? '#e0b3ff' : tokens.brand.primary,
                bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.3)' : 'rgba(93, 26, 137, 0.08)',
                px: 1,
                py: 0.5,
                borderRadius: '50%',
              }
            }
          },
          '& .rbc-off-range-bg': {
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.01)',
          },
          '& .rbc-event': {
            boxShadow: 'none',
            '&:focus': {
              outline: 'none',
            }
          },
          '& .rbc-row-segment': {
            padding: '3px 6px',
          },
          '& .rbc-toolbar': {
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            '& .rbc-toolbar-label': {
              fontSize: '1.2rem',
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: '-0.01em',
            },
            '& button': {
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
              color: 'text.primary',
              border: '1px solid',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              borderRadius: '24px',
              padding: '6px 18px',
              fontWeight: 650,
              fontSize: '0.82rem',
              transition: 'all 0.2s',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                borderColor: tokens.brand.primaryMuted,
              },
              '&.rbc-active': {
                bgcolor: tokens.brand.primary,
                color: '#fff',
                borderColor: tokens.brand.primary,
                '&:hover': {
                  bgcolor: tokens.brand.primaryDark,
                }
              }
            }
          }
        }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          onView={setView}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          style={{ height: 600 }}
          onSelectSlot={(slot) => {
            setSelectedSlot(slot.start);
            setDialogOpen(true);
          }}
          onSelectEvent={(event) => {
            const meeting: Meeting = event.resource;
            if (canEditOrDelete(meeting)) {
              setEditingMeeting(meeting);
              setDialogOpen(true);
            } else {
              setSelectedMeeting(meeting);
            }
          }}
          eventPropGetter={eventPropGetter}
          selectable
        />
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            border: '1px solid',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            bgcolor: 'background.paper',
            boxShadow: tokens.shadow.cardHover,
            overflow: 'hidden',
          }
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              Schedule Meeting
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 550, mt: 0.5 }}>
              Enter meeting details below to coordinate with your team.
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pb: 1, pt: 0, overflowX: 'hidden' }}>
            <TextField
              {...register('title')}
              label="Meeting Title"
              placeholder="e.g. Sales Weekly Sync"
              fullWidth
              sx={{
                mt: 1,
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LabelIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              {...register('description')}
              label="Description (optional)"
              placeholder="e.g. Weekly sync to review pipeline progress..."
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                }
              }}
            />
            <TextField
              {...register('meetingLink')}
              label="Meeting Link (URL)"
              placeholder="https://meet.google.com/..."
              fullWidth
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VideocamIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Controller
              name="participants"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={dbUsers}
                  getOptionLabel={(option) => {
                    const name = `${option.firstName || ''} ${option.lastName || ''}`.trim();
                    return name || option.email;
                  }}
                  value={dbUsers.filter(u => field.value?.includes(u._id))}
                  onChange={(_, newValue) => {
                    field.onChange(newValue.map(u => u._id));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Participants"
                      placeholder="Search team members..."
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '16px',
                        }
                      }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <GroupIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const initials = `${option.firstName?.charAt(0) || ''}${option.lastName?.charAt(0) || ''}`.toUpperCase() || '?';
                    const name = `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.email;
                    return (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                          {initials}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 650 }}>{name}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{option.email}</Typography>
                        </Box>
                      </Box>
                    );
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const name = `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.email;
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={option._id}
                          label={name}
                          size="small"
                          {...tagProps}
                          sx={{ borderRadius: '8px', fontWeight: 600 }}
                        />
                      );
                    })
                  }
                />
              )}
            />

            <TextField
              {...register('scheduledAt')}
              label="Date & Time"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1.5 }}>
            {editingMeeting && canEditOrDelete(editingMeeting) && (
              <Button
                onClick={handleDelete}
                disabled={deleteMeeting.isPending}
                sx={{
                  mr: 'auto',
                  px: 3,
                  py: 1,
                  borderRadius: '24px',
                  textTransform: 'none',
                  fontWeight: 650,
                  color: tokens.semantic.error,
                  bgcolor: isDarkMode ? 'rgba(196, 69, 69, 0.08)' : 'rgba(196, 69, 69, 0.05)',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(196, 69, 69, 0.15)' : 'rgba(196, 69, 69, 0.08)',
                  }
                }}
              >
                {deleteMeeting.isPending ? <CircularProgress size={20} color="error" /> : 'Delete Meeting'}
              </Button>
            )}
            <Button
              onClick={handleClose}
              sx={{
                px: 3,
                py: 1,
                borderRadius: '24px',
                textTransform: 'none',
                fontWeight: 650,
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMeeting.isPending || updateMeeting.isPending}
              sx={{
                px: 4,
                py: 1,
                borderRadius: '24px',
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: tokens.brand.primary,
                color: '#fff',
                '&:hover': {
                  bgcolor: tokens.brand.primaryDark,
                }
              }}
            >
              {createMeeting.isPending || updateMeeting.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                editingMeeting ? 'Save Changes' : 'Schedule'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Details Dialog for Non-Admin Users */}
      <Dialog
        open={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
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
          }
        }}
      >
        {selectedMeeting && (
          <>
            <DialogTitle sx={{ pb: 1, pt: 2, px: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '10px',
                  bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.15)' : 'rgba(93, 26, 137, 0.06)',
                  color: tokens.brand.primaryLight,
                  border: `1px solid ${isDarkMode ? 'rgba(123, 61, 168, 0.25)' : 'rgba(93, 26, 137, 0.08)'}`,
                }}>
                  Meeting Details
                </Box>
                <IconButton onClick={() => setSelectedMeeting(null)} size="small" sx={{ color: 'text.secondary' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 850, letterSpacing: '-0.02em', lineHeight: 1.3, color: 'text.primary' }}>
                {selectedMeeting.title}
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 1.5, overflowX: 'hidden' }}>
              {/* Timing Grid */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 2,
                  mb: 2.5,
                  p: 2,
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F9F8F7',
                  borderRadius: '16px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}`,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Scheduled Date
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <EventIcon sx={{ color: tokens.brand.primaryLight, fontSize: 18 }} />
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {format(new Date(selectedMeeting.scheduledAt), 'eeee, MMM d, yyyy')}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Scheduled Time
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <EventIcon sx={{ color: tokens.brand.primaryLight, fontSize: 18 }} />
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {format(new Date(selectedMeeting.scheduledAt), 'h:mm a')}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Organizer */}
              {(() => {
                if (!selectedMeeting.createdBy) return null;
                const createdById = typeof selectedMeeting.createdBy === 'string' ? selectedMeeting.createdBy : (selectedMeeting.createdBy as any)._id;
                const details = dbUsers.find((u: any) => u._id === createdById) || (typeof selectedMeeting.createdBy === 'object' ? selectedMeeting.createdBy : null);
                const name = details ? `${details.firstName || ''} ${details.lastName || ''}`.trim() : (typeof selectedMeeting.createdBy === 'string' ? selectedMeeting.createdBy : 'Unknown Organizer');
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
                        label={role.toUpperCase()}
                        size="small"
                        sx={{
                          borderRadius: '8px',
                          fontWeight: 750,
                          fontSize: '0.62rem',
                          bgcolor: role === 'admin' ? 'rgba(217, 82, 54, 0.08)' : 'rgba(93, 26, 137, 0.08)',
                          color: role === 'admin' ? '#d95236' : tokens.brand.primaryLight,
                        }}
                      />
                    </Box>
                  </Box>
                );
              })()}

              {/* Participants list */}
              {(() => {
                const createdById = selectedMeeting.createdBy 
                  ? (typeof selectedMeeting.createdBy === 'string' ? selectedMeeting.createdBy : (selectedMeeting.createdBy as any)._id) 
                  : null;
                const participantsToDisplay = selectedMeeting.participants?.filter(p => {
                  const id = typeof p === 'string' ? p : p._id;
                  return id !== createdById;
                }) || [];

                return (
                  <>
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
                          const id = typeof p === 'string' ? p : p._id;
                          const details = dbUsers.find((u: any) => u._id === id) || (typeof p === 'object' ? p : null);
                          const name = details ? `${details.firstName || ''} ${details.lastName || ''}`.trim() : (typeof p === 'string' ? p : 'Unknown Participant');
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
                          label={role.toUpperCase()}
                          size="small"
                          sx={{
                            borderRadius: '8px',
                            fontWeight: 750,
                            fontSize: '0.62rem',
                            bgcolor: role === 'admin' ? 'rgba(217, 82, 54, 0.08)' : 'rgba(93, 26, 137, 0.08)',
                            color: role === 'admin' ? '#d95236' : tokens.brand.primaryLight,
                          }}
                        />
                        </Box>
                      );
                    })
                  )}
                </Box>
              </>
            );
          })()}

          {/* Description */}
              {selectedMeeting.description && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F9F8F7',
                    borderRadius: '14px',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.75 }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {selectedMeeting.description}
                  </Typography>
                </Box>
              )}

              {/* Meeting Link detail */}
              {(selectedMeeting.meetingLink || selectedMeeting.link) && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.06)' : 'rgba(93, 26, 137, 0.03)',
                    borderRadius: '14px',
                    border: `1px solid ${isDarkMode ? 'rgba(123, 61, 168, 0.15)' : 'rgba(93, 26, 137, 0.08)'}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.75 }}>
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
                    onClick={() => window.open(selectedMeeting.meetingLink || selectedMeeting.link, '_blank', 'noopener,noreferrer')}
                  >
                    {selectedMeeting.meetingLink || selectedMeeting.link}
                  </Typography>
                </Box>
              )}
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                pb: 2.5,
                pt: 1,
                display: 'flex',
                gap: 1.5,
                justifyContent: 'flex-end',
              }}
            >
              <Button
                variant="outlined"
                onClick={() => setSelectedMeeting(null)}
                sx={{
                  py: 1,
                  px: 3,
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
              {(selectedMeeting.meetingLink || selectedMeeting.link) && (
                <Button
                  variant="contained"
                  startIcon={<VideocamIcon />}
                  endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                  onClick={() => window.open(selectedMeeting.meetingLink || selectedMeeting.link, '_blank', 'noopener,noreferrer')}
                  sx={{
                    py: 1,
                    px: 4,
                    borderRadius: '14px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    bgcolor: tokens.brand.primary,
                    color: '#fff',
                    '&:hover': {
                      bgcolor: tokens.brand.primaryDark,
                    }
                  }}
                >
                  Join Meeting
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

