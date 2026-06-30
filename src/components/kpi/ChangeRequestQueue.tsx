import { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Paper,
  CircularProgress,
} from '@mui/material';
import { usePendingKPIChangeRequests } from '@/hooks/api/useKPIChangeRequests';
import { ReviewChangeRequestDialog } from '@/components/kpi/ReviewChangeRequestDialog';
import type { KPIChangeRequest, User } from '@/types';

const formatUser = (u: string | User | undefined) => {
  if (!u || typeof u === 'string') return '—';
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;
};

const formatChange = (r: KPIChangeRequest) => {
  const parts: string[] = [];
  if (r.requestedTargetValue !== undefined && r.requestedTargetValue !== r.currentTargetValue) {
    parts.push(`${r.currentTargetValue ?? '?'} → ${r.requestedTargetValue}`);
  }
  if (r.requestedTimeFrame && r.requestedTimeFrame !== r.currentTimeFrame) {
    parts.push(`${r.currentTimeFrame} → ${r.requestedTimeFrame}`);
  }
  if (r.requestedPriority && r.requestedPriority !== r.currentPriority) {
    parts.push(`${r.currentPriority ?? 'medium'} → ${r.requestedPriority}`);
  }
  if (r.proposedItem) parts.push(`Add: ${r.proposedItem.name}`);
  if (r.type === 'remove') parts.push('Remove item');
  return parts.join('; ') || '—';
};

export const ChangeRequestQueue = () => {
  const { data: requests = [], isLoading } = usePendingKPIChangeRequests();
  const [selected, setSelected] = useState<KPIChangeRequest | null>(null);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (requests.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '20px' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>No pending requests</Typography>
        <Typography variant="body2" color="text.secondary">All KPI change requests have been reviewed.</Typography>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Source</TableCell>
              <TableCell>User</TableCell>
              <TableCell>KPI</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Change</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r._id} hover>
                <TableCell>
                  <Chip label={r.sourceType === 'assignment' ? 'Assignment' : 'Standalone'} size="small" />
                </TableCell>
                <TableCell>{formatUser(r.userId)}</TableCell>
                <TableCell>{r.kpiName ?? '—'}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell sx={{ maxWidth: 200 }}>{formatChange(r)}</TableCell>
                <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reason}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" onClick={() => setSelected(r)} sx={{ textTransform: 'none', borderRadius: '10px' }}>
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ReviewChangeRequestDialog
        request={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
};
