import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Box,
} from '@mui/material';
import { useReports } from '@/hooks/api/useReports';
import { formatDateTime } from '@/utils/formatters';
import { EmptyState } from '@/components/common/EmptyState';
import type { Report } from '@/types';

interface ReportTableProps {
  onSelect?: (report: Report) => void;
}

export const ReportTable = ({ onSelect }: ReportTableProps) => {
  const { data: reports = [], isLoading } = useReports();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (reports.length === 0) {
    return <EmptyState title="No reports" description="Generate a report to get started." />;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Type</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Created</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {reports.map((report) => (
          <TableRow
            key={report._id}
            hover
            sx={{ cursor: onSelect ? 'pointer' : 'default' }}
            onClick={() => onSelect?.(report)}
          >
            <TableCell>{report.type}</TableCell>
            <TableCell>
              <Chip label={report.status} size="small" color={report.status === 'ready' ? 'success' : 'default'} />
            </TableCell>
            <TableCell>{formatDateTime(report.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
