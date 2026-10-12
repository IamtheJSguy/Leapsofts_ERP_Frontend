import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  Chip,
  Avatar,
  AvatarGroup,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VideocamIcon from '@mui/icons-material/Videocam';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { tokens } from '@/styles/tokens';

export interface ShowcaseMeeting {
  id: string;
  title: string;
  type: 'client' | 'internal' | 'demo';
  scheduledDate: string;
  time: string;
  duration: string;
  timeframe: 'today' | 'upcoming' | 'past';
  status: 'live_soon' | 'today' | 'scheduled' | 'completed';
  leadName?: string;
  leadCompany?: string;
  host: string;
  participants: { name: string; avatar?: string }[];
  meetUrl: string;
}

const INITIAL_MEETINGS: ShowcaseMeeting[] = [
  {
    id: 'm-1',
    title: 'Enterprise Architecture & Cloud Rollout',
    type: 'client',
    scheduledDate: 'Today, Oct 8',
    time: '06:30 PM',
    duration: '45 mins',
    timeframe: 'today',
    status: 'live_soon',
    leadName: 'David C. Sterling',
    leadCompany: 'Apex Cloud Solutions',
    host: 'Huzaifa Rasheed',
    participants: [
      { name: 'Huzaifa Rasheed' },
      { name: 'David C. Sterling' },
      { name: 'Sarah Jenkins' },
    ],
    meetUrl: 'https://meet.google.com/xyz-demo-sync',
  },
  {
    id: 'm-2',
    title: 'Q4 Sales Pipeline Review & Growth Targets',
    type: 'internal',
    scheduledDate: 'Tomorrow, Oct 9',
    time: '10:00 AM',
    duration: '30 mins',
    timeframe: 'upcoming',
    status: 'scheduled',
    host: 'Sarah Jenkins',
    participants: [
      { name: 'Sarah Jenkins' },
      { name: 'Huzaifa Rasheed' },
      { name: 'Marcus Vance' },
      { name: 'Elena Rostova' },
    ],
    meetUrl: 'https://meet.google.com/sales-review-q4',
  },
  {
    id: 'm-3',
    title: 'Global Procurement Proposal Discovery',
    type: 'demo',
    scheduledDate: 'Friday, Oct 11',
    time: '03:00 PM',
    duration: '60 mins',
    timeframe: 'upcoming',
    status: 'scheduled',
    leadName: 'Rachel Montoya',
    leadCompany: 'FinTech Logistics Ltd',
    host: 'Huzaifa Rasheed',
    participants: [
      { name: 'Huzaifa Rasheed' },
      { name: 'Rachel Montoya' },
    ],
    meetUrl: 'https://meet.google.com/apex-procure-sync',
  },
  {
    id: 'm-4',
    title: 'BioScale Health CRM Migration Sprint Demo',
    type: 'demo',
    scheduledDate: 'Monday, Oct 6',
    time: '02:00 PM',
    duration: '45 mins',
    timeframe: 'past',
    status: 'completed',
    leadName: 'Elena Rostova',
    leadCompany: 'Horizon BioScale',
    host: 'Marcus Vance',
    participants: [
      { name: 'Marcus Vance' },
      { name: 'Elena Rostova' },
      { name: 'Huzaifa Rasheed' },
    ],
    meetUrl: 'https://meet.google.com/bioscale-demo',
  },
];

