import { Box, Typography } from '@mui/material';
import { tokens } from '@/styles/tokens';
import { formatInvoiceMoney, INVOICE_TEMPLATE_OPTIONS, roundMoney, type InvoiceParty, type InvoiceTemplateId } from '@/types/invoice';

export interface PreviewLine {
  description: string;
  qty: number;
  unitPrice: number;
}

export interface PreviewBank {
  paymentTitle?: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  branch?: string;
}

export interface InvoicePreviewData {
  template: InvoiceTemplateId;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  paid?: boolean;
  logoUrl?: string;
  issuer: InvoiceParty;
  client: InvoiceParty;
  lines: PreviewLine[];
  taxRate: number;
  banks: PreviewBank[];
}

const show = (value: string, fallback: string) => value.trim() || fallback;

const formatDate = (value: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
};

const Party = ({ title, party, compact }: { title: string; party: InvoiceParty; compact?: boolean }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography sx={{ fontSize: compact ? 8 : 9, letterSpacing: '0.08em', color: '#6B7280', fontWeight: 700 }}>
      {title}
    </Typography>
    <Typography sx={{ fontSize: compact ? 11 : 13, fontWeight: 700, color: '#1A1625', mt: 0.25 }}>
      {show(party.name, title === 'FROM' ? 'Your company' : 'Client company')}
    </Typography>
    <Typography sx={{ fontSize: compact ? 9 : 10, color: '#1A1625', whiteSpace: 'pre-wrap' }}>
      {`NTN / Reg: ${show(party.ntn, '—')}`}
    </Typography>
    <Typography sx={{ fontSize: compact ? 9 : 10, color: '#1A1625', whiteSpace: 'pre-wrap' }}>
      {show(party.address, 'Address')}
    </Typography>
    <Typography sx={{ fontSize: compact ? 9 : 10, color: '#1A1625' }}>
      {show(party.email, 'email@company.com')}
    </Typography>
  </Box>
);

