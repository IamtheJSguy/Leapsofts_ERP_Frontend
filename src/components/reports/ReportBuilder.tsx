import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TuneIcon from '@mui/icons-material/Tune';
import { reportFilterSchema } from '@/utils/validators';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { useGenerateReport } from '@/hooks/api/useReports';
import { useUsers } from '@/hooks/api/useUsers';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';

const REPORT_TYPES = [
  { value: 'attendance', label: 'Attendance' },
  { value: 'kpi_performance', label: 'KPI Performance' },
  { value: 'employee_full', label: 'Full Employee Report' },
  { value: 'team_overview', label: 'Team Overview' },
  { value: 'user_summary', label: 'User Summary (Legacy)' },
  { value: 'connections', label: 'Connections' },
  { value: 'messages', label: 'Messages' },
  { value: 'meetings', label: 'Meetings' },
];

type Period = 'daily' | 'weekly' | 'monthly' | 'custom';

interface ReportBuilderProps {
  onGenerated?: (id: string) => void;
  reportType: string;
  onReportTypeChange?: (type: string) => void;
  selectedAgentId: string;
  onAgentChange?: (id: string) => void;
}

/** Returns today's start-of-day and end-of-day in YYYY-MM-DD format. */
const getDateRangeForPeriod = (period: Period): { start: string; end: string } => {
  const now = new Date();
  const end = now.toISOString().split('T')[0];

  if (period === 'daily') {
    return { start: end, end };
  }
  if (period === 'weekly') {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    return { start: weekStart.toISOString().split('T')[0], end };
  }
  if (period === 'monthly') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: monthStart.toISOString().split('T')[0], end };
  }
  return { start: '', end: '' };
};

export const ReportBuilder = ({
  onGenerated,
  reportType,
  onReportTypeChange,
  selectedAgentId,
  onAgentChange,
}: ReportBuilderProps) => {
  const generateReport = useGenerateReport();
  const addToast = useUIStore((s) => s.addToast);
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  const { data: users = [] } = useUsers(
    {},
    { enabled: isAdmin },
  );

  const agents = users.filter((u) => u.role !== 'admin');

  const [period, setPeriod] = useState<Period>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Auto-set date range when period changes
  useEffect(() => {
    if (period !== 'custom') {
      const range = getDateRangeForPeriod(period);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  }, [period]);

  const { register, handleSubmit, setValue } = useForm({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: { type: reportType, userId: selectedAgentId },
  });

  useEffect(() => {
    setValue('type', reportType);
  }, [reportType, setValue]);

  useEffect(() => {
    setValue('userId', selectedAgentId);
  }, [selectedAgentId, setValue]);

  const { onChange: typeOnChange, ...typeRegister } = register('type');
  const { onChange: userOnChange, ...userRegister } = register('userId');

  const isTeamReport = reportType === 'team_overview';

  const onSubmit = (data: Record<string, string>) => {
    const payload: Record<string, string> = {
      ...data,
      startDate: startDate || data.startDate || '',
      endDate: endDate || data.endDate || '',
      period,
    };
    if (isTeamReport) delete payload.userId;
    if (!payload.userId) delete payload.userId;

    if (!payload.startDate || !payload.endDate) {
      addToast({ message: 'Please select a date range', severity: 'warning' });
      return;
    }

    generateReport.mutate(payload, {
      onSuccess: (res) => {
        addToast({ message: 'Report generation started', severity: 'success' });
        onGenerated?.(res.data.data._id || res.data.data.reportId);
      },
      onError: (err) => {
        addToast({ message: 'Failed to generate report: ' + err.message, severity: 'error' });
      },
    });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        p: 3,
        borderRadius: '20px',
        border: `1px solid ${tokens.surface.borderLight}`,
        backgroundColor: '#FFFFFF',
        boxShadow: tokens.shadow.card,
        mb: 4,
      }}
    >
      {/* Period Toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
          Period:
        </Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, val) => val && setPeriod(val)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              borderRadius: '12px !important',
              px: 2,
              py: 0.8,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              border: `1px solid ${tokens.surface.border}`,
              color: tokens.text.muted,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                backgroundColor: tokens.brand.primary,
                color: '#FFFFFF',
                borderColor: tokens.brand.primary,
                '&:hover': {
                  backgroundColor: tokens.brand.primaryDark,
                },
              },
              '&:hover': {
                backgroundColor: tokens.brand.primary50,
              },
            },
          }}
        >
          <ToggleButton value="daily">
            <CalendarTodayIcon sx={{ fontSize: 16, mr: 0.5 }} /> Daily
          </ToggleButton>
          <ToggleButton value="weekly">
            <DateRangeIcon sx={{ fontSize: 16, mr: 0.5 }} /> Weekly
          </ToggleButton>
          <ToggleButton value="monthly">
            <CalendarMonthIcon sx={{ fontSize: 16, mr: 0.5 }} /> Monthly
          </ToggleButton>
          <ToggleButton value="custom">
            <TuneIcon sx={{ fontSize: 16, mr: 0.5 }} /> Custom
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Filters Row */}
      <Grid container spacing={2} alignItems="center">
        {/* Report Type */}
        <Grid item xs={12} sm={6} md={isAdmin ? 2.5 : 3}>
          <TextField
            {...typeRegister}
            onChange={(e) => {
              typeOnChange(e);
              onReportTypeChange?.(e.target.value);
            }}
            label="Report Type"
            select
            fullWidth
            size="medium"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
            }}
          >
            {REPORT_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* User Filter (Admin Only, not shown for team overview) */}
        {isAdmin && !isTeamReport && (
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              {...userRegister}
              onChange={(e) => {
                userOnChange(e);
                onAgentChange?.(e.target.value);
              }}
              label="Select Employee"
              select
              fullWidth
              size="medium"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            >
              <MenuItem value="">
                <em>All Employees</em>
              </MenuItem>
              {agents.map((agent) => (
                <MenuItem key={agent._id} value={agent._id}>
                  {`${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        {/* Date Range (only for custom period) */}
        {period === 'custom' && (
          <Grid item xs={12} md={3.5}>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              size="medium"
            />
          </Grid>
        )}

        {/* Date info for non-custom periods */}
        {period !== 'custom' && startDate && (
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.5,
                borderRadius: '12px',
                backgroundColor: tokens.brand.primary50,
                border: `1px solid ${tokens.brand.primary100}`,
              }}
            >
              <CalendarMonthIcon sx={{ color: tokens.brand.primary, fontSize: 18 }} />
              <Typography variant="body2" color={tokens.brand.primary} fontWeight={500}>
                {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' — '}
                {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Typography>
            </Box>
          </Grid>
        )}

        {/* Submit Button */}
        <Grid item xs={12} md={isTeamReport ? 2 : 1.5}>
          <Button
            type="submit"
            variant="contained"
            disabled={generateReport.isPending}
            fullWidth
            sx={{
              borderRadius: '12px',
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: tokens.brand.primary,
              minWidth: '110px',
              '&:hover': {
                backgroundColor: tokens.brand.primaryDark,
              },
            }}
          >
            {generateReport.isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Generate Report'
            )}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
