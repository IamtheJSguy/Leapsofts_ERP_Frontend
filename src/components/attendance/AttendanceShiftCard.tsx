import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  Divider,
} from '@mui/material';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CoffeeIcon from '@mui/icons-material/Coffee';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import WeekendRoundedIcon from '@mui/icons-material/WeekendRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { format } from 'date-fns';
import { tokens } from '@/styles/tokens';
import type { ShiftBreak, ShiftMeeting, ShiftSession } from '@/types';
import { resolveShiftSessions, resolveShiftMeetings, totalMeetingMinutes, meetingDurationMinutes } from './ShiftDaySessions';

export interface AttendanceShiftCardProps {
  shift: {
    id: string;
    date: Date | string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    totalMinutes?: number;
    breaks?: ShiftBreak[];
    totalBreakMinutes?: number;
    sessions?: ShiftSession[];
    meetings?: ShiftMeeting[];
    status: 'checked_in' | 'checked_out' | 'absent' | 'weekend' | string;
    exists: boolean;
    scheduledStart?: string;
    scheduledEnd?: string;
  };
  userId: string;
  isDarkMode?: boolean;
  dense?: boolean;
}

const formatClockTime = (dateString: string | null | undefined) => {
  if (!dateString) return '--:--';
  try {
    return format(new Date(dateString), 'hh:mm a');
  } catch {
    return '--:--';
  }
};

