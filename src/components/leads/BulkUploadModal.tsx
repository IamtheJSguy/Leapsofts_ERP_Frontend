import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Alert,
  Chip,
  Box,
  Link,
  TableContainer,
  CircularProgress,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { FileUploader } from '@/components/common/FileUploader';
import { useBulkUpload } from '@/hooks/api/useLeads';
import { useUIStore } from '@/store/useUIStore';
import type { BulkUploadResponse, BulkUploadRowStatus } from '@/types';

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
}

const EXPECTED_COLUMNS =
  'First Name, Last Name, ICP, Profile, Connection Status, Message Status, Date';

const SAMPLE_CSV =
  'First Name,Last Name,ICP,Profile,Connection Status,Message Status,Date\nJane,Doe,SaaS Founders,John Smith,pending,not_sent,2026-07-14\n';

const statusChipSx: Record<
  BulkUploadRowStatus,
  { bgcolor: string; color: string; border: string }
> = {
  inserted: {
    bgcolor: 'rgba(16, 185, 129, 0.1)',
    color: '#059669',
    border: '1px solid rgba(16, 185, 129, 0.25)',
  },
  updated: {
    bgcolor: 'rgba(59, 130, 246, 0.1)',
    color: '#2563EB',
    border: '1px solid rgba(59, 130, 246, 0.25)',
  },
  error: {
    bgcolor: 'rgba(239, 68, 68, 0.1)',
    color: '#DC2626',
    border: '1px solid rgba(239, 68, 68, 0.25)',
  },
};

export const BulkUploadModal = ({ open, onClose }: BulkUploadModalProps) => {
  const [result, setResult] = useState<BulkUploadResponse | null>(null);
  const bulkUpload = useBulkUpload();
  const addToast = useUIStore((s) => s.addToast);

  const reset = () => {
    setResult(null);
    bulkUpload.reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelect = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    bulkUpload.mutate(formData, {
      onSuccess: (res) => {
        const payload = res.data.data;
        setResult(payload);
        const { inserted, updated, errors } = payload.summary;
        addToast({
          message: `Upload complete: ${inserted} inserted, ${updated} updated, ${errors} errors`,
          severity: errors > 0 ? 'warning' : 'success',
        });
      },
      onError: (err: unknown) => {
        const message =
          (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
            ?.error?.message || 'Upload failed';
        addToast({ message, severity: 'error' });
      },
    });
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'leads-bulk-upload-template.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const summary = result?.summary;
  const alertSeverity =
    summary && summary.errors > 0
      ? summary.inserted + summary.updated > 0
        ? 'warning'
        : 'error'
      : 'success';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Upload Leads</DialogTitle>
      <DialogContent>
        {!result ? (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Expected columns: <strong>{EXPECTED_COLUMNS}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Required for new rows: First Name, Last Name, ICP, Profile. Matching name + ICP
                updates an existing lead. Other columns are ignored.
              </Typography>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={handleDownloadSample}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                <DownloadIcon sx={{ fontSize: 16 }} />
                Download sample CSV template
              </Link>
            </Alert>

            <FileUploader onFileSelect={handleFileSelect} isUploading={bulkUpload.isPending} />

            {bulkUpload.isPending && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Uploading and processing rows…
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <>
            {summary && (
              <Alert severity={alertSeverity} sx={{ mb: 2 }}>
                Processed {summary.total} row{summary.total === 1 ? '' : 's'}:{' '}
                <strong>{summary.inserted}</strong> inserted,{' '}
                <strong>{summary.updated}</strong> updated,{' '}
                <strong>{summary.errors}</strong> error
                {summary.errors === 1 ? '' : 's'}.
              </Alert>
            )}

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Per-row results
            </Typography>
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>ICP</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.results.map((row) => {
                    const name = [row.firstName, row.lastName].filter(Boolean).join(' ') || '—';
                    const chip = statusChipSx[row.status];
                    return (
                      <TableRow key={`${row.row}-${row.status}-${row.leadId ?? row.message ?? ''}`}>
                        <TableCell>{row.row}</TableCell>
                        <TableCell>{name}</TableCell>
                        <TableCell>{row.icp || '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              ...chip,
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              height: 22,
                              textTransform: 'capitalize',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="caption"
                            color={row.status === 'error' ? 'error' : 'text.secondary'}
                          >
                            {row.message || '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {result ? (
          <>
            <Button onClick={reset}>Upload another</Button>
            <Button variant="contained" onClick={handleClose}>
              Close
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} disabled={bulkUpload.isPending}>
            Cancel
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
