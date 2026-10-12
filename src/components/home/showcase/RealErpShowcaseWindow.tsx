import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '@/styles/theme';
import { useUIStore } from '@/store/useUIStore';

import { ShowcaseSidebar, type ShowcasePageId } from './ShowcaseSidebar';
import { ShowcaseHeader } from './ShowcaseHeader';
import { ShowcaseDashboard } from './ShowcaseDashboard';
import { ShowcaseTasks } from './ShowcaseTasks';
import { ShowcaseProjects } from './ShowcaseProjects';
import { ShowcaseSales } from './ShowcaseSales';
import { ShowcaseTeam } from './ShowcaseTeam';
import { ShowcaseAttendance } from './ShowcaseAttendance';
import { ShowcaseMeetings } from './ShowcaseMeetings';
import { ShowcaseChat } from './ShowcaseChat';
import { ShowcaseReports } from './ShowcaseReports';
import { ShowcaseAdmin } from './ShowcaseAdmin';

export const RealErpShowcaseWindow: React.FC = () => {
  const pageTheme = useUIStore((s) => s.theme);
  const [demoMode, setDemoMode] = useState<'dark' | 'light'>(pageTheme || 'light');
  const [activePage, setActivePage] = useState<ShowcasePageId>('dashboard');

  // Automatically update demo theme whenever the overall page theme mode switches
  useEffect(() => {
    setDemoMode(pageTheme);
  }, [pageTheme]);

  const isDemoDark = demoMode === 'dark';
  const currentDemoTheme = useMemo(() => (isDemoDark ? darkTheme : lightTheme), [isDemoDark]);

  const toggleDemoTheme = () => {
    setDemoMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeProvider theme={currentDemoTheme}>
      <Box
        sx={{
          borderRadius: { xs: '16px', md: '20px' },
          bgcolor: isDemoDark ? '#14111B' : '#FFFFFF',
          border: '1px solid',
          borderColor: isDemoDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          boxShadow: isDemoDark
            ? '0 20px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(93, 26, 137, 0.2)'
            : '0 20px 50px -15px rgba(93, 26, 137, 0.16), 0 8px 24px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
        }}
      >
        {/* 1. Sleek Window Chrome Header Bar */}
        <Box
          sx={{
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: isDemoDark ? 'rgba(255, 255, 255, 0.03)' : '#F9F8FC',
            borderBottom: '1px solid',
            borderColor: isDemoDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            transition: 'background-color 0.25s ease, border-color 0.25s ease',
          }}
        >
          {/* Left: Window Controls + Address */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#EF4444' }} />
              <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#F59E0B' }} />
              <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#10B981' }} />
            </Box>

            <Box
              sx={{
                px: 1.75,
                py: 0.3,
                borderRadius: '999px',
                bgcolor: isDemoDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
              }}
            >
              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#10B981' }} />
              <Typography
                variant="caption"
                sx={{
                  color: isDemoDark ? 'rgba(255, 255, 255, 0.65)' : 'text.secondary',
                  fontWeight: 650,
                  fontSize: '0.68rem',
                }}
              >
                erp.leapsofts.com/{activePage}
              </Typography>
            </Box>
          </Box>

          {/* Right: Real ERP Demo Badge */}
          <Chip
            label="REAL ERP DEMO"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              bgcolor: isDemoDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          />
        </Box>

        {/* 2. Main Window Area: Balanced Height & High-DPI View */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            height: { xs: 'auto', md: '590px' },
            maxHeight: '590px',
            bgcolor: isDemoDark ? '#14111B' : '#FAF8FD',
            transition: 'background-color 0.25s ease',
          }}
        >
          {/* Left: Authentic Leapsofts Sidebar */}
          <ShowcaseSidebar activePage={activePage} onSelectPage={setActivePage} />

          {/* Right: Authentic Top Application Header + Active Page View */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            <ShowcaseHeader onToggleTheme={toggleDemoTheme} demoTheme={demoMode} />
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: '540px',
                scrollbarWidth: 'thin',
              }}
            >
              {activePage === 'dashboard' && <ShowcaseDashboard />}
              {activePage === 'tasks' && <ShowcaseTasks />}
              {activePage === 'projects' && <ShowcaseProjects />}
              {activePage === 'sales' && <ShowcaseSales />}
              {activePage === 'team' && <ShowcaseTeam />}
              {activePage === 'attendance' && <ShowcaseAttendance />}
              {activePage === 'meetings' && <ShowcaseMeetings />}
              {activePage === 'chat' && <ShowcaseChat />}
              {activePage === 'reports' && <ShowcaseReports />}
              {activePage === 'admin' && <ShowcaseAdmin />}
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};
