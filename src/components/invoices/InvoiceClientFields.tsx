import type { ChangeEvent } from 'react';
import { Box, TextField, Typography, useTheme } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import { tokens } from '@/styles/tokens';
import type { InvoiceClientForm } from '@/types/invoice';

const setField = (
  value: InvoiceClientForm,
  onChange: (next: InvoiceClientForm) => void,
  key: keyof InvoiceClientForm,
) => (event: ChangeEvent<HTMLInputElement>) => {
  onChange({ ...value, [key]: event.target.value });
};

export const InvoiceClientFields = ({
  value,
  onChange,
}: {
  value: InvoiceClientForm;
  onChange: (next: InvoiceClientForm) => void;
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const field = (label: string, key: keyof InvoiceClientForm, wide = false, placeholder?: string) => (
    <TextField
      fullWidth
      size="small"
      label={label}
      placeholder={placeholder}
      value={value[key]}
      onChange={setField(value, onChange, key)}
      multiline={wide}
      minRows={wide ? 2 : undefined}
      sx={{
        gridColumn: wide ? '1 / -1' : undefined,
        '& .MuiOutlinedInput-root': {
          borderRadius: '12px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.6)' : '#F8FAFC',
          transition: 'all 0.2s ease',
          '& fieldset': {
            borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          },
          '&:hover fieldset': {
            borderColor: tokens.brand.primary,
          },
          '&.Mui-focused fieldset': {
            borderColor: tokens.brand.primary,
            boxShadow: `0 0 0 3px ${isDarkMode ? 'rgba(155,107,184,0.22)' : 'rgba(93,26,137,0.12)'}`,
          }
        },
        '& .MuiInputLabel-root': {
          fontSize: '0.825rem',
          fontWeight: 650,
          color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
          '&.Mui-focused': {
            color: tokens.brand.primary,
          }
        },
        '& .MuiInputBase-input': {
          fontSize: '0.865rem',
          fontWeight: 550,
          color: isDarkMode ? '#ffffff' : tokens.text.primary,
        },
      }}
    />
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Section 1: Core Billing Details */}
      <Box
        sx={{
          p: 2.25,
          borderRadius: '18px',
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(93, 26, 137, 0.02)',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(93, 26, 137, 0.08)'}`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            color: tokens.brand.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            mb: 2,
          }}
        >
          <BusinessIcon sx={{ fontSize: 16 }} />
          Core Billing Info
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.75,
          }}
        >
          {field('Company Name *', 'name', false, 'e.g. Acme Corp')}
          {field('NTN / Reg No.', 'ntn', false, 'e.g. 1234567-8')}
          {field('Email *', 'email', false, 'billing@acme.com')}
          {field('Phone', 'phone', false, '+1 555 0192')}
          {field('Address', 'address', true, 'Full billing street address, city, country')}
        </Box>
      </Box>

      {/* Section 2: Business Profile */}
      <Box
        sx={{
          p: 2.25,
          borderRadius: '18px',
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(93, 26, 137, 0.02)',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(93, 26, 137, 0.08)'}`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            color: tokens.brand.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            mb: 2,
          }}
        >
          <BadgeIcon sx={{ fontSize: 16 }} />
          Company & Contact Profile
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.75,
          }}
        >
          {field('Contact Name', 'contactName', false, 'John Doe')}
          {field('Job Title', 'jobTitle', false, 'Procurement Manager')}
          {field('Website', 'website', false, 'https://acme.com')}
          {field('Industry', 'industry', false, 'Software / FinTech')}
          {field('Company Size', 'companySize', false, '50-200')}
          {field('Location', 'location', false, 'New York, USA')}
          {field('Company Details', 'companyDetails', false, 'Additional company information')}
          {field('Pain Points', 'painPoints', false, 'Key client requirements')}
          {field('Budget', 'budget', false, 'e.g. $50,000')}
          {field('Decision Timeline', 'decisionTimeline', false, 'e.g. Q4 2026')}
          {field('Notes', 'notes', true, 'Special billing terms or internal notes')}
        </Box>
      </Box>
    </Box>
  );
};

