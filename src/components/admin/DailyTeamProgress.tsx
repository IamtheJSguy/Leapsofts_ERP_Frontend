import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  useTheme,
  Avatar,
  TextField,
  MenuItem,
  InputAdornment,
  Grid,
  Card,
  Divider,
  Collapse,
  Button,
  Popover,
  ButtonBase,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import FlagCircleIcon from '@mui/icons-material/FlagCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
  isSameMonth
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useDailyKpiEntries } from '@/hooks/api/useKPIs';
import { useUsers } from '@/hooks/api/useUsers';
import { getDisplayName } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';

interface GlassDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
}

const GlassDatePicker = ({ value, onChange, isDarkMode }: GlassDatePickerProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  
  const parseDate = (str: string) => {
    const parts = str.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };
  
  const formatDateToString = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const selectedDate = parseDate(value);
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setCurrentMonth(parseDate(value));
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleSelectDay = (day: Date) => {
    onChange(formatDateToString(day));
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'glass-date-picker-popover' : undefined;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

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
          }
        }}
      >
        <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filter by Date
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
            {format(selectedDate, 'MMM dd, yyyy')}
          </Typography>
        </Box>
      </ButtonBase>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              p: 2.5,
              borderRadius: '24px',
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(30px)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.08)',
              width: 320,
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: isDarkMode ? '#fff' : tokens.text.primary }}>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={handlePrevMonth} sx={{ color: 'text.secondary' }}>
              <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton size="small" onClick={handleNextMonth} sx={{ color: 'text.secondary' }}>
              <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={0} sx={{ mb: 1 }}>
          {weekDays.map((day) => (
            <Grid item xs={1.71} key={day} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.disabled', width: 32, textAlign: 'center' }}>
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
                        : isDarkMode ? '#fff' : tokens.text.primary,
                    bgcolor: isSelected 
                      ? tokens.brand.primary 
                      : 'transparent',
                    transition: 'all 0.2s',
                    opacity: isCurrentMonth ? 1 : 0.4,
                    '&:hover': {
                      bgcolor: isSelected 
                        ? tokens.brand.primary 
                        : isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      transform: 'scale(1.05)',
                    }
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

interface UserProgressCardProps {
  group: {
    user: any;
    tasks: any[];
    completedCount: number;
    totalCount: number;
  };
  isDarkMode: boolean;
  date: string;
}

const UserProgressCard = ({ group, isDarkMode, date }: UserProgressCardProps) => {
  const navigate = useNavigate();
  
  const name = group.user ? `${group.user.firstName || ''} ${group.user.lastName || ''}`.trim() : 'Unknown User';
  const initial = name.charAt(0).toUpperCase() || '?';
  const percentage = Math.round((group.completedCount / group.totalCount) * 100);

  const entriesWithTarget = group.tasks.filter((t) => t.targetValue != null && t.targetValue > 0);
  const totalTarget = entriesWithTarget.reduce((sum, t) => sum + (t.targetValue ?? 0), 0);
  const totalActual = entriesWithTarget
    .filter((t) => t.isCompleted)
    .reduce((sum, t) => sum + (t.actualValue ?? 0), 0);
  const hasTargetRollup = totalTarget > 0;
  
  const ringColor = percentage === 100 
    ? tokens.semantic.success 
    : percentage > 50 
      ? tokens.brand.primary 
      : tokens.semantic.warning;

  return (
    <Card
      onClick={() => group.user?._id && navigate(`/team/member/${group.user._id}?date=${date}`)}
      sx={{
        borderRadius: '24px',
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.65)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(30px)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
        boxShadow: isDarkMode ? 'none' : '0 10px 40px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isDarkMode ? '0 10px 40px rgba(0, 0, 0, 0.3)' : '0 20px 50px rgba(0, 0, 0, 0.06)',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }
      }}
    >
      {/* User Header Section */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={58}
              thickness={3}
              sx={{ color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', position: 'absolute' }}
            />
            <CircularProgress
              variant="determinate"
              value={percentage}
              size={58}
              thickness={3}
              sx={{ 
                color: ringColor,
                '& .MuiCircularProgress-circle': { strokeLinecap: 'round' }
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F2EEEC',
                  color: isDarkMode ? '#FFFFFF' : '#1A1625',
                  fontSize: '1rem',
                  fontWeight: 800,
                }}
              >
                {initial}
              </Avatar>
            </Box>
          </Box>
          
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.015em' }}>
              {name}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 600, mt: 0.25 }}>
              {group.completedCount} of {group.totalCount} completed
              {hasTargetRollup && ` · Actual ${totalActual} / Target ${totalTarget}`}
            </Typography>
          </Box>
        </Box>

        {/* Quick Stat Pill */}
        <Box
          sx={{
            px: 2,
            py: 0.75,
            borderRadius: '14px',
            bgcolor: percentage === 100 ? 'rgba(16, 185, 129, 0.1)' : isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${percentage === 100 ? 'rgba(16, 185, 129, 0.2)' : isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: percentage === 100 ? tokens.semantic.success : (isDarkMode ? '#fff' : tokens.text.primary) }}>
            {percentage}%
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export const DailyTeamProgress = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [date, setDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: entries = [], isLoading } = useDailyKpiEntries({ date });

  // Group entries by user
  const groupedEntries = useMemo(() => {
    const groups: Record<string, {
      user: any;
      tasks: any[];
      completedCount: number;
      totalCount: number;
    }> = {};

    entries.forEach((entry) => {
      const u = entry.userId;
      if (!u) return;
      const uid = typeof u === 'string' ? u : u._id;
      
      if (!groups[uid]) {
        groups[uid] = {
          user: u,
          tasks: [],
          completedCount: 0,
          totalCount: 0,
        };
      }
      
      groups[uid].tasks.push(entry);
      groups[uid].totalCount++;
      if (entry.isCompleted) {
        groups[uid].completedCount++;
      }
    });

    return Object.values(groups);
  }, [entries]);

  // Client-side search filter
  const filteredGroupedEntries = useMemo(() => {
    if (!searchQuery) return groupedEntries;
    const query = searchQuery.toLowerCase();
    return groupedEntries.filter((group) => {
      const name = group.user
        ? `${group.user.firstName || ''} ${group.user.lastName || ''}`.toLowerCase()
        : '';
      const email = group.user?.email?.toLowerCase() || '';
      return name.includes(query) || email.includes(query);
    });
  }, [groupedEntries, searchQuery]);

  return (
    <Box>
      {/* Filters Bar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { sm: 'center' },
          gap: 2,
          mb: 4,
          p: 2.5,
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.7)'}`,
          borderRadius: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
        }}
      >

        <GlassDatePicker value={date} onChange={setDate} isDarkMode={isDarkMode} />

        <TextField
          size="small"
          placeholder="Search team member..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flexGrow: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
              height: '56px',
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              },
              '&:hover fieldset': {
                borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              },
              '&.Mui-focused fieldset': {
                borderColor: tokens.brand.primary,
                borderWidth: '1px',
              },
            },
            '& .MuiInputBase-input': {
              fontWeight: 700,
              fontSize: '0.9rem',
              color: isDarkMode ? '#fff' : tokens.text.primary,
            }
          }}
        />
      </Box>

      {/* Main Content Area */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress sx={{ color: tokens.brand.primary }} />
        </Box>
      ) : groupedEntries.length === 0 ? (
        <Box sx={{ p: 8, textAlign: 'center', bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255,255,255,0.6)', borderRadius: '24px', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` }}>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            No daily entries found for this date.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled', mt: 1 }}>
            Ensure that your agents have tasks assigned for {new Date(date).toLocaleDateString()}.
          </Typography>
        </Box>
      ) : filteredGroupedEntries.length === 0 ? (
        <Box sx={{ p: 8, textAlign: 'center', bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255,255,255,0.6)', borderRadius: '24px', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` }}>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            No team members matched your search.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled', mt: 1 }}>
            Try adjusting your search terms.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3.5}>
          {filteredGroupedEntries.map((group, idx) => (
            <Grid item xs={12} lg={6} key={group.user?._id || idx}>
              <UserProgressCard group={group} isDarkMode={isDarkMode} date={date} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
