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
import { useKanbanBoards } from '@/hooks/api/useKanban';
import { tokens } from '@/styles/tokens';
import { useNavigate } from 'react-router-dom';
import { StatCardSkeleton, ChartSkeleton } from './DashboardSkeletons';
import { TeamConnectionsSplitView } from './TeamConnectionsSplitView';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading, refetch } = useAdminDashboard();
  const { data: boards } = useKanbanBoards();

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

  // Extract real kanban cards or fallback to screenshot mock data
  const allCards = boards?.[0]?.columns.flatMap(col => col.cards ?? []).filter(Boolean) || [];
  const tasksList = allCards.length > 0 
    ? allCards.slice(0, 3).map((card) => {
        if (!card) return null;
        const leadId = (card as any).leadId;
        const leadName = typeof leadId === 'object' && leadId 
          ? `${leadId.firstName || ''} ${leadId.lastName || ''}`.trim() || 'Unassigned Lead'
          : (card as any).title || 'Untitled Lead Task';
        const companyName = typeof leadId === 'object' && leadId?.company 
          ? ` - ${leadId.company}` 
          : '';
        
        const activityLog = (card as any).activityLog;
        const rawDate = activityLog?.[0]?.timestamp
          ? activityLog[0].timestamp
          : (typeof leadId === 'object' && leadId?.createdAt)
            ? leadId.createdAt
            : null;

        return {
          id: (card as any)._id || Math.random().toString(),
          title: `${leadName}${companyName}`,
          date: rawDate 
            ? new Date(rawDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : 'Mar 5'
        };
      }).filter(Boolean)
    : [
        { id: '1', title: 'Zubair Talib - Celara', date: 'Mar 5' },
        { id: '2', title: 'Blair Gatchel - Breva', date: 'Mar 5' },
        { id: '3', title: 'M. Badrawy - Pachin Paints', date: 'Mar 5' },
      ];

  const totalTasksCount = allCards.length > 0 ? allCards.length : 34;

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
                Your team · Active Sales Campaigns
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
          Team-wide activity log dashboard. Tap <strong style={{ color: tokens.text.primary, fontWeight: 700 }}>⌘L</strong> from anywhere — or click below — to manually log target achievements.
        </Typography>

        {/* Inline statistics counters (Admin stats) - Soft UI card style */}
        <Grid container spacing={2.5} sx={{ borderTop: `1px solid ${tokens.surface.borderLight}`, pt: 3.5 }}>
          {[
            { label: 'TEAM CONNECTIONS', val: stats?.connectionsSent ?? 0 },
            { label: 'ACCEPTANCE RATE', val: `${stats?.connectionsAccepted ?? 0}%` },
            { label: 'TEAM MESSAGES', val: stats?.messagesSent ?? 0 },
            { label: 'REPLIES', val: '18%' },
            { label: 'TEAM MEETINGS', val: stats?.meetingsScheduled ?? 0 }
          ].map((stat) => (
            <Grid item xs={6} sm={4} md={2.4} key={stat.label}>
              <Box
                onClick={() => {
                  if (stat.label === 'TEAM CONNECTIONS') {
                    document.getElementById('team-connections-split')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                sx={{
                  p: 2.2,
                  borderRadius: '16px',
                  bgcolor: 'rgba(0,0,0,0.008)',
                  border: '1px solid rgba(0,0,0,0.015)',
                  cursor: stat.label === 'TEAM CONNECTIONS' ? 'pointer' : 'default',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    bgcolor: stat.label === 'TEAM CONNECTIONS' ? 'rgba(59, 130, 246, 0.04)' : 'rgba(0,0,0,0.015)',
                    borderColor: stat.label === 'TEAM CONNECTIONS' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.03)',
                    transform: 'translateY(-1px)',
                    boxShadow: stat.label === 'TEAM CONNECTIONS' ? '0 6px 16px rgba(59, 130, 246, 0.08)' : '0 4px 12px rgba(0,0,0,0.01)'
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
          {[
            { label: 'Done this week', count: 5, color: tokens.semantic.success, bg: 'rgba(45, 138, 94, 0.03)', border: 'rgba(45, 138, 94, 0.08)' },
            { label: 'Moved', count: 12, color: tokens.brand.accent, bg: 'rgba(255, 127, 17, 0.03)', border: 'rgba(255, 127, 17, 0.08)' },
            { label: 'Overdue', count: 38, color: tokens.brand.accent, bg: 'rgba(255, 127, 17, 0.03)', border: 'rgba(255, 127, 17, 0.08)' },
            { label: 'Idle members', count: 3, color: tokens.brand.accent, bg: 'rgba(255, 127, 17, 0.03)', border: 'rgba(255, 127, 17, 0.08)' }
          ].map((item) => (
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
                8 things need attention
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
                LEAPSOFTS-LEAD-BOARD
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.text.muted }}>
                {totalTasksCount}
              </Typography>
            </Box>

            {/* Task list entries */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2 }}>
              {tasksList.map((task) => task && (
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
                    {task.date}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Bottom load link */}
            <Typography
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

              {/* Reminders Empty state */}
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

              {/* Deadlines Empty state */}
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

