import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import { tokens } from '@/styles/tokens';

export const ShowcaseReports: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeReportTab, setActiveReportTab] = useState<'kpi' | 'attendance' | 'pipeline'>('kpi');

  const reportTabs = [
    { id: 'kpi', label: 'Combined KPI Performance' },
    { id: 'attendance', label: 'Shift & Attendance Logs' },
    { id: 'pipeline', label: 'Sales Velocity' },
  ];

  const agentRows = [
    {
      name: 'Huzaifa Rasheed',
      initials: 'HR',
      role: 'Founder & CEO',
      dept: 'Executive',
      shiftHours: '07h 48m',
      completedTasks: '18 / 20',
      efficiency: '96%',
      status: 'Top Performer',
      statusColor: '#10B981',
    },
    {
      name: 'Sarah Jenkins',
      initials: 'SJ',
      role: 'VP Sales & Growth',
      dept: 'Sales',
      shiftHours: '06h 42m',
      completedTasks: '15 / 15',
      efficiency: '100%',
      status: 'Target Met',
      statusColor: '#10B981',
    },
    {
      name: 'Alex Rivera',
      initials: 'AR',
      role: 'Lead Full-Stack',
      dept: 'Engineering',
      shiftHours: '07h 15m',
      completedTasks: '24 / 24',
      efficiency: '100%',
      status: 'Target Met',
      statusColor: '#10B981',
    },
    {
      name: 'Marcus Vance',
      initials: 'MV',
      role: 'Senior Architect',
      dept: 'Engineering',
      shiftHours: '05h 50m',
      completedTasks: '31 / 32',
      efficiency: '97%',
      status: 'On Track',
      statusColor: '#3B82F6',
    },
  ];

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
            Analytics & Executive Reports
          </Typography>
          <Typography
            sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
              fontSize: '0.78rem',
            }}
          >
            Real-time workplace telemetry, departmental performance ratios, and exportable logs.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
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
          Export CSV / PDF
        </Button>
      </Box>

      {/* 2. Top Summary Metrics Grid */}
      <Grid container spacing={2} sx={{ mb: 3.5 }}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, borderRadius: '18px', bgcolor: isDark ? 'rgba(28, 25, 36, 0.6)' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>
              AVG ATTENDANCE
            </Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 850, color: '#10B981', my: 0.5 }}>
              94.8%
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.secondary' }}>
              +3.2% vs last month
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, borderRadius: '18px', bgcolor: isDark ? 'rgba(28, 25, 36, 0.6)' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>
              TARGET COMPLETION
            </Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 850, color: isDark ? '#FFFFFF' : tokens.text.primary, my: 0.5 }}>
              88.5%
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.secondary' }}>
              88 of 99 daily KPIs met
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, borderRadius: '18px', bgcolor: isDark ? 'rgba(28, 25, 36, 0.6)' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>
              LEAD CONVERSION
            </Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 850, color: '#FF7F11', my: 0.5 }}>
              24.2%
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.secondary' }}>
              Qualified inbound deals
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, borderRadius: '18px', bgcolor: isDark ? 'rgba(28, 25, 36, 0.6)' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>
              ACTIVE SHIFT TIME
            </Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 850, color: isDark ? '#FFFFFF' : tokens.text.primary, my: 0.5 }}>
              07h 35m
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.secondary' }}>
              Daily active average
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* 3. Translucent Tabs */}
      <Box
        sx={{
          display: 'flex',
          bgcolor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)',
          borderRadius: '20px',
          p: 0.5,
          gap: 0.5,
          mb: 3,
          width: 'fit-content',
        }}
      >
        {reportTabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            sx={{
              borderRadius: '16px',
              px: 2.5,
              py: 0.6,
              bgcolor: activeReportTab === tab.id ? (isDark ? '#FFFFFF' : '#1A1625') : 'transparent',
              color: activeReportTab === tab.id ? (isDark ? '#1A1625' : '#FFFFFF') : 'text.secondary',
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

      {/* 4. Performance Table */}
      <Card
        sx={{
          borderRadius: '24px',
          bgcolor: isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.02)',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Representative</TableCell>
                <TableCell sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Department</TableCell>
                <TableCell sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shift Duration</TableCell>
                <TableCell sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tasks Met</TableCell>
                <TableCell sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target Ratio</TableCell>
                <TableCell sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Audit Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agentRows.map((agent) => (
                <TableRow key={agent.name} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: tokens.brand.primary, fontSize: '0.75rem', fontWeight: 800 }}>
                        {agent.initials}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 750, fontSize: '0.85rem', color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                          {agent.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                          {agent.role}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={agent.dept} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{agent.shiftHours}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{agent.completedTasks}</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#10B981' }}>{agent.efficiency}</TableCell>
                  <TableCell>
                    <Chip
                      label={agent.status}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        bgcolor: `${agent.statusColor}18`,
                        color: agent.statusColor,
                        borderRadius: '6px',
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};
