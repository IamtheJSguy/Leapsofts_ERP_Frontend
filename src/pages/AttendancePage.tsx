import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Pagination,
  useTheme,
  CircularProgress,
  Grid,
  Card,
  LinearProgress,
  Avatar,
  TextField,
  InputAdornment,
  Divider,
  Drawer,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { tokens } from '@/styles/tokens';
import { useShiftHistory, useTeamAttendanceSummary } from '@/hooks/api/useShifts';
import { useUsers } from '@/hooks/api/useUsers';
import { useAuthStore } from '@/store/useAuthStore';
import { format } from 'date-fns';

export const AttendancePage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const currentUser = useAuthStore((s) => s.user);
  const isAdminView = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // --- Personal User States & Queries ---
  const [page, setPage] = useState(1);
  const [userFilterType, setUserFilterType] = useState<'last30' | 'month' | 'date'>('last30');
  const [userFilterMonth, setUserFilterMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [userFilterDate, setUserFilterDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const userQueryRange = useMemo(() => {
    const today = new Date();
    if (userFilterType === 'last30') {
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 29);
      return {
        startDate: format(pastDate, 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    } else if (userFilterType === 'month') {
      const [year, month] = userFilterMonth.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
      };
    } else {
      return {
        startDate: userFilterDate,
        endDate: userFilterDate,
      };
    }
  }, [userFilterType, userFilterMonth, userFilterDate]);

  const { data: historyData, isLoading } = useShiftHistory({
    startDate: userQueryRange.startDate,
    endDate: userQueryRange.endDate,
    page: 1,
    limit: 100,
  });

  const userMergedShifts = useMemo(() => {
    const start = new Date(userQueryRange.startDate);
    const end = new Date(userQueryRange.endDate);
    
    const list: Date[] = [];
    const temp = new Date(end);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    while (temp >= start) {
      const dateStr = format(temp, 'yyyy-MM-dd');
      if (dateStr <= todayStr) {
        list.push(new Date(temp));
      }
      temp.setDate(temp.getDate() - 1);
    }
    
    const shiftsArray = historyData?.shifts || [];
    
    return list.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const shift = shiftsArray.find((s: any) => {
        const sDate = new Date(s.date);
        return format(sDate, 'yyyy-MM-dd') === dateStr;
      });

      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      if (shift) {
        return {
          id: shift._id,
          date,
          checkInTime: shift.checkInTime,
          checkOutTime: shift.checkOutTime,
          totalMinutes: shift.totalMinutes,
          status: shift.status,
          exists: true,
          scheduledStart: shift.scheduledStart,
          scheduledEnd: shift.scheduledEnd,
        };
      } else {
        return {
          id: dateStr,
          date,
          checkInTime: null,
          checkOutTime: null,
          totalMinutes: 0,
          status: isWeekend ? 'weekend' : 'absent',
          exists: false,
          scheduledStart: currentUser?.shiftStart || '09:00',
          scheduledEnd: currentUser?.shiftEnd || '17:00',
        };
      }
    });
  }, [userQueryRange, historyData, currentUser]);

  const userLimit = 10;
  const userTotalDaysCount = userMergedShifts.length;
  
  const userPaginatedMergedShifts = useMemo(() => {
    const startIndex = (page - 1) * userLimit;
    return userMergedShifts.slice(startIndex, startIndex + userLimit);
  }, [userMergedShifts, page]);

  // --- Admin States & Queries ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailPage, setDetailPage] = useState(1);

  // Filters for dynamic view (by day, month, date)
  const [filterType, setFilterType] = useState<'last30' | 'month' | 'date'>('last30');
  const [filterMonth, setFilterMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [filterDate, setFilterDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const availableMonths = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      list.push({
        value: format(d, 'yyyy-MM'),
        label: format(d, 'MMMM yyyy'),
      });
    }
    return list;
  }, []);

  const queryRange = useMemo(() => {
    if (!selectedUser) return null;
    const today = new Date();
    
    if (filterType === 'last30') {
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 29);
      return {
        startDate: format(pastDate, 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    } else if (filterType === 'month') {
      const [year, month] = filterMonth.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0); // last day of month
      return {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
      };
    } else {
      return {
        startDate: filterDate,
        endDate: filterDate,
      };
    }
  }, [filterType, filterMonth, filterDate, selectedUser]);

  const { data: allUsers = [], isLoading: isUsersLoading } = useUsers();
  const { data: teamSummary, isLoading: isTeamSummaryLoading } = useTeamAttendanceSummary();
  const { data: userHistoryData, isLoading: isUserHistoryLoading } = useShiftHistory(
    selectedUser && queryRange
      ? { userId: selectedUser._id, startDate: queryRange.startDate, endDate: queryRange.endDate, page: 1, limit: 100 }
      : undefined
  );

  const mergedShifts = useMemo(() => {
    if (!queryRange) return [];
    
    const start = new Date(queryRange.startDate);
    const end = new Date(queryRange.endDate);
    
    const list: Date[] = [];
    const temp = new Date(end);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    while (temp >= start) {
      const dateStr = format(temp, 'yyyy-MM-dd');
      if (dateStr <= todayStr) {
        list.push(new Date(temp));
      }
      temp.setDate(temp.getDate() - 1);
    }
    
    const shiftsArray = userHistoryData?.shifts || [];
    
    return list.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const shift = shiftsArray.find((s: any) => {
        const sDate = new Date(s.date);
        return format(sDate, 'yyyy-MM-dd') === dateStr;
      });

      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      if (shift) {
        return {
          id: shift._id,
          date,
          checkInTime: shift.checkInTime,
          checkOutTime: shift.checkOutTime,
          totalMinutes: shift.totalMinutes,
          status: shift.status,
          exists: true,
        };
      } else {
        return {
          id: dateStr,
          date,
          checkInTime: null,
          checkOutTime: null,
          totalMinutes: 0,
          status: isWeekend ? 'weekend' : 'absent',
          exists: false,
        };
      }
    });
  }, [queryRange, userHistoryData]);

  const limit = 8;
  const totalDaysCount = mergedShifts.length;
  
  const paginatedMergedShifts = useMemo(() => {
    const startIndex = (detailPage - 1) * limit;
    return mergedShifts.slice(startIndex, startIndex + limit);
  }, [mergedShifts, detailPage]);

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    return format(new Date(dateString), 'hh:mm a');
  };

  const formatHours = (minutes: number) => {
    if (!minutes) return '0h 0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in':
        return tokens.semantic.success;
      case 'checked_out':
        return tokens.semantic.info;
      case 'absent':
        return tokens.semantic.error;
      case 'weekend':
        return tokens.semantic.neutral;
      default:
        return 'text.secondary';
    }
  };

  // --- Filtered Users for Admin Directory ---
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    const nonAdminUsers = allUsers.filter((u: any) => u.role !== 'admin');
    const query = searchQuery.trim().toLowerCase();
    if (!query) return nonAdminUsers;
    return nonAdminUsers.filter((user: any) => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [allUsers, searchQuery]);

  // Personal view metrics
  const totalHoursWorked = useMemo(() => {
    if (!historyData?.shifts) return 0;
    return historyData.shifts.reduce((acc: number, shift: any) => acc + (shift.totalMinutes || 0), 0);
  }, [historyData]);

  const punctualityScore = useMemo(() => {
    if (!historyData?.shifts || historyData.shifts.length === 0) return 100;
    return 95;
  }, [historyData]);

  // -------------------------------------------------------------
  // RENDER ADMIN VIEW
  // -------------------------------------------------------------
  if (isAdminView) {
    return (
      <Box className="animate-fade-in-up" sx={{ pb: 6, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
              Team Attendance
            </Typography>
            <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary, fontWeight: 500 }}>
              Monitor daily check-ins, active durations, and team shift logs.
            </Typography>
          </Box>
        </Box>

        {/* KPI Widgets */}
        <Grid container spacing={3.5} sx={{ mb: 4.5 }}>
          {[
            {
              title: 'Active Now',
              value: isTeamSummaryLoading ? '...' : `${teamSummary?.checkedIn || 0} / ${teamSummary?.totalUsers || 0}`,
              icon: <PeopleIcon sx={{ fontSize: 26 }} />,
              color: '#3B82F6',
              bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
              hoverBorder: '#3B82F6',
              trend: 'Team members checked in today',
            },
            {
              title: 'Punctuality Today',
              value: isTeamSummaryLoading ? '...' : `${teamSummary?.punctualityRate || 100}%`,
              icon: <CheckCircleOutlineIcon sx={{ fontSize: 26 }} />,
              color: tokens.semantic.success,
              bgcolor: isDarkMode ? 'rgba(45, 138, 94, 0.15)' : 'rgba(45, 138, 94, 0.08)',
              hoverBorder: tokens.semantic.success,
              trend: 'Checked in within grace period',
            },
            {
              title: 'Total Hours Today',
              value: isTeamSummaryLoading ? '...' : formatHours(teamSummary?.totalMinutesWorkedToday || 0),
              icon: <TimerIcon sx={{ fontSize: 26 }} />,
              color: tokens.brand.primary,
              bgcolor: isDarkMode ? 'rgba(155, 107, 184, 0.15)' : 'rgba(93, 26, 137, 0.08)',
              hoverBorder: tokens.brand.primary,
              trend: 'Cumulative shift hours today',
            },
          ].map((kpi, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Card
                sx={{
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  borderRadius: '24px',
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(26, 22, 37, 0.04)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: tokens.shadow.cardHover,
                    borderColor: kpi.hoverBorder,
                  }
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    bgcolor: kpi.bgcolor,
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {kpi.icon}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: '0.68rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {kpi.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: kpi.color, mt: 0.5 }}>
                    {kpi.value}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Directory Header with Search */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.01em' }}>
            Employees Directory
          </Typography>
          <TextField
            placeholder="Search employee..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
                '& fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                '&:hover fieldset': { borderColor: tokens.brand.primary },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Employees Grid list */}
        {isUsersLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: tokens.brand.primary }} />
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: '24px',
              border: `2px dashed ${tokens.surface.border}`,
              bgcolor: 'transparent',
              boxShadow: 'none',
            }}
          >
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 650 }}>
              No employees found matching the search.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredUsers.map((user: any) => {
              const initial = (user.firstName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase();
              const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
              const isOnline = teamSummary?.onlineMembers?.some((m: any) => m._id === user._id);

              return (
                <Grid item xs={12} sm={6} md={4} key={user._id}>
                  <Card
                    onClick={() => {
                      setSelectedUser(user);
                      setDetailPage(1);
                    }}
                    sx={{
                      p: 3,
                      borderRadius: '20px',
                      bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                      cursor: 'pointer',
                      boxShadow: isDarkMode ? 'none' : '0 2px 6px rgba(0,0,0,0.015)',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: tokens.brand.primary,
                        boxShadow: tokens.shadow.cardHover,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Avatar sx={{ width: 46, height: 46, bgcolor: tokens.brand.primaryMuted, fontWeight: 700 }}>{initial}</Avatar>
                      <Chip
                        label={isOnline ? 'Online' : 'Offline'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          bgcolor: isOnline ? 'rgba(16, 185, 129, 0.08)' : 'rgba(113, 113, 122, 0.08)',
                          color: isOnline ? tokens.semantic.success : 'text.secondary',
                          border: `1px solid ${isOnline ? 'rgba(16,185,129,0.15)' : 'rgba(113,113,122,0.15)'}`,
                        }}
                      />
                    </Box>

                    <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                      {user.email}
                    </Typography>
                    {user.jobTitle && (
                      <Typography variant="caption" sx={{ color: tokens.brand.primary, fontWeight: 700, mt: 0.5, display: 'block' }}>
                        {user.jobTitle}
                      </Typography>
                    )}
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Detailed User History Drawer */}
        <Drawer
          anchor="right"
          open={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: 460 },
              p: 3.5,
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(16px)',
              borderLeft: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            }
          }}
        >
          {selectedUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Drawer Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                    Shift Logs
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                    Detailed records for {selectedUser.firstName || selectedUser.email}
                  </Typography>
                </Box>
                <IconButton onClick={() => setSelectedUser(null)} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* User Bio Card */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Avatar sx={{ width: 50, height: 50, bgcolor: tokens.brand.primary, fontWeight: 700 }}>
                  {(selectedUser.firstName?.charAt(0) || 'U').toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {selectedUser.email}
                  </Typography>
                  {selectedUser.jobTitle && (
                    <Typography variant="caption" sx={{ color: tokens.brand.primary, fontWeight: 750 }}>
                      {selectedUser.jobTitle}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Filter Controls */}
              <Box sx={{ mb: 3.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Filter History
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[
                    { id: 'last30', label: 'Last 30 Days' },
                    { id: 'month', label: 'By Month' },
                    { id: 'date', label: 'By Date' },
                  ].map((btn) => (
                    <Chip
                      key={btn.id}
                      label={btn.label}
                      clickable
                      onClick={() => {
                        setFilterType(btn.id as any);
                        setDetailPage(1);
                      }}
                      sx={{
                        fontWeight: 700,
                        bgcolor: filterType === btn.id ? tokens.brand.primary : 'transparent',
                        color: filterType === btn.id ? '#fff' : 'text.primary',
                        border: `1px solid ${filterType === btn.id ? tokens.brand.primary : 'rgba(0,0,0,0.12)'}`,
                        '&:hover': {
                          bgcolor: filterType === btn.id ? tokens.brand.primary : 'rgba(0,0,0,0.04)',
                        }
                      }}
                    />
                  ))}
                </Box>

                {filterType === 'month' && (
                  <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                    <InputLabel id="month-select-label">Select Month</InputLabel>
                    <Select
                      labelId="month-select-label"
                      value={filterMonth}
                      label="Select Month"
                      onChange={(e) => {
                        setFilterMonth(e.target.value);
                        setDetailPage(1);
                      }}
                      sx={{ borderRadius: '12px' }}
                    >
                      {availableMonths.map((m) => (
                        <MenuItem key={m.value} value={m.value}>
                          {m.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {filterType === 'date' && (
                  <TextField
                    type="date"
                    size="small"
                    fullWidth
                    label="Select Date"
                    InputLabelProps={{ shrink: true }}
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      setDetailPage(1);
                    }}
                    sx={{
                      mt: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                )}
              </Box>

              {/* Shift list content */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isUserHistoryLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={28} sx={{ color: tokens.brand.primary }} />
                  </Box>
                ) : paginatedMergedShifts.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 4, textAlign: 'center' }}>
                    No records found.
                  </Typography>
                ) : (
                  paginatedMergedShifts.map((shift: any) => {
                    const shiftDate = new Date(shift.date);
                    const dateStr = format(shiftDate, 'EEEE, MMMM dd, yyyy');
                    const workedHours = formatHours(shift.totalMinutes);

                    return (
                      <Paper
                        key={shift.id}
                        variant="outlined"
                        sx={{
                          p: 2.25,
                          borderRadius: '16px',
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                          border: shift.status === 'absent' ? `1px solid ${tokens.semantic.error}40` : undefined,
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            {dateStr}
                          </Typography>
                          <Chip
                            label={shift.status.replace('_', ' ').toUpperCase()}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              bgcolor: `${getStatusColor(shift.status)}10`,
                              color: getStatusColor(shift.status)
                            }}
                          />
                        </Box>
                        {shift.exists ? (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Check In: <strong>{formatTime(shift.checkInTime)}</strong>
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Check Out: <strong>{formatTime(shift.checkOutTime)}</strong>
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                                Logged Time:
                              </Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: tokens.brand.primary }}>
                                {workedHours}
                              </Typography>
                            </Box>
                          </>
                        ) : (
                          <Box sx={{ py: 0.5 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: shift.status === 'absent' ? 600 : 400 }}>
                              {shift.status === 'absent'
                                ? 'No shift logs found (Absent).'
                                : 'Weekend - Non-working day.'}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    );
                  })
                )}
              </Box>

              {/* Drawer Pagination */}
              {userHistoryData && totalDaysCount > limit && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    size="small"
                    count={Math.ceil(totalDaysCount / limit)}
                    page={detailPage}
                    onChange={(_, value) => setDetailPage(value)}
                    color="primary"
                    sx={{ '& .MuiPaginationItem-root': { fontWeight: 700, borderRadius: '8px' } }}
                  />
                </Box>
              )}
            </Box>
          )}
        </Drawer>
      </Box>
    );
  }

  // -------------------------------------------------------------
  // RENDER PERSONAL USER VIEW (Standard User Page)
  // -------------------------------------------------------------
  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
            My Attendance
          </Typography>
          <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary, fontWeight: 500 }}>
            Track your shifts, hours, and daily punctuality.
          </Typography>
        </Box>
      </Box>

      {/* KPI Widgets */}
      <Grid container spacing={3.5} sx={{ mb: 4.5 }}>
        {[
          {
            title: 'Hours This Week',
            value: formatHours(totalHoursWorked),
            icon: <TimerIcon sx={{ fontSize: 26 }} />,
            color: '#3B82F6',
            bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
            hoverBorder: '#3B82F6',
            trend: '+2.5h from last week',
          },
          {
            title: 'Punctuality Score',
            value: `${punctualityScore}%`,
            icon: <CheckCircleOutlineIcon sx={{ fontSize: 26 }} />,
            color: tokens.semantic.success,
            bgcolor: isDarkMode ? 'rgba(45, 138, 94, 0.15)' : 'rgba(45, 138, 94, 0.08)',
            hoverBorder: tokens.semantic.success,
            trend: 'Top 10% in team',
          },
          {
            title: 'Total Shifts',
            value: historyData?.total || 0,
            icon: <TrendingUpIcon sx={{ fontSize: 26 }} />,
            color: tokens.brand.primary,
            bgcolor: isDarkMode ? 'rgba(155, 107, 184, 0.15)' : 'rgba(93, 26, 137, 0.08)',
            hoverBorder: tokens.brand.primary,
            trend: 'Consistent schedule',
          },
        ].map((kpi, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card
              sx={{
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                borderRadius: '24px',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(26, 22, 37, 0.04)',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: tokens.shadow.cardHover,
                  borderColor: kpi.hoverBorder,
                }
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '16px',
                  bgcolor: kpi.bgcolor,
                  color: kpi.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {kpi.icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: '0.68rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {kpi.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: kpi.color, mt: 0.5 }}>
                  {kpi.value}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dynamic Filters for Personal View */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4.5,
          borderRadius: '24px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 3,
        }}
      >
        <Box sx={{ minWidth: 140 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Filter History
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
            View shift logs by date or month.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flexGrow: 1 }}>
          {[
            { id: 'last30', label: 'Last 30 Days' },
            { id: 'month', label: 'By Month' },
            { id: 'date', label: 'By Date' },
          ].map((btn) => (
            <Chip
              key={btn.id}
              label={btn.label}
              clickable
              onClick={() => {
                setUserFilterType(btn.id as any);
                setPage(1);
              }}
              sx={{
                fontWeight: 700,
                bgcolor: userFilterType === btn.id ? tokens.brand.primary : 'transparent',
                color: userFilterType === btn.id ? '#fff' : 'text.primary',
                border: `1px solid ${userFilterType === btn.id ? tokens.brand.primary : 'rgba(0,0,0,0.12)'}`,
                '&:hover': {
                  bgcolor: userFilterType === btn.id ? tokens.brand.primary : 'rgba(0,0,0,0.04)',
                }
              }}
            />
          ))}
        </Box>

        {userFilterType === 'month' && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="user-month-select-label">Select Month</InputLabel>
            <Select
              labelId="user-month-select-label"
              value={userFilterMonth}
              label="Select Month"
              onChange={(e) => {
                setUserFilterMonth(e.target.value);
                setPage(1);
              }}
              sx={{ borderRadius: '12px' }}
            >
              {availableMonths.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {userFilterType === 'date' && (
          <TextField
            type="date"
            size="small"
            label="Select Date"
            InputLabelProps={{ shrink: true }}
            value={userFilterDate}
            onChange={(e) => {
              setUserFilterDate(e.target.value);
              setPage(1);
            }}
            sx={{
              minWidth: 180,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              }
            }}
          />
        )}
      </Paper>

      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.01em' }}>
        Shift History
      </Typography>

      {/* Shift List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: tokens.brand.primary }} />
          </Box>
        ) : userPaginatedMergedShifts.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: '24px',
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'transparent',
              border: `2px dashed ${tokens.surface.border}`,
              boxShadow: 'none',
            }}
          >
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              No shift history found.
            </Typography>
          </Paper>
        ) : (
          userPaginatedMergedShifts.map((shift: any) => {
            const shiftDate = new Date(shift.date);
            const monthStr = format(shiftDate, 'MMM').toUpperCase();
            const dayStr = format(shiftDate, 'dd');
            
            const scheduledMins = 480; 
            const workedMins = shift.totalMinutes || 0;
            const progressPct = Math.min((workedMins / scheduledMins) * 100, 100);
            
            return (
              <Paper
                key={shift.id}
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  flexDirection: { xs: 'column', md: 'row' },
                  p: { xs: 2, sm: 3 },
                  gap: { xs: 2, md: 3 },
                  borderRadius: '24px',
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  border: `1px solid ${
                    shift.status === 'absent'
                      ? `${tokens.semantic.error}40`
                      : isDarkMode
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(0,0,0,0.05)'
                  }`,
                  boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: tokens.shadow.cardHover,
                    borderColor: shift.status === 'absent' ? tokens.semantic.error : tokens.brand.primary,
                  }
                }}
              >
                {/* Visual Calendar Badge */}
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '18px',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9F8F7',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    {monthStr}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, lineHeight: 1 }}>
                    {dayStr}
                  </Typography>
                </Box>

                {/* Times & Info */}
                <Box sx={{ flexGrow: 1, minWidth: { xs: 0, sm: 200 }, width: { xs: '100%', md: 'auto' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary }}>
                      Daily Shift
                    </Typography>
                    <Chip
                      label={shift.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      icon={shift.status === 'checked_in' ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : undefined}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        height: 22,
                        bgcolor: `${getStatusColor(shift.status)}15`,
                        color: getStatusColor(shift.status),
                        borderRadius: '6px',
                        border: `1px solid ${getStatusColor(shift.status)}30`,
                        '& .MuiChip-icon': { color: 'inherit', ml: 0.5 }
                      }}
                    />
                  </Box>
                  {shift.exists ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 3 }, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 16 }} />
                        Scheduled: {shift.scheduledStart} - {shift.scheduledEnd}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 16, color: tokens.semantic.success }} />
                        In: {formatTime(shift.checkInTime)}
                      </Typography>
                      {shift.checkOutTime && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckCircleOutlineIcon sx={{ fontSize: 16, color: tokens.semantic.info }} />
                          Out: {formatTime(shift.checkOutTime)}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: shift.status === 'absent' ? 600 : 400 }}>
                      {shift.status === 'absent' ? 'No shift logs found (Absent).' : 'Weekend - Non-working day.'}
                    </Typography>
                  )}
                </Box>

                {/* Progress Bar & Hours */}
                {shift.exists && (
                  <Box sx={{ width: { xs: '100%', md: 240 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Logged Hours
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: tokens.brand.primary }}>
                        {formatHours(shift.totalMinutes)}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={progressPct} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: progressPct >= 100 ? tokens.semantic.success : tokens.brand.primary,
                        }
                      }} 
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textAlign: 'right' }}>
                      {progressPct >= 100 ? 'Shift complete!' : `${Math.round(progressPct)}% of 8h shift`}
                    </Typography>
                  </Box>
                )}
              </Paper>
            );
          })
        )}
      </Box>

      {/* Pagination */}
      {userTotalDaysCount > userLimit && (
        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={Math.ceil(userTotalDaysCount / userLimit)} 
            page={page} 
            onChange={(_, value) => setPage(value)} 
            color="primary"
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 700,
                borderRadius: '12px',
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default AttendancePage;
