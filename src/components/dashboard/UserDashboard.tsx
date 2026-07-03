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
import { useDashboard } from '@/hooks/api/useDashboard';
import { useKanbanBoards } from '@/hooks/api/useKanban';
import { useMeetings } from '@/hooks/api/useMeetings';
import { tokens } from '@/styles/tokens';
import { useNavigate } from 'react-router-dom';
import { StatCardSkeleton, ChartSkeleton } from './DashboardSkeletons';

export const UserDashboard = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading, refetch } = useDashboard();
  const { data: boards } = useKanbanBoards();
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

  // Meetings for Upcoming Meetings section
  const upcomingMeetings = allMeetings
    .filter((m: any) => new Date(m.scheduledAt) >= new Date(new Date().setHours(0,0,0,0)))
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
      {/* 1. Today in Pipeline Card */}
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
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 2.5
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
                My Pipeline · {stats?.metrics?.pendingTasks || 0} active items
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Inline statistics counters - Soft UI card style */}
        <Grid container spacing={2.5} sx={{ borderTop: `1px solid ${tokens.surface.borderLight}`, pt: 2.5 }}>
          {(stats?.kpiChartData && stats.kpiChartData.length > 0
            ? stats.kpiChartData.map((kpi) => ({
                label: kpi.name.toUpperCase(),
                val: kpi.Achieved,
                target: kpi.Target,
              }))
            : [
                { label: 'COMPLETED KPIS', val: stats?.metrics?.completedKpis || 0, target: undefined },
              ]
          ).map((stat) => (
            <Grid item xs={6} sm={4} md={2.4} key={stat.label}>
              <Box
                sx={{
                  p: 2.2,
                  borderRadius: '16px',
                  bgcolor: 'rgba(0,0,0,0.008)',
                  border: '1px solid rgba(0,0,0,0.015)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.015)',
                    borderColor: 'rgba(0,0,0,0.03)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
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
                {'target' in stat && stat.target != null && stat.target > 0 && (
                  <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 600, mt: 0.5, display: 'block' }}>
                    of {stat.target} target
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 2. Secondary Widgets Grid */}
      {false && (
      <Grid container spacing={3.5}>
        {/* Active Projects */}
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: tokens.surface.card,
              border: `1px solid ${tokens.surface.border}`,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              height: '100%',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                boxShadow: '0 10px 30px rgba(26, 22, 37, 0.03)',
                borderColor: 'rgba(0,0,0,0.06)'
              }
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, fontSize: '0.76rem' }}>
                Active Projects
              </Typography>
              <Typography sx={{ fontSize: '2rem', fontWeight: 850, color: tokens.text.primary, my: 0.8, lineHeight: 1, letterSpacing: '-0.02em' }}>
                1
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: 'rgba(45, 138, 94, 0.06)',
                  color: tokens.semantic.success,
                  borderRadius: '12px',
                  px: 1.2,
                  py: 0.3,
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                ↗ 2 new this quarter
              </Box>
            </Box>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(93, 26, 137, 0.08) 0%, rgba(93, 26, 137, 0.01) 100%)',
                border: '1px solid rgba(93, 26, 137, 0.12)',
                color: tokens.brand.primary
              }}
            >
              <FolderOpenOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
          </Box>
        </Grid>

        {/* Tasks Completed */}
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: tokens.surface.card,
              border: `1px solid ${tokens.surface.border}`,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              height: '100%',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                boxShadow: '0 10px 30px rgba(26, 22, 37, 0.03)',
                borderColor: 'rgba(0,0,0,0.06)'
              }
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, fontSize: '0.76rem' }}>
                Tasks Completed
              </Typography>
              <Typography sx={{ fontSize: '2rem', fontWeight: 850, color: tokens.text.primary, my: 0.8, lineHeight: 1, letterSpacing: '-0.02em' }}>
                0
              </Typography>
              <Typography sx={{ color: tokens.text.muted, fontWeight: 700, fontSize: '0.76rem' }}>
                this week
              </Typography>
            </Box>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(45, 138, 94, 0.08) 0%, rgba(45, 138, 94, 0.01) 100%)',
                border: '1px solid rgba(45, 138, 94, 0.12)',
                color: tokens.semantic.success
              }}
            >
              <CheckCircleOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
          </Box>
        </Grid>

        {/* Pending Leaves */}
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: tokens.surface.card,
              border: `1px solid ${tokens.surface.border}`,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              height: '100%',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                boxShadow: '0 10px 30px rgba(26, 22, 37, 0.03)',
                borderColor: 'rgba(0,0,0,0.06)'
              }
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, fontSize: '0.76rem' }}>
                Pending Leaves
              </Typography>
              <Typography sx={{ fontSize: '2rem', fontWeight: 850, color: tokens.text.primary, my: 0.8, lineHeight: 1, letterSpacing: '-0.02em' }}>
                0
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', height: 16 }} />
            </Box>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(255, 127, 17, 0.08) 0%, rgba(255, 127, 17, 0.01) 100%)',
                border: '1px solid rgba(255, 127, 17, 0.12)',
                color: tokens.brand.accent
              }}
            >
              <AccessTimeOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
          </Box>
        </Grid>

        {/* Team Insights */}
        <Grid item xs={12} sm={6} md={3}>
          <Box
            onClick={() => navigate('/team/insights')}
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: tokens.surface.card,
              border: `1px solid ${tokens.surface.border}`,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                boxShadow: '0 10px 30px rgba(26, 22, 37, 0.03)',
                borderColor: tokens.brand.primaryMuted,
                transform: 'translateY(-1px)'
              }
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, fontSize: '0.76rem' }}>
                My Analytics
              </Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 850, color: tokens.text.primary, my: 0.8, display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 1, letterSpacing: '-0.015em' }}>
                Performance <span style={{ color: tokens.brand.accent }}>→</span>
              </Typography>
              <Typography sx={{ color: tokens.text.muted, fontWeight: 700, fontSize: '0.76rem' }}>
                Weekly analysis
              </Typography>
            </Box>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(196, 69, 69, 0.08) 0%, rgba(196, 69, 69, 0.01) 100%)',
                border: '1px solid rgba(196, 69, 69, 0.12)',
                color: tokens.semantic.error
              }}
            >
              <PeopleOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
          </Box>
        </Grid>
      </Grid>
      )}

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
            { label: 'Overdue', count: stats?.metrics?.overdueTasks || 0, color: tokens.semantic.error, bg: 'rgba(196, 69, 69, 0.03)', border: 'rgba(196, 69, 69, 0.08)' },
            { label: 'Completed KPIs', count: stats?.metrics?.completedKpis || 0, color: tokens.brand.primary, bg: 'rgba(93, 26, 137, 0.03)', border: 'rgba(93, 26, 137, 0.08)' }
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
                3 things need attention
              </Typography>
            </Box>
          </Box>
          <ChevronRightIcon sx={{ color: tokens.text.muted }} />
        </Box>
      </Box>

      {/* 4. Bottom Grid (Boards, Meetings) */}
      <Grid container spacing={3.5}>
        {/* Column 1: My Boards list (60%) */}
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
                My Boards
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
                View all ({totalBoardsCount}) &gt;
              </Button>
            </Box>

            {/* Board header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, px: 0.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: tokens.text.muted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                RECENT BOARDS
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: tokens.text.muted }}>
                {totalBoardsCount}
              </Typography>
            </Box>

            {/* Boards list entries */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2 }}>
              {boardsList.map((board: any) => (
                <Box
                  key={board._id}
                  onClick={() => navigate(`/board/${board._id}`)}
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
                    <Typography sx={{ fontWeight: 600, fontSize: '0.86rem', color: tokens.text.primary }}>
                      {board.name}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.brand.accent }}>
                    {board.columns?.length || 0} stages
                  </Typography>
                </Box>
              ))}
            </Box>

            {totalBoardsCount > boardsList.length && (
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
                +{totalBoardsCount - boardsList.length} more of your boards →
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
                    py: 4,
                    flex: 1
                  }}
                >
                  <NotificationsNoneOutlinedIcon sx={{ color: 'rgba(0,0,0,0.1)', fontSize: 40, mb: 1.5 }} />
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
    </Box>
  );
};


