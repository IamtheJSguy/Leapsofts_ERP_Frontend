import { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimerIcon from '@mui/icons-material/Timer';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { tokens } from '@/styles/tokens';
import type { AttendanceMetrics } from '@/types';

interface AttendanceReportViewProps {
  metrics: AttendanceMetrics;
  comparison?: AttendanceMetrics;
  userName?: string;
}

const STATUS_COLORS: Record<string, string> = {
  present: tokens.semantic.success,
  late: tokens.semantic.warning,
  absent: tokens.semantic.error,
  half_day: tokens.brand.accent,
};

const STATUS_BG: Record<string, string> = {
  present: tokens.semantic.successBg,
  late: tokens.semantic.warningBg,
  absent: tokens.semantic.errorBg,
  half_day: tokens.brand.accent50,
};

/** Renders a delta badge: ↑ +5% or ↓ -3% */
const DeltaBadge = ({ current, previous, suffix = '' }: { current: number; previous?: number; suffix?: string }) => {
  if (previous === undefined) return null;
  const delta = current - previous;
  if (delta === 0) return null;
  const isPositive = delta > 0;
  return (
    <Typography
      component="span"
      variant="caption"
      sx={{
        ml: 1,
        px: 0.8,
        py: 0.2,
        borderRadius: '8px',
        fontWeight: 600,
        backgroundColor: isPositive ? tokens.semantic.successBg : tokens.semantic.errorBg,
        color: isPositive ? tokens.semantic.success : tokens.semantic.error,
      }}
    >
      {isPositive ? '↑' : '↓'} {Math.abs(delta)}{suffix}
    </Typography>
  );
};

export const AttendanceReportView = ({ metrics, comparison, userName }: AttendanceReportViewProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const summaryCards = useMemo(
    () => [
      {
        label: 'Attendance Rate',
        value: `${metrics.attendanceRate}%`,
        icon: <TrendingUpIcon />,
        color: metrics.attendanceRate >= 80 ? tokens.semantic.success : metrics.attendanceRate >= 60 ? tokens.semantic.warning : tokens.semantic.error,
        delta: comparison ? metrics.attendanceRate - comparison.attendanceRate : undefined,
        suffix: '%',
      },
      {
        label: 'Days Present',
        value: `${metrics.daysPresent} / ${metrics.expectedDays}`,
        icon: <EventAvailableIcon />,
        color: tokens.semantic.success,
        delta: comparison ? metrics.daysPresent - comparison.daysPresent : undefined,
      },
      {
        label: 'Days Absent',
        value: String(metrics.daysAbsent),
        icon: <EventBusyIcon />,
        color: tokens.semantic.error,
        delta: comparison ? metrics.daysAbsent - comparison.daysAbsent : undefined,
        invertDelta: true,
      },
      {
        label: 'Late Check-ins',
        value: String(metrics.lateCheckins),
        icon: <WarningAmberIcon />,
        color: tokens.semantic.warning,
        delta: comparison ? metrics.lateCheckins - comparison.lateCheckins : undefined,
        invertDelta: true,
      },
      {
        label: 'Avg Hours/Day',
        value: `${(metrics.averageMinutesPerDay / 60).toFixed(1)}h`,
        icon: <AccessTimeIcon />,
        color: tokens.brand.primary,
        delta: comparison ? Math.round((metrics.averageMinutesPerDay - comparison.averageMinutesPerDay) / 60 * 10) / 10 : undefined,
        suffix: 'h',
      },
      {
        label: 'Overtime',
        value: `${(metrics.overtimeMinutes / 60).toFixed(1)}h`,
        icon: <TimerIcon />,
        color: tokens.brand.accent,
        delta: comparison ? Math.round((metrics.overtimeMinutes - comparison.overtimeMinutes) / 60 * 10) / 10 : undefined,
        suffix: 'h',
      },
      {
        label: 'Break time',
        value: `${((metrics.totalBreakMinutes ?? 0) / 60).toFixed(1)}h`,
        icon: <TimerIcon />,
        color: tokens.text.secondary,
      },
    ],
    [metrics, comparison],
  );

  // Pie chart data for attendance breakdown
  const pieData = useMemo(() => {
    const statusCounts: Record<string, number> = { present: 0, late: 0, absent: 0, half_day: 0 };
    metrics.dailyBreakdown.forEach((d) => {
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
    });
    // Add absent days that have no shift record
    statusCounts.absent = metrics.daysAbsent;
    return Object.entries(statusCounts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, [metrics]);

  // Bar chart data for daily hours
  const hoursChart = useMemo(
    () =>
      metrics.dailyBreakdown.map((d) => ({
        date: d.date.slice(5), // MM-DD
        hours: Math.round((d.totalMinutes / 60) * 10) / 10,
        scheduled: Math.round((d.scheduledMinutes / 60) * 10) / 10,
      })),
    [metrics],
  );

  return (
    <Box>
      {userName && (
        <Typography variant="h6" fontWeight={600} color={tokens.brand.primary} mb={2}>
          Attendance Report — {userName}
        </Typography>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4.5}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 40px rgba(93, 26, 137, 0.08)',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(93, 26, 137, 0.1)',
                },
              }}
            >
              {/* Decorative top gradient line */}
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${card.color} 0%, transparent 100%)`, opacity: 0.8 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDarkMode ? `${card.color}15` : `${card.color}10`,
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
                {card.delta !== undefined && (
                  <DeltaBadge
                    current={card.invertDelta ? -(card.delta) : card.delta}
                    previous={0}
                    suffix={card.suffix}
                  />
                )}
              </Box>
              
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
                  {card.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 850, color: tokens.text.primary, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {card.value}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={4} mb={4.5}>
        {/* Daily Hours Bar Chart */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: '24px',
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.02)',
              height: '100%',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} color={tokens.brand.primary} mb={2}>
              Daily Hours Worked vs Scheduled
            </Typography>
            <Box sx={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={hoursChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4EF" />
                  <XAxis dataKey="date" tick={{ fill: tokens.text.muted, fontSize: 11 }} />
                  <YAxis tick={{ fill: tokens.text.muted, fontSize: 12 }} unit="h" />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: `1px solid ${tokens.surface.border}`,
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="scheduled" name="Scheduled" fill={tokens.brand.primary100} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hours" name="Worked" fill={tokens.brand.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Attendance Status Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: '24px',
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.02)',
              height: '100%',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} color={tokens.brand.primary} mb={2}>
              Attendance Breakdown
            </Typography>
            <Box sx={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name.replace(' ', '_')] || tokens.semantic.neutral}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Daily Breakdown Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: '24px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.02)',
          overflowX: 'auto',
          mb: 4,
        }}
      >
        <Box sx={{ p: 3.5, pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: tokens.text.primary, letterSpacing: '-0.01em' }}>
            Daily Attendance Log
          </Typography>
        </Box>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(93, 26, 137, 0.02)' }}>
              <TableCell sx={{ fontWeight: 700, color: tokens.text.secondary, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: tokens.text.secondary, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: tokens.text.secondary, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>Check In</TableCell>
              <TableCell sx={{ fontWeight: 700, color: tokens.text.secondary, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>Check Out</TableCell>
              <TableCell sx={{ fontWeight: 700, color: tokens.text.secondary, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }} align="right">
                Hours Worked
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: tokens.text.secondary, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }} align="right">
                Break
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.dailyBreakdown.map((day) => (
              <TableRow
                key={day.date}
                sx={{
                  transition: 'background-color 0.2s ease',
                  '&:hover': { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(93, 26, 137, 0.02)' },
                  '& td': { borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` },
                  '&:last-child td': { borderBottom: 'none' },
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.text.primary }}>
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={day.status.replace('_', ' ')} arrow>
                    <Chip
                      label={day.status.replace('_', ' ')}
                      size="small"
                      sx={{
                        backgroundColor: STATUS_BG[day.status] || tokens.semantic.neutralBg,
                        color: STATUS_COLORS[day.status] || tokens.semantic.neutral,
                        fontWeight: 750,
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                        borderRadius: '8px',
                      }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: tokens.text.secondary, fontWeight: 600 }}>
                    {day.checkIn ? new Date(day.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: tokens.text.secondary, fontWeight: 600 }}>
                    {day.checkOut ? new Date(day.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 800, color: tokens.text.primary, fontSize: '0.95rem' }}>
                    {(day.totalMinutes / 60).toFixed(1)}<Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.8rem', ml: 0.5 }}>h</Typography>
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.text.secondary }}>
                    {((day.breakMinutes ?? 0) / 60).toFixed(1)}h
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
