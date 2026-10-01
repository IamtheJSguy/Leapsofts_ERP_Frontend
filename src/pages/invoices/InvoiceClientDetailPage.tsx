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
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import { tokens } from '@/styles/tokens';
import { usePermissions } from '@/hooks/usePermissions';
import { InvoiceSettingsButton } from '@/components/invoices/InvoiceSettingsButton';
import { useInvoiceLeave } from '@/components/invoices/InvoiceLeaveGuard';
import { InvoiceClientFields } from '@/components/invoices/InvoiceClientFields';
import { apiErrorMessage, useInvoiceClients, useInvoiceMutations, useInvoices } from '@/hooks/api/useInvoices';
import { clientToForm, emptyClientForm, formatInvoiceMoney, type InvoiceClient, type InvoiceClientForm, type InvoiceStatus } from '@/types/invoice';

const FILTERS: Array<{ id: '' | InvoiceStatus | 'overdue'; label: string }> = [
  { id: '', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'paid', label: 'Paid' },
  { id: 'void', label: 'Void' },
];

const statusColor = (status: InvoiceStatus, overdue: boolean) => {
  if (overdue) return 'warning';
  if (status === 'paid') return 'success';
  if (status === 'sent') return 'info';
  if (status === 'void') return 'default';
  return 'default';
};

const dateLabel = (value: string) => value.slice(0, 10);

const SHORT_ROWS: Array<{ label: string; key: keyof InvoiceClientForm }> = [
  { label: 'Contact', key: 'contactName' },
  { label: 'Job title', key: 'jobTitle' },
  { label: 'Phone', key: 'phone' },
  { label: 'Website', key: 'website' },
  { label: 'Industry', key: 'industry' },
  { label: 'Company size', key: 'companySize' },
  { label: 'Location', key: 'location' },
];

const WIDE_ROWS: Array<{ label: string; key: keyof InvoiceClientForm }> = [
  { label: 'Company details', key: 'companyDetails' },
  { label: 'Pain points', key: 'painPoints' },
  { label: 'Budget', key: 'budget' },
  { label: 'Decision timeline', key: 'decisionTimeline' },
  { label: 'Notes', key: 'notes' },
];

