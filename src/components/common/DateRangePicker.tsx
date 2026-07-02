import { TextField, Box, Typography, useTheme } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

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
}: DateRangePickerProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const commonSx = {
    flexGrow: 1,
    '& .MuiOutlinedInput-root': {
      borderRadius: '14px',
      bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
      fontWeight: 650,
      fontSize: '0.9rem',
      height: '42px',
    },
    '& input[type="date"]::-webkit-calendar-picker-indicator': {
      cursor: 'pointer',
      opacity: 0.6,
      transition: '0.2s',
      filter: isDarkMode ? 'invert(1)' : 'none',
      '&:hover': {
        opacity: 1,
      },
    },
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%' }}>
      <Box sx={{ flexGrow: 1, minWidth: 140 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
          Start Date
        </Typography>
        <TextField
          type="date"
          size={size}
          fullWidth
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          sx={commonSx}
          aria-label="Start date"
        />
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 140 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
          End Date
        </Typography>
        <TextField
          type="date"
          size={size}
          fullWidth
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          sx={commonSx}
          aria-label="End date"
        />
      </Box>
    </Box>
  );
};
