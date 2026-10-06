import { Box, Typography } from '@mui/material';
import { ModernDatePicker } from '@/components/common/ModernDatePicker';
import { ModernTimePicker } from '@/components/common/ModernTimePicker';
import { tokens } from '@/styles/tokens';

type ColdFutureDateTimeFieldProps = {
  value?: string;
  onChange: (value?: string) => void;
  error?: boolean;
  compact?: boolean;
};

const parseValue = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const timeValue = (date: Date | null) =>
  date
    ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    : '09:00';

export const ColdFutureDateTimeField = ({
  value,
  onChange,
  error = false,
  compact = false,
}: ColdFutureDateTimeFieldProps) => {
  const selected = parseValue(value);

  const setDate = (date: Date | null) => {
    if (!date) {
      onChange(undefined);
      return;
    }
    const next = new Date(date);
    next.setHours(selected?.getHours() ?? 9, selected?.getMinutes() ?? 0, 0, 0);
    onChange(next.toISOString());
  };

  const setTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const next = selected ? new Date(selected) : new Date();
    next.setHours(hours, minutes, 0, 0);
    onChange(next.toISOString());
  };

  return (
    <Box
      role="group"
      aria-label="Cold call future lead date and time"
      sx={{
        p: compact ? 0.75 : 1,
        borderRadius: '14px',
        bgcolor: error ? 'rgba(196, 69, 69, 0.05)' : 'rgba(93, 26, 137, 0.035)',
        border: `1px solid ${error ? tokens.semantic.error : 'rgba(93, 26, 137, 0.12)'}`,
        '& .MuiButton-root, & > div > div': { minHeight: compact ? 36 : 40 },
      }}
    >
      <Typography
        variant="caption"
        sx={{ display: 'block', mb: 0.65, px: 0.25, color: error ? tokens.semantic.error : 'text.secondary', fontWeight: 750 }}
      >
        Follow up on
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'minmax(0, 1.25fr) minmax(0, 0.9fr)', gap: 0.75 }}>
        <ModernDatePicker
          value={selected}
          onChange={setDate}
          minDate={new Date()}
          placeholder="Choose date"
        />
        <ModernTimePicker value={timeValue(selected)} onChange={setTime} />
      </Box>
      {error && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.6, px: 0.25, color: tokens.semantic.error, fontWeight: 650 }}>
          Select a date and time.
        </Typography>
      )}
    </Box>
  );
};
