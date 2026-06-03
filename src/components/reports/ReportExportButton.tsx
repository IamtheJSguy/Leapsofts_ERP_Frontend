import { Button, Box } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useExportReport } from '@/hooks/api/useReports';

interface ReportExportButtonProps {
  reportId: string;
}

export const ReportExportButton = ({ reportId }: ReportExportButtonProps) => {
  const exportReport = useExportReport();

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => exportReport.mutate({ id: reportId, format: 'pdf' })}
        disabled={exportReport.isPending}
      >
        Export PDF
      </Button>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => exportReport.mutate({ id: reportId, format: 'excel' })}
        disabled={exportReport.isPending}
      >
        Export Excel
      </Button>
    </Box>
  );
};