const formatDurationHM = (minutes: number | undefined) => {
  const mins = Math.max(0, Math.round(minutes || 0));
  if (!mins) return '0h 0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

export const AttendanceShiftCard: React.FC<AttendanceShiftCardProps> = ({
  shift,
  userId,
  isDarkMode = false,
  dense = false,
}) => {
  const [isSessionsExpanded, setIsSessionsExpanded] = useState(false);
  const [isMeetingsExpanded, setIsMeetingsExpanded] = useState(false);

  const shiftDate = new Date(shift.date);
  const monthStr = format(shiftDate, 'MMM').toUpperCase();
  const dayStr = format(shiftDate, 'dd');
  const dayName = format(shiftDate, 'EEEE');

  const scheduledStart = shift.scheduledStart || '09:00';
  const scheduledEnd = shift.scheduledEnd || '17:00';

  const sessions = resolveShiftSessions(shift);
  const meetings = resolveShiftMeetings(shift);
  const meetingMins = totalMeetingMinutes(meetings);
  const breakMins = shift.totalBreakMinutes || (shift.breaks?.reduce((sum, b) => {
    if (!b.startTime || !b.endTime) return sum;
    const diff = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 60000;
    return sum + Math.max(0, Math.round(diff));
  }, 0) || 0);
  const breakCount = shift.breaks?.length || 0;

  const totalWorkedMinutes = shift.totalMinutes || 0;
  const activeFocusMinutes = Math.max(0, totalWorkedMinutes - meetingMins);

  const firstCheckIn = sessions[0]?.checkInTime || shift.checkInTime;
  const lastCheckOut = sessions[sessions.length - 1]?.checkOutTime || shift.checkOutTime;
  const isCurrentlyOpen = shift.status === 'checked_in' || sessions.some(s => !s.checkOutTime) || (Boolean(shift.checkInTime) && !shift.checkOutTime);

  const targetMinutes = 480; // 8 hours standard
  const progressPct = Math.min(Math.round((totalWorkedMinutes / targetMinutes) * 100), 150);
  const isGoalAchieved = totalWorkedMinutes >= targetMinutes;

  const dateParam = typeof shift.date === 'string' ? shift.date : format(shift.date, 'yyyy-MM-dd');
  const trackingUrl = `/attendance/${userId}?date=${dateParam}${shift.exists && shift.id ? `&shiftId=${shift.id}` : ''}`;

  // Status Styling Configuration
  const getStatusConfig = () => {
    switch (shift.status) {
      case 'checked_in':
        return {
          label: 'CHECKED IN',
          color: tokens.semantic.success,
          bg: isDarkMode ? 'rgba(45, 138, 94, 0.18)' : 'rgba(45, 138, 94, 0.12)',
          border: 'rgba(45, 138, 94, 0.3)',
          dot: '#10B981',
          iconType: 'check' as const,
          pulse: true,
        };
      case 'checked_out':
        return {
          label: 'CHECKED OUT',
          color: isDarkMode ? '#C084FC' : tokens.brand.primary,
          bg: isDarkMode ? 'rgba(149, 99, 184, 0.18)' : 'rgba(93, 26, 137, 0.08)',
          border: isDarkMode ? 'rgba(149, 99, 184, 0.35)' : 'rgba(93, 26, 137, 0.2)',
          dot: isDarkMode ? '#C084FC' : tokens.brand.primary,
          iconType: 'check' as const,
          pulse: false,
        };
      case 'absent':
        return {
          label: 'ABSENT',
          color: tokens.semantic.error,
          bg: isDarkMode ? 'rgba(196, 69, 69, 0.15)' : tokens.semantic.errorBg,
          border: 'rgba(196, 69, 69, 0.25)',
          dot: tokens.semantic.error,
          iconType: 'dot' as const,
          pulse: false,
        };
      case 'weekend':
      default:
        return {
          label: 'WEEKEND',
          color: tokens.semantic.neutral,
          bg: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : tokens.semantic.neutralBg,
          border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          dot: tokens.semantic.neutral,
          iconType: 'dot' as const,
          pulse: false,
        };
    }
  };

  const statusConfig = getStatusConfig();

  // NON-EXISTENT / ABSENT / WEEKEND STATES
  if (!shift.exists) {
    const isWeekend = shift.status === 'weekend';
    return (
      <Box
        sx={{
          borderRadius: dense ? '16px' : '20px',
          p: dense ? 1.75 : 2.5,
          bgcolor: isDarkMode ? 'rgba(28, 25, 36, 0.45)' : '#FFFFFF',
          border: `1px solid ${
            isWeekend
              ? isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
              : isDarkMode ? 'rgba(196, 69, 69, 0.25)' : 'rgba(196, 69, 69, 0.2)'
          }`,
          boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.02)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          opacity: isWeekend ? 0.75 : 1,
          flexShrink: 0,
          width: '100%',
        }}
      >
        {/* Calendar Badge */}
        <Box
          sx={{
            width: dense ? 48 : 56,
            height: dense ? 48 : 56,
            borderRadius: '14px',
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F9F8FA',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : tokens.text.secondary,
              fontWeight: 800,
              fontSize: dense ? '0.62rem' : '0.65rem',
              letterSpacing: '0.04em',
            }}
          >
            {monthStr}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : tokens.text.primary,
              lineHeight: 1.1,
              fontSize: dense ? '1rem' : '1.15rem',
            }}
          >
            {dayStr}
          </Typography>
        </Box>

        {/* Message */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDarkMode ? '#FFF' : tokens.text.primary, fontSize: dense ? '0.88rem' : '0.95rem' }}>
              {dayName}
            </Typography>
            <Chip
              label={statusConfig.label}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.6rem',
                fontWeight: 800,
                bgcolor: statusConfig.bg,
                color: statusConfig.color,
                border: `1px solid ${statusConfig.border}`,
                borderRadius: '4px',
                px: 0.25,
              }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: isWeekend ? 'text.secondary' : tokens.semantic.error,
              fontWeight: isWeekend ? 500 : 650,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: dense ? '0.72rem' : '0.78rem',
            }}
          >
            {isWeekend ? (
              <>
                <WeekendRoundedIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                Non-working weekend day. No shift scheduled.
              </>
            ) : (
              <>
                <EventBusyRoundedIcon sx={{ fontSize: 14 }} />
                No shift activity logged. Marked as Absent.
              </>
            )}
          </Typography>
        </Box>
      </Box>
    );
  }

  // ACTIVE / COMPLETED SHIFT CARD
  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: dense ? '20px' : '24px',
        p: dense ? 2.25 : 3,
        flexShrink: 0,
        width: '100%',
        bgcolor: isDarkMode
          ? 'linear-gradient(145deg, rgba(32, 28, 42, 0.8) 0%, rgba(24, 21, 32, 0.9) 100%)'
          : 'linear-gradient(145deg, #FFFFFF 0%, #FAF8FC 100%)',
        border: `1px solid ${
          isGoalAchieved
            ? isDarkMode ? 'rgba(45, 138, 94, 0.3)' : 'rgba(45, 138, 94, 0.2)'
            : isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(93, 26, 137, 0.08)'
        }`,
        boxShadow: isDarkMode
          ? '0 4px 20px rgba(0, 0, 0, 0.25)'
          : '0 2px 12px rgba(26, 22, 37, 0.04), 0 1px 3px rgba(0,0,0,0.02)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(16px)',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDarkMode
            ? '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(155, 107, 184, 0.3)'
            : tokens.shadow.cardHover,
          borderColor: isDarkMode ? 'rgba(155, 107, 184, 0.4)' : tokens.brand.primaryMuted,
        },
      }}
    >
      {/* 1. Header Section: Date Info + Hero Work Logged Badge */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2,
        }}
      >
        {/* Left: Compact Date Badge + Day Name + Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {/* Calendar Badge */}
          <Box
            sx={{
              width: dense ? 48 : 56,
              height: dense ? 48 : 56,
              borderRadius: '14px',
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(93, 26, 137, 0.25) 0%, rgba(255, 255, 255, 0.04) 100%)'
                : 'linear-gradient(135deg, #F3E8FF 0%, #FFFFFF 100%)',
              border: `1.5px solid ${isDarkMode ? 'rgba(149, 99, 184, 0.25)' : 'rgba(93, 26, 137, 0.12)'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: isDarkMode ? '#C084FC' : tokens.brand.primary,
                fontWeight: 850,
                fontSize: dense ? '0.62rem' : '0.68rem',
                letterSpacing: '0.04em',
                lineHeight: 1,
              }}
            >
              {monthStr}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 850,
                color: isDarkMode ? '#FFFFFF' : tokens.text.primary,
                lineHeight: 1.1,
                fontSize: dense ? '1rem' : '1.15rem',
                mt: 0.2,
              }}
            >
              {dayStr}
            </Typography>
          </Box>

          {/* Date Title & Schedule */}
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: 800,
                  color: isDarkMode ? '#FFFFFF' : tokens.text.primary,
                  letterSpacing: '-0.01em',
                  fontSize: dense ? '0.9rem' : '1rem',
                }}
              >
                {dayName}
              </Typography>
              <Chip
                icon={
                  statusConfig.iconType === 'check' ? (
                    <CheckCircleRoundedIcon
                      sx={{
                        fontSize: '13px !important',
                        color: `${statusConfig.color} !important`,
                      }}
                    />
                  ) : (
                    <RadioButtonCheckedIcon
                      sx={{
                        fontSize: '9px !important',
                        color: `${statusConfig.dot} !important`,
                        animation: statusConfig.pulse ? 'pulse 1.8s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { opacity: 1, transform: 'scale(1)' },
                          '50%': { opacity: 0.4, transform: 'scale(0.85)' },
                          '100%': { opacity: 1, transform: 'scale(1)' },
                        },
                      }}
                    />
                  )
                }
                label={statusConfig.label}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  bgcolor: statusConfig.bg,
                  color: statusConfig.color,
                  border: `1px solid ${statusConfig.border}`,
                  borderRadius: '6px',
                  px: 0.4,
                  '& .MuiChip-icon': {
                    ml: 0.25,
                  },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
              <AccessTimeFilledIcon
                sx={{
                  fontSize: 12,
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : tokens.brand.primaryMuted,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : tokens.text.secondary,
                  fontWeight: 650,
                  fontSize: '0.72rem',
                }}
              >
                Shift: {scheduledStart} – {scheduledEnd}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right: Worked Time & Breaks Pill */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.5,
            py: 0.75,
            borderRadius: '12px',
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(93, 26, 137, 0.04)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(93, 26, 137, 0.1)'}`,
            flexShrink: 0,
          }}
        >
          {/* Worked Hours */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <TimerRoundedIcon sx={{ fontSize: 16, color: isDarkMode ? '#C084FC' : tokens.brand.primary }} />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : tokens.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                }}
              >
                Worked
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  lineHeight: 1.15,
                  color: totalWorkedMinutes > 0 ? (isDarkMode ? '#FFF' : tokens.brand.primary) : 'text.secondary',
                }}
              >
                {formatDurationHM(totalWorkedMinutes)}
              </Typography>
            </Box>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', my: 0.25 }} />

          {/* Breaks */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <CoffeeIcon sx={{ fontSize: 15, color: breakMins > 0 ? '#F59E0B' : (isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)') }} />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : tokens.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                }}
              >
                Breaks
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  lineHeight: 1.15,
                  color: breakMins > 0 ? (isDarkMode ? '#FBBF24' : '#D97706') : 'text.secondary',
                }}
              >
                {breakMins > 0 ? `${formatDurationHM(breakMins)}${breakCount > 0 ? ` (${breakCount})` : ''}` : '0m'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 3. Dual Dedicated Collapsible Sections */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: dense ? '1fr' : { xs: '1fr', md: '1fr 1fr' },
          gap: 1,
          mb: 1.25,
          alignItems: 'start',
        }}
      >
        {/* Section A: Work Sessions */}
        <Box
          sx={{
            borderRadius: '14px',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(93, 26, 137, 0.08)'}`,
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.015)' : 'rgba(93, 26, 137, 0.02)',
            overflow: 'hidden',
          }}
        >
          {/* Header Toggle */}
          <Box
            onClick={() => setIsSessionsExpanded(!isSessionsExpanded)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 0.85,
              px: 1.25,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(93, 26, 137, 0.04)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
              <ScheduleRoundedIcon sx={{ fontSize: 15, color: isDarkMode ? '#C084FC' : tokens.brand.primary, flexShrink: 0 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.72rem', color: isDarkMode ? '#FFF' : tokens.text.primary }}>
                Work Sessions ({sessions.length})
              </Typography>
            </Box>
            <IconButton
              size="small"
              sx={{
                p: 0.2,
                transform: isSessionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {/* Sessions List */}
          <Collapse in={isSessionsExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ p: 1, pt: 0, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
              {sessions.map((session, idx) => {
                const isOpen = !session.checkOutTime;
                return (
                  <Box
                    key={`sess-${idx}`}
                    sx={{
                      p: 1,
                      borderRadius: '10px',
                      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                      border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 0.75,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Chip
                        label={`#${idx + 1}`}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          bgcolor: isDarkMode ? 'rgba(149, 99, 184, 0.2)' : 'rgba(93, 26, 137, 0.08)',
                          color: isDarkMode ? '#C084FC' : tokens.brand.primary,
                          borderRadius: '4px',
                        }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 650, fontSize: '0.72rem', color: 'text.secondary' }}>
                        In <strong>{formatClockTime(session.checkInTime)}</strong> • Out <strong>{isOpen ? 'In Progress' : formatClockTime(session.checkOutTime)}</strong>
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {session.checkoutReason && (
                        <Chip
                          label={session.checkoutReason === 'inactivity' ? 'Auto' : 'Manual'}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.56rem',
                            fontWeight: 750,
                            bgcolor: session.checkoutReason === 'inactivity' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(93, 26, 137, 0.08)',
                            color: session.checkoutReason === 'inactivity' ? '#F59E0B' : tokens.brand.primaryMuted,
                          }}
                        />
                      )}
                      <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.72rem', color: tokens.brand.primary }}>
                        {formatDurationHM(session.workedMinutes)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Collapse>
        </Box>

        {/* Section B: Meetings */}
        <Box
          sx={{
            borderRadius: '14px',
            border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)'}`,
            bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.03)' : 'rgba(59, 130, 246, 0.02)',
            overflow: 'hidden',
          }}
        >
          {/* Header Toggle */}
          <Box
            onClick={() => setIsMeetingsExpanded(!isMeetingsExpanded)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 0.85,
              px: 1.25,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.06)' : 'rgba(59, 130, 246, 0.04)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
              <GroupsRoundedIcon sx={{ fontSize: 15, color: '#3B82F6', flexShrink: 0 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.72rem', color: isDarkMode ? '#FFF' : tokens.text.primary }}>
                Meetings ({meetings.length})
              </Typography>
            </Box>
            <IconButton
              size="small"
              sx={{
                p: 0.2,
                transform: isMeetingsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {/* Meetings List */}
          <Collapse in={isMeetingsExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ p: 1, pt: 0, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
              {meetings.length === 0 ? (
                <Box
                  sx={{
                    py: 1,
                    px: 1.25,
                    borderRadius: '10px',
                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
                    border: `1px dashed ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>
                    No meeting check-ins recorded.
                  </Typography>
                </Box>
              ) : (
                meetings.map((m, idx) => {
                  const isMeetingOpen = !m.endTime;
                  return (
                    <Box
                      key={`meeting-${idx}`}
                      sx={{
                        p: 1,
                        borderRadius: '10px',
                        bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.08)' : '#FFFFFF',
                        border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 0.75,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Chip
                          icon={<GroupsRoundedIcon sx={{ fontSize: '11px !important', color: '#3B82F6 !important' }} />}
                          label={`#${idx + 1}`}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            bgcolor: 'rgba(59, 130, 246, 0.12)',
                            color: '#3B82F6',
                            borderRadius: '4px',
                          }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 650, fontSize: '0.72rem', color: 'text.secondary' }}>
                          In <strong>{formatClockTime(m.startTime)}</strong> • Out <strong>{isMeetingOpen ? 'In Progress' : formatClockTime(m.endTime)}</strong>
                        </Typography>
                      </Box>

                      <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#3B82F6' }}>
                        {formatDurationHM(meetingDurationMinutes(m))}
                      </Typography>
                    </Box>
                  );
                })
              )}
            </Box>
          </Collapse>
        </Box>
      </Box>

      {/* 4. Footer: Fast Deep-Dive Activity Button */}
      <Box
        sx={{
          pt: 1.25,
          borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'}`,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <Chip
          component={Link}
          to={trackingUrl}
          clickable
          icon={<InsightsRoundedIcon sx={{ fontSize: '14px !important', color: 'inherit' }} />}
          deleteIcon={<ArrowForwardRoundedIcon sx={{ fontSize: '13px !important', color: 'inherit' }} />}
          onDelete={() => {}}
          label="Activity Tracking"
          sx={{
            height: 26,
            fontSize: '0.7rem',
            fontWeight: 800,
            borderRadius: '8px',
            bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.3)' : 'rgba(93, 26, 137, 0.08)',
            color: isDarkMode ? '#E9D5FF' : tokens.brand.primary,
            border: `1px solid ${isDarkMode ? 'rgba(149, 99, 184, 0.35)' : 'rgba(93, 26, 137, 0.15)'}`,
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            '& .MuiChip-deleteIcon': {
              color: 'inherit',
              mr: 0.5,
              transition: 'transform 0.2s ease',
            },
            '&:hover': {
              bgcolor: tokens.brand.primary,
              color: '#FFFFFF',
              borderColor: tokens.brand.primary,
              '& .MuiChip-deleteIcon': {
                transform: 'translateX(3px)',
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default React.memo(AttendanceShiftCard);
