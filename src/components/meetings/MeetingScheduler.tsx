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
  Grid,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { ModernDatePicker } from '@/components/common/ModernDatePicker';
import { ModernTimePicker } from '@/components/common/ModernTimePicker';
import { GuestEmailChipInput } from '@/components/common/GuestEmailChipInput';
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
import { useAuth } from '@/hooks/useAuth';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MeetingDetailModal } from './MeetingDetailModal';
import { canEditOrDeleteMeeting } from '@/utils/meetingPermissions';
import { showApiError } from '@/utils/apiError';
import {
  getDefaultMeetingTimeZone,
  listCommonTimeZones,
  utcToWallClock,
  wallClockToUtcIso,
  getCalendarEventEnd,
} from '@/utils/meetingTimezone';
import { useCalendarStatus } from '@/hooks/api/useCalendar';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const fieldCaptionSx = {
  display: 'block',
  mb: 0.75,
  fontWeight: 700,
  color: 'text.secondary',
} as const;

const modernSelectFieldSx = (isDarkMode: boolean) => ({
  borderRadius: '12px',
  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb',
  fontWeight: 600,
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: tokens.brand.primaryMuted,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: tokens.brand.primary,
    borderWidth: 1,
  },
  '& .MuiSelect-select': {
    py: 1.25,
    px: 2,
    display: 'flex',
    alignItems: 'center',
  },
});

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
  const { user, isElevated } = useAuth();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const { data: calendarStatus } = useCalendarStatus();
  const calendarConnected = calendarStatus?.connected === true;
  const defaultTimeZone = getDefaultMeetingTimeZone(currentUser ?? user);
  const timeZoneOptions = useMemo(() => listCommonTimeZones(), []);

  // Filter meetings to only show those the current user is a participant of
  const myMeetings = meetings.filter((m: Meeting) => {
    if (!currentUser) return false;
    const participantIds = (m.participants || []).map((p: any) =>
      typeof p === 'string' ? p : p._id
    );
    const createdById = m.createdBy
      ? (typeof m.createdBy === 'string' ? m.createdBy : (m.createdBy as any)._id)
      : null;
    return participantIds.includes(currentUser._id) || createdById === currentUser._id;
  });

  const canEditOrDelete = (meeting: Meeting) =>
    canEditOrDeleteMeeting(meeting, currentUser ?? user, { isElevated, allUsers: dbUsers });

  const { register, handleSubmit, reset, setValue, control, setError, formState: { errors } } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      durationMinutes: 30,
      timeZone: defaultTimeZone,
      guestEmails: [],
      sendGoogleInvite: true,
    },
  });

  const events = useMemo(
    () =>
      myMeetings.map((m: Meeting) => {
        const start = new Date(m.scheduledAt);
        return {
          id: m._id,
          title: m.title,
          start,
          end: getCalendarEventEnd(start, m.durationMinutes),
          resource: m,
        };
      }),
    [myMeetings],
  );

  useEffect(() => {
    if (dialogOpen) {
      if (editingMeeting) {
        const tz = editingMeeting.timeZone || defaultTimeZone;
        setValue('title', editingMeeting.title);
        setValue('description', editingMeeting.description || '');
        setValue('meetingLink', editingMeeting.meetingLink || editingMeeting.link || '');
        setValue('scheduledAt', utcToWallClock(editingMeeting.scheduledAt, tz));
        setValue('timeZone', tz);
        setValue('durationMinutes', editingMeeting.durationMinutes ?? 30);
        setValue('guestEmails', editingMeeting.guestEmails ?? []);
        setValue('sendGoogleInvite', calendarConnected);
        const participantIds = (editingMeeting.participants || []).map((p: any) =>
          typeof p === 'string' ? p : p._id
        );
        setValue('participants', participantIds);
      } else {
        setValue('title', '');
        setValue('description', '');
        setValue('meetingLink', '');
        setValue('timeZone', defaultTimeZone);
        setValue('durationMinutes', 30);
        setValue('guestEmails', []);
        setValue('sendGoogleInvite', calendarConnected);
        const defaultParticipants = currentUser?._id ? [currentUser._id] : [];
        setValue('participants', defaultParticipants);
        if (selectedSlot) {
          setValue('scheduledAt', utcToWallClock(selectedSlot, defaultTimeZone));
        } else {
          setValue('scheduledAt', utcToWallClock(new Date(), defaultTimeZone));
        }
      }
    }
  }, [dialogOpen, selectedSlot, editingMeeting, setValue, currentUser, defaultTimeZone, calendarConnected]);

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedSlot(null);
    setEditingMeeting(null);
    reset();
  };

  const handleDelete = () => {
    if (editingMeeting) {
      setConfirmDeleteOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (!editingMeeting) return;
    const cancelledMeeting = editingMeeting;
    deleteMeeting.mutate(editingMeeting._id, {
      onSuccess: () => {
        addToast({ message: 'Meeting canceled successfully', severity: 'success' });
        setConfirmDeleteOpen(false);
        handleClose();
        // Re-open detail so the cancelled meeting can still be viewed
        setSelectedMeeting({ ...cancelledMeeting, status: 'cancelled' });
      },
      onError: (err) => {
        setConfirmDeleteOpen(false);
        showApiError(err);
      }
    });
  };

  const onSubmit = (data: MeetingFormData) => {
    const scheduledIso = wallClockToUtcIso(data.scheduledAt, data.timeZone);
    if (!editingMeeting && new Date(scheduledIso) < new Date()) {
      setError('scheduledAt', { type: 'manual', message: 'Cannot schedule meetings in the past.' });
      return;
    }

    const trimmedLink = data.meetingLink?.trim();
    const payload = {
      title: data.title,
      description: data.description,
      ...(trimmedLink ? { meetingLink: trimmedLink } : {}),
      scheduledAt: scheduledIso,
      timeZone: data.timeZone,
      durationMinutes: data.durationMinutes,
      guestEmails: data.guestEmails ?? [],
      sendGoogleInvite: calendarConnected ? data.sendGoogleInvite : false,
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
    const meeting = event.resource as Meeting | undefined;
    const cancelled = meeting?.status === 'cancelled';
    const past = isPast(new Date(event.start));
    return {
      style: {
        backgroundColor: cancelled
          ? (isDarkMode ? 'rgba(196, 69, 69, 0.2)' : 'rgba(196, 69, 69, 0.12)')
          : past
            ? (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)')
            : tokens.brand.primary,
        color: cancelled
          ? tokens.semantic.error
          : past
            ? (isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)')
            : '#fff',
        borderRadius: '8px',
        border: 'none',
        fontSize: '0.8rem',
        fontWeight: 600,
        padding: '2px 8px',
        textDecoration: cancelled ? 'line-through' : 'none',
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
            '& .rbc-btn-group': {
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
            },
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
              padding: '6px 16px',
              fontWeight: 650,
              fontSize: '0.82rem',
              [theme.breakpoints.down('sm')]: {
                padding: '4px 10px',
                fontSize: '0.75rem',
              },
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
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (slot.start < today) {
              addToast({ message: 'Cannot schedule meetings on past dates.', severity: 'warning' });
              return;
            }
            setSelectedSlot(slot.start);
            setDialogOpen(true);
          }}
          onSelectEvent={(event) => {
            // Always open detail first; edit is available from the detail dialog for organizer/admin
            setSelectedMeeting(event.resource as Meeting);
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
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            border: '1px solid',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            bgcolor: 'background.paper',
            boxShadow: tokens.shadow.cardHover,
            overflow: 'hidden',
            maxHeight: { xs: 'calc(100dvh - 24px)', sm: 'calc(100dvh - 48px)' },
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3, flexShrink: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              Schedule Meeting
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 550, mt: 0.5 }}>
              Enter meeting details below to coordinate with your team.
            </Typography>
          </DialogTitle>
          <DialogContent
            sx={{
              px: 3,
              pb: 1,
              pt: 0,
              overflowX: 'hidden',
              overflowY: 'auto',
              flex: '1 1 auto',
              minHeight: 0,
            }}
          >
            <TextField
              {...register('title')}
              label="Meeting Title *"
              placeholder="e.g. Sales Weekly Sync"
              fullWidth
              error={!!errors.title}
              helperText={errors.title?.message}
              sx={{
                mt: 1,
                mb: errors.title ? 1.5 : 3,
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
              label={calendarConnected ? 'Meeting Link (optional)' : 'Meeting Link (URL) *'}
              placeholder={
                calendarConnected
                  ? 'Leave empty for Google Meet'
                  : 'https://meet.google.com/...'
              }
              fullWidth
              error={!!errors.meetingLink}
              helperText={
                errors.meetingLink?.message ||
                (calendarConnected
                  ? 'When Google Calendar is connected, a Meet link is created automatically if you leave this blank.'
                  : undefined)
              }
              sx={{
                mb: errors.meetingLink ? 1.5 : calendarConnected ? 1 : 3,
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

            {calendarConnected && (
              <Controller
                name="sendGoogleInvite"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    sx={{ mb: 3, display: 'block', ml: 0 }}
                    control={
                      <Switch
                        checked={field.value ?? true}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Create on Google Calendar and send invites"
                  />
                )}
              />
            )}

            <Controller
              name="participants"
              control={control}
              render={({ field, fieldState }) => (
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
                      label="Participants *"
                      placeholder="Search team members..."
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      sx={{
                        mb: fieldState.error ? 1.5 : 3,
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
                        <Avatar src={option.avatarUrl || undefined} sx={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
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

            <Controller
              name="scheduledAt"
              control={control}
              render={({ field, fieldState }) => {
                let dateObj: Date | null = null;
                let time24 = '09:00';
                if (field.value) {
                  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(field.value);
                  if (match) {
                    dateObj = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
                    time24 = `${match[4]}:${match[5]}`;
                  }
                }

                const handleDateChange = (newDate: Date | null) => {
                  if (!newDate) {
                    field.onChange('');
                    return;
                  }
                  const datePart = format(newDate, 'yyyy-MM-dd');
                  field.onChange(`${datePart}T${time24}`);
                };

                const handleTimeChange = (newTime24: string) => {
                  const currentDate = dateObj || new Date();
                  const datePart = format(currentDate, 'yyyy-MM-dd');
                  field.onChange(`${datePart}T${newTime24}`);
                };

                return (
                  <Box sx={{ mb: fieldState.error ? 1.5 : 2 }}>
                    <Grid container spacing={2} alignItems="flex-start">
                      <Grid item xs={12} sm={4}>
                        <ModernDatePicker
                          label="Meeting Date *"
                          value={dateObj}
                          onChange={handleDateChange}
                          minDate={!editingMeeting ? new Date() : undefined}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <ModernTimePicker
                          label="Meeting Time *"
                          value={time24}
                          onChange={handleTimeChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Controller
                          name="durationMinutes"
                          control={control}
                          render={({ field: durField }) => (
                            <Box sx={{ width: '100%' }}>
                              <Typography variant="caption" sx={fieldCaptionSx}>
                                Duration
                              </Typography>
                              <FormControl fullWidth>
                                <Select
                                  value={durField.value ?? 30}
                                  onChange={(e) => durField.onChange(Number(e.target.value))}
                                  sx={modernSelectFieldSx(isDarkMode)}
                                >
                                  {[15, 30, 45, 60, 90, 120].map((mins) => (
                                    <MenuItem key={mins} value={mins}>{mins} min</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          )}
                        />
                      </Grid>
                    </Grid>
                    {fieldState.error && (
                      <Typography variant="caption" sx={{ color: 'error.main', mt: 0.75, display: 'block', fontWeight: 600 }}>
                        {fieldState.error.message}
                      </Typography>
                    )}
                  </Box>
                );
              }}
            />

            <Controller
              name="timeZone"
              control={control}
              render={({ field }) => (
                <Box sx={{ width: '100%', mb: 3 }}>
                  <Typography variant="caption" sx={fieldCaptionSx}>
                    Timezone
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={field.value || defaultTimeZone}
                      onChange={(e) => field.onChange(e.target.value)}
                      sx={modernSelectFieldSx(isDarkMode)}
                    >
                      {timeZoneOptions.map((tz) => (
                        <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            />

            <Controller
              name="guestEmails"
              control={control}
              render={({ field }) => (
                <GuestEmailChipInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                  helperText="Lead email is invited automatically when a lead is linked."
                  sx={{ mb: 3 }}
                />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1.5, flexShrink: 0 }}>
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

      <MeetingDetailModal
        meeting={selectedMeeting}
        open={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        onEdit={(meeting) => {
          setEditingMeeting(meeting);
          setSelectedMeeting(null);
          setDialogOpen(true);
        }}
        onDelete={(meetingId) => {
          const meeting = myMeetings.find((item) => item._id === meetingId);
          if (meeting) {
            setEditingMeeting(meeting);
            setConfirmDeleteOpen(true);
          }
        }}
      />

      {/* Delete Meeting Confirmation */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Cancel Meeting"
        message={`Are you sure you want to cancel "${editingMeeting?.title}"? This action cannot be undone.`}
        confirmLabel="Yes, Cancel Meeting"
        cancelLabel="Keep Meeting"
        isPending={deleteMeeting.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </Box>
  );
};

