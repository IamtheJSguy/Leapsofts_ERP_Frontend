import { Box, Typography, Chip, Paper } from '@mui/material';
import { useMyKPIChangeRequests } from '@/hooks/api/useKPIChangeRequests';
import type { KPIChangeRequest } from '@/types';

interface Props {
  assignmentId?: string;
  limit?: number;
}

export const MyChangeRequestsPanel = ({ assignmentId, limit = 5 }: Props) => {
  const { data: requests = [] } = useMyKPIChangeRequests();

  const filtered = (assignmentId
    ? requests.filter((r) => r.assignmentId === assignmentId)
    : requests
  ).slice(0, limit);

  if (filtered.length === 0) return null;

  const statusColor = (s: KPIChangeRequest['status']) => {
    if (s === 'approved') return 'success';
    if (s === 'rejected') return 'error';
    return 'warning';
  };

  return (
    <Paper sx={{ p: 2.5, borderRadius: '16px', mt: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>My Change Requests</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {filtered.map((r) => (
          <Box key={r._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.kpiName ?? r.type}</Typography>
              <Typography variant="caption" color="text.secondary">{r.reason}</Typography>
            </Box>
            <Chip label={r.status} size="small" color={statusColor(r.status)} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
