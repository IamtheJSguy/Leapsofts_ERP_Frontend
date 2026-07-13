import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  useTheme,
  Card,
  Divider,
  Skeleton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import FlagCircleIcon from '@mui/icons-material/FlagCircle';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import ScheduleIcon from '@mui/icons-material/Schedule';
import HistoryIcon from '@mui/icons-material/History';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

import { useUserSummary, useUserAttendanceSummary } from '@/hooks/api/useUsers';
import { ModernDatePicker } from '@/components/common/ModernDatePicker';
import { tokens } from '@/styles/tokens';
import { formatDate, getDisplayName } from '@/utils/formatters';

const formatHoursToTimeStr = (hoursDecimal: number | undefined) => {
  if (hoursDecimal === undefined || hoursDecimal === null) return '0 min';
  const totalMinutes = Math.round(hoursDecimal * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  
  if (hrs === 0 && mins === 0) return '0 min';
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
};

const parseApiDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toApiDateString = (date: Date) => date.toLocaleDateString('en-CA');

export default function MemberProgressPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const summaryDate = searchParams.get('date') || toApiDateString(new Date());
  const selectedSummaryDate = parseApiDate(summaryDate);

  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [detailTab, setDetailTab] = useState<'tasks' | 'kpis'>('tasks');

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (timeframe === 'weekly') {
      start.setDate(end.getDate() - 7);
    } else {
      start.setDate(end.getDate() - 30);
    }
    
    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    
    return {
      startDate: formatDate(start),
      endDate: formatDate(end)
    };
  }, [timeframe]);

  const { data: summary, isLoading: isSummaryLoading } = useUserSummary(userId, summaryDate);
  const { data: attendanceData, isLoading: isAttendanceLoading } = useUserAttendanceSummary(
    userId,
    dateRange.startDate,
    dateRange.endDate
  );

  const todaysShift = useMemo(() => {
    if (!attendanceData?.shifts) return null;
    const localToday = new Date().toLocaleDateString('en-CA');
    return attendanceData.shifts.find((s: any) => {
      const shiftLocalDate = new Date(s.date).toLocaleDateString('en-CA');
      const checkInLocalDate = s.checkInTime ? new Date(s.checkInTime).toLocaleDateString('en-CA') : null;
      return shiftLocalDate === localToday || checkInLocalDate === localToday;
    });
  }, [attendanceData?.shifts]);

  if (isSummaryLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  if (!summary || !summary.user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">User summary data not found</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
      </Box>
    );
  }

  const { user, metrics, trendData = [], kpiChartData = [], dailyKpis = [], tasksList = [] } = summary;
  const displayName = getDisplayName(user);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Box sx={{ p: { xs: 2.5, md: 4.5 }, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* 1. Header with back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon />}
          sx={{
            py: 1,
            px: 2.5,
            borderRadius: '16px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
            color: isDarkMode ? '#fff' : tokens.text.primary,
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              transform: 'translateX(-2px)',
            }
          }}
        >
          Back to Progress
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 220 }}>
            <ModernDatePicker
              value={selectedSummaryDate}
              onChange={(date) => {
                if (date) {
                  setSearchParams({ date: toApiDateString(date) }, { replace: true });
                } else {
                  const newParams = new URLSearchParams(window.location.search);
                  newParams.delete('date');
                  setSearchParams(newParams, { replace: true });
                }
              }}
              placeholder="Select date"
            />
          </Box>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Teammate Analytics
          </Typography>
        </Box>
      </Box>

      {/* 2. Luxury User Banner */}
      <Box
        sx={{
          p: 3.5,
          borderRadius: '32px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255, 255, 255, 0.75)',
          /* backdropFilter: 'blur(30px)' (removed for performance) */
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.7)'}`,
          boxShadow: isDarkMode ? 'none' : '0 10px 40px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: 3.5,
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <Box
            sx={{
              top: -4,
              left: -4,
              bottom: -4,
              right: -4,
              position: 'absolute',
              borderRadius: '50%',
              border: `2px solid ${tokens.brand.primary}`,
              opacity: 0.4,
              boxShadow: `0 0 16px ${tokens.brand.primary}`,
            }}
          />
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: tokens.brand.primary,
              fontSize: '2rem',
              fontWeight: 800,
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            }}
          >
            {initial}
          </Avatar>
        </Box>

        <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', md: 'left' } }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 850,
              letterSpacing: '-0.02em',
              color: isDarkMode ? '#fff' : tokens.text.primary,
            }}
          >
            {displayName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' }, alignItems: 'center' }}>
            <Chip
              icon={<BadgeIcon sx={{ fontSize: '14px !important' }} />}
              label={user.role.toUpperCase()}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: '0.72rem',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: isDarkMode ? '#fff' : tokens.text.primary,
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <EmailIcon sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.email}</Typography>
            </Box>
          </Box>
        </Box>


      </Box>

      {/* 3. Luxury Stats Grid */}
      <Grid container spacing={3}>
        {[
          {
            title: 'Completed Tasks',
            value: metrics?.completedTasks ?? 0,
            icon: <CheckCircleOutlinedIcon sx={{ fontSize: 24, color: tokens.semantic.success }} />,
            glow: 'rgba(16, 185, 129, 0.15)',
          },
          {
            title: 'Pending Tasks',
            value: metrics?.pendingTasks ?? 0,
            icon: <AccessTimeOutlinedIcon sx={{ fontSize: 24, color: tokens.semantic.warning }} />,
            glow: 'rgba(245, 158, 11, 0.15)',
          },
          {
            title: 'Overdue Tasks',
            value: metrics?.overdueTasks ?? 0,
            icon: <WarningAmberOutlinedIcon sx={{ fontSize: 24, color: tokens.semantic.error }} />,
            glow: 'rgba(239, 68, 68, 0.15)',
          },
          {
            title: 'Completed KPIs',
            value: metrics?.completedKpis ?? 0,
            icon: <EmojiEventsOutlinedIcon sx={{ fontSize: 24, color: tokens.brand.primary }} />,
            glow: 'rgba(109, 40, 217, 0.15)',
          },
        ].map((stat, sIdx) => (
          <Grid item xs={12} sm={6} md={3} key={sIdx}>
            <Card
              sx={{
                p: 3,
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.5)' : 'rgba(255,255,255,0.7)',
                /* backdropFilter: 'blur(30px)' (removed for performance) */
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                boxShadow: `0 4px 30px ${stat.glow}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 10px 40px ${stat.glow}`,
                }
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.title}
                </Typography>
                <Typography sx={{ fontSize: '2rem', fontWeight: 900, mt: 0.5, color: isDarkMode ? '#fff' : tokens.text.primary }}>
                  {stat.value}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '16px',
                  bgcolor: stat.glow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stat.icon}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 4. Graphical Analytics Section */}
      <Grid container spacing={3.5}>
        {/* Trend Area Chart */}
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              p: 3.5,
              borderRadius: '28px',
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.5)' : 'rgba(255,255,255,0.7)',
              /* backdropFilter: 'blur(30px)' (removed for performance) */
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, letterSpacing: '-0.01em', color: isDarkMode ? '#fff' : tokens.text.primary }}>
              Task Completion Trend (7 days ending {formatDate(selectedSummaryDate, 'MMM d')})
            </Typography>
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tokens.brand.primary} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={tokens.brand.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'} />
                  <XAxis dataKey="day" stroke="currentColor" style={{ opacity: 0.5, fontSize: 11 }} />
                  <YAxis stroke="currentColor" style={{ opacity: 0.5, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#1E1B24' : '#fff',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                      borderRadius: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="completed" stroke={tokens.brand.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* KPI achievement Bar Chart */}
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              p: 3.5,
              borderRadius: '28px',
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.5)' : 'rgba(255,255,255,0.7)',
              /* backdropFilter: 'blur(30px)' (removed for performance) */
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, letterSpacing: '-0.01em', color: isDarkMode ? '#fff' : tokens.text.primary }}>
              Daily KPI Achievements · {formatDate(selectedSummaryDate, 'MMM d, yyyy')}
            </Typography>
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpiChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'} />
                  <XAxis dataKey="name" stroke="currentColor" style={{ opacity: 0.5, fontSize: 10 }} />
                  <YAxis stroke="currentColor" style={{ opacity: 0.5, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#1E1B24' : '#fff',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                      borderRadius: '12px',
                    }}
                  />
                  <Bar dataKey="Target" fill={isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'} radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Achieved" fill={tokens.brand.primary} radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 5. Assigned Tasks & Daily KPI Toggle Showcase */}
      <Paper
        sx={{
          p: 3.5,
          borderRadius: '32px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255, 255, 255, 0.75)',
          /* backdropFilter: 'blur(30px)' (removed for performance) */
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.7)'}`,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 3.5,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary }}>
            {detailTab === 'tasks'
              ? `Assigned Project Tasks (${tasksList.length})`
              : `Daily KPI Targets (${formatDate(selectedSummaryDate, 'MMM d, yyyy')}) (${dailyKpis.length})`}
          </Typography>

          {/* Translucent Tab Switcher Capsule */}
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              p: 0.5,
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
              borderRadius: '16px',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
            }}
          >
            {[
              { id: 'tasks', label: `Project Tasks (${tasksList.length})` },
              { id: 'kpis', label: `Daily KPIs (${dailyKpis.length})` },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setDetailTab(tab.id as 'tasks' | 'kpis')}
                sx={{
                  px: 3,
                  py: 0.75,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: detailTab === tab.id
                    ? (isDarkMode ? '#fff' : tokens.brand.primary)
                    : 'text.secondary',
                  bgcolor: detailTab === tab.id
                    ? (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#fff')
                    : 'transparent',
                  boxShadow: detailTab === tab.id && !isDarkMode
                    ? '0 1px 3px rgba(0,0,0,0.05)'
                    : 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: detailTab === tab.id
                      ? (isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#fff')
                      : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
                  }
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>
        </Box>

        {detailTab === 'tasks' ? (
          /* Project Tasks List */
          tasksList.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary" sx={{ fontWeight: 600 }}>No active board tasks assigned.</Typography>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {tasksList.map((task: any) => (
                <Grid item xs={12} md={6} key={task.id}>
                  <Box
                    onClick={() => task.boardId && navigate(`/projects/${task.projectId || task.boardId}/boards/${task.boardId}`)}
                    sx={{
                      p: 2.5,
                      borderRadius: '20px',
                      bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
                      cursor: task.boardId ? 'pointer' : 'default',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      '&:hover': {
                        transform: 'translateY(-2px) translateX(2px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.05)',
                        borderColor: task.boardId ? tokens.brand.primary : 'rgba(0,0,0,0.06)',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: isDarkMode ? '#fff' : tokens.text.primary }}>
                        {task.title}
                      </Typography>
                      <Chip
                        label={task.columnName}
                        size="small"
                        sx={{
                          fontWeight: 750,
                          fontSize: '0.68rem',
                          bgcolor: task.isDone 
                            ? 'rgba(16, 185, 129, 0.1)' 
                            : task.isOverdue 
                              ? 'rgba(239, 68, 68, 0.1)' 
                              : 'rgba(245, 158, 11, 0.1)',
                          color: task.isDone 
                            ? '#10B981' 
                            : task.isOverdue 
                              ? '#EF4444' 
                              : '#F59E0B',
                        }}
                      />
                    </Box>
                    
                    <Divider sx={{ opacity: 0.05 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          transition: 'color 0.2s',
                          '&:hover': {
                            color: task.boardId ? tokens.brand.primary : 'inherit',
                          }
                        }}
                      >
                        <FlagCircleIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>{task.boardName}</Typography>
                      </Box>
                      {task.dueDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: task.isOverdue ? '#EF4444' : 'text.secondary' }}>
                          <DateRangeIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )
        ) : (
          /* Daily KPIs List */
          dailyKpis.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary" sx={{ fontWeight: 600 }}>No daily KPI targets assigned for today.</Typography>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {dailyKpis.map((kpi: any) => (
                <Grid item xs={12} md={6} key={kpi.id}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: '20px',
                      bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px) translateX(2px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.05)',
                        borderColor: kpi.isCompleted ? tokens.semantic.success : tokens.brand.primary,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: kpi.isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.05)',
                          color: kpi.isCompleted ? tokens.semantic.success : 'text.disabled',
                        }}
                      >
                        {kpi.isCompleted ? (
                          <CheckCircleOutlinedIcon sx={{ fontSize: 20 }} />
                        ) : (
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                        )}
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: isDarkMode ? '#fff' : tokens.text.primary }}>
                          {kpi.kpiName}
                        </Typography>
                        {kpi.notes && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                            {kpi.notes}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      {kpi.targetValue > 0 && (
                        <Chip
                          label={
                            kpi.isCompleted && kpi.actualValue != null
                              ? `Actual: ${kpi.actualValue} / ${kpi.targetValue}`
                              : `Target: ${kpi.targetValue}`
                          }
                          size="small"
                          sx={{
                            fontWeight: 750,
                            fontSize: '0.68rem',
                            bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            color: 'text.secondary',
                          }}
                        />
                      )}
                      <Chip
                        label={kpi.isCompleted ? 'Completed' : 'Pending'}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          bgcolor: kpi.isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: kpi.isCompleted ? '#10B981' : '#F59E0B',
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )
        )}
      </Paper>

      {/* 6. Luxury Attendance Analytics Section */}
      <Paper
        sx={{
          p: 3.5,
          borderRadius: '32px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255, 255, 255, 0.75)',
          /* backdropFilter: 'blur(30px)' (removed for performance) */
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.7)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 3.5,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary }}>
              Attendance & Shifts Summary
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', mt: 0.5 }}>
              Track login sessions, shift hours, and attendance status.
            </Typography>
          </Box>

          {/* Translucent Timeframe Switcher */}
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              p: 0.5,
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
              borderRadius: '16px',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
            }}
          >
            {(['weekly', 'monthly'] as const).map((tab) => (
              <Button
                key={tab}
                onClick={() => setTimeframe(tab)}
                sx={{
                  px: 3,
                  py: 0.75,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: timeframe === tab
                    ? (isDarkMode ? '#fff' : tokens.brand.primary)
                    : 'text.secondary',
                  bgcolor: timeframe === tab
                    ? (isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff')
                    : 'transparent',
                  boxShadow: timeframe === tab && !isDarkMode
                    ? '0 1px 3px rgba(0,0,0,0.05)'
                    : 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: timeframe === tab
                      ? (isDarkMode ? 'rgba(255,255,255,0.12)' : '#fff')
                      : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                  }
                }}
              >
                {tab === 'weekly' ? 'Weekly' : 'Monthly'}
              </Button>
            ))}
          </Box>
        </Box>

        {isAttendanceLoading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Skeleton variant="rounded" height={100} sx={{ borderRadius: '24px' }} />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Skeleton variant="rounded" height={200} sx={{ borderRadius: '24px' }} />
            </Grid>
          </Grid>
        ) : !attendanceData ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>No attendance records found for this period.</Typography>
          </Box>
        ) : (
          <>
            {/* Attendance Metrics Cards */}
            <Grid container spacing={3}>
              {[
                {
                  title: 'Total Shift Records',
                  value: attendanceData.summary?.totalDays ?? 0,
                  icon: <HistoryIcon sx={{ fontSize: 24, color: tokens.brand.primary }} />,
                  glow: 'rgba(109, 40, 217, 0.15)',
                },
                {
                  title: 'Days Present',
                  value: attendanceData.summary?.presentDays ?? 0,
                  icon: <CheckCircleOutlinedIcon sx={{ fontSize: 24, color: tokens.semantic.success }} />,
                  glow: 'rgba(16, 185, 129, 0.15)',
                },
                {
                  title: 'Total Hours Worked',
                  value: formatHoursToTimeStr(attendanceData.summary?.totalHoursWorked),
                  icon: <ScheduleIcon sx={{ fontSize: 24, color: tokens.semantic.warning }} />,
                  glow: 'rgba(245, 158, 11, 0.15)',
                },
                {
                  title: 'Average Hours/Shift',
                  value: formatHoursToTimeStr(attendanceData.summary?.averageHoursPerShift),
                  icon: <EmojiEventsOutlinedIcon sx={{ fontSize: 24, color: tokens.semantic.info ?? tokens.brand.primary }} />,
                  glow: 'rgba(59, 130, 246, 0.15)',
                },
              ].map((stat, sIdx) => (
                <Grid item xs={12} sm={6} md={3} key={sIdx}>
                  <Card
                    sx={{
                      p: 3,
                      borderRadius: '24px',
                      bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                      boxShadow: `0 4px 20px ${stat.glow}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {stat.title}
                      </Typography>
                      <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, mt: 0.5, color: isDarkMode ? '#fff' : tokens.text.primary }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: '14px',
                        bgcolor: stat.glow,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Today's Shift Status Banner */}
            <Box
              sx={{
                p: 3,
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,0,0,0.01)',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2.5,
                mt: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '14px',
                    bgcolor: todaysShift?.status === 'checked_in' 
                      ? 'rgba(139, 92, 246, 0.15)' 
                      : todaysShift?.status === 'checked_out'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: todaysShift?.status === 'checked_in' 
                      ? '#8B5CF6' 
                      : todaysShift?.status === 'checked_out'
                        ? '#10B981'
                        : '#EF4444',
                  }}
                >
                  <ScheduleIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: isDarkMode ? '#fff' : tokens.text.primary }}>
                    Today's Shift Status
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, mt: 0.25 }}>
                    {todaysShift 
                      ? `Check-In: ${new Date(todaysShift.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` + 
                        (todaysShift.checkOutTime ? ` — Check-Out: ${new Date(todaysShift.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '')
                      : 'No shift activity recorded yet for today.'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {todaysShift && (
                  <Typography sx={{ fontWeight: 850, fontSize: '1.05rem', color: isDarkMode ? '#fff' : tokens.text.primary }}>
                    {formatHoursToTimeStr(todaysShift.hoursWorked)}
                  </Typography>
                )}
                <Chip
                  label={
                    todaysShift?.status === 'checked_in' 
                      ? 'Active / In Progress' 
                      : todaysShift?.status === 'checked_out'
                        ? 'Shift Completed'
                        : 'Not Started'
                  }
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    bgcolor: todaysShift?.status === 'checked_in' 
                      ? 'rgba(139, 92, 246, 0.15)' 
                      : todaysShift?.status === 'checked_out'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.12)',
                    color: todaysShift?.status === 'checked_in' 
                      ? '#8B5CF6' 
                      : todaysShift?.status === 'checked_out'
                        ? '#10B981'
                        : '#EF4444',
                    border: 'none',
                  }}
                />
              </Box>
            </Box>

            {/* Shifts Logs Table List */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: isDarkMode ? '#fff' : tokens.text.primary }}>
                Shift History logs
              </Typography>
              {(!attendanceData.shifts || attendanceData.shifts.length === 0) ? (
                <Box sx={{ p: 4, textAlign: 'center', bgcolor: isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.015)', borderRadius: '20px' }}>
                  <Typography color="text.secondary">No shift records listed.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {attendanceData.shifts.map((shift: any, idx: number) => {
                    const statusColorMap = {
                      checked_out: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', label: 'Checked Out' },
                      checked_in: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6', label: 'In Progress' },
                      not_started: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', label: 'Absent/Missed' },
                    };
                    const statusConfig = statusColorMap[shift.status as keyof typeof statusColorMap] || statusColorMap.not_started;

                    const formatShiftTime = (timeStr: string | null) => {
                      if (!timeStr) return '--:--';
                      try {
                        return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      } catch {
                        return '--:--';
                      }
                    };

                    return (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', md: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', md: 'center' },
                          p: 2.5,
                          borderRadius: '20px',
                          bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
                          gap: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateX(4px)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '12px',
                              bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F6F4F3',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: tokens.brand.primary,
                            }}
                          >
                            <DateRangeIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: isDarkMode ? '#fff' : tokens.text.primary }}>
                              {new Date(shift.date).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                            </Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 650, mt: 0.25 }}>
                              Check-In: {formatShiftTime(shift.checkInTime)} — Check-Out: {formatShiftTime(shift.checkOutTime)}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: { xs: '100%', md: 'auto' }, justifyContent: 'space-between' }}>
                          <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: isDarkMode ? '#fff' : tokens.text.primary }}>
                              {formatHoursToTimeStr(shift.hoursWorked)}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                              Worked
                            </Typography>
                          </Box>

                          <Chip
                            label={statusConfig.label}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              bgcolor: statusConfig.bg,
                              color: statusConfig.text,
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
