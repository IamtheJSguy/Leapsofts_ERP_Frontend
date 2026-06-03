import { TextField, Box } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  size?: TextFieldProps['size'];
}

export const DateRangePicker = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  size = 'small',
}: DateRangePickerProps) => (
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    <TextField
      label="Start Date"
      type="date"
      size={size}
      value={startDate}
      onChange={(e) => onStartChange(e.target.value)}
      InputLabelProps={{ shrink: true }}
      aria-label="Start date"
    />
    <TextField
      label="End Date"
      type="date"
      size={size}
      value={endDate}
      onChange={(e) => onEndChange(e.target.value)}
      InputLabelProps={{ shrink: true }}
      aria-label="End date"
    />
  </Box>
);
