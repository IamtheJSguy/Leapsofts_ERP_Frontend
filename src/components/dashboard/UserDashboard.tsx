import { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard, useMyDashboardTasks } from '@/hooks/api/useDashboard';
import { useKanbanBoards } from '@/hooks/api/useKanban';
import { useMeetings } from '@/hooks/api/useMeetings';
import { useMySalesKpis } from '@/hooks/api/useSalesKpis';
import { SALES_KPI_STATUS } from '@/lib/constants';
import { tokens } from '@/styles/tokens';
import { useNavigate } from 'react-router-dom';
import { StatCardSkeleton, ChartSkeleton } from './DashboardSkeletons';

import { MeetingDetailModal } from '@/components/meetings/MeetingDetailModal';
import type { Meeting, SalesKpiEntry } from '@/types';

const getUserTimeZone = (user?: any) => {
  return (
    user?.timezone ||
    user?.timeZone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    'UTC'
  );
};



const overlapsLocalDay = (entry: SalesKpiEntry, day = new Date()) => {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  const periodStart = new Date(entry.periodStart).getTime();
  const periodEnd = new Date(entry.periodEnd).getTime();
  return periodStart <= dayEnd.getTime() && periodEnd >= dayStart.getTime();
};

const isSalesKpiDone = (status?: string) =>
  status === SALES_KPI_STATUS.COMPLETED_ON_TIME || status === SALES_KPI_STATUS.COMPLETED_LATE;

const getLocalDateString = (dateInput?: string | Date, timeZone?: string): string => {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return '';
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }
};

const formatTaskDate = (dateInput?: string | Date, timeZone?: string): string => {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return '';
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  }
};

