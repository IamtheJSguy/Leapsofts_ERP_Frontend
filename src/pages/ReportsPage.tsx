import { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import { ReportBuilder } from '@/components/reports/ReportBuilder';
import { ReportTable } from '@/components/reports/ReportTable';
import { ReportExportButton } from '@/components/reports/ReportExportButton';
import { AttendanceReportView } from '@/components/reports/AttendanceReportView';
import { KpiPerformanceView } from '@/components/reports/KpiPerformanceView';
import { useAuthStore } from '@/store/useAuthStore';
import { useUsers } from '@/hooks/api/useUsers';
import { useReport } from '@/hooks/api/useReports';
import { tokens } from '@/styles/tokens';
import type {
  Report,
  AttendanceMetrics,
  KpiPerformanceMetrics,
  EmployeeFullMetrics,
  User,
} from '@/types';

const ReportsPage = () => {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  // Toggle state: 'generate' or 'history'
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Controlled form states
  const [reportType, setReportType] = useState<string>('attendance');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const { data: users = [] } = useUsers({}, { enabled: isAdmin });

  const selectedAgent = useMemo(() => {
    return users.find((u) => u._id === selectedAgentId) || null;
  }, [users, selectedAgentId]);

  const selectedAgentName = useMemo(() => {
    if (!selectedAgent) return 'All Employees';
    return `${selectedAgent.firstName || ''} ${selectedAgent.lastName || ''}`.trim() || selectedAgent.email;
  }, [selectedAgent]);

  // Fetch the selected report details (with polling while processing)
  const { data: selectedReport, isLoading: reportLoading } = useReport(selectedReportId ?? undefined);

  /** Handle report generated — switch to viewing the result */
  const handleReportGenerated = (id: string) => {
    setSelectedReportId(id);
  };

  /** Render the report result based on type and metrics */
  const renderReportResult = () => {
    if (!selectedReportId) return null;

    if (reportLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="secondary" />
        </Box>
      );
    }

    if (!selectedReport) return null;

    // Processing state
    if (selectedReport.status === 'pending' || selectedReport.status === 'processing') {
      return (
        <Box
          sx={{
            p: 4,
            borderRadius: '20px',
            border: `1px solid ${tokens.surface.borderLight}`,
            backgroundColor: '#FFFFFF',
            boxShadow: tokens.shadow.card,
            textAlign: 'center',
          }}
        >
          <CircularProgress color="secondary" sx={{ mb: 2 }} />
          <Typography variant="h6" color={tokens.brand.primary} fontWeight={600}>
            Generating Report...
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Your report is being processed. This page will auto-update when ready.
          </Typography>
        </Box>
      );
    }

    // Failed state
    if (selectedReport.status === 'failed') {
      return (
        <Alert severity="error" sx={{ borderRadius: '16px' }}>
          Report generation failed: {selectedReport.error || 'Unknown error'}
        </Alert>
      );
    }

    // Completed — render the actual report view
    const metrics = selectedReport.metrics;
    const comparison = selectedReport.comparisonMetrics;
    const reportUser = selectedReport.userId as User | undefined;
    const userName = reportUser
      ? `${reportUser.firstName || ''} ${reportUser.lastName || ''}`.trim() || reportUser.email
      : selectedAgentName;

    if (!metrics) {
      return (
        <Alert severity="info" sx={{ borderRadius: '16px' }}>
          No data available for the selected period.
        </Alert>
      );
    }

    switch (selectedReport.type) {
      case 'attendance':
        return (
          <AttendanceReportView
            metrics={metrics as unknown as AttendanceMetrics}
            comparison={comparison as unknown as AttendanceMetrics | undefined}
            userName={userName}
          />
        );
      case 'kpi_performance':
        return (
          <KpiPerformanceView
            metrics={metrics as unknown as KpiPerformanceMetrics}
            comparison={comparison as unknown as KpiPerformanceMetrics | undefined}
            userName={userName}
          />
        );
      case 'employee_full': {
        const fullMetrics = metrics as unknown as EmployeeFullMetrics;
        return (
          <Box>
            <Typography variant="h5" fontWeight={700} color={tokens.brand.primary} mb={3}>
              Full Report — {fullMetrics.user?.name || userName}
            </Typography>
            <Box mb={4}>
              <AttendanceReportView
                metrics={fullMetrics.attendance}
                comparison={(comparison as unknown as EmployeeFullMetrics)?.attendance}
                userName={fullMetrics.user?.name}
              />
            </Box>
            <Box>
              <KpiPerformanceView
                metrics={fullMetrics.kpiPerformance}
                comparison={(comparison as unknown as EmployeeFullMetrics)?.kpiPerformance}
                userName={fullMetrics.user?.name}
              />
            </Box>
          </Box>
        );
      }
      case 'team_overview':
        // For team overview, render each member as a summary card
        return (
          <Box>
            <Typography variant="h5" fontWeight={700} color={tokens.brand.primary} mb={3}>
              Team Overview Report
            </Typography>
            <Alert severity="info" sx={{ borderRadius: '16px', mb: 2 }}>
              Team overview contains combined data for all employees. Use the export button below to download the full report.
            </Alert>
          </Box>
        );
      default:
        // Legacy report types — show basic metrics
        return (
          <Box
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${tokens.surface.borderLight}`,
              backgroundColor: '#FFFFFF',
              boxShadow: tokens.shadow.card,
            }}
          >
            <Typography variant="h6" fontWeight={600} color={tokens.brand.primary} mb={2}>
              Report Results
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(metrics)
                .filter(([, v]) => typeof v === 'number')
                .map(([key, value]) => (
                  <Grid item xs={6} sm={4} md={3} key={key}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        backgroundColor: tokens.brand.primary50,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="h5" fontWeight={700} color={tokens.brand.primary}>
                        {value as number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
            </Grid>
          </Box>
        );
    }
  };

  // If not admin, redirect handled by router — this is a safety check
  if (!isAdmin) return null;

  return (
    <Box sx={{ pb: 4 }}>
      {/* Title & View Switcher */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight={700} color={tokens.brand.primary}>
          Reports & Analytics
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            backgroundColor: tokens.brand.primary50,
            borderRadius: '24px',
            p: 0.5,
            '& .MuiTabs-indicator': {
              backgroundColor: tokens.brand.primary,
              borderRadius: '20px',
              height: '100%',
            },
            '& .MuiTab-root': {
              minHeight: 'auto',
              py: 1,
              px: 3,
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: tokens.text.muted,
              transition: 'color 0.2s ease',
              '&.Mui-selected': {
                color: '#FFFFFF',
                zIndex: 1,
              },
            },
          }}
        >
          <Tab value="generate" label="Generate Report" />
          <Tab value="history" label="Report History" />
        </Tabs>
      </Box>

      {activeTab === 'generate' ? (
        <Box>
          {/* Report Builder */}
          <ReportBuilder
            reportType={reportType}
            onReportTypeChange={setReportType}
            selectedAgentId={selectedAgentId}
            onAgentChange={setSelectedAgentId}
            onGenerated={handleReportGenerated}
          />

          {/* Report Result View */}
          {renderReportResult()}

          {/* Export Toolbar */}
          {selectedReport && selectedReport.status === 'completed' && (
            <Box
              sx={{
                mt: 4,
                p: 3,
                borderRadius: '20px',
                border: `1px solid ${tokens.surface.borderLight}`,
                backgroundColor: '#FFFFFF',
                boxShadow: tokens.shadow.card,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Report Ready
                </Typography>
                <Chip
                  label={selectedReport.type.replace(/_/g, ' ')}
                  size="small"
                  sx={{
                    backgroundColor: tokens.brand.primary50,
                    color: tokens.brand.primary,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                />
                {selectedReport.period && (
                  <Chip
                    label={selectedReport.period}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: tokens.brand.accent,
                      color: tokens.brand.accent,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  />
                )}
              </Box>
              <ReportExportButton reportId={selectedReport._id} />
            </Box>
          )}
        </Box>
      ) : (
        /* History Tab */
        <Box>
          <Typography variant="h6" fontWeight={600} color={tokens.brand.primary} gutterBottom>
            Generated Reports History
          </Typography>
          <ReportTable
            onSelect={(report: Report) => {
              setSelectedReportId(report._id);
              setActiveTab('generate');
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ReportsPage;
export { ReportsPage };
