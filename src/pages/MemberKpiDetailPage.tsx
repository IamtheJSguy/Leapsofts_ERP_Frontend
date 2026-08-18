import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useDailyKpiEntries } from '@/hooks/api/useKPIs';
import { useTeamSalesKpis } from '@/hooks/api/useSalesKpis';
import { GlassDatePicker } from '@/components/kpi/GlassDatePicker';
import {
  buildMemberKpiDetailSearch,
  formatPeriodLabel,
  isPeriodMode,
  resolvePeriod,
  type PeriodMode,
} from '@/lib/kpiPeriod';
import { tokens } from '@/styles/tokens';
import { formatDateTime, getDisplayName } from '@/utils/formatters';
import type { SalesKpiEntry, SalesKpiStatus, User } from '@/types';

const isSalesDone = (status: SalesKpiStatus) =>
  status === 'completed_on_time' || status === 'completed_late';

const periodHasEnded = (periodEnd?: string | null) =>
  !!periodEnd && new Date(periodEnd).getTime() < Date.now();

const completedAfterDeadline = (completedAt?: string | null, periodEnd?: string | null) =>
  !!completedAt && !!periodEnd && new Date(completedAt).getTime() > new Date(periodEnd).getTime();

type TaskDisplay = {
  statusLabel: string;
  isCompleted: boolean;
  isOverdue: boolean;
  isCompletedLate: boolean;
};

const hasPartialProgress = (actual?: number | null, target?: number | null) => {
  const value = actual ?? 0;
  return value > 0 && (target == null || value < target);
};

const salesTaskDisplay = (entry: SalesKpiEntry): TaskDisplay => {
  const done = isSalesDone(entry.status);
  const completedLate = entry.status === 'completed_late';
  const partial = !done && (entry.status === 'partial' || hasPartialProgress(entry.currentValue, entry.targetValue));
  const overdue = !done && !partial && (entry.status === 'missed' || periodHasEnded(entry.periodEnd));

  let statusLabel: string;
  if (completedLate) statusLabel = 'Completed late';
  else if (entry.status === 'completed_on_time') statusLabel = 'Completed';
  else if (overdue) statusLabel = 'Overdue';
  else statusLabel = 'Incomplete';

  return { statusLabel, isCompleted: done, isOverdue: overdue, isCompletedLate: completedLate };
};

const dailyTaskDisplay = (entry: {
  isCompleted?: boolean;
  periodEnd?: string;
  completedAt?: string | null;
  actualValue?: number | null;
  targetValue?: number | null;
}): TaskDisplay => {
  const done = !!entry.isCompleted;
  const completedLate = done && completedAfterDeadline(entry.completedAt, entry.periodEnd);
  const partial = !done && hasPartialProgress(entry.actualValue, entry.targetValue);
  const overdue = !done && !partial && periodHasEnded(entry.periodEnd);

  let statusLabel: string;
  if (completedLate) statusLabel = 'Completed late';
  else if (done) statusLabel = 'Completed';
  else if (overdue) statusLabel = 'Overdue';
  else statusLabel = 'Incomplete';

  return { statusLabel, isCompleted: done, isOverdue: overdue, isCompletedLate: completedLate };
};

const resolveUser = (ref: unknown): User | null => {
  if (!ref || typeof ref === 'string') return null;
  return ref as User;
};

const TimingRow = ({ label, value }: { label: string; value?: string | null }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary' }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', textAlign: 'right' }}>
      {value ? formatDateTime(value) : '—'}
    </Typography>
  </Box>
);

