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
  CircularProgress,
  useTheme,
  Typography,
} from '@mui/material';
import { MeetingFormFields } from '@/components/meetings/MeetingFormFields';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useMeetings, useCreateMeeting, useUpdateMeeting, useDeleteMeeting } from '@/hooks/api/useMeetings';
import { useUsers } from '@/hooks/api/useUsers';
import { meetingSchema, type MeetingFormData } from '@/utils/validators';
import { useUIStore } from '@/store/useUIStore';
import type { Meeting } from '@/types';
import { tokens } from '@/styles/tokens';
import EventIcon from '@mui/icons-material/Event';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MeetingDetailModal } from './MeetingDetailModal';
import { canEditOrDeleteMeeting } from '@/utils/meetingPermissions';
import { getApiErrorMessage, showApiError } from '@/utils/apiError';
import axios from 'axios';
import {
  getDefaultMeetingTimeZone,
  utcToWallClock,
  getCalendarEventEnd,
} from '@/utils/meetingTimezone';
import { useCalendarStatus } from '@/hooks/api/useCalendar';
import { buildMeetingSubmitPayload } from '@/utils/meetingForm';

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
  const { user, isElevated } = useAuth();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');
  const [pendingSubmit, setPendingSubmit] = useState<MeetingFormData | null>(null);
  const { data: calendarStatus } = useCalendarStatus();
  const calendarConnected = calendarStatus?.connected === true;
  const defaultTimeZone = getDefaultMeetingTimeZone(currentUser ?? user);
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
        if (calendarConnected) setValue('meetingLink', '');
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
        if (calendarConnected) setValue('meetingLink', '');
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

  const saveMeeting = (data: MeetingFormData, allowSchedulingConflict = false) => {
    const payload = buildMeetingSubmitPayload(data, calendarConnected, {
      ...(allowSchedulingConflict ? { allowSchedulingConflict: true } : {}),
    });
    if (!payload.scheduledAt) return;
    if (!editingMeeting && new Date(payload.scheduledAt) < new Date()) {
      setError('scheduledAt', { type: 'manual', message: 'Cannot schedule meetings in the past.' });
      return;
    }

    const onConflictError = (err: unknown, formData: MeetingFormData) => {
      const code = axios.isAxiosError(err)
        ? (err.response?.data as { error?: { code?: string } })?.error?.code
        : undefined;
      if (code === 'MEETING_CONFLICT') {
        setPendingSubmit(formData);
        setConflictMessage(getApiErrorMessage(err));
        setConflictDialogOpen(true);
        return;
      }
      showApiError(err);
    };

    if (editingMeeting) {
      updateMeeting.mutate(
        { id: editingMeeting._id, data: payload },
        {
          onSuccess: () => {
            addToast({ message: 'Meeting updated successfully', severity: 'success' });
            handleClose();
          },
          onError: (err) => onConflictError(err, data),
        },
      );
    } else {
      createMeeting.mutate(payload, {
        onSuccess: () => {
          addToast({ message: 'Meeting scheduled successfully', severity: 'success' });
          handleClose();
        },
        onError: (err) => onConflictError(err, data),
      });
    }
  };

  const onSubmit = (data: MeetingFormData) => saveMeeting(data, false);

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
                color: tokens.brand.primary,
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
                bgcolor: tokens.brand.solid,
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
            <MeetingFormFields
              control={control}
              register={register}
              errors={errors}
              calendarConnected={calendarConnected}
              userOptions={dbUsers}
              defaultTimeZone={defaultTimeZone}
              isCreate={!editingMeeting}
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
                bgcolor: tokens.brand.solid,
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

      <ConfirmDialog
        open={conflictDialogOpen}
        title="Scheduling conflict"
        message={
          conflictMessage ||
          'Another meeting overlaps this time. Schedule anyway?'
        }
        confirmLabel="Schedule anyway"
        cancelLabel="Change time"
        isPending={createMeeting.isPending || updateMeeting.isPending}
        onConfirm={() => {
          if (pendingSubmit) {
            setConflictDialogOpen(false);
            saveMeeting(pendingSubmit, true);
            setPendingSubmit(null);
          }
        }}
        onCancel={() => {
          setConflictDialogOpen(false);
          setPendingSubmit(null);
        }}
      />
    </Box>
  );
};

