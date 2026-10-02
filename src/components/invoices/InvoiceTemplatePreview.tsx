import { Box, Typography, Chip, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
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
  if (!value) return '—';
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return trimmed || '—';
};

const PartyBlock = ({
  title,
  party,
  accentColor = tokens.brand.primary,
  bg = '#F9FAFB',
}: {
  title: string;
  party: InvoiceParty;
  accentColor?: string;
  bg?: string;
}) => (
  <Box
    sx={{
      p: 1.5,
      borderRadius: '10px',
      bgcolor: bg,
      border: '1px solid #E5E7EB',
      minWidth: 0,
    }}
  >
    <Typography sx={{ fontSize: 9, letterSpacing: '0.08em', color: accentColor, fontWeight: 800, textTransform: 'uppercase', mb: 0.5 }}>
      {title}
    </Typography>
    <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
      {show(party.name, title === 'FROM' ? 'Your Company' : 'Client Company')}
    </Typography>
    {party.ntn && (
      <Typography sx={{ fontSize: 10, color: '#4B5563', mt: 0.3, fontWeight: 600 }}>
        NTN / Reg: <strong>{party.ntn}</strong>
      </Typography>
    )}
    <Typography sx={{ fontSize: 10, color: '#4B5563', mt: 0.3, whiteSpace: 'pre-wrap', lineHeight: 1.3 }}>
      {show(party.address, 'Address')}
    </Typography>
    {party.email && (
      <Typography sx={{ fontSize: 10, color: accentColor, mt: 0.3, fontWeight: 650 }}>
        {party.email}
      </Typography>
    )}
  </Box>
);

