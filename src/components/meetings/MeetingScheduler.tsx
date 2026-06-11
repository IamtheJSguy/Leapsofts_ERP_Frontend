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

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface MeetingSchedulerProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export const MeetingScheduler = ({ dialogOpen, setDialogOpen }: MeetingSchedulerProps) => {
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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const { register, handleSubmit, reset, setValue, control } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
  });

  const events = useMemo(
    () =>
      meetings.map((m: Meeting) => ({
        id: m._id,
        title: m.title,
        start: new Date(m.scheduledAt),
        end: new Date(m.scheduledAt),
        resource: m,
      })),
    [meetings],
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
        setValue('participants', []);
        if (selectedSlot) {
          setValue('scheduledAt', format(selectedSlot, "yyyy-MM-dd'T'HH:mm"));
        } else {
          setValue('scheduledAt', format(new Date(), "yyyy-MM-dd'T'HH:mm"));
        }
      }
    }
  }, [dialogOpen, selectedSlot, editingMeeting, setValue]);

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
            setEditingMeeting(event.resource);
            setDialogOpen(true);
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
            {editingMeeting && (
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
    </Box>
  );
};

