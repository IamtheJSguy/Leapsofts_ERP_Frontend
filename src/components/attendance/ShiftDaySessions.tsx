import { Box, Chip, Typography } from '@mui/material';
import { format } from 'date-fns';
import { tokens } from '@/styles/tokens';
import type { CheckoutReason, Shift, ShiftBreak, ShiftMeeting, ShiftSession } from '@/types';

const formatClock = (dateString: string | null | undefined) => {
  if (!dateString) return '--:--';
  try {
    return format(new Date(dateString), 'hh:mm a');
  } catch {
    return '--:--';
  }
};

const formatMinutes = (minutes: number | undefined) => {
  const mins = Math.max(0, Math.round(minutes || 0));
  if (!mins) return '0h 0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const checkoutReasonLabel = (reason: CheckoutReason | null | undefined) => {
  if (reason === 'inactivity') return 'Auto (inactivity)';
  if (reason === 'user') return 'Manual';
  return null;
};

/**
 * Prefer persisted sessions[]; fall back to a single synthetic session from
 * top-level check-in/out for older records that predate multi-session.
 */
export const resolveShiftSessions = (
  shift: Pick<
    Shift,
    'sessions' | 'checkInTime' | 'checkOutTime' | 'breaks' | 'totalMinutes' | 'totalBreakMinutes'
  > & { sessions?: ShiftSession[] },
): ShiftSession[] => {
  if (shift.sessions && shift.sessions.length > 0) return shift.sessions;
  if (!shift.checkInTime) return [];
  return [
    {
      checkInTime: shift.checkInTime,
      checkOutTime: shift.checkOutTime ?? null,
      checkoutReason: shift.checkOutTime ? 'user' : null,
      breaks: (shift.breaks as ShiftBreak[] | undefined) ?? [],
      workedMinutes: shift.totalMinutes || 0,
      breakMinutes: shift.totalBreakMinutes || 0,
    },
  ];
};

export const resolveShiftMeetings = (
  shift: Pick<Shift, 'meetings'> & { meetings?: ShiftMeeting[] },
): ShiftMeeting[] => shift.meetings ?? [];

type ShiftDaySessionsProps = {
  sessions?: ShiftSession[];
  meetings?: ShiftMeeting[];
  /** Day total worked minutes (sum across sessions). */
  totalMinutes?: number;
  isDarkMode?: boolean;
  /** Compact padding for drawer / nested cards. */
  dense?: boolean;
};

/**
 * Lists every check-in session and meeting for a calendar day, plus the day total.
 */
export const ShiftDaySessions = ({
  sessions = [],
  meetings = [],
  totalMinutes,
  isDarkMode = false,
  dense = false,
}: ShiftDaySessionsProps) => {
  if (sessions.length === 0 && meetings.length === 0 && totalMinutes == null) {
    return null;
  }

  const muted = isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary;
  const rowBg = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const rowBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <Box sx={{ mt: dense ? 1.25 : 1.75, display: 'flex', flexDirection: 'column', gap: dense ? 1 : 1.25 }}>
      {sessions.length > 0 && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: muted,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              mb: 0.75,
            }}
          >
            Sessions{sessions.length > 1 ? ` (${sessions.length})` : ''}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {sessions.map((session, idx) => {
              const reason = checkoutReasonLabel(session.checkoutReason);
              const open = !session.checkOutTime;
              return (
                <Box
                  key={`session-${idx}-${session.checkInTime}`}
                  sx={{
                    px: dense ? 1.25 : 1.5,
                    py: dense ? 1 : 1.15,
                    borderRadius: '12px',
                    bgcolor: rowBg,
                    border: `1px solid ${rowBorder}`,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                      #{idx + 1} · In <strong>{formatClock(session.checkInTime)}</strong>
                      {' · '}
                      Out <strong>{formatClock(session.checkOutTime)}</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      {open && (
                        <Chip
                          label="Open"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            bgcolor: `${tokens.semantic.success}15`,
                            color: tokens.semantic.success,
                          }}
                        />
                      )}
                      {reason && (
                        <Chip
                          label={reason}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.6rem',
                            fontWeight: 750,
                            bgcolor: session.checkoutReason === 'inactivity'
                              ? `${tokens.semantic.warning}18`
                              : `${tokens.semantic.info}15`,
                            color: session.checkoutReason === 'inactivity'
                              ? tokens.semantic.warning
                              : tokens.semantic.info,
                          }}
                        />
                      )}
                      <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary }}>
                        {formatMinutes(session.workedMinutes)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {meetings.length > 0 && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: muted,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              mb: 0.75,
            }}
          >
            Meetings ({meetings.length})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {meetings.map((meeting, idx) => {
              const open = !meeting.endTime;
              return (
                <Box
                  key={`meeting-${idx}-${meeting.startTime}`}
                  sx={{
                    px: dense ? 1.25 : 1.5,
                    py: dense ? 0.9 : 1,
                    borderRadius: '12px',
                    bgcolor: rowBg,
                    border: `1px solid ${rowBorder}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                    Start <strong>{formatClock(meeting.startTime)}</strong>
                    {' · '}
                    End <strong>{formatClock(meeting.endTime)}</strong>
                  </Typography>
                  {open && (
                    <Chip
                      label="In meeting"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        bgcolor: `${tokens.brand.primary}18`,
                        color: tokens.brand.primary,
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {totalMinutes != null && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', pt: 0.25 }}>
          <Typography variant="caption" sx={{ color: muted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Day total
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: tokens.brand.primary }}>
            {formatMinutes(totalMinutes)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ShiftDaySessions;