export const InvoiceTemplatePreview = ({ data }: { data: InvoicePreviewData }) => {
  const lines = data.lines.length > 0 ? data.lines : [{ description: '', qty: 1, unitPrice: 0 }];
  const priced = lines.map((line) => ({
    ...line,
    amount: roundMoney((Number.isFinite(line.qty) ? line.qty : 0) * (Number.isFinite(line.unitPrice) ? line.unitPrice : 0)),
  }));
  const subtotal = roundMoney(priced.reduce((sum, line) => sum + line.amount, 0));
  const taxAmount = roundMoney(subtotal * (Number.isFinite(data.taxRate) ? data.taxRate : 0) / 100);
  const grandTotal = roundMoney(subtotal + taxAmount);

  // -------------------------------------------------------------
  // TEMPLATE 1: MODERN STUDIO RECEIPT
  // -------------------------------------------------------------
  if (data.template === 'modern') {
    return (
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          color: '#111827',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(93, 26, 137, 0.12)',
          border: '1px solid #E5E7EB',
          width: '100%',
        }}
      >
        {/* Header Ribbon */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #5D1A89 0%, #9563B8 100%)',
            color: '#FFFFFF',
            px: 2.5,
            py: 2.25,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
                INVOICE
              </Typography>
              {data.paid && (
                <Chip
                  label="PAID"
                  size="small"
                  sx={{ height: 20, bgcolor: 'rgba(16, 185, 129, 0.25)', color: '#6EE7B7', fontWeight: 800, fontSize: 10, border: '1px solid rgba(110, 231, 183, 0.4)' }}
                />
              )}
            </Box>
            <Typography sx={{ fontSize: 12, opacity: 0.9, mt: 0.5, fontWeight: 600 }}>
              {show(data.invoiceNumber, 'INV-0001')} · Issued Date: {formatDate(data.issueDate)} · Due Date: {formatDate(data.dueDate)}
            </Typography>
          </Box>
          {data.logoUrl ? (
            <Box component="img" src={data.logoUrl} alt="" sx={{ width: 46, height: 46, objectFit: 'contain', bgcolor: '#fff', borderRadius: '10px', p: 0.5 }} />
          ) : (
            <ReceiptLongIcon sx={{ fontSize: 32, opacity: 0.8 }} />
          )}
        </Box>

        {/* Parties Row */}
        <Box sx={{ px: 2.5, pt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <PartyBlock title="FROM" party={data.issuer} accentColor="#5D1A89" bg="#FAF5FF" />
          <PartyBlock title="BILL TO" party={data.client} accentColor="#5D1A89" bg="#F9FAFB" />
        </Box>

        {/* Line Items Table */}
        <Box sx={{ px: 2.5, pt: 2, pb: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.8fr 0.5fr 0.8fr 0.8fr', bgcolor: '#5D1A89', color: '#FFFFFF', px: 1.25, py: 0.75, fontSize: 10, fontWeight: 800, borderRadius: '8px 8px 0 0' }}>
            <span>Item Description</span>
            <span style={{ textAlign: 'right' }}>Qty</span>
            <span style={{ textAlign: 'right' }}>Unit Price</span>
            <span style={{ textAlign: 'right' }}>Amount</span>
          </Box>
          {priced.map((line, index) => (
            <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '1.8fr 0.5fr 0.8fr 0.8fr', px: 1.25, py: 0.85, fontSize: 11, borderBottom: '1px solid #F3F4F6', bgcolor: index % 2 === 0 ? '#FFFFFF' : '#FAF8FC' }}>
              <span style={{ fontWeight: 600 }}>{show(line.description, 'Line item')}</span>
              <span style={{ textAlign: 'right', color: '#4B5563' }}>{line.qty || 0}</span>
              <span style={{ textAlign: 'right', color: '#4B5563' }}>{formatInvoiceMoney(data.currency, line.unitPrice || 0)}</span>
              <span style={{ textAlign: 'right', fontWeight: 750, color: '#111827' }}>{formatInvoiceMoney(data.currency, line.amount)}</span>
            </Box>
          ))}

          {/* Totals Summary */}
          <Box sx={{ mt: 1.5, ml: 'auto', width: '55%', bgcolor: '#FAF5FF', p: 1.5, borderRadius: '10px', border: '1px solid #E9D5FF', display: 'grid', gap: 0.5, fontSize: 11 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontWeight: 600 }}>
              <span>Subtotal</span><span>{formatInvoiceMoney(data.currency, subtotal)}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontWeight: 600 }}>
              <span>Tax ({data.taxRate || 0}%)</span><span>{formatInvoiceMoney(data.currency, taxAmount)}</span>
            </Box>
            <Divider sx={{ my: 0.25 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#5D1A89', fontSize: 13 }}>
              <span>Grand Total</span><span>{formatInvoiceMoney(data.currency, grandTotal)}</span>
            </Box>
          </Box>

          {/* Banks Section */}
          <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #E5E7EB' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, color: '#5D1A89', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccountBalanceIcon sx={{ fontSize: 13 }} /> Payment Bank Accounts
            </Typography>
            {data.banks.length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: data.banks.length > 1 ? { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } : '1fr', gap: 1.25 }}>
                {data.banks.map((bank, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      p: 1.5,
                      pl: 1.75,
                      borderRadius: '10px',
                      bgcolor: '#FAF5FF',
                      border: '1px solid #E9D5FF',
                    }}
                  >
                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', bgcolor: '#5D1A89' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                      <Typography sx={{ fontWeight: 850, fontSize: 11, color: '#5D1A89', lineHeight: 1.3 }}>
                        {bank.paymentTitle || bank.bankName}
                      </Typography>
                      {bank.accountTitle && (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1.5px 5px',
                            borderRadius: '4px',
                            fontSize: '8.5px',
                            fontWeight: 750,
                            lineHeight: 1,
                            backgroundColor: 'rgba(93, 26, 137, 0.12)',
                            color: '#5D1A89',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {bank.accountTitle}
                        </span>
                      )}
                    </Box>

                    <Box sx={{ display: 'grid', gap: 0.35, fontSize: 9.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <span style={{ color: '#6B7280', width: 50, flexShrink: 0, fontWeight: 600 }}>Bank:</span>
                        <strong style={{ color: '#111827' }}>{bank.bankName}</strong>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <span style={{ color: '#6B7280', width: 50, flexShrink: 0, fontWeight: 600 }}>Account:</span>
                        <strong style={{ color: '#111827', fontFamily: 'monospace' }}>{bank.accountNumber}</strong>
                      </Box>
                      {bank.iban && (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <span style={{ color: '#6B7280', width: 50, flexShrink: 0, fontWeight: 600 }}>IBAN:</span>
                          <strong style={{ color: '#111827', fontFamily: 'monospace', wordBreak: 'break-all' }}>{bank.iban}</strong>
                        </Box>
                      )}
                      {bank.branch && (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <span style={{ color: '#6B7280', width: 50, flexShrink: 0, fontWeight: 600 }}>Branch:</span>
                          <span style={{ color: '#374151' }}>{bank.branch}</span>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
                <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: '#FAF5FF', border: '1px solid #E9D5FF', borderLeft: '3.5px solid #5D1A89', fontSize: 9.5 }}>
                  <Typography sx={{ fontWeight: 850, fontSize: 11, color: '#5D1A89', mb: 0.5 }}>Bank Transfer / Wire</Typography>
                  <Box sx={{ display: 'grid', gap: 0.25, color: '#4B5563' }}>
                    <div><strong style={{ color: '#111827' }}>Bank:</strong> Standard Chartered / Commercial Bank</div>
                    <div><strong style={{ color: '#111827' }}>Account:</strong> Verified Merchant Account</div>
                  </Box>
                </Box>
                <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: '#FAF5FF', border: '1px solid #E9D5FF', borderLeft: '3.5px solid #5D1A89', fontSize: 9.5 }}>
                  <Typography sx={{ fontWeight: 850, fontSize: 11, color: '#5D1A89', mb: 0.5 }}>Online / Digital Pay</Typography>
                  <Box sx={{ display: 'grid', gap: 0.25, color: '#4B5563' }}>
                    <div><strong style={{ color: '#111827' }}>Paypal / Swift:</strong> {data.issuer.email || 'payments@leapsofts.com'}</div>
                    <div><strong style={{ color: '#111827' }}>Cards:</strong> Available online</div>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 2: EXECUTIVE CORPORATE (CLASSIC REVAMPED)
  // -------------------------------------------------------------
  if (data.template === 'classic') {
    return (
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          color: '#0F172A',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 16px 36px rgba(15, 23, 42, 0.12)',
          border: '1.5px solid #0F172A',
          width: '100%',
        }}
      >
        <Box sx={{ width: '100%' }}>
          {/* Formal Top Double Bar */}
          <Box sx={{ height: 6, bgcolor: '#0F172A' }} />
          <Box sx={{ height: 2, bgcolor: '#E2E8F0', mb: 1.5 }} />
        </Box>

        <Box sx={{ px: 3, pt: 1, pb: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 24, fontWeight: 900, fontFamily: 'serif', letterSpacing: '0.02em', color: '#0F172A' }}>
                INVOICE
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#475569', fontWeight: 650, mt: 0.2 }}>
                Reference: <strong>{show(data.invoiceNumber, 'INV-0001')}</strong> {data.paid ? ' · [PAID]' : ''}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: 10, color: '#64748B', fontWeight: 700 }}>ISSUED DATE</Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 750, color: '#0F172A' }}>{formatDate(data.issueDate)}</Typography>
              <Typography sx={{ fontSize: 10, color: '#64748B', fontWeight: 700, mt: 0.5 }}>DUE DATE</Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 750, color: '#0F172A' }}>{formatDate(data.dueDate)}</Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#0F172A', borderWidth: 1, mb: 2 }} />

          {/* Party Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
            <Box sx={{ borderLeft: '3px solid #0F172A', pl: 1.25 }}>
              <Typography sx={{ fontSize: 9, fontWeight: 800, color: '#64748B', letterSpacing: '0.06em' }}>ISSUED BY</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#0F172A', mt: 0.2 }}>{show(data.issuer.name, 'Your Company')}</Typography>
              {data.issuer.ntn && <Typography sx={{ fontSize: 10, color: '#475569' }}>NTN: {data.issuer.ntn}</Typography>}
              <Typography sx={{ fontSize: 10, color: '#475569', whiteSpace: 'pre-wrap' }}>{show(data.issuer.address, 'Address')}</Typography>
            </Box>

            <Box sx={{ borderLeft: '3px solid #475569', pl: 1.25 }}>
              <Typography sx={{ fontSize: 9, fontWeight: 800, color: '#64748B', letterSpacing: '0.06em' }}>BILLED TO</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#0F172A', mt: 0.2 }}>{show(data.client.name, 'Client Company')}</Typography>
              {data.client.ntn && <Typography sx={{ fontSize: 10, color: '#475569' }}>NTN: {data.client.ntn}</Typography>}
              <Typography sx={{ fontSize: 10, color: '#475569', whiteSpace: 'pre-wrap' }}>{show(data.client.address, 'Address')}</Typography>
            </Box>
          </Box>

          {/* Table */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.8fr 0.5fr 0.8fr 0.8fr', bgcolor: '#0F172A', color: '#FFFFFF', px: 1.25, py: 0.75, fontSize: 10, fontWeight: 800 }}>
            <span>DESCRIPTION</span>
            <span style={{ textAlign: 'right' }}>QTY</span>
            <span style={{ textAlign: 'right' }}>UNIT PRICE</span>
            <span style={{ textAlign: 'right' }}>TOTAL</span>
          </Box>
          {priced.map((line, index) => (
            <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '1.8fr 0.5fr 0.8fr 0.8fr', px: 1.25, py: 0.75, fontSize: 10.5, borderBottom: '1px solid #E2E8F0' }}>
              <span>{show(line.description, 'Line item')}</span>
              <span style={{ textAlign: 'right' }}>{line.qty || 0}</span>
              <span style={{ textAlign: 'right' }}>{formatInvoiceMoney(data.currency, line.unitPrice || 0)}</span>
              <span style={{ textAlign: 'right', fontWeight: 700 }}>{formatInvoiceMoney(data.currency, line.amount)}</span>
            </Box>
          ))}

          {/* Totals */}
          <Box sx={{ mt: 2, ml: 'auto', width: '50%', border: '1px solid #0F172A', p: 1.25, fontSize: 11 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
              <span>Subtotal</span><span>{formatInvoiceMoney(data.currency, subtotal)}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
              <span>Tax ({data.taxRate || 0}%)</span><span>{formatInvoiceMoney(data.currency, taxAmount)}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, bgcolor: '#0F172A', color: '#fff', p: 0.75, mt: 0.5 }}>
              <span>TOTAL DUE</span><span>{formatInvoiceMoney(data.currency, grandTotal)}</span>
            </Box>
          </Box>

          {/* Classic Bank Accounts Section */}
          <Box sx={{ mt: 2.5, pt: 1.5, borderTop: '1px solid #0F172A' }}>
            <Typography sx={{ fontSize: 9.5, fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
              BANK & PAYMENT INSTRUCTIONS
            </Typography>
            {data.banks.length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: data.banks.length > 1 ? { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } : '1fr', gap: 1.25 }}>
                {data.banks.map((bank, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      p: 1.5,
                      pl: 1.75,
                      bgcolor: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      fontSize: 9.5,
                    }}
                  >
                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', bgcolor: '#0F172A' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                      <Typography sx={{ fontWeight: 850, fontSize: 10.5, color: '#0F172A', lineHeight: 1.3 }}>
                        {bank.paymentTitle || bank.bankName}
                      </Typography>
                      {bank.accountTitle && (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1.5px 5px',
                            borderRadius: '4px',
                            fontSize: '8.5px',
                            fontWeight: 750,
                            lineHeight: 1,
                            backgroundColor: '#E2E8F0',
                            color: '#0F172A',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {bank.accountTitle}
                        </span>
                      )}
                    </Box>
                    <Box sx={{ display: 'grid', gap: 0.35 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>Bank:</span>
                        <strong style={{ color: '#0F172A' }}>{bank.bankName}</strong>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>Account No:</span>
                        <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{bank.accountNumber}</strong>
                      </Box>
                      {bank.iban && (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>IBAN:</span>
                          <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{bank.iban}</strong>
                        </Box>
                      )}
                      {bank.branch && (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>Branch:</span>
                          <span style={{ color: '#0F172A' }}>{bank.branch}</span>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
                <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', border: '1px solid #CBD5E1', borderLeft: '3.5px solid #0F172A', fontSize: 9.5 }}>
                  <Typography sx={{ fontWeight: 850, fontSize: 10.5, color: '#0F172A', mb: 0.5 }}>Wire / Bank Transfer</Typography>
                  <div><strong style={{ color: '#0F172A' }}>Bank:</strong> Standard Chartered / Commercial Bank</div>
                  <div><strong style={{ color: '#0F172A' }}>Account:</strong> Verified Merchant Corporate Account</div>
                </Box>
                <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', border: '1px solid #CBD5E1', borderLeft: '3.5px solid #0F172A', fontSize: 9.5 }}>
                  <Typography sx={{ fontWeight: 850, fontSize: 10.5, color: '#0F172A', mb: 0.5 }}>Digital Payment</Typography>
                  <div><strong style={{ color: '#0F172A' }}>Paypal / Wire:</strong> {data.issuer.email || 'payments@leapsofts.com'}</div>
                  <div><strong style={{ color: '#0F172A' }}>Terms:</strong> Due per indicated due date</div>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 3: GEOMETRIC PRISM (SAAS MINIMALIST)
  // -------------------------------------------------------------
  if (data.template === 'compact') {
    return (
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          color: '#111827',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 45px rgba(10, 54, 99, 0.08)',
          border: '1px solid #E5E7EB',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Main Content Body */}
        <Box sx={{ p: { xs: 2.5, sm: 3.5 }, pb: { xs: 3, sm: 3.5 }, position: 'relative', zIndex: 1 }}>
          {/* Top Header Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3.5, gap: 2 }}>
            {/* Top Left: Geometric Prism Logo & Company */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {data.logoUrl ? (
                <Box
                  component="img"
                  src={data.logoUrl}
                  alt={data.issuer.name}
                  sx={{ width: 48, height: 48, objectFit: 'contain', mb: 1 }}
                />
              ) : (
                /* Geometric 3D Prism Triangles Logo */
                <Box sx={{ mb: 0.8, width: 44, height: 44 }}>
                  <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                    <polygon points="50,6 92,86 50,70" fill="#0A3663" />
                    <polygon points="50,6 8,86 50,70" fill="#0D47A1" />
                    <polygon points="50,26 76,76 50,66" fill="#1E88E5" />
                    <polygon points="50,26 24,76 50,66" fill="#38B6FF" />
                    <polygon points="50,44 65,71 50,63" fill="#70D6FF" />
                  </svg>
                </Box>
              )}
              <Typography
                sx={{
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  color: '#0A3663',
                  lineHeight: 1.1,
                  textTransform: 'uppercase',
                }}
              >
                {show(data.issuer.name, 'AETEXT')}
              </Typography>
              <Typography
                sx={{
                  fontSize: 8.5,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  mt: 0.3,
                }}
              >
                YOUR TAGLINE HERE
              </Typography>
            </Box>

            {/* Top Right: Contact Metadata & Big INVOICE Headline */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
              {/* Contact metadata row */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 1.5, sm: 2 },
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  fontSize: 9.5,
                  color: '#4B5563',
                  pb: 1.5,
                  borderBottom: '1px solid #E5E7EB',
                  width: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  <LocationOnIcon sx={{ fontSize: 13, color: '#0A3663', flexShrink: 0 }} />
                  <Typography component="span" sx={{ fontSize: 9.5, color: '#4B5563', lineHeight: 1.3, maxWidth: 260 }}>
                    {show(data.issuer.address, '1 Your Address City, Country')}
                  </Typography>
                </Box>
                {data.issuer.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                    <EmailIcon sx={{ fontSize: 13, color: '#0A3663', flexShrink: 0 }} />
                    <Typography component="span" sx={{ fontSize: 9.5, color: '#4B5563', lineHeight: 1.3 }}>
                      {data.issuer.email}
                    </Typography>
                  </Box>
                )}
                {data.issuer.ntn && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                    <Typography component="span" sx={{ fontSize: 8, fontWeight: 800, color: '#0A3663', bgcolor: 'rgba(10, 54, 99, 0.08)', px: 0.5, py: 0.2, borderRadius: '3px', lineHeight: 1 }}>
                      NTN
                    </Typography>
                    <Typography component="span" sx={{ fontSize: 9.5, color: '#4B5563', lineHeight: 1.3 }}>
                      {data.issuer.ntn}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Big INVOICE heading */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: 28,
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    color: '#111827',
                    lineHeight: 1,
                  }}
                >
                  INVOICE
                </Typography>
                {data.paid && (
                  <Chip
                    label="PAID"
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: 9.5,
                      fontWeight: 800,
                      bgcolor: '#DCFCE7',
                      color: '#15803D',
                      border: '1px solid #86EFAC',
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Middle Section: 2-Column Info (Billed To & Invoice Meta) */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 3,
              mb: 3,
            }}
          >
            {/* Col 1: Billed To */}
            <Box sx={{ maxWidth: { xs: '100%', sm: '55%' } }}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#6B7280', mb: 0.4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Billed To.
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                {show(data.client.name, 'Client Name')}
              </Typography>
              {data.client.address && (
                <Typography sx={{ fontSize: 10, color: '#4B5563', mt: 0.3, whiteSpace: 'pre-wrap', lineHeight: 1.3 }}>
                  {data.client.address}
                </Typography>
              )}
              {data.client.ntn && (
                <Typography sx={{ fontSize: 9.5, color: '#4B5563', mt: 0.3 }}>
                  NTN: <strong>{data.client.ntn}</strong>
                </Typography>
              )}
              {data.client.email && (
                <Typography sx={{ fontSize: 9.5, color: '#0A3663', mt: 0.2, fontWeight: 650 }}>
                  {data.client.email}
                </Typography>
              )}
            </Box>

            {/* Col 2: Invoice Numbers & Dates */}
            <Box sx={{ display: 'grid', gap: 1, textAlign: 'right', justifyItems: 'end' }}>
              <Box>
                <Typography sx={{ fontSize: 9.5, fontWeight: 600, color: '#6B7280' }}>
                  Invoice Number
                </Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: '#111827' }}>
                  {show(data.invoiceNumber, '0001')}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 9.5, fontWeight: 600, color: '#6B7280' }}>
                  Issued Date
                </Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: '#111827' }}>
                  {formatDate(data.issueDate)}
                </Typography>
              </Box>
              {data.dueDate && (
                <Box>
                  <Typography sx={{ fontSize: 9.5, fontWeight: 600, color: '#6B7280' }}>
                    Due Date
                  </Typography>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: '#111827' }}>
                    {formatDate(data.dueDate)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Line Items Table */}
          <Box sx={{ mb: 3 }}>
            {/* Table Header with solid dark underline */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '2.5fr 1fr 0.6fr 1.2fr',
                pb: 1,
                borderBottom: '2px solid #111827',
                fontSize: 11,
                fontWeight: 800,
                color: '#111827',
              }}
            >
              <span>Description</span>
              <span style={{ textAlign: 'right' }}>Unit Cost</span>
              <span style={{ textAlign: 'center' }}>Qty</span>
              <span style={{ textAlign: 'right' }}>Amount</span>
            </Box>

            {/* Table Rows */}
            {priced.map((line, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '2.5fr 1fr 0.6fr 1.2fr',
                  py: 1.2,
                  borderBottom: '1px solid #E5E7EB',
                  alignItems: 'center',
                  fontSize: 11,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 750, color: '#111827', lineHeight: 1.2 }}>
                    {show(line.description, 'Service / Product Item')}
                  </Typography>
                  <Typography sx={{ fontSize: 9, color: '#9CA3AF', mt: 0.2 }}>
                    Premium enterprise quality delivery
                  </Typography>
                </Box>
                <span style={{ textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                  {formatInvoiceMoney(data.currency, line.unitPrice || 0)}
                </span>
                <span style={{ textAlign: 'center', fontWeight: 600, color: '#374151' }}>
                  {line.qty || 0}
                </span>
                <span style={{ textAlign: 'right', fontWeight: 750, color: '#111827' }}>
                  {formatInvoiceMoney(data.currency, line.amount)}
                </span>
              </Box>
            ))}
          </Box>

          {/* Totals Breakdown Row (Right Aligned) */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Box sx={{ minWidth: { xs: '100%', sm: 260 }, display: 'grid', gap: 0.6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4B5563' }}>
                <span>Sub-Total</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{formatInvoiceMoney(data.currency, subtotal)}</span>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4B5563' }}>
                <span>Tax: Vat ({data.taxRate || 0}%)</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{formatInvoiceMoney(data.currency, taxAmount)}</span>
              </Box>

              {/* Grand Total Bar with solid top line */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pt: 0.8,
                  mt: 0.4,
                  borderTop: '2px solid #111827',
                }}
              >
                <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: '#111827' }}>
                  Grand Total:
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 900, color: '#111827' }}>
                  {formatInvoiceMoney(data.currency, grandTotal)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Payment Info Section (Uniform 2-Column Cards) */}
          <Box sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#111827', mb: 1 }}>
              Payment Info:
            </Typography>
            {data.banks.length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: data.banks.length > 1 ? { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } : '1fr', gap: 1.5 }}>
                {data.banks.map((bank, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      p: 1.5,
                      pl: 1.75,
                      borderRadius: '12px',
                      bgcolor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      fontSize: 10,
                    }}
                  >
                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', bgcolor: '#0EA5E9' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 12, color: '#111827', lineHeight: 1.3 }}>
                        {bank.paymentTitle || bank.bankName}
                      </Typography>
                      {bank.accountTitle && (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1.5px 5px',
                            borderRadius: '4px',
                            fontSize: '8.5px',
                            fontWeight: 750,
                            lineHeight: 1,
                            backgroundColor: '#E0F2FE',
                            color: '#0369A1',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {bank.accountTitle}
                        </span>
                      )}
                    </Box>
                    <Box sx={{ display: 'grid', gap: 0.35, color: '#475569' }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <span style={{ color: '#334155', width: 50, flexShrink: 0, fontWeight: 700 }}>Bank:</span>
                        <strong style={{ color: '#111827' }}>{bank.bankName}</strong>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <span style={{ color: '#334155', width: 50, flexShrink: 0, fontWeight: 700 }}>A/C:</span>
                        <strong style={{ fontFamily: 'monospace', color: '#111827' }}>{bank.accountNumber}</strong>
                      </Box>
                      {bank.iban && (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <span style={{ color: '#334155', width: 50, flexShrink: 0, fontWeight: 700 }}>IBAN:</span>
                          <strong style={{ fontFamily: 'monospace', color: '#111827', wordBreak: 'break-all' }}>{bank.iban}</strong>
                        </Box>
                      )}
                      {bank.branch && (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <span style={{ color: '#334155', width: 50, flexShrink: 0, fontWeight: 700 }}>Branch:</span>
                          <span style={{ color: '#111827' }}>{bank.branch}</span>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderLeft: '4px solid #0EA5E9',
                    fontSize: 10,
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: 12, color: '#111827', mb: 0.5 }}>
                    Paypal / Digital
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 0.25, color: '#475569' }}>
                    <div><strong style={{ color: '#334155' }}>Paypal:</strong> {data.issuer.email || 'payments@leapsofts.com'}</div>
                    <div><strong style={{ color: '#334155' }}>Account:</strong> Verified Merchant</div>
                  </Box>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderLeft: '4px solid #0EA5E9',
                    fontSize: 10,
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: 12, color: '#111827', mb: 0.5 }}>
                    Cards & Wire Transfer
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 0.25, color: '#475569' }}>
                    <div><strong style={{ color: '#334155' }}>Cards:</strong> Visa, Mastercard, Payoneer</div>
                    <div><strong style={{ color: '#334155' }}>Swift:</strong> Available on demand</div>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Bottom Left: Polygonal Crystal Prism Geometric Art SVG */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: { xs: 130, sm: 170 },
            height: { xs: 100, sm: 135 },
            pointerEvents: 'none',
            zIndex: 0,
            opacity: 0.92,
          }}
        >
          <svg viewBox="0 0 240 200" width="100%" height="100%" style={{ display: 'block' }}>
            {/* Facet 1: Deep Sapphire Base */}
            <polygon points="0,200 0,60 90,140" fill="#0A3663" />
            {/* Facet 2: Cobalt Blue */}
            <polygon points="0,200 90,140 160,200" fill="#0D47A1" />
            {/* Facet 3: Electric Royal Blue Middle */}
            <polygon points="0,60 90,140 110,80" fill="#1E88E5" />
            {/* Facet 4: Cyan Highlight Shard */}
            <polygon points="90,140 160,200 190,150" fill="#38B6FF" />
            {/* Facet 5: Light Sky Blue Tip */}
            <polygon points="90,140 110,80 190,150" fill="#70D6FF" />
            {/* Facet 6: Deep Accent Corner Triangle */}
            <polygon points="0,120 0,200 50,200" fill="#06213F" />
          </svg>
        </Box>
      </Box>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 4: MINIMAL CLEAN (AQUA GEOMETRIC REVAMPED)
  // -------------------------------------------------------------
  if (data.template === 'minimal') {
    return (
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          color: '#111827',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.06)',
          border: '1px solid #E5E7EB',
          width: '100%',
          p: { xs: 2.5, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.75,
        }}
      >
        {/* Top Header: Logo & Gray Invoice Pill */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Top Left: Logo Icon & Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            {data.logoUrl ? (
              <Box
                component="img"
                src={data.logoUrl}
                alt={data.issuer.name}
                sx={{ width: 44, height: 44, objectFit: 'contain' }}
              />
            ) : (
              <Box sx={{ width: 38, height: 38 }}>
                <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </Box>
            )}
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#111827', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                {show(data.issuer.name, 'Logo Name')}
              </Typography>
              <Typography sx={{ fontSize: 9.5, color: '#6B7280', fontWeight: 600, mt: 0.2 }}>
                Corporate Solutions
              </Typography>
            </Box>
          </Box>

          {/* Top Right: Light Gray Invoice Pill */}
          <Box
            sx={{
              bgcolor: '#F3F4F6',
              px: { xs: 2.5, sm: 3.5 },
              py: 0.75,
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 40,
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 800,
                color: '#1F2937',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'center',
                transform: 'translateY(-1px)',
              }}
            >
              Invoice
            </Typography>
            {data.paid && (
              <Chip
                label="PAID"
                size="small"
                sx={{ height: 20, fontSize: 9, fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}
              />
            )}
          </Box>
        </Box>

        {/* Parties Row: Office Address (Issuer) & To (Client) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, pt: 1 }}>
          {/* Office Address */}
          <Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: '#111827', mb: 0.4 }}>
              Office Address
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: '#4B5563', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
              {show(data.issuer.address, '123 - Your demo road, demo city, your state, your demo county')}
            </Typography>
            {data.issuer.ntn && (
              <Typography sx={{ fontSize: 10, color: '#4B5563', mt: 0.4 }}>
                NTN: <strong>{data.issuer.ntn}</strong>
              </Typography>
            )}
            {data.issuer.email && (
              <Typography sx={{ fontSize: 10, color: '#111827', fontWeight: 600, mt: 0.3 }}>
                {data.issuer.email}
              </Typography>
            )}
          </Box>

          {/* To : (Client) with bottom underline */}
          <Box sx={{ pb: 1.5, borderBottom: '1.5px solid #E5E7EB' }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: '#111827', mb: 0.4 }}>
              To :
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
              {show(data.client.name, 'Milan Calderon')}
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: '#4B5563', lineHeight: 1.4, mt: 0.3, whiteSpace: 'pre-wrap' }}>
              {show(data.client.address, '123 - Your demo road, demo city, your state, your demo county')}
            </Typography>
            {data.client.ntn && (
              <Typography sx={{ fontSize: 10, color: '#4B5563', mt: 0.3 }}>
                NTN: <strong>{data.client.ntn}</strong>
              </Typography>
            )}
            {data.client.email && (
              <Typography sx={{ fontSize: 10, color: '#111827', fontWeight: 600, mt: 0.2 }}>
                {data.client.email}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Invoice Meta Bar: Invoice Number, Issued Date, Due Date */}
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 2, sm: 3 },
            flexWrap: 'wrap',
            fontSize: 10.5,
            color: '#4B5563',
            pb: 1,
          }}
        >
          <Box>
            <strong style={{ color: '#111827' }}>Invoice No :</strong> {show(data.invoiceNumber, '00001')}
          </Box>
          <Box>
            <strong style={{ color: '#111827' }}>Issued Date :</strong> {formatDate(data.issueDate)}
          </Box>
          <Box>
            <strong style={{ color: '#111827' }}>Due Date :</strong> {formatDate(data.dueDate)}
          </Box>
        </Box>

        {/* Line Items Table */}
        <Box sx={{ mb: 1 }}>
          {/* Dark Table Header Bar */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '2.5fr 1fr 0.6fr 1.2fr',
              alignItems: 'center',
              bgcolor: '#374151',
              color: '#FFFFFF',
              px: 1.75,
              py: 0.9,
              borderRadius: '6px',
              fontSize: 10.5,
              fontWeight: 750,
              minHeight: 34,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', transform: 'translateY(-0.5px)' }}>Item Description</span>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', textAlign: 'right', transform: 'translateY(-0.5px)' }}>Price</span>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transform: 'translateY(-0.5px)' }}>Qnt.</span>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', textAlign: 'right', transform: 'translateY(-0.5px)' }}>Total</span>
          </Box>

          {/* Table Rows */}
          {priced.map((line, index) => (
            <Box
              key={index}
              sx={{
                display: 'grid',
                gridTemplateColumns: '2.5fr 1fr 0.6fr 1.2fr',
                px: 1.75,
                py: 1.25,
                borderBottom: '1px solid #E5E7EB',
                alignItems: 'center',
                fontSize: 11,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 750, color: '#111827', lineHeight: 1.2 }}>
                  {show(line.description, 'Item Name')}
                </Typography>
                <Typography sx={{ fontSize: 9.5, color: '#6B7280', mt: 0.25, lineHeight: 1.3 }}>
                  High standard verified delivery and service specification
                </Typography>
              </Box>
              <span style={{ textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                {formatInvoiceMoney(data.currency, line.unitPrice || 0)}
              </span>
              <span style={{ textAlign: 'center', fontWeight: 600, color: '#374151' }}>
                {String(line.qty || 0).padStart(2, '0')}
              </span>
              <span style={{ textAlign: 'right', fontWeight: 750, color: '#111827' }}>
                {formatInvoiceMoney(data.currency, line.amount)}
              </span>
            </Box>
          ))}
        </Box>

        {/* Totals Breakdown Row (Right Aligned) */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
          <Box sx={{ minWidth: { xs: '100%', sm: 260 }, display: 'grid', gap: 0.75 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4B5563' }}>
              <span style={{ fontWeight: 750, color: '#111827' }}>Subtotal :</span>
              <span style={{ fontWeight: 750, color: '#111827' }}>{formatInvoiceMoney(data.currency, subtotal)}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4B5563' }}>
              <span style={{ fontWeight: 750, color: '#111827' }}>Tax VAT ({data.taxRate || 0}%) :</span>
              <span style={{ fontWeight: 750, color: '#111827' }}>{formatInvoiceMoney(data.currency, taxAmount)}</span>
            </Box>

            {/* Highlighted Total Pill Box */}
            <Box
              sx={{
                bgcolor: '#F3F4F6',
                py: 1,
                px: 1.75,
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: 40,
                mt: 0.5,
              }}
            >
              <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: '#111827', display: 'flex', alignItems: 'center', lineHeight: 1, transform: 'translateY(-0.5px)' }}>
                Total :
              </Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 900, color: '#111827', display: 'flex', alignItems: 'center', lineHeight: 1, transform: 'translateY(-0.5px)' }}>
                {formatInvoiceMoney(data.currency, grandTotal)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Bottom Section: Thank You Pill & 2-Column Payment Info Cards */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {/* Dark Thank You Pill */}
          <Box
            sx={{
              bgcolor: '#374151',
              color: '#FFFFFF',
              fontSize: 9,
              fontWeight: 800,
              px: 1.5,
              py: 0.6,
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'flex-start',
              letterSpacing: '0.04em',
              lineHeight: 1,
              minHeight: 24,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', transform: 'translateY(-0.5px)' }}>
              THANK YOU FOR YOUR BUSINESS
            </span>
          </Box>

          {/* Payment Info Heading & Cards Grid */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#111827', mb: 1 }}>
              Payment Info:
            </Typography>
            {data.banks.length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: data.banks.length > 1 ? { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } : '1fr', gap: 1.5 }}>
                {data.banks.map((bank, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      p: 1.5,
                      pl: 1.75,
                      borderRadius: '12px',
                      bgcolor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      fontSize: 10,
                    }}
                  >
                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', bgcolor: '#374151' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 12, color: '#111827', lineHeight: 1.3 }}>
                        {bank.paymentTitle || bank.bankName}
                      </Typography>
                      {bank.accountTitle && (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1.5px 5px',
                            borderRadius: '4px',
                            fontSize: '8.5px',
                            fontWeight: 750,
                            lineHeight: 1,
                            backgroundColor: '#E5E7EB',
                            color: '#1F2937',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {bank.accountTitle}
                        </span>
                      )}
                    </Box>
                    <Box sx={{ display: 'grid', gap: 0.35, color: '#475569' }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <span style={{ color: '#334155', width: 50, flexShrink: 0, fontWeight: 700 }}>Bank:</span>
                        <strong style={{ color: '#111827' }}>{bank.bankName}</strong>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <span style={{ color: '#334155', width: 50, flexShrink: 0, fontWeight: 700 }}>A/C:</span>
                        <strong style={{ fontFamily: 'monospace', color: '#111827' }}>{bank.accountNumber}</strong>
                      </Box>
                      {bank.iban && (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <span style={{ color: '#334155', width: 50, flexShrink: 0, fontWeight: 700 }}>IBAN:</span>
                          <strong style={{ fontFamily: 'monospace', color: '#111827', wordBreak: 'break-all' }}>{bank.iban}</strong>
                        </Box>
                      )}
                      {bank.branch && (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <span style={{ color: '#334155', width: 50, flexShrink: 0, fontWeight: 700 }}>Branch:</span>
                          <span style={{ color: '#111827' }}>{bank.branch}</span>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderLeft: '4px solid #374151',
                    fontSize: 10,
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: 12, color: '#111827', mb: 0.5 }}>
                    Paypal / Digital
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 0.25, color: '#475569' }}>
                    <div><strong style={{ color: '#334155' }}>Paypal:</strong> {data.issuer.email || 'payments@leapsofts.com'}</div>
                    <div><strong style={{ color: '#334155' }}>Account:</strong> Verified Merchant</div>
                  </Box>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderLeft: '4px solid #374151',
                    fontSize: 10,
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: 12, color: '#111827', mb: 0.5 }}>
                    Cards & Wire Transfer
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 0.25, color: '#475569' }}>
                    <div><strong style={{ color: '#334155' }}>Cards:</strong> Visa, Mastercard, Payoneer</div>
                    <div><strong style={{ color: '#334155' }}>Swift:</strong> Available on demand</div>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Footer Bar: Thank You Message & Support */}
        <Box
          sx={{
            pt: 2,
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 10,
            color: '#6B7280',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: 10.5, fontWeight: 750, color: '#111827' }}>
            Thank you for choosing {show(data.issuer.name, 'our services')}. We truly appreciate your business!
          </Typography>
          <Typography sx={{ fontSize: 9.5, color: '#6B7280' }}>
            Questions? Contact us at <strong>{data.issuer.email || 'support@leapsofts.com'}</strong>
          </Typography>
        </Box>
      </Box>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 5: MONOCHROME STUDIO (MODERN MINIMALIST WAVE)
  // -------------------------------------------------------------
  return (
    <Box
      sx={{
        bgcolor: '#FFFFFF',
        color: '#111827',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.08)',
        border: '1px solid #E5E7EB',
        width: '100%',
        position: 'relative',
      }}
    >
      <Box sx={{ p: 3.5, pb: 2, position: 'relative', zIndex: 2 }}>
        {/* Top Header Row: Logo & Invoice No */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          {data.logoUrl ? (
            <Box component="img" src={data.logoUrl} alt="" sx={{ width: 48, height: 48, objectFit: 'contain' }} />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', color: '#111827', textTransform: 'uppercase', lineHeight: 1.1 }}>
                YOUR
              </Typography>
              <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', color: '#111827', textTransform: 'uppercase', lineHeight: 1.1 }}>
                LOGO
              </Typography>
            </Box>
          )}

          <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#111827', letterSpacing: '0.06em' }}>
            NO. {show(data.invoiceNumber, '000001')}
          </Typography>
        </Box>

        {/* Big Bold Headline */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', lineHeight: 1 }}>
            INVOICE
          </Typography>
          {data.paid && (
            <Chip
              label="PAID"
              size="small"
              sx={{ height: 22, fontSize: 10, fontWeight: 900, bgcolor: '#111827', color: '#FFFFFF', borderRadius: '6px' }}
            />
          )}
        </Box>

        {/* Date Row */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5, fontSize: 11, color: '#374151' }}>
          <Box>
            <strong style={{ color: '#111827' }}>Issued Date:</strong> {formatDate(data.issueDate)}
          </Box>
          <Box>
            <strong style={{ color: '#111827' }}>Due Date:</strong> {formatDate(data.dueDate)}
          </Box>
        </Box>

        {/* Billed To & From Columns */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 2.5 }}>
          <Box>
            <Typography sx={{ fontSize: 10, fontWeight: 800, color: '#111827', mb: 0.5 }}>
              Billed to:
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
              {show(data.client.name, 'Client Company')}
            </Typography>
            {data.client.ntn && (
              <Typography sx={{ fontSize: 10, color: '#4B5563', mt: 0.2 }}>
                NTN: {data.client.ntn}
              </Typography>
            )}
            <Typography sx={{ fontSize: 10.5, color: '#4B5563', mt: 0.2, whiteSpace: 'pre-wrap', lineHeight: 1.3 }}>
              {show(data.client.address, '123 Anywhere St., Any City')}
            </Typography>
            {data.client.email && (
              <Typography sx={{ fontSize: 10.5, color: '#111827', mt: 0.2, fontWeight: 600 }}>
                {data.client.email}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography sx={{ fontSize: 10, fontWeight: 800, color: '#111827', mb: 0.5 }}>
              From:
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
              {show(data.issuer.name, 'Your Company')}
            </Typography>
            {data.issuer.ntn && (
              <Typography sx={{ fontSize: 10, color: '#4B5563', mt: 0.2 }}>
                NTN: {data.issuer.ntn}
              </Typography>
            )}
            <Typography sx={{ fontSize: 10.5, color: '#4B5563', mt: 0.2, whiteSpace: 'pre-wrap', lineHeight: 1.3 }}>
              {show(data.issuer.address, '123 Anywhere St., Any City')}
            </Typography>
            {data.issuer.email && (
              <Typography sx={{ fontSize: 10.5, color: '#111827', mt: 0.2, fontWeight: 600 }}>
                {data.issuer.email}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Line Items Table with Rounded Soft Header Pill */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 0.5fr 0.8fr 0.8fr',
              bgcolor: '#E5E7EB',
              borderRadius: '6px',
              px: 1.5,
              py: 0.75,
              fontSize: 10,
              fontWeight: 800,
              color: '#1F2937',
            }}
          >
            <span>Item</span>
            <span style={{ textAlign: 'center' }}>Quantity</span>
            <span style={{ textAlign: 'right' }}>Price</span>
            <span style={{ textAlign: 'right' }}>Amount</span>
          </Box>

          {priced.map((line, index) => (
            <Box
              key={index}
              sx={{
                display: 'grid',
                gridTemplateColumns: '2fr 0.5fr 0.8fr 0.8fr',
                px: 1.5,
                py: 0.85,
                fontSize: 11,
                borderBottom: '1px solid #F3F4F6',
              }}
            >
              <span style={{ fontWeight: 600, color: '#111827' }}>{show(line.description, 'Line item')}</span>
              <span style={{ textAlign: 'center', color: '#4B5563' }}>{line.qty || 0}</span>
              <span style={{ textAlign: 'right', color: '#4B5563' }}>{formatInvoiceMoney(data.currency, line.unitPrice || 0)}</span>
              <span style={{ textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatInvoiceMoney(data.currency, line.amount)}</span>
            </Box>
          ))}
        </Box>

        {/* Total Summary Row */}
        <Box sx={{ pt: 1, pb: 2, borderBottom: '1.5px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.4, fontSize: 11 }}>
          <Box sx={{ display: 'flex', gap: 3, color: '#6B7280', fontWeight: 600 }}>
            <span>Subtotal:</span>
            <span>{formatInvoiceMoney(data.currency, subtotal)}</span>
          </Box>
          {data.taxRate > 0 && (
            <Box sx={{ display: 'flex', gap: 3, color: '#6B7280', fontWeight: 600 }}>
              <span>Tax ({data.taxRate}%):</span>
              <span>{formatInvoiceMoney(data.currency, taxAmount)}</span>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 3, fontWeight: 900, color: '#111827', fontSize: 13, mt: 0.25 }}>
            <span>Total</span>
            <span>{formatInvoiceMoney(data.currency, grandTotal)}</span>
          </Box>
        </Box>

        {/* Payment & Notes */}
        <Box sx={{ mt: 2, display: 'grid', gap: 0.75, fontSize: 11 }}>
          <Typography sx={{ fontSize: 11, color: '#111827' }}>
            <strong>Payment method:</strong> {data.banks.length > 0 ? 'Bank Transfer / Wire' : 'Cash / Direct'}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#4B5563' }}>
            <strong>Note:</strong> Thank you for choosing us!
          </Typography>
        </Box>

        {/* Bank Instructions in Clean Monochrome Cards */}
        <Box sx={{ mt: 2, mb: 1 }}>
          {data.banks.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: data.banks.length > 1 ? { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } : '1fr', gap: 1.25 }}>
              {data.banks.map((bank, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    fontSize: 9.5,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                    <Typography sx={{ fontWeight: 850, fontSize: 10.5, color: '#111827', lineHeight: 1.3 }}>
                      {bank.paymentTitle || bank.bankName}
                    </Typography>
                    {bank.accountTitle && (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '1.5px 5px',
                          borderRadius: '4px',
                          fontSize: '8.5px',
                          fontWeight: 750,
                          lineHeight: 1,
                          backgroundColor: '#E5E7EB',
                          color: '#111827',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {bank.accountTitle}
                      </span>
                    )}
                  </Box>
                  <Box sx={{ display: 'grid', gap: 0.35 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                      <span style={{ color: '#6B7280', width: 48, flexShrink: 0, fontWeight: 600 }}>Bank:</span>
                      <strong style={{ color: '#111827' }}>{bank.bankName}</strong>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                      <span style={{ color: '#6B7280', width: 48, flexShrink: 0, fontWeight: 600 }}>Account:</span>
                      <strong style={{ color: '#111827', fontFamily: 'monospace' }}>{bank.accountNumber}</strong>
                    </Box>
                    {bank.iban && (
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <span style={{ color: '#6B7280', width: 48, flexShrink: 0, fontWeight: 600 }}>IBAN:</span>
                        <strong style={{ color: '#111827', fontFamily: 'monospace' }}>{bank.iban}</strong>
                      </Box>
                    )}
                    {bank.branch && (
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <span style={{ color: '#6B7280', width: 48, flexShrink: 0, fontWeight: 600 }}>Branch:</span>
                        <span style={{ color: '#111827' }}>{bank.branch}</span>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
              <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', fontSize: 9.5 }}>
                <Typography sx={{ fontWeight: 850, fontSize: 10.5, color: '#111827', mb: 0.3 }}>Corporate Bank Transfer</Typography>
                <div><strong style={{ color: '#111827' }}>Bank:</strong> Commercial Banking Account</div>
                <div><strong style={{ color: '#111827' }}>Account:</strong> Verified Merchant Account</div>
              </Box>
              <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', fontSize: 9.5 }}>
                <Typography sx={{ fontWeight: 850, fontSize: 10.5, color: '#111827', mb: 0.3 }}>Direct & Digital Wire</Typography>
                <div><strong style={{ color: '#111827' }}>Paypal / Wire:</strong> {data.issuer.email || 'payments@leapsofts.com'}</div>
                <div><strong style={{ color: '#111827' }}>Status:</strong> Active</div>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Modern Wave Vector Footer Artwork (Exactly Matching Reference Image) */}
      <Box sx={{ mt: 'auto', width: '100%', overflow: 'hidden', lineHeight: 0 }}>
        <svg
          viewBox="0 0 600 120"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '70px', display: 'block' }}
        >
          {/* Light Grey Back Wave */}
          <path
            d="M0,50 C120,20 220,90 340,90 C420,90 520,30 600,0 L600,120 L0,120 Z"
            fill="#D1D5DB"
          />
          {/* Dark Charcoal Front Wave */}
          <path
            d="M0,95 C140,85 240,115 360,75 C460,40 540,10 600,0 L600,120 L0,120 Z"
            fill="#1F2937"
          />
        </svg>
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
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1.25 }}>
    {INVOICE_TEMPLATE_OPTIONS.map((option) => {
      const selected = value === option.id;
      const getThumbnailAccent = (id: InvoiceTemplateId) => {
        switch (id) {
          case 'modern': return 'linear-gradient(135deg, #5D1A89 0%, #9563B8 100%)';
          case 'classic': return '#0F172A';
          case 'compact': return 'linear-gradient(90deg, #0A3663 0%, #1E88E5 100%)';
          case 'minimal': return '#374151';
          case 'bold': return '#111827';
        }
      };
      const getThumbnailPill = (id: InvoiceTemplateId) => {
        switch (id) {
          case 'modern': return '#5D1A89';
          case 'classic': return '#0F172A';
          case 'compact': return '#0A3663';
          case 'minimal': return '#374151';
          case 'bold': return '#E5E7EB';
        }
      };

      return (
        <Box
          key={option.id}
          component="button"
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.id)}
          sx={{
            border: '2px solid',
            borderColor: selected ? tokens.brand.primary : 'rgba(0,0,0,0.08)',
            bgcolor: selected ? 'rgba(93, 26, 137, 0.04)' : 'transparent',
            borderRadius: '14px',
            p: 1.25,
            cursor: disabled ? 'default' : 'pointer',
            textAlign: 'left',
            color: 'inherit',
            transition: 'all 0.2s ease',
            position: 'relative',
            '&:hover': {
              borderColor: tokens.brand.primary,
              transform: disabled ? 'none' : 'translateY(-1px)',
            }
          }}
        >
          {selected && (
            <CheckCircleIcon
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                fontSize: 16,
                color: tokens.brand.primary,
              }}
            />
          )}

          <Box sx={{ height: 42, borderRadius: '6px', overflow: 'hidden', border: '1px solid #E5E7EB', bgcolor: '#fff', mb: 1, position: 'relative' }}>
            <Box
              sx={{
                height: option.id === 'modern' ? 14 : option.id === 'classic' ? 6 : option.id === 'bold' ? 0 : option.id === 'compact' ? 0 : 6,
                background: getThumbnailAccent(option.id),
              }}
            />
            <Box sx={{ px: 0.6, pt: 0.5, display: 'grid', gap: 0.3 }}>
              <Box sx={{ height: 3, width: '40%', bgcolor: '#94A3B8', borderRadius: 1 }} />
              <Box sx={{ height: 8, bgcolor: getThumbnailPill(option.id), borderRadius: 0.5 }} />
            </Box>
            {option.id === 'bold' && (
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 10, bgcolor: '#1F2937', borderRadius: '8px 0 0 0' }} />
            )}
            {option.id === 'compact' && (
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 16, height: 16, bgcolor: '#0A3663', clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }} />
            )}
          </Box>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: selected ? tokens.brand.primary : 'text.primary', lineHeight: 1.2 }}>
            {option.label}
          </Typography>
        </Box>
      );
    })}
  </Box>
);
