import { useState, useMemo } from 'react';
import { Typography, Box, Tabs, Tab, Grid } from '@mui/material';
import { ReportBuilder } from '@/components/reports/ReportBuilder';
import { ReportTable } from '@/components/reports/ReportTable';
import { ReportExportButton } from '@/components/reports/ReportExportButton';
import { ReportChartView } from '@/components/reports/ReportChartView';
import { TargetComplianceMatrix } from '@/components/reports/TargetComplianceMatrix';
import { QuickAccessPresets } from '@/components/reports/QuickAccessPresets';
import { TeamProgressView } from '@/components/reports/TeamProgressView';
import { useAuthStore } from '@/store/useAuthStore';
import { useUsers } from '@/hooks/api/useUsers';
import { useUIStore } from '@/store/useUIStore';
import { useExportReport } from '@/hooks/api/useReports';
import { tokens } from '@/styles/tokens';
import type { Report } from '@/types';

const ReportsPage = () => {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';
  const addToast = useUIStore((s) => s.addToast);
  const exportReport = useExportReport();

  // Toggle state: 'team' or 'individual'
  const [activeTab, setActiveTab] = useState<'team' | 'individual'>(isAdmin ? 'team' : 'individual');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  // Controlled form states synced with presets
  const [reportType, setReportType] = useState<string>('user_summary');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(currentUser?._id || '');
  const [activePreset, setActivePreset] = useState<string | null>('agent_performance');

  const { data: users = [] } = useUsers(
    {},
    { enabled: isAdmin }
  );

  const selectedAgent = useMemo(() => {
    if (!isAdmin) return currentUser;
    return users.find((u) => u._id === selectedAgentId) || currentUser;
  }, [users, selectedAgentId, isAdmin, currentUser]);

  const selectedAgentName = useMemo(() => {
    if (!selectedAgent) return 'Agent';
    return `${selectedAgent.firstName || ''} ${selectedAgent.lastName || ''}`.trim() || selectedAgent.email;
  }, [selectedAgent]);

  // Handle Preset Select
  const handlePresetSelect = (presetId: string) => {
    if (presetId === 'monthly_exports') {
      if (selectedAgentId) {
        exportReport.mutate(
          { id: selectedAgentId, format: 'excel' },
          {
            onSuccess: () => {
              addToast({
                message: `Monthly Excel report exported for ${selectedAgentName}`,
                severity: 'success',
              });
            },
            onError: (err) => {
              addToast({
                message: `Failed to export Excel: ${err.message}`,
                severity: 'error',
              });
            },
          }
        );
      } else {
        addToast({
          message: 'Please select an agent to export a report.',
          severity: 'warning',
        });
      }
      return;
    }

    setActivePreset(presetId);

    // Sync reportType form field based on preset selection
    if (presetId === 'agent_performance') {
      setReportType('user_summary');
    } else if (presetId === 'outreach_funnel') {
      setReportType('connections');
    } else if (presetId === 'template_sentiment') {
      setReportType('messages');
    }
  };

  // Sync activePreset if reportType filter is changed manually in the form
  const handleReportTypeChange = (newType: string) => {
    setReportType(newType);
    if (newType === 'user_summary' || newType === 'admin_summary') {
      setActivePreset('agent_performance');
    } else if (newType === 'connections') {
      setActivePreset('outreach_funnel');
    } else if (newType === 'messages') {
      setActivePreset('template_sentiment');
    } else {
      setActivePreset(null);
    }
  };

  // Dynamic seed-based chart data depending on selected preset and agent
  const chartData = useMemo(() => {
    const seed = selectedAgent?._id 
      ? selectedAgent._id.charCodeAt(0) + selectedAgent._id.charCodeAt(selectedAgent._id.length - 1)
      : 42;

    if (activePreset === 'outreach_funnel') {
      return [
        { name: 'Sent Requests', value: Math.round((seed % 40) + 120) },
        { name: 'Accepted', value: Math.round((seed % 30) + 70) },
        { name: 'Declined', value: Math.round((seed % 10) + 15) },
        { name: 'No Response', value: Math.round((seed % 15) + 35) },
      ];
    } else if (activePreset === 'template_sentiment') {
      return [
        { name: 'Total Messages', value: Math.round((seed % 50) + 180) },
        { name: 'Replied Messages', value: Math.round((seed % 30) + 90) },
        { name: 'Positive Reply', value: Math.round((seed % 20) + 60) },
        { name: 'Negative Reply', value: Math.round((seed % 10) + 30) },
      ];
    } else {
      // Default: agent_performance
      return [
        { name: 'Leads Contacted', value: Math.round((seed % 40) + 120) },
        { name: 'Connection Requests', value: Math.round((seed % 30) + 80) },
        { name: 'Accepted Requests', value: Math.round((seed % 20) + 45) },
        { name: 'Replies Received', value: Math.round((seed % 15) + 25) },
        { name: 'Meetings Scheduled', value: Math.round((seed % 8) + 8) },
      ];
    }
  }, [selectedAgent, activePreset]);

  const chartTitle = useMemo(() => {
    const suffix = 
      activePreset === 'outreach_funnel'
        ? 'Outreach Connections Ratio'
        : activePreset === 'template_sentiment'
        ? 'Message Template Sentiment'
        : 'Outreach Performance Funnel';
    return `${selectedAgentName}'s ${suffix}`;
  }, [selectedAgentName, activePreset]);

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

        {/* View Switcher Tabs (Admin Only) */}
        {isAdmin && (
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
            <Tab value="team" label="Team Progress" />
            <Tab value="individual" label="Individual Agent" />
          </Tabs>
        )}
      </Box>

      {/* Render Active View */}
      {activeTab === 'team' && isAdmin ? (
        <TeamProgressView />
      ) : (
        <Grid container spacing={3}>
          {/* Top Panel: Presets & Filters (Row Flex Format) */}
          <Grid item xs={12}>
            {/* Presets Cards */}
            <QuickAccessPresets activePreset={activePreset} onSelectPreset={handlePresetSelect} />
            
            {/* Unified Horizontal Filters Form */}
            <ReportBuilder
              reportType={reportType}
              onReportTypeChange={handleReportTypeChange}
              selectedAgentId={selectedAgentId}
              onAgentChange={setSelectedAgentId}
              onGenerated={(id) => setSelectedReport({ _id: id } as Report)}
            />
          </Grid>

          {/* Target Compliance Heatmap - Full Width in Vertical Layout */}
          <Grid item xs={12}>
            <TargetComplianceMatrix mode="individual" selectedAgentId={selectedAgent?._id} selectedAgentName={selectedAgentName} />
          </Grid>

          {/* Split Column Panel for Area Spline Chart & Reports Table */}
          <Grid item xs={12} md={7}>
            <ReportChartView data={chartData} title={chartTitle} />
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Typography variant="h6" fontWeight={600} color={tokens.brand.primary} gutterBottom>
              Recent Reports History
            </Typography>
            <ReportTable onSelect={setSelectedReport} />
          </Grid>
        </Grid>
      )}

      {/* Selected report export toolbar */}
      {selectedReport && (
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
          <Typography variant="subtitle2" color="text.secondary">
            Active Report Target ID: <strong>{selectedReport._id}</strong>
          </Typography>
          <ReportExportButton reportId={selectedReport._id} />
        </Box>
      )}
    </Box>
  );
};

export default ReportsPage;
export { ReportsPage };
