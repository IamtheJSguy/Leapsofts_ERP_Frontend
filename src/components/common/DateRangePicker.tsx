import { TextField, Box, Typography, useTheme } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import { ModernDatePicker } from './ModernDatePicker';
import { format } from 'date-fns';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  size?: TextFieldProps['size'];
  layout?: 'default' | 'compact';
}

export const DateRangePicker = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  size = 'small',
  layout = 'default',
}: DateRangePickerProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  const handleStartChange = (d: Date | null) => onStartChange(d ? format(d, 'yyyy-MM-dd') : '');
  const handleEndChange = (d: Date | null) => onEndChange(d ? format(d, 'yyyy-MM-dd') : '');

  if (layout === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' }, '& button': { minHeight: 32, py: 0.5, px: 1.5, borderRadius: '8px', minWidth: { xs: 'auto', sm: 110 } }, '& > div': { flexGrow: 1 } }}>
        <ModernDatePicker
          value={start}
          onChange={handleStartChange}
          placeholder="Start"
        />
        <Typography sx={{ color: 'text.secondary', fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>-</Typography>
        <ModernDatePicker
          value={end}
          onChange={handleEndChange}
          placeholder="End"
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%' }}>
      <Box sx={{ flexGrow: 1, minWidth: 140 }}>
        <ModernDatePicker
          label="Start Date"
          value={start}
          onChange={handleStartChange}
          placeholder="Select start date"
        />
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 140 }}>
        <ModernDatePicker
          label="End Date"
          value={end}
          onChange={handleEndChange}
          placeholder="Select end date"
        />
      </Box>
    </Box>
  );
};
