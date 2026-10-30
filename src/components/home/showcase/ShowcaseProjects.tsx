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
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { tokens } from '@/styles/tokens';

interface ProjectCardData {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'in_development' | 'on_hold';
  statusLabel: string;
  statusColor: string;
  statusBg: string;
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

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            py: 0.5,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
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
                flexShrink: 0,
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
                p: { xs: 2.25, sm: 3 },
                borderRadius: '24px',
                bgcolor: isDark ? 'rgba(30, 27, 36, 0.45)' : '#FFFFFF',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)'}`,
                boxShadow: isDark ? 'none' : '0 1px 3px rgba(26, 22, 37, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                position: 'relative',
                '&:hover': {
                  borderColor: tokens.brand.primary,
                  transform: 'translateY(-3px)',
                  boxShadow: tokens.shadow.cardHover,
                },
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em', fontSize: '1.05rem' }}>
                    {project.name}
                  </Typography>
                  <Chip
                    label={project.statusLabel}
                    size="small"
                    sx={{
                      bgcolor: project.statusBg,
                      color: project.statusColor,
                      fontWeight: 750,
                      fontSize: '0.68rem',
                      height: 20,
                      border: 'none',
                    }}
                  />
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 700,
                    display: 'block',
                    mb: 1.5,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                >
                  Project
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    mb: 2.5,
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    minHeight: 40,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {project.description}
                </Typography>

                {/* Tags */}
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 3 }}>
                  {project.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        fontWeight: 650,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                        color: 'text.secondary',
                        borderRadius: '8px',
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Bottom Avatar & Kanban Row */}
              <Box
                sx={{
                  pt: 2.25,
                  borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <AvatarGroup
                  max={4}
                  sx={{
                    '& .MuiAvatar-root': {
                      width: 28,
                      height: 28,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderColor: isDark ? '#1e1b24' : '#fff',
                    },
                  }}
                >
                  {project.members.map((m) => (
                    <Avatar key={m}>{m}</Avatar>
                  ))}
                </AvatarGroup>

                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: tokens.brand.primary }}>
                  Kanban Board ↗
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
