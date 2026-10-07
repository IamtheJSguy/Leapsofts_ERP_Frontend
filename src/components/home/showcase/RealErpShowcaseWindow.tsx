import React, { useState } from 'react';
import { Box, Typography, Chip, useTheme } from '@mui/material';

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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activePage, setActivePage] = useState<ShowcasePageId>('dashboard');

  return (
    <Box
      sx={{
        borderRadius: { xs: '16px', md: '20px' },
        bgcolor: isDark ? '#14111B' : '#FFFFFF',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        boxShadow: isDark
          ? '0 20px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(93, 26, 137, 0.2)'
          : '0 20px 50px -15px rgba(93, 26, 137, 0.16), 0 8px 24px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
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
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9F8FC',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
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
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#10B981' }} />
            <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'text.secondary', fontWeight: 650, fontSize: '0.68rem' }}>
              erp.leapsofts.com/{activePage}
            </Typography>
          </Box>
        </Box>

        {/* Right Badge */}
        <Chip
          label="REAL ERP DEMO"
          size="small"
          sx={{
            height: 20,
            fontSize: '0.62rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
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
          height: { xs: 'auto', md: '530px' },
          maxHeight: '530px',
          bgcolor: isDark ? '#14111B' : '#FAF8FD',
        }}
      >
        {/* Left: Authentic Leapsofts Sidebar */}
        <ShowcaseSidebar activePage={activePage} onSelectPage={setActivePage} />

        {/* Right: Authentic Top Application Header + Active Page View */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <ShowcaseHeader />
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '480px',
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
  );
};
