import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { tokens } from '@/styles/tokens';
import { useInvoiceLeave } from '@/components/invoices/InvoiceLeaveGuard';
import { InvoiceTemplatePicker, InvoiceTemplatePreview } from '@/components/invoices/InvoiceTemplatePreview';
import { apiErrorMessage, useInvoiceMutations, useInvoiceSettings } from '@/hooks/api/useInvoices';
import {
  MAILBOX_PROVIDER_OPTIONS,
  type InvoiceTemplateId,
  type MailboxProvider,
} from '@/types/invoice';

interface BankDraft {
  id?: string;
  paymentTitle: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branch: string;
}

const emptyBank = (): BankDraft => ({
  paymentTitle: '',
  bankName: '',
  accountTitle: '',
  accountNumber: '',
  iban: '',
  branch: '',
});

const InvoiceSettingsPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const settings = useInvoiceSettings();
  const mutations = useInvoiceMutations();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [issuerName, setIssuerName] = useState('');
  const [ntn, setNtn] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [defaultTemplate, setDefaultTemplate] = useState<InvoiceTemplateId>('classic');
  const [defaultTaxRate, setDefaultTaxRate] = useState('0');
  const [banks, setBanks] = useState<BankDraft[]>([]);
  const [provider, setProvider] = useState<MailboxProvider>('gmail');
  const [mailboxEmail, setMailboxEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [baseline, setBaseline] = useState('');

  const draftKey = JSON.stringify({
    issuerName, ntn, address, email, defaultTemplate, defaultTaxRate, banks, provider, mailboxEmail, appPassword,
  });

  const save = async (): Promise<boolean> => {
    setError('');
    setNotice('');
    try {
      const mailbox = mailboxEmail.trim()
        ? {
            provider,
            email: mailboxEmail.trim(),
            ...(appPassword.trim() ? { appPassword: appPassword.trim() } : {}),
          }
        : undefined;
      const saved = await mutations.updateSettings.mutateAsync({
        issuerName,
        ntn,
        address,
        email,
        defaultTemplate,
        defaultTaxRate: Number(defaultTaxRate) || 0,
        bankAccounts: banks
          .filter((bank) => bank.paymentTitle.trim() || bank.bankName.trim() || bank.accountTitle.trim() || bank.accountNumber.trim())
          .map((bank) => ({
            ...(bank.id ? { id: bank.id } : {}),
            paymentTitle: bank.paymentTitle.trim(),
            bankName: bank.bankName.trim(),
            accountTitle: bank.accountTitle.trim(),
            accountNumber: bank.accountNumber.trim(),
            iban: bank.iban.trim() || undefined,
            branch: bank.branch.trim() || undefined,
          })),
        mailbox,
      });
      const nextBanks = saved.bankAccounts.map((bank) => ({ ...bank, paymentTitle: bank.paymentTitle || '' }));
      setBanks(nextBanks);
      setAppPassword('');
      setBaseline(JSON.stringify({
        issuerName, ntn, address, email, defaultTemplate, defaultTaxRate, banks: nextBanks, provider, mailboxEmail, appPassword: '',
      }));
      setNotice('Invoice settings saved.');
      return true;
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save invoice settings'));
      return false;
    }
  };

  const { backButton, dialog, requestLeave } = useInvoiceLeave(
    hydrated && baseline !== draftKey,
    save,
    mutations.updateSettings.isPending,
  );

  useEffect(() => {
    if (!settings.data || hydrated) return;
    const nextBanks = settings.data.bankAccounts.map((bank) => ({
      ...bank,
      paymentTitle: bank.paymentTitle || '',
    }));
    const nextProvider = (settings.data.mailbox.provider as MailboxProvider) || 'gmail';
    const nextMailbox = settings.data.mailbox.email || '';
    setIssuerName(settings.data.issuerName);
    setNtn(settings.data.ntn);
    setAddress(settings.data.address);
    setEmail(settings.data.email);
    setDefaultTemplate(settings.data.defaultTemplate);
    setDefaultTaxRate(String(settings.data.defaultTaxRate));
    setBanks(nextBanks);
    setProvider(nextProvider);
    setMailboxEmail(nextMailbox);
    setBaseline(JSON.stringify({
      issuerName: settings.data.issuerName,
      ntn: settings.data.ntn,
      address: settings.data.address,
      email: settings.data.email,
      defaultTemplate: settings.data.defaultTemplate,
      defaultTaxRate: String(settings.data.defaultTaxRate),
      banks: nextBanks,
      provider: nextProvider,
      mailboxEmail: nextMailbox,
      appPassword: '',
    }));
    setHydrated(true);
  }, [hydrated, settings.data]);

  const upload = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      await mutations.uploadLogo.mutateAsync(file);
      setNotice('Logo updated.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not upload the logo'));
    }
  };

  const testMailbox = async () => {
    setError('');
    setNotice('');
    try {
      await mutations.testMailbox.mutateAsync();
      setNotice('Test email sent to the invoicing mailbox.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send the test email'));
    }
  };

  if (settings.isLoading || !hydrated) {
    return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>;
  }

  return (
    <Box sx={{ pb: 6, maxWidth: 860 }}>
      {backButton}
      {dialog}
      <Typography variant="h4" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary }}>Invoice settings</Typography>
      <Typography sx={{ mb: 2, color: isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary }}>
        Company details, logo, bank accounts, and the mailbox invoices are sent from.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      <Paper sx={{ p: 2.5, display: 'grid', gap: 2, mb: 2 }}>
        <Typography sx={{ fontWeight: 700 }}>Your company</Typography>
        {settings.data?.logoUrl && (
          <Box component="img" src={settings.data.logoUrl} alt="Company logo" sx={{ width: 96, height: 96, objectFit: 'contain' }} />
        )}
        <Button component="label" sx={{ justifySelf: 'start', textTransform: 'none' }}>
          Upload logo
          <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => upload(e.target.files?.[0])} />
        </Button>
        <TextField label="Company name" value={issuerName} onChange={(e) => setIssuerName(e.target.value)} />
        <TextField label="NTN / Reg no." value={ntn} onChange={(e) => setNtn(e.target.value)} />
        <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} multiline minRows={2} />
        <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Box>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Default template</Typography>
          <InvoiceTemplatePicker value={defaultTemplate} onChange={setDefaultTemplate} />
        </Box>
        <InvoiceTemplatePreview
          data={{
            template: defaultTemplate,
            invoiceNumber: 'INV-0001',
            issueDate: new Date().toISOString().slice(0, 10),
            dueDate: new Date().toISOString().slice(0, 10),
            currency: settings.data?.currency || 'USD',
            logoUrl: settings.data?.logoUrl,
            issuer: { name: issuerName, ntn, address, email },
            client: { name: 'Client company', ntn: '1234567', address: 'Client address', email: 'client@company.com' },
            lines: [{ description: 'Professional services', qty: 2, unitPrice: 1500 }],
            taxRate: Number(defaultTaxRate) || 0,
            banks: banks.filter((bank) => bank.bankName.trim() || bank.paymentTitle.trim()).map((bank) => ({
              paymentTitle: bank.paymentTitle,
              bankName: bank.bankName,
              accountTitle: bank.accountTitle,
              accountNumber: bank.accountNumber,
              iban: bank.iban,
              branch: bank.branch,
            })),
          }}
        />
        <TextField label="Default tax %" type="number" value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(e.target.value)} sx={{ maxWidth: 200 }} />
      </Paper>

      <Paper sx={{ p: 2.5, display: 'grid', gap: 2, mb: 2 }}>
        <Typography sx={{ fontWeight: 700 }}>Bank accounts</Typography>
        {banks.map((bank, index) => (
          <Box key={bank.id || index} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              label="Payment title"
              placeholder="SWIFT and international"
              helperText="Shown above this account on the invoice"
              value={bank.paymentTitle}
              onChange={(e) => setBanks(banks.map((item, i) => i === index ? { ...item, paymentTitle: e.target.value } : item))}
              sx={{ gridColumn: { md: '1 / -1' } }}
            />
            <TextField label="Bank" value={bank.bankName} onChange={(e) => setBanks(banks.map((item, i) => i === index ? { ...item, bankName: e.target.value } : item))} />
            <TextField label="Account title" value={bank.accountTitle} onChange={(e) => setBanks(banks.map((item, i) => i === index ? { ...item, accountTitle: e.target.value } : item))} />
            <TextField label="Account number" value={bank.accountNumber} onChange={(e) => setBanks(banks.map((item, i) => i === index ? { ...item, accountNumber: e.target.value } : item))} />
            <TextField label="IBAN" value={bank.iban} onChange={(e) => setBanks(banks.map((item, i) => i === index ? { ...item, iban: e.target.value } : item))} />
            <TextField label="Branch" value={bank.branch} onChange={(e) => setBanks(banks.map((item, i) => i === index ? { ...item, branch: e.target.value } : item))} />
            <Button color="inherit" sx={{ textTransform: 'none', justifySelf: 'start' }} onClick={() => setBanks(banks.filter((_, i) => i !== index))}>Remove</Button>
          </Box>
        ))}
        <Button sx={{ justifySelf: 'start', textTransform: 'none' }} onClick={() => setBanks([...banks, emptyBank()])}>Add bank account</Button>
      </Paper>

      <Paper sx={{ p: 2.5, display: 'grid', gap: 2 }}>
        <Typography sx={{ fontWeight: 700 }}>Invoicing mailbox</Typography>
        <Typography sx={{ color: tokens.text.secondary }}>
          Pick the provider, then enter the mailbox email and an app password. Host, port, and TLS are set for that provider.
          {settings.data?.mailbox.configured ? ' A mailbox is already saved. Leave the app password blank to keep it.' : ''}
        </Typography>
        <TextField select label="Provider" value={provider} onChange={(e) => setProvider(e.target.value as MailboxProvider)}>
          {MAILBOX_PROVIDER_OPTIONS.map((item) => (
            <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>
          ))}
        </TextField>
        <TextField label="Email" value={mailboxEmail} onChange={(e) => setMailboxEmail(e.target.value)} />
        <TextField label="App password" type="password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={save} disabled={mutations.updateSettings.isPending} sx={{ bgcolor: tokens.brand.primary, textTransform: 'none', boxShadow: 'none' }}>
            Save settings
          </Button>
          <Button onClick={testMailbox} disabled={mutations.testMailbox.isPending || !settings.data?.mailbox.configured} sx={{ textTransform: 'none' }}>
            Send test email
          </Button>
          <Button onClick={requestLeave} sx={{ textTransform: 'none' }}>Back</Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default InvoiceSettingsPage;
