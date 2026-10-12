import React, { useState } from 'react';
import { Box, Typography, Button, Grid, Avatar, Chip, InputBase, useTheme } from '@mui/material';
import LocalCafeOutlinedIcon from '@mui/icons-material/LocalCafeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { tokens } from '@/styles/tokens';

// --- Static Showcase Data from Real ERP Admin Dashboard ---

const velocityChartData = [
  { date: 'Mon', newLeads: 45, completed: 20 },
  { date: 'Tue', newLeads: 52, completed: 35 },
  { date: 'Wed', newLeads: 38, completed: 42 },
  { date: 'Thu', newLeads: 65, completed: 30 },
  { date: 'Fri', newLeads: 48, completed: 55 },
  { date: 'Sat', newLeads: 15, completed: 10 },
  { date: 'Sun', newLeads: 22, completed: 18 },
];

const teamProgressChartData = [
  { name: 'Huzaifa R.', doneTasks: 42, pendingTasks: 8, overdueTasks: 2 },
  { name: 'Sarah J.', doneTasks: 38, pendingTasks: 12, overdueTasks: 1 },
  { name: 'Marcus V.', doneTasks: 29, pendingTasks: 15, overdueTasks: 4 },
  { name: 'Elena R.', doneTasks: 34, pendingTasks: 6, overdueTasks: 0 },
];

const teamMembersData = [
  {
    id: 'u1',
    name: 'Huzaifa Rasheed',
    role: 'Lead Admin · Enterprise',
    initial: 'H',
    done: 42,
    pending: 8,
    overdue: 2,
    accent: '#5D1A89',
  },
  {
    id: 'u2',
    name: 'Sarah Jenkins',
    role: 'Senior SDR · Inbound',
    initial: 'S',
    done: 38,
    pending: 12,
    overdue: 1,
    accent: '#2563EB',
  },
  {
    id: 'u3',
    name: 'Marcus Vance',
    role: 'Account Executive · Mid-Market',
    initial: 'M',
    done: 29,
    pending: 15,
    overdue: 4,
    accent: '#FF7F11',
  },
  {
    id: 'u4',
    name: 'Elena Rostova',
    role: 'Sales Specialist · EMEA',
    initial: 'E',
    done: 34,
    pending: 6,
    overdue: 0,
    accent: '#10B981',
  },
];

const activeTasksList = [
  {
    id: 't1',
    title: 'Follow up with Apex Logistics',
    current: 14,
    target: 20,
    kind: 'sales',
    date: 'Oct 8, 2026',
    isOverdue: false,
  },
  {
    id: 't2',
    title: 'Q4 Enterprise Pipeline Audit',
    current: 8,
    target: 10,
    kind: 'sales',
    date: 'Oct 8, 2026',
    isOverdue: false,
  },
  {
    id: 't3',
    title: 'Client Demo - FinTech Global',
    current: 5,
    target: 10,
    kind: 'sales',
    date: 'Oct 6, 2026',
    isOverdue: true,
  },
  {
    id: 't4',
    title: 'Update Deal Terms - OmniRetail',
    current: 2,
    target: 5,
    kind: 'sales',
    date: 'Oct 5, 2026',
    isOverdue: true,
  },
];

const upcomingMeetingsList = [
  {
    id: 'm1',
    title: 'Product Walkthrough - Nexus Corp',
    time: '11:30 AM',
    date: 'Oct 9',
  },
  {
    id: 'm2',
    title: 'Contract Review - Vertex Dynamics',
    time: '02:00 PM',
    date: 'Oct 9',
  },
  {
    id: 'm3',
    title: 'Weekly Sales Alignment',
    time: '04:30 PM',
    date: 'Oct 10',
  },
];

const upcomingDeadlinesList = [
  {
    id: 'd1',
    title: 'Q4 Outreach Quota Target',
    assignee: 'Sarah Jenkins',
    date: 'Oct 12',
  },
  {
    id: 'd2',
    title: 'CRM Pipeline Clean & Sync',
    assignee: 'Marcus Vance',
    date: 'Oct 14',
  },
  {
    id: 'd3',
    title: 'Enterprise Proposal Submission',
    assignee: 'Elena Rostova',
    date: 'Oct 15',
  },
];

