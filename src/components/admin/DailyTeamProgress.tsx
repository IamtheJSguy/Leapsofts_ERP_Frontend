import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  useTheme,
  Avatar,
  TextField,
  InputAdornment,
  Grid,
  Card,
  Collapse,
  ButtonBase,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Divider,
  Popover,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
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
import { useNavigate } from 'react-router-dom';
import { useDailyKpiEntries } from '@/hooks/api/useKPIs';
import { useTeamSalesKpis } from '@/hooks/api/useSalesKpis';
import { tokens } from '@/styles/tokens';
import type { SalesKpiEntry, SalesKpiStatus } from '@/types';

type PeriodMode = 'day' | 'week' | 'range';

type ProgressTask = {
  id: string;
  kind: 'daily' | 'sales';
  name: string;
  isCompleted: boolean;
  targetValue?: number | null;
  actualValue?: number | null;
  status?: SalesKpiStatus;
  scheduleMode?: string;
};

const parseDate = (str: string) => {
  const parts = str.split('-');
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
};

const formatDateToString = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/** Calendar week Sun–Sat, matching GlassDatePicker / date-fns default. */
const weekBounds = (anchor: string) => {
  const d = parseDate(anchor);
  return {
    startDate: formatDateToString(startOfWeek(d)),
    endDate: formatDateToString(endOfWeek(d)),
  };
};

const resolvePeriod = (
  mode: PeriodMode,
  date: string,
  rangeEnd: string,
): { startDate: string; endDate: string } => {
  if (mode === 'week') return weekBounds(date);
  if (mode === 'range') {
    const end = rangeEnd && rangeEnd >= date ? rangeEnd : date;
    return { startDate: date, endDate: end };
  }
  return { startDate: date, endDate: date };
};

const formatPeriodLabel = (mode: PeriodMode, startDate: string, endDate: string) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (mode === 'day' || startDate === endDate) {
    return format(start, 'MMM dd, yyyy');
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM dd')} – ${format(end, 'MMM dd, yyyy')}`;
  }
  return `${format(start, 'MMM dd, yyyy')} – ${format(end, 'MMM dd, yyyy')}`;
};

const isSalesDone = (status: SalesKpiStatus) =>
  status === 'completed_on_time' || status === 'completed_late';

interface GlassDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
  label?: string;
  displayValue?: string;
}

