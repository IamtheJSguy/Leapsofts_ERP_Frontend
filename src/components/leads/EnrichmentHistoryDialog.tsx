import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useLeadEnrichmentBatchHistory } from '@/hooks/api/useAi';
import { formatDateTime } from '@/utils/formatters';

const statusColor = (
  status: string,
): 'default' | 'success' | 'warning' | 'error' | 'info' => {
  if (status === 'completed') return 'success';
  if (status === 'running' || status === 'queued') return 'info';
  if (status === 'failed') return 'error';
  return 'default';
};

interface EnrichmentHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  onOpenBatch: (batchId: string) => void;
}

export const EnrichmentHistoryDialog = ({ open, onClose, onOpenBatch }: EnrichmentHistoryDialogProps) => {
  const { data, isLoading, isError, refetch, isFetching } = useLeadEnrichmentBatchHistory(open);

  const batches = data?.batches ?? [];

  const handleOpen = (batchId: string) => {
    onOpenBatch(batchId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 0.5 }}>Enrichment history</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Past bulk enrichment runs you started. Open a batch to review proposals, apply selected fields, or dismiss.
        </Typography>
        {isLoading && !data && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}
        {isError && (
          <Typography color="error" variant="body2">Could not load enrichment history.</Typography>
        )}
        {data && batches.length === 0 && (
          <Typography variant="body2" color="text.secondary">No enrichment batches yet.</Typography>
        )}
        {batches.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Started</TableCell>
                  <TableCell>Leads</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Results</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batches.map((row) => (
                  <TableRow key={row.batchId} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {formatDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell>{row.stats.total}</TableCell>
                    <TableCell>
                      <Chip size="small" label={row.status} color={statusColor(row.status)} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" component="span">
                        {row.stats.emailFound} emails · {row.stats.phoneFound} phones
                        {row.pendingReview > 0 && ` · ${row.pendingReview} to review`}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpen(row.batchId)}
                        sx={{ textTransform: 'none' }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          sx={{ textTransform: 'none' }}
        >
          Refresh
        </Button>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
