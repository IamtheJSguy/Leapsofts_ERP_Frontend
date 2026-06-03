import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useChangeRequests, useApproveKPIChange } from '@/hooks/api/useKPIs';
import { getDisplayName } from '@/utils/formatters';
import { useUIStore } from '@/store/useUIStore';

export const KPIApprovalQueue = () => {
  const { data: requests = [], isLoading } = useChangeRequests();
  const approveChange = useApproveKPIChange();
  const addToast = useUIStore((s) => s.addToast);

  const pending = requests.filter((r) => r.status === 'pending');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Pending Change Requests
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Proposed Target</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pending.map((req) => (
            <TableRow key={req._id}>
              <TableCell>
                {getDisplayName(typeof req.userId === 'object' ? req.userId : undefined)}
              </TableCell>
              <TableCell>{req.proposedTarget}</TableCell>
              <TableCell>{req.reason}</TableCell>
              <TableCell>
                <Button
                  size="small"
                  onClick={() =>
                    approveChange.mutate(
                      { id: '', requestId: req._id, decision: 'approved' },
                      { onSuccess: () => addToast({ message: 'Approved', severity: 'success' }) },
                    )
                  }
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() =>
                    approveChange.mutate(
                      { id: '', requestId: req._id, decision: 'rejected' },
                      { onSuccess: () => addToast({ message: 'Rejected', severity: 'info' }) },
                    )
                  }
                >
                  Deny
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