const GlassDatePicker = ({
  value,
  onChange,
  isDarkMode,
  label = 'Filter by Date',
  displayValue,
}: GlassDatePickerProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const selectedDate = parseDate(value);
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setCurrentMonth(parseDate(value));
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

interface UserProgressCardProps {
  group: {
    user: any;
    tasks: ProgressTask[];
    completedCount: number;
    totalCount: number;
  };
  isDarkMode: boolean;
  navigateDate: string;
}

const UserProgressCard = ({ group, isDarkMode, navigateDate }: UserProgressCardProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const name = group.user
    ? `${group.user.firstName || ''} ${group.user.lastName || ''}`.trim()
    : 'Unknown User';
  const initial = name.charAt(0).toUpperCase() || '?';
  const percentage =
    group.totalCount > 0 ? Math.round((group.completedCount / group.totalCount) * 100) : 0;

  const entriesWithTarget = group.tasks.filter((t) => t.targetValue != null && t.targetValue > 0);
  const totalTarget = entriesWithTarget.reduce((sum, t) => sum + (t.targetValue ?? 0), 0);
  const totalActual = entriesWithTarget.reduce((sum, t) => sum + (t.actualValue ?? 0), 0);
  const hasTargetRollup = totalTarget > 0;

  const salesCount = group.tasks.filter((t) => t.kind === 'sales').length;
  const dailyCount = group.tasks.filter((t) => t.kind === 'daily').length;

  const ringColor =
    percentage === 100
      ? tokens.semantic.success
      : percentage > 50
        ? tokens.brand.primary
        : tokens.semantic.warning;

  return (
    <Card
      sx={{
        borderRadius: '24px',
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.65)' : 'rgba(255, 255, 255, 0.85)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
        boxShadow: isDarkMode ? 'none' : '0 10px 40px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': {
          boxShadow: isDarkMode
            ? '0 10px 40px rgba(0, 0, 0, 0.3)'
            : '0 20px 50px rgba(0, 0, 0, 0.06)',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        },
      }}
    >
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={58}
              thickness={3}
              sx={{
                color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                position: 'absolute',
              }}
            />
            <CircularProgress
              variant="determinate"
              value={percentage}
              size={58}
              thickness={3}
              sx={{
                color: ringColor,
                '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
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
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1.15rem',
                color: isDarkMode ? '#fff' : tokens.text.primary,
                letterSpacing: '-0.015em',
              }}
            >
              {name}
            </Typography>
            <Typography
              sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 600, mt: 0.25 }}
            >
              {group.completedCount} of {group.totalCount} completed
              {hasTargetRollup && ` · Actual ${totalActual} / Target ${totalTarget}`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
              {dailyCount > 0 && (
                <Chip
                  label={`${dailyCount} daily`}
                  size="small"
                  sx={{
                    height: 22,
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  }}
                />
              )}
              {salesCount > 0 && (
                <Chip
                  icon={<TrackChangesOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                  label={`${salesCount} sales`}
                  size="small"
                  sx={{
                    height: 22,
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    bgcolor: 'rgba(93, 26, 137, 0.08)',
                    color: tokens.brand.primary,
                    '& .MuiChip-icon': { color: tokens.brand.primary },
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              px: 2,
              py: 0.75,
              borderRadius: '14px',
              bgcolor:
                percentage === 100
                  ? 'rgba(16, 185, 129, 0.1)'
                  : isDarkMode
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.03)',
              border: `1px solid ${
                percentage === 100
                  ? 'rgba(16, 185, 129, 0.2)'
                  : isDarkMode
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)'
              }`,
            }}
          >
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1rem',
                color:
                  percentage === 100
                    ? tokens.semantic.success
                    : isDarkMode
                      ? '#fff'
                      : tokens.text.primary,
              }}
            >
              {percentage}%
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (group.user?._id) {
                navigate(`/team/member/${group.user._id}?date=${navigateDate}`);
              }
            }}
            sx={{ color: 'text.secondary' }}
          >
            <OpenInNewIcon sx={{ fontSize: 18 }} />
          </IconButton>
          {expanded ? (
            <ExpandLessIcon sx={{ color: 'text.secondary' }} />
          ) : (
            <ExpandMoreIcon sx={{ color: 'text.secondary' }} />
          )}
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Divider sx={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
        <Box sx={{ px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {group.tasks.map((task) => (
            <Box
              key={task.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.25,
                borderRadius: '14px',
                bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
              }}
            >
              {task.isCompleted ? (
                <CheckCircleIcon sx={{ fontSize: 20, color: tokens.semantic.success }} />
              ) : (
                <AccessTimeIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
              )}
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: task.isCompleted
                      ? 'text.disabled'
                      : isDarkMode
                        ? '#fff'
                        : tokens.text.primary,
                  }}
                  noWrap
                >
                  {task.name}
                </Typography>
                {(task.targetValue != null && task.targetValue > 0) && (
                  <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
                    {task.actualValue ?? 0} / {task.targetValue}
                    {task.scheduleMode === 'span' ? ' · Multi-day' : ''}
                  </Typography>
                )}
              </Box>
              <Chip
                size="small"
                label={task.kind === 'sales' ? 'Sales' : 'Daily'}
                sx={{
                  height: 22,
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  ...(task.kind === 'sales'
                    ? {
                        bgcolor: 'rgba(93, 26, 137, 0.08)',
                        color: tokens.brand.primary,
                      }
                    : {
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                        color: 'text.secondary',
                      }),
                }}
              />
            </Box>
          ))}
        </Box>
      </Collapse>
    </Card>
  );
};

