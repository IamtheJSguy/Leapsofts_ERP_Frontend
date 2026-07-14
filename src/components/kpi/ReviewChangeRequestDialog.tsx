import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  IconButton,
  useTheme,
  Avatar,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { useReviewKPIChangeRequest } from '@/hooks/api/useKPIChangeRequests';
import { useUIStore } from '@/store/useUIStore';
import { PriorityBadge } from '@/components/kpi/PriorityBadge';
import { tokens } from '@/styles/tokens';
import type { KPIChangeRequest, User } from '@/types';

interface Props {
  request: KPIChangeRequest | null;
  open: boolean;
  onClose: () => void;
}

const formatUser = (u: string | User | undefined) => {
  if (!u || typeof u === 'string') return 'User';
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;
};

const diffLine = (label: string, current?: string | number, requested?: string | number) => {
  if (requested === undefined || requested === current) return null;
  return (
    <Typography variant="body2" key={label}>
      <strong>{label}:</strong> {current ?? '—'} → {requested}
    </Typography>
  );
};

export const ReviewChangeRequestDialog = ({ request, open, onClose }: Props) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const addToast = useUIStore((s) => s.addToast);
  const reviewMutation = useReviewKPIChangeRequest();
  const [effectiveWhen, setEffectiveWhen] = useState<'immediate' | 'next_day'>('immediate');
  const [adminNote, setAdminNote] = useState('');

  const handleReview = async (approved: boolean) => {
    if (!request) return;
    try {
      await reviewMutation.mutateAsync({
        requestId: request._id,
        approved,
        effectiveWhen: approved ? effectiveWhen : undefined,
        adminNote: adminNote.trim() || undefined,
      });
      addToast({ message: approved ? 'Change request approved.' : 'Change request rejected.', severity: 'success' });
      onClose();
      setAdminNote('');
    } catch {
      addToast({ message: 'Failed to review change request.', severity: 'error' });
    }
  };

  if (!request) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth 
      PaperProps={{ 
        sx: { 
          borderRadius: '24px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : '#fff',
          backgroundImage: 'none',
          boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 25px 50px -12px rgba(0,0,0,0.1)',
          overflowX: 'hidden'
        } 
      }}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)' }
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pr: 5, pb: 2, pt: 3, display: 'flex', alignItems: 'center', color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em' }}>
        Review Change Request
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 16, top: 16, bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '8px !important', overflowX: 'hidden' }}>
        
        {/* Header Summary */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          <Chip label={request.sourceType === 'assignment' ? 'Assignment' : 'Standalone'} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20, bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', textTransform: 'uppercase' }} />
          <Chip label={request.type} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20, bgcolor: tokens.brand.primary100, color: tokens.brand.primary, textTransform: 'uppercase' }} />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: 'text.secondary' }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Requested By</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatUser(request.userId)}</Typography>
            </Box>
          </Box>

          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
            <Typography variant="caption" sx={{ color: tokens.brand.primary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 0.5 }}>
              Target: {request.kpiName ?? 'Unknown'}
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 2 }}>
              "{request.reason}"
            </Typography>
            
            <Divider sx={{ my: 1.5, opacity: 0.5 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {diffLine('Target', request.currentTargetValue, request.requestedTargetValue)}
              {diffLine('Timeframe', request.currentTimeFrame, request.requestedTimeFrame)}
              {(request.requestedPriority && request.requestedPriority !== request.currentPriority) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2"><strong>Priority:</strong></Typography>
                  <PriorityBadge priority={request.currentPriority} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>→</Typography>
                  <PriorityBadge priority={request.requestedPriority} />
                </Box>
              )}
              {request.proposedItem && (
                <Typography variant="body2" sx={{ bgcolor: 'rgba(45, 138, 94, 0.1)', p: 1, borderRadius: 1, color: tokens.semantic.success }}>
                  <strong>New item:</strong> {request.proposedItem.name} — target {request.proposedItem.targetValue} ({request.proposedItem.timeFrame})
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1 }}>
            Effective Date
          </Typography>
          <RadioGroup row value={effectiveWhen} onChange={(e) => setEffectiveWhen(e.target.value as 'immediate' | 'next_day')} sx={{ gap: 2 }}>
            <FormControlLabel 
              value="immediate" 
              control={<Radio size="small" sx={{ color: tokens.brand.primary, '&.Mui-checked': { color: tokens.brand.primary } }} />} 
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Immediately</Typography>} 
            />
            <FormControlLabel 
              value="next_day" 
              control={<Radio size="small" sx={{ color: tokens.brand.primary, '&.Mui-checked': { color: tokens.brand.primary } }} />} 
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Tomorrow</Typography>} 
            />
          </RadioGroup>
        </Box>

        <TextField 
          label="Admin Note (Optional)" 
          value={adminNote} 
          onChange={(e) => setAdminNote(e.target.value)} 
          fullWidth 
          multiline 
          rows={2} 
          placeholder="Add an internal note or reason for rejection..."
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)' },
              '&.Mui-focused': { bgcolor: 'transparent' }
            }
          }}
        />
      </DialogContent>
      
      <DialogActions sx={{ px: 4, pb: 4, pt: 1, gap: 1.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary, '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}>
          Cancel
        </Button>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={() => handleReview(false)} 
          disabled={reviewMutation.isPending} 
          sx={{ 
            textTransform: 'none', 
            borderRadius: '12px', 
            fontWeight: 700,
            px: 3,
            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' }
          }}
        >
          Reject
        </Button>
        <Button 
          variant="contained" 
          onClick={() => handleReview(true)} 
          disabled={reviewMutation.isPending} 
          sx={{ 
            textTransform: 'none', 
            borderRadius: '12px', 
            px: 3.5, 
            fontWeight: 800,
            bgcolor: tokens.brand.primary,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: tokens.brand.primary,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)'
            },
          }}
        >
          {reviewMutation.isPending ? 'Processing...' : 'Approve Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
