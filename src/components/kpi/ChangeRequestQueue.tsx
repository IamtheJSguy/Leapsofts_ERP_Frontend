import { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Paper,
  CircularProgress,
  useTheme,
  Avatar,
  Card,
  Grid,
} from '@mui/material';
import { usePendingKPIChangeRequests } from '@/hooks/api/useKPIChangeRequests';
import { tokens } from '@/styles/tokens';
import { ReviewChangeRequestDialog } from '@/components/kpi/ReviewChangeRequestDialog';
import type { KPIChangeRequest, User } from '@/types';

const formatUser = (u: string | User | undefined) => {
  if (!u || typeof u === 'string') return '—';
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;
};

const formatChange = (r: KPIChangeRequest) => {
  const parts: string[] = [];
  if (r.requestedTargetValue !== undefined && r.requestedTargetValue !== r.currentTargetValue) {
    parts.push(`${r.currentTargetValue ?? '?'} → ${r.requestedTargetValue}`);
  }
  if (r.requestedTimeFrame && r.requestedTimeFrame !== r.currentTimeFrame) {
    parts.push(`${r.currentTimeFrame} → ${r.requestedTimeFrame}`);
  }
  if (r.requestedPriority && r.requestedPriority !== r.currentPriority) {
    parts.push(`${r.currentPriority ?? 'medium'} → ${r.requestedPriority}`);
  }
  if (r.proposedItem) parts.push(`Add: ${r.proposedItem.name}`);
  if (r.type === 'remove') parts.push('Remove item');
  return parts.join('; ') || '—';
};

export const ChangeRequestQueue = () => {
  const { data: requests = [], isLoading } = usePendingKPIChangeRequests();
  const [selected, setSelected] = useState<KPIChangeRequest | null>(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (requests.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '24px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, boxShadow: 'none' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: tokens.text.secondary }}>No pending requests</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>All KPI change requests have been reviewed.</Typography>
      </Paper>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {requests.map((r) => {
          const userName = formatUser(r.userId);
          const initial = userName !== '—' ? userName.charAt(0).toUpperCase() : '?';
          return (
            <Card
              key={r._id}
              sx={{
                p: 2.5,
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 3,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  borderColor: tokens.brand.primaryLight,
                  boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(93, 26, 137, 0.05)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 220 }}>
                <Avatar sx={{ bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.1)', color: tokens.brand.primary, fontWeight: 800, width: 44, height: 44 }}>
                  {initial}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.95rem' }}>{userName}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                    <Chip 
                      label={r.sourceType === 'assignment' ? 'Assignment' : 'Standalone'} 
                      size="small" 
                      sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', textTransform: 'uppercase' }} 
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{r.kpiName ?? 'Unknown Target'}</Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: tokens.brand.primary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Requested Change ({r.type})
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)' }}>
                  {formatChange(r)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, fontStyle: 'italic', maxWidth: 400, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  "{r.reason}"
                </Typography>
              </Box>

              <Box sx={{ minWidth: 120, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setSelected(r)} 
                  sx={{ 
                    borderRadius: '16px', 
                    textTransform: 'none', 
                    fontWeight: 800, 
                    px: 3,
                    py: 1,
                    color: tokens.brand.primary,
                    borderColor: isDarkMode ? 'rgba(155, 107, 184, 0.3)' : 'rgba(93, 26, 137, 0.2)',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(155, 107, 184, 0.1)' : 'rgba(93, 26, 137, 0.05)',
                      borderColor: tokens.brand.primary,
                    }
                  }}
                >
                  Review
                </Button>
              </Box>
            </Card>
          );
        })}
      </Box>

      <ReviewChangeRequestDialog
        request={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
};
