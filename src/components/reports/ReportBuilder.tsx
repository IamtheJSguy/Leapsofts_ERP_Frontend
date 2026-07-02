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
  useTheme,
  Autocomplete,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TuneIcon from '@mui/icons-material/Tune';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimelineIcon from '@mui/icons-material/Timeline';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import BadgeIcon from '@mui/icons-material/Badge';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import { reportFilterSchema } from '@/utils/validators';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { useGenerateReport } from '@/hooks/api/useReports';
import { useUsers } from '@/hooks/api/useUsers';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';

const REPORT_TYPES = [
  { value: 'attendance', label: 'Attendance', icon: <AccessTimeIcon fontSize="small" /> },
  { value: 'kpi_performance', label: 'KPI Performance', icon: <TimelineIcon fontSize="small" /> },
  { value: 'employee_full', label: 'Full Employee Report', icon: <PersonIcon fontSize="small" /> },
  { value: 'team_overview', label: 'Team Overview', icon: <GroupIcon fontSize="small" /> },
  { value: 'user_summary', label: 'User Summary', icon: <BadgeIcon fontSize="small" /> },
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

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

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
        p: { xs: 3, md: 3.5 },
        borderRadius: '24px',
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.02)',
        mb: 4.5,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Top Row: Period Toggles */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Period
          </Typography>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, val) => val && setPeriod(val)}
            size="small"
            sx={{
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              p: 0.5,
              borderRadius: '14px',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '10px !important',
                px: 2.5,
                py: 0.8,
                textTransform: 'none',
                fontWeight: 650,
                fontSize: '0.85rem',
                color: tokens.text.muted,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  backgroundColor: tokens.brand.primary,
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(93, 26, 137, 0.25)',
                  '&:hover': {
                    backgroundColor: tokens.brand.primaryDark,
                  },
                },
                '&:hover:not(.Mui-selected)': {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                },
              },
            }}
          >
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
            <ToggleButton value="custom">Custom</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Bottom Row: Filters & Action */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, flexWrap: 'wrap' }}>
          
          {/* Report Type */}
          <Box sx={{ minWidth: { xs: '100%', sm: 260 }, flexGrow: 1, maxWidth: { sm: 320 } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
              Report Type
            </Typography>
            <TextField
              {...typeRegister}
              value={reportType}
              onChange={(e) => {
                typeOnChange(e);
                onReportTypeChange?.(e.target.value);
              }}
              select
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
                  fontWeight: 650,
                  fontSize: '0.9rem',
                  height: '42px',
                },
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                },
              }}
            >
              {REPORT_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value} sx={{ py: 1.5, gap: 1.5, fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', color: tokens.brand.primary, opacity: 0.8 }}>
                    {t.icon}
                  </Box>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* User Filter (Admin Only) */}
          {isAdmin && !isTeamReport && (
            <Box sx={{ minWidth: { xs: '100%', sm: 260 }, flexGrow: 1, maxWidth: { sm: 320 } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                Select Employee
              </Typography>
              <Autocomplete
                options={[
                  { _id: '', name: 'All Employees' },
                  ...agents.map((agent) => ({
                    _id: agent._id,
                    name: `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email,
                  })),
                ]}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                value={
                  selectedAgentId === ''
                    ? { _id: '', name: 'All Employees' }
                    : {
                        _id: selectedAgentId,
                        name:
                          agents.find((a) => a._id === selectedAgentId)
                            ? `${agents.find((a) => a._id === selectedAgentId)?.firstName || ''} ${agents.find((a) => a._id === selectedAgentId)?.lastName || ''}`.trim() || agents.find((a) => a._id === selectedAgentId)?.email || ''
                            : 'Unknown Employee',
                      }
                }
                onChange={(_, newValue) => {
                  const val = newValue ? newValue._id : '';
                  onAgentChange?.(val);
                }}
                disableClearable
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
                        fontWeight: 650,
                        fontSize: '0.9rem',
                        height: '42px',
                        paddingTop: '0px',
                        paddingBottom: '0px',
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <MenuItem {...props} key={option._id} sx={{ fontWeight: 600 }}>
                    {option.name}
                  </MenuItem>
                )}
              />
            </Box>
          )}

          {/* Date Info / Range */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: { xs: '100%', sm: 'auto' } }}>
            {period === 'custom' ? (
              <Box sx={{ minWidth: { xs: '100%', sm: 260 } }}>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartChange={setStartDate}
                  onEndChange={setEndDate}
                  size="small"
                />
              </Box>
            ) : startDate ? (
              <>
                <Typography variant="caption" sx={{ color: 'transparent', display: { xs: 'none', md: 'block' }, mb: 1 }}>
                  Date
                </Typography>
                <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  px: 3,
                  py: '9px',
                  borderRadius: '14px',
                  backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(93, 26, 137, 0.04)',
                  border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(93, 26, 137, 0.08)'}`,
                  height: '42px',
                }}
              >
                <CalendarMonthIcon sx={{ color: tokens.brand.primary, fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: tokens.brand.primary, fontWeight: 750, letterSpacing: '0.01em' }}>
                  {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' — '}
                  {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Typography>
              </Box>
            </>
            ) : null}
          </Box>

          {/* Submit Button */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%', width: { xs: '100%', sm: 'auto' } }}>
            <Typography variant="caption" sx={{ color: 'transparent', display: { xs: 'none', md: 'block' }, mb: 1 }}>
              Action
            </Typography>
            <Button
              type="submit"
              variant="contained"
              disabled={generateReport.isPending}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                borderRadius: '14px',
                height: '42px',
                px: 4,
                textTransform: 'none',
                fontWeight: 750,
                fontSize: '0.9rem',
                background: `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.primary} 100%)`,
                boxShadow: '0 8px 24px rgba(93, 26, 137, 0.25)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 28px rgba(93, 26, 137, 0.35)',
                },
                '&:disabled': {
                  background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                }
              }}
            >
              {generateReport.isPending ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                'Generate Report'
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
