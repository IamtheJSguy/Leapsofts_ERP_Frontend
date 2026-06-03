import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  CircularProgress,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMeetings, useDeleteMeeting } from '@/hooks/api/useMeetings';
import { formatDateTime } from '@/utils/formatters';
import { MeetingReminderBadge } from './MeetingReminderBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useState } from 'react';

export const MeetingList = () => {
  const { data: meetings = [], isLoading } = useMeetings();
  const deleteMeeting = useDeleteMeeting();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (meetings.length === 0) {
    return <EmptyState title="No meetings" description="Schedule your first meeting." />;
  }

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Scheduled</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Reminder</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {meetings.map((meeting) => (
            <TableRow key={meeting._id}>
              <TableCell>{meeting.title}</TableCell>
              <TableCell>{formatDateTime(meeting.scheduledAt)}</TableCell>
              <TableCell>
                <Chip label={meeting.status || 'scheduled'} size="small" />
              </TableCell>
              <TableCell>
                <MeetingReminderBadge scheduledAt={meeting.scheduledAt} />
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => setDeleteId(meeting._id)}
                  aria-label="Delete meeting"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmDialog
        open={!!deleteId}
        message="Are you sure you want to cancel this meeting?"
        onConfirm={() => {
          if (deleteId) {
            deleteMeeting.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
          }
        }}
        onCancel={() => setDeleteId(null)}
        isPending={deleteMeeting.isPending}
      />
    </>
  );
};
