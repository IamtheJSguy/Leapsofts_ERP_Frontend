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
  useTheme,
} from '@mui/material';
import { tokens } from '@/styles/tokens';
import type { EmployeeFullMetrics, TeamOverviewMemberRow, TeamOverviewMetrics } from '@/types';

interface TeamOverviewViewProps {
  metrics: TeamOverviewMetrics;
}

const isLegacyMember = (member: TeamOverviewMemberRow | EmployeeFullMetrics): member is EmployeeFullMetrics =>
  'attendance' in member && 'user' in member;

export const TeamOverviewView = ({ metrics }: TeamOverviewViewProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const rows: TeamOverviewMemberRow[] = (metrics.members ?? []).map((member) => {
    if (isLegacyMember(member)) {
      return {
        userId: member.user._id,
        name: member.user.name,
        email: member.user.email,
        role: 'user',
        attendanceRate: member.attendance?.attendanceRate ?? 0,
        combinedCompletionRate: member.kpiPerformance?.completionRate ?? 0,
        salesAttainment: member.kpiPerformance?.overallAttainmentRate ?? 0,
        overdueCount: member.kpiPerformance?.missed ?? 0,
        hoursWorked: Math.round(((member.attendance?.totalMinutesWorked ?? 0) / 60) * 10) / 10,
      };
    }
    return member;
  });

  const cards = [
    { label: 'Team size', value: String(metrics.teamSize) },
    { label: 'Avg attendance', value: `${metrics.avgAttendanceRate}%` },
    { label: 'Avg completion', value: `${metrics.avgCombinedCompletionRate ?? metrics.avgKpiCompletionRate ?? 0}%` },
    { label: 'Avg sales attainment', value: `${metrics.avgSalesAttainment ?? 0}%` },
    { label: 'Total overdue', value: String(metrics.totalOverdue ?? 0) },
    { label: 'Hours worked', value: String(metrics.totalHoursWorked ?? 0) },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 8, height: 32, borderRadius: 4, bgcolor: tokens.brand.primary }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 850, letterSpacing: '-0.02em' }}>
            Team Overview
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
            Attendance, combined KPIs, and sales attainment
          </Typography>
        </Box>
      </Box>
      <Grid container spacing={2} mb={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '20px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                {card.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 850 }}>{card.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
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
              {['Name', 'Attendance', 'Completion', 'Sales', 'Overdue', 'Hours'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.userId}>
                <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                <TableCell>{row.attendanceRate}%</TableCell>
                <TableCell>{row.combinedCompletionRate}%</TableCell>
                <TableCell>{row.salesAttainment}%</TableCell>
                <TableCell>{row.overdueCount}</TableCell>
                <TableCell>{row.hoursWorked}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
