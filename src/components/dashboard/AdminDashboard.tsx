import { Grid, Box, CircularProgress, Typography } from '@mui/material';
import { useAdminDashboard } from '@/hooks/api/useDashboard';
import { KPIIndicator } from '@/components/common/KPIIndicator';
import { WeeklyActivityChart } from './WeeklyActivityChart';
import { ConnectionRatioChart } from './ConnectionRatioChart';

export const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminDashboard();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3, fontWeight: 600 }}>
        Team metrics overview
      </Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPIIndicator title="Team Connections" current={stats?.connectionsSent ?? 0} target={200} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPIIndicator
            title="Acceptance Rate"
            current={stats?.connectionsAccepted ?? 0}
            target={80}
            unit="%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPIIndicator title="Messages" current={stats?.messagesSent ?? 0} target={150} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPIIndicator title="Meetings" current={stats?.meetingsScheduled ?? 0} target={20} />
        </Grid>
      </Grid>
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
