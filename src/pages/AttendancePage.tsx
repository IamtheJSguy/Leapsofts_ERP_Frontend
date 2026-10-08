import { combineTeamMembers } from '@/lib/teamRoster';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  Badge,
  Tooltip,
  Button,
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
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InsightsIcon from '@mui/icons-material/Insights';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { tokens } from '@/styles/tokens';
import { ShiftDaySessions } from '@/components/attendance/ShiftDaySessions';
import { AttendanceShiftCard } from '@/components/attendance/AttendanceShiftCard';
import { useShiftHistory, useTeamAttendanceSummary } from '@/hooks/api/useShifts';
import { useUsers } from '@/hooks/api/useUsers';
import { useMyTeams } from '@/hooks/api/useTeam';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';

const trackingPath = (userId: string, date: Date | string, shiftId?: string) => {
  const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
  const q = new URLSearchParams({ date: dateStr });
  if (shiftId) q.set('shiftId', shiftId);
  return `/attendance/${userId}?${q.toString()}`;
};

const formatTimeOnly = (dateString: string | null | undefined) => {
  if (!dateString) return '--:--';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '--:--';
  }
};

const formatWorkedMins = (mins: number | undefined | null) => {
  if (!mins || mins <= 0) return '0h 0m';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
};

export const AttendancePage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const currentUser = useAuthStore((s) => s.user);
  const { canViewAllAttendance, canAccessTeam } = usePermissions();
  const showOrgDirectory = canViewAllAttendance;
  const showTeamDirectory = !showOrgDirectory && canAccessTeam;
  const isAdminView = showOrgDirectory || showTeamDirectory;

  // --- Personal User States & Queries ---
  const [page, setPage] = useState(1);
  const [userFilterType, setUserFilterType] = useState<'last30' | 'month' | 'date'>('last30');
  const [userFilterMonth, setUserFilterMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [userFilterStartDate, setUserFilterStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [userFilterEndDate, setUserFilterEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
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
        startDate: userFilterStartDate,
        endDate: userFilterEndDate,
      };
    }
  }, [userFilterType, userFilterMonth, userFilterStartDate, userFilterEndDate]);

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
          breaks: shift.breaks || [],
          totalBreakMinutes: shift.totalBreakMinutes || 0,
          sessions: shift.sessions || [],
          meetings: shift.meetings || [],
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
          breaks: [],
          totalBreakMinutes: 0,
          sessions: [],
          meetings: [],
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
  const [filterStartDate, setFilterStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [filterEndDate, setFilterEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
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
        startDate: filterStartDate,
        endDate: filterEndDate,
      };
    }
  }, [filterType, filterMonth, filterStartDate, filterEndDate, selectedUser]);

  const { data: allUsers = [], isLoading: isUsersLoading } = useUsers(
    { limit: '500' },
    { enabled: showOrgDirectory }
  );
  const { data: myTeams, isLoading: isTeamLoading } = useMyTeams({ enabled: showTeamDirectory });
  const myTeam = useMemo(() => {
    return { members: combineTeamMembers(myTeams ?? []), managerId: undefined };
  }, [myTeams]);
  const isDirectoryLoading = showOrgDirectory ? isUsersLoading : isTeamLoading;
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
          breaks: shift.breaks || [],
          totalBreakMinutes: shift.totalBreakMinutes || 0,
          sessions: shift.sessions || [],
          meetings: shift.meetings || [],
          status: shift.status,
          exists: true,
          scheduledStart: shift.scheduledStart || selectedUser?.shiftStart,
          scheduledEnd: shift.scheduledEnd || selectedUser?.shiftEnd
        };
      } else {
        return {
          id: dateStr,
          date,
          checkInTime: null,
          checkOutTime: null,
          totalMinutes: 0,
          breaks: [],
          totalBreakMinutes: 0,
          sessions: [],
          meetings: [],
          status: isWeekend ? 'weekend' : 'absent',
          exists: false,
          scheduledStart: selectedUser?.shiftStart,
          scheduledEnd: selectedUser?.shiftEnd,
        };
      }
    });
  }, [queryRange, userHistoryData, selectedUser]);

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

  const formatBreakSummary = (breaks?: Array<{ startTime: string; endTime: string | null }>, totalBreakMinutes?: number) => {
    const breakCount = breaks?.length ?? 0;
    const breakMins = totalBreakMinutes ?? 0;
    if (breakCount === 0 && breakMins <= 0) return null;
    const countLabel = `${breakCount || 1} break${(breakCount || 1) === 1 ? '' : 's'}`;
    return `${countLabel} · ${breakMins}m`;
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

  const currentOrgId = currentUser?.organizationId;
  const isBaseOrgMember = (user: { _id?: string; baseOrganizationId?: string; organizationId?: string }) => {
    if (!currentOrgId) return true;
    if (user._id && user._id === currentUser?._id) {
      const ownBase = currentUser?.baseOrganizationId || currentOrgId;
      return String(ownBase) === String(currentOrgId);
    }
    const baseId = user.baseOrganizationId || user.organizationId;
    return Boolean(baseId) && String(baseId) === String(currentOrgId);
  };

  // Org-wide when viewAllAttendance; otherwise manager team (or self for users).
  // Attendance is base-organization scoped, so members of this org whose base is elsewhere are omitted.
  const filteredUsers = useMemo(() => {
    let directoryUsers: any[];
    if (showTeamDirectory) {
      const members = (myTeam?.members ?? []).filter((u) => u.role !== 'admin' && isBaseOrgMember(u));
      const manager = myTeam?.managerId || currentUser;
      if (manager?._id && isBaseOrgMember(manager) && !members.some((m) => m._id === manager._id)) {
        directoryUsers = [manager, ...members];
      } else {
        directoryUsers = members;
      }
    } else {
      directoryUsers = (allUsers ?? []).filter((u: any) => u.role !== 'admin' && isBaseOrgMember(u));
    }
    const query = searchQuery.trim().toLowerCase();
    if (!query) return directoryUsers;
    return directoryUsers.filter((user: any) => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [allUsers, myTeam?.members, myTeam?.managerId, currentUser, currentOrgId, showTeamDirectory, searchQuery]);

  const todayShiftByUserId = useMemo(() => {
    const map = new Map<string, NonNullable<typeof teamSummary>['todayShifts'][number]>();
    for (const shift of teamSummary?.todayShifts ?? []) {
      map.set(String(shift.userId), shift);
    }
    return map;
  }, [teamSummary]);

  // Personal view metrics
  const totalHoursWorked = useMemo(() => {
    if (!historyData?.shifts) return 0;
    return historyData.shifts.reduce((acc: number, shift: any) => acc + (shift.totalMinutes || 0), 0);
  }, [historyData]);

  const averageWorkingHours = useMemo(() => {
    if (!historyData?.shifts || historyData.shifts.length === 0) return 0;
    return (historyData.shifts.reduce((acc: number, shift: any) => acc + (shift.totalMinutes || 0), 0) / historyData.shifts.length);
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

        {/* KPI Widgets removed as requested */}

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
        {isDirectoryLoading ? (
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
              const todayShift = todayShiftByUserId.get(String(user._id));
              const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
              const tileStatus = todayShift
                ? todayShift.status
                : isWeekend
                  ? 'weekend'
                  : 'absent';
              const isOnline = todayShift?.status === 'checked_in';
              const todayWorkedMinutes = todayShift?.totalMinutes || 0;

              return (
                <Grid item xs={12} sm={6} lg={4} key={user._id}>
                  <Card
                    onClick={() => {
                      setSelectedUser(user);
                      setDetailPage(1);
                    }}
                    sx={{
                      p: 2.5,
                      borderRadius: '20px',
                      bgcolor: isDarkMode ? 'rgba(28, 25, 36, 0.65)' : '#ffffff',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                      cursor: 'pointer',
                      boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.03)',
                      transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        borderColor: tokens.brand.primary,
                        boxShadow: isDarkMode
                          ? '0 12px 30px -4px rgba(93, 26, 137, 0.35)'
                          : '0 12px 28px -6px rgba(93, 26, 137, 0.15)',
                        '& .view-logs-cta': {
                          color: tokens.brand.primary,
                          transform: 'translateX(3px)',
                        },
                      }
                    }}
                  >
                    {/* Top Row: Avatar with Live Badge & Status Chip */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          invisible={!isOnline}
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: '#10B981',
                              color: '#10B981',
                              boxShadow: `0 0 0 2px ${isDarkMode ? '#1e1b24' : '#fff'}`,
                              '&::after': {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                animation: 'ripple 1.4s infinite ease-in-out',
                                border: '1px solid currentColor',
                                content: '""',
                              },
                            },
                            '@keyframes ripple': {
                              '0%': { transform: 'scale(.8)', opacity: 1 },
                              '100%': { transform: 'scale(2.2)', opacity: 0 },
                            },
                          }}
                        >
                          <Avatar
                            src={user.avatarUrl || undefined}
                            sx={{
                              width: 44,
                              height: 44,
                              bgcolor: isOnline
                                ? tokens.brand.primary
                                : isDarkMode
                                  ? 'rgba(255,255,255,0.08)'
                                  : tokens.brand.primaryMuted,
                              color: isOnline ? '#fff' : tokens.brand.primary,
                              fontWeight: 800,
                              fontSize: '1rem',
                              border: `2px solid ${isOnline ? tokens.brand.primary : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)')}`,
                            }}
                          >
                            {initial}
                          </Avatar>
                        </Badge>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            noWrap
                            sx={{
                              fontWeight: 800,
                              color: 'text.primary',
                              letterSpacing: '-0.01em',
                              fontSize: '0.95rem',
                              lineHeight: 1.2,
                            }}
                          >
                            {name}
                          </Typography>
                          {user.jobTitle && (
                            <Typography
                              variant="caption"
                              noWrap
                              sx={{
                                color: tokens.brand.primary,
                                fontWeight: 700,
                                display: 'block',
                                fontSize: '0.72rem',
                                mt: 0.2,
                              }}
                            >
                              {user.jobTitle}
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{
                              color: 'text.secondary',
                              fontWeight: 500,
                              display: 'block',
                              fontSize: '0.68rem',
                              mt: user.jobTitle ? 0.1 : 0.25,
                            }}
                          >
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>

                      <Chip
                        label={
                          isOnline
                            ? 'Online'
                            : tileStatus === 'checked_out'
                              ? 'Checked out'
                              : tileStatus === 'weekend'
                                ? 'Weekend'
                                : 'Absent'
                        }
                        size="small"
                        sx={{
                          height: 22,
                          px: 0.5,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          bgcolor: `${getStatusColor(isOnline ? 'checked_in' : tileStatus)}15`,
                          color: getStatusColor(isOnline ? 'checked_in' : tileStatus),
                          border: `1px solid ${getStatusColor(isOnline ? 'checked_in' : tileStatus)}30`,
                          borderRadius: '8px',
                          flexShrink: 0,
                        }}
                      />
                    </Box>

                    {/* Middle Row: Clean Worked Hours Snapshot */}
                    <Box
                      sx={{
                        p: 1.25,
                        px: 1.5,
                        borderRadius: '12px',
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                        my: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.6,
                        }}
                      >
                        <TimerIcon sx={{ fontSize: 15, color: tokens.brand.primary }} />
                        Worked
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 850,
                          fontSize: '0.92rem',
                          color: todayWorkedMinutes > 0 ? (isDarkMode ? '#fff' : tokens.brand.primary) : 'text.secondary',
                        }}
                      >
                        {todayShift ? formatWorkedMins(todayShift.totalMinutes) : '0h 0m'}
                      </Typography>
                    </Box>

                    {/* Bottom Row: Activity Tracking Link + View Logs CTA */}
                    <Box
                      sx={{
                        mt: 1.5,
                        pt: 1.25,
                        borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                      }}
                    >
                      <Button
                        component={Link}
                        to={trackingPath(user._id, new Date())}
                        size="small"
                        startIcon={<InsightsIcon sx={{ fontSize: 13 }} />}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          py: 0.35,
                          px: 1,
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          textTransform: 'none',
                          color: 'text.secondary',
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                          '&:hover': {
                            color: tokens.brand.primary,
                            borderColor: tokens.brand.primary,
                            bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.05)',
                          }
                        }}
                      >
                        Activity Tracking
                      </Button>

                      <Typography
                        variant="caption"
                        className="view-logs-cta"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 750,
                          fontSize: '0.72rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.25,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        Logs
                        <ChevronRightIcon sx={{ fontSize: 16 }} />
                      </Typography>
                    </Box>
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
          onClose={() => {
            setSelectedUser(null);
          }}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: 580, md: 620 },
              p: { xs: 2.5, sm: 3.5 },
              bgcolor: isDarkMode ? 'rgba(24, 21, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              borderLeft: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDarkMode ? '-8px 0 32px rgba(0,0,0,0.6)' : '-8px 0 32px rgba(0,0,0,0.08)',
              overflowX: 'hidden',
            }
          }}
        >
          {selectedUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflowX: 'hidden' }}>
              {/* Drawer Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                    Shift History & Logs
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                    Detailed attendance records and breakdown
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => {
                    setSelectedUser(null);
                  }}
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    borderRadius: '12px',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                    }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              <Divider sx={{ mb: 2.5, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

              {/* User Bio Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.25,
                  borderRadius: '18px',
                  bgcolor: isDarkMode ? 'rgba(35, 30, 44, 0.6)' : 'rgba(93, 26, 137, 0.03)',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(93, 26, 137, 0.08)'}`,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={selectedUser.avatarUrl || undefined}
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: tokens.brand.primary,
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      boxShadow: '0 4px 14px rgba(93, 26, 137, 0.3)',
                    }}
                  >
                    {(selectedUser.firstName?.charAt(0) || selectedUser.email?.charAt(0) || 'U').toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                      {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                      {selectedUser.email}
                    </Typography>
                    {selectedUser.jobTitle && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: tokens.brand.primary,
                          fontWeight: 750,
                          display: 'inline-block',
                          mt: 0.5,
                          fontSize: '0.72rem',
                        }}
                      >
                        {selectedUser.jobTitle}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Button
                  component={Link}
                  to={trackingPath(selectedUser._id, new Date())}
                  size="small"
                  variant="outlined"
                  startIcon={<InsightsIcon sx={{ fontSize: 15 }} />}
                  sx={{
                    borderRadius: '10px',
                    fontWeight: 750,
                    fontSize: '0.72rem',
                    textTransform: 'none',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: tokens.brand.primary,
                      color: tokens.brand.primary,
                      bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.05)',
                    }
                  }}
                >
                  Activity Tracking
                </Button>
              </Paper>

              {/* Filter Controls */}
              <Box sx={{ mb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: '0.68rem',
                  }}
                >
                  Filter History
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[
                    { id: 'last30', label: 'Last 30 Days' },
                    { id: 'month', label: 'By Month' },
                    { id: 'date', label: 'By Date' },
                  ].map((btn) => {
                    const active = filterType === btn.id;
                    return (
                      <Chip
                        key={btn.id}
                        label={btn.label}
                        clickable
                        onClick={() => {
                          setFilterType(btn.id as any);
                          setDetailPage(1);
                        }}
                        sx={{
                          fontWeight: 750,
                          fontSize: '0.75rem',
                          height: 32,
                          px: 1,
                          borderRadius: '10px',
                          bgcolor: active ? tokens.brand.primary : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                          color: active ? '#ffffff' : 'text.primary',
                          border: `1px solid ${active ? tokens.brand.primary : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: active ? tokens.brand.primary : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                          }
                        }}
                      />
                    );
                  })}
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
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 1 }}>
                    <TextField
                      type="date"
                      size="small"
                      fullWidth
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={filterStartDate}
                      onChange={(e) => {
                        setFilterStartDate(e.target.value);
                        setDetailPage(1);
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                        }
                      }}
                    />
                    <TextField
                      type="date"
                      size="small"
                      fullWidth
                      label="End Date"
                      InputLabelProps={{ shrink: true }}
                      value={filterEndDate}
                      onChange={(e) => {
                        setFilterEndDate(e.target.value);
                        setDetailPage(1);
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                        }
                      }}
                    />
                  </Box>
                )}
              </Box>

              {/* Shift list content */}
              <Box
                sx={{
                  flexGrow: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  pr: 0.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  '&::-webkit-scrollbar': { width: '5px' },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                  }
                }}
              >
                {isUserHistoryLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={32} sx={{ color: tokens.brand.primary }} />
                  </Box>
                ) : paginatedMergedShifts.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      py: 6,
                      px: 3,
                      textAlign: 'center',
                      borderRadius: '16px',
                      border: `1.5px dashed ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                      bgcolor: 'transparent',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      No shift records found for this period.
                    </Typography>
                  </Paper>
                ) : (
                  paginatedMergedShifts.map((shift: any) => (
                    <AttendanceShiftCard
                      key={shift.id}
                      shift={shift}
                      userId={selectedUser._id}
                      isDarkMode={isDarkMode}
                      dense
                    />
                  ))
                )}
              </Box>

              {/* Drawer Pagination */}
              {userHistoryData && totalDaysCount > limit && (
                <Box sx={{ mt: 2.5, pt: 1.5, borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    size="small"
                    count={Math.ceil(totalDaysCount / limit)}
                    page={detailPage}
                    onChange={(_, value) => setDetailPage(value)}
                    color="primary"
                    sx={{ '& .MuiPaginationItem-root': { fontWeight: 750, borderRadius: '8px' } }}
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
            title: 'Total Hours Worked',
            value: formatHours(totalHoursWorked),
            icon: <TimerIcon sx={{ fontSize: 26 }} />,
            color: '#3B82F6',
            bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
            hoverBorder: '#3B82F6',
            trend: '+2.5h from last week',
          },
          {
            title: 'Average Working Hours',
            value: formatHours(Math.round(averageWorkingHours)),
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
          <>
          <TextField
            type="date"
            size="small"
            label="Select Start Date"
            InputLabelProps={{ shrink: true }}
            value={userFilterStartDate}
            onChange={(e) => {
              setUserFilterStartDate(e.target.value);
              setPage(1);
            }}
            sx={{
              minWidth: 180,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              }
            }}
          />
          <TextField
            type="date"
            size="small"
            label="Select End Date"
            InputLabelProps={{ shrink: true }}
            value={userFilterEndDate}
            onChange={(e) => {
              setUserFilterEndDate(e.target.value);
              setPage(1);
            }}
            sx={{
              minWidth: 180,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              }
            }}
          />
          </>
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
          userPaginatedMergedShifts.map((shift: any) => (
            <AttendanceShiftCard
              key={shift.id}
              shift={shift}
              userId={currentUser?._id || ''}
              isDarkMode={isDarkMode}
            />
          ))
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
