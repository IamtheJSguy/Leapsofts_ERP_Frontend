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
  useTheme,
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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  // Toggle state: 'generate' or 'history'
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Controlled form states
  const [reportType, setReportType] = useState<string>('user_summary');
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
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 8, height: 32, borderRadius: 4, bgcolor: tokens.brand.primary, backgroundImage: `linear-gradient(180deg, ${tokens.brand.primary} 0%, ${tokens.brand.accent} 100%)` }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 850, color: tokens.text.primary, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fullMetrics.user?.name || userName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.5, display: 'block' }}>
                  Comprehensive Performance Overview
                </Typography>
              </Box>
            </Box>

            {/* Injected User Summary from Full Metrics */}
            <Box
              sx={{
                p: 4,
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.02)',
                mb: 4,
              }}
            >
              <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 6, height: 24, borderRadius: 3, bgcolor: tokens.brand.accent }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: tokens.text.primary, letterSpacing: '-0.02em' }}>
                  User Summary Data
                </Typography>
              </Box>
              <Grid container spacing={3}>
                {[
                  { label: 'Attendance Rate', value: `${Math.round(fullMetrics.attendance?.attendanceRate || 0)}%` },
                  { label: 'KPI Completion', value: `${Math.round(fullMetrics.kpiPerformance?.completionRate || 0)}%` },
                  { label: 'Total Leads', value: fullMetrics.sales?.totalLeads || 0 },
                  { label: 'Meetings Completed', value: fullMetrics.meetings?.completed || 0 },
                ].map((item) => (
                  <Grid item xs={12} sm={6} md={3} key={item.label}>
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: '20px',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : tokens.brand.primary50,
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(93, 26, 137, 0.05)'}`,
                        textAlign: 'center',
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 850, color: tokens.brand.primary, letterSpacing: '-0.02em', mb: 1 }}>
                        {item.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {item.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

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
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 8, height: 32, borderRadius: 4, bgcolor: tokens.brand.primary, backgroundImage: `linear-gradient(180deg, ${tokens.brand.primary} 0%, ${tokens.brand.accent} 100%)` }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 850, color: tokens.text.primary, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  Team Overview Report
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.5, display: 'block' }}>
                  Aggregate Team Metrics
                </Typography>
              </Box>
            </Box>
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: '20px', 
                mb: 4, 
                py: 1.5,
                bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                color: isDarkMode ? '#93C5FD' : '#1D4ED8',
                border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`,
              }}
            >
              Team overview contains combined data for all employees. Use the export button below to download the full report.
            </Alert>
          </Box>
        );
      default:
        // Legacy report types (User Summary) — show metrics dynamically
        return (
          <Box
            sx={{
              p: 4,
              borderRadius: '24px',
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.02)',
              mb: 4,
            }}
          >
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 6, height: 24, borderRadius: 3, bgcolor: tokens.brand.accent }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: tokens.text.primary, letterSpacing: '-0.02em' }}>
                User Summary Data
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {Object.entries(metrics)
                .filter(([, v]) => typeof v === 'number')
                .map(([key, value]) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: '20px',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : tokens.brand.primary50,
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(93, 26, 137, 0.05)'}`,
                        textAlign: 'center',
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 850, color: tokens.brand.primary, letterSpacing: '-0.02em', mb: 1 }}>
                        {value as number}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
          mb: 4.5,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 850, color: tokens.text.primary, letterSpacing: '-0.02em' }}>
          Reports & Analytics
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="standard"
          sx={{
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
              px: { xs: 2, sm: 3.5 },
              borderRadius: '12px',
              textTransform: 'none',
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
              }
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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
              <Box sx={{ width: { xs: '100%', sm: 'auto' }, display: 'flex' }}>
                <ReportExportButton reportId={selectedReport._id} />
              </Box>
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
