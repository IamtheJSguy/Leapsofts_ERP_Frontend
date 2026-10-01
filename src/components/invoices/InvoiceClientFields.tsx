import type { ChangeEvent } from 'react';
import { Box, TextField, Typography } from '@mui/material';
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
  const field = (label: string, key: keyof InvoiceClientForm, wide = false) => (
    <TextField
      fullWidth
      size="small"
      label={label}
      value={value[key]}
      onChange={setField(value, onChange, key)}
      multiline={wide}
      minRows={wide ? 2 : undefined}
      sx={{
        gridColumn: wide ? '1 / -1' : undefined,
        '& .MuiInputBase-root': { fontSize: '0.875rem' },
      }}
    />
  );

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1.25,
      }}
    >
      {field('Company name', 'name')}
      {field('NTN / Reg no.', 'ntn')}
      {field('Email', 'email')}
      {field('Phone', 'phone')}
      {field('Address', 'address', true)}
      <Typography sx={{ gridColumn: '1 / -1', fontWeight: 700, fontSize: '0.8125rem', mt: 0.25 }}>
        Company profile
      </Typography>
      {field('Contact name', 'contactName')}
      {field('Job title', 'jobTitle')}
      {field('Website', 'website')}
      {field('Industry', 'industry')}
      {field('Company size', 'companySize')}
      {field('Location', 'location')}
      {field('Company details', 'companyDetails')}
      {field('Pain points', 'painPoints')}
      {field('Budget', 'budget')}
      {field('Decision timeline', 'decisionTimeline')}
      {field('Notes', 'notes', true)}
    </Box>
  );
};
