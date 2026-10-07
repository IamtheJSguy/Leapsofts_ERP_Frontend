import { useEffect, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SaveIcon from '@mui/icons-material/Save';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { tokens } from '@/styles/tokens';
import { useInvoiceLeave } from '@/components/invoices/InvoiceLeaveGuard';
import { InvoiceTemplatePicker, InvoiceTemplatePreview } from '@/components/invoices/InvoiceTemplatePreview';
import { useInvoiceMutations, useInvoiceSettings } from '@/hooks/api/useInvoices';
import { showApiError, useApiErrorToast } from '@/utils/apiError';
import {
  INVOICE_CURRENCIES,
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
  useApiErrorToast(settings.error, settings.isError);
  const [notice, setNotice] = useState('');
  const [issuerName, setIssuerName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPosition, setSenderPosition] = useState('');
  const [ntn, setNtn] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [defaultTemplate, setDefaultTemplate] = useState<InvoiceTemplateId>('classic');
  const [defaultTaxRate, setDefaultTaxRate] = useState('0');
  const [currency, setCurrency] = useState('USD');
  const [banks, setBanks] = useState<BankDraft[]>([]);
  const [provider, setProvider] = useState<MailboxProvider>('gmail');
  const [mailboxEmail, setMailboxEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [baseline, setBaseline] = useState('');

  const draftKey = JSON.stringify({
    issuerName, senderName, senderPosition, ntn, address, email, defaultTemplate, defaultTaxRate, currency, banks, provider, mailboxEmail, appPassword,
  });

  const save = async (): Promise<boolean> => {
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
        senderName: senderName.trim(),
        senderPosition: senderPosition.trim(),
        ntn,
        address,
        email,
        defaultTemplate,
        defaultTaxRate: Math.min(100, Math.max(0, Number(defaultTaxRate) || 0)),
        currency,
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
        issuerName, senderName, senderPosition, ntn, address, email, defaultTemplate, defaultTaxRate, currency, banks: nextBanks, provider, mailboxEmail, appPassword: '',
      }));
      setNotice('Invoice settings saved.');
      return true;
    } catch (err) {
      showApiError(err);
      return false;
    }
  };

  const { dialog, requestLeave } = useInvoiceLeave(
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
    setSenderName(settings.data.senderName || '');
    setSenderPosition(settings.data.senderPosition || '');
    setNtn(settings.data.ntn);
    setAddress(settings.data.address);
    setEmail(settings.data.email);
    setDefaultTemplate(settings.data.defaultTemplate);
    setDefaultTaxRate(String(settings.data.defaultTaxRate));
    setCurrency(settings.data.currency || 'USD');
    setBanks(nextBanks);
    setProvider(nextProvider);
    setMailboxEmail(nextMailbox);
    setBaseline(JSON.stringify({
      issuerName: settings.data.issuerName,
      senderName: settings.data.senderName || '',
      senderPosition: settings.data.senderPosition || '',
      ntn: settings.data.ntn,
      address: settings.data.address,
      email: settings.data.email,
      defaultTemplate: settings.data.defaultTemplate,
      defaultTaxRate: String(settings.data.defaultTaxRate),
      currency: settings.data.currency || 'USD',
      banks: nextBanks,
      provider: nextProvider,
      mailboxEmail: nextMailbox,
      appPassword: '',
    }));
    setHydrated(true);
  }, [hydrated, settings.data]);

  const upload = async (file?: File) => {
    if (!file) return;
    try {
      await mutations.uploadLogo.mutateAsync(file);
      setNotice('Logo updated.');
    } catch (err) {
      showApiError(err);
    }
  };

  const testMailbox = async () => {
    setNotice('');
    try {
      await mutations.testMailbox.mutateAsync();
      setNotice('Test email sent to the invoicing mailbox.');
    } catch (err) {
      showApiError(err);
    }
  };

  if (settings.isError) return null;

  if (settings.isLoading || !hydrated) {
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

  const cardSx = {
    p: 3,
    borderRadius: '24px',
    bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#ffffff',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
    boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(0,0,0,0.02)',
  };

  const sectionLabel = (icon: ReactNode, text: string) => (
    <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.75, mb: 2 }}>
      {icon}
      {text}
    </Typography>
  );

  const currencyOptions = INVOICE_CURRENCIES.some((item) => item.code === currency)
    ? INVOICE_CURRENCIES
    : [{ code: currency, label: currency }, ...INVOICE_CURRENCIES];

  const updateBank = (index: number, key: keyof BankDraft, value: string) => {
    setBanks(banks.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 8 }}>
      {dialog}
      <Box sx={{ mb: 3.5 }}>
        <Button
          onClick={requestLeave}
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          sx={{ textTransform: 'none', px: 1, py: 0.5, mb: 1, fontWeight: 700, fontSize: '0.85rem', color: 'text.secondary' }}
        >
          Back to Invoices
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 850, letterSpacing: '-0.025em', color: isDarkMode ? '#fff' : tokens.text.primary }}>
          Invoice settings
        </Typography>
        <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary, fontWeight: 500, mt: 0.25 }}>
          Company details, logo, bank accounts, and the mailbox invoices are sent from.
        </Typography>
      </Box>

      {notice && <Alert severity="success" sx={{ mb: 2.5, borderRadius: '14px' }}>{notice}</Alert>}

      <Grid container spacing={3.5}>
      <Grid item xs={12} lg={6.5}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card elevation={0} sx={cardSx}>
          {sectionLabel(<BusinessIcon sx={{ fontSize: 16 }} />, 'Your company')}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {settings.data?.logoUrl ? (
              <Box component="img" src={settings.data.logoUrl} alt="Company logo" sx={{ width: 56, height: 56, objectFit: 'contain', borderRadius: '12px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
            ) : (
              <Box sx={{ width: 56, height: 56, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(93,26,137,0.04)', color: tokens.brand.primary, fontSize: '0.7rem', fontWeight: 800 }}>
                Logo
              </Box>
            )}
            <Button
              component="label"
              size="small"
              sx={{
                height: 40,
                px: 2,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 750,
                fontSize: '0.78rem',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(93,26,137,0.04)',
                color: tokens.brand.primary,
              }}
            >
              Upload logo
              <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => upload(e.target.files?.[0])} />
            </Button>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField fullWidth size="small" label="Company name" value={issuerName} onChange={(e) => setIssuerName(e.target.value)} sx={inputStyle} />
            <TextField fullWidth size="small" label="NTN / Reg no." value={ntn} onChange={(e) => setNtn(e.target.value)} sx={inputStyle} />
            <TextField fullWidth size="small" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} sx={inputStyle} />
            <TextField fullWidth size="small" label="Address" value={address} onChange={(e) => setAddress(e.target.value)} multiline minRows={2} sx={{ ...inputStyle, gridColumn: { sm: '1 / -1' } }} />
          </Box>
        </Card>

        <Card elevation={0} sx={cardSx}>
          {sectionLabel(<SettingsOutlinedIcon sx={{ fontSize: 16 }} />, 'Defaults')}
          <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', display: 'block', mb: 1.5 }}>
            Default template
          </Typography>
          <InvoiceTemplatePicker value={defaultTemplate} onChange={setDefaultTemplate} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 280px' }, gap: 2, mt: 2.5 }}>
            <TextField
              fullWidth
              size="small"
              label="Default tax %"
              type="number"
              value={defaultTaxRate}
              inputProps={{ min: 0, max: 100, step: 'any' }}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '' || raw === '.') {
                  setDefaultTaxRate(raw);
                  return;
                }
                const n = Number(raw);
                if (!Number.isFinite(n) || n < 0) {
                  setDefaultTaxRate('0');
                  return;
                }
                setDefaultTaxRate(n > 100 ? '100' : raw);
              }}
              sx={inputStyle}
            />
            <TextField
              select
              fullWidth
              size="small"
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              helperText="New invoices and saved drafts use this currency."
              sx={inputStyle}
            >
              {currencyOptions.map((item) => (
                <MenuItem key={item.code} value={item.code}>{item.label}</MenuItem>
              ))}
            </TextField>
          </Box>
        </Card>

        <Card elevation={0} sx={cardSx}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <AccountBalanceIcon sx={{ fontSize: 16 }} /> Bank accounts ({banks.length})
            </Typography>
            <Button
              size="small"
              onClick={() => setBanks([...banks, emptyBank()])}
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              sx={{ textTransform: 'none', fontWeight: 750, fontSize: '0.78rem', color: tokens.brand.primary }}
            >
              Add bank account
            </Button>
          </Box>
          {banks.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 1 }}>
              No bank accounts yet. Add one to print payment details on invoices.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {banks.map((bank, index) => (
                <Box key={bank.id || index} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25, pb: index === banks.length - 1 ? 0 : 2, borderBottom: index === banks.length - 1 ? 'none' : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                  <TextField size="small" label="Payment title" placeholder="SWIFT and international" value={bank.paymentTitle} onChange={(e) => updateBank(index, 'paymentTitle', e.target.value)} sx={inputStyle} />
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField fullWidth size="small" label="Bank" value={bank.bankName} onChange={(e) => updateBank(index, 'bankName', e.target.value)} sx={inputStyle} />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setBanks(banks.filter((_, i) => i !== index))}
                      sx={{ bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.06)', flexShrink: 0 }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                  <TextField size="small" label="Account title" value={bank.accountTitle} onChange={(e) => updateBank(index, 'accountTitle', e.target.value)} sx={inputStyle} />
                  <TextField size="small" label="Account number" value={bank.accountNumber} onChange={(e) => updateBank(index, 'accountNumber', e.target.value)} sx={inputStyle} />
                  <TextField size="small" label="IBAN" value={bank.iban} onChange={(e) => updateBank(index, 'iban', e.target.value)} sx={inputStyle} />
                  <TextField size="small" label="Branch" value={bank.branch} onChange={(e) => updateBank(index, 'branch', e.target.value)} sx={inputStyle} />
                </Box>
              ))}
            </Box>
          )}
        </Card>

        <Card elevation={0} sx={cardSx}>
          {sectionLabel(<MailOutlineIcon sx={{ fontSize: 16 }} />, 'Email sender')}
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 2 }}>
            Name and position shown in the From header and email sign-off (under Regards). Company name still appears below.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
            <TextField fullWidth size="small" label="Sender name" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="e.g. Jane Smith" sx={inputStyle} />
            <TextField fullWidth size="small" label="Position" value={senderPosition} onChange={(e) => setSenderPosition(e.target.value)} placeholder="e.g. Accounts Manager" sx={inputStyle} />
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', display: 'block', mb: 1.5 }}>
            Invoicing mailbox
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 2 }}>
            Pick the provider, then enter the mailbox email and an app password. Host, port, and TLS are set for that provider.
            {settings.data?.mailbox.configured ? ' A mailbox is already saved. Leave the app password blank to keep it.' : ''}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField select fullWidth size="small" label="Provider" value={provider} onChange={(e) => setProvider(e.target.value as MailboxProvider)} sx={inputStyle}>
              {MAILBOX_PROVIDER_OPTIONS.map((item) => (
                <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>
              ))}
            </TextField>
            <TextField fullWidth size="small" label="Email" value={mailboxEmail} onChange={(e) => setMailboxEmail(e.target.value)} sx={inputStyle} />
            <TextField fullWidth size="small" label="App password" type="password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} sx={{ ...inputStyle, gridColumn: { sm: '1 / -1' } }} />
          </Box>
        </Card>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', pt: 1 }}>
          <Button
            variant="contained"
            onClick={save}
            disabled={mutations.updateSettings.isPending}
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
            {mutations.updateSettings.isPending ? 'Saving...' : 'Save settings'}
          </Button>
          <Button
            onClick={testMailbox}
            disabled={mutations.testMailbox.isPending || !settings.data?.mailbox.configured}
            sx={{ borderRadius: '14px', px: 2.5, py: 1.1, textTransform: 'none', fontWeight: 750 }}
          >
            Send test email
          </Button>
        </Box>
      </Box>
      </Grid>

      <Grid item xs={12} lg={5.5}>
        <Box sx={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
            Live Receipt Preview
          </Typography>
          <Box sx={{ background: '#FFFFFF' }}>
            <InvoiceTemplatePreview
              data={{
                template: defaultTemplate,
                invoiceNumber: 'INV-0001',
                issueDate: new Date().toISOString().slice(0, 10),
                dueDate: new Date().toISOString().slice(0, 10),
                currency,
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
          </Box>
        </Box>
      </Grid>
      </Grid>
    </Box>
  );
};

export default InvoiceSettingsPage;
