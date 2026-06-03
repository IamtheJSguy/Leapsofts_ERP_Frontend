import { Grid, CircularProgress, Box } from '@mui/material';
import { KPIIndicator } from '@/components/common/KPIIndicator';
import { useMyKPIs, useKPIRecords } from '@/hooks/api/useKPIs';
import { EmptyState } from '@/components/common/EmptyState';

export const MyKPIs = () => {
  const { data: kpis = [], isLoading: kpisLoading } = useMyKPIs();
  const { data: records = [], isLoading: recordsLoading } = useKPIRecords();

  if (kpisLoading || recordsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (kpis.length === 0) {
    return <EmptyState title="No KPIs assigned" description="Contact your admin to set up KPIs." />;
  }

  return (
    <Grid container spacing={2}>
      {kpis.map((kpi) => {
        const record = records.find(
          (r) => (typeof r.kpiId === 'object' ? r.kpiId._id : r.kpiId) === kpi._id,
        );
        return (
          <Grid item xs={12} sm={6} md={4} key={kpi._id}>
            <KPIIndicator
              title={kpi.name}
              current={record?.actualValue ?? 0}
              target={record?.targetValue ?? kpi.targetValue}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};
