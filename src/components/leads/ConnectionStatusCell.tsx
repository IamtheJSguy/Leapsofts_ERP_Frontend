import { Select, MenuItem, FormControl } from '@mui/material';
import { useUpdateConnectionStatus } from '@/hooks/api/useConnections';
import { CONNECTION_STATUS_OPTIONS } from '@/lib/constants';
import type { ConnectionStatus } from '@/types';

interface ConnectionStatusCellProps {
  leadId: string;
  status?: ConnectionStatus;
}

export const ConnectionStatusCell = ({ leadId, status = 'not_sent' }: ConnectionStatusCellProps) => {
  const updateStatus = useUpdateConnectionStatus();

  return (
    <FormControl size="small" fullWidth onClick={(e) => e.stopPropagation()}>
      <Select
        value={status}
        onChange={(e) =>
          updateStatus.mutate({ leadId, status: e.target.value as ConnectionStatus })
        }
        disabled={updateStatus.isPending}
        aria-label="Connection status"
      >
        {CONNECTION_STATUS_OPTIONS.map((s) => (
          <MenuItem key={s} value={s}>
            {s.replace(/_/g, ' ')}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
