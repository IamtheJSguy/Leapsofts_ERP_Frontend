import { Grid, Box, CircularProgress, Typography } from '@mui/material';
import { KPIIndicator } from '@/components/common/KPIIndicator';
import { WeeklyActivityChart } from './WeeklyActivityChart';
import { ConnectionRatioChart } from './ConnectionRatioChart';
import { useDashboard } from '@/hooks/api/useDashboard';

export const UserDashboard = () => {
  const { data: stats, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  const kpiSummary = stats?.kpiSummary || [];

  return (
    <Box>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3, fontWeight: 600 }}>
        Your metrics — last 7 days
      </Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPIIndicator title="Connections Sent" current={stats?.connectionsSent ?? 0} target={50} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPIIndicator title="Accepted" current={stats?.connectionsAccepted ?? 0} target={20} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPIIndicator title="Messages Sent" current={stats?.messagesSent ?? 0} target={30} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPIIndicator title="Meetings" current={stats?.meetingsScheduled ?? 0} target={5} />
        </Grid>
      </Grid>
      {kpiSummary.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {kpiSummary.map((kpi) => (
            <Grid item xs={12} sm={6} md={4} key={kpi.name}>
              <KPIIndicator title={kpi.name} current={kpi.current} target={kpi.target} />
            </Grid>
          ))}
        </Grid>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <WeeklyActivityChart data={stats?.weeklyActivity || []} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ConnectionRatioChart data={stats?.connectionRatios || []} />
        </Grid>
      </Grid>
    </Box>
  );
};
