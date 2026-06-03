import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
} from '@mui/material';
import { reportFilterSchema } from '@/utils/validators';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { useGenerateReport } from '@/hooks/api/useReports';
import { useUIStore } from '@/store/useUIStore';

const REPORT_TYPES = [
  'user_summary',
  'admin_summary',
  'connections',
  'messages',
  'meetings',
];

export const ReportBuilder = ({ onGenerated }: { onGenerated?: (id: string) => void }) => {
  const generateReport = useGenerateReport();
  const addToast = useUIStore((s) => s.addToast);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { register, handleSubmit } = useForm({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: { type: 'user_summary' },
  });

  const onSubmit = (data: Record<string, string>) => {
    generateReport.mutate(
      { ...data, startDate, endDate },
      {
        onSuccess: (res) => {
          addToast({ message: 'Report generation started', severity: 'success' });
          onGenerated?.(res.data.data._id || res.data.data.reportId);
        },
      },
    );
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField {...register('type')} label="Report Type" select fullWidth>
            {REPORT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('location')} label="Location" fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('industry')} label="Industry" fullWidth />
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" variant="contained" disabled={generateReport.isPending}>
            {generateReport.isPending ? <CircularProgress size={20} /> : 'Generate Report'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