export default function MemberKpiDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const today = new Date().toLocaleDateString('en-CA');
  const mode: PeriodMode = isPeriodMode(searchParams.get('mode'))
    ? (searchParams.get('mode') as PeriodMode)
    : 'day';
  const date = searchParams.get('startDate') || today;
  const rangeEnd = searchParams.get('rangeEnd') || searchParams.get('endDate') || date;

  const period = useMemo(() => resolvePeriod(mode, date, rangeEnd), [mode, date, rangeEnd]);

  const writePeriod = (nextMode: PeriodMode, nextDate: string, nextRangeEnd: string) => {
    setSearchParams(buildMemberKpiDetailSearch({ mode: nextMode, date: nextDate, rangeEnd: nextRangeEnd }));
  };

  const queryParams = useMemo(
    () => ({
      startDate: period.startDate,
      endDate: period.endDate,
      userId,
    }),
    [period.startDate, period.endDate, userId],
  );

  const { data: dailyEntries = [], isLoading: dailyLoading } = useDailyKpiEntries({
    startDate: period.startDate,
    endDate: period.endDate,
    userId,
  });
  const { data: salesEntries = [], isLoading: salesLoading } = useTeamSalesKpis(
    userId ? queryParams : null,
  );

  const isLoading = dailyLoading || salesLoading;

  const member = useMemo(() => {
    for (const entry of dailyEntries as any[]) {
      const user = resolveUser(entry.userId);
      if (user?.firstName || user?.email) return user;
    }
    for (const entry of salesEntries) {
      const user = resolveUser(entry.userId);
      if (user?.firstName || user?.email) return user;
    }
    return null;
  }, [dailyEntries, salesEntries]);

  const displayName = member ? getDisplayName(member) : 'Team member';
  const initial = displayName.charAt(0).toUpperCase();

  const dailyCompleted = (dailyEntries as any[]).filter((e) => e.isCompleted).length;
  const salesCompleted = salesEntries.filter((e) => isSalesDone(e.status)).length;
  const totalCount = dailyEntries.length + salesEntries.length;
  const completedCount = dailyCompleted + salesCompleted;

  const targetPairs = [
    ...(dailyEntries as any[]).map((e) => ({
      target: e.targetValue as number | null | undefined,
      actual: e.actualValue as number | null | undefined,
    })),
    ...salesEntries.map((e) => ({ target: e.targetValue, actual: e.currentValue })),
  ].filter((row) => row.target != null && row.target > 0);
  const totalTarget = targetPairs.reduce((sum, row) => sum + (row.target ?? 0), 0);
  const totalActual = targetPairs.reduce((sum, row) => sum + (row.actual ?? 0), 0);

  const periodLabel = formatPeriodLabel(mode, period.startDate, period.endDate);
  const filterCaption =
    mode === 'day' ? 'Filter by Date' : mode === 'week' ? 'Filter by Week' : 'Date Range';

  const handleModeChange = (_: React.MouseEvent<HTMLElement>, next: PeriodMode | null) => {
    if (!next) return;
    const nextRangeEnd = next === 'range' && (!rangeEnd || rangeEnd < date) ? date : rangeEnd;
    writePeriod(next, date, nextRangeEnd);
  };

  const cardSx = {
    borderRadius: '24px',
    bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.65)' : 'rgba(255, 255, 255, 0.85)',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
    boxShadow: isDarkMode ? 'none' : '0 10px 40px rgba(0, 0, 0, 0.03)',
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4.5 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Button
          onClick={() => navigate('/tasks')}
          startIcon={<ArrowBackIcon />}
          sx={{
            py: 1,
            px: 2.5,
            borderRadius: '16px',
            textTransform: 'none',
            fontWeight: 700,
            color: 'text.secondary',
            mb: 2,
          }}
        >
          Back to Team Progress
        </Button>

        <Card sx={{ ...cardSx, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F2EEEC',
                color: isDarkMode ? '#FFFFFF' : '#1A1625',
                fontSize: '1.4rem',
                fontWeight: 800,
              }}
            >
              {initial}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 200 }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  color: isDarkMode ? '#fff' : tokens.text.primary,
                  letterSpacing: '-0.02em',
                }}
              >
                {displayName}
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', color: 'text.secondary', fontWeight: 600 }}>
                {member?.email || '—'}
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>
                {completedCount} of {totalCount} completed
                {totalTarget > 0 && ` · Actual ${totalActual} / Target ${totalTarget}`}
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' },
          gap: 2,
          p: 2.5,
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255, 255, 255, 0.65)',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.7)'}`,
          borderRadius: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
          flexWrap: 'wrap',
        }}
      >
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
          sx={{
            bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)',
            p: 0.5,
            borderRadius: '16px',
            border: 'none',
            height: 56,
            '& .MuiToggleButtonGroup-grouped': {
              border: 0,
              borderRadius: '12px !important',
              px: 2,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
            },
          }}
        >
          {(['day', 'week', 'range'] as PeriodMode[]).map((value) => (
            <ToggleButton
              key={value}
              value={value}
              sx={{
                color: 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff',
                  color: tokens.brand.primary,
                  boxShadow: 'none',
                },
              }}
            >
              {value === 'day' ? 'Day' : value === 'week' ? 'Week' : 'Range'}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {mode === 'range' ? (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <GlassDatePicker
              value={date}
              onChange={(v) => writePeriod(mode, v, rangeEnd < v ? v : rangeEnd)}
              isDarkMode={isDarkMode}
              label="Start Date"
            />
            <GlassDatePicker
              value={rangeEnd}
              onChange={(v) => writePeriod(mode, date, v)}
              isDarkMode={isDarkMode}
              label="End Date"
            />
          </Box>
        ) : (
          <GlassDatePicker
            value={date}
            onChange={(v) => writePeriod(mode, v, rangeEnd)}
            isDarkMode={isDarkMode}
            label={filterCaption}
            displayValue={periodLabel}
          />
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress sx={{ color: tokens.brand.primary }} />
        </Box>
      ) : totalCount === 0 ? (
        <Box
          sx={{
            p: 8,
            textAlign: 'center',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255,255,255,0.6)',
            borderRadius: '24px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
          }}
        >
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            No KPI entries for this period.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled', mt: 1 }}>
            Nothing found for {periodLabel}.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {(dailyEntries as any[]).map((entry) => {
            const display = dailyTaskDisplay(entry);
            return (
            <Grid item xs={12} md={6} key={`daily-${entry._id}`}>
              <KpiDetailCard
                isDarkMode={isDarkMode}
                kind="daily"
                name={entry.kpiName || entry.kpiId?.name || 'KPI'}
                statusLabel={display.statusLabel}
                isCompleted={display.isCompleted}
                isOverdue={display.isOverdue}
                isCompletedLate={display.isCompletedLate}
                actual={entry.actualValue}
                target={entry.targetValue}
                periodEnd={entry.periodEnd}
                completedAt={entry.completedAt}
              />
            </Grid>
            );
          })}
          {salesEntries.map((entry: SalesKpiEntry) => {
            const display = salesTaskDisplay(entry);
            return (
            <Grid item xs={12} md={6} key={`sales-${entry._id}`}>
              <KpiDetailCard
                isDarkMode={isDarkMode}
                kind="sales"
                name={entry.kpiName}
                statusLabel={display.statusLabel}
                isCompleted={display.isCompleted}
                isOverdue={display.isOverdue}
                isCompletedLate={display.isCompletedLate}
                actual={entry.currentValue}
                target={entry.targetValue}
                periodEnd={entry.periodEnd}
                completedAt={entry.completedAt}
              />
            </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

function KpiDetailCard({
  isDarkMode,
  kind,
  name,
  statusLabel,
  isCompleted,
  isOverdue,
  isCompletedLate,
  actual,
  target,
  periodEnd,
  completedAt,
}: {
  isDarkMode: boolean;
  kind: 'daily' | 'sales';
  name: string;
  statusLabel: string;
  isCompleted: boolean;
  isOverdue: boolean;
  isCompletedLate: boolean;
  actual?: number | null;
  target?: number | null;
  periodEnd?: string;
  completedAt?: string | null;
}) {
  const hasTarget = target != null && target > 0;
  const isIncomplete = !isCompleted && !isOverdue;
  const statusColor = isOverdue
    ? tokens.semantic.error
    : isIncomplete || isCompletedLate
      ? tokens.semantic.warning
      : tokens.semantic.success;
  const statusBg = isOverdue
    ? 'rgba(239, 68, 68, 0.12)'
    : isIncomplete || isCompletedLate
      ? 'rgba(245, 158, 11, 0.14)'
      : 'rgba(16, 185, 129, 0.12)';

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: '24px',
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.65)' : 'rgba(255, 255, 255, 0.85)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
        boxShadow: isDarkMode ? 'none' : '0 10px 40px rgba(0, 0, 0, 0.03)',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {isCompleted ? (
          <CheckCircleIcon
            sx={{
              fontSize: 22,
              color: isCompletedLate ? tokens.semantic.warning : tokens.semantic.success,
              mt: 0.25,
            }}
          />
        ) : (
          <AccessTimeIcon
            sx={{
              fontSize: 22,
              color: isOverdue ? tokens.semantic.error : tokens.semantic.warning,
              mt: 0.25,
            }}
          />
        )}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1rem',
              color: isDarkMode ? '#fff' : tokens.text.primary,
            }}
          >
            {name}
          </Typography>
          {hasTarget && (
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary', mt: 0.25 }}>
              Actual {actual ?? 0} / Target {target}
            </Typography>
          )}
        </Box>
        <Chip
          size="small"
          label={kind === 'sales' ? 'Sales' : 'Daily'}
          sx={{
            height: 22,
            fontWeight: 700,
            fontSize: '0.68rem',
            ...(kind === 'sales'
              ? { bgcolor: 'rgba(93, 26, 137, 0.08)', color: tokens.brand.primary }
              : {
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  color: 'text.secondary',
                }),
          }}
        />
        <Chip
          size="small"
          label={statusLabel}
          sx={{
            height: 22,
            fontWeight: 700,
            fontSize: '0.68rem',
            bgcolor: statusBg,
            color: statusColor,
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
        <TimingRow label="End time" value={periodEnd} />
        {isCompleted && <TimingRow label="Completed at" value={completedAt} />}
      </Box>

    </Card>
  );
}
