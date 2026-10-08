import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Badge,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { tokens } from '@/styles/tokens';

interface EmployeeItem {
  id: string;
  initials: string;
  name: string;
  jobTitle: string;
  email: string;
  status: 'Absent' | 'Clocked In';
  worked: string;
  avatarUrl?: string;
}

export const ShowcaseAttendance: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  const employees: EmployeeItem[] = [
    {
      id: '1',
      initials: 'HR',
      name: 'Huzaifa Rasheed',
      jobTitle: 'Founder & CEO',
      email: 'huzaifa@leapsofts.com',
      status: 'Clocked In',
      worked: '07h 48m',
    },
    {
      id: '2',
      initials: 'SJ',
      name: 'Sarah Jenkins',
      jobTitle: 'VP Growth & Sales',
      email: 'sarah.j@leapsofts.com',
      status: 'Clocked In',
      worked: '06h 42m',
    },
    {
      id: '3',
      initials: 'AR',
      name: 'Alex Rivera',
      jobTitle: 'Lead Engineer',
      email: 'alex.r@leapsofts.com',
      status: 'Clocked In',
      worked: '07h 15m',
    },
    {
      id: '4',
      initials: 'MV',
      name: 'Marcus Vance',
      jobTitle: 'Senior Architect',
      email: 'marcus.v@leapsofts.com',
      status: 'Clocked In',
      worked: '05h 50m',
    },
    {
      id: '5',
      initials: 'ER',
      name: 'Elena Rostova',
      jobTitle: 'Product Designer',
      email: 'elena.r@leapsofts.com',
      status: 'Absent',
      worked: '0h 0m',
    },
    {
      id: '6',
      initials: 'DC',
      name: 'David Chen',
      jobTitle: 'Cloud DevOps',
      email: 'david.c@leapsofts.com',
      status: 'Absent',
      worked: '0h 0m',
    },
  ];

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, pb: 2.5 }}>
      {/* 1. Header Row */}
      <Box sx={{ mb: 2 }}>
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
          Team Attendance
        </Typography>
        <Typography
          sx={{
            color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
            fontWeight: 500,
            fontSize: '0.78rem',
          }}
        >
          Monitor daily check-ins, active durations, and team shift logs.
        </Typography>
      </Box>

      {/* 2. Directory Header with Search */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.75,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            color: isDark ? '#FFFFFF' : tokens.text.primary,
            letterSpacing: '-0.01em',
            fontSize: '0.88rem',
          }}
        >
          Employees Directory
        </Typography>
        <TextField
          placeholder="Search employee..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: { xs: '100%', sm: 200 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
              fontSize: '0.74rem',
              py: 0.1,
              '& fieldset': {
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* 3. Directory Cards Grid */}
      <Grid container spacing={1.5}>
        {filteredEmployees.map((emp) => {
          const isOnline = emp.status === 'Clocked In';
          return (
            <Grid item xs={12} sm={6} lg={4} key={emp.id}>
              <Card
                sx={{
                  p: 1.75,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: tokens.brand.primary,
                  },
                }}
              >
                {/* Top Row: Avatar + Name + Status Chip */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      invisible={!isOnline}
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: '#10B981',
                          color: '#10B981',
                          boxShadow: `0 0 0 2px ${isDark ? '#1e1b24' : '#fff'}`,
                          minWidth: 8,
                          height: 8,
                          borderRadius: '50%',
                        },
                      }}
                    >
                      <Avatar
                        src={emp.avatarUrl}
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor: isDark ? 'rgba(93, 26, 137, 0.5)' : '#8B5CF6',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                        }}
                      >
                        {emp.initials}
                      </Avatar>
                    </Badge>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        noWrap
                        sx={{
                          fontWeight: 800,
                          color: isDark ? '#FFFFFF' : tokens.text.primary,
                          fontSize: '0.82rem',
                          lineHeight: 1.15,
                        }}
                      >
                        {emp.name}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{
                          color: tokens.brand.primary,
                          fontWeight: 700,
                          display: 'block',
                          fontSize: '0.66rem',
                        }}
                      >
                        {emp.jobTitle}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{
                          color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'text.secondary',
                          fontWeight: 500,
                          display: 'block',
                          fontSize: '0.62rem',
                        }}
                      >
                        {emp.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    label={emp.status}
                    size="small"
                    sx={{
                      height: 18,
                      px: 0.4,
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      bgcolor: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                      color: isOnline ? '#10B981' : '#EF4444',
                      borderRadius: '6px',
                    }}
                  />
                </Box>

                {/* Middle Row: WORKED Hours Snapshot */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 0.75,
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 13, color: tokens.brand.primary }} />
                    <Typography
                      sx={{
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: isDark ? 'rgba(255,255,255,0.45)' : tokens.text.muted,
                      }}
                    >
                      WORKED
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: isDark ? '#FFFFFF' : tokens.text.primary,
                    }}
                  >
                    {emp.worked}
                  </Typography>
                </Box>

                {/* Bottom Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    startIcon={<TrendingUpIcon sx={{ fontSize: 12 }} />}
                    sx={{
                      fontSize: '0.66rem',
                      fontWeight: 750,
                      color: isDark ? '#FFFFFF' : tokens.text.primary,
                      textTransform: 'none',
                      p: 0,
                      '&:hover': { bgcolor: 'transparent', color: tokens.brand.primary },
                    }}
                  >
                    Activity Tracking
                  </Button>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.2,
                      color: isDark ? 'rgba(255, 255, 255, 0.5)' : tokens.text.secondary,
                      fontSize: '0.66rem',
                      fontWeight: 700,
                    }}
                  >
                    Logs
                    <ChevronRightIcon sx={{ fontSize: 13 }} />
                  </Box>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
