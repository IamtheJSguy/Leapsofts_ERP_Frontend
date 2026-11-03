import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  useConfirmBulkEnrichItem,
  useLeadEnrichmentBatch,
  useRejectBulkEnrichItem,
} from '@/hooks/api/useAi';
import { useUIStore } from '@/store/useUIStore';
import { showApiError } from '@/utils/apiError';

const FIELD_LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  prospectName: 'Name',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
  jobTitle: 'Job title',
  website: 'Website',
  industry: 'Industry',
  location: 'Location',
  companySize: 'Company size',
  profileUrl: 'LinkedIn',
  icp: 'ICP',
  notes: 'Notes',
};

const contactOutcome = (
  missingBefore: boolean,
  found: boolean | undefined,
  failed: boolean,
): string => {
  if (!missingBefore) return 'Not needed';
  if (failed) return 'Failed';
  if (found) return 'Found';
  return 'Not found';
};

interface BulkEnrichResultsDialogProps {
  open: boolean;
  batchId: string | null;
  onClose: () => void;
}

export const BulkEnrichResultsDialog = ({ open, batchId, onClose }: BulkEnrichResultsDialogProps) => {
  const addToast = useUIStore((s) => s.addToast);
  const { data: batch, isLoading, isError } = useLeadEnrichmentBatch(batchId, open && Boolean(batchId));
  const confirmItem = useConfirmBulkEnrichItem(batchId);
  const rejectItem = useRejectBulkEnrichItem(batchId);
  const [expanded, setExpanded] = useState<string | false>(false);
  const [fieldSelection, setFieldSelection] = useState<Record<string, string[]>>({});

  const running = batch?.status === 'queued' || batch?.status === 'running';
  const stats = batch?.stats;

  useEffect(() => {
    if (!batch?.items) return;
    setFieldSelection((prev) => {
      const next = { ...prev };
      for (const item of batch.items) {
        const id = String(item.leadId);
        if (item.actionStatus !== 'pending') continue;
        const keys = Object.keys(item.proposed ?? {});
        if (keys.length && !next[id]) next[id] = keys;
      }
      return next;
    });
  }, [batch]);

  const summaryLine = useMemo(() => {
    if (!stats) return '';
    return `${stats.emailFound} emails found · ${stats.phoneFound} phones found · ${stats.emailNotFound + stats.phoneNotFound} contact gaps · ${stats.noChanges} no new fields`;
  }, [stats]);

  const selectedFieldsForLead = (leadId: string, proposedKeys: string[]) =>
    fieldSelection[leadId] ?? proposedKeys;

  const toggleField = (leadId: string, key: string, proposedKeys: string[]) => {
    setFieldSelection((prev) => {
      const current = prev[leadId] ?? proposedKeys;
      const nextFields = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];
      return { ...prev, [leadId]: nextFields };
    });
  };

  const handleConfirm = (leadId: string, leadName: string, proposedKeys: string[]) => {
    const fields = selectedFieldsForLead(leadId, proposedKeys).filter((k) => proposedKeys.includes(k));
    if (!fields.length) {
      addToast({ message: 'Select at least one field to apply.', severity: 'warning' });
      return;
    }
    confirmItem.mutate(
      { leadId, fields },
      {
        onSuccess: () => addToast({ message: `Applied enrichment for ${leadName}.`, severity: 'success' }),
        onError: (err) => showApiError(err),
      },
    );
  };

  const handleReject = (leadId: string) => {
    rejectItem.mutate(leadId, {
      onError: (err) => showApiError(err),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 0.5 }}>Bulk enrichment results</DialogTitle>
      <DialogContent>
        {isLoading && !batch && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}
        {isError && (
          <Typography color="error" variant="body2">Could not load this batch.</Typography>
        )}
        {batch && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {running
                ? `Processing ${stats?.completed ?? 0} of ${stats?.total ?? 0}… `
                : 'Uncheck any fields you do not want on the lead, then apply. Nothing is saved until you apply.'}
            </Typography>
            {stats && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip size="small" label={`${stats.emailFound} emails found`} />
                <Chip size="small" label={`${stats.phoneFound} phones found`} />
                <Chip size="small" label={`${stats.emailNotFound + stats.phoneNotFound} still missing contact`} />
                <Chip size="small" label={`${stats.failed} failed`} />
                <Chip size="small" label={`${stats.noChanges} unchanged`} />
              </Box>
            )}
            {!running && summaryLine && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {summaryLine}
              </Typography>
            )}
            <Box>
              {batch.items.map((item) => {
                const proposed = item.proposed ?? {};
                const fields = Object.keys(proposed);
                const leadId = String(item.leadId);
                const selected = selectedFieldsForLead(leadId, fields);
                const canApply = item.actionStatus === 'pending' && fields.length > 0 && item.status === 'completed';
                const applied = item.applied ?? {};
                return (
                  <Accordion
                    key={leadId}
                    expanded={expanded === leadId}
                    onChange={(_, isExpanded) => setExpanded(isExpanded ? leadId : false)}
                    disableGutters
                    sx={{ border: '1px solid', borderColor: 'divider', mb: 1, '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.leadName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[item.company, item.status, item.actionStatus].filter(Boolean).join(' · ')}
                          {' · '}
                          Email: {contactOutcome(item.missingEmailBefore, item.foundEmail, item.status === 'failed')}
                          {' · '}
                          Phone: {contactOutcome(item.missingPhoneBefore, item.foundPhone, item.status === 'failed')}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {item.error && (
                        <Typography variant="body2" color="error" sx={{ mb: 1 }}>{item.error}</Typography>
                      )}
                      {item.summary && (
                        <Typography variant="body2" sx={{ mb: 1 }}>{item.summary}</Typography>
                      )}
                      {fields.length === 0 && item.status === 'completed' && (
                        <Typography variant="body2" color="text.secondary">No new fields proposed.</Typography>
                      )}
                      {canApply && fields.map((key) => (
                        <Box
                          key={key}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 0.5,
                            mb: 0.75,
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={selected.includes(key)}
                            onChange={() => toggleField(leadId, key, fields)}
                            sx={{
                              flexShrink: 0,
                              p: 0.5,
                              mt: '2px',
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ flex: 1, minWidth: 0, pt: '3px', lineHeight: 1.5 }}
                          >
                            <strong>{FIELD_LABELS[key] ?? key}:</strong>{' '}
                            {String(proposed[key] ?? '')}
                          </Typography>
                        </Box>
                      ))}
                      {!canApply && fields.map((key) => (
                        <Typography key={key} variant="body2" sx={{ mb: 0.5 }}>
                          <strong>{FIELD_LABELS[key] ?? key}:</strong>{' '}
                          {String((item.actionStatus === 'confirmed' ? applied[key] : proposed[key]) ?? '')}
                        </Typography>
                      ))}
                      {canApply && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={confirmItem.isPending || selected.length === 0}
                            onClick={() => handleConfirm(leadId, item.leadName, fields)}
                            sx={{ textTransform: 'none' }}
                          >
                            Apply selected to lead
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={rejectItem.isPending}
                            onClick={() => handleReject(leadId)}
                            sx={{ textTransform: 'none' }}
                          >
                            Dismiss
                          </Button>
                        </Box>
                      )}
                      {item.actionStatus === 'confirmed' && (
                        <Chip size="small" color="success" label="Applied" sx={{ mt: 1 }} />
                      )}
                      {item.actionStatus === 'rejected' && (
                        <Chip size="small" label="Dismissed" sx={{ mt: 1 }} />
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