export const ShowcaseDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [activeDateFilter, setActiveDateFilter] = useState<string>('This Week');
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');

  const pipelineStats = [
    { label: 'TOTAL LEADS', val: '2,845', sub: '4 reps assigned' },
    { label: 'ACCEPTED', val: '142', sub: '78% of 182 sent' },
    { label: 'FOLLOW UPS', val: '38', sub: '12 awaiting reply' },
    { label: 'CALLS DIALED', val: '185', sub: 'Cold outreach' },
    { label: 'CALL FOLLOW UPS', val: '42', sub: 'Responses' },
    { label: 'REPLIED', val: '94', sub: '45% positive' },
    { label: 'NOT SENT', val: '18', sub: '<1% pipeline' },
    { label: 'QUALIFIED', val: '28', sub: 'Enterprise ready' },
  ];

  const filteredMembers = teamMembersData.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const cardBackground = isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
  const innerCardBg = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.012)';
  const innerCardBorder = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.035)';

  const chartAxisProps = {
    stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
    tick: {
      fill: isDark ? 'rgba(255,255,255,0.5)' : tokens.text.muted,
      fontSize: 10,
      fontWeight: 600,
    },
    tickLine: false,
    axisLine: false,
  };
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 1. Header Greeting & Stylized Date Row */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              letterSpacing: '-0.025em',
              mb: 0.25,
              color: isDark ? '#FFFFFF' : tokens.text.primary,
            }}
          >
            Good evening, Huzaifa Rasheed
          </Typography>
          <Typography
            sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
              fontSize: '0.78rem',
            }}
          >
            Here&apos;s what&apos;s happening at{' '}
            <Box component="span" sx={{ fontWeight: 750, color: isDark ? '#FFFFFF' : tokens.text.primary }}>
              Leapsofts
            </Box>{' '}
            today.
          </Typography>
        </Box>

        {/* Stylized Date Pill */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            borderRadius: '16px',
            px: 1.5,
            py: 0.45,
            boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.02)',
            userSelect: 'none',
          }}
        >
          <Typography
            sx={{
              fontWeight: 850,
              fontSize: '0.68rem',
              color: '#FF7F11',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: 1,
            }}
          >
            WED
          </Typography>
          <Box sx={{ width: '1px', height: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
          <Typography
            sx={{
              fontWeight: 850,
              fontSize: '1.15rem',
              color: isDark ? '#FFFFFF' : tokens.text.primary,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            7
          </Typography>
          <Box sx={{ width: '1px', height: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.72rem',
              color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              lineHeight: 1,
            }}
          >
            Oct 2026
          </Typography>
        </Box>
      </Box>

      {/* 2. Zen Focus Banner */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: '16px',
          bgcolor: cardBackground,
          border: `1px solid ${cardBorder}`,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              flexShrink: 0,
            }}
          >
            <LocalCafeOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontWeight: 750,
                fontSize: '0.86rem',
                color: isDark ? '#FFFFFF' : tokens.text.primary,
                letterSpacing: '-0.01em',
              }}
            >
              Your schedule is clear!
            </Typography>
            <Typography
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.5)' : tokens.text.secondary,
                fontWeight: 500,
                fontSize: '0.72rem',
              }}
            >
              Enjoy your focus time or knock out some pending tasks.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
          sx={{
            borderRadius: '14px',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(93, 26, 137, 0.18)',
            color: tokens.brand.primary,
            fontWeight: 750,
            fontSize: '0.72rem',
            textTransform: 'none',
            px: 1.8,
            py: 0.4,
            whiteSpace: 'nowrap',
          }}
        >
          Go to Tasks
        </Button>
      </Box>

      {/* 3. Pipeline Overview Card (8 KPI Counters) */}
      <Box
        sx={{
          p: 1.75,
          borderRadius: '18px',
          bgcolor: cardBackground,
          border: `1px solid ${cardBorder}`,
        }}
      >
        {/* Header bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.4,
                bgcolor: 'rgba(255, 127, 17, 0.08)',
                color: '#FF7F11',
                border: '1px solid rgba(255, 127, 17, 0.25)',
                borderRadius: '999px',
                px: 1,
                py: 0.2,
                fontSize: '0.6rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              <FlashOnIcon sx={{ fontSize: 11 }} />
              PIPELINE OVERVIEW
            </Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.82rem',
                color: isDark ? '#FFFFFF' : tokens.text.primary,
              }}
            >
              Team pipeline · All leads
            </Typography>
          </Box>

          <Button
            size="small"
            endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
            sx={{
              borderRadius: '14px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
              color: isDark ? '#FFFFFF' : tokens.text.primary,
              fontWeight: 700,
              fontSize: '0.72rem',
              textTransform: 'none',
              px: 1.5,
              py: 0.35,
            }}
          >
            Open Sales
          </Button>
        </Box>

        {/* 8 KPI Metric Cards Grid */}
        <Grid container spacing={1.25}>
          {pipelineStats.map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: '12px',
                  bgcolor: innerCardBg,
                  border: `1px solid ${innerCardBorder}`,
                  minHeight: '72px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.54rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: isDark ? 'rgba(255, 255, 255, 0.4)' : tokens.text.muted,
                  }}
                >
                  {stat.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1.25rem',
                    fontWeight: 850,
                    lineHeight: 1.1,
                    my: 0.25,
                    color: isDark ? '#FFFFFF' : tokens.text.primary,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stat.val}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.58rem',
                    fontWeight: 500,
                    color: isDark ? 'rgba(255, 255, 255, 0.45)' : tokens.text.secondary,
                  }}
                >
                  {stat.sub || ' '}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 4. Section: My Tasks & Deadlines Bento Grid */}
      <Grid container spacing={1.75} alignItems="stretch">
        {/* Column 1: My Tasks (60%) */}
        <Grid item xs={12} md={7} sx={{ display: 'flex' }}>
          <Box
            sx={{
              p: 1.75,
              borderRadius: '18px',
              bgcolor: cardBackground,
              border: `1px solid ${cardBorder}`,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  color: isDark ? '#FFFFFF' : tokens.text.primary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  letterSpacing: '-0.01em',
                }}
              >
                <CheckCircleOutlinedIcon sx={{ color: '#FF7F11', fontSize: 18 }} />
                My Tasks
              </Typography>
              <Typography
                sx={{
                  color: tokens.brand.primary,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                View all ({activeTasksList.length}) &gt;
              </Typography>
            </Box>

            {/* Task rows */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
              {activeTasksList.map((task) => (
                <Box
                  key={task.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.1,
                    borderRadius: '12px',
                    bgcolor: task.isOverdue
                      ? isDark
                        ? 'rgba(239, 68, 68, 0.06)'
                        : 'rgba(239, 68, 68, 0.03)'
                      : innerCardBg,
                    border: `1px solid ${
                      task.isOverdue
                        ? isDark
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(239, 68, 68, 0.14)'
                        : innerCardBorder
                    }`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateX(2px)',
                      borderColor: task.isOverdue ? tokens.semantic.error : tokens.brand.primaryMuted,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        bgcolor: task.isOverdue ? tokens.semantic.error : tokens.semantic.success,
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Typography
                          noWrap
                          sx={{
                            fontWeight: 650,
                            fontSize: '0.78rem',
                            color: isDark ? '#FFFFFF' : tokens.text.primary,
                          }}
                        >
                          {task.title}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: '0.68rem',
                            color: isDark ? 'rgba(255, 255, 255, 0.45)' : tokens.text.muted,
                            fontWeight: 700,
                          }}
                        >
                          {task.current} / {task.target}
                        </Typography>
                      </Box>
                      {task.kind && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.2 }}>
                          <Chip
                            label="Sales"
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.58rem',
                              fontWeight: 750,
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                              color: isDark ? 'rgba(255, 255, 255, 0.7)' : tokens.text.secondary,
                            }}
                          />
                          {task.isOverdue && (
                            <Typography
                              sx={{
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                color: tokens.semantic.error,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.3,
                              }}
                            >
                              <WarningAmberOutlinedIcon sx={{ fontSize: 11 }} /> Overdue
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      fontWeight: 750,
                      fontSize: '0.72rem',
                      color: task.isOverdue ? tokens.semantic.error : tokens.semantic.success,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      ml: 1,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 500,
                        color: isDark ? 'rgba(255,255,255,0.4)' : tokens.text.muted,
                        fontSize: '0.64rem',
                        marginRight: 4,
                      }}
                    >
                      Date:
                    </span>
                    {task.date}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>

        {/* Column 2: Upcoming Meetings & Deadlines (40%) */}
        <Grid item xs={12} md={5} sx={{ display: 'flex' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
            {/* Upcoming Meetings Card */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: '16px',
                bgcolor: cardBackground,
                border: `1px solid ${cardBorder}`,
                flex: 1,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    color: isDark ? '#FFFFFF' : tokens.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.6,
                    letterSpacing: '-0.01em',
                  }}
                >
                  <NotificationsNoneOutlinedIcon sx={{ color: '#FF7F11', fontSize: 17 }} />
                  Upcoming Meetings
                </Typography>
                <Typography
                  sx={{
                    color: tokens.brand.primary,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  View all &gt;
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {upcomingMeetingsList.map((m) => (
                  <Box
                    key={m.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 0.9,
                      borderRadius: '10px',
                      bgcolor: innerCardBg,
                      border: `1px solid ${innerCardBorder}`,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        noWrap
                        sx={{
                          fontWeight: 650,
                          fontSize: '0.75rem',
                          color: isDark ? '#FFFFFF' : tokens.text.primary,
                        }}
                      >
                        {m.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.64rem',
                          color: isDark ? 'rgba(255, 255, 255, 0.45)' : tokens.text.muted,
                        }}
                      >
                        {m.time}
                      </Typography>
                    </Box>
                    <Chip
                      label={m.date}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: 'rgba(255, 127, 17, 0.08)',
                        color: '#FF7F11',
                        border: '1px solid rgba(255, 127, 17, 0.2)',
                        flexShrink: 0,
                        ml: 1,
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Upcoming Deadlines Card */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: '16px',
                bgcolor: cardBackground,
                border: `1px solid ${cardBorder}`,
                flex: 1,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    color: isDark ? '#FFFFFF' : tokens.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.6,
                    letterSpacing: '-0.01em',
                  }}
                >
                  <AccessTimeOutlinedIcon sx={{ color: '#FF7F11', fontSize: 17 }} />
                  Upcoming Deadlines
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {upcomingDeadlinesList.map((d) => (
                  <Box
                    key={d.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 0.9,
                      borderRadius: '10px',
                      bgcolor: innerCardBg,
                      border: `1px solid ${innerCardBorder}`,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        noWrap
                        sx={{
                          fontWeight: 650,
                          fontSize: '0.75rem',
                          color: isDark ? '#FFFFFF' : tokens.text.primary,
                        }}
                      >
                        {d.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.64rem',
                          color: isDark ? 'rgba(255, 255, 255, 0.45)' : tokens.text.muted,
                        }}
                      >
                        {d.assignee}
                      </Typography>
                    </Box>
                    <Chip
                      label={d.date}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                        color: isDark ? '#FFFFFF' : tokens.text.primary,
                        flexShrink: 0,
                        ml: 1,
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* 5. Section: Team Tasks & Team Progress Split View */}
      <Grid container spacing={1.75} alignItems="stretch">
        {/* Left: Team Tasks Member List */}
        <Grid item xs={12} lg={6}>
          <Box
            sx={{
              p: 1.75,
              borderRadius: '18px',
              bgcolor: cardBackground,
              border: `1px solid ${cardBorder}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <GroupsOutlinedIcon sx={{ color: tokens.brand.primary, fontSize: 20 }} />
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    color: isDark ? '#FFFFFF' : tokens.text.primary,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Team Tasks
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : tokens.text.muted,
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  mt: 0.2,
                }}
              >
                Done, pending, and overdue KPIs by member
              </Typography>
            </Box>

            {/* Search Bar & Date Filter Pills */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: innerCardBg,
                  borderRadius: '12px',
                  px: 1.25,
                  py: 0.4,
                  border: `1px solid ${innerCardBorder}`,
                }}
              >
                <SearchIcon sx={{ color: isDark ? 'rgba(255,255,255,0.35)' : tokens.text.muted, fontSize: 16, mr: 1 }} />
                <InputBase
                  placeholder="Search team member..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  fullWidth
                  sx={{
                    color: isDark ? '#FFFFFF' : tokens.text.primary,
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    '& input::placeholder': {
                      color: isDark ? 'rgba(255,255,255,0.35)' : tokens.text.muted,
                      opacity: 1,
                    },
                  }}
                />
              </Box>

              {/* Date Filter Pills */}
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {['Today', 'This Week', 'This Month', 'All Time'].map((label) => {
                  const isActive = activeDateFilter === label;
                  return (
                    <Box
                      key={label}
                      onClick={() => setActiveDateFilter(label)}
                      sx={{
                        px: 1.2,
                        py: 0.35,
                        borderRadius: '12px',
                        fontSize: '0.65rem',
                        fontWeight: 750,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        bgcolor: isActive
                          ? isDark
                            ? 'rgba(93, 26, 137, 0.25)'
                            : 'rgba(93, 26, 137, 0.1)'
                          : 'transparent',
                        color: isActive
                          ? isDark
                            ? '#E8D9F2'
                            : tokens.brand.primary
                          : isDark
                          ? 'rgba(255, 255, 255, 0.5)'
                          : tokens.text.secondary,
                        border: `1px solid ${
                          isActive
                            ? isDark
                              ? 'rgba(93, 26, 137, 0.5)'
                              : 'rgba(93, 26, 137, 0.25)'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.06)'
                        }`,
                      }}
                    >
                      {label}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Member KPI List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.9, flex: 1 }}>
              {filteredMembers.map((member) => (
                <Box
                  key={member.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    borderRadius: '12px',
                    bgcolor: innerCardBg,
                    border: `1px solid ${innerCardBorder}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: isDark ? 'rgba(93, 26, 137, 0.3)' : 'rgba(93, 26, 137, 0.1)',
                        color: isDark ? '#E8D9F2' : tokens.brand.primary,
                        fontWeight: 800,
                        fontSize: '0.8rem',
                      }}
                    >
                      {member.initial}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        noWrap
                        sx={{
                          fontWeight: 750,
                          color: isDark ? '#FFFFFF' : tokens.text.primary,
                          fontSize: '0.78rem',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {member.name}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{
                          fontWeight: 500,
                          color: isDark ? 'rgba(255,255,255,0.45)' : tokens.text.muted,
                          fontSize: '0.64rem',
                        }}
                      >
                        {member.role}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Done / Pending / Overdue Columns */}
                  <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', flexShrink: 0, ml: 1 }}>
                    <Box sx={{ textAlign: 'center', minWidth: 28 }}>
                      <Typography
                        sx={{
                          fontWeight: 850,
                          fontSize: '0.82rem',
                          color: tokens.semantic.success,
                          lineHeight: 1.1,
                        }}
                      >
                        {member.done}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 750,
                          fontSize: '0.52rem',
                          color: isDark ? 'rgba(255,255,255,0.4)' : tokens.text.muted,
                          textTransform: 'uppercase',
                        }}
                      >
                        Done
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', minWidth: 28 }}>
                      <Typography
                        sx={{
                          fontWeight: 850,
                          fontSize: '0.82rem',
                          color: tokens.semantic.warning,
                          lineHeight: 1.1,
                        }}
                      >
                        {member.pending}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 750,
                          fontSize: '0.52rem',
                          color: isDark ? 'rgba(255,255,255,0.4)' : tokens.text.muted,
                          textTransform: 'uppercase',
                        }}
                      >
                        Pend
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', minWidth: 28 }}>
                      <Typography
                        sx={{
                          fontWeight: 850,
                          fontSize: '0.82rem',
                          color: tokens.semantic.error,
                          lineHeight: 1.1,
                        }}
                      >
                        {member.overdue}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 750,
                          fontSize: '0.52rem',
                          color: isDark ? 'rgba(255,255,255,0.4)' : tokens.text.muted,
                          textTransform: 'uppercase',
                        }}
                      >
                        Due
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>

        {/* Right: Team Progress Grouped Bar Chart */}
        <Grid item xs={12} lg={6}>
          <Box
            sx={{
              p: 1.75,
              borderRadius: '18px',
              bgcolor: cardBackground,
              border: `1px solid ${cardBorder}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                mb: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <BarChartOutlinedIcon sx={{ color: tokens.brand.primary, fontSize: 20 }} />
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      color: isDark ? '#FFFFFF' : tokens.text.primary,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Team Progress
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.5)' : tokens.text.muted,
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    mt: 0.2,
                  }}
                >
                  Compare individual KPI task status
                </Typography>
              </Box>

              <Chip
                label="This Month"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.64rem',
                  fontWeight: 750,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  color: isDark ? '#FFFFFF' : tokens.text.primary,
                  borderRadius: '8px',
                }}
              />
            </Box>

            <Box sx={{ width: '100%', height: 210, mt: 'auto' }}>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={teamProgressChartData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  barCategoryGap="24%"
                  barGap={4}
                  maxBarSize={18}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" {...chartAxisProps} dy={6} />
                  <YAxis {...chartAxisProps} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(24, 20, 32, 0.95)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                      borderRadius: 10,
                      fontSize: '11px',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 650, paddingTop: '10px' }} />
                  <Bar dataKey="doneTasks" name="Done" fill={tokens.semantic.success} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="pendingTasks" name="Pending" fill={tokens.semantic.warning} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="overdueTasks" name="Overdue" fill={tokens.semantic.error} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* 6. Section: Pipeline Velocity (Area Chart) */}
      <Box
        sx={{
          p: 1.75,
          borderRadius: '18px',
          bgcolor: cardBackground,
          border: `1px solid ${cardBorder}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <TrendingUpIcon sx={{ color: tokens.brand.primary, fontSize: 20 }} />
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '0.94rem',
                  color: isDark ? '#FFFFFF' : tokens.text.primary,
                  letterSpacing: '-0.01em',
                }}
              >
                Pipeline Velocity
              </Typography>
            </Box>
            <Typography
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.5)' : tokens.text.muted,
                fontSize: '0.72rem',
                fontWeight: 500,
                mt: 0.2,
              }}
            >
              New leads vs completed tasks over time (7 days)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tokens.brand.primary }} />
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                New Leads (+14%)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tokens.semantic.success }} />
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                Tasks Completed (+28%)
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ width: '100%', height: 210 }}>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={velocityChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="showcaseColorNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={tokens.brand.primary} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={tokens.brand.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="showcaseColorComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={tokens.semantic.success} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={tokens.semantic.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="date" {...chartAxisProps} dy={6} />
              <YAxis {...chartAxisProps} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? 'rgba(24, 20, 32, 0.95)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  borderRadius: 10,
                  fontSize: '11px',
                }}
              />
              <Area
                type="monotone"
                name="New Leads"
                dataKey="newLeads"
                stroke={tokens.brand.primary}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#showcaseColorNew)"
              />
              <Area
                type="monotone"
                name="Tasks Completed"
                dataKey="completed"
                stroke={tokens.semantic.success}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#showcaseColorComp)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
};
