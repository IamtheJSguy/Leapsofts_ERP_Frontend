import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Chip,
  IconButton,
  useTheme,
  LinearProgress,
  TextField,
  InputAdornment,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EventIcon from '@mui/icons-material/Event';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { tokens } from '@/styles/tokens';
import { PRIORITY_CONFIG, type KpiPriority } from '@/lib/priorityConfig';

// --- Data Models for Real ERP Showcase ---

interface ShowcaseTaskItem {
  id: string;
  title: string;
  description: string;
  priority: KpiPriority;
  status: 'active' | 'overdue' | 'done';
  completed: boolean;
  target?: number;
  current?: number;
  recurrence?: string;
  dueDate: string;
  assignedTo: string;
  kind?: 'sales' | 'dev' | 'ops';
}

const initialTasksData: ShowcaseTaskItem[] = [
  // Urgent
  {
    id: 'u1',
    title: 'Executive Sales Pipeline Outreach',
    description: 'Engage 20 enterprise prospects across Nordic & European logistics sector.',
    priority: 'urgent',
    status: 'overdue',
    completed: false,
    target: 20,
    current: 18,
    recurrence: 'Mon-Fri · weekly',
    dueDate: 'Due Yesterday, 6:00 PM',
    assignedTo: 'Huzaifa Rasheed',
    kind: 'sales',
  },
  {
    id: 'u2',
    title: 'SLA Contract Finalization - FinTech Global',
    description: 'Resolve legal review items and sign enterprise SLA addendum before kickoff.',
    priority: 'urgent',
    status: 'active',
    completed: false,
    target: 10,
    current: 5,
    dueDate: 'Due Today, 5:00 PM',
    assignedTo: 'Huzaifa Rasheed',
    kind: 'sales',
  },
  // High
  {
    id: 'h1',
    title: 'Client Follow-ups & Discovery Syncs',
    description: 'Conduct follow-ups on pending SLA contracts and qualify tier-1 proposals.',
    priority: 'high',
    status: 'done',
    completed: true,
    target: 15,
    current: 15,
    recurrence: 'Mon-Thu · weekly',
    dueDate: 'Due Today, 4:30 PM',
    assignedTo: 'Sarah Jenkins',
    kind: 'sales',
  },
  {
    id: 'h2',
    title: 'System Latency & Load Test Audit',
    description: 'Audit WebSocket real-time cluster for sub-30ms telemetry delivery.',
    priority: 'high',
    status: 'active',
    completed: false,
    recurrence: 'Wed · weekly',
    dueDate: 'Due Today, 7:00 PM',
    assignedTo: 'Alex Rivera',
    kind: 'ops',
  },
  {
    id: 'h3',
    title: 'Q4 Enterprise Prospecting Cadence',
    description: 'Validate Apollo lead enrichments and route high-fit accounts to SDR queue.',
    priority: 'high',
    status: 'active',
    completed: false,
    target: 25,
    current: 21,
    dueDate: 'Due Tomorrow, 11:00 AM',
    assignedTo: 'Elena Rostova',
    kind: 'sales',
  },
  // Medium
  {
    id: 'm1',
    title: 'Sprint 42 Code Review & Architecture Sync',
    description: 'Review multi-tenant database indexing and data retention policies.',
    priority: 'medium',
    status: 'active',
    completed: false,
    recurrence: 'Tue, Thu · weekly',
    dueDate: 'Due Tomorrow, 2:00 PM',
    assignedTo: 'Marcus Vance',
    kind: 'dev',
  },
  {
    id: 'm2',
    title: 'Customer Feedback Synthesis & Roadmap',
    description: 'Aggregate user feedback tickets from Zendesk and Slack for sprint planning.',
    priority: 'medium',
    status: 'done',
    completed: true,
    target: 8,
    current: 8,
    dueDate: 'Due Oct 10, 5:00 PM',
    assignedTo: 'Huzaifa Rasheed',
    kind: 'ops',
  },
  // Low
  {
    id: 'l1',
    title: 'Documentation Update - REST API V2',
    description: 'Update Swagger/OpenAPI docs for the revised leads export webhook endpoints.',
    priority: 'low',
    status: 'active',
    completed: false,
    dueDate: 'Due Oct 12, 6:00 PM',
    assignedTo: 'Alex Rivera',
    kind: 'dev',
  },
];

