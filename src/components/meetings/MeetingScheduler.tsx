import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useMeetings, useCreateMeeting } from '@/hooks/api/useMeetings';
import { meetingSchema, type MeetingFormData } from '@/utils/validators';
import { useUIStore } from '@/store/useUIStore';
import type { Meeting } from '@/types';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export const MeetingScheduler = () => {
  const { data: meetings = [] } = useMeetings();
  const createMeeting = useCreateMeeting();
  const addToast = useUIStore((s) => s.addToast);
  const [view, setView] = useState<View>('month');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  const { register, handleSubmit, reset } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
  });

  const events = useMemo(
    () =>
      meetings.map((m: Meeting) => ({
        id: m._id,
        title: m.title,
        start: new Date(m.scheduledAt),
        end: new Date(m.scheduledAt),
      })),
    [meetings],
  );

  const onSubmit = (data: MeetingFormData) => {
    createMeeting.mutate(
      { ...data, scheduledAt: selectedSlot?.toISOString() || data.scheduledAt },
      {
        onSuccess: () => {
          addToast({ message: 'Meeting scheduled', severity: 'success' });
          setDialogOpen(false);
          reset();
        },
      },
    );
  };

  return (
    <Box>
      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        onView={setView}
        style={{ height: 500 }}
        onSelectSlot={(slot) => {
          setSelectedSlot(slot.start);
          setDialogOpen(true);
        }}
        selectable
      />
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogContent>
            <TextField {...register('title')} label="Title" fullWidth sx={{ mt: 1, mb: 2 }} />
            <TextField {...register('link')} label="Meeting Link" fullWidth sx={{ mb: 2 }} />
            <TextField
              {...register('scheduledAt')}
              label="Date/Time"
              type="datetime-local"
              fullWidth
              defaultValue={selectedSlot?.toISOString().slice(0, 16)}
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMeeting.isPending}>
              {createMeeting.isPending ? <CircularProgress size={20} /> : 'Schedule'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
