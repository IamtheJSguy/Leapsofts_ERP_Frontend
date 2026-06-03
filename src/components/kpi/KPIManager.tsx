import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  CircularProgress,
} from '@mui/material';
import { kpiSchema, type KpiFormData } from '@/utils/validators';
import { KPI_TIMEFRAME_OPTIONS } from '@/lib/constants';
import { useCreateKPI } from '@/hooks/api/useKPIs';
import { useUIStore } from '@/store/useUIStore';

export const KPIManager = () => {
  const createKPI = useCreateKPI();
  const addToast = useUIStore((s) => s.addToast);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<KpiFormData>({
    resolver: zodResolver(kpiSchema),
    defaultValues: { metricType: 'count', timeFrame: 'daily' },
  });

  const onSubmit = (data: KpiFormData) => {
    createKPI.mutate(data as Partial<import('@/types').KPI>, {
      onSuccess: () => {
        addToast({ message: 'KPI created', severity: 'success' });
        reset();
      },
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Create KPI
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            {...register('name')}
            label="KPI Name"
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            {...register('targetValue')}
            label="Target Value"
            type="number"
            fullWidth
            error={!!errors.targetValue}
            helperText={errors.targetValue?.message}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField {...register('timeFrame')} label="Timeframe" select fullWidth>
            {KPI_TIMEFRAME_OPTIONS.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <TextField {...register('metricType')} label="Metric Type" select fullWidth>
            {['count', 'ratio', 'time', 'duration'].map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" variant="contained" disabled={createKPI.isPending}>
            {createKPI.isPending ? <CircularProgress size={20} /> : 'Create KPI'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
