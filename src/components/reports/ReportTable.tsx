import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GridOnIcon from '@mui/icons-material/GridOn';
import { useReports, useExportReport } from '@/hooks/api/useReports';
import { formatDateTime } from '@/utils/formatters';
import { EmptyState } from '@/components/common/EmptyState';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import type { Report } from '@/types';

interface ReportTableProps {
  onSelect?: (report: Report) => void;
}

export const ReportTable = ({ onSelect }: ReportTableProps) => {
  const { data: reports = [], isLoading } = useReports();
  const exportReport = useExportReport();
  const addToast = useUIStore((s) => s.addToast);

  const handleDownload = (e: React.MouseEvent, reportId: string, format: 'pdf' | 'excel') => {
    e.stopPropagation(); // prevent row click selection
    exportReport.mutate(
      { id: reportId, format },
      {
        onSuccess: () => {
          addToast({ message: `Downloaded ${format.toUpperCase()} successfully`, severity: 'success' });
        },
        onError: (err) => {
          addToast({ message: `Download failed: ${err.message}`, severity: 'error' });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (reports.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: '20px',
          border: `1px solid ${tokens.surface.borderLight}`,
          backgroundColor: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <EmptyState title="No generated reports" description="Configure filters above and run a report to begin." />
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {reports.map((report) => {
        const isReady =
          report.status.toLowerCase() === 'ready' ||
          report.status.toLowerCase() === 'completed';

        return (
          <Box
            key={report._id}
            onClick={() => onSelect?.(report)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderRadius: '16px',
              border: `1px solid ${tokens.surface.borderLight}`,
              backgroundColor: '#FFFFFF',
              boxShadow: tokens.shadow.card,
              cursor: onSelect ? 'pointer' : 'default',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: tokens.shadow.cardHover,
                borderColor: tokens.brand.primaryLight,
              },
            }}
          >
            {/* Left Section: Document Icon & Details */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  backgroundColor: tokens.brand.primary50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DescriptionIcon sx={{ color: tokens.brand.primary }} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600} color={tokens.text.primary} sx={{ textTransform: 'capitalize' }}>
                  {report.type.replace(/_/g, ' ')} Report
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Generated on {formatDateTime(report.createdAt)}
                </Typography>
              </Box>
            </Box>

            {/* Right Section: Status Badge & Downloads */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label={report.status}
                size="small"
                sx={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  borderRadius: '8px',
                  backgroundColor:
                    report.status.toLowerCase() === 'ready' || report.status.toLowerCase() === 'completed'
                      ? tokens.semantic.successBg
                      : report.status.toLowerCase() === 'failed'
                      ? tokens.semantic.errorBg
                      : tokens.semantic.warningBg,
                  color:
                    report.status.toLowerCase() === 'ready' || report.status.toLowerCase() === 'completed'
                      ? tokens.semantic.success
                      : report.status.toLowerCase() === 'failed'
                      ? tokens.semantic.error
                      : tokens.semantic.warning,
                }}
              />

              {/* Action buttons if file is ready */}
              {isReady && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Export PDF" arrow>
                    <IconButton
                      onClick={(e) => handleDownload(e, report._id, 'pdf')}
                      size="small"
                      sx={{
                        border: `1px solid ${tokens.surface.border}`,
                        '&:hover': {
                          borderColor: tokens.brand.primary,
                          backgroundColor: tokens.brand.primary50,
                        },
                      }}
                    >
                      <PictureAsPdfIcon fontSize="small" sx={{ color: tokens.brand.primary }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export Excel" arrow>
                    <IconButton
                      onClick={(e) => handleDownload(e, report._id, 'excel')}
                      size="small"
                      sx={{
                        border: `1px solid ${tokens.surface.border}`,
                        '&:hover': {
                          borderColor: tokens.brand.primary,
                          backgroundColor: tokens.brand.primary50,
                        },
                      }}
                    >
                      <GridOnIcon fontSize="small" sx={{ color: tokens.brand.primary }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