export const DailyTeamProgress = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const today = new Date().toLocaleDateString('en-CA');
  const [mode, setMode] = useState<PeriodMode>('day');
  const [date, setDate] = useState<string>(today);
  const [rangeEnd, setRangeEnd] = useState<string>(today);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const period = useMemo(() => resolvePeriod(mode, date, rangeEnd), [mode, date, rangeEnd]);

  const queryParams = useMemo(
    () => ({ startDate: period.startDate, endDate: period.endDate }),
    [period.startDate, period.endDate],
  );

  const { data: dailyEntries = [], isLoading: dailyLoading } = useDailyKpiEntries(queryParams);
  const { data: salesEntries = [], isLoading: salesLoading } = useTeamSalesKpis(queryParams);

  const isLoading = dailyLoading || salesLoading;

  const groupedEntries = useMemo(() => {
    const groups: Record<
      string,
      {
        user: any;
        tasks: ProgressTask[];
        completedCount: number;
        totalCount: number;
      }
    > = {};

    const ensureGroup = (userRef: any) => {
      if (!userRef) return null;
      const uid = typeof userRef === 'string' ? userRef : userRef._id;
      if (!uid) return null;
      if (!groups[uid]) {
        groups[uid] = {
          user: typeof userRef === 'string' ? { _id: userRef } : userRef,
          tasks: [],
          completedCount: 0,
          totalCount: 0,
        };
      } else if (typeof userRef !== 'string' && userRef.firstName) {
        groups[uid].user = userRef;
      }
      return groups[uid];
    };

    dailyEntries.forEach((entry: any) => {
      const group = ensureGroup(entry.userId);
      if (!group) return;
      const task: ProgressTask = {
        id: `daily-${entry._id}`,
        kind: 'daily',
        name: entry.kpiName || entry.kpiId?.name || 'KPI',
        isCompleted: !!entry.isCompleted,
        targetValue: entry.targetValue,
        actualValue: entry.actualValue,
      };
      group.tasks.push(task);
      group.totalCount++;
      if (task.isCompleted) group.completedCount++;
    });

    (salesEntries as SalesKpiEntry[]).forEach((entry) => {
      const group = ensureGroup(entry.userId);
      if (!group) return;
      const task: ProgressTask = {
        id: `sales-${entry._id}`,
        kind: 'sales',
        name: entry.kpiName,
        isCompleted: isSalesDone(entry.status),
        targetValue: entry.targetValue,
        actualValue: entry.currentValue,
        status: entry.status,
        scheduleMode: entry.scheduleMode,
      };
      group.tasks.push(task);
      group.totalCount++;
      if (task.isCompleted) group.completedCount++;
    });

    return Object.values(groups).sort((a, b) => {
      const an = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim();
      const bn = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim();
      return an.localeCompare(bn);
    });
  }, [dailyEntries, salesEntries]);

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

  const periodLabel = formatPeriodLabel(mode, period.startDate, period.endDate);
  const filterCaption =
    mode === 'day' ? 'Filter by Date' : mode === 'week' ? 'Filter by Week' : 'Date Range';

  const handleModeChange = (_: React.MouseEvent<HTMLElement>, next: PeriodMode | null) => {
    if (!next) return;
    setMode(next);
    if (next === 'range' && (!rangeEnd || rangeEnd < date)) {
      setRangeEnd(date);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' },
          gap: 2,
          mb: 4,
          p: 2.5,
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255, 255, 255, 0.65)',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.7)'}`,
          borderRadius: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
          flexWrap: 'wrap',
        }}
      >
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
          sx={{
            bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)',
            p: 0.5,
            borderRadius: '16px',
            border: 'none',
            height: 56,
            '& .MuiToggleButtonGroup-grouped': {
              border: 0,
              borderRadius: '12px !important',
              px: 2,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
            },
          }}
        >
          {(['day', 'week', 'range'] as PeriodMode[]).map((value) => (
            <ToggleButton
              key={value}
              value={value}
              sx={{
                color: 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff',
                  color: tokens.brand.primary,
                  boxShadow: 'none',
                },
              }}
            >
              {value === 'day' ? 'Day' : value === 'week' ? 'Week' : 'Range'}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {mode === 'range' ? (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <GlassDatePicker
              value={date}
              onChange={(v) => {
                setDate(v);
                if (rangeEnd < v) setRangeEnd(v);
              }}
              isDarkMode={isDarkMode}
              label="Start Date"
            />
            <GlassDatePicker
              value={rangeEnd}
              onChange={setRangeEnd}
              isDarkMode={isDarkMode}
              label="End Date"
            />
          </Box>
        ) : (
          <GlassDatePicker
            value={date}
            onChange={setDate}
            isDarkMode={isDarkMode}
            label={filterCaption}
            displayValue={periodLabel}
          />
        )}

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
            minWidth: 200,
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
            },
          }}
        />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress sx={{ color: tokens.brand.primary }} />
        </Box>
      ) : groupedEntries.length === 0 ? (
        <Box
          sx={{
            p: 8,
            textAlign: 'center',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255,255,255,0.6)',
            borderRadius: '24px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
          }}
        >
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            No entries found for this period.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled', mt: 1 }}>
            No daily or sales KPI entries for {periodLabel}.
          </Typography>
        </Box>
      ) : filteredGroupedEntries.length === 0 ? (
        <Box
          sx={{
            p: 8,
            textAlign: 'center',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255,255,255,0.6)',
            borderRadius: '24px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
          }}
        >
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
              <UserProgressCard
                group={group}
                isDarkMode={isDarkMode}
                navigateDate={period.startDate}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
