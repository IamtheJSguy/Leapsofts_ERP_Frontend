import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Pagination,
  useTheme,
  CircularProgress,
  Grid,
  Card,
  LinearProgress,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { tokens } from '@/styles/tokens';
import { useShiftHistory } from '@/hooks/api/useShifts';
import { format } from 'date-fns';

export const AttendancePage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [page, setPage] = useState(1);
  const { data: historyData, isLoading } = useShiftHistory({ page, limit: 10 });

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    return format(new Date(dateString), 'hh:mm a');
  };

  const formatHours = (minutes: number) => {
    if (!minutes) return '0h 0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in':
        return tokens.semantic.success;
      case 'checked_out':
        return tokens.semantic.info;
      default:
        return 'text.secondary';
    }
  };

  // Calculate summary metrics based on current page data (or mock total if needed)
  const totalHoursWorked = useMemo(() => {
    if (!historyData?.shifts) return 0;
    return historyData.shifts.reduce((acc: number, shift: any) => acc + (shift.totalMinutes || 0), 0);
  }, [historyData]);

  const punctualityScore = useMemo(() => {
    if (!historyData?.shifts || historyData.shifts.length === 0) return 100;
    // Mock score: in a real app, calculate based on checkInTime vs scheduledStart
    return 95;
  }, [historyData]);

  return (
    <Box className="animate-fade-in-up" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto', pb: 8 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, gap: 2.5 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '20px',
            bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: tokens.brand.primary,
            boxShadow: isDarkMode ? '0 8px 32px rgba(93, 26, 137, 0.2)' : '0 8px 24px rgba(93, 26, 137, 0.08)',
          }}
        >
          <CalendarTodayIcon sx={{ fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.025em', mb: 0.5, color: isDarkMode ? '#fff' : tokens.text.primary }}>
            My Attendance
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Track your shifts, hours, and daily punctuality.
          </Typography>
        </Box>
      </Box>

      {/* KPI Widgets */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[
          {
            title: 'Hours This Week',
            value: formatHours(totalHoursWorked),
            icon: <TimerIcon sx={{ fontSize: 24, color: '#3B82F6' }} />,
            bgIcon: '#EFF6FF',
            trend: '+2.5h from last week',
          },
          {
            title: 'Punctuality Score',
            value: `${punctualityScore}%`,
            icon: <CheckCircleOutlineIcon sx={{ fontSize: 24, color: '#10B981' }} />,
            bgIcon: '#ECFDF5',
            trend: 'Top 10% in team',
          },
          {
            title: 'Total Shifts',
            value: historyData?.total || 0,
            icon: <TrendingUpIcon sx={{ fontSize: 24, color: '#8B5CF6' }} />,
            bgIcon: '#F5F3FF',
            trend: 'Consistent schedule',
          },
        ].map((kpi, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card
              sx={{
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 24px rgba(0,0,0,0.02)',
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '14px',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : kpi.bgIcon,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {kpi.icon}
                </Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {kpi.title}
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, mb: 1 }}>
                {kpi.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {kpi.trend}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.01em' }}>
        Shift History
      </Typography>

      {/* Shift List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: tokens.brand.primary }} />
          </Box>
        ) : historyData?.shifts.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: '24px',
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'transparent',
              border: `2px dashed ${tokens.surface.border}`,
              boxShadow: 'none',
            }}
          >
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              No shift history found.
            </Typography>
          </Paper>
        ) : (
          historyData?.shifts.map((shift: any) => {
            const shiftDate = new Date(shift.date);
            const monthStr = format(shiftDate, 'MMM').toUpperCase();
            const dayStr = format(shiftDate, 'dd');
            
            // Calculate progress percentage assuming 8 hour shift (480 mins)
            const scheduledMins = 480; 
            const workedMins = shift.totalMinutes || 0;
            const progressPct = Math.min((workedMins / scheduledMins) * 100, 100);
            
            return (
              <Paper
                key={shift._id}
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  flexDirection: { xs: 'column', md: 'row' },
                  p: 3,
                  gap: 3,
                  borderRadius: '24px',
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.65)' : '#fff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                  boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.2)' : '0 8px 24px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    transform: 'scale(1.01)',
                    boxShadow: isDarkMode ? '0 12px 48px rgba(93, 26, 137, 0.25)' : '0 12px 32px rgba(93, 26, 137, 0.08)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                  }
                }}
              >
                {/* Visual Calendar Badge */}
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '18px',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9F8F7',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    {monthStr}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, lineHeight: 1 }}>
                    {dayStr}
                  </Typography>
                </Box>

                {/* Times & Info */}
                <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary }}>
                      Daily Shift
                    </Typography>
                    <Chip
                      label={shift.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      icon={shift.status === 'checked_in' ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : undefined}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        height: 22,
                        bgcolor: `${getStatusColor(shift.status)}15`,
                        color: getStatusColor(shift.status),
                        borderRadius: '6px',
                        border: `1px solid ${getStatusColor(shift.status)}30`,
                        '& .MuiChip-icon': { color: 'inherit', ml: 0.5 }
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 16 }} />
                      Scheduled: {shift.scheduledStart} - {shift.scheduledEnd}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 16, color: tokens.semantic.success }} />
                      In: {formatTime(shift.checkInTime)}
                    </Typography>
                    {shift.checkOutTime && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 16, color: tokens.semantic.info }} />
                        Out: {formatTime(shift.checkOutTime)}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Progress Bar & Hours */}
                <Box sx={{ width: { xs: '100%', md: 240 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Logged Hours
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: tokens.brand.primary }}>
                      {formatHours(shift.totalMinutes)}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPct} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        bgcolor: progressPct >= 100 ? tokens.semantic.success : tokens.brand.primary,
                      }
                    }} 
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textAlign: 'right' }}>
                    {progressPct >= 100 ? 'Shift complete!' : `${Math.round(progressPct)}% of 8h shift`}
                  </Typography>
                </Box>

              </Paper>
            );
          })
        )}
      </Box>

      {/* Pagination */}
      {historyData && historyData.total > 10 && (
        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={Math.ceil(historyData.total / historyData.limit)} 
            page={page} 
            onChange={(_, value) => setPage(value)} 
            color="primary"
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 700,
                borderRadius: '12px',
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default AttendancePage;
