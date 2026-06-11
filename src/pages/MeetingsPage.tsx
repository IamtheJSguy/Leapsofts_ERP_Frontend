import { useState } from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { MeetingScheduler } from '@/components/meetings/MeetingScheduler';
import { MeetingList } from '@/components/meetings/MeetingList';
import { tokens } from '@/styles/tokens';
import { useAuth } from '@/hooks/useAuth';

const MeetingsPage = () => {
  const [tab, setTab] = useState(0);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 4 }}>
      {/* Page Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.025em',
              mb: 0.5,
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
              fontSize: '0.92rem',
            }}
          >
            Schedule and manage team sync calls, review sessions, and prospect demonstrations.
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setSchedulerOpen(true)}
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.82rem',
              px: 3.5,
              py: 1.25,
              borderRadius: '24px',
              boxShadow: 'none',
              textTransform: 'none',
              transition: 'all 0.2s ease',
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

      {/* Translucent Tab Navigation Pill Switcher */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 4,
          p: 0.5,
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
          borderRadius: '16px',
          width: 'fit-content',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
        }}
      >
        <Button
          onClick={() => setTab(0)}
          sx={{
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
                ? (isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#fff')
                : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
            }
          }}
        >
          Meetings List
        </Button>
      </Box>

      {/* Tab Panels */}
      {tab === 0 ? (
        <MeetingScheduler dialogOpen={schedulerOpen} setDialogOpen={setSchedulerOpen} />
      ) : (
        <MeetingList
          onScheduleTrigger={
            isAdmin
              ? () => {
                  setTab(0);
                  setSchedulerOpen(true);
                }
              : undefined
          }
        />
      )}
    </Box>
  );
};

export default MeetingsPage;
