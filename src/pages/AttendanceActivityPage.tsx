import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams, Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Grid,
  Card,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Pagination,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TimerIcon from '@mui/icons-material/Timer';
import InsightsIcon from '@mui/icons-material/Insights';
import AppsIcon from '@mui/icons-material/Apps';
import LanguageIcon from '@mui/icons-material/Language';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import { format } from 'date-fns';
import { tokens } from '@/styles/tokens';
import { useAuthStore } from '@/store/useAuthStore';
import { useUser } from '@/hooks/api/useUsers';
import {
  useShiftHistory,
  useShiftActivitySamples,
  useActivitySamplesRange,
  useAppUsageSummary,
  useShiftAppUsage,
} from '@/hooks/api/useShifts';
import { ActivityTimeline } from '@/components/attendance/ActivityTimeline';
import { UsageBucketChart, formatDurationSec } from '@/components/attendance/UsageBucketChart';
import { UsageSessionTimeline } from '@/components/attendance/UsageSessionTimeline';

type TrackingTab = 'overview' | 'screenshots' | 'apps' | 'urls';

const pillTabSx = (isDarkMode: boolean) => ({
  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(93, 26, 137, 0.04)',
  borderRadius: '16px',
  p: 0.5,
  minHeight: '44px',
  '& .MuiTabs-indicator': {
    backgroundColor: tokens.brand.primary,
    borderRadius: '12px',
    height: '100%',
    boxShadow: '0 4px 12px rgba(93, 26, 137, 0.25)',
  },
  '& .MuiTab-root': {
    minHeight: 'auto',
    py: 0.8,
    px: { xs: 1.5, sm: 3 },
    borderRadius: '12px',
    textTransform: 'none' as const,
    fontWeight: 750,
    fontSize: '0.9rem',
    color: tokens.text.secondary,
    transition: 'all 0.2s ease',
    '&.Mui-selected': {
      color: '#FFFFFF',
      zIndex: 1,
    },
    '&:hover:not(.Mui-selected)': {
      color: tokens.text.primary,
    },
  },
});

const paperSx = (isDarkMode: boolean) => ({
  p: 3,
  borderRadius: '24px',
  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
  boxShadow: isDarkMode ? 'none' : '0 2px 6px rgba(0,0,0,0.015)',
});

