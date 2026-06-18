import { useEffect, useState } from 'react';
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
import { useUsers } from '@/hooks/api/useUsers';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';

const REPORT_TYPES = [
  'user_summary',
  'admin_summary',
  'connections',
  'messages',
  'meetings',
];

interface ReportBuilderProps {
  onGenerated?: (id: string) => void;
  reportType: string;
  onReportTypeChange?: (type: string) => void;
  selectedAgentId: string;
  onAgentChange?: (id: string) => void;
}

export const ReportBuilder = ({
  onGenerated,
  reportType,
  onReportTypeChange,
  selectedAgentId,
  onAgentChange,
}: ReportBuilderProps) => {
  const generateReport = useGenerateReport();
  const addToast = useUIStore((s) => s.addToast);
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  const { data: users = [] } = useUsers(
    {},
    { enabled: isAdmin } // only fetch if user is admin
  );
  
  const agents = users.filter((u) => u.role !== 'admin');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { register, handleSubmit, setValue } = useForm({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: { type: reportType, userId: selectedAgentId },
  });

  // Sync prop changes into react-hook-form values
  useEffect(() => {
    setValue('type', reportType);
  }, [reportType, setValue]);

  useEffect(() => {
    setValue('userId', selectedAgentId);
  }, [selectedAgentId, setValue]);

  const { onChange: typeOnChange, ...typeRegister } = register('type');
  const { onChange: userOnChange, ...userRegister } = register('userId');

  const onSubmit = (data: Record<string, string>) => {
    const payload: Record<string, string> = { ...data, startDate, endDate };
    if (!payload.userId) delete payload.userId;

    generateReport.mutate(payload, {
      onSuccess: (res) => {
        addToast({ message: 'Report generation started', severity: 'success' });
        onGenerated?.(res.data.data._id || res.data.data.reportId);
      },
      onError: (err) => {
        addToast({ message: 'Failed to generate report: ' + err.message, severity: 'error' });
      },
    });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        p: 2.5,
        borderRadius: '20px',
        border: `1px solid ${tokens.surface.borderLight}`,
        backgroundColor: '#FFFFFF',
        boxShadow: tokens.shadow.card,
        mb: 4,
      }}
    >
      <Grid container spacing={2} alignItems="center">
        {/* Report Type */}
        <Grid item xs={12} sm={6} md={isAdmin ? 2 : 2.5}>
          <TextField
            {...typeRegister}
            onChange={(e) => {
              typeOnChange(e);
              onReportTypeChange?.(e.target.value);
            }}
            label="Report Type"
            select
            fullWidth
            size="medium"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
            }}
          >
            {REPORT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* User Filter (Admin Only) */}
        {isAdmin && (
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              {...userRegister}
              onChange={(e) => {
                userOnChange(e);
                onAgentChange?.(e.target.value);
              }}
              label="Select Agent (Optional)"
              select
              fullWidth
              size="medium"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            >
              <MenuItem value="">
                <em>All Agents</em>
              </MenuItem>
              {agents.map((agent) => (
                <MenuItem key={agent._id} value={agent._id}>
                  {`${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        {/* Date Range Selector */}
        <Grid item xs={12} md={isAdmin ? 3.5 : 4}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
            size="medium"
          />
        </Grid>

        {/* Location & Industry Filters */}
        <Grid item xs={12} sm={6} md={1.5}>
          <TextField
            {...register('location')}
            label="Location"
            fullWidth
            size="medium"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={1.5}>
          <TextField
            {...register('industry')}
            label="Industry"
            fullWidth
            size="medium"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
            }}
          />
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12} md={isAdmin ? 1 : 1}>
          <Button
            type="submit"
            variant="contained"
            disabled={generateReport.isPending}
            fullWidth
            sx={{
              borderRadius: '12px',
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: tokens.brand.primary,
              minWidth: '110px',
              '&:hover': {
                backgroundColor: tokens.brand.primaryDark,
              },
            }}
          >
            {generateReport.isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Generate'
            )}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
