import { Select, MenuItem, FormControl } from '@mui/material';
import { useUpdateLead } from '@/hooks/api/useLeads';
import { MESSAGE_STATUS_OPTIONS } from '@/lib/constants';
import type { MessageStatus } from '@/types';

interface MessageStatusCellProps {
  leadId: string;
  status?: MessageStatus;
}

export const MessageStatusCell = ({ leadId, status = 'not_sent' }: MessageStatusCellProps) => {
  const updateLead = useUpdateLead();

  return (
    <FormControl size="small" fullWidth onClick={(e) => e.stopPropagation()}>
      <Select
        value={status}
        onChange={(e) =>
          updateLead.mutate({ id: leadId, data: { messageStatus: e.target.value as MessageStatus } })
        }
        disabled={updateLead.isPending}
        aria-label="Message status"
      >
        {MESSAGE_STATUS_OPTIONS.map((s) => (
          <MenuItem key={s} value={s}>
            {s.replace(/_/g, ' ')}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