export const InvoiceTemplatePreview = ({ data }: { data: InvoicePreviewData }) => {
  const compact = data.template === 'compact';
  const lines = data.lines.length > 0 ? data.lines : [{ description: '', qty: 1, unitPrice: 0 }];
  const priced = lines.map((line) => ({
    ...line,
    amount: roundMoney((Number.isFinite(line.qty) ? line.qty : 0) * (Number.isFinite(line.unitPrice) ? line.unitPrice : 0)),
  }));
  const subtotal = roundMoney(priced.reduce((sum, line) => sum + line.amount, 0));
  const taxAmount = roundMoney(subtotal * (Number.isFinite(data.taxRate) ? data.taxRate : 0) / 100);
  const grandTotal = roundMoney(subtotal + taxAmount);
  const headerBg = data.template === 'modern' ? tokens.brand.primary : data.template === 'compact' ? '#111827' : '#374151';

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        color: '#1A1625',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(26, 22, 37, 0.12)',
        border: '1px solid #E8E4EF',
        width: '100%',
        maxWidth: 640,
      }}
    >
      {data.template === 'modern' ? (
        <Box sx={{ bgcolor: tokens.brand.primary, color: '#fff', px: 2, py: compact ? 1.25 : 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Box>
            <Typography sx={{ fontSize: compact ? 16 : 20, fontWeight: 800, letterSpacing: '-0.03em' }}>INVOICE</Typography>
            <Typography sx={{ fontSize: 11, opacity: 0.9 }}>{show(data.invoiceNumber, 'INV-0001')}{data.paid ? ' · PAID' : ''}</Typography>
          </Box>
          {data.logoUrl && (
            <Box component="img" src={data.logoUrl} alt="" sx={{ width: 42, height: 42, objectFit: 'contain', bgcolor: '#fff', borderRadius: '6px', p: 0.25 }} />
          )}
        </Box>
      ) : (
        <Box sx={{ px: 2, pt: compact ? 1.25 : 2, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography sx={{ fontSize: compact ? 15 : 20, fontWeight: 800, letterSpacing: '-0.03em' }}>
              {compact ? `Invoice ${show(data.invoiceNumber, 'INV-0001')}` : 'INVOICE'}
            </Typography>
            {!compact && (
              <Typography sx={{ fontSize: 11, color: '#6B7280' }}>
                {show(data.invoiceNumber, 'INV-0001')}{data.paid ? ' · PAID' : ''}
              </Typography>
            )}
            {compact && (
              <Typography sx={{ fontSize: 9, color: '#6B7280' }}>
                Issued {formatDate(data.issueDate)} · Due {formatDate(data.dueDate)}{data.paid ? ' · PAID' : ''}
              </Typography>
            )}
          </Box>
          {data.logoUrl && (
            <Box component="img" src={data.logoUrl} alt="" sx={{ width: compact ? 36 : 48, height: compact ? 36 : 48, objectFit: 'contain' }} />
          )}
        </Box>
      )}

      <Box sx={{ px: 2, pt: compact ? 1 : 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <Party title="FROM" party={data.issuer} compact={compact} />
        <Party title="BILL TO" party={data.client} compact={compact} />
      </Box>

      {data.template !== 'compact' && (
        <Typography sx={{ px: 2, pt: 1.25, fontSize: 10, color: '#6B7280' }}>
          Issued {formatDate(data.issueDate)} · Due {formatDate(data.dueDate)}
        </Typography>
      )}

      <Box sx={{ px: 2, pt: 1.25, pb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.6fr 0.5fr 0.8fr 0.8fr', bgcolor: headerBg, color: '#fff', px: 0.75, py: 0.6, fontSize: compact ? 8 : 9, fontWeight: 700 }}>
          <span>Description</span>
          <span style={{ textAlign: 'right' }}>Qty</span>
          <span style={{ textAlign: 'right' }}>Unit</span>
          <span style={{ textAlign: 'right' }}>Total</span>
        </Box>
        {priced.map((line, index) => (
          <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '1.6fr 0.5fr 0.8fr 0.8fr', px: 0.75, py: compact ? 0.4 : 0.7, fontSize: compact ? 9 : 10, borderBottom: '1px solid #E5E7EB' }}>
            <span>{show(line.description, 'Line item')}</span>
            <span style={{ textAlign: 'right' }}>{line.qty || 0}</span>
            <span style={{ textAlign: 'right' }}>{formatInvoiceMoney(data.currency, line.unitPrice || 0)}</span>
            <span style={{ textAlign: 'right' }}>{formatInvoiceMoney(data.currency, line.amount)}</span>
          </Box>
        ))}
        <Box sx={{ mt: 1, ml: 'auto', width: '58%', display: 'grid', gap: 0.35, fontSize: compact ? 9 : 11 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
            <span>Total</span><span>{formatInvoiceMoney(data.currency, subtotal)}</span>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
            <span>Tax ({data.taxRate || 0}%)</span><span>{formatInvoiceMoney(data.currency, taxAmount)}</span>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
            <span>Grand total</span><span>{formatInvoiceMoney(data.currency, grandTotal)}</span>
          </Box>
        </Box>
        <Typography sx={{ mt: 1.25, fontSize: compact ? 9 : 11, fontWeight: 700 }}>Payment accounts</Typography>
        {data.banks.length === 0 ? (
          <Typography sx={{ fontSize: 9, color: '#6B7280' }}>No bank account listed.</Typography>
        ) : (
          <Box sx={{
            mt: 0.4,
            display: 'grid',
            gridTemplateColumns: data.banks.length > 1 ? '1fr 1fr' : '1fr',
            columnGap: 1.25,
            rowGap: 1,
          }}>
            {data.banks.map((bank, index) => {
              const rows = [
                ['Bank', bank.bankName],
                ['Account title', bank.accountTitle],
                ['Account number', bank.accountNumber],
                ['IBAN', bank.iban],
                ['Branch', bank.branch],
              ].filter((row): row is [string, string] => Boolean(row[1]?.trim()));
              return (
                <Box key={index} sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: compact ? 9 : 10, fontWeight: 700, color: '#1A1625' }}>
                    {show(bank.paymentTitle || '', bank.bankName || 'Account')}
                  </Typography>
                  {rows.map(([label, value]) => (
                    <Typography key={label} sx={{ fontSize: compact ? 8 : 9, color: '#1A1625', overflowWrap: 'anywhere' }}>
                      <Box component="span" sx={{ color: '#6B7280' }}>{label}: </Box>
                      {value}
                    </Typography>
                  ))}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export const InvoiceTemplatePicker = ({
  value,
  onChange,
  disabled,
}: {
  value: InvoiceTemplateId;
  onChange: (template: InvoiceTemplateId) => void;
  disabled?: boolean;
}) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
    {INVOICE_TEMPLATE_OPTIONS.map((option) => {
      const selected = value === option.id;
      return (
        <Box
          key={option.id}
          component="button"
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.id)}
          sx={{
            border: '1px solid',
            borderColor: selected ? tokens.brand.primary : tokens.surface.border,
            bgcolor: selected ? tokens.brand.primary50 : 'transparent',
            borderRadius: '10px',
            p: 1,
            cursor: disabled ? 'default' : 'pointer',
            textAlign: 'left',
            color: 'inherit',
          }}
        >
          <Box sx={{ height: 36, borderRadius: '4px', overflow: 'hidden', border: '1px solid #E5E7EB', bgcolor: '#fff', mb: 0.75 }}>
            <Box sx={{ height: option.id === 'modern' ? 10 : 6, bgcolor: option.id === 'classic' ? '#fff' : option.id === 'modern' ? tokens.brand.primary : '#111827' }} />
            <Box sx={{ px: 0.5, pt: 0.4, display: 'grid', gap: 0.3 }}>
              <Box sx={{ height: 3, width: '46%', bgcolor: '#D1D5DB', borderRadius: 1 }} />
              <Box sx={{ height: 8, bgcolor: option.id === 'compact' ? '#111827' : option.id === 'modern' ? tokens.brand.primary : '#374151', borderRadius: 0.5 }} />
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700 }}>{option.label}</Typography>
        </Box>
      );
    })}
  </Box>
);
