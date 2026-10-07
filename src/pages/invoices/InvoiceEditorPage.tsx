import { useEffect, useMemo, useRef, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GavelIcon from '@mui/icons-material/Gavel';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';

import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { tokens } from '@/styles/tokens';
import { useInvoiceLeave } from '@/components/invoices/InvoiceLeaveGuard';
import { InvoiceTemplatePicker, InvoiceTemplatePreview, type InvoicePreviewData } from '@/components/invoices/InvoiceTemplatePreview';
import { InvoiceSendConfirmModal } from '@/components/invoices/InvoiceSendConfirmModal';
import { InvoiceDisputeModal } from '@/components/invoices/InvoiceDisputeModal';
import { useInvoice, useInvoiceClients, useInvoiceMutations, useInvoiceSettings, useInvoices } from '@/hooks/api/useInvoices';
import { showApiError, useApiErrorToast } from '@/utils/apiError';
import { useUIStore } from '@/store/useUIStore';

const generateNextInvoiceNumber = (invoices: any[], targetClientId?: string, targetIssueDate?: string) => {
  const year = targetIssueDate ? new Date(targetIssueDate).getFullYear() : new Date().getFullYear();
  const format = `${year}-`;

  if (!invoices || invoices.length === 0) return `${format}001`;

  const clientInvoices = invoices.filter((inv) => {
    if (!targetClientId) return false;
    return (
      inv.clientId === targetClientId ||
      inv.clientSnapshot?._id === targetClientId ||
      inv.client?._id === targetClientId ||
      inv.clientSnapshot?.id === targetClientId
    );
  });

  let maxNum = 0;
  for (const inv of clientInvoices) {
    if (inv.invoiceNumber) {
      const match = inv.invoiceNumber.match(/^(?:\d{4}-)?(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  const nextNumStr = (maxNum + 1).toString().padStart(3, '0');
  return `${format}${nextNumStr}`;
};
import { exportInvoiceElementToPdf, invoiceElementToPdfBlob, renderInvoicePreviewToBlob } from '@/lib/invoicePdfExport';
import {
  emptyClientForm,
  formatInvoiceMoney,
  roundMoney,
  type InvoiceClient,
  type InvoiceClientForm,
  type InvoiceParty,
  type InvoiceTemplateId,
  type SaveInvoicePayload,
} from '@/types/invoice';

interface LineDraft {
  description: string;
  qty: string;
  unitPrice: string;
}

const emptyParty = (): InvoiceParty => ({ name: '', ntn: '', address: '', email: '' });

const emptyBankDraft = () => ({
  paymentTitle: '',
  bankName: '',
  accountTitle: '',
  accountNumber: '',
  iban: '',
  branch: '',
});

const today = () => {
  const date = new Date();
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

const getLastDayOfMonth = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m] = dateStr.split('-');
  const date = new Date(Number(y), Number(m), 0);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const InvoiceEditorPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isNew = !id;
  const presetClientId = searchParams.get('clientId') || '';
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const settings = useInvoiceSettings();
  const clients = useInvoiceClients(false);
  const invoice = useInvoice(id);
  const mutations = useInvoiceMutations();
  const allInvoices = useInvoices();
  useApiErrorToast(settings.error, settings.isError);
  useApiErrorToast(invoice.error, !isNew && invoice.isError);
  const addToast = useUIStore((s) => s.addToast);
  const showFormError = (message: string) => addToast({ message, severity: 'error' });
  const [notice, setNotice] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [client, setClient] = useState<InvoiceParty>(emptyParty());
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(getLastDayOfMonth(today()));
  const [dueDateTouched, setDueDateTouched] = useState(false);
  const [templateId, setTemplateId] = useState<InvoiceTemplateId>('classic');
  const [taxRate, setTaxRate] = useState('0');
  const [lines, setLines] = useState<LineDraft[]>([{ description: '', qty: '1', unitPrice: '0' }]);
  const [bankAccountIds, setBankAccountIds] = useState<string[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [ccError, setCcError] = useState('');
  const [baseline, setBaseline] = useState('');
  const [clientOpen, setClientOpen] = useState(false);
  const [newClient, setNewClient] = useState<InvoiceClientForm>(emptyClientForm());
  const [bankOpen, setBankOpen] = useState(false);
  const [newBank, setNewBank] = useState(emptyBankDraft());
  const [exportingPdf, setExportingPdf] = useState(false);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(false);
  }, [id]);

  useEffect(() => {
    if (isNew && !presetClientId) {
      navigate('/invoices', { replace: true });
    }
  }, [isNew, presetClientId, navigate]);

  useEffect(() => {
    if (hydrated || !settings.data) return;
    if (!isNew && !invoice.data) return;
    if (isNew) {
      if (presetClientId && clients.isLoading) return;
      if (allInvoices.isLoading) return;
      const nextTemplate = settings.data.defaultTemplate;
      const nextTax = String(settings.data.defaultTaxRate);
      const defaultBankIds = (settings.data.bankAccounts || []).map((b) => b.id);
      const match = presetClientId
        ? (clients.data || []).find((item) => item._id === presetClientId && !item.isArchived)
        : undefined;

      if (presetClientId && !match) {
        showFormError('Invalid or archived client selected.');
        navigate('/invoices', { replace: true });
        return;
      }

      const nextClient = match
        ? { name: match.name, ntn: match.ntn, address: match.address, email: match.email }
        : emptyParty();
      const nextClientId = match?._id || '';
      const nextInvoiceNumber = generateNextInvoiceNumber(allInvoices.data || [], nextClientId, issueDate);
      setInvoiceNumber(nextInvoiceNumber);
      setTemplateId(nextTemplate);
      setTaxRate(nextTax);
      setClientId(nextClientId);
      setClient(nextClient);
      setBankAccountIds(defaultBankIds);
      setBaseline(JSON.stringify({
        invoiceNumber: nextInvoiceNumber,
        clientId: nextClientId,
        client: nextClient,
        issueDate,
        dueDate,
        templateId: nextTemplate,
        taxRate: nextTax,
        lines: [{ description: '', qty: '1', unitPrice: '0' }],
        bankAccountIds: defaultBankIds,
        ccEmails: [],
      }));
      setHydrated(true);
      return;
    }
    const current = invoice.data;
    if (!current) return;
    const nextClient = current.clientSnapshot;
    const nextLines = current.lineItems.map((line) => ({
      description: line.description,
      qty: String(line.qty),
      unitPrice: String(line.unitPrice),
    }));
    const nextIssue = current.issueDate.slice(0, 10);
    const nextDue = current.dueDate.slice(0, 10);
    const nextTax = String(current.taxRate);
    setInvoiceNumber(current.invoiceNumber);
    setClientId(current.clientId || '');
    setClient(nextClient);
    setIssueDate(nextIssue);
    setDueDate(nextDue);
    setTemplateId(current.templateId);
    setTaxRate(nextTax);
    setLines(nextLines);
    setBankAccountIds(current.bankAccountIds);
    setCcEmails(current.ccEmails || []);
    setDueDateTouched(true);
    setBaseline(JSON.stringify({
      invoiceNumber: current.invoiceNumber,
      clientId: current.clientId || '',
      client: nextClient,
      issueDate: nextIssue,
      dueDate: nextDue,
      templateId: current.templateId,
      taxRate: nextTax,
      lines: nextLines,
      bankAccountIds: current.bankAccountIds,
      ccEmails: current.ccEmails || [],
    }));
    setHydrated(true);
  }, [clients.data, clients.isLoading, dueDate, hydrated, invoice.data, isNew, issueDate, presetClientId, settings.data]);

  const locked = !isNew && invoice.data && invoice.data.status !== 'draft';
  const currency = locked
    ? (invoice.data?.currency || settings.data?.currency || 'USD')
    : (settings.data?.currency || invoice.data?.currency || 'USD');

  const totals = useMemo(() => {
    const parsed = lines.map((line) => {
      const qty = Number(line.qty);
      const unitPrice = Number(line.unitPrice);
      const amount = Number.isFinite(qty) && Number.isFinite(unitPrice) ? roundMoney(qty * unitPrice) : 0;
      return amount;
    });
    const subtotal = roundMoney(parsed.reduce((sum, amount) => sum + amount, 0));
    const rate = Number(taxRate);
    const taxAmount = Number.isFinite(rate) ? roundMoney(subtotal * rate / 100) : 0;
    return { subtotal, taxAmount, grandTotal: roundMoney(subtotal + taxAmount) };
  }, [lines, taxRate]);

  const applyClient = (nextId: string) => {
    setClientId(nextId);
    const match = (clients.data || []).find((item) => item._id === nextId);
    if (match) {
      setClient({ name: match.name, ntn: match.ntn, address: match.address, email: match.email });
    } else if (!nextId) {
      setClient(emptyParty());
    }
  };

  const draftKey = JSON.stringify({
    invoiceNumber, clientId, client, issueDate, dueDate, templateId, taxRate, lines, bankAccountIds, ccEmails
  });
  const bankDirty = bankOpen && Object.values(newBank).some((value) => value.trim());
  const invoiceDirty = hydrated && baseline !== '' && draftKey !== baseline;

  const isDuplicateNumber = (num: string) => {
    if (!num.trim()) return false;
    return (allInvoices.data || []).some(inv => 
      inv.invoiceNumber === num.trim() && 
      inv._id !== id && 
      (inv.clientId === clientId || inv.clientSnapshot?.id === clientId || inv.client?._id === clientId || inv.clientSnapshot?._id === clientId)
    );
  };

  const payload = (override?: Partial<Pick<SaveInvoicePayload, 'clientId' | 'client' | 'bankAccountIds'>>): SaveInvoicePayload | null => {
    const nextClientId = override?.clientId ?? clientId;
    const nextClient = override?.client ?? client;
    const nextBanks = override?.bankAccountIds ?? bankAccountIds;
    const lineItems = lines.map((line) => ({
      description: line.description.trim(),
      qty: Number(line.qty),
      unitPrice: Number(line.unitPrice),
    }));
    if (!invoiceNumber.trim() || !nextClientId) return null;
    if (lineItems.some((line) => !line.description || !Number.isFinite(line.qty) || line.qty <= 0 || !Number.isFinite(line.unitPrice) || line.unitPrice < 0)) {
      return null;
    }
    return {
      invoiceNumber: invoiceNumber.trim(),
      clientId: nextClientId,
      client: nextClient,
      issueDate,
      dueDate,
      templateId,
      taxRate: Number(taxRate),
      lineItems,
      bankAccountIds: nextBanks,
      ccEmails,
    } as any;
  };

  const rememberSaved = (body: SaveInvoicePayload) => {
    setBaseline(JSON.stringify({
      invoiceNumber,
      clientId: body.clientId,
      client: body.client,
      issueDate,
      dueDate,
      templateId,
      taxRate,
      lines,
      bankAccountIds: body.bankAccountIds,
      ccEmails,
    }));
  };

  const persist = async (
    override?: Partial<Pick<SaveInvoicePayload, 'clientId' | 'client' | 'bankAccountIds'>>,
    openCreated = false,
  ): Promise<boolean> => {
    const body = payload(override);
    if (!body) {
      showFormError('Fill the invoice number, select a client, and enter valid line items before saving.');
      return false;
    }
    if (isDuplicateNumber(body.invoiceNumber || invoiceNumber)) {
      showFormError('Invoice number already exists.');
      return false;
    }
    setNotice('');
    try {
      if (isNew) {
        const created = await mutations.createInvoice.mutateAsync(body);
        rememberSaved(body);
        if (openCreated) {
          allowNext();
          const returnClientId = presetClientId || created.clientId || '';
          navigate(
            returnClientId ? `/invoices/${created._id}?clientId=${returnClientId}` : `/invoices/${created._id}`,
            { replace: true },
          );
        }
      } else if (id) {
        await mutations.updateInvoice.mutateAsync({ id, body });
        rememberSaved(body);
        setNotice('Draft saved successfully.');
      }
      return true;
    } catch (err) {
      showApiError(err);
      return false;
    }
  };

  const saveForLeave = async (): Promise<boolean> => {
    const override: Partial<Pick<SaveInvoicePayload, 'clientId' | 'client' | 'bankAccountIds'>> = {};
    if (bankDirty) {
      try {
        const before = new Set((settings.data?.bankAccounts || []).map((bank) => bank.id));
        const saved = await mutations.addBank.mutateAsync({
          paymentTitle: newBank.paymentTitle.trim(),
          bankName: newBank.bankName.trim(),
          accountTitle: newBank.accountTitle.trim(),
          accountNumber: newBank.accountNumber.trim(),
          iban: newBank.iban.trim() || undefined,
          branch: newBank.branch.trim() || undefined,
        });
        const created = saved.bankAccounts.find((bank) => !before.has(bank.id));
        if (created) {
          override.bankAccountIds = [...(override.bankAccountIds || bankAccountIds), created.id];
          setBankAccountIds(override.bankAccountIds);
        }
        setNewBank(emptyBankDraft());
        setBankOpen(false);
      } catch (err) {
        showApiError(err);
        return false;
      }
    }
    if (!invoiceDirty && !override.clientId && !override.bankAccountIds) return true;
    return persist(override, false);
  };

  const returnClientId = presetClientId || invoice.data?.clientId || '';
  const exitTo = returnClientId ? `/invoices/clients/${returnClientId}` : '/invoices';
  const { dialog: leaveDialog, requestLeave, allowNext } = useInvoiceLeave(
    Boolean(!locked && (invoiceDirty || bankDirty)),
    saveForLeave,
    mutations.createInvoice.isPending || mutations.updateInvoice.isPending || mutations.addBank.isPending,
    exitTo,
  );

  const addBankNow = async () => {
    try {
      const before = new Set((settings.data?.bankAccounts || []).map((bank) => bank.id));
      const saved = await mutations.addBank.mutateAsync({
        paymentTitle: newBank.paymentTitle.trim(),
        bankName: newBank.bankName.trim(),
        accountTitle: newBank.accountTitle.trim(),
        accountNumber: newBank.accountNumber.trim(),
        iban: newBank.iban.trim() || undefined,
        branch: newBank.branch.trim() || undefined,
      });
      const created = saved.bankAccounts.find((bank) => !before.has(bank.id));
      if (created) setBankAccountIds((current) => [...current, created.id]);
      setNewBank(emptyBankDraft());
      setBankOpen(false);
      setNotice('Bank account added.');
    } catch (err) {
      showApiError(err);
    }
  };

  const previewBanks = () => {
    const accounts = settings.data?.bankAccounts || [];
    return bankAccountIds.length > 0 ? accounts.filter((bank) => bankAccountIds.includes(bank.id)) : accounts;
  };

  const buildPreviewData = (paid = invoice.data?.status === 'paid'): InvoicePreviewData => ({
    template: templateId,
    invoiceNumber,
    issueDate,
    dueDate,
    currency,
    paid,
    logoUrl: settings.data?.logoUrl,
    issuer: {
      name: settings.data?.issuerName || '',
      ntn: settings.data?.ntn || '',
      address: settings.data?.address || '',
      email: settings.data?.email || '',
    },
    client,
    lines: lines.map((line) => ({
      description: line.description,
      qty: Number(line.qty) || 0,
      unitPrice: Number(line.unitPrice) || 0,
    })),
    taxRate: Number(taxRate) || 0,
    banks: previewBanks(),
  });

  const paidPreviewBlob = () => renderInvoicePreviewToBlob(buildPreviewData(true));

  const markPaid = async () => {
    if (!id) return;
    setNotice('');
    try {
      const pdf = await paidPreviewBlob();
      await mutations.markPaid.mutateAsync({ id, pdf });
      const from = settings.data?.mailbox.email || 'your invoicing mailbox';
      setNotice(`Payment confirmation sent to ${client.email} from ${from}.`);
    } catch (err) {
      showApiError(err);
    }
  };

  const sendReminder = async () => {
    if (!id) return;
    setNotice('');
    try {
      await mutations.sendReminder.mutateAsync(id);
      setNotice('Reminder sent successfully');
    } catch (error) {
      showApiError(error);
    }
  };

  const openSendConfirm = async () => {
    if (!id) return;
    setNotice('');
    try {
      const body = payload();
      if (body && !locked) await mutations.updateInvoice.mutateAsync({ id, body });
      setSendConfirmOpen(true);
    } catch (err) {
      showApiError(err);
    }
  };

  const confirmDispute = async (reason: string) => {
    if (!id) return;
    setDisputing(true);
    try {
      await mutations.disputeInvoice.mutateAsync({ id, reason });
      setDisputeOpen(false);
      setNotice('Invoice marked as disputed.');
    } catch (err) {
      showApiError(err);
    } finally {
      setDisputing(false);
    }
  };

  const confirmSend = async (previewElement: HTMLElement) => {
    if (!id) return;
    setSendingEmail(true);
    try {
      const pdf = await invoiceElementToPdfBlob(previewElement);
      await mutations.sendInvoice.mutateAsync({ id, pdf });
      setSendConfirmOpen(false);
      setNotice('Invoice emailed to the client successfully.');
    } catch (err) {
      showApiError(err);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    const filename = `invoice-${invoiceNumber || 'draft'}.pdf`;
    try {
      if (!previewRef.current) {
        showFormError('Invoice preview is not ready to download.');
        return;
      }
      await exportInvoiceElementToPdf(previewRef.current, filename);
    } catch (err) {
      showApiError(err);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleAddEmails = (inputStr: string) => {
    const tokens = inputStr.split(/[\s,;\n]+/).map(e => e.trim().toLowerCase()).filter(Boolean);
    if (!tokens.length) return;

    let newError = '';
    const validToAdd: string[] = [];

    for (const email of tokens) {
      if (!isValidEmail(email)) {
        newError = `Invalid email: ${email}`;
        break;
      }
      validToAdd.push(email);
    }

    if (newError) {
      setCcError(newError);
      return;
    }

    const merged = Array.from(new Set([...ccEmails, ...validToAdd]));

    setCcEmails(merged);
    setCcInput('');
    setCcError('');
  };

  if (settings.isError || (!isNew && invoice.isError)) return null;

  if (settings.isLoading || (!isNew && invoice.isLoading) || !hydrated) {
    return <Box sx={{ p: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress size={36} sx={{ color: tokens.brand.primary }} /></Box>;
  }

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '14px',
      bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
      '& fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
      '&:hover fieldset': { borderColor: tokens.brand.primary },
      '&.Mui-focused fieldset': { borderColor: tokens.brand.primary },
    },
    '& .MuiInputLabel-root': { fontSize: '0.825rem', fontWeight: 600 },
    '& .MuiInputBase-input': { fontSize: '0.875rem', fontWeight: 550 },
  };

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 8 }}>
      {leaveDialog}

      {/* Top Header */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Button
            onClick={requestLeave}
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            sx={{ textTransform: 'none', px: 1, py: 0.5, mb: 1, fontWeight: 700, fontSize: '0.85rem', color: 'text.secondary' }}
          >
            {returnClientId ? 'Back to client' : 'Back to Invoices'}
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 850, letterSpacing: '-0.025em', color: isDarkMode ? '#fff' : tokens.text.primary }}>
            {isNew ? 'Invoice Studio' : invoiceNumber || 'Edit Invoice'}
          </Typography>
          <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary, fontWeight: 500, mt: 0.25 }}>
            {locked ? `This invoice is currently ${invoice.data?.overdue ? 'OVERDUE' : invoice.data?.status?.toUpperCase()}.` : 'Design, build line items, and generate real-time receipts.'}
          </Typography>
        </Box>
      </Box>

      {notice && <Alert severity="success" sx={{ mb: 2.5, borderRadius: '14px' }}>{notice}</Alert>}
      {invoice.data?.status === 'disputed' && invoice.data.disputeReason && (
        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: '14px' }}>
          <strong>Disputed:</strong> {invoice.data.disputeReason}
        </Alert>
      )}

      {/* Split-Screen Studio Grid */}
      <Grid container spacing={3.5}>
        {/* Left Column: Form Builder Workstation */}
        <Grid item xs={12} lg={6.5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Card 1: Core Invoice Metadata */}
            <Card
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#ffffff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(0,0,0,0.02)',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.75, mb: 2 }}>
                <ReceiptLongIcon sx={{ fontSize: 16 }} />
                Invoice Metadata & Client
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Invoice Number *"
                    value={invoiceNumber}
                    disabled={Boolean(locked)}
                    onChange={(e) => {
                      let val = e.target.value;
                      const yearPrefix = `${new Date(issueDate || Date.now()).getFullYear()}-`;
                      if (!val.startsWith(yearPrefix)) {
                        // If user tries to delete the prefix, restore it
                        val = yearPrefix + val.replace(new RegExp(`^\\d{4}-?`), '');
                      }
                      setInvoiceNumber(val);
                    }}
                    error={isDuplicateNumber(invoiceNumber)}
                    helperText={isDuplicateNumber(invoiceNumber) ? 'Invoice number already exists' : ''}
                    sx={inputStyle}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Issue Date"
                    type="date"
                    value={issueDate}
                    disabled={Boolean(locked)}
                    onChange={(e) => {
                      const newIssueDate = e.target.value;
                      setIssueDate(newIssueDate);
                      if (!dueDateTouched && newIssueDate) {
                        setDueDate(getLastDayOfMonth(newIssueDate));
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={inputStyle}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Due Date"
                    type="date"
                    value={dueDate}
                    disabled={Boolean(locked)}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      setDueDateTouched(true);
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={inputStyle}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Billed Client *"
                    value={client.name || (clients.isLoading ? 'Loading...' : '')}
                    disabled={true}
                    sx={{
                      ...inputStyle,
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                      },
                    }}
                  />
                </Grid>
                
              </Grid>
            </Card>

            {/* Card 2: Template Selection */}
            <Card
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#ffffff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(0,0,0,0.02)',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', display: 'block', mb: 1.5 }}>
                Select Invoice Receipt Layout
              </Typography>
              <InvoiceTemplatePicker value={templateId} disabled={Boolean(locked)} onChange={setTemplateId} />
            </Card>

            {/* Card 3: Bill-To Party Details */}
            <Card
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#ffffff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(0,0,0,0.02)',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', display: 'block', mb: 2 }}>
                Client Snapshot Billing Info
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Client Company Name" value={client.name} disabled={Boolean(locked)} onChange={(e) => setClient({ ...client, name: e.target.value })} sx={inputStyle} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="NTN / Reg No." value={client.ntn} disabled={Boolean(locked)} onChange={(e) => setClient({ ...client, ntn: e.target.value })} sx={inputStyle} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Client Email" value={client.email} disabled={Boolean(locked)} onChange={(e) => setClient({ ...client, email: e.target.value })} sx={inputStyle} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Billing Address" value={client.address} disabled={Boolean(locked)} onChange={(e) => setClient({ ...client, address: e.target.value })} sx={inputStyle} />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    freeSolo
                    openOnFocus
                    disableCloseOnSelect
                    fullWidth
                    size="small"
                    disabled={Boolean(locked)}
                    options={client.email && !ccEmails.includes(client.email) ? [client.email] : []}
                    getOptionLabel={(option: any) => typeof option === 'string' ? option : option.email}
                    filterOptions={(options, state) => {
                      const query = state.inputValue.trim().toLowerCase();
                      if (!query) return options;
                      return options.filter((option: any) => {
                        if (typeof option === 'string') return option.toLowerCase().includes(query);
                        return option.email.toLowerCase().includes(query);
                      });
                    }}
                    value={ccEmails}
                    inputValue={ccInput}
                    onInputChange={(_, newInputValue, reason) => {
                      if (reason === 'reset') return;
                      setCcInput(newInputValue);
                      if (ccError) setCcError('');
                    }}
                    onChange={(_, newValue, reason, details) => {
                      if (reason === 'removeOption' || reason === 'clear') {
                        setCcEmails(newValue as string[]);
                        return;
                      }
                      if (reason === 'selectOption' || reason === 'createOption') {
                        const addedItem = details?.option;
                        if (addedItem) {
                          const emailToAdd = typeof addedItem === 'string' ? addedItem : addedItem.email;
                          handleAddEmails(emailToAdd);
                        }
                      }
                    }}
                    onBlur={() => {
                      if (ccInput.trim()) {
                        handleAddEmails(ccInput);
                      }
                    }}
                    renderOption={(props, option: any) => {
                      const emailStr = typeof option === 'string' ? option : option.email;
                      return (
                        <li {...props} key={emailStr}>
                          <Box sx={{ py: 0.5 }}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{emailStr}</Typography>
                          </Box>
                        </li>
                      );
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option: any, index) => {
                        const { key, onDelete, ...tagProps } = getTagProps({ index });
                        const emailStr = typeof option === 'string' ? option : option.email;
                        return (
                          <Chip
                            key={key}
                            label={emailStr}
                            size="small"
                            onDelete={locked ? undefined : onDelete}
                            {...tagProps}
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="CC Emails"
                        name="cc-recipients-search"
                        type="text"
                        placeholder={ccEmails.length === 0 ? "Type email and press Enter" : ""}
                        error={Boolean(ccError)}
                        helperText={ccError || "Up to 10 emails. Press Enter after each email."}
                        sx={inputStyle}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData('text');
                          if (pasted) {
                            handleAddEmails(pasted);
                          }
                        }}
                        inputProps={{
                          ...params.inputProps,
                          autoComplete: "off",
                          onKeyDown: (e) => {
                            if ([' ', ',', 'Tab'].includes(e.key)) {
                              e.preventDefault();
                              e.stopPropagation();
                              if (ccInput.trim()) {
                                handleAddEmails(ccInput);
                              }
                            } else if (params.inputProps.onKeyDown) {
                              params.inputProps.onKeyDown(e as any);
                            }
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Card>

            {/* Card 4: Line Items Table Builder */}
            <Card
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#ffffff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(0,0,0,0.02)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                  Line Items ({lines.length})
                </Typography>
                {!locked && (
                  <Button
                    size="small"
                    onClick={() => setLines([...lines, { description: '', qty: '1', unitPrice: '0' }])}
                    startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                    sx={{ textTransform: 'none', fontWeight: 750, fontSize: '0.78rem', color: tokens.brand.primary }}
                  >
                    Add Line Item
                  </Button>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {lines.map((line, index) => (
                  <Box key={index} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 0.6fr 0.8fr auto' }, gap: 1.25, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      label={`Item ${index + 1} Description`}
                      value={line.description}
                      disabled={Boolean(locked)}
                      onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, description: e.target.value } : item))}
                      sx={inputStyle}
                    />
                    <TextField
                      size="small"
                      label="Qty"
                      type="number"
                      value={line.qty}
                      disabled={Boolean(locked)}
                      onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, qty: e.target.value } : item))}
                      sx={inputStyle}
                    />
                    <TextField
                      size="small"
                      label="Unit Price"
                      type="number"
                      value={line.unitPrice}
                      disabled={Boolean(locked)}
                      onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, unitPrice: e.target.value } : item))}
                      sx={inputStyle}
                    />
                    {!locked && lines.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setLines(lines.filter((_, i) => i !== index))}
                        sx={{ bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.06)' }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 2.5 }} />

              {/* Totals Breakdown */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    size="small"
                    label="Tax Rate (%)"
                    type="number"
                    value={taxRate}
                    disabled={Boolean(locked)}
                    onChange={(e) => setTaxRate(e.target.value)}
                    sx={{ ...inputStyle, width: 130 }}
                  />
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, display: 'block' }}>
                    Subtotal: <strong>{formatInvoiceMoney(currency, totals.subtotal)}</strong> · Tax: <strong>{formatInvoiceMoney(currency, totals.taxAmount)}</strong>
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: tokens.brand.primary, mt: 0.25 }}>
                    Grand Total: {formatInvoiceMoney(currency, totals.grandTotal)}
                  </Typography>
                </Box>
              </Box>
            </Card>

            {/* Card 5: Bank Accounts Attachment */}
            <Card
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#ffffff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(0,0,0,0.02)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <AccountBalanceIcon sx={{ fontSize: 16 }} /> Attached Bank Accounts
                </Typography>
                {!locked && (
                  <Button
                    size="small"
                    onClick={() => { setNewBank(emptyBankDraft()); setBankOpen(true); }}
                    sx={{ textTransform: 'none', fontWeight: 750, fontSize: '0.78rem', color: tokens.brand.primary }}
                  >
                    Add Bank Account
                  </Button>
                )}
              </Box>

              {(settings.data?.bankAccounts || []).length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 1 }}>
                  No bank accounts configured yet. Click above to add bank details to print on this receipt.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {(settings.data?.bankAccounts || []).map((bank) => (
                    <FormControlLabel
                      key={bank.id}
                      control={(
                        <Checkbox
                          checked={bankAccountIds.includes(bank.id)}
                          disabled={Boolean(locked)}
                          onChange={(event) => {
                            setBankAccountIds(event.target.checked
                              ? [...bankAccountIds, bank.id]
                              : bankAccountIds.filter((item) => item !== bank.id));
                          }}
                          sx={{ color: tokens.brand.primary, '&.Mui-checked': { color: tokens.brand.primary } }}
                        />
                      )}
                      label={(
                        <Typography variant="body2" sx={{ fontWeight: 650, fontSize: '0.85rem' }}>
                          {bank.paymentTitle || bank.bankName} · <strong>{bank.bankName}</strong> ({bank.accountNumber})
                        </Typography>
                      )}
                    />
                  ))}
                </Box>
              )}
            </Card>

            {/* Bottom Actions Bar */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', pt: 1 }}>
              {!locked && (
                <Button
                  variant="contained"
                  onClick={() => persist(undefined, true)}
                  disabled={mutations.createInvoice.isPending || mutations.updateInvoice.isPending}
                  startIcon={<SaveIcon />}
                  sx={{
                    borderRadius: '14px',
                    px: 3,
                    py: 1.1,
                    textTransform: 'none',
                    fontWeight: 800,
                    bgcolor: tokens.brand.primary,
                    boxShadow: '0 4px 14px rgba(93, 26, 137, 0.25)',
                    '&:hover': { bgcolor: tokens.brand.primaryDark },
                  }}
                >
                  {mutations.createInvoice.isPending || mutations.updateInvoice.isPending ? 'Saving...' : 'Save Draft'}
                </Button>
              )}

              {!isNew && !locked && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => void openSendConfirm()}
                  disabled={mutations.sendInvoice.isPending || mutations.updateInvoice.isPending || sendingEmail}
                  startIcon={<SendIcon />}
                  sx={{ borderRadius: '14px', px: 3, py: 1.1, textTransform: 'none', fontWeight: 800 }}
                >
                  Send Email
                </Button>
              )}

              {invoice.data?.status === 'sent' && id && (
                <>
                  <Button
                    variant="contained"
                    onClick={markPaid}
                    disabled={mutations.markPaid.isPending || !settings.data?.mailbox.configured}
                    startIcon={<CheckCircleOutlineIcon />}
                    sx={{ borderRadius: '14px', px: 3, py: 1.1, textTransform: 'none', fontWeight: 800, bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
                  >
                    Mark Paid
                  </Button>
                  {invoice.data?.overdue && invoice.data?.invoiceEmailMessageId && (
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={sendReminder}
                      disabled={mutations.sendReminder.isPending}
                      startIcon={<EmailOutlinedIcon />}
                      sx={{ borderRadius: '14px', px: 3, py: 1.1, textTransform: 'none', fontWeight: 800 }}
                    >
                      Send Reminder
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={() => setDisputeOpen(true)}
                    disabled={disputing}
                    startIcon={<GavelIcon />}
                    sx={{ borderRadius: '14px', px: 3, py: 1.1, textTransform: 'none', fontWeight: 800 }}
                  >
                    Dispute
                  </Button>
                </>
              )}

              {!isNew && invoice.data?.status === 'draft' && id && (
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => setDisputeOpen(true)}
                  disabled={disputing}
                  startIcon={<GavelIcon />}
                  sx={{ borderRadius: '14px', px: 3, py: 1.1, textTransform: 'none', fontWeight: 800 }}
                >
                  Dispute
                </Button>
              )}

              <Button
                variant="outlined"
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                startIcon={exportingPdf ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                sx={{ borderRadius: '14px', px: 2.5, py: 1.1, textTransform: 'none', fontWeight: 750 }}
              >
                Download PDF
              </Button>
            </Box>

          </Box>
        </Grid>

        {/* Right Column: Sticky Live Receipt Preview */}
        <Grid item xs={12} lg={5.5}>
          <Box sx={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                Live Receipt Preview
              </Typography>
              <Button
                size="small"
                variant="text"
                startIcon={exportingPdf ? <CircularProgress size={13} color="inherit" /> : <DownloadIcon sx={{ fontSize: 15 }} />}
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                sx={{ textTransform: 'none', fontWeight: 750, fontSize: '0.76rem', color: tokens.brand.primary, py: 0.25, px: 1 }}
              >
                Download PDF
              </Button>
            </Box>

            <Box ref={previewRef} sx={{ background: '#FFFFFF' }}>
              <InvoiceTemplatePreview data={buildPreviewData()} />
            </Box>
          </Box>
        </Grid>
      </Grid>

      <InvoiceSendConfirmModal
        open={sendConfirmOpen}
        data={sendConfirmOpen ? buildPreviewData(false) : null}
        clientEmail={client.email}
        submitting={sendingEmail}
        onClose={() => {
          if (!sendingEmail) setSendConfirmOpen(false);
        }}
        onConfirm={confirmSend}
      />

      <InvoiceDisputeModal
        open={disputeOpen}
        invoiceNumber={invoiceNumber}
        submitting={disputing}
        onClose={() => {
          if (!disputing) setDisputeOpen(false);
        }}
        onConfirm={confirmDispute}
      />

      {/* New Bank Modal */}
      <Dialog
        open={bankOpen}
        onClose={() => setBankOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDarkMode ? 'rgba(24, 21, 30, 0.98)' : '#FFFFFF',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          }
        }}
      >
        <DialogTitle sx={{ pt: 3, px: 3.5, fontWeight: 800 }}>New bank account</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '12px !important', px: 3.5 }}>
          <TextField fullWidth size="small" label="Payment Title" placeholder="e.g. International Wire" value={newBank.paymentTitle} onChange={(e) => setNewBank({ ...newBank, paymentTitle: e.target.value })} sx={inputStyle} />
          <TextField fullWidth size="small" label="Bank Name *" value={newBank.bankName} onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })} sx={inputStyle} />
          <TextField fullWidth size="small" label="Account Title *" value={newBank.accountTitle} onChange={(e) => setNewBank({ ...newBank, accountTitle: e.target.value })} sx={inputStyle} />
          <TextField fullWidth size="small" label="Account Number *" value={newBank.accountNumber} onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })} sx={inputStyle} />
          <TextField fullWidth size="small" label="IBAN" value={newBank.iban} onChange={(e) => setNewBank({ ...newBank, iban: e.target.value })} sx={inputStyle} />
          <TextField fullWidth size="small" label="Branch" value={newBank.branch} onChange={(e) => setNewBank({ ...newBank, branch: e.target.value })} sx={inputStyle} />
        </DialogContent>
        <DialogActions sx={{ px: 3.5, pb: 3, pt: 1 }}>
          <Button onClick={() => setBankOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}>Cancel</Button>
          <Button onClick={addBankNow} variant="contained" disabled={mutations.addBank.isPending} sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '12px', bgcolor: tokens.brand.primary }}>
            Save account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceEditorPage;

