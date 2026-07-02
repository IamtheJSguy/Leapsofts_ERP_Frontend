import { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { tokens } from '@/styles/tokens';
import type { KpiPerformanceMetrics } from '@/types';

interface KpiPerformanceViewProps {
  metrics: KpiPerformanceMetrics;
  comparison?: KpiPerformanceMetrics;
  userName?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: tokens.semantic.error,
  high: tokens.brand.accent,
  medium: tokens.brand.primary,
  low: tokens.semantic.success,
};

const PRIORITY_BG: Record<string, string> = {
  urgent: tokens.semantic.errorBg,
  high: tokens.brand.accent50,
  medium: tokens.brand.primary50,
  low: tokens.semantic.successBg,
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

export const KpiPerformanceView = ({ metrics, comparison, userName }: KpiPerformanceViewProps) => {
  const summaryCards = useMemo(
    () => [
      {
        label: 'Completion Rate',
        value: `${metrics.completionRate}%`,
        icon: <AssignmentTurnedInIcon />,
        color: metrics.completionRate >= 80 ? tokens.semantic.success : metrics.completionRate >= 50 ? tokens.semantic.warning : tokens.semantic.error,
        delta: comparison ? metrics.completionRate - comparison.completionRate : undefined,
        suffix: '%',
      },
      {
        label: 'Total Assigned',
        value: String(metrics.totalAssigned),
        icon: <AssignmentIcon />,
        color: tokens.brand.primary,
        delta: comparison ? metrics.totalAssigned - comparison.totalAssigned : undefined,
      },
      {
        label: 'Completed',
        value: String(metrics.completed),
        icon: <AssignmentTurnedInIcon />,
        color: tokens.semantic.success,
        delta: comparison ? metrics.completed - comparison.completed : undefined,
      },
      {
        label: 'Missed / Overdue',
        value: String(metrics.missed),
        icon: <AssignmentLateIcon />,
        color: tokens.semantic.error,
        delta: comparison ? metrics.missed - comparison.missed : undefined,
      },
      {
        label: 'Pending',
        value: String(metrics.pending),
        icon: <PendingActionsIcon />,
        color: tokens.semantic.warning,
        delta: comparison ? metrics.pending - comparison.pending : undefined,
      },
    ],
    [metrics, comparison],
  );

  // Trend chart data
  const trendData = useMemo(
    () =>
      metrics.dailyTrend.map((d) => ({
        date: d.date.slice(5),
        completed: d.completed,
        total: d.total,
        rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
      })),
    [metrics],
  );

  // Priority bar chart
  const priorityData = useMemo(
    () =>
      metrics.byPriority.map((p) => ({
        priority: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
        Completed: p.completed,
        Missed: p.total - p.completed,
        rate: p.rate,
      })),
    [metrics],
  );

  // Timeframe pie chart
  const timeframeData = useMemo(
    () =>
      metrics.byTimeframe.map((t) => ({
        name: t.timeframe.charAt(0).toUpperCase() + t.timeframe.slice(1),
        value: t.total,
        rate: t.rate,
      })),
    [metrics],
  );

  const TIMEFRAME_COLORS = [tokens.brand.primary, tokens.brand.accent, tokens.semantic.success];

  return (
    <Box>
      {userName && (
        <Typography variant="h6" fontWeight={600} color={tokens.brand.primary} mb={2}>
          KPI Performance Report — {userName}
        </Typography>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        {summaryCards.map((card) => (
          <Grid item xs={6} sm={4} md={2.4} key={card.label}>
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
              </Typography>
              {card.delta !== undefined && (
                <DeltaBadge current={card.delta} previous={0} suffix={card.suffix} />
              )}
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                {card.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Overall Completion Progress Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '20px',
          border: `1px solid ${tokens.surface.borderLight}`,
          backgroundColor: '#FFFFFF',
          boxShadow: tokens.shadow.card,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} color={tokens.brand.primary}>
            Overall KPI Completion
          </Typography>
          <Typography variant="subtitle2" fontWeight={700} color={tokens.brand.primary}>
            {metrics.completed}/{metrics.totalAssigned} ({metrics.completionRate}%)
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={metrics.completionRate}
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor: tokens.brand.primary100,
            '& .MuiLinearProgress-bar': {
              backgroundColor:
                metrics.completionRate >= 80
                  ? tokens.semantic.success
                  : metrics.completionRate >= 50
                  ? tokens.semantic.warning
                  : tokens.semantic.error,
              borderRadius: 6,
            },
          }}
        />
      </Paper>

      {/* Charts Row */}
      <Grid container spacing={3} mb={3}>
        {/* Completion Trend */}
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
              Daily Completion Trend
            </Typography>
            <Box sx={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tokens.semantic.success} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={tokens.semantic.success} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tokens.brand.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={tokens.brand.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4EF" />
                  <XAxis dataKey="date" tick={{ fill: tokens.text.muted, fontSize: 11 }} />
                  <YAxis tick={{ fill: tokens.text.muted, fontSize: 12 }} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: `1px solid ${tokens.surface.border}`,
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Assigned"
                    stroke={tokens.brand.primary}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke={tokens.semantic.success}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Timeframe Distribution Pie */}
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
              By Timeframe
            </Typography>
            <Box sx={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={timeframeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, rate }) => `${name}: ${rate}%`}
                  >
                    {timeframeData.map((_, index) => (
                      <Cell key={index} fill={TIMEFRAME_COLORS[index % TIMEFRAME_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Priority Breakdown */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
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
              Priority Breakdown
            </Typography>
            <Box sx={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={priorityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4EF" />
                  <XAxis dataKey="priority" tick={{ fill: tokens.text.muted, fontSize: 12 }} />
                  <YAxis tick={{ fill: tokens.text.muted, fontSize: 12 }} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: `1px solid ${tokens.surface.border}`,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Completed" stackId="kpi" fill={tokens.semantic.success} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Missed" stackId="kpi" fill={tokens.semantic.error} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Priority Completion Table */}
        <Grid item xs={12} md={6}>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: '20px',
              border: `1px solid ${tokens.surface.borderLight}`,
              backgroundColor: '#FFFFFF',
              boxShadow: tokens.shadow.card,
            }}
          >
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} color={tokens.brand.primary}>
                Priority-wise Completion Rates
              </Typography>
            </Box>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: tokens.brand.primary50 }}>
                  <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }} align="center">Total</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }} align="center">Done</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }} align="right">Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics.byPriority.map((p) => (
                  <TableRow
                    key={p.priority}
                    sx={{
                      transition: 'background-color 0.2s ease',
                      '&:hover': { backgroundColor: tokens.brand.primary50 },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={p.priority}
                        size="small"
                        sx={{
                          backgroundColor: PRIORITY_BG[p.priority] || tokens.semantic.neutralBg,
                          color: PRIORITY_COLORS[p.priority] || tokens.semantic.neutral,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{p.total}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600} color={tokens.semantic.success}>
                        {p.completed}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={p.rate}
                          sx={{
                            width: 60,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: tokens.brand.primary100,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: PRIORITY_COLORS[p.priority] || tokens.brand.primary,
                              borderRadius: 3,
                            },
                          }}
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {p.rate}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};
