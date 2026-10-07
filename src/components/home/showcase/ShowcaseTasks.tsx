import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Chip,
  Checkbox,
  LinearProgress,
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import { tokens } from '@/styles/tokens';

interface TaskItem {
  id: string;
  name: string;
  description: string;
  target: number;
  completed: number;
  priority: 'High' | 'Medium' | 'Low';
  daysLabel: string;
  assignedTo: string;
  checked: boolean;
}

export const ShowcaseTasks: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState<'my_tasks' | 'team_progress' | 'sales_kpis' | 'templates'>('my_tasks');
  const [searchQuery, setSearchQuery] = useState('');

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: '1',
      name: 'Executive Sales Pipeline Outreach',
      description: 'Engage 20 enterprise prospects across Nordic & European logistics sector.',
      target: 20,
      completed: 18,
      priority: 'High',
      daysLabel: 'Mon-Fri · weekly',
      assignedTo: 'Huzaifa Rasheed',
      checked: false,
    },
    {
      id: '2',
      name: 'Client Follow-ups & Discovery Syncs',
      description: 'Conduct follow-ups on pending SLA contracts and qualify tier-1 proposals.',
      target: 15,
      completed: 15,
      priority: 'High',
      daysLabel: 'Mon-Thu · weekly',
      assignedTo: 'Sarah Jenkins',
      checked: true,
    },
    {
      id: '3',
      name: 'System Latency & Load Test Audit',
      description: 'Audit WebSocket real-time cluster for sub-30ms telemetry delivery.',
      target: 1,
      completed: 1,
      priority: 'Medium',
      daysLabel: 'Wed · weekly',
      assignedTo: 'Alex Rivera',
      checked: true,
    },
    {
      id: '4',
      name: 'Sprint 42 Code Review & Architecture Sync',
      description: 'Review multi-tenant database indexing and data retention policies.',
      target: 5,
      completed: 3,
      priority: 'Medium',
      daysLabel: 'Tue, Thu · weekly',
      assignedTo: 'Marcus Vance',
      checked: false,
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t))
    );
  };

  const tabs = [
    { id: 'my_tasks', label: 'My Daily KPIs' },
    { id: 'team_progress', label: 'Team Progress' },
    { id: 'sales_kpis', label: 'Sales Targets' },
    { id: 'templates', label: 'KPI Templates' },
  ];

  const filteredTasks = tasks.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, pb: 2.5 }}>
      {/* 1. Header */}
      <Box
        sx={{
          mb: 2,
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
            Tasks & Performance Targets
          </Typography>
          <Typography
            sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
              fontSize: '0.78rem',
            }}
          >
            Track daily team objectives, automated recurrences, and progress completion.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            background: `linear-gradient(135deg, ${tokens.brand.primary} 0%, ${tokens.brand.primaryLight} 100%)`,
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.85rem',
            px: 3.5,
            py: 1.1,
            borderRadius: '24px',
            textTransform: 'none',
            boxShadow: '0 8px 20px rgba(93, 26, 137, 0.25)',
            whiteSpace: 'nowrap',
            '&:hover': {
              boxShadow: '0 10px 24px rgba(93, 26, 137, 0.35)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          Create Target
        </Button>
      </Box>

      {/* 2. Translucent Filter Tabs */}
      <Box
        sx={{
          display: 'flex',
          bgcolor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)',
          borderRadius: '20px',
          p: 0.5,
          gap: 0.5,
          mb: 3,
          width: 'fit-content',
          flexWrap: 'wrap',
        }}
      >
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            sx={{
              borderRadius: '16px',
              px: 2.5,
              py: 0.65,
              bgcolor: activeTab === tab.id ? (isDark ? '#FFFFFF' : '#1A1625') : 'transparent',
              color: activeTab === tab.id ? (isDark ? '#1A1625' : '#FFFFFF') : 'text.secondary',
              fontWeight: 750,
              fontSize: '0.8rem',
              textTransform: 'none',
              transition: 'all 0.18s ease',
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {/* 3. Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search targets and assignments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: 380,
            '& .MuiOutlinedInput-root': {
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#FFFFFF',
              fontSize: '0.82rem',
              '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
            },
          }}
        />
      </Box>

      {/* 4. Daily KPI List Cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredTasks.map((task) => {
          const progressPercent = Math.min(100, Math.round((task.completed / task.target) * 100));
          return (
            <Card
              key={task.id}
              sx={{
                p: 2.5,
                borderRadius: '20px',
                bgcolor: isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: tokens.brand.primary,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, minWidth: 0, flex: 1 }}>
                <Checkbox
                  checked={task.checked}
                  onChange={() => toggleTask(task.id)}
                  sx={{
                    color: tokens.brand.primary,
                    '&.Mui-checked': { color: tokens.brand.primary },
                    p: 0.5,
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                    <Typography
                      sx={{
                        fontWeight: 750,
                        fontSize: '0.95rem',
                        color: isDark ? '#FFFFFF' : tokens.text.primary,
                        textDecoration: task.checked ? 'line-through' : 'none',
                        opacity: task.checked ? 0.6 : 1,
                      }}
                    >
                      {task.name}
                    </Typography>

                    <Chip
                      label={task.priority}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor:
                          task.priority === 'High'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : 'rgba(245, 158, 11, 0.12)',
                        color: task.priority === 'High' ? '#EF4444' : '#F59E0B',
                        borderRadius: '6px',
                      }}
                    />

                    <Chip
                      icon={<EventIcon sx={{ fontSize: 13, color: 'inherit !important' }} />}
                      label={task.daysLabel}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(93, 26, 137, 0.06)',
                        color: tokens.brand.primary,
                        borderRadius: '6px',
                      }}
                    />
                  </Box>

                  <Typography
                    sx={{
                      fontSize: '0.78rem',
                      color: isDark ? 'rgba(255, 255, 255, 0.5)' : tokens.text.secondary,
                      mb: 1.5,
                    }}
                  >
                    {task.description}
                  </Typography>

                  {/* Progress Meter */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: 360 }}>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercent}
                      sx={{
                        flex: 1,
                        height: 6,
                        borderRadius: '3px',
                        bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: progressPercent === 100 ? '#10B981' : tokens.brand.primary,
                          borderRadius: '3px',
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: progressPercent === 100 ? '#10B981' : 'text.secondary',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.completed}/{task.target} ({progressPercent}%)
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 650,
                  color: isDark ? 'rgba(255, 255, 255, 0.45)' : tokens.text.muted,
                  whiteSpace: 'nowrap',
                  alignSelf: { xs: 'flex-start', sm: 'center' },
                }}
              >
                Assigned: {task.assignedTo}
              </Typography>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};
