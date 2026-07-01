import { Box, Typography, Chip, useTheme } from '@mui/material';
import { useMyKPIChangeRequests } from '@/hooks/api/useKPIChangeRequests';
import type { KPIChangeRequest } from '@/types';
import { tokens } from '@/styles/tokens';
import RuleIcon from '@mui/icons-material/Rule';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface Props {
  assignmentId?: string;
  limit?: number;
}

export const MyChangeRequestsPanel = ({ assignmentId, limit = 50 }: Props) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { data: requests = [] } = useMyKPIChangeRequests();

  const filtered = (assignmentId
    ? requests.filter((r) => r.assignmentId === assignmentId)
    : requests
  ).slice(0, limit);

  if (filtered.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: 'center', borderRadius: '24px', border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, py: 8 }}>
        <RuleIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.disabled' }}>No Change Requests</Typography>
      </Box>
    );
  }

  const getStatusStyles = (s: KPIChangeRequest['status']) => {
    if (s === 'approved') return { color: tokens.semantic.success, bgcolor: isDarkMode ? 'rgba(45, 138, 94, 0.15)' : 'rgba(45, 138, 94, 0.08)', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> };
    if (s === 'rejected') return { color: tokens.semantic.error, bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)', icon: <CancelIcon sx={{ fontSize: 16 }} /> };
    return { color: tokens.brand.accent, bgcolor: isDarkMode ? 'rgba(255, 127, 17, 0.15)' : 'rgba(255, 127, 17, 0.08)', icon: <PendingActionsIcon sx={{ fontSize: 16 }} /> };
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {filtered.map((r) => {
        const statusStyle = getStatusStyles(r.status);
        return (
          <Box 
            key={r._id} 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              gap: 2,
              p: 3, 
              borderRadius: '20px',
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isDarkMode ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.04)',
                borderColor: statusStyle.color
              }
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, mb: 0.5 }}>
                {r.kpiName ?? r.type.toUpperCase()}
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : tokens.text.secondary, fontWeight: 500 }}>
                {r.reason}
              </Typography>
            </Box>
            
            <Chip 
              icon={statusStyle.icon}
              label={r.status} 
              size="small" 
              sx={{ 
                bgcolor: statusStyle.bgcolor,
                color: statusStyle.color,
                fontWeight: 800,
                px: 1,
                py: 2.25,
                borderRadius: '12px',
                textTransform: 'capitalize',
                '& .MuiChip-icon': { color: 'inherit', ml: 1 }
              }} 
            />
          </Box>
        );
      })}
    </Box>
  );
};
