import { useState } from 'react';
import { Box, Typography, ButtonBase, IconButton, Popover, Grid } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
  addMonths,
  subMonths,
  isSameMonth,
} from 'date-fns';
import { tokens } from '@/styles/tokens';
import { formatDateToString, parseLocalDate } from '@/lib/kpiPeriod';

interface GlassDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
  label?: string;
  displayValue?: string;
}

export const GlassDatePicker = ({
  value,
  onChange,
  isDarkMode,
  label = 'Filter by Date',
  displayValue,
}: GlassDatePickerProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const selectedDate = parseLocalDate(value);
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setCurrentMonth(parseLocalDate(value));
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectDay = (day: Date) => {
    onChange(formatDateToString(day));
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'glass-date-picker-popover' : undefined;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <>
      <ButtonBase
        onClick={handleOpen}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 1,
          borderRadius: '16px',
          bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          minWidth: 220,
          textAlign: 'left',
          justifyContent: 'flex-start',
          color: isDarkMode ? '#fff' : tokens.text.primary,
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
          },
        }}
      >
        <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 650,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
            {displayValue ?? format(selectedDate, 'MMM dd, yyyy')}
          </Typography>
        </Box>
      </ButtonBase>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              p: 2.5,
              borderRadius: '24px',
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.08)',
              width: 320,
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1rem',
              color: isDarkMode ? '#fff' : tokens.text.primary,
            }}
          >
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              sx={{ color: 'text.secondary' }}
            >
              <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              sx={{ color: 'text.secondary' }}
            >
              <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={0} sx={{ mb: 1 }}>
          {weekDays.map((day) => (
            <Grid item xs={1.71} key={day} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'text.disabled',
                  width: 32,
                  textAlign: 'center',
                }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={0.5}>
          {days.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <Grid item xs={1.71} key={idx} sx={{ display: 'flex', justifyContent: 'center' }}>
                <ButtonBase
                  onClick={() => handleSelectDay(day)}
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected
                      ? '#fff'
                      : !isCurrentMonth
                        ? 'text.disabled'
                        : isDarkMode
                          ? '#fff'
                          : tokens.text.primary,
                    bgcolor: isSelected ? tokens.brand.primary : 'transparent',
                    transition: 'all 0.2s',
                    opacity: isCurrentMonth ? 1 : 0.4,
                    '&:hover': {
                      bgcolor: isSelected
                        ? tokens.brand.primary
                        : isDarkMode
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.04)',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  {format(day, 'd')}
                </ButtonBase>
              </Grid>
            );
          })}
        </Grid>
      </Popover>
    </>
  );
};