export const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stats, isLoading, refetch } = useDashboard();
  const { data: boards } = useKanbanBoards();
  const { data: dashboardTasksData, isLoading: isTasksLoading } = useMyDashboardTasks();
  const { data: salesGrouped } = useMySalesKpis({ days: 7 });
  const { data: allMeetings = [] } = useMeetings();

  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [logType, setLogType] = useState('connection');
  const [logCount, setLogCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMeetingModal, setSelectedMeetingModal] = useState<Meeting | null>(null);

  const todaySalesKpis = useMemo(() => {
    if (!salesGrouped) return [] as SalesKpiEntry[];
    const flatten = (bucket: typeof salesGrouped.active) => [
      ...bucket.low,
      ...bucket.medium,
      ...bucket.high,
      ...bucket.urgent,
    ];
    const all = [
      ...flatten(salesGrouped.active),
      ...flatten(salesGrouped.overdue),
      ...flatten(salesGrouped.incomplete),
      ...flatten(salesGrouped.done),
    ];
    return all.filter((entry) => overlapsLocalDay(entry));
  }, [salesGrouped]);

  const salesCompletedCount = salesGrouped?.counts.done.total ?? 0;
  const dashboardTasks = dashboardTasksData?.tasks ?? [];

  const userTimeZone = useMemo(() => getUserTimeZone(user), [user]);

  const { dueTasks, activeTasks } = useMemo(() => {
    const due: typeof dashboardTasks = [];
    const active: typeof dashboardTasks = [];
    const todayStr = getLocalDateString(new Date(), userTimeZone);

    dashboardTasks.forEach((task) => {
      const taskDateStr = getLocalDateString(task.dueDate, userTimeZone);
      const isDueOrOverdue =
        task.isOverdue || (taskDateStr !== '' && taskDateStr < todayStr);

      if (isDueOrOverdue) {
        due.push(task);
      } else if (!taskDateStr || taskDateStr === todayStr) {
        active.push(task);
      }
      // Future tasks (taskDateStr > todayStr) are excluded from Active Tasks
    });

    return { dueTasks: due, activeTasks: active };
  }, [dashboardTasks, userTimeZone]);
  const todaySalesCompletedCount = useMemo(
    () => todaySalesKpis.filter((entry) => isSalesKpiDone(entry.status)).length,
    [todaySalesKpis],
  );
  const summaryIncludesSalesKpis = useMemo(
    () => (stats?.kpiChartData ?? []).some((kpi) => kpi.type === 'sales_kpi'),
    [stats?.kpiChartData],
  );
  /** Daily completed KPIs from summary, with any today-sales portion removed to avoid double-count. */
  const completedDailyKpisCount = Math.max(
    0,
    (stats?.metrics?.completedKpis || 0) -
    (summaryIncludesSalesKpis ? todaySalesCompletedCount : 0),
  );
  const completedKpisWithSales = completedDailyKpisCount + salesCompletedCount;

  // Keyboard shortcut listener for ⌘L / Ctrl+L
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setQuickLogOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <Box className="animate-fade-in-up" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <ChartSkeleton height={180} />
        <Grid container spacing={3.5}>
          <Grid item xs={12} sm={6} md={3}><StatCardSkeleton /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatCardSkeleton /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatCardSkeleton /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatCardSkeleton /></Grid>
        </Grid>
      </Box>
    );
  }

  // Boards for the My Boards section
  const boardsList = boards || [];
  const totalBoardsCount = boardsList.length;

  // Meetings for Upcoming Meetings section (excluding cancelled)
  const upcomingMeetings = allMeetings
    .filter((m: any) => m.status !== 'cancelled' && new Date(m.scheduledAt).getTime() > Date.now())
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  const handleQuickLogSubmit = () => {
    setIsSubmitting(true);
    // Simulate API call to log activity
    setTimeout(() => {
      setIsSubmitting(false);
      setQuickLogOpen(false);
      refetch(); // Refresh dashboard counts
    }, 800);
  };


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>


      {/* 1. My Boards, Meetings & Deadlines Grid */}
      <Grid container spacing={3.5}>        {/* Column 1: My Tasks (60%) */}
        <Grid item xs={12} md={7} sx={{ display: 'flex' }}>
          <Box
            sx={{
              p: 3.5,
              borderRadius: '24px',
              bgcolor: tokens.surface.card,
              border: `1px solid ${tokens.surface.border}`,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                boxShadow: '0 10px 30px rgba(26, 22, 37, 0.03)',
                borderColor: 'rgba(0,0,0,0.06)'
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1, mb: 2.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.9rem', sm: '1rem' }, color: tokens.text.primary, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '-0.01em' }}>
                <CheckCircleOutlinedIcon sx={{ color: tokens.brand.accent, fontSize: 20 }} />
                My Tasks
              </Typography>
              <Button
                variant="text"
                onClick={() => navigate('/tasks')}
                sx={{
                  textTransform: 'none',
                  color: tokens.text.muted,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  '&:hover': { color: tokens.brand.primary }
                }}
              >
                View all ({dueTasks.length + activeTasks.length}) &gt;
              </Button>
            </Box>

            {isTasksLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6, flex: 1 }}>
                <CircularProgress size={28} sx={{ color: tokens.brand.accent }} />
              </Box>
            ) : dueTasks.length === 0 && activeTasks.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, flex: 1 }}>
                <CheckCircleOutlinedIcon sx={{ color: 'rgba(0,0,0,0.1)', fontSize: 40, mb: 1.5 }} />
                <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: tokens.text.muted }}>
                  No active tasks for today
                </Typography>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1.2, 
                  flex: 1,
                  maxHeight: 330,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  pr: 0.5,
                  '&::-webkit-scrollbar': { width: 5 },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'rgba(0, 0, 0, 0.15)',
                    borderRadius: 3,
                  },
                }}
              >
                {/* Active Tasks First */}
                {activeTasks.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    {activeTasks.map((task) => {
                      const hasProgress = task.currentValue !== undefined && task.targetValue !== undefined && task.targetValue > 0;
                      return (
                        <Box
                          key={task.id}
                          onClick={() => navigate('/tasks')}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 1,
                            px: 1.5,
                            borderRadius: '12px',
                            bgcolor: 'rgba(0,0,0,0.006)',
                            border: '1px solid rgba(0,0,0,0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            '&:hover': {
                              bgcolor: 'rgba(0,0,0,0.015)',
                              borderColor: 'rgba(0,0,0,0.05)',
                              transform: 'translateX(2px)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tokens.brand.accent, flexShrink: 0 }} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.86rem', color: tokens.text.primary }}>
                                {task.title}
                                {hasProgress && (
                                  <Typography component="span" sx={{ fontSize: '0.78rem', color: tokens.text.muted, ml: 1, fontWeight: 600 }}>
                                    {task.currentValue} / {task.targetValue}
                                  </Typography>
                                )}
                              </Typography>
                              {task.kind === 'sales' && (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.3 }}>
                                  <Chip
                                    label="Sales"
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', color: tokens.text.secondary }}
                                  />
                                </Box>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.brand.accent }}>
                              <span style={{ fontWeight: 500, color: tokens.text.muted, fontSize: '0.72rem', marginRight: 4 }}>Date:</span>
                              {formatTaskDate(task.dueDate, userTimeZone)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                {/* Overdue Tasks Next */}
                {dueTasks.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    {dueTasks.map((task) => {
                      const hasProgress = task.currentValue !== undefined && task.targetValue !== undefined && task.targetValue > 0;
                      return (
                        <Box
                          key={task.id}
                          onClick={() => navigate('/tasks?status=overdue')}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 1,
                            px: 1.5,
                            borderRadius: '12px',
                            bgcolor: 'rgba(239, 68, 68, 0.03)',
                            border: '1px solid rgba(239, 68, 68, 0.12)',
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            '&:hover': {
                              bgcolor: 'rgba(239, 68, 68, 0.06)',
                              borderColor: 'rgba(239, 68, 68, 0.2)',
                              transform: 'translateX(2px)',
                              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.04)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tokens.semantic.error, flexShrink: 0 }} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.86rem', color: tokens.text.primary }}>
                                {task.title}
                                {hasProgress && (
                                  <Typography component="span" sx={{ fontSize: '0.78rem', color: tokens.text.muted, ml: 1, fontWeight: 600 }}>
                                    {task.currentValue} / {task.targetValue}
                                  </Typography>
                                )}
                              </Typography>
                              {task.kind === 'sales' && (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.3 }}>
                                  <Chip
                                    label="Sales"
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', color: tokens.text.secondary }}
                                  />
                                </Box>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, ml: 1 }}>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: tokens.semantic.error, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                              <WarningAmberOutlinedIcon sx={{ fontSize: 13 }} /> Overdue
                            </Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.semantic.error }}>
                              <span style={{ fontWeight: 500, color: tokens.text.muted, fontSize: '0.72rem', marginRight: 4 }}>Date:</span>
                              {formatTaskDate(task.dueDate, userTimeZone)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Grid>

        {/* Column 2: Reminders & Deadlines (40%) */}
        <Grid item xs={12} md={5} sx={{ display: 'flex' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, width: '100%', height: '100%' }}>
            {/* Reminders Card */}
            <Box
              sx={{
                p: 3.5,
                borderRadius: '24px',
                bgcolor: tokens.surface.card,
                border: `1px solid ${tokens.surface.border}`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 215,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  boxShadow: '0 10px 30px rgba(26, 22, 37, 0.03)',
                  borderColor: 'rgba(0,0,0,0.06)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: tokens.text.primary, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '-0.01em' }}>
                  <NotificationsNoneOutlinedIcon sx={{ color: tokens.brand.accent, fontSize: 20 }} />
                  Upcoming Meetings
                </Typography>
                <Button
                  variant="text"
                  onClick={() => navigate('/meetings')}
                  sx={{
                    textTransform: 'none',
                    color: tokens.text.muted,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    '&:hover': { color: tokens.brand.primary }
                  }}
                >
                  View all &gt;
                </Button>
              </Box>

              {/* Meetings Empty state */}
              {upcomingMeetings.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 3,
                    my: 'auto',
                    flex: 1
                  }}
                >
                  <NotificationsNoneOutlinedIcon sx={{ color: 'rgba(0,0,0,0.1)', fontSize: 36, mb: 1.5 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: tokens.text.muted, mb: 0.5 }}>
                    No upcoming meetings
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: tokens.text.muted, opacity: 0.7 }}
                  >
                    You have no scheduled calls right now
                  </Typography>
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 1.2, 
                    maxHeight: 150,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    pr: 0.5,
                    '&::-webkit-scrollbar': { width: 5 },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: 'rgba(0, 0, 0, 0.15)',
                      borderRadius: 3,
                    },
                  }}
                >
                  {upcomingMeetings.map((meeting: any) => (
                    <Box
                      key={meeting._id}
                      onClick={() => setSelectedMeetingModal(meeting)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1,
                        px: 1.5,
                        borderRadius: '12px',
                        bgcolor: 'rgba(0,0,0,0.006)',
                        border: '1px solid rgba(0,0,0,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.015)',
                          borderColor: 'rgba(0,0,0,0.05)',
                          transform: 'translateX(2px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.12)', flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.86rem', color: tokens.text.primary }}>
                            {meeting.title}
                          </Typography>
                          <Typography sx={{ fontWeight: 500, fontSize: '0.75rem', color: tokens.text.muted }}>
                            {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.brand.accent, flexShrink: 0, ml: 1 }}>
                        {new Date(meeting.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

            </Box>

            {/* Upcoming Deadlines Card */}
            <Box
              sx={{
                p: 3.5,
                borderRadius: '24px',
                bgcolor: tokens.surface.card,
                border: `1px solid ${tokens.surface.border}`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 215,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  boxShadow: '0 10px 30px rgba(26, 22, 37, 0.03)',
                  borderColor: 'rgba(0,0,0,0.06)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: tokens.text.primary, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '-0.01em' }}>
                  <AccessTimeOutlinedIcon sx={{ color: tokens.brand.accent, fontSize: 20 }} />
                  Upcoming Deadlines
                </Typography>
              </Box>

              {isTasksLoading ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 3,
                    my: 'auto',
                    flex: 1
                  }}
                >
                  <CircularProgress size={28} sx={{ color: tokens.brand.accent }} />
                </Box>
              ) : dashboardTasks.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 3,
                    my: 'auto',
                    flex: 1
                  }}
                >
                  <AccessTimeOutlinedIcon sx={{ color: 'rgba(0,0,0,0.1)', fontSize: 36, mb: 1.5 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: tokens.text.muted }}>
                    No upcoming deadlines
                  </Typography>
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 1.2, 
                    maxHeight: 150, 
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    pr: 0.5,
                    '&::-webkit-scrollbar': { width: 5 },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: 'rgba(0, 0, 0, 0.15)',
                      borderRadius: 3,
                    },
                  }}
                >
                  {dashboardTasks.map((task) => (
                    <Box
                      key={task.id}
                      onClick={() => navigate('/tasks')}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        px: 1.5,
                        borderRadius: '12px',
                        bgcolor: 'rgba(0,0,0,0.006)',
                        border: '1px solid rgba(0,0,0,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.015)',
                          borderColor: 'rgba(0,0,0,0.05)',
                          transform: 'translateX(2px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tokens.brand.accent, flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.86rem', color: tokens.text.primary }}>
                            {task.title}
                          </Typography>
                          {task.kind === 'sales' && (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.3 }}>
                              <Chip
                                label="Sales"
                                size="small"
                                sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', color: tokens.text.secondary }}
                              />
                            </Box>
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: task.isOverdue ? tokens.semantic.error : tokens.brand.accent
                          }}
                        >
                          <span style={{ fontWeight: 500, color: tokens.text.muted, fontSize: '0.72rem', marginRight: 4 }}>Date:</span>
                          {formatTaskDate(task.dueDate, userTimeZone)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* 2. My Performance Section */}
      <Box
        sx={{
          p: 3.5,
          borderRadius: '24px',
          bgcolor: tokens.surface.card,
          border: `1px solid ${tokens.surface.border}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            boxShadow: '0 10px 30px rgba(26, 22, 37, 0.03)',
            borderColor: 'rgba(0,0,0,0.06)'
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1, mb: 2.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.9rem', sm: '1rem' }, color: tokens.text.primary, letterSpacing: '-0.01em' }}>
            My Performance · this week
          </Typography>
          <Button
            variant="text"
            onClick={() => navigate('/team/insights')}
            sx={{
              textTransform: 'none',
              color: tokens.text.muted,
              fontWeight: 700,
              fontSize: '0.8rem',
              '&:hover': { color: tokens.brand.primary }
            }}
          >
            Open My Analytics &gt;
          </Button>
        </Box>

        {/* Analysis numbers row */}
        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          {[
            { label: 'Done this week', count: stats?.metrics?.completedTasks || 0, color: tokens.semantic.success, bg: 'rgba(45, 138, 94, 0.03)', border: 'rgba(45, 138, 94, 0.08)' },
            { label: 'Pending Tasks', count: stats?.metrics?.pendingTasks || 0, color: tokens.brand.accent, bg: 'rgba(255, 127, 17, 0.03)', border: 'rgba(255, 127, 17, 0.08)' },
            {
              label: 'Completed KPIs',
              count: completedKpisWithSales,
              color: tokens.brand.primary,
              bg: 'rgba(93, 26, 137, 0.03)',
              border: 'rgba(93, 26, 137, 0.08)',
            },
          ].map((item) => (
            <Grid item xs={6} sm={4} key={item.label}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  border: `1px solid ${item.border}`,
                  bgcolor: item.bg,
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                  }
                }}
              >
                <Typography sx={{ color: tokens.text.muted, fontWeight: 700, fontSize: '0.74rem', mb: 1 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 850, color: item.color, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {item.count}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>


      </Box>


      {/* Quick Log Interactive Modal Dialog */}
      <Dialog
        open={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1.5,
            width: '100%',
            maxWidth: 440,
            boxShadow: '0 15px 50px rgba(26, 22, 37, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.15rem', pb: 1, letterSpacing: '-0.01em' }}>
          Quick Log Activity
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
          <Typography sx={{ color: tokens.text.secondary, fontSize: '0.86rem' }}>
            Quickly log actions taken in your pipeline. This will instantly update your dashboard metrics.
          </Typography>

          <TextField
            select
            fullWidth
            label="Activity Type"
            value={logType}
            onChange={(e) => setLogType(e.target.value)}
            slotProps={{
              select: {
                MenuProps: {
                  slotProps: {
                    paper: {
                      sx: { borderRadius: '12px' }
                    }
                  }
                }
              }
            }}
          >
            <MenuItem value="connection">Connection Sent</MenuItem>
            <MenuItem value="accept">Connection Accepted</MenuItem>
            <MenuItem value="message">Message Sent</MenuItem>
            <MenuItem value="meeting">Meeting Scheduled</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Quantity / Count"
            type="number"
            value={logCount}
            onChange={(e) => setLogCount(Number(e.target.value))}
            slotProps={{
              htmlInput: { min: 1 }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setQuickLogOpen(false)}
            sx={{
              textTransform: 'none',
              color: tokens.text.secondary,
              fontWeight: 700
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleQuickLogSubmit}
            disabled={isSubmitting}
            disableElevation
            sx={{
              background: `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.accentLight} 100%)`,
              color: '#fff',
              fontWeight: 800,
              borderRadius: '12px',
              textTransform: 'none',
              px: 3,
              '&:hover': {
                background: `linear-gradient(135deg, ${tokens.brand.accentDark} 0%, ${tokens.brand.accent} 100%)`
              }
            }}
          >
            {isSubmitting ? 'Logging...' : 'Log Activity'}
          </Button>
        </DialogActions>
      </Dialog>

      <MeetingDetailModal
        meeting={selectedMeetingModal}
        open={!!selectedMeetingModal}
        onClose={() => setSelectedMeetingModal(null)}
      />
    </Box>
  );
};


