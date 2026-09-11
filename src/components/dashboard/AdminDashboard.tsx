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
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useAdminDashboard, useMyDashboardTasks } from '@/hooks/api/useDashboard';
import { useTeamAnalysis } from '@/hooks/api/useAdminTeamDashboard';
import { useMeetings } from '@/hooks/api/useMeetings';
import { useAuth } from '@/hooks/useAuth';
import { tokens } from '@/styles/tokens';
import { useNavigate } from 'react-router-dom';
import { ChartSkeleton } from './DashboardSkeletons';
import { TeamConnectionsSplitView } from './TeamConnectionsSplitView';

import { MeetingDetailModal } from '@/components/meetings/MeetingDetailModal';
import type { Meeting } from '@/types';

const getUserTimeZone = (user?: any) =>
  user?.timezone ||
  user?.timeZone ||
  Intl.DateTimeFormat().resolvedOptions().timeZone ||
  'UTC';

const getLocalDateString = (dateInput?: string | Date, timeZone?: string): string => {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return '';
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  }
};

const formatTaskDate = (dateInput?: string | Date, timeZone?: string): string => {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return '';
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  }
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: pipelineOverview, isLoading: isPipelineOverviewLoading, refetch } = useAdminDashboard();
  const { data: teamAnalysis, isLoading: isTeamAnalysisLoading } = useTeamAnalysis('week');
  const { data: allMeetings = [] } = useMeetings();
  const { data: dashboardTasksData, isLoading: isTasksLoading } = useMyDashboardTasks();
  const [selectedMeetingModal, setSelectedMeetingModal] = useState<Meeting | null>(null);

  const userTimeZone = useMemo(() => getUserTimeZone(user), [user]);
  const dashboardTasks = dashboardTasksData?.tasks ?? [];

  const { dueTasks, activeTasks } = useMemo(() => {
    const due: typeof dashboardTasks = [];
    const active: typeof dashboardTasks = [];
    const todayStr = getLocalDateString(new Date(), userTimeZone);
    dashboardTasks.forEach((task) => {
      const taskDateStr = getLocalDateString(task.dueDate, userTimeZone);
      const isDueOrOverdue = task.isOverdue || (taskDateStr !== '' && taskDateStr < todayStr);
      if (isDueOrOverdue) {
        due.push(task);
      } else if (!taskDateStr || taskDateStr === todayStr) {
        active.push(task);
      }
    });
    return { dueTasks: due, activeTasks: active };
  }, [dashboardTasks, userTimeZone]);


  if (isPipelineOverviewLoading || isTeamAnalysisLoading) {
    return (
      <Box className="animate-fade-in-up" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <ChartSkeleton height={180} />
      </Box>
    );
  }

  const formatShortDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const tasksOverview = teamAnalysis?.tasks;
  const tasksList = tasksOverview?.items ?? [];
  const totalTasksCount = tasksOverview?.total ?? 0;
  const boardLabel = tasksOverview?.boardName?.toUpperCase() ?? 'TEAM BOARD';

  const upcomingMeetings = allMeetings
    .filter((m: any) => m.status !== 'cancelled' && new Date(m.scheduledAt).getTime() > Date.now())
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  const upcomingDeadlines = teamAnalysis?.deadlines ?? [];

  const pipelineStats = [
    {
      label: 'TOTAL LEADS',
      val: pipelineOverview?.totalLeads ?? 0,
      sub: pipelineOverview?.assignedReps
        ? `${pipelineOverview.assignedReps} reps assigned`
        : undefined,
      action: 'scroll' as const,
      target: 'team-connections-split',
    },
    {
      label: 'ACCEPTED',
      val: pipelineOverview?.connectionsAccepted ?? 0,
      sub: pipelineOverview?.connectionsSent
        ? `${pipelineOverview.acceptanceRate}% of ${pipelineOverview.connectionsSent} sent`
        : undefined,
      action: 'scroll' as const,
      target: 'team-connections-split',
    },
    {
      label: 'FOLLOW UPS',
      val: pipelineOverview?.followUps ?? 0,
      sub: pipelineOverview?.awaitingReply
        ? `${pipelineOverview.awaitingReply} awaiting reply`
        : undefined,
      action: 'navigate' as const,
      target: '/sales',
    },
    {
      label: 'REPLIED',
      val: (pipelineOverview?.replied ?? 0) + (pipelineOverview?.positive ?? 0),
      sub: pipelineOverview?.replyRate ? `${pipelineOverview.replyRate}% reply rate` : undefined,
      action: 'navigate' as const,
      target: '/sales',
    },
    {
      label: 'NOT SENT',
      val: pipelineOverview?.notSent ?? 0,
      sub: pipelineOverview?.totalLeads
        ? `${Math.round(((pipelineOverview.notSent ?? 0) / pipelineOverview.totalLeads) * 100)}% of pipeline`
        : undefined,
      action: 'navigate' as const,
      target: '/sales',
    },
    {
      label: 'QUALIFIED',
      val: pipelineOverview?.qualified ?? 0,
      sub: pipelineOverview?.negative
        ? `${pipelineOverview.negative} negative responses`
        : undefined,
      action: 'navigate' as const,
      target: '/sales',
    },
  ];


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* 1. Today in Pipeline Card (Team Admin Context) */}
      <Box
        sx={{
          p: 3.5,
          borderRadius: '24px',
          bgcolor: tokens.surface.card,
          border: `1px solid ${tokens.surface.border}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015), 0 1px 3px rgba(0, 0, 0, 0.01)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            boxShadow: '0 10px 30px rgba(26, 22, 37, 0.03)',
            borderColor: 'rgba(0,0,0,0.06)'
          }
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 2 
          }}
        >
          {/* Badge & Title */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0.8, sm: 1.2 } }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  bgcolor: 'rgba(255, 127, 17, 0.06)',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '12px',
                  color: tokens.brand.accent,
                  border: '1px solid rgba(255, 127, 17, 0.1)'
                }}
              >
                <FlashOnIcon sx={{ fontSize: 13 }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.08em' }}>
                  PIPELINE OVERVIEW
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: tokens.text.primary, letterSpacing: '-0.01em' }}>
                Team pipeline · All leads
              </Typography>
            </Box>
          </Box>

          {/* Quick Actions Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/sales')}
              sx={{
                borderColor: tokens.surface.border,
                color: tokens.text.primary,
                fontWeight: 700,
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                borderRadius: '16px',
                px: { xs: 1.5, sm: 2.2 },
                py: { xs: 0.6, sm: 0.8 },
                textTransform: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.015)',
                  borderColor: 'rgba(0,0,0,0.18)',
                  transform: 'translateY(-0.5px)'
                }
              }}
            >
              Open Sales ↗
            </Button>
          </Box>
        </Box>

        {/* Subtitle text */}
        <Typography 
          sx={{ 
            color: tokens.text.secondary, 
            fontSize: '0.85rem', 
            fontWeight: 500,
            mb: 4,
            maxWidth: '750px',
            lineHeight: 1.5
          }}
        >
          {pipelineOverview?.totalLeads
            ? `${pipelineOverview.totalLeads} lead${pipelineOverview.totalLeads === 1 ? '' : 's'} in pipeline · ${pipelineOverview.followUps} follow-up${pipelineOverview.followUps === 1 ? '' : 's'} · ${pipelineOverview.qualified} qualified · ${pipelineOverview.notSent} not contacted yet.`
            : 'No leads in the pipeline yet — open Sales to add prospects or import from your sheet.'}
        </Typography>

        {/* Inline statistics counters (Admin stats) - Soft UI card style */}
        <Grid container spacing={2.5} sx={{ borderTop: `1px solid ${tokens.surface.borderLight}`, pt: 3.5 }}>
          {pipelineStats.map((stat) => (
            <Grid item xs={6} sm={4} md={2} key={stat.label}>
              <Box
                onClick={() => {
                  if (stat.action === 'scroll' && stat.target) {
                    document.getElementById(stat.target)?.scrollIntoView({ behavior: 'smooth' });
                  } else if (stat.action === 'navigate' && stat.target) {
                    navigate(stat.target);
                  }
                }}
                sx={{
                  p: 2.2,
                  borderRadius: '16px',
                  bgcolor: 'rgba(0,0,0,0.008)',
                  border: '1px solid rgba(0,0,0,0.015)',
                  cursor: stat.action ? 'pointer' : 'default',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  height: '100%',
                  '&:hover': {
                    bgcolor: stat.action ? 'rgba(59, 130, 246, 0.04)' : 'rgba(0,0,0,0.015)',
                    borderColor: stat.action ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.03)',
                    transform: 'translateY(-1px)',
                    boxShadow: stat.action ? '0 6px 16px rgba(59, 130, 246, 0.08)' : '0 4px 12px rgba(0,0,0,0.01)'
                  }
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: tokens.text.muted, 
                    fontWeight: 750, 
                    letterSpacing: '0.08em', 
                    fontSize: '0.62rem',
                    display: 'block',
                    mb: 0.5
                  }}
                >
                  {stat.label}
                </Typography>
                <Typography 
                  sx={{ 
                    fontSize: { xs: '1.4rem', sm: '1.8rem' }, 
                    fontWeight: 850, 
                    color: tokens.text.primary,
                    lineHeight: 1,
                    letterSpacing: '-0.02em'
                  }}
                >
                  {stat.val}
                </Typography>
                {stat.sub && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: tokens.text.muted,
                      fontWeight: 600,
                      mt: 0.5,
                      display: 'block',
                      fontSize: '0.68rem',
                    }}
                  >
                    {stat.sub}
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 2. Tasks Overview, Upcoming Meetings & Deadlines Grid */}
      <Grid container spacing={3.5}>
        {/* Column 1: My Tasks list (60%) */}
        <Grid item xs={12} md={7}>
          <Box
            sx={{
              p: 3.5,
              borderRadius: '24px',
              bgcolor: tokens.surface.card,
              border: `1px solid ${tokens.surface.border}`,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)',
              height: '100%',
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
                View all ({dueTasks.length + activeTasks.length}) >
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                {/* Overdue Tasks Subsection */}
                {dueTasks.length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.2, px: 0.5 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: tokens.semantic.error, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        OVERDUE TASKS
                      </Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.semantic.error }}>
                        {dueTasks.length}
                      </Typography>
                    </Box>
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
                              p: 1.8,
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tokens.semantic.error }} />
                              <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.86rem', color: tokens.text.primary }}>
                                  {task.title}
                                  {hasProgress && (
                                    <Typography component="span" sx={{ fontSize: '0.78rem', color: tokens.text.muted, ml: 1, fontWeight: 600 }}>
                                      {task.currentValue} / {task.targetValue}
                                    </Typography>
                                  )}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.3 }}>
                                  <Chip
                                    label={task.kind === 'sales' ? 'Sales' : 'Daily'}
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', color: tokens.text.secondary }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.semantic.error }}>
                                <span style={{ fontWeight: 500, color: tokens.text.muted, fontSize: '0.72rem', marginRight: 4 }}>Date:</span>
                                {formatTaskDate(task.dueDate, userTimeZone)}
                              </Typography>
                              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: tokens.semantic.error, display: 'flex', alignItems: 'center', gap: 0.3, justifyContent: 'flex-end', mt: 0.2 }}>
                                <WarningAmberOutlinedIcon sx={{ fontSize: 12 }} /> Overdue
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* Active Tasks Subsection */}
                {activeTasks.length > 0 && (
                  <Box sx={{ mt: dueTasks.length > 0 ? 1 : 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.2, px: 0.5 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: tokens.text.muted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        ACTIVE TASKS
                      </Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.text.muted }}>
                        {activeTasks.length}
                      </Typography>
                    </Box>
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
                              p: 1.8,
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tokens.brand.accent }} />
                              <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.86rem', color: tokens.text.primary }}>
                                  {task.title}
                                  {hasProgress && (
                                    <Typography component="span" sx={{ fontSize: '0.78rem', color: tokens.text.muted, ml: 1, fontWeight: 600 }}>
                                      {task.currentValue} / {task.targetValue}
                                    </Typography>
                                  )}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.3 }}>
                                  <Chip
                                    label={task.kind === 'sales' ? 'Sales' : 'Daily'}
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', color: tokens.text.secondary }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.brand.accent }}>
                                <span style={{ fontWeight: 500, color: tokens.text.muted, fontSize: '0.72rem', marginRight: 4 }}>Date:</span>
                                {formatTaskDate(task.dueDate, userTimeZone)}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Grid>

        {/* Column 2: Reminders & Deadlines (40%) */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, height: '100%' }}>
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

              {/* Reminders / upcoming meetings */}
              {upcomingMeetings.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 3, my: 'auto' }}>
                  <NotificationsNoneOutlinedIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.86rem', color: tokens.text.muted }}>
                    No upcoming meetings
                  </Typography>
                  <Typography 
                    onClick={() => navigate('/meetings')}
                    sx={{ fontWeight: 700, fontSize: '0.78rem', color: tokens.brand.accent, cursor: 'pointer', mt: 0.5, '&:hover': { textDecoration: 'underline' } }}
                  >
                    Create one →
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2 }}>
                  {upcomingMeetings.map((meeting: any) => (
                    <Box
                      key={meeting._id}
                      onClick={() => setSelectedMeetingModal(meeting)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.8,
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.12)' }} />
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.86rem', color: tokens.text.primary }}>
                            {meeting.title}
                          </Typography>
                          <Typography sx={{ fontWeight: 500, fontSize: '0.75rem', color: tokens.text.muted }}>
                            {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.brand.accent }}>
                        {formatShortDate(meeting.scheduledAt)}
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

              {/* Deadlines */}
              {upcomingDeadlines.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 3, my: 'auto' }}>
                  <AccessTimeOutlinedIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.86rem', color: tokens.text.muted }}>
                    No upcoming deadlines
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {upcomingDeadlines.map((deadline) => (
                    <Box
                      key={deadline.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.8,
                        borderRadius: '12px',
                        bgcolor: 'rgba(0,0,0,0.006)',
                        border: '1px solid rgba(0,0,0,0.02)',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.015)',
                          borderColor: 'rgba(0,0,0,0.05)',
                          transform: 'translateX(2px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255,127,17,0.3)' }} />
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.86rem', color: tokens.text.primary }}>
                            {deadline.title || (deadline as any).taskTitle}
                          </Typography>
                          <Typography sx={{ fontWeight: 500, fontSize: '0.75rem', color: tokens.text.muted }}>
                            {deadline.userName}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.brand.accent }}>
                        {formatShortDate(deadline.date)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* 3. Team Connections & Charts Split View */}
      <TeamConnectionsSplitView />


      <MeetingDetailModal
        meeting={selectedMeetingModal}
        open={!!selectedMeetingModal}
        onClose={() => setSelectedMeetingModal(null)}
      />
    </Box>
  );
};

