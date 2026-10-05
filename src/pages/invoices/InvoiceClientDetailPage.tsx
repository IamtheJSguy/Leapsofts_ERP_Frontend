import { useState, useMemo } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';

import { useNavigate, useParams } from 'react-router-dom';
import { tokens } from '@/styles/tokens';
import { usePermissions } from '@/hooks/usePermissions';
import { useInvoiceLeave } from '@/components/invoices/InvoiceLeaveGuard';
import { InvoiceClientFields } from '@/components/invoices/InvoiceClientFields';
import { useInvoiceClients, useInvoiceMutations, useInvoices, useInvoiceSettings } from '@/hooks/api/useInvoices';
import {
  exportInvoiceRecordToPdf,
  invoiceElementToPdfBlob,
  previewDataFromInvoice,
  renderInvoicePreviewToBlob,
} from '@/lib/invoicePdfExport';
import { InvoiceSendConfirmModal } from '@/components/invoices/InvoiceSendConfirmModal';
import type { InvoicePreviewData } from '@/components/invoices/InvoiceTemplatePreview';
import { showApiError, useApiErrorToast } from '@/utils/apiError';
import { clientToForm, emptyClientForm, formatInvoiceMoney, type InvoiceClient, type InvoiceClientForm, type InvoiceRecord, type InvoiceStatus } from '@/types/invoice';

const FILTERS: Array<{ id: '' | InvoiceStatus | 'overdue'; label: string }> = [
  { id: '', label: 'All Invoices' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'paid', label: 'Paid' },
  { id: 'void', label: 'Void' },
];

const getStatusStyle = (status: InvoiceStatus, overdue: boolean, isDarkMode: boolean) => {
  if (overdue) {
    return {
      label: 'OVERDUE',
      color: '#EF4444',
      bg: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.3)',
    };
  }
  switch (status) {
    case 'paid':
      return {
        label: 'PAID',
        color: '#10B981',
        bg: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.3)',
      };
    case 'sent':
      return {
        label: 'SENT',
        color: '#3B82F6',
        bg: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
        border: 'rgba(59, 130, 246, 0.3)',
      };
    case 'draft':
      return {
        label: 'DRAFT',
        color: isDarkMode ? '#FBBF24' : '#D97706',
        bg: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)',
        border: 'rgba(245, 158, 11, 0.3)',
      };
    case 'void':
    default:
      return {
        label: 'VOID',
        color: 'text.secondary',
        bg: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        border: 'rgba(0,0,0,0.1)',
      };
  }
};

const dateLabel = (value: string) => value.slice(0, 10);

const PROFILE_GROUPS: Array<{
  category: string;
  fields: Array<{ label: string; key: keyof InvoiceClientForm; fullWidth?: boolean }>;
}> = [
  {
    category: 'Contact & Company Overview',
    fields: [
      { label: 'Contact Name', key: 'contactName' },
      { label: 'Job Title', key: 'jobTitle' },
      { label: 'Industry', key: 'industry' },
      { label: 'Website', key: 'website' },
    ],
  },
  {
    category: 'Demographics & Commercial Terms',
    fields: [
      { label: 'Location', key: 'location' },
      { label: 'Company Size', key: 'companySize' },
      { label: 'Budget', key: 'budget' },
      { label: 'Decision Timeline', key: 'decisionTimeline' },
    ],
  },
  {
    category: 'Qualitative Information & Notes',
    fields: [
      { label: 'Company Details', key: 'companyDetails' },
      { label: 'Pain Points', key: 'painPoints' },
      { label: 'Notes', key: 'notes', fullWidth: true },
    ],
  },
];

const ProfileValue = ({ client, field, isDarkMode }: { client: InvoiceClient; field: keyof InvoiceClientForm; isDarkMode: boolean }) => {
  const val = client[field];
  if (!val) return <Typography sx={{ color: 'text.disabled', fontSize: '0.825rem', fontStyle: 'italic' }}>—</Typography>;

  if (field === 'website') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
        <LanguageIcon sx={{ fontSize: 14, color: tokens.brand.primary }} />
        <Typography
          component="a"
          href={val.startsWith('http') ? val : `https://${val}`}
          target="_blank"
          rel="noreferrer"
          sx={{ color: tokens.brand.primary, fontSize: '0.825rem', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          {val}
        </Typography>
      </Box>
    );
  }
  return (
    <Typography sx={{ color: isDarkMode ? '#ffffff' : tokens.text.primary, fontSize: '0.825rem', fontWeight: 600, mt: 0.25, whiteSpace: 'pre-wrap' }}>
      {val}
    </Typography>
  );
};