const ProfileValue = ({ client, field, isDarkMode }: { client: InvoiceClient; field: keyof InvoiceClientForm; isDarkMode: boolean }) => {
  if (field === 'website') {
    return (
      <Typography
        component="a"
        href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
        target="_blank"
        rel="noreferrer"
        sx={{ color: tokens.brand.primary, fontSize: '0.875rem', lineHeight: 1.3 }}
      >
        {client.website}
      </Typography>
    );
  }
  return (
    <Typography sx={{ color: isDarkMode ? 'rgba(255,255,255,0.75)' : tokens.text.primary, fontSize: '0.875rem', lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>
      {client[field]}
    </Typography>
  );
};

const ClientProfile = ({ client, isDarkMode }: { client: InvoiceClient; isDarkMode: boolean }) => {
  const shortRows = SHORT_ROWS.filter((row) => client[row.key]);
  const wideRows = WIDE_ROWS.filter((row) => client[row.key]);
  if (shortRows.length === 0 && wideRows.length === 0) return null;
  return (
    <Box sx={{ mt: 0.5, mb: 2 }}>
      {shortRows.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
            columnGap: 2,
            rowGap: 1,
          }}
        >
          {shortRows.map((row) => (
            <Box key={row.key} sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 700, lineHeight: 1.2 }}>
                {row.label}
              </Typography>
              <ProfileValue client={client} field={row.key} isDarkMode={isDarkMode} />
            </Box>
          ))}
        </Box>
      )}
      {wideRows.length > 0 && (
        <Box
          sx={{
            mt: shortRows.length > 0 ? 1.25 : 0,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            columnGap: 2,
            rowGap: 1,
          }}
        >
          {wideRows.map((row) => (
            <Box key={row.key} sx={{ minWidth: 0, gridColumn: row.key === 'notes' ? '1 / -1' : undefined }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 700, lineHeight: 1.2 }}>
                {row.label}
              </Typography>
              <ProfileValue client={client} field={row.key} isDarkMode={isDarkMode} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

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

const InvoiceClientDetailPage = () => {
  const { clientId = '' } = useParams();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const clients = useInvoiceClients(true);
  const mutations = useInvoiceMutations();
  const [filter, setFilter] = useState<'' | InvoiceStatus | 'overdue'>('');
  const invoices = useInvoices(filter || undefined, clientId || undefined);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<InvoiceClientForm>(emptyClientForm());
  const [baseline, setBaseline] = useState('');

  const client = (clients.data || []).find((item) => item._id === clientId);

  const startEdit = () => {
    if (!client) return;
    const next = clientToForm(client);
    setError('');
    setForm(next);
    setBaseline(JSON.stringify(next));
    setOpen(true);
  };

  const save = async (): Promise<boolean> => {
    setError('');
    try {
      await mutations.updateClient.mutateAsync({ id: clientId, body: form });
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
    mutations.updateClient.isPending,
  );

  const run = async (action: () => Promise<unknown>) => {
    setError('');
    setNotice('');
    try {
      await action();
    } catch (err) {
      setError(apiErrorMessage(err, 'Something went wrong'));
    }
  };

  const sendInvoice = async (id: string) => {
    setError('');
    setNotice('');
    setSendingId(id);
    try {
      await mutations.sendInvoice.mutateAsync(id);
      setNotice('Invoice emailed to the client.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send the invoice'));
    } finally {
      setSendingId(null);
    }
  };

  if (clients.isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ pb: 4 }}>
        <Button onClick={() => navigate('/invoices')} sx={{ textTransform: 'none', mb: 2 }}>Back</Button>
        <Alert severity="error">{clients.isError ? apiErrorMessage(clients.error, 'Could not load the client') : 'Client not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {dialog}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Button onClick={() => navigate('/invoices')} sx={{ textTransform: 'none', px: 0, mb: 0.25, color: 'text.secondary' }}>
            Back
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.025em', color: isDarkMode ? '#fff' : tokens.text.primary }}>
              {client.name}
            </Typography>
            <Chip size="small" label={client.isArchived ? 'Archived' : 'Active'} />
          </Box>
          <Typography sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary, mt: 0.25, fontSize: '0.875rem' }}>
            {[client.email, `NTN / Reg no. ${client.ntn}`, client.address].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', alignSelf: 'flex-start' }}>
          {isAdmin && <InvoiceSettingsButton isDarkMode={isDarkMode} />}
          <Button size="small" onClick={startEdit} sx={headerButtonSx}>Edit</Button>
          {client.isArchived ? (
            <Button
              size="small"
              sx={headerButtonSx}
              disabled={mutations.unarchiveClient.isPending}
              onClick={() => run(() => mutations.unarchiveClient.mutateAsync(client._id))}
            >
              Unarchive
            </Button>
          ) : (
            <Button
              size="small"
              color="inherit"
              sx={headerButtonSx}
              disabled={mutations.archiveClient.isPending}
              onClick={() => run(() => mutations.archiveClient.mutateAsync(client._id))}
            >
              Archive
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            disabled={client.isArchived}
            onClick={() => navigate(`/invoices/new?clientId=${client._id}`)}
            sx={{
              ...headerButtonSx,
              bgcolor: tokens.brand.primary,
              boxShadow: 'none',
              '&:hover': { bgcolor: tokens.brand.primaryDark },
            }}
          >
            New invoice
          </Button>
        </Box>
      </Box>
      <ClientProfile client={client} isDarkMode={isDarkMode} />

      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
      {error && !open && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {invoices.isError && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage(invoices.error, 'Could not load invoices')}</Alert>}

      <TextField
        select
        size="small"
        label="Status"
        value={filter}
        onChange={(event) => setFilter(event.target.value as '' | InvoiceStatus | 'overdue')}
        sx={{ mb: 2, minWidth: 180 }}
      >
        {FILTERS.map((item) => (
          <MenuItem key={item.id || 'all'} value={item.id}>{item.label}</MenuItem>
        ))}
      </TextField>

      <Paper sx={{ overflow: 'auto' }}>
        {invoices.isLoading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Number</TableCell>
                <TableCell>Issued</TableCell>
                <TableCell>Due</TableCell>
                <TableCell align="right">Grand total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(invoices.data || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>No invoices for this client yet.</TableCell>
                </TableRow>
              )}
              {(invoices.data || []).map((invoice) => (
                <TableRow key={invoice._id} hover>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{dateLabel(invoice.issueDate)}</TableCell>
                  <TableCell>{dateLabel(invoice.dueDate)}</TableCell>
                  <TableCell align="right">{formatInvoiceMoney(invoice.currency, invoice.grandTotal)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={invoice.overdue ? 'Overdue' : invoice.status}
                      color={statusColor(invoice.status, invoice.overdue)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => navigate(`/invoices/${invoice._id}`)} sx={{ textTransform: 'none' }}>Open</Button>
                    <Button
                      size="small"
                      sx={{ textTransform: 'none' }}
                      onClick={() => run(() => mutations.download(invoice._id, `invoice-${invoice.invoiceNumber}.pdf`))}
                    >
                      PDF
                    </Button>
                    {invoice.status === 'draft' && (
                      <Button
                        size="small"
                        sx={{ textTransform: 'none' }}
                        disabled={sendingId === invoice._id}
                        onClick={() => sendInvoice(invoice._id)}
                      >
                        Send
                      </Button>
                    )}
                    {invoice.status === 'sent' && (
                      <Button size="small" sx={{ textTransform: 'none' }} onClick={() => run(() => mutations.markPaid.mutateAsync(invoice._id))}>
                        Mark paid
                      </Button>
                    )}
                    {(invoice.status === 'draft' || invoice.status === 'sent') && (
                      <Button size="small" color="inherit" sx={{ textTransform: 'none' }} onClick={() => run(() => mutations.voidInvoice.mutateAsync(invoice._id))}>
                        Void
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1 }}>Edit client</DialogTitle>
        <DialogContent sx={{ pt: '4px !important', pb: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 1.25 }}>{error}</Alert>}
          <InvoiceClientFields value={form} onChange={setForm} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pt: 0, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={save} variant="contained" disabled={mutations.updateClient.isPending} sx={{ textTransform: 'none', bgcolor: tokens.brand.primary }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceClientDetailPage;