const teamProgressMembers = [
  {
    id: 'tp1',
    name: 'Huzaifa Rasheed',
    role: 'Lead Admin · Enterprise',
    initial: 'H',
    completed: 42,
    total: 48,
    percentage: 88,
    done: 42,
    pending: 4,
    overdue: 2,
  },
  {
    id: 'tp2',
    name: 'Sarah Jenkins',
    role: 'Senior SDR · Inbound',
    initial: 'S',
    completed: 38,
    total: 41,
    percentage: 92,
    done: 38,
    pending: 2,
    overdue: 1,
  },
  {
    id: 'tp3',
    name: 'Marcus Vance',
    role: 'Account Executive · Mid-Market',
    initial: 'M',
    completed: 29,
    total: 39,
    percentage: 74,
    done: 29,
    pending: 6,
    overdue: 4,
  },
  {
    id: 'tp4',
    name: 'Elena Rostova',
    role: 'Sales Specialist · EMEA',
    initial: 'E',
    completed: 34,
    total: 36,
    percentage: 95,
    done: 34,
    pending: 2,
    overdue: 0,
  },
];

const kpiTemplatesData = [
  {
    id: 'tpl1',
    name: 'SDR Cold Outreach Cadence',
    kpisCount: 4,
    description: 'Standard operating procedure for outbound SDR enterprise discovery, LinkedIn connection touchpoints, and follow-up loops.',
    targetRoles: 'Sales SDRs',
  },
  {
    id: 'tpl2',
    name: 'Enterprise Account Executive Quota',
    kpisCount: 5,
    description: 'Quarterly pipeline velocity, contract negotiation closures, discovery calls, and executive presentation milestones.',
    targetRoles: 'Account Executives',
  },
  {
    id: 'tpl3',
    name: 'Customer Success Onboarding Workflow',
    kpisCount: 3,
    description: 'Post-sale handoff, SSO setup validation, and 30-day health checks for newly signed enterprise accounts.',
    targetRoles: 'CS Managers',
  },
  {
    id: 'tpl4',
    name: 'Engineering Sprint Velocity & Quality',
    kpisCount: 4,
    description: 'Bi-weekly sprint commit cadence, architectural PR reviews, and unit test coverage thresholds.',
    targetRoles: 'Software Engineers',
  },
];

type AdminDashboardTab = 'my_tasks' | 'team_progress' | 'sales_kpis' | 'templates' | 'change_requests';
type StatusFilter = 'all' | 'active' | 'overdue' | 'done';

