import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Badge,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import WorkIcon from '@mui/icons-material/Work';
import { tokens } from '@/styles/tokens';

interface MemberData {
  id: string;
  initials: string;
  name: string;
  jobTitle: string;
  department: string;
  role: 'admin' | 'manager' | 'employee';
  isOnline: boolean;
  metrics: { label: string; value: string }[];
}

export const ShowcaseTeam: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const members: MemberData[] = [
    {
      id: '1',
      initials: 'HR',
      name: 'Huzaifa Rasheed',
      jobTitle: 'Founder & CEO',
      department: 'Executive',
      role: 'manager',
      isOnline: true,
      metrics: [
        { label: 'PROSPECTS', value: '48/60' },
        { label: 'MESSAGES', value: '20/20' },
        { label: 'FOLLOW-UPS', value: '15/15' },
        { label: 'CALLS', value: '28/30' },
      ],
    },
    {
      id: '2',
      initials: 'SJ',
      name: 'Sarah Jenkins',
      jobTitle: 'VP Growth & Sales',
      department: 'Sales',
      role: 'manager',
      isOnline: true,
      metrics: [
        { label: 'PROSPECTS', value: '54/60' },
        { label: 'MESSAGES', value: '19/20' },
        { label: 'FOLLOW-UPS', value: '14/15' },
        { label: 'CALLS', value: '26/30' },
      ],
    },
    {
      id: '3',
      initials: 'AR',
      name: 'Alex Rivera',
      jobTitle: 'Lead Engineer',
      department: 'Engineering',
      role: 'employee',
      isOnline: true,
      metrics: [
        { label: 'PENDING', value: '0' },
        { label: 'COMPLETED', value: '24' },
        { label: 'OVERDUE', value: '0' },
        { label: 'RATIO', value: '100%' },
      ],
    },
    {
      id: '4',
      initials: 'MV',
      name: 'Marcus Vance',
      jobTitle: 'Senior Architect',
      department: 'Engineering',
      role: 'employee',
      isOnline: false,
      metrics: [
        { label: 'PENDING', value: '1' },
        { label: 'COMPLETED', value: '31' },
        { label: 'OVERDUE', value: '0' },
        { label: 'RATIO', value: '97%' },
      ],
    },
  ];

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Team Operations
          </Typography>
          <Typography
            sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
              fontSize: '0.78rem',
            }}
          >
            Coordinate representatives, allocate access roles, and monitor operations staff.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 15 }} />}
          sx={{
            background: `linear-gradient(135deg, ${tokens.brand.primary} 0%, ${tokens.brand.primaryLight} 100%)`,
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.75rem',
            px: 2.5,
            py: 0.7,
            borderRadius: '20px',
            textTransform: 'none',
            boxShadow: '0 4px 15px rgba(93, 26, 137, 0.25)',
            whiteSpace: 'nowrap',
          }}
        >
          Add Member
        </Button>
      </Box>

      {/* 2. Control Panel with Search & View Toggle */}
      <Box
        sx={{
          mb: 2,
          p: 1,
          bgcolor: isDark ? 'rgba(28, 25, 36, 0.55)' : '#FFFFFF',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
          borderRadius: '16px',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <TextField
          size="small"
          placeholder="Search team members by name, title, or department..."
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
            maxWidth: { sm: 320 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
              fontSize: '0.75rem',
              py: 0.1,
              '& fieldset': { borderColor: 'transparent' },
            },
          }}
        />

        <Box
          sx={{
            display: 'flex',
            bgcolor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)',
            borderRadius: '16px',
            p: 0.3,
            gap: 0.4,
            alignSelf: { xs: 'flex-end', sm: 'center' },
          }}
        >
          <IconButton
            size="small"
            onClick={() => setViewMode('grid')}
            sx={{
              borderRadius: '12px',
              px: 1.5,
              py: 0.4,
              bgcolor: viewMode === 'grid' ? (isDark ? '#FFFFFF' : '#1A1625') : 'transparent',
              color: viewMode === 'grid' ? (isDark ? '#1A1625' : '#FFFFFF') : 'text.secondary',
            }}
          >
            <GridViewIcon sx={{ fontSize: 14, mr: 0.4 }} />
            <Typography variant="caption" sx={{ fontWeight: 750, fontSize: '0.68rem' }}>
              Grid
            </Typography>
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setViewMode('list')}
            sx={{
              borderRadius: '12px',
              px: 1.5,
              py: 0.4,
              bgcolor: viewMode === 'list' ? (isDark ? '#FFFFFF' : '#1A1625') : 'transparent',
              color: viewMode === 'list' ? (isDark ? '#1A1625' : '#FFFFFF') : 'text.secondary',
            }}
          >
            <FormatListBulletedIcon sx={{ fontSize: 14, mr: 0.4 }} />
            <Typography variant="caption" sx={{ fontWeight: 750, fontSize: '0.68rem' }}>
              List
            </Typography>
          </IconButton>
        </Box>
      </Box>

      {/* 3. Team Member Cards Grid */}
      <Grid container spacing={1.5}>
        {filteredMembers.map((member) => (
          <Grid item xs={12} sm={6} key={member.id}>
            <Card
              sx={{
                height: '100%',
                bgcolor: isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
                borderRadius: '18px',
                boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: tokens.brand.primary,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {/* Avatar with Dot Badge */}
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  sx={{
                    mb: 1,
                    '& .MuiBadge-badge': {
                      backgroundColor: member.isOnline ? '#10B981' : '#9CA3AF',
                      color: member.isOnline ? '#10B981' : '#9CA3AF',
                      boxShadow: `0 0 0 2px ${isDark ? 'rgba(28, 25, 36, 1)' : '#FFFFFF'}`,
                      minWidth: 10,
                      height: 10,
                      borderRadius: '50%',
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F2EEEC',
                      color: isDark ? '#FFFFFF' : '#1A1625',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                    }}
                  >
                    {member.initials}
                  </Avatar>
                </Badge>

                {/* Name */}
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 750,
                    color: isDark ? '#FFFFFF' : tokens.text.primary,
                    mb: 0.25,
                    fontSize: '0.92rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {member.name}
                </Typography>

                {/* Job Title with Briefcase Icon */}
                <Typography
                  variant="body2"
                  sx={{
                    color: tokens.brand.primaryMuted,
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <WorkIcon sx={{ fontSize: 12 }} />
                  {member.jobTitle}
                </Typography>

                {/* Tags / Chips */}
                <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Chip
                    label={member.department}
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                      color: tokens.text.secondary,
                      fontWeight: 650,
                      fontSize: '0.62rem',
                      height: 18,
                    }}
                  />
                  <Chip
                    label={member.role === 'manager' ? 'Manager' : 'Employee'}
                    size="small"
                    sx={{
                      bgcolor:
                        member.role === 'manager'
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(93, 26, 137, 0.1)',
                      color: member.role === 'manager' ? '#10B981' : tokens.brand.primary,
                      fontWeight: 750,
                      fontSize: '0.62rem',
                      height: 18,
                    }}
                  />
                </Box>

                {/* Bottom Metric Rows */}
                <Box
                  sx={{
                    width: '100%',
                    pt: 1.25,
                    borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    flexWrap: 'wrap',
                    gap: 0.5,
                  }}
                >
                  {member.metrics.map((m) => (
                    <Box key={m.label} sx={{ textAlign: 'center', minWidth: '42px' }}>
                      <Typography
                        sx={{
                          fontSize: '0.52rem',
                          fontWeight: 750,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: isDark ? 'rgba(255, 255, 255, 0.4)' : tokens.text.muted,
                        }}
                      >
                        {m.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          color: isDark ? '#FFFFFF' : tokens.text.primary,
                        }}
                      >
                        {m.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
