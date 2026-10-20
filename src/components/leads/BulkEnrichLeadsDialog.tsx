import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import {
  usePreviewBulkEnrich,
  useRunBulkEnrich,
  useBulkEnrichJob,
  type BulkEnrichPreview,
} from '@/hooks/api/useLeads';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import type { LeadFilters } from '@/types';
import { showApiError } from '@/utils/apiError';

interface BulkEnrichLeadsDialogProps {
  open: boolean;
  onClose: () => void;
  filters: LeadFilters;
  onComplete?: () => void;
}

export const BulkEnrichLeadsDialog = ({
  open,
  onClose,
  filters,
  onComplete,
}: BulkEnrichLeadsDialogProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const addToast = useUIStore((s) => s.addToast);
  const preview = usePreviewBulkEnrich();
  const run = useRunBulkEnrich();
  const [reEnrichComplete, setReEnrichComplete] = useState(false);
  const [maxPaidLookups, setMaxPaidLookups] = useState(25);
  const [previewData, setPreviewData] = useState<BulkEnrichPreview | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const jobQuery = useBulkEnrichJob(jobId, Boolean(jobId));

  useEffect(() => {
    if (!open) {
      setPreviewData(null);
      setJobId(null);
      setReEnrichComplete(false);
      setMaxPaidLookups(25);
      return;
    }
    preview.mutate(
      { filters, reEnrichComplete, maxPaidLookups },
      {
        onSuccess: (data) => setPreviewData(data),
        onError: (err) => showApiError(err),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- previewKey triggers manual refresh
  }, [open, filters, reEnrichComplete, maxPaidLookups, previewKey]);

  useEffect(() => {
    const status = jobQuery.data?.status;
    if (status === 'completed') {
      addToast({
        message: `Enrichment finished — ${jobQuery.data?.foundEmail ?? 0} emails, ${jobQuery.data?.foundPhone ?? 0} phones.`,
        severity: 'success',
      });
      onComplete?.();
    }
    if (status === 'failed') {
      addToast({
        message: jobQuery.data?.lastError || 'Enrichment job failed.',
        severity: 'error',
      });
    }
  }, [jobQuery.data?.status, jobQuery.data?.foundEmail, jobQuery.data?.foundPhone, jobQuery.data?.lastError, addToast, onComplete]);

  const handleConfirm = () => {
    run.mutate(
      { filters, reEnrichComplete, maxPaidLookups },
      {
        onSuccess: (data) => {
          setJobId(data.jobId);
          addToast({ message: 'Enrichment started.', severity: 'info' });
        },
        onError: (err) => showApiError(err),
      },
    );
  };

  const refreshPreview = () => setPreviewKey((k) => k + 1);

  const job = jobQuery.data;
  const running = job && (job.status === 'pending' || job.status === 'running');
  const progressPct =
    job && job.totalLeads > 0 ? Math.round((job.processed / job.totalLeads) * 100) : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Enrich filtered leads</DialogTitle>
      <DialogContent>
        {preview.isPending && !previewData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: tokens.brand.primary }} />
          </Box>
        ) : previewData ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Uses your organization&apos;s shared contact cache first, then public website data,
              then Apollo (paid) for remaining email or phone gaps. Notes are generated fresh for
              your team only.
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              }}
            >
              <Typography variant="body2">
                <strong>{previewData.total}</strong> leads in this selection
              </Typography>
              <Typography variant="body2">
                <strong>{previewData.willProcess}</strong> will be processed
              </Typography>
              <Typography variant="body2">
                <strong>{previewData.skipComplete}</strong> already have email and phone (skipped)
              </Typography>
              <Typography variant="body2">
                Up to <strong>{previewData.cappedPaidEstimate}</strong> paid Apollo lookups (cap{' '}
                {previewData.maxPaidLookups})
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reEnrichComplete}
                  onChange={(e) => {
                    setReEnrichComplete(e.target.checked);
                    refreshPreview();
                  }}
                  disabled={Boolean(running)}
                />
              }
              label="Re-enrich leads that already have email and phone"
            />
            <TextField
              type="number"
              size="small"
              label="Maximum paid lookups"
              value={maxPaidLookups}
              disabled={Boolean(running)}
              onBlur={refreshPreview}
              onChange={(e) => setMaxPaidLookups(Math.max(0, Number(e.target.value) || 0))}
              inputProps={{ min: 0, max: 500 }}
              helperText="Limits Apollo API usage for this run."
            />
            {job && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {job.status === 'completed' ? 'Complete' : 'Processing'} — {job.processed}/
                  {job.totalLeads} ({job.foundEmail} emails, {job.foundPhone} phones,{' '}
                  {job.internalCacheHits} cache hits)
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={job.status === 'completed' ? 100 : progressPct}
                  sx={{ mt: 1, borderRadius: 1 }}
                />
              </Box>
            )}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={run.isPending}>
          {running ? 'Close' : 'Cancel'}
        </Button>
        <Button
          variant="contained"
          startIcon={
            run.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <AutoFixHighOutlinedIcon />
            )
          }
          disabled={
            !previewData ||
            previewData.willProcess === 0 ||
            run.isPending ||
            Boolean(running && job?.status !== 'completed')
          }
          onClick={handleConfirm}
          sx={{ bgcolor: tokens.brand.primary }}
        >
          {jobId ? 'Running…' : 'Confirm & enrich'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
