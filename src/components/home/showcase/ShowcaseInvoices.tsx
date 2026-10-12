import { useState } from 'react';
import { Box, Typography, Button, Chip, useTheme } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import { tokens } from '@/styles/tokens';
import { INVOICE_TEMPLATE_OPTIONS } from '@/types/invoice';

export const ShowcaseInvoices = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTemplate, setActiveTemplate] = useState('modern');
  const [activeCurrency, setActiveCurrency] = useState('USD');

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Top Header & Actions */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 850, color: isDark ? '#fff' : tokens.text.primary, fontSize: '1.35rem' }}>
              Invoicing & Billing Studio
            </Typography>
            <Chip label="Invoice #INV-2026-088" size="small" sx={{ fontWeight: 800, bgcolor: tokens.brand.primary50, color: tokens.brand.primary }} />
          </Box>
          <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>
            Multi-currency financial billing with automated NTN tax calculations and direct SMTP email dispatch.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {['USD', 'PKR', 'AED', 'EUR'].map((curr) => (
            <Button
              key={curr}
              size="small"
              onClick={() => setActiveCurrency(curr)}
              sx={{
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.74rem',
                bgcolor: activeCurrency === curr ? tokens.brand.accent : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                color: activeCurrency === curr ? '#fff' : isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary',
              }}
            >
              {curr}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Template Picker Pills (5 Designer Styles) */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {INVOICE_TEMPLATE_OPTIONS.map((style) => (
          <Button
            key={style.id}
            size="small"
            variant={activeTemplate === style.id ? 'contained' : 'outlined'}
            onClick={() => setActiveTemplate(style.id)}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 750,
              fontSize: '0.78rem',
              bgcolor: activeTemplate === style.id ? tokens.brand.primary : 'transparent',
              borderColor: activeTemplate === style.id ? tokens.brand.primary : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: activeTemplate === style.id ? '#fff' : isDark ? '#fff' : tokens.text.primary,
            }}
          >
            {style.label}
          </Button>
        ))}
      </Box>

      {/* Authentic Rendered Invoice Document Preview */}
      <Box
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: '20px',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Invoice Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
              <Box
                component="img"
                src={isDark ? '/logo/leapsofts-white.png' : '/logo/leapsofts.png'}
                alt="Leapsofts"
                sx={{ width: 34, height: 34, borderRadius: '8px' }}
              />
              <Typography variant="h6" fontWeight={850} color={isDark ? '#fff' : tokens.text.primary} lineHeight={1}>
                LEAPSOFTS TECHNOLOGIES
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block">
              NTN: 8294710-3 · Corporate Office: Enterprise Tower, Level 8
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Email: billing@leapsofts.com
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Chip label="PAID IN FULL" size="small" sx={{ fontWeight: 800, bgcolor: '#10B981', color: '#fff', mb: 0.5 }} />
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? '#fff' : tokens.text.primary}>
              INV-2026-088
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Issue Date: Oct 01, 2026
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Due Date: Oct 15, 2026
            </Typography>
          </Box>
        </Box>

        {/* Bill To */}
        <Box sx={{ mb: 3, p: 2, borderRadius: '12px', bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9F8FC' }}>
          <Typography variant="caption" fontWeight={800} color={tokens.brand.accent} textTransform="uppercase" letterSpacing="0.06em">
            BILLED CLIENT
          </Typography>
          <Typography variant="subtitle1" fontWeight={800} color={isDark ? '#fff' : tokens.text.primary}>
            Apex Global Cloud Solutions Inc.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Attention: David C. Sterling (VP Technology) · Tax Reg: 9142-884
          </Typography>
        </Box>

        {/* Line Items */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', mb: 1.5 }}>
            <Typography variant="caption" fontWeight={800} color="text.secondary">DESCRIPTION</Typography>
            <Typography variant="caption" fontWeight={800} color="text.secondary">AMOUNT ({activeCurrency})</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
            <Box>
              <Typography variant="body2" fontWeight={750} color={isDark ? '#fff' : tokens.text.primary}>
                Enterprise Sales Automation & Telemetry Engine (Yearly)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                15 Dedicated Seats + LinkedIn & Cold Calling CRM Module
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={800}>
              {activeCurrency === 'PKR' ? 'Rs 2,500,000.00' : `${activeCurrency} 8,500.00`}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
            <Box>
              <Typography variant="body2" fontWeight={750} color={isDark ? '#fff' : tokens.text.primary}>
                Dedicated Multi-Tenant Infrastructure & Integration Support
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Custom WebSocket cluster setup & Google Drive OAuth mapping
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={800}>
              {activeCurrency === 'PKR' ? 'Rs 850,000.00' : `${activeCurrency} 3,200.00`}
            </Typography>
          </Box>
        </Box>

        {/* Totals & Bank Coordinates */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-end' }, pt: 2, borderTop: '2px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceIcon sx={{ color: tokens.brand.accent, fontSize: 18 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={650}>
              Remit via Standard Chartered Bank · IBAN: PK36SCBL0000001234567801
            </Typography>
          </Box>

          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
              TOTAL AMOUNT PAID
            </Typography>
            <Typography variant="h5" fontWeight={850} color={tokens.brand.accent}>
              {activeCurrency === 'PKR' ? 'Rs 3,350,000.00' : `${activeCurrency} 11,700.00`}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
