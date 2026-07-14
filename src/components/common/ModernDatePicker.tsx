import React, { useState } from 'react';
import { 
  Box, Typography, Popover, IconButton, Button, 
  useTheme, Grid
} from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CancelIcon from '@mui/icons-material/Cancel';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, isToday 
} from 'date-fns';
import { tokens } from '@/styles/tokens';

interface ModernDatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  placeholder?: string;
}

export const ModernDatePicker: React.FC<ModernDatePickerProps> = ({ 
  label, value, onChange, minDate, placeholder = 'Select Date' 
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setCurrentMonth(value || new Date());
  };

  const handleClose = () => setAnchorEl(null);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    if (minDate && day < minDate && !isSameDay(day, minDate)) return;
    onChange(day);
    handleClose();
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 700, color: 'text.secondary' }}>
          {label}
        </Typography>
      )}
      
      {/* Trigger Button */}
      <Button
        onClick={handleOpen}
        fullWidth
        disableRipple
        sx={{
          justifyContent: 'space-between',
          px: 2, py: 1.25,
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: '12px',
          color: value ? 'text.primary' : 'text.disabled',
          fontWeight: 600,
          textTransform: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
            borderColor: tokens.brand.primary,
          }
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: value ? 700 : 500, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value ? format(value, 'MMM d, yyyy') : placeholder}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {value && (
            <CancelIcon 
              onClick={(e) => { 
                e.stopPropagation(); 
                onChange(null); 
              }}
              sx={{ 
                fontSize: 16, 
                color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { color: 'error.main' }
              }} 
            />
          )}
          <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: value ? tokens.brand.primary : 'text.disabled' }} />
        </Box>
      </Button>

      {/* Popover Calendar */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            mt: 1, p: 2,
            width: 320,
            borderRadius: '20px',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            /* backdropFilter: 'blur(24px)' (removed for performance) */
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: isDarkMode 
              ? '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' 
              : '0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04)',
          }
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', pl: 1 }}>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={prevMonth} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
              <ArrowBackIosNewIcon sx={{ fontSize: 12 }} />
            </IconButton>
            <IconButton size="small" onClick={nextMonth} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
              <ArrowForwardIosIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Week Days */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {weekDays.map(day => (
            <Grid item xs={12/7} key={day} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem' }}>
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Days Grid */}
        <Grid container spacing={0.5}>
          {days.map((day, idx) => {
            const isSelected = value ? isSameDay(day, value) : false;
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isDayToday = isToday(day);
            const isDisabled = minDate ? (day < minDate && !isSameDay(day, minDate)) : false;

            return (
              <Grid item xs={12/7} key={idx} sx={{ display: 'flex', justifyContent: 'center' }}>
                <IconButton
                  onClick={() => !isDisabled && onDateClick(day)}
                  disabled={isDisabled}
                  sx={{
                    width: 36, height: 36,
                    fontSize: '0.85rem', fontWeight: isSelected || isDayToday ? 800 : 600,
                    color: isSelected 
                      ? '#fff' 
                      : (isDisabled ? 'text.disabled' : (isCurrentMonth ? 'text.primary' : 'text.secondary')),
                    bgcolor: isSelected 
                      ? tokens.brand.primary 
                      : (isDayToday ? (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent'),
                    '&:hover': {
                      bgcolor: isSelected 
                        ? tokens.brand.primaryDark 
                        : (isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)')
                    },
                    boxShadow: isSelected ? `0 4px 12px ${tokens.brand.primary}60` : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {format(day, dateFormat)}
                </IconButton>
              </Grid>
            );
          })}
        </Grid>

        {/* Today Button */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button 
            size="small" 
            onClick={() => onDateClick(new Date())}
            sx={{ 
              textTransform: 'none', fontWeight: 700, borderRadius: '10px', 
              color: tokens.brand.primary, px: 3, py: 0.5,
              bgcolor: isDarkMode ? 'rgba(167, 139, 250, 0.1)' : 'rgba(93, 26, 137, 0.05)',
              '&:hover': { bgcolor: isDarkMode ? 'rgba(167, 139, 250, 0.2)' : 'rgba(93, 26, 137, 0.1)' }
            }}
          >
            Today
          </Button>
        </Box>
      </Popover>
    </Box>
  );
};