export const ShowcaseMeetings: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [meetings, setMeetings] = useState<ShowcaseMeeting[]>(INITIAL_MEETINGS);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (timeFilter === 'all') return true;
      return m.timeframe === timeFilter;
    });
  }, [meetings, timeFilter]);

  const handleQuickSchedule = () => {
    const newMeeting: ShowcaseMeeting = {
      id: `m-${Date.now()}`,
      title: 'Prospect Strategy & Workflow Review',
      type: 'demo',
      scheduledDate: 'Tomorrow, Oct 9',
      time: '04:30 PM',
      duration: '30 mins',
      timeframe: 'upcoming',
      status: 'scheduled',
      leadName: 'Katherine Zhao',
      leadCompany: 'NextGen Automation AI',
      host: 'Huzaifa Rasheed',
      participants: [{ name: 'Huzaifa Rasheed' }, { name: 'Katherine Zhao' }],
      meetUrl: 'https://meet.google.com/quick-strategy',
    };
    setMeetings((prev) => [newMeeting, ...prev]);
    setScheduledSuccess(true);
    setTimeout(() => setScheduledSuccess(false), 2500);
  };

  return (
    <Box sx={{ p: { xs: 1.25, sm: 1.5 }, display: 'flex', flexDirection: 'column', gap: 1.25, pb: 2 }}>
      {/* 1. Header (Compact, enterprise-aligned) */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              sx={{
                fontWeight: 850,
                letterSpacing: '-0.02em',
                color: isDark ? '#FFFFFF' : tokens.text.primary,
                fontSize: { xs: '0.98rem', sm: '1.08rem' },
              }}
            >
              Meetings & Schedule
            </Typography>
            <Chip
              label={`${meetings.length} Total`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.64rem',
                fontWeight: 800,
                bgcolor: isDark ? 'rgba(93, 26, 137, 0.25)' : 'rgba(93, 26, 137, 0.08)',
                color: tokens.brand.primary,
              }}
            />
          </Box>
          <Typography
            sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
              fontSize: '0.68rem',
            }}
          >
            Schedule and manage team sync calls, review sessions, and prospect demonstrations.
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="small"
          startIcon={scheduledSuccess ? <CheckCircleIcon sx={{ fontSize: 13 }} /> : <AddIcon sx={{ fontSize: 13 }} />}
          onClick={handleQuickSchedule}
          sx={{
            bgcolor: scheduledSuccess ? '#10B981' : tokens.brand.primary,
            color: '#FFFFFF',
            fontWeight: 750,
            fontSize: '0.68rem',
            px: 1.5,
            py: 0.5,
            height: 28,
            borderRadius: '16px',
            textTransform: 'none',
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: scheduledSuccess ? '#059669' : tokens.brand.primaryLight,
              boxShadow: 'none',
            },
          }}
        >
          {scheduledSuccess ? 'Meeting Scheduled' : 'Schedule Meeting'}
        </Button>
      </Box>

      {/* 2. Spotlight "Next Meeting Live Soon" Banner (Slim, elegant hero card) */}
      <Box
        sx={{
          p: 1.25,
          borderRadius: '14px',
          bgcolor: isDark ? 'rgba(30, 27, 36, 0.65)' : '#FFFFFF',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
          boxShadow: isDark ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: 'rgba(255, 127, 17, 0.12)',
              border: '1px solid rgba(255, 127, 17, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF7F11',
              flexShrink: 0,
            }}
          >
            <VideocamIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Chip
                label="LIVE SOON · IN 14 MINS"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.58rem',
                  fontWeight: 850,
                  bgcolor: 'rgba(255, 127, 17, 0.15)',
                  color: '#FF7F11',
                  borderRadius: '4px',
                }}
              />
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  color: isDark ? '#FFFFFF' : tokens.text.primary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Enterprise Architecture & Cloud Rollout
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '0.67rem',
                color: isDark ? 'rgba(255, 255, 255, 0.5)' : tokens.text.secondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                mt: 0.2,
              }}
            >
              Lead: <Box component="span" fontWeight={750} color={isDark ? '#fff' : tokens.text.primary}>David C. Sterling</Box> · Apex Cloud Solutions · Host: Huzaifa Rasheed
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F5F3F8',
              borderRadius: '8px',
              px: 1,
              py: 0.3,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontWeight: 850, fontSize: '0.78rem', color: isDark ? '#FFFFFF' : tokens.text.primary, fontVariantNumeric: 'tabular-nums' }}>
              00:14:25
            </Typography>
            <Typography sx={{ fontSize: '0.52rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
              Countdown
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="small"
            endIcon={<OpenInNewIcon sx={{ fontSize: 11 }} />}
            onClick={() => window.open('https://meet.google.com/xyz-demo-sync', '_blank', 'noopener,noreferrer')}
            sx={{
              background: `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.accentLight} 100%)`,
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.72rem',
              height: 28,
              borderRadius: '14px',
              px: 1.5,
              textTransform: 'none',
              boxShadow: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(255, 127, 17, 0.3)',
              },
            }}
          >
            Join Meet
          </Button>
        </Box>
      </Box>

      {/* 3. Controls Bar: Time Filter Pills & View Mode Toggle (Exact match to real MeetingList.tsx) */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        {/* iOS-Style Segmented Time Control */}
        <Box
          sx={{
            display: 'inline-flex',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '16px',
            p: 0.35,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          }}
        >
          {(['all', 'today', 'upcoming', 'past'] as const).map((filter) => (
            <Button
              key={filter}
              size="small"
              onClick={() => setTimeFilter(filter)}
              sx={{
                px: 1.5,
                py: 0.3,
                borderRadius: '12px',
                textTransform: 'capitalize',
                fontWeight: 750,
                fontSize: '0.72rem',
                color: timeFilter === filter
                  ? (isDark ? '#FFFFFF' : tokens.brand.primary)
                  : 'text.secondary',
                bgcolor: timeFilter === filter
                  ? (isDark ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF')
                  : 'transparent',
                boxShadow: timeFilter === filter && !isDark ? '0 1px 4px rgba(0, 0, 0, 0.06)' : 'none',
                minWidth: 'auto',
                transition: 'all 0.18s ease',
              }}
            >
              {filter}
            </Button>
          ))}
        </Box>

        {/* View Mode Toggle: Grid / List */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.4,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
            p: 0.35,
            borderRadius: '10px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          }}
        >
          <IconButton
            size="small"
            onClick={() => setViewMode('list')}
            sx={{
              width: 26,
              height: 26,
              borderRadius: '8px',
              bgcolor: viewMode === 'list' ? (isDark ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF') : 'transparent',
              color: viewMode === 'list' ? tokens.brand.primaryLight : 'text.secondary',
              boxShadow: viewMode === 'list' && !isDark ? '0 1px 4px rgba(0, 0, 0, 0.06)' : 'none',
            }}
          >
            <ViewListIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setViewMode('grid')}
            sx={{
              width: 26,
              height: 26,
              borderRadius: '8px',
              bgcolor: viewMode === 'grid' ? (isDark ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF') : 'transparent',
              color: viewMode === 'grid' ? tokens.brand.primaryLight : 'text.secondary',
              boxShadow: viewMode === 'grid' && !isDark ? '0 1px 4px rgba(0, 0, 0, 0.06)' : 'none',
            }}
          >
            <ViewModuleIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      {/* 4. Meetings Content (List View vs Grid View matching real MeetingList.tsx) */}
      {viewMode === 'list' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filteredMeetings.map((meeting) => {
            const isLiveSoon = meeting.status === 'live_soon';
            const isCompleted = meeting.status === 'completed';

            return (
              <Card
                key={meeting.id}
                sx={{
                  px: 1.5,
                  py: 1.1,
                  borderRadius: '12px',
                  bgcolor: isDark ? 'rgba(30, 27, 36, 0.55)' : '#FFFFFF',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                  boxShadow: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  transition: 'all 0.18s ease',
                  opacity: isCompleted ? 0.75 : 1,
                  '&:hover': {
                    borderColor: isDark ? 'rgba(123, 61, 168, 0.35)' : 'rgba(93, 26, 137, 0.2)',
                    bgcolor: isDark ? 'rgba(30, 27, 36, 0.75)' : '#FAF9FC',
                  },
                }}
              >
                {/* Left: Videocam Icon + Title + Linked Lead Chip */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1.4 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      bgcolor: isLiveSoon
                        ? 'rgba(255, 127, 17, 0.12)'
                        : isCompleted
                          ? (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)')
                          : (isDark ? 'rgba(123, 61, 168, 0.15)' : 'rgba(93, 26, 137, 0.06)'),
                      color: isLiveSoon
                        ? '#FF7F11'
                        : isCompleted
                          ? 'text.disabled'
                          : tokens.brand.primaryLight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <VideocamIcon sx={{ fontSize: 18 }} />
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        lineHeight: 1.2,
                        color: isCompleted
                          ? (isDark ? 'rgba(255, 255, 255, 0.5)' : 'text.disabled')
                          : (isDark ? '#FFFFFF' : tokens.text.primary),
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {meeting.title}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.3 }}>
                      {meeting.leadName && (
                        <Chip
                          size="small"
                          icon={<PersonOutlineIcon sx={{ fontSize: '11px !important' }} />}
                          label={`${meeting.leadName} (${meeting.leadCompany || 'Lead'})`}
                          sx={{
                            height: 18,
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            bgcolor: isDark ? 'rgba(123, 61, 168, 0.15)' : 'rgba(93, 26, 137, 0.06)',
                            color: tokens.brand.primaryLight,
                            maxWidth: 180,
                            '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                          }}
                        />
                      )}
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.64rem', whiteSpace: 'nowrap' }}>
                        Host: {meeting.host}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Middle: Date & Time Display Block (Like real MeetingList.tsx) */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1.2,
                    py: 0.4,
                    borderRadius: '8px',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F9F8F7',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: 12, color: tokens.brand.primaryLight }} />
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? '#fff' : tokens.text.primary }}>
                      {meeting.scheduledDate}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 12, color: tokens.brand.primaryLight }} />
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? '#fff' : tokens.text.primary }}>
                      {meeting.time} ({meeting.duration})
                    </Typography>
                  </Box>
                </Box>

                {/* Right: Attendees + Join Button */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                  <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.6rem', fontWeight: 800, bgcolor: tokens.brand.primary } }}>
                    {meeting.participants.map((p, pIdx) => (
                      <Tooltip key={pIdx} title={p.name}>
                        <Avatar>{p.name.charAt(0)}</Avatar>
                      </Tooltip>
                    ))}
                  </AvatarGroup>

                  <Button
                    variant={isLiveSoon ? 'contained' : 'outlined'}
                    size="small"
                    endIcon={<OpenInNewIcon sx={{ fontSize: 10 }} />}
                    onClick={() => window.open(meeting.meetUrl, '_blank', 'noopener,noreferrer')}
                    disabled={isCompleted}
                    sx={{
                      height: 24,
                      fontSize: '0.67rem',
                      fontWeight: 750,
                      borderRadius: '12px',
                      px: 1.2,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      bgcolor: isLiveSoon ? tokens.brand.accent : 'transparent',
                      color: isLiveSoon ? '#FFFFFF' : isDark ? '#FFFFFF' : tokens.text.primary,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                      '&:hover': {
                        bgcolor: isLiveSoon ? tokens.brand.accentDark : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    {isCompleted ? 'Finished' : isLiveSoon ? 'Join Now' : 'Join Call'}
                  </Button>
                </Box>
              </Card>
            );
          })}
        </Box>
      ) : (
        /* Grid View matching real MeetingList.tsx card layout */
        <Grid container spacing={1.25}>
          {filteredMeetings.map((meeting) => {
            const isLiveSoon = meeting.status === 'live_soon';
            const isCompleted = meeting.status === 'completed';

            return (
              <Grid item xs={12} sm={6} md={4} key={meeting.id}>
                <Card
                  sx={{
                    p: 1.5,
                    borderRadius: '14px',
                    bgcolor: isDark ? 'rgba(30, 27, 36, 0.55)' : '#FFFFFF',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 1.25,
                    height: '100%',
                    transition: 'all 0.18s ease',
                    opacity: isCompleted ? 0.75 : 1,
                    '&:hover': {
                      borderColor: isDark ? 'rgba(123, 61, 168, 0.35)' : 'rgba(93, 26, 137, 0.2)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          bgcolor: isLiveSoon
                            ? 'rgba(255, 127, 17, 0.12)'
                            : isCompleted
                              ? (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)')
                              : (isDark ? 'rgba(123, 61, 168, 0.15)' : 'rgba(93, 26, 137, 0.06)'),
                          color: isLiveSoon
                            ? '#FF7F11'
                            : isCompleted
                              ? 'text.disabled'
                              : tokens.brand.primaryLight,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <VideocamIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Chip
                        label={isLiveSoon ? 'LIVE SOON' : isCompleted ? 'COMPLETED' : 'SCHEDULED'}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.58rem',
                          fontWeight: 850,
                          bgcolor: isLiveSoon
                            ? 'rgba(255, 127, 17, 0.15)'
                            : isCompleted
                              ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')
                              : 'rgba(16, 185, 129, 0.12)',
                          color: isLiveSoon ? '#FF7F11' : isCompleted ? 'text.secondary' : '#10B981',
                          borderRadius: '4px',
                        }}
                      />
                    </Box>

                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        lineHeight: 1.25,
                        color: isDark ? '#FFFFFF' : tokens.text.primary,
                        mb: 0.5,
                      }}
                    >
                      {meeting.title}
                    </Typography>

                    {meeting.leadName && (
                      <Chip
                        size="small"
                        icon={<PersonOutlineIcon sx={{ fontSize: '11px !important' }} />}
                        label={`${meeting.leadName} (${meeting.leadCompany || 'Lead'})`}
                        sx={{
                          height: 18,
                          fontSize: '0.62rem',
                          fontWeight: 750,
                          bgcolor: isDark ? 'rgba(123, 61, 168, 0.15)' : 'rgba(93, 26, 137, 0.06)',
                          color: tokens.brand.primaryLight,
                          mb: 1,
                        }}
                      />
                    )}

                    <Box
                      sx={{
                        p: 0.8,
                        borderRadius: '8px',
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F9F8F7',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 11, color: tokens.brand.primaryLight }} />
                        <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: isDark ? '#fff' : tokens.text.primary }}>
                          {meeting.scheduledDate}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 11, color: tokens.brand.primaryLight }} />
                        <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: isDark ? '#fff' : tokens.text.primary }}>
                          {meeting.time}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.5 }}>
                    <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.6rem', fontWeight: 800, bgcolor: tokens.brand.primary } }}>
                      {meeting.participants.map((p, pIdx) => (
                        <Tooltip key={pIdx} title={p.name}>
                          <Avatar>{p.name.charAt(0)}</Avatar>
                        </Tooltip>
                      ))}
                    </AvatarGroup>

                    <Button
                      size="small"
                      variant={isLiveSoon ? 'contained' : 'outlined'}
                      endIcon={<OpenInNewIcon sx={{ fontSize: 10 }} />}
                      onClick={() => window.open(meeting.meetUrl, '_blank', 'noopener,noreferrer')}
                      disabled={isCompleted}
                      sx={{
                        height: 24,
                        fontSize: '0.67rem',
                        fontWeight: 750,
                        borderRadius: '12px',
                        px: 1.2,
                        textTransform: 'none',
                        bgcolor: isLiveSoon ? tokens.brand.accent : 'transparent',
                        color: isLiveSoon ? '#FFFFFF' : isDark ? '#FFFFFF' : tokens.text.primary,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                        boxShadow: 'none',
                      }}
                    >
                      {isCompleted ? 'Finished' : 'Join'}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};
