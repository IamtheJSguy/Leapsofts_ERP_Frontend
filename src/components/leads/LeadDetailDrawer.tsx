import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import { useLeadHistory, useQualifyLead } from '@/hooks/api/useLeads';
import { useUIStore } from '@/store/useUIStore';
import { getLeadDisplayName, formatDateTime } from '@/utils/formatters';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Lead } from '@/types';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const LeadDetailDrawer = ({
  lead,
  open,
  onClose,
  onEdit,
  onDelete,
}: LeadDetailDrawerProps) => {
  const { data: history = [] } = useLeadHistory(lead?._id);
  const qualifyLeadMutation = useQualifyLead();
  const addToast = useUIStore((s) => s.addToast);

  if (!lead) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{getLeadDisplayName(lead)}</Typography>
          <IconButton onClick={onClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, my: 2 }}>
          <StatusBadge status={lead.connectionStatus || 'not_sent'} />
          <StatusBadge status={lead.messageStatus || 'not_sent'} type="message" />
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {lead.title} at {lead.company}
        </Typography>
        <Typography variant="body2"><strong>Email:</strong> {lead.email || 'N/A'}</Typography>
        <Typography variant="body2"><strong>Location:</strong> {lead.location || 'N/A'}</Typography>
        {lead.prospectName && <Typography variant="body2"><strong>Prospect Name:</strong> {lead.prospectName}</Typography>}
        {lead.profile && <Typography variant="body2"><strong>Profile:</strong> {lead.profile}</Typography>}
        {lead.icp && <Typography variant="body2"><strong>ICP:</strong> {lead.icp}</Typography>}
        {lead.leadStatus && <Typography variant="body2"><strong>Lead Status (Raw):</strong> {lead.leadStatus}</Typography>}
        {lead.date && <Typography variant="body2"><strong>Date:</strong> {lead.date}</Typography>}
        {lead.followUp && <Typography variant="body2"><strong>Follow Up:</strong> {lead.followUp}</Typography>}
        {lead.linkedinMsg && <Typography variant="body2"><strong>LinkedIn Msg (Raw):</strong> {lead.linkedinMsg}</Typography>}
        {lead.commentsAfterCall && <Typography variant="body2"><strong>Comments after call:</strong> {lead.commentsAfterCall}</Typography>}
        {lead.notes && <Typography variant="body2"><strong>Notes:</strong> {lead.notes}</Typography>}

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={onEdit}>Edit</Button>
          <Button variant="outlined" color="error" onClick={onDelete}>Delete</Button>
          {!lead.isQualified && (
            <Button
              variant="contained"
              startIcon={<StarIcon />}
              onClick={() => {
                qualifyLeadMutation.mutate(
                  { id: lead._id },
                  {
                    onSuccess: () => {
                      addToast({ message: 'Lead successfully qualified and moved to Kanban!', severity: 'success' });
                    },
                  }
                );
              }}
              disabled={qualifyLeadMutation.isPending}
              sx={{ bgcolor: '#FF5733', '&:hover': { bgcolor: '#E04A2A' } }}
            >
              Qualify
            </Button>
          )}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2">Version History</Typography>
        <List dense>
          {history.map((entry: { field: string; oldValue: unknown; newValue: unknown; changedAt: string }, i: number) => (
            <ListItem key={i}>
              <ListItemText
                primary={`${entry.field}: ${String(entry.oldValue)} → ${String(entry.newValue)}`}
                secondary={formatDateTime(entry.changedAt)}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};
