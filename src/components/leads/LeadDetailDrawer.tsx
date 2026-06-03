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
import { useLeadHistory } from '@/hooks/api/useLeads';
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
        <Typography variant="body2">{lead.email}</Typography>
        <Typography variant="body2">{lead.location}</Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={onEdit}>Edit</Button>
          <Button variant="outlined" color="error" onClick={onDelete}>Delete</Button>
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
