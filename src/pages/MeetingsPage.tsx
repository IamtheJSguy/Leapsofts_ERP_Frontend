import { useEffect, useState } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { MeetingScheduler } from '@/components/meetings/MeetingScheduler';
import { MeetingList } from '@/components/meetings/MeetingList';
import { GoogleCalendarConnectPanel } from '@/components/meetings/GoogleCalendarConnectPanel';
import { tokens } from '@/styles/tokens';
import { useAuth } from '@/hooks/useAuth';

const MeetingsPage = () => {
  const [tab, setTab] = useState(0);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('meetingId')) {
      setTab(1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isCompact && tab !== 1) {
      setTab(1);
    }
  }, [isCompact, tab]);

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 4, minWidth: 0 }}>
      {/* Page Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.025em',
              mb: 0.5,
              fontSize: { xs: '1.45rem', sm: '2.125rem' },
              color: isDarkMode ? '#fff' : tokens.text.primary,
            }}
          >
            Meetings & Schedule
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
              fontSize: { xs: '0.86rem', sm: '0.92rem' },
            }}
          >
            Schedule and manage team sync calls, review sessions, and prospect demonstrations.
          </Typography>
        </Box>

        {isCompact ? (
          <Tooltip title="Schedule meeting" arrow>
            <IconButton
              aria-label="Schedule meeting"
              onClick={() => setSchedulerOpen(true)}
              sx={{
                flexShrink: 0,
                bgcolor: tokens.brand.solid,
                color: '#fff',
                width: 44,
                height: 44,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: tokens.brand.primaryDark,
                },
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setSchedulerOpen(true)}
            sx={{
              bgcolor: tokens.brand.solid,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.82rem',
              px: 3.5,
              py: 1.25,
              borderRadius: '24px',
              boxShadow: 'none',
              textTransform: 'none',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              '&:hover': {
                bgcolor: tokens.brand.primaryDark,
                transform: 'translateY(-1px)',
                boxShadow: 'none',
              },
            }}
          >
            Schedule Meeting
          </Button>
        )}
      </Box>

      <GoogleCalendarConnectPanel />

      {!isCompact && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mb: 4,
            p: 0.5,
            flexWrap: 'wrap',
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '16px',
            width: 'fit-content',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
          }}
        >
          <Button
            onClick={() => setTab(0)}
            sx={{
              flex: '0 0 auto',
              px: 3,
              py: 1,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: tab === 0
                ? (isDarkMode ? '#fff' : tokens.brand.primary)
                : 'text.secondary',
              bgcolor: tab === 0
                ? (isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff')
                : 'transparent',
              boxShadow: tab === 0 && !isDarkMode
                ? '0 1px 3px rgba(0,0,0,0.05)'
                : 'none',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: tab === 0
                  ? (isDarkMode ? 'rgba(255,255,255,0.12)' : '#fff')
                  : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
              }
            }}
          >
            Calendar
          </Button>
          <Button
            onClick={() => setTab(1)}
            sx={{
              flex: '0 0 auto',
              px: 3,
              py: 1,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: tab === 1
                ? (isDarkMode ? '#fff' : tokens.brand.primary)
                : 'text.secondary',
              bgcolor: tab === 1
                ? (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#fff')
                : 'transparent',
              boxShadow: tab === 1 && !isDarkMode
                ? '0 1px 3px rgba(0,0,0,0.05)'
                : 'none',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: tab === 1
                  ? (isDarkMode ? 'rgba(255,255,255,0.12)' : '#fff')
                  : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
              }
            }}
          >
            Meetings List
          </Button>
        </Box>
      )}

      {isCompact ? (
        <>
          <MeetingList
            onScheduleTrigger={() => setSchedulerOpen(true)}
            currentUser={user}
          />
          <MeetingScheduler
            showCalendar={false}
            dialogOpen={schedulerOpen}
            setDialogOpen={setSchedulerOpen}
            currentUser={user}
          />
        </>
      ) : (
        <>
          <Box sx={{ display: tab === 0 ? 'block' : 'none' }}>
            <MeetingScheduler
              dialogOpen={schedulerOpen}
              setDialogOpen={setSchedulerOpen}
              currentUser={user}
            />
          </Box>
          <Box sx={{ display: tab === 1 ? 'block' : 'none' }}>
            <MeetingList
              onScheduleTrigger={() => setSchedulerOpen(true)}
              currentUser={user}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default MeetingsPage;
