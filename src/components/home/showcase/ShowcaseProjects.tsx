import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  Chip,
  Avatar,
  AvatarGroup,
  LinearProgress,
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import { tokens } from '@/styles/tokens';

interface ProjectCardData {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'in_development' | 'on_hold';
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  progress: number;
  tags: string[];
  members: string[];
}

export const ShowcaseProjects: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const statusFilters = ['All', 'Active', 'In Development', 'On Hold'];

  const projects: ProjectCardData[] = [
    {
      id: '1',
      name: 'Global Logistics ERP Rollout',
      description: 'End-to-end telemetry and automated invoicing pipeline across European shipping hubs.',
      status: 'active',
      statusLabel: 'Active',
      statusColor: '#10B981',
      statusBg: 'rgba(16, 185, 129, 0.1)',
      progress: 78,
      tags: ['Enterprise', 'SupplyChain', 'Billing'],
      members: ['HR', 'SJ', 'AR'],
    },
    {
      id: '2',
      name: 'Sales Engine Automation v3',
      description: 'Next-gen prospect enrichment, cold call transcription, and multi-tier lead scoring.',
      status: 'active',
      statusLabel: 'Active',
      statusColor: '#10B981',
      statusBg: 'rgba(16, 185, 129, 0.1)',
      progress: 92,
      tags: ['Growth', 'AI-Leads', 'CRM'],
      members: ['HR', 'SJ'],
    },
    {
      id: '3',
      name: 'Zero-Trust Telemetry & OAuth Suite',
      description: 'Hardened SOC-2 workplace monitoring telemetry with Google Workspace Drive synchronization.',
      status: 'in_development',
      statusLabel: 'In Development',
      statusColor: '#3B82F6',
      statusBg: 'rgba(59, 130, 246, 0.1)',
      progress: 45,
      tags: ['Security', 'OAuth', 'Telemetry'],
      members: ['AR', 'MV'],
    },
  ];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Active' && p.status === 'active') ||
      (activeFilter === 'In Development' && p.status === 'in_development') ||
      (activeFilter === 'On Hold' && p.status === 'on_hold');
    return matchesSearch && matchesFilter;
  });

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, pb: 2.5 }}>
      {/* 1. Header Row */}
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
            Projects
          </Typography>
          <Typography
            sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
              fontSize: '0.78rem',
            }}
          >
            3 projects · 2 active · 1 in development
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
          New Project
        </Button>
      </Box>

      {/* 2. Toolbar & Status Filter Pills */}
      <Box
        sx={{
          mb: 3.5,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search projects..."
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
            maxWidth: { sm: 300 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#FFFFFF',
              fontSize: '0.82rem',
              '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
            },
          }}
        />

        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 0.5 }}>
          {statusFilters.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              onClick={() => setActiveFilter(filter)}
              sx={{
                borderRadius: '16px',
                px: 1,
                fontSize: '0.78rem',
                fontWeight: 750,
                bgcolor:
                  activeFilter === filter
                    ? isDark
                      ? '#FFFFFF'
                      : '#1A1625'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(0, 0, 0, 0.03)',
                color:
                  activeFilter === filter
                    ? isDark
                      ? '#1A1625'
                      : '#FFFFFF'
                    : 'text.secondary',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* 3. Projects Grid */}
      <Grid container spacing={2.5}>
        {filteredProjects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Card
              sx={{
                p: 3,
                borderRadius: '24px',
                bgcolor: isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: tokens.brand.primary,
                  transform: 'translateY(-3px)',
                  boxShadow: isDark
                    ? '0 12px 30px rgba(93, 26, 137, 0.25)'
                    : '0 10px 24px rgba(93, 26, 137, 0.08)',
                },
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      bgcolor: 'rgba(93, 26, 137, 0.08)',
                      color: tokens.brand.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FolderIcon sx={{ fontSize: 22 }} />
                  </Box>

                  <Chip
                    label={project.statusLabel}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      bgcolor: project.statusBg,
                      color: project.statusColor,
                      borderRadius: '8px',
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    color: isDark ? '#FFFFFF' : tokens.text.primary,
                    mb: 0.75,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {project.name}
                </Typography>

                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
                    lineHeight: 1.5,
                    mb: 2.5,
                  }}
                >
                  {project.description}
                </Typography>

                {/* Tags */}
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 3 }}>
                  {project.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={`#${tag}`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 650,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                        color: tokens.text.secondary,
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Progress & Avatar Row */}
              <Box sx={{ pt: 2, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary' }}>
                    Sprint Completion
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: project.statusColor }}>
                    {project.progress}%
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={project.progress}
                  sx={{
                    height: 5,
                    borderRadius: '3px',
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    mb: 2,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: project.statusColor,
                      borderRadius: '3px',
                    },
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 26, height: 26, fontSize: '0.68rem', fontWeight: 800, bgcolor: tokens.brand.primary } }}>
                    {project.members.map((m) => (
                      <Avatar key={m}>{m}</Avatar>
                    ))}
                  </AvatarGroup>

                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: tokens.brand.primary }}>
                    Open Kanban ↗
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
