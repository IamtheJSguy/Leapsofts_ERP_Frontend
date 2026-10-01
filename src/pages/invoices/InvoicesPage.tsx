import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Switch,
  Typography,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { tokens } from '@/styles/tokens';
import { usePermissions } from '@/hooks/usePermissions';
import { InvoiceSettingsButton } from '@/components/invoices/InvoiceSettingsButton';
import { useInvoiceLeave } from '@/components/invoices/InvoiceLeaveGuard';
import { InvoiceClientFields } from '@/components/invoices/InvoiceClientFields';
import { apiErrorMessage, useInvoiceClients, useInvoiceMutations } from '@/hooks/api/useInvoices';
import { emptyClientForm, type InvoiceClientForm } from '@/types/invoice';

const headerButtonSx = {
  textTransform: 'none',
  height: 40,
  minHeight: 40,
  py: 0,
  px: 1.5,
  fontSize: '0.8125rem',
  lineHeight: 1,
  borderRadius: '12px',
};

const InvoicesPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const [includeArchived, setIncludeArchived] = useState(false);
  const clients = useInvoiceClients(includeArchived);
  const mutations = useInvoiceMutations();
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<InvoiceClientForm>(emptyClientForm());
  const [baseline, setBaseline] = useState(JSON.stringify(emptyClientForm()));

  const startCreate = () => {
    const next = emptyClientForm();
    setError('');
    setForm(next);
    setBaseline(JSON.stringify(next));
    setOpen(true);
  };

  const save = async (): Promise<boolean> => {
    setError('');
    try {
      await mutations.createClient.mutateAsync(form);
      setBaseline(JSON.stringify(form));
      setOpen(false);
      return true;
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the client'));
      return false;
    }
  };

  const { dialog } = useInvoiceLeave(
    open && JSON.stringify(form) !== baseline,
    save,
    mutations.createClient.isPending,
  );

  const list = clients.data || [];

  return (
    <Box sx={{ pb: 4 }}>
      {dialog}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.025em', color: isDarkMode ? '#fff' : tokens.text.primary }}>
            Invoices
          </Typography>
          <Typography sx={{ color: isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary, mt: 0.5 }}>
            Choose a client to see their invoices, or add a company you bill.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={includeArchived}
                onChange={(event) => setIncludeArchived(event.target.checked)}
              />
            }
            label="Show archived"
            sx={{ mr: 0.5, '& .MuiFormControlLabel-label': { fontSize: '0.8125rem' } }}
          />
          {isAdmin && <InvoiceSettingsButton isDarkMode={isDarkMode} />}
          <Button
            size="small"
            variant="contained"
            onClick={startCreate}
            sx={{ ...headerButtonSx, bgcolor: tokens.brand.primary, boxShadow: 'none', '&:hover': { bgcolor: tokens.brand.primaryDark } }}
          >
            Add client
          </Button>
        </Box>
      </Box>

      {error && !open && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {clients.isError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(clients.error, 'Could not load clients')}</Alert>}

      {clients.isLoading ? (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
      ) : list.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography sx={{ color: isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary }}>
            No clients yet. Add a client to start invoicing them.
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          {list.map((client) => (
            <Paper
              key={client._id}
              onClick={() => navigate(`/invoices/clients/${client._id}`)}
              sx={{
                p: 2,
                cursor: 'pointer',
                borderRadius: '12px',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: 'none',
                '&:hover': { borderColor: tokens.brand.primary },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start', mb: 1 }}>
                <Typography sx={{ fontWeight: 700, color: isDarkMode ? '#fff' : tokens.text.primary }}>
                  {client.name}
                </Typography>
                <Chip size="small" label={client.isArchived ? 'Archived' : 'Active'} />
              </Box>
              <Typography sx={{ fontSize: '0.875rem', color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary }}>
                {client.email}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', mt: 0.5, color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary }}>
                NTN / Reg no. {client.ntn}
              </Typography>
              {(client.phone || client.industry || client.location) && (
                <Typography sx={{ fontSize: '0.875rem', mt: 0.5, color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary }}>
                  {[client.phone, client.industry, client.location].filter(Boolean).join(' · ')}
                </Typography>
              )}
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  mt: 0.5,
                  color: isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {client.address}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1 }}>New client</DialogTitle>
        <DialogContent sx={{ pt: '4px !important', pb: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 1.25 }}>{error}</Alert>}
          <InvoiceClientFields value={form} onChange={setForm} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pt: 0, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={save} variant="contained" disabled={mutations.createClient.isPending} sx={{ textTransform: 'none', bgcolor: tokens.brand.primary }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoicesPage;