export default function AttendanceActivityPage() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const currentUser = useAuthStore((s) => s.user);
  const isElevated = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const selectedDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const shiftIdParam = searchParams.get('shiftId') || '';
  const tab = (searchParams.get('tab') as TrackingTab) || 'overview';
  const screenshotPage = Number(searchParams.get('page') || '1') || 1;

  const { data: profileUser, isLoading: isUserLoading } = useUser(
    userId && isElevated && userId !== currentUser?._id ? userId : undefined
  );
  const displayUser = userId === currentUser?._id ? currentUser : profileUser;

  const historyRange = useMemo(() => {
    const end = new Date(`${selectedDate}T00:00:00`);
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: selectedDate,
    };
  }, [selectedDate]);

  const { data: historyData, isLoading: isHistoryLoading } = useShiftHistory({
    userId: isElevated ? userId : undefined,
    startDate: historyRange.startDate,
    endDate: historyRange.endDate,
    page: 1,
    limit: 100,
  });

  const shifts = historyData?.shifts ?? [];
  const shiftsOnDate = useMemo(
    () =>
      shifts.filter((s) => format(new Date(s.date), 'yyyy-MM-dd') === selectedDate),
    [shifts, selectedDate]
  );

  const selectedShiftId = useMemo(() => {
    if (shiftIdParam && shiftsOnDate.some((s) => s._id === shiftIdParam)) return shiftIdParam;
    return shiftsOnDate[0]?._id ?? '';
  }, [shiftIdParam, shiftsOnDate]);

  const summaryParams = useMemo(
    () => ({
      userId,
      from: selectedDate,
      to: selectedDate,
    }),
    [userId, selectedDate]
  );

  const { data: summary, isLoading: isSummaryLoading } = useAppUsageSummary(
    userId ? summaryParams : undefined
  );
  const { data: shiftUsage, isLoading: isShiftUsageLoading } = useShiftAppUsage(
    tab === 'apps' || tab === 'urls' || tab === 'overview' ? selectedShiftId || undefined : undefined
  );
  const { data: shiftSamples, isLoading: isShiftSamplesLoading } = useShiftActivitySamples(
    tab === 'screenshots' ? selectedShiftId || undefined : undefined
  );
  const { data: rangeSamples, isLoading: isRangeSamplesLoading } = useActivitySamplesRange(
    userId && tab === 'screenshots' && !selectedShiftId
      ? { ...summaryParams, page: screenshotPage, limit: 50 }
      : userId && tab === 'overview'
        ? { ...summaryParams, page: 1, limit: 1 }
        : undefined
  );

  const screenshotSamples = selectedShiftId ? shiftSamples : rangeSamples?.samples;
  const screenshotLoading = selectedShiftId ? isShiftSamplesLoading : isRangeSamplesLoading;
  const screenshotTotal = rangeSamples?.meta?.total ?? screenshotSamples?.length ?? 0;

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  };

  if (!userId) return <Navigate to="/attendance" replace />;
  if (currentUser && !isElevated && currentUser._id !== userId) {
    return <Navigate to={`/attendance/${currentUser._id}`} replace />;
  }

  const name = displayUser
    ? `${displayUser.firstName || ''} ${displayUser.lastName || ''}`.trim() || displayUser.email
    : 'Employee';

  const topApps = [...(summary?.byApp ?? [])].sort((a, b) => b.activeSec - a.activeSec).slice(0, 5);
  const topDomains = [...(summary?.byDomain ?? [])].sort((a, b) => b.activeSec - a.activeSec).slice(0, 5);

  if (isUserLoading && !displayUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/attendance')}
            sx={{ mb: 1.5, fontWeight: 700, textTransform: 'none', color: 'text.secondary' }}
          >
            Back to attendance
          </Button>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, letterSpacing: '-0.025em', mb: 0.5, color: isDarkMode ? '#fff' : tokens.text.primary }}
          >
            Activity tracking
          </Typography>
          <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary, fontWeight: 500 }}>
            Screenshots, apps, and URLs for {name}
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, val) => setParam('tab', val)} variant="scrollable" allowScrollButtonsMobile sx={pillTabSx(isDarkMode)}>
          <Tab value="overview" label="Overview" />
          <Tab value="screenshots" label="Screenshots" />
          <Tab value="apps" label="App Tracking" />
          <Tab value="urls" label="URL Tracking" />
        </Tabs>
      </Box>

      <Paper elevation={0} sx={{ ...paperSx(isDarkMode), mb: 3.5, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          type="date"
          size="small"
          label="Date"
          InputLabelProps={{ shrink: true }}
          value={selectedDate}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams);
            next.set('date', e.target.value);
            next.delete('shiftId');
            next.delete('page');
            setSearchParams(next, { replace: true });
          }}
          sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="shift-select-label">Shift</InputLabel>
          <Select
            labelId="shift-select-label"
            label="Shift"
            value={selectedShiftId}
            onChange={(e) => setParam('shiftId', e.target.value)}
            sx={{ borderRadius: '12px' }}
            disabled={isHistoryLoading || shiftsOnDate.length === 0}
          >
            {shiftsOnDate.length === 0 ? (
              <MenuItem value="">No shift this day</MenuItem>
            ) : (
              shiftsOnDate.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.checkInTime ? format(new Date(s.checkInTime), 'hh:mm a') : 'Shift'}
                  {s.checkOutTime ? ` – ${format(new Date(s.checkOutTime), 'hh:mm a')}` : ' – open'}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Paper>

      {tab === 'overview' && (
        <>
          {isSummaryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: tokens.brand.primary }} />
            </Box>
          ) : (
            <>
              <Grid container spacing={3} sx={{ mb: 3.5 }}>
                {[
                  {
                    title: 'Active time',
                    value: formatDurationSec(summary?.totals.activeSec ?? 0),
                    icon: <TimerIcon sx={{ fontSize: 26 }} />,
                    color: tokens.brand.primary,
                  },
                  {
                    title: 'Duration',
                    value: formatDurationSec(summary?.totals.durationSec ?? 0),
                    icon: <InsightsIcon sx={{ fontSize: 26 }} />,
                    color: '#3B82F6',
                  },
                  {
                    title: 'App segments',
                    value: summary?.totals.segments ?? 0,
                    icon: <AppsIcon sx={{ fontSize: 26 }} />,
                    color: tokens.semantic.success,
                  },
                  {
                    title: 'Screenshots',
                    value: screenshotLoading ? '…' : screenshotTotal,
                    icon: <PhotoLibraryIcon sx={{ fontSize: 26 }} />,
                    color: tokens.semantic.info,
                  },
                ].map((kpi) => (
                  <Grid item xs={12} sm={6} md={3} key={kpi.title}>
                    <Card
                      sx={{
                        ...paperSx(isDarkMode),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '14px',
                          bgcolor: `${kpi.color}18`,
                          color: kpi.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {kpi.icon}
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {kpi.title}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: kpi.color }}>
                          {kpi.value}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {selectedShiftId && (
                <Paper elevation={0} sx={{ ...paperSx(isDarkMode), mb: 3.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
                    Session timeline
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Each stretch of an app or URL, with start time and time spent (hours, minutes, seconds).
                  </Typography>
                  <UsageSessionTimeline
                    segments={shiftUsage}
                    isLoading={isShiftUsageLoading}
                    isDarkMode={isDarkMode}
                    mode="app"
                    emptyLabel="No sessions recorded for this shift."
                  />
                </Paper>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={paperSx(isDarkMode)}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <AppsIcon sx={{ fontSize: 18, color: tokens.brand.primary }} /> Top apps
                    </Typography>
                    {topApps.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        No app usage recorded.
                      </Typography>
                    ) : (
                      topApps.map((b) => (
                        <Box key={b.key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 650, pr: 2 }}>
                            {b.key}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: tokens.brand.primary, flexShrink: 0 }}>
                            {formatDurationSec(b.activeSec)}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={paperSx(isDarkMode)}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <LanguageIcon sx={{ fontSize: 18, color: tokens.brand.primary }} /> Top domains
                    </Typography>
                    {topDomains.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        No URL tracking recorded.
                      </Typography>
                    ) : (
                      topDomains.map((b) => (
                        <Box key={b.key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 650, pr: 2 }}>
                            {b.key}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: tokens.brand.primary, flexShrink: 0 }}>
                            {formatDurationSec(b.activeSec)}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </>
      )}

      {tab === 'screenshots' && (
        <Paper elevation={0} sx={paperSx(isDarkMode)}>
          <ActivityTimeline
            shiftId={selectedShiftId || undefined}
            enabled
            isDarkMode={isDarkMode}
            samples={screenshotSamples}
            isLoading={screenshotLoading}
          />
          {!selectedShiftId && (rangeSamples?.meta?.total ?? 0) > 50 && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={Math.ceil((rangeSamples?.meta?.total ?? 0) / 50)}
                page={screenshotPage}
                onChange={(_, value) => setParam('page', String(value))}
                color="primary"
                sx={{ '& .MuiPaginationItem-root': { fontWeight: 700, borderRadius: '12px' } }}
              />
            </Box>
          )}
        </Paper>
      )}

      {tab === 'apps' && (
        <Paper elevation={0} sx={paperSx(isDarkMode)}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              App sessions
            </Typography>
            <Chip
              size="small"
              label={`Active ${formatDurationSec(summary?.totals.activeSec ?? 0)} · Duration ${formatDurationSec(summary?.totals.durationSec ?? 0)}`}
              sx={{ fontWeight: 700 }}
            />
          </Box>
          {!selectedShiftId ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 4, textAlign: 'center' }}>
              Select a shift to see the session timeline.
            </Typography>
          ) : (
            <UsageSessionTimeline
              segments={shiftUsage}
              isLoading={isShiftUsageLoading}
              isDarkMode={isDarkMode}
              mode="app"
              emptyLabel="No app tracking for this shift."
            />
          )}
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
              Totals by app
            </Typography>
            {isSummaryLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} sx={{ color: tokens.brand.primary }} />
              </Box>
            ) : (
              <UsageBucketChart buckets={summary?.byApp ?? []} isDarkMode={isDarkMode} emptyLabel="No app tracking for this date." />
            )}
          </Box>
        </Paper>
      )}

      {tab === 'urls' && (
        <Paper elevation={0} sx={paperSx(isDarkMode)}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              URL sessions
            </Typography>
            <Chip
              size="small"
              label={`Active ${formatDurationSec(summary?.totals.activeSec ?? 0)} · Duration ${formatDurationSec(summary?.totals.durationSec ?? 0)}`}
              sx={{ fontWeight: 700 }}
            />
          </Box>
          {!selectedShiftId ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 4, textAlign: 'center' }}>
              Select a shift to see the session timeline.
            </Typography>
          ) : (
            <UsageSessionTimeline
              segments={shiftUsage}
              isLoading={isShiftUsageLoading}
              isDarkMode={isDarkMode}
              mode="url"
              emptyLabel="No URL tracking for this shift."
            />
          )}
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
              Totals by domain
            </Typography>
            {isSummaryLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} sx={{ color: tokens.brand.primary }} />
              </Box>
            ) : (
              <UsageBucketChart buckets={summary?.byDomain ?? []} isDarkMode={isDarkMode} emptyLabel="No URL tracking for this date." />
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