const ClientProfile = ({ client, isDarkMode }: { client: InvoiceClient; isDarkMode: boolean }) => {
  const [expanded, setExpanded] = useState(false);

  // Count populated fields
  const activeFields = PROFILE_GROUPS.flatMap((g) => g.fields).filter((f) => Boolean(client[f.key]));
  if (activeFields.length === 0) return null;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '18px',
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#ffffff',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(0,0,0,0.02)',
        mb: 2.5,
        overflow: 'hidden',
      }}
    >
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          py: 1.5,
          px: 2.5,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(93, 26, 137, 0.015)',
          '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(93, 26, 137, 0.03)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem' }}>
            Client Profile
          </Typography>
          <Chip
            label={`${activeFields.length} ${activeFields.length === 1 ? 'detail' : 'details'}`}
            size="small"
            sx={{
              height: 20,
              px: 0.5,
              fontSize: '0.65rem',
              fontWeight: 800,
              bgcolor: isDarkMode ? 'rgba(155,107,184,0.15)' : 'rgba(93,26,137,0.08)',
              color: tokens.brand.primary,
              borderRadius: '6px',
            }}
          />
        </Box>

        <Button
          size="small"
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ textTransform: 'none', fontWeight: 750, fontSize: '0.78rem', color: tokens.brand.primary, p: 0, minWidth: 0 }}
        >
          {expanded ? 'Hide Details' : 'View Profile Details'}
        </Button>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2.5, pt: 2, borderTop: `1px dashed ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {PROFILE_GROUPS.map((group) => {
            const groupActiveFields = group.fields.filter((f) => Boolean(client[f.key]));
            if (groupActiveFields.length === 0) return null;

            return (
              <Box key={group.category}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 750,
                    fontSize: '0.68rem',
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    display: 'block',
                    mb: 1.25,
                  }}
                >
                  {group.category}
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                    gap: 1.5,
                  }}
                >
                  {groupActiveFields.map((f) => (
                    <Paper
                      key={f.key}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.025)' : '#F8FAFC',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                        gridColumn: f.fullWidth ? '1 / -1' : f.key === 'companyDetails' || f.key === 'painPoints' ? { xs: '1 / -1', md: 'span 2' } : undefined,
                        borderLeft: f.key === 'notes' ? `3px solid ${tokens.brand.primary}` : undefined,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {f.label}
                      </Typography>
                      <ProfileValue client={client} field={f.key} isDarkMode={isDarkMode} />
                    </Paper>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Card>
  );
};

const headerButtonSx = {
  textTransform: 'none',
  height: 38,
  minHeight: 38,
  py: 0,
  px: 2,
  fontWeight: 750,
  fontSize: '0.825rem',
  borderRadius: '12px',
};

const InvoiceClientDetailPage = () => {
  const { clientId = '' } = useParams();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const clients = useInvoiceClients(true);
  const settings = useInvoiceSettings();
  const mutations = useInvoiceMutations();
  const [filter, setFilter] = useState<'' | InvoiceStatus | 'overdue'>('');
  const [issuedFrom, setIssuedFrom] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const dateRangeInvalid = Boolean(issuedFrom && issuedTo && issuedFrom > issuedTo);
  const invoices = useInvoices(
    filter || undefined,
    clientId || undefined,
    issuedFrom || undefined,
    issuedTo || undefined,
  );
  useApiErrorToast(clients.error, clients.isError);
  useApiErrorToast(invoices.error, invoices.isError);
  const [notice, setNotice] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendConfirmInvoice, setSendConfirmInvoice] = useState<InvoiceRecord | null>(null);
  const [sendPreviewData, setSendPreviewData] = useState<InvoicePreviewData | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<InvoiceClientForm>(emptyClientForm());
  const [baseline, setBaseline] = useState('');

  const client = (clients.data || []).find((item) => item._id === clientId);

  const startEdit = () => {
    if (!client) return;
    const next = clientToForm(client);
    setForm(next);
    setBaseline(JSON.stringify(next));
    setOpen(true);
  };

  const save = async (): Promise<boolean> => {
    try {
      await mutations.updateClient.mutateAsync({ id: clientId, body: form });
      setBaseline(JSON.stringify(form));
      setOpen(false);
      return true;
    } catch (err) {
      showApiError(err);
      return false;
    }
  };

  const { dialog } = useInvoiceLeave(
    open && JSON.stringify(form) !== baseline,
    save,
    mutations.updateClient.isPending,
  );

  const run = async (action: () => Promise<unknown>) => {
    setNotice('');
    try {
      await action();
    } catch (err) {
      showApiError(err);
    }
  };

  const openSendConfirm = (invoice: InvoiceRecord) => {
    setNotice('');
    setSendConfirmInvoice(invoice);
    setSendPreviewData(previewDataFromInvoice(invoice, settings.data?.bankAccounts || []));
  };

  const confirmSendInvoice = async (previewElement: HTMLElement) => {
    if (!sendConfirmInvoice) return;
    setSendingId(sendConfirmInvoice._id);
    try {
      const pdf = await invoiceElementToPdfBlob(previewElement);
      await mutations.sendInvoice.mutateAsync({ id: sendConfirmInvoice._id, pdf });
      setSendConfirmInvoice(null);
      setSendPreviewData(null);
      setNotice('Invoice sent successfully');
    } catch (err) {
      showApiError(err);
    } finally {
      setSendingId(null);
    }
  };

  const invoiceList = invoices.data || [];

  const { totalBilled, totalPaid, totalPending, currency } = useMemo(() => {
    let billed = 0;
    let paid = 0;
    let pending = 0;
    let curr = 'PKR';
    for (const inv of invoiceList) {
      if (inv.currency) curr = inv.currency;
      billed += inv.grandTotal || 0;
      if (inv.status === 'paid') {
        paid += inv.grandTotal || 0;
      } else if (inv.status === 'sent' || inv.status === 'draft' || inv.overdue) {
        pending += inv.grandTotal || 0;
      }
    }
    return { totalBilled: billed, totalPaid: paid, totalPending: pending, currency: curr };
  }, [invoiceList]);

  if (clients.isLoading) {
    return (
      <Box sx={{ p: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={36} sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ pb: 4 }}>
        <Button onClick={() => navigate('/invoices')} startIcon={<ArrowBackIcon />} sx={{ textTransform: 'none', mb: 2, fontWeight: 700 }}>
          Back to Client Directory
        </Button>
        {!clients.isError && (
          <Alert severity="error" sx={{ borderRadius: '14px' }}>
            Client profile not found
          </Alert>
        )}
      </Box>
    );
  }

  const initial = (client.name?.charAt(0) || 'C').toUpperCase();

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
      {dialog}

      {/* Back Button */}
      <Button
        onClick={() => navigate('/invoices')}
        startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
        sx={{ textTransform: 'none', px: 1, py: 0.5, mb: 1.5, fontWeight: 750, fontSize: '0.825rem', color: 'text.secondary' }}
      >
        Back to Clients
      </Button>

      {/* Compact Executive Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          borderRadius: '20px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.55)' : '#ffffff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: isDarkMode ? 'none' : '0 2px 12px rgba(26, 22, 37, 0.03)',
          mb: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, minWidth: 0, flex: '1 1 240px' }}>
          <Avatar
            sx={{
              width: 46,
              height: 46,
              borderRadius: '14px',
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(93, 26, 137, 0.5) 0%, rgba(155, 107, 184, 0.25) 100%)'
                : 'linear-gradient(135deg, #F3E8FF 0%, #FFFFFF 100%)',
              border: `1.5px solid ${isDarkMode ? 'rgba(149, 99, 184, 0.35)' : 'rgba(93, 26, 137, 0.15)'}`,
              color: isDarkMode ? '#E9D5FF' : tokens.brand.primary,
              fontWeight: 850,
              fontSize: '1.2rem',
              flexShrink: 0,
            }}
          >
            {initial}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mb: 0.25 }}>
              <Typography variant="h5" sx={{ fontWeight: 850, letterSpacing: '-0.02em', color: isDarkMode ? '#fff' : tokens.text.primary, fontSize: '1.25rem' }}>
                {client.name}
              </Typography>
              <Chip
                size="small"
                label={client.isArchived ? 'Archived' : 'Active'}
                sx={{
                  height: 22,
                  px: 0.5,
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  bgcolor: client.isArchived
                    ? isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
                    : isDarkMode ? 'rgba(45, 138, 94, 0.18)' : 'rgba(45, 138, 94, 0.1)',
                  color: client.isArchived ? 'text.secondary' : tokens.semantic.success,
                  border: `1px solid ${
                    client.isArchived
                      ? isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                      : 'rgba(45, 138, 94, 0.3)'
                  }`,
                  borderRadius: '6px',
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: { xs: 'flex-start', lg: 'center' }, flexWrap: 'wrap', gap: { xs: 0.65, lg: 1.75 }, mt: 0.75, color: 'text.secondary', fontSize: '0.8rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                <EmailOutlinedIcon sx={{ fontSize: 14, color: tokens.brand.primary, flexShrink: 0 }} />
                <Box component="span" sx={{ overflowWrap: 'anywhere' }}>{client.email}</Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ReceiptLongOutlinedIcon sx={{ fontSize: 14, flexShrink: 0 }} />
                <span>NTN: <strong>{client.ntn || '—'}</strong></span>
              </Box>
              {(client.location || client.address) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                  <LocationOnOutlinedIcon sx={{ fontSize: 14, flexShrink: 0 }} />
                  <Box component="span" sx={{ overflowWrap: 'anywhere' }}>{client.location || client.address}</Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 1, flexShrink: 0, alignItems: { xs: 'stretch', lg: 'center' }, minWidth: { xs: 168, lg: 'auto' } }}>
          <Button
            size="small"
            variant="outlined"
            onClick={startEdit}
            startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
            sx={{
              ...headerButtonSx,
              borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
              color: 'text.primary',
              '&:hover': {
                borderColor: tokens.brand.primary,
                color: tokens.brand.primary,
              }
            }}
          >
            Edit Profile
          </Button>

          {client.isArchived ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<UnarchiveOutlinedIcon sx={{ fontSize: 15 }} />}
              sx={{ ...headerButtonSx, borderColor: 'rgba(0,0,0,0.15)', color: 'text.primary' }}
              disabled={mutations.unarchiveClient.isPending}
              onClick={() => run(() => mutations.unarchiveClient.mutateAsync(client._id))}
            >
              Unarchive
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<ArchiveOutlinedIcon sx={{ fontSize: 15 }} />}
              sx={{ ...headerButtonSx, borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', color: 'text.secondary' }}
              disabled={mutations.archiveClient.isPending}
              onClick={() => run(() => mutations.archiveClient.mutateAsync(client._id))}
            >
              Archive
            </Button>
          )}

          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: '17px !important' }} />}
            disabled={client.isArchived}
            onClick={() => navigate(`/invoices/new?clientId=${client._id}`)}
            sx={{
              ...headerButtonSx,
              bgcolor: tokens.brand.primary,
              boxShadow: '0 4px 14px rgba(93, 26, 137, 0.25)',
              '&:hover': {
                bgcolor: tokens.brand.primaryDark,
              },
            }}
          >
            Create Invoice
          </Button>
        </Box>
      </Paper>

      {/* Financial Quick Stats Grid (3 Cards) */}
      {/* <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          gap: 2,
          mb: 2.5,
        }}
      >
        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '16px',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#ffffff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.75,
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              bgcolor: isDarkMode ? 'rgba(155,107,184,0.15)' : 'rgba(93,26,137,0.08)',
              color: tokens.brand.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, display: 'block', fontSize: '0.72rem' }}>
              Total Billed
            </Typography>
            <Typography variant="h6" noWrap sx={{ fontWeight: 850, fontSize: '1.1rem', color: isDarkMode ? '#fff' : tokens.text.primary }}>
              {formatInvoiceMoney(currency, totalBilled)}
            </Typography>
          </Box>
        </Card>

        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '16px',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#ffffff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.75,
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PaymentsOutlinedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, display: 'block', fontSize: '0.72rem' }}>
              Total Paid (Collected)
            </Typography>
            <Typography variant="h6" noWrap sx={{ fontWeight: 850, fontSize: '1.1rem', color: '#10B981' }}>
              {formatInvoiceMoney(currency, totalPaid)}
            </Typography>
          </Box>
        </Card>

        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '16px',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#ffffff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.75,
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              bgcolor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)',
              color: isDarkMode ? '#FBBF24' : '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <HourglassEmptyOutlinedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, display: 'block', fontSize: '0.72rem' }}>
              Pending / Due Balance
            </Typography>
            <Typography variant="h6" noWrap sx={{ fontWeight: 850, fontSize: '1.1rem', color: isDarkMode ? '#FBBF24' : '#D97706' }}>
              {formatInvoiceMoney(currency, totalPending)}
            </Typography>
          </Box>
        </Card>
      </Box> */}

      {/* Collapsible Profile Drawer */}
      <ClientProfile client={client} isDarkMode={isDarkMode} />

      {notice && <Alert severity="success" sx={{ mb: 2.5, borderRadius: '14px' }}>{notice}</Alert>}
      {/* Invoices Toolbar & History Table */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: isDarkMode ? '#fff' : tokens.text.primary,
            letterSpacing: '-0.01em',
            pt: 0.5,
            mr: 'auto',
          }}
        >
          Billing History & Invoices
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1.25,
            maxWidth: '100%',
          }}
        >
          <TextField
            select
            size="small"
            label="Invoice type"
            value={filter}
            onChange={(event) => setFilter(event.target.value as '' | InvoiceStatus | 'overdue')}
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (value) => FILTERS.find((item) => item.id === value)?.label || 'All Invoices',
            }}
            sx={{
              width: 160,
              '& .MuiOutlinedInput-root': { borderRadius: '10px', height: 40 },
              '& .MuiSelect-select': { fontWeight: 700, fontSize: '0.85rem' },
            }}
          >
            {FILTERS.map((item) => (
              <MenuItem key={item.id || 'all'} value={item.id} sx={{ fontWeight: 650, fontSize: '0.85rem' }}>
                {item.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            type="date"
            label="Issued from"
            value={issuedFrom}
            onChange={(event) => setIssuedFrom(event.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: issuedTo || undefined }}
            sx={{ width: 168, '& .MuiOutlinedInput-root': { borderRadius: '10px', height: 40 } }}
          />
          <TextField
            size="small"
            type="date"
            label="Issued to"
            value={issuedTo}
            onChange={(event) => setIssuedTo(event.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: issuedFrom || undefined }}
            error={dateRangeInvalid}
            sx={{ width: 168, '& .MuiOutlinedInput-root': { borderRadius: '10px', height: 40 } }}
          />
          {(issuedFrom || issuedTo) && (
            <Button
              size="small"
              onClick={() => {
                setIssuedFrom('');
                setIssuedTo('');
              }}
              sx={{ textTransform: 'none', fontWeight: 700, minWidth: 0, color: 'text.secondary' }}
            >
              Clear dates
            </Button>
          )}
        </Box>
      </Box>
      {dateRangeInvalid && (
        <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: 'error.main', fontWeight: 650, textAlign: 'right' }}>
          Issued from must be on or before issued to.
        </Typography>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#ffffff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: isDarkMode ? 'none' : '0 2px 12px rgba(26, 22, 37, 0.03)',
          overflow: 'hidden',
        }}
      >
        {invoices.isLoading ? (
          <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={32} sx={{ color: tokens.brand.primary }} />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
          <Table
            size="medium"
            sx={{
              minWidth: 820,
              '& th, & td': { whiteSpace: 'nowrap' },
            }}
          >
            <TableHead>
              <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', py: 1.75 }}>
                  Invoice Number
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                  Issue Date
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                  Due Date
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                  Grand Total
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                  Status
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', pr: 3 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(invoices.data || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center', color: 'text.secondary', fontWeight: 600 }}>
                    {dateRangeInvalid
                      ? 'Issued from must be on or before issued to.'
                      : issuedFrom || issuedTo
                        ? 'No invoices were issued in this date range.'
                        : 'No invoice records found for this filter.'}
                  </TableCell>
                </TableRow>
              )}
              {(invoices.data || []).map((invoice) => {
                const st = getStatusStyle(invoice.status, invoice.overdue, isDarkMode);
                return (
                  <TableRow
                    key={invoice._id}
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(93,26,137,0.02)',
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: isDarkMode ? '#fff' : tokens.text.primary }}>
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.825rem', color: 'text.secondary', fontWeight: 550 }}>
                      {dateLabel(invoice.issueDate)}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.825rem', color: 'text.secondary', fontWeight: 550 }}>
                      {dateLabel(invoice.dueDate)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 850, fontSize: '0.9rem', color: tokens.brand.primary }}>
                      {formatInvoiceMoney(invoice.currency, invoice.grandTotal)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={st.label}
                        sx={{
                          height: 22,
                          fontSize: '0.64rem',
                          fontWeight: 850,
                          bgcolor: st.bg,
                          color: st.color,
                          border: `1px solid ${st.border}`,
                          borderRadius: '6px',
                          px: 0.5,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 2 }}>
                      <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Button
                          size="small"
                          onClick={() => navigate(`/invoices/${invoice._id}?clientId=${client._id}`)}
                          startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', borderRadius: '8px' }}
                        >
                          Open
                        </Button>
                        
                        <Button
                          size="small"
                          startIcon={downloadingId === invoice._id ? <CircularProgress size={13} color="inherit" /> : <DownloadIcon sx={{ fontSize: 14 }} />}
                          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', borderRadius: '8px' }}
                          disabled={downloadingId === invoice._id}
                          onClick={() =>
                            run(async () => {
                              setDownloadingId(invoice._id);
                              try {
                                await exportInvoiceRecordToPdf(invoice, settings.data?.bankAccounts || []);
                              } finally {
                                setDownloadingId(null);
                              }
                            })
                          }
                        >
                          PDF
                        </Button>

                        {invoice.status === 'draft' && (
                          <Button
                            size="small"
                            color="primary"
                            startIcon={<SendIcon sx={{ fontSize: 14 }} />}
                            sx={{ textTransform: 'none', fontWeight: 750, fontSize: '0.78rem', borderRadius: '8px' }}
                            disabled={sendingId === invoice._id}
                            onClick={() => openSendConfirm(invoice)}
                          >
                            Send
                          </Button>
                        )}

                        {invoice.status === 'sent' && (
                          <Button
                            size="small"
                            color="success"
                            startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                            sx={{ textTransform: 'none', fontWeight: 750, fontSize: '0.78rem', borderRadius: '8px' }}
                            onClick={() => run(async () => {
                              const pdf = await renderInvoicePreviewToBlob(
                                previewDataFromInvoice(invoice, settings.data?.bankAccounts || [], true),
                              );
                              await mutations.markPaid.mutateAsync({ id: invoice._id, pdf });
                            })}
                          >
                            Mark Paid
                          </Button>
                        )}

                        {(invoice.status === 'draft' || invoice.status === 'sent') && (
                          <Button
                            size="small"
                            color="inherit"
                            startIcon={<BlockIcon sx={{ fontSize: 14 }} />}
                            sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', borderRadius: '8px', color: 'text.secondary' }}
                            onClick={() => run(() => mutations.voidInvoice.mutateAsync(invoice._id))}
                          >
                            Void
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </Box>
        )}
      </Paper>

      {/* Edit Client Modal */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDarkMode ? 'rgba(24, 21, 30, 0.98)' : '#FFFFFF',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: isDarkMode ? '0 24px 48px rgba(0,0,0,0.6)' : '0 20px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 3.5, fontWeight: 800, fontSize: '1.25rem' }}>
          Edit client profile
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important', pb: 2, px: 3.5 }}>
          <InvoiceClientFields value={form} onChange={setForm} />
        </DialogContent>
        <DialogActions sx={{ px: 3.5, pt: 1, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setOpen(false)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '12px',
              color: 'text.secondary',
              px: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={save}
            variant="contained"
            disabled={mutations.updateClient.isPending}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: '12px',
              bgcolor: tokens.brand.primary,
              px: 3,
              py: 0.8,
              boxShadow: '0 4px 14px rgba(93,26,137,0.25)',
              '&:hover': {
                bgcolor: tokens.brand.primaryDark,
              }
            }}
          >
            {mutations.updateClient.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <InvoiceSendConfirmModal
        open={Boolean(sendConfirmInvoice)}
        data={sendPreviewData}
        clientEmail={sendConfirmInvoice?.clientSnapshot?.email || client?.email}
        submitting={Boolean(sendingId)}
        onClose={() => {
          if (sendingId) return;
          setSendConfirmInvoice(null);
          setSendPreviewData(null);
        }}
        onConfirm={confirmSendInvoice}
      />
    </Box>
  );
};

export default InvoiceClientDetailPage;

