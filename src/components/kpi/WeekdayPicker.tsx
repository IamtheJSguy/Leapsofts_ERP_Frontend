import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import { WEEKDAY_INITIALS, WEEKDAY_SHORT_LABELS } from '@/lib/constants';
import { tokens } from '@/styles/tokens';

interface WeekdayPickerProps {
  /** 0 = Sunday … 6 = Saturday. */
  value: number[];
  onChange: (days: number[]) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

export const WeekdayPicker = ({ value, onChange, label, disabled, size = 'medium' }: WeekdayPickerProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const dim = size === 'small' ? 28 : 34;

  const toggle = (day: number) => {
    if (disabled) return;
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b));
  };

  return (
    <Box>
      {label && (
        <Typography
          variant="caption"
          sx={{ display: 'block', mb: 0.75, color: tokens.text.muted, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          {label}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {WEEKDAY_INITIALS.map((initial, day) => {
          const selected = value.includes(day);
          return (
            <Tooltip key={day} title={WEEKDAY_SHORT_LABELS[day]} arrow>
              <Box
                component="button"
                type="button"
                onClick={() => toggle(day)}
                disabled={disabled}
                sx={{
                  width: dim,
                  height: dim,
                  borderRadius: '10px',
                  cursor: disabled ? 'default' : 'pointer',
                  fontWeight: 800,
                  fontSize: size === 'small' ? '0.7rem' : '0.78rem',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  opacity: disabled ? 0.5 : 1,
                  bgcolor: selected ? tokens.brand.primary : isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  color: selected ? '#fff' : isDarkMode ? 'rgba(255,255,255,0.6)' : tokens.text.secondary,
                  border: `1px solid ${selected ? tokens.brand.primary : isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  '&:hover': disabled
                    ? undefined
                    : {
                        borderColor: tokens.brand.primary,
                        color: selected ? '#fff' : tokens.brand.primary,
                      },
                }}
              >
                {initial}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};