import { useMemo, useState } from 'react';
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
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import TimelineIcon from '@mui/icons-material/Timeline';
import { tokens } from '@/styles/tokens';
import type { CombinedKpiMetrics, CombinedKpiSection, KpiPerformanceMetrics } from '@/types';

interface CombinedKpiViewProps {
  metrics: CombinedKpiMetrics;
  comparison?: CombinedKpiMetrics;
  userName?: string;
  compact?: boolean;
}

const emptySection = (): CombinedKpiSection => ({
  assigned: 0,
  completed: 0,
  overdue: 0,
  completionRate: 0,
  rows: [],
  byName: [],
  dailyTrend: [],
});

export const fromLegacyKpiPerformance = (legacy: KpiPerformanceMetrics): CombinedKpiMetrics => ({
  headlines: {
    assigned: legacy.totalAssigned,
    completed: legacy.completed,
    overdue: legacy.missed,
    completionRate: legacy.completionRate,
    salesAttainment: 0,
    simpleCompletionRate: legacy.completionRate,
    kanbanCompletionRate: 0,
    completedLate: 0,
  },
  simple: {
    assigned: legacy.totalAssigned,
    completed: legacy.completed,
    overdue: legacy.missed,
    completionRate: legacy.completionRate,
    rows: (legacy.byKpi ?? []).map((row) => ({
      name: row.kpiName,
      assigned: row.entriesTotal,
      completed: row.entriesCompleted,
      overdue: 0,
      completionRate: row.entriesTotal > 0 ? Math.round((row.entriesCompleted / row.entriesTotal) * 100) : 0,
      target: row.target,
      actual: row.actual,
      attainmentRate: row.attainmentRate,
    })),
    byName: (legacy.byKpi ?? []).map((row) => ({
      name: row.kpiName,
      assigned: row.entriesTotal,
      completed: row.entriesCompleted,
      overdue: 0,
      completionRate: row.entriesTotal > 0 ? Math.round((row.entriesCompleted / row.entriesTotal) * 100) : 0,
      target: row.target,
      actual: row.actual,
      attainmentRate: row.attainmentRate,
    })),
    dailyTrend: legacy.dailyTrend,
  },
  kanban: emptySection(),
  sales: emptySection(),
});

const SectionTable = ({ section }: { section: CombinedKpiSection }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const rows = section.byName.length ? section.byName : section.rows;
  const trendData = section.dailyTrend.map((d) => ({
    date: d.date.slice(5),
    completed: d.completed,
    total: d.total,
  }));

  return (
    <Box>
      {trendData.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '24px',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} color={tokens.brand.primary} mb={2}>
            Daily trend
          </Typography>
          <Box sx={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4EF" />
                <XAxis dataKey="date" tick={{ fill: tokens.text.muted, fontSize: 11 }} />
                <YAxis tick={{ fill: tokens.text.muted, fontSize: 12 }} />
                <ChartTooltip />
                <Area type="monotone" dataKey="total" stroke={tokens.brand.primary100} fill={tokens.brand.primary50} />
                <Area type="monotone" dataKey="completed" stroke={tokens.brand.primary} fill={tokens.brand.primary100} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: '24px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              {['Name', 'Assigned', 'Completed', 'Overdue', 'Rate', 'Target', 'Actual'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={`${row.name}-${idx}`}>
                <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                <TableCell>{row.assigned}</TableCell>
                <TableCell>{row.completed}</TableCell>
                <TableCell>{row.overdue}</TableCell>
                <TableCell>{row.completionRate}%</TableCell>
                <TableCell>{row.target ?? '—'}</TableCell>
                <TableCell>{row.actual ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export const CombinedKpiView = ({ metrics, comparison, userName, compact }: CombinedKpiViewProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [tab, setTab] = useState<'simple' | 'kanban' | 'sales'>('simple');
  const h = metrics.headlines;

  const cards = useMemo(
    () => [
      { label: 'Assigned', value: String(h.assigned), icon: <AssignmentIcon />, color: tokens.brand.primary },
      { label: 'Completed', value: String(h.completed), icon: <AssignmentTurnedInIcon />, color: tokens.semantic.success },
      { label: 'Overdue', value: String(h.overdue), icon: <AssignmentLateIcon />, color: tokens.semantic.error },
      { label: 'Completion', value: `${h.completionRate}%`, icon: <AssignmentTurnedInIcon />, color: tokens.brand.primary },
      { label: 'Sales attainment', value: `${h.salesAttainment}%`, icon: <TimelineIcon />, color: tokens.brand.accent },
      { label: 'Completed late', value: String(h.completedLate), icon: <AssignmentLateIcon />, color: tokens.semantic.warning },
    ],
    [h],
  );

  return (
    <Box>
      {!compact && userName && (
        <Typography variant="h6" fontWeight={600} color={tokens.brand.primary} mb={2}>
          Combined KPIs — {userName}
        </Typography>
      )}
      <Grid container spacing={2} mb={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '20px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
              }}
            >
              <Box sx={{ color: card.color, mb: 1 }}>{card.icon}</Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{card.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 850 }}>{card.value}</Typography>
              {comparison && card.label === 'Completion' && (
                <Typography variant="caption" color="text.secondary">
                  Prev {comparison.headlines.completionRate}%
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Tabs value={tab} onChange={(_, val) => setTab(val)} sx={{ mb: 2 }}>
        <Tab value="simple" label={`Simple (${metrics.simple.completionRate}%)`} />
        <Tab value="kanban" label={`Kanban (${metrics.kanban.completionRate}%)`} />
        <Tab value="sales" label={`Sales (${metrics.sales.completionRate}%)`} />
      </Tabs>
      {tab === 'simple' && <SectionTable section={metrics.simple} />}
      {tab === 'kanban' && <SectionTable section={metrics.kanban} />}
      {tab === 'sales' && <SectionTable section={metrics.sales} />}
    </Box>
  );
};
