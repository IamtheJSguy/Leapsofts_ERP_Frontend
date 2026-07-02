import { Button, Box } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useExportReport } from '@/hooks/api/useReports';

interface ReportExportButtonProps {
  reportId: string;
}

export const ReportExportButton = ({ reportId }: ReportExportButtonProps) => {
  const exportReport = useExportReport();

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%' }}>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => exportReport.mutate({ id: reportId, format: 'pdf' })}
        disabled={exportReport.isPending}
        sx={{ flexGrow: 1, borderRadius: '12px', textTransform: 'none', fontWeight: 650 }}
      >
        Export PDF
      </Button>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => exportReport.mutate({ id: reportId, format: 'excel' })}
        disabled={exportReport.isPending}
        sx={{ flexGrow: 1, borderRadius: '12px', textTransform: 'none', fontWeight: 650 }}
      >
        Export Excel
      </Button>
    </Box>
  );
};
