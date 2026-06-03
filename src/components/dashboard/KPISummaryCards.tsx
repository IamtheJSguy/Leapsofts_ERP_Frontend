import { Grid } from '@mui/material';
import { KPIIndicator } from '@/components/common/KPIIndicator';
import type { DashboardStats } from '@/types';

interface KPISummaryCardsProps {
  stats?: DashboardStats;
}

export const KPISummaryCards = ({ stats }: KPISummaryCardsProps) => (
  <Grid container spacing={2}>
    <Grid item xs={12} sm={6} md={4}>
      <KPIIndicator title="Connections Sent" current={stats?.connectionsSent ?? 0} target={50} />
    </Grid>
    <Grid item xs={12} sm={6} md={4}>
      <KPIIndicator
        title="Acceptance Rate"
        current={stats?.acceptanceRate ?? 0}
        target={30}
        unit="%"
      />
    </Grid>
    <Grid item xs={12} sm={6} md={4}>
      <KPIIndicator title="Messages Sent" current={stats?.messagesSent ?? 0} target={40} />
    </Grid>
    <Grid item xs={12} sm={6} md={4}>
      <KPIIndicator title="Leads Added" current={stats?.leadsAdded ?? 0} target={20} />
    </Grid>
    <Grid item xs={12} sm={6} md={4}>
      <KPIIndicator title="Meetings Scheduled" current={stats?.meetingsScheduled ?? 0} target={5} />
    </Grid>
    <Grid item xs={12} sm={6} md={4}>
      <KPIIndicator
        title="Connections Accepted"
        current={stats?.connectionsAccepted ?? 0}
        target={stats?.connectionsSent ?? 1}
      />
    </Grid>
  </Grid>
);
