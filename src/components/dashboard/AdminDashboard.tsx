import { useState, useEffect } from 'react';
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
  MenuItem
} from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAdminDashboard } from '@/hooks/api/useDashboard';
import { useTeamAnalysis } from '@/hooks/api/useAdminTeamDashboard';
import { useMeetings } from '@/hooks/api/useMeetings';
import { tokens } from '@/styles/tokens';
import { useNavigate } from 'react-router-dom';
import { StatCardSkeleton, ChartSkeleton } from './DashboardSkeletons';
import { TeamConnectionsSplitView } from './TeamConnectionsSplitView';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: todaySales, isLoading: isTodaySalesLoading, refetch } = useAdminDashboard();
  const { data: teamAnalysis, isLoading: isTeamAnalysisLoading } = useTeamAnalysis('week');
  const { data: allMeetings = [] } = useMeetings();

  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [logType, setLogType] = useState('connection');
  const [logCount, setLogCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (isTodaySalesLoading || isTeamAnalysisLoading) {
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

  const formatShortDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const tasksOverview = teamAnalysis?.tasks;
  const tasksList = tasksOverview?.items ?? [];
  const totalTasksCount = tasksOverview?.total ?? 0;
  const boardLabel = tasksOverview?.boardName?.toUpperCase() ?? 'TEAM BOARD';

  const upcomingMeetings = allMeetings
    .filter((m: any) => new Date(m.scheduledAt) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  const upcomingDeadlines = teamAnalysis?.deadlines ?? [];

  const analysisMetrics = [
    { label: 'Done this week', count: teamAnalysis?.metrics.doneThisWeek ?? 0, color: tokens.semantic.success, bg: 'rgba(45, 138, 94, 0.03)', border: 'rgba(45, 138, 94, 0.08)' },
    { label: 'Moved', count: teamAnalysis?.metrics.moved ?? 0, color: tokens.brand.accent, bg: 'rgba(255, 127, 17, 0.03)', border: 'rgba(255, 127, 17, 0.08)' },
    { label: 'Overdue', count: teamAnalysis?.metrics.overdue ?? 0, color: tokens.brand.accent, bg: 'rgba(255, 127, 17, 0.03)', border: 'rgba(255, 127, 17, 0.08)' },
    { label: 'Idle members', count: teamAnalysis?.metrics.idleMembers ?? 0, color: tokens.brand.accent, bg: 'rgba(255, 127, 17, 0.03)', border: 'rgba(255, 127, 17, 0.08)' },
  ];

  const attentionCount = teamAnalysis?.metrics.attentionCount ?? 0;

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const todaySalesStats = [
    {
      label: 'NEW LEADS',
      val: todaySales?.newLeads ?? 0,
      sub: todaySales?.activeReps ? `${todaySales.activeReps} reps active` : undefined,
      action: 'scroll' as const,
      target: 'team-connections-split',
    },
    {
      label: 'CONNECTIONS SENT',
      val: todaySales?.connectionsSent ?? 0,
      sub: todaySales?.connectionsAccepted
        ? `${todaySales.connectionsAccepted} accepted`
        : undefined,
      action: 'scroll' as const,
      target: 'team-connections-split',
    },
    {
      label: 'ACCEPT RATE',
      val: `${todaySales?.acceptanceRate ?? 0}%`,
      sub: todaySales?.connectionsSent ? `of ${todaySales.connectionsSent} sent` : undefined,
    },
    {
      label: 'MESSAGES SENT',
      val: todaySales?.messagesSent ?? 0,
      sub: todaySales?.replies ? `${todaySales.replies} replies` : undefined,
    },
    {
      label: 'REPLY RATE',
      val: `${todaySales?.replyRate ?? 0}%`,
      sub: todaySales?.messagesSent ? `${todaySales.messagesSent} outreach` : undefined,
    },
    {
      label: 'MEETINGS TODAY',
      val: todaySales?.meetingsToday ?? 0,
      sub: todaySales?.qualified ? `${todaySales.qualified} qualified leads` : undefined,
      action: 'navigate' as const,
      target: '/meetings',
    },
  ];

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
                  TODAY IN PIPELINE
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: tokens.text.primary, letterSpacing: '-0.01em' }}>
                Team sales · {todayLabel}
              </Typography>
            </Box>
          </Box>

          {/* Quick Actions Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="contained"
              onClick={() => setQuickLogOpen(true)}
              disableElevation
              sx={{
                background: `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.accentLight} 100%)`,
                color: '#fff',
                fontWeight: 700,
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                borderRadius: '16px',
                px: { xs: 1.5, sm: 2.2 },
                py: { xs: 0.6, sm: 0.8 },
                textTransform: 'none',
                whiteSpace: 'nowrap',
                gap: 1.2,
                boxShadow: '0 4px 10px rgba(255, 127, 17, 0.12)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  background: `linear-gradient(135deg, ${tokens.brand.accentDark} 0%, ${tokens.brand.accent} 100%)`,
                  boxShadow: '0 6px 15px rgba(255, 127, 17, 0.22)',
                  transform: 'translateY(-0.5px)'
                }
              }}
            >
              Quick log
              <Typography 
                component="span"
                sx={{ 
                  fontSize: '0.62rem', 
                  bgcolor: 'rgba(255,255,255,0.22)', 
                  px: 0.8, 
                  py: 0.2, 
                  borderRadius: '6px',
                  fontWeight: 800
                }}
              >
                ⌘L
              </Typography>
            </Button>

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
          {todaySales?.newLeads
            ? `${todaySales.newLeads} lead${todaySales.newLeads === 1 ? '' : 's'} logged today across ${todaySales.activeReps} rep${todaySales.activeReps === 1 ? '' : 's'}.`
            : 'No leads logged yet today — open Sales to update the pipeline or use ⌘L to quick-log activity.'}
        </Typography>

        {/* Inline statistics counters (Admin stats) - Soft UI card style */}
        <Grid container spacing={2.5} sx={{ borderTop: `1px solid ${tokens.surface.borderLight}`, pt: 3.5 }}>
          {todaySalesStats.map((stat) => (
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

      {/* 2. Team Connections & Charts Split View */}
      <TeamConnectionsSplitView />

      {/* 3. Team Analysis & Warnings Section */}
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
            Team Analysis · this week
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
            Open Insights &gt;
          </Button>
        </Box>

        {/* Analysis numbers row */}
        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          {analysisMetrics.map((item) => (
            <Grid item xs={6} sm={3} key={item.label}>
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

        {/* HEADS UP Warnings Alert */}
        <Box
          onClick={() => navigate('/team/insights')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderRadius: '16px',
            bgcolor: 'rgba(255, 127, 17, 0.03)',
            border: '1px solid rgba(255, 127, 17, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              bgcolor: 'rgba(255, 127, 17, 0.06)',
              borderColor: 'rgba(255, 127, 17, 0.18)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WarningAmberOutlinedIcon sx={{ color: tokens.brand.accent }} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.62rem', letterSpacing: '0.08em', color: tokens.brand.accent }}>
                HEADS-UP
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '0.86rem', color: tokens.text.primary, letterSpacing: '-0.01em' }}>
                {attentionCount === 1
                  ? '1 thing needs attention'
                  : `${attentionCount} things need attention`}
              </Typography>
            </Box>
          </Box>
          <ChevronRightIcon sx={{ color: tokens.text.muted }} />
        </Box>
      </Box>



      {/* 5. Bottom Grid */}
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
                Team Tasks Overview
              </Typography>
              <Button 
                variant="text" 
                onClick={() => navigate('/board')}
                sx={{ 
                  textTransform: 'none', 
                  color: tokens.text.muted, 
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  '&:hover': { color: tokens.brand.primary } 
                }}
              >
                View all ({totalTasksCount}) &gt;
              </Button>
            </Box>

            {/* Board header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, px: 0.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: tokens.text.muted, letterSpacing: '0.04em' }}>
                {boardLabel}
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.text.muted }}>
                {totalTasksCount}
              </Typography>
            </Box>

            {/* Task list entries */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2 }}>
              {tasksList.length === 0 ? (
                <Typography sx={{ fontWeight: 600, fontSize: '0.86rem', color: tokens.text.muted, py: 2, textAlign: 'center' }}>
                  No open team tasks
                </Typography>
              ) : tasksList.map((task) => (
                <Box
                  key={task.id}
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
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.12)' }} />
                    <Typography sx={{ fontWeight: 600, fontSize: '0.86rem', color: tokens.text.primary }}>
                      {task.title}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.brand.accent }}>
                    {formatShortDate(task.date)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Bottom load link */}
            {totalTasksCount > tasksList.length && (
            <Typography
              onClick={() => navigate('/board')}
              sx={{
                mt: 'auto',
                pt: 1,
                fontSize: '0.82rem',
                fontWeight: 700,
                color: tokens.text.muted,
                cursor: 'pointer',
                transition: 'color 0.2s',
                '&:hover': { color: tokens.brand.primary }
              }}
            >
              +{totalTasksCount - tasksList.length} more in this project →
            </Typography>
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
                  Reminders
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
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  py: 4,
                  flex: 1
                }}
              >
                <NotificationsNoneOutlinedIcon sx={{ color: 'rgba(0,0,0,0.1)', fontSize: 40, mb: 1.5 }} />
                <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: tokens.text.muted, mb: 0.5 }}>
                  No upcoming reminders
                </Typography>
                <Typography 
                  onClick={() => navigate('/meetings')}
                  sx={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    color: tokens.brand.accent,
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Create one →
                </Typography>
              </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2 }}>
                  {upcomingMeetings.map((meeting: any) => (
                    <Box
                      key={meeting._id}
                      onClick={() => meeting.meetingLink && window.open(meeting.meetingLink, '_blank')}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.8,
                        borderRadius: '12px',
                        bgcolor: 'rgba(0,0,0,0.006)',
                        border: '1px solid rgba(0,0,0,0.02)',
                        cursor: meeting.meetingLink ? 'pointer' : 'default',
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
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  py: 4,
                  flex: 1
                }}
              >
                <AccessTimeOutlinedIcon sx={{ color: 'rgba(0,0,0,0.1)', fontSize: 40, mb: 1.5 }} />
                <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: tokens.text.muted }}>
                  No upcoming deadlines
                </Typography>
              </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2 }}>
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
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255, 127, 17, 0.35)' }} />
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.86rem', color: tokens.text.primary }}>
                            {deadline.title}
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
            Quickly log actions taken in your team pipeline. This will instantly update your dashboard metrics.
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
    </Box>
  );
};

