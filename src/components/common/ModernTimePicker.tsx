import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Typography, Popover, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { tokens } from '@/styles/tokens';

export interface ModernTimePickerProps {
  label?: string;
  value: string; // HH:mm 24-hour format, e.g., '14:30'
  onChange: (val: string) => void;
  fullWidth?: boolean;
}

export const ModernTimePicker: React.FC<ModernTimePickerProps> = ({
  label,
  value,
  onChange,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  // Parse 24h value → hour12, minute, period
  const parse = (v: string) => {
    const [hStr = '09', mStr = '00'] = (v || '09:00').split(':');
    const h24 = parseInt(hStr, 10);
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    return { hour: h12, minute: parseInt(mStr, 10), period };
  };

  const { hour, minute, period } = parse(value);

  const to24 = (h12: number, m: number, p: string) => {
    let h24 = h12 % 12;
    if (p === 'PM') h24 += 12;
    return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const setHour = (h: number) => {
    let newPeriod = period;
    if (h > 12) { h = 1; newPeriod = period === 'AM' ? 'PM' : 'AM'; }
    if (h < 1) { h = 12; newPeriod = period === 'AM' ? 'PM' : 'AM'; }
    onChange(to24(h, minute, newPeriod));
  };

  const setMinute = (m: number) => {
    const wrapped = ((m % 60) + 60) % 60;
    onChange(to24(hour, wrapped, period));
  };

  const setPeriod = (p: string) => onChange(to24(hour, minute, p));

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (hourRef.current && hourRef.current.children[hour - 1]) {
          (hourRef.current.children[hour - 1] as HTMLElement).scrollIntoView({ block: 'center' });
        }
        if (minRef.current && minRef.current.children[minute]) {
          (minRef.current.children[minute] as HTMLElement).scrollIntoView({ block: 'center' });
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [open, hour, minute]);

  const displayLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
  const primaryColor = tokens.brand.primary;

  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 700, color: 'text.secondary' }}>
          {label}
        </Typography>
      )}

      {/* Trigger Button */}
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.25,
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb',
          border: `1px solid ${open ? primaryColor : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
            borderColor: primaryColor,
          },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displayLabel}
        </Typography>
        <AccessTimeIcon sx={{ fontSize: 18, color: open ? primaryColor : 'text.secondary' }} />
      </Box>

      {/* Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: '20px',
            border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(93,26,137,0.12)'}`,
            bgcolor: isDarkMode ? '#1A1625' : '#fff',
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            p: 1.5,
            minWidth: 250,
          },
        }}
      >
        {/* Header Display */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, mb: 1.5 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1.5rem',
              color: isDarkMode ? '#fff' : primaryColor,
              letterSpacing: '0.04em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
          </Typography>
          <Box
            onClick={() => setPeriod(period === 'AM' ? 'PM' : 'AM')}
            sx={{
              px: 1.2,
              py: 0.4,
              borderRadius: '8px',
              cursor: 'pointer',
              bgcolor: primaryColor,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.06em',
              '&:hover': { opacity: 0.85 },
              userSelect: 'none',
            }}
          >
            {period}
          </Box>
        </Box>

        {/* Columns */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          {/* Hour column */}
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                textAlign: 'center',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'text.disabled',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              HR
            </Typography>
            <div
              ref={hourRef}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: 160,
                overflowY: 'auto',
                padding: '0 4px',
                scrollbarWidth: 'none',
              }}
            >
              {hours.map((h) => {
                const active = h === hour;
                return (
                  <div
                    key={h}
                    onClick={() => setHour(h)}
                    style={{
                      minHeight: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      width: '100%',
                      cursor: 'pointer',
                      fontWeight: active ? 700 : 400,
                      fontSize: active ? '1.05rem' : '0.88rem',
                      color: active ? '#fff' : isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.65)',
                      backgroundColor: active ? primaryColor : 'transparent',
                      userSelect: 'none',
                      margin: '1px 0',
                    }}
                  >
                    {String(h).padStart(2, '0')}
                  </div>
                );
              })}
            </div>
          </Box>

          {/* Minute column */}
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                textAlign: 'center',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'text.disabled',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              MIN
            </Typography>
            <div
              ref={minRef}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: 160,
                overflowY: 'auto',
                padding: '0 4px',
                scrollbarWidth: 'none',
              }}
            >
              {minutes.map((m) => {
                const active = m === minute;
                return (
                  <div
                    key={m}
                    onClick={() => setMinute(m)}
                    style={{
                      minHeight: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      width: '100%',
                      cursor: 'pointer',
                      fontWeight: active ? 700 : 400,
                      fontSize: active ? '1.05rem' : '0.88rem',
                      color: active ? '#fff' : isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.65)',
                      backgroundColor: active ? primaryColor : 'transparent',
                      userSelect: 'none',
                      margin: '1px 0',
                    }}
                  >
                    {String(m).padStart(2, '0')}
                  </div>
                );
              })}
            </div>
          </Box>

          {/* Period column */}
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                textAlign: 'center',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'text.disabled',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              PERIOD
            </Typography>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '0 4px',
              }}
            >
              {['AM', 'PM'].map((p) => {
                const active = p === period;
                return (
                  <div
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      minHeight: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      width: '100%',
                      cursor: 'pointer',
                      fontWeight: active ? 700 : 400,
                      fontSize: active ? '0.95rem' : '0.85rem',
                      color: active ? '#fff' : isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.65)',
                      backgroundColor: active ? primaryColor : 'transparent',
                      userSelect: 'none',
                    }}
                  >
                    {p}
                  </div>
                );
              })}
            </div>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};
