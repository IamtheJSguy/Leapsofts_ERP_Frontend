import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import { format } from 'date-fns';
import { tokens } from '@/styles/tokens';
import type { AppUsageSegment } from '@/types';
import { formatDurationSec } from '@/components/attendance/UsageBucketChart';

export type SessionTimelineMode = 'app' | 'url';

const clock = (iso: string) => format(new Date(iso), 'hh:mm:ss a');

export const UsageSessionTimeline = ({
  segments,
  isLoading,
  isDarkMode,
  mode,
  emptyLabel,
}: {
  segments: AppUsageSegment[] | undefined;
  isLoading: boolean;
  isDarkMode: boolean;
  mode: SessionTimelineMode;
  emptyLabel: string;
}) => {
  const rows = (segments ?? [])
    .filter((s) => (mode === 'url' ? Boolean(s.domain || s.url) : true))
    .slice()
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 4, textAlign: 'center' }}>
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>{mode === 'url' ? 'URL / domain' : 'App'}</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Started</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Ended</TableCell>
            <TableCell sx={{ fontWeight: 800 }} align="right">
              Time spent
            </TableCell>
            <TableCell sx={{ fontWeight: 800 }} align="right">
              Active
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row._id || row.clientId} hover>
              <TableCell sx={{ maxWidth: 360 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 750 }}>
                  {mode === 'url' ? row.domain || row.url || row.app : row.app}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block' }}>
                  {mode === 'url' ? row.url || row.title : row.title || row.execName}
                </Typography>
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 650 }}>{clock(row.startedAt)}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 650 }}>{clock(row.endedAt)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary }}>
                {formatDurationSec(row.durationSec)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: tokens.brand.primary }}>
                {formatDurationSec(row.activeSec)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
