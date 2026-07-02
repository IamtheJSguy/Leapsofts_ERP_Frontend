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
      <Grid container spacing={2} mb={3}>
        {summaryCards.map((card) => (
          <Grid item xs={6} sm={4} md={2} key={card.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '16px',
                border: `1px solid ${tokens.surface.borderLight}`,
                backgroundColor: '#FFFFFF',
                boxShadow: tokens.shadow.card,
                textAlign: 'center',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: tokens.shadow.cardHover,
                },
              }}
            >
              <Box sx={{ color: card.color, mb: 1 }}>{card.icon}</Box>
              <Typography variant="h5" fontWeight={700} color={tokens.text.primary}>
                {card.value}
                {card.delta !== undefined && (
                  <DeltaBadge
                    current={card.invertDelta ? -(card.delta) : card.delta}
                    previous={0}
                    suffix={card.suffix}
                  />
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {card.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={3}>
        {/* Daily Hours Bar Chart */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${tokens.surface.borderLight}`,
              backgroundColor: '#FFFFFF',
              boxShadow: tokens.shadow.card,
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
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${tokens.surface.borderLight}`,
              backgroundColor: '#FFFFFF',
              boxShadow: tokens.shadow.card,
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
          borderRadius: '20px',
          border: `1px solid ${tokens.surface.borderLight}`,
          backgroundColor: '#FFFFFF',
          boxShadow: tokens.shadow.card,
          overflowX: 'auto',
        }}
      >
        <Box sx={{ p: 3, pb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} color={tokens.brand.primary}>
            Daily Attendance Log
          </Typography>
        </Box>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: tokens.brand.primary50 }}>
              <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }}>Check In</TableCell>
              <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }}>Check Out</TableCell>
              <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }} align="right">
                Hours Worked
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.dailyBreakdown.map((day) => (
              <TableRow
                key={day.date}
                sx={{
                  transition: 'background-color 0.2s ease',
                  '&:hover': { backgroundColor: tokens.brand.primary50 },
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
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
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                      }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {day.checkIn ? new Date(day.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {day.checkOut ? new Date(day.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={600} color={tokens.brand.primary}>
                    {(day.totalMinutes / 60).toFixed(1)}h
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