export const ShowcaseTasks: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [activeTab, setActiveTab] = useState<AdminDashboardTab>('my_tasks');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tasks, setTasks] = useState<ShowcaseTaskItem[]>(initialTasksData);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            status: nextCompleted ? 'done' : t.dueDate.includes('Yesterday') ? 'overdue' : 'active',
            current: t.target ? (nextCompleted ? t.target : Math.max(0, (t.current || 0) - 1)) : undefined,
          };
        }
        return t;
      })
    );
  };

  const tabs: { id: AdminDashboardTab; label: string; badge?: number }[] = [
    { id: 'my_tasks', label: 'My Tasks' },
    { id: 'team_progress', label: 'Team Progress' },
    { id: 'sales_kpis', label: 'Sales KPIs' },
    { id: 'templates', label: 'KPI Templates' },
    { id: 'change_requests', label: 'Change Requests', badge: 2 },
  ];

  const counts = {
    all: tasks.length,
    active: tasks.filter((t) => !t.completed && t.status !== 'overdue').length,
    overdue: tasks.filter((t) => !t.completed && t.status === 'overdue').length,
    done: tasks.filter((t) => t.completed).length,
  };

  const priorityColumns: KpiPriority[] = ['urgent', 'high', 'medium', 'low'];

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'done') return t.completed;
    if (statusFilter === 'overdue') return !t.completed && t.status === 'overdue';
    if (statusFilter === 'active') return !t.completed;
    return true;
  });

  const cardBg = isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
  const innerBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';

  const renderTaskCard = (task: ShowcaseTaskItem) => {
    const isChecked = task.completed;
    const pConfig = PRIORITY_CONFIG[task.priority];
    const progressPercent = task.target
      ? Math.min(100, Math.round(((task.current || 0) / task.target) * 100))
      : null;

    return (
      <Card
        key={task.id}
        sx={{
          p: 1.5,
          borderRadius: '16px',
          bgcolor: cardBg,
          border: `1px solid ${
            isChecked
              ? 'rgba(16, 185, 129, 0.25)'
              : task.status === 'overdue'
              ? 'rgba(239, 68, 68, 0.22)'
              : cardBorder
          }`,
          boxShadow: isDark
            ? '0 2px 10px rgba(0,0,0,0.2)'
            : '0 2px 8px rgba(0,0,0,0.02)',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            borderColor: tokens.brand.primaryMuted,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
          <IconButton
            size="small"
            onClick={() => toggleTaskCompletion(task.id)}
            sx={{
              p: 0.2,
              mt: 0.1,
              color: isChecked ? tokens.semantic.success : tokens.text.muted,
              '&:hover': { color: tokens.brand.primary },
            }}
          >
            {isChecked ? (
              <CheckRoundedIcon sx={{ fontSize: 18, color: tokens.semantic.success }} />
            ) : (
              <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            {/* Title & Options */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Typography
                sx={{
                  fontWeight: 750,
                  fontSize: '0.84rem',
                  color: isDark ? '#FFFFFF' : tokens.text.primary,
                  textDecoration: isChecked ? 'line-through' : 'none',
                  opacity: isChecked ? 0.6 : 1,
                  lineHeight: 1.3,
                }}
              >
                {task.title}
              </Typography>
              <MoreVertIcon sx={{ fontSize: 16, color: tokens.text.muted, cursor: 'pointer', flexShrink: 0 }} />
            </Box>

            {/* Badges Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap', my: 0.75 }}>
              <Chip
                label={pConfig.label}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  bgcolor: pConfig.bg,
                  color: pConfig.color,
                  border: `1px solid ${pConfig.border}`,
                  borderRadius: '6px',
                }}
              />

              {task.status === 'overdue' && !isChecked && (
                <Chip
                  label="Overdue"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    bgcolor: 'rgba(239, 68, 68, 0.12)',
                    color: tokens.semantic.error,
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '6px',
                  }}
                />
              )}

              {isChecked && (
                <Chip
                  label="Done"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    bgcolor: 'rgba(16, 185, 129, 0.12)',
                    color: tokens.semantic.success,
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '6px',
                  }}
                />
              )}

              {task.recurrence && (
                <Chip
                  icon={<EventIcon sx={{ fontSize: 11, color: 'inherit !important' }} />}
                  label={task.recurrence}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(93, 26, 137, 0.06)',
                    color: tokens.brand.primary,
                    borderRadius: '6px',
                  }}
                />
              )}

              {task.kind === 'sales' && (
                <Chip
                  label="Sales"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    color: isDark ? 'rgba(255,255,255,0.6)' : tokens.text.secondary,
                    borderRadius: '6px',
                  }}
                />
              )}
            </Box>

            {/* Description */}
            <Typography
              sx={{
                fontSize: '0.74rem',
                color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
                lineHeight: 1.45,
                mb: 1,
              }}
            >
              {task.description}
            </Typography>

            {/* Attainment Progress Meter */}
            {task.target && (
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.35 }}>
                  <Typography sx={{ fontSize: '0.66rem', fontWeight: 650, color: tokens.text.muted }}>
                    Attainment
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: isChecked ? tokens.semantic.success : tokens.text.primary,
                    }}
                  >
                    {task.current} / {task.target} ({progressPercent}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressPercent || 0}
                  sx={{
                    height: 5,
                    borderRadius: '3px',
                    bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: isChecked ? tokens.semantic.success : pConfig.color,
                      borderRadius: '3px',
                    },
                  }}
                />
              </Box>
            )}

            {/* Due Date & Assignee Footer */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pt: 0.8,
                borderTop: `1px solid ${innerBorder}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeIcon
                  sx={{
                    fontSize: 12,
                    color: task.status === 'overdue' && !isChecked ? tokens.semantic.error : tokens.text.muted,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 650,
                    color: task.status === 'overdue' && !isChecked ? tokens.semantic.error : tokens.text.muted,
                  }}
                >
                  {task.dueDate}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Avatar
                  sx={{
                    width: 18,
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    bgcolor: isDark ? 'rgba(93, 26, 137, 0.4)' : 'rgba(93, 26, 137, 0.15)',
                    color: tokens.brand.primary,
                  }}
                >
                  {task.assignedTo.charAt(0)}
                </Avatar>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 650, color: tokens.text.secondary }}>
                  {task.assignedTo}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Card>
    );
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 1. Admin Top Sub-Tabs Navigation (Real ERP Match) */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          bgcolor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)',
          p: 0.5,
          borderRadius: '20px',
          width: 'fit-content',
          flexWrap: 'wrap',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'}`,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              sx={{
                textTransform: 'none',
                borderRadius: '16px',
                px: 2,
                py: 0.5,
                bgcolor: isActive ? (isDark ? '#FFFFFF' : '#1A1625') : 'transparent',
                color: isActive ? (isDark ? '#1A1625' : '#FFFFFF') : 'text.secondary',
                fontWeight: 750,
                fontSize: '0.78rem',
                transition: 'all 0.18s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
              }}
            >
              {tab.label}
              {tab.badge && (
                <Box
                  sx={{
                    px: 0.6,
                    py: 0.1,
                    borderRadius: '8px',
                    fontSize: '0.62rem',
                    fontWeight: 850,
                    bgcolor: isActive ? tokens.brand.primary : 'rgba(255, 127, 17, 0.2)',
                    color: isActive ? '#FFFFFF' : '#FF7F11',
                  }}
                >
                  {tab.badge}
                </Box>
              )}
            </Button>
          );
        })}
      </Box>

      {/* ============================================================== */}
      {/* TAB 1: MY TASKS (Clean, Wide 2-Column Responsive Board / List) */}
      {/* ============================================================== */}
      {activeTab === 'my_tasks' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Header Row */}
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
                My Tasks
              </Typography>
              <Typography
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.76rem',
                }}
              >
                Everything assigned to you across projects, tailored to your workflow.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Layout Switcher (Board vs List) */}
              <ToggleButtonGroup
                value={viewLayout}
                exclusive
                onChange={(_, next) => next && setViewLayout(next)}
                size="small"
                sx={{
                  height: 32,
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  borderRadius: '12px',
                }}
              >
                <ToggleButton value="grid" sx={{ px: 1 }}>
                  <GridViewIcon sx={{ fontSize: 14 }} />
                </ToggleButton>
                <ToggleButton value="list" sx={{ px: 1 }}>
                  <ViewListIcon sx={{ fontSize: 14 }} />
                </ToggleButton>
              </ToggleButtonGroup>

              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                sx={{
                  textTransform: 'none',
                  borderRadius: '12px',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(93, 26, 137, 0.2)',
                  color: tokens.brand.primary,
                  fontWeight: 750,
                  fontSize: '0.74rem',
                  px: 1.75,
                  py: 0.4,
                }}
              >
                Request Add KPI
              </Button>
            </Box>
          </Box>

          {/* Status Filter Chips Bar (All 8, Active 5, Overdue 1, Done 2) */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              p: 0.5,
              borderRadius: '16px',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              width: 'fit-content',
            }}
          >
            {(
              [
                { id: 'all' as const, label: 'All', count: counts.all },
                { id: 'active' as const, label: 'Active', count: counts.active },
                { id: 'overdue' as const, label: 'Overdue', count: counts.overdue },
                { id: 'done' as const, label: 'Done', count: counts.done },
              ] as const
            ).map((f) => {
              const isSelected = statusFilter === f.id;
              return (
                <Chip
                  key={f.id}
                  label={`${f.label} ${f.count}`}
                  onClick={() => setStatusFilter(f.id)}
                  sx={{
                    px: 1,
                    height: 28,
                    borderRadius: '10px',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    bgcolor: isSelected
                      ? isDark
                        ? 'rgba(93, 26, 137, 0.25)'
                        : 'rgba(93, 26, 137, 0.1)'
                      : 'transparent',
                    color: isSelected
                      ? isDark
                        ? '#E8D9F2'
                        : tokens.brand.primary
                      : isDark
                      ? 'rgba(255,255,255,0.6)'
                      : tokens.text.secondary,
                    border: `1px solid ${
                      isSelected
                        ? isDark
                          ? 'rgba(93, 26, 137, 0.5)'
                          : 'rgba(93, 26, 137, 0.25)'
                        : 'transparent'
                    }`,
                  }}
                />
              );
            })}
          </Box>

          {/* VIEW MODE: LIST (Full-Width Linear Stack) */}
          {viewLayout === 'list' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {filteredTasks.map((task) => renderTaskCard(task))}
              {filteredTasks.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: `1px dashed ${cardBorder}` }}>
                  <Typography sx={{ color: tokens.text.muted, fontSize: '0.8rem', fontWeight: 600 }}>
                    No tasks found matching current filter.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* VIEW MODE: BOARD (Spacious 2-Column Responsive Grid) */}
          {viewLayout === 'grid' && (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, minmax(0, 1fr))',
                },
              }}
            >
              {priorityColumns.map((priority) => {
                const pConfig = PRIORITY_CONFIG[priority];
                const colTasks = filteredTasks.filter((t) => t.priority === priority);

                return (
                  <Box
                    key={priority}
                    sx={{
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.25,
                      p: 1.5,
                      borderRadius: '18px',
                      bgcolor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.012)',
                      border: `1px solid ${pConfig.border}`,
                    }}
                  >
                    {/* Priority Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 0.5,
                        pb: 0.5,
                        borderBottom: `1px solid ${innerBorder}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: pConfig.color,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: pConfig.color,
                          }}
                        >
                          {pConfig.label}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={colTasks.length}
                        sx={{
                          height: 18,
                          fontWeight: 800,
                          fontSize: '0.62rem',
                          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                          color: isDark ? '#FFFFFF' : tokens.text.primary,
                        }}
                      />
                    </Box>

                    {/* Column Empty State */}
                    {colTasks.length === 0 && (
                      <Box
                        sx={{
                          p: 2.5,
                          textAlign: 'center',
                          borderRadius: '12px',
                          border: `1px dashed ${cardBorder}`,
                        }}
                      >
                        <Typography sx={{ color: tokens.text.muted, fontSize: '0.72rem', fontWeight: 500 }}>
                          No {priority} tasks
                        </Typography>
                      </Box>
                    )}

                    {/* Cards in this column */}
                    {colTasks.map((task) => renderTaskCard(task))}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* ============================================================== */}
      {/* TAB 2: TEAM PROGRESS (Clean 2-Column Responsive Breakdown)    */}
      {/* ============================================================== */}
      {activeTab === 'team_progress' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                Daily Team Progress
              </Typography>
              <Typography sx={{ fontSize: '0.74rem', color: isDark ? 'rgba(255,255,255,0.5)' : tokens.text.muted }}>
                Aggregated daily KPI completion rates and active deliverables by rep.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.75 }}>
              {['Today', 'This Week', 'This Month'].map((period) => (
                <Chip
                  key={period}
                  label={period}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.65rem',
                    fontWeight: 750,
                    cursor: 'pointer',
                    bgcolor: period === 'This Week' ? (isDark ? 'rgba(93, 26, 137, 0.3)' : 'rgba(93, 26, 137, 0.1)') : 'transparent',
                    color: period === 'This Week' ? tokens.brand.primary : tokens.text.secondary,
                    border: `1px solid ${period === 'This Week' ? tokens.brand.primary : innerBorder}`,
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            {teamProgressMembers.map((member) => (
              <Card
                key={member.id}
                sx={{
                  p: 1.75,
                  borderRadius: '16px',
                  bgcolor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: isDark ? 'rgba(93, 26, 137, 0.3)' : 'rgba(93, 26, 137, 0.1)',
                      color: isDark ? '#E8D9F2' : tokens.brand.primary,
                      fontWeight: 800,
                      fontSize: '0.9rem',
                    }}
                  >
                    {member.initial}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.84rem', color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                      {member.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: tokens.text.muted, fontWeight: 500 }}>
                      {member.role}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: tokens.semantic.success }}>
                        {member.done} Done
                      </Typography>
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: tokens.semantic.warning }}>
                        {member.pending} Pending
                      </Typography>
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: tokens.semantic.error }}>
                        {member.overdue} Overdue
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Circular completion gauge */}
                <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={48}
                    thickness={4}
                    sx={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={member.percentage}
                    size={48}
                    thickness={4}
                    sx={{
                      color: member.percentage >= 90 ? tokens.semantic.success : tokens.brand.primary,
                      position: 'absolute',
                      left: 0,
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 850, color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                      {member.percentage}%
                    </Typography>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* ============================================================== */}
      {/* TAB 3: SALES KPIS (Clean Metric Cards & Funnel)               */}
      {/* ============================================================== */}
      {activeTab === 'sales_kpis' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                Sales KPIs & Performance
              </Typography>
              <Typography sx={{ fontSize: '0.74rem', color: isDark ? 'rgba(255,255,255,0.5)' : tokens.text.muted }}>
                Real-time connection rates, cold dial milestones, and qualified quotas.
              </Typography>
            </Box>
            <Chip
              label="Live Sync"
              size="small"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.12)',
                color: tokens.semantic.success,
                fontWeight: 800,
                fontSize: '0.62rem',
              }}
            />
          </Box>

          <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' } }}>
            {[
              { label: 'CALLS DIALED', val: '185', sub: 'Target: 200' },
              { label: 'CONNECTION RATE', val: '78%', sub: 'Target: >65%' },
              { label: 'QUALIFIED LEADS', val: '28', sub: 'Enterprise ready' },
              { label: 'PIPELINE VAL', val: '$184k', sub: 'Tier-1 ACV' },
            ].map((k) => (
              <Box
                key={k.label}
                sx={{
                  p: 1.25,
                  borderRadius: '14px',
                  bgcolor: cardBg,
                  border: `1px solid ${cardBorder}`,
                }}
              >
                <Typography sx={{ fontSize: '0.54rem', fontWeight: 800, color: tokens.text.muted, letterSpacing: '0.06em' }}>
                  {k.label}
                </Typography>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 850, color: isDark ? '#FFFFFF' : tokens.text.primary, my: 0.25 }}>
                  {k.val}
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: tokens.semantic.success, fontWeight: 700 }}>
                  {k.sub}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* ============================================================== */}
      {/* TAB 4: KPI TEMPLATES (Clean 2-Column Template Cards Grid)     */}
      {/* ============================================================== */}
      {activeTab === 'templates' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Controls Bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            <TextField
              size="small"
              placeholder="Search performance targets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: 260,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#FFFFFF',
                  fontSize: '0.78rem',
                  '& fieldset': { borderColor: cardBorder },
                },
              }}
            />

            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              sx={{
                bgcolor: tokens.brand.primary,
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.74rem',
                borderRadius: '14px',
                textTransform: 'none',
                px: 1.75,
                py: 0.5,
                '&:hover': { bgcolor: tokens.brand.primaryDark },
              }}
            >
              Create Template
            </Button>
          </Box>

          {/* Template Cards Grid */}
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            {kpiTemplatesData.map((tpl) => (
              <Card
                key={tpl.id}
                sx={{
                  p: 1.75,
                  borderRadius: '16px',
                  bgcolor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: tokens.brand.primary,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                      {tpl.name}
                    </Typography>
                    <Chip
                      label={`${tpl.kpisCount} KPIs`}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 750,
                        bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        color: tokens.brand.primary,
                      }}
                    />
                  </Box>

                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      color: isDark ? 'rgba(255,255,255,0.5)' : tokens.text.secondary,
                      lineHeight: 1.4,
                      mb: 1.5,
                    }}
                  >
                    {tpl.description}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pt: 1.25,
                    borderTop: `1px solid ${innerBorder}`,
                  }}
                >
                  <Typography sx={{ fontSize: '0.64rem', fontWeight: 600, color: tokens.text.muted }}>
                    Target: {tpl.targetRoles}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        fontSize: '0.68rem',
                        borderRadius: '10px',
                        textTransform: 'none',
                        px: 1.25,
                        py: 0.25,
                        borderColor: innerBorder,
                        color: isDark ? '#FFFFFF' : tokens.text.primary,
                      }}
                    >
                      View KPIs
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        fontSize: '0.68rem',
                        borderRadius: '10px',
                        textTransform: 'none',
                        px: 1.25,
                        py: 0.25,
                        bgcolor: tokens.brand.primary,
                      }}
                    >
                      Assign
                    </Button>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* ============================================================== */}
      {/* TAB 5: CHANGE REQUESTS (Approvals Queue)                       */}
      {/* ============================================================== */}
      {activeTab === 'change_requests' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                KPI Change Requests Queue
              </Typography>
              <Typography sx={{ fontSize: '0.74rem', color: isDark ? 'rgba(255,255,255,0.5)' : tokens.text.muted }}>
                Review requested quota and deadline adjustments from team members.
              </Typography>
            </Box>
          </Box>

          {[
            {
              id: 'cr1',
              rep: 'Marcus Vance',
              kpi: 'Q4 Enterprise Pipeline Outreach',
              reason: 'Shift outreach focus towards Nordic logistics conference attendee accounts.',
              proposedTarget: '20 → 15 leads/day',
              time: '2 hours ago',
            },
            {
              id: 'cr2',
              rep: 'Sarah Jenkins',
              kpi: 'SLA Contract Finalization',
              reason: 'Client legal counsel requested a 48-hour extension on indemnification clauses.',
              proposedTarget: 'Extend deadline to Oct 12',
              time: '4 hours ago',
            },
          ].map((req) => (
            <Card
              key={req.id}
              sx={{
                p: 1.5,
                borderRadius: '16px',
                bgcolor: cardBg,
                border: `1px solid ${cardBorder}`,
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1.5,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                    {req.rep}
                  </Typography>
                  <Chip
                    label="Pending Review"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      bgcolor: 'rgba(255, 127, 17, 0.1)',
                      color: '#FF7F11',
                    }}
                  />
                  <Typography sx={{ fontSize: '0.64rem', color: tokens.text.muted }}>
                    {req.time}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.76rem', color: tokens.brand.primary, mb: 0.25 }}>
                  KPI: {req.kpi} ({req.proposedTarget})
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: isDark ? 'rgba(255,255,255,0.55)' : tokens.text.secondary }}>
                  {req.reason}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    textTransform: 'none',
                    color: tokens.semantic.error,
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  }}
                >
                  Decline
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    textTransform: 'none',
                    bgcolor: tokens.semantic.success,
                  }}
                >
                  Approve
                </Button>
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};
