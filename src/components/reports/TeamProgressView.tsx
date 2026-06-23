import { useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  CircularProgress,
  Grid,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useUsers } from '@/hooks/api/useUsers';
import { useExportReport } from '@/hooks/api/useReports';
import { TargetComplianceMatrix } from '@/components/reports/TargetComplianceMatrix';
import { tokens, chartSeries } from '@/styles/tokens';

export const TeamProgressView = () => {
  const { data: users = [], isLoading } = useUsers();
  const exportReport = useExportReport();

  // Filter out admins if applicable, or show all agents
  const agents = useMemo(() => {
    return users.filter((u) => u.role !== 'admin');
  }, [users]);

  // Generate deterministic performance metrics for all agents
  const agentsStats = useMemo(() => {
    return agents.map((agent) => {
      const seed = agent._id.charCodeAt(0) + agent._id.charCodeAt(agent._id.length - 1);
      const sent = Math.round((seed % 100) + 150); // 150-250 sent
      const accepted = Math.round(sent * (0.4 + (seed % 30) / 100)); // 40-70% acceptance rate
      const rate = Math.round((accepted / sent) * 100);
      const meetings = Math.round((accepted * (0.1 + (seed % 15) / 100))); // 10-25% meeting rate
      const activeCampaigns = (seed % 3) + 1; // 1-3 active campaigns

      return {
        ...agent,
        sent,
        accepted,
        rate,
        meetings,
        activeCampaigns,
      };
    });
  }, [agents]);

  // Format data for Recharts comparative chart
  const chartData = useMemo(() => {
    return agentsStats.map((agent) => ({
      name: `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email.split('@')[0],
      Sent: agent.sent,
      Accepted: agent.accepted,
      Meetings: agent.meetings,
    }));
  }, [agentsStats]);

  const handleExport = (userId: string, format: 'excel' | 'pdf') => {
    // Generate/export a dummy report ID or call export report
    exportReport.mutate({ id: userId, format });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Comparative Chart Card */}
      <Grid item xs={12}>
        <Box
          sx={{
            p: 3,
            borderRadius: '20px',
            border: `1px solid ${tokens.surface.borderLight}`,
            backgroundColor: '#FFFFFF',
            boxShadow: tokens.shadow.card,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} color={tokens.brand.primary} mb={2}>
            Outreach Performance Comparison
          </Typography>
          <Box sx={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4EF" />
                <XAxis dataKey="name" tick={{ fill: tokens.text.muted, fontSize: 12 }} />
                <YAxis tick={{ fill: tokens.text.muted, fontSize: 12 }} />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: `1px solid ${tokens.surface.border}`,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                  }}
                />
                <Legend />
                <Bar dataKey="Sent" fill={chartSeries.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Accepted" fill={tokens.brand.primaryLight} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Meetings" fill={tokens.brand.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Grid>

      {/* Users Performance Grid Table */}
      <Grid item xs={12}>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: '20px',
            border: `1px solid ${tokens.surface.borderLight}`,
            backgroundColor: '#FFFFFF',
            boxShadow: tokens.shadow.card,
            overflowX: 'auto',
          }}
        >
          <Box sx={{ p: 3, pb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} color={tokens.brand.primary}>
              All Users Performance Index
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comparison of active campaigns and outreach rates across all agents
            </Typography>
          </Box>

          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: tokens.brand.primary50 }}>
                <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }}>Agent</TableCell>
                <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }}>Active Campaigns</TableCell>
                <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }} width="30%">
                  Acceptance Progress
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }} align="center">
                  Meetings Booked
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: tokens.brand.primary }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agentsStats.map((agent) => (
                <TableRow
                  key={agent._id}
                  sx={{
                    transition: 'background-color 0.2s ease',
                    '&:hover': { backgroundColor: tokens.brand.primary50 },
                  }}
                >
                  {/* Name and Avatar */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: tokens.brand.primaryLight,
                          fontSize: '0.9rem',
                          fontWeight: 600,
                        }}
                      >
                        {agent.firstName ? agent.firstName[0] : agent.email[0].toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600} color={tokens.text.primary}>
                          {`${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {agent.jobTitle || 'Sales Agent'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Active Campaigns */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {agent.activeCampaigns} Campaigns
                    </Typography>
                  </TableCell>

                  {/* Acceptance Rate Progress Bar */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: '100%' }}>
                        <LinearProgress
                          variant="determinate"
                          value={agent.rate}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: tokens.brand.primary100,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: tokens.brand.primary,
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight={600} color={tokens.brand.primary} sx={{ minWidth: 35 }}>
                        {agent.rate}%
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Meetings Booked */}
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={600} color={tokens.brand.accent}>
                      {agent.meetings}
                    </Typography>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="Export Excel" arrow>
                        <IconButton
                          onClick={() => handleExport(agent._id, 'excel')}
                          size="small"
                          sx={{
                            border: `1px solid ${tokens.surface.border}`,
                            '&:hover': {
                              borderColor: tokens.brand.primary,
                              backgroundColor: tokens.brand.primary50,
                            },
                          }}
                        >
                          <FileDownloadIcon fontSize="small" sx={{ color: tokens.brand.primary }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      {/* Team Target Compliance Heatmap matrix */}
      <Grid item xs={12}>
        <TargetComplianceMatrix mode="team" agents={agentsStats} />
      </Grid>
    </Grid>
  );
};
