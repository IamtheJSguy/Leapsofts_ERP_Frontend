import React from 'react';
import { Box, Typography, Button, Grid, useTheme } from '@mui/material';
import LocalCafeOutlinedIcon from '@mui/icons-material/LocalCafeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { tokens } from '@/styles/tokens';

export const ShowcaseDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const pipelineStats = [
    { label: 'TOTAL LEADS', val: '2,845', sub: '4 reps assigned' },
    { label: 'ACCEPTED', val: '142', sub: '78% connection rate' },
    { label: 'FOLLOW UPS', val: '38', sub: '12 awaiting reply' },
    { label: 'CALLS DIALED', val: '185', sub: 'Cold outreach' },
    { label: 'CALL FOLLOW UPS', val: '42', sub: 'Responses' },
    { label: 'REPLIED', val: '94', sub: '45% positive' },
    { label: 'NOT SENT', val: '18', sub: '<1% pipeline' },
    { label: 'QUALIFIED', val: '28', sub: 'Enterprise ready' },
  ];

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, pb: 2.5 }}>
      {/* 1. Header Greeting & Stylized Date Row */}
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
            Good evening, Huzaifa Rasheed
          </Typography>
          <Typography
            sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
              fontSize: '0.78rem',
            }}
          >
            Here&apos;s what&apos;s happening at{' '}
            <Box component="span" sx={{ fontWeight: 750, color: isDark ? '#FFFFFF' : tokens.text.primary }}>
              Leapsofts
            </Box>{' '}
            today.
          </Typography>
        </Box>

        {/* Stylized Date Pill */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            borderRadius: '16px',
            px: 1.5,
            py: 0.45,
            boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.02)',
            userSelect: 'none',
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '0.68rem',
              color: '#FF7F11',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: 1,
            }}
          >
            WED
          </Typography>
          <Box sx={{ width: '1px', height: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
          <Typography
            sx={{
              fontWeight: 850,
              fontSize: '1.15rem',
              color: isDark ? '#FFFFFF' : tokens.text.primary,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            7
          </Typography>
          <Box sx={{ width: '1px', height: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.72rem',
              color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              lineHeight: 1,
            }}
          >
            Oct 2026
          </Typography>
        </Box>
      </Box>

      {/* 2. Zen Focus Banner */}
      <Box
        sx={{
          mb: 2,
          p: 1.75,
          borderRadius: '16px',
          bgcolor: isDark ? 'rgba(28, 25, 36, 0.6)' : '#FFFFFF',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              flexShrink: 0,
            }}
          >
            <LocalCafeOutlinedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontWeight: 750,
                fontSize: '0.88rem',
                color: isDark ? '#FFFFFF' : tokens.text.primary,
                letterSpacing: '-0.01em',
              }}
            >
              Your schedule is clear!
            </Typography>
            <Typography
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.5)' : tokens.text.secondary,
                fontWeight: 500,
                fontSize: '0.74rem',
              }}
            >
              Enjoy your focus time or knock out some pending tasks.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
          sx={{
            borderRadius: '16px',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(93, 26, 137, 0.18)',
            color: tokens.brand.primary,
            fontWeight: 750,
            fontSize: '0.74rem',
            textTransform: 'none',
            px: 2,
            py: 0.45,
            whiteSpace: 'nowrap',
          }}
        >
          Go to Tasks
        </Button>
      </Box>

      {/* 3. Pipeline Overview Card */}
      <Box
        sx={{
          p: 1.75,
          borderRadius: '18px',
          bgcolor: isDark ? 'rgba(28, 25, 36, 0.6)' : '#FFFFFF',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
        }}
      >
        {/* Header bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.4,
                bgcolor: 'rgba(255, 127, 17, 0.08)',
                color: '#FF7F11',
                border: '1px solid rgba(255, 127, 17, 0.25)',
                borderRadius: '999px',
                px: 1,
                py: 0.2,
                fontSize: '0.6rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              <FlashOnIcon sx={{ fontSize: 11 }} />
              PIPELINE OVERVIEW
            </Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.82rem',
                color: isDark ? '#FFFFFF' : tokens.text.primary,
              }}
            >
              Team pipeline · All leads
            </Typography>
          </Box>

          <Button
            size="small"
            endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
            sx={{
              borderRadius: '14px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
              color: isDark ? '#FFFFFF' : tokens.text.primary,
              fontWeight: 700,
              fontSize: '0.72rem',
              textTransform: 'none',
              px: 1.5,
              py: 0.35,
            }}
          >
            Open Sales
          </Button>
        </Box>

        {/* 8 KPI Metric Cards Grid */}
        <Grid container spacing={1.25}>
          {pipelineStats.map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: '12px',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.012)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.035)'}`,
                  minHeight: '74px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.54rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: isDark ? 'rgba(255, 255, 255, 0.4)' : tokens.text.muted,
                  }}
                >
                  {stat.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1.25rem',
                    fontWeight: 850,
                    lineHeight: 1.1,
                    my: 0.25,
                    color: isDark ? '#FFFFFF' : tokens.text.primary,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stat.val}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.58rem',
                    fontWeight: 500,
                    color: isDark ? 'rgba(255, 255, 255, 0.45)' : tokens.text.secondary,
                  }}
                >
                  {stat.sub || ' '}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};
