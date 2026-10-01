import { useEffect, useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { tokens } from '@/styles/tokens';
import { useInvoiceLeave } from '@/components/invoices/InvoiceLeaveGuard';
import { InvoiceTemplatePicker, InvoiceTemplatePreview } from '@/components/invoices/InvoiceTemplatePreview';
import { apiErrorMessage, useInvoice, useInvoiceClients, useInvoiceMutations, useInvoiceSettings } from '@/hooks/api/useInvoices';
import { InvoiceClientFields } from '@/components/invoices/InvoiceClientFields';
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

const today = () => new Date().toISOString().slice(0, 10);

const InvoiceEditorPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isNew = !id;
  const presetClientId = isNew ? (searchParams.get('clientId') || '') : '';
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const settings = useInvoiceSettings();
  const clients = useInvoiceClients(false);
  const invoice = useInvoice(id);
  const mutations = useInvoiceMutations();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [client, setClient] = useState<InvoiceParty>(emptyParty());
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [templateId, setTemplateId] = useState<InvoiceTemplateId>('classic');
  const [taxRate, setTaxRate] = useState('0');
  const [lines, setLines] = useState<LineDraft[]>([{ description: '', qty: '1', unitPrice: '0' }]);
  const [bankAccountIds, setBankAccountIds] = useState<string[]>([]);
  const [baseline, setBaseline] = useState('');
  const [clientOpen, setClientOpen] = useState(false);
  const [newClient, setNewClient] = useState<InvoiceClientForm>(emptyClientForm());
  const [bankOpen, setBankOpen] = useState(false);
  const [newBank, setNewBank] = useState(emptyBankDraft());

  useEffect(() => {
    setHydrated(false);
  }, [id]);

  useEffect(() => {
    if (hydrated || !settings.data) return;
    if (!isNew && !invoice.data) return;
    if (isNew) {
      if (presetClientId && clients.isLoading) return;
      const nextTemplate = settings.data.defaultTemplate;
      const nextTax = String(settings.data.defaultTaxRate);
      const match = presetClientId
        ? (clients.data || []).find((item) => item._id === presetClientId && !item.isArchived)
        : undefined;
      const nextClient = match
        ? { name: match.name, ntn: match.ntn, address: match.address, email: match.email }
        : emptyParty();
      const nextClientId = match?._id || '';
      setTemplateId(nextTemplate);
      setTaxRate(nextTax);
      setClientId(nextClientId);
      setClient(nextClient);
      setBaseline(JSON.stringify({
        invoiceNumber: '',
        clientId: nextClientId,
        client: nextClient,
        issueDate,
        dueDate,
        templateId: nextTemplate,
        taxRate: nextTax,
        lines: [{ description: '', qty: '1', unitPrice: '0' }],
        bankAccountIds: [],
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
    }));
    setHydrated(true);
  }, [clients.data, clients.isLoading, dueDate, hydrated, invoice.data, isNew, issueDate, presetClientId, settings.data]);

  const locked = !isNew && invoice.data && invoice.data.status !== 'draft';
  const currency = invoice.data?.currency || settings.data?.currency || 'USD';

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
    invoiceNumber, clientId, client, issueDate, dueDate, templateId, taxRate, lines, bankAccountIds,
  });
  const clientDirty = clientOpen && JSON.stringify(newClient) !== JSON.stringify(emptyClientForm());
  const bankDirty = bankOpen && Object.values(newBank).some((value) => value.trim());
  const invoiceDirty = hydrated && baseline !== '' && draftKey !== baseline;

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
    };
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
    }));
  };

  const persist = async (
    override?: Partial<Pick<SaveInvoicePayload, 'clientId' | 'client' | 'bankAccountIds'>>,
    openCreated = false,
  ): Promise<boolean> => {
    const body = payload(override);
    if (!body) {
      setError('Fill the invoice number, client, and every line before saving.');
      return false;
    }
    setError('');
    setNotice('');
    try {
      if (isNew) {
        const created = await mutations.createInvoice.mutateAsync(body);
        rememberSaved(body);
        if (openCreated) {
          allowNext();
          navigate(`/invoices/${created._id}`, { replace: true });
        }
      } else if (id) {
        await mutations.updateInvoice.mutateAsync({ id, body });
        rememberSaved(body);
        setNotice('Draft saved.');
      }
      return true;
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the invoice'));
      return false;
    }
  };

  const saveForLeave = async (): Promise<boolean> => {
    const override: Partial<Pick<SaveInvoicePayload, 'clientId' | 'client' | 'bankAccountIds'>> = {};
    if (clientDirty) {
      try {
        const created = await mutations.createClient.mutateAsync(newClient);
        const party = { name: created.name, ntn: created.ntn, address: created.address, email: created.email };
        override.clientId = created._id;
        override.client = party;
        setClientId(created._id);
        setClient(party);
        setNewClient(emptyClientForm());
        setClientOpen(false);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not save the client'));
        return false;
      }
    }
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
        setError(apiErrorMessage(err, 'Could not save the bank account'));
        return false;
      }
    }
    if (!invoiceDirty && !override.clientId && !override.bankAccountIds) return true;
    return persist(override, false);
  };

  const { backButton, dialog: leaveDialog, requestLeave, allowNext } = useInvoiceLeave(
    Boolean(!locked && (invoiceDirty || clientDirty || bankDirty)),
    saveForLeave,
    mutations.createInvoice.isPending || mutations.updateInvoice.isPending || mutations.createClient.isPending || mutations.addBank.isPending,
  );

  const createClientNow = async () => {
    setError('');
    try {
      const created = await mutations.createClient.mutateAsync(newClient);
      setClientId(created._id);
      setClient({ name: created.name, ntn: created.ntn, address: created.address, email: created.email });
      setNewClient(emptyClientForm());
      setClientOpen(false);
      setNotice('Client added.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the client'));
    }
  };

  const addBankNow = async () => {
    setError('');
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
      setError(apiErrorMessage(err, 'Could not save the bank account'));
    }
  };

  const markPaid = async () => {
    if (!id) return;
    setError('');
    setNotice('');
    try {
      await mutations.markPaid.mutateAsync(id);
      const from = settings.data?.mailbox.email || 'your invoicing mailbox';
      setNotice(`Payment confirmation sent to ${client.email} from ${from}.`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not mark this invoice paid'));
    }
  };

  const send = async () => {
    if (!id) return;
    setError('');
    setNotice('');
    try {
      const body = payload();
      if (body && !locked) await mutations.updateInvoice.mutateAsync({ id, body });
      await mutations.sendInvoice.mutateAsync(id);
      setNotice('Invoice emailed to the client.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send the invoice'));
    }
  };

  if (settings.isError) {
    return <Alert severity="error">{apiErrorMessage(settings.error, 'Could not load invoice settings')}</Alert>;
  }
  if (!isNew && invoice.isError) {
    return <Alert severity="error">{apiErrorMessage(invoice.error, 'Could not load this invoice')}</Alert>;
  }

  if (settings.isLoading || (!isNew && invoice.isLoading) || !hydrated) {
    return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>;
  }

  const selectedBanks = (settings.data?.bankAccounts || []).filter((bank) => bankAccountIds.includes(bank.id));
  const previewLines = lines.map((line) => ({
    description: line.description,
    qty: Number(line.qty) || 0,
    unitPrice: Number(line.unitPrice) || 0,
  }));

  return (
    <Box sx={{ pb: 6, maxWidth: 1180 }}>
      {backButton}
      {leaveDialog}
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: isDarkMode ? '#fff' : tokens.text.primary }}>
        {isNew ? 'New invoice' : invoiceNumber || 'Invoice'}
      </Typography>
      <Typography sx={{ mb: 2, color: isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary }}>
        {locked ? `This invoice is ${invoice.data?.status}.` : 'Save a draft, download the PDF, or email it to the client.'}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
      {(clients.data || []).length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>Add a client before you can save an invoice.</Alert>
      )}

      <Paper sx={{ p: 2.5, display: 'grid', gap: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          <TextField label="Invoice number" value={invoiceNumber} disabled={Boolean(locked)} onChange={(e) => setInvoiceNumber(e.target.value)} />
          <TextField label="Issued" type="date" value={issueDate} disabled={Boolean(locked)} onChange={(e) => setIssueDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Due" type="date" value={dueDate} disabled={Boolean(locked)} onChange={(e) => setDueDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1, alignItems: 'start' }}>
          <Autocomplete
            options={clients.data || []}
            value={(clients.data || []).find((item) => item._id === clientId) || null}
            disabled={Boolean(locked)}
            onChange={(_, value) => applyClient(value?._id || '')}
            getOptionLabel={(option: InvoiceClient) => option.name}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            filterOptions={(options, state) => {
              const query = state.inputValue.trim().toLowerCase();
              if (!query) return options;
              return options.filter((option) =>
                option.name.toLowerCase().includes(query)
                || option.email.toLowerCase().includes(query)
                || option.ntn.toLowerCase().includes(query));
            }}
            renderInput={(params) => (
              <TextField {...params} label="Client" placeholder="Search name, email, or NTN" />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option._id}>
                <Box>
                  <Typography sx={{ fontSize: '0.9rem' }}>{option.name}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{option.email}</Typography>
                </Box>
              </li>
            )}
          />
          {!locked && (
            <Button onClick={() => { setNewClient(emptyClientForm()); setClientOpen(true); }} sx={{ textTransform: 'none', mt: { sm: 1 } }}>
              New client
            </Button>
          )}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Template</Typography>
          <InvoiceTemplatePicker value={templateId} disabled={Boolean(locked)} onChange={setTemplateId} />
          <Typography sx={{ mt: 2, mb: 1, fontWeight: 700 }}>Preview</Typography>
          <InvoiceTemplatePreview
            data={{
              template: templateId,
              invoiceNumber,
              issueDate,
              dueDate,
              currency,
              paid: invoice.data?.status === 'paid',
              logoUrl: settings.data?.logoUrl,
              issuer: {
                name: settings.data?.issuerName || '',
                ntn: settings.data?.ntn || '',
                address: settings.data?.address || '',
                email: settings.data?.email || '',
              },
              client,
              lines: previewLines,
              taxRate: Number(taxRate) || 0,
              banks: selectedBanks,
            }}
          />
        </Box>
        <Typography sx={{ fontWeight: 700 }}>Bill to</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <TextField label="Company name" value={client.name} disabled={Boolean(locked)} onChange={(e) => setClient({ ...client, name: e.target.value })} />
          <TextField label="NTN / Reg no." value={client.ntn} disabled={Boolean(locked)} onChange={(e) => setClient({ ...client, ntn: e.target.value })} />
          <TextField label="Address" value={client.address} disabled={Boolean(locked)} onChange={(e) => setClient({ ...client, address: e.target.value })} />
          <TextField label="Email" value={client.email} disabled={Boolean(locked)} onChange={(e) => setClient({ ...client, email: e.target.value })} />
        </Box>

        <Typography sx={{ fontWeight: 700 }}>Lines</Typography>
        {lines.map((line, index) => (
          <Box key={index} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 0.6fr 0.8fr auto' }, gap: 1, alignItems: 'center' }}>
            <TextField label="Description" value={line.description} disabled={Boolean(locked)} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} />
            <TextField label="Qty" type="number" value={line.qty} disabled={Boolean(locked)} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, qty: e.target.value } : item))} />
            <TextField label="Unit price" type="number" value={line.unitPrice} disabled={Boolean(locked)} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, unitPrice: e.target.value } : item))} />
            {!locked && lines.length > 1 && (
              <Button color="inherit" onClick={() => setLines(lines.filter((_, i) => i !== index))} sx={{ textTransform: 'none' }}>Remove</Button>
            )}
          </Box>
        ))}
        {!locked && (
          <Button sx={{ justifySelf: 'start', textTransform: 'none' }} onClick={() => setLines([...lines, { description: '', qty: '1', unitPrice: '0' }])}>
            Add line
          </Button>
        )}
        <TextField label="Tax %" type="number" value={taxRate} disabled={Boolean(locked)} onChange={(e) => setTaxRate(e.target.value)} sx={{ maxWidth: 160 }} />
        <Typography>
          Total {formatInvoiceMoney(currency, totals.subtotal)} · Tax {formatInvoiceMoney(currency, totals.taxAmount)} · Grand total {formatInvoiceMoney(currency, totals.grandTotal)}
        </Typography>

        <Typography sx={{ fontWeight: 700 }}>Bank accounts on this invoice</Typography>
        {(settings.data?.bankAccounts || []).length === 0 && (
          <Typography sx={{ color: tokens.text.secondary }}>No bank accounts yet. Add one here to print it on this invoice.</Typography>
        )}
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
              />
            )}
            label={`${bank.paymentTitle || bank.bankName} · ${bank.bankName} · Account number: ${bank.accountNumber}`}
          />
        ))}
        {!locked && (
          <Button sx={{ justifySelf: 'start', textTransform: 'none' }} onClick={() => { setNewBank(emptyBankDraft()); setBankOpen(true); }}>
            Add bank account
          </Button>
        )}

        {invoice.data?.status === 'sent' && (
          <Alert severity="info">
            Mark paid sends a payment confirmation to {client.email || 'the client'}
            {settings.data?.mailbox.email ? ` from ${settings.data.mailbox.email}` : ''}.
            {!settings.data?.mailbox.configured && ' Set up the invoicing mailbox before marking this paid.'}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {!locked && (
            <Button variant="contained" onClick={() => persist(undefined, true)} disabled={mutations.createInvoice.isPending || mutations.updateInvoice.isPending} sx={{ bgcolor: tokens.brand.primary, textTransform: 'none', boxShadow: 'none' }}>
              Save draft
            </Button>
          )}
          {!isNew && !locked && (
            <Button variant="contained" color="secondary" onClick={send} disabled={mutations.sendInvoice.isPending} sx={{ textTransform: 'none' }}>
              Send email
            </Button>
          )}
          {invoice.data?.status === 'sent' && id && (
            <Button
              variant="contained"
              onClick={markPaid}
              disabled={mutations.markPaid.isPending || !settings.data?.mailbox.configured}
              sx={{ textTransform: 'none', bgcolor: '#059669', boxShadow: 'none', '&:hover': { bgcolor: '#047857' } }}
            >
              Mark paid
            </Button>
          )}
          {!isNew && id && (
            <Button onClick={() => mutations.download(id, `invoice-${invoiceNumber || 'draft'}.pdf`)} sx={{ textTransform: 'none' }}>
              Download PDF
            </Button>
          )}
          <Button onClick={requestLeave} sx={{ textTransform: 'none' }}>Back</Button>
        </Box>
      </Paper>

      <Dialog open={clientOpen} onClose={() => setClientOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1 }}>New client</DialogTitle>
        <DialogContent sx={{ pt: '4px !important', pb: 1 }}>
          <InvoiceClientFields value={newClient} onChange={setNewClient} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pt: 0, pb: 2 }}>
          <Button onClick={() => setClientOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={createClientNow} variant="contained" disabled={mutations.createClient.isPending} sx={{ textTransform: 'none', bgcolor: tokens.brand.primary }}>Save client</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bankOpen} onClose={() => setBankOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New bank account</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          <TextField label="Payment title" placeholder="SWIFT and international" value={newBank.paymentTitle} onChange={(e) => setNewBank({ ...newBank, paymentTitle: e.target.value })} />
          <TextField label="Bank" value={newBank.bankName} onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })} />
          <TextField label="Account title" value={newBank.accountTitle} onChange={(e) => setNewBank({ ...newBank, accountTitle: e.target.value })} />
          <TextField label="Account number" value={newBank.accountNumber} onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })} />
          <TextField label="IBAN" value={newBank.iban} onChange={(e) => setNewBank({ ...newBank, iban: e.target.value })} />
          <TextField label="Branch" value={newBank.branch} onChange={(e) => setNewBank({ ...newBank, branch: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBankOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={addBankNow} variant="contained" disabled={mutations.addBank.isPending} sx={{ textTransform: 'none', bgcolor: tokens.brand.primary }}>Save account</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceEditorPage;
