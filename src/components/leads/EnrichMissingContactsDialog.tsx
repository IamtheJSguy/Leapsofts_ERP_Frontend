import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useLeads } from '@/hooks/api/useLeads';
import { useBulkEnrichLeads } from '@/hooks/api/useAi';
import { useUIStore } from '@/store/useUIStore';
import { showApiError } from '@/utils/apiError';
import type { Lead, LeadFilters } from '@/types';

const TOP_N_OPTIONS = [10, 20, 40, 50, 100];

const leadLabel = (lead: Lead): string => {
  const name = lead.prospectName?.trim()
    || [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim();
  return name || 'Unnamed lead';
};

const missingLabel = (lead: Lead): string => {
  const missingEmail = !String(lead.email ?? '').trim();
  const missingPhone = !String(lead.phone ?? '').trim();
  if (missingEmail && missingPhone) return 'Missing email and phone';
  if (missingEmail) return 'Missing email';
  if (missingPhone) return 'Missing phone';
  return 'Contact on file';
};

const isMissingContact = (lead: Lead): boolean =>
  !String(lead.email ?? '').trim() || !String(lead.phone ?? '').trim();

interface EnrichMissingContactsDialogProps {
  open: boolean;
  onClose: () => void;
  leadFilters: LeadFilters;
  defaultTopN: number;
  onBatchStarted: (batchId: string) => void;
}

export const EnrichMissingContactsDialog = ({
  open,
  onClose,
  leadFilters,
  defaultTopN,
  onBatchStarted,
}: EnrichMissingContactsDialogProps) => {
  const addToast = useUIStore((s) => s.addToast);
  const enrich = useBulkEnrichLeads();
  const [topN, setTopN] = useState(defaultTopN);
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) setTopN(defaultTopN);
  }, [open, defaultTopN]);

  const fetchFilters = useMemo(
    () => ({ ...leadFilters, page: 1, limit: topN }),
    [leadFilters, topN],
  );

  const { data: leadsResponse, isLoading, isError } = useLeads(fetchFilters, { enabled: open });
  const leads = leadsResponse?.data ?? [];
  const totalMatching = leadsResponse?.meta.total ?? 0;

  useEffect(() => {
    if (!open || !leads.length) {
      setSelected([]);
      return;
    }
    const ids = leads.filter((lead) => !onlyMissing || isMissingContact(lead)).map((lead) => lead._id);
    setSelected(ids);
  }, [open, leads, onlyMissing, topN]);

  const allChecked = leads.length > 0 && selected.length === leads.length;

  const toggle = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const start = () => {
    enrich.mutate(
      {
        leadIds: selected,
        filterSnapshot: fetchFilters as Record<string, unknown>,
      },
      {
        onSuccess: (result) => {
          if (!result.batchId || !result.queued) {
            addToast({ message: 'No leads were queued for enrichment.', severity: 'info' });
            return;
          }
          addToast({
            message: `Started enrichment for ${result.queued} lead${result.queued === 1 ? '' : 's'}. You will get a notification when it finishes.`,
            severity: 'success',
          });
          onBatchStarted(result.batchId);
          onClose();
        },
        onError: (err) => showApiError(err),
      },
    );
  };

  return (
    <Dialog open={open} onClose={enrich.isPending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 0.5 }}>Enrich missing contacts</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Uses your current Sales filters. Results appear in the batch summary — they do not create Lumi chats. Apply changes from that summary when you are ready.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select value={topN} onChange={(e) => setTopN(Number(e.target.value))}>
              {TOP_N_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>Top {n} leads</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            Showing top {leads.length} of {totalMatching} matching
          </Typography>
        </Box>
        <FormControlLabel
          control={<Checkbox size="small" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />}
          label="Only select leads missing email or phone"
          sx={{ mb: 1 }}
        />
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}
        {isError && (
          <Typography color="error" variant="body2">Could not load leads. Close and try again.</Typography>
        )}
        {!isLoading && !isError && leads.length === 0 && (
          <Typography variant="body2">No leads match your current filters.</Typography>
        )}
        {leads.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Checkbox
                size="small"
                checked={allChecked}
                indeterminate={selected.length > 0 && !allChecked}
                onChange={() => setSelected(allChecked ? [] : leads.map((lead) => lead._id))}
              />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {selected.length} of {leads.length} selected
              </Typography>
            </Box>
            <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
              {leads.map((lead) => (
                <Box
                  key={lead._id}
                  sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}
                >
                  <Checkbox size="small" checked={selected.includes(lead._id)} onChange={() => toggle(lead._id)} sx={{ p: 0.5 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{leadLabel(lead)}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {[lead.company, missingLabel(lead)].filter(Boolean).join(' · ')}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={enrich.isPending} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={start}
          disabled={enrich.isPending || selected.length === 0}
          sx={{ textTransform: 'none' }}
        >
          {enrich.isPending ? 'Queuing…' : `Enrich ${selected.length} lead${selected.length === 1 ? '' : 's'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
