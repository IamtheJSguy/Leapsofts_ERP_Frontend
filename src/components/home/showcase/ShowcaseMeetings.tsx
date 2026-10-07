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
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { tokens } from '@/styles/tokens';

export const ShowcaseMeetings: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcomingMeetings = [
    {
      id: '1',
      title: 'Enterprise Architecture & Cloud Rollout',
      client: 'Nordic Logistics AG',
      scheduledDate: 'Today, 06:30 PM (in 14 mins)',
      duration: '45 mins',
      link: 'meet.google.com/xyz-demo-sync',
      host: 'Huzaifa Rasheed',
      attendees: ['HR', 'SJ', 'NL'],
      status: 'Live Soon',
      isNext: true,
    },
    {
      id: '2',
      title: 'Q4 Sales Pipeline Review & Growth Targets',
      client: 'Internal Operations',
      scheduledDate: 'Tomorrow, 10:00 AM',
      duration: '30 mins',
      link: 'meet.google.com/sales-review-q4',
      host: 'Sarah Jenkins',
      attendees: ['HR', 'SJ', 'AR', 'MV'],
      status: 'Scheduled',
      isNext: false,
    },
    {
      id: '3',
      title: 'Global Procurement Proposal Discovery',
      client: 'Apex Cloud Solutions',
      scheduledDate: 'Friday, 03:00 PM',
      duration: '60 mins',
      link: 'meet.google.com/apex-procure-sync',
      host: 'Huzaifa Rasheed',
      attendees: ['HR', 'SJ'],
      status: 'Scheduled',
      isNext: false,
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
            Meetings & Schedule
          </Typography>
          <Typography
            sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
              fontSize: '0.78rem',
            }}
          >
            Schedule and manage team sync calls, review sessions, and prospect demonstrations.
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
          Schedule Meeting
        </Button>
      </Box>

      {/* 2. Next Upcoming Meeting Spotlight Banner */}
      <Box
        sx={{
          mb: 3.5,
          p: 2.5,
          borderRadius: '24px',
          bgcolor: isDark ? 'rgba(30, 27, 36, 0.7)' : '#FFFFFF',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
          boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '16px',
              bgcolor: 'rgba(255, 127, 17, 0.12)',
              border: '1px solid rgba(255, 127, 17, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF7F11',
              flexShrink: 0,
            }}
          >
            <VideocamOutlinedIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: '0.66rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#FF7F11',
                mb: 0.25,
              }}
            >
              NEXT UPCOMING MEETING · STARTS IN 14 MINS
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1.05rem',
                color: isDark ? '#FFFFFF' : tokens.text.primary,
                letterSpacing: '-0.01em',
              }}
            >
              Enterprise Architecture & Cloud Rollout
            </Typography>
            <Typography
              sx={{
                fontSize: '0.8rem',
                color: isDark ? 'rgba(255, 255, 255, 0.5)' : tokens.text.secondary,
              }}
            >
              Nordic Logistics AG · Host: Huzaifa Rasheed
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, alignSelf: { xs: 'flex-end', md: 'center' } }}>
          {/* Live countdown badge */}
          <Box
            sx={{
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              borderRadius: '12px',
              px: 1.5,
              py: 0.6,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: isDark ? '#FFFFFF' : tokens.text.primary }}>
              00:14:25
            </Typography>
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: 'text.secondary' }}>
              COUNTDOWN
            </Typography>
          </Box>

          <Button
            variant="contained"
            sx={{
              background: `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.accentLight} 100%)`,
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.82rem',
              borderRadius: '20px',
              px: 3,
              py: 0.9,
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(255, 127, 17, 0.25)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(255, 127, 17, 0.35)',
              },
            }}
          >
            Join Google Meet ↗
          </Button>
        </Box>
      </Box>

      {/* 3. Meeting Cards Grid */}
      <Grid container spacing={2.5}>
        {upcomingMeetings.map((meeting) => (
          <Grid item xs={12} md={6} key={meeting.id}>
            <Card
              sx={{
                p: 2.5,
                borderRadius: '20px',
                bgcolor: isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: tokens.brand.primary,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Chip
                    icon={<CalendarMonthIcon sx={{ fontSize: 13, color: 'inherit !important' }} />}
                    label={meeting.scheduledDate}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(93, 26, 137, 0.06)',
                      color: tokens.brand.primary,
                    }}
                  />
                  <Chip
                    label={meeting.status}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      bgcolor: meeting.isNext ? 'rgba(255, 127, 17, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      color: meeting.isNext ? '#FF7F11' : '#10B981',
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    fontWeight: 750,
                    fontSize: '0.98rem',
                    color: isDark ? '#FFFFFF' : tokens.text.primary,
                    mb: 0.5,
                  }}
                >
                  {meeting.title}
                </Typography>

                <Typography sx={{ fontSize: '0.8rem', color: isDark ? 'rgba(255, 255, 255, 0.5)' : tokens.text.secondary, mb: 2 }}>
                  {meeting.client} · Duration: {meeting.duration}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1.5, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` }}>
                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 26, height: 26, fontSize: '0.68rem', fontWeight: 800, bgcolor: tokens.brand.primary } }}>
                  {meeting.attendees.map((a) => (
                    <Avatar key={a}>{a}</Avatar>
                  ))}
                </AvatarGroup>

                <Button
                  size="small"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 750,
                    color: tokens.brand.primary,
                    textTransform: 'none',
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  View Details & Link ↗
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
